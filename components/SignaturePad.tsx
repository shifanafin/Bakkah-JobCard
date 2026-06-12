'use client'

import { useRef, useEffect, useState, useCallback } from 'react'
import { Pen, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

interface SignaturePadProps {
  label: string
  onSave: (dataUrl: string | null) => void
  savedDataUrl?: string | null
  className?: string
}

export default function SignaturePad({ label, onSave, savedDataUrl, className }: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [drawing, setDrawing] = useState(false)
  const [hasStrokes, setHasStrokes] = useState(false)
  const lastPos = useRef<{ x: number; y: number } | null>(null)

  // If a saved signature comes in, draw it onto the canvas
  useEffect(() => {
    if (!savedDataUrl || !canvasRef.current) return
    const ctx = canvasRef.current.getContext('2d')
    if (!ctx) return
    const img = new Image()
    img.onload = () => {
      ctx.clearRect(0, 0, canvasRef.current!.width, canvasRef.current!.height)
      ctx.drawImage(img, 0, 0)
      setHasStrokes(true)
    }
    img.src = savedDataUrl
  }, [savedDataUrl])

  function getPos(e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) {
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    if ('touches' in e) {
      const touch = e.touches[0]
      return {
        x: (touch.clientX - rect.left) * scaleX,
        y: (touch.clientY - rect.top) * scaleY,
      }
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    }
  }

  function startDraw(e: React.MouseEvent | React.TouchEvent) {
    e.preventDefault()
    const canvas = canvasRef.current
    if (!canvas) return
    setDrawing(true)
    lastPos.current = getPos(e, canvas)
  }

  const draw = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault()
    if (!drawing) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const pos = getPos(e, canvas)
    ctx.beginPath()
    ctx.moveTo(lastPos.current?.x ?? pos.x, lastPos.current?.y ?? pos.y)
    ctx.lineTo(pos.x, pos.y)
    ctx.strokeStyle = '#1a1a1a'
    ctx.lineWidth = 2.5
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.stroke()
    lastPos.current = pos
    setHasStrokes(true)
  }, [drawing])

  function stopDraw(e: React.MouseEvent | React.TouchEvent) {
    e.preventDefault()
    if (!drawing) return
    setDrawing(false)
    lastPos.current = null
    // Auto-save on pen-up
    if (canvasRef.current && hasStrokes) {
      onSave(canvasRef.current.toDataURL('image/png'))
    }
  }

  function clear() {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    ctx?.clearRect(0, 0, canvas.width, canvas.height)
    setHasStrokes(false)
    onSave(null)
  }

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-white/80">
          <Pen className="h-3.5 w-3.5 text-brand" />
          {label}
        </label>
        {hasStrokes && (
          <button
            type="button"
            onClick={clear}
            className="flex items-center gap-1 text-xs text-red-400 hover:text-red-600 transition-colors"
          >
            <Trash2 className="h-3 w-3" /> Clear
          </button>
        )}
      </div>

      <div className="relative rounded-xl border-2 border-dashed border-gray-200 dark:border-white/10 bg-white dark:bg-white overflow-hidden"
        style={{ aspectRatio: '3/1', cursor: 'crosshair' }}>
        <canvas
          ref={canvasRef}
          width={900}
          height={300}
          className="w-full h-full touch-none"
          onMouseDown={startDraw}
          onMouseMove={draw}
          onMouseUp={stopDraw}
          onMouseLeave={stopDraw}
          onTouchStart={startDraw}
          onTouchMove={draw}
          onTouchEnd={stopDraw}
        />
        {!hasStrokes && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <p className="text-sm text-gray-300 select-none">Sign here</p>
          </div>
        )}
        {/* Baseline guide */}
        <div className="pointer-events-none absolute bottom-8 left-8 right-8 border-b border-gray-200" />
      </div>
      <p className="text-[11px] text-gray-400 dark:text-white/30">
        {hasStrokes ? 'Signature captured — draw again or clear to redo' : 'Use mouse or finger to sign above'}
      </p>
    </div>
  )
}
