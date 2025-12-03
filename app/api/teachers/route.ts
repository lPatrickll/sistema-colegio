// src/app/api/teachers/route.ts
import { NextResponse } from "next/server";
import { adminDb, adminAuth } from "@/lib/firebase-admin";
import isAdmin from "../_utils/isAdmin";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      adminUid,
      nombre,
      apellido,
      ci,
      profesion,
      pagoPorHora,
      email,
      password,
      materiaId,
      materiaNombre,
      materiaSigla,
    } = body;

    if (!adminUid) {
      return NextResponse.json({ error: "Falta adminUid" }, { status: 400 });
    }

    const adminIsValid = await isAdmin(adminUid);
    if (!adminIsValid) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    if (!email || !password) {
      return NextResponse.json(
        { error: "Correo y contraseña son obligatorios" },
        { status: 400 }
      );
    }

    const userRecord = await adminAuth.createUser({
      email,
      password,
      displayName: `${nombre} ${apellido}`,
    });

    const uid = userRecord.uid;

    await adminDb.collection("users").doc(uid).set({
      email,
      nombre,
      apellido,
      roles: ["DOCENTE"],
      estado: "ACTIVO",
      firebaseUid: uid,
      fecha_creacion: new Date(),
    });

    await adminDb.collection("teachers").doc(uid).set({
      uid,
      nombre,
      apellido,
      nombreCompleto: `${nombre} ${apellido}`,
      ci,
      profesion,
      pagoPorHora: Number(pagoPorHora),
      materiaId,
      materiaNombre,
      materiaSigla,
      estado: "ACTIVO",
      createdAt: new Date(),
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("ERROR createTeacher:", err);
    return NextResponse.json(
      { error: err.message ?? "Error al registrar docente" },
      { status: 500 }
    );
  }
}
