import ProfesorForm from "@/components/forms/ProfesorForm";

export default async function NuevoProfesorPage({
  params,
}: {
  params: Promise<{ gestionId: string }>;
}) {
  const { gestionId } = await params;

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">
        Crear profesor – Gestión {gestionId}
      </h1>

      <ProfesorForm gestionId={gestionId} />
    </div>
  );
}
