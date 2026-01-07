"use client";

import { useEffect, useMemo, useState } from "react";

type Dia =
  | "Lunes"
  | "Martes"
  | "Miércoles"
  | "Jueves"
  | "Viernes"
  | "Sábado"
  | "Domingo";

type Horario = { dia: Dia; inicio: string; fin: string };

type Course = { id: string; nombre: string; nivel?: string; gestionId: string };
type Teacher = { id: string; nombreCompleto: string; ci: string; gestionId: string };
type Subject = { id: string; nombre: string; gestionId: string; courseId: string };

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

  const [addSchedule, setAddSchedule] = useState(false);
  const [horarios, setHorarios] = useState<Horario[]>([
    { dia: "Lunes", inicio: "08:00", fin: "09:00" },
  ]);

  const [loading, setLoading] = useState(false);
  const [loadingLists, setLoadingLists] = useState(false);
  const [loadingSubjects, setLoadingSubjects] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const canSubmit = useMemo(() => {
    if (!gestionId || !courseId || !teacherId || !subjectId) return false;
    if (!addSchedule) return true;
    return horarios.length > 0;
  }, [gestionId, courseId, teacherId, subjectId, addSchedule, horarios.length]);

  async function loadLists() {
    setLoadingLists(true);
    setError(null);
    try {
      const qs = `?gestionId=${encodeURIComponent(gestionId)}`;

      const [cRes, tRes] = await Promise.all([
        fetch(`/api/courses${qs}`, { cache: "no-store" }),
        fetch(`/api/teachers${qs}`, { cache: "no-store" }),
      ]);

      const cJson = await cRes.json();
      const tJson = await tRes.json();

      if (!cRes.ok) throw new Error(cJson?.error ?? "Error cargando cursos");
      if (!tRes.ok) throw new Error(tJson?.error ?? "Error cargando profesores");

      setCourses(cJson.courses ?? []);
      setTeachers(tJson.teachers ?? []);
    } catch (e: any) {
      setError(e?.message ?? "Error cargando listas");
    } finally {
      setLoadingLists(false);
    }
  }

  async function loadSubjectsForCourse(nextCourseId: string) {
    if (!gestionId || !nextCourseId) {
      setSubjects([]);
      return;
    }

    setLoadingSubjects(true);
    setError(null);
    try {
      const url =
        `/api/subjects?gestionId=${encodeURIComponent(gestionId)}` +
        `&courseId=${encodeURIComponent(nextCourseId)}`;

      const res = await fetch(url, { cache: "no-store" });
      const data = await res.json();

      if (!res.ok) throw new Error(data?.error ?? "Error cargando materias");

      setSubjects(data.subjects ?? []);
    } catch (e: any) {
      setError(e?.message ?? "Error cargando materias");
      setSubjects([]);
    } finally {
      setLoadingSubjects(false);
    }
  }

  useEffect(() => {
    if (gestionId) loadLists();
  }, [gestionId]);

  useEffect(() => {
    setSubjectId("");
    loadSubjectsForCourse(courseId);
  }, [courseId]);

  function addHorarioRow() {
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

    if (!addSchedule) return null;

    if (horarios.length === 0) return "Debes agregar al menos un horario.";

    for (const h of horarios) {
      if (!h.dia) return "Horario inválido (día faltante).";
      if (!isHHMM(h.inicio) || !isHHMM(h.fin)) return "Horario inválido (formato HH:MM).";
      if (toMin(h.inicio) >= toMin(h.fin)) return "Inicio debe ser menor que fin.";
    }

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

      const payload: any = { gestionId, courseId, teacherId, subjectId };
      if (addSchedule) payload.horarios = horarios;

      const res = await fetch("/api/assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error ?? "Error al guardar asignación");

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
      {error && (
        <div className="bg-red-950/40 border border-red-900 text-red-200 p-2 rounded">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-emerald-950/40 border border-emerald-900 text-emerald-200 p-2 rounded">
          Asignación creada correctamente
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <div>
          <label className="block text-sm font-medium mb-1 text-slate-200">Curso</label>
          <select
            className="bg-slate-950 border border-slate-700 rounded p-2 w-full text-slate-100"
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
          <label className="block text-sm font-medium mb-1 text-slate-200">Profesor</label>
          <select
            className="bg-slate-950 border border-slate-700 rounded p-2 w-full text-slate-100"
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
          <label className="block text-sm font-medium mb-1 text-slate-200">Materia</label>
          <select
            className="bg-slate-950 border border-slate-700 rounded p-2 w-full text-slate-100"
            value={subjectId}
            onChange={(e) => setSubjectId(e.target.value)}
            disabled={loadingLists || loadingSubjects || !courseId}
          >
            <option value="">
              {!courseId
                ? "Primero elige un curso"
                : loadingSubjects
                ? "Cargando materias..."
                : "Seleccionar materia"}
            </option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nombre}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 space-y-3">
        <div className="flex items-center gap-2">
          <input
            id="addSchedule"
            type="checkbox"
            checked={addSchedule}
            onChange={(e) => setAddSchedule(e.target.checked)}
          />
          <label htmlFor="addSchedule" className="text-sm text-slate-200">
            Agregar horarios ahora (opcional)
          </label>
        </div>

        {addSchedule && (
          <>
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-slate-100">Horarios</h2>
              <button
                type="button"
                className="bg-slate-800 hover:bg-slate-700 text-slate-100 px-3 py-1.5 rounded border border-slate-700"
                onClick={addHorarioRow}
              >
                + Añadir
              </button>
            </div>

            {horarios.map((h, idx) => (
              <div key={idx} className="grid gap-3 md:grid-cols-4 items-end">
                <div>
                  <label className="block text-sm mb-1 text-slate-300">Día</label>
                  <select
                    className="bg-slate-950 border border-slate-700 rounded p-2 w-full text-slate-100"
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
                  <label className="block text-sm mb-1 text-slate-300">Inicio</label>
                  <input
                    className="bg-slate-950 border border-slate-700 rounded p-2 w-full text-slate-100"
                    value={h.inicio}
                    onChange={(e) => updateHorario(idx, { inicio: e.target.value })}
                    placeholder="08:00"
                  />
                </div>

                <div>
                  <label className="block text-sm mb-1 text-slate-300">Fin</label>
                  <input
                    className="bg-slate-950 border border-slate-700 rounded p-2 w-full text-slate-100"
                    value={h.fin}
                    onChange={(e) => updateHorario(idx, { fin: e.target.value })}
                    placeholder="09:00"
                  />
                </div>

                <div className="md:text-right">
                  <button
                    type="button"
                    className="bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded w-full md:w-auto disabled:opacity-50"
                    onClick={() => removeHorario(idx)}
                    disabled={horarios.length === 1}
                  >
                    Quitar
                  </button>
                </div>
              </div>
            ))}

            <p className="text-xs text-slate-500">
              Nota: inicio &lt; fin y sin solapamientos por día.
            </p>
          </>
        )}
      </div>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={loading || loadingLists || !canSubmit}
          className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          {loading ? "Guardando..." : "Guardar asignación"}
        </button>

        <button
          type="button"
          className="bg-slate-800 hover:bg-slate-700 text-slate-100 px-4 py-2 rounded border border-slate-700 disabled:opacity-50"
          onClick={loadLists}
          disabled={loadingLists}
        >
          {loadingLists ? "Cargando..." : "Recargar listas"}
        </button>
      </div>

      <p className="text-xs text-slate-500">Gestión: {gestionId}</p>
    </form>
  );
}
