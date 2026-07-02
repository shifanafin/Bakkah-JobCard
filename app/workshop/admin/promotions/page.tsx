'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from '@/lib/auth-client'
import { useRouter } from 'next/navigation'
import Header from '@/components/layout/Header'
import { Tag, Plus, Edit2, Trash2, Check, X, Loader2, ToggleLeft, ToggleRight, Sparkles } from 'lucide-react'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import SwipeToDelete from '@/components/ui/SwipeToDelete'
import { cn } from '@/lib/utils/cn'
import { toast } from 'sonner'

type Promotion = {
  id: string
  code: string
  name: string
  description: string | null
  discount_pct: number
  free_service: string | null
  terms: string | null
  is_active: boolean
  created_at: string
}

const BLANK = {
  code: '',
  name: '',
  description: '',
  discount_pct: '10',
  free_service: '',
  terms: '',
  is_active: true,
}

export default function PromotionsPage() {
  const { data: session, isPending } = useSession()
  const router = useRouter()
  const role = (session?.user as { role?: string } | undefined)?.role

  const [promotions, setPromotions] = useState<Promotion[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState(BLANK)
  const [saving, setSaving] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState(BLANK)
  const [savingEdit, setSavingEdit] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  useEffect(() => {
    if (!isPending && role !== 'admin') router.replace('/workshop/dashboard')
  }, [isPending, role, router])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/promotions')
      const d = await res.json()
      setPromotions(d.promotions ?? [])
    } catch { toast.error('Failed to load promotions') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!form.code.trim() || !form.name.trim()) { toast.error('Code and name are required'); return }
    setSaving(true)
    try {
      const res = await fetch('/api/promotions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error)
      toast.success('Promotion created')
      setShowAdd(false)
      setForm(BLANK)
      await load()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed')
    } finally { setSaving(false) }
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault()
    if (!editId) return
    setSavingEdit(true)
    try {
      const res = await fetch(`/api/promotions/${editId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error)
      toast.success('Promotion updated')
      setEditId(null)
      await load()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed')
    } finally { setSavingEdit(false) }
  }

  async function handleToggle(p: Promotion) {
    setTogglingId(p.id)
    try {
      const res = await fetch(`/api/promotions/${p.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !p.is_active }),
      })
      if (!res.ok) throw new Error()
      toast.success(p.is_active ? 'Promotion deactivated' : 'Promotion activated')
      await load()
    } catch { toast.error('Failed to update') }
    finally { setTogglingId(null) }
  }

  async function executeDelete(id: string) {
    setDeletingId(id)
    setConfirmDeleteId(null)
    try {
      const res = await fetch(`/api/promotions/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      toast.success('Promotion deleted')
      await load()
    } catch { toast.error('Failed to delete') }
    finally { setDeletingId(null) }
  }

  function startEdit(p: Promotion) {
    setEditId(p.id)
    setEditForm({
      code: p.code,
      name: p.name,
      description: p.description ?? '',
      discount_pct: p.discount_pct.toString(),
      free_service: p.free_service ?? '',
      terms: p.terms ?? '',
      is_active: p.is_active,
    })
  }

  const input = "input-base"
  const label = "label"

  if (isPending || role !== 'admin') return null

  return (
    <div className="flex min-h-screen flex-col bg-gray-50 dark:bg-surface-950">
      <Header title="Promotions" />
      <main className="flex-1 p-4 md:p-6 space-y-6 max-w-4xl mx-auto w-full">

        {/* Header row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-[#C9A227]" />
            <div>
              <h1 className="text-lg font-bold text-gray-900 dark:text-white">Promotions</h1>
              <p className="text-xs text-gray-500 dark:text-white/40">Manage offers shown to new customers in the chat widget</p>
            </div>
          </div>
          <button
            onClick={() => { setShowAdd(true); setEditId(null) }}
            className="btn-primary flex items-center gap-1.5 text-sm"
          >
            <Plus className="h-4 w-4" /> New Promotion
          </button>
        </div>

        {/* Info banner */}
        <div className="rounded-xl border border-blue-200 dark:border-blue-500/20 bg-blue-50 dark:bg-blue-500/[0.07] px-4 py-3 text-sm text-blue-700 dark:text-blue-300 leading-relaxed">
          <strong>How it works:</strong> The first <span className="font-semibold">active</span> promotion is automatically shown to first-time customers after they enter their phone number in the chat widget. The discount % and free service are applied to their job card automatically.
        </div>

        {/* Add form */}
        {showAdd && (
          <form onSubmit={handleAdd} className="card space-y-4">
            <div className="flex items-center justify-between">
              <p className="font-semibold text-gray-900 dark:text-white">New Promotion</p>
              <button type="button" onClick={() => setShowAdd(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-white/60 transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>
            <PromotionForm form={form} setForm={setForm} input={input} label={label} />
            <div className="flex gap-2 pt-1">
              <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                Create Promotion
              </button>
              <button type="button" onClick={() => setShowAdd(false)} className="btn-ghost">Cancel</button>
            </div>
          </form>
        )}

        {/* List */}
        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-brand" /></div>
        ) : promotions.length === 0 ? (
          <div className="card text-center py-12 text-gray-400 dark:text-white/30 space-y-2">
            <Tag className="h-8 w-8 mx-auto opacity-40" />
            <p className="text-sm">No promotions yet. Create one to get started.</p>
          </div>
        ) : (
          <>
            {/* Desktop view */}
            <div className="hidden md:block space-y-3">
              {promotions.map((p) => (
                <div key={p.id} className={cn(
                  'card space-y-0 p-0 overflow-hidden',
                  p.is_active && 'ring-1 ring-[#C9A227]/30'
                )}>
                  {editId === p.id ? (
                    <form onSubmit={handleEdit} className="p-5 space-y-4">
                      <PromotionForm form={editForm} setForm={setEditForm} input={input} label={label} />
                      <div className="flex gap-2">
                        <button type="submit" disabled={savingEdit} className="btn-primary flex items-center gap-2 text-sm">
                          {savingEdit ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                          Save Changes
                        </button>
                        <button type="button" onClick={() => setEditId(null)} className="btn-ghost text-sm">Cancel</button>
                      </div>
                    </form>
                  ) : (
                    <div className="p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <span className="font-mono text-xs font-bold text-[#C9A227] bg-[#C9A227]/10 px-2 py-0.5 rounded">{p.code}</span>
                            <span className={cn(
                              'text-[10px] font-semibold px-2 py-0.5 rounded-full',
                              p.is_active
                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400'
                                : 'bg-gray-100 text-gray-500 dark:bg-white/[0.06] dark:text-white/40'
                            )}>
                              {p.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                          <p className="font-semibold text-gray-900 dark:text-white">{p.name}</p>
                          {p.description && <p className="text-sm text-gray-500 dark:text-white/50 mt-0.5">{p.description}</p>}
                          <div className="mt-3 flex flex-wrap gap-3 text-sm">
                            <span className="flex items-center gap-1.5 text-gray-600 dark:text-white/60">
                              <span className="text-[#C9A227] font-bold">{p.discount_pct}%</span> discount
                            </span>
                            {p.free_service && (
                              <span className="flex items-center gap-1.5 text-gray-600 dark:text-white/60">
                                <span className="text-emerald-500">+</span> {p.free_service}
                              </span>
                            )}
                          </div>
                          {p.terms && <p className="mt-2 text-xs text-gray-400 dark:text-white/30 italic">{p.terms}</p>}
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => handleToggle(p)}
                            disabled={togglingId === p.id}
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:text-[#C9A227] hover:bg-[#C9A227]/10 transition-all"
                            title={p.is_active ? 'Deactivate' : 'Activate'}
                          >
                            {togglingId === p.id
                              ? <Loader2 className="h-4 w-4 animate-spin" />
                              : p.is_active
                                ? <ToggleRight className="h-5 w-5 text-emerald-500" />
                                : <ToggleLeft className="h-5 w-5" />}
                          </button>
                          <button
                            onClick={() => startEdit(p)}
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:text-brand hover:bg-brand/10 transition-all"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => setConfirmDeleteId(p.id)}
                            disabled={deletingId === p.id}
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all"
                          >
                            {deletingId === p.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Mobile view */}
            <div className="md:hidden space-y-2">
              {promotions.map((p) => (
                editId === p.id ? (
                  <div key={p.id} className={cn(
                    'card space-y-0 p-0 overflow-hidden',
                    p.is_active && 'ring-1 ring-[#C9A227]/30'
                  )}>
                    <form onSubmit={handleEdit} className="p-5 space-y-4">
                      <PromotionForm form={editForm} setForm={setEditForm} input={input} label={label} />
                      <div className="flex gap-2">
                        <button type="submit" disabled={savingEdit} className="btn-primary flex items-center gap-2 text-sm">
                          {savingEdit ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                          Save Changes
                        </button>
                        <button type="button" onClick={() => setEditId(null)} className="btn-ghost text-sm">Cancel</button>
                      </div>
                    </form>
                  </div>
                ) : (
                  <SwipeToDelete key={p.id} onDelete={() => setConfirmDeleteId(p.id)}>
                    <div className={cn(
                      'card space-y-0 p-0',
                      p.is_active && 'ring-1 ring-[#C9A227]/30'
                    )}>
                      <div className="p-5">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                              <span className="font-mono text-xs font-bold text-[#C9A227] bg-[#C9A227]/10 px-2 py-0.5 rounded">{p.code}</span>
                              <span className={cn(
                                'text-[10px] font-semibold px-2 py-0.5 rounded-full',
                                p.is_active
                                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400'
                                  : 'bg-gray-100 text-gray-500 dark:bg-white/[0.06] dark:text-white/40'
                              )}>
                                {p.is_active ? 'Active' : 'Inactive'}
                              </span>
                            </div>
                            <p className="font-semibold text-gray-900 dark:text-white">{p.name}</p>
                            {p.description && <p className="text-sm text-gray-500 dark:text-white/50 mt-0.5">{p.description}</p>}
                            <div className="mt-3 flex flex-wrap gap-3 text-sm">
                              <span className="flex items-center gap-1.5 text-gray-600 dark:text-white/60">
                                <span className="text-[#C9A227] font-bold">{p.discount_pct}%</span> discount
                              </span>
                              {p.free_service && (
                                <span className="flex items-center gap-1.5 text-gray-600 dark:text-white/60">
                                  <span className="text-emerald-500">+</span> {p.free_service}
                                </span>
                              )}
                            </div>
                            {p.terms && <p className="mt-2 text-xs text-gray-400 dark:text-white/30 italic">{p.terms}</p>}
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              onClick={() => handleToggle(p)}
                              disabled={togglingId === p.id}
                              className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:text-[#C9A227] hover:bg-[#C9A227]/10 transition-all"
                              title={p.is_active ? 'Deactivate' : 'Activate'}
                            >
                              {togglingId === p.id
                                ? <Loader2 className="h-4 w-4 animate-spin" />
                                : p.is_active
                                  ? <ToggleRight className="h-5 w-5 text-emerald-500" />
                                  : <ToggleLeft className="h-5 w-5" />}
                            </button>
                            <button
                              onClick={() => startEdit(p)}
                              className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:text-brand hover:bg-brand/10 transition-all"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </SwipeToDelete>
                )
              ))}
            </div>
          </>
        )}
      </main>

      <ConfirmDialog
        open={!!confirmDeleteId}
        title="Delete Promotion?"
        message="This promotion code will be permanently removed."
        detail="This cannot be undone."
        confirmLabel="Delete"
        loading={deletingId === confirmDeleteId}
        onConfirm={() => confirmDeleteId && executeDelete(confirmDeleteId)}
        onCancel={() => setConfirmDeleteId(null)}
      />
    </div>
  )
}

function PromotionForm({
  form,
  setForm,
  input,
  label,
}: {
  form: typeof BLANK
  setForm: React.Dispatch<React.SetStateAction<typeof BLANK>>
  input: string
  label: string
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div>
        <label className={label}>Promo Code *</label>
        <input
          value={form.code}
          onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
          placeholder="e.g. WELCOME10"
          className={cn(input, 'font-mono uppercase')}
          required
        />
      </div>
      <div>
        <label className={label}>Promotion Name *</label>
        <input
          value={form.name}
          onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
          placeholder="e.g. First Visit Welcome Offer"
          className={input}
          required
        />
      </div>
      <div className="sm:col-span-2">
        <label className={label}>Description</label>
        <input
          value={form.description}
          onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
          placeholder="Short description shown to customers in chat"
          className={input}
        />
      </div>
      <div>
        <label className={label}>Discount % *</label>
        <input
          type="number"
          min={0}
          max={100}
          step={0.5}
          value={form.discount_pct}
          onChange={e => setForm(f => ({ ...f, discount_pct: e.target.value }))}
          className={input}
          required
        />
      </div>
      <div>
        <label className={label}>Free Service (optional)</label>
        <input
          value={form.free_service}
          onChange={e => setForm(f => ({ ...f, free_service: e.target.value }))}
          placeholder="e.g. Complimentary Headlight Restoration"
          className={input}
        />
      </div>
      <div className="sm:col-span-2">
        <label className={label}>Terms & Conditions</label>
        <input
          value={form.terms}
          onChange={e => setForm(f => ({ ...f, terms: e.target.value }))}
          placeholder="e.g. Valid on first visit only. Cannot be combined with other offers."
          className={input}
        />
      </div>
      <div className="sm:col-span-2 flex items-center gap-2">
        <input
          type="checkbox"
          id="is_active"
          checked={form.is_active}
          onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))}
          className="h-4 w-4 rounded border-gray-300 accent-brand"
        />
        <label htmlFor="is_active" className="text-sm font-medium text-gray-700 dark:text-white/70 cursor-pointer">
          Active — show this promotion to new customers in chat
        </label>
      </div>
    </div>
  )
}
