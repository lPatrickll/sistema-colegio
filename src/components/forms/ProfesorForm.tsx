"use client";

import { useState } from "react";

interface ProfesorFormProps {
  gestionId: string;
  onCreated?: () => void;
}

export default function ProfesorForm({ gestionId, onCreated }: ProfesorFormProps) {
  const [nombres, setNombres] = useState("");
  const [apellidoPaterno, setApellidoPaterno] = useState("");
  const [apellidoMaterno, setApellidoMaterno] = useState("");
  const [ci, setCi] = useState("");
  const [telefono, setTelefono] = useState("");
  const [activo, setActivo] = useState(true);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    const n = nombres.trim();
    const apP = apellidoPaterno.trim();
    const apM = apellidoMaterno.trim();
    const ciT = ci.trim();
    const telT = telefono.trim();

    if (!n) return setError("Nombres es obligatorio");
    if (!apP) return setError("Primer apellido es obligatorio");
    if (!apM) return setError("Segundo apellido es obligatorio");
    if (!ciT) return setError("CI es obligatorio");

    try {
      setLoading(true);

      const res = await fetch("/api/teachers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gestionId,
          nombres: n,
          apellidoPaterno: apP,
          apellidoMaterno: apM,
          ci: ciT,
          telefono: telT ? telT : undefined,
          activo,
        }),
      });

      const data = await res.json().catch(() => null);
      
      if (!res.ok) {
        throw new Error(data?.error ?? "Error al guardar profesor");
      }

      setSuccess(true);
      setNombres("");
      setApellidoPaterno("");
      setApellidoMaterno("");
      setCi("");
      setTelefono("");
      setActivo(true);

      onCreated?.();
    } catch (err: any) {
      setError(err?.message ?? "Error al guardar profesor");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
      {error && <div className="bg-red-100 text-red-700 p-2 rounded">{error}</div>}
      {success && (
        <div className="bg-green-100 text-green-700 p-2 rounded">
          Profesor creado correctamente
        </div>
      )}

      <div>
        <label className="block text-sm font-medium mb-1 text-slate-900">Nombres</label>
        <input
          className="border rounded p-2 w-full text-slate-900"
          value={nombres}
          onChange={(e) => setNombres(e.target.value)}
          placeholder="Ej: Juan Carlos"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1 text-slate-900">Primer apellido</label>
        <input
          className="border rounded p-2 w-full text-slate-900"
          value={apellidoPaterno}
          onChange={(e) => setApellidoPaterno(e.target.value)}
          placeholder="Ej: Pérez"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1 text-slate-900">Segundo apellido</label>
        <input
          className="border rounded p-2 w-full text-slate-900"
          value={apellidoMaterno}
          onChange={(e) => setApellidoMaterno(e.target.value)}
          placeholder="Ej: López"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1 text-slate-900">CI</label>
        <input
          className="border rounded p-2 w-full text-slate-900"
          value={ci}
          onChange={(e) => setCi(e.target.value)}
          placeholder="Ej: 12345678"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1 text-slate-900">Teléfono (opcional)</label>
        <input
          className="border rounded p-2 w-full text-slate-900"
          value={telefono}
          onChange={(e) => setTelefono(e.target.value)}
          placeholder="Ej: 70707070"
        />
      </div>

      <div className="flex items-center gap-2">
        <input
          id="activo"
          type="checkbox"
          checked={activo}
          onChange={(e) => setActivo(e.target.checked)}
        />
        <label htmlFor="activo" className="text-sm text-slate-900">
          Activo
        </label>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
      >
        {loading ? "Guardando..." : "Guardar profesor"}
      </button>

      <p className="text-xs text-gray-500">Gestión: {gestionId}</p>
    </form>
  );
}
