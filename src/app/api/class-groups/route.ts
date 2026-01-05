// app/api/class-groups/route.ts
import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import isAdmin from "../_utils/isAdmin";

type ScheduleInput = {
  diaSemana: string;
  horaInicio: string;
  horaFin: string;
};

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      adminUid,
      gestionId,
      courseId,
      subjectId,
      teacherId,
      horasSemana,
      schedules,
    }: {
      adminUid: string;
      gestionId: string;
      courseId: string;
      subjectId: string;
      teacherId: string;
      horasSemana: number;
      schedules: ScheduleInput[];
    } = body;

    if (!adminUid) {
      return NextResponse.json({ error: "Falta adminUid" }, { status: 400 });
    }

    const isAdminUser = await isAdmin(adminUid);
    if (!isAdminUser) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    if (!gestionId || !courseId || !subjectId || !teacherId) {
      return NextResponse.json(
        { error: "Faltan gestionId, courseId, subjectId o teacherId" },
        { status: 400 }
      );
    }

    const [gestionSnap, courseSnap, subjectSnap, teacherSnap] =
      await Promise.all([
        adminDb.collection("gestiones").doc(gestionId).get(),
        adminDb.collection("courses").doc(courseId).get(),
        adminDb.collection("subjects").doc(subjectId).get(),
        adminDb.collection("teachers").doc(teacherId).get(),
      ]);

    if (!gestionSnap.exists) {
      return NextResponse.json(
        { error: "Gestión académica no encontrada" },
        { status: 404 }
      );
    }
    if (!courseSnap.exists) {
      return NextResponse.json({ error: "Curso no encontrado" }, { status: 404 });
    }
    if (!subjectSnap.exists) {
      return NextResponse.json(
        { error: "Materia no encontrada" },
        { status: 404 }
      );
    }
    if (!teacherSnap.exists) {
      return NextResponse.json(
        { error: "Docente no encontrado" },
        { status: 404 }
      );
    }

    const courseData = courseSnap.data() as any;
    const subjectData = subjectSnap.data() as any;
    const teacherData = teacherSnap.data() as any;

    const groupRef = adminDb.collection("classGroups").doc();
    const now = new Date();

    const groupPayload = {
      gestionId,
      courseId,
      subjectId,
      teacherId,
      horasSemana,
      courseName: courseData?.nombre ?? "",
      courseParalelo: courseData?.paralelo ?? "",
      subjectName: subjectData?.nombre ?? "",
      subjectSigla: subjectData?.sigla ?? "",
      teacherName:
        `${teacherData?.nombre ?? ""} ${teacherData?.apellido ?? ""}`.trim(),
      createdAt: now,
      createdBy: adminUid,
    };

    const batch = adminDb.batch();
    batch.set(groupRef, groupPayload);

    if (Array.isArray(schedules)) {
      schedules.forEach(sch => {
        const schedRef = adminDb.collection("classSchedules").doc();
        batch.set(schedRef, {
          groupId: groupRef.id,
          diaSemana: sch.diaSemana,
          horaInicio: sch.horaInicio,
          horaFin: sch.horaFin,
          teacherId,
          courseId,
          subjectId,
          createdAt: now,
        });
      });
    }

    await batch.commit();

    return NextResponse.json({
      success: true,
      groupId: groupRef.id,
    });
  } catch (err: any) {
    console.error("ERROR createClassGroup:", err);
    return NextResponse.json(
      { error: err.message ?? "Error al crear grupo de clase" },
      { status: 500 }
    );
  }
}
