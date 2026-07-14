import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q') ?? ''
  const sb = createServiceClient()

  let query = sb
    .from('customers')
    .select('id, name, phone, email, company_name, is_fleet, notes, created_at')
    .is('deleted_at', null)
    .order('name')
    .limit(500)

  if (q.length >= 2) {
    query = query.or(`name.ilike.%${q}%,phone.ilike.%${q}%,company_name.ilike.%${q}%`)
  }

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ customers: data ?? [] })
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    if (!body.name?.trim()) return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    if (!body.phone?.trim()) return NextResponse.json({ error: 'Phone is required' }, { status: 400 })

    const sb = createServiceClient()
    const { data, error } = await sb.from('customers').insert({
      name: body.name.trim(),
      phone: body.phone.trim(),
      email: body.email?.trim() || null,
      company_name: body.company_name?.trim() || null,
      is_fleet: body.is_fleet ?? false,
      notes: body.notes?.trim() || null,
    }).select().single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ customer: data }, { status: 201 })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Failed' }, { status: 500 })
  }
}
