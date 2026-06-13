import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { getServerSession } from '@/lib/server-session'

export async function GET(req: NextRequest) {
  const jobCardId = new URL(req.url).searchParams.get('job_card_id')
  if (!jobCardId) return NextResponse.json({ error: 'job_card_id required' }, { status: 400 })

  const sb = createServiceClient()
  const { data, error } = await sb
    .from('proforma_invoices')
    .select('*')
    .eq('job_card_id', jobCardId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ proforma: data ?? null })
}

// POST — create proforma (called internally; body: { job_card_id, quotation_id? })
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession()
    const role = session?.user?.role
    if (!session || (role !== 'admin' && role !== 'supervisor')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const body = await req.json()
    const { job_card_id, quotation_id } = body
    if (!job_card_id) return NextResponse.json({ error: 'job_card_id required' }, { status: 400 })

    return NextResponse.json(await createProformaForJob(job_card_id, quotation_id ?? null), { status: 201 })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Failed' }, { status: 500 })
  }
}

// Shared helper — also used by job-cards approve route
export async function createProformaForJob(jobCardId: string, quotationId: string | null) {
  const sb = createServiceClient()
  let items: object[] = []
  let subtotal = 0, discount = 0, vat_amount = 0, total = 0
  let fromQuotationId: string | null = quotationId

  if (quotationId) {
    const { data: qt } = await sb
      .from('quotations')
      .select('*, items:quotation_items(id, item_type, description, quantity, unit_price, total_price, sort_order)')
      .eq('id', quotationId)
      .single()

    if (qt) {
      items = (qt.items ?? []).map((i: { item_type: string; description: string; quantity: number; unit_price: number; total_price: number; sort_order: number }) => ({
        id: crypto.randomUUID(),
        item_type: i.item_type,
        description: i.description,
        quantity: i.quantity,
        unit_price: i.unit_price,
        total_price: i.total_price,
        sort_order: i.sort_order,
      }))
      subtotal = qt.subtotal
      discount = qt.discount
      vat_amount = qt.vat_amount
      total = qt.total
      fromQuotationId = qt.id
    }
  } else {
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

  const { data, error } = await sb.from('proforma_invoices').insert({
    job_card_id: jobCardId,
    quotation_id: fromQuotationId,
    subtotal, discount, vat_amount, total, items,
  }).select().single()

  if (error) throw new Error(error.message)
  return { proforma: data }
}
