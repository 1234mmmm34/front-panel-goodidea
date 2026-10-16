// Fila del listado
export interface AlumnoCatalogo {
  i_CveAlumno: number;
  i_CveEmpresa: number;
  v_Nomina: string;
  v_Nombre: string;
  v_CURP: string | null;
  v_Puesto: string;
  b_Vigente: boolean;
}

// Respuesta paginada del listado
export interface AlumnosCatalogoResponse {
  datos: AlumnoCatalogo[];
  total: number;
  pagina: number;
  tamano: number;
  totalPaginas: number;
}

// Body de alta y edición
export interface AlumnoPostDto {
  i_CveEmpresa: number;
  v_Nomina: string;
  v_Nombre: string;
  v_CURP: string | null;
  v_Puesto: string;
  b_Vigente: boolean;
}

// Carga masiva
export interface AlumnoCargaFila {
  v_Nomina: string;
  v_Nombre: string;
  v_CURP: string;
  v_Puesto: string;
}

export interface AlumnoCargaMasivaDto {
  i_CveEmpresa: number;
  Alumnos: AlumnoCargaFila[];
}

export interface AlumnoCargaResultado {
  exito: boolean;
  totalProcesados: number;
  insertados: number;
  omitidos: number;
  errores: { v_Nomina: string | null; motivo: string }[];
}

// Forma de todos los errores 400 / 404 / 409
export interface ApiError {
  error: string;
}

export type VistaPersonal = "catalogo" | "historial";

export interface EntregableAlumno {
  i_CveAgendaEntregable: number;
  v_Entregable: string;
  v_Estatus: "ENTREGADO" | "PENDIENTE";
}

export interface HistorialAlumno {
  i_CveAlumnoAgenda: number;
  d_FechaInicio: string | null;
  d_Horas: number | null;
  v_Curso: string | null;
  v_Nomina: string | null;
  v_Puesto: string | null;
  v_Nombre: string | null;
  b_Asistio: boolean | null;
  v_EvTeorica: string | null;
  v_EvPractica: string | null;
  v_EvFinal: string | null;
  v_SolicitadoPor: string | null;
  v_OrdenCompra: string | null;
  entregables: EntregableAlumno[];
}

export interface HistorialAlumnosResponse {
  datos: HistorialAlumno[];
  total: number;
  pagina: number;
  tamano: number;
  totalPaginas: number;
}

export interface HistorialAlumnoPutDto {
  b_Asistio: boolean | null;
  v_EvTeorica: string | null;
  v_EvPractica: string | null;
  v_EvFinal: string | null;
  Entregables: { i_CveAgendaEntregable: number; b_Entregado: boolean }[];
}

// Resumen del historial de alumnos por empresa
export interface HistorialResumenDto {
  i_Cursos: number;
  i_Alumnos: number;
  i_Inscripciones: number;
  i_Aprobados: number;
  i_Reprobados: number;
  i_SinEvaluar: number;
}

