import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { getServerSession } from '@/lib/server-session'
import { createProformaForJob } from '@/app/api/proforma-invoices/route'

type Params = { params: Promise<{ id: string }> }

// GET /api/quotations/[id]
export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params
  const sb = createServiceClient()
  const { data, error } = await sb
    .from('quotations')
    .select('*, items:quotation_items(*)')
    .eq('id', id)
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ quotation: data })
}

// PATCH /api/quotations/[id]
// Body: { notes?, discount?, valid_days?, action?: 'send' | 'draft' | 'approve' | 'decline', reason? }
export async function PATCH(request: NextRequest, { params }: Params) {
  const { id } = await params
  let body: { notes?: string; discount?: number; valid_days?: number; action?: string; reason?: string }
  try { body = await request.json() } catch { return NextResponse.json({ error: 'Invalid request' }, { status: 400 }) }

  const sb = createServiceClient()

  // Admin/supervisor approve or decline — handle separately (no phone verification needed)
  if (body.action === 'approve' || body.action === 'decline') {
    const session = await getServerSession()
    const role = (session?.user as { role?: string } | undefined)?.role
    if (!session || (role !== 'admin' && role !== 'supervisor')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { data: quotation } = await sb
      .from('quotations')
      .select('id, status, job_card_id')
      .eq('id', id)
      .single()

    if (!quotation) return NextResponse.json({ error: 'Quotation not found' }, { status: 404 })
    if (quotation.status !== 'sent') {
      return NextResponse.json({ error: 'Only sent quotations can be approved or declined' }, { status: 400 })
    }

    const { data: job } = await sb
      .from('job_cards')
      .select('id, status, technician_id')
      .eq('id', quotation.job_card_id)
      .single()

    if (!job) return NextResponse.json({ error: 'Job not found' }, { status: 404 })

    if (body.action === 'decline') {
      await sb.from('quotations').update({
        status: 'declined',
        customer_notes: body.reason?.trim() || null,
        updated_at: new Date().toISOString(),
      }).eq('id', id)

      await sb.from('job_card_history').insert({
        job_card_id: job.id,
        old_status: job.status,
        new_status: job.status,
        changed_by: `${role} override`,
        notes: body.reason?.trim()
          ? `Quotation declined: ${body.reason.trim()}`
          : 'Quotation declined by staff',
      })

      const { data: updated } = await sb.from('quotations').select('*, items:quotation_items(*)').eq('id', id).single()
      return NextResponse.json({ quotation: updated })
    }

    // Approve: mark approved, advance job status, auto-create proforma
    const newJobStatus = job.technician_id ? 'assigned' : 'pending'
    await sb.from('quotations').update({ status: 'approved', updated_at: new Date().toISOString() }).eq('id', id)
    await sb.from('job_cards').update({ status: newJobStatus, updated_at: new Date().toISOString() }).eq('id', job.id)
    await sb.from('job_card_history').insert({
      job_card_id: job.id,
      old_status: job.status,
      new_status: newJobStatus,
      changed_by: `${role} override`,
      notes: 'Quotation approved by staff — work authorized',
    })

    try { await createProformaForJob(job.id, id) } catch { /* non-fatal */ }

    const { data: updated } = await sb.from('quotations').select('*, items:quotation_items(*)').eq('id', id).single()
    return NextResponse.json({ quotation: updated })
  }

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }

  if (body.notes !== undefined) updates.notes = body.notes
  if (body.valid_days !== undefined) updates.valid_days = body.valid_days
  if (body.action === 'send') updates.status = 'sent'
  if (body.action === 'draft') updates.status = 'draft'

  if (body.discount !== undefined) {
    updates.discount = body.discount
    const { data: q } = await sb.from('quotations').select('subtotal').eq('id', id).single()
    if (q) {
      const vat = q.subtotal * 0.05
      updates.vat_amount = vat
      updates.total = Math.max(0, q.subtotal + vat - body.discount)
    }
  }

  const { data, error } = await sb
    .from('quotations')
    .update(updates)
    .eq('id', id)
    .select('*, items:quotation_items(*)')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // When quotation is sent: advance job to waiting_for_approval
  if (body.action === 'send' && data) {
    // Advance job card status
    await sb
      .from('job_cards')
      .update({ status: 'waiting_for_approval', updated_at: new Date().toISOString() })
      .eq('id', data.job_card_id)
      .in('status', ['inspection', 'draft'])

    await sb.from('job_card_history').insert({
      job_card_id: data.job_card_id,
      new_status: 'waiting_for_approval',
      notes: `Quotation ${data.quotation_number} sent to customer`,
    })
  }

  return NextResponse.json({ quotation: data })
}

// DELETE /api/quotations/[id] — draft only
export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params
  const sb = createServiceClient()
  const { data: q } = await sb.from('quotations').select('status').eq('id', id).single()
  if (q?.status !== 'draft') {
    return NextResponse.json({ error: 'Only draft quotations can be deleted' }, { status: 400 })
  }
  const { error } = await sb.from('quotations').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
