import { cookies } from "next/headers";
import { adminAuth } from "@/lib/firebase-admin";
import isAdmin from "./isAdmin";

export async function requireAdmin() {
  const session = (await cookies()).get("__session")?.value;

  if (!session) {
    return { ok: false as const, status: 401, error: "No autenticado" };
  }

  try {
    const decoded = await adminAuth.verifySessionCookie(session, true);

    const can = await isAdmin(decoded.uid);
    if (!can) {
      return { ok: false as const, status: 403, error: "No autorizado, se requiere ADMIN" };
    }

    return { ok: true as const, uid: decoded.uid };
  } catch {
    return { ok: false as const, status: 401, error: "Sesión inválida" };
  }
}
