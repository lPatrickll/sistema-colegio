"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CursoForm({ gestionId }: { gestionId: string }) {
  const router = useRouter();
  const [nombre, setNombre] = useState("");
  const [nivel, setNivel] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!nombre.trim()) return setError("El nombre del curso es obligatorio.");
    if (nivel !== "PRIMARIA" && nivel !== "SECUNDARIA") {
      return setError("Selecciona un nivel válido.");
    }

    setLoading(true);
    try {
      const res = await fetch("/api/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gestionId,
          nombre: nombre.trim(),
          nivel,
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setError(data?.error ?? "Error al crear curso");
        return;
      }

      router.push(`/admin/gestion/${gestionId}/cursos`);
      router.refresh();
    } catch {
      setError("Error de red o servidor.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-950/40 border border-red-900 text-red-200 p-2 rounded">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-slate-200">
          Nombre del curso
        </label>
        <input
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          className="mt-1 w-full bg-slate-950 border border-slate-700 rounded-md p-2 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-600"
          placeholder="Ej: Primero Secundaria"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-200">Nivel</label>
        <select
          value={nivel}
          onChange={(e) => setNivel(e.target.value)}
          className="mt-1 w-full bg-slate-950 border border-slate-700 rounded-md p-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-600"
        >
          <option value="">Seleccionar nivel</option>
          <option value="PRIMARIA">Primaria</option>
          <option value="SECUNDARIA">Secundaria</option>
        </select>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-60"
      >
        {loading ? "Guardando..." : "Guardar curso"}
      </button>
    </form>
  );
}
