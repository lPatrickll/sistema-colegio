// app/api/inscriptions/route.ts
import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import isAdmin from "../_utils/isAdmin";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      adminUid,
      studentId,
      courseId,
      gestionId,
      tipoInscripcion,
    }: {
      adminUid: string;
      studentId: string;
      courseId: string;
      gestionId: string;
      tipoInscripcion?: string;
    } = body;

    if (!adminUid || !studentId || !courseId || !gestionId) {
      return NextResponse.json(
        { error: "Faltan adminUid, studentId, courseId o gestionId" },
        { status: 400 }
      );
    }

    const can = await isAdmin(adminUid);
    if (!can) {
      return NextResponse.json(
        { error: "No autorizado, se requiere ADMIN" },
        { status: 403 }
      );
    }

    const inscriptionsRef = adminDb.collection("inscriptions");

    const existenteSnap = await inscriptionsRef
      .where("studentId", "==", studentId)
      .where("courseId", "==", courseId)
      .where("gestionId", "==", gestionId)
      .where("estado", "==", "ACTIVO")
      .get();

    if (!existenteSnap.empty) {
      return NextResponse.json(
        { error: "El estudiante ya está inscrito en ese curso para esa gestión" },
        { status: 400 }
      );
    }

    const insRef = inscriptionsRef.doc();
    const payload = {
      studentId,
      courseId,
      gestionId,
      fechaInscripcion: new Date(),
      tipoInscripcion: tipoInscripcion ?? "REGULAR",
      estado: "ACTIVO",
    };

    await insRef.set(payload);

    return NextResponse.json(
      {
        success: true,
        id: insRef.id,
        data: payload,
      },
      { status: 201 }
    );
  } catch (err: any) {
    console.error("[POST /api/inscriptions] Error:", err);
    return NextResponse.json(
      { error: err?.message ?? "Error al crear inscripción" },
      { status: 500 }
    );
  }
}
