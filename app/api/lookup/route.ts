import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'

// GET /api/lookup?phone=+971... OR /api/lookup?plate=ABC1234
export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const phone = searchParams.get('phone')?.trim()
  const plate = searchParams.get('plate')?.trim()

  const sb = createServiceClient()

  if (phone) {
    const digits = phone.replace(/\D/g, '')
    const { data } = await sb
      .from('customers')
      .select('id, name, phone, email, company_name, is_fleet, emirates_id, notes')
      .or(`phone.ilike.%${digits.slice(-9)}%,phone.ilike.%${phone}%`)
      .limit(1)
      .maybeSingle()

    return NextResponse.json({ customer: data ?? null })
  }

  if (plate) {
    const normalizedPlate = plate.toUpperCase().replace(/\s+/g, '')
    const { data: vehicle } = await sb
      .from('vehicles')
      .select('id, plate_number, make, model, year, color, vin, customer_id, customer:customers(id, name, phone, email, company_name, is_fleet, notes)')
      .ilike('plate_number', normalizedPlate)
      .maybeSingle()

    if (!vehicle) return NextResponse.json({ vehicle: null })

    // Get visit count
    const { count } = await sb
      .from('job_cards')
      .select('id', { count: 'exact', head: true })
      .eq('vehicle_id', vehicle.id)

    return NextResponse.json({ vehicle, visitCount: count ?? 0 })
  }

  return NextResponse.json({ error: 'Provide phone or plate' }, { status: 400 })
}
