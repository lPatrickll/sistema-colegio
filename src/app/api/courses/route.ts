import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { adminAuth, adminDb } from "@/lib/firebase-admin";

async function requireAdmin(): Promise<{ uid: string } | null> {
  const session = (await cookies()).get("__session")?.value;
  if (!session) return null;

  const decoded = await adminAuth.verifySessionCookie(session, true);

  const snap = await adminDb.collection("users").doc(decoded.uid).get();
  if (!snap.exists) return null;

  const data = snap.data() as any;

  const rolesRaw: string[] = Array.isArray(data?.roles)
    ? data.roles
    : data?.role
      ? [data.role]
      : [];

  const roles = rolesRaw.map((r) => String(r).toUpperCase());
  if (!roles.includes("ADMIN")) return null;

  return { uid: decoded.uid };
}

export async function GET(req: Request) {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const gestionId = searchParams.get("gestionId")?.trim();

    if (!gestionId) {
      return NextResponse.json({ error: "Falta gestionId" }, { status: 400 });
    }

    const snap = await adminDb
      .collection("courses")
      .where("gestionId", "==", gestionId)
      .get();

    const courses = snap.docs
      .map((d) => ({ id: d.id, ...(d.data() as any) }))
      .sort((a: any, b: any) => {
        const ta = a?.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
        const tb = b?.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
        return tb - ta;
      });

    return NextResponse.json({ courses }, { status: 200 });
  } catch (err: any) {
    console.error("GET /api/courses error:", err);
    return NextResponse.json(
      { error: err?.message ?? "Error al listar cursos" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await req.json();
    const gestionId = String(body?.gestionId ?? "").trim();
    const nombre = String(body?.nombre ?? "").trim();
    const nivel = String(body?.nivel ?? "").trim();
    const activo = Boolean(body?.activo ?? true);

    if (!gestionId) {
      return NextResponse.json({ error: "Falta gestionId" }, { status: 400 });
    }
    if (!nombre) {
      return NextResponse.json({ error: "Nombre es obligatorio" }, { status: 400 });
    }
    if (!nivel) {
      return NextResponse.json({ error: "Nivel es obligatorio" }, { status: 400 });
    }

    const docRef = await adminDb.collection("courses").add({
      gestionId,
      nombre,
      nombreLower: nombre.toLowerCase(),
      nivel,
      activo,
      createdAt: new Date(),
      createdBy: admin.uid,
    });

    return NextResponse.json({ id: docRef.id }, { status: 201 });
  } catch (err: any) {
    console.error("POST /api/courses error:", err);
    return NextResponse.json(
      { error: err?.message ?? "Error al crear curso" },
      { status: 500 }
    );
  }
}
