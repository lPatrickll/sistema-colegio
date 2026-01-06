import Link from "next/link";

export default async function GestionDashboardPage({
  params,
}: {
  params: Promise<{ gestionId: string }>;
}) {
  const { gestionId } = await params;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-slate-900">Gestión {gestionId}</h1>

      <div className="flex flex-wrap gap-3">
        <Link className="bg-slate-900 text-white px-4 py-2 rounded" href={`/admin/gestion/${gestionId}/cursos`}>
          Ver cursos
        </Link>

        <Link className="bg-blue-600 text-white px-4 py-2 rounded" href={`/admin/gestion/${gestionId}/cursos/nuevo`}>
          Crear curso
        </Link>

        <Link className="bg-slate-900 text-white px-4 py-2 rounded" href={`/admin/gestion/${gestionId}/profesores`}>
          Ver profesores
        </Link>

        <Link className="bg-blue-600 text-white px-4 py-2 rounded" href={`/admin/gestion/${gestionId}/profesores/nuevo`}>
          Crear profesor
        </Link>

        <Link className="bg-slate-900 text-white px-4 py-2 rounded" href={`/admin/gestion/${gestionId}/materias`}>
          Ver materias
        </Link>

        <Link className="bg-blue-600 text-white px-4 py-2 rounded" href={`/admin/gestion/${gestionId}/materias/nuevo`}>
          Crear materia
        </Link>

        <Link className="bg-slate-900 text-white px-4 py-2 rounded" href={`/admin/gestion/${gestionId}/asignaciones`}>
          Ver asignaciones
        </Link>

        <Link className="bg-blue-600 text-white px-4 py-2 rounded" href={`/admin/gestion/${gestionId}/asignaciones/nuevo`}>
          Nueva asignación
        </Link>
      </div>
    </div>
  );
}
