// src/app/api/subjects/route.ts
import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import isAdmin from "../_utils/isAdmin";

export async function POST(req: Request) {
  try {
    const data = await req.json();

    const { adminUid, nombre, sigla, nivelId, area } = data;

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
      nivelId: nivelId ?? null,
      area: area ?? null,
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
