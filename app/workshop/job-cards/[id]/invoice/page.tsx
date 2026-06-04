import { createClient } from '@/lib/supabase/server'
import { JOB_TYPE_LABEL, PHOTO_CATEGORY_LABEL } from '@/types'
import { notFound } from 'next/navigation'

async function getJob(id: string) {
  const sb = await createClient()
  const { data } = await sb.from('job_cards').select(`
    *, customer:customers(*), vehicle:vehicles(*), technician:technicians(name),
    services:job_card_services(*), parts:job_card_parts(*), photos:job_card_photos(*)
  `).eq('id', id).single()
  return data
}

function fmtAED(n: number) { return `AED ${n.toLocaleString('en-AE', { minimumFractionDigits: 2 })}` }
function fmtDate(s: string) { return new Date(s).toLocaleDateString('en-AE', { day: '2-digit', month: 'long', year: 'numeric' }) }

export default async function InvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const job = await getJob(id)
  if (!job) notFound()

  const beforePhotos = (job.photos ?? []).filter((p: { category: string }) => p.category === 'before_work').slice(0, 4)
  const afterPhotos  = (job.photos ?? []).filter((p: { category: string }) => p.category === 'after_work').slice(0, 4)
  const damagePhotos = (job.photos ?? []).filter((p: { category: string }) => p.category === 'damage').slice(0, 4)

  return (
    <>
      {/* Print button - hidden when printing */}
      <div className="no-print fixed right-4 top-4 z-50 flex gap-2">
        <button onClick={() => window.print()} className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-bold text-white shadow-lg hover:bg-orange-600">
          🖨 Print / Save PDF
        </button>
        <button onClick={() => window.close()} className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm text-gray-500 hover:bg-gray-50">
          Close
        </button>
      </div>

      <div className="min-h-screen bg-white p-8 text-gray-900 max-w-[210mm] mx-auto font-sans">
        {/* Header */}
        <div className="flex items-start justify-between border-b-4 border-orange-500 pb-6 mb-6">
          <div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">AutoEdge Pro</h1>
            <p className="text-sm text-gray-500 mt-1">Al Qusais, Dubai, UAE</p>
            <p className="text-sm text-gray-500">Tel: +971 4 000 0000</p>
            <p className="text-sm text-gray-500">TRN: 100 000 000 000 003</p>
          </div>
          <div className="text-right">
            <div className="inline-block bg-orange-500 px-4 py-2 rounded-lg mb-2">
              <p className="text-white font-black text-lg tracking-wider">TAX INVOICE</p>
            </div>
            <p className="text-sm text-gray-500">Invoice #: <strong className="text-gray-800">{job.job_number}</strong></p>
            <p className="text-sm text-gray-500">Date: <strong className="text-gray-800">{fmtDate(job.date_in)}</strong></p>
            {job.date_out && <p className="text-sm text-gray-500">Due: <strong className="text-gray-800">{fmtDate(job.date_out)}</strong></p>}
          </div>
        </div>

        {/* Customer + Vehicle */}
        <div className="grid grid-cols-2 gap-6 mb-6">
          <div className="rounded-lg bg-gray-50 p-4">
            <h2 className="text-xs font-black uppercase tracking-widest text-orange-500 mb-3">Bill To</h2>
            <p className="font-bold text-gray-900">{job.customer?.name}</p>
            {job.customer?.company_name && <p className="text-sm text-gray-600">{job.customer.company_name}</p>}
            <p className="text-sm text-gray-600">{job.customer?.phone}</p>
            {job.customer?.email && <p className="text-sm text-gray-600">{job.customer.email}</p>}
          </div>
          <div className="rounded-lg bg-gray-50 p-4">
            <h2 className="text-xs font-black uppercase tracking-widest text-orange-500 mb-3">Vehicle</h2>
            <p className="font-bold font-mono text-gray-900 text-lg tracking-widest">{job.vehicle?.plate_number}</p>
            <p className="text-sm text-gray-600">{job.vehicle?.make} {job.vehicle?.model} {job.vehicle?.year}</p>
            {job.vehicle?.color && <p className="text-sm text-gray-600">Color: {job.vehicle.color}</p>}
            {job.mileage_in && <p className="text-sm text-gray-600">Mileage: {job.mileage_in.toLocaleString()} km</p>}
            <p className="text-sm text-gray-600">Job Type: {JOB_TYPE_LABEL[job.job_type as keyof typeof JOB_TYPE_LABEL]}</p>
          </div>
        </div>

        {/* Services */}
        {(job.services ?? []).length > 0 && (
          <div className="mb-5">
            <h2 className="text-xs font-black uppercase tracking-widest text-orange-500 mb-2">Labour / Services</h2>
            <table className="w-full text-sm">
              <thead><tr className="bg-gray-100">
                <th className="px-3 py-2 text-left font-bold text-gray-700">Description</th>
                <th className="px-3 py-2 text-center font-bold text-gray-700 w-16">Qty</th>
                <th className="px-3 py-2 text-right font-bold text-gray-700 w-28">Unit (AED)</th>
                <th className="px-3 py-2 text-right font-bold text-gray-700 w-28">Total (AED)</th>
              </tr></thead>
              <tbody>
                {(job.services ?? []).map((s: { id: string; description: string; quantity: number; unit_price: number; total_price: number }) => (
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
            <table className="w-full text-sm">
              <thead><tr className="bg-gray-100">
                <th className="px-3 py-2 text-left font-bold text-gray-700">Part Name</th>
                <th className="px-3 py-2 text-left font-bold text-gray-700 w-28">Part #</th>
                <th className="px-3 py-2 text-center font-bold text-gray-700 w-16">Qty</th>
                <th className="px-3 py-2 text-right font-bold text-gray-700 w-28">Unit (AED)</th>
                <th className="px-3 py-2 text-right font-bold text-gray-700 w-28">Total (AED)</th>
              </tr></thead>
              <tbody>
                {(job.parts ?? []).map((p: { id: string; part_name: string; part_number?: string; quantity: number; unit_price: number; total_price: number }) => (
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
            <div className="flex justify-between text-sm"><span className="text-gray-500">Subtotal</span><span className="tabular-nums">{job.subtotal.toFixed(2)}</span></div>
            {job.discount > 0 && <div className="flex justify-between text-sm"><span className="text-gray-500">Discount</span><span className="tabular-nums text-green-600">−{job.discount.toFixed(2)}</span></div>}
            <div className="flex justify-between text-sm"><span className="text-gray-500">VAT (5%)</span><span className="tabular-nums">{job.vat_amount.toFixed(2)}</span></div>
            <div className="flex justify-between border-t-2 border-gray-900 pt-2 text-base font-black">
              <span>TOTAL (AED)</span><span className="tabular-nums text-orange-500">{job.total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Payment status */}
        <div className="mb-6 flex items-center gap-3 rounded-lg border border-gray-200 p-3">
          <div className={`h-3 w-3 rounded-full ${job.payment_status === 'paid' ? 'bg-green-500' : job.payment_status === 'partial' ? 'bg-amber-500' : 'bg-red-500'}`} />
          <span className="text-sm font-semibold capitalize">{job.payment_status}</span>
          {job.payment_method && <span className="text-sm text-gray-500">via {job.payment_method}</span>}
        </div>

        {/* Photos */}
        {(beforePhotos.length > 0 || afterPhotos.length > 0 || damagePhotos.length > 0) && (
          <div className="border-t border-gray-200 pt-4">
            <h2 className="text-xs font-black uppercase tracking-widest text-orange-500 mb-3">Vehicle Photos</h2>
            {damagePhotos.length > 0 && (
              <div className="mb-3">
                <p className="text-xs font-semibold text-gray-500 mb-2">⚠️ Damage (pre-existing)</p>
                <div className="grid grid-cols-4 gap-2">
                  {damagePhotos.map((p: { id: string; cloudinary_url: string; caption?: string }) => (
                    <div key={p.id}><img src={p.cloudinary_url} alt={p.caption ?? 'damage'} className="rounded w-full aspect-[4/3] object-cover" />{p.caption && <p className="text-[9px] text-gray-400 mt-0.5 truncate">{p.caption}</p>}</div>
                  ))}
                </div>
              </div>
            )}
            {beforePhotos.length > 0 && (
              <div className="mb-3">
                <p className="text-xs font-semibold text-gray-500 mb-2">📸 Before Work</p>
                <div className="grid grid-cols-4 gap-2">
                  {beforePhotos.map((p: { id: string; cloudinary_url: string; caption?: string }) => <div key={p.id}><img src={p.cloudinary_url} alt="before" className="rounded w-full aspect-[4/3] object-cover" /></div>)}
                </div>
              </div>
            )}
            {afterPhotos.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-500 mb-2">✅ After Work</p>
                <div className="grid grid-cols-4 gap-2">
                  {afterPhotos.map((p: { id: string; cloudinary_url: string; caption?: string }) => <div key={p.id}><img src={p.cloudinary_url} alt="after" className="rounded w-full aspect-[4/3] object-cover" /></div>)}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 border-t border-gray-200 pt-4 text-center text-xs text-gray-400">
          <p>AutoEdge Pro · Al Qusais Industrial Area, Dubai, UAE · TRN: 100 000 000 000 003</p>
          <p className="mt-1">This is a computer-generated invoice. Thank you for your business.</p>
        </div>
      </div>
    </>
  )
}
