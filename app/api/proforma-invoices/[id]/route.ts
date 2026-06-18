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

    // Check job status — locked once delivered
    const { data: pi } = await sb.from('proforma_invoices').select('job_card_id, subtotal, discount').eq('id', id).single()
    if (!pi) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const { data: job } = await sb.from('job_cards').select('status').eq('id', pi.job_card_id).single()
    if (job?.status === 'delivered' || job?.status === 'cancelled') {
      return NextResponse.json({ error: 'Cannot edit proforma for a completed job' }, { status: 400 })
    }

    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }

    if (body.notes !== undefined) updates.notes = body.notes
    if (body.terms !== undefined) updates.terms = body.terms
    if (body.due_date !== undefined) updates.due_date = body.due_date

    if (body.discount !== undefined) {
      const disc = parseFloat(body.discount) || 0
      const vat = pi.subtotal * 0.05
      updates.discount = disc
      updates.vat_amount = vat
      updates.total = Math.max(0, pi.subtotal + vat - disc)
    }

    const { data, error } = await sb.from('proforma_invoices').update(updates).eq('id', id).select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ proforma: data })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Failed' }, { status: 500 })
  }
}
