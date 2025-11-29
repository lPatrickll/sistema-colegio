// src/Teacher/application/createTeacher.usecase.ts
import { TeacherApiRepository } from "@/components/RegisterTeacher/repository/teacher.api.repository";
import { CreateTeacherDTO } from "../domain/teacher.types";

export class CreateTeacherUseCase {
  private readonly repo: TeacherApiRepository;

  constructor(repo?: TeacherApiRepository) {
    this.repo = repo ?? new TeacherApiRepository();
  }

  async execute(adminUid: string, data: CreateTeacherDTO) {
    if (!data.nombreCompleto.trim()) {
      throw new Error("El nombre es obligatorio");
    }
    if (!data.email.trim()) {
      throw new Error("El correo es obligatorio");
    }
    if (!data.ci.trim()) {
      throw new Error("El CI es obligatorio");
    }

    return this.repo.create(adminUid, data);
  }
}
