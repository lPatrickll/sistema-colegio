"use client";

import { useState } from "react";
import { EstudianteRepository } from "@/modules/estudiante/estudiante.repository";

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

      await EstudianteRepository.create({
        gestionId,
        cursoId,
        nombres: nombres.trim(),
        apellidos: apellidos.trim(),
        ci: ci.trim() ? ci.trim() : undefined,
        codigo: codigo.trim() ? codigo.trim() : undefined,
        activo,
        createdAt: new Date().toISOString(),
      });

      setSuccess(true);
      setNombres("");
      setApellidos("");
      setCi("");
      setCodigo("");
      setActivo(true);
      onCreated?.();
    } catch {
      setError("Error al guardar el estudiante");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
      {error && <div className="bg-red-100 text-red-700 p-2 rounded">{error}</div>}
      {success && (
        <div className="bg-green-100 text-green-700 p-2 rounded">
          Estudiante creado correctamente
        </div>
      )}

      <div>
        <label className="block text-sm font-medium mb-1">Nombres</label>
        <input
          className="border rounded p-2 w-full"
          value={nombres}
          onChange={(e) => setNombres(e.target.value)}
          placeholder="Ej: Ana María"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Apellidos</label>
        <input
          className="border rounded p-2 w-full"
          value={apellidos}
          onChange={(e) => setApellidos(e.target.value)}
          placeholder="Ej: Gómez Rojas"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">CI (opcional)</label>
        <input
          className="border rounded p-2 w-full"
          value={ci}
          onChange={(e) => setCi(e.target.value)}
          placeholder="Ej: 12345678"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Código (opcional)</label>
        <input
          className="border rounded p-2 w-full"
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
        <label htmlFor="activo" className="text-sm">Activo</label>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
      >
        {loading ? "Guardando..." : "Guardar estudiante"}
      </button>

      <p className="text-xs text-gray-500">
        Gestión: {gestionId} • Curso: {cursoId}
      </p>
    </form>
  );
}
