import AsignacionDocenteForm from "@/components/forms/AsignacionDocenteForm";
import Link from "next/link";

export default async function NuevaAsignacionPage({
  params,
}: {
  params: Promise<{ gestionId: string }>;
}) {
  const { gestionId } = await params;

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-100">
          Asignar docente — Gestión {gestionId}
        </h1>

        <Link
          href={`/admin/gestion/${gestionId}/asignaciones`}
          className="bg-slate-800 hover:bg-slate-700 text-slate-100 px-4 py-2 rounded border border-slate-700"
        >
          Volver
        </Link>
      </div>

      <AsignacionDocenteForm gestionId={gestionId} />
    </div>
  );
}
