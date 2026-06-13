import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { getServerSession } from '@/lib/server-session'

function requireAdminOrSupervisor(role?: string) {
  return role === 'admin' || role === 'supervisor'
}

// GET — list all categories (with their services)
export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const withServices = url.searchParams.get('with_services') === '1'
  const sb = createServiceClient()

  const { data: cats, error } = await sb
    .from('service_categories')
    .select('id, name, description, sort_order, active')
    .order('sort_order', { ascending: true })
    .order('name', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  if (!withServices) return NextResponse.json({ categories: cats ?? [] })

  // Also fetch services grouped by category
  const { data: services } = await sb
    .from('services')
    .select('id, name, description, default_price, category_id, active, sort_order')
    .order('sort_order', { ascending: true })
    .order('name', { ascending: true })

  const svcByCategory: Record<string, typeof services> = {}
  for (const s of services ?? []) {
    const key = s.category_id ?? '__uncategorised__'
    if (!svcByCategory[key]) svcByCategory[key] = []
    svcByCategory[key]!.push(s)
  }

  const result = (cats ?? []).map(c => ({
    ...c,
    services: svcByCategory[c.id] ?? [],
  }))

  // Append uncategorised services if any
  if (svcByCategory['__uncategorised__']?.length) {
    result.push({
      id: '__uncategorised__',
      name: 'Uncategorised',
      description: null,
      sort_order: 9999,
      active: true,
      services: svcByCategory['__uncategorised__'],
    })
  }

  return NextResponse.json({ categories: result })
}

// POST — create a new category
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession()
    if (!requireAdminOrSupervisor(session?.user?.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const body = await req.json()
    if (!body.name?.trim()) return NextResponse.json({ error: 'Name is required' }, { status: 400 })

    const sb = createServiceClient()
    const { data, error } = await sb.from('service_categories').insert({
      name: body.name.trim(),
      description: body.description?.trim() || null,
      sort_order: parseInt(body.sort_order) || 0,
    }).select().single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ category: data }, { status: 201 })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Failed' }, { status: 500 })
  }
}

// PATCH — update a category
export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession()
    if (!requireAdminOrSupervisor(session?.user?.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const body = await req.json()
    const { id, ...fields } = body
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

    const updates: Record<string, unknown> = {}
    if (fields.name !== undefined) updates.name = fields.name.trim()
    if (fields.description !== undefined) updates.description = fields.description?.trim() || null
    if (fields.sort_order !== undefined) updates.sort_order = parseInt(fields.sort_order) || 0
    if (fields.active !== undefined) updates.active = fields.active

    const sb = createServiceClient()
    const { data, error } = await sb.from('service_categories').update(updates).eq('id', id).select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ category: data })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Failed' }, { status: 500 })
  }
}

// DELETE — delete a category (services become uncategorised)
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession()
    if (!requireAdminOrSupervisor(session?.user?.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { id } = await req.json()
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

    const sb = createServiceClient()

    // Null out category_id on all services in this category
    await sb.from('services').update({ category_id: null }).eq('category_id', id)

    // Delete the category
    const { error } = await sb.from('service_categories').delete().eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Failed' }, { status: 500 })
  }
}
