'use client'

import { useState, useTransition } from 'react'
import { addService, deleteService, addPart, deletePart, updateDiscount, updatePayment } from '@/lib/queries'
import { formatAED } from '@/lib/utils/format'
import { type JobCard } from '@/types'
import { Plus, Trash2, Loader2, ChevronDown, Tag, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils/cn'

interface LineItemsProps { job: JobCard; onUpdate: () => void }

export default function LineItems({ job, onUpdate }: LineItemsProps) {
  const [tab, setTab] = useState<'services'|'parts'|'payment'>('services')
  const [isPending, startTransition] = useTransition()
  const [svc, setSvc] = useState({ description: '', quantity: '1', unit_price: '' })
  const [prt, setPrt] = useState({ part_name: '', part_number: '', quantity: '1', unit_price: '' })
  const promoDiscountAED = job.promotion_discount_pct && job.subtotal > 0
    ? parseFloat(((job.promotion_discount_pct / 100) * job.subtotal).toFixed(2))
    : null

  const [discount, setDiscount] = useState(job.discount.toString())
  const [payStatus, setPayStatus] = useState(job.payment_status)
  const [payMethod, setPayMethod] = useState(job.payment_method ?? '')

  const services = job.services ?? []
  const parts    = job.parts    ?? []

  function addSvc() {
    if (!svc.description || !svc.unit_price) return toast.error('Fill in description and price')
    startTransition(async () => {
      try {
        await addService(job.id, { description: svc.description, quantity: parseFloat(svc.quantity) || 1, unit_price: parseFloat(svc.unit_price), completed: false })
        setSvc({ description: '', quantity: '1', unit_price: '' })
        onUpdate(); toast.success('Service added')
      } catch { toast.error('Failed to add service') }
    })
  }

  function addPrt() {
    if (!prt.part_name || !prt.unit_price) return toast.error('Fill in part name and price')
    startTransition(async () => {
      try {
        await addPart(job.id, { part_name: prt.part_name, part_number: prt.part_number || undefined, quantity: parseFloat(prt.quantity) || 1, unit_price: parseFloat(prt.unit_price) })
        setPrt({ part_name: '', part_number: '', quantity: '1', unit_price: '' })
        onUpdate(); toast.success('Part added')
      } catch { toast.error('Failed to add part') }
    })
  }

  function delSvc(id: string) { startTransition(async () => { await deleteService(id); onUpdate(); toast.success('Service removed') }) }
  function delPrt(id: string) { startTransition(async () => { await deletePart(id); onUpdate(); toast.success('Part removed') }) }

  function applyDiscount() {
    startTransition(async () => {
      await updateDiscount(job.id, parseFloat(discount) || 0)
      onUpdate(); toast.success('Discount applied')
    })
  }

  function markPaid() {
    startTransition(async () => {
      await updatePayment(job.id, payStatus, payMethod || undefined)
      onUpdate(); toast.success('Payment updated')
    })
  }

  const inputSm = "flex-1 rounded-lg border px-2.5 py-2 text-sm focus:border-brand/50 focus:outline-none transition bg-white border-gray-200 text-gray-900 placeholder:text-gray-300 dark:bg-white/[0.04] dark:border-white/10 dark:text-white dark:placeholder:text-white/20"

  return (
    <div className="card space-y-4">
      {/* Tabs */}
      <div className="flex gap-1 rounded-lg border border-gray-200 bg-gray-100 p-1 dark:border-white/[0.06] dark:bg-surface-900">
        {(['services','parts','payment'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={cn('flex-1 rounded-md py-1.5 text-xs font-semibold capitalize transition-all',
              tab === t ? 'bg-brand text-black' : 'text-gray-500 hover:text-gray-800 dark:text-white/40 dark:hover:text-white/70'
            )}>{t === 'payment' ? 'Payment' : t}
          </button>
        ))}
      </div>

      {/* Services */}
      {tab === 'services' && (
        <div className="space-y-3">
          {services.length > 0 && (
            <div className="overflow-hidden rounded-lg border border-gray-100 dark:border-white/[0.06]">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-gray-100 bg-gray-50 dark:border-white/[0.06] dark:bg-white/[0.02]">
                  {['Description','Qty','Unit Price','Total (AED)',''].map(h => <th key={h} className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wide text-gray-400 dark:text-white/30">{h}</th>)}
                </tr></thead>
                <tbody className="divide-y divide-gray-100 dark:divide-white/[0.04]">
                  {services.map(s => (
                    <tr key={s.id} className="group">
                      <td className="px-3 py-2 text-gray-800 dark:text-white/80">{s.description}</td>
                      <td className="px-3 py-2 text-gray-500 tabular-nums dark:text-white/50">{s.quantity}</td>
                      <td className="px-3 py-2 text-gray-500 tabular-nums dark:text-white/50">{formatAED(s.unit_price)}</td>
                      <td className="px-3 py-2 font-semibold text-gray-900 tabular-nums dark:text-white">{formatAED(s.total_price)}</td>
                      <td className="px-3 py-2">
                        <button onClick={() => delSvc(s.id)} className="text-gray-200 opacity-0 group-hover:opacity-100 hover:text-red-400 transition-all dark:text-white/20">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div className="flex gap-2 flex-wrap">
            <input value={svc.description} onChange={e => setSvc(s => ({...s, description: e.target.value}))} placeholder="Service description" className={cn(inputSm, 'min-w-[180px]')} />
            <input value={svc.quantity} onChange={e => setSvc(s => ({...s, quantity: e.target.value}))} placeholder="Qty" type="number" min={0.5} step={0.5} className={cn(inputSm, 'w-16 flex-none')} />
            <input value={svc.unit_price} onChange={e => setSvc(s => ({...s, unit_price: e.target.value}))} placeholder="Price (AED)" type="number" min={0} className={cn(inputSm, 'w-32 flex-none')} />
            <button onClick={addSvc} disabled={isPending} className="btn-primary text-xs px-3 py-2 h-auto flex-none">
              {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <><Plus className="h-3.5 w-3.5" /> Add</>}
            </button>
          </div>
        </div>
      )}

      {/* Parts */}
      {tab === 'parts' && (
        <div className="space-y-3">
          {parts.length > 0 && (
            <div className="overflow-hidden rounded-lg border border-gray-100 dark:border-white/[0.06]">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-gray-100 bg-gray-50 dark:border-white/[0.06] dark:bg-white/[0.02]">
                  {['Part Name','Part #','Qty','Unit Price','Total',''].map(h => <th key={h} className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wide text-gray-400 dark:text-white/30">{h}</th>)}
                </tr></thead>
                <tbody className="divide-y divide-gray-100 dark:divide-white/[0.04]">
                  {parts.map(p => (
                    <tr key={p.id} className="group">
                      <td className="px-3 py-2 text-gray-800 dark:text-white/80">{p.part_name}</td>
                      <td className="px-3 py-2 text-gray-400 font-mono text-xs dark:text-white/40">{p.part_number ?? '—'}</td>
                      <td className="px-3 py-2 text-gray-500 tabular-nums dark:text-white/50">{p.quantity}</td>
                      <td className="px-3 py-2 text-gray-500 tabular-nums dark:text-white/50">{formatAED(p.unit_price)}</td>
                      <td className="px-3 py-2 font-semibold text-gray-900 tabular-nums dark:text-white">{formatAED(p.total_price)}</td>
                      <td className="px-3 py-2">
                        <button onClick={() => delPrt(p.id)} className="text-gray-200 opacity-0 group-hover:opacity-100 hover:text-red-400 transition-all dark:text-white/20">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div className="flex gap-2 flex-wrap">
            <input value={prt.part_name} onChange={e => setPrt(s => ({...s, part_name: e.target.value}))} placeholder="Part name" className={cn(inputSm, 'min-w-[140px]')} />
            <input value={prt.part_number} onChange={e => setPrt(s => ({...s, part_number: e.target.value}))} placeholder="Part #" className={cn(inputSm, 'w-24 flex-none')} />
            <input value={prt.quantity} onChange={e => setPrt(s => ({...s, quantity: e.target.value}))} placeholder="Qty" type="number" min={1} className={cn(inputSm, 'w-16 flex-none')} />
            <input value={prt.unit_price} onChange={e => setPrt(s => ({...s, unit_price: e.target.value}))} placeholder="Price (AED)" type="number" className={cn(inputSm, 'w-32 flex-none')} />
            <button onClick={addPrt} disabled={isPending} className="btn-primary text-xs px-3 py-2 h-auto flex-none">
              {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <><Plus className="h-3.5 w-3.5" /> Add</>}
            </button>
          </div>
        </div>
      )}

      {/* Payment */}
      {tab === 'payment' && (
        <div className="space-y-4">
          {/* Promotion badge */}
          {job.promotion_code && (
            <div className="flex items-start gap-2.5 rounded-xl border border-[#C9A227]/30 bg-[#C9A227]/[0.06] px-3.5 py-3">
              <Sparkles className="h-4 w-4 text-[#C9A227] shrink-0 mt-0.5" />
              <div className="min-w-0">
                <p className="text-xs font-bold text-[#C9A227]">First Visit Welcome Offer · {job.promotion_code}</p>
                <p className="text-[11px] text-gray-500 dark:text-white/40 mt-0.5">
                  {job.promotion_discount_pct}% labour discount + Complimentary Headlight Lens Restoration
                  {promoDiscountAED !== null && job.subtotal > 0
                    ? ` · Discount value: ${formatAED(promoDiscountAED)}`
                    : ' · Add services to calculate discount'}
                </p>
              </div>
            </div>
          )}

          {/* Invoice summary — industry-standard layout */}
          <div className="rounded-xl border border-gray-100 bg-gray-50 dark:border-white/[0.07] dark:bg-surface-900 overflow-hidden">
            <table className="w-full text-sm">
              <tbody>
                <tr className="border-b border-gray-100 dark:border-white/[0.05]">
                  <td className="px-4 py-2.5 text-gray-500 dark:text-white/50">Subtotal (excl. VAT)</td>
                  <td className="px-4 py-2.5 text-right text-gray-700 dark:text-white/70 tabular-nums">{formatAED(job.subtotal)}</td>
                </tr>
                <tr className="border-b border-gray-100 dark:border-white/[0.05]">
                  <td className="px-4 py-2.5 text-gray-500 dark:text-white/50">
                    VAT 5%
                    <span className="ml-1.5 text-[10px] text-gray-400 dark:text-white/30">TRN required on invoice</span>
                  </td>
                  <td className="px-4 py-2.5 text-right text-gray-700 dark:text-white/70 tabular-nums">{formatAED(job.vat_amount)}</td>
                </tr>
                {job.discount > 0 && (
                  <tr className="border-b border-gray-100 dark:border-white/[0.05]">
                    <td className="px-4 py-2.5 text-gray-500 dark:text-white/50 flex items-center gap-1.5">
                      {job.promotion_code
                        ? <><Tag className="h-3 w-3 text-[#C9A227]" /><span>Discount <span className="text-[10px] font-mono text-[#C9A227]">({job.promotion_code})</span></span></>
                        : 'Discount'}
                    </td>
                    <td className="px-4 py-2.5 text-right text-emerald-500 dark:text-emerald-400 tabular-nums">−{formatAED(job.discount)}</td>
                  </tr>
                )}
                <tr className="bg-gray-100/60 dark:bg-white/[0.03]">
                  <td className="px-4 py-3 font-bold text-gray-900 dark:text-white">Total Due (AED)</td>
                  <td className="px-4 py-3 text-right font-bold text-lg text-brand tabular-nums">{formatAED(job.total)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Discount — with promo auto-apply */}
          <div className="space-y-2">
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <label className="label">Discount (AED)</label>
                <input type="number" min={0} value={discount} onChange={e => setDiscount(e.target.value)} className="input-base" />
              </div>
              <button onClick={applyDiscount} disabled={isPending} className="btn-ghost h-[42px]">Apply</button>
            </div>
            {promoDiscountAED !== null && job.discount !== promoDiscountAED && (
              <button
                onClick={() => { setDiscount(promoDiscountAED.toString()); startTransition(async () => { await updateDiscount(job.id, promoDiscountAED); onUpdate(); toast.success(`Welcome Offer discount of ${formatAED(promoDiscountAED)} applied`) }) }}
                disabled={isPending}
                className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-[#C9A227]/40 bg-[#C9A227]/[0.06] py-2 text-xs font-semibold text-[#C9A227] hover:bg-[#C9A227]/10 transition-colors disabled:opacity-50"
              >
                <Sparkles className="h-3.5 w-3.5" />
                Apply Welcome Offer — {formatAED(promoDiscountAED)} ({job.promotion_discount_pct}% of subtotal)
              </button>
            )}
          </div>

          {/* Payment details */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Payment Status</label>
              <div className="relative">
                <select value={payStatus} onChange={e => setPayStatus(e.target.value as 'unpaid'|'partial'|'paid')} className="input-base appearance-none pr-8">
                  <option value="unpaid" className="dark:bg-zinc-900">Unpaid</option>
                  <option value="partial" className="dark:bg-zinc-900">Partial</option>
                  <option value="paid" className="dark:bg-zinc-900">Paid</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-white/30" />
              </div>
            </div>
            <div>
              <label className="label">Payment Method</label>
              <div className="relative">
                <select value={payMethod} onChange={e => setPayMethod(e.target.value)} className="input-base appearance-none pr-8">
                  <option value="" className="dark:bg-zinc-900">— Select —</option>
                  {['Cash','Card','Bank Transfer','Credit'].map(m => (
                    <option key={m} value={m.toLowerCase().replace(/ /g,'_')} className="dark:bg-zinc-900">{m}</option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-white/30" />
              </div>
            </div>
          </div>
          <button onClick={markPaid} disabled={isPending} className="btn-primary w-full">
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Update Payment'}
          </button>
        </div>
      )}
    </div>
  )
}
