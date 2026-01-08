// src/app/api/schedules/[scheduleId]/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { requireAdmin } from "@/app/api/_utils/requireAdmin";

type Dia =
  | "Lunes"
  | "Martes"
  | "Miércoles"
  | "Jueves"
  | "Viernes"
  | "Sábado"
  | "Domingo";

const DIAS: Dia[] = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

type Slot = { dia: Dia; inicio: string; fin: string };

function normalize(s: unknown) {
  return String(s ?? "").trim();
}
function isHHMM(x: unknown): x is string {
  return typeof x === "string" && /^\d{2}:\d{2}$/.test(x);
}
function toMin(hhmm: string) {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}
function overlaps(a0: number, a1: number, b0: number, b1: number) {
  return Math.max(a0, b0) < Math.min(a1, b1);
}
function validateSlots(slots: Slot[]): string | null {
  if (!Array.isArray(slots)) return "slots inválidos.";
  if (slots.length === 0) return "Debes agregar al menos un horario.";

  for (const s of slots) {
    if (!s?.dia || !DIAS.includes(s.dia)) return "Horario inválido (día).";
    if (!isHHMM(s.inicio) || !isHHMM(s.fin)) return "Horario inválido (formato debe ser HH:MM).";
    const a = toMin(s.inicio);
    const b = toMin(s.fin);
    if (a >= b) return "Horario inválido: inicio debe ser menor que fin.";
  }

  const byDay = new Map<string, { a: number; b: number }[]>();
  for (const s of slots) {
    const list = byDay.get(s.dia) ?? [];
    list.push({ a: toMin(s.inicio), b: toMin(s.fin) });
    byDay.set(s.dia, list);
  }
  for (const [dia, list] of byDay.entries()) {
    list.sort((x, y) => x.a - y.a);
    for (let i = 1; i < list.length; i++) {
      if (list[i].a < list[i - 1].b) return `Horarios solapados en ${dia}.`;
    }
  }

  return null;
}

async function hasCourseConflicts(params: {
  gestionId: string;
  courseId: string;
  slots: Slot[];
  excludeId: string;
}): Promise<string | null> {
  const { gestionId, courseId, slots, excludeId } = params;

  const snap = await adminDb
    .collection("schedules")
    .where("gestionId", "==", gestionId)
    .where("courseId", "==", courseId)
    .get();

  const existing = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));

  for (const e of existing) {
    if (e.id === excludeId) continue;
    const eSlots: Slot[] = Array.isArray(e.slots) ? e.slots : [];

    for (const s of slots) {
      for (const es of eSlots) {
        if (s.dia !== es.dia) continue;
        if (!isHHMM(es.inicio) || !isHHMM(es.fin)) continue;

        const a0 = toMin(s.inicio);
        const a1 = toMin(s.fin);
        const b0 = toMin(es.inicio);
        const b1 = toMin(es.fin);

        if (overlaps(a0, a1, b0, b1)) {
          const what = e.subjectNombre ?? e.subjectId ?? "otra materia";
          return `Choque de horario en el curso (${s.dia} ${s.inicio}-${s.fin}) con ${what}.`;
        }
      }
    }
  }

  return null;
}

async function hasTeacherConflicts(params: {
  gestionId: string;
  teacherId: string;
  slots: Slot[];
  excludeId: string;
}): Promise<string | null> {
  const { gestionId, teacherId, slots, excludeId } = params;

  const snap = await adminDb
    .collection("schedules")
    .where("gestionId", "==", gestionId)
    .where("teacherId", "==", teacherId)
    .get();

  const existing = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));

  for (const e of existing) {
    if (e.id === excludeId) continue;
    const eSlots: Slot[] = Array.isArray(e.slots) ? e.slots : [];

    for (const s of slots) {
      for (const es of eSlots) {
        if (s.dia !== es.dia) continue;
        if (!isHHMM(es.inicio) || !isHHMM(es.fin)) continue;

        const a0 = toMin(s.inicio);
        const a1 = toMin(s.fin);
        const b0 = toMin(es.inicio);
        const b1 = toMin(es.fin);

        if (overlaps(a0, a1, b0, b1)) {
          const course = e.courseNombre ?? e.courseId ?? "otro curso";
          const sub = e.subjectNombre ?? e.subjectId ?? "otra materia";
          return `El profesor ya tiene clase (${s.dia} ${s.inicio}-${s.fin}) en ${course} — ${sub}.`;
        }
      }
    }
  }

  return null;
}

function teacherCanTeach(t: any, courseId: string, subjectId: string) {
  const teaching = t?.teaching;
  if (!teaching || typeof teaching !== "object") return false;
  const list = teaching[courseId];
  return Array.isArray(list) && list.includes(subjectId);
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ scheduleId: string }> }
) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { scheduleId } = await params;

  let body: any = null;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body must be JSON" }, { status: 400 });
  }

  const slots: Slot[] = Array.isArray(body?.slots) ? body.slots : [];
  const teacherId = normalize(body?.teacherId);

  const slotsErr = validateSlots(slots);
  if (slotsErr) return NextResponse.json({ error: slotsErr }, { status: 400 });
  if (!teacherId) return NextResponse.json({ error: "teacherId es obligatorio" }, { status: 400 });

  const ref = adminDb.collection("schedules").doc(scheduleId);
  const snap = await ref.get();
  if (!snap.exists) return NextResponse.json({ error: "Horario no existe" }, { status: 404 });

  const current = snap.data() as any;
  const gestionId = normalize(current?.gestionId);
  const courseId = normalize(current?.courseId);
  const subjectId = normalize(current?.subjectId);

  const tSnap = await adminDb.collection("teachers").doc(teacherId).get();
  if (!tSnap.exists) return NextResponse.json({ error: "Profesor no existe" }, { status: 400 });
  const t = tSnap.data() as any;

  if (normalize(t?.gestionId) !== gestionId) {
    return NextResponse.json({ error: "El profesor no pertenece a esta gestión" }, { status: 400 });
  }

  if (!teacherCanTeach(t, courseId, subjectId)) {
    return NextResponse.json(
      { error: "El profesor seleccionado no tiene asignada esa materia para ese curso." },
      { status: 400 }
    );
  }

  const courseConflict = await hasCourseConflicts({ gestionId, courseId, slots, excludeId: scheduleId });
  if (courseConflict) return NextResponse.json({ error: courseConflict }, { status: 400 });

  const teacherConflict = await hasTeacherConflicts({ gestionId, teacherId, slots, excludeId: scheduleId });
  if (teacherConflict) return NextResponse.json({ error: teacherConflict }, { status: 400 });

  await ref.update({
    teacherId,
    teacherNombreCompleto: t?.nombreCompleto ?? null,
    slots,
    updatedAt: new Date().toISOString(),
    updatedBy: auth.uid,
  });

  return NextResponse.json({ ok: true }, { status: 200 });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ scheduleId: string }> }
) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { scheduleId } = await params;

  await adminDb.collection("schedules").doc(scheduleId).delete();
  return NextResponse.json({ ok: true }, { status: 200 });
}
