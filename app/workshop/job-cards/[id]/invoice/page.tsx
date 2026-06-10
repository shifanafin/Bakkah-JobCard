'use client'

import { useEffect, useState, use } from 'react'
import { createClient } from '@/lib/supabase/client'
import { JOB_TYPE_LABEL, JOB_STATUS_LABEL, PHOTO_CATEGORY_LABEL, type JobStatus, type JobType } from '@/types'
import { Printer, Share2, Copy, MessageCircle, Check, Loader2, AlertTriangle, Shield, FileCheck, Gauge } from 'lucide-react'

type RtaCheck = {
  fines_count: number
  fines_total_aed: number
  fines: { id: string; date: string; description: string; amount_aed: number; status: string; source: string }[]
  salik_tag_number?: string
  salik_balance_aed?: number
  mulkiya_expiry?: string
  mulkiya_status?: string
  registration_number?: string
  owner_name?: string
  insurance_expiry?: string
  insurance_status?: string
  insurance_company?: string
  inspection_expiry?: string
  inspection_status?: string
  inspection_center?: string
  notes?: string
  include_in_invoice?: boolean
}

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

export default function InvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [job, setJob] = useState<InvoiceJob | null>(null)
  const [rta, setRta] = useState<RtaCheck | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    async function load() {
      const sb = createClient()
      const [{ data: jobData }, { data: rtaData }] = await Promise.all([
        sb.from('job_cards').select(`
          *, customer:customers(*), vehicle:vehicles(*), technician:technicians(name),
          services:job_card_services(*), parts:job_card_parts(*), photos:job_card_photos(*)
        `).eq('id', id).single(),
        sb.from('vehicle_rta_checks').select('*').eq('job_card_id', id).maybeSingle(),
      ])
      setJob(jobData as InvoiceJob)
      setRta(rtaData as RtaCheck | null)
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
    <div className="flex min-h-screen items-center justify-center bg-white">
      <p className="text-gray-400">Invoice not found</p>
    </div>
  )

  const beforePhotos = (job.photos ?? []).filter(p => p.category === 'before_work').slice(0, 4)
  const afterPhotos = (job.photos ?? []).filter(p => p.category === 'after_work').slice(0, 4)
  const damagePhotos = (job.photos ?? []).filter(p => p.category === 'damage').slice(0, 4)

  const waText = `Invoice ${job.job_number} for ${job.vehicle?.plate_number ?? ''} Total: AED ${job.total.toFixed(2)}`
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

      {/* Action bar — hidden when printing */}
      <div className="no-print fixed right-4 top-4 z-50 flex gap-2 flex-wrap justify-end">
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 rounded-lg bg-orange-500 px-4 py-2 text-sm font-bold text-white shadow-lg hover:bg-orange-600 transition-colors"
        >
          <Printer className="h-4 w-4" /> Download PDF
        </button>
        <a
          href={waLink}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-bold text-white shadow-lg hover:bg-emerald-600 transition-colors"
        >
          <MessageCircle className="h-4 w-4" /> WhatsApp
        </a>
        <button
          onClick={handleCopyLink}
          className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-600 shadow-lg hover:bg-gray-50 transition-colors"
        >
          {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
          {copied ? 'Copied!' : 'Copy Link'}
        </button>
        <button
          onClick={() => window.close()}
          className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm text-gray-500 shadow-lg hover:bg-gray-50 transition-colors"
        >
          Close
        </button>
      </div>

      {/* Invoice — A4 paper */}
      <div className="min-h-screen bg-gray-100 py-8 no-print-bg">
        <div className="max-w-[210mm] mx-auto bg-white shadow-xl print:shadow-none">
          <div className="p-10 text-gray-900 font-sans">

            {/* Header */}
            <div className="flex items-start justify-between border-b-4 border-orange-500 pb-6 mb-6">
              <div>
                <h1 className="text-3xl font-black text-gray-900 tracking-tight">Bakkah</h1>
                <p className="text-sm text-gray-500 mt-1">Al Qusais Industrial Area, Dubai, UAE</p>
                <p className="text-sm text-gray-500">Tel: +971 58 939 7610</p>
                <p className="text-sm text-gray-500">TRN: 100 000 000 000 003</p>
              </div>
              <div className="text-right">
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
            <div className="grid grid-cols-2 gap-6 mb-6">
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
              <div className="mb-5">
                <h2 className="text-xs font-black uppercase tracking-widest text-orange-500 mb-2">Labour / Services</h2>
                <table className="w-full text-sm border-collapse">
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
              <div className="mb-5">
                <h2 className="text-xs font-black uppercase tracking-widest text-orange-500 mb-2">Parts / Materials</h2>
                <table className="w-full text-sm border-collapse">
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
              <div className="w-64 space-y-1.5">
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
              <div className={`h-3 w-3 rounded-full ${job.payment_status === 'paid' ? 'bg-green-500' :
                  job.payment_status === 'partial' ? 'bg-amber-500' : 'bg-red-500'
                }`} />
              <span className="text-sm font-semibold capitalize">{job.payment_status}</span>
              {job.payment_method && <span className="text-sm text-gray-500">via {job.payment_method}</span>}
            </div>

            {/* UAE RTA Vehicle Check */}
            {rta && rta.include_in_invoice && (
              <div className="mb-6 rounded-xl border border-blue-100 bg-blue-50/50 p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Shield className="h-4 w-4 text-blue-600" />
                  <h2 className="text-xs font-black uppercase tracking-widest text-blue-600">UAE Vehicle Status</h2>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                  <div className={`rounded-lg p-3 ${rta.fines_count > 0 ? 'bg-red-50 border border-red-100' : 'bg-emerald-50 border border-emerald-100'}`}>
                    <div className="flex items-center gap-1.5 mb-1">
                      <AlertTriangle className={`h-3.5 w-3.5 ${rta.fines_count > 0 ? 'text-red-500' : 'text-emerald-500'}`} />
                      <span className="text-[9px] uppercase tracking-wider font-bold text-gray-500">Fines</span>
                    </div>
                    <p className={`text-xl font-black tabular-nums ${rta.fines_count > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                      {rta.fines_count > 0 ? `AED ${rta.fines_total_aed.toFixed(0)}` : 'Clear'}
                    </p>
                    {rta.fines_count > 0 && <p className="text-[10px] text-red-400">{rta.fines_count} violation{rta.fines_count !== 1 ? 's' : ''}</p>}
                  </div>
                  <div className={`rounded-lg p-3 ${rta.mulkiya_status === 'expired' ? 'bg-red-50 border border-red-100' : 'bg-gray-50 border border-gray-100'}`}>
                    <div className="flex items-center gap-1.5 mb-1">
                      <FileCheck className="h-3.5 w-3.5 text-gray-400" />
                      <span className="text-[9px] uppercase tracking-wider font-bold text-gray-500">Mulkiya</span>
                    </div>
                    <p className={`text-sm font-bold capitalize ${rta.mulkiya_status === 'active' ? 'text-emerald-600' : rta.mulkiya_status === 'expired' ? 'text-red-600' : 'text-gray-600'}`}>
                      {rta.mulkiya_status ?? 'Unknown'}
                    </p>
                    {rta.mulkiya_expiry && <p className="text-[10px] text-gray-400">Exp: {new Date(rta.mulkiya_expiry).toLocaleDateString('en-AE', { day: '2-digit', month: 'short', year: 'numeric' })}</p>}
                  </div>
                  <div className={`rounded-lg p-3 ${rta.insurance_status === 'expired' ? 'bg-red-50 border border-red-100' : 'bg-gray-50 border border-gray-100'}`}>
                    <div className="flex items-center gap-1.5 mb-1">
                      <Shield className="h-3.5 w-3.5 text-gray-400" />
                      <span className="text-[9px] uppercase tracking-wider font-bold text-gray-500">Insurance</span>
                    </div>
                    <p className={`text-sm font-bold capitalize ${rta.insurance_status === 'valid' ? 'text-emerald-600' : rta.insurance_status === 'expired' ? 'text-red-600' : 'text-gray-600'}`}>
                      {rta.insurance_status ?? 'Unknown'}
                    </p>
                    {rta.insurance_expiry && <p className="text-[10px] text-gray-400">Exp: {new Date(rta.insurance_expiry).toLocaleDateString('en-AE', { day: '2-digit', month: 'short', year: 'numeric' })}</p>}
                  </div>
                  <div className={`rounded-lg p-3 ${rta.inspection_status === 'fail' ? 'bg-red-50 border border-red-100' : 'bg-gray-50 border border-gray-100'}`}>
                    <div className="flex items-center gap-1.5 mb-1">
                      <Gauge className="h-3.5 w-3.5 text-gray-400" />
                      <span className="text-[9px] uppercase tracking-wider font-bold text-gray-500">Inspection</span>
                    </div>
                    <p className={`text-sm font-bold capitalize ${rta.inspection_status === 'pass' ? 'text-emerald-600' : rta.inspection_status === 'fail' ? 'text-red-600' : 'text-gray-600'}`}>
                      {rta.inspection_status ?? 'Unknown'}
                    </p>
                    {rta.inspection_expiry && <p className="text-[10px] text-gray-400">Exp: {new Date(rta.inspection_expiry).toLocaleDateString('en-AE', { day: '2-digit', month: 'short', year: 'numeric' })}</p>}
                  </div>
                </div>
                {rta.salik_tag_number && (
                  <div className="flex items-center justify-between rounded-lg bg-white border border-blue-100 px-3 py-2.5 mb-3 text-sm">
                    <span className="text-gray-500 text-xs font-bold uppercase tracking-wider">Salik Tag</span>
                    <div className="text-right">
                      <span className="font-mono text-gray-700 text-xs">{rta.salik_tag_number}</span>
                      {rta.salik_balance_aed != null && <span className="ml-3 font-black text-blue-600">AED {rta.salik_balance_aed.toFixed(2)}</span>}
                    </div>
                  </div>
                )}
                {(rta.fines ?? []).length > 0 && (
                  <div className="rounded-lg bg-white border border-red-100 overflow-hidden">
                    <p className="text-[9px] uppercase tracking-wider font-black text-red-400 px-3 pt-2.5 pb-1">Fine Details</p>
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-red-50">
                          <th className="px-3 py-1.5 text-left font-bold text-gray-500">Description</th>
                          <th className="px-3 py-1.5 text-center font-bold text-gray-500 w-20">Date</th>
                          <th className="px-3 py-1.5 text-right font-bold text-gray-500 w-20">Amount</th>
                          <th className="px-3 py-1.5 text-right font-bold text-gray-500 w-16">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(rta.fines ?? []).map((f, i) => (
                          <tr key={f.id ?? i} className="border-t border-gray-50">
                            <td className="px-3 py-1.5 text-gray-700">{f.description}</td>
                            <td className="px-3 py-1.5 text-center text-gray-400">{f.date ? new Date(f.date).toLocaleDateString('en-AE', { day: '2-digit', month: 'short' }) : '—'}</td>
                            <td className="px-3 py-1.5 text-right tabular-nums font-bold text-red-600">AED {f.amount_aed.toFixed(0)}</td>
                            <td className={`px-3 py-1.5 text-right capitalize font-bold ${f.status === 'paid' ? 'text-emerald-500' : 'text-red-500'}`}>{f.status}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                {rta.notes && <p className="mt-3 text-xs text-gray-400 italic">{rta.notes}</p>}
              </div>
            )}

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
                <p className="text-sm font-semibold text-gray-700">Scan to view online</p>
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
                    <div className="grid grid-cols-4 gap-2">
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
                    <div className="grid grid-cols-4 gap-2">
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
                    <div className="grid grid-cols-4 gap-2">
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
              <p className="mt-1 text-xs font-medium text-orange-500">+971 58 939 7610 · bakkahgarage.com</p>
            </div>

          </div>
        </div>
      </div>
    </>
  )
}
