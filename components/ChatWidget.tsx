"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, ChevronRight, CheckCircle, Loader2, RotateCcw } from "lucide-react";

// ── Types ────────────────────────────────────────────────────────

type Step =
  | "idle"
  | "name"
  | "phone"
  | "plate"
  | "make_model"
  | "service"
  | "remarks"
  | "confirm"
  | "submitting"
  | "done";

type FormData = {
  name: string;
  phone: string;
  plate: string;
  make: string;
  model: string;
  service_type: string;
  remarks: string;
};

type Message = {
  id: number;
  from: "bot" | "user";
  text: string;
};

// ── Service options ──────────────────────────────────────────────

const SERVICES = [
  { label: "✨ Full Detail / Polish", value: "Full Detail Package" },
  { label: "🛡️ Ceramic Coating", value: "Ceramic Coating" },
  { label: "⚡ Paint Correction", value: "Paint Correction" },
  { label: "🫧 Interior Detailing", value: "Interior Detailing" },
  { label: "🔧 General Service / Repair", value: "General Service" },
  { label: "📋 RTA Inspection Prep", value: "RTA Inspection" },
  { label: "💬 Other / Not Sure", value: "Other" },
];

// ── Animated car SVG icon ────────────────────────────────────────

function CarIcon({ size = 28 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect x="8" y="26" width="48" height="20" rx="5" fill="#C9A227" />
      <path
        d="M14 26L20 14H44L50 26"
        stroke="#C9A227"
        strokeWidth="2"
        fill="#d4b22e"
      />
      <rect x="14" y="26" width="36" height="16" rx="3" fill="#d4b22e" />
      <rect x="18" y="18" width="12" height="10" rx="2" fill="#050507" opacity="0.6" />
      <rect x="34" y="18" width="12" height="10" rx="2" fill="#050507" opacity="0.6" />
      <circle cx="19" cy="46" r="6" fill="#1a1a1a" />
      <circle cx="19" cy="46" r="3" fill="#444" />
      <circle cx="45" cy="46" r="6" fill="#1a1a1a" />
      <circle cx="45" cy="46" r="3" fill="#444" />
      <rect x="6" y="32" width="6" height="4" rx="2" fill="#f0d060" />
      <rect x="52" y="32" width="6" height="4" rx="2" fill="#ff6b6b" opacity="0.8" />
    </svg>
  );
}

// ── Floating trigger button ──────────────────────────────────────

function TriggerButton({ onClick, hasNew }: { onClick: () => void; hasNew: boolean }) {
  return (
    <motion.button
      onClick={onClick}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: 2.2, type: "spring", stiffness: 260, damping: 20 }}
      whileHover={{ scale: 1.06 }}
      whileTap={{ scale: 0.94 }}
      className="fixed bottom-6 left-6 z-50 hidden sm:flex flex-col items-center gap-1 group"
      aria-label="Open chat"
    >
      <motion.div
        animate={{ y: [0, -5, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        className="relative flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-[#C9A227] to-[#d4b22e] shadow-[0_8px_32px_rgba(201,162,39,0.55)] hover:shadow-[0_8px_40px_rgba(201,162,39,0.7)] transition-shadow duration-300"
      >
        <CarIcon size={30} />
        {hasNew && (
          <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white animate-pulse">
            1
          </span>
        )}
      </motion.div>
      <motion.span
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 3 }}
        className="rounded-full bg-black/80 px-2.5 py-0.5 text-[10px] font-bold text-white backdrop-blur-sm whitespace-nowrap"
      >
        Quick Request
      </motion.span>
    </motion.button>
  );
}

// ── Bot message bubble ───────────────────────────────────────────

function BotBubble({ text }: { text: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -12, scale: 0.97 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      transition={{ duration: 0.22 }}
      className="flex items-end gap-2 max-w-[85%]"
    >
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#C9A227] to-[#d4b22e] shadow-sm mb-0.5">
        <CarIcon size={16} />
      </div>
      <div className="rounded-2xl rounded-bl-sm bg-gray-100 dark:bg-white/[0.08] px-4 py-2.5 text-sm text-gray-800 dark:text-white/90 leading-relaxed">
        {text}
      </div>
    </motion.div>
  );
}

// ── User message bubble ──────────────────────────────────────────

function UserBubble({ text }: { text: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 12, scale: 0.97 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      transition={{ duration: 0.22 }}
      className="flex justify-end max-w-[85%] ml-auto"
    >
      <div className="rounded-2xl rounded-br-sm bg-gradient-to-br from-[#C9A227] to-[#d4b22e] px-4 py-2.5 text-sm font-medium text-black leading-relaxed">
        {text}
      </div>
    </motion.div>
  );
}

// ── Main widget ──────────────────────────────────────────────────

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("idle");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [input2, setInput2] = useState("");
  const [form, setForm] = useState<FormData>({
    name: "", phone: "", plate: "", make: "", model: "", service_type: "", remarks: "",
  });
  const [jobNumber, setJobNumber] = useState("");
  const [error, setError] = useState("");
  const msgIdRef = useRef(0);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const nextId = () => ++msgIdRef.current;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (open && step === "idle") {
      startChat();
    }
  }, [open]); // eslint-disable-line

  useEffect(() => {
    if (open && inputRef.current && !["idle", "service", "confirm", "submitting", "done"].includes(step)) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [step, open]);

  function addBot(text: string) {
    setMessages((m) => [...m, { id: nextId(), from: "bot", text }]);
  }

  function addUser(text: string) {
    setMessages((m) => [...m, { id: nextId(), from: "user", text }]);
  }

  function startChat() {
    setMessages([]);
    setForm({ name: "", phone: "", plate: "", make: "", model: "", service_type: "", remarks: "" });
    setInput("");
    setInput2("");
    setError("");
    setTimeout(() => {
      addBot("👋 Hi! Welcome to Bakkah Premium Auto Care.");
      setTimeout(() => {
        addBot("I'll help you raise a quick service request. It takes less than 2 minutes!");
        setStep("name");
        setTimeout(() => addBot("What's your full name? 😊"), 600);
      }, 500);
    }, 300);
  }

  function handleNameSubmit() {
    const val = input.trim();
    if (val.length < 2) { setError("Please enter your full name."); return; }
    setError("");
    addUser(val);
    setForm((f) => ({ ...f, name: val }));
    setInput("");
    setStep("phone");
    setTimeout(() => addBot(`Nice to meet you, ${val.split(" ")[0]}! 🤝\nWhat's your WhatsApp number?`), 400);
  }

  function handlePhoneSubmit() {
    const val = input.trim();
    const digits = val.replace(/\D/g, "");
    if (digits.length < 9) { setError("Please enter a valid UAE phone number."); return; }
    setError("");
    addUser(val);
    setForm((f) => ({ ...f, phone: val }));
    setInput("");
    setStep("plate");
    setTimeout(() => addBot("What's your vehicle plate number?\n(e.g. ABC 1234 — skip by typing \"skip\")"), 400);
  }

  function handlePlateSubmit() {
    const val = input.trim();
    setError("");
    addUser(val.toLowerCase() === "skip" ? "Skip" : val.toUpperCase());
    setForm((f) => ({ ...f, plate: val.toLowerCase() === "skip" ? "" : val }));
    setInput("");
    setStep("make_model");
    setTimeout(() =>
      addBot("What's the make and model of your vehicle?\n(e.g. Toyota, Land Cruiser — type \"skip\" to skip)"),
      400
    );
  }

  function handleMakeModelSubmit() {
    const makeVal = input.trim();
    const modelVal = input2.trim();
    if (!makeVal && !modelVal) {
      setError("Please enter at least the make, or type \"skip\".");
      return;
    }
    setError("");
    const display = makeVal && modelVal ? `${makeVal} ${modelVal}` : makeVal || modelVal || "Skipped";
    if (display.toLowerCase() === "skip") {
      addUser("Skip");
      setForm((f) => ({ ...f, make: "", model: "" }));
    } else {
      addUser(display);
      setForm((f) => ({ ...f, make: makeVal, model: modelVal }));
    }
    setInput("");
    setInput2("");
    setStep("service");
    setTimeout(() => addBot("What type of service do you need? 🔧"), 400);
  }

  function handleServiceSelect(service: string) {
    addUser(service);
    setForm((f) => ({ ...f, service_type: service }));
    setStep("remarks");
    setTimeout(() => addBot("Any specific concerns, damage, or additional remarks?\n(Type \"none\" to skip)"), 400);
  }

  function handleRemarksSubmit() {
    const val = input.trim();
    setError("");
    const remarks = val.toLowerCase() === "none" || !val ? "" : val;
    addUser(val || "No remarks");
    setForm((f) => ({ ...f, remarks }));
    setInput("");
    setStep("confirm");
    setTimeout(() => addBot("Great! Here's your request summary — please confirm:"), 400);
  }

  async function handleConfirm() {
    setStep("submitting");
    try {
      const res = await fetch("/api/chat-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          phone: form.phone,
          plate: form.plate || undefined,
          make: form.make || undefined,
          model: form.model || undefined,
          service_type: form.service_type,
          remarks: form.remarks || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Request failed");
      setJobNumber(data.job_number ?? "");
      setStep("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setStep("confirm");
    }
  }

  function reset() {
    setStep("idle");
    setMessages([]);
    setInput("");
    setInput2("");
    setForm({ name: "", phone: "", plate: "", make: "", model: "", service_type: "", remarks: "" });
    setError("");
    setJobNumber("");
    startChat();
  }

  const inputSteps: Step[] = ["name", "phone", "plate", "remarks"];
  const showInput = inputSteps.includes(step);

  const placeholder =
    step === "name" ? "Your full name…" :
    step === "phone" ? "05X XXX XXXX" :
    step === "plate" ? "ABC 1234 or skip" :
    step === "remarks" ? "Any details… or type none" : "";

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function handleSend() {
    if (step === "name") handleNameSubmit();
    else if (step === "phone") handlePhoneSubmit();
    else if (step === "plate") handlePlateSubmit();
    else if (step === "remarks") handleRemarksSubmit();
  }

  return (
    <>
      {/* Trigger button */}
      {!open && <TriggerButton onClick={() => setOpen(true)} hasNew={false} />}

      {/* Chat panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.96 }}
            transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
            className="fixed bottom-4 left-4 z-50 hidden sm:flex flex-col w-[360px] max-h-[580px] rounded-2xl border border-gray-200 dark:border-white/[0.1] bg-white dark:bg-[#111113] shadow-[0_24px_80px_rgba(0,0,0,0.2)] overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center gap-3 bg-gradient-to-r from-[#C9A227] to-[#d4b22e] px-4 py-3.5">
              <motion.div
                animate={{ rotate: [0, -8, 8, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              >
                <CarIcon size={28} />
              </motion.div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-black leading-tight">Bakkah Auto Care</p>
                <p className="text-[11px] text-black/70">Quick Service Request • Reply in 2 min</p>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="flex h-7 w-7 items-center justify-center rounded-full bg-black/10 hover:bg-black/20 transition-colors"
                aria-label="Close chat"
              >
                <X className="h-4 w-4 text-black" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 min-h-0">
              {messages.map((msg) =>
                msg.from === "bot"
                  ? <BotBubble key={msg.id} text={msg.text} />
                  : <UserBubble key={msg.id} text={msg.text} />
              )}

              {/* Make/Model step */}
              {step === "make_model" && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-2"
                >
                  <input
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Make (e.g. Toyota)"
                    className="w-full rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/[0.05] px-3 py-2.5 text-sm text-gray-800 dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/30 outline-none focus:border-[#C9A227]/60 transition-colors"
                  />
                  <input
                    value={input2}
                    onChange={(e) => setInput2(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") handleMakeModelSubmit(); }}
                    placeholder="Model (e.g. Land Cruiser)"
                    className="w-full rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/[0.05] px-3 py-2.5 text-sm text-gray-800 dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/30 outline-none focus:border-[#C9A227]/60 transition-colors"
                  />
                  <button
                    onClick={handleMakeModelSubmit}
                    className="w-full rounded-xl bg-gradient-to-r from-[#C9A227] to-[#d4b22e] py-2.5 text-sm font-bold text-black hover:opacity-90 transition-opacity"
                  >
                    Continue <ChevronRight className="inline h-4 w-4" />
                  </button>
                </motion.div>
              )}

              {/* Service selection */}
              {step === "service" && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="grid grid-cols-1 gap-1.5"
                >
                  {SERVICES.map((s) => (
                    <button
                      key={s.value}
                      onClick={() => handleServiceSelect(s.value)}
                      className="w-full rounded-xl border border-gray-200 dark:border-white/[0.08] bg-gray-50 dark:bg-white/[0.04] px-3.5 py-2.5 text-left text-sm font-medium text-gray-700 dark:text-white/80 hover:border-[#C9A227]/50 hover:bg-[#C9A227]/[0.06] hover:text-[#C9A227] transition-all duration-150"
                    >
                      {s.label}
                    </button>
                  ))}
                </motion.div>
              )}

              {/* Confirmation card */}
              {step === "confirm" && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-2xl border border-[#C9A227]/30 bg-[#C9A227]/[0.06] p-4 space-y-2"
                >
                  {[
                    { label: "Name", value: form.name },
                    { label: "Phone", value: form.phone },
                    { label: "Plate", value: form.plate || "—" },
                    { label: "Vehicle", value: form.make && form.model ? `${form.make} ${form.model}` : form.make || "—" },
                    { label: "Service", value: form.service_type },
                    { label: "Remarks", value: form.remarks || "—" },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex gap-2 text-sm">
                      <span className="w-16 shrink-0 text-[#C9A227] font-semibold">{label}</span>
                      <span className="text-gray-700 dark:text-white/80 break-words">{value}</span>
                    </div>
                  ))}
                  {error && (
                    <p className="text-xs text-red-500 mt-1">{error}</p>
                  )}
                  <button
                    onClick={handleConfirm}
                    className="mt-2 w-full rounded-xl bg-gradient-to-r from-[#C9A227] to-[#d4b22e] py-2.5 text-sm font-bold text-black hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                  >
                    <CheckCircle className="h-4 w-4" /> Confirm Request
                  </button>
                  <button
                    onClick={reset}
                    className="w-full text-xs text-gray-400 dark:text-white/30 hover:text-gray-600 dark:hover:text-white/50 transition-colors"
                  >
                    Start over
                  </button>
                </motion.div>
              )}

              {/* Submitting */}
              {step === "submitting" && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center gap-3 py-4"
                >
                  <Loader2 className="h-8 w-8 animate-spin text-[#C9A227]" />
                  <p className="text-sm text-gray-500 dark:text-white/40">Submitting your request…</p>
                </motion.div>
              )}

              {/* Done */}
              {step === "done" && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="rounded-2xl border border-emerald-400/30 bg-emerald-50 dark:bg-emerald-500/10 p-5 text-center space-y-3"
                >
                  <div className="flex justify-center">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/15">
                      <CheckCircle className="h-8 w-8 text-emerald-500" />
                    </div>
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 dark:text-white text-base">Request Submitted!</p>
                    {jobNumber && (
                      <p className="mt-1 text-sm text-gray-500 dark:text-white/50">
                        Reference: <span className="font-mono font-bold text-[#C9A227]">{jobNumber}</span>
                      </p>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-white/40 leading-relaxed">
                    Our team will contact you shortly on WhatsApp to confirm your booking. 🚗
                  </p>
                  <button
                    onClick={reset}
                    className="inline-flex items-center gap-1.5 text-xs text-gray-400 dark:text-white/30 hover:text-[#C9A227] transition-colors"
                  >
                    <RotateCcw className="h-3.5 w-3.5" /> New Request
                  </button>
                </motion.div>
              )}

              <div ref={bottomRef} />
            </div>

            {/* Input area */}
            {showInput && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="border-t border-gray-100 dark:border-white/[0.06] px-3 py-3 flex gap-2 items-center"
              >
                <div className="flex-1">
                  <input
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder}
                    className="w-full rounded-xl border border-gray-200 dark:border-white/[0.08] bg-gray-50 dark:bg-white/[0.04] px-3.5 py-2.5 text-sm text-gray-800 dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/30 outline-none focus:border-[#C9A227]/60 transition-colors"
                  />
                  {error && <p className="mt-1 text-[11px] text-red-500">{error}</p>}
                </div>
                <button
                  onClick={handleSend}
                  disabled={!input.trim()}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#C9A227] to-[#d4b22e] shadow-[0_4px_16px_rgba(201,162,39,0.4)] hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
                  aria-label="Send"
                >
                  <Send className="h-4 w-4 text-black" />
                </button>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
