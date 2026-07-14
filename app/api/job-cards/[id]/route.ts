import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { getServerSession } from '@/lib/server-session'

type Params = { params: Promise<{ id: string }> }

// PATCH /api/job-cards/[id]
export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

    const { id } = await params
    const body = await req.json()
    const sb = createServiceClient()

    const { data: job, error: fetchErr } = await sb
      .from('job_cards')
      .select('id, status, customer_id, vehicle_id')
      .eq('id', id)
      .single()

    if (fetchErr || !job) return NextResponse.json({ error: 'Job card not found' }, { status: 404 })
    if (job.status === 'delivered') return NextResponse.json({ error: 'Cannot edit a delivered job' }, { status: 400 })

    const { customer, vehicle, ...jobFields } = body

    if (customer && job.customer_id) {
      await sb.from('customers').update(customer).eq('id', job.customer_id)
    }

    if (vehicle && job.vehicle_id) {
      await sb.from('vehicles').update(vehicle).eq('id', job.vehicle_id)
    }

    const allowedJobFields = ['job_type', 'date_in', 'date_out', 'mileage_in', 'customer_complaint', 'work_instructions']
    const jobUpdate: Record<string, unknown> = {}
    for (const key of allowedJobFields) {
      if (key in jobFields) jobUpdate[key] = jobFields[key]
    }

    if (Object.keys(jobUpdate).length > 0) {
      await sb.from('job_cards').update(jobUpdate).eq('id', id)
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Update failed' },
      { status: 500 }
    )
  }
}

// DELETE /api/job-cards/[id]
// Admin/supervisor only. Soft-deletes — sets deleted_at, hidden from lists immediately,
// permanently purged after 30 days by the scheduled purge_soft_deleted() job.
// Jobs that have progressed past pre-work statuses require status=cancelled first.
export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession()
    const role = session?.user?.role
    if (!session || (role !== 'admin' && role !== 'supervisor')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { id } = await params
    const sb = createServiceClient()

    // Fetch current job state
    const { data: job, error: fetchErr } = await sb
      .from('job_cards')
      .select('id, job_number, status')
      .eq('id', id)
      .single()

    if (fetchErr || !job) return NextResponse.json({ error: 'Job card not found' }, { status: 404 })

    // Only deletable before work actually starts, or if cancelled
    const deletableStatuses = ['inspection', 'waiting_for_approval', 'pending', 'assigned', 'received', 'cancelled']
    if (!deletableStatuses.includes(job.status)) {
      return NextResponse.json({
        error: `Cannot delete a job in "${job.status}" status. Cancel the job first.`,
      }, { status: 400 })
    }

    const { error } = await sb.from('job_cards').update({ deleted_at: new Date().toISOString() }).eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ success: true, job_number: job.job_number })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Delete failed' },
      { status: 500 }
    )
  }
}
