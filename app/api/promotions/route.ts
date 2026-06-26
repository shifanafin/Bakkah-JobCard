import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { getServerSession } from '@/lib/server-session'

export async function GET() {
  const sb = createServiceClient()
  const { data, error } = await sb
    .from('promotions')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ promotions: data ?? [] })
}

export async function POST(req: NextRequest) {
  const session = await getServerSession()
  if (!session || (session.user as { role?: string })?.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const body = await req.json()
  const { code, name, description, discount_pct, free_service, terms, is_active } = body

  if (!code?.trim() || !name?.trim()) {
    return NextResponse.json({ error: 'Code and name are required' }, { status: 400 })
  }

  const sb = createServiceClient()
  const { data, error } = await sb.from('promotions').insert({
    code: code.trim().toUpperCase(),
    name: name.trim(),
    description: description?.trim() || null,
    discount_pct: parseFloat(discount_pct) || 0,
    free_service: free_service?.trim() || null,
    terms: terms?.trim() || null,
    is_active: is_active ?? true,
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ promotion: data }, { status: 201 })
}
