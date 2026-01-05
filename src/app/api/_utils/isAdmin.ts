// app/api/_utils/isAdmin.ts
import { adminDb } from "@/lib/firebase-admin";

export default async function isAdmin(userUid: string): Promise<boolean> {
  if (!userUid) return false;

  const snap = await adminDb.collection("users").doc(userUid).get();
  if (!snap.exists) return false;

  const data = snap.data() as any;

  return data.roles?.includes("ADMIN");
}
