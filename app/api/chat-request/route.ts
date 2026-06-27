import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { sendChatRequestNotificationEmail } from '@/lib/email'

function normalizePhone(raw: string): string {
  const d = raw.replace(/\D/g, '')
  if (!d) return raw
  if (d.startsWith('971') && d.length === 12) return `+${d}`
  if (d.startsWith('0') && d.length === 10) return `+971${d.slice(1)}`
  if (d.length === 9 && /^[2-9]/.test(d)) return `+971${d}`
  return raw.startsWith('+') ? raw : `+${d}`
}

async function sendTelegramNotification(message: string) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN
  const chatId = process.env.TELEGRAM_CHAT_ID
  if (!botToken || !chatId) return
  await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text: message, parse_mode: 'Markdown' }),
  }).catch(() => {})
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, phone, plate, make, model, service_type, remarks } = body

    if (!name?.trim() || !phone?.trim() || !service_type?.trim()) {
      return NextResponse.json({ error: 'Name, phone and service type are required' }, { status: 400 })
    }

    // Prevent absurdly long inputs
    if (
      name.trim().length > 100 ||
      phone.trim().length > 25 ||
      service_type.trim().length > 200 ||
      (remarks && remarks.trim().length > 1000)
    ) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
    }

    const sb = createServiceClient()
    const normalizedPhone = normalizePhone(phone.trim())

    // Rate limit: max 3 enquiries per phone per 24 h
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    const { count: recentCount } = await sb
      .from('chat_notifications')
      .select('*', { count: 'exact', head: true })
      .eq('phone', normalizedPhone)
      .gte('created_at', since)

    if ((recentCount ?? 0) >= 3) {
      return NextResponse.json(
        { error: 'Too many requests. Please contact us directly.' },
        { status: 429 },
      )
    }

    // Save enquiry — no job card created here; staff reviews and converts manually
    const { error: insertErr } = await sb.from('chat_notifications').insert({
      name: name.trim(),
      phone: normalizedPhone,
      vehicle_plate: plate?.trim().toUpperCase() || null,
      vehicle_make: make?.trim() || null,
      vehicle_model: model?.trim() || null,
      service_type: service_type.trim(),
      remarks: remarks?.trim() || null,
    })

    if (insertErr) throw new Error(`Enquiry save failed: ${insertErr.message}`)

    // Notify workshop via Telegram
    const vehicleInfo = plate?.trim()
      ? `${plate.trim().toUpperCase()}${make?.trim() ? ` (${make.trim()} ${model?.trim() || ''})` : ''}`
      : 'Not provided'
    const msg =
      `📩 *New Website Enquiry!*\n` +
      `Name: ${name.trim()}\n` +
      `Phone: ${normalizedPhone}\n` +
      `Vehicle: ${vehicleInfo}\n` +
      `Service: ${service_type.trim()}\n` +
      `Remarks: ${remarks?.trim() || '—'}\n\n` +
      `_Review at: /workshop/enquiries_`
    await sendTelegramNotification(msg)

    sendChatRequestNotificationEmail({
      name: name.trim(),
      phone: normalizedPhone,
      plate: plate?.trim().toUpperCase() || null,
      make: make?.trim() || null,
      model: model?.trim() || null,
      service_type: service_type.trim(),
      remarks: remarks?.trim() || null,
    }).catch(() => {})

    return NextResponse.json({ success: true }, { status: 201 })
  } catch (err) {
    console.error('[chat-request]', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Request failed' },
      { status: 500 },
    )
  }
}
