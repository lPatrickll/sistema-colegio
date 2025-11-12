// app/admin/estudiantes/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/Auth/AuthContext";
import { CreateStudentUseCase } from "@/components/RegisterStudent/application/createStudent.usecase";

const createStudentUseCase = new CreateStudentUseCase();

export default function EstudiantesPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  const [nombreCompleto, setNombreCompleto] = useState("");
  const [ci, setCi] = useState("");
  const [email, setEmail] = useState("");
  const [curso, setCurso] = useState("");
  const [paralelo, setParalelo] = useState("");
  const [telefono, setTelefono] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

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
        curso,
        paralelo,
        telefono,
      });

      setSuccess("Estudiante creado correctamente.");
      setNombreCompleto("");
      setCi("");
      setEmail("");
      setCurso("");
      setParalelo("");
      setTelefono("");
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

  return (
    <main className="min-h-screen p-6">
      <h1 className="text-2xl font-bold mb-4">Crear estudiante</h1>

      <form
        onSubmit={handleSubmit}
        className="max-w-md flex flex-col gap-4 border rounded-md p-4"
      >
        <label className="flex flex-col gap-1 text-sm">
          Nombre completo
          <input
            value={nombreCompleto}
            onChange={e => setNombreCompleto(e.target.value)}
            className="border rounded p-2 text-sm"
            required
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          CI
          <input
            value={ci}
            onChange={e => setCi(e.target.value)}
            className="border rounded p-2 text-sm"
            required
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          Correo
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="border rounded p-2 text-sm"
            required
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          Curso
          <input
            value={curso}
            onChange={e => setCurso(e.target.value)}
            className="border rounded p-2 text-sm"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          Paralelo
          <input
            value={paralelo}
            onChange={e => setParalelo(e.target.value)}
            className="border rounded p-2 text-sm"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          Teléfono
          <input
            value={telefono}
            onChange={e => setTelefono(e.target.value)}
            className="border rounded p-2 text-sm"
          />
        </label>

        {error && <p className="text-red-600 text-sm">{error}</p>}
        {success && <p className="text-green-600 text-sm">{success}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="mt-2 p-2 rounded bg-green-600 text-white disabled:opacity-60"
        >
          {submitting ? "Guardando..." : "Crear estudiante"}
        </button>
      </form>
    </main>
  );
}
