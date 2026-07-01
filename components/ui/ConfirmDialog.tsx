'use client'

import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Trash2, AlertTriangle, Loader2 } from 'lucide-react'

interface ConfirmDialogProps {
  open: boolean
  title: string
  message: string
  detail?: string
  confirmLabel?: string
  variant?: 'danger' | 'warning'
  loading?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export default function ConfirmDialog({
  open,
  title,
  message,
  detail,
  confirmLabel = 'Delete',
  variant = 'danger',
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onCancel()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onCancel])

  if (!open) return null

  const isDanger = variant === 'danger'
  const Icon = isDanger ? Trash2 : AlertTriangle
  const iconBg = isDanger ? 'bg-red-100 dark:bg-red-500/20' : 'bg-amber-100 dark:bg-amber-500/20'
  const iconColor = isDanger ? 'text-red-500' : 'text-amber-500'
  const btnCls = isDanger
    ? 'bg-red-500 hover:bg-red-600 active:bg-red-700 text-white'
    : 'bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white'

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={e => { if (e.target === e.currentTarget && !loading) onCancel() }}
    >
      <div className="w-full sm:max-w-sm rounded-t-3xl sm:rounded-2xl bg-white dark:bg-surface-800 shadow-2xl p-6 space-y-5 animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200">
        <div className="flex justify-center">
          <div className={`flex h-16 w-16 items-center justify-center rounded-full ${iconBg}`}>
            <Icon className={`h-8 w-8 ${iconColor}`} />
          </div>
        </div>
        <div className="text-center space-y-2">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">{title}</h2>
          <p className="text-sm text-gray-500 dark:text-white/50">{message}</p>
          {detail && (
            <p className={`text-xs font-medium ${isDanger ? 'text-red-500 dark:text-red-400' : 'text-amber-600 dark:text-amber-400'}`}>
              {detail}
            </p>
          )}
        </div>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 rounded-xl border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.04] px-4 py-2.5 text-sm font-semibold text-gray-700 dark:text-white/70 hover:bg-gray-50 dark:hover:bg-white/[0.07] transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`flex-1 flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors disabled:opacity-50 ${btnCls}`}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Icon className="h-4 w-4" />
            )}
            {loading ? 'Processing…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
