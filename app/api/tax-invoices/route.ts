import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { getServerSession } from '@/lib/server-session'

export async function GET(req: NextRequest) {
  const jobCardId = new URL(req.url).searchParams.get('job_card_id')
  if (!jobCardId) return NextResponse.json({ error: 'job_card_id required' }, { status: 400 })

  const sb = createServiceClient()
  const { data, error } = await sb
    .from('tax_invoices')
    .select('*')
    .eq('job_card_id', jobCardId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ invoice: data ?? null })
}

// Called server-side when job reaches delivered status
export async function createTaxInvoiceForJob(jobCardId: string, proformaId?: string | null) {
  const sb = createServiceClient()

  // Don't create duplicate
  const { data: existing } = await sb.from('tax_invoices').select('id').eq('job_card_id', jobCardId).limit(1).maybeSingle()
  if (existing) return { invoice: existing }

  let items: object[] = []
  let subtotal = 0, vat_amount = 0, total = 0
  let fromProformaId: string | null = proformaId ?? null

  if (proformaId) {
    const { data: pf } = await sb.from('proforma_invoices').select('*').eq('id', proformaId).single()
    if (pf) {
      items = pf.items ?? []
      subtotal = pf.subtotal
      vat_amount = pf.vat_amount
      total = pf.total
    }
  } else {
    // Try to find latest proforma for this job
    const { data: pf } = await sb.from('proforma_invoices').select('*').eq('job_card_id', jobCardId).order('created_at', { ascending: false }).limit(1).maybeSingle()
    if (pf) {
      items = pf.items ?? []
      subtotal = pf.subtotal
      vat_amount = pf.vat_amount
      total = pf.total
      fromProformaId = pf.id
    } else {
      // Fall back to job services and parts
      const [svcRes, partsRes] = await Promise.all([
        sb.from('job_card_services').select('*').eq('job_card_id', jobCardId),
        sb.from('job_card_parts').select('*').eq('job_card_id', jobCardId),
      ])
      let sortOrder = 0
      items = [
        ...(svcRes.data ?? []).map((s: { description: string; quantity: number; unit_price: number; total_price: number }) => ({
          id: crypto.randomUUID(), item_type: 'service',
          description: s.description, quantity: s.quantity,
          unit_price: s.unit_price, total_price: s.total_price, sort_order: sortOrder++,
        })),
        ...(partsRes.data ?? []).map((p: { part_name: string; quantity: number; unit_price: number; total_price: number }) => ({
          id: crypto.randomUUID(), item_type: 'part',
          description: p.part_name, quantity: p.quantity,
          unit_price: p.unit_price, total_price: p.total_price, sort_order: sortOrder++,
        })),
      ]
      subtotal = items.reduce((s, i: { total_price: number }) => s + i.total_price, 0)
      vat_amount = subtotal * 0.05
      total = subtotal + vat_amount
    }
  }

  const { data, error } = await sb.from('tax_invoices').insert({
    job_card_id: jobCardId,
    proforma_id: fromProformaId,
    status: 'draft',
    subtotal, discount: 0, vat_amount, total, items,
  }).select().single()

  if (error) throw new Error(error.message)
  return { invoice: data }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession()
    const role = session?.user?.role
    if (!session || (role !== 'admin' && role !== 'supervisor')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }
    const body = await req.json()
    if (!body.job_card_id) return NextResponse.json({ error: 'job_card_id required' }, { status: 400 })
    return NextResponse.json(await createTaxInvoiceForJob(body.job_card_id, body.proforma_id), { status: 201 })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Failed' }, { status: 500 })
  }
}
