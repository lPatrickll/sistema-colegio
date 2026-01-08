export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { requireTeacher } from "@/app/api/_utils/requireTeacher";

type Estado = "PRESENTE" | "AUSENTE" | "JUSTIFICADO";
type Registro = { studentId: string; estado: Estado; justificativo?: string };

export async function POST(req: Request) {
  const auth = await requireTeacher();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const body = await req.json();

  const sessionId = String(body?.sessionId ?? "").trim();
  const registros: Registro[] = Array.isArray(body?.registros) ? body.registros : [];

  if (!sessionId) return NextResponse.json({ error: "sessionId es obligatorio" }, { status: 400 });
  if (registros.length === 0) return NextResponse.json({ error: "Debes enviar registros" }, { status: 400 });

  const sessionSnap = await adminDb.collection("attendanceSessions").doc(sessionId).get();
  if (!sessionSnap.exists) return NextResponse.json({ error: "Sesión no encontrada" }, { status: 404 });

  const session = sessionSnap.data() as any;
  if (String(session?.teacherId ?? "").trim() !== auth.teacherId) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const prev = await adminDb.collection("attendanceRecords").where("sessionId", "==", sessionId).get();

  const batch = adminDb.batch();
  prev.docs.forEach((d) => batch.delete(d.ref));

  const now = new Date();

  for (const r of registros) {
    const studentId = String(r?.studentId ?? "").trim();
    const estado = String(r?.estado ?? "").trim().toUpperCase();
    const justificativo = String(r?.justificativo ?? "").trim();

    if (!studentId) continue;
    if (!["PRESENTE", "AUSENTE", "JUSTIFICADO"].includes(estado)) continue;

    const ref = adminDb.collection("attendanceRecords").doc();
    batch.set(ref, {
      sessionId,
      studentId,
      estado,
      justificativo: estado === "JUSTIFICADO" ? (justificativo || null) : null,
      createdAt: now,
      createdBy: auth.uid,
    });
  }

  await batch.commit();
  return NextResponse.json({ ok: true }, { status: 200 });
}
