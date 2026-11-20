export interface EntregableResumen {
  v_Nombre: string;
  b_Entregado: boolean;
  v_Key: string | null;
  v_KeyCarta?: string | null;
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
  i_CveEstatus: number; // 0 Cancelado, 1 Programado, 2 En curso, 3 Terminado, 4 Reprogramado, 5 Por confirmar, 6 En proceso (PIPC)
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
  // §1.2 Campos nuevos de avance y días
  b_AplicaAvance: boolean;
  i_PorcentajeAvance: number | null;
  i_DiasTotales: number | null;
  i_DiasExcedidos: number;
  i_DiasRestantes: number;
  i_DiasAnticipacion: number;
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
  // §2.1 Campos nuevos en cabecera
  b_AplicaAvance: boolean;
  b_TienePlanContingencia: boolean;
  i_PorcentajeAvance: number | null;
  d_FechaInicio: string | null;
  d_FechaFin: string | null;
  i_DiasTotales: number | null;
  i_DiasExcedidos: number;
  i_DiasRestantes: number;
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
  i_CveArchivoCarta: number | null;
  v_KeyCarta: string | null;
}

export interface AlumnoConsultorDto {
  i_CveAlumnoAgenda: number;
  v_Nomina: string | null;
  f_FechaInscripcion: string | null;
  v_Nombre: string | null;
  v_CURP: string | null;
  v_Puesto: string | null;
}

export interface AvanceConsultorDto {
  i_CveAvance: number;
  i_Porcentaje: number;
  v_Nota: string | null;
  v_Usuario: string | null;
  d_FechaRegistro: string;
}

export interface AgendaDetalleConsultorDto {
  cabecera: AgendaDetalleConsultorCabeceraDto;
  sesiones: SesionConsultorDto[];
  entregables: EntregableConsultorDto[];
  alumnos: AlumnoConsultorDto[];
  avances: AvanceConsultorDto[];
}

export type OrigenActividadConsultor = "SESION" | "SERVICIO" | "ACTIVIDAD";
export type MomentoActividadConsultor = "UNICO" | "INICIO" | "FIN";

export interface ActividadConsultor {
  v_Origen: OrigenActividadConsultor;
  v_Momento: MomentoActividadConsultor;
  i_CveActividad: number | null; // solo ACTIVIDAD
  i_CveAgenda: number | null;
  i_CveServAgendaDet: number | null; // null = actividad General
  i_CveAgendaDetalle: number | null; // solo SESION
  d_FechaInicio: string;
  d_FechaFin: string;
  b_TieneHorario: boolean;
  v_Empresa: string | null;
  v_Planta: string | null;
  v_Actividad: string; // "Sesión 1" | "Inicio" | "Fin" | "Inicio y fin" | "Junta" | "Inicio · Junta" | "Fin · Junta"
  v_Descripcion: string | null; // nombre del servicio o notas de la actividad
  v_Titulo: string | null; // solo ACTIVIDAD, para editar
  v_Notas: string | null; // solo ACTIVIDAD, para editar
  v_TipoServicio: string | null; // null en ACTIVIDAD
  i_CveTipoServicio: number | null; // null en actividades del consultor
  b_RequiereConfirmacion: boolean; // true en Estudios (3), Servicios (6) y actividades del consultor
  d_FinCompromiso: string | null; // fin compromiso del proyecto; en actividades del consultor, su fecha fin
  d_FinReal: string | null; // fecha real de término (al confirmar); null si aún no se confirma
  v_Duracion: string | null; // "4 hrs" | "1 día" | null
  i_CveEstatus: number;
  i_TotalRegistros: number;
}

export interface HistorialActividad
  extends Omit<ActividadConsultor, "i_TotalRegistros"> {
  v_Motivo: string | null; // motivo de cancelación o reprogramación
  d_FechaReprogramada: string | null; // fecha de la nueva, si fue reprogramada
  v_NotasFinales?: string | null;
}

export interface ProyectoEnCursoConsultorDto {
  i_CveServAgendaDet: number;
  v_Servicio: string;
  v_TipoServicio: string;
  v_Empresa: string;
  v_Planta: string | null;
}

export type PrioridadActividad = 1 | 2 | 3; // 1 Alta · 2 Media · 3 Baja

export interface ActividadPendienteConsultor {
  i_CveActividad: number;
  i_CveServAgendaDet: number | null; // null = General
  i_CveAgenda: number | null;
  v_Titulo: string;
  v_Notas: string | null;
  v_Proyecto: string;                // nombre del servicio o "GENERAL"
  v_Empresa: string | null;          // null en GENERAL
  v_Planta: string | null;           // null en GENERAL
  d_FechaInicio: string;
  d_FinCompromiso: string;
  d_FinReal: string | null;          // fecha real de término; null si sigue pendiente
  i_Prioridad: PrioridadActividad | null; // null cuando i_CveEstatus === 3
  v_Prioridad: string | null;        // "Alta" | "Media" | "Baja" | null (null cuando i_CveEstatus === 3)
  i_CveEstatus: number;              // 1 Programado · 2 En curso · 3 Terminado · 5 Por confirmar
  v_AsignadaPor: string | null;
  i_TotalRegistros: number;
}

export interface CrearEditarActividadPayload {
  v_Titulo: string;
  i_CveServAgendaDet: number | null;
  v_Notas: string | null;
  d_FechaInicio: string;
  d_FechaFin: string;   // fecha compromiso
  i_CveInstructorAsignado?: number | null;
}

export interface CancelarActividadPayload {
  v_Motivo: string | null;
}

export interface GuardarAvancePayload {
  i_CveServAgendaDet: number;
  i_Porcentaje: number;
  v_Nota: string | null;
}

export type VistaConsultor = "servicios" | "sesiones";

export interface FiltrosConsultorSesionesState {
  visualizar: VistaConsultor;
  fechaInicio: string;
  fechaFin: string;
  usarRango: boolean;
  searchTerm: string;
}

export type OrdenCampoActividad = "proyecto" | "prioridad" | "estatus";

export interface ProyectoFiltroActividad {
  i_CveServAgendaDet: number;
  v_Etiqueta: string;
  i_OrdenGrupo: number;
}

export interface FiltrosConsultorActividadesState {
  fechaInicio: string;   // "" = sin filtro (filtra por fecha compromiso)
  fechaFin: string;
  usarRango: boolean;
  searchTerm: string;
  prioridades: number[] | null;   // null = todas
  estatus: number[] | null;       // null = todos
  proyectos: number[] | null;     // null = todos (0 = GENERAL)
  ordenCampo: OrdenCampoActividad | null;
  ordenDir: "ASC" | "DESC" | null;
}

export interface FiltrosConsultorServiciosState {
  visualizar: VistaConsultor;
  fechaInicio: string;
  fechaFin: string;
  usarRango: boolean;
  searchTerm: string;
  soloExcedidos: boolean;
}

export interface ActividadPersonal extends ActividadPendienteConsultor {
  i_CveInstructor: number;
  v_Personal: string;
  b_EsPropia: boolean;
  b_PuedeGestionar: boolean;
}

export interface PersonalActividadesOpcion {
  i_CveInstructor: number;
  v_Nombre: string;
  b_EsPropio: boolean;
}

export interface FiltrosActividadesPersonalState extends FiltrosConsultorActividadesState {
  iCvePersonal: number; // -1 = Mías, 0 = Todos, > 0 = i_CveInstructor
}
