export interface FacturaProv {
  i_CveFacturaProv: number;
  i_CveProveedor: number;
  v_Proveedor: string | null;
  v_Servicio: string | null;
  v_NoFactura: string | null;
  v_NoOrdenCompraProv: string | null;
  v_NoCotizacionProv: string | null;
  d_Monto: number;
  d_Abonado: number;
  d_SaldoPendiente: number;
  v_EstadoPago: string | null;
  d_FechaHora: string;
  b_Cancelada: boolean;
  v_MotivoCancelacion: string | null;
  v_Descripcion: string | null;
  i_PagosPendientes: number;
  d_ProximoPago: string | null;
  d_PorcentajeDescuento?: number;
  total?: number;
  Total?: number;
  i_TotalRegistros?: number;
}

export interface FacturasProvResumen {
  d_TotalFacturado: number;
  d_TotalPagado: number;
  d_TotalPendiente: number;
  i_TotalFacturas: number;
}

export interface FacturaProvLinea {
  i_CveDatosVentaProv: number;
  i_CveServAgendaDet: number;
  v_Servicio: string | null;
  v_Cliente: string | null;
  i_Cantidad: number;
  v_Unidad: string | null;
  d_PrecioUnitario: number;
  d_Subtotal: number;
  d_IVA: number;
  d_Total: number;
  v_NoCotizacionProv: string | null;
  v_NoOrdenCompraProv: string | null;
  v_NoCotizacionGI?: string | null;
}

export interface AbonoProv {
  i_CveAbonoProv: number;
  i_CveFacturaProv: number;
  d_Monto: number;
  d_FechaProgramada: string | null;
  d_FechaAbono: string | null;
  v_Referencia: string | null;
  v_Descripcion: string | null;
  i_Estado: number; // 0 pendiente, 1 pagado, 2 cancelado
  v_MotivoCancelacion: string | null;
}

export interface ServicioSinFacturaProv {
  i_CveDatosVentaProv: number;
  i_CveServAgendaDet: number;
  i_CveProveedor: number;
  v_Proveedor: string | null;
  v_Servicio: string | null;
  v_Cliente: string | null;
  d_FechaInicio: string | null;
  i_Cantidad: number;
  d_PrecioUnitario: number;
  d_Subtotal: number;
  d_Total: number;
  v_NoCotizacionProv: string | null;
  v_NoOrdenCompraProv: string | null;
}

export interface AbonoCrearDto {
  d_Monto: number;
  d_FechaProgramada: string;
}

export interface CrearFacturaProvDto {
  i_CveProveedor: number;
  v_NoFactura: string | null;
  d_FechaHora: string;
  d_Monto: number;
  v_Descripcion: string | null;
  DatosVentaIds: number[];
  Abonos: AbonoCrearDto[];
}

export interface FiltrosGastosState {
  estado: string;
  fechaInicio: string;
  fechaFin: string;
  i_CveProveedor: number;
  searchTerm: string;
}

export interface ResultadoRespuestaApi {
  exito: boolean;
  mensaje?: string;
}

export interface DescuentoGastoRespuestaDto {
  i_CveFacturaProv: number;
  d_PorcentajeDescuento: number;
  d_Monto: number;
  d_SaldoPendiente: number;
  v_EstadoPago: string;
}

export interface ResultadoAplicarDescuentoApi {
  exito: boolean;
  mensaje?: string;
  datos?: DescuentoGastoRespuestaDto;
}
