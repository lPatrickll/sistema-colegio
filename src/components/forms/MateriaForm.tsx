"use client";

import { useEffect, useState } from "react";

type Course = { id: string; nombre: string; nivel?: string; gestionId: string };

interface MateriaFormProps {
  gestionId: string;
  onCreated?: () => void;
}

export default function MateriaForm({ gestionId, onCreated }: MateriaFormProps) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [courseId, setCourseId] = useState("");

  const [nombre, setNombre] = useState("");
  const [activa, setActiva] = useState(true);

  const [loading, setLoading] = useState(false);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    async function loadCourses() {
      if (!gestionId) return;
      setLoadingCourses(true);
      try {
        const res = await fetch(`/api/courses?gestionId=${encodeURIComponent(gestionId)}`, {
          cache: "no-store",
        });
        const data = await res.json().catch(() => null);
        if (!res.ok) throw new Error(data?.error ?? "Error cargando cursos");
        setCourses(data?.courses ?? []);
      } catch (e: any) {
        setError(e?.message ?? "Error cargando cursos");
      } finally {
        setLoadingCourses(false);
      }
    }
    loadCourses();
  }, [gestionId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    const n = nombre.trim();
    if (!gestionId) return setError("Gestión inválida.");
    if (!courseId) return setError("Debes seleccionar un curso.");
    if (!n) return setError("Nombre es obligatorio.");

    try {
      setLoading(true);

      const res = await fetch("/api/subjects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gestionId, courseId, nombre: n, activa }),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error ?? "Error al guardar la materia");

      setSuccess(true);
      setNombre("");
      setActiva(true);

      onCreated?.();
    } catch (err: any) {
      setError(err?.message ?? "Error al guardar la materia");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
      {error && <div className="bg-red-950/40 border border-red-900 text-red-200 p-2 rounded">{error}</div>}
      {success && (
        <div className="bg-emerald-950/40 border border-emerald-900 text-emerald-200 p-2 rounded">
          Materia creada correctamente
        </div>
      )}

      <div>
        <label className="block text-sm font-medium mb-1 text-slate-200">Curso</label>
        <select
          className="bg-slate-950 border border-slate-700 rounded p-2 w-full text-slate-100"
          value={courseId}
          onChange={(e) => setCourseId(e.target.value)}
          disabled={loadingCourses}
        >
          <option value="">{loadingCourses ? "Cargando cursos..." : "Selecciona un curso"}</option>
          {courses.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nombre}
            </option>
          ))}
        </select>
        {courses.length === 0 && !loadingCourses && (
          <p className="text-xs text-slate-400 mt-2">
            Primero crea al menos un curso.
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium mb-1 text-slate-200">Nombre de la materia</label>
        <input
          className="bg-slate-950 border border-slate-700 rounded p-2 w-full text-slate-100 placeholder:text-slate-500"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          placeholder="Ej: Matemáticas"
        />
      </div>

      <div className="flex items-center gap-2">
        <input
          id="activa"
          type="checkbox"
          checked={activa}
          onChange={(e) => setActiva(e.target.checked)}
        />
        <label htmlFor="activa" className="text-sm text-slate-200">Activa</label>
      </div>

      <button
        type="submit"
        disabled={loading || loadingCourses}
        className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50"
      >
        {loading ? "Guardando..." : "Guardar materia"}
      </button>

      <p className="text-xs text-slate-500">Gestión: {gestionId}</p>
    </form>
  );
}
