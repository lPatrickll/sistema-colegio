// src/app/api/courses/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { requireAdmin } from "../_utils/requireAdmin";

function toUpper(s: string) {
  return String(s ?? "").trim().toUpperCase();
}

function toLower(s: string) {
  return String(s ?? "").trim().toLowerCase();
}

export async function POST(req: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = await req.json();
    const { gestionId, nombre, nivel } = body as {
      gestionId?: string;
      nombre?: string;
      nivel?: string;
    };

    if (!gestionId || !String(gestionId).trim()) {
      return NextResponse.json({ error: "Falta gestionId" }, { status: 400 });
    }
    if (!nombre || !String(nombre).trim()) {
      return NextResponse.json({ error: "Falta nombre" }, { status: 400 });
    }
    if (!nivel || !String(nivel).trim()) {
      return NextResponse.json({ error: "Falta nivel" }, { status: 400 });
    }

    const payload = {
      gestionId: String(gestionId).trim(),
      nombre: String(nombre).trim(),
      nombreLower: toLower(nombre),
      nivel: toUpper(nivel),
      createdAt: new Date(),
      createdBy: auth.uid,
    };

    const ref = adminDb.collection("courses").doc();
    await ref.set(payload);

    return NextResponse.json({ success: true, id: ref.id, data: payload }, { status: 201 });
  } catch (err: any) {
    console.error("[POST /api/courses] Error:", err);
    return NextResponse.json(
      { error: err?.message ?? "Error al crear curso" },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { searchParams } = new URL(req.url);
    const gestionId = searchParams.get("gestionId")?.trim();

    if (!gestionId) {
      return NextResponse.json({ error: "Falta gestionId" }, { status: 400 });
    }

    const snap = await adminDb
      .collection("courses")
      .where("gestionId", "==", gestionId)
      .get();

    const courses = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
    return NextResponse.json({ courses }, { status: 200 });
  } catch (err: any) {
    console.error("[GET /api/courses] Error:", err);
    return NextResponse.json(
      { error: err?.message ?? "Error al listar cursos" },
      { status: 500 }
    );
  }
}
