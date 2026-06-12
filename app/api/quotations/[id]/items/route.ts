import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'

type Params = { params: Promise<{ id: string }> }

function recalcTotals(items: { total_price: number }[], discount: number) {
  const subtotal = items.reduce((s, i) => s + (i.total_price || 0), 0)
  const vat = Math.max(0, (subtotal - discount) * 0.05)
  return { subtotal, vat_amount: vat, total: Math.max(0, subtotal - discount + vat) }
}

// POST /api/quotations/[id]/items — add an item
export async function POST(request: NextRequest, { params }: Params) {
  const { id } = await params
  let body: { item_type?: string; description?: string; quantity?: number; unit_price?: number }
  try { body = await request.json() } catch { return NextResponse.json({ error: 'Invalid request' }, { status: 400 }) }

  if (!body.description || body.unit_price === undefined) {
    return NextResponse.json({ error: 'description and unit_price are required' }, { status: 400 })
  }

  const sb = createServiceClient()
  const { data: q } = await sb.from('quotations').select('status, discount').eq('id', id).single()
  if (!q) return NextResponse.json({ error: 'Quotation not found' }, { status: 404 })
  if (q.status !== 'draft') return NextResponse.json({ error: 'Quotation is not editable' }, { status: 400 })

  const qty = body.quantity ?? 1
  const unitPrice = body.unit_price ?? 0

  const { error: insertErr } = await sb.from('quotation_items').insert({
    quotation_id: id,
    item_type: body.item_type ?? 'service',
    description: body.description,
    quantity: qty,
    unit_price: unitPrice,
    total_price: qty * unitPrice,
  })
  if (insertErr) return NextResponse.json({ error: insertErr.message }, { status: 500 })

  const { data: allItems } = await sb.from('quotation_items').select('total_price').eq('quotation_id', id)
  const totals = recalcTotals(allItems ?? [], q.discount ?? 0)
  await sb.from('quotations').update({ ...totals, updated_at: new Date().toISOString() }).eq('id', id)

  const { data: updated } = await sb.from('quotations').select('*, items:quotation_items(*)').eq('id', id).single()
  return NextResponse.json({ quotation: updated }, { status: 201 })
}

// DELETE /api/quotations/[id]/items?item_id=xxx
export async function DELETE(request: NextRequest, { params }: Params) {
  const { id } = await params
  const itemId = request.nextUrl.searchParams.get('item_id')
  if (!itemId) return NextResponse.json({ error: 'item_id required' }, { status: 400 })

  const sb = createServiceClient()
  const { data: q } = await sb.from('quotations').select('status, discount').eq('id', id).single()
  if (!q) return NextResponse.json({ error: 'Quotation not found' }, { status: 404 })
  if (q.status !== 'draft') return NextResponse.json({ error: 'Quotation is not editable' }, { status: 400 })

  await sb.from('quotation_items').delete().eq('id', itemId).eq('quotation_id', id)

  const { data: allItems } = await sb.from('quotation_items').select('total_price').eq('quotation_id', id)
  const totals = recalcTotals(allItems ?? [], q.discount ?? 0)
  await sb.from('quotations').update({ ...totals, updated_at: new Date().toISOString() }).eq('id', id)

  const { data: updated } = await sb.from('quotations').select('*, items:quotation_items(*)').eq('id', id).single()
  return NextResponse.json({ quotation: updated })
}
