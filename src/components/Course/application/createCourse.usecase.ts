// src/components/Course/application/createCourse.usecase.ts
import { CreateCourseDTO } from "../domain/course.types";
import { CourseApiRepository } from "../repository/course.api.repository";

export class CreateCourseUseCase {
  private readonly repo: CourseApiRepository;

  constructor(repo?: CourseApiRepository) {
    this.repo = repo ?? new CourseApiRepository();
  }

  async execute(adminUid: string, data: CreateCourseDTO) {
    if (!data.nombre.trim()) {
      throw new Error("El nombre del curso es obligatorio");
    }

    if (!data.paralelo.trim()) {
      throw new Error("El paralelo es obligatorio");
    }

    if (!data.gestionId.trim()) {
      throw new Error("La gestión es obligatoria");
    }

    return this.repo.create(adminUid, data);
  }
}
