"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/Auth/AuthContext";
import { db } from "@/lib/firebase";
import {
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";

type Gestion = {
  id: string;
  anio: number;
  isActive?: boolean;
};

type ClassGroup = {
  id: string;
  courseId: string;
  subjectName: string;
  subjectSigla: string;
  courseName: string;
  courseParalelo?: string;
};

type StudentItem = {
  inscriptionId: string;
  studentId: string;
  student: {
    id: string;
    nombre?: string;
    apellido?: string;
    [key: string]: any;
  } | null;
};

type AttendanceEstado = "PRESENTE" | "AUSENTE" | "ATRASO" | "JUSTIFICADO";

type AttendanceRecord = {
  estado: AttendanceEstado;
  minutosRetraso?: number;
  justificativo?: string;
};

export default function TeacherAttendancePage() {
  const { user, loading } = useAuth();

  const [gestionActiva, setGestionActiva] = useState<Gestion | null>(null);
  const [classGroups, setClassGroups] = useState<ClassGroup[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string>("");

  const [students, setStudents] = useState<StudentItem[]>([]);
  const [attendance, setAttendance] = useState<Record<string, AttendanceRecord>>(
    {}
  );

  const [fecha, setFecha] = useState<string>(() => {
    const today = new Date();
    return today.toISOString().slice(0, 10);
  });
  const [tema, setTema] = useState<string>("");

  const [loadingPage, setLoadingPage] = useState(true);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [savingAttendance, setSavingAttendance] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      try {
        if (!user) return;

        const resp = await fetch("/api/gestiones");
        const data = await resp.json();
        if (!resp.ok) {
          setError(data.error || "Error al obtener gestiones");
          return;
        }

        const gestiones: Gestion[] = data.gestiones || [];
        const activa = gestiones.find(g => g.isActive);
        if (!activa) {
          setError("No hay una gestión activa configurada");
          return;
        }
        setGestionActiva(activa);

        const qGroups = query(
          collection(db, "classGroups"),
          where("teacherId", "==", user.uid),
          where("gestionId", "==", activa.id)
        );

        const snap = await getDocs(qGroups);
        const groups: ClassGroup[] = snap.docs.map(d => ({
          id: d.id,
          ...(d.data() as any),
        }));

        setClassGroups(groups);
      } catch (e: any) {
        console.error(e);
        setError(e.message ?? "Error cargando datos iniciales");
      } finally {
        setLoadingPage(false);
      }
    };

    if (!loading) {
      if (user) init();
      else setLoadingPage(false);
    }
  }, [user, loading]);

  const loadStudentsForGroup = async (groupId: string) => {
    try {
      setError(null);
      setMessage(null);
      setLoadingStudents(true);

      const group = classGroups.find(g => g.id === groupId);
      if (!group || !gestionActiva) {
        setError("Grupo o gestión no válidos");
        return;
      }

      const params = new URLSearchParams({
        courseId: group.courseId,
        gestionId: gestionActiva.id,
      });

      const resp = await fetch(`/api/inscriptions/by-course?${params.toString()}`);
      const data = await resp.json();

      if (!resp.ok) {
        setError(data.error || "Error al obtener estudiantes del curso");
        return;
      }

      const list: StudentItem[] = data.students || [];
      setStudents(list);

      const initialAttendance: Record<string, AttendanceRecord> = {};
      list.forEach(item => {
        initialAttendance[item.studentId] = { estado: "PRESENTE" };
      });
      setAttendance(initialAttendance);
    } catch (e: any) {
      console.error(e);
      setError(e.message ?? "Error al cargar estudiantes");
    } finally {
      setLoadingStudents(false);
    }
  };

  const handleSelectGroup = (groupId: string) => {
    setSelectedGroupId(groupId);
    setStudents([]);
    setAttendance({});
    if (groupId) {
      loadStudentsForGroup(groupId);
    }
  };

  const handleChangeEstado = (
    studentId: string,
    estado: AttendanceEstado
  ) => {
    setAttendance(prev => ({
      ...prev,
      [studentId]: {
        ...(prev[studentId] || {}),
        estado,
      },
    }));
  };

  const handleChangeMinutos = (studentId: string, value: number) => {
    setAttendance(prev => ({
      ...prev,
      [studentId]: {
        ...(prev[studentId] || { estado: "ATRASO" }),
        minutosRetraso: value,
      },
    }));
  };

  const handleChangeJustificativo = (studentId: string, value: string) => {
    setAttendance(prev => ({
      ...prev,
      [studentId]: {
        ...(prev[studentId] || { estado: "JUSTIFICADO" }),
        justificativo: value,
      },
    }));
  };

  const handleGuardarAsistencia = async () => {
    try {
      setError(null);
      setMessage(null);

      if (!user) {
        setError("Usuario no autenticado");
        return;
      }
      if (!selectedGroupId) {
        setError("Debes seleccionar un grupo de clase");
        return;
      }
      if (!fecha) {
        setError("Debes seleccionar la fecha");
        return;
      }
      if (!tema) {
        setError("Debes ingresar el tema de la sesión");
        return;
      }
      if (!students.length) {
        setError("No hay estudiantes cargados para este curso");
        return;
      }

      const registros = students.map(s => {
        const rec = attendance[s.studentId] || { estado: "PRESENTE" };
        return {
          studentId: s.studentId,
          estado: rec.estado,
          minutosRetraso:
            rec.estado === "ATRASO" ? rec.minutosRetraso ?? 0 : undefined,
          justificativo: rec.justificativo ?? "",
        };
      });

      setSavingAttendance(true);

      const resp = await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userUid: user.uid,
          groupId: selectedGroupId,
          fecha,
          tema,
          registros,
        }),
      });

      const data = await resp.json();
      if (!resp.ok) {
        setError(data.error || "Error al guardar asistencia");
        return;
      }

      setMessage("Asistencia registrada correctamente");
    } catch (e: any) {
      console.error(e);
      setError(e.message ?? "Error al guardar asistencia");
    } finally {
      setSavingAttendance(false);
    }
  };

  if (loadingPage) {
    return <div className="p-6">Cargando...</div>;
  }

  if (!user) {
    return <div className="p-6 text-red-600">Debes iniciar sesión.</div>;
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 p-6 space-y-6">
      <h1 className="text-2xl font-bold text-slate-900 mb-2">
        Asistencia de clases
      </h1>

      {gestionActiva ? (
        <p className="text-sm text-slate-600">
          Gestión activa: <strong>{gestionActiva.anio}</strong>
        </p>
      ) : (
        <p className="text-sm text-red-600">
          No hay gestión activa. Pídele al administrador que configure una.
        </p>
      )}

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded">
          {error}
        </div>
      )}

      {message && (
        <div className="p-3 bg-green-50 border border-green-200 text-green-700 text-sm rounded">
          {message}
        </div>
      )}

      <section className="border rounded-lg p-4 bg-white shadow-sm space-y-3">
        <h2 className="text-sm font-semibold text-slate-800">
          1. Selecciona un curso de clase
        </h2>

        {classGroups.length === 0 && (
          <p className="text-sm text-slate-500">
            No tienes curso asignados en esta gestión.
          </p>
        )}

        <select
          value={selectedGroupId}
          onChange={e => handleSelectGroup(e.target.value)}
          className="mt-1 w-full border rounded-md text-sm px-2 py-2"
        >
          <option value="">Selecciona grupo</option>
          {classGroups.map(g => (
            <option key={g.id} value={g.id}>
              {g.subjectSigla} - {g.subjectName} | {g.courseName}{" "}
              {g.courseParalelo ? `(${g.courseParalelo})` : ""}
            </option>
          ))}
        </select>
      </section>

      <section className="border rounded-lg p-4 bg-white shadow-sm space-y-3">
        <h2 className="text-sm font-semibold text-slate-800">
          2. Datos de la sesión
        </h2>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700">
              Fecha
            </label>
            <input
              type="date"
              value={fecha}
              onChange={e => setFecha(e.target.value)}
              className="mt-1 w-full border rounded-md text-sm px-2 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">
              Tema / contenidos
            </label>
            <input
              type="text"
              value={tema}
              onChange={e => setTema(e.target.value)}
              className="mt-1 w-full border rounded-md text-sm px-2 py-2"
              placeholder="Tema tratado en clase"
            />
          </div>
        </div>
      </section>

      <section className="border rounded-lg p-4 bg-white shadow-sm space-y-3">
        <h2 className="text-sm font-semibold text-slate-800">
          3. Marcar asistencia
        </h2>

        {loadingStudents && (
          <p className="text-sm text-slate-500">Cargando estudiantes...</p>
        )}

        {!loadingStudents && students.length === 0 && (
          <p className="text-sm text-slate-500">
            Selecciona un grupo para ver sus estudiantes.
          </p>
        )}

        {students.length > 0 && (
          <div className="space-y-2">
            {students.map(item => {
              const s = item.student;
              const fullName = s
                ? `${s.nombre ?? ""} ${s.apellido ?? ""}`.trim() ||
                  s.id
                : item.studentId;

              const rec = attendance[item.studentId] || { estado: "PRESENTE" };

              return (
                <div
                  key={item.studentId}
                  className="flex flex-col md:flex-row md:items-center md:justify-between border rounded-md px-3 py-2 text-sm gap-2"
                >
                  <div className="font-medium">{fullName}</div>

                  <div className="flex flex-wrap gap-3 items-center">
                    <select
                      value={rec.estado}
                      onChange={e =>
                        handleChangeEstado(
                          item.studentId,
                          e.target.value as AttendanceEstado
                        )
                      }
                      className="border rounded-md text-xs px-2 py-1.5"
                    >
                      <option value="PRESENTE">Presente</option>
                      <option value="AUSENTE">Ausente</option>
                      <option value="ATRASO">Atraso</option>
                      <option value="JUSTIFICADO">Justificado</option>
                    </select>

                    {rec.estado === "ATRASO" && (
                      <input
                        type="number"
                        min={0}
                        placeholder="Minutos"
                        value={rec.minutosRetraso ?? ""}
                        onChange={e =>
                          handleChangeMinutos(
                            item.studentId,
                            Number(e.target.value) || 0
                          )
                        }
                        className="border rounded-md text-xs px-2 py-1.5 w-24"
                      />
                    )}

                    {(rec.estado === "JUSTIFICADO" ||
                      rec.estado === "AUSENTE") && (
                      <input
                        type="text"
                        placeholder="Justificativo"
                        value={rec.justificativo ?? ""}
                        onChange={e =>
                          handleChangeJustificativo(
                            item.studentId,
                            e.target.value
                          )
                        }
                        className="border rounded-md text-xs px-2 py-1.5 md:w-64"
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <div>
        <button
          onClick={handleGuardarAsistencia}
          disabled={savingAttendance}
          className="px-4 py-2 rounded-md bg-slate-900 text-white text-sm disabled:opacity-60"
        >
          {savingAttendance ? "Guardando asistencia..." : "Guardar asistencia"}
        </button>
      </div>
    </div>
  );
}
