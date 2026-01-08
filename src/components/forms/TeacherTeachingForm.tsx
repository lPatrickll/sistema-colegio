"use client";

import { useEffect, useMemo, useState } from "react";

type Course = { id: string; nombre: string; gestionId: string };
type Subject = { id: string; nombre: string; courseId: string; gestionId: string };

type Teacher = {
  id: string;
  gestionId: string;
  nombreCompleto?: string;
  teaching?: Record<string, string[]>;
};

function buildSelectedFromTeaching(teaching?: Record<string, string[]>) {
  const selectedCourses: Record<string, boolean> = {};
  const selectedSubjects: Record<string, Record<string, boolean>> = {};

  if (!teaching) return { selectedCourses, selectedSubjects };

  for (const courseId of Object.keys(teaching)) {
    selectedCourses[courseId] = true;
    selectedSubjects[courseId] = selectedSubjects[courseId] ?? {};
    for (const subjectId of teaching[courseId] ?? []) {
      selectedSubjects[courseId][subjectId] = true;
    }
  }

  return { selectedCourses, selectedSubjects };
}

export default function TeacherTeachingForm({
  gestionId,
  teacherId,
}: {
  gestionId: string;
  teacherId: string;
}) {
  const [teacher, setTeacher] = useState<Teacher | null>(null);

  const [courses, setCourses] = useState<Course[]>([]);
  const [subjectsByCourse, setSubjectsByCourse] = useState<Record<string, Subject[]>>({});

  const [selectedCourses, setSelectedCourses] = useState<Record<string, boolean>>({});
  const [selectedSubjects, setSelectedSubjects] = useState<Record<string, Record<string, boolean>>>(
    {}
  );

  const [loadingInit, setLoadingInit] = useState(false);
  const [loadingSave, setLoadingSave] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function loadSubjects(courseId: string) {
    if (subjectsByCourse[courseId]) return;

    const res = await fetch(
      `/api/subjects?gestionId=${encodeURIComponent(gestionId)}&courseId=${encodeURIComponent(
        courseId
      )}`,
      { cache: "no-store" }
    );

    const data = await res.json().catch(() => null);
    if (!res.ok) throw new Error(data?.error ?? "Error cargando materias");

    setSubjectsByCourse((prev) => ({ ...prev, [courseId]: data?.subjects ?? [] }));
  }

  async function init() {
    setLoadingInit(true);
    setError(null);
    setSuccess(false);

    try {
      const [cRes, tRes] = await Promise.all([
        fetch(`/api/courses?gestionId=${encodeURIComponent(gestionId)}`, { cache: "no-store" }),
        fetch(`/api/teachers/${encodeURIComponent(teacherId)}?gestionId=${encodeURIComponent(gestionId)}`, {
          cache: "no-store",
        }),
      ]);

      const cData = await cRes.json().catch(() => null);
      const tData = await tRes.json().catch(() => null);

      if (!cRes.ok) throw new Error(cData?.error ?? "Error cargando cursos");
      if (!tRes.ok) throw new Error(tData?.error ?? "Error cargando profesor");

      const coursesList: Course[] = cData?.courses ?? [];
      const t: Teacher = tData?.teacher ?? null;

      if (!t) throw new Error("No se pudo cargar el profesor.");

      setCourses(coursesList);
      setTeacher(t);

      const { selectedCourses, selectedSubjects } = buildSelectedFromTeaching(t.teaching);
      setSelectedCourses(selectedCourses);
      setSelectedSubjects(selectedSubjects);

      const courseIds = Object.keys(selectedCourses).filter((cid) => selectedCourses[cid]);
      await Promise.all(courseIds.map((cid) => loadSubjects(cid)));
    } catch (e: any) {
      setError(e?.message ?? "Error inicializando");
    } finally {
      setLoadingInit(false);
    }
  }

  useEffect(() => {
    init();
  }, [gestionId, teacherId]);

  function toggleCourse(courseId: string, checked: boolean) {
    setSelectedCourses((prev) => ({ ...prev, [courseId]: checked }));

    if (checked) {
      loadSubjects(courseId).catch((e) => setError(e?.message ?? "Error cargando materias"));
    } else {
      setSelectedSubjects((prev) => ({ ...prev, [courseId]: {} }));
    }
  }

  function toggleSubject(courseId: string, subjectId: string, checked: boolean) {
    setSelectedSubjects((prev) => ({
      ...prev,
      [courseId]: { ...(prev[courseId] ?? {}), [subjectId]: checked },
    }));
  }

  const selectedPairsCount = useMemo(() => {
    let count = 0;
    for (const courseId of Object.keys(selectedSubjects)) {
      const map = selectedSubjects[courseId] ?? {};
      for (const sid of Object.keys(map)) if (map[sid]) count++;
    }
    return count;
  }, [selectedSubjects]);

  function buildTeaching(): Record<string, string[]> {
    const teaching: Record<string, string[]> = {};
    for (const courseId of Object.keys(selectedCourses)) {
      if (!selectedCourses[courseId]) continue;
      const map = selectedSubjects[courseId] ?? {};
      const subjectIds = Object.keys(map).filter((sid) => map[sid]);
      if (subjectIds.length > 0) teaching[courseId] = subjectIds;
    }
    return teaching;
  }

  async function save() {
    setLoadingSave(true);
    setError(null);
    setSuccess(false);

    try {
      const teaching = buildTeaching();
      if (Object.keys(teaching).length === 0) {
        throw new Error("Debes asignar al menos una materia.");
      }

      const res = await fetch(`/api/teachers/${encodeURIComponent(teacherId)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gestionId, teaching }),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error ?? "Error guardando cambios");

      setSuccess(true);
      await init();
    } catch (e: any) {
      setError(e?.message ?? "Error guardando cambios");
    } finally {
      setLoadingSave(false);
    }
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-950/40 border border-red-900 text-red-200 p-2 rounded whitespace-pre-wrap">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-emerald-950/40 border border-emerald-900 text-emerald-200 p-2 rounded">
          Cambios guardados
        </div>
      )}

      <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-100">
              {teacher?.nombreCompleto ? `Materias que dicta — ${teacher.nombreCompleto}` : "Materias que dicta"}
            </h2>
            <p className="text-sm text-slate-400">Marca cursos y luego materias por curso.</p>
          </div>

          <button
            type="button"
            className="bg-slate-800 hover:bg-slate-700 text-slate-100 px-3 py-2 rounded border border-slate-700 disabled:opacity-50"
            onClick={init}
            disabled={loadingInit}
          >
            {loadingInit ? "Cargando..." : "Recargar"}
          </button>
        </div>

        {courses.length === 0 ? (
          <div className="text-sm text-slate-400">No hay cursos todavía.</div>
        ) : (
          <div className="space-y-3">
            {courses.map((c) => {
              const checked = !!selectedCourses[c.id];
              const subs = subjectsByCourse[c.id] ?? [];
              const selectedMap = selectedSubjects[c.id] ?? {};

              return (
                <div key={c.id} className="border border-slate-800 rounded-lg p-3 bg-slate-950/40">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => toggleCourse(c.id, e.target.checked)}
                    />
                    <div className="text-sm font-medium text-slate-100">{c.nombre}</div>
                  </div>

                  {checked && (
                    <div className="mt-3 space-y-2">
                      {subs.length === 0 ? (
                        <div className="text-sm text-slate-400">Este curso aún no tiene materias.</div>
                      ) : (
                        <div className="grid gap-2 md:grid-cols-2">
                          {subs.map((s) => (
                            <label key={s.id} className="flex items-center gap-2 text-sm text-slate-200">
                              <input
                                type="checkbox"
                                checked={!!selectedMap[s.id]}
                                onChange={(e) => toggleSubject(c.id, s.id, e.target.checked)}
                              />
                              {s.nombre}
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <div className="text-xs text-slate-500">Materias seleccionadas: {selectedPairsCount}</div>
      </div>

      <button
        type="button"
        onClick={save}
        disabled={loadingInit || loadingSave}
        className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50"
      >
        {loadingSave ? "Guardando..." : "Guardar cambios"}
      </button>
    </div>
  );
}
