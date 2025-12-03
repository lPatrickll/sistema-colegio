// app/api/inscriptions/by-course/route.ts
import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const courseId = searchParams.get("courseId");
    const gestionId = searchParams.get("gestionId");

    if (!courseId || !gestionId) {
      return NextResponse.json(
        { error: "Faltan courseId o gestionId en la query" },
        { status: 400 }
      );
    }

    const inscriptionsRef = adminDb.collection("inscriptions");
    const insSnap = await inscriptionsRef
      .where("courseId", "==", courseId)
      .where("gestionId", "==", gestionId)
      .where("estado", "==", "ACTIVO")
      .get();

    if (insSnap.empty) {
      return NextResponse.json(
        { students: [], count: 0 },
        { status: 200 }
      );
    }

    const results: any[] = [];

    for (const docSnap of insSnap.docs) {
      const data = docSnap.data() as any;
      const studentId = data.studentId;

      const studentSnap = await adminDb.collection("students").doc(studentId).get();

      let studentData: any = null;
      if (studentSnap.exists) {
        studentData = {
          id: studentSnap.id,
          ...(studentSnap.data() as any),
        };
      }

      results.push({
        inscriptionId: docSnap.id,
        studentId,
        student: studentData,
      });
    }

    return NextResponse.json(
      {
        students: results,
        count: results.length,
      },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("[GET /api/inscriptions/by-course] Error:", err);
    return NextResponse.json(
      { error: err?.message ?? "Error al obtener estudiantes por curso" },
      { status: 500 }
    );
  }
}
