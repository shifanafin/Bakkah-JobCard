import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/server-session'
import { createServiceClient } from '@/lib/supabase/service'

export async function GET(req: NextRequest) {
  const session = await getServerSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const filter = req.nextUrl.searchParams.get('filter') ?? 'all'
  const sb = createServiceClient()

  let query = sb
    .from('chat_notifications')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(200)

  if (filter === 'new') query = query.eq('is_read', false)
  else if (filter === 'converted') query = query.not('job_card_id', 'is', null)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json(data)
}
