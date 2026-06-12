import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'

// GET /api/quotations?job_card_id=xxx — returns the active quotation for a job
export async function GET(request: NextRequest) {
  const jobCardId = request.nextUrl.searchParams.get('job_card_id')
  if (!jobCardId) return NextResponse.json({ error: 'job_card_id required' }, { status: 400 })

  const sb = createServiceClient()
  const { data, error } = await sb
    .from('quotations')
    .select('*, items:quotation_items(*)')
    .eq('job_card_id', jobCardId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ quotation: data })
}

// POST /api/quotations — create a new draft quotation for a job
export async function POST(request: NextRequest) {
  let body: { job_card_id?: string; notes?: string; valid_days?: number }
  try { body = await request.json() } catch { return NextResponse.json({ error: 'Invalid request' }, { status: 400 }) }
  if (!body.job_card_id) return NextResponse.json({ error: 'job_card_id required' }, { status: 400 })

  const sb = createServiceClient()

  const { data: existing } = await sb
    .from('quotations')
    .select('id, status')
    .eq('job_card_id', body.job_card_id)
    .in('status', ['draft', 'sent'])
    .maybeSingle()

  if (existing) {
    return NextResponse.json({ error: 'An active quotation already exists for this job' }, { status: 409 })
  }

  const { data, error } = await sb
    .from('quotations')
    .insert({
      job_card_id: body.job_card_id,
      quotation_number: '',
      status: 'draft',
      valid_days: body.valid_days ?? 7,
      notes: body.notes ?? null,
    })
    .select('*, items:quotation_items(*)')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ quotation: data }, { status: 201 })
}
