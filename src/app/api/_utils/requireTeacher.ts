import { cookies } from "next/headers";
import { adminAuth, adminDb } from "@/lib/firebase-admin";

function normalizeRole(r: unknown) {
  return String(r ?? "").trim().toUpperCase();
}

export async function requireTeacher() {
  const cookieStore = await cookies();
  const session = cookieStore.get("__session")?.value;

  if (!session) {
    return { ok: false as const, status: 401, error: "No autenticado" };
  }

  try {
    const decoded = await adminAuth.verifySessionCookie(session, true);

    const userSnap = await adminDb.collection("users").doc(decoded.uid).get();
    if (!userSnap.exists) {
      return { ok: false as const, status: 403, error: "No autorizado" };
    }

    const data = userSnap.data() as any;
    const rolesRaw: unknown[] = Array.isArray(data?.roles)
      ? data.roles
      : data?.role
        ? [data.role]
        : [];

    const roles = rolesRaw.map(normalizeRole);
    if (!roles.includes("TEACHER")) {
      return { ok: false as const, status: 403, error: "No autorizado, se requiere TEACHER" };
    }

    const teacherId = String(data?.teacherId ?? "").trim();
    const gestionId = String(data?.gestionId ?? "").trim();

    if (!teacherId) {
      return { ok: false as const, status: 500, error: "Usuario TEACHER sin teacherId vinculado" };
    }

    return { ok: true as const, uid: decoded.uid, teacherId, gestionId, roles };
  } catch {
    return { ok: false as const, status: 401, error: "Sesión inválida" };
  }
}
