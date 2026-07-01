'use client'

import { useState, useEffect } from 'react'
import { Search, X, Car, Loader2 } from 'lucide-react'
import { getJobCards } from '@/lib/queries'
import type { JobCard } from '@/types'

export default function JobCardPicker({
  title,
  onSelect,
  onClose,
}: {
  title: string
  onSelect: (jobCard: JobCard) => void
  onClose: () => void
}) {
  const [search, setSearch] = useState('')
  const [jobCards, setJobCards] = useState<JobCard[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    const t = setTimeout(() => {
      getJobCards({ search: search || undefined })
        .then(list => setJobCards(list.slice(0, 30)))
        .catch(() => setJobCards([]))
        .finally(() => setLoading(false))
    }, 200)
    return () => clearTimeout(t)
  }, [search])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl dark:bg-surface-800 flex flex-col max-h-[80vh]">
        <div className="flex items-center justify-between border-b border-gray-100 dark:border-white/[0.06] px-5 py-4">
          <h2 className="font-bold text-gray-900 dark:text-white">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-white/60">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-4 border-b border-gray-100 dark:border-white/[0.06]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-white/30 pointer-events-none" />
            {/* eslint-disable-next-line jsx-a11y/no-autofocus */}
            <input
              autoFocus
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by job #, customer, or plate…"
              className="input-base w-full pl-9"
            />
          </div>
        </div>

        <div className="overflow-y-auto flex-1">
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-5 w-5 animate-spin text-brand" />
            </div>
          ) : jobCards.length === 0 ? (
            <p className="py-10 text-center text-sm text-gray-400 dark:text-white/30">No job cards found</p>
          ) : (
            jobCards.map(jc => (
              <button
                key={jc.id}
                onClick={() => onSelect(jc)}
                className="w-full flex items-center gap-3 px-5 py-3 hover:bg-gray-50 dark:hover:bg-white/[0.05] text-left transition-colors border-b border-gray-50 dark:border-white/[0.03] last:border-0"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand/10 shrink-0">
                  <Car className="h-4 w-4 text-brand" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-gray-900 dark:text-white">{jc.job_number}</span>
                    <span className="text-xs text-gray-400 dark:text-white/30">{jc.vehicle?.plate_number}</span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-white/40 truncate">
                    {jc.customer?.name} · {jc.vehicle?.make} {jc.vehicle?.model}
                  </p>
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
