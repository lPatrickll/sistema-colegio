// src/components/layout/AdminGestionSidebar.tsx
"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { usePathname } from "next/navigation";

type Item = { label: string; href: string };
type Group = { label: string; items: Item[] };

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export default function AdminGestionSidebar({ gestionId }: { gestionId: string }) {
  const pathname = usePathname() || "";

  if (!gestionId || gestionId === "undefined" || gestionId === "null") return null;

  const groups: Group[] = useMemo(() => {
    const base = `/admin/gestion/${gestionId}`;
    return [
      {
        label: "Cursos",
        items: [
          { label: "Ver cursos", href: `${base}/cursos` },
          { label: "Crear curso", href: `${base}/cursos/nuevo` },
        ],
      },
      {
        label: "Materias",
        items: [
          { label: "Ver materias", href: `${base}/materias` },
          { label: "Crear materia", href: `${base}/materias/nuevo` },
        ],
      },
      {
        label: "Profesores",
        items: [
          { label: "Ver profesores", href: `${base}/profesores` },
          { label: "Crear profesor", href: `${base}/profesores/nuevo` },
        ],
      },
      {
        label: "Estudiantes",
        items: [{ label: "Ver estudiantes", href: `${base}/estudiantes` }],
      },
    ];
  }, [gestionId]);

  const baseHref = `/admin/gestion/${gestionId}`;
  const [open, setOpen] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    for (const g of groups) {
      const isInGroup = g.items.some((it) => pathname.startsWith(it.href));
      initial[g.label] = isInGroup;
    }
    return initial;
  });

  return (
    <nav className="bg-slate-950/60 border border-slate-800 rounded-lg p-3">
      <div className="mb-2">
        <Link
          href="/admin/gestion"
          className={cx(
            "mt-1 block rounded-md px-3 py-2 text-xs transition",
            pathname === "/admin/gestion"
              ? "bg-slate-800 text-slate-100"
              : "text-slate-400 hover:bg-slate-900 hover:text-slate-200"
          )}
        >
          ← Volver a gestiones
        </Link>

        <Link
          href={baseHref}
          className={cx(
            "block rounded-md px-3 py-2 text-sm font-semibold transition",
            pathname === baseHref
              ? "bg-slate-800 text-slate-100"
              : "text-slate-200 hover:bg-slate-900"
          )}
        >
          Inicio (Gestión)
        </Link>
      </div>

      <div className="space-y-1">
        {groups.map((g) => {
          const anyActive = g.items.some((it) => pathname.startsWith(it.href));
          const isOpen = Boolean(open[g.label]);

          return (
            <div key={g.label} className="rounded-md border border-slate-800/70 bg-slate-950">
              <button
                type="button"
                onClick={() => setOpen((p) => ({ ...p, [g.label]: !p[g.label] }))}
                className={cx(
                  "w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-md transition",
                  anyActive ? "text-slate-100" : "text-slate-200",
                  "hover:bg-slate-900"
                )}
                aria-expanded={isOpen}
              >
                <span>{g.label}</span>
                <span className={cx("text-slate-400 transition", isOpen && "rotate-180")}>
                  ▾
                </span>
              </button>

              <div
                className={cx(
                  "grid transition-[grid-template-rows] duration-200",
                  isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                )}
              >
                <div className="overflow-hidden">
                  <div className="px-2 pb-2">
                    {g.items.map((it) => {
                      const isActive =
                        pathname === it.href || pathname.startsWith(it.href + "/");
                      return (
                        <Link
                          key={it.href}
                          href={it.href}
                          className={cx(
                            "block rounded-md px-3 py-2 text-sm transition",
                            isActive
                              ? "bg-slate-800 text-slate-100"
                              : "text-slate-300 hover:bg-slate-900 hover:text-slate-100"
                          )}
                        >
                          {it.label}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </nav>
  );
}
