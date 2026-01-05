import MateriaForm from "@/components/forms/MateriaForm";

export default function NuevaMateriaPage({
  params,
}: {
  params: { gestionId: string };
}) {
  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">
        Crear materia – Gestión {params.gestionId}
      </h1>

      <MateriaForm gestionId={params.gestionId} />
    </div>
  );
}
