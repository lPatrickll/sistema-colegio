import AsistenciaCursoClient from "./ui/AsistenciaCursoClient";

export default function AsistenciaPage({
  params,
}: {
  params: { gestionId: string; cursoId: string };
}) {
  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">
        Asistencia – Gestión {params.gestionId} / Curso {params.cursoId}
      </h1>

      <AsistenciaCursoClient gestionId={params.gestionId} cursoId={params.cursoId} />
    </div>
  );
}
