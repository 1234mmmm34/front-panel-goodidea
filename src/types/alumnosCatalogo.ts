// Fila del listado
export interface AlumnoCatalogo {
  i_CveAlumno: number;
  i_CveEmpresa: number;
  v_Nomina: string;
  v_Nombre: string;
  v_CURP: string;
  v_Puesto: string;
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
  v_CURP: string;
  v_Puesto: string;
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
