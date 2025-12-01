// src/components/RegisterStudent/domain/student.types.ts
export interface CreateStudentDTO {
  nombreCompleto: string;
  ci: string;
  email: string;
  telefono?: string;
  descripcion?: string;
  courseId?: string;
  courseNombre?: string;
  courseParalelo?: string;
}
