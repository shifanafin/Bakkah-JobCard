import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { getServerSession } from '@/lib/server-session'

export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const all = url.searchParams.get('all') === '1'
  const categoryId = url.searchParams.get('category_id')
  const sb = createServiceClient()

  let query = sb
    .from('services')
    .select('id, name, description, default_price, category, category_id, active, sort_order')
    .order('sort_order', { ascending: true })
    .order('name', { ascending: true })

  if (!all) query = query.eq('active', true)
  if (categoryId) query = query.eq('category_id', categoryId)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ services: data ?? [] })
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession()
    const role = session?.user?.role
    if (!session || (role !== 'admin' && role !== 'supervisor')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const body = await req.json()
    if (!body.name?.trim()) return NextResponse.json({ error: 'Name is required' }, { status: 400 })

    const sb = createServiceClient()
    const { data, error } = await sb.from('services').insert({
      name: body.name.trim(),
      description: body.description?.trim() || null,
      default_price: parseFloat(body.default_price) || 0,
      category: body.category?.trim() || 'general',
      category_id: body.category_id || null,
      sort_order: parseInt(body.sort_order) || 0,
    }).select().single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ service: data }, { status: 201 })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Failed' }, { status: 500 })
  }
}
