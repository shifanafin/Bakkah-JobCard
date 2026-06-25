// ============================================================
// Bakkah — All Supabase Queries
// ============================================================
import { createClient } from '@/lib/supabase/client'
import type { JobCard, JobCardService, JobCardPart, JobStatus, PhotoCategory } from '@/types'

// ── Job Cards ────────────────────────────────────────────────

export async function getJobCards(filters?: {
  status?: JobStatus
  search?: string
  dateFrom?: string
  dateTo?: string
}): Promise<JobCard[]> {
  const sb = createClient()
  let q = sb.from('job_cards')
    .select(`*, customer:customers(*), vehicle:vehicles(*), technician:technicians(name,role)`)
    .order('created_at', { ascending: false })

  if (filters?.status) q = q.eq('status', filters.status)
  if (filters?.dateFrom) q = q.gte('date_in', filters.dateFrom)
  if (filters?.dateTo) q = q.lte('date_in', filters.dateTo)

  const { data, error } = await q
  if (error) throw error

  if (filters?.search) {
    const t = filters.search.toLowerCase()
    return (data as JobCard[]).filter(j =>
      j.vehicle?.plate_number?.toLowerCase().includes(t) ||
      j.customer?.name?.toLowerCase().includes(t) ||
      j.job_number?.toLowerCase().includes(t) ||
      j.customer?.phone?.includes(t)
    )
  }
  return data as JobCard[]
}

export async function getJobCard(id: string): Promise<JobCard> {
  const sb = createClient()
  const { data, error } = await sb.from('job_cards').select(`
    *, customer:customers(*), vehicle:vehicles(*), technician:technicians(*),
    services:job_card_services(*), parts:job_card_parts(*),
    photos:job_card_photos(* )
  `).eq('id', id).single()
  if (error) throw error
  return data as JobCard
}

export async function createJobCard(input: {
  customer_name: string; customer_phone: string; customer_email?: string
  customer_company?: string; is_fleet: boolean
  plate_number: string; make: string; model: string; year?: number; color?: string; vin?: string
  job_type: string; date_in: string; date_out?: string; mileage_in?: number
  customer_complaint?: string; work_instructions?: string; technician_id?: string
}): Promise<JobCard> {
  const sb = createClient()

  // Upsert customer
  let customerId: string
  const { data: ec, error: ecErr } = await sb.from('customers').select('id').eq('phone', input.customer_phone).maybeSingle()
  if (ecErr) throw new Error(`Customer lookup failed: ${ecErr.message}`)

  if (ec) {
    customerId = ec.id
    // Keep customer details up-to-date
    await sb.from('customers').update({
      name: input.customer_name,
      ...(input.customer_email ? { email: input.customer_email } : {}),
      ...(input.customer_company ? { company_name: input.customer_company } : {}),
      is_fleet: input.is_fleet,
    }).eq('id', customerId)
  } else {
    const { data: nc, error } = await sb.from('customers').insert({
      name: input.customer_name, phone: input.customer_phone,
      email: input.customer_email || null, company_name: input.customer_company || null,
      is_fleet: input.is_fleet,
    }).select('id').single()
    if (error) throw new Error(`Failed to save customer: ${error.message}`)
    customerId = nc.id
  }

  // Upsert vehicle — mileage_in lives on job_cards, not vehicles
  let vehicleId: string
  const plate = input.plate_number.toUpperCase().trim()
  const { data: ev, error: evErr } = await sb.from('vehicles').select('id').eq('plate_number', plate).maybeSingle()
  if (evErr) throw new Error(`Vehicle lookup failed: ${evErr.message}`)

  if (ev) {
    vehicleId = ev.id
    // Keep vehicle details up-to-date
    await sb.from('vehicles').update({
      make: input.make, model: input.model,
      ...(input.year ? { year: input.year } : {}),
      ...(input.color ? { color: input.color } : {}),
      ...(input.vin ? { vin: input.vin } : {}),
    }).eq('id', vehicleId)
  } else {
    const { data: nv, error } = await sb.from('vehicles').insert({
      customer_id: customerId, plate_number: plate, make: input.make, model: input.model,
      year: input.year || null, color: input.color || null, vin: input.vin || null,
    }).select('id').single()
    if (error) throw new Error(`Failed to save vehicle: ${error.message}`)
    vehicleId = nv.id
  }

  const initialStatus = 'inspection'

  const { data: jc, error: je } = await sb.from('job_cards').insert({
    customer_id: customerId, vehicle_id: vehicleId, technician_id: input.technician_id || null,
    job_type: input.job_type, date_in: input.date_in, date_out: input.date_out || null,
    mileage_in: input.mileage_in || null, customer_complaint: input.customer_complaint || null,
    work_instructions: input.work_instructions || null, status: initialStatus,
    source: 'application',
  }).select('id').single()
  if (je) throw new Error(`Failed to create job card: ${je.message}`)

  await sb.from('job_card_history').insert({ job_card_id: jc.id, new_status: initialStatus, notes: 'Job card created' })
  return getJobCard(jc.id)
}

export async function updateJobStatus(jobId: string, status: JobStatus, changedBy?: string) {
  const res = await fetch(`/api/job-cards/${jobId}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status, changed_by: changedBy }),
  })
  if (!res.ok) {
    const d = await res.json()
    throw new Error(d.error ?? 'Failed to update status')
  }
}

// ── Services & Parts ──────────────────────────────────────────

async function recalcJobTotals(jobId: string) {
  const sb = createClient()
  const [{ data: svcs }, { data: prts }, { data: job }] = await Promise.all([
    sb.from('job_card_services').select('total_price').eq('job_card_id', jobId),
    sb.from('job_card_parts').select('total_price').eq('job_card_id', jobId),
    sb.from('job_cards').select('discount').eq('id', jobId).single(),
  ])
  const subtotal = [...(svcs ?? []), ...(prts ?? [])].reduce((sum, r) => sum + (r.total_price ?? 0), 0)
  const discount = job?.discount ?? 0
  const vatBase = Math.max(0, subtotal - discount)
  const vat_amount = parseFloat((vatBase * 0.05).toFixed(2))
  const total = parseFloat((vatBase + vat_amount).toFixed(2))
  await sb.from('job_cards').update({ subtotal, vat_amount, total, updated_at: new Date().toISOString() }).eq('id', jobId)
}

export async function addService(jobId: string, s: Omit<JobCardService, 'id' | 'job_card_id' | 'total_price'>) {
  const sb = createClient()
  const { data, error } = await sb.from('job_card_services').insert({ ...s, job_card_id: jobId }).select().single()
  if (error) throw error
  await recalcJobTotals(jobId)
  return data
}

export async function deleteService(id: string) {
  const sb = createClient()
  const { data: row } = await sb.from('job_card_services').select('job_card_id').eq('id', id).single()
  const { error } = await sb.from('job_card_services').delete().eq('id', id)
  if (error) throw error
  if (row?.job_card_id) await recalcJobTotals(row.job_card_id)
}

export async function addPart(jobId: string, p: Omit<JobCardPart, 'id' | 'job_card_id' | 'total_price'>) {
  const sb = createClient()
  const { data, error } = await sb.from('job_card_parts').insert({ ...p, job_card_id: jobId }).select().single()
  if (error) throw error
  await recalcJobTotals(jobId)
  return data
}

export async function deletePart(id: string) {
  const sb = createClient()
  const { data: row } = await sb.from('job_card_parts').select('job_card_id').eq('id', id).single()
  const { error } = await sb.from('job_card_parts').delete().eq('id', id)
  if (error) throw error
  if (row?.job_card_id) await recalcJobTotals(row.job_card_id)
}

export async function updateDiscount(jobId: string, discount: number) {
  const sb = createClient()
  const { error } = await sb.from('job_cards').update({ discount, updated_at: new Date().toISOString() }).eq('id', jobId)
  if (error) throw error
  await recalcJobTotals(jobId)
}

export async function updatePayment(jobId: string, status: string, method?: string) {
  const sb = createClient()
  const { error } = await sb.from('job_cards').update({ payment_status: status, payment_method: method }).eq('id', jobId)
  if (error) throw error
}

// ── Photos ────────────────────────────────────────────────────

export async function addPhoto(photo: { job_card_id: string; cloudinary_url: string; cloudinary_id?: string; category: PhotoCategory; caption?: string; taken_by?: string }) {
  const sb = createClient()
  const { data, error } = await sb.from('job_card_photos').insert(photo).select().single()
  if (error) throw error
  return data
}

export async function deletePhoto(id: string, cloudinaryId?: string) {
  const sb = createClient()
  if (cloudinaryId) {
    try { await fetch('/api/cloudinary/delete', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ public_id: cloudinaryId }) }) } catch { }
  }
  const { error } = await sb.from('job_card_photos').delete().eq('id', id)
  if (error) throw error
}

export async function approveJob(jobId: string, approvedBy?: string) {
  const res = await fetch(`/api/job-cards/${jobId}/approve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ approved_by: approvedBy }),
  })
  if (!res.ok) {
    const d = await res.json()
    throw new Error(d.error ?? 'Failed to approve job')
  }
  const d = await res.json()
  return d as { new_status: string; proforma_id: string | null }
}

export async function assignTechnician(jobId: string, technicianId: string, changedBy?: string) {
  const sb = createClient()
  const { data: cur } = await sb.from('job_cards').select('status').eq('id', jobId).single()
  if (cur?.status === 'delivered') throw new Error('Cannot modify a delivered job')
  const shouldAdvance = cur?.status === 'pending' || cur?.status === 'received'
  const updates: Record<string, unknown> = { technician_id: technicianId, updated_at: new Date().toISOString() }
  if (shouldAdvance) updates.status = 'assigned'

  const { error } = await sb.from('job_cards').update(updates).eq('id', jobId)
  if (error) throw error

  if (shouldAdvance) {
    await sb.from('job_card_history').insert({ job_card_id: jobId, old_status: cur?.status, new_status: 'assigned', changed_by: changedBy, notes: 'Technician assigned' })
  }
}

// ── Technicians ───────────────────────────────────────────────

export async function getTechnicians() {
  const sb = createClient()
  const { data, error } = await sb.from('technicians').select('*').eq('active', true).order('name')
  if (error) throw error
  return data
}

// ── Dashboard stats ───────────────────────────────────────────

export async function getDashboardStats() {
  const sb = createClient()
  const today = new Date().toISOString().split('T')[0]
  const monthStart = today.slice(0, 7) + '-01'

  const [{ count: total }, { count: active }, { data: revenue }, { data: statusRows }] = await Promise.all([
    sb.from('job_cards').select('*', { count: 'exact', head: true }),
    sb.from('job_cards').select('*', { count: 'exact', head: true }).in('status', ['pending', 'received', 'assigned', 'in_progress', 'qc_check', 'ready']),
    sb.from('job_cards').select('total').eq('payment_status', 'paid').gte('date_in', monthStart),
    sb.from('job_cards').select('status').in('status', ['pending', 'received', 'assigned', 'in_progress', 'qc_check', 'ready']),
  ])

  const monthRevenue = (revenue || []).reduce((s: number, j: { total: number }) => s + (j.total || 0), 0)
  const counts: Record<string, number> = {}
  for (const row of statusRows || []) {
    counts[row.status] = (counts[row.status] || 0) + 1
  }
  const statusCounts = {
    pending: (counts.pending || 0) + (counts.received || 0),
    assigned: counts.assigned || 0,
    in_progress: counts.in_progress || 0,
    qc_check: counts.qc_check || 0,
    ready: counts.ready || 0,
  }
  return { total: total || 0, active: active || 0, monthRevenue, statusCounts }
}
