export interface Estudiante {
  id: string;
  gestionId: string;
  cursoId: string;

  nombres: string;
  apellidos: string;
  ci?: string;
  codigo?: string;

  activo: boolean;
  createdAt: string;
}
