"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/components/Auth/AuthContext";
import { CreateTeacherUseCase } from "@/components/RegisterTeacher/application/createTeacher.usecase";

const createTeacherUseCase = new CreateTeacherUseCase();

type SubjectOption = {
  id: string;
  nombre: string;
  sigla: string;
};

export default function TeacherPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  const [subjects, setSubjects] = useState<SubjectOption[]>([]);
  const [nombreCompleto, setNombreCompleto] = useState("");
  const [ci, setCi] = useState("");
  const [email, setEmail] = useState("");
  const [telefono, setTelefono] = useState("");
  const [materiaId, setMateriaId] = useState("");
  const [materiaNombre, setMateriaNombre] = useState("");
  const [materiaSigla, setMateriaSigla] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function loadSubjects() {
      const snap = await getDocs(collection(db, "subjects"));
      const list: SubjectOption[] = [];
      snap.forEach(doc => {
        const d = doc.data() as { nombre: string; sigla: string };
        list.push({ id: doc.id, nombre: d.nombre, sigla: d.sigla });
      });
      setSubjects(list);
    }
    loadSubjects();
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
      await createTeacherUseCase.execute(user.uid, {
        nombreCompleto,
        ci,
        email,
        telefono,
        materiaId,
        materiaNombre,
        materiaSigla,
        createdBy: user.uid,
      });

      setSuccess("Profesor creado correctamente.");
      setNombreCompleto("");
      setCi("");
      setEmail("");
      setTelefono("");
      setMateriaId("");
      setMateriaNombre("");
      setMateriaSigla("");
    } catch (err: any) {
      console.error(err);
      setError(err.message ?? "Error al crear el profesor.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !user || user.role !== "admin") {
    return <p className="p-4">Verificando permisos...</p>;
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6 text-slate-900">Crear profesor</h1>

      <form
        onSubmit={handleSubmit}
        className="max-w-xl bg-white border rounded p-6 border-slate-900"
      >
        {/* Nombre */}
        <label className="block mb-3 text-slate-900">
          <span className="text-sm text-slate-900">Nombre completo</span>
          <input
            value={nombreCompleto}
            onChange={e => setNombreCompleto(e.target.value)}
            className="w-full border rounded p-2"
            required
          />
        </label>

        {/* CI */}
        <label className="block mb-3 text-slate-900">
          <span className="text-sm text-slate-900">CI</span>
          <input
            value={ci}
            onChange={e => setCi(e.target.value)}
            className="w-full border rounded p-2"
            required
          />
        </label>

        {/* Correo */}
        <label className="block mb-3 text-slate-900">
          <span className="text-sm text-slate-900">Correo</span>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="w-full border rounded p-2"
            required
          />
        </label>

        {/* Teléfono */}
        <label className="block mb-3 text-slate-900">
          <span className="text-sm text-slate-900">Teléfono</span>
          <input
            value={telefono}
            onChange={e => setTelefono(e.target.value)}
            className="w-full border rounded p-2"
          />
        </label>

        {/* Materia (select) */}
        <label className="block mb-4 text-slate-900">
          <span className="text-sm text-slate-900">Materia</span>
          <select
            value={materiaId}
            onChange={e => {
              const id = e.target.value;
              setMateriaId(id);
              const selected = subjects.find(s => s.id === id);
              setMateriaNombre(selected ? selected.nombre : "");
              setMateriaSigla(selected ? selected.sigla : "");
            }}
            className="w-full border rounded p-2"
            required
          >
            <option value="">Seleccione una materia</option>
            {subjects.map(s => (
              <option key={s.id} value={s.id}>
                {s.sigla} - {s.nombre}
              </option>
            ))}
          </select>
        </label>

        {error && <p className="text-red-600 text-sm">{error}</p>}
        {success && <p className="text-green-600 text-sm">{success}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="mt-2 w-full p-2 bg-green-600 text-white rounded"
        >
          {submitting ? "Guardando..." : "Crear profesor"}
        </button>
      </form>
    </div>
  );
}
