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

async function getProformaCtx(id: string) {
  const sb = createServiceClient()
  const { data: pi } = await sb
    .from('proforma_invoices')
    .select('*, job_card_id, subtotal, discount, items')
    .eq('id', id)
    .single()
  if (!pi) return { sb, pi: null, jobStatus: null }
  const { data: job } = await sb.from('job_cards').select('status').eq('id', pi.job_card_id).single()
  const jobStatus = job?.status ?? null
  return { sb, pi, jobStatus }
}

function recalc(items: Item[], discount: number) {
  const subtotal = items.reduce((s, i) => s + i.total_price, 0)
  const vat_amount = subtotal * 0.05
  const total = Math.max(0, subtotal + vat_amount - discount)
  return { subtotal, vat_amount, total }
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

// POST — add item
export async function POST(req: NextRequest, { params }: Params) {
  try {
    const session = await requireAuth()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    const userName = session.user?.name ?? 'Staff'

    const { id } = await params
    const { sb, pi, jobStatus } = await getProformaCtx(id)
    if (!pi) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const body = await req.json()
    if (!body.description?.trim()) return NextResponse.json({ error: 'Description required' }, { status: 400 })

    const qty = parseFloat(body.quantity) || 1
    const unitPrice = parseFloat(body.unit_price) || 0
    const newItem: Item = {
      id: crypto.randomUUID(),
      item_type: body.item_type ?? 'service',
      description: body.description.trim(),
      quantity: qty,
      unit_price: unitPrice,
      total_price: qty * unitPrice,
      sort_order: (pi.items as Item[]).length,
    }

    const newItems = [...(pi.items as Item[]), newItem]
    const { subtotal, vat_amount, total } = recalc(newItems, pi.discount ?? 0)

    const { data, error } = await sb.from('proforma_invoices')
      .update({ items: newItems, subtotal, vat_amount, total, updated_at: new Date().toISOString() })
      .eq('id', id).select().single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    await logHistory(sb, pi.job_card_id, jobStatus ?? '', userName,
      `Added proforma item: "${newItem.description}" ×${qty} @ AED ${unitPrice}`)

    return NextResponse.json({ proforma: data })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Failed' }, { status: 500 })
  }
}

// PATCH — edit item (?item_id=xxx)
export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const session = await requireAuth()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    const userName = session.user?.name ?? 'Staff'

    const { id } = await params
    const itemId = new URL(req.url).searchParams.get('item_id')
    if (!itemId) return NextResponse.json({ error: 'item_id required' }, { status: 400 })

    const { sb, pi, jobStatus } = await getProformaCtx(id)
    if (!pi) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const body = await req.json()
    const existing = (pi.items as Item[]).find(i => i.id === itemId)
    if (!existing) return NextResponse.json({ error: 'Item not found' }, { status: 404 })

    const qty = body.quantity !== undefined ? parseFloat(body.quantity) || existing.quantity : existing.quantity
    const unitPrice = body.unit_price !== undefined ? parseFloat(body.unit_price) || existing.unit_price : existing.unit_price
    const description = body.description?.trim() || existing.description

    const updatedItem: Item = { ...existing, description, quantity: qty, unit_price: unitPrice, total_price: qty * unitPrice }
    const newItems = (pi.items as Item[]).map(i => i.id === itemId ? updatedItem : i)
    const { subtotal, vat_amount, total } = recalc(newItems, pi.discount ?? 0)

    const { data, error } = await sb.from('proforma_invoices')
      .update({ items: newItems, subtotal, vat_amount, total, updated_at: new Date().toISOString() })
      .eq('id', id).select().single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    await logHistory(sb, pi.job_card_id, jobStatus ?? '', userName,
      `Edited proforma item: "${description}" ×${qty} @ AED ${unitPrice}`)

    return NextResponse.json({ proforma: data })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Failed' }, { status: 500 })
  }
}

// DELETE — remove item (?item_id=xxx)
export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const session = await requireAuth()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    const userName = session.user?.name ?? 'Staff'

    const { id } = await params
    const itemId = new URL(req.url).searchParams.get('item_id')
    if (!itemId) return NextResponse.json({ error: 'item_id required' }, { status: 400 })

    const { sb, pi, jobStatus } = await getProformaCtx(id)
    if (!pi) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const existing = (pi.items as Item[]).find(i => i.id === itemId)
    const newItems = (pi.items as Item[]).filter(i => i.id !== itemId)
    const { subtotal, vat_amount, total } = recalc(newItems, pi.discount ?? 0)

    const { data, error } = await sb.from('proforma_invoices')
      .update({ items: newItems, subtotal, vat_amount, total, updated_at: new Date().toISOString() })
      .eq('id', id).select().single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    if (existing) {
      await logHistory(sb, pi.job_card_id, jobStatus ?? '', userName,
        `Removed proforma item: "${existing.description}"`)
    }

    return NextResponse.json({ proforma: data })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Failed' }, { status: 500 })
  }
}
