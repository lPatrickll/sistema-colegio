// src/app/admin/gestion/[gestionId]/profesores/page.tsx
export const runtime = "nodejs";

import Link from "next/link";
import { cookies } from "next/headers";

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
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4">
          Falta gestionId en la ruta.
        </div>
      </div>
    );
  }

  const result = await getTeachers(gestionId);

  if (!result.ok) {
    return (
      <div className="p-6 space-y-4">
        <h1 className="text-2xl font-bold text-slate-900">
          Profesores — Gestión {gestionId}
        </h1>

        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 text-slate-900">
          <p className="font-semibold text-slate-900">Error cargando profesores</p>
          <p className="text-sm mt-1 text-slate-900">{result.error}</p>
          <p className="text-sm mt-1 text-slate-900">Status: {result.status}</p>

          <details className="mt-3">
            <summary className="cursor-pointer text-sm text-slate-900">Ver respuesta cruda</summary>
            <pre className="text-xs mt-2 whitespace-pre-wrap break-words text-slate-900">
              {result.rawText ?? "(vacío)"}
            </pre>
          </details>
        </div>

        <Link
          href={`/admin/gestion/${gestionId}`}
          className="inline-block bg-slate-900 text-white px-4 py-2 rounded"
        >
          Volver a gestión
        </Link>
      </div>
    );
  }

  const teachers = result.teachers;

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">
          Profesores — Gestión {gestionId}
        </h1>

        <Link
          href={`/admin/gestion/${gestionId}/profesores/nuevo`}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          Crear profesor
        </Link>
      </div>

      {teachers.length === 0 ? (
        <div className="bg-white border rounded-lg p-6 text-slate-900">
          No hay profesores registrados todavía.
        </div>
      ) : (
        <div className="bg-white border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="text-left p-3 text-slate-900">Nombre completo</th>
                <th className="text-left p-3 text-slate-900">CI</th>
                <th className="text-left p-3 text-slate-900">Teléfono</th>
                <th className="text-left p-3 text-slate-900">Estado</th>
              </tr>
            </thead>
            <tbody>
              {teachers.map((t) => (
                <tr key={t.id} className="border-t">
                  <td className="p-3 text-slate-900">{t.nombreCompleto}</td>
                  <td className="p-3 text-slate-900">{t.ci}</td>
                  <td className="p-3 text-slate-900">{t.telefono ?? "-"}</td>
                  <td className="p-3 text-slate-900">{t.activo ? "Activo" : "Inactivo"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
