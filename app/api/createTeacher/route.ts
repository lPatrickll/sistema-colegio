// src/app/api/createTeacher/route.ts
import { NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";

async function isAdmin(uid: string) {
  const doc = await adminDb.collection("users").doc(uid).get();
  if (!doc.exists) return false;
  return doc.data()?.role === "admin";
}

export async function POST(req: Request) {
  try {
    const data = await req.json();

    const {
      adminUid,
      nombreCompleto,
      ci,
      email,
      telefono,
      materiaId,
      materiaNombre,
      materiaSigla,
    } = data;

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

    if (!nombreCompleto || !ci || !email || !materiaId) {
      return NextResponse.json(
        { error: "Faltan datos obligatorios" },
        { status: 400 }
      );
    }

    const newUser = await adminAuth.createUser({
      email,
      password: ci, // contraseña inicial
      displayName: nombreCompleto,
    });

    await adminDb.collection("users").doc(newUser.uid).set({
      role: "teacher",
      email,
      name: nombreCompleto,
    });

    await adminDb.collection("teachers").add({
      uid: newUser.uid,
      nombreCompleto,
      ci,
      email,
      telefono,
      materiaId,
      materiaNombre,
      materiaSigla,
      createdAt: new Date(),
      createdBy: adminUid,
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    );
  }
}
