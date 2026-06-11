import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'
import { createServerSession, setSessionCookie } from '@/lib/server-session'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json()
    if (!email || !password) {
      return NextResponse.json({ message: 'Email and password are required' }, { status: 400 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } }
    )

    const { data: user } = await supabase
      .from('users')
      .select('id, email, name, role, username, avatar_url')
      .eq('email', email.trim().toLowerCase())
      .eq('active', true)
      .maybeSingle()

    if (!user) {
      return NextResponse.json({ message: 'Invalid email or password' }, { status: 401 })
    }

    const { data: account } = await supabase
      .from('ba_account')
      .select('password')
      .eq('user_id', user.id)
      .eq('provider_id', 'credential')
      .maybeSingle()

    if (!account?.password) {
      return NextResponse.json({ message: 'Invalid email or password' }, { status: 401 })
    }

    const valid = await bcrypt.compare(password, account.password)
    if (!valid) {
      return NextResponse.json({ message: 'Invalid email or password' }, { status: 401 })
    }

    const { token, expiresAt } = await createServerSession(
      user.id,
      req.headers.get('user-agent'),
      req.headers.get('x-forwarded-for'),
    )

    const res = NextResponse.json({
      user,
      session: { userId: user.id, expiresAt },
      token,
    })
    setSessionCookie(res, token, expiresAt)
    return res

  } catch (e) {
    console.error('[sign-in/email]', e)
    return NextResponse.json({ message: 'Server error' }, { status: 500 })
  }
}
