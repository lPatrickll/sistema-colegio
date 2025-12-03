"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/Auth/AuthContext";
import { db } from "@/lib/firebase";
import {
  collection,
  getDocs,
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
  paralelo?: string;
};

type Student = {
  id: string;
  nombre?: string;
  apellido?: string;
  ci?: string;
};

export default function AdminInscriptionsPage() {
  const { user, loading } = useAuth();

  const [gestiones, setGestiones] = useState<Gestion[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [students, setStudents] = useState<Student[]>([]);

  const [selectedGestionId, setSelectedGestionId] = useState<string>("");
  const [selectedCourseId, setSelectedCourseId] = useState<string>("");
  const [selectedStudentId, setSelectedStudentId] = useState<string>("");
  const [tipoInscripcion, setTipoInscripcion] = useState<string>("REGULAR");

  const [loadingPage, setLoadingPage] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!user) return;

        const resp = await fetch("/api/gestiones");
        const data = await resp.json();
        if (resp.ok) {
          const list: Gestion[] = data.gestiones || [];
          setGestiones(list);
          const activa = list.find(g => g.isActive);
          if (activa) setSelectedGestionId(activa.id);
        } else {
          setError(data.error || "Error al cargar gestiones");
        }

        const coursesSnap = await getDocs(collection(db, "courses"));
        const coursesArr: Course[] = coursesSnap.docs.map(d => ({
          id: d.id,
          ...(d.data() as any),
        }));
        setCourses(coursesArr);

        const studentsSnap = await getDocs(collection(db, "students"));
        const studentsArr: Student[] = studentsSnap.docs.map(d => ({
          id: d.id,
          ...(d.data() as any),
        }));
        setStudents(studentsArr);
      } catch (e: any) {
        console.error(e);
        setError(e.message ?? "Error al cargar datos");
      } finally {
        setLoadingPage(false);
      }
    };

    if (!loading) {
      if (user) fetchData();
      else setLoadingPage(false);
    }
  }, [user, loading]);

  const handleInscribir = async () => {
    try {
      setError(null);
      setMessage(null);

      if (!user) {
        setError("Usuario no autenticado");
        return;
      }

      if (!selectedGestionId || !selectedCourseId || !selectedStudentId) {
        setError("Debes elegir gestión, curso y estudiante");
        return;
      }

      setSaving(true);

      const resp = await fetch("/api/inscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          adminUid: user.uid,
          studentId: selectedStudentId,
          courseId: selectedCourseId,
          gestionId: selectedGestionId,
          tipoInscripcion,
        }),
      });

      const data = await resp.json();
      if (!resp.ok) {
        setError(data.error || "Error al crear inscripción");
        return;
      }

      setMessage("Estudiante inscrito correctamente");
    } catch (e: any) {
      console.error(e);
      setError(e.message ?? "Error al crear inscripción");
    } finally {
      setSaving(false);
    }
  };

  if (loadingPage) {
    return <div className="p-6">Cargando...</div>;
  }

  if (!user) {
    return <div className="p-6 text-red-600">Debes iniciar sesión.</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-slate-900 mb-1">
        Inscripciones de estudiantes
      </h1>
      <p className="text-sm text-slate-600">
        Asigna estudiantes a un curso específico dentro de una gestión académica.
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

      <section className="border rounded-lg p-4 bg-white shadow-sm space-y-4">
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
              Estudiante
            </label>
            <select
              value={selectedStudentId}
              onChange={e => setSelectedStudentId(e.target.value)}
              className="mt-1 w-full border rounded-md text-sm px-2 py-2 text-slate-900"
            >
              <option value="">Selecciona estudiante</option>
              {students.map(s => (
                <option key={s.id} value={s.id}>
                  {s.nombre || ""} {s.apellido || ""}{" "}
                  {s.ci ? `- CI: ${s.ci}` : ""}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">
              Tipo de inscripción
            </label>
            <select
              value={tipoInscripcion}
              onChange={e => setTipoInscripcion(e.target.value)}
              className="mt-1 w-full border rounded-md text-sm px-2 py-2 text-slate-900"
            >
              <option value="REGULAR">Regular</option>
              <option value="NUEVO">Nuevo</option>
              <option value="REPETIDOR">Repetidor</option>
            </select>
          </div>
        </div>

        <button
          onClick={handleInscribir}
          disabled={saving}
          className="px-4 py-2 rounded-md bg-slate-900 text-white text-sm disabled:opacity-60"
        >
          {saving ? "Guardando..." : "Inscribir estudiante"}
        </button>
      </section>
    </div>
  );
}
