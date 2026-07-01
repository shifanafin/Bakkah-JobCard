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

// GET — list own feedback (type: suggestion | complaint)
export async function GET(req: NextRequest) {
  const session = await getServerSession()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const url = new URL(req.url)
  const type = url.searchParams.get('type') // 'suggestion' | 'complaint' | null (all)
  const sb = getSb()

  try {
    let query = sb
      .from('employee_feedback')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })
      .limit(20)

    if (type) query = query.eq('type', type)

    const { data, error } = await query
    if (error) throw error
    return NextResponse.json({ items: data ?? [] })
  } catch {
    return NextResponse.json({ items: [] })
  }
}

// POST — submit suggestion or complaint
export async function POST(req: NextRequest) {
  const session = await getServerSession()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { type, subject, message } = body

  if (!type || !subject || !message) {
    return NextResponse.json({ error: 'type, subject, and message are required' }, { status: 400 })
  }
  if (!['suggestion', 'complaint'].includes(type)) {
    return NextResponse.json({ error: 'type must be suggestion or complaint' }, { status: 400 })
  }

  const sb = getSb()
  try {
    const { data, error } = await sb
      .from('employee_feedback')
      .insert({
        user_id: session.user.id,
        user_name: session.user.name,
        type,
        subject,
        body: message,
        status: 'open',
      })
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ item: data }, { status: 201 })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to submit'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
