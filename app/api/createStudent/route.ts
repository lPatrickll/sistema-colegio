// app/api/create-student/route.ts
import { NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";

async function isAdmin(uid: string) {
  const doc = await adminDb.collection("users").doc(uid).get();
  if (!doc.exists) return false;
  return doc.data()?.role === "admin";
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      adminUid,
      nombreCompleto,
      ci,
      email,
      curso,
      paralelo,
      telefono,
    } = body;

    if (!adminUid) {
      return NextResponse.json(
        { error: "Falta adminUid" },
        { status: 400 }
      );
    }

    const adminIsValid = await isAdmin(adminUid);
    if (!adminIsValid) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 403 }
      );
    }

    if (!nombreCompleto || !ci || !email) {
      return NextResponse.json(
        { error: "Nombre, CI y correo son obligatorios" },
        { status: 400 }
      );
    }

    const newUser = await adminAuth.createUser({
      email,
      password: ci,
      displayName: nombreCompleto,
    });

    await adminDb.collection("users").doc(newUser.uid).set({
      role: "student",
      email,
      name: nombreCompleto,
    });

    await adminDb.collection("students").add({
      uid: newUser.uid,
      nombreCompleto,
      ci,
      email,
      curso,
      paralelo,
      telefono,
      createdAt: new Date(),
      createdBy: adminUid,
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json(
      { error: err.message ?? "Error al crear estudiante" },
      { status: 500 }
    );
  }
}
