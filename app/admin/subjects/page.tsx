// src/app/admin/subjects/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/Auth/AuthContext";
import { CreateSubjectUseCase } from "@/components/Subject/application/createSubject.usecase";
import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";

const createSubjectUseCase = new CreateSubjectUseCase();

type Subject = {
  id: string;
  nombre: string;
  sigla: string;
};

export default function AdminSubjectsPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  const [nombre, setNombre] = useState("");
  const [sigla, setSigla] = useState("");
  const [area, setArea] = useState("");
  const [nivelId, setNivelId] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loadingSubjects, setLoadingSubjects] = useState(true);

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
        const list: Subject[] = [];
        snap.forEach(doc => {
          const d = doc.data() as { nombre: string; sigla: string };
          list.push({ id: doc.id, nombre: d.nombre, sigla: d.sigla });
        });
        setSubjects(list);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingSubjects(false);
      }
    }
    loadSubjects();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setError(null);
    setSuccess(null);
    setSubmitting(true);

    try {
      await createSubjectUseCase.execute(user.uid, {
        nombre,
        sigla,
        nivelId: nivelId || undefined,
        area: area || undefined,
      });

      setSuccess("Materia creada correctamente.");

      setSubjects(prev => [
        ...prev,
        { id: crypto.randomUUID(), nombre, sigla },
      ]);

      setNombre("");
      setSigla("");
      setArea("");
      setNivelId("");
    } catch (err: any) {
      console.error(err);
      setError(err.message ?? "Error al crear la materia");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !user) return <p className="p-4">Verificando sesión...</p>;

  const isAdmin = user.roles?.some((r: string) => r.toUpperCase() === "ADMIN");
  if (!isAdmin) return <p className="p-4">No autorizado.</p>;

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4 text-slate-900">Registrar materia</h1>

      <form
        onSubmit={handleCreate}
        className="space-y-4 max-w-md bg-white border rounded p-6 border-slate-200 mb-8"
      >
        <label className="block text-slate-900">
          <span className="text-sm">Nombre</span>
          <input
            value={nombre}
            onChange={e => setNombre(e.target.value)}
            className="w-full border rounded p-2"
            placeholder="Ej: Matemáticas"
            required
          />
        </label>

        <label className="block text-slate-900">
          <span className="text-sm">Sigla</span>
          <input
            value={sigla}
            onChange={e => setSigla(e.target.value)}
            className="w-full border rounded p-2"
            placeholder="Ej: MAT-1"
            required
          />
        </label>

        <label className="block text-slate-900">
          <span className="text-sm">Área (opcional)</span>
          <input
            value={area}
            onChange={e => setArea(e.target.value)}
            className="w-full border rounded p-2"
            placeholder="Ej: Ciencias exactas"
          />
        </label>

        <label className="block text-slate-900">
          <span className="text-sm">Nivel (opcional, por ahora texto)</span>
          <input
            value={nivelId}
            onChange={e => setNivelId(e.target.value)}
            className="w-full border rounded p-2"
            placeholder="Ej: secundaria"
          />
        </label>

        {error && <p className="text-red-600 text-sm mt-2">{error}</p>}
        {success && <p className="text-green-600 text-sm mt-2">{success}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="bg-blue-600 text-white px-4 py-2 rounded mt-4"
        >
          {submitting ? "Guardando..." : "Crear materia"}
        </button>
      </form>

      <h2 className="text-xl font-semibold mb-2 text-slate-900">
        Materias registradas
      </h2>

      {loadingSubjects ? (
        <p>Cargando materias...</p>
      ) : subjects.length === 0 ? (
        <p className="text-sm text-slate-600">No hay materias registradas.</p>
      ) : (
        <ul className="space-y-2">
          {subjects.map(s => (
            <li
              key={s.id}
              className="border rounded p-2 text-slate-900 text-sm flex justify-between"
            >
              <span>
                <strong>{s.sigla}</strong> — {s.nombre}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
