export interface EntregablesPorServicioDto {
  i_CveServAgendaDet: number;
  i_CveAgenda?: number;
  v_NombreEmpresa?: string;
  s_RazonSocial?: string;
  v_NombrePlanta?: string;
  s_NombrePlanta?: string;
  v_NombreServicio?: string;
  s_NombreServicio?: string;
  d_FechaInicio?: string;
  f_FechaInicioServicio?: string;
  v_NoCotizacionGI?: string;
  s_NoCotizacionGI?: string;
  v_NoOrdenCompraCliente?: string;
  s_NoOrdenCompraCliente?: string;
  v_Entregables?: string;
  v_EntregablesPendientes?: string;
  s_Entregables?: string;
}

export interface MarcarEntregadoDto {
  i_CveServAgendaDet: number;
  f_FechaEntregable: string; // ISO date string YYYY-MM-DD
}
