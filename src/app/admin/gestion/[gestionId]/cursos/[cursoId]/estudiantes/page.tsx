export const runtime = "nodejs";

import Link from "next/link";
import { cookies } from "next/headers";

type Row = {
  inscriptionId: string;
  studentId: string;
  student: null | {
    id: string;
    nombre?: string;
    apellido?: string;
    nombreCompleto?: string;
    ci?: string;
    codigo?: string;
    estado?: string;
  };
};

async function getStudentsByCourse(gestionId: string, courseId: string) {
  const cookieStore = await cookies();
  const session = cookieStore.get("__session")?.value;

  const base =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || "http://localhost:3000";

  const url =
    `${base}/api/inscriptions/by-course?gestionId=${encodeURIComponent(gestionId)}` +
    `&courseId=${encodeURIComponent(courseId)}`;

  const res = await fetch(url, {
    cache: "no-store",
    headers: session ? { Cookie: `__session=${session}` } : {},
  });

  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(data?.error ?? "Error cargando estudiantes");
  return (data?.students ?? []) as Row[];
}

export default async function EstudiantesCursoPage({
  params,
}: {
  params: Promise<{ gestionId: string; cursoId: string }>;
}) {
  const { gestionId, cursoId } = await params;

  const rows = await getStudentsByCourse(gestionId, cursoId);

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-100">
          Estudiantes — Curso {cursoId} (Gestión {gestionId})
        </h1>

        <Link
          className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded"
          href={`/admin/gestion/${gestionId}/cursos/${cursoId}/estudiantes/nuevo`}
        >
          Nuevo estudiante
        </Link>
      </div>

      {rows.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 text-slate-400">
          No hay estudiantes registrados.
        </div>
      ) : (
        <div className="space-y-2">
          {rows.map((r) => (
            <div key={r.inscriptionId} className="bg-slate-900 border border-slate-800 rounded p-3">
              <div className="font-semibold text-slate-100">
                {(() => {
                  const fullName =
                    r.student?.nombreCompleto ??
                    `${r.student?.nombre ?? ""} ${r.student?.apellido ?? ""}`.trim();

                  return fullName || "Sin nombre";
                })()}
              </div>
              <div className="text-sm text-slate-400">
                {r.student?.ci ? `CI: ${r.student.ci} • ` : ""}
                {r.student?.codigo ? `Código: ${r.student.codigo} • ` : ""}
                {r.student?.estado ?? "ACTIVO"}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
