import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'

type Params = { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params
  const sb = createServiceClient()

  const [custRes, vehRes, jobRes] = await Promise.all([
    sb.from('customers').select('*').eq('id', id).single(),
    sb.from('vehicles').select('*').eq('customer_id', id).order('created_at', { ascending: false }),
    sb.from('job_cards')
      .select('id, job_number, status, job_type, date_in, date_out, total, payment_status, vehicle:vehicles(plate_number, make, model)')
      .eq('customer_id', id)
      .order('created_at', { ascending: false })
      .limit(50),
  ])

  if (custRes.error || !custRes.data)
    return NextResponse.json({ error: 'Customer not found' }, { status: 404 })

  return NextResponse.json({
    customer: custRes.data,
    vehicles: vehRes.data ?? [],
    jobCards: jobRes.data ?? [],
  })
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const sb = createServiceClient()
    const { error } = await sb.from('customers').delete().eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Failed' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const body = await req.json()
    const sb = createServiceClient()

    const updates: Record<string, unknown> = {}
    if (body.name !== undefined) updates.name = body.name.trim()
    if (body.phone !== undefined) updates.phone = body.phone.trim()
    if (body.email !== undefined) updates.email = body.email?.trim() || null
    if (body.company_name !== undefined) updates.company_name = body.company_name?.trim() || null
    if (body.is_fleet !== undefined) updates.is_fleet = body.is_fleet
    if (body.notes !== undefined) updates.notes = body.notes?.trim() || null

    const { data, error } = await sb.from('customers').update(updates).eq('id', id).select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ customer: data })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Failed' }, { status: 500 })
  }
}
