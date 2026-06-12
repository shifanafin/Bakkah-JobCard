'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import Header from '@/components/layout/Header'
import { Search, Plus, User, Phone, Building2, Car, ClipboardList, ChevronRight, Loader2, Star } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { formatDate } from '@/lib/utils/format'
import { toast } from 'sonner'

type Customer = {
  id: string
  name: string
  phone: string
  email?: string
  company_name?: string
  is_fleet: boolean
  notes?: string
  created_at: string
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showNew, setShowNew] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ name: '', phone: '', email: '', company_name: '', is_fleet: false, notes: '' })

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/customers')
      const d = await res.json()
      setCustomers(d.customers ?? [])
    } catch { toast.error('Failed to load customers') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const filtered = customers.filter(c => {
    const q = search.toLowerCase()
    return !q || c.name.toLowerCase().includes(q) || c.phone.includes(q) || (c.company_name ?? '').toLowerCase().includes(q)
  })

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) { toast.error('Name is required'); return }
    if (!form.phone.trim()) { toast.error('Phone is required'); return }
    setSaving(true)
    try {
      const res = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error)
      toast.success('Customer created')
      setShowNew(false)
      setForm({ name: '', phone: '', email: '', company_name: '', is_fleet: false, notes: '' })
      await load()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create customer')
    } finally { setSaving(false) }
  }

  const inputCls = 'input-base w-full'

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-surface-900">
      <Header title="Customers" subtitle={`${customers.length} total`} />

      <div className="p-4 lg:p-6 space-y-5">
        {/* Toolbar */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-white/30 pointer-events-none" />
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search by name, phone or company…"
              className="input-base pl-9 w-full"
            />
          </div>
          <button onClick={() => setShowNew(v => !v)} className="btn-primary gap-2">
            <Plus className="h-4 w-4" /> New Customer
          </button>
        </div>

        {/* New customer inline form */}
        {showNew && (
          <form onSubmit={handleCreate} className="card space-y-4">
            <h3 className="section-title border-b border-gray-100 dark:border-white/[0.06] pb-3">New Customer</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="label">Full Name <span className="text-brand">*</span></label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="Mohammed Al Rashid" className={inputCls} />
              </div>
              <div>
                <label className="label">Phone <span className="text-brand">*</span></label>
                <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                  placeholder="+971 50 123 4567" type="tel" className={inputCls} />
              </div>
              <div>
                <label className="label">Email</label>
                <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="customer@email.com" className={inputCls} />
              </div>
              <div>
                <label className="label">Company</label>
                <input value={form.company_name} onChange={e => setForm(f => ({ ...f, company_name: e.target.value }))}
                  placeholder="Company LLC" className={inputCls} />
              </div>
              <div className="sm:col-span-2">
                <label className="label">Notes</label>
                <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  rows={2} className={cn(inputCls, 'resize-none')} placeholder="Internal notes…" />
              </div>
              <div className="sm:col-span-2">
                <label className="flex cursor-pointer items-center gap-2.5 text-sm text-gray-600 dark:text-white/60">
                  <input type="checkbox" checked={form.is_fleet} onChange={e => setForm(f => ({ ...f, is_fleet: e.target.checked }))}
                    className="h-4 w-4 accent-brand rounded" />
                  Fleet / Corporate Account
                </label>
              </div>
            </div>
            <div className="flex gap-2 pt-1 border-t border-gray-100 dark:border-white/[0.06]">
              <button type="submit" disabled={saving} className="btn-primary gap-2">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                Create Customer
              </button>
              <button type="button" onClick={() => setShowNew(false)} className="btn-ghost">Cancel</button>
            </div>
          </form>
        )}

        {/* Customer list */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-brand" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <User className="h-10 w-10 text-gray-200 dark:text-white/10" />
            <p className="text-sm text-gray-400 dark:text-white/30">
              {search ? 'No customers match your search' : 'No customers yet'}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map(c => (
              <Link key={c.id} href={`/workshop/customers/${c.id}`}
                className="card card-hover flex items-center gap-4 !p-4 group">
                {/* Avatar */}
                <div className={cn(
                  'flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold',
                  c.is_fleet
                    ? 'bg-brand/15 text-brand'
                    : 'bg-blue-500/10 text-blue-500 dark:text-blue-400',
                )}>
                  {c.is_fleet ? <Star className="h-5 w-5" /> : c.name.charAt(0).toUpperCase()}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-gray-900 dark:text-white truncate">{c.name}</span>
                    {c.is_fleet && (
                      <span className="text-[10px] font-bold bg-brand/10 text-brand rounded px-1.5 py-0.5">Fleet</span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-0.5">
                    <span className="flex items-center gap-1 text-xs text-gray-400 dark:text-white/40">
                      <Phone className="h-3 w-3" />{c.phone}
                    </span>
                    {c.company_name && (
                      <span className="flex items-center gap-1 text-xs text-gray-400 dark:text-white/40">
                        <Building2 className="h-3 w-3" />{c.company_name}
                      </span>
                    )}
                    <span className="text-xs text-gray-300 dark:text-white/20">
                      Since {formatDate(c.created_at)}
                    </span>
                  </div>
                </div>

                <ChevronRight className="h-4 w-4 text-gray-300 dark:text-white/20 group-hover:text-gray-500 dark:group-hover:text-white/50 transition-colors shrink-0" />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
