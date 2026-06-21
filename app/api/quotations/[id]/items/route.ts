import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { getServerSession } from '@/lib/server-session'

type Params = { params: Promise<{ id: string }> }

function recalcTotals(items: { total_price: number }[], discount: number) {
  const subtotal = items.reduce((s, i) => s + (i.total_price || 0), 0)
  const vat = Math.max(0, (subtotal - discount) * 0.05)
  return { subtotal, vat_amount: vat, total: Math.max(0, subtotal - discount + vat) }
}

async function getQuotationCtx(id: string) {
  const sb = createServiceClient()
  const { data: q } = await sb
    .from('quotations')
    .select('status, discount, job_card_id')
    .eq('id', id)
    .single()
  if (!q) return { sb, q: null, jobStatus: null }
  const { data: job } = await sb.from('job_cards').select('status').eq('id', q.job_card_id).single()
  return { sb, q, jobStatus: job?.status ?? null }
}

async function logHistory(
  sb: ReturnType<typeof createServiceClient>,
  jobCardId: string,
  jobStatus: string,
  changedBy: string,
  notes: string,
) {
  await sb.from('job_card_history').insert({
    job_card_id: jobCardId,
    old_status: jobStatus,
    new_status: jobStatus,
    changed_by: changedBy,
    notes,
  })
}

// POST — add an item
export async function POST(request: NextRequest, { params }: Params) {
  const session = await getServerSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userName = session.user?.name ?? 'Staff'

  const { id } = await params
  let body: { item_type?: string; description?: string; quantity?: number; unit_price?: number }
  try { body = await request.json() } catch { return NextResponse.json({ error: 'Invalid request' }, { status: 400 }) }

  if (!body.description || body.unit_price === undefined) {
    return NextResponse.json({ error: 'description and unit_price are required' }, { status: 400 })
  }

  const { sb, q, jobStatus } = await getQuotationCtx(id)
  if (!q) return NextResponse.json({ error: 'Quotation not found' }, { status: 404 })

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

  await logHistory(sb, q.job_card_id, jobStatus ?? '', userName,
    `Added quotation item: "${body.description}" ×${qty} @ AED ${unitPrice}`)

  const { data: updated } = await sb.from('quotations').select('*, items:quotation_items(*)').eq('id', id).single()
  return NextResponse.json({ quotation: updated }, { status: 201 })
}

// PATCH — edit an item (?item_id=xxx)
export async function PATCH(request: NextRequest, { params }: Params) {
  const session = await getServerSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userName = session.user?.name ?? 'Staff'

  const { id } = await params
  const itemId = request.nextUrl.searchParams.get('item_id')
  if (!itemId) return NextResponse.json({ error: 'item_id required' }, { status: 400 })

  let body: { description?: string; quantity?: number; unit_price?: number }
  try { body = await request.json() } catch { return NextResponse.json({ error: 'Invalid request' }, { status: 400 }) }

  const { sb, q, jobStatus } = await getQuotationCtx(id)
  if (!q) return NextResponse.json({ error: 'Quotation not found' }, { status: 404 })

  const { data: existing } = await sb.from('quotation_items').select('*').eq('id', itemId).eq('quotation_id', id).single()
  if (!existing) return NextResponse.json({ error: 'Item not found' }, { status: 404 })

  const qty = body.quantity ?? existing.quantity
  const unitPrice = body.unit_price ?? existing.unit_price
  const description = body.description ?? existing.description

  await sb.from('quotation_items').update({
    description,
    quantity: qty,
    unit_price: unitPrice,
    total_price: qty * unitPrice,
  }).eq('id', itemId)

  const { data: allItems } = await sb.from('quotation_items').select('total_price').eq('quotation_id', id)
  const totals = recalcTotals(allItems ?? [], q.discount ?? 0)
  await sb.from('quotations').update({ ...totals, updated_at: new Date().toISOString() }).eq('id', id)

  await logHistory(sb, q.job_card_id, jobStatus ?? '', userName,
    `Edited quotation item: "${description}" ×${qty} @ AED ${unitPrice}`)

  const { data: updated } = await sb.from('quotations').select('*, items:quotation_items(*)').eq('id', id).single()
  return NextResponse.json({ quotation: updated })
}

// DELETE — remove item (?item_id=xxx)
export async function DELETE(request: NextRequest, { params }: Params) {
  const session = await getServerSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userName = session.user?.name ?? 'Staff'

  const { id } = await params
  const itemId = request.nextUrl.searchParams.get('item_id')
  if (!itemId) return NextResponse.json({ error: 'item_id required' }, { status: 400 })

  const { sb, q, jobStatus } = await getQuotationCtx(id)
  if (!q) return NextResponse.json({ error: 'Quotation not found' }, { status: 404 })

  const { data: existing } = await sb.from('quotation_items')
    .select('description, quantity, unit_price')
    .eq('id', itemId).eq('quotation_id', id).single()

  await sb.from('quotation_items').delete().eq('id', itemId).eq('quotation_id', id)

  const { data: allItems } = await sb.from('quotation_items').select('total_price').eq('quotation_id', id)
  const totals = recalcTotals(allItems ?? [], q.discount ?? 0)
  await sb.from('quotations').update({ ...totals, updated_at: new Date().toISOString() }).eq('id', id)

  if (existing) {
    await logHistory(sb, q.job_card_id, jobStatus ?? '', userName,
      `Removed quotation item: "${existing.description}"`)
  }

  const { data: updated } = await sb.from('quotations').select('*, items:quotation_items(*)').eq('id', id).single()
  return NextResponse.json({ quotation: updated })
}
