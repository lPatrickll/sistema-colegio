// src/app/teacher/page.tsx
"use client";

import { useAuth } from "@/components/Auth/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function TeacherHome() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.push("/login");
      return;
    }

    if (user.role !== "teacher") {
      router.push("/");
    }
  }, [user, loading, router]);

  if (loading || !user) return <p>Cargando...</p>;

  return (
    <main className="p-10 text-center">
      <h1 className="text-2xl font-bold">
        Bienvenido profesor {user.email}
      </h1>
    </main>
  );
}
