export interface EntregableResumen {
  v_Nombre: string;
  b_Entregado: boolean;
  v_Key: string | null;
}

export interface AgendaServicioConsultorGetDto {
  i_CveAgenda: number;
  i_CveServAgendaDet: number;
  v_Empresa: string;
  v_Planta: string | null;
  v_Servicio: string;
  v_TipoServicio: string;
  v_Unidad: string;
  i_Cantidad: number | null;
  i_CveEstatus: number; // 0 Cancelado, 1 Programado, 2 En curso, 3 Terminado, 4 Reprogramado
  d_FechaInicio: string | null;
  d_FechaFin: string | null;
  v_Titular: string | null; // puede traer varios nombres separados por ", "
  v_Apoyo: string | null;
  i_TotalEntregables: number;
  i_EntregablesEntregados: number;
  b_TipoDato: boolean | null;
  v_Notas: string | null;
  b_AplicaVoBo: boolean | null;
  b_VoBoEntregado: boolean;
  v_KeyVoBo?: string | null;
  v_EntregablesJson: string | null; // JSON string -> EntregableResumen[]
  i_TotalRegistros: number;
  entregablesParseados?: EntregableResumen[];
  d_FechaConfirmacionTermino?: string | null;
  v_ConfirmadoPor?: string | null;
  b_TienePlanContingencia?: boolean;
  i_AvancePipc?: number | null;
}

export interface AgendaDetalleConsultorCabeceraDto {
  i_CveAgenda: number;
  i_CveServAgendaDet: number;
  v_Servicio: string;
  v_TipoServicio: string;
  v_Empresa: string;
  v_Planta: string | null;
  v_Unidad: string;
  b_TipoDato: boolean | null;
  i_CveEstatus: number;
  i_CveEmpresa: number;
  i_CvePlanta: number | null;
  i_NumAlumnos: number; // cupo (0 = abierto)
  b_SinProgramar: boolean | null;
  i_Cantidad: number | null;
  b_AplicaVoBo: boolean | null;
  d_FechaVoBo: string | null;
  v_KeyVoBo: string | null;
  i_CveTipoServicio: number; // 2 Capacitación, 3 Estudios, 5 Productos, 6 Servicios
  v_Notas: string | null;
  d_FechaConfirmacionTermino: string | null;
  v_ConfirmadoPor: string | null;
}

export interface SesionConsultorDto {
  i_CveAgendaDetalle: number;
  i_Orden: number | null;
  d_FechaHoraInicio: string | null;
  d_FechaHoraFin: string | null;
  i_CveReprograma: number | null; // != null -> sesión reprogramada
  i_CveContactoReprograma: number | null;
  v_Observaciones: string | null; // motivo de reprogramación
  i_CveArea: number | null;
  v_NombreArea: string | null;
  b_Cancelada: boolean | null;
  v_MotivoCancelacion: string | null;
  v_Titular: string | null;
  i_CveTitular: number | null;
  b_TipoProvInsTitular: boolean | null;
  v_Apoyo: string | null;
  i_CveApoyo: number | null;
  b_TipoProvInsApoyo: boolean | null;
  v_Contacto: string | null; // contacto que pidió la reprogramación
}

export interface EntregableConsultorDto {
  i_CveAgendaEntregables: number;
  v_Nombre: string;
  b_Entregado: boolean | null;
  f_FechaEntregable: string | null;
  i_CveArchivo: number | null;
  v_Key: string | null;
}

export interface AlumnoConsultorDto {
  i_CveAlumnoAgenda: number;
  v_Nomina: string | null;
  f_FechaInscripcion: string | null;
  v_Nombre: string | null;
  v_CURP: string | null;
  v_Puesto: string | null;
}

export interface AgendaDetalleConsultorDto {
  cabecera: AgendaDetalleConsultorCabeceraDto;
  sesiones: SesionConsultorDto[];
  entregables: EntregableConsultorDto[];
  alumnos: AlumnoConsultorDto[];
}

export interface FiltrosConsultorSesionesState {
  visualizar: "sesiones" | "servicios";
  fechaInicio: string;
  fechaFin: string;
  usarRango: boolean;
  searchTerm: string;
}

export interface FiltrosConsultorServiciosState {
  visualizar: "sesiones" | "servicios";
  fechaInicio: string;
  fechaFin: string;
  usarRango: boolean;
  searchTerm: string;
}
