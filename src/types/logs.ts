export interface AuditLogItem {
  i_CveLog: number;
  d_Fecha: string;            // ISO, hora México
  i_CveUsuario: number | null; // null = anónimo
  v_Usuario: string | null;    // "Anónimo" cuando no hay usuario
  v_Email: string | null;
  i_CveTenant: number | null;
  v_Metodo: string | null;
  v_Ruta: string | null;
  i_StatusCode: number;
  i_DuracionMs: number;
  v_Payload: string | null;
  v_Respuesta: string | null;
  i_Total: number;
}

export interface AuditLogPaged {
  datos: AuditLogItem[];
  total: number;
  totalPaginas: number;
}

export interface AuditLogFiltros {
  usuarios: { i_CveUsuario: number; v_Usuario: string }[];
  codigos: number[];
}

export interface AuditLogQueryParams {
  d_FechaInicio: string;
  d_FechaFin?: string;
  i_CveUsuario?: number;
  v_Metodo?: string;
  i_StatusCode?: number;
  v_Ruta?: string;
  pagina: number;
  tamano: number;
}

