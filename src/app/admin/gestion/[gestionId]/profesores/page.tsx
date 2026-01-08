// src/app/admin/gestion/[gestionId]/profesores/page.tsx
export const runtime = "nodejs";

import Link from "next/link";
import { cookies } from "next/headers";
import { getGestionDisplay } from "@/lib/displayNames";

type Teacher = {
  id: string;
  gestionId: string;
  nombres: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  nombreCompleto: string;
  ci: string;
  telefono?: string | null;
  activo: boolean;
};

async function getTeachers(gestionId: string): Promise<{
  ok: boolean;
  status: number;
  teachers: Teacher[];
  rawText?: string;
  error?: string;
}> {
  const cookieStore = await cookies();
  const session = cookieStore.get("__session")?.value;

  const base =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || "http://localhost:3000";

  const url = `${base}/api/teachers?gestionId=${encodeURIComponent(gestionId)}`;

  const res = await fetch(url, {
    cache: "no-store",
    headers: session ? { Cookie: `__session=${session}` } : {},
  });

  const text = await res.text();

  if (!res.ok) {
    return {
      ok: false,
      status: res.status,
      teachers: [],
      rawText: text,
      error: `API respondió ${res.status}`,
    };
  }

  try {
    const data = JSON.parse(text);
    return {
      ok: true,
      status: res.status,
      teachers: data.teachers ?? [],
    };
  } catch {
    return {
      ok: false,
      status: res.status,
      teachers: [],
      rawText: text,
      error: "La API no devolvió JSON válido",
    };
  }
}

export default async function ProfesoresPage({
  params,
}: {
  params: Promise<{ gestionId: string }>;
}) {
  const { gestionId } = await params;

  if (!gestionId) {
    return (
      <div className="p-6">
        <div className="bg-red-950/40 border border-red-900 text-red-200 rounded-lg p-4">
          Falta gestionId en la ruta.
        </div>
      </div>
    );
  }

  const gestion = await getGestionDisplay(gestionId);
  const result = await getTeachers(gestionId);

  if (!result.ok) {
    return (
      <div className="p-6 space-y-4 text-slate-100">
        <h1 className="text-2xl font-bold text-slate-100">Profesores — {gestion.title}</h1>

        <div className="bg-red-950/40 border border-red-900 text-red-200 rounded-lg p-4">
          <p className="font-semibold">Error cargando profesores</p>
          <p className="text-sm mt-1">{result.error}</p>
          <p className="text-sm mt-1">Status: {result.status}</p>

          <details className="mt-3">
            <summary className="cursor-pointer text-sm text-slate-200">Ver respuesta cruda</summary>
            <pre className="text-xs mt-2 whitespace-pre-wrap break-words text-slate-200">
              {result.rawText ?? "(vacío)"}
            </pre>
          </details>
        </div>

        <Link
          href={`/admin/gestion/${gestionId}`}
          className="inline-flex items-center justify-center bg-slate-800 hover:bg-slate-700 text-slate-100 px-4 py-2 rounded border border-slate-700"
        >
          Volver a gestión
        </Link>
      </div>
    );
  }

  const teachers = result.teachers;

  return (
    <div className="p-6 space-y-4 text-slate-100">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-100">Profesores — {gestion.title}</h1>

        <Link
          href={`/admin/gestion/${gestionId}/profesores/nuevo`}
          className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded"
        >
          Crear profesor
        </Link>
      </div>

      {teachers.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 text-slate-400">
          No hay profesores registrados todavía.
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-950/50">
              <tr>
                <th className="text-left p-3 text-slate-200">Nombre completo</th>
                <th className="text-left p-3 text-slate-200">CI</th>
                <th className="text-left p-3 text-slate-200">Teléfono</th>
                <th className="text-left p-3 text-slate-200">Estado</th>
                <th className="text-left p-3 text-slate-200">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {teachers.map((t) => (
                <tr key={t.id} className="border-t border-slate-800">
                  <td className="p-3 text-slate-100">{t.nombreCompleto}</td>
                  <td className="p-3 text-slate-300">{t.ci}</td>
                  <td className="p-3 text-slate-300">{t.telefono ?? "—"}</td>
                  <td className="p-3 text-slate-300">{t.activo ? "Activo" : "Inactivo"}</td>
                  <td className="p-3">
                    <Link
                      className="inline-flex text-xs bg-slate-800 hover:bg-slate-700 text-slate-100 px-3 py-2 rounded border border-slate-700"
                      href={`/admin/gestion/${gestionId}/profesores/${t.id}/editar`}
                    >
                      Editar cursos/materias
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
