// src/app/api/assignments/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { requireAdmin } from "../_utils/requireAdmin";

type Dia = "Lunes" | "Martes" | "Miércoles" | "Jueves" | "Viernes" | "Sábado" | "Domingo";

type Horario = {
  dia: Dia;
  inicio: string;
  fin: string;
};

function isHHMM(x: unknown): x is string {
  return typeof x === "string" && /^\d{2}:\d{2}$/.test(x);
}

function toMinutes(hhmm: string) {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

function normalize(s: string) {
  return s.trim();
}

function validateHorarios(horarios: Horario[]): string | null {
  if (!Array.isArray(horarios) || horarios.length === 0) return "Debes agregar al menos un horario.";

  for (const h of horarios) {
    if (!h?.dia) return "Horario inválido (día faltante).";
    if (!isHHMM(h.inicio) || !isHHMM(h.fin)) return "Horario inválido (formato debe ser HH:MM).";

    const a = toMinutes(h.inicio);
    const b = toMinutes(h.fin);
    if (a >= b) return "Horario inválido: inicio debe ser menor que fin.";
  }

  const byDay = new Map<string, { a: number; b: number }[]>();
  for (const h of horarios) {
    const list = byDay.get(h.dia) ?? [];
    list.push({ a: toMinutes(h.inicio), b: toMinutes(h.fin) });
    byDay.set(h.dia, list);
  }

  for (const [dia, list] of byDay.entries()) {
    list.sort((x, y) => x.a - y.a);
    for (let i = 1; i < list.length; i++) {
      const prev = list[i - 1];
      const cur = list[i];
      if (cur.a < prev.b) return `Horarios solapados en ${dia}.`;
    }
  }

  return null;
}

export async function GET(req: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { searchParams } = new URL(req.url);
  const gestionId = searchParams.get("gestionId")?.trim();

  if (!gestionId) {
    return NextResponse.json({ error: "Missing gestionId" }, { status: 400 });
  }

  const snap = await adminDb
    .collection("assignments")
    .where("gestionId", "==", gestionId)
    .get();

  const assignments = snap.docs
    .map((d) => ({ id: d.id, ...(d.data() as any) }))
    .sort((a: any, b: any) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""));

  return NextResponse.json({ assignments });
}

export async function POST(req: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  let body: any = null;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body must be JSON" }, { status: 400 });
  }

  const gestionId = normalize(body?.gestionId ?? "");
  const courseId = normalize(body?.courseId ?? "");
  const teacherId = normalize(body?.teacherId ?? "");
  const subjectId = normalize(body?.subjectId ?? "");
  const horarios = body?.horarios as Horario[] | undefined;

  if (!gestionId) return NextResponse.json({ error: "gestionId es obligatorio" }, { status: 400 });
  if (!courseId) return NextResponse.json({ error: "courseId es obligatorio" }, { status: 400 });
  if (!teacherId) return NextResponse.json({ error: "teacherId es obligatorio" }, { status: 400 });
  if (!subjectId) return NextResponse.json({ error: "subjectId es obligatorio" }, { status: 400 });

  const horariosError = validateHorarios(horarios ?? []);
  if (horariosError) {
    return NextResponse.json({ error: horariosError }, { status: 400 });
  }

  const [gSnap, cSnap, tSnap, sSnap] = await Promise.all([
    adminDb.collection("gestiones").doc(gestionId).get(),
    adminDb.collection("courses").doc(courseId).get(),
    adminDb.collection("teachers").doc(teacherId).get(),
    adminDb.collection("subjects").doc(subjectId).get(),
  ]);

  if (!gSnap.exists) return NextResponse.json({ error: "Gestión no existe" }, { status: 400 });
  if (!cSnap.exists) return NextResponse.json({ error: "Curso no existe" }, { status: 400 });
  if (!tSnap.exists) return NextResponse.json({ error: "Profesor no existe" }, { status: 400 });
  if (!sSnap.exists) return NextResponse.json({ error: "Materia no existe" }, { status: 400 });

  const c = cSnap.data() as any;
  const t = tSnap.data() as any;
  const s = sSnap.data() as any;

  if (c?.gestionId !== gestionId) return NextResponse.json({ error: "El curso no pertenece a esta gestión" }, { status: 400 });
  if (t?.gestionId !== gestionId) return NextResponse.json({ error: "El profesor no pertenece a esta gestión" }, { status: 400 });
  if (s?.gestionId !== gestionId) return NextResponse.json({ error: "La materia no pertenece a esta gestión" }, { status: 400 });

  const dup = await adminDb
    .collection("assignments")
    .where("gestionId", "==", gestionId)
    .where("courseId", "==", courseId)
    .where("subjectId", "==", subjectId)
    .limit(1)
    .get();

  if (!dup.empty) {
    return NextResponse.json(
      { error: "Ya existe una asignación para ese curso y materia en esta gestión." },
      { status: 409 }
    );
  }

  const createdAt = new Date().toISOString();

  const doc = await adminDb.collection("assignments").add({
    gestionId,
    courseId,
    teacherId,
    subjectId,
    horarios,
    activo: true,
    createdAt,
    createdBy: auth.uid,
  });

  return NextResponse.json({ id: doc.id }, { status: 201 });
}
