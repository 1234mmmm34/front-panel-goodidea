export interface EntregableResumenDto {
  v_Key: string | null;
  v_Nombre: string;
  b_Entregado: boolean;
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
  i_TotalRegistros: number;
  v_NoCotizacionGI: string | null;
  v_NoOrdenCompraCliente: string | null;
  v_Facturas: string | null;
  v_KeyCotizacion: string | null;
  v_KeyOC: string | null;
  v_EntregablesJson: string | null;
  entregablesParseados?: EntregableResumenDto[];
}

export interface servicios {
  i_CveServicio: number;
  v_Nombre: string;
  i_CveRubro: number;
  i_CveTipoServicio: number;
  i_CveUnidad: number;
  i_Cantidad: number | null;
  i_CveNorma: number | null;
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
