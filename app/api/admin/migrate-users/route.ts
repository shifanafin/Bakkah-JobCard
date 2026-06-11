import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getServerSession } from '@/lib/server-session'
import { randomUUID } from 'crypto'

export const runtime = 'nodejs'

function serviceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )
}

// POST — backfill ba_account entries for users that are missing them.
// Admin-only. Safe to run multiple times (idempotent).
export async function POST() {
  try {
    const session = await getServerSession()
    if (!session?.user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }
    if ((session.user as { role?: string }).role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const sb = serviceClient()

    // Fetch all users with a password_hash
    const { data: users, error: usersError } = await sb
      .from('users')
      .select('id, email, password_hash, created_at')
      .not('password_hash', 'is', null)

    if (usersError) {
      console.error('[migrate-users] fetch users error:', usersError.message)
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
    }

    if (!users?.length) {
      return NextResponse.json({ ok: true, migrated: 0, message: 'No users to migrate' })
    }

    // Fetch all existing credential accounts
    const { data: existingAccounts } = await sb
      .from('ba_account')
      .select('user_id')
      .eq('provider_id', 'credential')

    const coveredUserIds = new Set((existingAccounts ?? []).map(a => a.user_id))

    const missing = users.filter(u => !coveredUserIds.has(u.id))

    if (!missing.length) {
      return NextResponse.json({ ok: true, migrated: 0, message: 'All users already have credentials' })
    }

    const now = new Date().toISOString()
    const inserts = missing.map(u => ({
      id: randomUUID(),
      account_id: u.id,
      provider_id: 'credential',
      user_id: u.id,
      password: u.password_hash,
      created_at: u.created_at ?? now,
      updated_at: now,
    }))

    const { error: insertError } = await sb.from('ba_account').insert(inserts)

    if (insertError) {
      console.error('[migrate-users] insert error:', insertError.message)
      return NextResponse.json({ error: 'Migration failed: ' + insertError.message }, { status: 500 })
    }

    return NextResponse.json({
      ok: true,
      migrated: inserts.length,
      message: `Migrated ${inserts.length} user(s) successfully`,
    })
  } catch (e) {
    console.error('[migrate-users] error:', e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
