"use client";

import { useState } from "react";
import { MateriaRepository } from "@/modules/materia/materia.repository";
import type { Nivel } from "@/modules/materia/materia.model";

interface MateriaFormProps {
  gestionId: string;
  onCreated?: () => void;
}

export default function MateriaForm({ gestionId, onCreated }: MateriaFormProps) {
  const [nombre, setNombre] = useState("");
  const [nivel, setNivel] = useState<Nivel | "">("");
  const [activa, setActiva] = useState(true);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!nombre.trim()) return setError("El nombre de la materia es obligatorio");
    if (!nivel) return setError("El nivel es obligatorio");

    try {
      setLoading(true);

      await MateriaRepository.create({
        gestionId,
        nombre: nombre.trim(),
        nivel,
        activa,
        createdAt: new Date().toISOString(),
      });

      setSuccess(true);
      setNombre("");
      setNivel("");
      setActiva(true);
      onCreated?.();
    } catch {
      setError("Error al guardar la materia en Firestore");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
      {error && <div className="bg-red-100 text-red-700 p-2 rounded">{error}</div>}
      {success && (
        <div className="bg-green-100 text-green-700 p-2 rounded">
          Materia creada correctamente
        </div>
      )}

      <div>
        <label className="block text-sm font-medium mb-1">Nombre</label>
        <input
          className="border rounded p-2 w-full"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          placeholder="Ej: Matemáticas"
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

      <div className="flex items-center gap-2">
        <input
          id="activa"
          type="checkbox"
          checked={activa}
          onChange={(e) => setActiva(e.target.checked)}
        />
        <label htmlFor="activa" className="text-sm">Activa</label>
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
