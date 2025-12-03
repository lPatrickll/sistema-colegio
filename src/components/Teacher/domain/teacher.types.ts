// src/components/Teacher/domain/teacher.types.ts

export interface CreateTeacherDTO {
  nombre: string;
  apellido: string;
  ci: string;
  profesion: string;
  pagoPorHora: number;
  email: string;
  password: string;

  materiaId: string;
  materiaNombre: string;
  materiaSigla: string;
} 