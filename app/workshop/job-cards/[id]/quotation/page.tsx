'use client'

import { useState, useEffect, useCallback, use } from 'react'
import Link from 'next/link'
import { useSession } from '@/lib/auth-client'
import Header from '@/components/layout/Header'
import QuotationSection from '@/components/job-card/QuotationSection'
import { getJobCard } from '@/lib/queries'
import type { JobCard } from '@/types'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

export default function JobCardQuotationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { data: session } = useSession()
  const role = (session?.user as { role?: string } | undefined)?.role ?? ''
  const canAssign = role === 'admin' || role === 'supervisor'

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

  async function handleNotifyEmail() {
    try {
      const res = await fetch(`/api/job-cards/${id}/notify`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to send email')
      toast.success('Email sent to customer')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to send email')
    }
  }

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
      <Header title="Quotation" subtitle={`${job.job_number} · ${job.customer?.name ?? ''}`} />
      <div className="mx-auto max-w-3xl space-y-4 p-4 lg:p-6">
        <div className="flex items-center justify-between">
          <Link href={`/workshop/job-cards/${id}`} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors dark:text-white/40 dark:hover:text-white/70">
            <ArrowLeft className="h-4 w-4 rtl:rotate-180" /> Back to Job Card
          </Link>
          <Link href="/workshop/transactions" className="text-sm text-brand hover:underline">
            Transactions
          </Link>
        </div>

        <QuotationSection
          jobId={job.id}
          jobNumber={job.job_number}
          customerPhone={job.customer?.phone}
          customerName={job.customer?.name}
          customerEmail={job.customer?.email}
          vehiclePlate={job.vehicle?.plate_number}
          canApprove={canAssign}
          onEmailNotify={handleNotifyEmail}
          onJobUpdate={load}
          readOnly={job.status === 'delivered'}
        />
      </div>
    </div>
  )
}
