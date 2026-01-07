// src/app/api/students/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { requireAdmin } from "@/app/api/_utils/requireAdmin";

function norm(str: string) {
  return String(str ?? "").trim().replace(/\s+/g, " ");
}

export async function POST(req: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = await req.json();

    const gestionId = norm(body?.gestionId);
    const courseId = norm(body?.courseId);

    const nombre = norm(body?.nombre ?? body?.nombres);
    const apellido = norm(body?.apellido ?? body?.apellidos);

    const ci = norm(body?.ci);
    const codigo = norm(body?.codigo);
    const activo = Boolean(body?.activo ?? true);

    if (!gestionId) return NextResponse.json({ error: "Falta gestionId" }, { status: 400 });
    if (!courseId) return NextResponse.json({ error: "Falta courseId" }, { status: 400 });
    if (!nombre) return NextResponse.json({ error: "Nombre es obligatorio" }, { status: 400 });
    if (!apellido) return NextResponse.json({ error: "Apellido es obligatorio" }, { status: 400 });

    const courseSnap = await adminDb.collection("courses").doc(courseId).get();
    if (!courseSnap.exists) return NextResponse.json({ error: "Curso no existe" }, { status: 400 });

    const course = courseSnap.data() as any;
    if (String(course?.gestionId ?? "") !== gestionId) {
      return NextResponse.json({ error: "El curso no pertenece a esta gestión" }, { status: 400 });
    }

    const nombreCompleto = `${nombre} ${apellido}`.trim();

    const studentRef = await adminDb.collection("students").add({
      nombre,
      apellido,
      nombreCompleto,
      nombreCompletoLower: nombreCompleto.toLowerCase(),
      ci: ci || null,
      codigo: codigo || null,
      estado: activo ? "ACTIVO" : "INACTIVO",
      createdAt: new Date(),
      createdBy: auth.uid,
    });

    const studentId = studentRef.id;

    const existenteSnap = await adminDb
      .collection("inscriptions")
      .where("studentId", "==", studentId)
      .where("courseId", "==", courseId)
      .where("gestionId", "==", gestionId)
      .where("estado", "==", "ACTIVO")
      .limit(1)
      .get();

    if (existenteSnap.empty) {
      await adminDb.collection("inscriptions").add({
        studentId,
        gestionId,
        courseId,
        fechaInscripcion: new Date(),
        tipoInscripcion: "REGULAR",
        estado: "ACTIVO",
        createdAt: new Date(),
        createdBy: auth.uid,
      });
    }

    return NextResponse.json({ success: true, studentId }, { status: 201 });
  } catch (err: any) {
    console.error("ERROR createStudent:", err);
    return NextResponse.json(
      { error: err?.message ?? "Error al registrar estudiante" },
      { status: 500 }
    );
  }
}
