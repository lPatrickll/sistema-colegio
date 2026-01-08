// src/app/api/teachers/[teacherId]/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { requireAdmin } from "@/app/api/_utils/requireAdmin";

function normalize(s: unknown) {
  return String(s ?? "").trim();
}

function isTeachingObject(x: any): x is Record<string, string[]> {
  if (!x || typeof x !== "object" || Array.isArray(x)) return false;

  for (const courseId of Object.keys(x)) {
    const v = x[courseId];
    if (!Array.isArray(v)) return false;
    if (!v.every((s) => typeof s === "string" && s.trim().length > 0)) return false;
  }
  return true;
}

async function validateTeachingRefs(gestionId: string, teaching: Record<string, string[]>) {
  const courseIds = Object.keys(teaching);
  if (courseIds.length === 0) return "teaching vacío.";

  const courseRefs = courseIds.map((id) => adminDb.collection("courses").doc(id));
  const courseSnaps = await adminDb.getAll(...courseRefs);

  const courseOk = new Set<string>();
  for (const s of courseSnaps) {
    if (!s.exists) continue;
    const d = s.data() as any;
    if (normalize(d?.gestionId) === gestionId) courseOk.add(s.id);
  }

  for (const cid of courseIds) {
    if (!courseOk.has(cid)) return `Curso inválido o no pertenece a la gestión: ${cid}`;
  }

  const subjectIds = Array.from(new Set(courseIds.flatMap((cid) => teaching[cid] ?? [])));
  const subjectRefs = subjectIds.map((id) => adminDb.collection("subjects").doc(id));
  const subjectSnaps = await adminDb.getAll(...subjectRefs);

  const subjectById = new Map<string, any>();
  for (const s of subjectSnaps) {
    if (!s.exists) return `Materia no existe: ${s.id}`;
    subjectById.set(s.id, s.data() as any);
  }

  for (const cid of courseIds) {
    for (const sid of teaching[cid] ?? []) {
      const sub = subjectById.get(sid);
      if (!sub) return `Materia no existe: ${sid}`;
      if (normalize(sub?.gestionId) !== gestionId) return `Materia no pertenece a la gestión: ${sid}`;
      if (normalize(sub?.courseId) !== cid) return `Materia ${sid} no pertenece al curso ${cid}`;
    }
  }

  return null;
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ teacherId: string }> }
) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { teacherId } = await params;

  const { searchParams } = new URL(req.url);
  const gestionId = normalize(searchParams.get("gestionId"));

  const snap = await adminDb.collection("teachers").doc(teacherId).get();
  if (!snap.exists) return NextResponse.json({ error: "Profesor no existe" }, { status: 404 });

  const teacher = { id: snap.id, ...(snap.data() as any) };

  if (gestionId && normalize(teacher?.gestionId) !== gestionId) {
    return NextResponse.json({ error: "El profesor no pertenece a esta gestión" }, { status: 403 });
  }

  return NextResponse.json({ teacher }, { status: 200 });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ teacherId: string }> }
) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { teacherId } = await params;

  let body: any = null;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body must be JSON" }, { status: 400 });
  }

  const gestionId = normalize(body?.gestionId);
  const teachingRaw = body?.teaching;

  if (!gestionId) return NextResponse.json({ error: "gestionId es obligatorio" }, { status: 400 });
  if (!isTeachingObject(teachingRaw)) {
    return NextResponse.json({ error: "teaching inválido" }, { status: 400 });
  }

  const ref = adminDb.collection("teachers").doc(teacherId);
  const snap = await ref.get();
  if (!snap.exists) return NextResponse.json({ error: "Profesor no existe" }, { status: 404 });

  const current = snap.data() as any;
  if (normalize(current?.gestionId) !== gestionId) {
    return NextResponse.json({ error: "El profesor no pertenece a esta gestión" }, { status: 403 });
  }

  const teaching = teachingRaw as Record<string, string[]>;

  const refsErr = await validateTeachingRefs(gestionId, teaching);
  if (refsErr) return NextResponse.json({ error: refsErr }, { status: 400 });

  await ref.update({
    teaching,
    updatedAt: new Date().toISOString(),
    updatedBy: auth.uid,
  });

  return NextResponse.json({ ok: true }, { status: 200 });
}
