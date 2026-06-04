'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Header from '@/components/layout/Header'
import { createClient } from '@/lib/supabase/client'
import { Megaphone, Plus, Edit2, Trash2, Loader2, X, Check, ToggleLeft, ToggleRight } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { toast } from 'sonner'

type Announcement = {
  id: string
  title: string
  content: string
  type: 'info' | 'warning' | 'success' | 'promo'
  active: boolean
  show_on_track: boolean
  created_by?: string
  expires_at?: string
  created_at: string
}

type AnnouncementForm = {
  title: string
  content: string
  type: string
  show_on_track: boolean
  expires_at: string
}

const EMPTY_FORM: AnnouncementForm = {
  title: '', content: '', type: 'info', show_on_track: true, expires_at: '',
}

const TYPE_STYLES: Record<string, string> = {
  promo:   'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-500/15 dark:text-orange-400 dark:border-orange-500/25',
  info:    'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-500/15 dark:text-blue-400 dark:border-blue-500/25',
  warning: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-500/15 dark:text-amber-400 dark:border-amber-500/25',
  success: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-400 dark:border-emerald-500/25',
}

export default function AnnouncementsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const role = (session?.user as { role?: string })?.role

  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editItem, setEditItem] = useState<Announcement | null>(null)
  const [form, setForm] = useState<AnnouncementForm>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [togglingId, setTogglingId] = useState<string | null>(null)

  useEffect(() => {
    if (status === 'authenticated' && role !== 'admin') {
      router.replace('/workshop/dashboard')
    }
  }, [status, role, router])

  const load = useCallback(async () => {
    try {
      const sb = createClient()
      const { data, error } = await sb
        .from('announcements')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      setAnnouncements((data ?? []) as Announcement[])
    } catch {
      toast.error('Failed to load announcements')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { if (role === 'admin') load() }, [role, load])

  function openAdd() {
    setEditItem(null)
    setForm(EMPTY_FORM)
    setShowModal(true)
  }

  function openEdit(item: Announcement) {
    setEditItem(item)
    setForm({
      title: item.title,
      content: item.content,
      type: item.type,
      show_on_track: item.show_on_track,
      expires_at: item.expires_at ? item.expires_at.slice(0, 10) : '',
    })
    setShowModal(true)
  }

  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!form.title.trim() || !form.content.trim()) return
    setSaving(true)
    try {
      const sb = createClient()
      const payload = {
        title: form.title.trim(),
        content: form.content.trim(),
        type: form.type,
        show_on_track: form.show_on_track,
        expires_at: form.expires_at ? new Date(form.expires_at + 'T23:59:59Z').toISOString() : null,
        created_by: session?.user?.name ?? 'admin',
      }

      if (editItem) {
        const { error } = await sb.from('announcements').update(payload).eq('id', editItem.id)
        if (error) throw error
        toast.success('Announcement updated')
      } else {
        const { error } = await sb.from('announcements').insert({ ...payload, active: true })
        if (error) throw error
        toast.success('Announcement created')
      }
      setShowModal(false)
      await load()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to save announcement')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this announcement?')) return
    setDeletingId(id)
    try {
      const sb = createClient()
      const { error } = await sb.from('announcements').delete().eq('id', id)
      if (error) throw error
      toast.success('Deleted')
      setAnnouncements(prev => prev.filter(a => a.id !== id))
    } catch {
      toast.error('Failed to delete')
    } finally {
      setDeletingId(null)
    }
  }

  async function handleToggle(item: Announcement) {
    setTogglingId(item.id)
    try {
      const sb = createClient()
      const { error } = await sb.from('announcements').update({ active: !item.active }).eq('id', item.id)
      if (error) throw error
      setAnnouncements(prev => prev.map(a => a.id === item.id ? { ...a, active: !item.active } : a))
      toast.success(`Announcement ${!item.active ? 'activated' : 'deactivated'}`)
    } catch {
      toast.error('Failed to update')
    } finally {
      setTogglingId(null)
    }
  }

  if (status === 'loading' || (status === 'authenticated' && role !== 'admin')) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-surface-900">
        <Loader2 className="h-8 w-8 animate-spin text-brand" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-surface-900">
      <Header title="Announcements" subtitle="Customer-facing messages" />

      <div className="p-4 space-y-5 max-w-4xl lg:p-6">

        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500 dark:text-white/40">{announcements.length} announcements</p>
          <button onClick={openAdd} className="btn-primary">
            <Plus className="h-4 w-4" /> New Announcement
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-brand" />
          </div>
        ) : announcements.length === 0 ? (
          <div className="card flex flex-col items-center justify-center py-16 text-center">
            <Megaphone className="h-10 w-10 text-gray-200 mb-3 dark:text-white/10" />
            <p className="text-sm text-gray-400 dark:text-white/30">No announcements yet</p>
            <button onClick={openAdd} className="mt-3 text-xs text-brand hover:underline">Create the first one →</button>
          </div>
        ) : (
          <div className="space-y-3">
            {announcements.map(item => (
              <div
                key={item.id}
                className={cn(
                  'card transition-all',
                  !item.active && 'opacity-60'
                )}
              >
                <div className="flex items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className={cn('rounded-full border px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide', TYPE_STYLES[item.type] ?? TYPE_STYLES.info)}>
                        {item.type}
                      </span>
                      {item.show_on_track && (
                        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500 dark:bg-white/[0.06] dark:text-white/40">
                          Shows on Tracker
                        </span>
                      )}
                      {!item.active && (
                        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-400 dark:bg-white/[0.04] dark:text-white/30">
                          Hidden
                        </span>
                      )}
                      {item.expires_at && (
                        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-400 dark:bg-white/[0.04] dark:text-white/30">
                          Expires {new Date(item.expires_at).toLocaleDateString('en-AE', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </span>
                      )}
                    </div>
                    <h3 className="font-bold text-gray-900 dark:text-white">{item.title}</h3>
                    <p className="text-sm text-gray-500 mt-0.5 dark:text-white/50 line-clamp-2">{item.content}</p>
                    {item.created_by && (
                      <p className="text-xs text-gray-400 mt-1 dark:text-white/25">by {item.created_by}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleToggle(item)}
                      disabled={togglingId === item.id}
                      title={item.active ? 'Deactivate' : 'Activate'}
                      className={cn(
                        'flex h-8 w-8 items-center justify-center rounded-lg border transition-colors disabled:opacity-50',
                        item.active
                          ? 'border-emerald-300 text-emerald-500 hover:bg-emerald-50 dark:border-emerald-500/30 dark:hover:bg-emerald-500/10'
                          : 'border-gray-200 text-gray-400 hover:bg-gray-50 dark:border-white/[0.08] dark:text-white/30'
                      )}
                    >
                      {togglingId === item.id
                        ? <Loader2 className="h-4 w-4 animate-spin" />
                        : item.active ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />
                      }
                    </button>
                    <button
                      onClick={() => openEdit(item)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-400 hover:border-brand/30 hover:text-brand transition-colors dark:border-white/[0.08] dark:text-white/30"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      disabled={deletingId === item.id}
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-400 hover:border-red-300 hover:text-red-500 transition-colors disabled:opacity-50 dark:border-white/[0.08] dark:text-white/30"
                    >
                      {deletingId === item.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl dark:bg-surface-800">
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4 dark:border-white/[0.06]">
              <h2 className="text-base font-bold text-gray-900 dark:text-white">
                {editItem ? 'Edit Announcement' : 'New Announcement'}
              </h2>
              <button onClick={() => setShowModal(false)} className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 transition dark:text-white/30 dark:hover:bg-white/[0.06]">
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="label mb-1">Title *</label>
                <input
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  className="input-base w-full"
                  placeholder="Eid Special — 20% OFF Detailing"
                  required
                />
              </div>
              <div>
                <label className="label mb-1">Content *</label>
                <textarea
                  value={form.content}
                  onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                  className="input-base w-full resize-none"
                  rows={3}
                  placeholder="Announcement details..."
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label mb-1">Type</label>
                  <select
                    value={form.type}
                    onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                    className="input-base w-full"
                  >
                    <option value="info">Info</option>
                    <option value="promo">Promo</option>
                    <option value="warning">Warning</option>
                    <option value="success">Success</option>
                  </select>
                </div>
                <div>
                  <label className="label mb-1">Expires At (optional)</label>
                  <input
                    type="date"
                    value={form.expires_at}
                    onChange={e => setForm(f => ({ ...f, expires_at: e.target.value }))}
                    className="input-base w-full"
                  />
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-xl bg-gray-50 p-3 dark:bg-white/[0.04]">
                <input
                  type="checkbox"
                  id="show_on_track"
                  checked={form.show_on_track}
                  onChange={e => setForm(f => ({ ...f, show_on_track: e.target.checked }))}
                  className="h-4 w-4 rounded accent-orange-500"
                />
                <label htmlFor="show_on_track" className="text-sm text-gray-700 dark:text-white/70 cursor-pointer">
                  Show on customer-facing job tracker page
                </label>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn-ghost flex-1">Cancel</button>
                <button type="submit" disabled={saving} className="btn-primary flex-1">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                  {editItem ? 'Save Changes' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
