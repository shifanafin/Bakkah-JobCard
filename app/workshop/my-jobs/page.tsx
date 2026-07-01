'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useSession } from '@/lib/auth-client'
import { createClient } from '@/lib/supabase/client'
import { updateJobStatus } from '@/lib/queries'
import Header from '@/components/layout/Header'
import { JOB_STATUS_LABEL, JOB_STATUS_COLOR, JOB_STATUS_STEP, type JobStatus } from '@/types'
import { formatDate } from '@/lib/utils/format'
import { Car, ArrowRight, Loader2, ChevronRight, Briefcase } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { toast } from 'sonner'

type MyJob = {
  id: string
  job_number: string
  status: JobStatus
  date_in: string
  date_out?: string
  customer?: { name: string }
  vehicle?: { plate_number: string; make: string; model: string }
}

const STATUS_ORDER: JobStatus[] = ['assigned', 'in_progress', 'qc_check', 'ready', 'delivered']

function nextStatus(current: JobStatus): JobStatus | null {
  // received is a legacy status â€" treat same as assigned
  const normalized = current === 'received' ? 'assigned' : current
  const idx = STATUS_ORDER.indexOf(normalized)
  if (idx < 0 || idx >= STATUS_ORDER.length - 1) return null
  return STATUS_ORDER[idx + 1]
}

function actionLabel(current: JobStatus): string {
  if (current === 'assigned' || current === 'received') return 'Start Job'
  const next = nextStatus(current)
  return next ? `â†’ ${JOB_STATUS_LABEL[next]}` : ''
}

export default function MyJobsPage() {
  const { data: session } = useSession()
  const userId = session?.user?.id ?? ''
  const [jobs, setJobs] = useState<MyJob[]>([])
  const [loading, setLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!userId) return
    try {
      const sb = createClient()
      const { data, error } = await sb
        .from('job_cards')
        .select(`
          id, job_number, status, date_in, date_out,
          customer:customers(name),
          vehicle:vehicles(plate_number, make, model)
        `)
        .eq('technician_id', userId)
        .not('status', 'in', '(delivered,cancelled)')
        .order('created_at', { ascending: false })
      if (error) throw error
      setJobs((data ?? []) as unknown as MyJob[])
    } catch {
      toast.error('Failed to load jobs')
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    if (userId) load()
  }, [userId, load])

  async function handleNextStep(job: MyJob) {
    const next = (job.status === 'assigned' || job.status === 'received') ? 'in_progress' : nextStatus(job.status)
    if (!next) return
    setUpdatingId(job.id)
    try {
      await updateJobStatus(job.id, next, session?.user?.name ?? undefined)
      toast.success(`Job moved to ${JOB_STATUS_LABEL[next]}`)
      await load()
    } catch {
      toast.error('Failed to update job status')
    } finally {
      setUpdatingId(null)
    }
  }

  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-surface-900">
      <Loader2 className="h-8 w-8 animate-spin text-brand" />
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-surface-900">
      <Header title="My Jobs" subtitle="Jobs assigned to you" />

      <div className="p-4 space-y-4 w-full max-w-full lg:p-6">

        {jobs.length === 0 ? (
          <div className="card flex flex-col items-center justify-center py-20 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-gray-200 bg-gray-50 mb-4 dark:border-white/[0.08] dark:bg-white/[0.04]">
              <Briefcase className="h-8 w-8 text-gray-300 dark:text-white/20" />
            </div>
            <p className="text-sm font-medium text-gray-500 dark:text-white/40">No active jobs assigned to you</p>
            <p className="text-xs text-gray-400 mt-1 dark:text-white/30">Check back later or contact your supervisor</p>
          </div>
        ) : (
          <div className="space-y-3">
            {jobs.map(job => {
              const canAdvance = nextStatus(job.status) !== null
              const isUpdating = updatingId === job.id
              const isStartJob = job.status === 'assigned' || job.status === 'received'

              return (
                <div key={job.id} className="card hover:border-gray-200 dark:hover:border-white/[0.12] transition-all">
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-gray-50 dark:border-white/[0.08] dark:bg-white/[0.04]">
                      <Car className="h-5 w-5 text-gray-400 dark:text-white/40" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="font-mono text-sm font-bold text-brand">{job.job_number}</span>
                        <span className={cn('badge', JOB_STATUS_COLOR[job.status])}>
                          {JOB_STATUS_LABEL[job.status]}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {job.vehicle?.plate_number} Â· {job.vehicle?.make} {job.vehicle?.model}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-white/40 mt-0.5">
                        {job.customer?.name} Â· In: {formatDate(job.date_in)}
                        {job.date_out && ` Â· Due: ${formatDate(job.date_out)}`}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {canAdvance && (
                        <button
                          onClick={() => handleNextStep(job)}
                          disabled={isUpdating}
                          className={cn(
                            'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-60',
                            isStartJob
                              ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                              : 'bg-brand text-black hover:bg-brand/80'
                          )}
                        >
                          {isUpdating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ChevronRight className="h-3.5 w-3.5" />}
                          {actionLabel(job.status)}
                        </button>
                      )}
                      <Link href={`/workshop/job-cards/${job.id}`}
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-400 hover:text-gray-700 hover:bg-gray-50 transition-colors dark:border-white/[0.08] dark:text-white/30 dark:hover:text-white/70 dark:hover:bg-white/[0.04]">
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

