// src/Teacher/application/createTeacher.usecase.ts
import {
  CreateTeacherDTO,
  TeacherFirebaseRepository,
} from "../repository/teacher.firebase.repository";

export class CreateTeacherUseCase {
  private readonly repo: TeacherFirebaseRepository;

  constructor(repo?: TeacherFirebaseRepository) {
    this.repo = repo ?? new TeacherFirebaseRepository();
  }

  async execute(data: CreateTeacherDTO) {
    if (!data.nombreCompleto.trim()) {
      throw new Error("El nombre es obligatorio");
    }
    if (!data.email.trim()) {
      throw new Error("El correo es obligatorio");
    }
    if (!data.ci.trim()) {
      throw new Error("El CI es obligatorio");
    }

    return this.repo.create(data);
  }
}
