'use client'

import { useEffect, useState } from 'react'
import { Download, X, Share } from 'lucide-react'

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

function isIos() {
  if (typeof navigator === 'undefined') return false
  return /iphone|ipad|ipod/i.test(navigator.userAgent)
}

function isInStandaloneMode() {
  if (typeof window === 'undefined') return false
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    ('standalone' in navigator && (navigator as { standalone?: boolean }).standalone === true)
  )
}

export default function PwaInstallBanner() {
  const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showIosHint, setShowIosHint] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    if (isInStandaloneMode()) return
    if (sessionStorage.getItem('pwa-install-dismissed')) return

    if (isIos()) {
      setShowIosHint(true)
      return
    }

    const handler = (e: Event) => {
      e.preventDefault()
      setPrompt(e as BeforeInstallPromptEvent)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  function handleDismiss() {
    sessionStorage.setItem('pwa-install-dismissed', '1')
    setDismissed(true)
    setPrompt(null)
    setShowIosHint(false)
  }

  async function handleInstall() {
    if (!prompt) return
    await prompt.prompt()
    const { outcome } = await prompt.userChoice
    if (outcome === 'accepted') {
      setPrompt(null)
      // Navigate to login so the first PWA launch lands on the right page
      window.location.href = '/auth/login'
    }
  }

  if (dismissed) return null

  // iOS Safari: show "Add to Home Screen" instructions
  if (showIosHint) {
    return (
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 px-4 py-3 rounded-xl shadow-lg border border-amber-500/30 bg-[#1c1c1c] text-white w-[calc(100%-2rem)] max-w-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-500/10">
            <Share className="h-5 w-5 text-amber-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold leading-tight">Install Bakkah</p>
            <p className="text-xs text-gray-400 leading-tight mt-0.5">
              Tap <Share className="inline h-3 w-3 mx-0.5" /> then <strong>&quot;Add to Home Screen&quot;</strong>
            </p>
          </div>
          <button
            onClick={handleDismiss}
            className="shrink-0 p-1 text-gray-500 hover:text-gray-300 transition-colors"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    )
  }

  // Android / Chrome: native install prompt
  if (!prompt) return null

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border border-amber-500/30 bg-[#1c1c1c] text-white w-[calc(100%-2rem)] max-w-sm">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-500/10">
        <Download className="h-5 w-5 text-amber-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold leading-tight">Install Bakkah</p>
        <p className="text-xs text-gray-400 leading-tight mt-0.5">Add to home screen for quick access</p>
      </div>
      <button
        onClick={handleInstall}
        className="shrink-0 rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-semibold text-black hover:bg-amber-400 transition-colors"
      >
        Install
      </button>
      <button
        onClick={handleDismiss}
        className="shrink-0 p-1 text-gray-500 hover:text-gray-300 transition-colors"
        aria-label="Dismiss"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}
