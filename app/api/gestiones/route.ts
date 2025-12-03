// app/api/gestiones/route.ts
import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import isAdmin from "../_utils/isAdmin";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      adminUid,
      anio,
    }: {
      adminUid: string;
      anio: number;
    } = body;

    if (!adminUid || !anio) {
      return NextResponse.json(
        { error: "Faltan adminUid o anio" },
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

    const existenteSnap = await gestionesRef.where("anio", "==", anio).get();
    if (!existenteSnap.empty) {
      return NextResponse.json(
        { error: "Ya existe una gestión con ese año" },
        { status: 400 }
      );
    }

    const gestionRef = gestionesRef.doc();
    const payload = {
      anio,
      estado: "PLANIFICADA",
      isActive: false,
      createdAt: new Date(),
      createdBy: adminUid,
    };

    await gestionRef.set(payload);

    return NextResponse.json(
      {
        success: true,
        id: gestionRef.id,
        data: payload,
      },
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
    const snap = await adminDb.collection("gestiones").get();

    const gestiones = snap.docs.map(docSnap => ({
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
