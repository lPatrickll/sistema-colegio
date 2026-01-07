import MateriaForm from "@/components/forms/MateriaForm";

export default async function NuevaMateriaPage({
  params,
}: {
  params: Promise<{ gestionId: string }>;
}) {
  const { gestionId } = await params;

  return (
    <div className="p-6 space-y-4 text-slate-100">
      <h1 className="text-2xl font-bold text-slate-100">
        Crear materia — Gestión {gestionId}
      </h1>

      <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
        <MateriaForm gestionId={gestionId} />
      </div>
    </div>
  );
}
