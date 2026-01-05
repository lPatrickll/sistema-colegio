import CursoForm from "@/components/forms/CursoForm";

export default function NuevoCursoPage({
  params,
}: {
  params: { gestionId: string };
}) {
  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">
        Crear curso – Gestión {params.gestionId}
      </h1>

      <CursoForm gestionId={params.gestionId} />
    </div>
  );
}
