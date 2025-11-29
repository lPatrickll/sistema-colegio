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
      console.log("Usuario logueado:", user);

      router.push("/");
    } catch (err: any) {
      console.error(err);
      setError("Correo o contraseña incorrectos.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center">
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-4 w-80 border rounded-md p-6"
      >
        <h1 className="text-xl font-bold text-center">Iniciar sesión</h1>

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
          Contraseña
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="border rounded p-2 text-sm"
            required
          />
        </label>

        {error && <p className="text-red-600 text-sm">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="mt-2 p-2 rounded bg-blue-600 text-white disabled:opacity-60"
        >
          {loading ? "Ingresando..." : "Ingresar"}
        </button>
      </form>
    </main>
  );
}
