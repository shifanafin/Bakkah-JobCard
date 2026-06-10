import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'

export const runtime = 'nodejs'

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { currentPassword, newPassword } = await req.json()

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: 'Both current and new passwords are required' }, { status: 400 })
    }
    if (newPassword.length < 6) {
      return NextResponse.json({ error: 'New password must be at least 6 characters' }, { status: 400 })
    }

    const sb = adminClient()

    // Fetch the credential account for this user
    const { data: account, error } = await sb
      .from('ba_account')
      .select('id, password')
      .eq('user_id', session.user.id)
      .eq('provider_id', 'credential')
      .single()

    if (error || !account) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const valid = await bcrypt.compare(currentPassword, account.password)
    if (!valid) {
      return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 })
    }

    const newHash = await bcrypt.hash(newPassword, 10)
    const now = new Date().toISOString()

    const { error: updateError } = await sb
      .from('ba_account')
      .update({ password: newHash, updated_at: now })
      .eq('id', account.id)

    if (updateError) {
      console.error('[change-password] update error:', updateError.message)
      return NextResponse.json({ error: 'Failed to update password' }, { status: 500 })
    }

    // Keep users.password_hash in sync for any legacy code
    await sb.from('users').update({ password_hash: newHash, updated_at: now }).eq('id', session.user.id)

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('[change-password] error:', e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
