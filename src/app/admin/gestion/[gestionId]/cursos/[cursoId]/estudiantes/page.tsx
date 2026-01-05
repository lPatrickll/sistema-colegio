import Link from "next/link";
import { EstudianteRepository } from "@/modules/estudiante/estudiante.repository";

export default async function EstudiantesCursoPage({
  params,
}: {
  params: { gestionId: string; cursoId: string };
}) {
  const estudiantes = await EstudianteRepository.listByCurso(
    params.gestionId,
    params.cursoId
  );

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">
          Estudiantes – Curso {params.cursoId} (Gestión {params.gestionId})
        </h1>

        <Link
          className="bg-blue-600 text-white px-4 py-2 rounded"
          href={`/admin/gestion/${params.gestionId}/cursos/${params.cursoId}/estudiantes/nuevo`}
        >
          Nuevo estudiante
        </Link>
      </div>

      {estudiantes.length === 0 ? (
        <p className="text-slate-600">No hay estudiantes registrados.</p>
      ) : (
        <div className="space-y-2">
          {estudiantes.map((e) => (
            <div key={e.id} className="border rounded p-3">
              <div className="font-semibold">
                {e.nombres} {e.apellidos}
              </div>
              <div className="text-sm text-slate-600">
                {e.ci ? `CI: ${e.ci} • ` : ""}
                {e.codigo ? `Código: ${e.codigo} • ` : ""}
                {e.activo ? "Activo" : "Inactivo"}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
