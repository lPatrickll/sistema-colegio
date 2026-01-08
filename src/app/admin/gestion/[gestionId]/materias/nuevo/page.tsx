import MateriaForm from "@/components/forms/MateriaForm";
import { getGestionTitle } from "@/lib/displayNames";

export default async function NuevaMateriaPage({
  params,
}: {
  params: Promise<{ gestionId: string }>;
}) {
  const { gestionId } = await params;

  const gestionTitle = await getGestionTitle(gestionId);

  return (
    <div className="p-6 space-y-4 text-slate-100">
      <h1 className="text-2xl font-bold text-slate-100">
        Crear materia — Gestión {gestionTitle}
      </h1>

      <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
        <MateriaForm gestionId={gestionId} />
      </div>
    </div>
  );
}
