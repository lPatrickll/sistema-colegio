export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { requireTeacher } from "../../_utils/requireTeacher";

type Dia =
  | "Lunes"
  | "Martes"
  | "Miércoles"
  | "Jueves"
  | "Viernes"
  | "Sábado"
  | "Domingo";

const DIAS: Dia[] = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

function dayFromISO(iso: string): Dia | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return null;
  const d = new Date(`${iso}T00:00:00-04:00`);
  const idx = d.getDay();
  return DIAS[idx] ?? null;
}

export async function GET(req: Request) {
  const auth = await requireTeacher();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { searchParams } = new URL(req.url);
  const courseId = String(searchParams.get("courseId") ?? "").trim();
  const fecha = String(searchParams.get("fecha") ?? "").trim();

  if (!courseId) return NextResponse.json({ error: "Falta courseId" }, { status: 400 });

  const fechaISO = fecha || new Date().toISOString().slice(0, 10);
  const dia = dayFromISO(fechaISO);
  if (!dia) return NextResponse.json({ error: "Fecha inválida" }, { status: 400 });

  const teacherSnap = await adminDb.collection("teachers").doc(auth.teacherId).get();
  if (!teacherSnap.exists) return NextResponse.json({ error: "Profesor no encontrado" }, { status: 404 });

  const teacher = teacherSnap.data() as any;
  const gestionId = String(teacher?.gestionId ?? "").trim();

  const canTeachCourse =
    (Array.isArray(teacher?.teachingCourseIds) && teacher.teachingCourseIds.includes(courseId)) ||
    (teacher?.teaching && typeof teacher.teaching === "object" && Object.prototype.hasOwnProperty.call(teacher.teaching, courseId));

  if (!canTeachCourse) return NextResponse.json({ error: "No tienes acceso a este curso" }, { status: 403 });

  const snap = await adminDb
    .collection("schedules")
    .where("gestionId", "==", gestionId)
    .where("courseId", "==", courseId)
    .where("teacherId", "==", auth.teacherId)
    .get();

  const schedules = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));

  const items: any[] = [];
  for (const sch of schedules) {
    const slots = Array.isArray((sch as any)?.slots) ? (sch as any).slots : [];
    slots.forEach((sl: any, slotIndex: number) => {
      if (sl?.dia === dia) {
        items.push({
          scheduleId: (sch as any).id,
          slotIndex,
          inicio: sl.inicio,
          fin: sl.fin,
          subjectId: (sch as any).subjectId ?? null,
          subjectNombre: (sch as any).subjectNombre ?? null,
          courseId: (sch as any).courseId,
          courseNombre: (sch as any).courseNombre ?? null,
          dia,
        });
      }
    });
  }

  items.sort((a, b) => String(a.inicio).localeCompare(String(b.inicio)));
  return NextResponse.json({ fecha: fechaISO, dia, items }, { status: 200 });
}
