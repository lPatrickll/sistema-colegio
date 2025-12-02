// app/api/createCourse/route.ts
import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

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
      nombre,
      paralelo,
      materias,
      estudiantes,
      createdBy,
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

    if (!nombre || !paralelo) {
      return NextResponse.json(
        { error: "Nombre y paralelo son obligatorios" },
        { status: 400 }
      );
    }

    if (!materias || !Array.isArray(materias) || materias.length === 0) {
      return NextResponse.json(
        { error: "El curso debe tener al menos 1 materia" },
        { status: 400 }
      );
    }

    await adminDb.collection("courses").add({
      nombre,
      paralelo,
      materias,
      estudiantes: estudiantes ?? [],
      createdAt: new Date(),
      createdBy: createdBy ?? adminUid,
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("ERROR createCourse:", err);
    return NextResponse.json(
      { error: err.message ?? "Error al crear curso" },
      { status: 500 }
    );
  }
}
