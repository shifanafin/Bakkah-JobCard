"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import {
  JOB_TYPE_LABEL,
  JOB_STATUS_LABEL,
  type JobStatus,
  type JobType,
} from "@/types";
import {
  Printer,
  Copy,
  MessageCircle,
  Check,
  Loader2,
  ArrowLeft,
  Car,
  Sun,
  Moon,
  AlertTriangle,
  Shield,
  FileCheck,
  Gauge,
} from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";

type RtaCheck = {
  fines_count: number;
  fines_total_aed: number;
  fines: {
    id: string;
    date: string;
    description: string;
    amount_aed: number;
    status: string;
    source: string;
  }[];
  salik_tag_number?: string;
  salik_balance_aed?: number;
  mulkiya_expiry?: string;
  mulkiya_status?: string;
  registration_number?: string;
  owner_name?: string;
  insurance_expiry?: string;
  insurance_status?: string;
  insurance_company?: string;
  inspection_expiry?: string;
  inspection_status?: string;
  inspection_center?: string;
  notes?: string;
  data_source?: string;
  checked_at?: string;
};

type InvoiceJob = {
  id: string;
  job_number: string;
  status: JobStatus;
  job_type: JobType;
  date_in: string;
  date_out?: string;
  mileage_in?: number;
  subtotal: number;
  discount: number;
  vat_amount: number;
  total: number;
  payment_status: string;
  payment_method?: string;
  customer_complaint?: string;
  customer?: {
    name: string;
    phone?: string;
    email?: string;
    company_name?: string;
  };
  vehicle?: {
    plate_number: string;
    make: string;
    model: string;
    year?: number;
    color?: string;
    vin?: string;
  };
  technician?: { name: string };
  services?: {
    id: string;
    description: string;
    quantity: number;
    unit_price: number;
    total_price: number;
  }[];
  parts?: {
    id: string;
    part_name: string;
    part_number?: string;
    quantity: number;
    unit_price: number;
    total_price: number;
  }[];
  photos?: {
    id: string;
    cloudinary_url: string;
    category: string;
    caption?: string;
  }[];
};

function fmtDate(s: string) {
  return new Date(s).toLocaleDateString("en-AE", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

const STATUS_PILL: Record<string, string> = {
  delivered: "bg-emerald-100 text-emerald-700 border border-emerald-200",
  ready: "bg-blue-100 text-blue-700 border border-blue-200",
  in_progress: "bg-brand-100 text-brand-700 border border-brand-200",
  qc_check: "bg-purple-100 text-purple-700 border border-purple-200",
  received: "bg-gray-100 text-gray-600 border border-gray-200",
  cancelled: "bg-red-100 text-red-700 border border-red-200",
};

const PAYMENT_CONFIG: Record<
  string,
  { dot: string; text: string; bg: string; border: string }
> = {
  paid: {
    dot: "bg-emerald-500",
    text: "text-emerald-700",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
  },
  partial: {
    dot: "bg-amber-500",
    text: "text-amber-700",
    bg: "bg-amber-50",
    border: "border-amber-200",
  },
  unpaid: {
    dot: "bg-red-500",
    text: "text-red-700",
    bg: "bg-red-50",
    border: "border-red-200",
  },
};

export default function PublicInvoicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { theme, toggle } = useTheme();
  const [job, setJob] = useState<InvoiceJob | null>(null);
  const [rta, setRta] = useState<RtaCheck | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    setOrigin(window.location.origin);
    async function load() {
      const sb = createClient();
      const [{ data: jobData }, { data: rtaData }] = await Promise.all([
        sb
          .from("job_cards")
          .select(
            `
          *, customer:customers(*), vehicle:vehicles(*), technician:technicians(name),
          services:job_card_services(*), parts:job_card_parts(*), photos:job_card_photos(*)
        `,
          )
          .eq("id", id)
          .single(),
        sb
          .from("vehicle_rta_checks")
          .select("*")
          .eq("job_card_id", id)
          .eq("include_in_invoice", true)
          .maybeSingle(),
      ]);
      const j = jobData as InvoiceJob;
      setJob(j);
      setRta(rtaData as RtaCheck | null);
      setLoading(false);
    }
    load();
  }, [id]);

  function handleCopyLink() {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (loading)
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-surface-900">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-brand" />
          <p className="text-sm text-gray-400 dark:text-white/30">
            Loading invoice…
          </p>
        </div>
      </div>
    );

  if (!job)
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-5 bg-gray-50 dark:bg-surface-900 px-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100 dark:bg-white/[0.06]">
          <span className="text-2xl">📄</span>
        </div>
        <div className="text-center">
          <p className="text-base font-bold text-gray-900 dark:text-white mb-1">
            Invoice not found
          </p>
          <p className="text-sm text-gray-400 dark:text-white/30">
            This invoice may have been removed or the link is incorrect.
          </p>
        </div>
        <Link
          href="/invoice"
          className="inline-flex items-center gap-2 rounded-xl bg-brand px-5 py-2.5 text-sm font-bold text-black shadow-[0_2px_12px_rgba(107,122,40,0.25)] hover:bg-brand/90 transition"
        >
          <ArrowLeft className="h-4 w-4" /> Find your invoice
        </Link>
      </div>
    );

  const beforePhotos = (job.photos ?? [])
    .filter((p) => p.category === "before_work")
    .slice(0, 4);
  const afterPhotos = (job.photos ?? [])
    .filter((p) => p.category === "after_work")
    .slice(0, 4);
  const damagePhotos = (job.photos ?? [])
    .filter((p) => p.category === "damage")
    .slice(0, 4);

  const trackUrl = `${origin}/track?job=${encodeURIComponent(job.job_number)}`;
  const waText = `Invoice ${job.job_number} for ${job.vehicle?.plate_number ?? ""}\nTotal: AED ${job.total.toFixed(2)}\n\nView invoice: ${origin}/invoice/${id}`;
  const waLink = `https://wa.me/971545886999?text=${encodeURIComponent(waText)}`;
  const payment = PAYMENT_CONFIG[job.payment_status] ?? PAYMENT_CONFIG.unpaid;

  return (
    <>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { margin: 0; background: #fff !important; color: #000 !important; }
          @page { size: A4; margin: 15mm; }
          .invoice-paper { box-shadow: none !important; border: none !important; }
        }
      `}</style>

      {/* ── Action bar ────────────────────────────────── */}
      <div className="no-print sticky top-0 z-50 flex items-center justify-between gap-2 border-b border-gray-200/80 dark:border-white/[0.06] bg-white/95 dark:bg-surface-900/95 px-4 py-3 backdrop-blur-md shadow-sm flex-wrap">
        <Link
          href={trackUrl}
          className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-800 dark:text-white/40 dark:hover:text-white/70 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <Car className="h-4 w-4 text-brand" />
          <span className="hidden sm:inline">Track Job</span>
        </Link>
        <div className="flex items-center gap-2 flex-wrap justify-end">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 rounded-xl bg-brand px-4 py-2 text-sm font-bold text-black shadow-[0_2px_12px_rgba(107,122,40,0.25)] hover:bg-brand/90 transition-colors"
          >
            <Printer className="h-4 w-4" />{" "}
            <span className="hidden sm:inline">Download</span> PDF
          </button>
          <a
            href={waLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2 text-sm font-bold text-white shadow-[0_2px_8px_rgba(16,185,129,0.25)] hover:bg-emerald-600 transition-colors"
          >
            <MessageCircle className="h-4 w-4" />{" "}
            <span className="hidden sm:inline">WhatsApp</span>
          </a>
          <button
            onClick={handleCopyLink}
            className="flex items-center gap-2 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/[0.04] px-4 py-2 text-sm font-medium text-gray-600 dark:text-white/60 hover:bg-gray-50 dark:hover:bg-white/[0.07] transition-colors"
          >
            {copied ? (
              <Check className="h-4 w-4 text-emerald-500" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
            <span className="hidden sm:inline">
              {copied ? "Copied!" : "Copy Link"}
            </span>
          </button>
          <button
            onClick={toggle}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/[0.04] text-gray-500 dark:text-white/40 hover:bg-gray-50 dark:hover:bg-white/[0.07] transition-colors"
            aria-label="Toggle theme"
          >
            {theme === "dark" ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      {/* ── Invoice wrapper ──────────────────────────── */}
      <div className="min-h-screen bg-gray-100 dark:bg-surface-900 py-8 pt-6 print:pt-0 print:bg-white transition-colors">
        <div className="invoice-paper max-w-[210mm] mx-auto bg-white dark:bg-white print:bg-white shadow-[0_8px_40px_rgba(0,0,0,0.12)] dark:shadow-[0_8px_40px_rgba(0,0,0,0.5)] rounded-2xl overflow-hidden print:rounded-none print:shadow-none">
          <div className="p-7 sm:p-10 text-gray-900 font-sans">
            {/* Header */}
            <div
              className="flex flex-col sm:flex-row items-start justify-between pb-7 mb-7 gap-5"
              style={{ borderBottom: "3px solid #6B7A28" }}
            >
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <img src="/logo.svg" alt="Bakkah Logo" className="h-12 w-12 rounded-full" />
                  <div>
                    <h1 className="text-2xl font-black text-gray-900 tracking-tight leading-none">
                      Bakkah
                    </h1>
                    <p className="text-[10px] tracking-widest text-gray-400 font-medium uppercase">
                      Auto Premium Care
                    </p>
                  </div>
                </div>
                <div className="space-y-0.5">
                  <p className="text-sm text-gray-500">
                    Al Qusais Industrial Area, Dubai, UAE
                  </p>
                  <p className="text-sm text-gray-500">Tel: +971 54 588 6999</p>
                  <p className="text-sm text-gray-500">
                    TRN: 100 000 000 000 003
                  </p>
                </div>
              </div>
              <div className="sm:text-right">
                <div className="inline-flex items-center rounded-xl bg-[#6B7A28] px-5 py-2.5 mb-3">
                  <p className="text-white font-black text-xl tracking-[0.15em]">
                    TAX INVOICE
                  </p>
                </div>
                <div className="space-y-1.5">
                  <p className="text-sm text-gray-500">
                    Invoice:{" "}
                    <strong className="text-gray-900 font-mono">
                      {job.job_number}
                    </strong>
                  </p>
                  <p className="text-sm text-gray-500">
                    Date:{" "}
                    <strong className="text-gray-900">
                      {fmtDate(job.date_in)}
                    </strong>
                  </p>
                  {job.date_out && (
                    <p className="text-sm text-gray-500">
                      Expected:{" "}
                      <strong className="text-gray-900">
                        {fmtDate(job.date_out)}
                      </strong>
                    </p>
                  )}
                  <div className="pt-1">
                    <span
                      className={`inline-block rounded-full px-3 py-1 text-xs font-bold ${STATUS_PILL[job.status] ?? STATUS_PILL.received}`}
                    >
                      {JOB_STATUS_LABEL[job.status]}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Customer + Vehicle */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-7">
              <div className="rounded-xl bg-gray-50 p-4 border border-gray-100">
                <h2 className="text-[10px] font-black uppercase tracking-widest text-[#6B7A28] mb-3">
                  Bill To
                </h2>
                <p className="font-bold text-gray-900 text-base leading-snug">
                  {job.customer?.name}
                </p>
                {job.customer?.company_name && (
                  <p className="text-sm text-gray-600 mt-0.5">
                    {job.customer.company_name}
                  </p>
                )}
                <p className="text-sm text-gray-600 mt-1">
                  {job.customer?.phone}
                </p>
                {job.customer?.email && (
                  <p className="text-sm text-gray-500">{job.customer.email}</p>
                )}
              </div>
              <div className="rounded-xl bg-gray-50 p-4 border border-gray-100">
                <h2 className="text-[10px] font-black uppercase tracking-widest text-[#6B7A28] mb-3">
                  Vehicle
                </h2>
                <p className="font-black font-mono text-gray-900 text-2xl tracking-widest mb-1">
                  {job.vehicle?.plate_number}
                </p>
                <p className="text-sm font-semibold text-gray-700">
                  {job.vehicle?.make} {job.vehicle?.model} {job.vehicle?.year}
                </p>
                {job.vehicle?.color && (
                  <p className="text-xs text-gray-500 mt-0.5">
                    Colour: {job.vehicle.color}
                  </p>
                )}
                {job.mileage_in && (
                  <p className="text-xs text-gray-500">
                    Mileage in: {job.mileage_in.toLocaleString()} km
                  </p>
                )}
                <p className="text-xs text-gray-500">
                  Type: {JOB_TYPE_LABEL[job.job_type]}
                </p>
                {job.technician && (
                  <p className="text-xs text-gray-500">
                    Technician: {job.technician.name}
                  </p>
                )}
              </div>
            </div>

            {/* Services */}
            {(job.services ?? []).length > 0 && (
              <div className="mb-6 overflow-x-auto">
                <h2 className="text-[10px] font-black uppercase tracking-widest text-[#6B7A28] mb-3">
                  Labour / Services
                </h2>
                <table className="w-full text-sm border-collapse min-w-[400px]">
                  <thead>
                    <tr className="bg-[#6B7A28]/8 rounded-lg">
                      <th className="px-3 py-2.5 text-left font-bold text-gray-700 bg-brand-50 rounded-l-lg border border-brand-100 border-r-0">
                        Description
                      </th>
                      <th className="px-3 py-2.5 text-center font-bold text-gray-700 w-16 bg-brand-50 border-y border-brand-100">
                        Qty
                      </th>
                      <th className="px-3 py-2.5 text-right font-bold text-gray-700 w-28 bg-brand-50 border-y border-brand-100">
                        Unit (AED)
                      </th>
                      <th className="px-3 py-2.5 text-right font-bold text-gray-700 w-28 bg-brand-50 rounded-r-lg border border-brand-100 border-l-0">
                        Total (AED)
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {(job.services ?? []).map((s, i) => (
                      <tr
                        key={s.id}
                        className={i % 2 === 0 ? "" : "bg-gray-50/60"}
                      >
                        <td className="px-3 py-2.5 border-b border-gray-100 text-gray-700">
                          {s.description}
                        </td>
                        <td className="px-3 py-2.5 border-b border-gray-100 text-center text-gray-600">
                          {s.quantity}
                        </td>
                        <td className="px-3 py-2.5 border-b border-gray-100 text-right tabular-nums text-gray-600">
                          {s.unit_price.toFixed(2)}
                        </td>
                        <td className="px-3 py-2.5 border-b border-gray-100 text-right tabular-nums font-bold text-gray-900">
                          {s.total_price.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Parts */}
            {(job.parts ?? []).length > 0 && (
              <div className="mb-6 overflow-x-auto">
                <h2 className="text-[10px] font-black uppercase tracking-widest text-[#6B7A28] mb-3">
                  Parts / Materials
                </h2>
                <table className="w-full text-sm border-collapse min-w-[400px]">
                  <thead>
                    <tr>
                      <th className="px-3 py-2.5 text-left font-bold text-gray-700 bg-brand-50 rounded-l-lg border border-brand-100 border-r-0">
                        Part Name
                      </th>
                      <th className="px-3 py-2.5 text-left font-bold text-gray-700 w-28 bg-brand-50 border-y border-brand-100">
                        Part #
                      </th>
                      <th className="px-3 py-2.5 text-center font-bold text-gray-700 w-16 bg-brand-50 border-y border-brand-100">
                        Qty
                      </th>
                      <th className="px-3 py-2.5 text-right font-bold text-gray-700 w-28 bg-brand-50 border-y border-brand-100">
                        Unit (AED)
                      </th>
                      <th className="px-3 py-2.5 text-right font-bold text-gray-700 w-28 bg-brand-50 rounded-r-lg border border-brand-100 border-l-0">
                        Total (AED)
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {(job.parts ?? []).map((p, i) => (
                      <tr
                        key={p.id}
                        className={i % 2 === 0 ? "" : "bg-gray-50/60"}
                      >
                        <td className="px-3 py-2.5 border-b border-gray-100 text-gray-700 font-medium">
                          {p.part_name}
                        </td>
                        <td className="px-3 py-2.5 border-b border-gray-100 font-mono text-xs text-gray-400">
                          {p.part_number ?? "—"}
                        </td>
                        <td className="px-3 py-2.5 border-b border-gray-100 text-center text-gray-600">
                          {p.quantity}
                        </td>
                        <td className="px-3 py-2.5 border-b border-gray-100 text-right tabular-nums text-gray-600">
                          {p.unit_price.toFixed(2)}
                        </td>
                        <td className="px-3 py-2.5 border-b border-gray-100 text-right tabular-nums font-bold text-gray-900">
                          {p.total_price.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Totals */}
            <div className="flex justify-end mb-7">
              <div className="w-full sm:w-72 rounded-xl border border-gray-100 bg-gray-50 p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Subtotal</span>
                  <span className="tabular-nums font-medium text-gray-700">
                    AED {job.subtotal.toFixed(2)}
                  </span>
                </div>
                {job.discount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Discount</span>
                    <span className="tabular-nums text-emerald-600 font-medium">
                      −AED {job.discount.toFixed(2)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">VAT (5%)</span>
                  <span className="tabular-nums font-medium text-gray-700">
                    AED {job.vat_amount.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between pt-3 border-t-2 border-gray-900 text-base font-black">
                  <span className="text-gray-900">TOTAL (AED)</span>
                  <span className="tabular-nums text-[#6B7A28] text-xl">
                    AED {job.total.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Payment status */}
            <div
              className={`mb-7 flex items-center gap-3 rounded-xl border p-3.5 ${payment.bg} ${payment.border}`}
            >
              <div className={`h-3 w-3 rounded-full shrink-0 ${payment.dot}`} />
              <span className={`text-sm font-bold capitalize ${payment.text}`}>
                {job.payment_status}
              </span>
              {job.payment_method && (
                <span className={`text-sm ${payment.text} opacity-70`}>
                  via {job.payment_method}
                </span>
              )}
              <span className="ml-auto text-xs text-gray-400">
                Payment Status
              </span>
            </div>

            {/* UAE RTA Vehicle Check */}
            {rta && (
              <div className="mb-7 rounded-xl border border-blue-100 bg-blue-50/50 p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Shield className="h-4 w-4 text-blue-600" />
                  <h2 className="text-[10px] font-black uppercase tracking-widest text-blue-600">
                    UAE Vehicle Status
                  </h2>
                  {rta.data_source && rta.data_source !== "manual" && (
                    <span className="ml-auto text-[9px] uppercase tracking-wider text-blue-400 font-bold">
                      Verified via RTA
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                  {/* Fines */}
                  <div
                    className={`rounded-lg p-3 ${rta.fines_count > 0 ? "bg-red-50 border border-red-100" : "bg-emerald-50 border border-emerald-100"}`}
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      <AlertTriangle
                        className={`h-3.5 w-3.5 ${rta.fines_count > 0 ? "text-red-500" : "text-emerald-500"}`}
                      />
                      <span className="text-[9px] uppercase tracking-wider font-bold text-gray-500">
                        Fines
                      </span>
                    </div>
                    <p
                      className={`text-xl font-black tabular-nums ${rta.fines_count > 0 ? "text-red-600" : "text-emerald-600"}`}
                    >
                      {rta.fines_count > 0
                        ? `AED ${rta.fines_total_aed.toFixed(0)}`
                        : "Clear"}
                    </p>
                    {rta.fines_count > 0 && (
                      <p className="text-[10px] text-red-400">
                        {rta.fines_count} violation
                        {rta.fines_count !== 1 ? "s" : ""}
                      </p>
                    )}
                  </div>
                  {/* Mulkiya */}
                  <div
                    className={`rounded-lg p-3 ${rta.mulkiya_status === "expired" ? "bg-red-50 border border-red-100" : "bg-gray-50 border border-gray-100"}`}
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      <FileCheck className="h-3.5 w-3.5 text-gray-400" />
                      <span className="text-[9px] uppercase tracking-wider font-bold text-gray-500">
                        Mulkiya
                      </span>
                    </div>
                    <p
                      className={`text-sm font-bold capitalize ${rta.mulkiya_status === "active" ? "text-emerald-600" : rta.mulkiya_status === "expired" ? "text-red-600" : "text-gray-600"}`}
                    >
                      {rta.mulkiya_status ?? "Unknown"}
                    </p>
                    {rta.mulkiya_expiry && (
                      <p className="text-[10px] text-gray-400">
                        Exp:{" "}
                        {new Date(rta.mulkiya_expiry).toLocaleDateString(
                          "en-AE",
                          { day: "2-digit", month: "short", year: "numeric" },
                        )}
                      </p>
                    )}
                  </div>
                  {/* Insurance */}
                  <div
                    className={`rounded-lg p-3 ${rta.insurance_status === "expired" ? "bg-red-50 border border-red-100" : "bg-gray-50 border border-gray-100"}`}
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      <Shield className="h-3.5 w-3.5 text-gray-400" />
                      <span className="text-[9px] uppercase tracking-wider font-bold text-gray-500">
                        Insurance
                      </span>
                    </div>
                    <p
                      className={`text-sm font-bold capitalize ${rta.insurance_status === "valid" ? "text-emerald-600" : rta.insurance_status === "expired" ? "text-red-600" : "text-gray-600"}`}
                    >
                      {rta.insurance_status ?? "Unknown"}
                    </p>
                    {rta.insurance_expiry && (
                      <p className="text-[10px] text-gray-400">
                        Exp:{" "}
                        {new Date(rta.insurance_expiry).toLocaleDateString(
                          "en-AE",
                          { day: "2-digit", month: "short", year: "numeric" },
                        )}
                      </p>
                    )}
                  </div>
                  {/* Inspection */}
                  <div
                    className={`rounded-lg p-3 ${rta.inspection_status === "fail" ? "bg-red-50 border border-red-100" : "bg-gray-50 border border-gray-100"}`}
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      <Gauge className="h-3.5 w-3.5 text-gray-400" />
                      <span className="text-[9px] uppercase tracking-wider font-bold text-gray-500">
                        Inspection
                      </span>
                    </div>
                    <p
                      className={`text-sm font-bold capitalize ${rta.inspection_status === "pass" ? "text-emerald-600" : rta.inspection_status === "fail" ? "text-red-600" : "text-gray-600"}`}
                    >
                      {rta.inspection_status ?? "Unknown"}
                    </p>
                    {rta.inspection_expiry && (
                      <p className="text-[10px] text-gray-400">
                        Exp:{" "}
                        {new Date(rta.inspection_expiry).toLocaleDateString(
                          "en-AE",
                          { day: "2-digit", month: "short", year: "numeric" },
                        )}
                      </p>
                    )}
                  </div>
                </div>

                {/* Salik balance */}
                {rta.salik_tag_number && (
                  <div className="flex items-center justify-between rounded-lg bg-white border border-blue-100 px-3 py-2.5 mb-3 text-sm">
                    <span className="text-gray-500 text-xs font-bold uppercase tracking-wider">
                      Salik Tag
                    </span>
                    <div className="text-right">
                      <span className="font-mono text-gray-700 text-xs">
                        {rta.salik_tag_number}
                      </span>
                      {rta.salik_balance_aed != null && (
                        <span className="ml-3 font-black text-blue-600">
                          AED {rta.salik_balance_aed.toFixed(2)}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Fines detail */}
                {(rta.fines ?? []).length > 0 && (
                  <div className="rounded-lg bg-white border border-red-100 overflow-hidden">
                    <p className="text-[9px] uppercase tracking-wider font-black text-red-400 px-3 pt-2.5 pb-1">
                      Fine Details
                    </p>
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-red-50">
                          <th className="px-3 py-1.5 text-left font-bold text-gray-500">
                            Description
                          </th>
                          <th className="px-3 py-1.5 text-center font-bold text-gray-500 w-20">
                            Date
                          </th>
                          <th className="px-3 py-1.5 text-right font-bold text-gray-500 w-20">
                            Amount
                          </th>
                          <th className="px-3 py-1.5 text-right font-bold text-gray-500 w-16">
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {(rta.fines ?? []).map((f, i) => (
                          <tr
                            key={f.id ?? i}
                            className="border-t border-gray-50"
                          >
                            <td className="px-3 py-1.5 text-gray-700">
                              {f.description}
                            </td>
                            <td className="px-3 py-1.5 text-center text-gray-400">
                              {f.date
                                ? new Date(f.date).toLocaleDateString("en-AE", {
                                  day: "2-digit",
                                  month: "short",
                                })
                                : "—"}
                            </td>
                            <td className="px-3 py-1.5 text-right tabular-nums font-bold text-red-600">
                              AED {f.amount_aed.toFixed(0)}
                            </td>
                            <td
                              className={`px-3 py-1.5 text-right capitalize font-bold ${f.status === "paid" ? "text-emerald-500" : "text-red-500"}`}
                            >
                              {f.status}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {rta.notes && (
                  <p className="mt-3 text-xs text-gray-400 italic">
                    {rta.notes}
                  </p>
                )}
              </div>
            )}

            {/* Track Job CTA */}
            <div className="mb-7 rounded-xl border border-brand-200 bg-brand-50 p-4 no-print">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <p className="text-sm font-bold text-brand-700 mb-1">
                    Track your vehicle in real-time
                  </p>
                  <p className="text-xs text-brand leading-relaxed">
                    See exactly where your car is in the service process.
                  </p>
                </div>
                <Link
                  href={trackUrl}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#6B7A28] px-4 py-2.5 text-sm font-bold text-black hover:bg-brand transition-colors shrink-0"
                >
                  <Car className="h-4 w-4" /> Track {job.job_number}
                </Link>
              </div>
            </div>

            {/* QR placeholder */}
            <div className="mb-7 flex items-center gap-4 rounded-xl border border-dashed border-gray-200 p-4 bg-gray-50/50">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl border-2 border-gray-200 bg-white">
                <div className="grid grid-cols-3 gap-0.5 p-1">
                  {Array.from({ length: 9 }).map((_, i) => (
                    <div
                      key={i}
                      className={`h-3 w-3 rounded-sm ${[0, 2, 4, 6, 8].includes(i) ? "bg-gray-800" : "bg-white"}`}
                    />
                  ))}
                </div>
              </div>
              <div>
                <p className="text-sm font-bold text-gray-700">
                  Scan to track online
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  Bakkah Job Tracker
                </p>
                <p className="text-xs font-mono text-gray-400 tracking-wider">
                  {job.job_number}
                </p>
              </div>
            </div>

            {/* Photos */}
            {(beforePhotos.length > 0 ||
              afterPhotos.length > 0 ||
              damagePhotos.length > 0) && (
                <div className="border-t border-gray-100 pt-5 mb-7">
                  <h2 className="text-[10px] font-black uppercase tracking-widest text-[#6B7A28] mb-4">
                    Vehicle Photos
                  </h2>
                  {damagePhotos.length > 0 && (
                    <div className="mb-4">
                      <p className="text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">
                        Damage (Pre-existing)
                      </p>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {damagePhotos.map((p) => (
                          <div key={p.id} className="overflow-hidden rounded-xl">
                            <img
                              src={p.cloudinary_url}
                              alt={p.caption ?? "damage"}
                              className="w-full aspect-[4/3] object-cover hover:scale-105 transition-transform duration-300"
                            />
                            {p.caption && (
                              <p className="text-[9px] text-gray-400 mt-1 truncate px-0.5">
                                {p.caption}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {beforePhotos.length > 0 && (
                    <div className="mb-4">
                      <p className="text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">
                        Before Work
                      </p>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {beforePhotos.map((p) => (
                          <div key={p.id} className="overflow-hidden rounded-xl">
                            <img
                              src={p.cloudinary_url}
                              alt="before"
                              className="w-full aspect-[4/3] object-cover hover:scale-105 transition-transform duration-300"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {afterPhotos.length > 0 && (
                    <div>
                      <p className="text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">
                        After Work
                      </p>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {afterPhotos.map((p) => (
                          <div key={p.id} className="overflow-hidden rounded-xl">
                            <img
                              src={p.cloudinary_url}
                              alt="after"
                              className="w-full aspect-[4/3] object-cover hover:scale-105 transition-transform duration-300"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

            {/* Footer */}
            <div
              className="mt-8 text-center"
              style={{ borderTop: "2px solid #6B7A28", paddingTop: "1.25rem" }}
            >
              <p className="text-xs text-gray-400">
                Bakkah Premium Auto Care · Al Qusais Industrial Area, Dubai, UAE ·
                TRN: 100 000 000 000 003
              </p>
              <p className="mt-1 text-xs text-gray-400">
                This is a computer-generated invoice. Thank you for choosing
                Bakkah.
              </p>
              <p className="mt-1 text-xs font-bold text-[#6B7A28]">
                +971 54 588 6999 · bakkahgarage.com
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
