// src/components/Subject/domain/subject.types.ts

export interface CreateSubjectDTO {
  nombre: string;
  sigla: string;
  nivelId?: string;
  area?: string;
}
