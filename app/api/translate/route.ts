import { NextRequest, NextResponse } from 'next/server'

const API_KEY = process.env.GOOGLE_TRANSLATE_API_KEY

export async function POST(req: NextRequest) {
  if (!API_KEY) {
    return NextResponse.json({ error: 'GOOGLE_TRANSLATE_API_KEY not set in .env.local' }, { status: 503 })
  }

  const { texts, target } = await req.json() as { texts: string[]; target: string }

  if (!Array.isArray(texts) || !target || texts.length === 0) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const res = await fetch(
    `https://translation.googleapis.com/language/translate/v2?key=${API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ q: texts, target, source: 'en', format: 'text' }),
    }
  )

  const data = await res.json()

  if (!res.ok) {
    return NextResponse.json(
      { error: data?.error?.message ?? 'Translation API error' },
      { status: res.status }
    )
  }

  const translations: string[] = data.data.translations.map(
    (t: { translatedText: string }) => t.translatedText
  )

  return NextResponse.json({ translations })
}
