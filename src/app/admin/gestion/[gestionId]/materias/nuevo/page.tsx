import MateriaForm from "@/components/forms/MateriaForm";

export default async function NuevaMateriaPage({
  params,
}: {
  params: Promise<{ gestionId: string }>;
}) {
  const { gestionId } = await params;

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">
        Crear materia – Gestión {gestionId}
      </h1>

      <MateriaForm gestionId={gestionId} />
    </div>
  );
}
