import { ReactNode } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { adminAuth, adminDb } from "@/lib/firebase-admin";

export const runtime = "nodejs";

async function getRoles(uid: string): Promise<string[]> {
  const snap = await adminDb.collection("users").doc(uid).get();
  if (!snap.exists) return [];
  const data = snap.data() as any;

  const rolesRaw: string[] = Array.isArray(data?.roles)
    ? data.roles
    : data?.role
      ? [data.role]
      : [];

  return rolesRaw.map((r) => String(r).toUpperCase());
}

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = (await cookies()).get("__session")?.value;
  if (!session) redirect("/login");

  try {
    const decoded = await adminAuth.verifySessionCookie(session, true);
    const roles = await getRoles(decoded.uid);
    if (!roles.includes("ADMIN")) redirect("/no-access");
    return <>{children}</>;
  } catch {
    redirect("/login");
  }
}
