import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { requireAdmin } from "@/app/api/_utils/requireAdmin";

export async function GET(req: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    const { searchParams } = new URL(req.url);
    const courseId = String(searchParams.get("courseId") ?? "").trim();
    const gestionId = String(searchParams.get("gestionId") ?? "").trim();

    if (!courseId || !gestionId) {
      return NextResponse.json(
        { error: "Faltan courseId o gestionId en la query" },
        { status: 400 }
      );
    }

    const insSnap = await adminDb
      .collection("inscriptions")
      .where("courseId", "==", courseId)
      .where("gestionId", "==", gestionId)
      .where("estado", "==", "ACTIVO")
      .get();

    const results: any[] = [];

    for (const docSnap of insSnap.docs) {
      const data = docSnap.data() as any;
      const studentId = data.studentId;

      const studentSnap = await adminDb.collection("students").doc(studentId).get();

      results.push({
        inscriptionId: docSnap.id,
        studentId,
        student: studentSnap.exists ? { id: studentSnap.id, ...(studentSnap.data() as any) } : null,
      });
    }

    return NextResponse.json({ students: results, count: results.length }, { status: 200 });
  } catch (err: any) {
    console.error("[GET /api/inscriptions/by-course] Error:", err);
    return NextResponse.json(
      { error: err?.message ?? "Error al obtener estudiantes por curso" },
      { status: 500 }
    );
  }
}
