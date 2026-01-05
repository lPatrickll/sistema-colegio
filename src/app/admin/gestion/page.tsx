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
  // trae gestiones desde Firestore (colección "gestiones")
  const snap = await adminDb.collection("gestiones").orderBy("createdAt", "desc").get();

  const gestiones: Gestion[] = snap.docs.map((d) => ({
    id: d.id,
    ...(d.data() as any),
  }));

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Gestiones</h1>

        <Link
          className="bg-blue-600 text-white px-4 py-2 rounded"
          href="/admin/gestion/nuevo"
        >
          Nueva gestión
        </Link>
      </div>

      {gestiones.length === 0 ? (
        <p className="text-slate-600">No hay gestiones registradas.</p>
      ) : (
        <div className="space-y-2">
          {gestiones.map((g) => (
            <Link
              key={g.id}
              className="block border rounded p-3 hover:bg-slate-50"
              href={`/admin/gestion/${g.id}`}
            >
              <div className="font-semibold">{g.nombre ?? `Gestión ${g.id}`}</div>
              <div className="text-sm text-slate-600">
                ID: {g.id}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
