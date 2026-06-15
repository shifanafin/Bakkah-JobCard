import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { getServerSession } from '@/lib/server-session'
import { createTaxInvoiceForJob } from '@/app/api/tax-invoices/route'

type Params = { params: Promise<{ id: string }> }

// PATCH /api/job-cards/[id]/status
// Body: { status: JobStatus, changed_by?: string }
// On delivery: auto-creates a draft tax invoice.
export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession()
    const role = session?.user?.role
    const userId = session?.user?.id

    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

    const { id } = await params
    const body = await req.json()
    const { status: newStatus, changed_by } = body

    if (!newStatus) return NextResponse.json({ error: 'status required' }, { status: 400 })

    const sb = createServiceClient()

    // Technicians can only advance their own jobs
    if (role === 'technician') {
      const { data: job } = await sb.from('job_cards').select('technician_id').eq('id', id).single()
      if (!job || job.technician_id !== userId) {
        return NextResponse.json({ error: 'Not your job' }, { status: 403 })
      }
    }

    const { data: cur } = await sb.from('job_cards').select('status').eq('id', id).single()
    if (!cur) return NextResponse.json({ error: 'Job not found' }, { status: 404 })

    const updatePayload: Record<string, unknown> = {
      status: newStatus,
      updated_at: new Date().toISOString(),
    }
    if (newStatus === 'delivered') updatePayload.date_delivered = new Date().toISOString()

    await sb.from('job_cards').update(updatePayload).eq('id', id)
    await sb.from('job_card_history').insert({
      job_card_id: id,
      old_status: cur.status,
      new_status: newStatus,
      changed_by: changed_by ?? null,
    })

    // Auto-create draft tax invoice when job is delivered
    if (newStatus === 'delivered') {
      try {
        await createTaxInvoiceForJob(id)
      } catch {
        // Non-fatal — job status update succeeded
      }
    }

    return NextResponse.json({ success: true, new_status: newStatus })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Failed' }, { status: 500 })
  }
}
