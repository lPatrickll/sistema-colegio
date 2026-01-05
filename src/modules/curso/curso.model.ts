export type Nivel = "Inicial" | "Primaria" | "Secundaria";

export interface Curso {
  id: string;
  gestionId: string;
  nombre: string;
  nivel: Nivel;
  createdAt: string;
}
