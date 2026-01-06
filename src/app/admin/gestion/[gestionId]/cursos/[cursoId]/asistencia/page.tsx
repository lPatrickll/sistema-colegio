import AsistenciaCursoClient from "./ui/AsistenciaCursoClient";

export default async function AsistenciaPage({
  params,
}: {
  params: Promise<{ gestionId: string; cursoId: string }>;
}) {
  const { gestionId, cursoId } = await params;
  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">
        Asistencia – Gestión {gestionId} / Curso {cursoId}
      </h1>

      <AsistenciaCursoClient gestionId={gestionId} cursoId={cursoId} />
    </div>
  );
}
