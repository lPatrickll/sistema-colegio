// src/app/api/assignments/[assignmentId]/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { requireAdmin } from "../../_utils/requireAdmin";

type Dia =
  | "Lunes"
  | "Martes"
  | "Miércoles"
  | "Jueves"
  | "Viernes"
  | "Sábado"
  | "Domingo";

type Horario = { dia: Dia; inicio: string; fin: string };

function isHHMM(x: unknown): x is string {
  return typeof x === "string" && /^\d{2}:\d{2}$/.test(x);
}
function toMinutes(hhmm: string) {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

function validateHorarios(horarios: Horario[]): string | null {
  if (!Array.isArray(horarios)) return "Horarios inválidos.";
  if (horarios.length === 0) return null;

  for (const h of horarios) {
    if (!h?.dia) return "Horario inválido (día faltante).";
    if (!isHHMM(h.inicio) || !isHHMM(h.fin)) return "Formato de hora inválido (HH:MM).";
    if (toMinutes(h.inicio) >= toMinutes(h.fin)) return "Inicio debe ser menor que fin.";
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
      if (list[i].a < list[i - 1].b) return `Horarios solapados en ${dia}.`;
    }
  }

  return null;
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ assignmentId: string }> }
) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { assignmentId } = await params;

  let body: any = null;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body must be JSON" }, { status: 400 });
  }

  const horarios = Array.isArray(body?.horarios) ? (body.horarios as Horario[]) : null;
  if (!horarios) return NextResponse.json({ error: "Debes enviar horarios: []" }, { status: 400 });

  const err = validateHorarios(horarios);
  if (err) return NextResponse.json({ error: err }, { status: 400 });

  const ref = adminDb.collection("assignments").doc(assignmentId);
  const snap = await ref.get();
  if (!snap.exists) return NextResponse.json({ error: "Asignación no existe" }, { status: 404 });

  await ref.update({
    horarios,
    updatedAt: new Date().toISOString(),
    updatedBy: auth.uid,
  });

  return NextResponse.json({ ok: true }, { status: 200 });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ assignmentId: string }> }
) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { assignmentId } = await params;

  const ref = adminDb.collection("assignments").doc(assignmentId);
  const snap = await ref.get();
  if (!snap.exists) return NextResponse.json({ error: "Asignación no existe" }, { status: 404 });

  await ref.delete();
  return NextResponse.json({ ok: true }, { status: 200 });
}
