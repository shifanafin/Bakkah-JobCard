import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { sendQuotationEmail } from '@/lib/email'

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
// Body: { notes?, discount?, valid_days?, action?: 'send' | 'draft' }
export async function PATCH(request: NextRequest, { params }: Params) {
  const { id } = await params
  let body: { notes?: string; discount?: number; valid_days?: number; action?: string }
  try { body = await request.json() } catch { return NextResponse.json({ error: 'Invalid request' }, { status: 400 }) }

  const sb = createServiceClient()
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }

  if (body.notes !== undefined) updates.notes = body.notes
  if (body.valid_days !== undefined) updates.valid_days = body.valid_days
  if (body.action === 'send') updates.status = 'sent'
  if (body.action === 'draft') updates.status = 'draft'

  if (body.discount !== undefined) {
    updates.discount = body.discount
    const { data: q } = await sb.from('quotations').select('subtotal').eq('id', id).single()
    if (q) {
      const vat = Math.max(0, (q.subtotal - body.discount) * 0.05)
      updates.vat_amount = vat
      updates.total = Math.max(0, q.subtotal - body.discount + vat)
    }
  }

  const { data, error } = await sb
    .from('quotations')
    .update(updates)
    .eq('id', id)
    .select('*, items:quotation_items(*)')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // When quotation is sent: advance job to waiting_for_approval + email customer
  if (body.action === 'send' && data) {
    try {
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

      // Fetch customer email for notification
      const { data: job } = await sb
        .from('job_cards')
        .select('customer:customers(name, email), job_number')
        .eq('id', data.job_card_id)
        .single()

      const customer = job?.customer as { name?: string; email?: string } | undefined
      if (customer?.email) {
        await sendQuotationEmail({
          to: customer.email,
          customerName: customer.name ?? 'Valued Customer',
          jobNumber: job?.job_number ?? '',
          quotationNumber: data.quotation_number,
          items: data.items ?? [],
          subtotal: data.subtotal,
          discount: data.discount,
          vat_amount: data.vat_amount,
          total: data.total,
          validDays: data.valid_days,
          notes: data.notes,
        })
      }
    } catch (emailErr) {
      // Non-fatal: quotation is already sent, log but don't fail the response
      console.error('Quotation email error:', emailErr)
    }
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
