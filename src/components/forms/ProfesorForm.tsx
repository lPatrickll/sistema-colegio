"use client";

import { useEffect, useMemo, useState } from "react";

type Course = { id: string; nombre: string; gestionId: string };
type Subject = { id: string; nombre: string; courseId: string; gestionId: string };

interface ProfesorFormProps {
  gestionId: string;
  onCreated?: () => void;
}

export default function ProfesorForm({ gestionId, onCreated }: ProfesorFormProps) {
  const [nombres, setNombres] = useState("");
  const [apellidoPaterno, setApellidoPaterno] = useState("");
  const [apellidoMaterno, setApellidoMaterno] = useState("");
  const [ci, setCi] = useState("");
  const [telefono, setTelefono] = useState("");
  const [activo, setActivo] = useState(true);

  const [courses, setCourses] = useState<Course[]>([]);
  const [subjectsByCourse, setSubjectsByCourse] = useState<Record<string, Subject[]>>({});
  const [selectedCourses, setSelectedCourses] = useState<Record<string, boolean>>({});
  const [selectedSubjects, setSelectedSubjects] = useState<Record<string, Record<string, boolean>>>(
    {}
  );

  const [loading, setLoading] = useState(false);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function loadCourses() {
    setLoadingCourses(true);
    setError(null);
    try {
      const res = await fetch(`/api/courses?gestionId=${encodeURIComponent(gestionId)}`, {
        cache: "no-store",
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error ?? "Error cargando cursos");
      setCourses(data?.courses ?? []);
    } catch (e: any) {
      setError(e?.message ?? "Error cargando cursos");
    } finally {
      setLoadingCourses(false);
    }
  }

  async function loadSubjects(courseId: string) {
    if (subjectsByCourse[courseId]) return;

    try {
      const res = await fetch(
        `/api/subjects?gestionId=${encodeURIComponent(gestionId)}&courseId=${encodeURIComponent(
          courseId
        )}`,
        { cache: "no-store" }
      );
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error ?? "Error cargando materias");
      setSubjectsByCourse((prev) => ({ ...prev, [courseId]: data?.subjects ?? [] }));
    } catch (e: any) {
      setError(e?.message ?? "Error cargando materias");
    }
  }

  useEffect(() => {
    if (gestionId) loadCourses();
  }, [gestionId]);

  function toggleCourse(courseId: string, checked: boolean) {
    setSelectedCourses((prev) => ({ ...prev, [courseId]: checked }));

    if (checked) {
      loadSubjects(courseId);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    const n = nombres.trim();
    const apP = apellidoPaterno.trim();
    const apM = apellidoMaterno.trim();
    const ciT = ci.trim();
    const telT = telefono.trim();

    if (!n) return setError("Nombres es obligatorio");
    if (!apP) return setError("Primer apellido es obligatorio");
    if (!apM) return setError("Segundo apellido es obligatorio");
    if (!ciT) return setError("CI es obligatorio");

    if (selectedPairsCount === 0) {
      return setError("Debes asignar al menos una materia a este profesor.");
    }

    const teaching = buildTeaching();
    if (Object.keys(teaching).length === 0) {
      return setError("Debes seleccionar materias dentro de al menos un curso.");
    }

    try {
      setLoading(true);

      const tRes = await fetch("/api/teachers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gestionId,
          nombres: n,
          apellidoPaterno: apP,
          apellidoMaterno: apM,
          ci: ciT,
          telefono: telT ? telT : undefined,
          activo,
          teaching,
        }),
      });

      const tData = await tRes.json().catch(() => null);
      if (!tRes.ok) throw new Error(tData?.error ?? "Error al guardar profesor");

      setSuccess(true);

      setNombres("");
      setApellidoPaterno("");
      setApellidoMaterno("");
      setCi("");
      setTelefono("");
      setActivo(true);
      setSelectedCourses({});
      setSelectedSubjects({});

      onCreated?.();
    } catch (err: any) {
      setError(err?.message ?? "Error al guardar profesor");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      {error && (
        <div className="bg-red-950/40 border border-red-900 text-red-200 p-2 rounded whitespace-pre-wrap">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-emerald-950/40 border border-emerald-900 text-emerald-200 p-2 rounded">
          Profesor creado correctamente
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="block text-sm font-medium mb-1 text-slate-200">Nombres</label>
          <input
            className="bg-slate-950 border border-slate-700 rounded p-2 w-full text-slate-100"
            value={nombres}
            onChange={(e) => setNombres(e.target.value)}
            placeholder="Ej: Juan Carlos"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1 text-slate-200">CI</label>
          <input
            className="bg-slate-950 border border-slate-700 rounded p-2 w-full text-slate-100"
            value={ci}
            onChange={(e) => setCi(e.target.value)}
            placeholder="Ej: 12345678"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1 text-slate-200">Primer apellido</label>
          <input
            className="bg-slate-950 border border-slate-700 rounded p-2 w-full text-slate-100"
            value={apellidoPaterno}
            onChange={(e) => setApellidoPaterno(e.target.value)}
            placeholder="Ej: Pérez"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1 text-slate-200">Segundo apellido</label>
          <input
            className="bg-slate-950 border border-slate-700 rounded p-2 w-full text-slate-100"
            value={apellidoMaterno}
            onChange={(e) => setApellidoMaterno(e.target.value)}
            placeholder="Ej: López"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1 text-slate-200">Teléfono (opcional)</label>
          <input
            className="bg-slate-950 border border-slate-700 rounded p-2 w-full text-slate-100"
            value={telefono}
            onChange={(e) => setTelefono(e.target.value)}
            placeholder="Ej: 70707070"
          />
        </div>

        <div className="flex items-center gap-2 pt-7">
          <input
            id="activo"
            type="checkbox"
            checked={activo}
            onChange={(e) => setActivo(e.target.checked)}
          />
          <label htmlFor="activo" className="text-sm text-slate-200">
            Activo
          </label>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-100">Cursos y materias que dictará</h2>
            <p className="text-sm text-slate-400">
              Selecciona cursos y luego marca las materias que dictará en cada uno.
            </p>
          </div>

          <button
            type="button"
            className="bg-slate-800 hover:bg-slate-700 text-slate-100 px-3 py-2 rounded border border-slate-700 disabled:opacity-50"
            onClick={loadCourses}
            disabled={loadingCourses}
          >
            {loadingCourses ? "Cargando..." : "Recargar"}
          </button>
        </div>

        {courses.length === 0 ? (
          <div className="text-sm text-slate-400">Primero crea cursos y materias.</div>
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
                          Este curso aún no tiene materias (crea materias para este curso).
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

        <div className="text-xs text-slate-500">Materias seleccionadas: {selectedPairsCount}</div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50"
      >
        {loading ? "Guardando..." : "Guardar profesor"}
      </button>

      <p className="text-xs text-slate-500">Gestión: {gestionId}</p>
    </form>
  );
}
