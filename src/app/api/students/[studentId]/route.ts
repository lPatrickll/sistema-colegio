// src/app/api/students/[studentId]/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { requireAdmin } from "@/app/api/_utils/requireAdmin";
import { generateStudentCode, getBirthYearFromISO } from "@/lib/studentCode";

function norm(str: string) {
  return String(str ?? "").trim().replace(/\s+/g, " ");
}

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ studentId: string }> }
) {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { studentId } = await ctx.params;

  try {
    const snap = await adminDb.collection("students").doc(studentId).get();
    if (!snap.exists) return NextResponse.json({ error: "No existe" }, { status: 404 });

    const s = snap.data() as any;

    const fecha = s?.fechaNacimiento?.toDate
      ? s.fechaNacimiento.toDate().toISOString().slice(0, 10)
      : s?.fechaNacimiento instanceof Date
        ? s.fechaNacimiento.toISOString().slice(0, 10)
        : "";

    return NextResponse.json(
      {
        id: snap.id,
        ...s,
        fechaNacimientoISO: fecha,
      },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("[GET /api/students/:id] Error:", err);
    return NextResponse.json({ error: err?.message ?? "Error" }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ studentId: string }> }
) {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { studentId } = await ctx.params;

  try {
    const snap = await adminDb.collection("students").doc(studentId).get();
    if (!snap.exists) return NextResponse.json({ error: "No existe" }, { status: 404 });

    const body = await req.json();

    const nombre = norm(body?.nombres ?? body?.nombre);
    const primerApellido = norm(body?.primerApellido);
    const segundoApellido = norm(body?.segundoApellido);
    const ci = norm(body?.ci);
    const fechaNacimientoISO = norm(body?.fechaNacimiento);
    const activo = Boolean(body?.activo ?? true);

    if (!nombre) return NextResponse.json({ error: "Nombres es obligatorio" }, { status: 400 });
    if (!primerApellido)
      return NextResponse.json({ error: "Primer apellido es obligatorio" }, { status: 400 });
    if (!ci) return NextResponse.json({ error: "CI es obligatorio" }, { status: 400 });
    if (!fechaNacimientoISO)
      return NextResponse.json({ error: "Fecha de nacimiento es obligatorio" }, { status: 400 });

    const anioNacimiento = getBirthYearFromISO(fechaNacimientoISO);
    if (!anioNacimiento) {
      return NextResponse.json({ error: "Fecha de nacimiento inválida" }, { status: 400 });
    }

    const current = snap.data() as any;
    const currentCi = String(current?.ci ?? "");

    if (ci !== currentCi) {
      const ciSnap = await adminDb.collection("students").where("ci", "==", ci).limit(2).get();
      const other = ciSnap.docs.find((d) => d.id !== studentId);
      if (other) {
        return NextResponse.json({ error: "El CI ya está registrado" }, { status: 409 });
      }
    }

    const { codigo } = generateStudentCode({
      nombres: nombre,
      primerApellido,
      fechaNacimientoISO,
    });

    if (!codigo) {
      return NextResponse.json(
        { error: "No se pudo generar el código del estudiante" },
        { status: 400 }
      );
    }

    const documentosEntregados = {
      fotocopiaCarnet: Boolean(body?.documentosEntregados?.fotocopiaCarnet),
      certificadoNacimiento: Boolean(body?.documentosEntregados?.certificadoNacimiento),
      boletinAnioPasado: Boolean(body?.documentosEntregados?.boletinAnioPasado),
    };

    const telefonosTutor: string[] = Array.isArray(body?.telefonosTutor)
      ? body.telefonosTutor.map(norm).filter(Boolean)
      : [];

    if (telefonosTutor.length === 0) {
      return NextResponse.json(
        { error: "Debes registrar al menos un celular del tutor" },
        { status: 400 }
      );
    }

    const direccion = norm(body?.direccion);
    if (!direccion) {
      return NextResponse.json(
        { error: "Dirección de vivienda es obligatorio" },
        { status: 400 }
      );
    }

    const telefonoEstudiante = norm(body?.telefonoEstudiante);
    const colegioProcedencia = norm(body?.colegioProcedencia);
    const observaciones = norm(body?.observaciones);

    const apellido = [primerApellido, segundoApellido].filter(Boolean).join(" ").trim();
    const nombreCompleto = `${nombre} ${apellido}`.trim();

    await adminDb.collection("students").doc(studentId).update({
      nombre,
      primerApellido,
      segundoApellido: segundoApellido || null,
      apellido,
      nombreCompleto,
      nombreCompletoLower: nombreCompleto.toLowerCase(),
      ci,
      codigo,
      fechaNacimiento: new Date(`${fechaNacimientoISO}T00:00:00`),
      anioNacimiento,
      documentosEntregados,
      telefonosTutor,
      telefonoEstudiante: telefonoEstudiante || null,
      direccion,
      colegioProcedencia: colegioProcedencia || null,
      observaciones: observaciones || null,
      estado: activo ? "ACTIVO" : "INACTIVO",
      updatedAt: new Date(),
      updatedBy: auth.uid,
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err: any) {
    console.error("[PATCH /api/students/:id] Error:", err);
    return NextResponse.json({ error: err?.message ?? "Error" }, { status: 500 });
  }
}
