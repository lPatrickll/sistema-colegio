import Link from "next/link";
import { CursoRepository } from "@/modules/curso/curso.repository";

export default async function CursosPage({
  params,
}: {
  params: { gestionId: string };
}) {
  const cursos = await CursoRepository.listByGestionId(params.gestionId);

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">
          Cursos - Gestión {params.gestionId}
        </h1>

        <Link
          className="bg-blue-600 text-white px-4 py-2 rounded"
          href={`/admin/gestion/${params.gestionId}/cursos/nuevo`}
        >
          Nuevo curso
        </Link>
      </div>

      {cursos.length === 0 ? (
        <p className="text-slate-600">No hay cursos registrados aún.</p>
      ) : (
        <div className="space-y-2">
          {cursos.map((c) => (
            <div key={c.id} className="border rounded p-3">
              <div className="font-semibold">{c.nombre}</div>
              <div className="text-sm text-slate-600">{c.nivel}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
