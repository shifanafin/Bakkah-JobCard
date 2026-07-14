import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getServerSession } from '@/lib/server-session'

export const runtime = 'nodejs'

function getSb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )
}

// GET — list own leave requests
export async function GET() {
  const session = await getServerSession()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const sb = getSb()
  try {
    const { data, error } = await sb
      .from('leave_requests')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })
      .limit(20)

    if (error) throw error
    return NextResponse.json({ requests: data ?? [] })
  } catch {
    return NextResponse.json({ requests: [] })
  }
}

// POST — submit a leave request
export async function POST(req: NextRequest) {
  const session = await getServerSession()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { type, from_date, to_date, reason } = body

  if (!type || !from_date || !to_date) {
    return NextResponse.json({ error: 'type, from_date, and to_date are required' }, { status: 400 })
  }

  const sb = getSb()
  try {
    const { data, error } = await sb
      .from('leave_requests')
      .insert({
        user_id: session.user.id,
        user_name: session.user.name,
        type,
        from_date,
        to_date,
        reason: reason ?? null,
        status: 'pending',
      })
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ request: data }, { status: 201 })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to submit'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

// PATCH — edit own leave request while still pending
export async function PATCH(req: NextRequest) {
  const session = await getServerSession()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { id, type, from_date, to_date, reason } = body
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const sb = getSb()
  const { data: existing } = await sb.from('leave_requests').select('user_id, status').eq('id', id).single()
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (existing.user_id !== session.user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  if (existing.status !== 'pending') return NextResponse.json({ error: 'Only pending requests can be edited' }, { status: 409 })

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (type !== undefined) updates.type = type
  if (from_date !== undefined) updates.from_date = from_date
  if (to_date !== undefined) updates.to_date = to_date
  if (reason !== undefined) updates.reason = reason

  const { data, error } = await sb.from('leave_requests').update(updates).eq('id', id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ request: data })
}

// DELETE — remove own leave request while still pending
export async function DELETE(req: NextRequest) {
  const session = await getServerSession()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const url = new URL(req.url)
  const id = url.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const sb = getSb()
  const { data: existing } = await sb.from('leave_requests').select('user_id, status').eq('id', id).single()
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (existing.user_id !== session.user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  if (existing.status !== 'pending') return NextResponse.json({ error: 'Only pending requests can be deleted' }, { status: 409 })

  const { error } = await sb.from('leave_requests').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
