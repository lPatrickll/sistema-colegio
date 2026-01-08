// src/app/api/students/check-ci/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { requireAdmin } from "@/app/api/_utils/requireAdmin";

export async function GET(req: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { searchParams } = new URL(req.url);
    const ci = String(searchParams.get("ci") ?? "").trim();
    const exclude = String(searchParams.get("excludeStudentId") ?? "").trim();

    if (!ci) return NextResponse.json({ error: "Falta ci" }, { status: 400 });

    const snap = await adminDb.collection("students").where("ci", "==", ci).limit(2).get();
    if (snap.empty) return NextResponse.json({ available: true }, { status: 200 });

    const other = snap.docs.find((d) => d.id !== exclude);
    return NextResponse.json({ available: !other }, { status: 200 });
  } catch (err: any) {
    console.error("[GET /api/students/check-ci] Error:", err);
    return NextResponse.json(
      { error: err?.message ?? "Error validando CI" },
      { status: 500 }
    );
  }
}
