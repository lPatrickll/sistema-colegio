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
  estado: string;
  isActive?: boolean;
};

type Course = {
  id: string;
  nombre: string;
  paralelo: string;
  gestionId?: string;
};

type Subject = {
  id: string;
  nombre: string;
  sigla: string;
};

type Teacher = {
  id: string;
  nombre: string;
  apellido: string;
};

type ScheduleInput = {
  diaSemana: string;
  horaInicio: string;
  horaFin: string;
};

type ClassSchedule = {
  id: string;
  groupId: string;
  diaSemana: string;
  horaInicio: string;
  horaFin: string;
  courseId: string;
  subjectId: string;
};

type ClassGroup = {
  id: string;
  gestionId: string;
  courseId: string;
  subjectId: string;
  teacherId: string;
  horasSemana: number;
  courseName: string;
  courseParalelo?: string;
  subjectName: string;
  subjectSigla: string;
  teacherName: string;
  schedules: ClassSchedule[];
};

type CourseTimetable = {
  courseId: string;
  courseName: string;
  courseParalelo?: string;
  groups: ClassGroup[];
};


export default function AdminGestionPage() {
  const { user, loading } = useAuth();

  const [gestiones, setGestiones] = useState<Gestion[]>([]);
  const [activeGestionId, setActiveGestionId] = useState<string | null>(null);
  const [anioNuevo, setAnioNuevo] = useState<number | undefined>();

  const [courses, setCourses] = useState<Course[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);

  const [selectedGestionId, setSelectedGestionId] = useState<string>("");
  const [selectedCourseId, setSelectedCourseId] = useState<string>("");
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>("");
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>("");
  const [horasSemana, setHorasSemana] = useState<number>(2);
  const [schedules, setSchedules] = useState<ScheduleInput[]>([]);

  const [newSchedule, setNewSchedule] = useState<ScheduleInput>({
    diaSemana: "LUNES",
    horaInicio: "08:00",
    horaFin: "08:45",
  });

  const [loadingPage, setLoadingPage] = useState(true);
  const [savingGestion, setSavingGestion] = useState(false);
  const [savingGroup, setSavingGroup] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const [courseTimetables, setCourseTimetables] = useState<CourseTimetable[]>([]);
  const [openCourseIds, setOpenCourseIds] = useState<string[]>([]);
  const [loadingTimetable, setLoadingTimetable] = useState(false);

  const fetchTimetableForGestion = async (gestionId: string) => {
    try {
      setLoadingTimetable(true);

      const groupsSnap = await getDocs(
        query(
          collection(db, "classGroups"),
          where("gestionId", "==", gestionId)
        )
      );

      const groupsRaw = groupsSnap.docs.map(docSnap => ({
        id: docSnap.id,
        ...(docSnap.data() as any),
      }));

      if (groupsRaw.length === 0) {
        setCourseTimetables([]);
        return;
      }

      const groupIds = groupsRaw.map(g => g.id as string);
      let allSchedules: ClassSchedule[] = [];

      for (let i = 0; i < groupIds.length; i += 10) {
        const chunk = groupIds.slice(i, i + 10);
        const schedSnap = await getDocs(
          query(
            collection(db, "classSchedules"),
            where("groupId", "in", chunk)
          )
        );

        const schedChunk: ClassSchedule[] = schedSnap.docs.map(docSnap => ({
          id: docSnap.id,
          ...(docSnap.data() as any),
        })) as any;

        allSchedules = allSchedules.concat(schedChunk);
      }

      const schedulesByGroup: Record<string, ClassSchedule[]> = {};
      allSchedules.forEach(s => {
        if (!schedulesByGroup[s.groupId]) {
          schedulesByGroup[s.groupId] = [];
        }
        schedulesByGroup[s.groupId].push(s);
      });

      const groups: ClassGroup[] = groupsRaw.map(g => ({
        ...(g as any),
        schedules: schedulesByGroup[g.id] || [],
      }));

      const byCourse: Record<string, CourseTimetable> = {};

      groups.forEach(g => {
        if (!byCourse[g.courseId]) {
          byCourse[g.courseId] = {
            courseId: g.courseId,
            courseName: g.courseName,
            courseParalelo: g.courseParalelo,
            groups: [],
          };
        }
        byCourse[g.courseId].groups.push(g);
      });

      const list = Object.values(byCourse).sort((a, b) =>
        (a.courseName + (a.courseParalelo || "")).localeCompare(
          b.courseName + (b.courseParalelo || "")
        )
      );

      setCourseTimetables(list);
    } catch (err: any) {
      console.error(err);
      setError(err.message ?? "Error cargando horarios de la gestión");
    } finally {
      setLoadingTimetable(false);
    }
  };

  useEffect(() => {
    if (!selectedGestionId) {
      setCourseTimetables([]);
      return;
    }
    fetchTimetableForGestion(selectedGestionId);
  }, [selectedGestionId]);


  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!user) return;

        const resp = await fetch("/api/gestiones");
        const data = await resp.json();
        if (resp.ok) {
          const list = (data.gestiones || []) as Gestion[];
          setGestiones(list);

          const activa = list.find(g => g.isActive);
          if (activa) {
            setActiveGestionId(activa.id);
            setSelectedGestionId(activa.id);
          }
        }

        const coursesSnap = await getDocs(collection(db, "courses"));
        const coursesArr: Course[] = coursesSnap.docs.map(d => ({
          id: d.id,
          ...(d.data() as any),
        }));
        setCourses(coursesArr);

        const subjectsSnap = await getDocs(collection(db, "subjects"));
        const subjectsArr: Subject[] = subjectsSnap.docs.map(d => ({
          id: d.id,
          ...(d.data() as any),
        }));
        setSubjects(subjectsArr);

        const teachersSnap = await getDocs(collection(db, "teachers"));
        const teachersArr: Teacher[] = teachersSnap.docs.map(d => ({
          id: d.id,
          ...(d.data() as any),
        }));
        setTeachers(teachersArr);
      } catch (e: any) {
        console.error(e);
        setError(e.message ?? "Error cargando datos");
      } finally {
        setLoadingPage(false);
      }
    };

    if (!loading) {
      if (user) fetchData();
      else setLoadingPage(false);
    }
  }, [user, loading]);

  const handleCrearGestion = async () => {
    try {
      setError(null);
      setMessage(null);
      if (!user) {
        setError("Usuario no autenticado");
        return;
      }
      if (!anioNuevo) {
        setError("Debes ingresar un año");
        return;
      }

      setSavingGestion(true);

      const resp = await fetch("/api/gestiones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          adminUid: user.uid,
          anio: anioNuevo,
        }),
      });

      const data = await resp.json();

      if (!resp.ok) {
        setError(data.error || "Error al crear gestión");
        return;
      }

      setGestiones(prev => [
        ...prev,
        {
          id: data.id,
          anio: anioNuevo,
          estado: "PLANIFICADA",
          isActive: false,
        },
      ]);

      setMessage("Gestión creada correctamente");
      setAnioNuevo(undefined);
    } catch (e: any) {
      console.error(e);
      setError(e.message ?? "Error al crear gestión");
    } finally {
      setSavingGestion(false);
    }
  };

  const handleActivarGestion = async (gestionId: string) => {
    try {
      setError(null);
      setMessage(null);
      if (!user) {
        setError("Usuario no autenticado");
        return;
      }

      const resp = await fetch("/api/gestiones/activar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          adminUid: user.uid,
          gestionId,
        }),
      });

      const data = await resp.json();
      if (!resp.ok) {
        setError(data.error || "Error al activar gestión");
        return;
      }

      setGestiones(prev =>
        prev.map(g => {
          if (g.id === gestionId) {
            return { ...g, isActive: true, estado: "ACTIVA" };
          }
          return { ...g, isActive: false, estado: "CERRADA" };
        })
      );

      setActiveGestionId(gestionId);
      setSelectedGestionId(gestionId);
      setMessage("Gestión activada correctamente");
    } catch (e: any) {
      console.error(e);
      setError(e.message ?? "Error al activar gestión");
    }
  };

  const handleAddSchedule = () => {
    if (!newSchedule.diaSemana || !newSchedule.horaInicio || !newSchedule.horaFin) {
      setError("Completa los datos del horario");
      return;
    }
    setSchedules(prev => [...prev, newSchedule]);
    setNewSchedule({
      diaSemana: "LUNES",
      horaInicio: "08:00",
      horaFin: "08:45",
    });
  };

  const handleRemoveSchedule = (index: number) => {
    setSchedules(prev => prev.filter((_, i) => i !== index));
  };

  const handleCrearGrupoClase = async () => {
    try {
      setError(null);
      setMessage(null);

      if (!user) {
        setError("Usuario no autenticado");
        return;
      }

      if (!selectedGestionId || !selectedCourseId || !selectedSubjectId || !selectedTeacherId) {
        setError("Debes seleccionar gestión, curso, materia y docente");
        return;
      }

      if (!schedules.length) {
        setError("Debes agregar al menos un horario");
        return;
      }

      setSavingGroup(true);

      const resp = await fetch("/api/class-groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          adminUid: user.uid,
          gestionId: selectedGestionId,
          courseId: selectedCourseId,
          subjectId: selectedSubjectId,
          teacherId: selectedTeacherId,
          horasSemana,
          schedules,
        }),
      });

      const data = await resp.json();
      if (!resp.ok) {
        setError(data.error || "Error al crear grupo de clase");
        return;
      }

      setMessage("Grupo de clase creado correctamente");
      setSchedules([]);
      setSelectedCourseId("");
      setSelectedSubjectId("");
      setSelectedTeacherId("");
      setHorasSemana(2);
      if (selectedGestionId) {
        await fetchTimetableForGestion(selectedGestionId);
      }
    } catch (e: any) {
      console.error(e);
      setError(e.message ?? "Error al crear grupo de clase");
    } finally {
      setSavingGroup(false);
    }
  };

  if (loadingPage) {
    return <div className="p-6">Cargando...</div>;
  }

  if (!user) {
    return <div className="p-6 text-red-600">Debes iniciar sesión.</div>;
  }

  return (
    <div className="p-6 space-y-8">
      <h1 className="text-2xl font-bold mb-2 text-slate-900">
        Gestión del año escolar
      </h1>
      <p className="text-sm text-slate-600">
        Configura gestiones académicas, cursos, materias, docentes y horarios.
      </p>

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
        <h2 className="font-semibold text-slate-900">Gestiones académicas</h2>

        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="block text-sm font-medium text-slate-700">
              Año nuevo
            </label>
            <input
              type="number"
              value={anioNuevo ?? ""}
              onChange={e => setAnioNuevo(e.target.value ? Number(e.target.value) : undefined)}
              className="mt-1 px-3 py-2 border rounded-md text-sm text-slate-900"
              placeholder="2025"
            />
          </div>

          <button
            onClick={handleCrearGestion}
            disabled={savingGestion}
            className="px-4 py-2 rounded-md bg-slate-900 text-white text-sm mt-4 disabled:opacity-60"
          >
            {savingGestion ? "Creando..." : "Crear gestión"}
          </button>
        </div>

        <div className="mt-4">
          <h3 className="text-sm font-semibold text-slate-800 mb-2">
            Gestiones registradas
          </h3>
          <div className="space-y-2">
            {gestiones.length === 0 && (
              <p className="text-sm text-slate-500">No hay gestiones registradas.</p>
            )}
            {gestiones.map(g => (
              <div
                key={g.id}
                className="flex items-center justify-between border rounded-md px-3 py-2 text-sm"
              >
                <div>
                  <div className="font-medium text-slate-900">
                    {g.anio}{" "}
                    {g.isActive && (
                      <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded bg-green-100 text-green-700 text-xs">
                        ACTIVA
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-500">Estado: {g.estado}</div>
                </div>
                {!g.isActive && (
                  <button
                    onClick={() => handleActivarGestion(g.id)}
                    className="px-3 py-1 rounded-md border text-xs hover:bg-slate-50"
                  >
                    Activar
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border rounded-lg p-4 bg-white shadow-sm space-y-4">
        <h2 className="font-semibold text-slate-900">
          Configurar grupos de clase (curso + materia + docente + horarios)
        </h2>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700">
              Gestión
            </label>
            <select
              value={selectedGestionId}
              onChange={e => setSelectedGestionId(e.target.value)}
              className="mt-1 w-full border rounded-md text-sm px-2 py-2 text-slate-900"
            >
              <option value="">Selecciona gestión</option>
              {gestiones.map(g => (
                <option key={g.id} value={g.id}>
                  {g.anio} {g.isActive ? "(ACTIVA)" : ""}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">
              Curso
            </label>
            <select
              value={selectedCourseId}
              onChange={e => setSelectedCourseId(e.target.value)}
              className="mt-1 w-full border rounded-md text-sm px-2 py-2 text-slate-900"
            >
              <option value="">Selecciona curso</option>
              {courses.map(c => (
                <option key={c.id} value={c.id}>
                  {c.nombre} {c.paralelo ? `- ${c.paralelo}` : ""}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">
              Materia
            </label>
            <select
              value={selectedSubjectId}
              onChange={e => setSelectedSubjectId(e.target.value)}
              className="mt-1 w-full border rounded-md text-sm px-2 py-2 text-slate-900"
            >
              <option value="">Selecciona materia</option>
              {subjects.map(s => (
                <option key={s.id} value={s.id}>
                  {s.sigla} - {s.nombre}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">
              Docente
            </label>
            <select
              value={selectedTeacherId}
              onChange={e => setSelectedTeacherId(e.target.value)}
              className="mt-1 w-full border rounded-md text-sm px-2 py-2 text-slate-900"
            >
              <option value="">Selecciona docente</option>
              {teachers.map(t => (
                <option key={t.id} value={t.id}>
                  {t.nombre} {t.apellido}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">
              Horas por semana
            </label>
            <input
              type="number"
              value={horasSemana}
              onChange={e => setHorasSemana(Number(e.target.value) || 0)}
              className="mt-1 w-full border rounded-md text-sm px-2 py-2 text-slate-900"
              min={1}
            />
          </div>
        </div>

        <div className="mt-4 border-t pt-4 space-y-3">
          <h3 className="text-sm font-semibold text-slate-800">
            Horarios del grupo
          </h3>

          <div className="flex flex-wrap gap-3 items-end">
            <div>
              <label className="block text-xs font-medium text-slate-700">
                Día
              </label>
              <select
                value={newSchedule.diaSemana}
                onChange={e =>
                  setNewSchedule(prev => ({ ...prev, diaSemana: e.target.value }))
                }
                className="mt-1 border rounded-md text-sm px-2 py-1.5 text-slate-900"
              >
                <option value="LUNES">Lunes</option>
                <option value="MARTES">Martes</option>
                <option value="MIERCOLES">Miércoles</option>
                <option value="JUEVES">Jueves</option>
                <option value="VIERNES">Viernes</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700">
                Hora inicio
              </label>
              <input
                type="time"
                value={newSchedule.horaInicio}
                onChange={e =>
                  setNewSchedule(prev => ({ ...prev, horaInicio: e.target.value }))
                }
                className="mt-1 border rounded-md text-sm px-2 py-1.5 text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700">
                Hora fin
              </label>
              <input
                type="time"
                value={newSchedule.horaFin}
                onChange={e =>
                  setNewSchedule(prev => ({ ...prev, horaFin: e.target.value }))
                }
                className="mt-1 border rounded-md text-sm px-2 py-1.5 text-slate-900"
              />
            </div>

            <button
              type="button"
              onClick={handleAddSchedule}
              className="px-3 py-2 rounded-md border text-xs mt-4 bg-white text-slate-900 hover:bg-slate-900 hover:text-white"
            >
              Agregar horario
            </button>
          </div>

          <div className="space-y-1">
            {schedules.length === 0 && (
              <p className="text-xs text-slate-500">
                Aún no agregaste horarios para este grupo.
              </p>
            )}

            {schedules.map((s, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between text-xs border rounded-md px-2 py-1.5 text-slate-900"
              >
                <span>
                  {s.diaSemana} {s.horaInicio} - {s.horaFin}
                </span>
                <button
                  onClick={() => handleRemoveSchedule(idx)}
                  className="text-red-500 hover:underline"
                >
                  Quitar
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="pt-2">
          <button
            onClick={handleCrearGrupoClase}
            disabled={savingGroup}
            className="px-4 py-2 rounded-md bg-slate-900 text-white text-sm disabled:opacity-60"
          >
            {savingGroup ? "Guardando..." : "Crear grupo de clase"}
          </button>
        </div>
      </section>

      <section className="border rounded-lg p-4 bg-white shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-slate-900">
            Horario por curso (vista colegio)
          </h2>
          <span className="text-xs text-slate-500">
            Gestión:{" "}
            {gestiones.find(g => g.id === selectedGestionId)?.anio ?? "-"}
          </span>
        </div>

        {!selectedGestionId && (
          <p className="text-sm text-slate-500">
            Selecciona una gestión para ver los horarios de los cursos.
          </p>
        )}

        {selectedGestionId && (
          <>
            {loadingTimetable ? (
              <p className="text-sm text-slate-500">Cargando horarios...</p>
            ) : courseTimetables.length === 0 ? (
              <p className="text-sm text-slate-500">
                Aún no registraste grupos de clase para esta gestión.
              </p>
            ) : (
              <div className="space-y-2">
                {courseTimetables.map(course => {
                  const isOpen = openCourseIds.includes(course.courseId);

                  return (
                    <div key={course.courseId} className="border rounded-md">
                      <button
                        type="button"
                        onClick={() =>
                          setOpenCourseIds(prev =>
                            prev.includes(course.courseId)
                              ? prev.filter(id => id !== course.courseId)
                              : [...prev, course.courseId]
                          )
                        }
                        className="w-full flex items-center justify-between px-3 py-2 text-sm bg-slate-50 hover:bg-slate-100"
                      >
                        <span className="font-medium text-slate-900">
                          {course.courseName}{" "}
                          {course.courseParalelo
                            ? `- ${course.courseParalelo}`
                            : ""}
                        </span>
                        <span className="text-xs text-slate-500">
                          {isOpen ? "Ocultar horario ▲" : "Ver horario ▼"}
                        </span>
                      </button>

                      {isOpen && (
                        <div className="p-3 bg-white border-t">
                          <table className="w-full text-xs border-collapse">
                            <thead>
                              <tr className="bg-slate-50">
                                <th className="border px-2 py-1 text-left text-slate-700">
                                  Día
                                </th>
                                <th className="border px-2 py-1 text-left text-slate-700">
                                  Clases
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {["LUNES", "MARTES", "MIERCOLES", "JUEVES", "VIERNES"].map(
                                day => {
                                  const dayLabelMap: Record<string, string> = {
                                    LUNES: "Lunes",
                                    MARTES: "Martes",
                                    MIERCOLES: "Miércoles",
                                    JUEVES: "Jueves",
                                    VIERNES: "Viernes",
                                  };

                                  const slots = course.groups
                                    .flatMap(g =>
                                      (g.schedules || []).map(s => ({
                                        ...s,
                                        group: g,
                                      }))
                                    )
                                    .filter(s => s.diaSemana === day)
                                    .sort((a, b) =>
                                      a.horaInicio.localeCompare(b.horaInicio)
                                    );

                                  return (
                                    <tr key={day}>
                                      <td className="border px-2 py-1 align-top font-medium text-slate-700">
                                        {dayLabelMap[day] ?? day}
                                      </td>
                                      <td className="border px-2 py-1">
                                        {slots.length === 0 ? (
                                          <span className="text-slate-400">
                                            Sin clases registradas
                                          </span>
                                        ) : (
                                          <div className="space-y-1">
                                            {slots.map(slot => (
                                              <div
                                                key={slot.id}
                                                className="px-2 py-1 rounded bg-slate-50 border text-slate-900"
                                              >
                                                <div className="font-medium">
                                                  {slot.group.subjectName}
                                                </div>
                                                <div className="text-[11px] text-slate-600">
                                                  {slot.horaInicio} - {slot.horaFin} ·{" "}
                                                  {slot.group.teacherName}
                                                </div>
                                              </div>
                                            ))}
                                          </div>
                                        )}
                                      </td>
                                    </tr>
                                  );
                                }
                              )}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </section>

    </div>
  );
}
