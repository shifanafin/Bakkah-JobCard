import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { getServerSession } from '@/lib/server-session'

type Params = { params: Promise<{ id: string }> }

// DELETE /api/job-cards/[id]
// Admin only. Hard-deletes a job card and all related records (via DB cascade).
// Jobs that have progressed past 'inspection' require status=cancelled first.
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

    // Only allow deleting inspection-stage or cancelled jobs (not in-progress work)
    const deletableStatuses = ['inspection', 'cancelled']
    if (!deletableStatuses.includes(job.status)) {
      return NextResponse.json({
        error: `Cannot delete a job in "${job.status}" status. Cancel the job first.`,
      }, { status: 400 })
    }

    // Delete related records (quotation items / quotations / photos / services / parts / history)
    // Most have ON DELETE CASCADE but we handle quotations manually for clarity
    await sb.from('quotation_items').delete()
      .in('quotation_id',
        (await sb.from('quotations').select('id').eq('job_card_id', id)).data?.map(q => q.id) ?? [])
    await sb.from('quotations').delete().eq('job_card_id', id)
    await sb.from('job_card_photos').delete().eq('job_card_id', id)
    await sb.from('job_card_services').delete().eq('job_card_id', id)
    await sb.from('job_card_parts').delete().eq('job_card_id', id)
    await sb.from('job_card_history').delete().eq('job_card_id', id)
    await sb.from('job_cards').delete().eq('id', id)

    return NextResponse.json({ success: true, job_number: job.job_number })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Delete failed' },
      { status: 500 }
    )
  }
}
