"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function GestionForm() {
  const router = useRouter();
  const [nombre, setNombre] = useState("Gestión 2025");
  const [anio, setAnio] = useState<number>(2025);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!nombre.trim()) return setError("Nombre requerido");
    if (!anio || anio < 2000 || anio > 2100) return setError("Año inválido");

    try {
      setLoading(true);

      const res = await fetch("/api/gestiones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: nombre.trim(),
          anio,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error ?? "No se pudo crear la gestión");
      }

      router.push(`/admin/gestion/${data.id}`);
      router.refresh();
    } catch (err: any) {
      setError(err.message ?? "Error creando gestión");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4 max-w-md">
      {error && <div className="bg-red-100 text-red-700 p-2 rounded">{error}</div>}

      <div>
        <label className="block text-sm font-medium mb-1 text-slate-900">Nombre</label>
        <input
          className="border rounded p-2 w-full"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          placeholder="Gestión 2025"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1 text-slate-900">Año</label>
        <input
          type="number"
          className="border rounded p-2 w-full"
          value={anio}
          onChange={(e) => setAnio(Number(e.target.value))}
          min={2000}
          max={2100}
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
      >
        {loading ? "Creando..." : "Crear gestión"}
      </button>
    </form>
  );
}
