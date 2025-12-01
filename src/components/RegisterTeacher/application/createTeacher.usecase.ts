// src/Teacher/application/createTeacher.usecase.ts
import { CreateTeacherDTO } from "../domain/teacher.types";
import { TeacherApiRepository } from "../repository/teacher.api.repository";

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
    if (!data.materiaId.trim()) {
      throw new Error("Debe seleccionar una materia");
    }

    return this.repo.create(adminUid, data);
  }
}
