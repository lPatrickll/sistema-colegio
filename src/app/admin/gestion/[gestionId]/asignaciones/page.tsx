import Link from "next/link";
import { AsignacionRepository } from "@/modules/asignacion/asignacion.repository";

export default async function AsignacionesPage({
  params,
}: {
  params: { gestionId: string };
}) {
  const asignaciones = await AsignacionRepository.listByGestionId(params.gestionId);

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">
          Asignaciones – Gestión {params.gestionId}
        </h1>

        <Link
          className="bg-blue-600 text-white px-4 py-2 rounded"
          href={`/admin/gestion/${params.gestionId}/asignaciones/nuevo`}
        >
          Nueva asignación
        </Link>
      </div>

      {asignaciones.length === 0 ? (
        <p className="text-slate-600">No hay asignaciones registradas aún.</p>
      ) : (
        <div className="space-y-2">
          {asignaciones.map((a) => (
            <div key={a.id} className="border rounded p-3">
              <div className="font-semibold">Asignación</div>
              <div className="text-sm text-slate-600">
                CursoId: {a.cursoId} • ProfesorId: {a.profesorId} • MateriaId: {a.materiaId}
              </div>
              <div className="text-sm text-slate-600">
                Horarios: {a.horarios.map((h) => `${h.dia} ${h.horaInicio}-${h.horaFin}`).join(" | ")}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
