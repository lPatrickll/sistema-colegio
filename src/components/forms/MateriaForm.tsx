"use client";

import { useState } from "react";

type Nivel = "INICIAL" | "PRIMARIA" | "SECUNDARIA";

interface MateriaFormProps {
  gestionId: string;
  onCreated?: () => void;
}

export default function MateriaForm({ gestionId, onCreated }: MateriaFormProps) {
  const [nombre, setNombre] = useState("");
  const [nivel, setNivel] = useState<Nivel>("PRIMARIA");
  const [activa, setActiva] = useState(true);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    const n = nombre.trim();
    if (!gestionId) return setError("Gestión inválida.");
    if (!n) return setError("Nombre es obligatorio.");

    try {
      setLoading(true);

      const res = await fetch("/api/subjects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gestionId,
          nombre: n,
          nivel,
          activa,
        }),
      });

      const text = await res.text();
      let data: any = null;
      try {
        data = text ? JSON.parse(text) : null;
      } catch {
      }

      if (!res.ok) {
        const msg =
          data?.error ??
          (text && text.length < 300 ? text : null) ??
          "Error al guardar la materia";
        throw new Error(msg);
      }

      setSuccess(true);
      setNombre("");
      setNivel("PRIMARIA");
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
      {error && (
        <div className="bg-red-100 text-red-700 p-2 rounded">{error}</div>
      )}
      {success && (
        <div className="bg-green-100 text-green-700 p-2 rounded">
          Materia creada correctamente
        </div>
      )}

      <div>
        <label className="block text-sm font-medium mb-1 text-slate-900">
          Nombre
        </label>
        <input
          className="border rounded p-2 w-full text-slate-900"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          placeholder="Ej: Matemáticas"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1 text-slate-900">
          Nivel
        </label>
        <select
          className="border rounded p-2 w-full text-slate-900"
          value={nivel}
          onChange={(e) => setNivel(e.target.value as Nivel)}
        >
          <option value="INICIAL">Inicial</option>
          <option value="PRIMARIA">Primaria</option>
          <option value="SECUNDARIA">Secundaria</option>
        </select>
      </div>

      <div className="flex items-center gap-2">
        <input
          id="activa"
          type="checkbox"
          checked={activa}
          onChange={(e) => setActiva(e.target.checked)}
        />
        <label htmlFor="activa" className="text-sm text-slate-900">
          Activa
        </label>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
      >
        {loading ? "Guardando..." : "Guardar materia"}
      </button>

      <p className="text-xs text-gray-500">Gestión: {gestionId}</p>
    </form>
  );
}
