"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/Auth/AuthContext";
import { CreateSubjectUseCase } from "@/components/Subject/application/createSubject.usecase";

const createSubjectUseCase = new CreateSubjectUseCase();

export default function CreateSubjectPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  const [nombre, setNombre] = useState("");
  const [sigla, setSigla] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

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

    try {
      await createSubjectUseCase.execute(user.uid, {
        nombre,
        sigla,
        createdBy: user.uid,
      });

      setSuccess("Materia creada correctamente.");
      setNombre("");
      setSigla("");
    } catch (err: any) {
      setError(err.message ?? "Error al crear materia");
    }
  };

  if (loading || !user || user.role !== "admin") {
    return <p className="p-4">Verificando permisos...</p>;
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Registrar materia</h1>

      <form
        onSubmit={handleSubmit}
        className="max-w-xl bg-white border p-6 rounded"
      >
        <label className="block mb-3">
          <span className="text-sm">Nombre de la materia</span>
          <input
            className="w-full border rounded p-2"
            value={nombre}
            onChange={e => setNombre(e.target.value)}
            placeholder="Matemática"
            required
          />
        </label>

        <label className="block mb-4">
          <span className="text-sm">Sigla</span>
          <input
            className="w-full border rounded p-2"
            value={sigla}
            onChange={e => setSigla(e.target.value)}
            placeholder="MAT-101"
            required
          />
        </label>

        {error && <p className="text-red-600 text-sm">{error}</p>}
        {success && <p className="text-green-600 text-sm">{success}</p>}

        <button
          type="submit"
          className="w-full p-2 bg-green-600 text-white rounded mt-3"
        >
          Crear materia
        </button>
      </form>
    </div>
  );
}
