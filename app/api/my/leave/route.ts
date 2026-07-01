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
