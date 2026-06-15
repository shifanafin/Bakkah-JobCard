'use client'

import { useState, useEffect, useCallback, use, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useSession } from '@/lib/auth-client'
import Header from '@/components/layout/Header'
import StatusStepper from '@/components/job-card/StatusStepper'
import QuotationSection from '@/components/job-card/QuotationSection'
import ProformaSection from '@/components/job-card/ProformaSection'
import TaxInvoiceSection from '@/components/job-card/TaxInvoiceSection'
import PhotoUpload from '@/components/job-card/PhotoUpload'
import { getJobCard, getTechnicians, assignTechnician } from '@/lib/queries'
import { JOB_STATUS_LABEL, JOB_STATUS_COLOR, JOB_TYPE_LABEL, PAYMENT_STATUS_COLOR, type JobCard, type JobStatus } from '@/types'
import { formatAED, formatDate } from '@/lib/utils/format'
import { ArrowLeft, Car, User, Wrench, Calendar, Loader2, RefreshCw, UserCheck, ChevronDown, History, Check, X, Clock, ChevronUp, AlertTriangle, Trash2 } from 'lucide-react'
import { formatDateTime } from '@/lib/utils/format'
import { cn } from '@/lib/utils/cn'
import { toast } from 'sonner'

function buildWhatsAppHref(job: JobCard): string {
  const origin = typeof window !== 'undefined' ? window.location.origin : ''
  const trackUrl = `${origin}/track?q=${encodeURIComponent(job.job_number)}`
  return `https://wa.me/${(job.customer?.phone ?? '').replace(/\D/g, '')}?text=${encodeURIComponent(trackUrl)}`
}

export default function JobCardDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const { data: session } = useSession()
  const role = (session?.user as { role?: string })?.role ?? ''
  const userName = (session?.user as { name?: string })?.name ?? ''
  const canAssign = role === 'admin' || role === 'supervisor'

  const [job, setJob] = useState<JobCard | null>(null)
  const [loading, setLoading] = useState(true)
  const [technicians, setTechnicians] = useState<{ id: string; name: string; role: string }[]>([])
  const [selectedTech, setSelectedTech] = useState('')
  const [isAssigning, startAssign] = useTransition()

  type HistoryEntry = { id: string; old_status: string | null; new_status: string; changed_by: string | null; notes: string | null; created_at: string }
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [historyOpen, setHistoryOpen] = useState(false)
  const [notifying, setNotifying] = useState(false)
  const [quotationApproved, setQuotationApproved] = useState(false)

  async function handleNotifyEmail() {
    if (!job) return
    setNotifying(true)
    try {
      const res = await fetch(`/api/job-cards/${id}/notify`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to send email')
      toast.success('Email sent to customer')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to send email')
    } finally {
      setNotifying(false)
    }
  }

  async function handleDelete() {
    if (!job) return
    const confirmed = window.confirm(
      `Delete job card ${job.job_number}?\n\nThis will permanently remove the job card and all related records. This cannot be undone.`
    )
    if (!confirmed) return
    try {
      const res = await fetch(`/api/job-cards/${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success(`Job card ${data.job_number} deleted`)
      router.push('/workshop/job-cards')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Delete failed')
    }
  }

  const load = useCallback(async () => {
    try {
      const { createClient } = await import('@/lib/supabase/client')
      const [data, histRes] = await Promise.all([
        getJobCard(id),
        createClient()
          .from('job_card_history')
          .select('id, old_status, new_status, changed_by, notes, created_at')
          .eq('job_card_id', id)
          .order('created_at', { ascending: true }),
      ])
      setJob(data)
      setHistory((histRes.data ?? []) as HistoryEntry[])
    }
    catch { toast.error('Failed to load job card') }
    finally { setLoading(false) }
  }, [id])

  useEffect(() => { load() }, [load])
  useEffect(() => {
    if (canAssign) getTechnicians().then(setTechnicians).catch(console.error)
  }, [canAssign])

  function handleAssign() {
    if (!selectedTech) { toast.error('Select a technician first'); return }
    startAssign(async () => {
      try {
        await assignTechnician(id, selectedTech)
        toast.success('Technician assigned')
        await load()
        setSelectedTech('')
      } catch { toast.error('Failed to assign technician') }
    })
  }

  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-surface-900">
      <Loader2 className="h-8 w-8 animate-spin text-brand" />
    </div>
  )

  if (!job) return (
    <div className="flex h-screen flex-col items-center justify-center bg-gray-50 gap-3 dark:bg-surface-900">
      <p className="text-gray-400 dark:text-white/50">Job card not found</p>
      <Link href="/workshop/job-cards" className="btn-ghost">Back to list</Link>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-surface-900">
      <Header title={job.job_number} subtitle={`${job.vehicle?.plate_number} · ${job.vehicle?.make} ${job.vehicle?.model}`} />

      <div className="p-4 space-y-5 min-w-full lg:p-6">
        {/* Breadcrumb + actions */}
        <div className="flex items-center justify-between">
          <Link href="/workshop/job-cards" className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors dark:text-white/40 dark:hover:text-white/70">
            <ArrowLeft className="h-4 w-4 rtl:rotate-180" /> Job Cards
          </Link>
          <div className="flex items-center gap-2">
            <button onClick={load} className="btn-ghost text-xs px-3 py-2 h-auto">
              <RefreshCw className="h-3.5 w-3.5" />
            </button>
            {/* Delete — admin only, only for inspection/cancelled jobs */}
            {(role === 'admin') && job && ['inspection', 'cancelled'].includes(job.status) && (
              <button onClick={handleDelete}
                className="flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-100 transition-colors dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400 dark:hover:bg-red-500/20">
                <Trash2 className="h-3.5 w-3.5" /> Delete
              </button>
            )}
          </div>
        </div>

        {/* Job header card */}
        <div className="card">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5 mb-2">
                <span className="font-mono text-lg font-bold text-brand">{job.job_number}</span>
                <span className={cn('badge', JOB_STATUS_COLOR[job.status])}>{JOB_STATUS_LABEL[job.status]}</span>
                <span className="badge border-gray-200 bg-gray-100 text-gray-500 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-white/40">{JOB_TYPE_LABEL[job.job_type]}</span>
              </div>
              <div className="flex flex-wrap gap-4 text-sm text-gray-500 dark:text-white/50">
                <span className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" /> In: {formatDate(job.date_in)}</span>
                {job.date_out && <span className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5 text-brand" /> Due: {formatDate(job.date_out)}</span>}
                {job.mileage_in && <span>Mileage: {job.mileage_in.toLocaleString()} km</span>}
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-brand">{formatAED(job.total)}</p>
              <p className={cn('text-sm font-semibold capitalize', PAYMENT_STATUS_COLOR[job.payment_status])}>{job.payment_status}</p>
            </div>
          </div>
        </div>

        {/* Customer decline banner */}
        {(() => {
          const declineEntry = history.find(h =>
            h.new_status === 'cancelled' && h.notes?.startsWith('Declined by customer')
          )
          if (!declineEntry) return null
          const reason = declineEntry.notes?.replace('Declined by customer: ', '').replace('Declined by customer', '').trim()
          return (
            <div className="card border-red-200 dark:border-red-500/20 bg-red-50 dark:bg-red-500/10">
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-100 dark:bg-red-500/20 shrink-0">
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-red-700 dark:text-red-400">Declined by Customer</p>
                  {reason && (
                    <p className="text-sm text-red-600/80 dark:text-red-400/70 mt-1 leading-relaxed">&ldquo;{reason}&rdquo;</p>
                  )}
                  <p className="text-xs text-red-500/60 dark:text-red-400/50 mt-1.5">{formatDateTime(declineEntry.created_at)}</p>
                </div>
              </div>
            </div>
          )
        })()}

        {/* Status stepper */}
        <StatusStepper
          jobId={job.id}
          currentStatus={job.status as JobStatus}
          hasTechnician={!!job.technician_id}
          userRole={role}
          userName={userName}
          onUpdate={s => { setJob(j => j ? { ...j, status: s } : j); load() }}
        />

        {/* Assign Technician — admin / supervisor / manager */}
        {canAssign && (
          <div className="card space-y-3">
            <div className="flex items-center gap-2 border-b border-gray-100 pb-3 dark:border-white/[0.06]">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand/15">
                <UserCheck className="h-3.5 w-3.5 text-brand" />
              </div>
              <h3 className="section-title">Assign Technician</h3>
              {job.technician && (
                <span className="ml-auto text-xs text-gray-400 dark:text-white/40">
                  Current: <span className="font-medium text-gray-600 dark:text-white/60">{job.technician.name}</span>
                </span>
              )}
            </div>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <select
                  value={selectedTech}
                  onChange={e => setSelectedTech(e.target.value)}
                  className="input-base appearance-none pr-8"
                >
                  <option value="">— Select technician —</option>
                  {technicians.map(t => (
                    <option key={t.id} value={t.id} className="dark:bg-zinc-900">{t.name} ({t.role})</option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-white/30" />
              </div>
              <button onClick={handleAssign} disabled={isAssigning || !selectedTech} className="btn-primary px-4">
                {isAssigning ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Assign'}
              </button>


            </div>
          </div>
        )}

        {/* Info grid */}
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {/* Customer */}
          <div className="card space-y-3">
            <div className="flex items-center gap-2 border-b border-gray-100 pb-3 dark:border-white/[0.06]">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-500/15">
                <User className="h-3.5 w-3.5 text-blue-400" />
              </div>
              <h3 className="section-title">Customer</h3>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-400 dark:text-white/40">Name</span><span className="text-gray-900 font-medium dark:text-white">{job.customer?.name}</span></div>
              <div className="flex justify-between"><span className="text-gray-400 dark:text-white/40">Phone</span><a href={`tel:${job.customer?.phone}`} className="text-brand hover:underline">{job.customer?.phone}</a></div>
              {job.customer?.email && <div className="flex justify-between"><span className="text-gray-400 dark:text-white/40">Email</span><span className="text-gray-600 dark:text-white/70">{job.customer.email}</span></div>}
              {job.customer?.company_name && <div className="flex justify-between"><span className="text-gray-400 dark:text-white/40">Company</span><span className="text-gray-600 dark:text-white/70">{job.customer.company_name}</span></div>}
              {job.customer?.is_fleet && <div className="flex justify-between"><span className="text-gray-400 dark:text-white/40">Account</span><span className="text-brand text-xs font-bold">Fleet Account</span></div>}
            </div>
          </div>

          {/* Vehicle */}
          <div className="card space-y-3">
            <div className="flex items-center gap-2 border-b border-gray-100 pb-3 dark:border-white/[0.06]">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand/15">
                <Car className="h-3.5 w-3.5 text-brand" />
              </div>
              <h3 className="section-title">Vehicle</h3>
              {job.vehicle_id && (
                <Link href={`/workshop/vehicles/${job.vehicle_id}`}
                  className="ml-auto flex items-center gap-1 text-xs text-brand hover:underline font-medium">
                  <History className="h-3.5 w-3.5" /> History
                </Link>
              )}
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-400 dark:text-white/40">Plate</span><span className="font-mono font-bold text-gray-900 tracking-wider dark:text-white">{job.vehicle?.plate_number}</span></div>
              <div className="flex justify-between"><span className="text-gray-400 dark:text-white/40">Vehicle</span><span className="text-gray-900 dark:text-white">{job.vehicle?.make} {job.vehicle?.model} {job.vehicle?.year}</span></div>
              {job.vehicle?.color && <div className="flex justify-between"><span className="text-gray-400 dark:text-white/40">Color</span><span className="text-gray-600 dark:text-white/70">{job.vehicle.color}</span></div>}
              {job.vehicle?.vin && <div className="flex justify-between"><span className="text-gray-400 dark:text-white/40">VIN</span><span className="font-mono text-gray-400 text-xs dark:text-white/50">{job.vehicle.vin}</span></div>}
              {job.technician && <div className="flex justify-between"><span className="text-gray-400 dark:text-white/40">Technician</span><span className="text-gray-600 dark:text-white/70">{job.technician.name}</span></div>}
            </div>
          </div>
        </div>

        {/* Complaint */}
        {(job.customer_complaint || job.work_instructions) && (
          <div className="card space-y-3">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-500/15">
                <Wrench className="h-3.5 w-3.5 text-purple-400" />
              </div>
              <h3 className="section-title">Job Notes</h3>
            </div>
            {job.customer_complaint && (
              <div>
                <p className="text-xs text-gray-400 mb-1 uppercase tracking-wider font-bold dark:text-white/30">Customer Complaint</p>
                <p className="text-sm text-gray-600 leading-relaxed dark:text-white/70">{job.customer_complaint}</p>
              </div>
            )}
            {job.work_instructions && (
              <div className={job.customer_complaint ? 'border-t border-gray-100 pt-3 dark:border-white/[0.06]' : ''}>
                <p className="text-xs text-gray-400 mb-1 uppercase tracking-wider font-bold dark:text-white/30">Work Instructions</p>
                <p className="text-sm text-gray-600 leading-relaxed dark:text-white/70">{job.work_instructions}</p>
              </div>
            )}
          </div>
        )}

        {/* Quotation */}
        <QuotationSection
          jobId={job.id}
          jobNumber={job.job_number}
          customerPhone={job.customer?.phone}
          customerName={job.customer?.name}
          customerEmail={job.customer?.email}
          canApprove={canAssign}
          onStatusChange={s => setQuotationApproved(s === 'approved')}
          onEmailNotify={handleNotifyEmail}
        />

        {/* Proforma Invoice — shown once quotation is approved */}
        {quotationApproved && (
          <ProformaSection
            jobId={job.id}
            jobNumber={job.job_number}
            jobStatus={job.status}
            customerPhone={job.customer?.phone}
          />
        )}

        {/* Tax Invoice — shown when job is delivered */}
        {job.status === 'delivered' && (
          <TaxInvoiceSection
            jobId={job.id}
            jobNumber={job.job_number}
            customerPhone={job.customer?.phone}
          />
        )}


        {/* Photos */}
        <PhotoUpload
          jobCardId={job.id}
          photos={job.photos ?? []}
          onPhotosChange={photos => setJob(j => j ? { ...j, photos } : j)}
        />

        {/* Status History Timeline */}
        {history.length > 0 && (
          <div className="card">
            <button
              className="flex w-full items-center gap-2 border-b border-gray-100 pb-3 dark:border-white/[0.06]"
              onClick={() => setHistoryOpen(o => !o)}
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-500/15">
                <History className="h-3.5 w-3.5 text-purple-400" />
              </div>
              <h3 className="section-title">Status History</h3>
              <span className="ml-1 rounded-full bg-gray-100 dark:bg-white/[0.06] px-2 py-0.5 text-xs text-gray-500 dark:text-white/40">
                {history.length}
              </span>
              <span className="ml-auto text-gray-300 dark:text-white/20">
                {historyOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </span>
            </button>

            {historyOpen && (
              <div className="mt-4 space-y-0">
                {history.map((entry, i) => {
                  const STATUS_LABEL: Record<string, string> = {
                    waiting_for_approval: 'Waiting for Approval',
                    pending: 'Pending', assigned: 'Assigned', received: 'Received',
                    in_progress: 'In Progress', qc_check: 'Quality Check',
                    ready: 'Ready for Collection', delivered: 'Delivered', cancelled: 'Cancelled',
                  }
                  const dotColors: Record<string, string> = {
                    waiting_for_approval: 'bg-orange-500',
                    pending: 'bg-amber-500', assigned: 'bg-blue-500', received: 'bg-blue-400',
                    in_progress: 'bg-brand', qc_check: 'bg-purple-500',
                    ready: 'bg-emerald-500', delivered: 'bg-gray-400', cancelled: 'bg-red-500',
                  }
                  const isLast = i === history.length - 1
                  const isDelivered = entry.new_status === 'delivered'
                  const isCancelled = entry.new_status === 'cancelled'
                  return (
                    <div key={entry.id} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className={cn(
                          'flex h-7 w-7 items-center justify-center rounded-full border-2 shrink-0',
                          isDelivered ? 'border-emerald-500 bg-emerald-500 text-white'
                            : isCancelled ? 'border-red-400 bg-red-400 text-white'
                              : isLast ? 'border-brand bg-brand text-black'
                                : 'border-gray-200 bg-white dark:border-white/15 dark:bg-surface-800'
                        )}>
                          {isDelivered ? <Check className="h-3.5 w-3.5" />
                            : isCancelled ? <X className="h-3.5 w-3.5" />
                              : <span className={cn('h-2 w-2 rounded-full', dotColors[entry.new_status] ?? 'bg-gray-400')} />}
                        </div>
                        {!isLast && <div className="flex-1 w-0.5 bg-gray-200 dark:bg-white/[0.06] my-1" style={{ minHeight: 16 }} />}
                      </div>
                      <div className={cn('pt-0.5', isLast ? 'pb-0' : 'pb-4')}>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                          {STATUS_LABEL[entry.new_status] ?? entry.new_status}
                        </p>
                        <div className="flex flex-wrap gap-x-3 mt-0.5">
                          <span className="flex items-center gap-1 text-xs text-gray-400 dark:text-white/40">
                            <Clock className="h-3 w-3" /> {formatDateTime(entry.created_at)}
                          </span>
                          {entry.changed_by && (
                            <span className="text-xs text-gray-500 dark:text-white/50">
                              by <span className="font-medium text-gray-700 dark:text-white/70">{entry.changed_by}</span>
                            </span>
                          )}
                        </div>
                        {entry.notes && (
                          <p className="text-xs italic text-gray-400 dark:text-white/30 mt-0.5">{entry.notes}</p>
                        )}
                        {entry.old_status && (
                          <p className="text-[10px] text-gray-300 dark:text-white/20 mt-0.5">
                            {STATUS_LABEL[entry.old_status] ?? entry.old_status} → {STATUS_LABEL[entry.new_status] ?? entry.new_status}
                          </p>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  )
}
