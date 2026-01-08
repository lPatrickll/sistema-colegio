// src/app/api/teachers/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { requireAdmin } from "@/app/api/_utils/requireAdmin";

type TeachingMap = Record<string, string[]>;

function norm(str: string) {
  return str.trim().replace(/\s+/g, " ");
}

function uniqStrings(arr: string[]) {
  return Array.from(new Set(arr.map((x) => String(x).trim()).filter(Boolean)));
}

function parseTeaching(raw: any): TeachingMap {
  if (!raw || typeof raw !== "object") return {};
  const out: TeachingMap = {};

  for (const [courseIdRaw, subjectIdsRaw] of Object.entries(raw)) {
    const courseId = String(courseIdRaw ?? "").trim();
    if (!courseId) continue;

    const subjectIds = Array.isArray(subjectIdsRaw)
      ? uniqStrings(subjectIdsRaw as any[])
      : [];

    if (subjectIds.length) out[courseId] = subjectIds;
  }

  return out;
}

async function validateTeaching(gestionId: string, teaching: TeachingMap): Promise<string | null> {
  const courseIds = Object.keys(teaching);
  if (courseIds.length === 0) return "Debes asignar al menos una materia al profesor.";

  const courseSnaps = await Promise.all(courseIds.map((id) => adminDb.collection("courses").doc(id).get()));

  for (let i = 0; i < courseIds.length; i++) {
    const id = courseIds[i];
    const snap = courseSnaps[i];
    if (!snap.exists) return `Curso no existe: ${id}`;

    const c = snap.data() as any;
    if (String(c?.gestionId ?? "") !== gestionId) return `El curso ${id} no pertenece a esta gestión.`;
  }

  const allSubjectIds = uniqStrings(courseIds.flatMap((cid) => teaching[cid] ?? []));
  if (allSubjectIds.length === 0) return "Debes seleccionar al menos una materia.";

  const subjectSnaps = await Promise.all(allSubjectIds.map((id) => adminDb.collection("subjects").doc(id).get()));
  const subjectMap = new Map<string, any>();

  for (let i = 0; i < allSubjectIds.length; i++) {
    const id = allSubjectIds[i];
    const snap = subjectSnaps[i];
    if (!snap.exists) return `Materia no existe: ${id}`;

    const s = snap.data() as any;
    if (String(s?.gestionId ?? "") !== gestionId) return `La materia ${id} no pertenece a esta gestión.`;
    subjectMap.set(id, s);
  }

  for (const courseId of courseIds) {
    const subjectIds = teaching[courseId] ?? [];
    if (subjectIds.length === 0) return `Seleccionaste el curso ${courseId} pero no marcaste materias.`;

    for (const subjectId of subjectIds) {
      const s = subjectMap.get(subjectId);
      if (!s) return `Materia no existe: ${subjectId}`;
      if (String(s?.courseId ?? "") !== courseId) return `La materia ${subjectId} no pertenece al curso ${courseId}.`;
    }
  }

  return null;
}

function isEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(req: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  let createdAuthUid: string | null = null;

  try {
    const body = await req.json();

    const gestionId = String(body?.gestionId ?? "").trim();
    const nombres = norm(String(body?.nombres ?? ""));
    const apellidoPaterno = norm(String(body?.apellidoPaterno ?? ""));
    const apellidoMaterno = norm(String(body?.apellidoMaterno ?? ""));
    const ci = String(body?.ci ?? "").trim();
    const email = String(body?.email ?? "").trim().toLowerCase();
    const telefonoRaw = String(body?.telefono ?? "").trim();
    const activo = Boolean(body?.activo ?? true);

    const teaching = parseTeaching(body?.teaching);

    if (!gestionId) return NextResponse.json({ error: "Falta gestionId" }, { status: 400 });
    if (!nombres) return NextResponse.json({ error: "Nombres es obligatorio" }, { status: 400 });
    if (!apellidoPaterno) return NextResponse.json({ error: "Primer apellido es obligatorio" }, { status: 400 });
    if (!apellidoMaterno) return NextResponse.json({ error: "Segundo apellido es obligatorio" }, { status: 400 });

    if (!ci) return NextResponse.json({ error: "CI es obligatorio" }, { status: 400 });
    if (!/^\d{6,12}$/.test(ci)) {
      return NextResponse.json({ error: "CI inválido (solo números, 6 a 12 dígitos)" }, { status: 400 });
    }

    if (!email) return NextResponse.json({ error: "Correo es obligatorio" }, { status: 400 });
    if (!isEmail(email)) return NextResponse.json({ error: "Correo inválido" }, { status: 400 });

    const telefono = telefonoRaw ? telefonoRaw : undefined;
    if (telefono && !/^\d{7,12}$/.test(telefono)) {
      return NextResponse.json({ error: "Teléfono inválido (7 a 12 dígitos)" }, { status: 400 });
    }

    const gSnap = await adminDb.collection("gestiones").doc(gestionId).get();
    if (!gSnap.exists) return NextResponse.json({ error: "Gestión no existe" }, { status: 400 });

    const teachingErr = await validateTeaching(gestionId, teaching);
    if (teachingErr) return NextResponse.json({ error: teachingErr }, { status: 400 });

    const dupCI = await adminDb.collection("teachers").where("ci", "==", ci).limit(1).get();
    if (!dupCI.empty) return NextResponse.json({ error: "Ya existe un profesor con ese CI" }, { status: 400 });

    const dupEmail = await adminDb.collection("teachers").where("email", "==", email).limit(1).get();
    if (!dupEmail.empty) return NextResponse.json({ error: "Ya existe un profesor con ese correo" }, { status: 400 });

    const nombreCompleto = `${nombres} ${apellidoPaterno} ${apellidoMaterno}`.trim();

    const userRecord = await adminAuth.createUser({
      email,
      password: ci,
      displayName: nombreCompleto,
      disabled: !activo,
    });

    createdAuthUid = userRecord.uid;

    const teachingCourseIds = Object.keys(teaching);
    const teachingSubjectIds = uniqStrings(teachingCourseIds.flatMap((cid) => teaching[cid] ?? []));

    const teacherRef = adminDb.collection("teachers").doc();

    const teacherPayload = {
      gestionId,
      nombres,
      apellidoPaterno,
      apellidoMaterno,
      nombreCompleto,
      nombreCompletoLower: nombreCompleto.toLowerCase(),
      ci,
      email,
      authUid: createdAuthUid,
      telefono: telefono ?? null,
      activo,
      teaching,
      teachingCourseIds,
      teachingSubjectIds,
      createdAt: new Date(),
      createdBy: auth.uid,
    };

    const userDocRef = adminDb.collection("users").doc(createdAuthUid);
    const userDoc = {
      roles: ["TEACHER"],
      teacherId: teacherRef.id,
      gestionId,
      email,
      displayName: nombreCompleto,
      createdAt: new Date(),
      createdBy: auth.uid,
    };

    const batch = adminDb.batch();
    batch.set(teacherRef, teacherPayload);
    batch.set(userDocRef, userDoc, { merge: true });
    await batch.commit();

    return NextResponse.json({ success: true, id: teacherRef.id }, { status: 201 });
  } catch (err: any) {
    console.error("[POST /api/teachers] Error:", err);

    if (createdAuthUid) {
      try {
        await adminAuth.deleteUser(createdAuthUid);
      } catch (e) {
        console.error("[POST /api/teachers] rollback deleteUser failed:", e);
      }
    }

    const msg = String(err?.message ?? "Error al crear profesor");

    if (msg.includes("auth/email-already-exists")) {
      return NextResponse.json({ error: "Ese correo ya está registrado en el sistema" }, { status: 409 });
    }
    if (msg.includes("auth/invalid-password")) {
      return NextResponse.json(
        { error: "Contraseña inválida. Revisa el CI (Firebase requiere mínimo 6 caracteres)" },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function GET(req: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    const { searchParams } = new URL(req.url);
    const gestionId = String(searchParams.get("gestionId") ?? "").trim();
    if (!gestionId) return NextResponse.json({ error: "Falta gestionId" }, { status: 400 });

    const snap = await adminDb.collection("teachers").where("gestionId", "==", gestionId).get();
    const teachers = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));

    teachers.sort((a: any, b: any) =>
      String(a?.nombreCompletoLower ?? "").localeCompare(String(b?.nombreCompletoLower ?? ""))
    );

    return NextResponse.json({ teachers }, { status: 200 });
  } catch (err: any) {
    console.error("[GET /api/teachers] Error:", err);
    return NextResponse.json({ error: err?.message ?? "Error al listar profesores" }, { status: 500 });
  }
}
