import AsignacionDocenteForm from "@/components/forms/AsignacionDocenteForm";

export default function NuevaAsignacionPage({
  params,
}: {
  params: { gestionId: string };
}) {
  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">
        Asignar docente – Gestión {params.gestionId}
      </h1>

      <AsignacionDocenteForm gestionId={params.gestionId} />
    </div>
  );
}
