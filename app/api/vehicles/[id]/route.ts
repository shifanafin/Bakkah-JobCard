import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { getServerSession } from '@/lib/server-session'

type Params = { params: Promise<{ id: string }> }

async function requireAuth(allowReceptionist = false) {
  const session = await getServerSession()
  const role = session?.user?.role
  const allowed = allowReceptionist
    ? ['admin', 'supervisor', 'receptionist']
    : ['admin', 'supervisor']
  if (!session || !role || !allowed.includes(role)) return null
  return session
}

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params
  const sb = createServiceClient()
  const { data, error } = await sb.from('vehicles').select('*, customer:customers(id, name, phone)').eq('id', id).single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ vehicle: data })
}

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    if (!await requireAuth(true)) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

    const { id } = await params
    const body = await req.json()
    const sb = createServiceClient()

    const updates: Record<string, unknown> = {}
    if (body.plate_number !== undefined) updates.plate_number = body.plate_number.trim().toUpperCase()
    if (body.make !== undefined) updates.make = body.make.trim()
    if (body.model !== undefined) updates.model = body.model.trim()
    if (body.year !== undefined) updates.year = body.year ? parseInt(body.year, 10) : null
    if (body.color !== undefined) updates.color = body.color?.trim() || null
    if (body.vin !== undefined) updates.vin = body.vin?.trim() || null

    const { data, error } = await sb.from('vehicles').update(updates).eq('id', id).select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ vehicle: data })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Failed' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  if (!await requireAuth()) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  const { id } = await params
  const sb = createServiceClient()

  const { count } = await sb.from('job_cards').select('id', { count: 'exact', head: true }).eq('vehicle_id', id)
  if ((count ?? 0) > 0) {
    return NextResponse.json({ error: 'Cannot delete a vehicle with job history' }, { status: 409 })
  }

  const { error } = await sb.from('vehicles').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
