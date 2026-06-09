/**
 * UAE RTA / MOI / Dubai Police Vehicle Check Service
 *
 * Aggregates data from three official UAE government sources:
 *   1. MOI Smart Services  — federal traffic fines
 *   2. Dubai Police API    — Dubai-issued traffic fines
 *   3. RTA Smart API       — vehicle registration (Mulkiya), Salik balance, inspection
 *
 * Each source requires separate API credentials obtained from the respective
 * authority. See RTA_API_GUIDE.md in the project root for registration steps.
 *
 * Configuration (set in .env.local):
 *   RTA_MOI_API_KEY       — MOI Smart Services API key
 *   RTA_MOI_BASE_URL      — MOI API base URL (provided after registration)
 *   RTA_DP_CLIENT_ID      — Dubai Police OAuth2 client ID
 *   RTA_DP_CLIENT_SECRET  — Dubai Police OAuth2 client secret
 *   RTA_DP_BASE_URL       — Dubai Police API base URL
 *   RTA_API_KEY           — RTA Smart Integration key
 *   RTA_BASE_URL          — RTA API base URL
 */

export type RTAFine = {
  id: string
  date: string
  location: string
  description: string
  amount_aed: number
  status: 'unpaid' | 'paid'
  source: 'moi' | 'dubai_police' | 'rta'
}

export type SalikTransaction = {
  date: string
  gate: string
  amount_aed: number
}

export type RTACheckResult = {
  plate_number: string
  emirate: string
  data_source: 'moi_api' | 'dubai_police_api' | 'rta_api' | 'partial' | 'unavailable'

  fines: {
    count: number
    total_aed: number
    items: RTAFine[]
  }

  salik: {
    tag_number?: string
    balance_aed?: number
    last_transaction?: string
    transactions: SalikTransaction[]
  }

  registration: {
    status: 'active' | 'expired' | 'cancelled' | 'unknown'
    expiry_date?: string
    registration_number?: string
    owner_name?: string
    owner_phone?: string
    mulkiya_number?: string
  }

  insurance: {
    status: 'valid' | 'expired' | 'unknown'
    expiry_date?: string
    company?: string
    policy_number?: string
  }

  inspection: {
    status: 'pass' | 'fail' | 'due' | 'unknown'
    expiry_date?: string
    center?: string
  }

  errors: string[]
}

// ── Helpers ─────────────────────────────────────────────────────

function emptyResult(plate: string, emirate: string): RTACheckResult {
  return {
    plate_number: plate,
    emirate,
    data_source: 'unavailable',
    fines: { count: 0, total_aed: 0, items: [] },
    salik: { transactions: [] },
    registration: { status: 'unknown' },
    insurance: { status: 'unknown' },
    inspection: { status: 'unknown' },
    errors: [],
  }
}

// ── MOI Traffic Fines ─────────────────────────────────────────
// Endpoint: POST {RTA_MOI_BASE_URL}/api/v1/traffic/fines
// Docs:     https://smartservices.moi.gov.ae/developer
// Auth:     x-api-key header

async function fetchMOIFines(
  plate: string,
  emirate: string,
): Promise<RTAFine[]> {
  const baseUrl = process.env.RTA_MOI_BASE_URL
  const apiKey  = process.env.RTA_MOI_API_KEY
  if (!baseUrl || !apiKey) return []

  const res = await fetch(`${baseUrl}/api/v1/traffic/fines`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey },
    body: JSON.stringify({ plate_number: plate, emirate }),
    signal: AbortSignal.timeout(10_000),
  })

  if (!res.ok) return []
  const json = await res.json()

  // MOI response shape: { data: { violations: [...] } }
  const violations: RTAFine[] = (json?.data?.violations ?? []).map((v: {
    violation_id?: string
    id?: string
    violation_date?: string
    date?: string
    location?: string
    violation_description?: string
    description?: string
    fine_amount?: number
    amount?: number
    payment_status?: string
    status?: string
  }) => ({
    id:          v.violation_id ?? v.id ?? '',
    date:        v.violation_date ?? v.date ?? '',
    location:    v.location ?? '',
    description: v.violation_description ?? v.description ?? '',
    amount_aed:  v.fine_amount ?? v.amount ?? 0,
    status:      (v.payment_status ?? v.status ?? 'unpaid').toLowerCase() as 'paid' | 'unpaid',
    source:      'moi' as const,
  }))

  return violations
}

// ── Dubai Police Traffic Fines ────────────────────────────────
// Endpoint: GET {RTA_DP_BASE_URL}/api/v1/fines?plate={plate}&emirate={emirate}
// Docs:     https://smart.dubaipolice.gov.ae/developer
// Auth:     OAuth2 client-credentials bearer token

let _dpToken: string | null = null
let _dpTokenExpiry = 0

async function getDubaiPoliceToken(): Promise<string | null> {
  const clientId     = process.env.RTA_DP_CLIENT_ID
  const clientSecret = process.env.RTA_DP_CLIENT_SECRET
  const baseUrl      = process.env.RTA_DP_BASE_URL
  if (!clientId || !clientSecret || !baseUrl) return null

  if (_dpToken && Date.now() < _dpTokenExpiry) return _dpToken

  const res = await fetch(`${baseUrl}/oauth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type:    'client_credentials',
      client_id:     clientId,
      client_secret: clientSecret,
    }),
    signal: AbortSignal.timeout(8_000),
  })

  if (!res.ok) return null
  const json = await res.json()
  _dpToken       = json.access_token
  _dpTokenExpiry = Date.now() + (json.expires_in - 60) * 1000
  return _dpToken
}

async function fetchDubaiPoliceFines(plate: string, emirate: string): Promise<RTAFine[]> {
  const baseUrl = process.env.RTA_DP_BASE_URL
  if (!baseUrl) return []

  const token = await getDubaiPoliceToken()
  if (!token) return []

  const url = `${baseUrl}/api/v1/fines?plate=${encodeURIComponent(plate)}&emirate=${encodeURIComponent(emirate)}`
  const res  = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
    signal:  AbortSignal.timeout(10_000),
  })

  if (!res.ok) return []
  const json = await res.json()

  // Dubai Police response shape: { result: { fines: [...] } }
  return (json?.result?.fines ?? []).map((f: {
    fine_no?: string
    id?: string
    fine_date?: string
    date?: string
    location?: string
    offense?: string
    description?: string
    fine_amount?: number
    amount?: number
    status?: string
  }) => ({
    id:          f.fine_no ?? f.id ?? '',
    date:        f.fine_date ?? f.date ?? '',
    location:    f.location ?? '',
    description: f.offense ?? f.description ?? '',
    amount_aed:  f.fine_amount ?? f.amount ?? 0,
    status:      (f.status ?? 'unpaid').toLowerCase() as 'paid' | 'unpaid',
    source:      'dubai_police' as const,
  }))
}

// ── RTA Vehicle Registration + Salik + Inspection ────────────
// Endpoint: POST {RTA_BASE_URL}/api/v1/vehicle/enquiry
// Docs:     Contact integration@rta.ae → RTA Smart Integration Platform
// Auth:     x-api-key header

async function fetchRTAVehicleData(plate: string, emirate: string): Promise<{
  registration: RTACheckResult['registration']
  insurance: RTACheckResult['insurance']
  inspection: RTACheckResult['inspection']
  salik: RTACheckResult['salik']
} | null> {
  const baseUrl = process.env.RTA_BASE_URL
  const apiKey  = process.env.RTA_API_KEY
  if (!baseUrl || !apiKey) return null

  const res = await fetch(`${baseUrl}/api/v1/vehicle/enquiry`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey },
    body: JSON.stringify({ plate_number: plate, emirate }),
    signal: AbortSignal.timeout(12_000),
  })

  if (!res.ok) return null
  const json = await res.json()
  const d    = json?.data ?? {}

  return {
    registration: {
      status:              d.registration_status?.toLowerCase() ?? 'unknown',
      expiry_date:         d.mulkiya_expiry ?? d.registration_expiry,
      registration_number: d.registration_number,
      owner_name:          d.owner_name,
      owner_phone:         d.owner_phone,
      mulkiya_number:      d.mulkiya_number,
    },
    insurance: {
      status:         d.insurance_status?.toLowerCase() ?? 'unknown',
      expiry_date:    d.insurance_expiry,
      company:        d.insurance_company,
      policy_number:  d.insurance_policy_number,
    },
    inspection: {
      status:         d.inspection_result?.toLowerCase() ?? 'unknown',
      expiry_date:    d.inspection_expiry,
      center:         d.inspection_center,
    },
    salik: {
      tag_number:         d.salik_tag,
      balance_aed:        d.salik_balance != null ? parseFloat(d.salik_balance) : undefined,
      last_transaction:   d.salik_last_transaction,
      transactions:       (d.salik_transactions ?? []).map((t: { date: string; gate: string; amount: number }) => ({
        date:       t.date,
        gate:       t.gate,
        amount_aed: t.amount,
      })),
    },
  }
}

// ── Main export ───────────────────────────────────────────────

export async function checkVehicleRTA(
  plate: string,
  emirate = 'Dubai',
): Promise<RTACheckResult> {
  const result = emptyResult(plate, emirate)
  const errors: string[] = []

  const [moiFines, dpFines, rtaData] = await Promise.allSettled([
    fetchMOIFines(plate, emirate),
    fetchDubaiPoliceFines(plate, emirate),
    fetchRTAVehicleData(plate, emirate),
  ])

  // Merge fines from both sources
  const allFines: RTAFine[] = []
  if (moiFines.status === 'fulfilled')   allFines.push(...moiFines.value)
  else errors.push('MOI fines fetch failed: ' + String(moiFines.reason))
  if (dpFines.status === 'fulfilled')    allFines.push(...dpFines.value)
  else errors.push('Dubai Police fines fetch failed: ' + String(dpFines.reason))

  result.fines = {
    count:     allFines.length,
    total_aed: allFines.filter(f => f.status === 'unpaid').reduce((s, f) => s + f.amount_aed, 0),
    items:     allFines,
  }

  if (rtaData.status === 'fulfilled' && rtaData.value) {
    result.registration = rtaData.value.registration
    result.insurance    = rtaData.value.insurance
    result.inspection   = rtaData.value.inspection
    result.salik        = rtaData.value.salik
  } else if (rtaData.status === 'rejected') {
    errors.push('RTA vehicle data fetch failed: ' + String(rtaData.reason))
  }

  const hasAny = allFines.length > 0 || rtaData.status === 'fulfilled'
  result.data_source = hasAny ? 'partial' : 'unavailable'
  result.errors      = errors

  return result
}
