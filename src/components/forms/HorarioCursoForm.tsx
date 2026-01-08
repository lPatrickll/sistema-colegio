// src/components/forms/HorarioCursoForm.tsx
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

type Slot = { dia: Dia; inicio: string; fin: string };

type Subject = { id: string; nombre: string; gestionId: string; courseId: string };

type Teacher = {
  id: string;
  nombreCompleto: string;
  ci: string;
  gestionId: string;

  teaching?: Record<string, string[]>;
  teachingCourseIds?: string[];
  teachingSubjectIds?: string[];

  subjectsByCourse?: Record<string, string[]>;
  materiasPorCurso?: Record<string, string[]>;
  courseIds?: string[];
  courses?: string[];
  subjectIds?: string[];
  subjects?: string[];
  assignments?: Array<{ courseId: string; subjectIds?: string[]; subjects?: string[] }>;
  asignaciones?: Array<{ courseId: string; subjectIds?: string[]; subjects?: string[] }>;
};

type Schedule = {
  id: string;
  gestionId: string;
  courseId: string;
  subjectId: string;
  teacherId: string;
  slots: Slot[];
  activo: boolean;
  createdAt: string;

  courseNombre?: string | null;
  subjectNombre?: string | null;
  teacherNombreCompleto?: string | null;
};

const DIAS: Dia[] = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

function isHHMM(x: string) {
  return /^\d{2}:\d{2}$/.test(x);
}
function toMin(hhmm: string) {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}
function uniq(arr: string[]) {
  return Array.from(new Set(arr.filter(Boolean)));
}

function getAllowedSubjectsForCourse(teacher: Teacher, courseId: string): Set<string> | null {
  if (!teacher || !courseId) return null;

  const pick = (obj?: Record<string, string[]>) => {
    const v = obj?.[courseId];
    return Array.isArray(v) ? uniq(v.map(String)) : null;
  };

  const a = pick(teacher.teaching);
  if (a) return new Set(a);

  const b = pick(teacher.subjectsByCourse);
  if (b) return new Set(b);

  const c = pick(teacher.materiasPorCurso);
  if (c) return new Set(c);

  const listA = Array.isArray(teacher.assignments) ? teacher.assignments : null;
  if (listA) {
    const row = listA.find((x) => String(x?.courseId) === courseId);
    const ids = Array.isArray(row?.subjectIds)
      ? row!.subjectIds
      : Array.isArray(row?.subjects)
      ? row!.subjects
      : null;
    if (ids) return new Set(uniq(ids.map(String)));
  }

  const listB = Array.isArray(teacher.asignaciones) ? teacher.asignaciones : null;
  if (listB) {
    const row = listB.find((x) => String(x?.courseId) === courseId);
    const ids = Array.isArray(row?.subjectIds)
      ? row!.subjectIds
      : Array.isArray(row?.subjects)
      ? row!.subjects
      : null;
    if (ids) return new Set(uniq(ids.map(String)));
  }

  const courseIds =
    Array.isArray(teacher.teachingCourseIds)
      ? teacher.teachingCourseIds
      : Array.isArray(teacher.courseIds)
      ? teacher.courseIds
      : Array.isArray(teacher.courses)
      ? teacher.courses
      : null;

  if (courseIds?.includes(courseId)) {
    const globalSubjects =
      Array.isArray(teacher.teachingSubjectIds)
        ? teacher.teachingSubjectIds
        : Array.isArray(teacher.subjectIds)
        ? teacher.subjectIds
        : Array.isArray(teacher.subjects)
        ? teacher.subjects
        : null;

    if (globalSubjects && globalSubjects.length > 0) {
      return new Set(uniq(globalSubjects.map(String)));
    }

    return null;
  }

  return null;
}

function teacherCanTeachCourse(teacher: Teacher, courseId: string): boolean | null {
  const allowed = getAllowedSubjectsForCourse(teacher, courseId);
  if (allowed) return allowed.size > 0;

  const courseIds =
    Array.isArray(teacher.teachingCourseIds)
      ? teacher.teachingCourseIds
      : Array.isArray(teacher.courseIds)
      ? teacher.courseIds
      : Array.isArray(teacher.courses)
      ? teacher.courses
      : null;

  if (courseIds) return courseIds.includes(courseId);

  if (Array.isArray(teacher.assignments))
    return teacher.assignments.some((x) => String(x?.courseId) === courseId);
  if (Array.isArray(teacher.asignaciones))
    return teacher.asignaciones.some((x) => String(x?.courseId) === courseId);

  return null;
}

export default function HorarioCursoForm({
  gestionId,
  cursoId,
}: {
  gestionId: string;
  cursoId: string;
}) {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);

  const [teacherId, setTeacherId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [slots, setSlots] = useState<Slot[]>([{ dia: "Lunes", inicio: "08:00", fin: "09:00" }]);

  const [editingId, setEditingId] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [loadingLists, setLoadingLists] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [lockAutoSubject, setLockAutoSubject] = useState(false);
  const [lockAutoTeacher, setLockAutoTeacher] = useState(false);

  const selectedTeacher = useMemo(
    () => teachers.find((t) => t.id === teacherId) ?? null,
    [teachers, teacherId]
  );

  const visibleSubjects = useMemo(() => {
    if (!cursoId) return [];
    if (!selectedTeacher) return subjects;

    const allowed = getAllowedSubjectsForCourse(selectedTeacher, cursoId);
    if (!allowed) return subjects;
    return subjects.filter((s) => allowed.has(s.id));
  }, [subjects, selectedTeacher, cursoId]);

  const visibleTeachers = useMemo(() => {
    if (!cursoId) return teachers;

    let base = teachers.filter((t) => {
      const can = teacherCanTeachCourse(t, cursoId);
      if (can === null) return true;
      return can;
    });

    if (!subjectId) return base;

    base = base.filter((t) => {
      const allowed = getAllowedSubjectsForCourse(t, cursoId);
      if (!allowed) return true;
      return allowed.has(subjectId);
    });

    return base;
  }, [teachers, cursoId, subjectId]);

  useEffect(() => {
    if (!subjectId) return;

    if (teacherId && !visibleTeachers.some((t) => t.id === teacherId)) {
      setTeacherId("");
      return;
    }

    if (!teacherId && visibleTeachers.length === 1 && !lockAutoTeacher) {
      setTeacherId(visibleTeachers[0].id);
    }
  }, [subjectId, visibleTeachers, teacherId, lockAutoTeacher]);

  useEffect(() => {
    if (!teacherId) return;

    if (subjectId && !visibleSubjects.some((s) => s.id === subjectId)) {
      setSubjectId("");
      return;
    }

    if (!subjectId && visibleSubjects.length === 1 && !lockAutoSubject) {
      setSubjectId(visibleSubjects[0].id);
    }
  }, [teacherId, subjectId, visibleSubjects, lockAutoSubject]);

  const canSubmit = useMemo(() => {
    return Boolean(gestionId && cursoId && teacherId && subjectId && slots.length > 0);
  }, [gestionId, cursoId, teacherId, subjectId, slots.length]);

  async function loadAll() {
    setLoadingLists(true);
    setError(null);
    try {
      const qsGestion = `?gestionId=${encodeURIComponent(gestionId)}`;
      const qsSubjects =
        `/api/subjects?gestionId=${encodeURIComponent(gestionId)}` +
        `&courseId=${encodeURIComponent(cursoId)}`;
      const qsSchedules =
        `/api/schedules?gestionId=${encodeURIComponent(gestionId)}` +
        `&courseId=${encodeURIComponent(cursoId)}`;

      const [tRes, sRes, schRes] = await Promise.all([
        fetch(`/api/teachers${qsGestion}`, { cache: "no-store" }),
        fetch(qsSubjects, { cache: "no-store" }),
        fetch(qsSchedules, { cache: "no-store" }),
      ]);

      const tJson = await tRes.json().catch(() => null);
      const sJson = await sRes.json().catch(() => null);
      const schJson = await schRes.json().catch(() => null);

      if (!tRes.ok) throw new Error(tJson?.error ?? "Error cargando profesores");
      if (!sRes.ok) throw new Error(sJson?.error ?? "Error cargando materias");
      if (!schRes.ok) throw new Error(schJson?.error ?? "Error cargando horario");

      setTeachers(tJson?.teachers ?? []);
      setSubjects(sJson?.subjects ?? []);
      setSchedules(schJson?.schedules ?? []);
    } catch (e: any) {
      setError(e?.message ?? "Error cargando datos");
    } finally {
      setLoadingLists(false);
    }
  }

  useEffect(() => {
    if (gestionId && cursoId) loadAll();
  }, [gestionId, cursoId]);

  function addSlotRow() {
    setSlots((prev) => [...prev, { dia: "Lunes", inicio: "08:00", fin: "09:00" }]);
  }
  function removeSlot(idx: number) {
    setSlots((prev) => prev.filter((_, i) => i !== idx));
  }
  function updateSlot(idx: number, patch: Partial<Slot>) {
    setSlots((prev) => prev.map((h, i) => (i === idx ? { ...h, ...patch } : h)));
  }

  function validateFront(): string | null {
    if (!teacherId) return "Selecciona un profesor.";
    if (!subjectId) return "Selecciona una materia.";
    if (slots.length === 0) return "Agrega al menos un horario.";

    for (const h of slots) {
      if (!h.dia) return "Día inválido.";
      if (!isHHMM(h.inicio) || !isHHMM(h.fin)) return "Formato de hora inválido (HH:MM).";
      if (toMin(h.inicio) >= toMin(h.fin)) return "Inicio debe ser menor que fin.";
    }

    const byDay = new Map<string, { a: number; b: number }[]>();
    for (const h of slots) {
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

  function resetForm() {
    setTeacherId("");
    setSubjectId("");
    setSlots([{ dia: "Lunes", inicio: "08:00", fin: "09:00" }]);
    setEditingId(null);
    setLockAutoSubject(false);
    setLockAutoTeacher(false);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const frontErr = validateFront();
    if (frontErr) return setError(frontErr);

    try {
      setLoading(true);

      if (editingId) {
        const res = await fetch(`/api/schedules/${editingId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ teacherId, slots }),
        });
        const data = await res.json().catch(() => null);
        if (!res.ok) throw new Error(data?.error ?? "Error actualizando horario");
        setSuccess("Horario actualizado.");
      } else {
        const res = await fetch("/api/schedules", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            gestionId,
            courseId: cursoId,
            subjectId,
            teacherId,
            slots,
          }),
        });

        const data = await res.json().catch(() => null);
        if (!res.ok) throw new Error(data?.error ?? "Error guardando horario");
        setSuccess("Horario creado.");
      }

      await loadAll();
      resetForm();
    } catch (e: any) {
      setError(e?.message ?? "Error guardando");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    setError(null);
    setSuccess(null);
    try {
      setLoading(true);
      const res = await fetch(`/api/schedules/${id}`, { method: "DELETE" });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error ?? "Error eliminando");
      setSuccess("Horario eliminado.");
      await loadAll();
      if (editingId === id) resetForm();
    } catch (e: any) {
      setError(e?.message ?? "Error eliminando");
    } finally {
      setLoading(false);
    }
  }

  function startEdit(row: Schedule) {
    setEditingId(row.id);
    setTeacherId(row.teacherId);
    setSubjectId(row.subjectId);
    setSlots(
      Array.isArray(row.slots) && row.slots.length
        ? row.slots
        : [{ dia: "Lunes", inicio: "08:00", fin: "09:00" }]
    );
    setSuccess(null);
    setError(null);
    setLockAutoSubject(false);
    setLockAutoTeacher(false);
  }

  const subjectName = (id: string) => subjects.find((s) => s.id === id)?.nombre ?? id;
  const teacherName = (id: string) => teachers.find((t) => t.id === id)?.nombreCompleto ?? id;

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-950/40 border border-red-900 text-red-200 p-2 rounded">{error}</div>
      )}
      {success && (
        <div className="bg-emerald-950/40 border border-emerald-900 text-emerald-200 p-2 rounded">
          {success}
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-4">
        <div className="grid gap-4 md:grid-cols-[1fr_1fr_auto] items-end">
          <div>
            <label className="block text-sm font-medium mb-1 text-slate-200">Materia</label>
            <select
              className="bg-slate-950 border border-slate-700 rounded p-2 w-full text-slate-100"
              value={subjectId}
              onChange={(e) => {
                setSubjectId(e.target.value);
                setLockAutoSubject(false);
              }}
              disabled={loadingLists}
            >
              <option value="">{loadingLists ? "Cargando..." : "Seleccionar materia"}</option>
              {visibleSubjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nombre}
                </option>
              ))}
            </select>
            <p className="text-xs text-slate-500 mt-1">
              Materias del curso (filtradas por profesor si eliges profesor).
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-slate-200">Profesor</label>
            <select
              className="bg-slate-950 border border-slate-700 rounded p-2 w-full text-slate-100"
              value={teacherId}
              onChange={(e) => {
                setTeacherId(e.target.value);
                setLockAutoTeacher(false);
              }}
              disabled={loadingLists}
            >
              <option value="">
                {loadingLists
                  ? "Cargando..."
                  : subjectId
                  ? visibleTeachers.length === 0
                    ? "No hay profesor habilitado"
                    : visibleTeachers.length === 1
                    ? "Se autoseleccionará si es único"
                    : "Seleccionar profesor"
                  : visibleTeachers.length === 0
                  ? "No hay profesores para este curso"
                  : "Seleccionar profesor"}
              </option>

              {visibleTeachers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.nombreCompleto} — CI {t.ci}
                </option>
              ))}
            </select>
            <p className="text-xs text-slate-500 mt-1">
              Filtrado por curso y por materia (si seleccionas materia).
            </p>
          </div>

          <div className="pb-[22px]">
            <button
              type="button"
              aria-label="Limpiar selección"
              title="Limpiar selección"
              className="w-10 h-10 rounded border border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-200 disabled:opacity-50"
              disabled={!subjectId && !teacherId}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                setSubjectId("");
                setTeacherId("");
                setLockAutoSubject(true);
                setLockAutoTeacher(true);
              }}
            >
              ✕
            </button>
          </div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-slate-100">Horarios</h2>
            <button
              type="button"
              className="bg-slate-800 hover:bg-slate-700 text-slate-100 px-3 py-1.5 rounded border border-slate-700"
              onClick={addSlotRow}
            >
              + Añadir
            </button>
          </div>

          {slots.map((h, idx) => (
            <div key={idx} className="grid gap-3 md:grid-cols-4 items-end">
              <div>
                <label className="block text-sm mb-1 text-slate-300">Día</label>
                <select
                  className="bg-slate-950 border border-slate-700 rounded p-2 w-full text-slate-100"
                  value={h.dia}
                  onChange={(e) => updateSlot(idx, { dia: e.target.value as Dia })}
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
                  onChange={(e) => updateSlot(idx, { inicio: e.target.value })}
                  placeholder="08:00"
                />
              </div>

              <div>
                <label className="block text-sm mb-1 text-slate-300">Fin</label>
                <input
                  className="bg-slate-950 border border-slate-700 rounded p-2 w-full text-slate-100"
                  value={h.fin}
                  onChange={(e) => updateSlot(idx, { fin: e.target.value })}
                  placeholder="09:00"
                />
              </div>

              <div className="md:text-right">
                <button
                  type="button"
                  className="bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded w-full md:w-auto disabled:opacity-50"
                  onClick={() => removeSlot(idx)}
                  disabled={slots.length === 1}
                >
                  Quitar
                </button>
              </div>
            </div>
          ))}

          <p className="text-xs text-slate-500">Se valida que no haya choques en curso ni en profesor.</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={loading || loadingLists || !canSubmit}
            className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50"
          >
            {loading ? "Guardando..." : editingId ? "Actualizar horario" : "Crear horario"}
          </button>

          {editingId && (
            <button
              type="button"
              className="bg-slate-800 hover:bg-slate-700 text-slate-100 px-4 py-2 rounded border border-slate-700"
              onClick={resetForm}
              disabled={loading}
            >
              Cancelar edición
            </button>
          )}

          <button
            type="button"
            className="bg-slate-800 hover:bg-slate-700 text-slate-100 px-4 py-2 rounded border border-slate-700"
            onClick={loadAll}
            disabled={loadingLists || loading}
          >
            {loadingLists ? "Cargando..." : "Recargar"}
          </button>
        </div>
      </form>

      <div className="space-y-3">
        <h2 className="font-semibold text-slate-100">Horario del curso</h2>

        {schedules.length === 0 ? (
          <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 text-slate-400">
            Aún no hay horarios creados.
          </div>
        ) : (
          <div className="space-y-2">
            {schedules.map((row) => (
              <div key={row.id} className="bg-slate-950 border border-slate-800 rounded-lg p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-semibold text-slate-100">
                      {row.subjectNombre ?? subjectName(row.subjectId)}
                    </div>
                    <div className="text-sm text-slate-300">
                      Profesor: {row.teacherNombreCompleto ?? teacherName(row.teacherId)}
                    </div>

                    <div className="mt-2 text-sm text-slate-300 space-y-1">
                      {(row.slots ?? []).map((s, i) => (
                        <div key={i}>
                          {s.dia}: {s.inicio}–{s.fin}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <button
                      type="button"
                      className="bg-slate-800 hover:bg-slate-700 text-slate-100 px-3 py-2 rounded border border-slate-700 text-xs"
                      onClick={() => startEdit(row)}
                      disabled={loading}
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      className="bg-red-600 hover:bg-red-500 text-white px-3 py-2 rounded text-xs"
                      onClick={() => handleDelete(row.id)}
                      disabled={loading}
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <p className="text-xs text-slate-500">
        Gestión: {gestionId} • Curso: {cursoId}
      </p>
    </div>
  );
}
