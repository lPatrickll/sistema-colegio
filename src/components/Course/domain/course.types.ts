// src/Course/domain/course.types.ts

export interface CourseSubject {
  subjectId: string;
  subjectName: string;
  subjectSigla: string;
  teacherUid: string;
  teacherName: string;
}

export interface CourseStudent {
  studentUid: string;
  studentName: string;
  studentCi: string;
}

export interface CreateCourseDTO {
  nombre: string;
  paralelo: string;
  materias: CourseSubject[];
  estudiantes: CourseStudent[]; // puede estar vacío
  createdBy: string;
}