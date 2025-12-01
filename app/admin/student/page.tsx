// src/app/admin/student/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/Auth/AuthContext";
import { CreateStudentUseCase } from "@/components/RegisterStudent/application/createStudent.usecase";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

const createStudentUseCase = new CreateStudentUseCase();

type CourseOption = {
  id: string;
  nombre: string;
  paralelo: string;
};

export default function StudentPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  const [courses, setCourses] = useState<CourseOption[]>([]);
  const [nombreCompleto, setNombreCompleto] = useState("");
  const [ci, setCi] = useState("");
  const [email, setEmail] = useState("");
  const [telefono, setTelefono] = useState("");
  const [descripcion, setDescripcion] = useState("");

  const [courseId, setCourseId] = useState("");
  const [courseNombre, setCourseNombre] = useState("");
  const [courseParalelo, setCourseParalelo] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function loadCourses() {
      const snap = await getDocs(collection(db, "courses"));
      const list: CourseOption[] = [];
      snap.forEach(doc => {
        const d = doc.data() as { nombre: string; paralelo: string };
        list.push({ id: doc.id, nombre: d.nombre, paralelo: d.paralelo });
      });
      setCourses(list);
    }
    loadCourses();
  }, []);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.push("/login");
      return;
    }
    if (user.role !== "admin") {
      router.push("/");
    }
  }, [user, loading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setError(null);
    setSuccess(null);
    setSubmitting(true);

    try {
      await createStudentUseCase.execute(user.uid, {
        nombreCompleto,
        ci,
        email,
        telefono,
        descripcion,
        courseId: courseId || undefined,
        courseNombre: courseNombre || undefined,
        courseParalelo: courseParalelo || undefined,
      });

      setSuccess("Estudiante creado correctamente.");
      setNombreCompleto("");
      setCi("");
      setEmail("");
      setTelefono("");
      setDescripcion("");
      setCourseId("");
      setCourseNombre("");
      setCourseParalelo("");
    } catch (err: any) {
      console.error(err);
      setError(err.message ?? "Error al crear el estudiante.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !user || user.role !== "admin") {
    return <p className="p-4">Verificando permisos...</p>;
  }

  const hayCursos = courses.length > 0;

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Crear estudiante</h1>

      <form
        onSubmit={handleSubmit}
        className="max-w-xl bg-white border rounded p-6"
      >
        {/* Nombre */}
        <label className="block mb-3">
          <span className="text-sm">Nombre completo</span>
          <input
            value={nombreCompleto}
            onChange={e => setNombreCompleto(e.target.value)}
            className="w-full border rounded p-2"
            required
          />
        </label>

        {/* CI */}
        <label className="block mb-3">
          <span className="text-sm">CI</span>
          <input
            value={ci}
            onChange={e => setCi(e.target.value)}
            className="w-full border rounded p-2"
            required
          />
        </label>

        {/* Correo */}
        <label className="block mb-3">
          <span className="text-sm">Correo</span>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="w-full border rounded p-2"
            required
          />
        </label>

        {/* Teléfono */}
        <label className="block mb-3">
          <span className="text-sm">Teléfono</span>
          <input
            value={telefono}
            onChange={e => setTelefono(e.target.value)}
            className="w-full border rounded p-2"
          />
        </label>

        {/* Curso SOLO si hay cursos creados */}
        {hayCursos ? (
          <label className="block mb-3">
            <span className="text-sm">Curso</span>
            <select
              value={courseId}
              onChange={e => {
                const id = e.target.value;
                setCourseId(id);
                const selected = courses.find(c => c.id === id);
                setCourseNombre(selected ? selected.nombre : "");
                setCourseParalelo(selected ? selected.paralelo : "");
              }}
              className="w-full border rounded p-2"
              required
            >
              <option value="">Seleccione un curso</option>
              {courses.map(c => (
                <option key={c.id} value={c.id}>
                  {c.nombre} - {c.paralelo}
                </option>
              ))}
            </select>
          </label>
        ) : (
          <p className="text-sm text-slate-600 mb-3">
            No hay cursos creados. Puede registrar al estudiante sin curso
            asignado.
          </p>
        )}

        {/* Descripción opcional */}
        <label className="block mb-4">
          <span className="text-sm">Descripción / observaciones (opcional)</span>
          <textarea
            value={descripcion}
            onChange={e => setDescripcion(e.target.value)}
            className="w-full border rounded p-2"
            rows={3}
            placeholder="Ej: Estudiante transferido, beca, etc."
          />
        </label>

        {error && <p className="text-red-600 text-sm">{error}</p>}
        {success && <p className="text-green-600 text-sm">{success}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="mt-2 w-full p-2 bg-green-600 text-white rounded"
        >
          {submitting ? "Guardando..." : "Crear estudiante"}
        </button>
      </form>
    </div>
  );
}
