// src/components/Subject/application/createSubject.usecase.ts
import { CreateSubjectDTO } from "../domain/subject.types";
import { SubjectApiRepository } from "../repository/subject.api.repository";

export class CreateSubjectUseCase {
  private readonly repo: SubjectApiRepository;

  constructor(repo?: SubjectApiRepository) {
    this.repo = repo ?? new SubjectApiRepository();
  }

  async execute(adminUid: string, data: CreateSubjectDTO) {
    if (!data.nombre.trim()) {
      throw new Error("El nombre de la materia es obligatorio");
    }

    if (!data.sigla.trim()) {
      throw new Error("La sigla de la materia es obligatoria");
    }

    return this.repo.create(adminUid, data);
  }
}
