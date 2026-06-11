import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/server-session'
import { createClient } from '@/lib/supabase/server'
import { checkVehicleRTA } from '@/lib/services/rta'

export async function POST(req: NextRequest) {
  const session = await getServerSession()
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { job_card_id, plate_number, emirate = 'Dubai', plate_code, manual } = body

  if (!job_card_id || !plate_number) {
    return NextResponse.json({ error: 'job_card_id and plate_number are required' }, { status: 400 })
  }

  const sb = await createClient()

  // ── Manual entry: save without calling APIs ──────────────
  if (manual) {
    const {
      fines_count, fines_total_aed, fines,
      salik_tag_number, salik_balance_aed, salik_transactions,
      mulkiya_expiry, mulkiya_status, registration_number, owner_name, owner_phone,
      insurance_expiry, insurance_status, insurance_company, insurance_policy,
      inspection_expiry, inspection_status, inspection_center,
      include_in_invoice, notes,
    } = body

    const { data, error } = await sb.from('vehicle_rta_checks').upsert({
      job_card_id,
      plate_number,
      plate_code: plate_code ?? null,
      emirate,
      fines_count:       fines_count ?? 0,
      fines_total_aed:   fines_total_aed ?? 0,
      fines:             fines ?? [],
      salik_tag_number:  salik_tag_number ?? null,
      salik_balance_aed: salik_balance_aed ?? null,
      salik_transactions: salik_transactions ?? [],
      mulkiya_expiry:    mulkiya_expiry ?? null,
      mulkiya_status:    mulkiya_status ?? 'unknown',
      registration_number: registration_number ?? null,
      owner_name:        owner_name ?? null,
      owner_phone:       owner_phone ?? null,
      insurance_expiry:  insurance_expiry ?? null,
      insurance_status:  insurance_status ?? 'unknown',
      insurance_company: insurance_company ?? null,
      insurance_policy:  insurance_policy ?? null,
      inspection_expiry: inspection_expiry ?? null,
      inspection_status: inspection_status ?? 'unknown',
      inspection_center: inspection_center ?? null,
      include_in_invoice: include_in_invoice ?? true,
      notes:             notes ?? null,
      data_source:       'manual',
      checked_by:        (session.user as { id?: string })?.id ?? null,
    }, { onConflict: 'job_card_id' }).select().single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ data, source: 'manual' })
  }

  // ── API lookup: call UAE government APIs ─────────────────
  let rtaResult
  try {
    rtaResult = await checkVehicleRTA(plate_number, emirate)
  } catch (err) {
    return NextResponse.json({ error: 'RTA API call failed', detail: String(err) }, { status: 502 })
  }

  // Persist result
  const { data, error } = await sb.from('vehicle_rta_checks').upsert({
    job_card_id,
    plate_number,
    plate_code: plate_code ?? null,
    emirate,
    fines_count:       rtaResult.fines.count,
    fines_total_aed:   rtaResult.fines.total_aed,
    fines:             rtaResult.fines.items,
    salik_tag_number:  rtaResult.salik.tag_number ?? null,
    salik_balance_aed: rtaResult.salik.balance_aed ?? null,
    salik_transactions: rtaResult.salik.transactions,
    mulkiya_expiry:    rtaResult.registration.expiry_date ?? null,
    mulkiya_status:    rtaResult.registration.status,
    registration_number: rtaResult.registration.registration_number ?? null,
    owner_name:        rtaResult.registration.owner_name ?? null,
    owner_phone:       rtaResult.registration.owner_phone ?? null,
    insurance_expiry:  rtaResult.insurance.expiry_date ?? null,
    insurance_status:  rtaResult.insurance.status,
    insurance_company: rtaResult.insurance.company ?? null,
    insurance_policy:  rtaResult.insurance.policy_number ?? null,
    inspection_expiry: rtaResult.inspection.expiry_date ?? null,
    inspection_status: rtaResult.inspection.status,
    inspection_center: rtaResult.inspection.center ?? null,
    include_in_invoice: true,
    data_source:       rtaResult.data_source,
    checked_by:        (session.user as { id?: string })?.id ?? null,
    raw_api_response:  rtaResult,
  }, { onConflict: 'job_card_id' }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data, rta: rtaResult, source: rtaResult.data_source })
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const job_card_id = searchParams.get('job_card_id')
  if (!job_card_id) return NextResponse.json({ error: 'job_card_id required' }, { status: 400 })

  const sb = await createClient()
  const { data, error } = await sb
    .from('vehicle_rta_checks')
    .select('*')
    .eq('job_card_id', job_card_id)
    .maybeSingle()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { job_card_id, include_in_invoice, notes } = body
  if (!job_card_id) return NextResponse.json({ error: 'job_card_id required' }, { status: 400 })

  const sb = await createClient()
  const { data, error } = await sb
    .from('vehicle_rta_checks')
    .update({ include_in_invoice, notes, updated_at: new Date().toISOString() })
    .eq('job_card_id', job_card_id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}
