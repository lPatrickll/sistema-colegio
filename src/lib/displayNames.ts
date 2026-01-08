// src/lib/displayNames.ts
import { adminDb } from "@/lib/firebase-admin";

export type GestionDisplay = {
  id: string;
  nombre: string | null;
  anio: number | null;
  title: string;
};

export type CourseDisplay = {
  id: string;
  nombre: string | null;
  title: string;
};

export async function getGestionDisplay(gestionId: string): Promise<GestionDisplay> {
  if (!gestionId) {
    return { id: "", nombre: null, anio: null, title: "Gestión" };
  }

  const snap = await adminDb.collection("gestiones").doc(gestionId).get();
  if (!snap.exists) {
    return { id: gestionId, nombre: null, anio: null, title: `Gestión ${gestionId}` };
  }

  const g = snap.data() as any;
  const nombre = typeof g?.nombre === "string" && g.nombre.trim() ? g.nombre.trim() : null;
  const anio = typeof g?.anio === "number" ? g.anio : null;

  const title = nombre ?? (anio ? `Gestión ${anio}` : `Gestión ${gestionId}`);

  return { id: snap.id, nombre, anio, title };
}

export async function getCourseDisplay(cursoId: string): Promise<CourseDisplay> {
  if (!cursoId) return { id: "", nombre: null, title: "Curso" };

  const snap = await adminDb.collection("courses").doc(cursoId).get();
  if (!snap.exists) return { id: cursoId, nombre: null, title: `Curso ${cursoId}` };

  const c = snap.data() as any;
  const nombre = typeof c?.nombre === "string" && c.nombre.trim() ? c.nombre.trim() : null;

  return { id: snap.id, nombre, title: nombre ?? `Curso ${cursoId}` };
}

export async function getGestionTitle(gestionId: string): Promise<string> {
  if (!gestionId) return "Gestión";
  const snap = await adminDb.collection("gestiones").doc(gestionId).get();
  if (!snap.exists) return `Gestión ${gestionId}`;

  const g = snap.data() as any;

  const nombre = typeof g?.nombre === "string" && g.nombre.trim() ? g.nombre.trim() : null;
  const anio = typeof g?.anio === "number" ? g.anio : null;

  return nombre ?? (anio ? `Gestión ${anio}` : `Gestión ${gestionId}`);
}
