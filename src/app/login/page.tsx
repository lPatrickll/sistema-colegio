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

      router.push("/admin");
      router.refresh();
    } catch (err) {
      console.error(err);
      setError("Correo o contraseña incorrectos.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-100">Iniciar sesión</h1>
          <p className="text-sm text-slate-400">Accede al sistema académico</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-slate-900 border border-slate-800 rounded-lg p-6 shadow-sm space-y-4"
        >
          <label className="flex flex-col gap-1 text-sm text-slate-300">
            Correo
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="bg-slate-950 border border-slate-700 rounded-md p-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-600"
              required
            />
          </label>

          <label className="flex flex-col gap-1 text-sm text-slate-300">
            Contraseña
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="bg-slate-950 border border-slate-700 rounded-md p-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-600"
              required
            />
          </label>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 p-2 rounded-md bg-blue-600 hover:bg-blue-500 text-white text-sm transition disabled:opacity-60"
          >
            {loading ? "Ingresando..." : "Ingresar"}
          </button>
        </form>
      </div>
    </main>
  );
}
