import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'

type Params = { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params
  const sb = createServiceClient()

  const { data, error } = await sb
    .from('vehicles')
    .select('id, plate_number, make, model, year, color, vin')
    .eq('customer_id', id)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ vehicles: data ?? [] })
}

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const body = await req.json()
    if (!body.plate_number?.trim()) return NextResponse.json({ error: 'Plate number is required' }, { status: 400 })
    if (!body.make?.trim()) return NextResponse.json({ error: 'Make is required' }, { status: 400 })
    if (!body.model?.trim()) return NextResponse.json({ error: 'Model is required' }, { status: 400 })

    const sb = createServiceClient()
    const { data, error } = await sb.from('vehicles').insert({
      customer_id: id,
      plate_number: body.plate_number.trim().toUpperCase(),
      make: body.make.trim(),
      model: body.model.trim(),
      year: body.year ? parseInt(body.year) : null,
      color: body.color?.trim() || null,
      vin: body.vin?.trim().toUpperCase() || null,
    }).select().single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ vehicle: data }, { status: 201 })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Failed' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const { id: customerId } = await params
    const body = await req.json()
    const { vehicleId, ...fields } = body
    if (!vehicleId) return NextResponse.json({ error: 'vehicleId required' }, { status: 400 })

    const sb = createServiceClient()
    const updates: Record<string, unknown> = {}
    if (fields.plate_number) updates.plate_number = fields.plate_number.trim().toUpperCase()
    if (fields.make) updates.make = fields.make.trim()
    if (fields.model) updates.model = fields.model.trim()
    if (fields.year !== undefined) updates.year = fields.year ? parseInt(fields.year) : null
    if (fields.color !== undefined) updates.color = fields.color?.trim() || null
    if (fields.vin !== undefined) updates.vin = fields.vin?.trim().toUpperCase() || null

    const { data, error } = await sb.from('vehicles')
      .update(updates).eq('id', vehicleId).eq('customer_id', customerId).select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ vehicle: data })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Failed' }, { status: 500 })
  }
}
