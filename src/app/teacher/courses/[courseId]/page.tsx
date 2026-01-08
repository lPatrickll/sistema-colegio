"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/components/Auth/AuthContext";

type Student = {
  id: string;
  nombreCompleto?: string;
  nombre?: string;
  primerApellido?: string;
  segundoApellido?: string | null;
};

type ScheduleItem = {
  scheduleId: string;
  slotIndex: number;
  inicio: string;
  fin: string;
  subjectNombre?: string | null;
  dia: string;
};

type Estado = "PRESENTE" | "AUSENTE" | "JUSTIFICADO";

export default function TeacherCoursePage() {
  const params = useParams<{ courseId: string }>();
  const courseId = params?.courseId;

  const { user, loading } = useAuth();
  const router = useRouter();

  const [students, setStudents] = useState<Student[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(true);

  const [fecha, setFecha] = useState(() => new Date().toISOString().slice(0, 10));
  const [dia, setDia] = useState<string>("");
  const [slots, setSlots] = useState<ScheduleItem[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(true);
  const [selectedSlotKey, setSelectedSlotKey] = useState<string>("");

  const [sessionId, setSessionId] = useState<string>("");
  const [savingSession, setSavingSession] = useState(false);

  const [estadoByStudent, setEstadoByStudent] = useState<Record<string, Estado>>({});
  const [justByStudent, setJustByStudent] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.push("/login");
      return;
    }

    const roles = (user.roles || []).map((r) => String(r).toUpperCase());
    if (!roles.includes("TEACHER")) {
      router.push("/login");
      return;
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (loading || !user) return;
    if (!courseId) return;

    (async () => {
      try {
        setError(null);
        setMessage(null);
        setLoadingStudents(true);

        const res = await fetch(`/api/teachers/students?courseId=${encodeURIComponent(courseId)}`, {
          cache: "no-store",
        });

        const data = await res.json().catch(() => null);
        if (!res.ok) throw new Error(data?.error ?? "Error al cargar estudiantes");

        const list: Student[] = data?.students ?? [];
        setStudents(list);

        const initEstado: Record<string, Estado> = {};
        list.forEach((s) => (initEstado[s.id] = "PRESENTE"));
        setEstadoByStudent(initEstado);
        setJustByStudent({});
      } catch (e: any) {
        setError(e?.message ?? "Error al cargar estudiantes");
      } finally {
        setLoadingStudents(false);
      }
    })();
  }, [courseId, user, loading]);

  useEffect(() => {
    if (loading || !user) return;
    if (!courseId) return;

    (async () => {
      try {
        setError(null);
        setMessage(null);
        setLoadingSlots(true);
        setSessionId("");
        setSelectedSlotKey("");

        const res = await fetch(
          `/api/teachers/schedules?courseId=${encodeURIComponent(courseId)}&fecha=${encodeURIComponent(fecha)}`,
          { cache: "no-store" }
        );

        const data = await res.json().catch(() => null);
        if (!res.ok) throw new Error(data?.error ?? "Error al cargar horarios");

        setDia(data?.dia ?? "");
        setSlots(data?.items ?? []);
      } catch (e: any) {
        setError(e?.message ?? "Error al cargar horarios");
      } finally {
        setLoadingSlots(false);
      }
    })();
  }, [courseId, fecha, user, loading]);

  const slotSelected = useMemo(() => {
    if (!selectedSlotKey) return null;
    const [scheduleId, slotIndexStr] = selectedSlotKey.split("::");
    const slotIndex = Number(slotIndexStr);
    return { scheduleId, slotIndex };
  }, [selectedSlotKey]);

  const createSession = async () => {
    try {
      setError(null);
      setMessage(null);

      if (!slotSelected) {
        setError("Selecciona el horario de hoy antes de crear la asistencia");
        return;
      }

      setSavingSession(true);

      const res = await fetch("/api/teachers/attendance/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId,
          scheduleId: slotSelected.scheduleId,
          slotIndex: slotSelected.slotIndex,
          fecha,
        }),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error ?? "Error al crear asistencia");

      setSessionId(data?.sessionId ?? "");
      setMessage(
        data?.created
          ? "Asistencia creada. Ahora marca a los estudiantes."
          : "La asistencia de hoy ya estaba creada. Puedes actualizarla."
      );
    } catch (e: any) {
      setError(e?.message ?? "Error al crear asistencia");
    } finally {
      setSavingSession(false);
    }
  };

  const saveAttendance = async () => {
    try {
      setError(null);
      setMessage(null);

      if (!sessionId) {
        setError("Primero debes crear la asistencia del día");
        return;
      }

      setSaving(true);

      const registros = students.map((s) => ({
        studentId: s.id,
        estado: estadoByStudent[s.id] ?? "PRESENTE",
        justificativo: justByStudent[s.id] ?? "",
      }));

      const res = await fetch("/api/teachers/attendance/records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, registros }),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error ?? "Error al guardar asistencia");

      setMessage("Asistencia guardada correctamente");
    } catch (e: any) {
      setError(e?.message ?? "Error al guardar asistencia");
    } finally {
      setSaving(false);
    }
  };

  const fullName = (s: Student) => {
    if (s.nombreCompleto) return s.nombreCompleto;
    const ap = [s.primerApellido, s.segundoApellido].filter(Boolean).join(" ").trim();
    return `${s.nombre ?? ""} ${ap}`.trim() || s.id;
  };

  if (!courseId) {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-100 p-6">
        <div className="max-w-3xl mx-auto">
          <div className="bg-red-950/40 border border-red-900 text-red-200 rounded-lg p-3 text-sm">
            courseId es undefined. Revisa la ruta: /teacher/courses/[courseId]
          </div>
          <div className="mt-4">
            <Link
              href="/teacher"
              className="bg-slate-800 hover:bg-slate-700 text-slate-100 px-4 py-2 rounded border border-slate-700"
            >
              Volver
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">Curso</h1>
            <p className="text-sm text-slate-400">Registra asistencia del día.</p>
          </div>

          <Link
            href="/teacher"
            className="bg-slate-800 hover:bg-slate-700 text-slate-100 px-4 py-2 rounded border border-slate-700"
          >
            Volver
          </Link>
        </div>

        {(error || message) && (
          <div
            className={
              error
                ? "bg-red-950/40 border border-red-900 text-red-200 rounded-lg p-3 text-sm"
                : "bg-emerald-950/40 border border-emerald-900 text-emerald-200 rounded-lg p-3 text-sm"
            }
          >
            {error ?? message}
          </div>
        )}

        <section className="bg-slate-900 border border-slate-800 rounded-lg p-4 space-y-3">
          <h2 className="font-semibold">1) Crear asistencia del día</h2>

          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="block text-sm text-slate-300 mb-1">Fecha</label>
              <input
                type="date"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                className="bg-slate-950 border border-slate-700 rounded p-2 w-full text-slate-100"
              />
              {dia && <div className="text-xs text-slate-500 mt-1">Día: {dia}</div>}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm text-slate-300 mb-1">
                Hora (según horario asignado en admin)
              </label>

              {loadingSlots ? (
                <div className="text-sm text-slate-400">Cargando horarios...</div>
              ) : slots.length === 0 ? (
                <div className="text-sm text-slate-400">
                  No tienes horarios para este curso en la fecha seleccionada.
                </div>
              ) : (
                <div className="grid gap-2">
                  {slots.map((it) => {
                    const key = `${it.scheduleId}::${it.slotIndex}`;
                    return (
                      <label
                        key={key}
                        className="flex items-center gap-2 bg-slate-950/40 border border-slate-800 rounded p-2 text-sm"
                      >
                        <input
                          type="radio"
                          name="slot"
                          checked={selectedSlotKey === key}
                          onChange={() => setSelectedSlotKey(key)}
                        />
                        <div className="flex-1">
                          <div className="text-slate-100">
                            {it.inicio} - {it.fin}
                            {it.subjectNombre ? ` — ${it.subjectNombre}` : ""}
                          </div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <button
            onClick={createSession}
            disabled={savingSession || loadingSlots || slots.length === 0}
            className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50"
          >
            {savingSession ? "Creando..." : sessionId ? "Recrear/Verificar asistencia" : "Crear asistencia"}
          </button>
        </section>

        <section className="bg-slate-900 border border-slate-800 rounded-lg p-4 space-y-3">
          <h2 className="font-semibold">2) Marcar estudiantes</h2>

          {!sessionId ? (
            <div className="text-sm text-slate-400">
              Primero crea la asistencia del día para habilitar el registro.
            </div>
          ) : loadingStudents ? (
            <div className="text-sm text-slate-400">Cargando estudiantes...</div>
          ) : students.length === 0 ? (
            <div className="text-sm text-slate-400">No hay estudiantes inscritos en este curso.</div>
          ) : (
            <div className="overflow-hidden border border-slate-800 rounded-lg">
              <table className="w-full text-sm">
                <thead className="bg-slate-950/50">
                  <tr>
                    <th className="text-left p-3 text-slate-200">Estudiante</th>
                    <th className="text-left p-3 text-slate-200 w-56">Asistencia</th>
                    <th className="text-left p-3 text-slate-200">Justificativo</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((s) => {
                    const estado = estadoByStudent[s.id] ?? "PRESENTE";
                    return (
                      <tr key={s.id} className="border-t border-slate-800">
                        <td className="p-3 text-slate-100">{fullName(s)}</td>
                        <td className="p-3">
                          <select
                            value={estado}
                            onChange={(e) =>
                              setEstadoByStudent((prev) => ({
                                ...prev,
                                [s.id]: e.target.value as Estado,
                              }))
                            }
                            className="bg-slate-950 border border-slate-700 rounded p-2 w-full text-slate-100"
                          >
                            <option value="PRESENTE">Presente</option>
                            <option value="AUSENTE">Ausente</option>
                            <option value="JUSTIFICADO">Justificado</option>
                          </select>
                        </td>
                        <td className="p-3">
                          {estado === "JUSTIFICADO" ? (
                            <input
                              value={justByStudent[s.id] ?? ""}
                              onChange={(e) =>
                                setJustByStudent((prev) => ({
                                  ...prev,
                                  [s.id]: e.target.value,
                                }))
                              }
                              placeholder="Motivo"
                              className="bg-slate-950 border border-slate-700 rounded p-2 w-full text-slate-100"
                            />
                          ) : (
                            <span className="text-slate-600">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          <button
            onClick={saveAttendance}
            disabled={saving || !sessionId || loadingStudents || students.length === 0}
            className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded disabled:opacity-50"
          >
            {saving ? "Guardando..." : "Guardar asistencia"}
          </button>
        </section>
      </div>
    </main>
  );
}
