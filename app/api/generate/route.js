import { GoogleGenAI } from '@google/genai'
import { NextResponse } from 'next/server'

// In-memory rate limiter: 15 requests per IP per minute
const rateLimitMap = new Map()
function isRateLimited(ip) {
  const now = Date.now()
  const windowMs = 60_000
  const max = 15
  const entry = rateLimitMap.get(ip) ?? { count: 0, start: now }
  if (now - entry.start > windowMs) {
    rateLimitMap.set(ip, { count: 1, start: now })
    return false
  }
  if (entry.count >= max) return true
  entry.count++
  rateLimitMap.set(ip, entry)
  return false
}

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

  // Guard: rate limit per IP
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? 'unknown'
  if (isRateLimited(ip)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  // Guard: block requests that aren't from the same origin in production
  const origin = request.headers.get('origin')
  const host   = request.headers.get('host')
  if (process.env.NODE_ENV === 'production' && origin) {
    try {
      const originHostname = new URL(origin).hostname
      const hostHostname   = new URL(`https://${host}`).hostname
      if (originHostname !== hostHostname) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    } catch {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
  }

  const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

  try {
    const body = await request.json()
    const { productImageBase64, mimeType, prompt } = body

    if (!productImageBase64 || !mimeType || !prompt) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
      return NextResponse.json({ error: 'Invalid image format' }, { status: 400 })
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
          aspectRatio: '9:16',
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
