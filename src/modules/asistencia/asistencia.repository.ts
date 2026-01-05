import { db } from "@/lib/firebase";
import {
  collection,
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";
import type { AsistenciaCursoDia } from "./asistencia.model";

function makeId(gestionId: string, cursoId: string, fecha: string) {
  return `${gestionId}_${cursoId}_${fecha}`;
}

export const AsistenciaRepository = {
  async getOrNull(gestionId: string, cursoId: string, fecha: string) {
    const id = makeId(gestionId, cursoId, fecha);
    const ref = doc(collection(db, "asistencias_curso_dia"), id);
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;
    return { id: snap.id, ...(snap.data() as Omit<AsistenciaCursoDia, "id">) } as AsistenciaCursoDia;
  },

  async upsert(data: Omit<AsistenciaCursoDia, "id">) {
    const id = makeId(data.gestionId, data.cursoId, data.fecha);
    const ref = doc(collection(db, "asistencias_curso_dia"), id);

    // setDoc con merge: true permite actualizar sin borrar estructura
    await setDoc(
      ref,
      {
        ...data,
        // timestamps server (si quieres consistencia)
        // createdAt/updatedAt ya están como string, esto es opcional
        _serverUpdatedAt: serverTimestamp(),
      },
      { merge: true }
    );

    return id;
  },
};
