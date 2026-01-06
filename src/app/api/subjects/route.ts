export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { requireAdmin } from "../_utils/requireAdmin";

function normalizeNombre(nombre: string) {
  return nombre.trim().replace(/\s+/g, " ");
}

function toKey(nombre: string) {
  return normalizeNombre(nombre).toLowerCase();
}

function base64url(str: string) {
  return Buffer.from(str, "utf8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

const NIVELES = ["PRIMARIA", "SECUNDARIA"] as const;
type Nivel = (typeof NIVELES)[number];

export async function POST(req: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    const body = await req.json();

    const gestionId = String(body?.gestionId ?? "").trim();
    const nombre = String(body?.nombre ?? "").trim();
    const nivel = String(body?.nivel ?? "").toUpperCase().trim();
    const activa = Boolean(body?.activa);

    if (!gestionId) {
      return NextResponse.json({ error: "Falta gestionId" }, { status: 400 });
    }
    if (!nombre || nombre.length < 2) {
      return NextResponse.json({ error: "Nombre inválido" }, { status: 400 });
    }
    if (!NIVELES.includes(nivel as Nivel)) {
      return NextResponse.json({ error: "Nivel inválido" }, { status: 400 });
    }

    const gestionSnap = await adminDb.collection("gestiones").doc(gestionId).get();
    if (!gestionSnap.exists) {
      return NextResponse.json({ error: "Gestión no existe" }, { status: 400 });
    }

    const nombreNorm = normalizeNombre(nombre);
    const nombreLower = toKey(nombreNorm);

    const docId = base64url(`${gestionId}__${nivel}__${nombreLower}`);
    const ref = adminDb.collection("subjects").doc(docId);

    const exists = await ref.get();
    if (exists.exists) {
      return NextResponse.json(
        { error: "Ya existe una materia con ese nombre y nivel en esta gestión" },
        { status: 400 }
      );
    }

    const payload = {
      gestionId,
      nombre: nombreNorm,
      nombreLower,
      nivel,
      activa,
      createdAt: new Date(),
      createdBy: auth.uid,
    };

    await ref.set(payload);

    return NextResponse.json({ ok: true, id: ref.id, subject: payload }, { status: 201 });
  } catch (err: any) {
    console.error("[POST /api/subjects] Error:", err);
    return NextResponse.json(
      { error: err?.message ?? "Error al crear materia" },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    const { searchParams } = new URL(req.url);
    const gestionId = String(searchParams.get("gestionId") ?? "").trim();

    if (!gestionId) {
      return NextResponse.json({ error: "Falta gestionId" }, { status: 400 });
    }

    const snap = await adminDb
      .collection("subjects")
      .where("gestionId", "==", gestionId)
      .get();

    const subjects = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));

    subjects.sort((a, b) => {
      const na = String(a?.nombreLower ?? a?.nombre ?? "");
      const nb = String(b?.nombreLower ?? b?.nombre ?? "");
      return na.localeCompare(nb);
    });

    return NextResponse.json({ ok: true, subjects }, { status: 200 });
  } catch (err: any) {
    console.error("[GET /api/subjects] Error:", err);
    return NextResponse.json(
      { error: err?.message ?? "Error al listar materias" },
      { status: 500 }
    );
  }
}
