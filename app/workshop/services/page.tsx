'use client'

import { useState, useEffect, useCallback } from 'react'
import Header from '@/components/layout/Header'
import { Wrench, Plus, Edit2, Trash2, Check, X, Loader2, Search } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { toast } from 'sonner'

type Service = {
  id: string
  name: string
  description?: string | null
  default_price: number
  active: boolean
  sort_order: number
}

const BLANK = { name: '', description: '', default_price: '', sort_order: '0' }

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState(BLANK)
  const [saving, setSaving] = useState(false)

  const [editId, setEditId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState(BLANK)
  const [savingEdit, setSavingEdit] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/services?all=1')
      const d = await res.json()
      setServices(d.services ?? [])
    } catch { toast.error('Failed to load services') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const filtered = services.filter(s => {
    const q = search.toLowerCase()
    return !q || s.name.toLowerCase().includes(q) || (s.description ?? '').toLowerCase().includes(q)
  })

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) { toast.error('Name is required'); return }
    setSaving(true)
    try {
      const res = await fetch('/api/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, category: 'general' }),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error)
      toast.success('Service added')
      setShowAdd(false)
      setForm(BLANK)
      await load()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to add')
    } finally { setSaving(false) }
  }

  function startEdit(s: Service) {
    setEditId(s.id)
    setEditForm({
      name: s.name,
      description: s.description ?? '',
      default_price: s.default_price.toString(),
      sort_order: s.sort_order.toString(),
    })
  }

  async function handleSaveEdit(id: string) {
    if (!editForm.name.trim()) { toast.error('Name is required'); return }
    setSavingEdit(true)
    try {
      const res = await fetch(`/api/services/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error)
      setServices(ss => ss.map(s => s.id === id ? d.service : s))
      setEditId(null)
      toast.success('Service updated')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update')
    } finally { setSavingEdit(false) }
  }

  async function handleToggleActive(s: Service) {
    try {
      const res = await fetch(`/api/services/${s.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !s.active }),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error)
      setServices(ss => ss.map(x => x.id === s.id ? d.service : x))
      toast.success(d.service.active ? 'Service enabled' : 'Service disabled')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed')
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id)
    try {
      const res = await fetch(`/api/services/${id}`, { method: 'DELETE' })
      if (!res.ok) { const d = await res.json(); throw new Error(d.error) }
      setServices(ss => ss.filter(s => s.id !== id))
      toast.success('Service deleted')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete')
    } finally { setDeletingId(null) }
  }

  const inputCls = 'input-base w-full'

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-surface-900">
      <Header title="Services" subtitle={`${services.filter(s => s.active).length} active`} />

      <div className="p-4 lg:p-6 space-y-5">
        {/* Toolbar */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search services…"
              className="input-base pl-9 w-full"
            />
          </div>
          <button onClick={() => setShowAdd(v => !v)} className="btn-primary gap-2">
            <Plus className="h-4 w-4" /> New Service
          </button>
        </div>

        {/* Add form */}
        {showAdd && (
          <form onSubmit={handleAdd} className="card space-y-4">
            <h3 className="section-title border-b border-gray-100 dark:border-white/[0.06] pb-3">New Service</h3>
            <ServiceFormFields form={form} setForm={setForm} inputCls={inputCls} />
            <div className="flex gap-2 pt-1 border-t border-gray-100 dark:border-white/[0.06]">
              <button type="submit" disabled={saving} className="btn-primary gap-2">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                Add Service
              </button>
              <button type="button" onClick={() => { setShowAdd(false); setForm(BLANK) }} className="btn-ghost">Cancel</button>
            </div>
          </form>
        )}

        {/* Service list */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-brand" />
          </div>
        ) : services.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <Wrench className="h-10 w-10 text-gray-200 dark:text-white/10" />
            <p className="text-sm text-gray-400">No services yet. Add your first service above.</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <Search className="h-8 w-8 text-gray-200 dark:text-white/10" />
            <p className="text-sm text-gray-400">No services match your search</p>
          </div>
        ) : (
          <div className="card space-y-1">
            {filtered.map(s => (
              <div key={s.id} className={cn('rounded-lg border px-3 py-2.5', s.active ? 'border-gray-100 dark:border-white/[0.06]' : 'border-dashed border-gray-200 dark:border-white/[0.04] opacity-50')}>
                {editId === s.id ? (
                  <div className="space-y-3 py-1">
                    <ServiceFormFields form={editForm} setForm={setEditForm} inputCls={inputCls} compact />
                    <div className="flex gap-2">
                      <button onClick={() => handleSaveEdit(s.id)} disabled={savingEdit}
                        className="btn-primary gap-1.5 text-xs !py-1.5 !px-3">
                        {savingEdit ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />} Save
                      </button>
                      <button onClick={() => setEditId(null)} className="btn-ghost text-xs">Cancel</button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium text-gray-800 dark:text-white/80">{s.name}</span>
                      {s.description && (
                        <span className="ml-2 text-xs text-gray-400 dark:text-white/30">{s.description}</span>
                      )}
                    </div>
                    <span className="text-sm font-semibold text-brand shrink-0 tabular-nums">
                      AED {s.default_price.toFixed(0)}
                    </span>
                    <div className="flex items-center gap-1 shrink-0">
                      <button onClick={() => startEdit(s)}
                        className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition dark:hover:bg-white/[0.06] dark:hover:text-white/70"
                        title="Edit">
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => handleToggleActive(s)}
                        className={cn('flex h-7 w-7 items-center justify-center rounded-lg transition',
                          s.active
                            ? 'text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-white/[0.06]'
                            : 'text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-500/10'
                        )}
                        title={s.active ? 'Disable' : 'Enable'}>
                        <Check className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => handleDelete(s.id)} disabled={deletingId === s.id}
                        className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-300 hover:bg-red-50 hover:text-red-500 transition dark:text-white/20 dark:hover:bg-red-500/10 dark:hover:text-red-400"
                        title="Delete">
                        {deletingId === s.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Shared form fields ────────────────────────────────────────────────────────

type FormState = { name: string; description: string; default_price: string; sort_order: string }

function ServiceFormFields({
  form, setForm, inputCls, compact = false,
}: {
  form: FormState
  setForm: React.Dispatch<React.SetStateAction<FormState>>
  inputCls: string
  compact?: boolean
}) {
  return (
    <div className={cn('grid gap-3', compact ? 'grid-cols-2' : 'grid-cols-1 sm:grid-cols-2')}>
      <div className={compact ? '' : 'sm:col-span-2'}>
        <label className="label">Name <span className="text-brand">*</span></label>
        <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
          placeholder="Oil Change" className={inputCls} />
      </div>
      {!compact && (
        <div className="sm:col-span-2">
          <label className="label">Description</label>
          <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            placeholder="Optional details shown to customer" className={inputCls} />
        </div>
      )}
      <div>
        <label className="label">Default Price (AED)</label>
        <input type="number" min={0} step={0.01} value={form.default_price}
          onChange={e => setForm(f => ({ ...f, default_price: e.target.value }))}
          placeholder="150" className={inputCls} />
      </div>
    </div>
  )
}
