"use client";

import { useAuth } from "@/components/Auth/AuthContext";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode, useEffect } from "react";

const links = [
  { href: "/admin", label: "Inicio" },
  { href: "/admin/teachers", label: "Registrar profesor" },
  { href: "/admin/student", label: "Registrar estudiante" },
  { href: "/admin/subjects", label: "Registrar materia" },
  { href: "/admin/teachers/list", label: "Lista de profesores" },
  { href: "/admin/student/list", label: "Lista de estudiantes" },
  { href: "/admin/subjects/list", label: "Lista de materias" },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.push("/login");
      return;
    }

    if (user.role !== "admin") {
      router.push("/");
    }
  }, [user, loading, router]);

  if (loading || !user || user.role !== "admin") {
    return <p className="p-4">Verificando permisos...</p>;
  }

  return (
    <div className="min-h-screen flex">
      <aside className="w-64 bg-slate-900 text-white flex flex-col">
        <div className="p-4 text-lg font-bold border-b border-slate-700">
          Panel admin
        </div>

        <nav className="flex-1 p-2 space-y-1">
          {links.map(link => (
            <Link
              key={link.href}
              href={link.href}
              className={
                "block px-3 py-2 rounded text-sm " +
                (pathname === link.href
                  ? "bg-slate-700 font-semibold"
                  : "hover:bg-slate-800")
              }
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </aside>

      <main className="flex-1 bg-slate-50">{children}</main>
    </div>
  );
}