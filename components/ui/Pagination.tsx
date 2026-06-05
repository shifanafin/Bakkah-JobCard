'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

interface Props {
  page: number
  totalItems: number
  pageSize: number
  onChange: (page: number) => void
}

export default function Pagination({ page, totalItems, pageSize, onChange }: Props) {
  const totalPages = Math.ceil(totalItems / pageSize)
  if (totalPages <= 1) return null

  const start = (page - 1) * pageSize + 1
  const end = Math.min(page * pageSize, totalItems)

  const pages: (number | 'ellipsis-left' | 'ellipsis-right')[] = []
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i)
  } else {
    pages.push(1)
    if (page > 3) pages.push('ellipsis-left')
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pages.push(i)
    if (page < totalPages - 2) pages.push('ellipsis-right')
    pages.push(totalPages)
  }

  return (
    <div className="flex items-center justify-between px-1 pt-2">
      <p className="text-xs text-gray-400 dark:text-white/30">
        {start}–{end} of {totalItems}
      </p>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onChange(page - 1)}
          disabled={page === 1}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-400 transition-colors hover:border-brand/30 hover:text-brand disabled:cursor-not-allowed disabled:opacity-30 dark:border-white/[0.08] dark:text-white/30"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        {pages.map((p, i) =>
          typeof p === 'string' ? (
            <span key={p} className="px-1 text-xs text-gray-400 dark:text-white/30">…</span>
          ) : (
            <button
              key={p}
              onClick={() => onChange(p)}
              className={cn(
                'flex h-8 w-8 items-center justify-center rounded-lg text-xs font-semibold transition-colors',
                p === page
                  ? 'bg-brand text-black'
                  : 'border border-gray-200 text-gray-500 hover:border-brand/30 hover:text-brand dark:border-white/[0.08] dark:text-white/50'
              )}
            >
              {p}
            </button>
          )
        )}

        <button
          onClick={() => onChange(page + 1)}
          disabled={page === totalPages}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-400 transition-colors hover:border-brand/30 hover:text-brand disabled:cursor-not-allowed disabled:opacity-30 dark:border-white/[0.08] dark:text-white/30"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
