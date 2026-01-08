// src/app/admin/gestion/[gestionId]/cursos/[cursoId]/estudiantes/[studentId]/editar/page.tsx
import { adminDb } from "@/lib/firebase-admin";
import EstudianteForm from "@/components/forms/EstudianteForm";

export const runtime = "nodejs";

function toISODate(value: any): string {
  if (!value) return "";
  if (value?.toDate) return value.toDate().toISOString().slice(0, 10);
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  if (typeof value === "string") return value.slice(0, 10);
  return "";
}

export default async function EditarEstudiantePage({
  params,
}: {
  params: Promise<{ gestionId: string; cursoId: string; studentId: string }>;
}) {
  const { gestionId, cursoId, studentId } = await params;

  const snap = await adminDb.collection("students").doc(studentId).get();
  if (!snap.exists) {
    return (
      <div className="p-6 text-slate-100">
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 text-slate-300">
          Estudiante no encontrado.
        </div>
      </div>
    );
  }

  const s = snap.data() as any;

  const initial = {
    nombres: String(s?.nombre ?? s?.nombres ?? ""),
    primerApellido: String(s?.primerApellido ?? ""),
    segundoApellido: String(s?.segundoApellido ?? ""),
    ci: String(s?.ci ?? ""),
    fechaNacimiento: toISODate(s?.fechaNacimiento),
    documentosEntregados: {
      fotocopiaCarnet: Boolean(s?.documentosEntregados?.fotocopiaCarnet),
      certificadoNacimiento: Boolean(s?.documentosEntregados?.certificadoNacimiento),
      boletinAnioPasado: Boolean(s?.documentosEntregados?.boletinAnioPasado),
    },
    telefonosTutor: Array.isArray(s?.telefonosTutor) ? s.telefonosTutor : [],
    telefonoEstudiante: String(s?.telefonoEstudiante ?? ""),
    direccion: String(s?.direccion ?? ""),
    colegioProcedencia: String(s?.colegioProcedencia ?? ""),
    observaciones: String(s?.observaciones ?? ""),
    activo: String(s?.estado ?? "ACTIVO") === "ACTIVO",
  };

  return (
    <div className="p-6 space-y-4 text-slate-100">
      <h1 className="text-2xl font-bold">Editar estudiante</h1>

      <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
        <EstudianteForm
          gestionId={gestionId}
          cursoId={cursoId}
          mode="edit"
          studentId={studentId}
          initial={initial}
        />
      </div>
    </div>
  );
}
