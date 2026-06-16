"use client";

import { useState, useEffect, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Header from "@/components/layout/Header";
import SignaturePad from "@/components/SignaturePad";
import { createJobCard, addPhoto } from "@/lib/queries";
import { createClient } from "@/lib/supabase/client";
import {
  JOB_TYPE_LABEL,
  PHOTO_CATEGORY_LABEL,
  type JobType,
  type PhotoCategory,
} from "@/types";
import {
  ArrowLeft,
  User,
  Car,
  Wrench,
  Camera,
  PenLine,
  Check,
  ChevronRight,
  ChevronLeft,
  Loader2,
  AlertCircle,
  Search,
  X,
  UserCheck,
  ChevronDown,
  Trash2,
  Upload,
  ImageIcon,
  Phone,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils/cn";

// ── Types ────────────────────────────────────────────────────────

type WizardStep =
  | "customer"
  | "vehicle"
  | "workorder"
  | "photos"
  | "signatures";

const STEP_ORDER: WizardStep[] = [
  "customer",
  "vehicle",
  "workorder",
  "photos",
  "signatures",
];

const STEP_META = [
  { id: "customer" as WizardStep, label: "Customer", Icon: User },
  { id: "vehicle" as WizardStep, label: "Vehicle", Icon: Car },
  { id: "workorder" as WizardStep, label: "Work Order", Icon: Wrench },
  { id: "photos" as WizardStep, label: "Photos", Icon: Camera },
  { id: "signatures" as WizardStep, label: "Signatures", Icon: PenLine },
];

type CustomerOption = {
  id: string;
  name: string;
  phone: string;
  email?: string;
  company_name?: string;
  is_fleet: boolean;
};

type VehicleOption = {
  id: string;
  plate_number: string;
  make: string;
  model: string;
  year?: number;
  color?: string;
  vin?: string;
};

type PendingPhoto = { file: File; preview: string; category: PhotoCategory };

// Job types are loaded from the admin-managed /api/job-types endpoint

const PHOTO_CATS: PhotoCategory[] = [
  "exterior_front",
  "exterior_rear",
  "exterior_left",
  "exterior_right",
  "interior",
  "engine_bay",
  "damage",
  "before_work",
  "other",
];

const DRAFT_KEY = "bakkah_new_jobcard_draft";

// ── Phone helpers ────────────────────────────────────────────────

function normalizePhone(raw: string): string {
  const d = raw.replace(/\D/g, "");
  if (!d) return raw;
  if (d.startsWith("971") && d.length === 12) return `+${d}`;
  if (d.startsWith("0") && d.length === 10) return `+971${d.slice(1)}`;
  if (d.length === 9 && /^[2-9]/.test(d)) return `+971${d}`;
  return raw;
}

function phoneError(v: string): string {
  if (!v.trim()) return "Phone is required";
  const d = normalizePhone(v.trim()).replace(/\D/g, "");
  if (!/^971\d{9}$/.test(d)) return "Enter a valid UAE number (05X XXX XXXX)";
  return "";
}

function fmtPhone(raw: string): string {
  const d = normalizePhone(raw.trim()).replace(/\D/g, "");
  if (/^971\d{9}$/.test(d))
    return `+${d.slice(0, 3)} ${d.slice(3, 5)} ${d.slice(5, 8)} ${d.slice(8)}`;
  return raw;
}

// ── Cloudinary helpers ───────────────────────────────────────────

async function uploadFile(
  file: File,
  folder: string,
): Promise<{ url: string; publicId: string }> {
  const sig = await fetch("/api/cloudinary/sign", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ folder }),
  }).then((r) => r.json());

  const fd = new FormData();
  fd.append("file", file);
  fd.append("signature", sig.signature);
  fd.append("timestamp", String(sig.timestamp));
  fd.append("api_key", sig.api_key);
  fd.append("folder", folder);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${sig.cloud_name}/image/upload`,
    {
      method: "POST",
      body: fd,
    },
  ).then((r) => r.json());

  if (!res.secure_url) throw new Error("Upload failed");
  return { url: res.secure_url, publicId: res.public_id };
}

async function uploadDataUrl(dataUrl: string, folder: string): Promise<string> {
  const blob = await fetch(dataUrl).then((r) => r.blob());
  const file = new File([blob], "signature.png", { type: "image/png" });
  return (await uploadFile(file, folder)).url;
}

// ── Field wrapper ────────────────────────────────────────────────

function Field({
  label,
  required,
  error,
  children,
  full,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
  full?: boolean;
}) {
  return (
    <div className={cn(full && "sm:col-span-2")}>
      <label className="label">
        {label}
        {required && <span className="text-brand ml-0.5">*</span>}
      </label>
      {children}
      {error && (
        <p className="mt-1 flex items-center gap-1 text-xs text-red-500">
          <AlertCircle className="h-3 w-3 shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────

export default function NewJobCardPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const today = new Date().toISOString().split("T")[0];

  // Step state
  const [activeStep, setActiveStep] = useState<WizardStep>("customer");
  const [completedSteps, setCompletedSteps] = useState<Set<WizardStep>>(
    new Set(),
  );

  // Customer
  const [allCustomers, setAllCustomers] = useState<CustomerOption[]>([]);
  const [customerSearch, setCustomerSearch] = useState("");
  const [showCustDrop, setShowCustDrop] = useState(false);
  const [selectedCustomer, setSelectedCustomer] =
    useState<CustomerOption | null>(null);
  const custRef = useRef<HTMLDivElement>(null);
  const [cust, setCust] = useState({
    name: "",
    phone: "",
    email: "",
    company: "",
    is_fleet: false,
  });
  const [custErr, setCustErr] = useState<Record<string, string>>({});
  const [phoneTouched, setPhoneTouched] = useState(false);

  // Vehicle
  const [custVehicles, setCustVehicles] = useState<VehicleOption[]>([]);
  const [vehicleSearch, setVehicleSearch] = useState("");
  const [showVehDrop, setShowVehDrop] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleOption | null>(
    null,
  );
  const [vehicleAutoFilled, setVehicleAutoFilled] =
    useState<VehicleOption | null>(null);
  const vehRef = useRef<HTMLDivElement>(null);
  const [veh, setVeh] = useState({
    plate: "",
    make: "",
    model: "",
    year: "",
    color: "",
    mileage: "",
    vin: "",
  });
  const [vehErr, setVehErr] = useState<Record<string, string>>({});

  // Work order
  const [technicians, setTechnicians] = useState<
    { id: string; name: string; role: string }[]
  >([]);
  const [jobTypes, setJobTypes] = useState<{ id: string; name: string }[]>([]);
  const [wo, setWo] = useState({
    job_type: "" as JobType,
    date_in: today,
    date_out: "",
    mileage_in: "",
    complaint: "",
    instructions: "",
    technician_id: "",
  });
  const [woErr, setWoErr] = useState<Record<string, string>>({});

  // Photos
  const [photos, setPhotos] = useState<PendingPhoto[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  // Signatures
  const [custSig, setCustSig] = useState<string | null>(null);
  const [supSig, setSupSig] = useState<string | null>(null);

  // Refs for draft persistence logic
  const isRestoringRef = useRef(false); // true while restoring from localStorage (skip vehicle re-fetch)
  const isFirstSaveRef = useRef(true); // skip saving during the initial render before restore

  // Restore draft from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(DRAFT_KEY);
      if (!saved) return;
      const d = JSON.parse(saved);
      isRestoringRef.current = true;
      if (d.activeStep) setActiveStep(d.activeStep);
      if (d.completedSteps) setCompletedSteps(new Set(d.completedSteps));
      if (d.selectedCustomer !== undefined)
        setSelectedCustomer(d.selectedCustomer);
      if (d.customerSearch !== undefined) setCustomerSearch(d.customerSearch);
      if (d.cust) setCust(d.cust);
      if (d.phoneTouched) setPhoneTouched(d.phoneTouched);
      if (d.custVehicles) setCustVehicles(d.custVehicles);
      if (d.selectedVehicle !== undefined)
        setSelectedVehicle(d.selectedVehicle);
      if (d.vehicleSearch !== undefined) setVehicleSearch(d.vehicleSearch);
      if (d.vehicleAutoFilled !== undefined)
        setVehicleAutoFilled(d.vehicleAutoFilled);
      if (d.veh) setVeh(d.veh);
      if (d.wo) setWo(d.wo);
      if (d.custSig !== undefined) setCustSig(d.custSig);
      if (d.supSig !== undefined) setSupSig(d.supSig);
      // Release the lock after React has flushed state + run dependent effects
      setTimeout(() => {
        isRestoringRef.current = false;
      }, 0);
    } catch {
      /* corrupt/missing draft — ignore */
    }
  }, []);

  // Load data on mount
  useEffect(() => {
    fetch("/api/customers")
      .then((r) => r.json())
      .then((d) => setAllCustomers(d.customers ?? []))
      .catch(() => {});
    fetch("/api/admin/technicians")
      .then((r) => r.json())
      .then((d) => setTechnicians(Array.isArray(d) ? d : (d.technicians ?? [])))
      .catch(() => {});
    fetch("/api/job-types")
      .then((r) => r.json())
      .then((d) => {
        const list: { id: string; name: string }[] = d.job_types ?? [];
        setJobTypes(list);
        setWo((f) => ({
          ...f,
          job_type: f.job_type || (list[0]?.name ?? ""),
        }));
      })
      .catch(() => {});
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (custRef.current && !custRef.current.contains(e.target as Node))
        setShowCustDrop(false);
      if (vehRef.current && !vehRef.current.contains(e.target as Node))
        setShowVehDrop(false);
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  // Load vehicles when customer selected — auto-fill if single vehicle
  useEffect(() => {
    if (isRestoringRef.current) return; // vehicles already restored from draft
    if (!selectedCustomer) {
      setCustVehicles([]);
      setSelectedVehicle(null);
      setVehicleAutoFilled(null);
      return;
    }
    fetch(`/api/customers/${selectedCustomer.id}/vehicles`)
      .then((r) => r.json())
      .then((d) => {
        const list: VehicleOption[] = d.vehicles ?? [];
        setCustVehicles(list);
        if (list.length === 1) {
          fillVehicle(list[0]);
          setVehicleAutoFilled(list[0]);
          // Mark vehicle step complete so the stepper shows a checkmark
          setCompletedSteps((s) => new Set([...s, "vehicle"]));
        } else {
          setVehicleAutoFilled(null);
          setSelectedVehicle(null);
          setVeh({
            plate: "",
            make: "",
            model: "",
            year: "",
            color: "",
            mileage: "",
            vin: "",
          });
        }
      })
      .catch(() => {});
  }, [selectedCustomer]);

  function fillVehicle(v: VehicleOption) {
    setSelectedVehicle(v);
    setVehicleSearch(`${v.plate_number} — ${v.make} ${v.model}`);
    setVeh({
      plate: v.plate_number,
      make: v.make,
      model: v.model,
      year: v.year ? String(v.year) : "",
      color: v.color ?? "",
      mileage: "",
      vin: v.vin ?? "",
    });
  }

  function pickCustomer(c: CustomerOption) {
    setSelectedCustomer(c);
    setCustomerSearch(c.name);
    setCust({
      name: c.name,
      phone: c.phone,
      email: c.email ?? "",
      company: c.company_name ?? "",
      is_fleet: c.is_fleet,
    });
    setShowCustDrop(false);
    setCustErr({});
  }

  function clearCustomer() {
    setSelectedCustomer(null);
    setCustomerSearch("");
    setCust({ name: "", phone: "", email: "", company: "", is_fleet: false });
    setCustVehicles([]);
    setSelectedVehicle(null);
    setVehicleAutoFilled(null);
    setVeh({
      plate: "",
      make: "",
      model: "",
      year: "",
      color: "",
      mileage: "",
      vin: "",
    });
    setCompletedSteps((s) => {
      const n = new Set(s);
      n.delete("vehicle");
      return n;
    });
  }

  const filteredCusts = allCustomers
    .filter((c) => {
      const q = customerSearch.toLowerCase();
      return c.name.toLowerCase().includes(q) || c.phone.includes(q);
    })
    .slice(0, 30);

  const filteredVehs = custVehicles.filter((v) => {
    const q = vehicleSearch.toLowerCase();
    return (
      v.plate_number.toLowerCase().includes(q) ||
      v.make.toLowerCase().includes(q) ||
      v.model.toLowerCase().includes(q)
    );
  });

  // Auto-save draft to localStorage whenever relevant state changes
  useEffect(() => {
    // Skip the very first render — let the restore effect run first
    if (isFirstSaveRef.current) {
      isFirstSaveRef.current = false;
      return;
    }
    try {
      localStorage.setItem(
        DRAFT_KEY,
        JSON.stringify({
          activeStep,
          completedSteps: [...completedSteps],
          selectedCustomer,
          customerSearch,
          cust,
          phoneTouched,
          custVehicles,
          selectedVehicle,
          vehicleSearch,
          vehicleAutoFilled,
          veh,
          wo,
          custSig,
          supSig,
        }),
      );
    } catch {
      /* localStorage quota error — ignore */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    activeStep,
    completedSteps,
    selectedCustomer,
    customerSearch,
    cust,
    phoneTouched,
    custVehicles,
    selectedVehicle,
    vehicleSearch,
    vehicleAutoFilled,
    veh,
    wo,
    custSig,
    supSig,
  ]);

  // ── Validation ─────────────────────────────────────────────────

  function validateCust(): Record<string, string> {
    const e: Record<string, string> = {};
    if (!cust.name.trim() || cust.name.trim().length < 2)
      e.name = "Full name is required";
    const pe = phoneError(cust.phone);
    if (pe) e.phone = pe;
    if (cust.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cust.email))
      e.email = "Enter a valid email";
    return e;
  }

  function validateVeh(): Record<string, string> {
    const e: Record<string, string> = {};
    if (!veh.plate.trim()) e.plate = "Plate number is required";
    if (!veh.make.trim()) e.make = "Make is required";
    if (!veh.model.trim()) e.model = "Model is required";
    if (veh.year) {
      const y = parseInt(veh.year);
      if (isNaN(y) || y < 1990 || y > new Date().getFullYear() + 2)
        e.year = `Year must be 1990–${new Date().getFullYear() + 2}`;
    }
    return e;
  }

  function validateWo(): Record<string, string> {
    const e: Record<string, string> = {};
    if (!wo.date_in) e.date_in = "Check-in date is required";
    if (wo.date_out && wo.date_in && wo.date_out < wo.date_in)
      e.date_out = "Delivery date must be on or after check-in";
    return e;
  }

  // ── Navigation ─────────────────────────────────────────────────

  function next() {
    if (activeStep === "customer") {
      const errs = validateCust();
      setCustErr(errs);
      if (Object.keys(errs).length) {
        toast.error("Fix the highlighted errors");
        return;
      }
      setCust((f) => ({ ...f, phone: normalizePhone(f.phone.trim()) }));
    } else if (activeStep === "vehicle") {
      const errs = validateVeh();
      setVehErr(errs);
      if (Object.keys(errs).length) {
        toast.error("Fix the highlighted errors");
        return;
      }
      setVeh((f) => ({ ...f, plate: f.plate.toUpperCase().trim() }));
    } else if (activeStep === "workorder") {
      const errs = validateWo();
      setWoErr(errs);
      if (Object.keys(errs).length) {
        toast.error("Fix the highlighted errors");
        return;
      }
    }
    setCompletedSteps((s) => new Set([...s, activeStep]));
    const idx = STEP_ORDER.indexOf(activeStep);
    if (idx < STEP_ORDER.length - 1) setActiveStep(STEP_ORDER[idx + 1]);
  }

  function prev() {
    const idx = STEP_ORDER.indexOf(activeStep);
    if (idx > 0) setActiveStep(STEP_ORDER[idx - 1]);
  }

  function goTo(step: WizardStep) {
    setActiveStep(step);
  }

  // ── Photos ─────────────────────────────────────────────────────

  function addFiles(files: FileList | null) {
    if (!files) return;
    const arr = Array.from(files).filter((f) => f.type.startsWith("image/"));
    setPhotos((p) => [
      ...p,
      ...arr.map((file) => ({
        file,
        preview: URL.createObjectURL(file),
        category: "exterior_front" as PhotoCategory,
      })),
    ]);
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    addFiles(e.dataTransfer.files);
  }

  // ── Final submission ───────────────────────────────────────────

  async function handleCreate() {
    const ce = validateCust();
    const ve = validateVeh();
    const we = validateWo();
    if (Object.keys(ce).length) {
      setCustErr(ce);
      setActiveStep("customer");
      toast.error("Fix customer details");
      return;
    }
    if (Object.keys(ve).length) {
      setVehErr(ve);
      setActiveStep("vehicle");
      toast.error("Fix vehicle details");
      return;
    }
    if (Object.keys(we).length) {
      setWoErr(we);
      setActiveStep("workorder");
      toast.error("Fix work order details");
      return;
    }

    startTransition(async () => {
      try {
        const jc = await createJobCard({
          customer_name: cust.name.trim(),
          customer_phone: normalizePhone(cust.phone.trim()),
          customer_email: cust.email || undefined,
          customer_company: cust.company || undefined,
          is_fleet: cust.is_fleet,
          plate_number: veh.plate.toUpperCase().trim(),
          make: veh.make.trim(),
          model: veh.model.trim(),
          year: veh.year ? parseInt(veh.year) : undefined,
          color: veh.color || undefined,
          vin: veh.vin || undefined,
          job_type: wo.job_type,
          date_in: wo.date_in,
          date_out: wo.date_out || undefined,
          mileage_in: veh.mileage
            ? parseInt(veh.mileage)
            : wo.mileage_in
              ? parseInt(wo.mileage_in)
              : undefined,
          customer_complaint: wo.complaint || undefined,
          work_instructions: wo.instructions || undefined,
          technician_id: wo.technician_id || undefined,
        });

        localStorage.removeItem(DRAFT_KEY);
        toast.success(`Job card ${jc.job_number} created — status: Inspection`);
        router.push(`/workshop/job-cards/${jc.id}`);

        // Upload photos + signatures in parallel after navigating
        const photoUploads = photos.map(async (ph) => {
          try {
            const { url, publicId } = await uploadFile(
              ph.file,
              `bakkah/${jc.id}/photos`,
            );
            await addPhoto({
              job_card_id: jc.id,
              cloudinary_url: url,
              cloudinary_id: publicId,
              category: ph.category,
            });
          } catch {
            /* skip failed photo */
          }
        });

        const sb = createClient();
        const sigUploads: Promise<[string, string] | null>[] = [];
        if (custSig) {
          sigUploads.push(
            uploadDataUrl(custSig, `bakkah/${jc.id}/signatures`)
              .then((url) => ["customer_signature_url", url] as [string, string])
              .catch(() => null),
          );
        }
        if (supSig) {
          sigUploads.push(
            uploadDataUrl(supSig, `bakkah/${jc.id}/signatures`)
              .then((url) => ["supervisor_signature_url", url] as [string, string])
              .catch(() => null),
          );
        }

        await Promise.all([...photoUploads, ...sigUploads.map(async (p) => {
          const result = await p;
          if (result) {
            await sb.from("job_cards").update({ [result[0]]: result[1] }).eq("id", jc.id);
          }
        })]);
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "Failed to create job card",
        );
      }
    });
  }

  const stepIdx = STEP_ORDER.indexOf(activeStep);
  const isFirst = stepIdx === 0;
  const isLast = stepIdx === STEP_ORDER.length - 1;

  // ── Select class helper ─────────────────────────────────────────
  const selectCls =
    "input-base appearance-none w-full pr-8 dark:bg-zinc-900 dark:text-white";

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-surface-900">
      <Header title="New Job Card" subtitle="Vehicle check-in wizard" />

      <div className="mx-w-full p-4 lg:p-6">
        {/* Back */}
        <div className="mb-5">
          <Link
            href="/workshop/job-cards"
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 dark:text-white/40 dark:hover:text-white/70 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Job Cards
          </Link>
        </div>

        {/* Step indicator */}
        <div className="mb-6 flex items-center">
          {STEP_META.map((step, i) => {
            const done = completedSteps.has(step.id);
            const active = activeStep === step.id;
            const Icon = step.Icon;
            return (
              <div
                key={step.id}
                className="flex flex-1 items-center last:flex-none"
              >
                <button
                  type="button"
                  onClick={() => goTo(step.id)}
                  className="flex flex-col items-center gap-1"
                >
                  <div
                    className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all",
                      done
                        ? "border-emerald-500 bg-emerald-500 text-white"
                        : active
                          ? "border-brand bg-brand text-black"
                          : "border-gray-200 bg-white text-gray-400 dark:border-white/15 dark:bg-white/5 dark:text-white/30",
                    )}
                  >
                    {done ? (
                      <Check className="h-5 w-5" />
                    ) : (
                      <Icon className="h-4 w-4" />
                    )}
                  </div>
                  <span
                    className={cn(
                      "hidden sm:block text-[10px] font-semibold whitespace-nowrap",
                      done
                        ? "text-emerald-500"
                        : active
                          ? "text-brand"
                          : "text-gray-400 dark:text-white/30",
                    )}
                  >
                    {step.label}
                  </span>
                </button>
                {i < STEP_META.length - 1 && (
                  <div
                    className={cn(
                      "flex-1 h-0.5 mx-2 rounded-full",
                      completedSteps.has(step.id)
                        ? "bg-emerald-500"
                        : "bg-gray-200 dark:bg-white/10",
                    )}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* ── Tab: Customer ── */}
        {activeStep === "customer" && (
          <div className="card space-y-5">
            <div className="flex items-center gap-2.5 border-b border-gray-100 dark:border-white/[0.06] pb-4">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand/15">
                <User className="h-3.5 w-3.5 text-brand" />
              </div>
              <h2 className="section-title">Customer Details</h2>
            </div>

            {/* Customer search combobox */}
            <div ref={custRef} className="relative">
              <label className="label">Search Existing Customer</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-white/30 pointer-events-none" />
                <input
                  value={customerSearch}
                  onChange={(e) => {
                    setCustomerSearch(e.target.value);
                    setShowCustDrop(true);
                  }}
                  onFocus={() => setShowCustDrop(true)}
                  placeholder="Type name or phone to search…"
                  className="input-base w-full pl-9 pr-8"
                />
                {selectedCustomer && (
                  <button
                    type="button"
                    onClick={clearCustomer}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-white/60"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              {showCustDrop && (
                <div className="absolute z-50 mt-1 w-full rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-zinc-900 shadow-xl max-h-64 overflow-y-auto">
                  {filteredCusts.length === 0 ? (
                    <div className="px-4 py-3 text-sm text-gray-400 dark:text-white/40">
                      No customers found — fill details below to create new
                    </div>
                  ) : (
                    filteredCusts.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => pickCustomer(c)}
                        className="w-full flex items-start gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-white/[0.05] text-left transition-colors"
                      >
                        <UserCheck className="h-4 w-4 text-brand mt-0.5 shrink-0" />
                        <div>
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">
                            {c.name}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-white/40">
                            {c.phone}
                            {c.company_name ? ` · ${c.company_name}` : ""}
                          </p>
                        </div>
                        {c.is_fleet && (
                          <span className="ml-auto text-[10px] bg-brand/10 text-brand rounded px-1.5 py-0.5 font-semibold shrink-0">
                            Fleet
                          </span>
                        )}
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>

            {selectedCustomer && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 rounded-lg bg-brand/8 border border-brand/20 px-3 py-2">
                  <UserCheck className="h-4 w-4 text-brand shrink-0" />
                  <span className="text-sm text-brand font-medium">
                    Returning customer — details auto-filled
                  </span>
                </div>
                {vehicleAutoFilled && (
                  <div className="flex items-center gap-2 rounded-lg bg-blue-50 border border-blue-200 dark:bg-blue-500/10 dark:border-blue-500/20 px-3 py-2">
                    <Car className="h-4 w-4 text-blue-500 shrink-0" />
                    <span className="text-sm text-blue-700 dark:text-blue-300 font-medium">
                      Vehicle auto-filled:{" "}
                      <span className="font-mono">
                        {vehicleAutoFilled.plate_number}
                      </span>{" "}
                      — {vehicleAutoFilled.make} {vehicleAutoFilled.model}
                      {vehicleAutoFilled.year
                        ? ` ${vehicleAutoFilled.year}`
                        : ""}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setCompletedSteps((s) => new Set([...s, "customer"]));
                        setActiveStep("workorder");
                      }}
                      className="ml-auto text-xs text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-200 font-medium underline-offset-2 hover:underline whitespace-nowrap"
                    >
                      Skip to Work Order →
                    </button>
                  </div>
                )}
                {custVehicles.length > 1 && (
                  <div className="flex items-center gap-2 rounded-lg bg-amber-50 border border-amber-200 dark:bg-amber-500/10 dark:border-amber-500/20 px-3 py-2">
                    <Car className="h-4 w-4 text-amber-500 shrink-0" />
                    <span className="text-sm text-amber-700 dark:text-amber-300 font-medium">
                      {custVehicles.length} vehicles on record — select one in
                      the Vehicle tab
                    </span>
                  </div>
                )}
              </div>
            )}

            <div className="border-t border-gray-100 dark:border-white/[0.06] pt-4">
              <p className="text-xs font-semibold text-gray-400 dark:text-white/30 uppercase tracking-wider mb-4">
                {selectedCustomer ? "Edit Details" : "New Customer Details"}
              </p>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Full Name" required error={custErr.name}>
                  <input
                    value={cust.name}
                    onChange={(e) =>
                      setCust((f) => ({ ...f, name: e.target.value }))
                    }
                    placeholder="Mohammed Al Rashid"
                    className={cn(
                      "input-base w-full",
                      custErr.name && "border-red-400",
                    )}
                  />
                </Field>

                <div>
                  <label className="label">
                    Phone Number <span className="text-brand">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-white/30 pointer-events-none" />
                    <input
                      value={cust.phone}
                      onChange={(e) =>
                        setCust((f) => ({ ...f, phone: e.target.value }))
                      }
                      onBlur={() => {
                        setPhoneTouched(true);
                        if (!phoneError(cust.phone))
                          setCust((f) => ({ ...f, phone: fmtPhone(f.phone) }));
                      }}
                      placeholder="+971 50 123 4567"
                      type="tel"
                      inputMode="tel"
                      className={cn(
                        "input-base w-full pl-9",
                        phoneTouched && custErr.phone && "border-red-400",
                      )}
                    />
                  </div>
                  {phoneTouched && custErr.phone && (
                    <p className="mt-1 flex items-center gap-1 text-xs text-red-500">
                      <AlertCircle className="h-3 w-3" />
                      {custErr.phone}
                    </p>
                  )}
                  {!phoneTouched && (
                    <p className="mt-1 text-[11px] text-gray-400 dark:text-white/30">
                      Format: 05X XXX XXXX or +971 5X XXX XXXX
                    </p>
                  )}
                </div>

                <Field label="Email Address" error={custErr.email}>
                  <input
                    type="email"
                    value={cust.email}
                    onChange={(e) =>
                      setCust((f) => ({ ...f, email: e.target.value }))
                    }
                    placeholder="customer@email.com"
                    className={cn(
                      "input-base w-full",
                      custErr.email && "border-red-400",
                    )}
                  />
                </Field>

                <Field label="Company / Fleet Account">
                  <input
                    value={cust.company}
                    onChange={(e) =>
                      setCust((f) => ({ ...f, company: e.target.value }))
                    }
                    placeholder="Al Futtaim Logistics LLC"
                    className="input-base w-full"
                  />
                </Field>

                <div className="sm:col-span-2">
                  <label className="flex cursor-pointer items-center gap-2.5 text-sm text-gray-600 dark:text-white/60">
                    <input
                      type="checkbox"
                      checked={cust.is_fleet}
                      onChange={(e) =>
                        setCust((f) => ({ ...f, is_fleet: e.target.checked }))
                      }
                      className="h-4 w-4 accent-brand rounded"
                    />
                    Fleet / Corporate Account (B2B)
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Tab: Vehicle ── */}
        {activeStep === "vehicle" && (
          <div className="card space-y-5">
            <div className="flex items-center gap-2.5 border-b border-gray-100 dark:border-white/[0.06] pb-4">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand/15">
                <Car className="h-3.5 w-3.5 text-brand" />
              </div>
              <h2 className="section-title">Vehicle Details</h2>
              {selectedCustomer && (
                <span className="ml-auto text-xs text-gray-400 dark:text-white/30">
                  Customer:{" "}
                  <span className="font-semibold text-gray-700 dark:text-white/70">
                    {selectedCustomer.name}
                  </span>
                </span>
              )}
            </div>

            {/* Vehicle picker (only if customer has 2+ vehicles) */}
            {custVehicles.length > 1 && (
              <div ref={vehRef} className="relative">
                <label className="label">Select Vehicle</label>
                <div className="relative">
                  <Car className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-white/30 pointer-events-none" />
                  <input
                    value={vehicleSearch}
                    onChange={(e) => {
                      setVehicleSearch(e.target.value);
                      setShowVehDrop(true);
                    }}
                    onFocus={() => setShowVehDrop(true)}
                    placeholder="Search by plate, make or model…"
                    className="input-base w-full pl-9"
                  />
                </div>
                {showVehDrop && (
                  <div className="absolute z-50 mt-1 w-full rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-zinc-900 shadow-xl max-h-52 overflow-y-auto">
                    {filteredVehs.length === 0 ? (
                      <div className="px-4 py-3 text-sm text-gray-400">
                        No matching vehicles
                      </div>
                    ) : (
                      filteredVehs.map((v) => (
                        <button
                          key={v.id}
                          type="button"
                          onClick={() => {
                            fillVehicle(v);
                            setShowVehDrop(false);
                          }}
                          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-white/[0.05] text-left transition-colors"
                        >
                          <Car className="h-4 w-4 text-brand shrink-0" />
                          <div>
                            <p className="text-sm font-semibold text-gray-900 dark:text-white font-mono">
                              {v.plate_number}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-white/40">
                              {v.make} {v.model}
                              {v.year ? ` ${v.year}` : ""}
                              {v.color ? ` · ${v.color}` : ""}
                            </p>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}

            {custVehicles.length === 1 && selectedVehicle && (
              <div className="flex items-center gap-2 rounded-lg bg-blue-50 border border-blue-200 dark:bg-blue-500/10 dark:border-blue-500/20 px-3 py-2">
                <Car className="h-4 w-4 text-blue-500 shrink-0" />
                <span className="text-sm text-blue-700 dark:text-blue-300 font-medium">
                  Auto-filled from previous record — {selectedVehicle.make}{" "}
                  {selectedVehicle.model}
                </span>
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Plate Number" required error={vehErr.plate}>
                <input
                  value={veh.plate}
                  onChange={(e) =>
                    setVeh((f) => ({
                      ...f,
                      plate: e.target.value.toUpperCase(),
                    }))
                  }
                  placeholder="A 12345 or ABC 1234"
                  className={cn(
                    "input-base w-full font-mono uppercase tracking-widest",
                    vehErr.plate && "border-red-400",
                  )}
                />
              </Field>

              <Field label="Color">
                <input
                  value={veh.color}
                  onChange={(e) =>
                    setVeh((f) => ({ ...f, color: e.target.value }))
                  }
                  placeholder="White"
                  className="input-base w-full"
                />
              </Field>

              <Field label="Make" required error={vehErr.make}>
                <input
                  value={veh.make}
                  onChange={(e) =>
                    setVeh((f) => ({ ...f, make: e.target.value }))
                  }
                  placeholder="Toyota"
                  className={cn(
                    "input-base w-full",
                    vehErr.make && "border-red-400",
                  )}
                />
              </Field>

              <Field label="Model" required error={vehErr.model}>
                <input
                  value={veh.model}
                  onChange={(e) =>
                    setVeh((f) => ({ ...f, model: e.target.value }))
                  }
                  placeholder="Land Cruiser"
                  className={cn(
                    "input-base w-full",
                    vehErr.model && "border-red-400",
                  )}
                />
              </Field>

              <Field label="Year" error={vehErr.year}>
                <input
                  type="number"
                  value={veh.year}
                  onChange={(e) =>
                    setVeh((f) => ({ ...f, year: e.target.value }))
                  }
                  placeholder={String(new Date().getFullYear())}
                  min={1990}
                  className={cn(
                    "input-base w-full",
                    vehErr.year && "border-red-400",
                  )}
                />
              </Field>

              <Field label="Mileage In (km)">
                <input
                  type="number"
                  value={veh.mileage}
                  onChange={(e) =>
                    setVeh((f) => ({ ...f, mileage: e.target.value }))
                  }
                  placeholder="45000"
                  min={0}
                  className="input-base w-full"
                />
              </Field>

              <Field label="Chassis / VIN" full>
                <input
                  value={veh.vin}
                  onChange={(e) =>
                    setVeh((f) => ({ ...f, vin: e.target.value.toUpperCase() }))
                  }
                  placeholder="JT3HN87R… (17 chars)"
                  className="input-base w-full font-mono uppercase"
                />
              </Field>
            </div>
          </div>
        )}

        {/* ── Tab: Work Order ── */}
        {activeStep === "workorder" && (
          <div className="card space-y-5">
            <div className="flex items-center gap-2.5 border-b border-gray-100 dark:border-white/[0.06] pb-4">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand/15">
                <Wrench className="h-3.5 w-3.5 text-brand" />
              </div>
              <h2 className="section-title">Work Order</h2>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Job Type">
                <div className="relative">
                  <select
                    value={wo.job_type}
                    onChange={(e) =>
                      setWo((f) => ({
                        ...f,
                        job_type: e.target.value as JobType,
                      }))
                    }
                    className={selectCls}
                  >
                    {jobTypes.map((t) => (
                      <option
                        key={t.id}
                        value={t.name}
                        className="dark:bg-zinc-900 dark:text-white"
                      >
                        {t.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-white/30" />
                </div>
              </Field>

              <Field label="Assign Technician">
                <div className="relative">
                  <select
                    value={wo.technician_id}
                    onChange={(e) =>
                      setWo((f) => ({ ...f, technician_id: e.target.value }))
                    }
                    className={selectCls}
                  >
                    <option
                      value=""
                      className="dark:bg-zinc-900 dark:text-white"
                    >
                      — Unassigned —
                    </option>
                    {technicians.map((t) => (
                      <option
                        key={t.id}
                        value={t.id}
                        className="dark:bg-zinc-900 dark:text-white"
                      >
                        {t.name} ({t.role})
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-white/30" />
                </div>
              </Field>

              <Field label="Date In" required error={woErr.date_in}>
                <input
                  type="date"
                  value={wo.date_in}
                  onChange={(e) =>
                    setWo((f) => ({ ...f, date_in: e.target.value }))
                  }
                  className={cn(
                    "input-base w-full",
                    woErr.date_in && "border-red-400",
                  )}
                />
              </Field>

              <Field label="Expected Delivery" error={woErr.date_out}>
                <input
                  type="date"
                  value={wo.date_out}
                  min={wo.date_in}
                  onChange={(e) =>
                    setWo((f) => ({ ...f, date_out: e.target.value }))
                  }
                  className={cn(
                    "input-base w-full",
                    woErr.date_out && "border-red-400",
                  )}
                />
              </Field>

              <Field label="Customer Complaint / Request" full>
                <textarea
                  value={wo.complaint}
                  onChange={(e) =>
                    setWo((f) => ({ ...f, complaint: e.target.value }))
                  }
                  placeholder="What the customer reports needs attention…"
                  rows={3}
                  className="input-base resize-none w-full"
                />
              </Field>

              <Field label="Work Instructions (internal)" full>
                <textarea
                  value={wo.instructions}
                  onChange={(e) =>
                    setWo((f) => ({ ...f, instructions: e.target.value }))
                  }
                  placeholder="Technical notes for the technician…"
                  rows={2}
                  className="input-base resize-none w-full"
                />
              </Field>
            </div>
          </div>
        )}

        {/* ── Tab: Photos ── */}
        {activeStep === "photos" && (
          <div className="card space-y-5">
            <div className="flex items-center gap-2.5 border-b border-gray-100 dark:border-white/[0.06] pb-4">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand/15">
                <Camera className="h-3.5 w-3.5 text-brand" />
              </div>
              <h2 className="section-title">Vehicle Photos</h2>
              <span className="ml-auto text-xs text-gray-400 dark:text-white/30">
                Optional — can be added later
              </span>
            </div>

            {/* Drop zone */}
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
              className={cn(
                "flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-8 cursor-pointer transition-colors",
                dragging
                  ? "border-brand bg-brand/5"
                  : "border-gray-200 dark:border-white/10 hover:border-brand/40 hover:bg-brand/5",
              )}
            >
              <Upload className="h-8 w-8 text-gray-300 dark:text-white/20" />
              <div className="text-center">
                <p className="text-sm font-medium text-gray-600 dark:text-white/60">
                  Drop photos here or click to select
                </p>
                <p className="text-xs text-gray-400 dark:text-white/30 mt-1">
                  JPEG, PNG, WebP — multiple files allowed
                </p>
              </div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => addFiles(e.target.files)}
            />

            {/* Photo grid */}
            {photos.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {photos.map((ph, i) => (
                  <div
                    key={i}
                    className="group relative rounded-xl overflow-hidden border border-gray-200 dark:border-white/10"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={ph.preview}
                      alt=""
                      className="w-full aspect-video object-cover"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setPhotos((p) => p.filter((_, j) => j !== i))
                      }
                      className="absolute top-2 right-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                    <div className="p-2">
                      <select
                        value={ph.category}
                        onChange={(e) => {
                          const cat = e.target.value as PhotoCategory;
                          setPhotos((p) =>
                            p.map((x, j) =>
                              j === i ? { ...x, category: cat } : x,
                            ),
                          );
                        }}
                        className="w-full text-xs rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-zinc-900 dark:text-white px-2 py-1"
                      >
                        {PHOTO_CATS.map((c) => (
                          <option
                            key={c}
                            value={c}
                            className="dark:bg-zinc-900 dark:text-white"
                          >
                            {PHOTO_CATEGORY_LABEL[c]}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {photos.length === 0 && (
              <p className="text-center text-sm text-gray-400 dark:text-white/30">
                No photos selected — you can add photos after the job card is
                created too
              </p>
            )}
          </div>
        )}

        {/* ── Tab: Signatures ── */}
        {activeStep === "signatures" && (
          <div className="card space-y-6">
            <div className="flex items-center gap-2.5 border-b border-gray-100 dark:border-white/[0.06] pb-4">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand/15">
                <PenLine className="h-3.5 w-3.5 text-brand" />
              </div>
              <h2 className="section-title">Signatures</h2>
              <span className="ml-auto text-xs text-gray-400 dark:text-white/30">
                Optional — form saves without signatures
              </span>
            </div>

            <div className="rounded-xl border border-gray-100 dark:border-white/[0.06] bg-gray-50 dark:bg-white/[0.03] p-4 text-sm text-gray-600 dark:text-white/50 space-y-1">
              <p className="font-semibold text-gray-700 dark:text-white/70">
                Summary
              </p>
              <p>
                Customer:{" "}
                <span className="font-medium text-gray-900 dark:text-white">
                  {cust.name}
                </span>
              </p>
              <p>
                Vehicle:{" "}
                <span className="font-medium text-gray-900 dark:text-white">
                  {veh.plate} — {veh.make} {veh.model}
                </span>
              </p>
              <p>
                Job Type:{" "}
                <span className="font-medium text-gray-900 dark:text-white">
                  {JOB_TYPE_LABEL[wo.job_type]}
                </span>
              </p>
              {photos.length > 0 && (
                <p>
                  Photos:{" "}
                  <span className="font-medium text-gray-900 dark:text-white">
                    {photos.length} selected
                  </span>
                </p>
              )}
            </div>

            <SignaturePad
              label="Customer Signature"
              onSave={setCustSig}
              savedDataUrl={custSig}
            />

            <SignaturePad
              label="Supervisor / Advisor Signature"
              onSave={setSupSig}
              savedDataUrl={supSig}
            />
          </div>
        )}

        {/* Navigation */}
        <div className="mt-6 flex items-center justify-between border-t border-gray-200 dark:border-white/[0.06] pt-5">
          <button
            type="button"
            onClick={prev}
            disabled={isFirst}
            className={cn(
              "flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
              isFirst
                ? "text-gray-300 dark:text-white/20 cursor-not-allowed"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-white/50 dark:hover:text-white dark:hover:bg-white/[0.05]",
            )}
          >
            <ChevronLeft className="h-4 w-4" /> Previous
          </button>

          <div className="flex items-center gap-3">
            {/* Skip for optional steps */}
            {(activeStep === "photos" || activeStep === "signatures") &&
              !isLast && (
                <button
                  type="button"
                  onClick={() => {
                    setCompletedSteps((s) => new Set([...s, activeStep]));
                    const idx = STEP_ORDER.indexOf(activeStep);
                    setActiveStep(STEP_ORDER[idx + 1]);
                  }}
                  className="text-sm text-gray-400 hover:text-gray-600 dark:hover:text-white/60 transition-colors"
                >
                  Skip
                </button>
              )}

            {isLast ? (
              <button
                type="button"
                onClick={handleCreate}
                disabled={isPending}
                className="btn-primary px-6 gap-2"
              >
                {isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Creating…
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4" /> Create Job Card
                  </>
                )}
              </button>
            ) : (
              <button
                type="button"
                onClick={next}
                className="btn-primary px-5 gap-2"
              >
                Save &amp; Continue <ChevronRight className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
