import { NextResponse } from 'next/server'

export async function GET() {
  const botToken = process.env.TELEGRAM_BOT_TOKEN
  const chatId = process.env.TELEGRAM_CHAT_ID

  if (!botToken) return NextResponse.json({ error: 'TELEGRAM_BOT_TOKEN not set in .env.local' }, { status: 400 })
  if (!chatId) return NextResponse.json({ error: 'TELEGRAM_CHAT_ID not set in .env.local' }, { status: 400 })

  const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text: '✅ Bakkah workshop — Telegram test message. Notifications are working!',
    }),
  })

  const data = await res.json()
  if (!data.ok) return NextResponse.json({ error: 'Telegram API error', detail: data }, { status: 500 })
  return NextResponse.json({ success: true, message: 'Telegram message sent!' })
}
