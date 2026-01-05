import { db } from "@/lib/firebase";
import {
  addDoc,
  collection,
  getDocs,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import type { Materia } from "./materia.model";

type CreateMateriaInput = Omit<Materia, "id">;

export const MateriaRepository = {
  async create(data: CreateMateriaInput) {
    const ref = await addDoc(collection(db, "materias"), data);
    return ref.id;
  },

  async listByGestionId(gestionId: string): Promise<Materia[]> {
    const q = query(
      collection(db, "materias"),
      where("gestionId", "==", gestionId),
      orderBy("createdAt", "desc")
    );

    const snap = await getDocs(q);

    return snap.docs.map((d) => ({
      id: d.id,
      ...(d.data() as Omit<Materia, "id">),
    }));
  },
};
