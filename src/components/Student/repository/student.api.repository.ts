// src/components/Student/repository/student.api.repository.ts
import { CreateStudentDTO } from "../domain/student.types";

export class StudentApiRepository {
  async create(adminUid: string, data: CreateStudentDTO): Promise<void> {
    const res = await fetch("/api/students", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ adminUid, ...data }),
    });

    const result = await res.json();
    if (!res.ok) {
      throw new Error(result.error ?? "Error al registrar estudiante");
    }
  }
}
