export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { adminAuth } from "@/lib/firebase-admin";

export async function POST(req: Request) {
  const { idToken } = await req.json();
  if (!idToken) return NextResponse.json({ error: "Missing idToken" }, { status: 400 });

  const expiresIn = 5 * 24 * 60 * 60 * 1000;
  const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn });

  const cookieStore = await cookies();
  cookieStore.set("__session", sessionCookie, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: expiresIn / 1000,
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.set("__session", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  return NextResponse.json({ ok: true });
}
