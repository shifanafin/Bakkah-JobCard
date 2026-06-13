'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from '@/lib/auth-client'
import { useRouter } from 'next/navigation'
import Header from '@/components/layout/Header'
import {
  Loader2, Plus, Pencil, Trash2, Check, X, ChevronDown, ChevronRight,
  Tag, Package, RefreshCw, DollarSign, GripVertical,
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { toast } from 'sonner'

type Service = {
  id: string
  name: string
  description: string | null
  default_price: number
  category_id: string | null
  active: boolean
  sort_order: number
}

type Category = {
  id: string
  name: string
  description: string | null
  sort_order: number
  active: boolean
  services: Service[]
}

const inputCls = 'input-base w-full'

export default function ServicesPage() {
  const { data: session, isPending } = useSession()
  const router = useRouter()
  const role = (session?.user as { role?: string })?.role

  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  // New category form
  const [showNewCat, setShowNewCat] = useState(false)
  const [newCatName, setNewCatName] = useState('')
  const [newCatDesc, setNewCatDesc] = useState('')
  const [savingCat, setSavingCat] = useState(false)

  // Edit category
  const [editCatId, setEditCatId] = useState<string | null>(null)
  const [editCatName, setEditCatName] = useState('')
  const [editCatDesc, setEditCatDesc] = useState('')
  const [savingCatEdit, setSavingCatEdit] = useState(false)

  // Add service (per category)
  const [addSvcFor, setAddSvcFor] = useState<string | null>(null)
  const [svcForm, setSvcForm] = useState({ name: '', description: '', default_price: '', sort_order: '' })
  const [savingSvc, setSavingSvc] = useState(false)

  // Edit service
  const [editSvcId, setEditSvcId] = useState<string | null>(null)
  const [editSvcForm, setEditSvcForm] = useState({ name: '', description: '', default_price: '', sort_order: '' })
  const [savingSvcEdit, setSavingSvcEdit] = useState(false)

  useEffect(() => {
    if (!isPending && session && role !== 'admin' && role !== 'supervisor') {
      router.replace('/workshop/dashboard')
    }
  }, [isPending, role, router, session])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/services/categories?with_services=1')
      const d = await res.json()
      if (!res.ok) throw new Error(d.error)
      const cats: Category[] = d.categories ?? []
      setCategories(cats)
      // Auto-expand all categories on first load
      setExpanded(new Set(cats.map((c: Category) => c.id)))
    } catch {
      toast.error('Failed to load services')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (role === 'admin' || role === 'supervisor') load()
  }, [role, load])

  function toggleExpanded(id: string) {
    setExpanded(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  // ── Category CRUD ────────────────────────────────────────────────────────────
  async function handleCreateCategory(e: React.FormEvent) {
    e.preventDefault()
    if (!newCatName.trim()) { toast.error('Name is required'); return }
    setSavingCat(true)
    try {
      const res = await fetch('/api/services/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCatName.trim(), description: newCatDesc.trim() }),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error)
      toast.success('Category created')
      setShowNewCat(false)
      setNewCatName('')
      setNewCatDesc('')
      await load()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed')
    } finally {
      setSavingCat(false)
    }
  }

  async function handleSaveCategory(id: string) {
    setSavingCatEdit(true)
    try {
      const res = await fetch('/api/services/categories', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, name: editCatName.trim(), description: editCatDesc.trim() }),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error)
      toast.success('Category updated')
      setEditCatId(null)
      await load()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed')
    } finally {
      setSavingCatEdit(false)
    }
  }

  async function handleDeleteCategory(cat: Category) {
    if (!confirm(`Delete category "${cat.name}"? Its services will become uncategorised.`)) return
    try {
      const res = await fetch('/api/services/categories', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: cat.id }),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error)
      toast.success('Category deleted')
      await load()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed')
    }
  }

  // ── Service CRUD ─────────────────────────────────────────────────────────────
  async function handleCreateService(e: React.FormEvent, categoryId: string) {
    e.preventDefault()
    if (!svcForm.name.trim()) { toast.error('Name is required'); return }
    setSavingSvc(true)
    try {
      const res = await fetch('/api/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: svcForm.name.trim(),
          description: svcForm.description.trim() || null,
          default_price: parseFloat(svcForm.default_price) || 0,
          category_id: categoryId,
          sort_order: parseInt(svcForm.sort_order) || 0,
        }),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error)
      toast.success('Service added')
      setAddSvcFor(null)
      setSvcForm({ name: '', description: '', default_price: '', sort_order: '' })
      await load()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed')
    } finally {
      setSavingSvc(false)
    }
  }

  function startEditSvc(svc: Service) {
    setEditSvcId(svc.id)
    setEditSvcForm({
      name: svc.name,
      description: svc.description ?? '',
      default_price: svc.default_price.toString(),
      sort_order: svc.sort_order.toString(),
    })
  }

  async function handleSaveService(svcId: string) {
    setSavingSvcEdit(true)
    try {
      const res = await fetch(`/api/services/${svcId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editSvcForm.name.trim(),
          description: editSvcForm.description.trim() || null,
          default_price: parseFloat(editSvcForm.default_price) || 0,
          sort_order: parseInt(editSvcForm.sort_order) || 0,
        }),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error)
      toast.success('Service updated')
      setEditSvcId(null)
      await load()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed')
    } finally {
      setSavingSvcEdit(false)
    }
  }

  async function handleToggleService(svc: Service) {
    try {
      const res = await fetch(`/api/services/${svc.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !svc.active }),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error)
      toast.success(svc.active ? 'Service deactivated' : 'Service activated')
      await load()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed')
    }
  }

  async function handleDeleteService(svc: Service) {
    if (!confirm(`Delete service "${svc.name}"?`)) return
    try {
      const res = await fetch(`/api/services/${svc.id}`, { method: 'DELETE' })
      if (!res.ok) { const d = await res.json(); throw new Error(d.error) }
      toast.success('Service deleted')
      await load()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed')
    }
  }

  if (isPending || (!isPending && session && role !== 'admin' && role !== 'supervisor')) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-surface-900">
        <Loader2 className="h-8 w-8 animate-spin text-brand" />
      </div>
    )
  }

  const totalServices = categories.reduce((s, c) => s + c.services.length, 0)

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-surface-900">
      <Header title="Services" subtitle="Manage service categories and catalog" />

      <div className="p-4 lg:p-6 space-y-5">

        {/* Toolbar */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500 dark:text-white/40">
            {categories.length} categor{categories.length !== 1 ? 'ies' : 'y'} · {totalServices} services
          </p>
          <div className="flex gap-2">
            <button onClick={load} className="btn-ghost text-xs px-3 py-2 h-auto">
              <RefreshCw className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => { setShowNewCat(v => !v); setEditCatId(null) }}
              className="btn-primary gap-1.5 text-xs"
            >
              <Plus className="h-3.5 w-3.5" />
              New Category
            </button>
          </div>
        </div>

        {/* New category inline form */}
        {showNewCat && (
          <form onSubmit={handleCreateCategory} className="card space-y-3 border border-brand/20 bg-brand/[0.02]">
            <p className="text-sm font-semibold text-gray-700 dark:text-white/70 flex items-center gap-2">
              <Tag className="h-4 w-4 text-brand" /> New Category
            </p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="label mb-1">Name <span className="text-brand">*</span></label>
                <input value={newCatName} onChange={e => setNewCatName(e.target.value)} placeholder="e.g. Body Work" className={inputCls} autoFocus />
              </div>
              <div>
                <label className="label mb-1">Description</label>
                <input value={newCatDesc} onChange={e => setNewCatDesc(e.target.value)} placeholder="Optional description" className={inputCls} />
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <button type="submit" disabled={savingCat} className="btn-primary gap-1.5 text-xs">
                {savingCat ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                Create Category
              </button>
              <button type="button" onClick={() => setShowNewCat(false)} className="btn-ghost text-xs">Cancel</button>
            </div>
          </form>
        )}

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-brand" />
          </div>
        ) : categories.length === 0 ? (
          <div className="card flex flex-col items-center py-16 text-center gap-3">
            <Package className="h-10 w-10 text-gray-200 dark:text-white/10" />
            <p className="text-sm text-gray-400">No categories yet — create one above</p>
          </div>
        ) : (
          <div className="space-y-3">
            {categories.map(cat => {
              const isOpen = expanded.has(cat.id)
              const isEditingCat = editCatId === cat.id
              const isAddingSvc = addSvcFor === cat.id

              return (
                <div key={cat.id} className="card !p-0 overflow-hidden">
                  {/* Category header */}
                  <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 dark:border-white/[0.06] bg-gray-50/50 dark:bg-white/[0.02]">
                    <button
                      onClick={() => toggleExpanded(cat.id)}
                      className="text-gray-400 hover:text-gray-700 dark:text-white/30 dark:hover:text-white/70 transition-colors"
                    >
                      {isOpen
                        ? <ChevronDown className="h-4 w-4" />
                        : <ChevronRight className="h-4 w-4" />
                      }
                    </button>

                    {isEditingCat ? (
                      <div className="flex flex-1 items-center gap-2 flex-wrap">
                        <input
                          value={editCatName}
                          onChange={e => setEditCatName(e.target.value)}
                          className="input-base flex-1 min-w-[120px] py-1.5 text-sm"
                          autoFocus
                        />
                        <input
                          value={editCatDesc}
                          onChange={e => setEditCatDesc(e.target.value)}
                          placeholder="Description"
                          className="input-base flex-1 min-w-[120px] py-1.5 text-sm"
                        />
                        <button
                          onClick={() => handleSaveCategory(cat.id)}
                          disabled={savingCatEdit}
                          className="btn-primary text-xs py-1.5 px-3 gap-1"
                        >
                          {savingCatEdit ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                          Save
                        </button>
                        <button onClick={() => setEditCatId(null)} className="btn-ghost text-xs py-1.5 px-3">Cancel</button>
                      </div>
                    ) : (
                      <div className="flex flex-1 items-center justify-between gap-2 min-w-0">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-gray-900 dark:text-white text-sm">{cat.name}</span>
                            <span className="text-xs text-gray-400 dark:text-white/30">
                              {cat.services.length} service{cat.services.length !== 1 ? 's' : ''}
                            </span>
                          </div>
                          {cat.description && (
                            <p className="text-xs text-gray-400 dark:text-white/30 truncate">{cat.description}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            onClick={() => {
                              setAddSvcFor(isAddingSvc ? null : cat.id)
                              setExpanded(prev => new Set([...prev, cat.id]))
                              setSvcForm({ name: '', description: '', default_price: '', sort_order: '' })
                            }}
                            className="flex items-center gap-1 rounded-lg border border-brand/20 px-2.5 py-1 text-[11px] font-semibold text-brand hover:bg-brand/10 transition-colors"
                          >
                            <Plus className="h-3 w-3" /> Add Service
                          </button>
                          <button
                            onClick={() => {
                              setEditCatId(cat.id)
                              setEditCatName(cat.name)
                              setEditCatDesc(cat.description ?? '')
                            }}
                            className="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 dark:border-white/[0.08] text-gray-400 hover:border-brand/30 hover:text-brand transition-colors"
                          >
                            <Pencil className="h-3 w-3" />
                          </button>
                          <button
                            onClick={() => handleDeleteCategory(cat)}
                            className="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 dark:border-white/[0.08] text-gray-400 hover:border-red-400/30 hover:text-red-400 transition-colors"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Category body */}
                  {isOpen && (
                    <div className="px-4 pb-3 pt-2 space-y-1">
                      {/* Add service inline form */}
                      {isAddingSvc && (
                        <form
                          onSubmit={e => handleCreateService(e, cat.id)}
                          className="mb-3 rounded-xl border border-brand/20 bg-brand/[0.03] p-3 space-y-2"
                        >
                          <p className="text-xs font-semibold text-brand flex items-center gap-1.5">
                            <Plus className="h-3 w-3" /> New Service in {cat.name}
                          </p>
                          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                            <div className="sm:col-span-2">
                              <label className="label mb-0.5 text-[11px]">Name <span className="text-brand">*</span></label>
                              <input
                                value={svcForm.name}
                                onChange={e => setSvcForm(f => ({ ...f, name: e.target.value }))}
                                placeholder="Service name"
                                className={inputCls}
                                autoFocus
                              />
                            </div>
                            <div>
                              <label className="label mb-0.5 text-[11px]">Price (AED)</label>
                              <input
                                type="number"
                                min={0}
                                value={svcForm.default_price}
                                onChange={e => setSvcForm(f => ({ ...f, default_price: e.target.value }))}
                                placeholder="0"
                                className={inputCls}
                              />
                            </div>
                            <div>
                              <label className="label mb-0.5 text-[11px]">Sort Order</label>
                              <input
                                type="number"
                                value={svcForm.sort_order}
                                onChange={e => setSvcForm(f => ({ ...f, sort_order: e.target.value }))}
                                placeholder="0"
                                className={inputCls}
                              />
                            </div>
                            <div className="col-span-2 sm:col-span-4">
                              <label className="label mb-0.5 text-[11px]">Description</label>
                              <input
                                value={svcForm.description}
                                onChange={e => setSvcForm(f => ({ ...f, description: e.target.value }))}
                                placeholder="Optional description"
                                className={inputCls}
                              />
                            </div>
                          </div>
                          <div className="flex gap-2 pt-1">
                            <button type="submit" disabled={savingSvc} className="btn-primary gap-1 text-xs py-1.5">
                              {savingSvc ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
                              Add Service
                            </button>
                            <button type="button" onClick={() => setAddSvcFor(null)} className="btn-ghost text-xs py-1.5">Cancel</button>
                          </div>
                        </form>
                      )}

                      {/* Service list */}
                      {cat.services.length === 0 && !isAddingSvc ? (
                        <p className="py-4 text-center text-xs text-gray-400 dark:text-white/25 italic">
                          No services yet — click <strong>Add Service</strong> above
                        </p>
                      ) : (
                        cat.services.map(svc => (
                          <div key={svc.id} className={cn(
                            'group rounded-lg px-3 py-2 transition-colors',
                            !svc.active && 'opacity-50',
                            'hover:bg-gray-50 dark:hover:bg-white/[0.02]',
                          )}>
                            {editSvcId === svc.id ? (
                              <div className="space-y-2">
                                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                                  <div className="sm:col-span-2">
                                    <label className="label mb-0.5 text-[11px]">Name</label>
                                    <input
                                      value={editSvcForm.name}
                                      onChange={e => setEditSvcForm(f => ({ ...f, name: e.target.value }))}
                                      className={inputCls}
                                      autoFocus
                                    />
                                  </div>
                                  <div>
                                    <label className="label mb-0.5 text-[11px]">Price (AED)</label>
                                    <input
                                      type="number"
                                      min={0}
                                      value={editSvcForm.default_price}
                                      onChange={e => setEditSvcForm(f => ({ ...f, default_price: e.target.value }))}
                                      className={inputCls}
                                    />
                                  </div>
                                  <div>
                                    <label className="label mb-0.5 text-[11px]">Sort Order</label>
                                    <input
                                      type="number"
                                      value={editSvcForm.sort_order}
                                      onChange={e => setEditSvcForm(f => ({ ...f, sort_order: e.target.value }))}
                                      className={inputCls}
                                    />
                                  </div>
                                  <div className="col-span-2 sm:col-span-4">
                                    <label className="label mb-0.5 text-[11px]">Description</label>
                                    <input
                                      value={editSvcForm.description}
                                      onChange={e => setEditSvcForm(f => ({ ...f, description: e.target.value }))}
                                      className={inputCls}
                                    />
                                  </div>
                                </div>
                                <div className="flex gap-2">
                                  <button onClick={() => handleSaveService(svc.id)} disabled={savingSvcEdit} className="btn-primary gap-1 text-xs py-1.5">
                                    {savingSvcEdit ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                                    Save
                                  </button>
                                  <button onClick={() => setEditSvcId(null)} className="btn-ghost text-xs py-1.5">Cancel</button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center gap-3">
                                <GripVertical className="h-3.5 w-3.5 text-gray-200 dark:text-white/10 shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-sm font-medium text-gray-800 dark:text-white/80">{svc.name}</span>
                                    {!svc.active && (
                                      <span className="text-[10px] rounded-full px-1.5 py-0.5 bg-gray-100 dark:bg-white/[0.06] text-gray-400 dark:text-white/30 font-medium">Inactive</span>
                                    )}
                                  </div>
                                  {svc.description && (
                                    <p className="text-xs text-gray-400 dark:text-white/30 truncate">{svc.description}</p>
                                  )}
                                </div>
                                <div className="flex items-center gap-1.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <span className="flex items-center gap-1 text-xs font-semibold text-gray-500 dark:text-white/40">
                                    <DollarSign className="h-3 w-3" />
                                    {svc.default_price > 0 ? `AED ${svc.default_price}` : 'No price'}
                                  </span>
                                  <button
                                    onClick={() => handleToggleService(svc)}
                                    className={cn(
                                      'text-[10px] rounded-full px-2 py-0.5 border font-semibold transition-colors',
                                      svc.active
                                        ? 'border-gray-200 dark:border-white/[0.08] text-gray-400 hover:text-red-400 hover:border-red-300'
                                        : 'border-emerald-200 dark:border-emerald-500/20 text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-500/10',
                                    )}
                                  >
                                    {svc.active ? 'Deactivate' : 'Activate'}
                                  </button>
                                  <button
                                    onClick={() => startEditSvc(svc)}
                                    className="flex h-6 w-6 items-center justify-center rounded-md border border-gray-200 dark:border-white/[0.08] text-gray-400 hover:border-brand/30 hover:text-brand transition-colors"
                                  >
                                    <Pencil className="h-3 w-3" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteService(svc)}
                                    className="flex h-6 w-6 items-center justify-center rounded-md border border-gray-200 dark:border-white/[0.08] text-gray-400 hover:border-red-400/30 hover:text-red-400 transition-colors"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </button>
                                </div>
                                {/* Price always visible on non-hover */}
                                <span className="flex items-center gap-1 text-xs font-semibold text-gray-400 dark:text-white/30 group-hover:hidden shrink-0">
                                  <DollarSign className="h-3 w-3" />
                                  {svc.default_price > 0 ? `AED ${svc.default_price}` : '—'}
                                </span>
                              </div>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
