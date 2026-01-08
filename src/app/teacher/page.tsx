"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/Auth/AuthContext";
import { useRouter } from "next/navigation";

type Course = {
  id: string;
  nombre: string;
  nivel?: string;
  paralelo?: string;
};

export default function TeacherHomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [courses, setCourses] = useState<Course[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loadingCourses, setLoadingCourses] = useState(true);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.push("/login");
      return;
    }

    const roles = (user.roles || []).map((r) => String(r).toUpperCase());
    if (!roles.includes("TEACHER")) {
      router.push("/login");
      return;
    }

    (async () => {
      try {
        setError(null);
        setLoadingCourses(true);

        const res = await fetch("/api/teachers/courses", { cache: "no-store" });
        const data = await res.json().catch(() => null);
        if (!res.ok) throw new Error(data?.error ?? "Error al cargar cursos");

        setCourses(data?.courses ?? []);
      } catch (e: any) {
        setError(e?.message ?? "Error al cargar cursos");
      } finally {
        setLoadingCourses(false);
      }
    })();
  }, [user, loading, router]);

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Mis cursos</h1>
          <p className="text-sm text-slate-400">
            Selecciona un curso para ver estudiantes y registrar asistencia.
          </p>
        </div>

        {error && (
          <div className="bg-red-950/40 border border-red-900 text-red-200 rounded-lg p-3 text-sm">
            {error}
          </div>
        )}

        {loadingCourses ? (
          <div className="text-sm text-slate-400">Cargando...</div>
        ) : courses.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 text-slate-400">
            No tienes cursos asignados todavía.
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {courses.map((c) => (
              <Link
                key={c.id}
                href={`/teacher/courses/${c.id}`}
                className="block bg-slate-900 border border-slate-800 rounded-lg p-4 hover:bg-slate-900/70 transition"
              >
                <div className="font-semibold text-slate-100">{c.nombre}</div>
                <div className="text-xs text-slate-400 mt-1">
                  {c.nivel ? `Nivel: ${c.nivel}` : ""}
                  {c.paralelo ? ` • Paralelo: ${c.paralelo}` : ""}
                </div>
              </Link>
            ))}
          </div>
        )}

        <div className="text-xs text-slate-600">
          Usuario: tu correo • Contraseña inicial: tu CI
        </div>
      </div>
    </main>
  );
}
