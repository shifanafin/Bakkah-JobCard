"use client";

import { useRef, useState } from "react";
import { Camera, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils/cn";

export type ScannedField = { key: string; value: string };

type DocumentType =
  | "emirates_id"
  | "mulkiya"
  | "insurance"
  | "receipt"
  | "vin_plate"
  | "other";

export default function DocumentScanButton({
  documentType,
  label,
  onResult,
  className,
}: {
  documentType: DocumentType;
  label: string;
  onResult: (fields: ScannedField[]) => void;
  className?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);

  function pickFile() {
    inputRef.current?.click();
  }

  function fileToDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setLoading(true);
    try {
      const imageDataUrl = await fileToDataUrl(file);
      const res = await fetch("/api/ai/document-ocr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentType, imageDataUrl }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error || "Could not read the document");
        return;
      }
      if (!json.result?.fields?.length) {
        toast.error("No readable fields found — try a clearer photo");
        return;
      }
      onResult(json.result.fields);
      toast.success("Scanned — review and apply the fields below");
    } catch {
      toast.error("Could not reach the AI document scanner");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFile}
        className="hidden"
      />
      <button
        type="button"
        onClick={pickFile}
        disabled={loading}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-lg border border-brand/30 bg-brand/10 px-3 py-1.5 text-xs font-semibold text-brand transition hover:bg-brand/15 disabled:cursor-not-allowed disabled:opacity-40",
          className,
        )}
      >
        {loading ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Camera className="h-3.5 w-3.5" />
        )}
        {label}
      </button>
    </>
  );
}
