import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { getServerSession } from '@/lib/server-session'

type Params = { params: Promise<{ id: string }> }

async function requireAuth() {
  const session = await getServerSession()
  const role = session?.user?.role
  if (!session || (role !== 'admin' && role !== 'supervisor')) return null
  return session
}

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    if (!await requireAuth()) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    const { id } = await params
    const body = await req.json()
    const sb = createServiceClient()

    const updates: Record<string, unknown> = {}
    if (body.name !== undefined) updates.name = body.name.trim()
    if (body.active !== undefined) updates.active = body.active
    if (body.sort_order !== undefined) updates.sort_order = parseInt(body.sort_order) || 0

    const { data, error } = await sb.from('job_types').update(updates).eq('id', id).select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ job_type: data })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Failed' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    if (!await requireAuth()) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    const { id } = await params
    const sb = createServiceClient()
    const { error } = await sb.from('job_types').delete().eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Failed' }, { status: 500 })
  }
}
