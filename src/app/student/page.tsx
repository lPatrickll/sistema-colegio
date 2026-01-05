// src/app/student/page.tsx
"use client";

import { useAuth } from "@/components/Auth/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function StudentHome() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.push("/login");
      return;
    }

    if (!user.roles.includes("student")) {
      router.push("/");
    }
  }, [user, loading, router]);

  if (loading || !user) return <p>Cargando...</p>;

  return (
    <main className="p-10 text-center">
      <h1 className="text-2xl font-bold">
        Bienvenido estudiante {user.email}
      </h1>
    </main>
  );
}
