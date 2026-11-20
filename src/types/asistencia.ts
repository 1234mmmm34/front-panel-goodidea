export interface AsistenciaAlumno {
  i_CveAlumnoAgenda: number;
  v_Nomina: string | null;
  v_Nombre: string | null;
  v_Puesto: string | null;
  b_Asistio: boolean | null; // null = aún no capturado
  d_FechaCaptura: string | null;
}

export interface AsistenciaSesion {
  i_CveAgenda: number;
  i_CveServAgendaDet: number; // curso
  i_CveAgendaDetalle: number; // sesión
  i_NumSesion: number; // "Sesión X de N"
  i_TotalSesiones: number;
  d_FechaHoraInicio: string;
  d_FechaHoraFin: string;
  d_HabilitaDesde: string; // inicio - 30 min
  d_HabilitaHasta: string; // EXCLUSIVO: 00:00 del día siguiente al fin
  v_Servicio: string | null;
  v_Empresa: string | null;
  v_Planta: string | null;
  v_Area: string | null;
  v_Titular: string | null;
  v_Apoyo: string | null;
  inscritos: AsistenciaAlumno[];
}

export interface AsistenciaRegistro {
  i_CveAlumnoAgenda: number;
  i_CveAgendaDetalle: number;
  b_Asistio: boolean;
  d_FechaCaptura: string; // hora LOCAL del teléfono, SIN zona: "2026-11-20T08:05:12"
}

export interface AsistenciaSincronizarBody {
  registros: AsistenciaRegistro[]; // máx 2000
}

export interface AsistenciaResultado {
  i_CveAlumnoAgenda: number | null;
  i_CveAgendaDetalle: number | null;
  d_FechaCaptura: string | null;
  v_Estatus: "OK" | "RECHAZADO";
  v_Motivo: string | null;
}

export type EstadoSesion = "HABILITADA" | "PROXIMA" | "CERRADA";

export interface CursoAsistenciaDia {
  i_CveServAgendaDet: number;
  v_Servicio: string;
  v_Empresa: string | null;
  v_Planta: string | null;
  v_Area: string | null;
  sesiones: AsistenciaSesion[];
  sesionEnPuerta: AsistenciaSesion;
  estadoEnPuerta: EstadoSesion;
  totalInscritos: number;
  totalPresentes: number;
  sinSincronizar: number;
}
