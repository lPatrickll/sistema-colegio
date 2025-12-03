// src/app/api/students/route.ts
import { NextResponse } from "next/server";
import { adminDb, adminAuth } from "@/lib/firebase-admin";

async function isAdmin(uid: string) {
  const doc = await adminDb.collection("users").doc(uid).get();
  if (!doc.exists) return false;

  const data = doc.data();
  const roles = (data?.roles ?? []) as string[];
  return Array.isArray(roles) && roles.some(r => r.toUpperCase() === "ADMIN");
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      adminUid,
      nombre,
      apellido,
      ci,
      fechaNac,
      sexo,
      unidadProcedencia,
      email,
      password,
      gestionId,
      courseId,
    } = body;

    if (!adminUid) {
      return NextResponse.json({ error: "Falta adminUid" }, { status: 400 });
    }

    const adminIsValid = await isAdmin(adminUid);
    if (!adminIsValid) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    if (!nombre || !apellido || !ci || !fechaNac) {
      return NextResponse.json(
        { error: "Nombre, apellido, CI y fecha de nacimiento son obligatorios" },
        { status: 400 }
      );
    }

    let uid: string | null = null;

    if (email && password) {
      const userRecord = await adminAuth.createUser({
        email,
        password,
        displayName: `${nombre} ${apellido}`,
      });
      uid = userRecord.uid;

      await adminDb.collection("users").doc(uid).set({
        email,
        nombre,
        apellido,
        roles: ["ESTUDIANTE"],
        estado: "ACTIVO",
        firebaseUid: uid,
        fecha_creacion: new Date(),
      });
    }

    const nombreCompleto = `${nombre} ${apellido}`;

    const studentRef = await adminDb.collection("students").add({
      uid,
      nombre,
      apellido,
      nombreCompleto,
      ci,
      fechaNac,
      sexo,
      unidadProcedencia: unidadProcedencia ?? null,
      estado: "ACTIVO",
      createdAt: new Date(),
    });

    const studentId = studentRef.id;

    if (gestionId && courseId) {
      await adminDb.collection("inscripciones").add({
        estudianteId: studentId,
        gestionId,
        courseId,
        fechaInscripcion: new Date(),
        tipoInscripcion: "REGULAR",
        estado: "ACTIVO",
      });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("ERROR createStudent:", err);
    return NextResponse.json(
      { error: err.message ?? "Error al registrar estudiante" },
      { status: 500 }
    );
  }
}
