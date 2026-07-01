'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import Header from '@/components/layout/Header'
import { ChevronLeft, Lightbulb, Plus, Loader2, Check, X, Clock } from 'lucide-react'
import { toast } from 'sonner'

type FeedbackItem = { id: string; subject: string; body: string; status: string; created_at: string }

const STATUS_STYLE: Record<string, string> = {
  open: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  reviewed: 'bg-blue-500/10 text-blue-500',
  resolved: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
}

export default function SuggestionsPage() {
  const [items, setItems] = useState<FeedbackItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({ subject: '', message: '' })

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/my/feedback?type=suggestion')
      const data = await res.json()
      setItems(data.items ?? [])
    } catch { setItems([]) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.subject.trim() || !form.message.trim()) { toast.error('Please fill in all fields'); return }
    setSubmitting(true)
    try {
      const res = await fetch('/api/my/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'suggestion', subject: form.subject, message: form.message }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success('Suggestion submitted! Thank you.')
      setShowForm(false)
      setForm({ subject: '', message: '' })
      await load()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to submit')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-surface-900">
      <Header title="Suggestions" subtitle="Share ideas to improve the workshop" />

      <div className="p-4 pb-28 lg:p-6 lg:pb-8 max-w-2xl mx-auto space-y-5">

        <div className="flex items-center justify-between">
          <Link href="/workshop/attendance" className="flex items-center gap-0.5 text-brand font-medium active:opacity-50 -ml-1">
            <ChevronLeft className="h-5 w-5" />
            <span className="text-[15px]">Back</span>
          </Link>
          <button onClick={() => setShowForm(s => !s)}
            className="flex items-center gap-1.5 rounded-xl bg-brand px-3 py-1.5 text-xs font-bold text-black active:opacity-80 transition-opacity">
            {showForm ? <X className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
            {showForm ? 'Cancel' : 'New Suggestion'}
          </button>
        </div>

        {/* Form */}
        {showForm && (
          <div className="card space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                <Lightbulb className="h-4 w-4 text-emerald-500" />
              </div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white">Share Your Idea</h3>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label mb-1">Subject</label>
                <input value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
                  placeholder="Brief title for your suggestion" className="input-base w-full" required />
              </div>
              <div>
                <label className="label mb-1">Details</label>
                <textarea value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                  placeholder="Describe your suggestion in detail — what problem does it solve?" rows={4}
                  className="input-base w-full resize-none" required />
              </div>
              <button type="submit" disabled={submitting} className="btn-primary w-full">
                {submitting ? <><Loader2 className="h-4 w-4 animate-spin" /> Submitting...</> : <><Check className="h-4 w-4" /> Submit Suggestion</>}
              </button>
            </form>
          </div>
        )}

        {/* List */}
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-white/30 mb-3">My Suggestions</p>
          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-brand" /></div>
          ) : items.length === 0 ? (
            <div className="rounded-2xl bg-white dark:bg-surface-800 border border-gray-100 dark:border-white/[0.06] p-8 text-center">
              <Lightbulb className="h-8 w-8 text-gray-200 dark:text-white/10 mx-auto mb-2" />
              <p className="text-sm text-gray-400 dark:text-white/30">No suggestions yet — your ideas matter!</p>
            </div>
          ) : (
            <div className="rounded-2xl bg-white dark:bg-surface-800 border border-gray-100 dark:border-white/[0.06] shadow-sm overflow-hidden divide-y divide-gray-100 dark:divide-white/[0.06]">
              {items.map(item => (
                <div key={item.id} className="p-4 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{item.subject}</p>
                    <span className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${STATUS_STYLE[item.status] ?? STATUS_STYLE.open}`}>
                      {item.status}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-white/40 line-clamp-2">{item.body}</p>
                  <div className="flex items-center gap-1 text-[10px] text-gray-400 dark:text-white/25">
                    <Clock className="h-3 w-3" />
                    {new Date(item.created_at).toLocaleDateString('en-AE', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
