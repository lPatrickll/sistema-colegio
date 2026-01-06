import CursoForm from "@/components/forms/CursoForm";

export default async function NuevoCursoPage({
  params,
}: {
  params: Promise<{ gestionId: string }>;
}) {
  const { gestionId } = await params;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-slate-900">
        Crear curso – Gestión {gestionId}
      </h1>

      <CursoForm gestionId={gestionId} />
    </div>
  );
}
