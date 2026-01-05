export interface Profesor {
  id: string;
  gestionId: string; // para mantener todo “dentro” de una gestión
  nombres: string;
  apellidos: string;
  ci: string;
  telefono?: string;
  activo: boolean;
  createdAt: string;
}
