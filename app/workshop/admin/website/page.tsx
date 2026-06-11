"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import Header from "@/components/layout/Header";
import { useCloudinaryUpload } from "@/lib/hooks/use-cloudinary";
import {
  Globe,
  ImageIcon,
  Loader2,
  Upload,
  Trash2,
  Check,
  ChevronDown,
  ChevronUp,
  Star,
  Layout,
  GalleryHorizontal,
  Layers,
  Film,
  Info,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils/cn";

// ── Types ─────────────────────────────────────────────────────────

type CloudImg = { url: string; public_id: string };

type SiteContent = {
  hero?: { images: CloudImg[] };
  services?: Record<string, CloudImg>;
  gallery?: { images: Array<CloudImg & { alt: string; wide: boolean }> };
  before_after?: { images: Array<CloudImg & { type: "before" | "after" }> };
  strip?: { images: CloudImg[] };
};

const SERVICE_KEYS = [
  "fullDetail",
  "ceramic",
  "paintCorrection",
  "interior",
  "rta",
  "fleet",
] as const;
const SERVICE_LABELS: Record<string, string> = {
  fullDetail: "Full Detail",
  ceramic: "Ceramic Coating",
  paintCorrection: "Paint Correction",
  interior: "Interior Detail",
  rta: "RTA Inspection",
  fleet: "Fleet Service",
};

// ── Section wrapper ───────────────────────────────────────────────

function Section({
  icon: Icon,
  title,
  description,
  children,
  defaultOpen = true,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="card overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between p-5 text-left"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-brand/20 bg-brand/10">
            <Icon className="h-4 w-4 text-brand" />
          </div>
          <div>
            <p className="font-semibold text-gray-900 dark:text-white text-sm">
              {title}
            </p>
            <p className="text-xs text-gray-400 dark:text-white/35">
              {description}
            </p>
          </div>
        </div>
        {open ? (
          <ChevronUp className="h-4 w-4 text-gray-400" />
        ) : (
          <ChevronDown className="h-4 w-4 text-gray-400" />
        )}
      </button>
      {open && (
        <div className="border-t border-gray-100 dark:border-white/[0.06] p-5">
          {children}
        </div>
      )}
    </div>
  );
}

// ── Single image slot ─────────────────────────────────────────────

function ImageSlot({
  label,
  img,
  folder,
  onUploaded,
  onRemove,
  uploading,
}: {
  label: string;
  img: CloudImg | null;
  folder: string;
  onUploaded: (img: CloudImg) => void;
  onRemove: () => void;
  uploading: boolean;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const { uploadPhoto, uploading: up } = useCloudinaryUpload();

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const result = await uploadPhoto(file, folder);
      onUploaded(result);
      toast.success(`${label} uploaded`);
    } catch {
      toast.error("Upload failed");
    }
    e.target.value = "";
  }

  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs font-medium text-gray-500 dark:text-white/40">
        {label}
      </p>
      {img ? (
        <div className="group relative aspect-video overflow-hidden rounded-xl border border-gray-200 dark:border-white/[0.08] bg-gray-50 dark:bg-white/[0.02]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={img.url}
            alt={label}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <button
              onClick={() => fileRef.current?.click()}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/15 hover:bg-white/25 text-white transition"
              title="Replace image"
            >
              {up ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
            </button>
            <button
              onClick={onRemove}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-500/80 hover:bg-red-500 text-white transition"
              title="Remove"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => fileRef.current?.click()}
          disabled={up || uploading}
          className="aspect-video flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-200 dark:border-white/[0.08] text-gray-400 dark:text-white/30 hover:border-brand/40 hover:text-brand transition-colors"
        >
          {up ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Upload className="h-5 w-5" />
          )}
          <span className="text-xs">
            {up ? "Uploading…" : "Click to upload"}
          </span>
        </button>
      )}
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFile}
      />
    </div>
  );
}

// ── Gallery image slot (with alt + wide toggle) ───────────────────

type GalleryImg = CloudImg & { alt: string; wide: boolean };

function GallerySlot({
  img,
  index,
  folder,
  onUpdate,
  onRemove,
}: {
  img: GalleryImg | null;
  index: number;
  folder: string;
  onUpdate: (img: GalleryImg) => void;
  onRemove: () => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const { uploadPhoto, uploading: up } = useCloudinaryUpload();

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const result = await uploadPhoto(file, folder);
      onUpdate({ ...result, alt: img?.alt ?? "", wide: img?.wide ?? false });
      toast.success("Gallery image uploaded");
    } catch {
      toast.error("Upload failed");
    }
    e.target.value = "";
  }

  return (
    <div className="flex flex-col gap-2">
      {img ? (
        <>
          <div className="group relative aspect-video overflow-hidden rounded-xl border border-gray-200 dark:border-white/[0.08]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={img.url}
              alt={img.alt || `Gallery ${index + 1}`}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <button
                onClick={() => fileRef.current?.click()}
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/15 hover:bg-white/25 text-white transition"
              >
                {up ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4" />
                )}
              </button>
              <button
                onClick={onRemove}
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-500/80 hover:bg-red-500 text-white transition"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
          <input
            value={img.alt}
            onChange={(e) => onUpdate({ ...img, alt: e.target.value })}
            className="input-base w-full text-xs"
            placeholder="Caption (e.g. Machine polish — paint correction)"
          />
          <label className="flex items-center gap-2 cursor-pointer text-xs text-gray-500 dark:text-white/40">
            <input
              type="checkbox"
              checked={img.wide}
              onChange={(e) => onUpdate({ ...img, wide: e.target.checked })}
              className="accent-brand"
            />
            Wide (spans 2 columns)
          </label>
        </>
      ) : (
        <button
          onClick={() => fileRef.current?.click()}
          disabled={up}
          className="aspect-video flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-200 dark:border-white/[0.08] text-gray-400 hover:border-brand/40 hover:text-brand transition-colors"
        >
          {up ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <ImageIcon className="h-5 w-5" />
          )}
          <span className="text-xs">
            {up ? "Uploading…" : `Gallery ${index + 1}`}
          </span>
        </button>
      )}
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFile}
      />
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────

export default function WebsiteCMSPage() {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const role = (session?.user as { role?: string })?.role;

  const [content, setContent] = useState<SiteContent>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    if (!isPending && session && role !== "admin")
      router.replace("/workshop/dashboard");
  }, [isPending, role, router, session]);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/site-content");
      const data = await res.json();
      setContent(data as SiteContent);
    } catch {
      toast.error("Failed to load site content");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (role === "admin") load();
  }, [role, load]);

  async function saveSection(section: string, sectionContent: unknown) {
    setSaving(section);
    try {
      const res = await fetch("/api/site-content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ section, content: sectionContent }),
      });
      if (!res.ok) throw new Error("Save failed");
      toast.success("Saved successfully");
      setContent((prev) => ({ ...prev, [section]: sectionContent }));
    } catch {
      toast.error("Failed to save");
    } finally {
      setSaving(null);
    }
  }

  // ── Hero ─────────────────────────────────────────────────────────
  const heroImages: CloudImg[] = content.hero?.images ?? [
    {} as CloudImg,
    {} as CloudImg,
    {} as CloudImg,
  ];
  const filledHero = [...heroImages];
  while (filledHero.length < 3) filledHero.push({} as CloudImg);

  function setHeroImg(i: number, img: CloudImg | null) {
    const next = [...filledHero];
    if (img) next[i] = img;
    else next.splice(i, 1);
    setContent((prev) => ({
      ...prev,
      hero: { images: next.filter((x) => x.url) },
    }));
  }

  // ── Services ─────────────────────────────────────────────────────
  const serviceImgs: Record<string, CloudImg> = content.services ?? {};

  function setServiceImg(key: string, img: CloudImg | null) {
    const next = { ...serviceImgs };
    if (img) next[key] = img;
    else delete next[key];
    setContent((prev) => ({ ...prev, services: next }));
  }

  // ── Gallery ──────────────────────────────────────────────────────
  const galleryImgs: GalleryImg[] = content.gallery?.images ?? [];
  const gallerySlots: (GalleryImg | null)[] = [...galleryImgs];
  while (gallerySlots.length < 8) gallerySlots.push(null);

  function setGalleryImg(i: number, img: GalleryImg | null) {
    const next = [...gallerySlots];
    next[i] = img;
    setContent((prev) => ({
      ...prev,
      gallery: { images: next.filter(Boolean) as GalleryImg[] },
    }));
  }

  // ── Before/After ─────────────────────────────────────────────────
  type BAImg = CloudImg & { type: "before" | "after" };
  const baImgs: BAImg[] = (content.before_after?.images ?? []) as BAImg[];
  const baSlots: (BAImg | null)[] = [
    baImgs.find((x) => x.type === "before") ?? null,
    baImgs.filter((x) => x.type === "before")[1] ?? null,
    baImgs.find((x) => x.type === "after") ?? null,
    baImgs.filter((x) => x.type === "after")[1] ?? null,
  ];

  function setBAImg(i: number, img: CloudImg | null) {
    const type: "before" | "after" = i < 2 ? "before" : "after";
    const next = [...baSlots];
    next[i] = img ? { ...img, type } : null;
    setContent((prev) => ({
      ...prev,
      before_after: { images: next.filter(Boolean) as BAImg[] },
    }));
  }

  // ── Strip ─────────────────────────────────────────────────────────
  const stripImgs: CloudImg[] = content.strip?.images ?? [];
  const stripSlots: (CloudImg | null)[] = [...stripImgs];
  while (stripSlots.length < 8) stripSlots.push(null);

  function setStripImg(i: number, img: CloudImg | null) {
    const next = [...stripSlots];
    next[i] = img;
    setContent((prev) => ({
      ...prev,
      strip: { images: next.filter(Boolean) as CloudImg[] },
    }));
  }

  if (isPending || (!isPending && session && role !== "admin")) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-surface-900">
      <Header title="Website CMS" subtitle="Manage homepage images & content" />

      <div className="p-4 space-y-4 lg:p-6 min-w-full">
        {/* Info banner */}
        <div className="flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 dark:border-blue-500/20 dark:bg-blue-500/10">
          <Info className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
          <div className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed">
            <strong>How it works:</strong> Upload images here and click{" "}
            <strong>Save</strong> for each section. Changes appear on the public
            homepage within ~60 seconds. Images are stored in Cloudinary under{" "}
            <code className="font-mono bg-blue-100 dark:bg-blue-500/20 px-1 rounded">
              bakkah/website/…
            </code>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-brand" />
          </div>
        ) : (
          <>
            {/* ── Hero Slideshow ─────────────────────────────────────── */}
            <Section
              icon={Layout}
              title="Hero Slideshow"
              description="3 background images for the homepage hero (5-second rotation)"
            >
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                {[0, 1, 2].map((i) => (
                  <ImageSlot
                    key={i}
                    label={`Slide ${i + 1}`}
                    img={filledHero[i]?.url ? filledHero[i] : null}
                    folder="bakkah/website/hero"
                    onUploaded={(img) => setHeroImg(i, img)}
                    onRemove={() => setHeroImg(i, null)}
                    uploading={saving === "hero"}
                  />
                ))}
              </div>
              <button
                onClick={() =>
                  saveSection("hero", {
                    images: filledHero.filter((x) => x.url),
                  })
                }
                disabled={saving === "hero"}
                className="btn-primary"
              >
                {saving === "hero" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Check className="h-4 w-4" />
                )}
                Save Hero Images
              </button>
            </Section>

            {/* ── Service Images ────────────────────────────────────── */}
            <Section
              icon={Star}
              title="Service Card Images"
              description="One image per service card on the homepage"
            >
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-4">
                {SERVICE_KEYS?.map((key) => (
                  <ImageSlot
                    key={key}
                    label={SERVICE_LABELS[key]}
                    img={serviceImgs[key]?.url ? serviceImgs[key] : null}
                    folder={`bakkah/website/services`}
                    onUploaded={(img) => setServiceImg(key, img)}
                    onRemove={() => setServiceImg(key, null)}
                    uploading={saving === "services"}
                  />
                ))}
              </div>
              <button
                onClick={() => saveSection("services", serviceImgs)}
                disabled={saving === "services"}
                className="btn-primary"
              >
                {saving === "services" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Check className="h-4 w-4" />
                )}
                Save Service Images
              </button>
            </Section>

            {/* ── Gallery ──────────────────────────────────────────── */}
            <Section
              icon={GalleryHorizontal}
              title="Gallery"
              description="Up to 8 photos shown in the 'Results That Speak' masonry grid"
            >
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                {gallerySlots.map((img, i) => (
                  <GallerySlot
                    key={i}
                    img={img}
                    index={i}
                    folder="bakkah/website/gallery"
                    onUpdate={(updated) => setGalleryImg(i, updated)}
                    onRemove={() => setGalleryImg(i, null)}
                  />
                ))}
              </div>
              <button
                onClick={() => saveSection("gallery", { images: galleryImgs })}
                disabled={saving === "gallery"}
                className="btn-primary"
              >
                {saving === "gallery" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Check className="h-4 w-4" />
                )}
                Save Gallery
              </button>
            </Section>

            {/* ── Before / After ───────────────────────────────────── */}
            <Section
              icon={Layers}
              title="Before / After"
              description="2 before images and 2 after images for the transformation section"
            >
              <div className="grid grid-cols-2 gap-4 mb-4">
                {[0, 1].map((i) => (
                  <ImageSlot
                    key={`before-${i}`}
                    label={`Before ${i + 1}`}
                    img={baSlots[i]}
                    folder="bakkah/website/before-after"
                    onUploaded={(img) => setBAImg(i, img)}
                    onRemove={() => setBAImg(i, null)}
                    uploading={saving === "before_after"}
                  />
                ))}
                {[2, 3].map((i) => (
                  <ImageSlot
                    key={`after-${i}`}
                    label={`After ${i - 1}`}
                    img={baSlots[i]}
                    folder="bakkah/website/before-after"
                    onUploaded={(img) => setBAImg(i, img)}
                    onRemove={() => setBAImg(i, null)}
                    uploading={saving === "before_after"}
                  />
                ))}
              </div>
              <button
                onClick={() =>
                  saveSection("before_after", {
                    images: baSlots.filter(Boolean),
                  })
                }
                disabled={saving === "before_after"}
                className="btn-primary"
              >
                {saving === "before_after" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Check className="h-4 w-4" />
                )}
                Save Before / After
              </button>
            </Section>

            {/* ── Photo Strip ──────────────────────────────────────── */}
            <Section
              icon={Film}
              title="Photo Strip"
              description="8 images for the scrolling marquee strip below the hero"
              defaultOpen={false}
            >
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                {stripSlots.map((img, i) => (
                  <ImageSlot
                    key={i}
                    label={`Strip ${i + 1}`}
                    img={img}
                    folder="bakkah/website/strip"
                    onUploaded={(uploaded) => setStripImg(i, uploaded)}
                    onRemove={() => setStripImg(i, null)}
                    uploading={saving === "strip"}
                  />
                ))}
              </div>
              <button
                onClick={() => saveSection("strip", { images: stripImgs })}
                disabled={saving === "strip"}
                className="btn-primary"
              >
                {saving === "strip" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Check className="h-4 w-4" />
                )}
                Save Photo Strip
              </button>
            </Section>

            {/* Cloudinary folder info */}
            <div className="rounded-xl border border-gray-200 dark:border-white/[0.07] bg-white dark:bg-white/[0.02] p-5">
              <div className="flex items-center gap-2 mb-3">
                <Globe className="h-4 w-4 text-brand" />
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  Cloudinary Folder Structure
                </p>
              </div>
              <div className="font-mono text-xs text-gray-500 dark:text-white/40 space-y-1">
                <p>📁 bakkah/</p>
                <p className="pl-4">📁 website/</p>
                <p className="pl-8">📁 hero/ ← hero slideshow</p>
                <p className="pl-8">📁 services/ ← service card images</p>
                <p className="pl-8">📁 gallery/ ← masonry gallery</p>
                <p className="pl-8">
                  📁 before-after/ ← before/after transforms
                </p>
                <p className="pl-8">📁 strip/ ← scrolling photo strip</p>
                <p className="pl-4">📁 job-cards/ ← existing job card photos</p>
              </div>
              <p className="mt-3 text-xs text-gray-400 dark:text-white/30">
                Folders are created automatically in Cloudinary when you upload
                the first image to them — no manual setup needed.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
