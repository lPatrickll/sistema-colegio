export interface Gestion {
  id: string;
  nombre: string;
  fechaInicio: string;
  fechaFin: string;
  estado: "ACTIVA" | "CERRADA";
  createdAt: string;
}
