// src/Subject/repository/subject.api.repository.ts
import { CreateSubjectDTO } from "../domain/subject.types";

export class SubjectApiRepository {
  async create(adminUid: string, data: CreateSubjectDTO) {
    const res = await fetch("/api/createSubject", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ adminUid, ...data }),
    });

    const result = await res.json();
    if (!res.ok) {
      throw new Error(result.error ?? "Error al crear materia");
    }
  }
}
