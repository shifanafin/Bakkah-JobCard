'use client'

import { useState, useTransition } from 'react'
import { updateJobStatus, approveJob } from '@/lib/queries'
import { JOB_STATUS_LABEL, JOB_STATUS_STEP, type JobStatus } from '@/types'
import { Check, Loader2, UserX, ShieldCheck } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils/cn'

const STEPS: JobStatus[] = ['waiting_for_approval', 'pending', 'assigned', 'in_progress', 'qc_check', 'ready', 'delivered']

export default function StatusStepper({ jobId, currentStatus, hasTechnician, userRole, userName, onUpdate }: {
  jobId: string
  currentStatus: JobStatus
  hasTechnician: boolean
  userRole?: string
  userName?: string
  onUpdate: (s: JobStatus) => void
}) {
  const [isPending, startTransition] = useTransition()

  // received is a legacy status — treat it as pending (step 1)
  const displayStatus: JobStatus = currentStatus === 'received' ? 'pending' : currentStatus
  const curStep = JOB_STATUS_STEP[displayStatus] ?? 0

  const isWaitingApproval = displayStatus === 'waiting_for_approval'
  const canApprove = isWaitingApproval &&
    (userRole === 'admin' || userRole === 'supervisor' || userRole === 'manager')

  const canAdvance =
    !isWaitingApproval &&
    displayStatus !== 'delivered' &&
    displayStatus !== 'cancelled' &&
    !(displayStatus === 'pending' && !hasTechnician)

  const nextStep = STEPS[curStep + 1]

  function handleApprove() {
    startTransition(async () => {
      try {
        await approveJob(jobId, userName)
        const newStatus: JobStatus = hasTechnician ? 'assigned' : 'pending'
        onUpdate(newStatus)
        toast.success('Job approved')
      } catch { toast.error('Failed to approve job') }
    })
  }

  function advance() {
    if (!canAdvance || !nextStep) return
    startTransition(async () => {
      try {
        await updateJobStatus(jobId, nextStep)
        onUpdate(nextStep)
        toast.success(`Status updated to ${JOB_STATUS_LABEL[nextStep]}`)
      } catch { toast.error('Failed to update status') }
    })
  }

  if (displayStatus === 'cancelled') {
    return (
      <div className="card">
        <h3 className="section-title mb-3">Job Status</h3>
        <span className="badge bg-red-500/15 text-red-400 border-red-500/25">Cancelled</span>
      </div>
    )
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="section-title">Job Status</h3>
        {isWaitingApproval && canApprove ? (
          <button onClick={handleApprove} disabled={isPending}
            className="flex items-center gap-1.5 rounded-lg bg-orange-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-orange-600 transition-colors h-auto disabled:opacity-50">
            {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <><ShieldCheck className="h-3.5 w-3.5" /> Approve Job</>}
          </button>
        ) : isWaitingApproval ? (
          <span className="flex items-center gap-1.5 text-xs text-orange-400">
            <ShieldCheck className="h-3.5 w-3.5" /> Awaiting approval
          </span>
        ) : displayStatus === 'pending' && !hasTechnician ? (
          <span className="flex items-center gap-1.5 text-xs text-yellow-400">
            <UserX className="h-3.5 w-3.5" /> Assign a technician to advance
          </span>
        ) : canAdvance && nextStep ? (
          <button onClick={advance} disabled={isPending} className="btn-primary text-xs px-3 py-1.5 h-auto">
            {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : `→ Move to ${JOB_STATUS_LABEL[nextStep]}`}
          </button>
        ) : null}
      </div>

      {/* Desktop stepper */}
      <div className="hidden sm:flex items-center">
        {STEPS.map((step, i) => {
          const done   = i < curStep
          const active = i === curStep
          return (
            <div key={step} className="flex flex-1 items-center last:flex-none">
              <div className="flex flex-col items-center">
                <div className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-bold transition-all',
                  done   ? 'border-emerald-500 bg-emerald-500 text-white' :
                  active && isWaitingApproval ? 'border-orange-500 bg-orange-500 text-white' :
                  active ? 'border-brand bg-brand text-black' :
                           'border-gray-200 bg-gray-100 text-gray-300 dark:border-white/15 dark:bg-white/5 dark:text-white/30'
                )}>
                  {done ? <Check className="h-4 w-4" /> : i + 1}
                </div>
                <span className={cn('mt-1.5 text-[10px] font-semibold whitespace-nowrap',
                  active && isWaitingApproval ? 'text-orange-400' :
                  active ? 'text-brand' :
                  done ? 'text-emerald-400' : 'text-gray-300 dark:text-white/30'
                )}>{JOB_STATUS_LABEL[step]}</span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={cn('flex-1 h-0.5 mx-2 rounded-full transition-all', i < curStep ? 'bg-emerald-500' : 'bg-gray-200 dark:bg-white/10')} />
              )}
            </div>
          )
        })}
      </div>

      {/* Mobile */}
      <div className="sm:hidden flex items-center gap-3">
        <div className={cn(
          'flex h-9 w-9 items-center justify-center rounded-full font-bold text-sm',
          isWaitingApproval ? 'bg-orange-500 text-white' : 'bg-brand text-black'
        )}>
          {curStep + 1}
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-900 dark:text-white">{JOB_STATUS_LABEL[displayStatus]}</p>
          {canAdvance && nextStep && <p className="text-xs text-gray-400 dark:text-white/40">Next: {JOB_STATUS_LABEL[nextStep]}</p>}
          {isWaitingApproval && <p className="text-xs text-orange-400">Approval required to proceed</p>}
        </div>
      </div>
    </div>
  )
}
