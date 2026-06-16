'use client'

import { useState, useEffect, useCallback } from 'react'
import Header from '@/components/layout/Header'
import { Tag, Plus, Edit2, Trash2, Check, X, Loader2, Search } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { toast } from 'sonner'

type JobType = {
  id: string
  name: string
  active: boolean
  sort_order: number
}

export default function JobTypesPage() {
  const [types, setTypes] = useState<JobType[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [newName, setNewName] = useState('')
  const [saving, setSaving] = useState(false)

  const [editId, setEditId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [savingEdit, setSavingEdit] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/job-types?all=1')
      const d = await res.json()
      setTypes(d.job_types ?? [])
    } catch { toast.error('Failed to load job types') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const filtered = types.filter(t =>
    !search.trim() || t.name.toLowerCase().includes(search.toLowerCase())
  )

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!newName.trim()) { toast.error('Name is required'); return }
    setSaving(true)
    try {
      const res = await fetch('/api/job-types', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName }),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error)
      toast.success('Job type added')
      setShowAdd(false)
      setNewName('')
      await load()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to add')
    } finally { setSaving(false) }
  }

  async function handleSaveEdit(id: string) {
    if (!editName.trim()) { toast.error('Name is required'); return }
    setSavingEdit(true)
    try {
      const res = await fetch(`/api/job-types/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editName }),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error)
      setTypes(ts => ts.map(t => t.id === id ? d.job_type : t))
      setEditId(null)
      toast.success('Job type updated')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update')
    } finally { setSavingEdit(false) }
  }

  async function handleToggleActive(t: JobType) {
    try {
      const res = await fetch(`/api/job-types/${t.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !t.active }),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error)
      setTypes(ts => ts.map(x => x.id === t.id ? d.job_type : x))
      toast.success(d.job_type.active ? 'Job type enabled' : 'Job type disabled')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed')
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this job type?')) return
    setDeletingId(id)
    try {
      const res = await fetch(`/api/job-types/${id}`, { method: 'DELETE' })
      if (!res.ok) { const d = await res.json(); throw new Error(d.error) }
      setTypes(ts => ts.filter(t => t.id !== id))
      toast.success('Job type deleted')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete')
    } finally { setDeletingId(null) }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-surface-900">
      <Header
        title="Job Types"
        subtitle={`${types.filter(t => t.active).length} active — shown in Work Order dropdown`}
      />

      <div className="p-4 lg:p-6 space-y-5">
        {/* Toolbar */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search job types…"
              className="input-base pl-9 w-full"
            />
          </div>
          <button onClick={() => setShowAdd(v => !v)} className="btn-primary gap-2">
            <Plus className="h-4 w-4" /> New Job Type
          </button>
        </div>

        {/* Add form */}
        {showAdd && (
          <form onSubmit={handleAdd} className="card space-y-4">
            <h3 className="section-title border-b border-gray-100 dark:border-white/[0.06] pb-3">New Job Type</h3>
            <div>
              <label className="label">Name <span className="text-brand">*</span></label>
              <input
                value={newName}
                onChange={e => setNewName(e.target.value)}
                placeholder="e.g. Full Service, Body Repair, AC Service…"
                className="input-base w-full"
                autoFocus
              />
            </div>
            <div className="flex gap-2 pt-1 border-t border-gray-100 dark:border-white/[0.06]">
              <button type="submit" disabled={saving} className="btn-primary gap-2">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                Add Job Type
              </button>
              <button type="button" onClick={() => { setShowAdd(false); setNewName('') }} className="btn-ghost">
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* List */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-brand" />
          </div>
        ) : types.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <Tag className="h-10 w-10 text-gray-200 dark:text-white/10" />
            <p className="text-sm text-gray-400">No job types yet. Add your first one above.</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <Search className="h-8 w-8 text-gray-200 dark:text-white/10" />
            <p className="text-sm text-gray-400">No job types match your search</p>
          </div>
        ) : (
          <div className="card space-y-1">
            {filtered.map(t => (
              <div
                key={t.id}
                className={cn(
                  'rounded-lg border px-3 py-2.5',
                  t.active
                    ? 'border-gray-100 dark:border-white/[0.06]'
                    : 'border-dashed border-gray-200 dark:border-white/[0.04] opacity-50'
                )}
              >
                {editId === t.id ? (
                  <div className="flex items-center gap-2">
                    <input
                      value={editName}
                      onChange={e => setEditName(e.target.value)}
                      className="input-base flex-1 text-sm py-1.5"
                      autoFocus
                      onKeyDown={e => { if (e.key === 'Enter') handleSaveEdit(t.id); if (e.key === 'Escape') setEditId(null) }}
                    />
                    <button onClick={() => handleSaveEdit(t.id)} disabled={savingEdit}
                      className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand/10 text-brand hover:bg-brand/20 transition">
                      {savingEdit ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                    </button>
                    <button onClick={() => setEditId(null)}
                      className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 transition dark:hover:bg-white/[0.06]">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <Tag className="h-3.5 w-3.5 text-gray-300 dark:text-white/20 shrink-0" />
                    <span className="flex-1 text-sm font-medium text-gray-800 dark:text-white/80">{t.name}</span>
                    {!t.active && (
                      <span className="text-[10px] font-bold uppercase tracking-wide text-gray-300 dark:text-white/20">
                        Disabled
                      </span>
                    )}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => { setEditId(t.id); setEditName(t.name) }}
                        className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition dark:hover:bg-white/[0.06] dark:hover:text-white/70"
                        title="Edit">
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleToggleActive(t)}
                        className={cn(
                          'flex h-7 w-7 items-center justify-center rounded-lg transition',
                          t.active
                            ? 'text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-white/[0.06]'
                            : 'text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-500/10'
                        )}
                        title={t.active ? 'Disable' : 'Enable'}>
                        <Check className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(t.id)}
                        disabled={deletingId === t.id}
                        className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-300 hover:bg-red-50 hover:text-red-500 transition dark:text-white/20 dark:hover:bg-red-500/10 dark:hover:text-red-400"
                        title="Delete">
                        {deletingId === t.id
                          ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          : <Trash2 className="h-3.5 w-3.5" />}
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
