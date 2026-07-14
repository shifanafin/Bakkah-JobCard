'use client'

import { useState, useEffect, use } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useSession } from '@/lib/auth-client'
import Header from '@/components/layout/Header'
import { formatAED, formatDate, formatDateTime } from '@/lib/utils/format'
import {
  ArrowLeft, Car, User, Wrench, Package, Clock, Calendar, Check, ChevronDown,
  ChevronUp, Image as ImageIcon, History, Loader2, AlertCircle, Phone, Mail,
  Building2, CreditCard, Gauge, X, FileText, MessageCircle, UserCheck,
  TrendingUp, Hash, Edit2, Trash2,
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { JOB_STATUS_LABEL, JOB_STATUS_COLOR } from '@/types'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import { toast } from 'sonner'

// ── Types ──────────────────────────────────────────────────────────────────

type HistoryEntry = {
  id: string
  old_status: string | null
  new_status: string
  changed_by: string | null
  notes: string | null
  created_at: string
}

type Photo = {
  id: string
  cloudinary_url: string
  cloudinary_id?: string
  category: string
  caption?: string
  taken_by?: string
  sort_order: number
  created_at: string
}

type Service = { id: string; description: string; quantity: number; unit_price: number; total_price: number; completed: boolean }
type Part = { id: string; part_name: string; part_number?: string; quantity: number; unit_price: number; total_price: number }

type JobRecord = {
  id: string
  job_number: string
  status: string
  job_type: string
  date_in: string
  date_out?: string
  date_delivered?: string
  mileage_in?: number
  mileage_out?: number
  customer_complaint?: string
  work_instructions?: string
  internal_notes?: string
  subtotal: number
  vat_amount: number
  discount: number
  total: number
  payment_status: string
  payment_method?: string
  created_at: string
  updated_at: string
  technician?: { id: string; name: string; role: string; phone?: string } | null
  services: Service[]
  parts: Part[]
  photos: Photo[]
  history: HistoryEntry[]
}

type VehicleData = {
  id: string
  plate_number: string
  make: string
  model: string
  year?: number
  color?: string
  vin?: string
  mileage_in?: number
  created_at: string
  customer?: {
    id: string; name: string; phone: string; email?: string
    company_name?: string; emirates_id?: string; is_fleet: boolean; notes?: string; created_at: string
  }
}

type VehicleHistoryResponse = {
  vehicle: VehicleData
  jobs: JobRecord[]
  totalSpend: number
  visitCount: number
}

// ── Helpers ────────────────────────────────────────────────────────────────

const STATUS_LABEL: Record<string, string> = {
  pending: 'Pending', assigned: 'Assigned', received: 'Received',
  in_progress: 'In Progress', qc_check: 'Quality Check',
  ready: 'Ready for Collection', delivered: 'Delivered', cancelled: 'Cancelled',
}

const PHOTO_CATEGORY_LABEL: Record<string, string> = {
  exterior_front: 'Exterior — Front', exterior_rear: 'Exterior — Rear',
  exterior_left: 'Exterior — Left', exterior_right: 'Exterior — Right',
  interior: 'Interior', engine_bay: 'Engine Bay', damage: 'Damage',
  before_work: 'Before Work', after_work: 'After Work', other: 'Other',
}

const CATEGORY_ORDER = [
  'before_work', 'exterior_front', 'exterior_rear', 'exterior_left', 'exterior_right',
  'interior', 'engine_bay', 'damage', 'after_work', 'other',
]

function StatusDot({ status }: { status: string }) {
  const dotColors: Record<string, string> = {
    pending: 'bg-amber-500', assigned: 'bg-blue-500', received: 'bg-blue-400',
    in_progress: 'bg-brand', qc_check: 'bg-purple-500',
    ready: 'bg-emerald-500', delivered: 'bg-gray-400', cancelled: 'bg-red-500',
  }
  return <span className={cn('inline-block h-2 w-2 rounded-full shrink-0', dotColors[status] ?? 'bg-gray-400')} />
}

// ── Photo Lightbox ─────────────────────────────────────────────────────────

function PhotoGrid({ photos }: { photos: Photo[] }) {
  const [lightbox, setLightbox] = useState<string | null>(null)

  const grouped: Record<string, Photo[]> = {}
  for (const p of photos) {
    if (!grouped[p.category]) grouped[p.category] = []
    grouped[p.category].push(p)
  }

  return (
    <>
      {CATEGORY_ORDER.filter(cat => grouped[cat]?.length).map(cat => (
        <div key={cat}>
          <p className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-white/30 mb-2">
            {PHOTO_CATEGORY_LABEL[cat] ?? cat}
          </p>
          <div className="grid grid-cols-3 gap-2 mb-3">
            {grouped[cat].map(p => (
              <button key={p.id} onClick={() => setLightbox(p.cloudinary_url)}
                className="relative aspect-square overflow-hidden rounded-xl border border-gray-100 dark:border-white/[0.06] bg-gray-50 dark:bg-white/[0.03] hover:scale-[1.02] transition-transform">
                <Image src={p.cloudinary_url} alt={p.caption || cat}
                  fill sizes="(max-width: 640px) 33vw, 20vw" className="object-cover" />
                {p.caption && (
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent px-2 py-1">
                    <p className="text-[9px] text-white truncate">{p.caption}</p>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      ))}
      {lightbox && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          onClick={() => setLightbox(null)}>
          <button className="absolute top-4 right-4 text-white/70 hover:text-white">
            <X className="h-6 w-6" />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={lightbox} alt="Vehicle photo" className="max-h-[90vh] max-w-[95vw] object-contain rounded-2xl" />
        </div>
      )}
    </>
  )
}

// ── Status Timeline ────────────────────────────────────────────────────────

function StatusTimeline({ history, dateIn, technician }: {
  history: HistoryEntry[]
  dateIn: string
  technician?: { name: string; role: string } | null
}) {
  return (
    <div className="space-y-0">
      {/* Check-in event */}
      <div className="flex gap-3">
        <div className="flex flex-col items-center">
          <div className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-brand bg-brand text-black shrink-0">
            <Car className="h-3 w-3" />
          </div>
          <div className="flex-1 w-0.5 bg-gray-200 dark:bg-white/[0.06] my-1" style={{ minHeight: '16px' }} />
        </div>
        <div className="pb-4 pt-0.5">
          <p className="text-sm font-semibold text-gray-900 dark:text-white">Vehicle Checked In</p>
          <p className="text-xs text-gray-400 dark:text-white/40 mt-0.5">{formatDate(dateIn)}</p>
          {technician && (
            <p className="text-xs text-brand mt-0.5">Assigned to: {technician.name} ({technician.role})</p>
          )}
        </div>
      </div>

      {history.map((entry, i) => {
        const isLast = i === history.length - 1
        const isDelivered = entry.new_status === 'delivered'
        const isCancelled = entry.new_status === 'cancelled'
        return (
          <div key={entry.id} className="flex gap-3">
            <div className="flex flex-col items-center">
              <div className={cn(
                'flex h-7 w-7 items-center justify-center rounded-full border-2 shrink-0 text-xs font-bold',
                isDelivered ? 'border-emerald-500 bg-emerald-500 text-white'
                  : isCancelled ? 'border-red-400 bg-red-400 text-white'
                    : isLast ? 'border-brand bg-brand text-black'
                      : 'border-gray-300 bg-white text-gray-400 dark:border-white/20 dark:bg-surface-800'
              )}>
                {isDelivered ? <Check className="h-3.5 w-3.5" />
                  : isCancelled ? <X className="h-3.5 w-3.5" />
                    : <StatusDot status={entry.new_status} />}
              </div>
              {!isLast && (
                <div className="flex-1 w-0.5 bg-gray-200 dark:bg-white/[0.06] my-1" style={{ minHeight: '16px' }} />
              )}
            </div>
            <div className={cn('pt-0.5', isLast ? 'pb-0' : 'pb-4')}>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                {STATUS_LABEL[entry.new_status] ?? entry.new_status}
              </p>
              <div className="flex flex-wrap gap-2 mt-0.5">
                <p className="text-xs text-gray-400 dark:text-white/40">
                  {formatDateTime(entry.created_at)}
                </p>
                {entry.changed_by && (
                  <p className="text-xs text-gray-500 dark:text-white/50">
                    by <span className="font-medium text-gray-700 dark:text-white/70">{entry.changed_by}</span>
                  </p>
                )}
              </div>
              {entry.notes && (
                <p className="text-xs text-gray-500 dark:text-white/40 mt-1 italic">{entry.notes}</p>
              )}
              {entry.old_status && (
                <p className="text-[10px] text-gray-400 dark:text-white/25 mt-0.5">
                  {STATUS_LABEL[entry.old_status] ?? entry.old_status} → {STATUS_LABEL[entry.new_status] ?? entry.new_status}
                </p>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── Job Record Card ────────────────────────────────────────────────────────

function JobRecordCard({ job, index }: { job: JobRecord; index: number }) {
  const [open, setOpen] = useState(index === 0)
  const [tab, setTab] = useState<'details' | 'photos' | 'timeline'>('details')

  const statusClr = JOB_STATUS_COLOR[job.status as keyof typeof JOB_STATUS_COLOR] ?? ''
  const statusLbl = JOB_STATUS_LABEL[job.status as keyof typeof JOB_STATUS_LABEL] ?? job.status

  return (
    <div className={cn('rounded-2xl border transition-all duration-200 bg-white dark:bg-surface-800',
      open ? 'border-brand/20 dark:border-brand/15 shadow-md' : 'border-gray-100 dark:border-white/[0.06]')}>

      {/* Card header */}
      <button className="w-full p-5 text-left" onClick={() => setOpen(o => !o)}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2.5 flex-wrap mb-1">
              <span className="font-mono text-base font-black text-brand">{job.job_number}</span>
              <span className={cn('badge text-xs', statusClr)}>{statusLbl}</span>
              <span className="rounded-full bg-gray-100 dark:bg-white/[0.06] px-2 py-0.5 text-xs text-gray-500 dark:text-white/40">
                {job.job_type === 'rta_check' ? 'RTA Check' : job.job_type.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}
              </span>
            </div>
            <div className="flex flex-wrap gap-3 text-xs text-gray-400 dark:text-white/40 mt-1">
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" /> In: {formatDate(job.date_in)}
              </span>
              {job.date_delivered && (
                <span className="flex items-center gap-1 text-emerald-500">
                  <Check className="h-3 w-3" /> Delivered: {formatDate(job.date_delivered)}
                </span>
              )}
              {job.mileage_in && (
                <span className="flex items-center gap-1">
                  <Gauge className="h-3 w-3" /> {job.mileage_in.toLocaleString()} km
                </span>
              )}
              {job.technician && (
                <span className="flex items-center gap-1">
                  <UserCheck className="h-3 w-3" /> {job.technician.name}
                </span>
              )}
            </div>
          </div>
          <div className="text-right shrink-0 flex items-start gap-2">
            <div>
              <p className="font-black text-brand text-lg">{formatAED(job.total)}</p>
              <p className={cn('text-xs font-bold uppercase',
                job.payment_status === 'paid' ? 'text-emerald-500'
                  : job.payment_status === 'partial' ? 'text-amber-500' : 'text-red-400')}>
                {job.payment_status}
              </p>
            </div>
            <div className="text-gray-300 dark:text-white/20 mt-1">
              {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </div>
          </div>
        </div>
      </button>

      {open && (
        <div className="border-t border-gray-100 dark:border-white/[0.06]">
          {/* Tab bar */}
          <div className="flex border-b border-gray-100 dark:border-white/[0.06]">
            {([
              { key: 'details', label: 'Details', icon: Wrench },
              { key: 'photos', label: `Photos (${job.photos.length})`, icon: ImageIcon },
              { key: 'timeline', label: 'Timeline', icon: History },
            ] as const).map(t => (
              <button key={t.key} onClick={() => setTab(t.key)}
                className={cn('flex items-center gap-1.5 px-4 py-3 text-xs font-bold transition-colors border-b-2 -mb-px',
                  tab === t.key
                    ? 'border-brand text-brand'
                    : 'border-transparent text-gray-400 dark:text-white/30 hover:text-gray-600 dark:hover:text-white/50')}>
                <t.icon className="h-3.5 w-3.5" />
                {t.label}
              </button>
            ))}
          </div>

          <div className="p-5">
            {/* ── Details tab ───────────────────────────────── */}
            {tab === 'details' && (
              <div className="space-y-5">
                {/* Complaint + Instructions */}
                {(job.customer_complaint || job.work_instructions) && (
                  <div className="rounded-xl bg-gray-50 dark:bg-white/[0.03] border border-gray-100 dark:border-white/[0.05] p-4 space-y-3">
                    {job.customer_complaint && (
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-white/30 mb-1">Customer Complaint</p>
                        <p className="text-sm text-gray-600 dark:text-white/70 leading-relaxed">{job.customer_complaint}</p>
                      </div>
                    )}
                    {job.work_instructions && (
                      <div className={job.customer_complaint ? 'border-t border-gray-200 dark:border-white/[0.06] pt-3' : ''}>
                        <p className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-white/30 mb-1">Work Instructions</p>
                        <p className="text-sm text-gray-600 dark:text-white/70 leading-relaxed">{job.work_instructions}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Services */}
                {job.services.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Wrench className="h-4 w-4 text-purple-400" />
                      <h4 className="text-sm font-bold text-gray-900 dark:text-white">Services</h4>
                    </div>
                    <div className="space-y-1.5">
                      {job.services.map(s => (
                        <div key={s.id} className="flex items-center justify-between text-sm py-1">
                          <div className="flex items-center gap-2 flex-1 pr-4">
                            <div className={cn('h-1.5 w-1.5 rounded-full shrink-0',
                              s.completed ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-white/20')} />
                            <span className="text-gray-600 dark:text-white/60">{s.description}</span>
                            <span className="text-gray-400 dark:text-white/30 text-xs">×{s.quantity}</span>
                          </div>
                          <span className="font-medium text-gray-800 dark:text-white/80 tabular-nums">{formatAED(s.total_price)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Parts */}
                {job.parts.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Package className="h-4 w-4 text-emerald-400" />
                      <h4 className="text-sm font-bold text-gray-900 dark:text-white">Parts Used</h4>
                    </div>
                    <div className="space-y-1.5">
                      {job.parts.map(p => (
                        <div key={p.id} className="flex items-center justify-between text-sm py-1">
                          <div className="flex-1 pr-4">
                            <span className="text-gray-600 dark:text-white/60">{p.part_name}</span>
                            {p.part_number && (
                              <span className="ml-2 font-mono text-xs text-gray-400 dark:text-white/30">[{p.part_number}]</span>
                            )}
                            <span className="ml-2 text-gray-400 dark:text-white/30 text-xs">×{p.quantity}</span>
                          </div>
                          <span className="font-medium text-gray-800 dark:text-white/80 tabular-nums">{formatAED(p.total_price)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Financial summary */}
                <div className="rounded-xl border border-gray-200 dark:border-white/[0.08] p-4 space-y-2">
                  <div className="flex justify-between text-sm text-gray-500 dark:text-white/50">
                    <span>Subtotal</span>
                    <span className="tabular-nums">{formatAED(job.subtotal)}</span>
                  </div>
                  {job.discount > 0 && (
                    <div className="flex justify-between text-sm text-emerald-600 dark:text-emerald-400">
                      <span>Discount</span>
                      <span className="tabular-nums">-{formatAED(job.discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm text-gray-500 dark:text-white/50">
                    <span>VAT (5%)</span>
                    <span className="tabular-nums">{formatAED(job.vat_amount)}</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-gray-200 dark:border-white/10">
                    <span className="font-bold text-gray-900 dark:text-white text-sm">Total (incl. VAT)</span>
                    <span className="font-black text-lg text-brand tabular-nums">{formatAED(job.total)}</span>
                  </div>
                  <div className="flex justify-between text-xs pt-1">
                    <span className="text-gray-400 dark:text-white/30">Payment</span>
                    <span className={cn('font-bold',
                      job.payment_status === 'paid' ? 'text-emerald-500'
                        : job.payment_status === 'partial' ? 'text-amber-500' : 'text-red-400')}>
                      {job.payment_status.charAt(0).toUpperCase() + job.payment_status.slice(1)}
                      {job.payment_method ? ` · ${job.payment_method}` : ''}
                    </span>
                  </div>
                </div>

                {/* Internal notes */}
                {job.internal_notes && (
                  <div className="rounded-xl bg-amber-50 dark:bg-amber-500/[0.07] border border-amber-200 dark:border-amber-500/20 p-3">
                    <p className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 mb-1">Internal Notes</p>
                    <p className="text-sm text-amber-700 dark:text-amber-300/80 leading-relaxed">{job.internal_notes}</p>
                  </div>
                )}

                {/* Technician + mileage */}
                <div className="grid grid-cols-2 gap-3 text-sm">
                  {job.technician && (
                    <div className="rounded-xl bg-blue-50 dark:bg-blue-500/[0.07] border border-blue-100 dark:border-blue-500/20 p-3">
                      <p className="text-xs text-blue-400 dark:text-blue-300/60 font-bold uppercase tracking-wider mb-1">Technician</p>
                      <p className="font-semibold text-blue-700 dark:text-blue-300">{job.technician.name}</p>
                      <p className="text-xs text-blue-500 dark:text-blue-400">{job.technician.role}</p>
                    </div>
                  )}
                  {(job.mileage_in || job.mileage_out) && (
                    <div className="rounded-xl bg-gray-50 dark:bg-white/[0.03] border border-gray-100 dark:border-white/[0.06] p-3">
                      <p className="text-xs text-gray-400 dark:text-white/30 font-bold uppercase tracking-wider mb-1">Mileage</p>
                      {job.mileage_in && <p className="text-sm text-gray-600 dark:text-white/60">In: <span className="font-semibold">{job.mileage_in.toLocaleString()} km</span></p>}
                      {job.mileage_out && <p className="text-sm text-gray-600 dark:text-white/60">Out: <span className="font-semibold">{job.mileage_out.toLocaleString()} km</span></p>}
                    </div>
                  )}
                </div>

                {/* Action links */}
                <div className="flex gap-2 pt-1">
                  <Link href={`/invoice/${job.id}`} target="_blank"
                    className="flex items-center gap-1.5 text-xs font-semibold text-brand hover:underline">
                    <FileText className="h-3.5 w-3.5" /> Invoice
                  </Link>
                  <span className="text-gray-200 dark:text-white/10">|</span>
                  <Link href={`/workshop/job-cards/${job.id}`}
                    className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-brand dark:text-white/40 dark:hover:text-brand transition-colors">
                    <Hash className="h-3.5 w-3.5" /> Open Job Card
                  </Link>
                </div>
              </div>
            )}

            {/* ── Photos tab ────────────────────────────────── */}
            {tab === 'photos' && (
              job.photos.length === 0 ? (
                <div className="py-8 text-center">
                  <ImageIcon className="h-8 w-8 text-gray-200 dark:text-white/10 mx-auto mb-2" />
                  <p className="text-sm text-gray-400 dark:text-white/30">No photos recorded for this job</p>
                </div>
              ) : (
                <PhotoGrid photos={job.photos} />
              )
            )}

            {/* ── Timeline tab ──────────────────────────────── */}
            {tab === 'timeline' && (
              <StatusTimeline
                history={job.history}
                dateIn={job.date_in}
                technician={job.technician}
              />
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Main Page ──────────────────────────────────────────────────────────────

export default function VehicleHistoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { data: session } = useSession()
  const role = (session?.user as { role?: string })?.role ?? ''
  const canEdit = role === 'admin' || role === 'supervisor' || role === 'receptionist'
  const canDelete = role === 'admin' || role === 'supervisor'
  const router = useRouter()

  const [data, setData] = useState<VehicleHistoryResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState({ plate_number: '', make: '', model: '', year: '', color: '', vin: '' })
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  function startEdit() {
    if (!data) return
    setEditForm({
      plate_number: data.vehicle.plate_number ?? '',
      make: data.vehicle.make ?? '',
      model: data.vehicle.model ?? '',
      year: data.vehicle.year ? String(data.vehicle.year) : '',
      color: data.vehicle.color ?? '',
      vin: data.vehicle.vin ?? '',
    })
    setEditing(true)
  }

  async function saveEdit() {
    setSaving(true)
    try {
      const res = await fetch(`/api/vehicles/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      })
      const d = await res.json()
      if (!res.ok) { toast.error(d.error || 'Failed to update vehicle'); return }
      setData(prev => prev ? { ...prev, vehicle: { ...prev.vehicle, ...d.vehicle } } : prev)
      setEditing(false)
      toast.success('Vehicle updated')
    } catch {
      toast.error('Failed to update vehicle')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    setDeleting(true)
    try {
      const res = await fetch(`/api/vehicles/${id}`, { method: 'DELETE' })
      const d = await res.json()
      if (!res.ok) { toast.error(d.error || 'Failed to delete vehicle'); setDeleting(false); return }
      toast.success('Vehicle deleted')
      router.push('/workshop/job-cards')
    } catch {
      toast.error('Failed to delete vehicle')
      setDeleting(false)
    }
  }

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/vehicles/${id}/history`)
        if (!res.ok) {
          const json = await res.json()
          setError(json.error || 'Failed to load vehicle history')
          return
        }
        const json = await res.json()
        setData(json)
      } catch {
        setError('Failed to load vehicle history')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-surface-900">
      <Loader2 className="h-8 w-8 animate-spin text-brand" />
    </div>
  )

  if (error || !data) return (
    <div className="flex h-screen flex-col items-center justify-center bg-gray-50 dark:bg-surface-900 gap-3">
      <AlertCircle className="h-8 w-8 text-red-400" />
      <p className="text-gray-400 dark:text-white/50">{error || 'Vehicle not found'}</p>
      <Link href="/workshop/job-cards" className="btn-ghost">Back to Job Cards</Link>
    </div>
  )

  const { vehicle, jobs, totalSpend, visitCount } = data
  const customer = vehicle.customer
  const activeJob = jobs.find(j => !['delivered', 'cancelled'].includes(j.status))

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-surface-900">
      <Header
        title={`${vehicle.make} ${vehicle.model}`}
        subtitle={`${vehicle.plate_number}${vehicle.year ? ` · ${vehicle.year}` : ''}${vehicle.color ? ` · ${vehicle.color}` : ''}`}
      />

      <div className="p-4 space-y-5 w-full max-w-full lg:p-6">
        {/* Back */}
        <Link href="/workshop/job-cards"
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors dark:text-white/40 dark:hover:text-white/70 w-fit">
          <ArrowLeft className="h-4 w-4" /> Job Cards
        </Link>

        {/* ── Vehicle + Customer Info ───────────────────────── */}
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {/* Vehicle card */}
          <div className="card space-y-4">
            <div className="flex items-center gap-2.5 border-b border-gray-100 pb-3 dark:border-white/[0.06]">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand/15">
                <Car className="h-4 w-4 text-brand" />
              </div>
              <h2 className="font-bold text-gray-900 dark:text-white">Vehicle Details</h2>
              {activeJob && (
                <span className={cn('badge text-xs', JOB_STATUS_COLOR[activeJob.status as keyof typeof JOB_STATUS_COLOR] ?? '')}>
                  {JOB_STATUS_LABEL[activeJob.status as keyof typeof JOB_STATUS_LABEL] ?? activeJob.status}
                </span>
              )}
              {canEdit && !editing && (
                <div className="ml-auto flex items-center gap-1">
                  <button onClick={startEdit} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-brand dark:text-white/30 dark:hover:bg-white/[0.06]" title="Edit vehicle">
                    <Edit2 className="h-3.5 w-3.5" />
                  </button>
                  {canDelete && (
                    jobs.length === 0 ? (
                      <button onClick={() => setConfirmDelete(true)} className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500 dark:text-white/30 dark:hover:bg-red-500/10" title="Delete vehicle">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    ) : (
                      <span className="rounded-lg p-1.5 text-gray-200 dark:text-white/10" title="Cannot delete a vehicle with job history">
                        <Trash2 className="h-3.5 w-3.5" />
                      </span>
                    )
                  )}
                </div>
              )}
            </div>

            {editing ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">Plate Number</label>
                    <input className="input-base" value={editForm.plate_number}
                      onChange={e => setEditForm(f => ({ ...f, plate_number: e.target.value }))} />
                  </div>
                  <div>
                    <label className="label">Year</label>
                    <input className="input-base" value={editForm.year}
                      onChange={e => setEditForm(f => ({ ...f, year: e.target.value }))} />
                  </div>
                  <div>
                    <label className="label">Make</label>
                    <input className="input-base" value={editForm.make}
                      onChange={e => setEditForm(f => ({ ...f, make: e.target.value }))} />
                  </div>
                  <div>
                    <label className="label">Model</label>
                    <input className="input-base" value={editForm.model}
                      onChange={e => setEditForm(f => ({ ...f, model: e.target.value }))} />
                  </div>
                  <div>
                    <label className="label">Color</label>
                    <input className="input-base" value={editForm.color}
                      onChange={e => setEditForm(f => ({ ...f, color: e.target.value }))} />
                  </div>
                  <div>
                    <label className="label">VIN</label>
                    <input className="input-base" value={editForm.vin}
                      onChange={e => setEditForm(f => ({ ...f, vin: e.target.value }))} />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={saveEdit} disabled={saving} className="btn-primary flex-1 gap-2">
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Save
                  </button>
                  <button onClick={() => setEditing(false)} disabled={saving} className="btn-ghost">Cancel</button>
                </div>
              </div>
            ) : (
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400 dark:text-white/40">Plate</span>
                  <span className="font-mono font-black text-gray-900 dark:text-white tracking-widest">{vehicle.plate_number}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400 dark:text-white/40">Make / Model</span>
                  <span className="text-gray-700 dark:text-white/70 font-medium">{vehicle.make} {vehicle.model}</span>
                </div>
                {vehicle.year && (
                  <div className="flex justify-between">
                    <span className="text-gray-400 dark:text-white/40">Year</span>
                    <span className="text-gray-700 dark:text-white/70">{vehicle.year}</span>
                  </div>
                )}
                {vehicle.color && (
                  <div className="flex justify-between">
                    <span className="text-gray-400 dark:text-white/40">Color</span>
                    <span className="text-gray-700 dark:text-white/70">{vehicle.color}</span>
                  </div>
                )}
                {vehicle.vin && (
                  <div className="flex justify-between">
                    <span className="text-gray-400 dark:text-white/40">VIN</span>
                    <span className="font-mono text-xs text-gray-400 dark:text-white/40">{vehicle.vin}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-400 dark:text-white/40">First Visit</span>
                  <span className="text-gray-700 dark:text-white/70">{formatDate(vehicle.created_at)}</span>
                </div>
              </div>
            )}
          </div>

          {/* Customer card */}
          {customer && (
            <div className="card space-y-4">
              <div className="flex items-center gap-2.5 border-b border-gray-100 pb-3 dark:border-white/[0.06]">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-500/15">
                  <User className="h-4 w-4 text-blue-400" />
                </div>
                <h2 className="font-bold text-gray-900 dark:text-white">Customer</h2>
                {customer.is_fleet && (
                  <span className="ml-auto text-[10px] font-bold bg-brand/10 text-brand rounded-full px-2.5 py-1">Fleet</span>
                )}
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400 dark:text-white/40">Name</span>
                  <span className="text-gray-800 dark:text-white/80 font-semibold">{customer.name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400 dark:text-white/40">Phone</span>
                  <a href={`tel:${customer.phone}`} className="flex items-center gap-1 text-brand hover:underline font-mono">
                    <Phone className="h-3 w-3" /> {customer.phone}
                  </a>
                </div>
                {customer.email && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 dark:text-white/40">Email</span>
                    <a href={`mailto:${customer.email}`} className="flex items-center gap-1 text-brand hover:underline text-xs">
                      <Mail className="h-3 w-3" /> {customer.email}
                    </a>
                  </div>
                )}
                {customer.company_name && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 dark:text-white/40">Company</span>
                    <span className="flex items-center gap-1 text-gray-600 dark:text-white/60">
                      <Building2 className="h-3 w-3" /> {customer.company_name}
                    </span>
                  </div>
                )}
                {customer.emirates_id && role === 'admin' && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 dark:text-white/40">Emirates ID</span>
                    <span className="flex items-center gap-1 font-mono text-xs text-gray-500 dark:text-white/50">
                      <CreditCard className="h-3 w-3" /> {customer.emirates_id}
                    </span>
                  </div>
                )}
                {customer.notes && (
                  <div className="pt-2 border-t border-gray-100 dark:border-white/[0.06]">
                    <p className="text-xs text-gray-400 dark:text-white/30 mb-1">Notes</p>
                    <p className="text-sm text-gray-600 dark:text-white/60">{customer.notes}</p>
                  </div>
                )}
              </div>
              <div className="flex gap-2 pt-1">
                <a href={`https://wa.me/${customer.phone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs font-semibold text-emerald-500 hover:underline">
                  <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
                </a>
              </div>
            </div>
          )}
        </div>

        {/* ── Summary Stats ─────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="card text-center py-4">
            <p className="text-3xl font-black text-brand">{visitCount}</p>
            <p className="text-xs text-gray-400 dark:text-white/40 mt-1">Total Visits</p>
          </div>
          <div className="card text-center py-4">
            <p className="text-2xl font-black text-brand">{formatAED(totalSpend)}</p>
            <p className="text-xs text-gray-400 dark:text-white/40 mt-1">Lifetime Spend</p>
          </div>
          <div className="card text-center py-4">
            <p className="text-3xl font-black text-emerald-500">
              {jobs.filter(j => j.status === 'delivered').length}
            </p>
            <p className="text-xs text-gray-400 dark:text-white/40 mt-1">Completed</p>
          </div>
          <div className="card text-center py-4">
            <p className="text-2xl font-black text-gray-700 dark:text-white/70">
              {visitCount > 0 ? formatAED(totalSpend / visitCount) : formatAED(0)}
            </p>
            <p className="text-xs text-gray-400 dark:text-white/40 mt-1">Avg. per Visit</p>
          </div>
        </div>

        {/* ── Job History ───────────────────────────────────── */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <History className="h-4 w-4 text-brand" />
            <h2 className="font-bold text-gray-900 dark:text-white">Service History</h2>
            <span className="ml-auto text-xs text-gray-400 dark:text-white/30">{visitCount} record{visitCount !== 1 ? 's' : ''}</span>
          </div>

          {jobs.length === 0 ? (
            <div className="card py-12 text-center">
              <TrendingUp className="h-8 w-8 text-gray-200 dark:text-white/10 mx-auto mb-3" />
              <p className="text-gray-400 dark:text-white/40">No job cards yet for this vehicle</p>
            </div>
          ) : (
            <div className="space-y-4">
              {jobs.map((job, i) => (
                <JobRecordCard key={job.id} job={job} index={i} />
              ))}
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        title="Delete this vehicle?"
        message={`This will permanently delete ${vehicle.plate_number} (${vehicle.make} ${vehicle.model}). This cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(false)}
      />
    </div>
  )
}
