export interface EntregableResumenDto {
  v_Key: string | null;
  v_Nombre: string;
  b_Entregado: boolean;
  i_CveArchivo?: number | string | null;
}

export interface AgendaServicioGetDto {
  i_CveAgenda: number;
  i_CveServAgendaDet: number;
  v_Empresa: string | null;
  v_Planta: string | null;
  v_Servicio: string | null;
  v_TipoServicio: string | null;
  v_Unidad: string | null;
  i_Cantidad: number | null;
  i_CveEstatus: number | null;
  d_FechaInicio: string | null;
  d_FechaFin: string | null;
  v_Titular: string | null;
  v_Apoyo: string | null;
  i_TotalEntregables: number;
  i_EntregablesEntregados: number;
  i_TotalFacturas: number;
  i_FacturasCobradas: number;
  d_MontoCobrado: number;
  d_MontoTotal: number;
  d_Costo: number;
  d_Utilidad: number;
  v_TipoVenta: string | null;
  v_NoPoliza: string | null;
  b_TipoDato: boolean;
  b_TieneCotizacion: boolean;
  b_TieneOC: boolean;
  b_SinProgramar: boolean;
  b_AplicaVoBo?: boolean;
  b_VoBoEntregado?: boolean;
  v_KeyVoBo?: string | null;
  i_TotalRegistros: number;
  v_NoCotizacionGI: string | null;
  v_NoOrdenCompraCliente: string | null;
  v_Facturas: string | null;
  v_KeyCotizacion: string | null;
  v_KeyOC: string | null;
  v_EntregablesJson: string | null;
  v_Entregables?: string | null;
  entregablesParseados?: EntregableResumenDto[];
}

export interface SesionDetalleDto {
  i_CveAgendaDetalle: number;
  i_Orden: number;
  d_FechaHoraInicio: string;   // ISO
  d_FechaHoraFin: string;      // ISO
  Completada: boolean;
  i_CveReprograma: number | null;         // si tiene valor, apunta al i_CveAgendaDetalle de la nueva sesión
  i_CveContactoReprograma: number | null;
  v_Observaciones: string | null;
  v_Contacto: string | null;
  v_Titular: string | null;
  i_CveTitular: number | null;
  b_TipoProvInsTitular: boolean | null;
  v_Apoyo: string | null;
  i_CveApoyo: number | null;
  b_TipoProvInsApoyo: boolean | null;
  i_CveArea: number;
  v_NombreArea: string;
  b_Cancelada?: boolean;
  v_MotivoCancelacion?: string | null;
}

export interface EntregableDetalleDto {
  i_CveAgendaEntregables: number;
  i_CveEntregables?: number;
  v_Nombre: string;
  b_Entregado: boolean;
  f_FechaEntregable: string | null;
  i_CveArchivo: number | null;
  v_Key?: string | null;
}

export interface AgregarEntregablesDto {
  i_CveAgenda: number;
  i_CveServAgendaDet: number;
  Entregables: number[];
  b_GuardarEnCatalogo: boolean;
}

export interface AlumnoAgendaDto {
  i_CveAlumnoAgenda: number;
  v_Nomina: string | null;
  f_FechaInscripcion: string | null;
}

export interface AlumnoInscrito {
  i_CveAlumnoAgenda: number;
  v_Nomina: string;
  f_FechaInscripcion: string | null;
  i_CveAlumno: number | null;
  v_Nombre: string | null;
  v_CURP: string | null;
  v_Puesto: string | null;
}

export interface FacturaDetalleDto {
  i_CveFacturas: number;
  v_NoFactura: string | null;
  d_FechaHora: string | null;
  d_Monto: number | null;
  b_Timbrada: boolean;
  b_Cancelada: boolean;
  v_EstadoCobro: string | null;    // "Cobrada" | "Abonada" | otro
  d_SaldoPendiente: number | null; // usado cuando v_EstadoCobro === "Abonada"
}

export interface AgendaDetalleGetDto {
  i_CveAgenda: number;
  i_CveServAgendaDet: number;
  v_Servicio: string;
  v_TipoServicio: string;
  v_Empresa: string;
  i_Cantidad: number;
  v_Planta: string;
  v_Unidad: string;
  i_CveEstatus: number | null;
  v_TipoVenta: string | null;        // "proyecto" | "normal" | "poliza" — determina el layout de Montos
  v_NoCotizacionGI: string | null;
  v_NoOrdenCompraCliente: string | null;
  Sesiones: SesionDetalleDto[];
  Entregables: EntregableDetalleDto[];
  Facturas: FacturaDetalleDto[];
  b_TipoDato: boolean;                // controla si se muestra el rango de horas en el header de sesión
  i_CveAgendaDetalle: number;
  i_Orden: number;
  i_TotalSesiones: number;
  i_CveEmpresa: number | null;
  d_PrecioProveedor: number;
  i_CveProveedor?: number | null;
  v_Proveedor?: string | null;
  v_NoCotizacionProv?: string | null;
  v_NoOrdenCompraProv?: string | null;
  i_CvePlanta: number | null;
  i_CveArea: number | null;
  v_NombreArea: string | null;
  i_NumAlumnos: number;               // 0 = sin límite de cupo
  Alumnos: AlumnoAgendaDto[];
  b_SinProgramar: boolean;
  d_MontoProyecto: number | null;     // solo relevante si v_TipoVenta === "proyecto"
  d_PrecioUnitario: number;
  b_AplicaVoBo?: boolean;
  i_CveTipoServicio?: number | null;
  d_FechaVoBo?: string | null;
  v_KeyVoBo?: string | null;
}

export interface CambiarTitularesSesionDto {
  i_CveAgendaDetalle: number;
  i_CveTitular: number | null;   // solo capacitación; null en los demás
  i_CveApoyo: number | null;     // solo instructores
  d_FechaHoraInicio: string;    // "2026-10-06T09:00:00", hora local, sin zona ni "Z"
  d_FechaHoraFin: string;
}

export interface ProgramarSesionItemDto {
  i_Orden: number;
  d_FechaHoraInicio: string; // "2026-10-06T09:00:00", hora local, sin "Z"
  d_FechaHoraFin: string;
  i_CveArea: number | null;
}

export interface ProgramarServicioDto {
  i_CveServAgendaDet: number;
  i_CveAgenda: number;
  i_CveTitular: number | null; // solo capacitación
  i_CveApoyo: number | null;
  b_TipoProvInsApoyo: boolean; // false = instructor, true = proveedor
  i_NumAlumnos: number | null; // null = cupo abierto
  v_NoCotizacionGI: string | null;
  v_NoOrdenCompraCliente: string | null;
  d_PrecioUnitario: number | null;
  d_PrecioProveedor: number | null; // unitario sin IVA; solo si el apoyo es proveedor
  v_NoCotizacionProv: string | null;
  v_NoOrdenCompraProv: string | null;
  Sesiones: ProgramarSesionItemDto[];
}

export interface CambiarProveedorDto {
  i_CveServAgendaDet: number;
  i_CveProveedor: number | null;
  d_PrecioProveedor: number;
  v_NoOrdenCompraProv: string | null;
  v_NoCotizacionProv: string | null;
}

export interface FacturaUpdateDto {
  i_CveFacturas: number;
  v_NoFactura: string | null;
  b_Timbrada: boolean;
  v_EstadoCobro: string | null;
  d_FechaHora: string | null;
}

export interface EntregableUpdateDto {
  i_CveAgendaEntregables: number;
  b_Entregado: boolean;
  f_FechaEntregable: string | null;
}

export interface AgendaDetalleUpdateDto {
  i_CveServAgendaDet: number;
  v_NoCotizacionGI: string | null;
  v_NoOrdenCompraCliente: string | null;
  Facturas: FacturaUpdateDto[];
  Entregables: EntregableUpdateDto[];
}

export interface servicios {
  i_CveServicio: number;
  v_Nombre: string;
  i_CveRubro: number;
  i_CveTipoServicio: number;
  i_CveUnidad: number;
  i_Cantidad: number | null;
  i_CveNorma: number | null;
  b_AplicaVoBo?: boolean;
  entregables: number[];
}

export interface ServiciosPostDto {
  Servicio: servicios;
  Entregables: number[];
}

export interface ServiciosDrpDto {
  i_CveServicio: number;
  v_Nombre: string;
  v_Rubro: string;
  v_TipoServicio: string;
  v_Unidad: string;
  v_Norma: string | null;
  i_Cantidad: number | null;
  v_Entregables: string | null;
  b_AplicaVoBo?: boolean;
  total: number;
}

export interface ServiciosDropdownDto {
  i_CveServicio: number;
  v_Nombre: string | null;
  i_CveRubro: number;
  v_Rubro: string | null;
  i_CveTipoServicio: number;
  v_TipoServicio: string | null;
  i_CveUnidad: number;
  v_Unidad: string | null;
  i_CveNorma: number | null;
  v_Norma: string | null;
  i_Cantidad: number | null;
  b_TipoDato: boolean;
  b_ModifCantEnAgenda: boolean;
  b_AplicaVoBo?: boolean;
  entregables: number[];
}

export interface PaginadoResponse<T> {
  datos: T[];
  total: number;
  pagina: number;
  tamano: number;
  totalPaginas: number;
}

export interface tiposServicios {
  i_CveTServicio: number;
  v_Nombre: string;
  i_CveUnidad: number;
  b_AgendarMas: boolean;
}

export interface InstructorGetDto {
  i_CveInstructor: number;
  v_Nombre?: string | null;
  v_ApPaterno?: string | null;
  v_ApMaterno?: string | null;
  v_NombreCompleto?: string | null;
}

export interface ProveedorGetDto {
  i_CveProveedor: number;
  v_Nombre?: string | null;
  v_RazonSocial?: string | null;
}

export interface AreaGetDto {
  i_CveArea: number;
  v_NombreArea?: string | null;
  v_Nombre?: string | null;
  i_CveCentro?: number | null;
}

export interface RangoFechaDto {
  d_FechaHoraInicio?: string | null;
  d_FechaHoraFin?: string | null;
  FechaHoraInicio?: string | null;
  FechaHoraFin?: string | null;
}

export interface AgendaCabeceraInsertDto {
  i_CveEmpresa: number;
  i_CvePlanta: number;
  i_CveContacto: number;
  i_CveEstatus: number;
  v_TipoVenta: string;
  i_CveAgenda?: number;
  v_NomReprograma?: string | null;
  i_NumParticipantes?: number | null;
  v_FrecuenciaPoliza?: string | null;
  i_DiaFacturacion?: number | null;
  v_NombreProyecto?: string | null;
  d_MontoProyecto?: number | null;
}

export interface ServicioAgendaDetalleInsertDto {
  i_CveServicio: number;
  i_Cantidad: number;
  d_PrecioUnitario: number;
  d_PrecioProveedor?: number | null;
  v_NoCotizacionGI?: string | null;
  v_NoOrdenCompraCliente?: string | null;
  i_NumAlumnos?: number | null;
  b_SinProgramar: boolean;
  i_CanTotal?: number | null;
  b_Cancelado?: boolean;
}

export interface SesionInsertDto {
  d_FechaHoraInicio: string;
  d_FechaHoraFin: string;
  i_Orden: number;
  i_CveServAgendaDet?: number;
  i_CveTitular?: number | null;
  i_CveApoyo?: number | null;
  b_TipoProvInsTitular: boolean;
  b_TipoProvInsApoyo: boolean;
  i_CveArea?: number | null;
}

export interface DatosVentaProveedorDto {
  i_CveProveedor: number;
  v_NoCotizacionProv?: string | null;
  v_NoOrdenCompraProv?: string | null;
  i_CveAgenda?: number;
  i_CveServAgendaDet?: number;
}

export interface AgendaEntregableInsertDto {
  i_CveEntregables: number;
  i_CveAgendaEntregables?: number;
  i_CveAgenda?: number;
  i_CveServAgendaDet?: number;
  b_Entregado: boolean;
}

export interface AgendaInsertDto {
  Agenda: AgendaCabeceraInsertDto;
  Servicios: ServicioAgendaDetalleInsertDto[];
  Sesiones: SesionInsertDto[];
  Proveedores: DatosVentaProveedorDto[];
  Entregables: AgendaEntregableInsertDto[];
}

export interface ReprogramacionInsertDto {
  i_CveAgendaDetalle: number;
  i_CveAgenda: number;
  i_CveServAgendaDet: number;
  i_Orden: number;
  d_FechaHoraInicio: string;
  d_FechaHoraFin: string;
  i_CveTitular: number | null;
  b_TipoProvInsTitular: boolean;
  i_CveApoyo: number | null;
  b_TipoProvInsApoyo: boolean | null;
  i_CveArea: number | null;
  v_Observaciones: string;
  i_CveContactoReprograma: number;
  CambiaProveedor: boolean;
  CambiaInstructor: boolean;
  d_NuevoPrecioProveedor: number;
}

