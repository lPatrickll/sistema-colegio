import Link from "next/link";
import { adminDb } from "@/lib/firebase-admin";

export const runtime = "nodejs";

type Gestion = {
  id: string;
  nombre?: string;
  anio?: number;
  createdAt?: string;
};

export default async function GestionesPage() {
  const snap = await adminDb
    .collection("gestiones")
    .orderBy("createdAt", "desc")
    .get();

  const gestiones: Gestion[] = snap.docs.map((d) => ({
    id: d.id,
    ...(d.data() as any),
  }));

  return (
    <div className="p-6 space-y-4 text-slate-100">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-100">Gestiones</h1>

        <Link
          className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded"
          href="/admin/gestion/nuevo"
        >
          Nueva gestión
        </Link>
      </div>

      {gestiones.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 text-slate-400">
          No hay gestiones registradas.
        </div>
      ) : (
        <div className="space-y-2">
          {gestiones.map((g) => (
            <Link
              key={g.id}
              className="block bg-slate-900 border border-slate-800 rounded-lg p-4 hover:bg-slate-800 transition"
              href={`/admin/gestion/${g.id}`}
            >
              <div className="font-semibold text-slate-100">
                {g.nombre ?? `Gestión ${g.anio ?? g.id}`}
              </div>

              <div className="text-sm text-slate-400 mt-1">
                {g.anio ? `Año: ${g.anio}` : `ID: ${g.id}`}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
