// src/app/api/teachers/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { requireAdmin } from "@/app/api/_utils/requireAdmin";

function norm(str: string) {
  return str.trim().replace(/\s+/g, " ");
}

export async function POST(req: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = await req.json();

    const gestionId = String(body?.gestionId ?? "").trim();
    const nombres = norm(String(body?.nombres ?? ""));
    const apellidoPaterno = norm(String(body?.apellidoPaterno ?? ""));
    const apellidoMaterno = norm(String(body?.apellidoMaterno ?? ""));
    const ci = String(body?.ci ?? "").trim();
    const telefonoRaw = String(body?.telefono ?? "").trim();
    const activo = Boolean(body?.activo ?? true);

    if (!gestionId) {
      return NextResponse.json({ error: "Falta gestionId" }, { status: 400 });
    }
    if (!nombres) {
      return NextResponse.json({ error: "Nombres es obligatorio" }, { status: 400 });
    }
    if (!apellidoPaterno) {
      return NextResponse.json({ error: "Primer apellido es obligatorio" }, { status: 400 });
    }
    if (!apellidoMaterno) {
      return NextResponse.json({ error: "Segundo apellido es obligatorio" }, { status: 400 });
    }
    if (!ci) {
      return NextResponse.json({ error: "CI es obligatorio" }, { status: 400 });
    }
    if (!/^\d{5,12}$/.test(ci)) {
      return NextResponse.json({ error: "CI inválido (solo números, 5 a 12 dígitos)" }, { status: 400 });
    }

    const telefono = telefonoRaw ? telefonoRaw : undefined;
    if (telefono && !/^\d{7,12}$/.test(telefono)) {
      return NextResponse.json({ error: "Teléfono inválido (7 a 12 dígitos)" }, { status: 400 });
    }

    const gSnap = await adminDb.collection("gestiones").doc(gestionId).get();
    if (!gSnap.exists) {
      return NextResponse.json({ error: "Gestión no existe" }, { status: 400 });
    }

    const dup = await adminDb.collection("teachers").where("ci", "==", ci).limit(1).get();
    if (!dup.empty) {
      return NextResponse.json({ error: "Ya existe un profesor con ese CI" }, { status: 400 });
    }

    const ref = adminDb.collection("teachers").doc();
    const payload = {
      gestionId,
      nombres,
      apellidoPaterno,
      apellidoMaterno,
      ci,
      telefono: telefono ?? null,
      activo,
      nombreCompleto: `${nombres} ${apellidoPaterno} ${apellidoMaterno}`,
      nombreCompletoLower: `${nombres} ${apellidoPaterno} ${apellidoMaterno}`.toLowerCase(),
      createdAt: new Date(),
      createdBy: auth.uid,
    };

    await ref.set(payload);

    return NextResponse.json({ success: true, id: ref.id, data: payload }, { status: 201 });
  } catch (err: any) {
    console.error("[POST /api/teachers] Error:", err);
    return NextResponse.json(
      { error: err?.message ?? "Error al crear profesor" },
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
    const gestionId = String(searchParams.get("gestionId") ?? "").trim();

    if (!gestionId) {
      return NextResponse.json({ error: "Falta gestionId" }, { status: 400 });
    }

    const snap = await adminDb
      .collection("teachers")
      .where("gestionId", "==", gestionId)
      .get();

    const teachers = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));

    return NextResponse.json({ teachers }, { status: 200 });
  } catch (err: any) {
    console.error("[GET /api/teachers] Error:", err);
    return NextResponse.json(
      { error: err?.message ?? "Error al listar profesores" },
      { status: 500 }
    );
  }
}
