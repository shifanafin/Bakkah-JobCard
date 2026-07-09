import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/server-session'
import { createServiceClient } from '@/lib/supabase/service'

type Params = { params: Promise<{ id: string }> }

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// PATCH /api/enquiries/[id]   body: { action: 'read' | 'dismiss' }
export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await getServerSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  if (!UUID_RE.test(id)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 })
  const body = await req.json()
  const { action } = body

  if (action !== 'read' && action !== 'dismiss') {
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  }

  const sb = createServiceClient()
  const { error } = await sb
    .from('chat_notifications')
    .update({ is_read: true })
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

// POST /api/enquiries/[id]  — convert enquiry to job card
export async function POST(_req: NextRequest, { params }: Params) {
  const session = await getServerSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  if (!UUID_RE.test(id)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 })
  const sb = createServiceClient()

  // Fetch the enquiry
  const { data: enquiry, error: eqErr } = await sb
    .from('chat_notifications')
    .select('*')
    .eq('id', id)
    .single()

  if (eqErr || !enquiry) return NextResponse.json({ error: 'Enquiry not found' }, { status: 404 })

  // Guard against double-conversion
  if (enquiry.job_card_id) {
    return NextResponse.json(
      { error: 'Already converted', job_card_id: enquiry.job_card_id },
      { status: 409 },
    )
  }

  const today = new Date().toISOString().split('T')[0]

  // Upsert customer — track whether they're new to apply promotions
  let customerId: string
  let isNewCustomer = false
  const { data: ec } = await sb
    .from('customers')
    .select('id')
    .eq('phone', enquiry.phone)
    .maybeSingle()

  if (ec) {
    customerId = ec.id
    await sb.from('customers').update({ name: enquiry.name }).eq('id', customerId)
  } else {
    isNewCustomer = true
    const { data: nc, error: ncErr } = await sb
      .from('customers')
      .insert({ name: enquiry.name, phone: enquiry.phone, is_fleet: false })
      .select('id')
      .single()
    if (ncErr || !nc) {
      return NextResponse.json({ error: `Customer save failed: ${ncErr?.message}` }, { status: 500 })
    }
    customerId = nc.id
  }

  // Fetch active promotion if this is a new customer
  let appliedPromo: {
    code: string; name: string; discount_pct: number; free_service: string | null
  } | null = null
  if (isNewCustomer) {
    const { data: promo } = await sb
      .from('promotions')
      .select('code, name, discount_pct, free_service')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    if (promo) appliedPromo = promo
  }

  // Upsert vehicle (only if plate was provided)
  let vehicleId: string | null = null
  if (enquiry.vehicle_plate) {
    const { data: ev } = await sb
      .from('vehicles')
      .select('id')
      .eq('plate_number', enquiry.vehicle_plate)
      .maybeSingle()

    if (ev) {
      vehicleId = ev.id
    } else {
      const { data: nv } = await sb
        .from('vehicles')
        .insert({
          customer_id: customerId,
          plate_number: enquiry.vehicle_plate,
          make: enquiry.vehicle_make || 'Unknown',
          model: enquiry.vehicle_model || 'Unknown',
        })
        .select('id')
        .single()
      if (nv) vehicleId = nv.id
    }
  }

  const promoFields = appliedPromo
    ? {
        promotion_code: appliedPromo.code,
        promotion_discount_pct: appliedPromo.discount_pct,
        internal_notes: `🎉 PROMOTION (${appliedPromo.code}): ${appliedPromo.discount_pct}% off${appliedPromo.free_service ? ` + ${appliedPromo.free_service}` : ''}. Apply percentage discount on confirmed subtotal before issuing invoice.`,
      }
    : {}

  // Create job card — requires source column migration:
  // ALTER TABLE job_cards ADD COLUMN IF NOT EXISTS source text DEFAULT 'application';
  const { data: jc, error: jcErr } = await sb
    .from('job_cards')
    .insert({
      customer_id: customerId,
      vehicle_id: vehicleId,
      job_type: enquiry.service_type,
      date_in: today,
      status: 'inspection',
      customer_complaint: enquiry.remarks || enquiry.service_type,
      source: 'website_chat',
      ...promoFields,
    })
    .select('id, job_number')
    .single()

  if (jcErr) {
    return NextResponse.json({ error: `Job card creation failed: ${jcErr.message}` }, { status: 500 })
  }

  // Add complimentary free service if promo has one
  if (appliedPromo?.free_service) {
    await sb.from('job_card_services').insert({
      job_card_id: jc.id,
      description: `🎁 ${appliedPromo.free_service} (${appliedPromo.name} — Complimentary)`,
      quantity: 1,
      unit_price: 0,
      completed: false,
    })
  }

  // Add audit trail
  await sb.from('job_card_history').insert({
    job_card_id: jc.id,
    new_status: 'inspection',
    notes: appliedPromo
      ? `Created from website enquiry by ${session.user.name} — Promotion (${appliedPromo.code}) applied`
      : `Created from website enquiry by ${session.user.name}`,
  })

  // Link the enquiry to the new job card and mark it read
  await sb
    .from('chat_notifications')
    .update({ job_card_id: jc.id, job_number: jc.job_number, is_read: true })
    .eq('id', id)

  return NextResponse.json(
    { success: true, job_card_id: jc.id, job_number: jc.job_number },
    { status: 201 },
  )
}

// DELETE /api/enquiries/[id]
export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await getServerSession()
  const role = (session?.user as { role?: string } | undefined)?.role
  if (!session || (role !== 'admin' && role !== 'supervisor')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const { id } = await params
  if (!UUID_RE.test(id)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 })
  const sb = createServiceClient()

  const { data: enquiry } = await sb.from('chat_notifications').select('job_card_id').eq('id', id).single()
  if (!enquiry) return NextResponse.json({ error: 'Enquiry not found' }, { status: 404 })
  if (enquiry.job_card_id) {
    return NextResponse.json({ error: 'Cannot delete an enquiry already converted to a job card' }, { status: 409 })
  }

  const { error } = await sb.from('chat_notifications').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
