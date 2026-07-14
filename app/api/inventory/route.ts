import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { getServerSession } from '@/lib/server-session'

async function requireAuth() {
  const session = await getServerSession()
  const role = session?.user?.role
  if (!session || (role !== 'admin' && role !== 'supervisor')) return null
  return session
}

export async function GET() {
  const sb = createServiceClient()
  const { data, error } = await sb.from('inventory').select('*').eq('active', true).order('name')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ items: data ?? [] })
}

export async function POST(req: NextRequest) {
  if (!await requireAuth()) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  const body = await req.json()
  const sb = createServiceClient()
  const payload = {
    name: (body.name ?? '').trim(),
    sku: body.sku?.trim() || null,
    category: body.category,
    description: body.description?.trim() || null,
    unit: body.unit?.trim(),
    cost_price: parseFloat(body.cost_price) || 0,
    selling_price: parseFloat(body.selling_price) || 0,
    stock_quantity: parseFloat(body.stock_quantity) || 0,
    min_stock_level: parseFloat(body.min_stock_level) || 5,
    supplier: body.supplier?.trim() || null,
    location: body.location?.trim() || null,
  }
  if (!payload.name) return NextResponse.json({ error: 'Name is required' }, { status: 400 })

  const { data, error } = await sb.from('inventory').insert(payload).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ item: data }, { status: 201 })
}
