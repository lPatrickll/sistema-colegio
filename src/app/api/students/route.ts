// src/app/api/students/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { requireAdmin } from "@/app/api/_utils/requireAdmin";
import { generateStudentCode, getBirthYearFromISO } from "@/lib/studentCode";

function norm(str: string) {
  return String(str ?? "").trim().replace(/\s+/g, " ");
}

export async function POST(req: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = await req.json();

    const gestionId = norm(body?.gestionId);
    const courseId = norm(body?.courseId);

    const nombre = norm(body?.nombre ?? body?.nombres);

    let primerApellido = norm(body?.primerApellido);
    let segundoApellido = norm(body?.segundoApellido);

    const apellidoLegacy = norm(body?.apellido ?? body?.apellidos);
    if (!primerApellido && apellidoLegacy) {
      const parts = apellidoLegacy.split(" ").filter(Boolean);
      primerApellido = parts[0] ?? "";
      segundoApellido = parts.slice(1).join(" ");
    }

    const ci = norm(body?.ci);
    const fechaNacimientoISO = norm(body?.fechaNacimiento);
    const activo = Boolean(body?.activo ?? true);

    if (!gestionId) return NextResponse.json({ error: "Falta gestionId" }, { status: 400 });
    if (!courseId) return NextResponse.json({ error: "Falta courseId" }, { status: 400 });
    if (!nombre) return NextResponse.json({ error: "Nombre es obligatorio" }, { status: 400 });
    if (!primerApellido)
      return NextResponse.json({ error: "Primer apellido es obligatorio" }, { status: 400 });
    if (!ci) return NextResponse.json({ error: "CI es obligatorio" }, { status: 400 });
    if (!fechaNacimientoISO)
      return NextResponse.json({ error: "Fecha de nacimiento es obligatorio" }, { status: 400 });

    const anioNacimiento = getBirthYearFromISO(fechaNacimientoISO);
    if (!anioNacimiento) {
      return NextResponse.json({ error: "Fecha de nacimiento inválida" }, { status: 400 });
    }

    const ciSnap = await adminDb.collection("students").where("ci", "==", ci).limit(1).get();
    if (!ciSnap.empty) {
      return NextResponse.json({ error: "El CI ya está registrado" }, { status: 409 });
    }

    const courseSnap = await adminDb.collection("courses").doc(courseId).get();
    if (!courseSnap.exists) return NextResponse.json({ error: "Curso no existe" }, { status: 400 });

    const course = courseSnap.data() as any;
    if (String(course?.gestionId ?? "") !== gestionId) {
      return NextResponse.json({ error: "El curso no pertenece a esta gestión" }, { status: 400 });
    }

    const apellido = [primerApellido, segundoApellido].filter(Boolean).join(" ").trim();
    const nombreCompleto = `${nombre} ${apellido}`.trim();

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

    const studentRef = await adminDb.collection("students").add({
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
      createdAt: new Date(),
      createdBy: auth.uid,
    });

    const studentId = studentRef.id;

    const existenteSnap = await adminDb
      .collection("inscriptions")
      .where("studentId", "==", studentId)
      .where("courseId", "==", courseId)
      .where("gestionId", "==", gestionId)
      .where("estado", "==", "ACTIVO")
      .limit(1)
      .get();

    if (existenteSnap.empty) {
      await adminDb.collection("inscriptions").add({
        studentId,
        gestionId,
        courseId,
        fechaInscripcion: new Date(),
        tipoInscripcion: "REGULAR",
        estado: "ACTIVO",
        createdAt: new Date(),
        createdBy: auth.uid,
      });
    }

    return NextResponse.json({ success: true, studentId }, { status: 201 });
  } catch (err: any) {
    console.error("ERROR createStudent:", err);
    return NextResponse.json(
      { error: err?.message ?? "Error al registrar estudiante" },
      { status: 500 }
    );
  }
}
