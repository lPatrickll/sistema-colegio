// src/app/admin/gestion/[gestionId]/cursos/[cursoId]/horario/page.tsx
export const runtime = "nodejs";

import HorarioCursoForm from "@/components/forms/HorarioCursoForm";
import Link from "next/link";

export default async function HorarioCursoPage({
  params,
}: {
  params: Promise<{ gestionId: string; cursoId: string }>;
}) {
  const { gestionId, cursoId } = await params;

  return (
    <div className="p-6 space-y-4 text-slate-100">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-100">
          Horario — Curso {cursoId} (Gestión {gestionId})
        </h1>

        <Link
          href={`/admin/gestion/${gestionId}/cursos`}
          className="bg-slate-800 hover:bg-slate-700 text-slate-100 px-4 py-2 rounded border border-slate-700"
        >
          Volver a cursos
        </Link>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
        <HorarioCursoForm gestionId={gestionId} cursoId={cursoId} />
      </div>
    </div>
  );
}
