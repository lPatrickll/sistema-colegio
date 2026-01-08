export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { requireTeacher } from "../../_utils/requireTeacher";

export async function GET() {
  const auth = await requireTeacher();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const teacherSnap = await adminDb.collection("teachers").doc(auth.teacherId).get();
  if (!teacherSnap.exists) return NextResponse.json({ error: "Profesor no encontrado" }, { status: 404 });

  const teacher = { id: teacherSnap.id, ...(teacherSnap.data() as any) };

  const courseIds: string[] = Array.isArray((teacher as any)?.teachingCourseIds)
    ? (teacher as any).teachingCourseIds
    : (teacher as any)?.teaching && typeof (teacher as any).teaching === "object"
      ? Object.keys((teacher as any).teaching)
      : [];

  const uniqueIds = Array.from(new Set(courseIds.map((x) => String(x).trim()).filter(Boolean)));
  const courseSnaps = await Promise.all(uniqueIds.map((cid) => adminDb.collection("courses").doc(cid).get()));

  const courses = courseSnaps
    .filter((s) => s.exists)
    .map((s) => ({ id: s.id, ...(s.data() as any) }))
    .sort((a: any, b: any) => String(a?.nombre ?? "").localeCompare(String(b?.nombre ?? "")));

  return NextResponse.json({ courses }, { status: 200 });
}
