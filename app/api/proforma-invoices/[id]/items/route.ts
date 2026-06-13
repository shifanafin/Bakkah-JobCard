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

type Item = { id: string; item_type: string; description: string; quantity: number; unit_price: number; total_price: number; sort_order: number }

async function getProformaAndCheck(id: string) {
  const sb = createServiceClient()
  const { data: pi } = await sb.from('proforma_invoices').select('*, job_card_id, subtotal, discount, items').eq('id', id).single()
  if (!pi) return { sb, pi: null, locked: false }
  const { data: job } = await sb.from('job_cards').select('status').eq('id', pi.job_card_id).single()
  const locked = job?.status === 'delivered' || job?.status === 'cancelled'
  return { sb, pi, locked }
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
    const { sb, pi, locked } = await getProformaAndCheck(id)
    if (!pi) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    if (locked) return NextResponse.json({ error: 'Cannot edit proforma for a completed job' }, { status: 400 })

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
    return NextResponse.json({ proforma: data })
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

    const { sb, pi, locked } = await getProformaAndCheck(id)
    if (!pi) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    if (locked) return NextResponse.json({ error: 'Cannot edit proforma for a completed job' }, { status: 400 })

    const newItems = (pi.items as Item[]).filter(i => i.id !== itemId)
    const { subtotal, vat_amount, total } = recalc(newItems, pi.discount ?? 0)

    const { data, error } = await sb.from('proforma_invoices')
      .update({ items: newItems, subtotal, vat_amount, total, updated_at: new Date().toISOString() })
      .eq('id', id).select().single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ proforma: data })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Failed' }, { status: 500 })
  }
}
