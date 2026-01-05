import { db } from "@/lib/firebase";
import {
  addDoc,
  collection,
  getDocs,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import type { Profesor } from "./profesor.model";

type CreateProfesorInput = Omit<Profesor, "id">;

export const ProfesorRepository = {
  async create(data: CreateProfesorInput) {
    const ref = await addDoc(collection(db, "profesores"), data);
    return ref.id;
  },

  async listByGestionId(gestionId: string): Promise<Profesor[]> {
    const q = query(
      collection(db, "profesores"),
      where("gestionId", "==", gestionId),
      orderBy("createdAt", "desc")
    );

    const snap = await getDocs(q);

    return snap.docs.map((d) => ({
      id: d.id,
      ...(d.data() as Omit<Profesor, "id">),
    }));
  },
};
