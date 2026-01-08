// src/app/admin/gestion/[gestionId]/estudiantes/page.tsx
import { adminDb } from "@/lib/firebase-admin";
import { getGestionTitle } from "@/lib/displayNames";
import EstudiantesGestionClient, {
  type EstudianteRow,
  type CursoOption,
} from "./ui/EstudiantesGestionClient";

export const runtime = "nodejs";

function toISODate(value: any): string {
  if (!value) return "";
  if (typeof value?.toDate === "function") {
    const d: Date = value.toDate();
    return Number.isFinite(d.getTime()) ? d.toISOString().slice(0, 10) : "";
  }
  if (value instanceof Date) {
    return Number.isFinite(value.getTime()) ? value.toISOString().slice(0, 10) : "";
  }
  return "";
}

export default async function GestionEstudiantesPage({
  params,
}: {
  params: Promise<{ gestionId: string }>;
}) {
  const { gestionId } = await params;

  const gestionTitle = await getGestionTitle(gestionId);

  // 1) Cursos de la gestión (para el filtro)
  const courseSnap = await adminDb
    .collection("courses")
    .where("gestionId", "==", gestionId)
    .get();

  const courses: CursoOption[] = courseSnap.docs
    .map((d) => {
      const c = d.data() as any;
      const nombre = typeof c?.nombre === "string" ? c.nombre.trim() : "";
      return { id: d.id, title: nombre || `Curso ${d.id}` };
    })
    .sort((a, b) => a.title.localeCompare(b.title, "es"));

  const courseMap = new Map<string, string>(courses.map((c) => [c.id, c.title]));

  // 2) Inscripciones de la gestión: para saber el curso “actual” en esta gestión
  const insSnap = await adminDb
    .collection("inscriptions")
    .where("gestionId", "==", gestionId)
    .get();

  const inscriptions = insSnap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));

  // Elegimos la mejor inscripción por studentId:
  // - preferimos estado ACTIVO
  // - si empatan, la más reciente (createdAt / fechaInscripcion)
  const bestByStudent = new Map<string, any>();
  for (const ins of inscriptions) {
    const sid = String(ins?.studentId ?? "").trim();
    if (!sid) continue;

    const prev = bestByStudent.get(sid);

    const isActivo = String(ins?.estado ?? "").toUpperCase() === "ACTIVO";
    const prevActivo = prev ? String(prev?.estado ?? "").toUpperCase() === "ACTIVO" : false;

    const t =
      ins?.createdAt?.toMillis?.() ??
      ins?.createdAt?.getTime?.() ??
      ins?.fechaInscripcion?.toMillis?.() ??
      ins?.fechaInscripcion?.getTime?.() ??
      0;

    const tp =
      prev?.createdAt?.toMillis?.() ??
      prev?.createdAt?.getTime?.() ??
      prev?.fechaInscripcion?.toMillis?.() ??
      prev?.fechaInscripcion?.getTime?.() ??
      0;

    if (!prev) {
      bestByStudent.set(sid, ins);
      continue;
    }

    if (isActivo && !prevActivo) {
      bestByStudent.set(sid, ins);
      continue;
    }

    if (isActivo === prevActivo && t > tp) {
      bestByStudent.set(sid, ins);
    }
  }

  const studentIds = Array.from(bestByStudent.keys());

  // 3) Traer students con getAll (más eficiente)
  const studentRefs = studentIds.map((id) => adminDb.collection("students").doc(id));
  const studentSnaps = studentRefs.length ? await adminDb.getAll(...studentRefs) : [];

  const rows: EstudianteRow[] = studentSnaps
    .filter((s) => s.exists)
    .map((s) => {
      const st = s.data() as any;
      const ins = bestByStudent.get(s.id);

      const courseId = String(ins?.courseId ?? "").trim();
      const courseTitle = courseMap.get(courseId) ?? (courseId ? `Curso ${courseId}` : "—");

      // Deudor: tu schema actual NO lo guarda, pero lo dejo “best effort”
      // para que cuando lo agregues funcione sin cambiar esta página.
      const saldoPendiente = Number(st?.saldoPendiente ?? st?.deuda ?? 0);
      const esDeudor = Boolean(st?.esDeudor ?? st?.deudor ?? (saldoPendiente > 0));

      const fechaNacimientoISO = toISODate(st?.fechaNacimiento);

      const nombreCompleto = String(
        st?.nombreCompleto ??
          `${st?.nombre ?? ""} ${st?.apellido ?? ""}`.trim()
      ).trim();

      return {
        id: s.id,
        studentId: s.id,
        courseId,
        courseTitle,
        nombreCompleto,
        nombreCompletoLower: String(st?.nombreCompletoLower ?? nombreCompleto)
          .trim()
          .toLowerCase(),
        ci: String(st?.ci ?? "").trim(),
        codigo: String(st?.codigo ?? "").trim(),
        colegioProcedencia: String(st?.colegioProcedencia ?? "").trim(),
        fechaNacimientoISO,
        estado: String(st?.estado ?? "").toUpperCase() === "INACTIVO" ? "INACTIVO" : "ACTIVO",
        documentosEntregados: {
          fotocopiaCarnet: Boolean(st?.documentosEntregados?.fotocopiaCarnet),
          certificadoNacimiento: Boolean(st?.documentosEntregados?.certificadoNacimiento),
          boletinAnioPasado: Boolean(st?.documentosEntregados?.boletinAnioPasado),
        },
        esDeudor,
      };
    });

  return (
    <div className="p-6">
      <EstudiantesGestionClient
        gestionId={gestionId}
        gestionTitle={gestionTitle}
        courses={courses}
        rows={rows}
      />
    </div>
  );
}
