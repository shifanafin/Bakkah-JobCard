"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useTheme } from "@/components/ThemeProvider";
import { JOB_STATUS_STEP, type JobStatus } from "@/types";
import { formatAED, formatDate } from "@/lib/utils/format";
import {
  Search, Sun, Moon, Car, User, Calendar, Check, Loader2, MessageCircle,
  ExternalLink, ArrowLeft, X, Star, Send, Quote, FileText, MapPin, Clock,
  Wrench, Package, ChevronRight, Phone, Hash, Image as ImageIcon, History,
  ChevronDown, ChevronUp, ShieldCheck, BadgeCheck, AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { createClient as createSupabaseClient } from "@/lib/supabase/client";

// ── Types ────────────────────────────────────────────────────────────────────

type Photo = {
  id: string;
  cloudinary_url: string;
  category: string;
  caption?: string;
  sort_order: number;
  created_at: string;
};

type Service = { id: string; description: string; total_price: number; completed?: boolean };
type Part = { id: string; part_name: string; quantity: number; unit_price: number; total_price: number };

type JobSummary = {
  id: string;
  job_number: string;
  status: JobStatus;
  job_type: string;
  date_in: string;
  date_out?: string;
  date_delivered?: string;
  mileage_in?: number;
  mileage_out?: number;
  customer_complaint?: string;
  subtotal: number;
  vat_amount: number;
  discount: number;
  total: number;
  payment_status: string;
  payment_method?: string;
  created_at: string;
  customer?: { name: string; phone?: string; email?: string; company_name?: string; is_fleet?: boolean };
  vehicle?: { plate_number: string; make: string; model: string; color?: string; year?: number; vin?: string };
  technician?: { name: string; role: string };
  services?: Service[];
  parts?: Part[];
  photos?: Photo[];
};

type TrackResponse = {
  mode: "job" | "vehicle" | "customer";
  current: JobSummary;
  history: JobSummary[];
};

type Announcement = { id: string; title: string; content: string; type: "info" | "warning" | "success" | "promo" };
type ApprovedFeedback = { id: string; customer_name: string; rating: number; comment: string | null; created_at: string };

// ── Constants ────────────────────────────────────────────────────────────────

const STEPS: JobStatus[] = ["received", "in_progress", "qc_check", "ready", "delivered"];

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; border: string; dot: string }> = {
  waiting_for_approval: { label: "Waiting for Approval", color: "text-orange-600 dark:text-orange-300", bg: "bg-orange-50 dark:bg-orange-500/10", border: "border-orange-200 dark:border-orange-500/20", dot: "bg-orange-500" },
  pending: { label: "Pending", color: "text-amber-600 dark:text-amber-300", bg: "bg-amber-50 dark:bg-amber-500/10", border: "border-amber-200 dark:border-amber-500/20", dot: "bg-amber-500" },
  assigned: { label: "Assigned", color: "text-blue-600 dark:text-blue-300", bg: "bg-blue-50 dark:bg-blue-500/10", border: "border-blue-200 dark:border-blue-500/20", dot: "bg-blue-500" },
  received: { label: "Received", color: "text-blue-600 dark:text-blue-300", bg: "bg-blue-50 dark:bg-blue-500/10", border: "border-blue-200 dark:border-blue-500/20", dot: "bg-blue-500" },
  in_progress: { label: "In Progress", color: "text-brand dark:text-brand", bg: "bg-brand-50 dark:bg-brand/10", border: "border-brand-200 dark:border-brand/20", dot: "bg-brand" },
  qc_check: { label: "Quality Check", color: "text-purple-600 dark:text-purple-300", bg: "bg-purple-50 dark:bg-purple-500/10", border: "border-purple-200 dark:border-purple-500/20", dot: "bg-purple-500" },
  ready: { label: "Ready", color: "text-emerald-600 dark:text-emerald-300", bg: "bg-emerald-50 dark:bg-emerald-500/10", border: "border-emerald-200 dark:border-emerald-500/20", dot: "bg-emerald-500" },
  delivered: { label: "Delivered", color: "text-gray-500 dark:text-gray-400", bg: "bg-gray-50 dark:bg-white/[0.04]", border: "border-gray-200 dark:border-white/10", dot: "bg-gray-400" },
  cancelled: { label: "Cancelled", color: "text-red-600 dark:text-red-400", bg: "bg-red-50 dark:bg-red-500/10", border: "border-red-200 dark:border-red-500/20", dot: "bg-red-500" },
};

const JOB_TYPE_LABEL: Record<string, string> = {
  service: "Service", inspection: "360° Inspection", detailing: "Auto Detailing",
  repair: "Repair", rta_check: "RTA Check", valuation: "Valuation", other: "Other",
};

const ANNOUNCEMENT_STYLE: Record<string, string> = {
  promo: "bg-gradient-to-r from-brand to-golden text-black border-golden-300",
  info: "bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-500/10 dark:text-blue-300 dark:border-blue-500/20",
  warning: "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/20",
  success: "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/20",
};

// ── Sub-components ────────────────────────────────────────────────────────────

function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex gap-1.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <button key={i} type="button" onClick={() => onChange(i)}
          onMouseEnter={() => setHovered(i)} onMouseLeave={() => setHovered(0)}
          className="transition-all hover:scale-110 active:scale-95">
          <Star className={cn("h-8 w-8 transition-colors drop-shadow-sm",
            i <= (hovered || value) ? "fill-amber-400 text-amber-400" : "text-gray-200 dark:text-white/15")} />
        </button>
      ))}
    </div>
  );
}

function StarRow({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} className={cn("h-3.5 w-3.5",
          i <= rating ? "fill-amber-400 text-amber-400" : "text-gray-200 dark:text-white/10")} />
      ))}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.received;
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-bold",
      cfg.color, cfg.bg, cfg.border)}>
      <span className={cn("h-1.5 w-1.5 rounded-full", cfg.dot)} />
      {cfg.label}
    </span>
  );
}

function PhotoGallery({ photos, title, category }: { photos: Photo[]; title: string; category?: string }) {
  const [lightbox, setLightbox] = useState<string | null>(null);
  const filtered = category
    ? photos.filter(p => p.category === category)
    : photos;
  if (filtered.length === 0) return null;

  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-white/30 mb-2">{title}</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {filtered.map(p => (
          <button key={p.id} onClick={() => setLightbox(p.cloudinary_url)}
            className="relative aspect-square overflow-hidden rounded-xl border border-gray-100 dark:border-white/[0.06] bg-gray-50 dark:bg-white/[0.03] hover:scale-[1.02] transition-transform">
            <Image src={p.cloudinary_url} alt={p.caption || p.category}
              fill sizes="(max-width: 640px) 50vw, 33vw"
              className="object-cover" />
            {p.caption && (
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent px-2 py-1.5">
                <p className="text-[10px] text-white font-medium truncate">{p.caption}</p>
              </div>
            )}
          </button>
        ))}
      </div>
      {lightbox && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          onClick={() => setLightbox(null)}>
          <button className="absolute top-4 right-4 text-white/70 hover:text-white">
            <X className="h-6 w-6" />
          </button>
          <div className="relative max-h-[90vh] max-w-[95vw] overflow-hidden rounded-2xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={lightbox} alt="Vehicle photo" className="max-h-[90vh] max-w-[95vw] object-contain" />
          </div>
        </div>
      )}
    </div>
  );
}

function StatusStepper({ status }: { status: JobStatus }) {
  if (status === "cancelled") return null;
  if (status === "waiting_for_approval") {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-orange-200 dark:border-orange-500/20 bg-orange-50 dark:bg-orange-500/10 px-4 py-3">
        <ShieldCheck className="h-5 w-5 text-orange-500 shrink-0" />
        <div>
          <p className="text-sm font-bold text-orange-700 dark:text-orange-300">Waiting for Approval</p>
          <p className="text-xs text-orange-600/70 dark:text-orange-400/70 mt-0.5">Your job card is pending approval before work begins.</p>
        </div>
      </div>
    );
  }
  const curStep = JOB_STATUS_STEP[status] ?? 0;
  return (
    <div>
      <div className="hidden sm:block">
        <div className="relative">
          <div className="absolute top-4 left-4 right-4 h-0.5 bg-gray-100 dark:bg-white/[0.06]" />
          <div className="absolute top-4 left-4 h-0.5 bg-gradient-to-r from-brand to-golden"
            style={{ width: `calc(${(curStep / (STEPS.length - 1)) * 100}% - 2rem)` }} />
          <div className="relative flex justify-between">
            {STEPS.map((step, i) => {
              const done = i < curStep;
              const active = i === curStep;
              const STEP_LABELS: Record<string, string> = {
                received: "Received", in_progress: "In Progress",
                qc_check: "QC Check", ready: "Ready", delivered: "Delivered",
              };
              return (
                <div key={step} className="flex flex-col items-center gap-2">
                  <div className={cn("flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-bold transition-all duration-500",
                    done ? "border-emerald-500 bg-emerald-500 text-white shadow-[0_0_12px_rgba(16,185,129,0.3)]"
                      : active ? "border-brand bg-brand text-black shadow-[0_0_16px_rgba(107,122,40,0.4)]"
                        : "border-gray-200 bg-white text-gray-300 dark:border-white/15 dark:bg-surface-800 dark:text-white/20")}>
                    {done ? <Check className="h-4 w-4" /> : i + 1}
                  </div>
                  <span className={cn("text-[10px] font-semibold whitespace-nowrap",
                    active ? "text-brand" : done ? "text-emerald-500" : "text-gray-300 dark:text-white/25")}>
                    {STEP_LABELS[step]}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <div className="sm:hidden">
        {(() => {
          const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.received;
          return (
            <div className={cn("flex items-center gap-3 rounded-xl border px-4 py-3", cfg.bg, cfg.border)}>
              <div className={cn("flex h-10 w-10 items-center justify-center rounded-full font-black text-sm shrink-0",
                cfg.dot === "bg-brand" ? "bg-brand text-black" : `${cfg.dot} text-white`)}>
                {curStep + 1}
              </div>
              <div>
                <p className={cn("text-sm font-bold", cfg.color)}>{cfg.label}</p>
                {curStep < STEPS.length - 1 && (
                  <p className="text-xs text-gray-500 dark:text-white/40 mt-0.5">
                    Next: {STATUS_CONFIG[STEPS[curStep + 1]]?.label}
                  </p>
                )}
              </div>
              <div className="ml-auto flex gap-1">
                {STEPS.map((_, i) => (
                  <div key={i} className={cn("h-1.5 w-5 rounded-full transition-all",
                    i < curStep ? "bg-emerald-500" : i === curStep ? "bg-brand" : "bg-gray-200 dark:bg-white/10")} />
                ))}
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}

// ── Job Card Detail (Customer View) ─────────────────────────────────────────

function JobCardDetail({
  job, showFull = true, approvalData, onApproved,
}: {
  job: JobSummary;
  showFull?: boolean;
  approvalData?: { phone: string; plate?: string };
  onApproved?: () => void;
}) {
  const [approving, setApproving] = useState(false);
  const [approveError, setApproveError] = useState("");
  const [showDecline, setShowDecline] = useState(false);
  const [declineReason, setDeclineReason] = useState("");
  const [declining, setDeclining] = useState(false);

  async function handleApprove() {
    if (!approvalData) return;
    setApproving(true);
    setApproveError("");
    try {
      const res = await fetch("/api/approve-job", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ job_id: job.id, phone: approvalData.phone, plate: approvalData.plate, action: "approve" }),
      });
      const data = await res.json();
      if (!res.ok) { setApproveError(data.error || "Failed to approve job"); return; }
      onApproved?.();
    } catch {
      setApproveError("Something went wrong. Please try again.");
    } finally {
      setApproving(false);
    }
  }

  async function handleDecline() {
    if (!approvalData) return;
    setDeclining(true);
    setApproveError("");
    try {
      const res = await fetch("/api/approve-job", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ job_id: job.id, phone: approvalData.phone, plate: approvalData.plate, action: "decline", reason: declineReason }),
      });
      const data = await res.json();
      if (!res.ok) { setApproveError(data.error || "Failed to decline job"); return; }
      onApproved?.();
    } catch {
      setApproveError("Something went wrong. Please try again.");
    } finally {
      setDeclining(false);
    }
  }

  const statusCfg = STATUS_CONFIG[job.status] ?? STATUS_CONFIG.received;
  const beforePhotos = (job.photos ?? []).filter(p => p.category === "before_work");
  const afterPhotos = (job.photos ?? []).filter(p => p.category === "after_work");
  const damagePhotos = (job.photos ?? []).filter(p => p.category === "damage");
  const hasPhotos = beforePhotos.length > 0 || afterPhotos.length > 0 || damagePhotos.length > 0;

  return (
    <div className="space-y-4">
      {/* Job header */}
      <div className="card-elevated overflow-hidden">
        <div className={cn("h-1.5 -mx-5 -mt-5 mb-5 rounded-t-2xl", statusCfg.dot)} />
        <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
          <div>
            <div className="flex items-center gap-2.5 flex-wrap mb-1.5">
              <span className="font-mono text-xl font-black text-brand tracking-wider">{job.job_number}</span>
              <StatusBadge status={job.status} />
              <span className="rounded-full bg-gray-100 dark:bg-white/[0.06] px-2.5 py-0.5 text-xs font-medium text-gray-500 dark:text-white/40">
                {JOB_TYPE_LABEL[job.job_type] ?? job.job_type}
              </span>
            </div>
            <p className="text-sm text-gray-500 dark:text-white/50">
              {job.vehicle?.make} {job.vehicle?.model}
              {job.vehicle?.year ? ` ${job.vehicle.year}` : ""}
              {" · "}
              <span className="font-mono font-bold text-gray-700 dark:text-white/70">
                {job.vehicle?.plate_number}
              </span>
              {job.vehicle?.color ? ` · ${job.vehicle.color}` : ""}
            </p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-2xl font-black text-brand">{formatAED(job.total)}</p>
            <p className={cn("text-xs font-bold uppercase tracking-wide mt-0.5",
              job.payment_status === "paid" ? "text-emerald-500"
                : job.payment_status === "partial" ? "text-amber-500" : "text-red-400")}>
              {job.payment_status}
            </p>
          </div>
        </div>

        {showFull && <StatusStepper status={job.status as JobStatus} />}

        {/* Customer Approve / Decline */}
        {job.status === "waiting_for_approval" && approvalData && (
          <div className="mt-4 space-y-3">
            <div className="rounded-xl border border-orange-200 dark:border-orange-500/20 bg-orange-50 dark:bg-orange-500/10 px-4 py-3">
              <p className="text-sm font-bold text-orange-700 dark:text-orange-300">Workshop requires your approval</p>
              <p className="text-xs text-orange-600/70 dark:text-orange-400/70 mt-0.5">Please review the job details above, then approve or decline.</p>
            </div>

            {!showDecline ? (
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={handleApprove}
                  disabled={approving || declining}
                  className="flex items-center justify-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 transition-colors px-4 py-3 text-sm font-bold text-white">
                  {approving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                  {approving ? "Approving..." : "Approve"}
                </button>
                <button
                  onClick={() => setShowDecline(true)}
                  disabled={approving}
                  className="flex items-center justify-center gap-2 rounded-xl border-2 border-red-200 dark:border-red-500/30 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 disabled:opacity-50 transition-colors px-4 py-3 text-sm font-bold">
                  <X className="h-4 w-4" /> Decline
                </button>
              </div>
            ) : (
              <div className="space-y-3 rounded-xl border border-red-200 dark:border-red-500/20 bg-red-50 dark:bg-red-500/5 p-4">
                <div>
                  <label className="label mb-1.5 text-red-700 dark:text-red-400">Reason for declining (optional)</label>
                  <textarea
                    value={declineReason}
                    onChange={e => setDeclineReason(e.target.value)}
                    placeholder="Please let us know why you are declining..."
                    className="input-base w-full min-h-[80px] resize-none"
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => { setShowDecline(false); setDeclineReason(""); }}
                    disabled={declining}
                    className="flex items-center justify-center rounded-xl border border-gray-200 dark:border-white/10 px-4 py-2.5 text-sm font-medium text-gray-600 dark:text-white/60 hover:bg-gray-100 dark:hover:bg-white/[0.06] transition-colors">
                    Cancel
                  </button>
                  <button
                    onClick={handleDecline}
                    disabled={declining}
                    className="flex items-center justify-center gap-2 rounded-xl bg-red-500 hover:bg-red-600 disabled:opacity-50 transition-colors px-4 py-2.5 text-sm font-bold text-white">
                    {declining ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
                    {declining ? "Declining..." : "Confirm Decline"}
                  </button>
                </div>
              </div>
            )}

            {approveError && (
              <p className="text-xs text-red-500 text-center">{approveError}</p>
            )}
          </div>
        )}

        <div className="flex flex-wrap gap-4 text-sm border-t border-gray-100 dark:border-white/[0.05] pt-4 mt-4">
          <div className="flex items-center gap-2 text-gray-500 dark:text-white/50">
            <Clock className="h-3.5 w-3.5 text-gray-400 dark:text-white/30" />
            <span>In: <strong className="text-gray-800 dark:text-white/80">{formatDate(job.date_in)}</strong></span>
          </div>
          {job.date_out && (
            <div className="flex items-center gap-2 text-gray-500 dark:text-white/50">
              <Calendar className="h-3.5 w-3.5 text-brand" />
              <span>Est. Delivery: <strong className="text-gray-800 dark:text-white/80">{formatDate(job.date_out)}</strong></span>
            </div>
          )}
          {job.date_delivered && (
            <div className="flex items-center gap-2 text-emerald-500">
              <Check className="h-3.5 w-3.5" />
              <span>Delivered: <strong>{formatDate(job.date_delivered)}</strong></span>
            </div>
          )}
          {job.mileage_in && (
            <div className="flex items-center gap-2 text-gray-500 dark:text-white/50">
              <Car className="h-3.5 w-3.5" />
              <span>Mileage In: <strong className="text-gray-800 dark:text-white/80">{job.mileage_in.toLocaleString()} km</strong></span>
            </div>
          )}
          {job.mileage_out && (
            <div className="flex items-center gap-2 text-gray-500 dark:text-white/50">
              <Car className="h-3.5 w-3.5 text-brand" />
              <span>Mileage Out: <strong className="text-gray-800 dark:text-white/80">{job.mileage_out.toLocaleString()} km</strong></span>
            </div>
          )}
        </div>
      </div>

      {/* Before / After Photos */}
      {hasPhotos && (
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand/10 dark:bg-brand/15">
              <ImageIcon className="h-4 w-4 text-brand" />
            </div>
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">Vehicle Photos</h3>
          </div>
          <div className="space-y-4">
            {beforePhotos.length > 0 && (
              <PhotoGallery photos={beforePhotos} title="Before Work" />
            )}
            {afterPhotos.length > 0 && (
              <PhotoGallery photos={afterPhotos} title="After Work" />
            )}
            {damagePhotos.length > 0 && (
              <PhotoGallery photos={damagePhotos} title="Damage Assessment" />
            )}
          </div>
        </div>
      )}

      {/* Services & Parts */}
      {((job.services && job.services.length > 0) || (job.parts && job.parts.length > 0)) && (
        <div className="card">
          {job.services && job.services.length > 0 && (
            <>
              <div className="flex items-center gap-2 mb-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-500/15">
                  <Wrench className="h-4 w-4 text-purple-500" />
                </div>
                <h3 className="text-sm font-bold text-gray-900 dark:text-white">Services</h3>
              </div>
              <div className="space-y-2 mb-4">
                {job.services.map((s, i) => (
                  <div key={s.id} className={cn("flex items-center justify-between py-2 text-sm",
                    i < job.services!.length - 1 && "border-b border-gray-50 dark:border-white/[0.04]")}>
                    <div className="flex items-center gap-2 flex-1 pr-4">
                      {s.completed && <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0" />}
                      <span className="text-gray-600 dark:text-white/60">{s.description}</span>
                    </div>
                    <span className="font-semibold text-gray-900 dark:text-white tabular-nums">{formatAED(s.total_price)}</span>
                  </div>
                ))}
              </div>
            </>
          )}
          {job.parts && job.parts.length > 0 && (
            <>
              {job.services && job.services.length > 0 && (
                <div className="border-t border-gray-100 dark:border-white/[0.06] my-4" />
              )}
              <div className="flex items-center gap-2 mb-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-500/15">
                  <Package className="h-4 w-4 text-emerald-500" />
                </div>
                <h3 className="text-sm font-bold text-gray-900 dark:text-white">Parts Used</h3>
              </div>
              <div className="space-y-2 mb-4">
                {job.parts.map((p, i) => (
                  <div key={p.id} className={cn("flex items-center justify-between py-2 text-sm",
                    i < job.parts!.length - 1 && "border-b border-gray-50 dark:border-white/[0.04]")}>
                    <span className="text-gray-600 dark:text-white/60 flex-1 pr-4">
                      {p.part_name} <span className="text-gray-400 dark:text-white/30">&times;{p.quantity}</span>
                    </span>
                    <span className="font-semibold text-gray-900 dark:text-white tabular-nums">{formatAED(p.total_price)}</span>
                  </div>
                ))}
              </div>
            </>
          )}
          {/* Financial Summary */}
          <div className="border-t border-gray-200 dark:border-white/10 pt-3 space-y-1.5">
            {job.subtotal !== job.total && (
              <div className="flex justify-between text-sm text-gray-500 dark:text-white/50">
                <span>Subtotal</span>
                <span className="tabular-nums">{formatAED(job.subtotal)}</span>
              </div>
            )}
            {job.discount > 0 && (
              <div className="flex justify-between text-sm text-emerald-600 dark:text-emerald-400">
                <span>Discount</span>
                <span className="tabular-nums">-{formatAED(job.discount)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm text-gray-500 dark:text-white/50">
              <span>VAT (5%)</span>
              <span className="tabular-nums">{formatAED(job.vat_amount)}</span>
            </div>
            <div className="flex justify-between items-center pt-1.5 border-t-2 border-gray-900 dark:border-white/20">
              <span className="font-bold text-gray-900 dark:text-white">Total (incl. VAT)</span>
              <span className="font-black text-xl text-brand tabular-nums">{formatAED(job.total)}</span>
            </div>
            <p className="text-[10px] text-gray-400 dark:text-white/25 text-right">
              Prices in AED · VAT Registration No. applies
            </p>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <a href={`/invoice/${job.id}`} target="_blank" rel="noopener noreferrer"
          className="flex items-center justify-center gap-2.5 rounded-2xl border-2 border-brand/20 bg-brand/5 px-4 py-3.5 text-sm font-bold text-brand hover:bg-brand/10 hover:border-brand/30 transition-all duration-200 dark:bg-brand/10 dark:border-brand/20 dark:hover:bg-brand/15">
          <FileText className="h-4 w-4" /> View Invoice
        </a>
        <a href={`https://wa.me/971545886999?text=Hi+Bakkah%2C+I+want+to+follow+up+on+job+${encodeURIComponent(job.job_number)}`}
          target="_blank" rel="noopener noreferrer"
          className="flex items-center justify-center gap-2.5 rounded-2xl bg-emerald-500 px-4 py-3.5 text-sm font-bold text-white hover:bg-emerald-600 transition-all duration-200 shadow-[0_2px_12px_rgba(16,185,129,0.25)]">
          <MessageCircle className="h-4 w-4" /> Contact Us
        </a>
      </div>
    </div>
  );
}

// ── History Card (compact, collapsible) ─────────────────────────────────────

function HistoryCard({ job }: { job: JobSummary }) {
  const [open, setOpen] = useState(false);
  const statusCfg = STATUS_CONFIG[job.status] ?? STATUS_CONFIG.delivered;
  const beforePhotos = (job.photos ?? []).filter(p => p.category === "before_work");
  const afterPhotos = (job.photos ?? []).filter(p => p.category === "after_work");
  const hasPhotos = beforePhotos.length > 0 || afterPhotos.length > 0;

  return (
    <div className={cn("rounded-2xl border transition-all duration-200",
      open ? "border-brand/20 dark:border-brand/15 shadow-sm" : "border-gray-100 dark:border-white/[0.06]",
      "bg-white dark:bg-surface-800")}>
      {/* Header — always visible */}
      <button className="w-full p-4 flex items-start gap-3 text-left" onClick={() => setOpen(o => !o)}>
        <div className={cn("mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg shrink-0 text-xs font-black",
          statusCfg.bg, statusCfg.color)}>
          {job.status === "delivered" ? <Check className="h-4 w-4" /> : <Wrench className="h-4 w-4" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-sm font-bold text-brand">{job.job_number}</span>
            <StatusBadge status={job.status} />
          </div>
          <p className="text-xs text-gray-500 dark:text-white/40 mt-0.5">
            {formatDate(job.date_in)} · {JOB_TYPE_LABEL[job.job_type] ?? job.job_type}
            {job.mileage_in ? ` · ${job.mileage_in.toLocaleString()} km` : ""}
          </p>
          <p className="text-sm font-bold text-brand mt-1">{formatAED(job.total)}</p>
        </div>
        <div className="ml-auto shrink-0 text-gray-300 dark:text-white/20">
          {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </div>
      </button>

      {/* Expanded content */}
      {open && (
        <div className="px-4 pb-4 space-y-4 border-t border-gray-100 dark:border-white/[0.06] pt-4">
          {/* Photos */}
          {hasPhotos && (
            <div className="space-y-3">
              {beforePhotos.length > 0 && <PhotoGallery photos={beforePhotos} title="Before Work" />}
              {afterPhotos.length > 0 && <PhotoGallery photos={afterPhotos} title="After Work" />}
            </div>
          )}
          {/* Services */}
          {job.services && job.services.length > 0 && (
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-white/30 mb-2">Services</p>
              <div className="space-y-1">
                {job.services.map(s => (
                  <div key={s.id} className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-white/60 flex-1 pr-4 truncate">{s.description}</span>
                    <span className="font-medium text-gray-800 dark:text-white/80 tabular-nums shrink-0">{formatAED(s.total_price)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {/* Parts */}
          {job.parts && job.parts.length > 0 && (
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-white/30 mb-2">Parts</p>
              <div className="space-y-1">
                {job.parts.map(p => (
                  <div key={p.id} className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-white/60 flex-1 pr-4 truncate">{p.part_name} ×{p.quantity}</span>
                    <span className="font-medium text-gray-800 dark:text-white/80 tabular-nums shrink-0">{formatAED(p.total_price)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {/* Totals */}
          <div className="flex justify-between pt-2 border-t border-gray-100 dark:border-white/[0.06]">
            <div>
              {job.discount > 0 && <p className="text-xs text-emerald-500">Discount: -{formatAED(job.discount)}</p>}
              <p className="text-xs text-gray-400 dark:text-white/30">VAT (5%): {formatAED(job.vat_amount)}</p>
            </div>
            <div className="text-right">
              <p className="font-black text-brand text-lg">{formatAED(job.total)}</p>
              <a href={`/invoice/${job.id}`} target="_blank" rel="noopener noreferrer"
                className="text-xs text-brand hover:underline flex items-center gap-1 justify-end mt-0.5">
                <ExternalLink className="h-3 w-3" /> Invoice
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────

export default function TrackPage() {
  const { theme, toggle } = useTheme();
  const autoSearched = useRef(false);

  // Search mode
  const [mode, setMode] = useState<"job" | "vehicle">("vehicle");
  const [jobQuery, setJobQuery] = useState("");
  const [mobileQuery, setMobileQuery] = useState("");
  const [plateQuery, setPlateQuery] = useState("");

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TrackResponse | null>(null);
  const [error, setError] = useState("");
  const [searched, setSearched] = useState(false);

  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const [reviews, setReviews] = useState<ApprovedFeedback[]>([]);

  // Feedback state
  const [fbRating, setFbRating] = useState(0);
  const [fbComment, setFbComment] = useState("");
  const [fbName, setFbName] = useState("");
  const [fbSubmitting, setFbSubmitting] = useState(false);
  const [fbDone, setFbDone] = useState(false);

  useEffect(() => {
    async function loadAnnouncements() {
      try {
        const sb = createSupabaseClient();
        const now = new Date().toISOString();
        const { data } = await sb.from("announcements").select("id, title, content, type")
          .eq("active", true).eq("show_on_track", true)
          .or(`expires_at.is.null,expires_at.gt.${now}`)
          .order("created_at", { ascending: false });
        setAnnouncements((data ?? []) as Announcement[]);
      } catch { /* silent */ }
    }
    async function loadReviews() {
      try {
        const res = await fetch("/api/feedback?approved=true");
        if (!res.ok) return;
        const json = await res.json();
        setReviews(json.feedback ?? []);
      } catch { /* silent */ }
    }
    loadAnnouncements();
    loadReviews();
  }, []);

  useEffect(() => {
    if (autoSearched.current) return;
    const params = new URLSearchParams(window.location.search);
    const jobParam = params.get("job");
    if (jobParam) {
      autoSearched.current = true;
      setMode("job");
      setJobQuery(jobParam);
      runJobSearch(jobParam);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function runJobSearch(q: string) {
    if (!q.trim()) return;
    setLoading(true);
    setError("");
    setResult(null);
    setSearched(true);
    setFbDone(false);
    setFbRating(0);

    try {
      const res = await fetch(`/api/track?job_number=${encodeURIComponent(q.trim())}`);
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Job card not found."); return; }
      setResult(data);
      setFbName(data.current?.customer?.name ?? "");
      const deliveredJobSearch = data.current?.status === "delivered"
        ? data.current
        : (data.history ?? []).find((j: { status: string; job_number: string }) => j.status === "delivered");
      if (deliveredJobSearch?.job_number && localStorage.getItem(`fb_${deliveredJobSearch.job_number}`)) setFbDone(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function runVehicleSearch(phone: string, plate: string) {
    if (!phone.trim() && !plate.trim()) return;
    setLoading(true);
    setError("");
    setResult(null);
    setSearched(true);
    setFbDone(false);
    setFbRating(0);

    try {
      let url: string;
      if (phone.trim() && plate.trim()) {
        url = `/api/track?phone=${encodeURIComponent(phone.trim())}&plate=${encodeURIComponent(plate.trim())}`;
      } else if (phone.trim()) {
        url = `/api/track?phone=${encodeURIComponent(phone.trim())}`;
      } else {
        url = `/api/track?plate=${encodeURIComponent(plate.trim())}`;
      }
      const res = await fetch(url);
      const data = await res.json();
      if (!res.ok) { setError(data.error || "No records found."); return; }
      setResult(data);
      setFbName(data.current?.customer?.name ?? "");
      // Check if any delivered job has already been rated
      const deliveredJob = (data.history ?? []).find((j: { status: string; job_number: string }) => j.status === "delivered");
      if (deliveredJob?.job_number && localStorage.getItem(`fb_${deliveredJob.job_number}`)) setFbDone(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (mode === "job") runJobSearch(jobQuery);
    else runVehicleSearch(mobileQuery, plateQuery);
  }

  async function handleFeedbackSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (fbRating === 0) return;
    // Target the most recent delivered job
    const targetJob = result?.current?.status === "delivered"
      ? result.current
      : (result?.history ?? []).find(j => j.status === "delivered");
    if (!targetJob) return;
    setFbSubmitting(true);
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          job_card_id: targetJob.id,
          job_number: targetJob.job_number,
          customer_name: fbName || targetJob.customer?.name || "Customer",
          rating: fbRating,
          comment: fbComment || null,
        }),
      });
      if (!res.ok) throw new Error();
      setFbDone(true);
      localStorage.setItem(`fb_${targetJob.job_number}`, "1");
    } catch { /* silent */ } finally {
      setFbSubmitting(false);
    }
  }

  function reset() {
    setResult(null);
    setError("");
    setSearched(false);
    setJobQuery("");
    setMobileQuery("");
    setPlateQuery("");
    setFbDone(false);
    setFbRating(0);
    setFbComment("");
  }

  const visibleAnnouncements = announcements.filter(a => !dismissedIds.has(a.id));
  // Show feedback whenever there is any delivered job in the result (current or history)
  const feedbackJob = result?.current?.status === "delivered"
    ? result.current
    : (result?.history ?? []).find(j => j.status === "delivered");
  const showFeedback = !!feedbackJob;
  const historyJobs = (result?.history ?? []).filter(j => j.id !== result?.current?.id);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-surface-900 transition-colors duration-300">
      {/* ── Header ──────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 border-b border-gray-200/80 bg-white/90 backdrop-blur-md dark:border-white/[0.06] dark:bg-surface-900/90">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3.5">
          <Link href="/" className="flex items-center gap-2.5 group">
            <img src="/logo.svg" alt="Bakkah Logo" className="h-10 w-10 rounded-full shadow-[0_0_16px_rgba(107,122,40,0.4)] group-hover:shadow-[0_0_24px_rgba(107,122,40,0.55)] transition-all duration-300" />
            <div className="leading-none">
              <p className="font-display text-lg tracking-[0.2em] text-gray-900 leading-none dark:text-white">BAKKAH</p>
              <p className="text-[9px] tracking-[0.12em] text-gray-400 dark:text-white/30">AUTO PREMIUM CARE</p>
            </div>
          </Link>
          <div className="flex items-center gap-2">
            <button onClick={toggle}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition hover:bg-gray-100 dark:border-white/[0.08] dark:text-white/40 dark:hover:bg-white/[0.06]"
              aria-label="Toggle theme">
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            <a href="https://wa.me/971545886999" target="_blank" rel="noopener noreferrer"
              className="hidden sm:flex h-8 items-center gap-1.5 rounded-lg bg-emerald-50 border border-emerald-200 px-3 text-xs font-semibold text-emerald-600 hover:bg-emerald-100 transition-colors dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-400">
              <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
            </a>
            <Link href="/auth/login"
              className="hidden text-xs text-gray-400 hover:text-gray-600 transition dark:text-white/30 dark:hover:text-white/60 sm:block">
              Staff Login
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-6 sm:py-10">
        {/* ── Announcements ─────────────────────────────────── */}
        {visibleAnnouncements.length > 0 && (
          <div className="mb-5 space-y-2">
            {visibleAnnouncements.map(a => (
              <div key={a.id} className={cn("relative flex items-start gap-3 rounded-2xl border px-4 py-3.5 shadow-sm",
                ANNOUNCEMENT_STYLE[a.type] ?? ANNOUNCEMENT_STYLE.info)}>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold">{a.title}</p>
                  <p className="text-xs mt-0.5 opacity-80">{a.content}</p>
                </div>
                <button onClick={() => setDismissedIds(p => new Set([...p, a.id]))}
                  className="shrink-0 opacity-60 hover:opacity-100 transition-opacity mt-0.5">
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* ── Hero ──────────────────────────────────────────── */}
        {!searched && (
          <div className="mb-8 text-center">
            <div className="mb-5 inline-flex h-20 w-20 items-center justify-center rounded-3xl border-2 border-brand/20 bg-gradient-to-br from-brand/15 to-brand/5 shadow-[0_0_40px_rgba(107,122,40,0.12)]">
              <Car className="h-10 w-10 text-brand" />
            </div>
            <h1 className="font-display text-4xl sm:text-5xl tracking-wide text-gray-900 dark:text-white mb-3">
              Track Your Vehicle
            </h1>
            <p className="text-base text-gray-500 dark:text-white/50 max-w-sm mx-auto leading-relaxed">
              Enter your mobile number &amp; plate number to check your vehicle&apos;s service status and history.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <Link href="/invoice"
                className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-600 hover:border-brand/30 hover:text-brand transition-all duration-200 shadow-sm dark:bg-white/[0.04] dark:border-white/10 dark:text-white/60 dark:hover:border-brand/30 dark:hover:text-brand">
                <FileText className="h-4 w-4" /> View Invoice
              </Link>
              <a href="https://wa.me/971545886999" target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-600 hover:bg-emerald-100 transition-all duration-200 shadow-sm dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-400">
                <MessageCircle className="h-4 w-4" /> Contact Us
              </a>
            </div>
          </div>
        )}

        {/* ── Search Form ───────────────────────────────────── */}
        <div className="card-elevated mb-5">
          {/* Mode toggle */}
          <div className="flex rounded-xl border border-gray-200 dark:border-white/[0.08] overflow-hidden mb-4">
            <button
              type="button"
              onClick={() => { setMode("vehicle"); setError(""); }}
              className={cn("flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold transition-colors",
                mode === "vehicle"
                  ? "bg-brand text-black"
                  : "text-gray-500 dark:text-white/40 hover:bg-gray-50 dark:hover:bg-white/[0.04]")}>
              <Phone className="h-3.5 w-3.5" /> Mobile + Plate
            </button>
            <button
              type="button"
              onClick={() => { setMode("job"); setError(""); }}
              className={cn("flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold transition-colors border-l border-gray-200 dark:border-white/[0.08]",
                mode === "job"
                  ? "bg-brand text-black"
                  : "text-gray-500 dark:text-white/40 hover:bg-gray-50 dark:hover:bg-white/[0.04]")}>
              <Hash className="h-3.5 w-3.5" /> Job Number
            </button>
          </div>

          <form onSubmit={handleSearch}>
            {mode === "vehicle" ? (
              <div className="space-y-3">
                <div>
                  <label className="label mb-1.5">Mobile Number</label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-white/30 pointer-events-none" />
                    <input
                      value={mobileQuery}
                      onChange={e => setMobileQuery(e.target.value)}
                      placeholder="+971 50 123 4567 or 050 123 4567"
                      type="tel"
                      inputMode="tel"
                      className="input-base pl-10 w-full"
                      disabled={loading}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="label">Plate Number</label>
                    <span className="text-[10px] text-gray-400 dark:text-white/30 font-medium">optional — filters to one vehicle</span>
                  </div>
                  <div className="relative">
                    <Car className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-white/30 pointer-events-none" />
                    <input
                      value={plateQuery}
                      onChange={e => setPlateQuery(e.target.value.toUpperCase())}
                      placeholder="A 12345 · ABC 1234 · 12345 A"
                      className="input-base pl-10 w-full font-mono uppercase tracking-widest"
                      disabled={loading}
                    />
                  </div>
                </div>
                <button type="submit"
                  disabled={loading || (!mobileQuery.trim() && !plateQuery.trim())}
                  className="btn-primary w-full py-3">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                  {loading ? "Searching..." : mobileQuery.trim() && !plateQuery.trim() ? "View All My Jobs" : "Track My Vehicle"}
                </button>
                <p className="text-xs text-gray-400 dark:text-white/30 text-center leading-relaxed">
                  Phone only → all your jobs · Phone + Plate → one vehicle · Plate only → vehicle history
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="label mb-1.5">Job Card Number</label>
                  <div className="relative">
                    <Hash className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-white/30 pointer-events-none" />
                    <input
                      value={jobQuery}
                      onChange={e => setJobQuery(e.target.value)}
                      placeholder="JC-2024-0001"
                      className="input-base pl-10 w-full font-mono uppercase"
                      disabled={loading}
                    />
                  </div>
                </div>
                <button type="submit"
                  disabled={loading || !jobQuery.trim()}
                  className="btn-primary w-full py-3">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                  {loading ? "Searching..." : "Find Job Card"}
                </button>
                <p className="text-xs text-gray-400 dark:text-white/30 text-center">
                  Your job number starts with <span className="font-mono font-bold text-brand">JC-</span>
                </p>
              </div>
            )}
          </form>
        </div>

        {/* ── Error ─────────────────────────────────────────── */}
        {error && (
          <div className="mb-5 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 dark:border-red-500/20 dark:bg-red-500/10">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
            <p className="text-sm text-red-600 dark:text-red-400 leading-relaxed">{error}</p>
          </div>
        )}

        {/* ── Results ───────────────────────────────────────── */}
        {result && (
          <div className="space-y-4">
            {/* Customer + Vehicle header (vehicle / customer mode) */}
            {(result.mode === "vehicle" || result.mode === "customer") && result.current?.customer && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="card">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-500/15">
                      <User className="h-4 w-4 text-blue-500" />
                    </div>
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white">Customer</h3>
                    {result.current.customer.is_fleet && (
                      <span className="ml-auto text-[10px] font-bold text-brand bg-brand/10 rounded-full px-2 py-0.5">Fleet</span>
                    )}
                  </div>
                  <div className="space-y-1.5 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400 dark:text-white/40">Name</span>
                      <span className="font-semibold text-gray-800 dark:text-white/80">{result.current.customer.name}</span>
                    </div>
                    {result.current.customer.company_name && (
                      <div className="flex justify-between">
                        <span className="text-gray-400 dark:text-white/40">Company</span>
                        <span className="text-gray-600 dark:text-white/60">{result.current.customer.company_name}</span>
                      </div>
                    )}
                  </div>
                </div>
                {result.mode === "vehicle" && (
                  <div className="card">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand/10 dark:bg-brand/15">
                        <Car className="h-4 w-4 text-brand" />
                      </div>
                      <h3 className="text-sm font-bold text-gray-900 dark:text-white">Vehicle</h3>
                    </div>
                    <div className="space-y-1.5 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400 dark:text-white/40">Plate</span>
                        <span className="font-mono font-black text-gray-900 dark:text-white tracking-widest">
                          {result.current.vehicle?.plate_number}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400 dark:text-white/40">Vehicle</span>
                        <span className="text-gray-700 dark:text-white/70 font-medium">
                          {result.current.vehicle?.make} {result.current.vehicle?.model}
                          {result.current.vehicle?.year ? ` ${result.current.vehicle.year}` : ""}
                        </span>
                      </div>
                      {result.current.vehicle?.color && (
                        <div className="flex justify-between">
                          <span className="text-gray-400 dark:text-white/40">Color</span>
                          <span className="text-gray-600 dark:text-white/60">{result.current.vehicle.color}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Summary stats (vehicle / customer mode with history) */}
            {(result.mode === "vehicle" || result.mode === "customer") && result.history.length > 1 && (
              <div className="grid grid-cols-3 gap-3">
                <div className="card text-center py-3">
                  <p className="text-2xl font-black text-brand">{result.history.length}</p>
                  <p className="text-xs text-gray-400 dark:text-white/40 mt-0.5">Total Visits</p>
                </div>
                <div className="card text-center py-3">
                  <p className="text-lg font-black text-brand">
                    {formatAED(result.history.reduce((s, j) => s + (j.total || 0), 0))}
                  </p>
                  <p className="text-xs text-gray-400 dark:text-white/40 mt-0.5">Total Spend</p>
                </div>
                <div className="card text-center py-3">
                  <p className="text-2xl font-black text-emerald-500">
                    {result.history.filter(j => j.status === "delivered").length}
                  </p>
                  <p className="text-xs text-gray-400 dark:text-white/40 mt-0.5">Completed</p>
                </div>
              </div>
            )}

            {/* Current / Active Job */}
            {result.current && (
              <div>
                {(result.mode === "vehicle" || result.mode === "customer") && (
                  <div className="flex items-center gap-2 mb-3">
                    <div className="h-px flex-1 bg-gray-200 dark:bg-white/[0.06]" />
                    <span className="text-xs font-bold text-brand uppercase tracking-wider px-2">
                      {["delivered", "cancelled"].includes(result.current.status) ? "Latest Job" : "Active Job"}
                    </span>
                    <div className="h-px flex-1 bg-gray-200 dark:bg-white/[0.06]" />
                  </div>
                )}
                <JobCardDetail
                  job={result.current}
                  showFull
                  approvalData={result.mode !== "job" && mobileQuery
                    ? { phone: mobileQuery, plate: plateQuery || undefined }
                    : undefined}
                  onApproved={() => {
                    if (mode === "vehicle") runVehicleSearch(mobileQuery, plateQuery);
                    else runJobSearch(jobQuery);
                  }}
                />
              </div>
            )}

            {/* Feedback — delivered jobs only */}
            {showFeedback && (
              <div className="card border-brand/20 dark:border-brand/15">
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-500/15">
                    <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                  </div>
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white">Rate Your Experience</h3>
                </div>
                {fbDone ? (
                  <div className="flex flex-col items-center py-8 text-center">
                    <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 dark:bg-emerald-500/15">
                      <Check className="h-7 w-7 text-emerald-500" />
                    </div>
                    <p className="text-base font-bold text-gray-900 dark:text-white mb-1">Thank You!</p>
                    <p className="text-sm text-gray-500 dark:text-white/40">Your feedback helps us improve.</p>
                  </div>
                ) : (
                  <form onSubmit={handleFeedbackSubmit} className="space-y-4">
                    <div>
                      <label className="label mb-2">Rating</label>
                      <StarPicker value={fbRating} onChange={setFbRating} />
                    </div>
                    <div>
                      <label className="label">Your Name</label>
                      <input value={fbName} onChange={e => setFbName(e.target.value)}
                        className="input-base" placeholder="Mohammed Al Rashid" />
                    </div>
                    <div>
                      <label className="label">Comment (optional)</label>
                      <textarea value={fbComment} onChange={e => setFbComment(e.target.value)}
                        className="input-base min-h-[90px] resize-none" rows={3}
                        placeholder="Share your experience..." />
                    </div>
                    <button type="submit" disabled={fbSubmitting || fbRating === 0} className="btn-primary w-full py-3">
                      {fbSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                      Submit Feedback
                    </button>
                  </form>
                )}
              </div>
            )}

            {/* Vehicle History */}
            {historyJobs.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="h-px flex-1 bg-gray-200 dark:bg-white/[0.06]" />
                  <span className="flex items-center gap-1.5 text-xs font-bold text-gray-400 dark:text-white/30 uppercase tracking-wider px-2">
                    <History className="h-3.5 w-3.5" /> {result.mode === "customer" ? "All Jobs" : "Service History"} ({historyJobs.length})
                  </span>
                  <div className="h-px flex-1 bg-gray-200 dark:bg-white/[0.06]" />
                </div>
                <div className="space-y-3">
                  {historyJobs.map(job => (
                    <HistoryCard key={job.id} job={job} />
                  ))}
                </div>
              </div>
            )}

            {/* Trust badges */}
            <div className="grid grid-cols-3 gap-2 mt-2">
              {[
                { icon: ShieldCheck, label: "UAE VAT Compliant", color: "text-brand" },
                { icon: BadgeCheck, label: "Certified Workshop", color: "text-blue-500" },
                { icon: Star, label: "5-Star Rated", color: "text-amber-500" },
              ].map(({ icon: Icon, label, color }) => (
                <div key={label} className="flex flex-col items-center gap-1.5 rounded-xl border border-gray-100 dark:border-white/[0.06] bg-white dark:bg-surface-800 py-3 px-2">
                  <Icon className={cn("h-4 w-4", color)} />
                  <p className="text-[10px] text-center font-medium text-gray-400 dark:text-white/30 leading-tight">{label}</p>
                </div>
              ))}
            </div>

            <button onClick={reset}
              className="flex w-full items-center justify-center gap-2 text-sm text-gray-400 hover:text-gray-600 transition dark:text-white/30 dark:hover:text-white/60 py-2">
              <ArrowLeft className="h-3.5 w-3.5" /> Search Again
            </button>
          </div>
        )}

        {/* ── Customer Reviews ─────────────────────────────── */}
        {!searched && reviews.length > 0 && (
          <div className="mt-14">
            <div className="flex items-center gap-2 mb-6">
              <Quote className="h-4 w-4 text-brand" />
              <h2 className="text-sm font-black uppercase tracking-widest text-gray-400 dark:text-white/30">
                What Customers Say
              </h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {reviews.slice(0, 6).map(r => (
                <div key={r.id} className="card-hover space-y-3">
                  <StarRow rating={r.rating} />
                  {r.comment && (
                    <p className="text-sm text-gray-600 dark:text-white/60 leading-relaxed line-clamp-3">
                      &ldquo;{r.comment}&rdquo;
                    </p>
                  )}
                  <div className="flex items-center gap-2.5 pt-1">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand/15 text-xs font-black text-brand shrink-0">
                      {r.customer_name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-700 dark:text-white/60">{r.customer_name}</p>
                      <p className="text-[10px] text-gray-400 dark:text-white/25">Verified Customer</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Footer ───────────────────────────────────────── */}
        <div className="mt-12 rounded-2xl border border-gray-100 dark:border-white/[0.06] bg-white dark:bg-surface-800 p-5 text-center space-y-3">
          <div className="flex items-center justify-center gap-2">
            <img src="/logo.svg" alt="Bakkah Logo" className="h-8 w-8 rounded-full shadow-[0_0_12px_rgba(107,122,40,0.3)]" />
            <span className="font-display tracking-[0.2em] text-gray-700 dark:text-white/70 text-sm">BAKKAH</span>
          </div>
          <div className="flex items-center justify-center gap-1.5 text-xs text-gray-400 dark:text-white/25">
            <MapPin className="h-3 w-3" />
            <span>Al Qusais Industrial Area 5, Dubai — UAE</span>
          </div>
          <a href="https://wa.me/971545886999" target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-500 hover:text-emerald-600 transition">
            <MessageCircle className="h-3.5 w-3.5" /> +971 54 588 6999
          </a>
        </div>

        <div className="mt-4 flex items-center justify-center gap-4 text-xs text-gray-400 dark:text-white/25">
          <Link href="/" className="hover:text-gray-600 dark:hover:text-white/50 transition-colors flex items-center gap-1">
            <ChevronRight className="h-3 w-3 rotate-180" /> Home
          </Link>
          <span className="h-3 w-px bg-gray-200 dark:bg-white/10" />
          <Link href="/invoice" className="hover:text-brand transition-colors flex items-center gap-1">
            <FileText className="h-3 w-3" /> View Invoice
          </Link>
          <span className="h-3 w-px bg-gray-200 dark:bg-white/10" />
          <Link href="/auth/login" className="hover:text-gray-600 dark:hover:text-white/50 transition-colors">
            Staff Login
          </Link>
        </div>
      </main>
    </div>
  );
}
