// app/api/courses/route.ts
import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

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
      paralelo,
      gestionId,
      turno,
      cuposMaximos,
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

    if (!nombre || !paralelo || !gestionId) {
      return NextResponse.json(
        { error: "Nombre, paralelo y gestión son obligatorios" },
        { status: 400 }
      );
    }

    await adminDb.collection("courses").add({
      nombre,
      paralelo,
      gestionId,
      turno: turno ?? null,
      cuposMaximos: typeof cuposMaximos === "number" ? cuposMaximos : null,
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
