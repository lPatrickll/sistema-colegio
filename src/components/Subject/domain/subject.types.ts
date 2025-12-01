// src/Subject/domain/subject.types.ts

export interface Subject {
  id: string;
  nombre: string;
  sigla: string;
  createdAt: Date;
  createdBy: string;
}

export interface CreateSubjectDTO {
  nombre: string;
  sigla: string;
  createdBy: string;
}
