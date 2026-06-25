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

    const sb = createServiceClient()
    const normalizedPhone = normalizePhone(phone.trim())
    const today = new Date().toISOString().split('T')[0]

    // Upsert customer
    let customerId: string
    const { data: ec, error: ecErr } = await sb.from('customers').select('id').eq('phone', normalizedPhone).maybeSingle()
    if (ecErr) throw new Error(`Customer lookup failed: ${ecErr.message}`)

    if (ec) {
      customerId = ec.id
      await sb.from('customers').update({ name: name.trim() }).eq('id', customerId)
    } else {
      const { data: nc, error } = await sb.from('customers').insert({
        name: name.trim(),
        phone: normalizedPhone,
        is_fleet: false,
      }).select('id').single()
      if (error) throw new Error(`Customer save failed: ${error.message}`)
      customerId = nc.id
    }

    // Upsert vehicle (only if plate provided)
    let vehicleId: string | null = null
    if (plate?.trim()) {
      const plateUpper = plate.trim().toUpperCase()
      const { data: ev } = await sb.from('vehicles').select('id').eq('plate_number', plateUpper).maybeSingle()
      if (ev) {
        vehicleId = ev.id
        if (make?.trim() || model?.trim()) {
          await sb.from('vehicles').update({
            ...(make?.trim() ? { make: make.trim() } : {}),
            ...(model?.trim() ? { model: model.trim() } : {}),
          }).eq('id', vehicleId)
        }
      } else {
        const { data: nv, error } = await sb.from('vehicles').insert({
          customer_id: customerId,
          plate_number: plateUpper,
          make: make?.trim() || 'Unknown',
          model: model?.trim() || 'Unknown',
        }).select('id').single()
        if (!error && nv) vehicleId = nv.id
      }
    }

    // Create job card
    const { data: jc, error: jcErr } = await sb.from('job_cards').insert({
      customer_id: customerId,
      vehicle_id: vehicleId,
      job_type: service_type,
      date_in: today,
      status: 'inspection',
      customer_complaint: remarks?.trim() || service_type,
      source: 'website_chat',
    }).select('id, job_number').single()

    if (jcErr) throw new Error(`Job card creation failed: ${jcErr.message}`)

    // Log history
    await sb.from('job_card_history').insert({
      job_card_id: jc.id,
      new_status: 'inspection',
      notes: 'Created via website chat request',
    })

    // Store in-app notification
    await sb.from('chat_notifications').insert({
      name: name.trim(),
      phone: normalizedPhone,
      vehicle_plate: plate?.trim().toUpperCase() || null,
      vehicle_make: make?.trim() || null,
      vehicle_model: model?.trim() || null,
      service_type,
      remarks: remarks?.trim() || null,
      job_number: jc.job_number,
      job_card_id: jc.id,
    })

    // Telegram notification to workshop owner
    const vehicleInfo = plate?.trim()
      ? `${plate.trim().toUpperCase()}${make?.trim() ? ` (${make.trim()} ${model?.trim() || ''})` : ''}`
      : 'Not provided'
    const msg =
      `🚗 *New Website Request!*\n` +
      `Job: *${jc.job_number}*\n` +
      `Name: ${name.trim()}\n` +
      `Phone: ${normalizedPhone}\n` +
      `Vehicle: ${vehicleInfo}\n` +
      `Service: ${service_type}\n` +
      `Remarks: ${remarks?.trim() || '—'}`
    await sendTelegramNotification(msg)

    // Email notification to workshop owner (non-blocking)
    sendChatRequestNotificationEmail({
      name: name.trim(),
      phone: normalizedPhone,
      plate: plate?.trim().toUpperCase() || null,
      make: make?.trim() || null,
      model: model?.trim() || null,
      service_type,
      remarks: remarks?.trim() || null,
      job_number: jc.job_number,
      job_card_id: jc.id,
    }).catch(() => {})

    return NextResponse.json({ success: true, job_number: jc.job_number }, { status: 201 })
  } catch (err) {
    console.error('[chat-request]', err)
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Request failed' }, { status: 500 })
  }
}
