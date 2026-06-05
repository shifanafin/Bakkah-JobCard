'use client'

import { useState, useRef, useEffect } from 'react'
import { useT, LANG_META, type Lang } from '@/lib/i18n'
import { cn } from '@/lib/utils/cn'
import { ChevronDown } from 'lucide-react'

interface LanguageSwitcherProps {
  variant?: 'website' | 'app'
}

export default function LanguageSwitcher({ variant = 'website' }: LanguageSwitcherProps) {
  const { lang, setLang } = useT()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  const current = LANG_META[lang]

  if (variant === 'app') {
    return (
      <div className="relative" ref={ref}>
        <button
          onClick={() => setOpen(o => !o)}
          className="flex h-9 items-center gap-1.5 rounded-lg border border-gray-200 bg-gray-50 px-2.5 text-xs font-semibold text-gray-600 transition hover:bg-gray-100 hover:text-gray-900 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-white/50 dark:hover:border-white/[0.15] dark:hover:text-white/80"
          title="Change language"
        >
          <span>{current.flag}</span>
          <span className="hidden sm:inline">{current.code}</span>
          <ChevronDown className={cn('h-3 w-3 transition-transform duration-200', open && 'rotate-180')} />
        </button>
        {open && (
          <div className="absolute right-0 top-full z-50 mt-2 w-44 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg dark:border-white/[0.08] dark:bg-surface-800">
            {(Object.keys(LANG_META) as Lang[]).map(l => (
              <button
                key={l}
                onClick={() => { setLang(l); setOpen(false) }}
                className={cn(
                  'flex w-full items-center gap-3 px-3 py-2.5 text-sm transition-colors text-left',
                  l === lang
                    ? 'bg-brand/10 text-brand font-semibold'
                    : 'text-gray-700 hover:bg-gray-50 dark:text-white/70 dark:hover:bg-white/[0.06]'
                )}
              >
                <span className="text-base">{LANG_META[l].flag}</span>
                <span className="flex-1">{LANG_META[l].label}</span>
                <span className="text-[10px] text-gray-400 dark:text-white/30">{LANG_META[l].code}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    )
  }

  // Website variant — lighter styling for dark background
  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1.5 rounded-lg border border-white/[0.1] bg-white/[0.05] px-3 py-2 text-xs font-semibold text-white/60 transition hover:border-white/20 hover:bg-white/[0.08] hover:text-white"
        title="Change language"
      >
        <span>{current.flag}</span>
        <span>{current.code}</span>
        <ChevronDown className={cn('h-3 w-3 transition-transform duration-200', open && 'rotate-180')} />
      </button>
      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-44 overflow-hidden rounded-xl border border-white/[0.1] bg-[#111111] shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
          {(Object.keys(LANG_META) as Lang[]).map(l => (
            <button
              key={l}
              onClick={() => { setLang(l); setOpen(false) }}
              className={cn(
                'flex w-full items-center gap-3 px-3 py-2.5 text-sm transition-colors text-left',
                l === lang
                  ? 'bg-[#FF7F0A]/15 text-[#FF7F0A] font-semibold'
                  : 'text-white/60 hover:bg-white/[0.06] hover:text-white'
              )}
            >
              <span className="text-base">{LANG_META[l].flag}</span>
              <span className="flex-1">{LANG_META[l].label}</span>
              <span className="text-[10px] text-white/25">{LANG_META[l].code}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
