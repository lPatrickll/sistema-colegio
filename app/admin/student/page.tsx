// src/app/admin/student/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/Auth/AuthContext";
import { CreateStudentUseCase } from "@/components/Student/application/createStudent.usecase";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";

const createStudentUseCase = new CreateStudentUseCase();

type GestionOption = {
  id: string;
};

type CourseOption = {
  id: string;
  nombre: string;
  paralelo: string;
  gestionId: string;
};

export default function AdminStudentPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [ci, setCi] = useState("");
  const [fechaNac, setFechaNac] = useState("");
  const [sexo, setSexo] = useState("M");
  const [unidadProcedencia, setUnidadProcedencia] = useState("");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [gestiones, setGestiones] = useState<GestionOption[]>([]);
  const [gestionId, setGestionId] = useState("");
  const [courses, setCourses] = useState<CourseOption[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [loadingCourses, setLoadingCourses] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.push("/login");
      return;
    }
    const isAdmin = user.roles?.some((r: string) => r.toUpperCase() === "ADMIN");
    if (!isAdmin) {
      router.push("/");
      return;
    }
  }, [user, loading, router]);

  useEffect(() => {
    async function loadGestionesFromCourses() {
      try {
        const snap = await getDocs(collection(db, "courses"));
        const setIds = new Set<string>();

        snap.forEach(doc => {
          const d = doc.data() as { gestionId?: string };
          if (d.gestionId) {
            setIds.add(d.gestionId);
          }
        });

        const list: GestionOption[] = Array.from(setIds).map(id => ({ id }));
        setGestiones(list);
      } catch (err) {
        console.error(err);
        setError("Error al cargar gestiones desde los cursos");
      }
    }

    loadGestionesFromCourses();
  }, []);

  useEffect(() => {
    if (!gestionId) {
      setCourses([]);
      setSelectedCourseId("");
      return;
    }

    async function loadCourses() {
      try {
        setLoadingCourses(true);
        const qCourses = query(
          collection(db, "courses"),
          where("gestionId", "==", gestionId)
        );
        const snap = await getDocs(qCourses);

        const list: CourseOption[] = [];
        snap.forEach(doc => {
          const d = doc.data() as {
            nombre: string;
            paralelo: string;
            gestionId: string;
          };
          list.push({
            id: doc.id,
            nombre: d.nombre,
            paralelo: d.paralelo,
            gestionId: d.gestionId,
          });
        });

        setCourses(list);
        setSelectedCourseId("");
      } catch (err) {
        console.error(err);
        setError("Error al cargar cursos de la gestión seleccionada");
      } finally {
        setLoadingCourses(false);
      }
    }

    loadCourses();
  }, [gestionId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setError(null);
    setSuccess(null);
    setSubmitting(true);

    try {
      await createStudentUseCase.execute(user.uid, {
        nombre,
        apellido,
        ci,
        fechaNac,
        sexo,
        unidadProcedencia: unidadProcedencia || undefined,
        email: email || undefined,
        password: password || undefined,
        gestionId: selectedCourseId ? gestionId : undefined,
        courseId: selectedCourseId || undefined,
      });

      setSuccess("Estudiante registrado correctamente.");
      setNombre("");
      setApellido("");
      setCi("");
      setFechaNac("");
      setSexo("M");
      setUnidadProcedencia("");
      setEmail("");
      setPassword("");
      setGestionId("");
      setSelectedCourseId("");
    } catch (err: any) {
      console.error(err);
      setError(err.message ?? "Error al registrar estudiante");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !user) return <p className="p-4">Verificando sesión...</p>;

  const isAdmin = user.roles?.some((r: string) => r.toUpperCase() === "ADMIN");
  if (!isAdmin) return <p className="p-4">No autorizado.</p>;

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4 text-slate-900">
        Registrar estudiante
      </h1>

      <form
        onSubmit={handleSubmit}
        className="space-y-4 max-w-xl bg-white border rounded p-6 border-slate-200"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="block text-slate-900">
            <span className="text-sm">Gestión (opcional)</span>
            <select
              value={gestionId}
              onChange={e => setGestionId(e.target.value)}
              className="w-full border rounded p-2"
            >
              <option value="">No inscribir ahora</option>
              {gestiones.map(g => (
                <option key={g.id} value={g.id}>
                  {g.id}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-slate-900">
            <span className="text-sm">Curso (opcional)</span>
            <select
              value={selectedCourseId}
              onChange={e => setSelectedCourseId(e.target.value)}
              className="w-full border rounded p-2"
              disabled={!gestionId || loadingCourses}
            >
              <option value="">
                {!gestionId
                  ? "Selecciona gestión primero"
                  : loadingCourses
                  ? "Cargando..."
                  : courses.length === 0
                  ? "Sin cursos en esta gestión"
                  : "Selecciona curso"}
              </option>
              {courses.map(c => (
                <option key={c.id} value={c.id}>
                  {c.nombre} - {c.paralelo}
                </option>
              ))}
            </select>
          </label>
        </div>

        <hr />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="block text-slate-900">
            <span className="text-sm">Nombre</span>
            <input
              value={nombre}
              onChange={e => setNombre(e.target.value)}
              className="w-full border rounded p-2"
              required
            />
          </label>

          <label className="block text-slate-900">
            <span className="text-sm">Apellido</span>
            <input
              value={apellido}
              onChange={e => setApellido(e.target.value)}
              className="w-full border rounded p-2"
              required
            />
          </label>
        </div>

        <label className="block text-slate-900">
          <span className="text-sm">CI</span>
          <input
            value={ci}
            onChange={e => setCi(e.target.value)}
            className="w-full border rounded p-2"
            required
          />
        </label>

        <label className="block text-slate-900">
          <span className="text-sm">Fecha de nacimiento</span>
          <input
            type="date"
            value={fechaNac}
            onChange={e => setFechaNac(e.target.value)}
            className="w-full border rounded p-2"
            required
          />
        </label>

        <label className="block text-slate-900">
          <span className="text-sm">Sexo</span>
          <select
            value={sexo}
            onChange={e => setSexo(e.target.value)}
            className="w-full border rounded p-2"
          >
            <option value="M">Masculino</option>
            <option value="F">Femenino</option>
            <option value="O">Otro</option>
          </select>
        </label>

        <label className="block text-slate-900">
          <span className="text-sm">Unidad de procedencia (opcional)</span>
          <input
            value={unidadProcedencia}
            onChange={e => setUnidadProcedencia(e.target.value)}
            className="w-full border rounded p-2"
          />
        </label>

        <hr />

        <p className="text-sm text-slate-700">
          Si quieres que el estudiante tenga acceso al sistema, asigna correo y contraseña.
        </p>

        <label className="block text-slate-900">
          <span className="text-sm">Correo (opcional)</span>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="w-full border rounded p-2"
          />
        </label>

        <label className="block text-slate-900">
          <span className="text-sm">Contraseña (opcional)</span>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full border rounded p-2"
          />
        </label>

        {error && <p className="text-red-600 text-sm mt-2">{error}</p>}
        {success && <p className="text-green-600 text-sm mt-2">{success}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="bg-blue-600 text-white px-4 py-2 rounded mt-4"
        >
          {submitting ? "Guardando..." : "Registrar estudiante"}
        </button>
      </form>
    </div>
  );
}
