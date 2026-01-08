export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { requireTeacher } from "../../_utils/requireTeacher";

export async function GET(req: Request) {
  const auth = await requireTeacher();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { searchParams } = new URL(req.url);
  const courseId = String(searchParams.get("courseId") ?? "").trim();
  if (!courseId) return NextResponse.json({ error: "Falta courseId" }, { status: 400 });

  const teacherSnap = await adminDb.collection("teachers").doc(auth.teacherId).get();
  if (!teacherSnap.exists) return NextResponse.json({ error: "Profesor no encontrado" }, { status: 404 });

  const teacher = teacherSnap.data() as any;
  const gestionId = String(teacher?.gestionId ?? "").trim();
  if (!gestionId) return NextResponse.json({ error: "Profesor sin gestionId" }, { status: 500 });

  const canTeachCourse =
    (Array.isArray(teacher?.teachingCourseIds) && teacher.teachingCourseIds.includes(courseId)) ||
    (teacher?.teaching && typeof teacher.teaching === "object" && Object.prototype.hasOwnProperty.call(teacher.teaching, courseId));

  if (!canTeachCourse) return NextResponse.json({ error: "No tienes acceso a este curso" }, { status: 403 });

  const insSnap = await adminDb
    .collection("inscriptions")
    .where("courseId", "==", courseId)
    .where("gestionId", "==", gestionId)
    .where("estado", "==", "ACTIVO")
    .get();

  const studentIds = insSnap.docs
    .map((d) => String((d.data() as any).studentId ?? "").trim())
    .filter(Boolean);

  const studentSnaps = await Promise.all(studentIds.map((id) => adminDb.collection("students").doc(id).get()));

  const students = studentSnaps
    .filter((s) => s.exists)
    .map((s) => ({ id: s.id, ...(s.data() as any) }))
    .sort((a: any, b: any) =>
      String(a?.nombreCompletoLower ?? a?.nombreCompleto ?? "").localeCompare(
        String(b?.nombreCompletoLower ?? b?.nombreCompleto ?? "")
      )
    );

  return NextResponse.json({ students, count: students.length, gestionId }, { status: 200 });
}
