"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useTheme } from "@/components/ThemeProvider";
import {
  Search,
  Loader2,
  Car,
  FileText,
  Sun,
  Moon,
  MessageCircle,
  ArrowLeft,
  Check,
  Camera,
  CreditCard,
  Hash,
} from "lucide-react";

export default function InvoiceLookupPage() {
  const router = useRouter();
  const { theme, toggle } = useTheme();
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const jobParam = new URLSearchParams(window.location.search).get("job");
    if (jobParam) setQuery(jobParam);
  }, []);

  async function handleSearch(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    setLoading(true);
    setError("");
    try {
      const sb = createClient();
      const isJobNumber = q.toUpperCase().startsWith("JC-");
      if (isJobNumber) {
        const { data, error: err } = await sb
          .from("job_cards")
          .select("id")
          .ilike("job_number", q)
          .limit(1)
          .single();
        if (err || !data) {
          setError(
            "No invoice found for that job number. Please check and try again.",
          );
          return;
        }
        router.push(`/invoice/${data.id}`);
      } else {
        const { data: customers } = await sb
          .from("customers")
          .select("id")
          .ilike("phone", `%${q.replace(/\s+/g, "")}%`)
          .limit(5);
        if (!customers || customers.length === 0) {
          setError("No records found for that phone number.");
          return;
        }
        const ids = customers.map((c: { id: string }) => c.id);
        const { data: job, error: jobErr } = await sb
          .from("job_cards")
          .select("id")
          .in("customer_id", ids)
          .order("created_at", { ascending: false })
          .limit(1)
          .single();
        if (jobErr || !job) {
          setError("No invoice found for that phone number.");
          return;
        }
        router.push(`/invoice/${job.id}`);
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const WHATS_INSIDE = [
    { icon: FileText, label: "Itemised services & parts" },
    { icon: CreditCard, label: "Total with VAT breakdown (5%)" },
    { icon: Camera, label: "Before & after vehicle photos" },
    { icon: Check, label: "Payment status & method" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-surface-900 transition-colors duration-300">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-gray-200/80 bg-white/90 backdrop-blur-md dark:border-white/[0.06] dark:bg-surface-900/90">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3.5">
          <Link href="/" className="flex items-center gap-2.5 group">
            <img src="/logo.svg" alt="Bakkah Logo" className="h-10 w-10 rounded-full shadow-[0_0_16px_rgba(107,122,40,0.4)] group-hover:shadow-[0_0_24px_rgba(107,122,40,0.55)] transition-all duration-300" />
            <div className="leading-none">
              <p className="font-display text-lg tracking-[0.2em] text-gray-900 leading-none dark:text-white">
                BAKKAH
              </p>
              <p className="text-[9px] tracking-[0.12em] text-gray-400 dark:text-white/30">
                AUTO PREMIUM CARE
              </p>
            </div>
          </Link>
          <div className="flex items-center gap-2">
            <button
              onClick={toggle}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition hover:bg-gray-100 dark:border-white/[0.08] dark:text-white/40 dark:hover:bg-white/[0.06]"
              aria-label="Toggle theme"
            >
              {theme === "dark" ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </button>
            <a
              href="https://wa.me/971545886999"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:flex h-8 items-center gap-1.5 rounded-lg bg-emerald-50 border border-emerald-200 px-3 text-xs font-semibold text-emerald-600 hover:bg-emerald-100 transition-colors dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-400 dark:hover:bg-emerald-500/15"
            >
              <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
            </a>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-8 sm:py-12">
        {/* Hero */}
        <div className="mb-8 text-center">
          <div className="mb-5 inline-flex h-20 w-20 items-center justify-center rounded-3xl border-2 border-brand/20 bg-gradient-to-br from-brand/15 to-brand/5 shadow-[0_0_40px_rgba(107,122,40,0.12)]">
            <FileText className="h-10 w-10 text-brand" />
          </div>
          <h1 className="font-display text-4xl sm:text-5xl tracking-wide text-gray-900 dark:text-white mb-3">
            View Your Invoice
          </h1>
          <p className="text-base text-gray-500 dark:text-white/50 max-w-sm mx-auto leading-relaxed">
            Enter your job number or phone number to instantly access your full
            service invoice.
          </p>
        </div>

        {/* Search form */}
        <div className="card-elevated mb-6">
          <p className="text-sm font-semibold text-gray-700 dark:text-white/70 mb-3">
            Find your invoice
          </p>
          <form onSubmit={handleSearch}>
            <div className="flex gap-2.5">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-white/30 pointer-events-none" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="e.g. JC-2026-0001 or +971 50 000 0000"
                  className="input-base pl-10"
                  disabled={loading}
                  autoFocus
                />
              </div>
              <button
                type="submit"
                disabled={loading || !query.trim()}
                className="btn-primary px-5 shrink-0"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Find"
                )}
              </button>
            </div>
            <p className="mt-2.5 text-xs text-gray-400 dark:text-white/30">
              Use your{" "}
              <span className="font-mono font-bold text-brand">
                JC-XXXX-XXXX
              </span>{" "}
              job number or the phone number used at booking.
            </p>
          </form>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-5 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 dark:border-red-500/20 dark:bg-red-500/10">
            <div className="mt-0.5 h-5 w-5 shrink-0 rounded-full bg-red-100 dark:bg-red-500/20 flex items-center justify-center">
              <span className="text-red-600 dark:text-red-400 text-xs font-bold">
                !
              </span>
            </div>
            <p className="text-sm text-red-600 dark:text-red-400 leading-relaxed">
              {error}
            </p>
          </div>
        )}

        {/* What's inside */}
        <div className="card mb-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand/10">
              <FileText className="h-4 w-4 text-brand" />
            </div>
            <h2 className="text-sm font-bold text-gray-900 dark:text-white">
              What&apos;s in your invoice?
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {WHATS_INSIDE.map(({ icon: Icon, label }) => (
              <div
                key={label}
                className="flex items-center gap-2.5 rounded-xl border border-gray-100 dark:border-white/[0.05] bg-gray-50/70 dark:bg-white/[0.02] px-3.5 py-2.5"
              >
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-brand/10">
                  <Icon className="h-3.5 w-3.5 text-brand" />
                </div>
                <span className="text-sm text-gray-600 dark:text-white/60">
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* How it works */}
        <div className="card mb-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-500/15">
              <Hash className="h-4 w-4 text-blue-500" />
            </div>
            <h2 className="text-sm font-bold text-gray-900 dark:text-white">
              How to find your job number
            </h2>
          </div>
          <ol className="space-y-3">
            {[
              {
                step: 1,
                text: "Check the SMS or WhatsApp message you received when your vehicle was booked in.",
              },
              {
                step: 2,
                text: "It starts with JC- followed by the year and a number, e.g. JC-2026-0042.",
              },
              {
                step: 3,
                text: "You can also use the mobile number you gave us at reception.",
              },
            ].map(({ step, text }) => (
              <li
                key={step}
                className="flex items-start gap-3 text-sm text-gray-500 dark:text-white/50"
              >
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand/10 text-[10px] font-black text-brand mt-0.5">
                  {step}
                </span>
                <span className="leading-relaxed">{text}</span>
              </li>
            ))}
          </ol>
        </div>

        {/* CTA to track page */}
        <div className="rounded-2xl border border-gray-200 dark:border-white/[0.07] bg-white dark:bg-surface-800 p-5 mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand/10">
              <Car className="h-5 w-5 text-brand" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900 dark:text-white">
                Track your vehicle status
              </p>
              <p className="text-xs text-gray-500 dark:text-white/40 mt-0.5">
                See real-time service progress for your car
              </p>
            </div>
          </div>
          <Link href="/track" className="btn-ghost text-xs shrink-0">
            Track Vehicle →
          </Link>
        </div>

        {/* Back */}
        <div className="text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-gray-600 dark:text-white/30 dark:hover:text-white/60 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Home
          </Link>
        </div>

        {/* Footer contact */}
        <div className="mt-10 rounded-2xl border border-gray-100 dark:border-white/[0.06] bg-white dark:bg-surface-800 p-4 text-center space-y-2 shadow-sm">
          <p className="text-xs text-gray-400 dark:text-white/30">
            Need help? We&apos;re available 7 days a week
          </p>
          <a
            href="https://wa.me/971545886999"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-500 hover:text-emerald-600 transition"
          >
            <MessageCircle className="h-4 w-4" /> Chat on WhatsApp
          </a>
        </div>
      </main>
    </div>
  );
}
