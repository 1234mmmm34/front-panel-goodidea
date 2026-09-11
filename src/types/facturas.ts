export interface FacturaGetDto {
  i_CveFacturas: number;
  v_Empresa: string;
  v_NoFactura?: string | null;
  d_FechaHora?: string | null;
  d_ProximoPago?: string | null;
  d_Monto: number;
  d_SaldoPendiente: number;
  d_Abonado: number;
  i_PagosPendientes: number;
  b_Timbrada: boolean;
  b_Cancelada: boolean;
  v_MotivoCancelacion?: string | null;
  v_Estado?: string;
  total?: number;
  Total?: number;
  i_TotalRegistros?: number;
}

export interface FiltrosFacturasState {
  estado: string; // "" (Todos), "Pendientes", "Abonada", "Cobrada", "SinProgramar", "Canceladas"
  fechaPago: string | null; // "yyyy-MM-dd"
  searchTerm: string;
  empresa?: string;
}

export interface ResultadoRespuestaApi {
  exito: boolean;
  mensaje?: string;
}

export interface PagoPendienteMasivoDto {
  i_CveFactura: number;
  v_Empresa: string | null;
  v_Planta: string | null;
  v_Servicio: string | null;        // nombres de todos los servicios de la factura, separados por coma
  v_NoFactura: string | null;
  d_FechaFactura: string | null;    // fecha ISO
  d_FechaProximoPago: string | null; // el pago vencido más antiguo sin pagar de esa factura
  d_Monto: number;                  // SUMA de todos los abonos vencidos y pendientes (acumulado)
  v_AbonosIds: string | null;       // "101,102" — ids de TODOS los abonos vencidos de esa factura, separados por coma
}

export interface AbonoFacturaDto {
  i_CveAbono: number;
  i_CveFactura: number;
  d_Monto: number; // Renombrado de f_Monto
  d_FechaProgramada?: string | null; // Fecha programada (antes d_FechaAbono)
  d_FechaAbono?: string | null; // Fecha real en que se pagó
  v_FormaPago?: string;
  v_Descripcion?: string | null; // Renombrado de v_Notas
  v_MotivoCancelacion?: string | null;
  i_Estado: number; // 0: Pendiente, 1: Pagado, 2: Cancelado
}

export interface LineaServicioFacturaDto {
  i_CveFacturaDetalle?: number;
  v_Servicio: string; // Renombrado de v_NombreServicio
  i_Cantidad: number;
  v_Unidad: string;
  d_PrecioUnitario: number;
  d_IVA: number;
  d_Subtotal: number;
  v_TipoVenta?: string | null;
  v_NombreProyecto?: string | null;
  d_MontoProyecto?: number | null;
  i_CveAgenda?: number | null;
}

export interface FacturaDetalleDto extends FacturaGetDto {
  v_RfcEmpresa?: string;
  v_DireccionEmpresa?: string;
  lineas?: LineaServicioFacturaDto[];
  abonos?: AbonoFacturaDto[];
  conceptos?: any[];
}

export interface ServicioSinFacturaDto {
  i_CveServAgendaDet: number;
  v_Servicio: string;
  v_NoCotizacionGI?: string | null;
  d_FechaInicio?: string | null;
  d_Subtotal: number;
  d_Total: number;
  i_Cantidad?: number | null;
  v_Unidad?: string | null;
  v_TipoServicio?: string | null;
  i_CveServicio?: number;
  v_NombreServicio?: string;
  f_Precio?: number;
  d_FechaServicio?: string;
}

export interface FacturaSinTimbrarDto {
  i_CveFactura: number;
  v_NumeroFactura: string;
  f_Total: number;
  d_FechaCreacion: string;
}

/**
 * Determina si el estado elegido es considerado "de tipo pendiente"
 * para efectos de mostrar el filtro condicional de fecha de pago.
 */
export function EsEstadoPendiente(estado: string): boolean {
  return estado === "Pendientes" || estado === "No cobrada" || estado === "Abonada";
}

/**
 * Calcula el estado de la factura en el frontend si no viene del backend.
 */
export function getEstadoFactura(item: FacturaGetDto): string {
  if (item.b_Cancelada) return "Cancelada";
  if (item.d_SaldoPendiente <= 0) return "Liquidada";
  if (item.d_Abonado > 0) return "Abonada";
  return "No cobrada";
}
