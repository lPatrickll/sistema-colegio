export type EstadoAsistencia = "PRESENTE" | "FALTA" | "RETRASO" | "JUSTIFICADO";

export interface AsistenciaRegistro {
  estudianteId: string;
  estado: EstadoAsistencia;
  observacion?: string;
}

export interface AsistenciaCursoDia {
  id: string;
  gestionId: string;
  cursoId: string;
  fecha: string; // "YYYY-MM-DD"
  registros: AsistenciaRegistro[];
  createdAt: string;
  updatedAt: string;
}
