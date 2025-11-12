// src/components/RegisterStudent/repository/student.api.repository.ts
import { CreateStudentDTO } from "../domain/student.types";

export class StudentApiRepository {
  async createStudent(adminUid: string, data: CreateStudentDTO): Promise<void> {
    const res = await fetch("/api/createStudent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        adminUid,
        ...data,
      }),
    });

    const result = await res.json();
    if (!res.ok) {
      throw new Error(result.error ?? "Error al crear estudiante");
    }
  }
}
