"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/Auth/AuthContext";

export default function LogoutButton() {
  const { logout, loading } = useAuth();
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const onLogout = async () => {
    try {
      setBusy(true);
      await logout();
      router.push("/login");
      router.refresh();
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      type="button"
      onClick={onLogout}
      disabled={loading || busy}
      className="bg-slate-800 hover:bg-slate-700 disabled:opacity-60 text-slate-100 px-4 py-2 rounded border border-slate-700 text-sm"
    >
      {busy ? "Cerrando..." : "Cerrar sesión"}
    </button>
  );
}
