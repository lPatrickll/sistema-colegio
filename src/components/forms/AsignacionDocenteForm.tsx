"use client";

import { useEffect, useMemo, useState } from "react";

type Dia = "Lunes" | "Martes" | "Miércoles" | "Jueves" | "Viernes" | "Sábado" | "Domingo";

type Horario = { dia: Dia; inicio: string; fin: string };

type Course = { id: string; nombre: string; nivel?: string; gestionId: string };
type Teacher = { id: string; nombreCompleto: string; ci: string; gestionId: string };
type Subject = { id: string; nombre: string; nivel: string; gestionId: string };

const DIAS: Dia[] = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

function isHHMM(x: string) {
  return /^\d{2}:\d{2}$/.test(x);
}
function toMin(hhmm: string) {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

export default function AsignacionDocenteForm({
  gestionId,
  onCreated,
}: {
  gestionId: string;
  onCreated?: () => void;
}) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);

  const [courseId, setCourseId] = useState("");
  const [teacherId, setTeacherId] = useState("");
  const [subjectId, setSubjectId] = useState("");

  const [horarios, setHorarios] = useState<Horario[]>([
    { dia: "Lunes", inicio: "08:00", fin: "09:00" },
  ]);

  const [loading, setLoading] = useState(false);
  const [loadingLists, setLoadingLists] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const canSubmit = useMemo(() => {
    return !!gestionId && !!courseId && !!teacherId && !!subjectId && horarios.length > 0;
  }, [gestionId, courseId, teacherId, subjectId, horarios.length]);

  async function loadLists() {
    setLoadingLists(true);
    setError(null);
    try {
      const qs = `?gestionId=${encodeURIComponent(gestionId)}`;

      const [cRes, tRes, sRes] = await Promise.all([
        fetch(`/api/courses${qs}`, { cache: "no-store" }),
        fetch(`/api/teachers${qs}`, { cache: "no-store" }),
        fetch(`/api/subjects${qs}`, { cache: "no-store" }),
      ]);

      const cText = await cRes.text();
      const tText = await tRes.text();
      const sText = await sRes.text();

      if (!cRes.ok) throw new Error(`Cursos: ${cRes.status} ${cText}`);
      if (!tRes.ok) throw new Error(`Profesores: ${tRes.status} ${tText}`);
      if (!sRes.ok) throw new Error(`Materias: ${sRes.status} ${sText}`);

      const cJson = JSON.parse(cText);
      const tJson = JSON.parse(tText);
      const sJson = JSON.parse(sText);

      setCourses(cJson.courses ?? []);
      setTeachers(tJson.teachers ?? []);
      setSubjects(sJson.subjects ?? []);
    } catch (e: any) {
      setError(e?.message ?? "Error cargando listas");
    } finally {
      setLoadingLists(false);
    }
  }

  useEffect(() => {
    if (gestionId) loadLists();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gestionId]);

  function addHorario() {
    setHorarios((prev) => [...prev, { dia: "Lunes", inicio: "08:00", fin: "09:00" }]);
  }

  function removeHorario(idx: number) {
    setHorarios((prev) => prev.filter((_, i) => i !== idx));
  }

  function updateHorario(idx: number, patch: Partial<Horario>) {
    setHorarios((prev) => prev.map((h, i) => (i === idx ? { ...h, ...patch } : h)));
  }

  function validateFront(): string | null {
    if (!gestionId) return "Gestión inválida.";
    if (!courseId) return "Debes seleccionar un curso.";
    if (!teacherId) return "Debes seleccionar un profesor.";
    if (!subjectId) return "Debes seleccionar una materia.";
    if (horarios.length === 0) return "Debes agregar al menos un horario.";

    // Validar horarios
    for (const h of horarios) {
      if (!h.dia) return "Horario inválido (día faltante).";
      if (!isHHMM(h.inicio) || !isHHMM(h.fin)) return "Horario inválido (formato HH:MM).";
      if (toMin(h.inicio) >= toMin(h.fin)) return "Inicio debe ser menor que fin.";
    }

    // Validar solapes por día
    const byDay = new Map<string, { a: number; b: number }[]>();
    for (const h of horarios) {
      const list = byDay.get(h.dia) ?? [];
      list.push({ a: toMin(h.inicio), b: toMin(h.fin) });
      byDay.set(h.dia, list);
    }
    for (const [dia, list] of byDay.entries()) {
      list.sort((x, y) => x.a - y.a);
      for (let i = 1; i < list.length; i++) {
        if (list[i].a < list[i - 1].b) return `Horarios solapados en ${dia}.`;
      }
    }

    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    const frontErr = validateFront();
    if (frontErr) return setError(frontErr);

    try {
      setLoading(true);

      const res = await fetch("/api/assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gestionId,
          courseId,
          teacherId,
          subjectId,
          horarios,
        }),
      });

      const text = await res.text();
      let data: any = null;
      try {
        data = text ? JSON.parse(text) : null;
      } catch {}

      if (!res.ok) {
        throw new Error(data?.error ?? (text && text.length < 300 ? text : "Error al guardar asignación"));
      }

      setSuccess(true);
      onCreated?.();
    } catch (e: any) {
      setError(e?.message ?? "Error al guardar asignación");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      {error && <div className="bg-red-100 text-red-700 p-2 rounded">{error}</div>}
      {success && (
        <div className="bg-green-100 text-green-700 p-2 rounded">
          Asignación creada correctamente
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <div>
          <label className="block text-sm font-medium mb-1 text-slate-900">Curso</label>
          <select
            className="border rounded p-2 w-full text-slate-900"
            value={courseId}
            onChange={(e) => setCourseId(e.target.value)}
            disabled={loadingLists}
          >
            <option value="">Seleccionar curso</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre} {c.nivel ? `(${c.nivel})` : ""}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1 text-slate-900">Profesor</label>
          <select
            className="border rounded p-2 w-full text-slate-900"
            value={teacherId}
            onChange={(e) => setTeacherId(e.target.value)}
            disabled={loadingLists}
          >
            <option value="">Seleccionar profesor</option>
            {teachers.map((t) => (
              <option key={t.id} value={t.id}>
                {t.nombreCompleto} — CI {t.ci}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1 text-slate-900">Materia</label>
          <select
            className="border rounded p-2 w-full text-slate-900"
            value={subjectId}
            onChange={(e) => setSubjectId(e.target.value)}
            disabled={loadingLists}
          >
            <option value="">Seleccionar materia</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nombre} ({s.nivel})
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-white border rounded-lg p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-slate-900">Horarios</h2>
          <button
            type="button"
            className="bg-slate-900 text-white px-3 py-1.5 rounded"
            onClick={addHorario}
          >
            + Añadir
          </button>
        </div>

        {horarios.map((h, idx) => (
          <div key={idx} className="grid gap-3 md:grid-cols-4 items-end">
            <div>
              <label className="block text-sm mb-1 text-slate-700">Día</label>
              <select
                className="border rounded p-2 w-full"
                value={h.dia}
                onChange={(e) => updateHorario(idx, { dia: e.target.value as Dia })}
              >
                {DIAS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm mb-1 text-slate-700">Inicio</label>
              <input
                className="border rounded p-2 w-full"
                value={h.inicio}
                onChange={(e) => updateHorario(idx, { inicio: e.target.value })}
                placeholder="08:00"
              />
            </div>

            <div>
              <label className="block text-sm mb-1 text-slate-700">Fin</label>
              <input
                className="border rounded p-2 w-full"
                value={h.fin}
                onChange={(e) => updateHorario(idx, { fin: e.target.value })}
                placeholder="09:00"
              />
            </div>

            <div className="md:text-right">
              <button
                type="button"
                className="bg-red-600 text-white px-4 py-2 rounded w-full md:w-auto"
                onClick={() => removeHorario(idx)}
                disabled={horarios.length === 1}
                title={horarios.length === 1 ? "Debe existir al menos un horario" : "Quitar"}
              >
                Quitar
              </button>
            </div>
          </div>
        ))}

        <p className="text-xs text-slate-500">Nota: inicio debe ser menor que fin y no deben solaparse por día.</p>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={loading || loadingLists || !canSubmit}
          className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          {loading ? "Guardando..." : "Guardar asignación"}
        </button>

        <button
          type="button"
          className="border px-4 py-2 rounded"
          onClick={loadLists}
          disabled={loadingLists}
        >
          {loadingLists ? "Cargando..." : "Recargar listas"}
        </button>
      </div>

      <p className="text-xs text-gray-500">Gestión: {gestionId}</p>
    </form>
  );
}
