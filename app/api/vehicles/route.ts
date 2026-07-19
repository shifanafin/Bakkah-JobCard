import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q') ?? ''
  const sb = createServiceClient()

  let query = sb
    .from('vehicles')
    .select('id, plate_number, make, model, year, color, vin, customer_id, created_at, customer:customers(id, name, phone)')
    .order('created_at', { ascending: false })
    .limit(500)

  if (q.length >= 2) {
    query = query.or(`plate_number.ilike.%${q}%,make.ilike.%${q}%,model.ilike.%${q}%,vin.ilike.%${q}%`)
  }

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ vehicles: data ?? [] })
}
