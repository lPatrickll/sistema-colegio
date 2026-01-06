export const runtime = "nodejs";

import Link from "next/link";
import { cookies } from "next/headers";

type Course = {
  id: string;
  gestionId: string;
  nombre: string;
  nivel: "PRIMARIA" | "SECUNDARIA";
};

async function getCourses(gestionId: string): Promise<Course[]> {
  const cookieStore = await cookies();
  const session = cookieStore.get("__session")?.value;

  const base =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || "http://localhost:3000";

  const res = await fetch(`${base}/api/courses?gestionId=${gestionId}`, {
    cache: "no-store",
    headers: session ? { Cookie: `__session=${session}` } : {},
  });

  const data = await res.json();
  if (!res.ok) return [];
  return data.courses ?? [];
}

export default async function CursosPage({
  params,
}: {
  params: { gestionId: string };
}) {
  const { gestionId } = params;

  if (!gestionId) {
    return (
      <div className="p-6">
        <p className="text-red-600">Error: falta gestionId en la ruta.</p>
      </div>
    );
  }

  const courses = await getCourses(gestionId);

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">
          Cursos — Gestión {gestionId}
        </h1>

        <Link
          href={`/admin/gestion/${gestionId}/cursos/nuevo`}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          Crear curso
        </Link>
      </div>

      {courses.length === 0 ? (
        <div className="bg-white border rounded-lg p-6 text-slate-900">
          No hay cursos registrados todavía.
        </div>
      ) : (
        <div className="bg-white border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-900">
              <tr>
                <th className="text-left p-3 text-slate-900">Nombre</th>
                <th className="text-left p-3 text-slate-900">Nivel</th>
              </tr>
            </thead>
            <tbody>
              {courses.map((c) => (
                <tr key={c.id} className="border-t">
                  <td className="p-3 text-slate-900">{c.nombre}</td>
                  <td className="p-3 text-slate-900">{c.nivel}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
