import EstudianteForm from "@/components/forms/EstudianteForm";

export default function NuevoEstudiantePage({
  params,
}: {
  params: { gestionId: string; cursoId: string };
}) {
  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">
        Crear estudiante – Gestión {params.gestionId} / Curso {params.cursoId}
      </h1>

      <EstudianteForm gestionId={params.gestionId} cursoId={params.cursoId} />
    </div>
  );
}
