// src/app/api/createSubject/route.ts
import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

async function isAdmin(uid: string) {
  const doc = await adminDb.collection("users").doc(uid).get();
  if (!doc.exists) return false;
  return doc.data()?.role === "admin";
}

export async function POST(req: Request) {
  try {
    const data = await req.json();

    const { adminUid, nombre, sigla } = data;

    if (!adminUid) {
      return NextResponse.json({ error: "Falta adminUid" }, { status: 400 });
    }

    const adminIsValid = await isAdmin(adminUid);
    if (!adminIsValid) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    if (!nombre || !sigla) {
      return NextResponse.json(
        { error: "Nombre y sigla son obligatorios" },
        { status: 400 }
      );
    }

    await adminDb.collection("subjects").add({
      nombre,
      sigla,
      createdAt: new Date(),
      createdBy: adminUid,
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("ERROR createSubject:", err);
    return NextResponse.json(
      { error: err.message ?? "Error al crear la materia" },
      { status: 500 }
    );
  }
}
