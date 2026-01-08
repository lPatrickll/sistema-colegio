// src/app/admin/gestion/[gestionId]/page.tsx
import ActionCard from "@/components/ui/ActionCard";
import ButtonLink from "@/components/ui/ButtonLink";
import { getGestionDisplay } from "@/lib/displayNames";

export const runtime = "nodejs";

export default async function GestionDashboardPage({
  params,
}: {
  params: Promise<{ gestionId: string }>;
}) {
  const { gestionId } = await params;
  const gestion = await getGestionDisplay(gestionId);

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold text-slate-100">{gestion.title}</h1>
        <p className="text-sm text-slate-400">
          Accesos rápidos para administrar cursos, materias, profesores y horarios.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        <ActionCard title="Cursos" description="Crea cursos y administra su estructura.">
          <ButtonLink href={`/admin/gestion/${gestionId}/cursos`} variant="secondary">
            Ver cursos
          </ButtonLink>
          <ButtonLink href={`/admin/gestion/${gestionId}/cursos/nuevo`} variant="primary">
            Crear curso
          </ButtonLink>
        </ActionCard>

        <ActionCard title="Materias" description="Crea materias dentro de cursos.">
          <ButtonLink href={`/admin/gestion/${gestionId}/materias`} variant="secondary">
            Ver materias
          </ButtonLink>
          <ButtonLink href={`/admin/gestion/${gestionId}/materias/nuevo`} variant="primary">
            Crear materia
          </ButtonLink>
        </ActionCard>

        <ActionCard title="Profesores" description="Registra profesores y asigna cursos/materias.">
          <ButtonLink href={`/admin/gestion/${gestionId}/profesores`} variant="secondary">
            Ver profesores
          </ButtonLink>
          <ButtonLink href={`/admin/gestion/${gestionId}/profesores/nuevo`} variant="primary">
            Crear profesor
          </ButtonLink>
        </ActionCard>

        <ActionCard title="Horarios" description="Organiza días y horas por materia dentro de cada curso.">
          <ButtonLink href={`/admin/gestion/${gestionId}/cursos`} variant="primary">
            Ir a cursos (Horario)
          </ButtonLink>
        </ActionCard>

        <ActionCard
          title="Estudiantes"
          description="Ver todos los estudiantes de la gestión con filtros y exportación."
        >
          <ButtonLink href={`/admin/gestion/${gestionId}/estudiantes`} variant="primary">
            Ver estudiantes
          </ButtonLink>
        </ActionCard>
      </div>
    </div>
  );
}
