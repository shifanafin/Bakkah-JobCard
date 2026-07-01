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

async function requireAdmin() {
  const session = await getServerSession()
  if (!session?.user?.id) return null
  const role = (session.user as { role?: string }).role
  if (role !== 'admin' && role !== 'supervisor') return null
  return session
}

// GET — list all leave requests, optionally filtered by status
export async function GET(req: NextRequest) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const url = new URL(req.url)
  const status = url.searchParams.get('status')

  const sb = getSb()
  let query = sb
    .from('leave_requests')
    .select('id, user_id, user_name, type, from_date, to_date, reason, status, admin_note, reviewed_by, created_at, updated_at')
    .order('created_at', { ascending: false })

  if (status) query = query.eq('status', status)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ requests: data ?? [] })
}

// PATCH — approve or reject a leave request
export async function PATCH(req: NextRequest) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()
  const { id, status, admin_note } = body

  if (!id || !status) return NextResponse.json({ error: 'id and status required' }, { status: 400 })
  if (!['approved', 'rejected'].includes(status)) {
    return NextResponse.json({ error: 'status must be approved or rejected' }, { status: 400 })
  }

  const sb = getSb()
  const { data, error } = await sb
    .from('leave_requests')
    .update({
      status,
      admin_note: admin_note ?? null,
      reviewed_by: session.user.id,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ request: data })
}
