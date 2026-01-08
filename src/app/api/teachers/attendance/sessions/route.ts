export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { requireTeacher } from "@/app/api/_utils/requireTeacher";

export async function POST(req: Request) {
  const auth = await requireTeacher();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const body = await req.json();

  const courseId = String(body?.courseId ?? "").trim();
  const scheduleId = String(body?.scheduleId ?? "").trim();
  const slotIndex = Number(body?.slotIndex ?? -1);
  const fecha = String(body?.fecha ?? "").trim();

  if (!courseId) return NextResponse.json({ error: "courseId es obligatorio" }, { status: 400 });
  if (!scheduleId) return NextResponse.json({ error: "scheduleId es obligatorio" }, { status: 400 });
  if (!Number.isInteger(slotIndex) || slotIndex < 0) return NextResponse.json({ error: "slotIndex inválido" }, { status: 400 });
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) return NextResponse.json({ error: "fecha inválida (YYYY-MM-DD)" }, { status: 400 });

  const [teacherSnap, scheduleSnap] = await Promise.all([
    adminDb.collection("teachers").doc(auth.teacherId).get(),
    adminDb.collection("schedules").doc(scheduleId).get(),
  ]);

  if (!teacherSnap.exists) return NextResponse.json({ error: "Profesor no encontrado" }, { status: 404 });
  if (!scheduleSnap.exists) return NextResponse.json({ error: "Horario no encontrado" }, { status: 404 });

  const teacher = teacherSnap.data() as any;
  const schedule = scheduleSnap.data() as any;

  const gestionId = String(teacher?.gestionId ?? "").trim();

  if (String(schedule?.gestionId ?? "").trim() !== gestionId) return NextResponse.json({ error: "Horario no pertenece a tu gestión" }, { status: 403 });
  if (String(schedule?.teacherId ?? "").trim() !== auth.teacherId) return NextResponse.json({ error: "No tienes acceso a este horario" }, { status: 403 });
  if (String(schedule?.courseId ?? "").trim() !== courseId) return NextResponse.json({ error: "Horario no pertenece a ese curso" }, { status: 400 });

  const slots = Array.isArray(schedule?.slots) ? schedule.slots : [];
  const slot = slots[slotIndex];
  if (!slot || !slot.dia || !slot.inicio || !slot.fin) return NextResponse.json({ error: "Slot no encontrado" }, { status: 400 });

  const existing = await adminDb
    .collection("attendanceSessions")
    .where("scheduleId", "==", scheduleId)
    .where("fecha", "==", fecha)
    .where("slotIndex", "==", slotIndex)
    .limit(1)
    .get();

  if (!existing.empty) {
    const d = existing.docs[0];
    return NextResponse.json({ sessionId: d.id, created: false }, { status: 200 });
  }

  const now = new Date();
  const sessionRef = adminDb.collection("attendanceSessions").doc();

  await sessionRef.set({
    gestionId,
    teacherId: auth.teacherId,
    teacherAuthUid: auth.uid,
    courseId,
    scheduleId,
    slotIndex,
    dia: slot.dia,
    inicio: slot.inicio,
    fin: slot.fin,
    subjectId: schedule?.subjectId ?? null,
    subjectNombre: schedule?.subjectNombre ?? null,
    courseNombre: schedule?.courseNombre ?? null,
    fecha,
    createdAt: now,
    createdBy: auth.uid,
  });

  return NextResponse.json({ sessionId: sessionRef.id, created: true }, { status: 201 });
}
