// src/app/login/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LoginUseCase } from "@/components/Login/application/login.usecase";

const loginUseCase = new LoginUseCase();

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const user = await loginUseCase.execute({ email, password });

      const roles: string[] = user.roles ?? [];
      const hasAdmin = roles.some(r => r.toUpperCase() === "ADMIN");
      const hasTeacher = roles.some(r => r.toUpperCase() === "DOCENTE");
      const hasStudent = roles.some(r => r.toUpperCase() === "ESTUDIANTE");

      if (hasAdmin) {
        router.push("/admin");
      } else if (hasTeacher) {
        router.push("/teacher");
      } else if (hasStudent) {
        router.push("/student");
      } else {
        router.push("/");
      }
    } catch (err) {
      console.error(err);
      setError("Correo o contraseña incorrectos.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-900">
            Iniciar sesión
          </h1>
          <p className="text-sm text-slate-600">
            Accede al sistema académico
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white border rounded-lg p-6 shadow-sm space-y-4"
        >
          <label className="flex flex-col gap-1 text-sm text-slate-700">
            Correo
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="border rounded-md p-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
              required
            />
          </label>

          <label className="flex flex-col gap-1 text-sm text-slate-700">
            Contraseña
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="border rounded-md p-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
              required
            />
          </label>

          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 p-2 rounded-md bg-slate-900 text-white text-sm hover:bg-slate-800 transition disabled:opacity-60"
          >
            {loading ? "Ingresando..." : "Ingresar"}
          </button>
        </form>
      </div>
    </main>
  );
}
