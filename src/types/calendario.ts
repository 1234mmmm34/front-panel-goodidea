export interface AgendaGetDto {
  i_CveAgenda: number;
  i_Orden: number | null;
  d_FechaInicio: string | null;
  d_FechaFin: string | null;
  v_Empresa: string | null;
  i_CveEstatus: number | null;
  v_Servicio: string | null;
  v_TipoServicio: string | null;
  v_Titular: string | null;
  v_Apoyo: string | null;
  v_Unidad: string | null;
  v_Total: string | null;
  i_CveServAgendaDet: number;
  i_CveAgendaDetalle: number;
  b_TipoDato: boolean;
  i_TotalRegistros: number;
}

export interface RespuestaAgendaGet {
  datos: AgendaGetDto[];
  total: number;
  totalPaginas: number;
}
