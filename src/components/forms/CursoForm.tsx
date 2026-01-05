"use client";

import { useState } from "react";
import { CursoRepository } from "@/modules/curso/curso.repository";
import type { Nivel } from "@/modules/curso/curso.model";

interface CursoFormProps {
  gestionId: string; // obligatorio para este flujo
  onCreated?: () => void;
}

export default function CursoForm({ gestionId, onCreated }: CursoFormProps) {
  const [nombre, setNombre] = useState("");
  const [nivel, setNivel] = useState<Nivel | "">("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!nombre.trim()) return setError("El nombre del curso es obligatorio");
    if (!nivel) return setError("El nivel es obligatorio");

    try {
      setLoading(true);

      await CursoRepository.create({
        gestionId,
        nombre: nombre.trim(),
        nivel,
        createdAt: new Date().toISOString(),
      });

      setSuccess(true);
      setNombre("");
      setNivel("");
      onCreated?.();
    } catch {
      setError("Error al guardar el curso en Firestore");
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
          Curso creado correctamente
        </div>
      )}

      <div>
        <label className="block text-sm font-medium mb-1">
          Nombre del curso
        </label>
        <input
          type="text"
          className="border rounded p-2 w-full"
          placeholder="Ej: Primero Secundaria"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Nivel</label>
        <select
          className="border rounded p-2 w-full"
          value={nivel}
          onChange={(e) => setNivel(e.target.value as Nivel)}
        >
          <option value="">Seleccionar nivel</option>
          <option value="Inicial">Inicial</option>
          <option value="Primaria">Primaria</option>
          <option value="Secundaria">Secundaria</option>
        </select>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
      >
        {loading ? "Guardando..." : "Guardar curso"}
      </button>

      <p className="text-xs text-gray-500">Gestión: {gestionId}</p>
    </form>
  );
}
