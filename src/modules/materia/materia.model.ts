export type Nivel = "Inicial" | "Primaria" | "Secundaria";

export interface Materia {
  id: string;
  gestionId: string;
  nombre: string;
  nivel: Nivel;
  createdAt: string;
  activa: boolean;
}
