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

export async function POST(req: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    const body = await req.json();

    const gestionId = String(body?.gestionId ?? "").trim();
    const courseId = String(body?.courseId ?? "").trim();
    const nombre = String(body?.nombre ?? "").trim();
    const activa = Boolean(body?.activa ?? true);

    if (!gestionId) return NextResponse.json({ error: "Falta gestionId" }, { status: 400 });
    if (!courseId) return NextResponse.json({ error: "Falta courseId" }, { status: 400 });
    if (!nombre || nombre.length < 2) return NextResponse.json({ error: "Nombre inválido" }, { status: 400 });

    const courseSnap = await adminDb.collection("courses").doc(courseId).get();
    if (!courseSnap.exists) return NextResponse.json({ error: "Curso no existe" }, { status: 400 });

    const course = courseSnap.data() as any;
    if (String(course?.gestionId ?? "") !== gestionId) {
      return NextResponse.json({ error: "El curso no pertenece a esta gestión" }, { status: 400 });
    }

    const nombreNorm = normalizeNombre(nombre);
    const nombreLower = toKey(nombreNorm);

    const docId = base64url(`${gestionId}__${courseId}__${nombreLower}`);
    const ref = adminDb.collection("subjects").doc(docId);

    const exists = await ref.get();
    if (exists.exists) {
      return NextResponse.json(
        { error: "Ya existe una materia con ese nombre en este curso." },
        { status: 400 }
      );
    }

    const payload = {
      gestionId,
      courseId,
      courseNombre: course?.nombre ?? null,
      courseNombreLower: String(course?.nombre ?? "").toLowerCase(),
      nombre: nombreNorm,
      nombreLower,
      activa,
      createdAt: new Date(),
      createdBy: auth.uid,
    };

    await ref.set(payload);

    return NextResponse.json({ ok: true, id: ref.id, subject: payload }, { status: 201 });
  } catch (err: any) {
    console.error("[POST /api/subjects] Error:", err);
    return NextResponse.json({ error: err?.message ?? "Error al crear materia" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    const { searchParams } = new URL(req.url);
    const gestionId = String(searchParams.get("gestionId") ?? "").trim();
    const courseId = String(searchParams.get("courseId") ?? "").trim();

    if (!gestionId) return NextResponse.json({ error: "Falta gestionId" }, { status: 400 });

    let q: FirebaseFirestore.Query = adminDb.collection("subjects").where("gestionId", "==", gestionId);
    if (courseId) q = q.where("courseId", "==", courseId);

    const snap = await q.get();
    const subjects = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));

    subjects.sort((a, b) => {
      const ca = String(a?.courseNombreLower ?? "");
      const cb = String(b?.courseNombreLower ?? "");
      if (ca !== cb) return ca.localeCompare(cb);
      const na = String(a?.nombreLower ?? "");
      const nb = String(b?.nombreLower ?? "");
      return na.localeCompare(nb);
    });

    return NextResponse.json({ ok: true, subjects }, { status: 200 });
  } catch (err: any) {
    console.error("[GET /api/subjects] Error:", err);
    return NextResponse.json({ error: err?.message ?? "Error al listar materias" }, { status: 500 });
  }
}
