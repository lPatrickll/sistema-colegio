import { db } from "@/lib/firebase";
import { addDoc, collection, getDocs, orderBy, query, where } from "firebase/firestore";
import type { AsignacionDocente } from "./asignacion.model";

type CreateAsignacionInput = Omit<AsignacionDocente, "id">;

export const AsignacionRepository = {
  async create(data: CreateAsignacionInput) {
    const ref = await addDoc(collection(db, "asignaciones_docentes"), data);
    return ref.id;
  },

  async listByGestionId(gestionId: string): Promise<AsignacionDocente[]> {
    const q = query(
      collection(db, "asignaciones_docentes"),
      where("gestionId", "==", gestionId),
      orderBy("createdAt", "desc")
    );

    const snap = await getDocs(q);
    return snap.docs.map((d) => ({
      id: d.id,
      ...(d.data() as Omit<AsignacionDocente, "id">),
    }));
  },
};
