// app/api/attendance/route.ts
import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import isAdmin from "../_utils/isAdmin";

type AttendanceInput = {
  studentId: string;
  estado: "PRESENTE" | "AUSENTE" | "ATRASO" | "JUSTIFICADO";
  minutosRetraso?: number;
  justificativo?: string;
};

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      userUid,
      groupId,
      fecha,
      tema,
      registros,
    }: {
      userUid: string;
      groupId: string;
      fecha: string;
      tema: string;
      registros: AttendanceInput[];
    } = body;

    if (!userUid) {
      return NextResponse.json({ error: "Falta userUid" }, { status: 400 });
    }
    if (!groupId || !fecha || !Array.isArray(registros)) {
      return NextResponse.json(
        { error: "Faltan groupId, fecha o registros" },
        { status: 400 }
      );
    }

    const groupSnap = await adminDb.collection("classGroups").doc(groupId).get();
    if (!groupSnap.exists) {
      return NextResponse.json(
        { error: "Grupo de clase no encontrado" },
        { status: 404 }
      );
    }
    const groupData = groupSnap.data() as any;

    const isAdminUser = await isAdmin(userUid);
    const isTeacherOfGroup = groupData?.teacherId === userUid;

    if (!isAdminUser && !isTeacherOfGroup) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const sessionRef = adminDb.collection("classSessions").doc();
    const now = new Date();

    const sessionPayload = {
      groupId,
      fecha,
      tema,
      createdAt: now,
      createdBy: userUid,
    };

    const batch = adminDb.batch();
    batch.set(sessionRef, sessionPayload);

    registros.forEach(reg => {
      const attRef = adminDb.collection("studentAttendance").doc();

      batch.set(attRef, {
        sessionId: sessionRef.id,
        studentId: reg.studentId,
        estado: reg.estado,
        minutosRetraso:
          reg.estado === "ATRASO" ? reg.minutosRetraso ?? 0 : null,
        justificativo: reg.justificativo ?? null,
        registradoPor: userUid,
        fechaRegistro: now,
      });
    });

    await batch.commit();

    return NextResponse.json({
      success: true,
      sessionId: sessionRef.id,
    });
  } catch (err: any) {
    console.error("ERROR registerAttendance:", err);
    return NextResponse.json(
      { error: err.message ?? "Error al registrar asistencia" },
      { status: 500 }
    );
  }
}
