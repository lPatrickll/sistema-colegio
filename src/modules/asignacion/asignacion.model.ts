export type DiaSemana = "Lunes" | "Martes" | "Miércoles" | "Jueves" | "Viernes" | "Sábado";

export interface Horario {
  dia: DiaSemana;
  horaInicio: string; // "08:00"
  horaFin: string;    // "09:30"
}

export interface AsignacionDocente {
  id: string;
  gestionId: string;
  cursoId: string;
  profesorId: string;
  materiaId: string;
  horarios: Horario[];
  createdAt: string;
}
