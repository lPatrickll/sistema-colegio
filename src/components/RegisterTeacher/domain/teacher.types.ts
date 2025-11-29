// src/Teacher/domain/teacher.types.ts
export interface Teacher {
  id: string;
  nombreCompleto: string;
  ci: string;
  email: string;
  telefono?: string;
  materia?: string;
  createdAt: Date;
  createdBy: string;
}

export interface CreateTeacherDTO {
  nombreCompleto: string;
  ci: string;
  email: string;
  telefono?: string;
  materia?: string;
  createdBy: string;
}