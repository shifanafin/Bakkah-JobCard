"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { MoreVertical } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export type RowAction = {
  label: string;
  icon: React.ElementType;
  variant?: "danger";
  disabled?: boolean;
  href?: string;
  onClick?: () => void;
};

const MENU_WIDTH = 176; // px, matches w-44

export default function RowActionsMenu({ actions }: { actions: RowAction[] }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDocDown(e: MouseEvent) {
      if (
        menuRef.current?.contains(e.target as Node) ||
        btnRef.current?.contains(e.target as Node)
      )
        return;
      setOpen(false);
    }
    function onEsc(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDocDown);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDocDown);
      document.removeEventListener("keydown", onEsc);
    };
  }, [open]);

  if (actions.length === 0) return null;

  function toggle(e: React.MouseEvent) {
    e.stopPropagation();
    if (!open && btnRef.current) {
      const r = btnRef.current.getBoundingClientRect();
      const left = Math.max(
        8,
        Math.min(
          r.right + window.scrollX - MENU_WIDTH,
          window.scrollX + window.innerWidth - MENU_WIDTH - 8,
        ),
      );
      setPos({ top: r.bottom + window.scrollY + 4, left });
    }
    setOpen((o) => !o);
  }

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onClick={toggle}
        title="Actions"
        className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:text-white/40 dark:hover:bg-white/[0.08] dark:hover:text-white"
      >
        <MoreVertical className="h-4 w-4" />
      </button>
      {open &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={menuRef}
            style={{ position: "absolute", top: pos.top, left: pos.left, width: MENU_WIDTH }}
            onClick={(e) => e.stopPropagation()}
            className="z-50 overflow-hidden rounded-xl border border-gray-200 bg-white py-1 shadow-xl dark:border-white/10 dark:bg-zinc-900"
          >
            {actions.map((a, i) => {
              const itemCls = cn(
                "flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-40",
                a.variant === "danger"
                  ? "text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10"
                  : "text-gray-700 hover:bg-gray-50 dark:text-white/80 dark:hover:bg-white/[0.06]",
              );
              if (a.href) {
                return (
                  <Link
                    key={i}
                    href={a.href}
                    onClick={() => setOpen(false)}
                    className={itemCls}
                  >
                    <a.icon className="h-3.5 w-3.5 shrink-0" />
                    {a.label}
                  </Link>
                );
              }
              return (
                <button
                  key={i}
                  type="button"
                  disabled={a.disabled}
                  onClick={() => {
                    setOpen(false);
                    a.onClick?.();
                  }}
                  className={itemCls}
                >
                  <a.icon className="h-3.5 w-3.5 shrink-0" />
                  {a.label}
                </button>
              );
            })}
          </div>,
          document.body,
        )}
    </>
  );
}
