import ActionCard from "@/components/ui/ActionCard";
import ButtonLink from "@/components/ui/ButtonLink";

export default async function GestionDashboardPage({
  params,
}: {
  params: Promise<{ gestionId: string }>;
}) {
  const { gestionId } = await params;

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold text-slate-100">Gestión {gestionId}</h1>
        <p className="text-sm text-slate-400">
          Accesos rápidos para administrar cursos, materias, profesores y asignaciones.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        <ActionCard
          title="Cursos"
          description="Crea cursos y administra su estructura."
        >
          <ButtonLink href={`/admin/gestion/${gestionId}/cursos`} variant="secondary">
            Ver cursos
          </ButtonLink>
          <ButtonLink href={`/admin/gestion/${gestionId}/cursos/nuevo`} variant="primary">
            Crear curso
          </ButtonLink>
        </ActionCard>

        <ActionCard
          title="Materias"
          description="Crea materias dentro de cursos."
        >
          <ButtonLink href={`/admin/gestion/${gestionId}/materias`} variant="secondary">
            Ver materias
          </ButtonLink>
          <ButtonLink href={`/admin/gestion/${gestionId}/materias/nuevo`} variant="primary">
            Crear materia
          </ButtonLink>
        </ActionCard>

        <ActionCard
          title="Profesores"
          description="Registra profesores y asigna cursos/materias."
        >
          <ButtonLink href={`/admin/gestion/${gestionId}/profesores`} variant="secondary">
            Ver profesores
          </ButtonLink>
          <ButtonLink href={`/admin/gestion/${gestionId}/profesores/nuevo`} variant="primary">
            Crear profesor
          </ButtonLink>
        </ActionCard>

        <ActionCard
          title="Asignaciones"
          description="Define qué profesor dicta qué materia en qué curso."
        >
          <ButtonLink href={`/admin/gestion/${gestionId}/asignaciones`} variant="secondary">
            Ver asignaciones
          </ButtonLink>
          <ButtonLink href={`/admin/gestion/${gestionId}/asignaciones/nuevo`} variant="primary">
            Nueva asignación
          </ButtonLink>
        </ActionCard>
      </div>
    </div>
  );
}
