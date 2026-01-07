"use client";

import { useState } from "react";

interface Props {
  gestionId: string;
  cursoId: string;
  onCreated?: () => void;
}

export default function EstudianteForm({ gestionId, cursoId, onCreated }: Props) {
  const [nombres, setNombres] = useState("");
  const [apellidos, setApellidos] = useState("");
  const [ci, setCi] = useState("");
  const [codigo, setCodigo] = useState("");
  const [activo, setActivo] = useState(true);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!nombres.trim()) return setError("Nombres es obligatorio");
    if (!apellidos.trim()) return setError("Apellidos es obligatorio");

    try {
      setLoading(true);

      const res = await fetch("/api/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gestionId,
          courseId: cursoId,
          nombre: nombres.trim(),
          apellido: apellidos.trim(),
          ci: ci.trim() || undefined,
          codigo: codigo.trim() || undefined,
          activo,
        }),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error ?? "Error al guardar el estudiante");

      setSuccess(true);
      setNombres("");
      setApellidos("");
      setCi("");
      setCodigo("");
      setActivo(true);
      onCreated?.();
    } catch (e: any) {
      setError(e?.message ?? "Error al guardar el estudiante");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
      {error && (
        <div className="bg-red-950/40 border border-red-900 text-red-200 p-2 rounded">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-emerald-950/40 border border-emerald-900 text-emerald-200 p-2 rounded">
          Estudiante creado correctamente
        </div>
      )}

      <div>
        <label className="block text-sm font-medium mb-1 text-slate-200">Nombres</label>
        <input
          className="bg-slate-950 border border-slate-700 rounded p-2 w-full text-slate-100"
          value={nombres}
          onChange={(e) => setNombres(e.target.value)}
          placeholder="Ej: Ana María"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1 text-slate-200">Apellidos</label>
        <input
          className="bg-slate-950 border border-slate-700 rounded p-2 w-full text-slate-100"
          value={apellidos}
          onChange={(e) => setApellidos(e.target.value)}
          placeholder="Ej: Gómez Rojas"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1 text-slate-200">CI (opcional)</label>
        <input
          className="bg-slate-950 border border-slate-700 rounded p-2 w-full text-slate-100"
          value={ci}
          onChange={(e) => setCi(e.target.value)}
          placeholder="Ej: 12345678"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1 text-slate-200">Código (opcional)</label>
        <input
          className="bg-slate-950 border border-slate-700 rounded p-2 w-full text-slate-100"
          value={codigo}
          onChange={(e) => setCodigo(e.target.value)}
          placeholder="Ej: EST-0001"
        />
      </div>

      <div className="flex items-center gap-2">
        <input
          id="activo"
          type="checkbox"
          checked={activo}
          onChange={(e) => setActivo(e.target.checked)}
        />
        <label htmlFor="activo" className="text-sm text-slate-200">
          Activo
        </label>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50"
      >
        {loading ? "Guardando..." : "Guardar estudiante"}
      </button>

      <p className="text-xs text-slate-500">
        Gestión: {gestionId} • Curso: {cursoId}
      </p>
    </form>
  );
}
