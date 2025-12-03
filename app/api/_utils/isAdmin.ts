import { adminDb } from "@/lib/firebase-admin";

async function isAdmin(uid: string) {
  const doc = await adminDb.collection("users").doc(uid).get();
  if (!doc.exists) return false;

  const data = doc.data();
  const roles = (data?.roles ?? []) as string[];
  return Array.isArray(roles) && roles.some(r => r.toUpperCase() === "ADMIN");
}

export default isAdmin;