import { EntregableDetalleDto } from "./servicios";

export interface ServiciosPendientesArchivoDto {
  i_CveServAgendaDet: number;
  v_Servicio: string;
  v_TipoServicio: string;
  v_Empresa: string;
  v_Planta: string;
  d_FechaInicio: string | null;
  v_NoCotizacionGI: string | null;
  v_NoOrdenCompraCliente: string | null;
}

export interface ServicioConEntregablesDto {
  i_CveServAgendaDet: number;
  v_Servicio: string;
  v_TipoServicio: string;
  v_Empresa: string;
  v_Planta: string;
  d_FechaInicio: string | null;
  v_NoCotizacionGI: string | null;
  v_NoOrdenCompraCliente: string | null;
  entregables: EntregableDetalleDto[];
}

export interface SubirArchivoRequestDto {
  v_Tipo: "cotizacion_cliente" | "oc_cliente" | "entregable";
  ServiciosSeleccionados?: number[];
  v_Referencia?: string;
  EntregablesSeleccionados?: number[];
  d_FechaEntrega?: string;
}
