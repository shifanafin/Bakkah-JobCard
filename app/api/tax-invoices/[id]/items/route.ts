import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { getServerSession } from '@/lib/server-session'

type Params = { params: Promise<{ id: string }> }

type Item = {
  id: string
  item_type: string
  description: string
  quantity: number
  unit_price: number
  total_price: number
  sort_order: number
}

async function requireAuth() {
  const session = await getServerSession()
  const role = session?.user?.role
  if (!session || (role !== 'admin' && role !== 'supervisor')) return null
  return session
}

async function getInvoiceCtx(id: string) {
  const sb = createServiceClient()
  const { data: inv } = await sb
    .from('tax_invoices')
    .select('*')
    .eq('id', id)
    .single()
  return { sb, inv }
}

function recalc(items: Item[], discount: number) {
  const subtotal = items.reduce((s, i) => s + i.total_price, 0)
  const vat_amount = Math.max(0, (subtotal - discount) * 0.05)
  const total = Math.max(0, subtotal - discount + vat_amount)
  return { subtotal, vat_amount, total }
}

// POST — add item
export async function POST(req: NextRequest, { params }: Params) {
  try {
    if (!await requireAuth()) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

    const { id } = await params
    const { sb, inv } = await getInvoiceCtx(id)
    if (!inv) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const body = await req.json()
    if (!body.description?.trim()) return NextResponse.json({ error: 'Description required' }, { status: 400 })

    const qty = parseFloat(body.quantity) || 1
    const unitPrice = parseFloat(body.unit_price) || 0
    const existingItems: Item[] = inv.items ?? []
    const newItem: Item = {
      id: crypto.randomUUID(),
      item_type: body.item_type ?? 'service',
      description: body.description.trim(),
      quantity: qty,
      unit_price: unitPrice,
      total_price: qty * unitPrice,
      sort_order: existingItems.length,
    }

    const newItems = [...existingItems, newItem]
    const { subtotal, vat_amount, total } = recalc(newItems, inv.discount ?? 0)

    const { data, error } = await sb.from('tax_invoices')
      .update({ items: newItems, subtotal, vat_amount, total, updated_at: new Date().toISOString() })
      .eq('id', id).select().single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ invoice: data })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Failed' }, { status: 500 })
  }
}

// PATCH — edit item (?item_id=xxx)
export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    if (!await requireAuth()) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

    const { id } = await params
    const itemId = new URL(req.url).searchParams.get('item_id')
    if (!itemId) return NextResponse.json({ error: 'item_id required' }, { status: 400 })

    const { sb, inv } = await getInvoiceCtx(id)
    if (!inv) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const body = await req.json()
    const items: Item[] = inv.items ?? []
    const existing = items.find(i => i.id === itemId)
    if (!existing) return NextResponse.json({ error: 'Item not found' }, { status: 404 })

    const qty = body.quantity !== undefined ? parseFloat(body.quantity) || existing.quantity : existing.quantity
    const unitPrice = body.unit_price !== undefined ? parseFloat(body.unit_price) || existing.unit_price : existing.unit_price
    const description = body.description?.trim() || existing.description

    const updatedItem: Item = { ...existing, description, quantity: qty, unit_price: unitPrice, total_price: qty * unitPrice }
    const newItems = items.map(i => i.id === itemId ? updatedItem : i)
    const { subtotal, vat_amount, total } = recalc(newItems, inv.discount ?? 0)

    const { data, error } = await sb.from('tax_invoices')
      .update({ items: newItems, subtotal, vat_amount, total, updated_at: new Date().toISOString() })
      .eq('id', id).select().single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ invoice: data })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Failed' }, { status: 500 })
  }
}

// DELETE — remove item (?item_id=xxx)
export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    if (!await requireAuth()) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

    const { id } = await params
    const itemId = new URL(req.url).searchParams.get('item_id')
    if (!itemId) return NextResponse.json({ error: 'item_id required' }, { status: 400 })

    const { sb, inv } = await getInvoiceCtx(id)
    if (!inv) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const items: Item[] = inv.items ?? []
    const newItems = items.filter(i => i.id !== itemId)
    const { subtotal, vat_amount, total } = recalc(newItems, inv.discount ?? 0)

    const { data, error } = await sb.from('tax_invoices')
      .update({ items: newItems, subtotal, vat_amount, total, updated_at: new Date().toISOString() })
      .eq('id', id).select().single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ invoice: data })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Failed' }, { status: 500 })
  }
}
