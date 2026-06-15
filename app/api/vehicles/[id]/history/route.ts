import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { getServerSession } from '@/lib/server-session'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Require authentication for staff vehicle history
  const session = await getServerSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const sb = createServiceClient()

  // Get vehicle details
  const { data: vehicle, error: vErr } = await sb
    .from('vehicles')
    .select('*, customer:customers(id, name, phone, email, company_name, emirates_id, is_fleet, notes, created_at)')
    .eq('id', id)
    .maybeSingle()

  if (vErr || !vehicle) {
    return NextResponse.json({ error: 'Vehicle not found' }, { status: 404 })
  }

  // Get all job cards for this vehicle with full details
  const { data: jobs, error: jErr } = await sb
    .from('job_cards')
    .select(`
      id, job_number, status, job_type, date_in, date_out, date_delivered,
      mileage_in, mileage_out, customer_complaint, work_instructions, internal_notes,
      subtotal, vat_amount, discount, total,
      payment_status, payment_method, created_at, updated_at,
      technician:technicians(id, name, role, phone),
      services:job_card_services(id, description, quantity, unit_price, total_price, completed),
      parts:job_card_parts(id, part_name, part_number, quantity, unit_price, total_price),
      photos:job_card_photos(id, cloudinary_url, cloudinary_id, category, caption, taken_by, sort_order, created_at),
      history:job_card_history(id, old_status, new_status, changed_by, notes, created_at)
    `)
    .eq('vehicle_id', id)
    .order('created_at', { ascending: false })

  if (jErr) {
    return NextResponse.json({ error: 'Failed to fetch job history' }, { status: 500 })
  }

  // Sort history entries within each job by created_at asc
  const jobsWithSortedHistory = (jobs ?? []).map(job => ({
    ...job,
    history: (job.history ?? []).sort(
      (a: { created_at: string }, b: { created_at: string }) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    ),
  }))

  const totalSpend = (jobs ?? []).reduce((sum, j) => sum + (j.total || 0), 0)
  const visitCount = (jobs ?? []).length

  return NextResponse.json({ vehicle, jobs: jobsWithSortedHistory, totalSpend, visitCount })
}
