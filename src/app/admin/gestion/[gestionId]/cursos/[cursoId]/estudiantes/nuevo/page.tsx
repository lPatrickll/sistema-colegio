import EstudianteForm from "@/components/forms/EstudianteForm";
import { getCourseDisplay, getGestionTitle } from "@/lib/displayNames";

export default async function NuevoEstudiantePage({
  params,
}: {
  params: Promise<{ gestionId: string; cursoId: string }>;
}) {
  const { gestionId, cursoId } = await params;
  const [gestionTitle, curso] = await Promise.all([
    getGestionTitle(gestionId),
    getCourseDisplay(cursoId),
  ]);

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold text-slate-100">
        Crear estudiante — Gestión {gestionTitle} / Curso {curso.title}
      </h1>

      <EstudianteForm gestionId={gestionId} cursoId={cursoId} />
    </div>
  );
}
