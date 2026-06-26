import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'

function normalizePhone(raw: string): string {
  const d = raw.replace(/\D/g, '')
  if (!d) return raw
  if (d.startsWith('971') && d.length === 12) return `+${d}`
  if (d.startsWith('0') && d.length === 10) return `+971${d.slice(1)}`
  if (d.length === 9 && /^[2-9]/.test(d)) return `+971${d}`
  return raw.startsWith('+') ? raw : `+${d}`
}

export async function GET(req: NextRequest) {
  const phone = req.nextUrl.searchParams.get('phone')
  if (!phone) return NextResponse.json({ error: 'phone required' }, { status: 400 })

  const normalized = normalizePhone(phone.trim())
  const sb = createServiceClient()

  // Check if customer exists
  const { data: customer } = await sb
    .from('customers')
    .select('id')
    .eq('phone', normalized)
    .maybeSingle()

  const isNew = !customer

  // Fetch the first active promotion (admin-managed)
  const { data: promo } = await sb
    .from('promotions')
    .select('code, name, description, discount_pct, free_service, terms')
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  return NextResponse.json({
    is_new: isNew,
    promotion: (isNew && promo) ? promo : null,
  })
}
