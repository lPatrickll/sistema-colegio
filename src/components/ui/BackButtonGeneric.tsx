// src/components/ui/BackButtonGeneric.tsx
"use client";

import { useRouter } from "next/navigation";

export default function BackButtonGeneric({
  fallbackHref,
  label = "Atrás",
}: {
  fallbackHref: string;
  label?: string;
}) {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => {
        if (typeof window !== "undefined" && window.history.length > 1) {
          router.back();
          return;
        }
        router.push(fallbackHref);
      }}
      className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-100 px-3 py-2 rounded-md text-sm transition"
    >
      <span aria-hidden>←</span>
      {label}
    </button>
  );
}
