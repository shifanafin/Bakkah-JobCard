import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { getServerSession } from '@/lib/server-session'

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession()
    const role = session?.user?.role
    if (!session || (role !== 'admin' && role !== 'supervisor')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const body = await req.json()
    const { job_number, payment_status, payment_method } = body

    if (!job_number) return NextResponse.json({ error: 'Job number is required' }, { status: 400 })
    if (!['paid', 'partial', 'unpaid'].includes(payment_status)) {
      return NextResponse.json({ error: 'Payment status must be paid, partial, or unpaid' }, { status: 400 })
    }

    const sb = createServiceClient()
    const { data: job } = await sb.from('job_cards').select('id').eq('job_number', job_number).maybeSingle()
    if (!job) return NextResponse.json({ error: `Job card ${job_number} not found` }, { status: 404 })

    const updates: Record<string, unknown> = {
      payment_status,
      updated_at: new Date().toISOString(),
    }
    if (payment_method) updates.payment_method = payment_method

    const { error } = await sb.from('job_cards').update(updates).eq('id', job.id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Failed' }, { status: 500 })
  }
}
