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

    const { data: inv } = await sb.from('tax_invoices').select('status, subtotal, discount, items').eq('id', id).single()
    if (!inv) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }

    if (body.action === 'issue') {
      if (inv.status !== 'draft') return NextResponse.json({ error: 'Can only issue a draft invoice' }, { status: 400 })
      updates.status = 'issued'
    } else if (body.action === 'mark_paid') {
      if (inv.status !== 'issued') return NextResponse.json({ error: 'Can only mark as paid after issuing' }, { status: 400 })
      updates.status = 'paid'
    } else {
      // Editing (discount / notes / terms) — only allowed on drafts
      if (inv.status !== 'draft') {
        return NextResponse.json({ error: 'Invoice is locked — only draft invoices can be edited' }, { status: 400 })
      }

      if (body.notes !== undefined) updates.notes = body.notes
      if (body.terms !== undefined) updates.terms = body.terms

      if (body.discount !== undefined) {
        const disc = parseFloat(body.discount) || 0
        const items: Item[] = (inv as { items?: Item[] }).items ?? []
        const effectiveSubtotal = body.items !== undefined
          ? (body.items as Item[]).reduce((s: number, i: Item) => s + i.total_price, 0)
          : items.length > 0
            ? items.reduce((s, i) => s + i.total_price, 0)
            : (inv.subtotal ?? 0)
        const vat = Math.max(0, (effectiveSubtotal - disc) * 0.05)
        updates.discount = disc
        updates.subtotal = effectiveSubtotal
        updates.vat_amount = vat
        updates.total = Math.max(0, effectiveSubtotal - disc + vat)
      }
    }

    const { data, error } = await sb.from('tax_invoices').update(updates).eq('id', id).select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ invoice: data })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Failed' }, { status: 500 })
  }
}
