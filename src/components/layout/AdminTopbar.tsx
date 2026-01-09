"use client";

import Link from "next/link";
import { useAuth } from "@/components/Auth/AuthContext";
import LogoutButton from "@/components/ui/LogoutButton";

export default function AdminTopbar() {
  const { user, loading } = useAuth();

  return (
    <header className="border-b border-slate-800 bg-slate-950">
      <div className="px-6 py-3 flex items-center justify-between gap-3">
        <Link href="/admin/gestion" className="font-semibold text-slate-100">
          Sistema Colegio
        </Link>

        <div className="flex items-center gap-3">
          {!loading && user?.email ? (
            <span className="text-sm text-slate-400 hidden sm:inline">
              {user.email}
            </span>
          ) : null}

          <LogoutButton />
        </div>
      </div>
    </header>
  );
}
