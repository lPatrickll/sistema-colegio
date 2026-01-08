import EstudianteForm from "@/components/forms/EstudianteForm";

export default async function NuevoEstudiantePage({
  params,
}: {
  params: Promise<{ gestionId: string; cursoId: string }>;
}) {
  const { gestionId, cursoId } = await params;

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold text-slate-100">
        Crear estudiante — Gestión {gestionId} / Curso {cursoId}
      </h1>

      <EstudianteForm gestionId={gestionId} cursoId={cursoId} />
    </div>
  );
}
