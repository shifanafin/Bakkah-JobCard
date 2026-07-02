'use client'

import { useState, useEffect, useRef } from 'react'
import { Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils/cn'

export default function SwipeToDelete({
  children,
  onDelete,
  disabled,
  disabledReason,
}: {
  children: React.ReactNode
  onDelete: () => void
  disabled?: boolean
  disabledReason?: string
}) {
  const [tx, setTx] = useState(0)
  const [animating, setAnimating] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const startX = useRef(0)
  const startY = useRef(0)
  const startTx = useRef(0)
  const isHoriz = useRef<boolean | null>(null)
  const txRef = useRef(0)
  const REVEAL = 80

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const onTouchStart = (e: TouchEvent) => {
      startX.current = e.touches[0].clientX
      startY.current = e.touches[0].clientY
      startTx.current = txRef.current
      isHoriz.current = null
      setAnimating(false)
    }

    const onTouchMove = (e: TouchEvent) => {
      const dx = e.touches[0].clientX - startX.current
      const dy = Math.abs(e.touches[0].clientY - startY.current)
      if (isHoriz.current === null) {
        isHoriz.current = Math.abs(dx) > dy
      }
      if (!isHoriz.current) return
      e.preventDefault()
      const next = Math.max(Math.min(startTx.current + dx, 0), -REVEAL)
      txRef.current = next
      setTx(next)
    }

    const onTouchEnd = () => {
      if (!isHoriz.current) return
      setAnimating(true)
      const next = txRef.current < -REVEAL / 2 ? -REVEAL : 0
      txRef.current = next
      setTx(next)
    }

    el.addEventListener('touchstart', onTouchStart, { passive: true })
    el.addEventListener('touchmove', onTouchMove, { passive: false })
    el.addEventListener('touchend', onTouchEnd, { passive: true })
    return () => {
      el.removeEventListener('touchstart', onTouchStart)
      el.removeEventListener('touchmove', onTouchMove)
      el.removeEventListener('touchend', onTouchEnd)
    }
  }, [])

  function close() {
    setAnimating(true)
    txRef.current = 0
    setTx(0)
  }

  const isOpen = tx < -REVEAL / 2

  return (
    <div ref={ref} className="relative overflow-hidden rounded-2xl">
      {/* Delete zone revealed on left-swipe */}
      <div
        className={cn('absolute inset-y-0 right-0 flex flex-col items-center justify-center gap-1', disabled ? 'bg-gray-400 dark:bg-white/10' : 'bg-red-500')}
        style={{ width: REVEAL }}
      >
        <button
          onClick={() => {
            close()
            if (disabled) {
              if (disabledReason) toast.error(disabledReason)
              return
            }
            onDelete()
          }}
          className="flex h-full w-full flex-col items-center justify-center gap-1"
          aria-label="Delete"
        >
          <Trash2 className="h-5 w-5 text-white" />
          <span className="text-[9px] font-bold uppercase tracking-wide text-white/90">Delete</span>
        </button>
      </div>

      {/* Sliding card content */}
      <div
        style={{
          transform: `translateX(${tx}px)`,
          transition: animating ? 'transform 0.28s cubic-bezier(0.25,0.46,0.45,0.94)' : 'none',
          willChange: 'transform',
        }}
        onClick={isOpen ? (e) => { e.preventDefault(); e.stopPropagation(); close() } : undefined}
      >
        {children}
      </div>
    </div>
  )
}
