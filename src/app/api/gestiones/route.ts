// src/app/api/gestiones/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { requireAdmin } from "../_utils/requireAdmin";

export async function POST(req: Request) {
  try {
    const guard = await requireAdmin();
    if (!guard.ok) {
      return NextResponse.json({ error: guard.error }, { status: guard.status });
    }

    const body = await req.json();
    const anio = Number(body?.anio);

    if (!anio) {
      return NextResponse.json({ error: "Falta anio" }, { status: 400 });
    }

    const gestionesRef = adminDb.collection("gestiones");

    const existenteSnap = await gestionesRef.where("anio", "==", anio).get();
    if (!existenteSnap.empty) {
      return NextResponse.json({ error: "Ya existe una gestión con ese año" }, { status: 400 });
    }

    const gestionRef = gestionesRef.doc();
    const payload = {
      anio,
      estado: "PLANIFICADA",
      isActive: false,
      createdAt: new Date(),
      createdBy: guard.uid,
    };

    await gestionRef.set(payload);

    return NextResponse.json(
      { success: true, id: gestionRef.id, data: payload },
      { status: 201 }
    );
  } catch (err: any) {
    console.error("[POST /api/gestiones] Error:", err);
    return NextResponse.json(
      { error: err?.message ?? "Error al crear gestión" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const guard = await requireAdmin();
    if (!guard.ok) {
      return NextResponse.json({ error: guard.error }, { status: guard.status });
    }

    const snap = await adminDb.collection("gestiones").get();

    const gestiones = snap.docs.map((docSnap) => ({
      id: docSnap.id,
      ...(docSnap.data() as any),
    }));

    return NextResponse.json({ gestiones }, { status: 200 });
  } catch (err: any) {
    console.error("[GET /api/gestiones] Error:", err);
    return NextResponse.json(
      { error: err?.message ?? "Error al listar gestiones" },
      { status: 500 }
    );
  }
}
