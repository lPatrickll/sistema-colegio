import ProfesorForm from "@/components/forms/ProfesorForm";

export default function NuevoProfesorPage({
  params,
}: {
  params: { gestionId: string };
}) {
  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">
        Crear profesor – Gestión {params.gestionId}
      </h1>

      <ProfesorForm gestionId={params.gestionId} />
    </div>
  );
}
