// src/app/admin/gestion/[gestionId]/cursos/[cursoId]/estudiantes/page.tsx
import Link from "next/link";
import { adminDb } from "@/lib/firebase-admin";

export const runtime = "nodejs";

export default async function EstudiantesPage({
  params,
}: {
  params: Promise<{ gestionId: string; cursoId: string }>;
}) {
  const { gestionId, cursoId } = await params;

  if (!gestionId || !cursoId) {
    return (
      <div className="p-6 text-slate-100">
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 text-slate-300">
          Parámetros inválidos: gestionId o cursoId no llegaron correctamente.
        </div>
      </div>
    );
  }

  const insSnap = await adminDb
    .collection("inscriptions")
    .where("gestionId", "==", gestionId)
    .where("courseId", "==", cursoId)
    .where("estado", "==", "ACTIVO")
    .get();

  const inscriptions = insSnap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));

  inscriptions.sort((a, b) => {
    const ta =
      a?.createdAt?.toMillis?.() ??
      (a?.createdAt instanceof Date ? a.createdAt.getTime() : 0);
    const tb =
      b?.createdAt?.toMillis?.() ??
      (b?.createdAt instanceof Date ? b.createdAt.getTime() : 0);
    return tb - ta;
  });

  const studentIds = inscriptions
    .map((d) => String(d?.studentId ?? ""))
    .filter(Boolean);

  const students = await Promise.all(
    studentIds.map(async (id) => {
      const s = await adminDb.collection("students").doc(id).get();
      if (!s.exists) return null;
      return { id: s.id, ...(s.data() as any) };
    })
  );

  const list = students.filter(Boolean) as any[];

  return (
    <div className="p-6 space-y-4 text-slate-100">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">
          Estudiantes — Curso {cursoId} (Gestión {gestionId})
        </h1>

        <Link
          href={`/admin/gestion/${gestionId}/cursos/${cursoId}/estudiantes/nuevo`}
          className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded"
        >
          Nuevo estudiante
        </Link>
      </div>

      {list.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 text-slate-300">
          No hay estudiantes registrados.
        </div>
      ) : (
        <div className="space-y-2">
          {list.map((s) => (
            <div
              key={s.id}
              className="bg-slate-900 border border-slate-800 rounded-lg p-4 flex items-center justify-between gap-3"
            >
              <div className="min-w-0">
                <div className="font-semibold truncate">
                  {s.nombreCompleto ?? `${s.nombre ?? ""} ${s.apellido ?? ""}`.trim()}
                </div>
                <div className="text-sm text-slate-400">
                  CI: {s.ci ?? "—"} • Código: {s.codigo ?? "—"} • {s.estado ?? "—"}
                </div>
              </div>

              <div className="shrink-0 flex gap-2">
                <Link
                  href={`/admin/gestion/${gestionId}/cursos/${cursoId}/estudiantes/${s.id}/editar`}
                  className="px-3 py-2 rounded border border-slate-700 text-slate-100 hover:bg-slate-800 text-sm"
                >
                  Editar
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
