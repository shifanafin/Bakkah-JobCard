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

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params
  const sb = createServiceClient()
  const { data, error } = await sb.from('proforma_invoices').select('*').eq('id', id).single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ proforma: data })
}

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    if (!await requireAuth()) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

    const { id } = await params
    const body = await req.json()
    const sb = createServiceClient()

    const { data: pi } = await sb.from('proforma_invoices').select('*').eq('id', id).single()
    if (!pi) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const now = new Date().toISOString()

    // Sync items from linked quotation
    if (body.action === 'sync_from_quotation') {
      if (!pi.quotation_id) {
        return NextResponse.json({ error: 'No quotation linked to this proforma' }, { status: 400 })
      }
      const { data: qt } = await sb
        .from('quotations')
        .select('*, items:quotation_items(*)')
        .eq('id', pi.quotation_id)
        .single()
      if (!qt) return NextResponse.json({ error: 'Quotation not found' }, { status: 404 })

      const items = (qt.items ?? []).map((i: {
        item_type: string; description: string; quantity: number
        unit_price: number; total_price: number; sort_order: number
      }) => ({
        id: crypto.randomUUID(),
        item_type: i.item_type,
        description: i.description,
        quantity: i.quantity,
        unit_price: i.unit_price,
        total_price: i.total_price,
        sort_order: i.sort_order,
      }))

      const disc = pi.discount ?? 0
      const subtotal = items.reduce((s: number, i: { total_price: number }) => s + i.total_price, 0)
      const vat_amount = Math.max(0, (subtotal - disc) * 0.05)
      const total = Math.max(0, subtotal - disc + vat_amount)

      const { data, error } = await sb.from('proforma_invoices')
        .update({ items, subtotal, vat_amount, total, updated_at: now })
        .eq('id', id).select().single()
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ proforma: data })
    }

    const updates: Record<string, unknown> = { updated_at: now }

    if (body.notes !== undefined) updates.notes = body.notes
    if (body.terms !== undefined) updates.terms = body.terms
    if (body.due_date !== undefined) updates.due_date = body.due_date

    if (body.discount !== undefined) {
      const disc = parseFloat(body.discount) || 0
      const subtotal = (pi.subtotal as number) ?? 0
      const vat = Math.max(0, (subtotal - disc) * 0.05)
      updates.discount = disc
      updates.vat_amount = vat
      updates.total = Math.max(0, subtotal - disc + vat)
    }

    const { data, error } = await sb.from('proforma_invoices').update(updates).eq('id', id).select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ proforma: data })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Failed' }, { status: 500 })
  }
}

// DELETE /api/proforma-invoices/[id]
export async function DELETE(_req: NextRequest, { params }: Params) {
  if (!await requireAuth()) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  const { id } = await params
  const sb = createServiceClient()

  const { data: pi } = await sb.from('proforma_invoices').select('id, job_card_id').eq('id', id).single()
  if (!pi) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { data: taxInvoice } = await sb
    .from('tax_invoices')
    .select('id')
    .or(`proforma_id.eq.${id},job_card_id.eq.${pi.job_card_id}`)
    .maybeSingle()
  if (taxInvoice) {
    return NextResponse.json({ error: 'Cannot delete a proforma that already has a tax invoice' }, { status: 409 })
  }

  const { error } = await sb.from('proforma_invoices').update({ deleted_at: new Date().toISOString() }).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
