import { GoogleGenAI } from '@google/genai'
import { NextResponse } from 'next/server'

// Scrub anything that looks like an API key from error messages before sending to client
function safeErrorMessage(err) {
  const msg = err?.message ?? 'Generation failed'
  return msg.replace(/AIza[0-9A-Za-z-_]{35}/g, '[REDACTED]')
            .replace(/key[=: ]["']?[A-Za-z0-9_-]{20,}/gi, 'key=[REDACTED]')
}

export async function POST(request) {
  // Guard: API key must be configured
  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json({ error: 'Service not configured' }, { status: 503 })
  }

  // Guard: block requests that aren't from the same origin in production
  const origin = request.headers.get('origin')
  const host   = request.headers.get('host')
  if (
    process.env.NODE_ENV === 'production' &&
    origin &&
    !origin.includes(host ?? '')
  ) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const body = await request.json()
    const { productImageBase64, mimeType, prompt, aspectRatio } = body

    if (!productImageBase64 || !mimeType || !prompt) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Limit image size to 10MB base64 (~7.5MB actual) to prevent abuse
    if (productImageBase64.length > 10_000_000) {
      return NextResponse.json({ error: 'Image too large' }, { status: 413 })
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: [
        {
          parts: [
            { text: prompt },
            { inlineData: { mimeType, data: productImageBase64 } },
          ],
        },
      ],
      config: {
        responseModalities: ['TEXT', 'IMAGE'],
        imageConfig: {
          aspectRatio: aspectRatio || '9:16',
        },
      },
    })

    const parts = response?.candidates?.[0]?.content?.parts ?? []

    for (const part of parts) {
      if (part.inlineData?.data) {
        return NextResponse.json({
          imageBase64: part.inlineData.data,
          mimeType: part.inlineData.mimeType ?? 'image/jpeg',
        })
      }
    }

    return NextResponse.json({ error: 'No image returned from model' }, { status: 500 })
  } catch (err) {
    // Log full error server-side only — never expose raw SDK messages to client
    console.error('Generation error:', err)
    return NextResponse.json({ error: safeErrorMessage(err) }, { status: 500 })
  }
}
