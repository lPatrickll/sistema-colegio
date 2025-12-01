// src/Teacher/domain/teacher.types.ts

export interface Teacher {
  id: string;
  nombreCompleto: string;
  ci: string;
  email: string;
  telefono?: string;
  materiaId: string;
  materiaNombre: string;
  materiaSigla: string;
  createdAt: Date;
  createdBy: string;
}

export interface CreateTeacherDTO {
  nombreCompleto: string;
  ci: string;
  email: string;
  telefono?: string;
  materiaId: string;
  materiaNombre: string;
  materiaSigla: string;
  createdBy: string;
}