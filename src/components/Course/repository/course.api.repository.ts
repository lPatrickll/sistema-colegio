// src/components/Course/repository/course.api.repository.ts
import { CreateCourseDTO } from "../domain/course.types";

export class CourseApiRepository {
  async create(adminUid: string, data: CreateCourseDTO): Promise<void> {
    const res = await fetch("/api/courses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ adminUid, ...data }),
    });

    const result = await res.json();
    if (!res.ok) {
      throw new Error(result.error ?? "Error al crear el curso");
    }
  }
}
