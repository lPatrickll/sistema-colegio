export const runtime = "nodejs";

import Link from "next/link";
import { cookies } from "next/headers";

type Subject = {
  id: string;
  gestionId: string;
  courseId: string;
  courseNombre?: string | null;
  nombre: string;
  activa: boolean;
};

async function getSubjects(gestionId: string): Promise<{
  ok: boolean;
  status: number;
  subjects: Subject[];
  rawText?: string;
  error?: string;
}> {
  const cookieStore = await cookies();
  const session = cookieStore.get("__session")?.value;

  const base =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || "http://localhost:3000";

  const url = `${base}/api/subjects?gestionId=${encodeURIComponent(gestionId)}`;

  const res = await fetch(url, {
    cache: "no-store",
    headers: session ? { Cookie: `__session=${session}` } : {},
  });

  const text = await res.text();

  if (!res.ok) {
    return {
      ok: false,
      status: res.status,
      subjects: [],
      rawText: text,
      error: `API respondió ${res.status}`,
    };
  }

  try {
    const data = JSON.parse(text);
    return {
      ok: true,
      status: res.status,
      subjects: data.subjects ?? data.materias ?? [],
    };
  } catch {
    return {
      ok: false,
      status: res.status,
      subjects: [],
      rawText: text,
      error: "La API no devolvió JSON válido",
    };
  }
}

export default async function MateriasPage({
  params,
}: {
  params: Promise<{ gestionId: string }>;
}) {
  const { gestionId } = await params;

  if (!gestionId) {
    return (
      <div className="p-6">
        <div className="bg-red-950/40 border border-red-900 text-red-200 rounded-lg p-4">
          Error: falta gestionId en la ruta.
        </div>
      </div>
    );
  }

  const result = await getSubjects(gestionId);

  if (!result.ok) {
    return (
      <div className="p-6 space-y-4">
        <h1 className="text-2xl font-bold text-slate-100">
          Materias — Gestión {gestionId}
        </h1>

        <div className="bg-red-950/40 border border-red-900 text-red-200 rounded-lg p-4">
          <p className="font-semibold">Error cargando materias</p>
          <p className="text-sm mt-1">{result.error}</p>
          <p className="text-sm mt-1">Status: {result.status}</p>

          <details className="mt-3">
            <summary className="cursor-pointer text-sm text-slate-200">
              Ver respuesta cruda
            </summary>
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

  const subjects = result.subjects;

  return (
    <div className="p-6 space-y-4 text-slate-100">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-100">
          Materias — Gestión {gestionId}
        </h1>

        <Link
          className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded"
          href={`/admin/gestion/${gestionId}/materias/nuevo`}
        >
          Nueva materia
        </Link>
      </div>

      {subjects.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 text-slate-400">
          No hay materias registradas aún.
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-950/50">
              <tr>
                <th className="text-left p-3 text-slate-200">Curso</th>
                <th className="text-left p-3 text-slate-200">Materia</th>
                <th className="text-left p-3 text-slate-200">Estado</th>
              </tr>
            </thead>
            <tbody>
              {subjects.map((m) => (
                <tr key={m.id} className="border-t border-slate-800">
                  <td className="p-3 text-slate-300">
                    {m.courseNombre ?? m.courseId}
                  </td>
                  <td className="p-3 text-slate-100">{m.nombre}</td>
                  <td className="p-3 text-slate-300">
                    {m.activa ? "Activa" : "Inactiva"}
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
