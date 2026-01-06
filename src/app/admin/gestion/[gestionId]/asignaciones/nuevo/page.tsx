import AsignacionDocenteForm from "@/components/forms/AsignacionDocenteForm";

export default async function NuevaAsignacionPage({
  params,
}: {
  params: Promise<{ gestionId: string }>;
}) {

  const { gestionId } = await params;

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold text-slate-900">
        Asignar docente – Gestión {gestionId}
      </h1>

      <AsignacionDocenteForm gestionId={gestionId} />
    </div>
  );
}
