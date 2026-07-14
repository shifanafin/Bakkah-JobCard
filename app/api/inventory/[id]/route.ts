import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { getServerSession } from '@/lib/server-session'

type Params = { params: Promise<{ id: string }> }

async function requireAuth() {
  const session = await getServerSession()
  const role = session?.user?.role
  if (!session || (role !== 'admin' && role !== 'supervisor')) return null
  return session
}

export async function PATCH(req: NextRequest, { params }: Params) {
  if (!await requireAuth()) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  const { id } = await params
  const body = await req.json()
  const sb = createServiceClient()

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (body.name !== undefined) updates.name = body.name.trim()
  if (body.sku !== undefined) updates.sku = body.sku?.trim() || null
  if (body.category !== undefined) updates.category = body.category
  if (body.description !== undefined) updates.description = body.description?.trim() || null
  if (body.unit !== undefined) updates.unit = body.unit?.trim()
  if (body.cost_price !== undefined) updates.cost_price = parseFloat(body.cost_price) || 0
  if (body.selling_price !== undefined) updates.selling_price = parseFloat(body.selling_price) || 0
  if (body.stock_quantity !== undefined) updates.stock_quantity = parseFloat(body.stock_quantity) || 0
  if (body.min_stock_level !== undefined) updates.min_stock_level = parseFloat(body.min_stock_level) || 5
  if (body.supplier !== undefined) updates.supplier = body.supplier?.trim() || null
  if (body.location !== undefined) updates.location = body.location?.trim() || null
  if (body.active !== undefined) updates.active = body.active

  const { data, error } = await sb.from('inventory').update(updates).eq('id', id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ item: data })
}

// Soft delete — matches existing UI convention (sets active:false rather than a hard DELETE)
export async function DELETE(_req: NextRequest, { params }: Params) {
  if (!await requireAuth()) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  const { id } = await params
  const sb = createServiceClient()
  const { error } = await sb.from('inventory').update({ active: false, updated_at: new Date().toISOString() }).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
