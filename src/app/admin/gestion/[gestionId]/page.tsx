import Link from "next/link";

export default function GestionDashboardPage({
  params,
}: {
  params: { gestionId: string };
}) {
  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">Gestión {params.gestionId}</h1>

      <div className="flex gap-3">
        <Link
          className="bg-slate-900 text-white px-4 py-2 rounded"
          href={`/admin/gestion/${params.gestionId}/cursos`}
        >
          Ver cursos
        </Link>

        <Link
          className="bg-blue-600 text-white px-4 py-2 rounded"
          href={`/admin/gestion/${params.gestionId}/cursos/nuevo`}
        >
          Crear curso
        </Link>

        <Link
          className="bg-slate-900 text-white px-4 py-2 rounded"
          href={`/admin/gestion/${params.gestionId}/profesores`}
        >
          Ver profesores
        </Link>

        <Link
          className="bg-blue-600 text-white px-4 py-2 rounded"
          href={`/admin/gestion/${params.gestionId}/profesores/nuevo`}
        >
          Crear profesor
        </Link>

        <Link
          className="bg-slate-900 text-white px-4 py-2 rounded"
          href={`/admin/gestion/${params.gestionId}/materias`}
        >
          Ver materias
        </Link>

        <Link
          className="bg-blue-600 text-white px-4 py-2 rounded"
          href={`/admin/gestion/${params.gestionId}/materias/nuevo`}
        >
          Crear materia
        </Link>
        <Link
          className="bg-slate-900 text-white px-4 py-2 rounded"
          href={`/admin/gestion/${params.gestionId}/asignaciones`}
        >
          Ver asignaciones
        </Link>

        <Link
          className="bg-blue-600 text-white px-4 py-2 rounded"
          href={`/admin/gestion/${params.gestionId}/asignaciones/nuevo`}
        >
          Nueva asignación
        </Link>
      </div>
    </div>
  );
}
