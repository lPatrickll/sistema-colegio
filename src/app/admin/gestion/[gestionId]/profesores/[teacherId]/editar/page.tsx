import Link from "next/link";
import TeacherTeachingForm from "@/components/forms/TeacherTeachingForm";

export default async function EditarProfesorTeachingPage({
  params,
}: {
  params: Promise<{ gestionId: string; teacherId: string }>;
}) {
  const { gestionId, teacherId } = await params;

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-100">
          Editar cursos y materias — Profesor {teacherId}
        </h1>

        <Link
          href={`/admin/gestion/${gestionId}/profesores`}
          className="bg-slate-800 hover:bg-slate-700 text-slate-100 px-4 py-2 rounded border border-slate-700"
        >
          Volver
        </Link>
      </div>

      <TeacherTeachingForm gestionId={gestionId} teacherId={teacherId} />
    </div>
  );
}
