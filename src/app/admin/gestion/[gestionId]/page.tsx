// src/app/admin/gestion/[gestionId]/page.tsx
import Link from "next/link";
import { adminDb } from "@/lib/firebase-admin";

export const runtime = "nodejs";

export default async function AdminGestionHomePage({
  params,
}: {
  params: Promise<{ gestionId: string }>;
}) {
  const { gestionId } = await params;

  const gestionSnap = await adminDb.collection("gestiones").doc(gestionId).get();
  const gestion = gestionSnap.exists ? (gestionSnap.data() as any) : null;

  const nombre = gestion?.nombre ?? (gestion?.anio ? `Gestión ${gestion.anio}` : `Gestión ${gestionId}`);

  const base = `/admin/gestion/${gestionId}`;

  return (
    <div className="p-6 space-y-6 text-slate-100">
      <div>
        <h1 className="text-2xl font-bold">{nombre}</h1>
        <p className="text-sm text-slate-400">
          Accesos rápidos para administrar cursos, materias, profesores y asignaciones.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
          <h2 className="font-semibold">Cursos</h2>
          <p className="text-sm text-slate-400">Crea cursos y administra su estructura.</p>
          <div className="mt-3 flex gap-2">
            <Link
              href={`${base}/cursos`}
              className="px-3 py-2 rounded border border-slate-700 text-slate-100 hover:bg-slate-800 text-sm"
            >
              Ver cursos
            </Link>
            <Link
              href={`${base}/cursos/nuevo`}
              className="px-3 py-2 rounded bg-blue-600 hover:bg-blue-500 text-white text-sm"
            >
              Crear curso
            </Link>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
          <h2 className="font-semibold">Materias</h2>
          <p className="text-sm text-slate-400">Crea materias dentro de cursos.</p>
          <div className="mt-3 flex gap-2">
            <Link
              href={`${base}/materias`}
              className="px-3 py-2 rounded border border-slate-700 text-slate-100 hover:bg-slate-800 text-sm"
            >
              Ver materias
            </Link>
            <Link
              href={`${base}/materias/nuevo`}
              className="px-3 py-2 rounded bg-blue-600 hover:bg-blue-500 text-white text-sm"
            >
              Crear materia
            </Link>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
          <h2 className="font-semibold">Profesores</h2>
          <p className="text-sm text-slate-400">Registra profesores y asigna cursos/materias.</p>
          <div className="mt-3 flex gap-2">
            <Link
              href={`${base}/profesores`}
              className="px-3 py-2 rounded border border-slate-700 text-slate-100 hover:bg-slate-800 text-sm"
            >
              Ver profesores
            </Link>
            <Link
              href={`${base}/profesores/nuevo`}
              className="px-3 py-2 rounded bg-blue-600 hover:bg-blue-500 text-white text-sm"
            >
              Crear profesor
            </Link>
          </div>
        </div>

        {/* <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
          <h2 className="font-semibold">Asignaciones</h2>
          <p className="text-sm text-slate-400">Asigna profesores a cursos y materias.</p>
          <div className="mt-3 flex gap-2">
            <Link
              href={`${base}/asignaciones`}
              className="px-3 py-2 rounded border border-slate-700 text-slate-100 hover:bg-slate-800 text-sm"
            >
              Ver asignaciones
            </Link>
            <Link
              href={`${base}/asignaciones/nuevo`}
              className="px-3 py-2 rounded bg-blue-600 hover:bg-blue-500 text-white text-sm"
            >
              Crear asignación
            </Link>
          </div>
        </div> */}
      </div>
    </div>
  );
}
