import { db } from "@/lib/firebase";
import {
  addDoc,
  collection,
  getDocs,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import type { Estudiante } from "./estudiante.model";

type CreateEstudianteInput = Omit<Estudiante, "id">;

export const EstudianteRepository = {
  async create(data: CreateEstudianteInput) {
    const ref = await addDoc(collection(db, "estudiantes"), data);
    return ref.id;
  },

  async listByCurso(gestionId: string, cursoId: string): Promise<Estudiante[]> {
    const q = query(
      collection(db, "estudiantes"),
      where("gestionId", "==", gestionId),
      where("cursoId", "==", cursoId),
      orderBy("createdAt", "desc")
    );

    const snap = await getDocs(q);

    return snap.docs.map((d) => ({
      id: d.id,
      ...(d.data() as Omit<Estudiante, "id">),
    }));
  },
};
