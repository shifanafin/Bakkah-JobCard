'use client'

import { useEffect, useState, use } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { JOB_TYPE_LABEL, JOB_STATUS_LABEL, type JobStatus, type JobType } from '@/types'
import { Printer, Copy, MessageCircle, Check, Loader2, ArrowLeft, Car } from 'lucide-react'

type InvoiceJob = {
  id: string
  job_number: string
  status: JobStatus
  job_type: JobType
  date_in: string
  date_out?: string
  mileage_in?: number
  subtotal: number
  discount: number
  vat_amount: number
  total: number
  payment_status: string
  payment_method?: string
  customer_complaint?: string
  customer?: { name: string; phone?: string; email?: string; company_name?: string }
  vehicle?: { plate_number: string; make: string; model: string; year?: number; color?: string; vin?: string }
  technician?: { name: string }
  services?: { id: string; description: string; quantity: number; unit_price: number; total_price: number }[]
  parts?: { id: string; part_name: string; part_number?: string; quantity: number; unit_price: number; total_price: number }[]
  photos?: { id: string; cloudinary_url: string; category: string; caption?: string }[]
}

function fmtDate(s: string) {
  return new Date(s).toLocaleDateString('en-AE', { day: '2-digit', month: 'long', year: 'numeric' })
}

export default function PublicInvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [job, setJob] = useState<InvoiceJob | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [origin, setOrigin] = useState('')

  useEffect(() => {
    setOrigin(window.location.origin)
    async function load() {
      const sb = createClient()
      const { data } = await sb.from('job_cards').select(`
        *, customer:customers(*), vehicle:vehicles(*), technician:technicians(name),
        services:job_card_services(*), parts:job_card_parts(*), photos:job_card_photos(*)
      `).eq('id', id).single()
      setJob(data as InvoiceJob)
      setLoading(false)
    }
    load()
  }, [id])

  function handleCopyLink() {
    navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) return (
    <div className="flex min-h-screen items-center justify-center bg-white">
      <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
    </div>
  )

  if (!job) return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-white">
      <p className="text-gray-400">Invoice not found</p>
      <Link href="/track" className="flex items-center gap-2 text-sm text-orange-500 hover:text-orange-600">
        <ArrowLeft className="h-4 w-4" /> Track another job
      </Link>
    </div>
  )

  const beforePhotos = (job.photos ?? []).filter(p => p.category === 'before_work').slice(0, 4)
  const afterPhotos = (job.photos ?? []).filter(p => p.category === 'after_work').slice(0, 4)
  const damagePhotos = (job.photos ?? []).filter(p => p.category === 'damage').slice(0, 4)

  const trackUrl = `${origin}/track?job=${encodeURIComponent(job.job_number)}`
  const waText = `Invoice ${job.job_number} for ${job.vehicle?.plate_number ?? ''}\nTotal: AED ${job.total.toFixed(2)}\n\nView invoice: ${origin}/invoice/${id}`
  const waLink = `https://wa.me/971589397610?text=${encodeURIComponent(waText)}`

  return (
    <>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { margin: 0; }
          @page { size: A4; margin: 15mm; }
        }
      `}</style>

      {/* Action bar */}
      <div className="no-print fixed inset-x-0 top-0 z-50 flex items-center justify-between gap-2 border-b border-gray-100 bg-white/95 px-4 py-3 backdrop-blur-sm shadow-sm flex-wrap">
        <Link
          href={trackUrl}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <Car className="h-4 w-4 text-orange-500" />
          <span className="hidden sm:inline">Track Job</span>
        </Link>
        <div className="flex items-center gap-2 flex-wrap justify-end">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 rounded-lg bg-orange-500 px-4 py-2 text-sm font-bold text-white shadow hover:bg-orange-600 transition-colors"
          >
            <Printer className="h-4 w-4" /> <span className="hidden sm:inline">Download</span> PDF
          </button>
          <a
            href={waLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-bold text-white shadow hover:bg-emerald-600 transition-colors"
          >
            <MessageCircle className="h-4 w-4" /> WhatsApp
          </a>
          <button
            onClick={handleCopyLink}
            className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-600 shadow hover:bg-gray-50 transition-colors"
          >
            {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
            <span className="hidden sm:inline">{copied ? 'Copied!' : 'Copy Link'}</span>
          </button>
        </div>
      </div>

      {/* Invoice — A4 paper */}
      <div className="min-h-screen bg-gray-100 py-8 pt-20 print:pt-0">
        <div className="max-w-[210mm] mx-auto bg-white shadow-xl print:shadow-none">
          <div className="p-6 sm:p-10 text-gray-900 font-sans">

            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start justify-between border-b-4 border-orange-500 pb-6 mb-6 gap-4">
              <div>
                <h1 className="text-3xl font-black text-gray-900 tracking-tight">Bakkah</h1>
                <p className="text-sm text-gray-500 mt-1">Al Qusais Industrial Area, Dubai, UAE</p>
                <p className="text-sm text-gray-500">Tel: +971 58 939 7610</p>
                <p className="text-sm text-gray-500">TRN: 100 000 000 000 003</p>
              </div>
              <div className="sm:text-right">
                <div className="inline-block bg-orange-500 px-5 py-2.5 rounded-lg mb-3">
                  <p className="text-white font-black text-xl tracking-widest">TAX INVOICE</p>
                </div>
                <p className="text-sm text-gray-500">Invoice #: <strong className="text-gray-800">{job.job_number}</strong></p>
                <p className="text-sm text-gray-500">Date: <strong className="text-gray-800">{fmtDate(job.date_in)}</strong></p>
                {job.date_out && <p className="text-sm text-gray-500">Expected: <strong className="text-gray-800">{fmtDate(job.date_out)}</strong></p>}
                <div className="mt-2">
                  <span className={`inline-block rounded-full px-3 py-1 text-xs font-bold ${job.status === 'delivered' ? 'bg-emerald-100 text-emerald-700' :
                      job.status === 'ready' ? 'bg-blue-100 text-blue-700' :
                        job.status === 'in_progress' ? 'bg-orange-100 text-orange-700' :
                          'bg-gray-100 text-gray-600'
                    }`}>
                    Status: {JOB_STATUS_LABEL[job.status]}
                  </span>
                </div>
              </div>
            </div>

            {/* Customer + Vehicle */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
              <div className="rounded-lg bg-gray-50 p-4 border border-gray-100">
                <h2 className="text-xs font-black uppercase tracking-widest text-orange-500 mb-3">Bill To</h2>
                <p className="font-bold text-gray-900 text-base">{job.customer?.name}</p>
                {job.customer?.company_name && <p className="text-sm text-gray-600">{job.customer.company_name}</p>}
                <p className="text-sm text-gray-600">{job.customer?.phone}</p>
                {job.customer?.email && <p className="text-sm text-gray-600">{job.customer.email}</p>}
              </div>
              <div className="rounded-lg bg-gray-50 p-4 border border-gray-100">
                <h2 className="text-xs font-black uppercase tracking-widest text-orange-500 mb-3">Vehicle</h2>
                <p className="font-bold font-mono text-gray-900 text-xl tracking-widest">{job.vehicle?.plate_number}</p>
                <p className="text-sm text-gray-600">{job.vehicle?.make} {job.vehicle?.model} {job.vehicle?.year}</p>
                {job.vehicle?.color && <p className="text-sm text-gray-600">Color: {job.vehicle.color}</p>}
                {job.mileage_in && <p className="text-sm text-gray-600">Mileage In: {job.mileage_in.toLocaleString()} km</p>}
                <p className="text-sm text-gray-600">Type: {JOB_TYPE_LABEL[job.job_type]}</p>
                {job.technician && <p className="text-sm text-gray-600">Technician: {job.technician.name}</p>}
              </div>
            </div>

            {/* Services */}
            {(job.services ?? []).length > 0 && (
              <div className="mb-5 overflow-x-auto">
                <h2 className="text-xs font-black uppercase tracking-widest text-orange-500 mb-2">Labour / Services</h2>
                <table className="w-full text-sm border-collapse min-w-[400px]">
                  <thead>
                    <tr className="bg-orange-50 border border-orange-100">
                      <th className="px-3 py-2.5 text-left font-bold text-gray-700">Description</th>
                      <th className="px-3 py-2.5 text-center font-bold text-gray-700 w-16">Qty</th>
                      <th className="px-3 py-2.5 text-right font-bold text-gray-700 w-28">Unit (AED)</th>
                      <th className="px-3 py-2.5 text-right font-bold text-gray-700 w-28">Total (AED)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(job.services ?? []).map(s => (
                      <tr key={s.id} className="border-b border-gray-100">
                        <td className="px-3 py-2">{s.description}</td>
                        <td className="px-3 py-2 text-center">{s.quantity}</td>
                        <td className="px-3 py-2 text-right tabular-nums">{s.unit_price.toFixed(2)}</td>
                        <td className="px-3 py-2 text-right tabular-nums font-semibold">{s.total_price.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Parts */}
            {(job.parts ?? []).length > 0 && (
              <div className="mb-5 overflow-x-auto">
                <h2 className="text-xs font-black uppercase tracking-widest text-orange-500 mb-2">Parts / Materials</h2>
                <table className="w-full text-sm border-collapse min-w-[400px]">
                  <thead>
                    <tr className="bg-orange-50 border border-orange-100">
                      <th className="px-3 py-2.5 text-left font-bold text-gray-700">Part Name</th>
                      <th className="px-3 py-2.5 text-left font-bold text-gray-700 w-28">Part #</th>
                      <th className="px-3 py-2.5 text-center font-bold text-gray-700 w-16">Qty</th>
                      <th className="px-3 py-2.5 text-right font-bold text-gray-700 w-28">Unit (AED)</th>
                      <th className="px-3 py-2.5 text-right font-bold text-gray-700 w-28">Total (AED)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(job.parts ?? []).map(p => (
                      <tr key={p.id} className="border-b border-gray-100">
                        <td className="px-3 py-2">{p.part_name}</td>
                        <td className="px-3 py-2 font-mono text-xs text-gray-500">{p.part_number ?? '—'}</td>
                        <td className="px-3 py-2 text-center">{p.quantity}</td>
                        <td className="px-3 py-2 text-right tabular-nums">{p.unit_price.toFixed(2)}</td>
                        <td className="px-3 py-2 text-right tabular-nums font-semibold">{p.total_price.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Totals */}
            <div className="flex justify-end mb-6">
              <div className="w-full sm:w-64 space-y-1.5">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Subtotal</span>
                  <span className="tabular-nums">{job.subtotal.toFixed(2)}</span>
                </div>
                {job.discount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Discount</span>
                    <span className="tabular-nums text-green-600">−{job.discount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">VAT (5%)</span>
                  <span className="tabular-nums">{job.vat_amount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between border-t-2 border-gray-900 pt-2 text-base font-black">
                  <span>TOTAL (AED)</span>
                  <span className="tabular-nums text-orange-500">{job.total.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Payment status */}
            <div className="mb-6 flex items-center gap-3 rounded-lg border border-gray-200 p-3">
              <div className={`h-3 w-3 rounded-full shrink-0 ${job.payment_status === 'paid' ? 'bg-green-500' :
                  job.payment_status === 'partial' ? 'bg-amber-500' : 'bg-red-500'
                }`} />
              <span className="text-sm font-semibold capitalize">{job.payment_status}</span>
              {job.payment_method && <span className="text-sm text-gray-500">via {job.payment_method}</span>}
            </div>

            {/* Track Job CTA */}
            <div className="mb-6 rounded-lg border border-orange-200 bg-orange-50 p-4 no-print">
              <p className="text-sm font-semibold text-orange-700 mb-1">Track your vehicle status</p>
              <p className="text-xs text-orange-600 mb-3">Check real-time progress of your job card at any time.</p>
              <Link
                href={trackUrl}
                className="inline-flex items-center gap-2 rounded-lg bg-orange-500 px-4 py-2 text-sm font-bold text-white hover:bg-orange-600 transition-colors"
              >
                <Car className="h-4 w-4" /> Track Job {job.job_number}
              </Link>
            </div>

            {/* QR placeholder */}
            <div className="mb-6 flex items-center gap-4 rounded-lg border border-dashed border-gray-300 p-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg border-2 border-gray-300 bg-gray-50 text-center">
                <div className="grid grid-cols-3 gap-0.5 p-1">
                  {Array.from({ length: 9 }).map((_, i) => (
                    <div key={i} className={`h-3 w-3 rounded-sm ${[0, 2, 4, 6, 8].includes(i) ? 'bg-gray-800' : 'bg-white'}`} />
                  ))}
                </div>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-700">Scan to track online</p>
                <p className="text-xs text-gray-400 mt-0.5">Bakkah Job Tracker</p>
                <p className="text-xs font-mono text-gray-400">{job.job_number}</p>
              </div>
            </div>

            {/* Photos */}
            {(beforePhotos.length > 0 || afterPhotos.length > 0 || damagePhotos.length > 0) && (
              <div className="border-t border-gray-200 pt-4">
                <h2 className="text-xs font-black uppercase tracking-widest text-orange-500 mb-3">Vehicle Photos</h2>
                {damagePhotos.length > 0 && (
                  <div className="mb-3">
                    <p className="text-xs font-semibold text-gray-500 mb-2">Damage (pre-existing)</p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {damagePhotos.map(p => (
                        <div key={p.id}>
                          <img src={p.cloudinary_url} alt={p.caption ?? 'damage'} className="rounded w-full aspect-[4/3] object-cover" />
                          {p.caption && <p className="text-[9px] text-gray-400 mt-0.5 truncate">{p.caption}</p>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {beforePhotos.length > 0 && (
                  <div className="mb-3">
                    <p className="text-xs font-semibold text-gray-500 mb-2">Before Work</p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {beforePhotos.map(p => (
                        <div key={p.id}>
                          <img src={p.cloudinary_url} alt="before" className="rounded w-full aspect-[4/3] object-cover" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {afterPhotos.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-gray-500 mb-2">After Work</p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {afterPhotos.map(p => (
                        <div key={p.id}>
                          <img src={p.cloudinary_url} alt="after" className="rounded w-full aspect-[4/3] object-cover" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Footer */}
            <div className="mt-8 border-t-2 border-orange-500 pt-4 text-center">
              <p className="text-xs text-gray-400">Bakkah · Al Qusais Industrial Area, Dubai, UAE · TRN: 100 000 000 000 003</p>
              <p className="mt-1 text-xs text-gray-400">This is a computer-generated invoice. Thank you for your business.</p>
              <p className="mt-1 text-xs font-medium text-orange-500">+971 58 939 7610 · autoedgepro.ae</p>
            </div>

          </div>
        </div>
      </div>
    </>
  )
}
