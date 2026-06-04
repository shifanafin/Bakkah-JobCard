import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'

export const runtime = 'nodejs'

export async function GET() {
  const results: Record<string, unknown> = {}

  // 1. Check env vars
  results.env = {
    supabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    serviceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    authSecret: !!process.env.AUTH_SECRET,
  }

  try {
    const sb = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } }
    )

    // 2. Can we reach the users table?
    const { data, error } = await sb
      .from('users')
      .select('id, email, username, active, password_hash')
      .eq('email', 'shifana@gmail.com')
      .single()

    if (error) {
      results.db = { ok: false, error: error.message, code: error.code }
    } else {
      // 3. Does bcrypt match?
      const valid = await bcrypt.compare('12345678', data.password_hash)
      results.db = { ok: true, userFound: true, usernameColumn: data.username ?? 'NULL — run migration 002', active: data.active }
      results.bcrypt = { passwordMatch: valid }
    }
  } catch (e: unknown) {
    results.exception = e instanceof Error ? e.message : String(e)
  }

  return NextResponse.json(results, { status: 200 })
}
