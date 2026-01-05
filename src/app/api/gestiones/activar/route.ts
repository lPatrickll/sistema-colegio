// src/app/api/gestiones/activar/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { requireAdmin } from "../../_utils/requireAdmin";

export async function POST(req: Request) {
  try {
    const guard = await requireAdmin();
    if (!guard.ok) {
      return NextResponse.json({ error: guard.error }, { status: guard.status });
    }

    const body = await req.json();
    const gestionId = String(body?.gestionId ?? "");

    if (!gestionId) {
      return NextResponse.json({ error: "Falta gestionId" }, { status: 400 });
    }

    const gestionesRef = adminDb.collection("gestiones");
    const targetRef = gestionesRef.doc(gestionId);
    const targetSnap = await targetRef.get();

    if (!targetSnap.exists) {
      return NextResponse.json({ error: "Gestión no encontrada" }, { status: 404 });
    }

    const batch = adminDb.batch();

    const activasSnap = await gestionesRef.where("isActive", "==", true).get();
    activasSnap.forEach((docSnap) => {
      batch.update(docSnap.ref, { isActive: false, estado: "CERRADA" });
    });

    batch.update(targetRef, { isActive: true, estado: "ACTIVA" });

    await batch.commit();

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err: any) {
    console.error("[POST /api/gestiones/activar] Error:", err);
    return NextResponse.json(
      { error: err?.message ?? "Error al activar gestión" },
      { status: 500 }
    );
  }
}
