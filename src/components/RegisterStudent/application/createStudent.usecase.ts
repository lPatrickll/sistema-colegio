// src/components/RegisterStudent/application/createStudent.usecase.ts
import { StudentApiRepository } from "../repository/student.api.repository";
import { CreateStudentDTO } from "../domain/student.types";

export class CreateStudentUseCase {
  private readonly repo: StudentApiRepository;

  constructor(repo?: StudentApiRepository) {
    this.repo = repo ?? new StudentApiRepository();
  }

  async execute(adminUid: string, data: CreateStudentDTO): Promise<void> {
    if (!data.nombreCompleto.trim()) {
      throw new Error("El nombre es obligatorio");
    }
    if (!data.ci.trim()) {
      throw new Error("El CI es obligatorio");
    }
    if (!data.email.trim()) {
      throw new Error("El correo es obligatorio");
    }

    return this.repo.createStudent(adminUid, data);
  }
}
