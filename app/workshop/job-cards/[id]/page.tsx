'use client'

import { useState, useEffect, useCallback, use } from 'react'
import Link from 'next/link'
import Header from '@/components/layout/Header'
import StatusStepper from '@/components/job-card/StatusStepper'
import LineItems from '@/components/job-card/LineItems'
import PhotoUpload from '@/components/job-card/PhotoUpload'
import { getJobCard } from '@/lib/queries'
import { JOB_STATUS_LABEL, JOB_STATUS_COLOR, JOB_TYPE_LABEL, PAYMENT_STATUS_COLOR, type JobCard, type JobStatus, type JobCardPhoto } from '@/types'
import { formatAED, formatDate } from '@/lib/utils/format'
import { ArrowLeft, Car, User, Wrench, Calendar, Printer, Loader2, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { toast } from 'sonner'

export default function JobCardDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [job, setJob] = useState<JobCard | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    try { setJob(await getJobCard(id)) }
    catch { toast.error('Failed to load job card') }
    finally { setLoading(false) }
  }, [id])

  useEffect(() => { load() }, [load])

  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-surface-900">
      <Loader2 className="h-8 w-8 animate-spin text-brand" />
    </div>
  )

  if (!job) return (
    <div className="flex h-screen flex-col items-center justify-center bg-surface-900 gap-3">
      <p className="text-white/50">Job card not found</p>
      <Link href="/workshop/job-cards" className="btn-ghost">Back to list</Link>
    </div>
  )

  return (
    <div className="min-h-screen bg-surface-900">
      <Header title={job.job_number} subtitle={`${job.vehicle?.plate_number} · ${job.vehicle?.make} ${job.vehicle?.model}`} />

      <div className="p-6 space-y-5 max-w-5xl">
        {/* Breadcrumb + actions */}
        <div className="flex items-center justify-between">
          <Link href="/workshop/job-cards" className="flex items-center gap-2 text-sm text-white/40 hover:text-white/70 transition-colors">
            <ArrowLeft className="h-4 w-4" /> Job Cards
          </Link>
          <div className="flex items-center gap-2">
            <button onClick={load} className="btn-ghost text-xs px-3 py-2 h-auto">
              <RefreshCw className="h-3.5 w-3.5" />
            </button>
            <Link href={`/workshop/job-cards/${id}/invoice`} target="_blank" className="btn-ghost text-xs">
              <Printer className="h-3.5 w-3.5" /> Invoice
            </Link>
          </div>
        </div>

        {/* Job header card */}
        <div className="card border-white/[0.08] bg-surface-800">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5 mb-2">
                <span className="font-mono text-lg font-bold text-brand">{job.job_number}</span>
                <span className={cn('badge', JOB_STATUS_COLOR[job.status])}>{JOB_STATUS_LABEL[job.status]}</span>
                <span className="badge border-white/[0.08] bg-white/[0.04] text-white/40">{JOB_TYPE_LABEL[job.job_type]}</span>
              </div>
              <div className="flex flex-wrap gap-4 text-sm text-white/50">
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

        {/* Status stepper */}
        <StatusStepper
          jobId={job.id}
          currentStatus={job.status as JobStatus}
          onUpdate={s => setJob(j => j ? {...j, status: s} : j)}
        />

        {/* Info grid */}
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {/* Customer */}
          <div className="card space-y-3">
            <div className="flex items-center gap-2 border-b border-white/[0.06] pb-3">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-500/15">
                <User className="h-3.5 w-3.5 text-blue-400" />
              </div>
              <h3 className="section-title">Customer</h3>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-white/40">Name</span><span className="text-white font-medium">{job.customer?.name}</span></div>
              <div className="flex justify-between"><span className="text-white/40">Phone</span><a href={`tel:${job.customer?.phone}`} className="text-brand hover:underline">{job.customer?.phone}</a></div>
              {job.customer?.email && <div className="flex justify-between"><span className="text-white/40">Email</span><span className="text-white/70">{job.customer.email}</span></div>}
              {job.customer?.company_name && <div className="flex justify-between"><span className="text-white/40">Company</span><span className="text-white/70">{job.customer.company_name}</span></div>}
              {job.customer?.is_fleet && <div className="flex justify-between"><span className="text-white/40">Account</span><span className="text-brand text-xs font-bold">Fleet Account</span></div>}
            </div>
          </div>

          {/* Vehicle */}
          <div className="card space-y-3">
            <div className="flex items-center gap-2 border-b border-white/[0.06] pb-3">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand/15">
                <Car className="h-3.5 w-3.5 text-brand" />
              </div>
              <h3 className="section-title">Vehicle</h3>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-white/40">Plate</span><span className="font-mono font-bold text-white tracking-wider">{job.vehicle?.plate_number}</span></div>
              <div className="flex justify-between"><span className="text-white/40">Vehicle</span><span className="text-white">{job.vehicle?.make} {job.vehicle?.model} {job.vehicle?.year}</span></div>
              {job.vehicle?.color && <div className="flex justify-between"><span className="text-white/40">Color</span><span className="text-white/70">{job.vehicle.color}</span></div>}
              {job.vehicle?.vin && <div className="flex justify-between"><span className="text-white/40">VIN</span><span className="font-mono text-white/50 text-xs">{job.vehicle.vin}</span></div>}
              {job.technician && <div className="flex justify-between"><span className="text-white/40">Technician</span><span className="text-white/70">{job.technician.name}</span></div>}
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
                <p className="text-xs text-white/30 mb-1 uppercase tracking-wider font-bold">Customer Complaint</p>
                <p className="text-sm text-white/70 leading-relaxed">{job.customer_complaint}</p>
              </div>
            )}
            {job.work_instructions && (
              <div className={job.customer_complaint ? 'border-t border-white/[0.06] pt-3' : ''}>
                <p className="text-xs text-white/30 mb-1 uppercase tracking-wider font-bold">Work Instructions</p>
                <p className="text-sm text-white/70 leading-relaxed">{job.work_instructions}</p>
              </div>
            )}
          </div>
        )}

        {/* Services, Parts, Payment */}
        <LineItems job={job} onUpdate={load} />

        {/* Photos */}
        <PhotoUpload
          jobCardId={job.id}
          photos={job.photos ?? []}
          onPhotosChange={photos => setJob(j => j ? {...j, photos} : j)}
        />
      </div>
    </div>
  )
}
