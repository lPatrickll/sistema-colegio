// app/api/createStudent/route.ts
import { NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

async function isAdmin(uid: string) {
  const doc = await adminDb.collection("users").doc(uid).get();
  if (!doc.exists) return false;
  return doc.data()?.role === "admin";
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      adminUid,
      nombreCompleto,
      ci,
      email,
      telefono,
      descripcion,
      courseId,
      courseNombre,
      courseParalelo,
    } = body;

    if (!adminUid) {
      return NextResponse.json({ error: "Falta adminUid" }, { status: 400 });
    }

    const ok = await isAdmin(adminUid);
    if (!ok) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    if (!nombreCompleto || !ci || !email) {
      return NextResponse.json(
        { error: "Nombre, CI y correo son obligatorios" },
        { status: 400 }
      );
    }

    const newUser = await adminAuth.createUser({
      email,
      password: ci,
      displayName: nombreCompleto,
    });

    await adminDb.collection("users").doc(newUser.uid).set({
      role: "student",
      email,
      name: nombreCompleto,
    });

    await adminDb.collection("students").add({
      uid: newUser.uid,
      nombreCompleto,
      ci,
      email,
      telefono,
      descripcion: descripcion ?? "",
      courseId: courseId ?? null,
      courseNombre: courseNombre ?? null,
      courseParalelo: courseParalelo ?? null,
      createdAt: new Date(),
      createdBy: adminUid,
    });

    if (courseId) {
      await adminDb.collection("courses").doc(courseId).update({
        estudiantes: FieldValue.arrayUnion({
          studentUid: newUser.uid,
          studentName: nombreCompleto,
          studentCi: ci,
        }),
      });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("ERROR createStudent:", err);
    return NextResponse.json(
      { error: err.message ?? "Error al crear estudiante" },
      { status: 500 }
    );
  }
}
