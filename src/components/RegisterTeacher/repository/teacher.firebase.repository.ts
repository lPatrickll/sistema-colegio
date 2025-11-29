// src/Teacher/repository/teacher.firebase.repository.ts
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface CreateTeacherDTO {
  nombreCompleto: string;
  ci: string;
  email: string;
  telefono?: string;
  materia?: string;
  createdBy: string;
}

export class TeacherFirebaseRepository {
  async create(data: CreateTeacherDTO) {
    const ref = await addDoc(collection(db, "teachers"), {
      ...data,
      createdAt: serverTimestamp(),
    });

    return ref.id;
  }
}
