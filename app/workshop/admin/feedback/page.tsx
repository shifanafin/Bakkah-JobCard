'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Header from '@/components/layout/Header'
import { Loader2, RefreshCw, Check, X, Star, Trash2, MessageSquare } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { toast } from 'sonner'
import { formatDate } from '@/lib/utils/format'

type Feedback = {
  id: string
  job_number: string | null
  customer_name: string
  rating: number
  comment: string | null
  approved: boolean
  created_at: string
}

type Filter = 'all' | 'pending' | 'approved'

function StarRow({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star
          key={i}
          className={cn('h-3.5 w-3.5', i <= rating ? 'fill-amber-400 text-amber-400' : 'text-gray-200 dark:text-white/10')}
        />
      ))}
    </div>
  )
}

export default function FeedbackPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const role = (session?.user as { role?: string })?.role

  const [feedback, setFeedback] = useState<Feedback[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<Filter>('all')
  const [processingId, setProcessingId] = useState<string | null>(null)

  useEffect(() => {
    if (status === 'authenticated' && role !== 'admin') router.replace('/workshop/dashboard')
  }, [status, role, router])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/feedback')
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)
      setFeedback(json.feedback ?? [])
    } catch {
      toast.error('Failed to load feedback')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { if (role === 'admin') load() }, [role, load])

  async function handleApprove(id: string, approved: boolean) {
    setProcessingId(id)
    try {
      const res = await fetch('/api/feedback', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, approved }),
      })
      if (!res.ok) throw new Error()
      toast.success(approved ? 'Feedback approved — now visible on website' : 'Feedback rejected')
      setFeedback(prev => prev.map(f => f.id === id ? { ...f, approved } : f))
    } catch {
      toast.error('Failed to update feedback')
    } finally {
      setProcessingId(null)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this feedback permanently?')) return
    setProcessingId(id)
    try {
      const res = await fetch('/api/feedback', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      if (!res.ok) throw new Error()
      toast.success('Feedback deleted')
      setFeedback(prev => prev.filter(f => f.id !== id))
    } catch {
      toast.error('Failed to delete')
    } finally {
      setProcessingId(null)
    }
  }

  if (status === 'loading' || (status === 'authenticated' && role !== 'admin')) {
    return <div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-brand" /></div>
  }

  const visible = feedback.filter(f => {
    if (filter === 'pending')  return !f.approved
    if (filter === 'approved') return f.approved
    return true
  })

  const pendingCount  = feedback.filter(f => !f.approved).length
  const approvedCount = feedback.filter(f => f.approved).length
  const avgRating     = feedback.length > 0
    ? (feedback.reduce((s, f) => s + f.rating, 0) / feedback.length).toFixed(1)
    : '—'

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-surface-900">
      <Header title="Customer Feedback" subtitle="Review and publish customer feedback" />

      <div className="p-4 space-y-5 max-w-5xl lg:p-6">

        {/* Summary */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Pending Review', value: pendingCount,  color: 'text-amber-400',  bg: 'bg-amber-500/10' },
            { label: 'Approved',       value: approvedCount, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
            { label: 'Avg. Rating',    value: avgRating,     color: 'text-brand',       bg: 'bg-brand/10' },
          ].map(({ label, value, color, bg }) => (
            <div key={label} className="card cursor-default text-center">
              <p className={cn('text-2xl font-bold', color)}>{value}</p>
              <p className="text-xs text-gray-500 dark:text-white/40 mt-1">{label}</p>
            </div>
          ))}
        </div>

        {/* Filters + Refresh */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex gap-1 rounded-lg border border-gray-200 bg-white p-1 dark:border-white/[0.07] dark:bg-surface-800">
            {(['all', 'pending', 'approved'] as Filter[]).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  'rounded-md px-3 py-1.5 text-xs font-semibold capitalize transition-colors',
                  filter === f
                    ? 'bg-brand text-black'
                    : 'text-gray-500 hover:text-gray-900 dark:text-white/40 dark:hover:text-white/80'
                )}
              >
                {f}{f === 'pending' && pendingCount > 0 && (
                  <span className="ml-1.5 rounded-full bg-amber-400 text-black px-1.5 py-0.5 text-[10px] font-bold">{pendingCount}</span>
                )}
              </button>
            ))}
          </div>
          <button onClick={load} className="btn-ghost text-xs px-3 py-2 h-auto">
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* List */}
        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-brand" /></div>
        ) : visible.length === 0 ? (
          <div className="card flex flex-col items-center py-16 text-center">
            <MessageSquare className="h-10 w-10 text-gray-200 mb-3 dark:text-white/10" />
            <p className="text-sm text-gray-400 dark:text-white/30">
              {filter === 'pending' ? 'No feedback pending review' : filter === 'approved' ? 'No approved feedback yet' : 'No feedback submitted yet'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {visible.map(f => (
              <div key={f.id} className={cn(
                'card transition-all',
                !f.approved && 'border-amber-200 dark:border-amber-500/20'
              )}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                      <span className="font-semibold text-gray-900 dark:text-white">{f.customer_name}</span>
                      {f.job_number && (
                        <span className="font-mono text-xs text-brand bg-brand/10 px-2 py-0.5 rounded-full">{f.job_number}</span>
                      )}
                      <span className={cn(
                        'rounded-full px-2 py-0.5 text-xs font-semibold',
                        f.approved ? 'bg-emerald-500/15 text-emerald-500' : 'bg-amber-500/15 text-amber-500'
                      )}>
                        {f.approved ? 'Published' : 'Pending'}
                      </span>
                    </div>
                    <StarRow rating={f.rating} />
                    {f.comment && (
                      <p className="mt-2 text-sm text-gray-600 dark:text-white/60 leading-relaxed">{f.comment}</p>
                    )}
                    <p className="mt-2 text-xs text-gray-400 dark:text-white/25">{formatDate(f.created_at)}</p>
                  </div>

                  {/* Actions */}
                  <div className="flex shrink-0 items-center gap-2">
                    {processingId === f.id ? (
                      <Loader2 className="h-4 w-4 animate-spin text-brand" />
                    ) : (
                      <>
                        {!f.approved ? (
                          <button
                            onClick={() => handleApprove(f.id, true)}
                            title="Approve & publish"
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-emerald-300 text-emerald-500 hover:bg-emerald-50 transition-colors dark:border-emerald-500/30 dark:hover:bg-emerald-500/10"
                          >
                            <Check className="h-4 w-4" />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleApprove(f.id, false)}
                            title="Unpublish"
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-400 hover:border-amber-300 hover:text-amber-500 transition-colors dark:border-white/[0.08] dark:text-white/30"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(f.id)}
                          title="Delete"
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-400 hover:border-red-300 hover:text-red-500 transition-colors dark:border-white/[0.08] dark:text-white/30"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
