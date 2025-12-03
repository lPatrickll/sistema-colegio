// src/app/admin/teachers/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/Auth/AuthContext";
import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";
import { CreateTeacherUseCase } from "@/components/Teacher/application/createTeacher.usecase";

const createTeacherUseCase = new CreateTeacherUseCase();

type SubjectOption = {
  id: string;
  nombre: string;
  sigla: string;
};

export default function AdminTeachersPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [ci, setCi] = useState("");
  const [profesion, setProfesion] = useState("");
  const [pagoPorHora, setPagoPorHora] = useState("0");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [materiaId, setMateriaId] = useState("");
  const [subjects, setSubjects] = useState<SubjectOption[]>([]);

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
    async function loadSubjects() {
      try {
        const snap = await getDocs(collection(db, "subjects"));
        const list: SubjectOption[] = [];
        snap.forEach(doc => {
          const d = doc.data() as { nombre: string; sigla: string };
          list.push({ id: doc.id, nombre: d.nombre, sigla: d.sigla });
        });
        setSubjects(list);
      } catch (err) {
        console.error(err);
      }
    }
    loadSubjects();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const selectedSubject = subjects.find(s => s.id === materiaId);
    if (!selectedSubject) {
      setError("Debes seleccionar una materia válida");
      return;
    }

    setError(null);
    setSuccess(null);
    setSubmitting(true);

    try {
      await createTeacherUseCase.execute(user.uid, {
        nombre,
        apellido,
        ci,
        profesion,
        pagoPorHora: Number(pagoPorHora),
        email,
        password,
        materiaId: selectedSubject.id,
        materiaNombre: selectedSubject.nombre,
        materiaSigla: selectedSubject.sigla,
      });

      setSuccess("Docente registrado correctamente.");
      setNombre("");
      setApellido("");
      setCi("");
      setProfesion("");
      setPagoPorHora("0");
      setEmail("");
      setPassword("");
      setMateriaId("");
    } catch (err: any) {
      console.error(err);
      setError(err.message ?? "Error al registrar docente");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !user) return <p className="p-4">Verificando sesión...</p>;

  const isAdmin = user.roles?.some((r: string) => r.toUpperCase() === "ADMIN");
  if (!isAdmin) return <p className="p-4">No autorizado.</p>;

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4 text-slate-900">Registrar profesor</h1>

      <form
        onSubmit={handleSubmit}
        className="space-y-4 max-w-xl bg-white border rounded p-6 border-slate-200"
      >
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
          <span className="text-sm">Profesión</span>
          <input
            value={profesion}
            onChange={e => setProfesion(e.target.value)}
            className="w-full border rounded p-2"
          />
        </label>

        <label className="block text-slate-900">
          <span className="text-sm">Pago por hora</span>
          <input
            type="number"
            value={pagoPorHora}
            onChange={e => setPagoPorHora(e.target.value)}
            className="w-full border rounded p-2"
            min={0}
          />
        </label>

        <hr />

        <label className="block text-slate-900">
          <span className="text-sm">Correo</span>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="w-full border rounded p-2"
            required
          />
        </label>

        <label className="block text-slate-900">
          <span className="text-sm">Contraseña</span>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full border rounded p-2"
            required
          />
        </label>

        <label className="block text-slate-900">
          <span className="text-sm">Materia asignada</span>
          <select
            value={materiaId}
            onChange={e => setMateriaId(e.target.value)}
            className="w-full border rounded p-2"
            required
          >
            <option value="">Selecciona una materia</option>
            {subjects.map(s => (
              <option key={s.id} value={s.id}>
                {s.sigla} — {s.nombre}
              </option>
            ))}
          </select>
        </label>

        {error && <p className="text-red-600 text-sm mt-2">{error}</p>}
        {success && <p className="text-green-600 text-sm mt-2">{success}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="bg-green-600 text-white px-4 py-2 rounded mt-4"
        >
          {submitting ? "Guardando..." : "Registrar profesor"}
        </button>
      </form>
    </div>
  );
}
