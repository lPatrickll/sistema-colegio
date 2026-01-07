"use client";

import { useEffect, useMemo, useState } from "react";

type Course = { id: string; nombre: string; gestionId: string };
type Subject = { id: string; nombre: string; courseId: string; gestionId: string };

type Assignment = {
  id: string;
  gestionId: string;
  courseId: string;
  subjectId: string;
  teacherId: string;
};

export default function TeacherAssignmentsForm({
  gestionId,
  teacherId,
}: {
  gestionId: string;
  teacherId: string;
}) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [subjectsByCourse, setSubjectsByCourse] = useState<Record<string, Subject[]>>({});
  const [existing, setExisting] = useState<Assignment[]>([]);

  const [selectedCourses, setSelectedCourses] = useState<Record<string, boolean>>({});
  const [selectedSubjects, setSelectedSubjects] = useState<Record<string, Record<string, boolean>>>(
    {}
  );

  const [loading, setLoading] = useState(false);
  const [loadingInit, setLoadingInit] = useState(false);
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
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error ?? "Error cargando materias");
    setSubjectsByCourse((prev) => ({ ...prev, [courseId]: data?.subjects ?? [] }));
  }

  async function init() {
    setLoadingInit(true);
    setError(null);
    setSuccess(false);
    try {
      const [cRes, aRes] = await Promise.all([
        fetch(`/api/courses?gestionId=${encodeURIComponent(gestionId)}`, { cache: "no-store" }),
        fetch(
          `/api/assignments?gestionId=${encodeURIComponent(gestionId)}&teacherId=${encodeURIComponent(
            teacherId
          )}`,
          { cache: "no-store" }
        ),
      ]);

      const cData = await cRes.json();
      const aData = await aRes.json();

      if (!cRes.ok) throw new Error(cData?.error ?? "Error cargando cursos");
      if (!aRes.ok) throw new Error(aData?.error ?? "Error cargando asignaciones");

      const coursesList: Course[] = cData?.courses ?? [];
      const assignments: Assignment[] = aData?.assignments ?? [];

      setCourses(coursesList);
      setExisting(assignments);

      const nextSelectedCourses: Record<string, boolean> = {};
      const nextSelectedSubjects: Record<string, Record<string, boolean>> = {};

      for (const a of assignments) {
        nextSelectedCourses[a.courseId] = true;
        nextSelectedSubjects[a.courseId] = nextSelectedSubjects[a.courseId] ?? {};
        nextSelectedSubjects[a.courseId][a.subjectId] = true;
      }

      setSelectedCourses(nextSelectedCourses);
      setSelectedSubjects(nextSelectedSubjects);

      const uniqueCourseIds = Array.from(new Set(assignments.map((a) => a.courseId)));
      await Promise.all(uniqueCourseIds.map((cid) => loadSubjects(cid)));
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

  const desiredPairs = useMemo(() => {
    const pairs: { courseId: string; subjectId: string }[] = [];
    for (const courseId of Object.keys(selectedSubjects)) {
      const map = selectedSubjects[courseId] ?? {};
      for (const subjectId of Object.keys(map)) {
        if (map[subjectId]) pairs.push({ courseId, subjectId });
      }
    }
    return pairs;
  }, [selectedSubjects]);

  const desiredCount = desiredPairs.length;

  async function save() {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const existingKey = new Map<string, Assignment>();
      for (const a of existing) {
        existingKey.set(`${a.courseId}__${a.subjectId}`, a);
      }

      const desiredKey = new Set(desiredPairs.map((p) => `${p.courseId}__${p.subjectId}`));

      const toDelete = existing.filter((a) => !desiredKey.has(`${a.courseId}__${a.subjectId}`));
      const toCreate = desiredPairs.filter((p) => !existingKey.has(`${p.courseId}__${p.subjectId}`));

      for (const a of toDelete) {
        const res = await fetch(`/api/assignments/${a.id}`, { method: "DELETE" });
        const d = await res.json().catch(() => null);
        if (!res.ok) throw new Error(d?.error ?? "Error eliminando asignación");
      }

      for (const p of toCreate) {
        const res = await fetch(`/api/assignments`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ gestionId, teacherId, courseId: p.courseId, subjectId: p.subjectId }),
        });
        const d = await res.json().catch(() => null);
        if (!res.ok) throw new Error(d?.error ?? "Error creando asignación");
      }

      await init();
      setSuccess(true);
    } catch (e: any) {
      setError(e?.message ?? "Error guardando cambios");
    } finally {
      setLoading(false);
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
            <h2 className="text-base font-semibold text-slate-100">Materias que dicta</h2>
            <p className="text-sm text-slate-400">
              Marca cursos y luego materias por curso.
            </p>
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
                        <div className="text-sm text-slate-400">
                          Este curso aún no tiene materias.
                        </div>
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

        <div className="text-xs text-slate-500">Materias seleccionadas: {desiredCount}</div>
      </div>

      <button
        type="button"
        onClick={save}
        disabled={loading || loadingInit}
        className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50"
      >
        {loading ? "Guardando..." : "Guardar cambios"}
      </button>
    </div>
  );
}
