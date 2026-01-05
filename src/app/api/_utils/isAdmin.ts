import { adminDb } from "@/lib/firebase-admin";

export default async function isAdmin(uid: string): Promise<boolean> {
  const snap = await adminDb.collection("users").doc(uid).get();
  if (!snap.exists) return false;

  const data = snap.data() as any;
  const roles: string[] = Array.isArray(data?.roles)
    ? data.roles
    : data?.role
      ? [data.role]
      : [];

  return roles.map((r) => String(r).toUpperCase()).includes("ADMIN");
}
