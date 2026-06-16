// ============================================================
// Bakkah — Global Type Definitions
// ============================================================

export type JobStatus = 'inspection' | 'waiting_for_approval' | 'pending' | 'assigned' | 'received' | 'in_progress' | 'qc_check' | 'ready' | 'delivered' | 'cancelled'
export type JobType = string
export type PaymentStatus = 'unpaid' | 'partial' | 'paid'
export type PhotoCategory = 'exterior_front' | 'exterior_rear' | 'exterior_left' | 'exterior_right' | 'interior' | 'engine_bay' | 'damage' | 'before_work' | 'after_work' | 'other'
export type UserRole = 'admin' | 'supervisor' | 'technician' | 'receptionist'

export interface User {
  id: string
  email: string
  name: string
  role: UserRole
  avatar_url?: string
  active: boolean
  created_at: string
}

export interface Customer {
  id: string
  name: string
  phone: string
  email?: string
  emirates_id?: string
  company_name?: string
  is_fleet: boolean
  notes?: string
  created_at: string
  updated_at: string
}

export interface Vehicle {
  id: string
  customer_id: string
  plate_number: string
  make: string
  model: string
  year?: number
  color?: string
  vin?: string
  created_at: string
  customer?: Customer
}

export interface Technician {
  id: string
  name: string
  phone?: string
  role: string
  active: boolean
}

export interface JobCard {
  id: string
  job_number: string
  customer_id: string
  vehicle_id: string
  technician_id?: string
  status: JobStatus
  job_type: JobType
  date_in: string
  date_out?: string
  date_delivered?: string
  mileage_in?: number
  mileage_out?: number
  customer_complaint?: string
  work_instructions?: string
  subtotal: number
  vat_amount: number
  discount: number
  total: number
  payment_status: PaymentStatus
  payment_method?: string
  internal_notes?: string
  customer_signature_url?: string
  supervisor_signature_url?: string
  created_at: string
  updated_at: string
  customer?: Customer
  vehicle?: Vehicle
  technician?: Technician
  services?: JobCardService[]
  parts?: JobCardPart[]
  photos?: JobCardPhoto[]
}

export interface JobCardService {
  id: string
  job_card_id: string
  description: string
  quantity: number
  unit_price: number
  total_price: number
  completed: boolean
}

export interface JobCardPart {
  id: string
  job_card_id: string
  part_name: string
  part_number?: string
  quantity: number
  unit_price: number
  total_price: number
}

export interface JobCardPhoto {
  id: string
  job_card_id: string
  cloudinary_url: string
  cloudinary_id?: string
  category: PhotoCategory
  caption?: string
  taken_by?: string
  sort_order: number
  created_at: string
}

// ── Display Maps ─────────────────────────────────────────────

export const JOB_STATUS_LABEL: Record<JobStatus, string> = {
  inspection: 'Inspection',
  waiting_for_approval: 'Awaiting Approval',
  pending: 'Pending',
  assigned: 'Assigned',
  received: 'Received',
  in_progress: 'In Progress',
  qc_check: 'QC Check',
  ready: 'Ready',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
}

export const JOB_STATUS_COLOR: Record<JobStatus, string> = {
  inspection: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/25 ring-cyan-500/20',
  waiting_for_approval: 'bg-orange-500/15 text-orange-400 border-orange-500/25 ring-orange-500/20',
  pending: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/25 ring-yellow-500/20',
  assigned: 'bg-blue-500/15 text-blue-300 border-blue-500/25 ring-blue-500/20',
  received: 'bg-blue-500/15 text-blue-300 border-blue-500/25 ring-blue-500/20',
  in_progress: 'bg-brand/15 text-brand border-brand/25 ring-brand/20',
  qc_check: 'bg-purple-500/15 text-purple-300 border-purple-500/25 ring-purple-500/20',
  ready: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/25 ring-emerald-500/20',
  delivered: 'bg-zinc-500/15 text-zinc-400 border-zinc-500/25 ring-zinc-500/20',
  cancelled: 'bg-red-500/15 text-red-400 border-red-500/25 ring-red-500/20',
}

export const JOB_STATUS_STEP: Record<JobStatus, number> = {
  inspection: 0,
  waiting_for_approval: 1,
  pending: 2, received: 2, assigned: 3, in_progress: 4, qc_check: 5, ready: 6, delivered: 7, cancelled: -1,
}

export const JOB_TYPE_LABEL: Record<string, string> = {
  service: 'Service',
  inspection: '360° Inspection',
  detailing: 'Auto Detailing',
  repair: 'Repair',
  rta_check: 'RTA Check',
  valuation: 'Valuation',
  other: 'Other',
}

export const PHOTO_CATEGORY_LABEL: Record<PhotoCategory, string> = {
  exterior_front: 'Exterior — Front',
  exterior_rear: 'Exterior — Rear',
  exterior_left: 'Exterior — Left',
  exterior_right: 'Exterior — Right',
  interior: 'Interior',
  engine_bay: 'Engine Bay',
  damage: 'Damage',
  before_work: 'Before Work',
  after_work: 'After Work',
  other: 'Other',
}

export const PAYMENT_STATUS_COLOR: Record<PaymentStatus, string> = {
  unpaid: 'text-red-400',
  partial: 'text-amber-400',
  paid: 'text-emerald-400',
}
