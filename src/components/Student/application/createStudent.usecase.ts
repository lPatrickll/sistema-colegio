// src/components/Student/application/createStudent.usecase.ts
import { CreateStudentDTO } from "../domain/student.types";
import { StudentApiRepository } from "../repository/student.api.repository";

export class CreateStudentUseCase {
  private readonly repo: StudentApiRepository;

  constructor(repo?: StudentApiRepository) {
    this.repo = repo ?? new StudentApiRepository();
  }

  async execute(adminUid: string, data: CreateStudentDTO) {
    if (!data.nombre.trim() || !data.apellido.trim()) {
      throw new Error("Nombre y apellido son obligatorios");
    }
    if (!data.ci.trim()) {
      throw new Error("El CI es obligatorio");
    }
    if (!data.fechaNac) {
      throw new Error("La fecha de nacimiento es obligatoria");
    }

    return this.repo.create(adminUid, data);
  }
}
