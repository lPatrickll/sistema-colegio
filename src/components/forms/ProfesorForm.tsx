"use client";

import { useState } from "react";
import { ProfesorRepository } from "@/modules/profesor/profesor.repository";

interface ProfesorFormProps {
  gestionId: string;
  onCreated?: () => void;
}

export default function ProfesorForm({ gestionId, onCreated }: ProfesorFormProps) {
  const [nombres, setNombres] = useState("");
  const [apellidos, setApellidos] = useState("");
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

    if (!nombres.trim()) return setError("Nombres es obligatorio");
    if (!apellidos.trim()) return setError("Apellidos es obligatorio");
    if (!ci.trim()) return setError("CI es obligatorio");

    try {
      setLoading(true);

      await ProfesorRepository.create({
        gestionId,
        nombres: nombres.trim(),
        apellidos: apellidos.trim(),
        ci: ci.trim(),
        telefono: telefono.trim() ? telefono.trim() : undefined,
        activo,
        createdAt: new Date().toISOString(),
      });

      setSuccess(true);
      setNombres("");
      setApellidos("");
      setCi("");
      setTelefono("");
      setActivo(true);

      onCreated?.();
    } catch {
      setError("Error al guardar el profesor en Firestore");
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
        <label className="block text-sm font-medium mb-1">Nombres</label>
        <input
          className="border rounded p-2 w-full"
          value={nombres}
          onChange={(e) => setNombres(e.target.value)}
          placeholder="Ej: Juan Carlos"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Apellidos</label>
        <input
          className="border rounded p-2 w-full"
          value={apellidos}
          onChange={(e) => setApellidos(e.target.value)}
          placeholder="Ej: Pérez López"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">CI</label>
        <input
          className="border rounded p-2 w-full"
          value={ci}
          onChange={(e) => setCi(e.target.value)}
          placeholder="Ej: 12345678"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Teléfono (opcional)</label>
        <input
          className="border rounded p-2 w-full"
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
        <label htmlFor="activo" className="text-sm">Activo</label>
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
