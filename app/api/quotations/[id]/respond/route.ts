import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { createProformaForJob } from '@/app/api/proforma-invoices/route'

function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, '')
  if (digits.startsWith('971')) return digits
  if (digits.startsWith('0') && digits.length === 10) return `971${digits.slice(1)}`
  if (digits.length === 9) return `971${digits}`
  return digits
}

// POST /api/quotations/[id]/respond
// Public endpoint — customer approves or declines a sent quotation
// Body: { phone, action: 'approve' | 'decline', reason? }
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  let body: { phone?: string; action?: string; reason?: string }
  try { body = await request.json() } catch { return NextResponse.json({ error: 'Invalid request' }, { status: 400 }) }

  const { phone, action = 'approve', reason } = body
  if (!phone) return NextResponse.json({ error: 'Phone number is required to verify your identity' }, { status: 400 })
  if (action !== 'approve' && action !== 'decline') {
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  }

  const sb = createServiceClient()

  const { data: quotation } = await sb
    .from('quotations')
    .select('id, status, job_card_id')
    .eq('id', id)
    .single()

  if (!quotation) return NextResponse.json({ error: 'Quotation not found' }, { status: 404 })
  if (quotation.status !== 'sent') {
    return NextResponse.json({ error: 'This quotation is no longer available for response' }, { status: 400 })
  }

  const { data: job } = await sb
    .from('job_cards')
    .select('id, status, technician_id, customer_id')
    .eq('id', quotation.job_card_id)
    .single()

  if (!job) return NextResponse.json({ error: 'Job not found' }, { status: 404 })

  const { data: customer } = await sb
    .from('customers')
    .select('phone')
    .eq('id', job.customer_id)
    .maybeSingle()

  if (!customer) return NextResponse.json({ error: 'Customer not found' }, { status: 404 })

  const storedPhone = normalizePhone(customer.phone)
  const inputPhone = normalizePhone(phone)
  if (!storedPhone.endsWith(inputPhone.slice(-9))) {
    return NextResponse.json({ error: 'Phone number does not match our records' }, { status: 403 })
  }

  if (action === 'decline') {
    await sb.from('quotations').update({
      status: 'declined',
      customer_notes: reason?.trim() || null,
      updated_at: new Date().toISOString(),
    }).eq('id', id)

    await sb.from('job_card_history').insert({
      job_card_id: job.id,
      old_status: job.status,
      new_status: job.status,
      changed_by: 'Customer (via Track)',
      notes: reason?.trim()
        ? `Quotation declined: ${reason.trim()}`
        : 'Quotation declined by customer',
    })

    return NextResponse.json({ success: true, action: 'declined' })
  }

  // Approve: mark quotation approved + advance job status
  await sb.from('quotations').update({
    status: 'approved',
    updated_at: new Date().toISOString(),
  }).eq('id', id)

  const newJobStatus = job.technician_id ? 'assigned' : 'pending'
  await sb.from('job_cards').update({
    status: newJobStatus,
    updated_at: new Date().toISOString(),
  }).eq('id', job.id)

  await sb.from('job_card_history').insert({
    job_card_id: job.id,
    old_status: job.status,
    new_status: newJobStatus,
    changed_by: 'Customer (via Track)',
    notes: 'Quotation approved by customer — work authorized',
  })

  return NextResponse.json({ success: true, action: 'approved', new_status: newJobStatus })
}
