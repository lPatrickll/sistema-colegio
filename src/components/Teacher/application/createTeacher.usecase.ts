// src/components/Teacher/application/createTeacher.usecase.ts
import { CreateTeacherDTO } from "../domain/teacher.types";
import { TeacherApiRepository } from "../repository/teacher.api.repository";

export class CreateTeacherUseCase {
  private readonly repo: TeacherApiRepository;

  constructor(repo?: TeacherApiRepository) {
    this.repo = repo ?? new TeacherApiRepository();
  }

  async execute(adminUid: string, data: CreateTeacherDTO) {
    if (!data.nombre.trim() || !data.apellido.trim()) {
      throw new Error("Nombre y apellido son obligatorios");
    }
    if (!data.ci.trim()) {
      throw new Error("El CI es obligatorio");
    }
    if (!data.email.trim() || !data.password.trim()) {
      throw new Error("Correo y contraseña son obligatorios");
    }
    if (!data.materiaId) {
      throw new Error("Debes seleccionar una materia para el docente");
    }

    return this.repo.create(adminUid, data);
  }
}
