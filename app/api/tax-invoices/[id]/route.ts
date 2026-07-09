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

function recalc(items: Item[], discount: number) {
  const subtotal = items.reduce((s, i) => s + i.total_price, 0)
  const vat_amount = Math.max(0, (subtotal - discount) * 0.05)
  const total = Math.max(0, subtotal - discount + vat_amount)
  return { subtotal, vat_amount, total }
}

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params
  const sb = createServiceClient()
  const { data, error } = await sb.from('tax_invoices').select('*').eq('id', id).single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ invoice: data })
}

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    if (!await requireAuth()) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

    const { id } = await params
    const body = await req.json()
    const sb = createServiceClient()
    const now = new Date().toISOString()

    const { data: inv } = await sb.from('tax_invoices').select('*').eq('id', id).single()
    if (!inv) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    // Status transitions
    if (body.action === 'issue') {
      if (inv.status !== 'draft') return NextResponse.json({ error: 'Can only issue a draft invoice' }, { status: 400 })
      const { data, error } = await sb.from('tax_invoices').update({ status: 'issued', updated_at: now }).eq('id', id).select().single()
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ invoice: data })
    }

    if (body.action === 'mark_paid') {
      if (inv.status !== 'issued') return NextResponse.json({ error: 'Can only mark as paid after issuing' }, { status: 400 })
      const { data, error } = await sb.from('tax_invoices').update({ status: 'paid', updated_at: now }).eq('id', id).select().single()
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      // Sync financial summary and payment status back to the job card
      await sb.from('job_cards').update({
        payment_status: 'paid',
        subtotal: inv.subtotal,
        discount: inv.discount,
        vat_amount: inv.vat_amount,
        total: inv.total,
        updated_at: now,
      }).eq('id', inv.job_card_id)
      return NextResponse.json({ invoice: data })
    }

    // Sync items from proforma
    if (body.action === 'sync_from_proforma') {
      let pf
      if (inv.proforma_id) {
        const { data } = await sb.from('proforma_invoices').select('*').eq('id', inv.proforma_id).single()
        pf = data
      }
      if (!pf) {
        // Fallback: find latest proforma for this job
        const { data } = await sb.from('proforma_invoices').select('*')
          .eq('job_card_id', inv.job_card_id)
          .order('created_at', { ascending: false })
          .limit(1).maybeSingle()
        pf = data
      }
      if (!pf) return NextResponse.json({ error: 'No proforma found for this job' }, { status: 404 })

      const disc = inv.discount ?? 0
      const items = (pf.items ?? []).map((i: Item) => ({ ...i, id: crypto.randomUUID() }))
      const { subtotal, vat_amount, total } = recalc(items, disc)

      const { data, error } = await sb.from('tax_invoices')
        .update({ items, subtotal, vat_amount, total, updated_at: now })
        .eq('id', id).select().single()
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ invoice: data })
    }

    // General editing — allowed at any status (draft/issued/paid)
    const updates: Record<string, unknown> = { updated_at: now }

    if (body.notes !== undefined) updates.notes = body.notes
    if (body.terms !== undefined) updates.terms = body.terms

    if (body.discount !== undefined) {
      const disc = parseFloat(body.discount) || 0
      const currentItems: Item[] = (inv.items ?? []) as Item[]
      const subtotal = currentItems.length > 0
        ? currentItems.reduce((s, i) => s + i.total_price, 0)
        : (inv.subtotal ?? 0)
      const vat = Math.max(0, (subtotal - disc) * 0.05)
      updates.discount = disc
      updates.subtotal = subtotal
      updates.vat_amount = vat
      updates.total = Math.max(0, subtotal - disc + vat)
    }

    const { data, error } = await sb.from('tax_invoices').update(updates).eq('id', id).select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ invoice: data })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Failed' }, { status: 500 })
  }
}

// DELETE /api/tax-invoices/[id] — blocked once paid (protects ledger income integrity)
export async function DELETE(_req: NextRequest, { params }: Params) {
  if (!await requireAuth()) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  const { id } = await params
  const sb = createServiceClient()

  const { data: inv } = await sb.from('tax_invoices').select('id, status').eq('id', id).single()
  if (!inv) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (inv.status === 'paid') {
    return NextResponse.json({ error: 'Cannot delete a paid invoice' }, { status: 409 })
  }

  const { error } = await sb.from('tax_invoices').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
