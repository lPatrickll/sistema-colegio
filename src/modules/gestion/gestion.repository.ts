import { db } from "@/lib/firebase";
import {
  addDoc,
  collection,
  getDocs,
  orderBy,
  query,
} from "firebase/firestore";
import { Gestion } from "./gestion.model";

type CreateGestionInput = Omit<Gestion, "id">;

export const GestionRepository = {
  async create(data: CreateGestionInput): Promise<string> {
    const ref = await addDoc(collection(db, "gestiones"), data);
    return ref.id;
  },

  async getAll(): Promise<Gestion[]> {
    const q = query(
      collection(db, "gestiones"),
      orderBy("createdAt", "desc")
    );

    const snap = await getDocs(q);

    return snap.docs.map((d) => ({
      id: d.id,
      ...(d.data() as Omit<Gestion, "id">),
    }));
  },
};
