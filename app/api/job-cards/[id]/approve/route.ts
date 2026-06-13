import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { createProformaForJob } from '@/app/api/proforma-invoices/route'

type Params = { params: Promise<{ id: string }> }

// POST /api/job-cards/[id]/approve
// Admin/supervisor approves a job that is waiting_for_approval.
// Also auto-creates a proforma invoice from the approved quotation.
export async function POST(req: NextRequest, { params }: Params) {
  try {
    const session = await auth.api.getSession({ headers: await headers() })
    const role = (session?.user as { role?: string })?.role
    const userName = (session?.user as { name?: string })?.name

    if (!session || (role !== 'admin' && role !== 'supervisor')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { id } = await params
    const sb = createServiceClient()

    const { data: job } = await sb
      .from('job_cards')
      .select('id, status, technician_id')
      .eq('id', id)
      .single()

    if (!job) return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    if (job.status !== 'waiting_for_approval') {
      return NextResponse.json({ error: 'Job is not waiting for approval' }, { status: 400 })
    }

    const newStatus = job.technician_id ? 'assigned' : 'pending'

    await sb.from('job_cards').update({
      status: newStatus,
      updated_at: new Date().toISOString(),
    }).eq('id', id)

    await sb.from('job_card_history').insert({
      job_card_id: id,
      old_status: 'waiting_for_approval',
      new_status: newStatus,
      changed_by: userName ?? 'Staff',
      notes: 'Job approved — work authorized',
    })

    // Find approved quotation and create proforma
    const { data: qt } = await sb
      .from('quotations')
      .select('id')
      .eq('job_card_id', id)
      .eq('status', 'approved')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    let proformaId: string | null = null
    try {
      const result = await createProformaForJob(id, qt?.id ?? null)
      proformaId = (result.proforma as { id: string })?.id ?? null
    } catch {
      // Non-fatal — proforma creation failed but job is approved
    }

    const body = await req.json().catch(() => ({}))
    void body

    return NextResponse.json({ success: true, new_status: newStatus, proforma_id: proformaId })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Failed' }, { status: 500 })
  }
}
