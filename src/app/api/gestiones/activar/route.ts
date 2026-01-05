// app/api/gestiones/activar/route.ts
import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import isAdmin from "../../_utils/isAdmin";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      adminUid,
      gestionId,
    }: {
      adminUid: string;
      gestionId: string;
    } = body;

    if (!adminUid || !gestionId) {
      return NextResponse.json(
        { error: "Faltan adminUid o gestionId" },
        { status: 400 }
      );
    }

    const can = await isAdmin(adminUid);
    if (!can) {
      return NextResponse.json(
        { error: "No autorizado, se requiere ADMIN" },
        { status: 403 }
      );
    }

    const gestionesRef = adminDb.collection("gestiones");
    const targetRef = gestionesRef.doc(gestionId);
    const targetSnap = await targetRef.get();

    if (!targetSnap.exists) {
      return NextResponse.json(
        { error: "Gestión no encontrada" },
        { status: 404 }
      );
    }

    const batch = adminDb.batch();

    const activasSnap = await gestionesRef.where("isActive", "==", true).get();
    activasSnap.forEach(docSnap => {
      batch.update(docSnap.ref, {
        isActive: false,
        estado: "CERRADA",
      });
    });

    batch.update(targetRef, {
      isActive: true,
      estado: "ACTIVA",
    });

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
