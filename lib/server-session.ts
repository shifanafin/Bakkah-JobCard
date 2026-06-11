import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { randomUUID } from 'crypto'

export const SESSION_COOKIE = 'better-auth.session_token'
const SESSION_DAYS = 7

function sb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )
}

export type SessionUser = {
  id:         string
  email:      string
  name:       string
  role:       string
  username:   string | null
  avatar_url: string | null
}

/** Read the session from the cookie and look it up in ba_session via Supabase. */
export async function getServerSession(): Promise<{ user: SessionUser; sessionId: string } | null> {
  const store = await cookies()
  const token = store.get(SESSION_COOKIE)?.value
  if (!token) return null

  const { data } = await sb()
    .from('ba_session')
    .select('id, expires_at, users(id, email, name, role, username, avatar_url)')
    .eq('token', token)
    .gt('expires_at', new Date().toISOString())
    .maybeSingle()

  if (!data?.users) return null
  return { user: data.users as unknown as SessionUser, sessionId: data.id }
}

/** Insert a new row into ba_session and return the token. */
export async function createServerSession(
  userId:    string,
  userAgent: string | null = null,
  ip:        string | null = null,
): Promise<{ token: string; expiresAt: string }> {
  const token     = randomUUID()
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 86_400_000).toISOString()
  const now       = new Date().toISOString()

  await sb().from('ba_session').insert({
    id:         randomUUID(),
    token,
    user_id:    userId,
    expires_at: expiresAt,
    user_agent: userAgent,
    ip_address: ip,
    created_at: now,
    updated_at: now,
  })

  return { token, expiresAt }
}

/** Delete a session by its token. */
export async function deleteServerSession(token: string) {
  await sb().from('ba_session').delete().eq('token', token)
}

/** Attach the session cookie to a NextResponse. */
export function setSessionCookie(res: NextResponse, token: string, expiresAt: string) {
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    path:     '/',
    expires:  new Date(expiresAt),
  })
}

/** Expire the session cookie on a NextResponse. */
export function clearSessionCookie(res: NextResponse) {
  res.cookies.set(SESSION_COOKIE, '', { httpOnly: true, sameSite: 'lax', path: '/', maxAge: 0 })
}
