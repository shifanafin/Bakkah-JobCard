import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { sendStatusUpdateEmail } from '@/lib/email'
import { JOB_STATUS_LABEL } from '@/types'

type Params = { params: Promise<{ id: string }> }

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const sb = createServiceClient()

    const { data: job, error } = await sb
      .from('job_cards')
      .select(`
        id, job_number, status,
        customer:customers(id, name, email, phone),
        vehicle:vehicles(plate_number, make, model)
      `)
      .eq('id', id)
      .single()

    if (error || !job) {
      return NextResponse.json({ error: 'Job card not found' }, { status: 404 })
    }

    const customer = job.customer as unknown as { name: string; email: string | null; phone: string | null } | null
    if (!customer?.email) {
      return NextResponse.json({ error: 'Customer has no email address on file' }, { status: 400 })
    }

    const vehicle = job.vehicle as unknown as { plate_number: string; make: string; model: string } | null
    const vehiclePlate = vehicle?.plate_number ?? ''
    const vehicleName = vehicle ? `${vehicle.make} ${vehicle.model}`.trim() : 'Vehicle'
    const statusLabel = JOB_STATUS_LABEL[job.status as keyof typeof JOB_STATUS_LABEL] ?? job.status

    await sendStatusUpdateEmail({
      to: customer.email,
      customerName: customer.name,
      jobNumber: job.job_number,
      jobId: id,
      vehiclePlate,
      vehicleName,
      statusLabel,
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to send notification'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
