// src/components/ui/BackButton.tsx
"use client";

import { usePathname, useRouter } from "next/navigation";

export default function BackButton({ gestionId }: { gestionId: string }) {
  const router = useRouter();
  const pathname = usePathname() || "";

  const safeGestionId =
    gestionId && gestionId !== "undefined" && gestionId !== "null" ? gestionId : "";

  const base = safeGestionId ? `/admin/gestion/${safeGestionId}` : "/admin/gestion";
  const fallback = pathname === base ? "/admin/gestion" : base;

  return (
    <button
      type="button"
      onClick={() => {
        if (typeof window !== "undefined" && window.history.length > 1) {
          router.back();
          return;
        }
        router.push(fallback);
      }}
      className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-100 px-3 py-2 rounded-md text-sm transition"
    >
      <span aria-hidden>←</span>
      Atrás
    </button>
  );
}
