export const runtime = "nodejs";

import Link from "next/link";
import { cookies } from "next/headers";

type Materia = {
  id: string;
  gestionId: string;
  nombre: string;
  nivel: string;
  activa: boolean;
};

async function getMaterias(gestionId: string): Promise<{
  ok: boolean;
  status: number;
  materias: Materia[];
  rawText?: string;
  error?: string;
}> {
  const cookieStore = await cookies();
  const session = cookieStore.get("__session")?.value;

  const base =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || "http://localhost:3000";

  const url = `${base}/api/subjects?gestionId=${gestionId}`;

  const res = await fetch(url, {
    cache: "no-store",
    headers: session ? { Cookie: `__session=${session}` } : {},
  });

  const text = await res.text();

  if (!res.ok) {
    return {
      ok: false,
      status: res.status,
      materias: [],
      rawText: text,
      error: `API respondió ${res.status}`,
    };
  }

  try {
    const data = JSON.parse(text);
    return {
      ok: true,
      status: res.status,
      materias: data.subjects ?? [],
    };
  } catch {
    return {
      ok: false,
      status: res.status,
      materias: [],
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

  const result = await getMaterias(gestionId);

  if (!result.ok) {
    return (
      <div className="p-6 space-y-4">
        <h1 className="text-2xl font-bold text-slate-900">
          Materias — Gestión {gestionId}
        </h1>

        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4">
          <p className="font-semibold">Error cargando materias</p>
          <p className="text-sm mt-1">{result.error}</p>
          <p className="text-sm mt-1">Status: {result.status}</p>

          <details className="mt-3">
            <summary className="cursor-pointer text-sm">Ver respuesta cruda</summary>
            <pre className="text-xs mt-2 whitespace-pre-wrap break-words">
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

  const materias = result.materias;

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">
          Materias — Gestión {gestionId}
        </h1>

        <Link
          className="bg-blue-600 text-white px-4 py-2 rounded"
          href={`/admin/gestion/${gestionId}/materias/nuevo`}
        >
          Nueva materia
        </Link>
      </div>

      {materias.length === 0 ? (
        <div className="bg-white border rounded-lg p-6 text-slate-600">
          No hay materias registradas todavía.
        </div>
      ) : (
        <div className="bg-white border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="text-left p-3">Nombre</th>
                <th className="text-left p-3">Nivel</th>
                <th className="text-left p-3">Estado</th>
              </tr>
            </thead>
            <tbody>
              {materias.map((m) => (
                <tr key={m.id} className="border-t">
                  <td className="p-3">{m.nombre}</td>
                  <td className="p-3">{m.nivel}</td>
                  <td className="p-3">{m.activa ? "Activa" : "Inactiva"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
