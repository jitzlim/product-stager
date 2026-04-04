import { GoogleGenAI } from '@google/genai'
import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    const { productImageBase64, mimeType, prompt } = await request.json()

    if (!productImageBase64 || !mimeType || !prompt) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
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
    console.error('Generation error:', err)
    return NextResponse.json({ error: err.message ?? 'Generation failed' }, { status: 500 })
  }
}
