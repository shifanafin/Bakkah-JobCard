import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'

const SELECT_JOB = `
  id, job_number, status, job_type, date_in, date_out, date_delivered,
  mileage_in, mileage_out, customer_complaint,
  subtotal, vat_amount, discount, total,
  payment_status, payment_method, created_at, updated_at,
  customer:customers(id, name, phone, email, company_name, is_fleet),
  vehicle:vehicles(id, plate_number, make, model, color, year, vin),
  technician:technicians(name, role),
  services:job_card_services(id, description, quantity, unit_price, total_price, completed),
  parts:job_card_parts(id, part_name, part_number, quantity, unit_price, total_price),
  photos:job_card_photos(id, cloudinary_url, category, caption, sort_order, created_at)
`

function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, '')
  if (digits.startsWith('971')) return digits
  if (digits.startsWith('0') && digits.length === 10) return `971${digits.slice(1)}`
  if (digits.length === 9) return `971${digits}`
  return digits
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const phone = searchParams.get('phone')?.trim()
  const plate = searchParams.get('plate')?.trim()
  const jobNumber = searchParams.get('job_number')?.trim()

  const sb = createServiceClient()

  // ── Search by Job Number ─────────────────────────────────────
  if (jobNumber) {
    const { data, error } = await sb
      .from('job_cards')
      .select(SELECT_JOB)
      .ilike('job_number', jobNumber)
      .limit(1)
      .maybeSingle()

    if (error) return NextResponse.json({ error: 'Database error' }, { status: 500 })
    if (!data) return NextResponse.json({ error: 'Job card not found' }, { status: 404 })

    return NextResponse.json({ mode: 'job', current: data, history: [] })
  }

  // ── Search by Mobile + Plate ─────────────────────────────────
  if (phone && plate) {
    const normalizedPlate = plate.toUpperCase().replace(/\s+/g, '')
    const normalizedPhone = normalizePhone(phone)

    // Find vehicle by plate
    const { data: vehicle } = await sb
      .from('vehicles')
      .select('id, customer_id')
      .ilike('plate_number', normalizedPlate)
      .maybeSingle()

    if (!vehicle) {
      return NextResponse.json({ error: 'No records found for this vehicle plate. Please check and try again.' }, { status: 404 })
    }

    // Verify customer phone
    const { data: customer } = await sb
      .from('customers')
      .select('id, phone')
      .eq('id', vehicle.customer_id)
      .maybeSingle()

    if (!customer) {
      return NextResponse.json({ error: 'Customer record not found.' }, { status: 404 })
    }

    const storedPhone = normalizePhone(customer.phone)
    // Match last 9 digits to handle country-code variations
    if (!storedPhone.endsWith(normalizedPhone.slice(-9))) {
      return NextResponse.json({ error: 'The mobile number does not match our records for this vehicle.' }, { status: 404 })
    }

    // Fetch all job cards for this vehicle
    const { data: jobs, error } = await sb
      .from('job_cards')
      .select(SELECT_JOB)
      .eq('vehicle_id', vehicle.id)
      .order('created_at', { ascending: false })

    if (error) return NextResponse.json({ error: 'Failed to fetch records' }, { status: 500 })
    if (!jobs || jobs.length === 0) {
      return NextResponse.json({ error: 'No job cards found for this vehicle.' }, { status: 404 })
    }

    const activeStatuses = ['pending', 'assigned', 'received', 'in_progress', 'qc_check', 'ready']
    const current = jobs.find(j => activeStatuses.includes(j.status)) ?? jobs[0]
    const history = jobs

    return NextResponse.json({ mode: 'vehicle', current, history })
  }

  return NextResponse.json({ error: 'Provide job_number or both phone and plate.' }, { status: 400 })
}
