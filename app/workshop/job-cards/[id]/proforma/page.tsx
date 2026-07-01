'use client'

import { useState, useEffect, useCallback, use } from 'react'
import Link from 'next/link'
import Header from '@/components/layout/Header'
import ProformaSection from '@/components/job-card/ProformaSection'
import { getJobCard } from '@/lib/queries'
import type { JobCard } from '@/types'
import { ChevronLeft, Receipt, ChevronRight, Loader2 } from 'lucide-react'

export default function JobCardProformaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)

  const [job, setJob] = useState<JobCard | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    try {
      const data = await getJobCard(id)
      setJob(data)
    } catch {
      setJob(null)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => { load() }, [load])

  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-surface-900">
      <Loader2 className="h-8 w-8 animate-spin text-brand" />
    </div>
  )

  if (!job) return (
    <div className="flex h-screen flex-col items-center justify-center gap-3 bg-gray-50 dark:bg-surface-900">
      <p className="text-gray-400 dark:text-white/50">Job card not found</p>
      <Link href="/workshop/job-cards" className="btn-ghost">Back to list</Link>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-surface-900">
      <Header title="Proforma Invoice" subtitle={`${job.job_number} · ${job.customer?.name ?? ''}`} />
      <div className="mx-auto max-w-3xl space-y-4 p-4 lg:p-6">
        {/* iOS-style nav bar */}
        <div className="flex items-center justify-between gap-2">
          <Link
            href={`/workshop/job-cards/${id}`}
            className="flex items-center gap-0.5 text-brand font-medium active:opacity-50 transition-opacity -ml-1 py-1 pr-2 min-w-0"
          >
            <ChevronLeft className="h-5 w-5 shrink-0" />
            <span className="text-[15px] truncate">{job.job_number}</span>
          </Link>
          <Link
            href={`/workshop/job-cards/${id}/tax-invoice`}
            className="flex items-center gap-1 text-sm text-brand font-medium active:opacity-50 transition-opacity"
          >
            <Receipt className="h-4 w-4" />
            <span className="text-[13px]">Tax Invoice</span>
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>

        <ProformaSection
          jobId={job.id}
          jobNumber={job.job_number}
          customerPhone={job.customer?.phone}
          customerName={job.customer?.name}
          vehiclePlate={job.vehicle?.plate_number}
          readOnly={job.status === 'delivered'}
        />
      </div>
    </div>
  )
}
