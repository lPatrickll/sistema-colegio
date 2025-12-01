// src/Teacher/repository/teacher.api.repository.ts
import { CreateTeacherDTO } from "../domain/teacher.types";


export class TeacherApiRepository {
  async create(adminUid: string, data: CreateTeacherDTO): Promise<void> {
    const res = await fetch("/api/createTeacher", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        adminUid,
        ...data,
      }),
    });

    const result = await res.json();
    if (!res.ok) {
      throw new Error(result.error ?? "Error al crear profesor");
    }
  }
} 