// src/components/Student/domain/student.types.ts

export interface CreateStudentDTO {
  nombre: string;
  apellido: string;
  ci: string;
  fechaNac: string;
  sexo: string;
  unidadProcedencia?: string;

  email?: string;
  password?: string;

  gestionId?: string;
  courseId?: string;
}