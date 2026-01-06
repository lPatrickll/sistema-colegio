"use client";

import { useEffect, useMemo, useState } from "react";
import { getDocs, collection, query, where, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { AsignacionRepository } from "@/modules/asignacion/asignacion.repository";
import type { DiaSemana, Horario } from "@/modules/asignacion/asignacion.model";

type Option = { id: string; label: string };

const DIAS: DiaSemana[] = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

interface Props {
  gestionId: string;
}

export default function AsignacionDocenteForm({ gestionId }: Props) {
  // selects
  const [cursos, setCursos] = useState<Option[]>([]);
  const [profesores, setProfesores] = useState<Option[]>([]);
  const [materias, setMaterias] = useState<Option[]>([]);

  const [cursoId, setCursoId] = useState("");
  const [profesorId, setProfesorId] = useState("");
  const [materiaId, setMateriaId] = useState("");

  // horarios
  const [horarios, setHorarios] = useState<Horario[]>([
    { dia: "Lunes", horaInicio: "08:00", horaFin: "09:00" },
  ]);

  const [loading, setLoading] = useState(false);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // --- cargar opciones por gestionId
  useEffect(() => {
    const load = async () => {
      try {
        setLoadingOptions(true);

        const cursosSnap = await getDocs(
          query(
            collection(db, "cursos"),
            where("gestionId", "==", gestionId),
            orderBy("createdAt", "desc")
          )
        );
        setCursos(
          cursosSnap.docs.map((d) => ({
            id: d.id,
            label: `${(d.data() as any).nombre} • ${(d.data() as any).nivel}`,
          }))
        );

        const profSnap = await getDocs(
          query(
            collection(db, "profesores"),
            where("gestionId", "==", gestionId),
            orderBy("createdAt", "desc")
          )
        );
        setProfesores(
          profSnap.docs.map((d) => ({
            id: d.id,
            label: `${(d.data() as any).nombres} ${(d.data() as any).apellidos} • CI ${(d.data() as any).ci}`,
          }))
        );

        const matSnap = await getDocs(
          query(
            collection(db, "materias"),
            where("gestionId", "==", gestionId),
            orderBy("createdAt", "desc")
          )
        );
        setMaterias(
          matSnap.docs.map((d) => ({
            id: d.id,
            label: `${(d.data() as any).nombre} • ${(d.data() as any).nivel}`,
          }))
        );
      } finally {
        setLoadingOptions(false);
      }
    };

    load();
  }, [gestionId]);

  const canSubmit = useMemo(() => {
    if (!cursoId || !profesorId || !materiaId) return false;
    if (horarios.length === 0) return false;
    for (const h of horarios) {
      if (!h.dia || !h.horaInicio || !h.horaFin) return false;
      if (h.horaInicio >= h.horaFin) return false;
    }
    return true;
  }, [cursoId, profesorId, materiaId, horarios]);

  const addHorario = () => {
    setHorarios((prev) => [
      ...prev,
      { dia: "Lunes", horaInicio: "08:00", horaFin: "09:00" },
    ]);
  };

  const removeHorario = (idx: number) => {
    setHorarios((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateHorario = (idx: number, patch: Partial<Horario>) => {
    setHorarios((prev) => prev.map((h, i) => (i === idx ? { ...h, ...patch } : h)));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!canSubmit) {
      setError("Completa curso, profesor, materia y horarios válidos (inicio < fin).");
      return;
    }

    try {
      setLoading(true);

      await AsignacionRepository.create({
        gestionId,
        cursoId,
        profesorId,
        materiaId,
        horarios,
        createdAt: new Date().toISOString(),
      });

      setSuccess(true);
      setCursoId("");
      setProfesorId("");
      setMateriaId("");
      setHorarios([{ dia: "Lunes", horaInicio: "08:00", horaFin: "09:00" }]);
    } catch {
      setError("Error al guardar la asignación en Firestore");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-2xl">
      {error && <div className="bg-red-100 text-red-700 p-2 rounded">{error}</div>}
      {success && <div className="bg-green-100 text-green-700 p-2 rounded">Asignación creada</div>}

      {loadingOptions ? (
        <p className="text-slate-600">Cargando datos...</p>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1 text-slate-900">Curso</label>
              <select
                className="border rounded p-2 w-full text-slate-900"
                value={cursoId}
                onChange={(e) => setCursoId(e.target.value)}
              >
                <option value="">Seleccionar curso</option>
                {cursos.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-slate-900">Profesor</label>
              <select
                className="border rounded p-2 w-full text-slate-900"
                value={profesorId}
                onChange={(e) => setProfesorId(e.target.value)}
              >
                <option value="">Seleccionar profesor</option>
                {profesores.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-slate-900">Materia</label>
              <select
                className="border rounded p-2 w-full text-slate-900"
                value={materiaId}
                onChange={(e) => setMateriaId(e.target.value)}
              >
                <option value="">Seleccionar materia</option>
                {materias.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="border rounded p-3 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-slate-900">Horarios</h3>
              <button
                type="button"
                onClick={addHorario}
                className="bg-slate-900 text-white px-3 py-1 rounded"
              >
                + Añadir
              </button>
            </div>

            {horarios.map((h, idx) => (
              <div key={idx} className="grid grid-cols-1 md:grid-cols-4 gap-2 items-end">
                <div>
                  <label className="block text-xs font-medium mb-1 text-slate-900">Día</label>
                  <select
                    className="border rounded p-2 w-full text-slate-900"
                    value={h.dia}
                    onChange={(e) => updateHorario(idx, { dia: e.target.value as DiaSemana })}
                  >
                    {DIAS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium mb-1 text-slate-900">Inicio</label>
                  <input
                    type="time"
                    className="border rounded p-2 w-full text-slate-900"
                    value={h.horaInicio}
                    onChange={(e) => updateHorario(idx, { horaInicio: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium mb-1 text-slate-900">Fin</label>
                  <input
                    type="time"
                    className="border rounded p-2 w-full text-slate-900"
                    value={h.horaFin}
                    onChange={(e) => updateHorario(idx, { horaFin: e.target.value })}
                  />
                </div>

                <button
                  type="button"
                  onClick={() => removeHorario(idx)}
                  className="bg-red-600 text-white px-3 py-2 rounded"
                  disabled={horarios.length === 1}
                >
                  Quitar
                </button>
              </div>
            ))}

            <p className="text-xs text-slate-500">
              Nota: inicio debe ser menor que fin.
            </p>
          </div>

          <button
            type="submit"
            disabled={loading || !canSubmit}
            className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
          >
            {loading ? "Guardando..." : "Guardar asignación"}
          </button>

          <p className="text-xs text-gray-500">Gestión: {gestionId}</p>
        </>
      )}
    </form>
  );
}
