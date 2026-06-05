import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { auth } from '@/app/auth'

export const runtime = 'nodejs'

function getSb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )
}

// POST — submit feedback (public, no auth required)
export async function POST(req: NextRequest) {
  try {
    const { job_card_id, job_number, customer_name, rating, comment } = await req.json()
    if (!customer_name || !rating || rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Name and rating (1–5) are required' }, { status: 400 })
    }
    const sb = getSb()
    const { data, error } = await sb
      .from('customer_feedback')
      .insert({ job_card_id: job_card_id || null, job_number: job_number || null, customer_name, rating, comment: comment || null })
      .select('id')
      .single()
    if (error) throw error
    return NextResponse.json({ id: data.id }, { status: 201 })
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Failed to submit' }, { status: 500 })
  }
}

// GET — admin: all feedback; or public: approved only (via ?approved=true)
export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const approvedOnly = url.searchParams.get('approved') === 'true'

  if (!approvedOnly) {
    // Admin-only: require auth
    const session = await auth()
    const role = (session?.user as { role?: string })?.role
    if (role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const sb = getSb()
  let query = sb
    .from('customer_feedback')
    .select('id, job_number, customer_name, rating, comment, approved, created_at')
    .order('created_at', { ascending: false })

  if (approvedOnly) query = query.eq('approved', true)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ feedback: data ?? [] })
}

// PATCH — admin: approve or reject
export async function PATCH(req: NextRequest) {
  const session = await auth()
  const role = (session?.user as { role?: string })?.role
  if (role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id, approved } = await req.json()
  if (!id || typeof approved !== 'boolean') {
    return NextResponse.json({ error: 'id and approved required' }, { status: 400 })
  }

  const sb = getSb()
  const { error } = await sb.from('customer_feedback').update({ approved }).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

// DELETE — admin: remove feedback
export async function DELETE(req: NextRequest) {
  const session = await auth()
  const role = (session?.user as { role?: string })?.role
  if (role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await req.json()
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const sb = getSb()
  const { error } = await sb.from('customer_feedback').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
