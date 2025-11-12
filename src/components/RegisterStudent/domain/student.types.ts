// src/components/RegisterStudent/domain/student.types.ts
export interface CreateStudentDTO {
    nombreCompleto: string;
    ci: string;
    email: string;
    curso?: string;
    paralelo?: string;
    telefono?: string;
  }
  