import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'

function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, '')
  if (digits.startsWith('971')) return digits
  if (digits.startsWith('0') && digits.length === 10) return `971${digits.slice(1)}`
  if (digits.length === 9) return `971${digits}`
  return digits
}

// POST /api/approve-job
// Body: { job_id, phone, plate?, action?: "approve"|"decline", reason? }
// plate is optional — if omitted, only phone is verified
export async function POST(request: NextRequest) {
  let body: { job_id?: string; phone?: string; plate?: string; action?: string; reason?: string }
  try { body = await request.json() } catch { return NextResponse.json({ error: 'Invalid request' }, { status: 400 }) }

  const { job_id, phone, plate, action = 'approve', reason } = body
  if (!job_id || !phone) {
    return NextResponse.json({ error: 'job_id and phone are required' }, { status: 400 })
  }

  const sb = createServiceClient()

  // Load the job
  const { data: job, error: jobErr } = await sb
    .from('job_cards')
    .select('id, status, technician_id, vehicle_id, customer_id')
    .eq('id', job_id)
    .single()

  if (jobErr || !job) return NextResponse.json({ error: 'Job not found' }, { status: 404 })
  if (job.status !== 'waiting_for_approval') {
    return NextResponse.json({ error: 'Job is not waiting for approval' }, { status: 400 })
  }

  // Verify customer phone
  const { data: customer } = await sb
    .from('customers')
    .select('phone')
    .eq('id', job.customer_id)
    .maybeSingle()

  if (!customer) return NextResponse.json({ error: 'Customer not found' }, { status: 404 })

  const storedPhone = normalizePhone(customer.phone)
  const inputPhone = normalizePhone(phone)
  if (!storedPhone.endsWith(inputPhone.slice(-9))) {
    return NextResponse.json({ error: 'Phone number does not match our records' }, { status: 403 })
  }

  // Verify plate if provided
  if (plate) {
    const normalizedPlate = plate.toUpperCase().replace(/\s+/g, '')
    const { data: vehicleByPlate } = await sb
      .from('vehicles')
      .select('id')
      .ilike('plate_number', normalizedPlate)
      .eq('id', job.vehicle_id)
      .maybeSingle()

    if (!vehicleByPlate) {
      return NextResponse.json({ error: 'Plate number does not match this job' }, { status: 403 })
    }
  }

  // ── Decline ──────────────────────────────────────────────────
  if (action === 'decline') {
    const declineNote = reason?.trim()
      ? `Declined by customer: ${reason.trim()}`
      : 'Declined by customer'

    const { error: updateErr } = await sb
      .from('job_cards')
      .update({ status: 'cancelled', updated_at: new Date().toISOString() })
      .eq('id', job_id)

    if (updateErr) return NextResponse.json({ error: 'Failed to decline job' }, { status: 500 })

    await sb.from('job_card_history').insert({
      job_card_id: job_id,
      old_status: 'waiting_for_approval',
      new_status: 'cancelled',
      changed_by: 'Customer (via Track)',
      notes: declineNote,
    })

    return NextResponse.json({ success: true, new_status: 'cancelled' })
  }

  // ── Approve ──────────────────────────────────────────────────
  const newStatus = job.technician_id ? 'assigned' : 'pending'
  const { error: updateErr } = await sb
    .from('job_cards')
    .update({ status: newStatus, updated_at: new Date().toISOString() })
    .eq('id', job_id)

  if (updateErr) return NextResponse.json({ error: 'Failed to approve job' }, { status: 500 })

  await sb.from('job_card_history').insert({
    job_card_id: job_id,
    old_status: 'waiting_for_approval',
    new_status: newStatus,
    changed_by: 'Customer (via Track)',
    notes: 'Job approved by customer',
  })

  return NextResponse.json({ success: true, new_status: newStatus })
}
