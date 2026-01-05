import { db } from "@/lib/firebase";
import {
  addDoc,
  collection,
  getDocs,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import type { Curso } from "./curso.model";

type CreateCursoInput = Omit<Curso, "id">;

export const CursoRepository = {
  async create(data: CreateCursoInput) {
    const ref = await addDoc(collection(db, "cursos"), data);
    return ref.id;
  },

  async listByGestionId(gestionId: string): Promise<Curso[]> {
    const q = query(
      collection(db, "cursos"),
      where("gestionId", "==", gestionId),
      orderBy("createdAt", "desc")
    );

    const snap = await getDocs(q);

    return snap.docs.map((d) => ({
      id: d.id,
      ...(d.data() as Omit<Curso, "id">),
    }));
  },
};
