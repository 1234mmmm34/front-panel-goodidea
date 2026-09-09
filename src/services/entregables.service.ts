import { apiClient } from "@/lib/api-client";
import { EntregablesPorServicioDto, MarcarEntregadoDto } from "@/types/entregables";
import { entregables } from "@/types/catalogos";

export class EntregablesService {
  /**
   * 1. Cargar entregables pendientes (llena la tabla)
   * GET {UrlApi}entregables/PorServicio (?i_CveAgenda={id})
   */
  static async getEntregablesPendientesMarcar(
    iCveAgenda?: number
  ): Promise<EntregablesPorServicioDto[]> {
    try {
      const queryParam = iCveAgenda ? `?i_CveAgenda=${iCveAgenda}` : "";
      
      let resp: any = null;
      try {
        resp = await apiClient.get<any>(`entregables/PorServicio${queryParam}`);
      } catch (err1) {
        // Fallback a minúsculas en el path por si el ruteo del backend exige minúsculas
        try {
          resp = await apiClient.get<any>(`entregables/porservicio${queryParam}`);
        } catch (err2) {
          console.error("Error al consultar entregables/PorServicio:", err2);
          return [];
        }
      }

      console.log("[EntregablesService] Respuesta GET entregables/PorServicio:", resp?.data);

      const rawData = Array.isArray(resp?.data)
        ? resp.data
        : resp?.data?.datos ||
          resp?.data?.data ||
          resp?.data?.Datos ||
          resp?.data?.result ||
          resp?.data?.value ||
          [];

      if (Array.isArray(rawData)) {
        return rawData.map((item: any) => ({
          i_CveServAgendaDet:
            item.i_CveServAgendaDet ??
            item.I_CveServAgendaDet ??
            item.iCveServAgendaDet ??
            item.id ??
            0,
          i_CveAgenda:
            item.i_CveAgenda ??
            item.I_CveAgenda ??
            item.iCveAgenda,
          v_NombreEmpresa:
            item.v_NombreEmpresa ??
            item.s_RazonSocial ??
            item.s_NombreEmpresa ??
            item.v_Empresa ??
            item.s_Empresa ??
            item.empresa ??
            item.nombreEmpresa ??
            "N/A",
          v_NombrePlanta:
            item.v_NombrePlanta ??
            item.s_NombrePlanta ??
            item.v_Planta ??
            item.s_Planta ??
            item.planta ??
            item.nombrePlanta ??
            "N/A",
          v_NombreServicio:
            item.v_NombreServicio ??
            item.s_NombreServicio ??
            item.v_Servicio ??
            item.s_Servicio ??
            item.servicio ??
            item.nombreServicio ??
            "N/A",
          d_FechaInicio:
            item.d_FechaInicio ??
            item.f_FechaInicioServicio ??
            item.d_FechaInicioServicio ??
            item.d_FechaInicioServ ??
            item.fechaInicio ??
            null,
          v_NoCotizacionGI:
            item.v_NoCotizacionGI ??
            item.s_NoCotizacionGI ??
            item.v_Cotizacion ??
            item.s_Cotizacion ??
            item.noCotizacion ??
            null,
          v_NoOrdenCompraCliente:
            item.v_NoOrdenCompraCliente ??
            item.s_NoOrdenCompraCliente ??
            item.v_OrdenCompra ??
            item.s_OrdenCompra ??
            item.noOrdenCompra ??
            null,
          v_Entregables:
            item.v_Entregables ??
            item.v_EntregablesPendientes ??
            item.s_Entregables ??
            item.entregables ??
            "",
        }));
      }
      return [];
    } catch (err) {
      console.error("Error al obtener entregables pendientes por servicio:", err);
      return [];
    }
  }

  /**
   * 2. Guardar (marcar como entregados)
   * POST {UrlApi}entregables/MarcarEntregados
   */
  static async marcarEntregados(items: MarcarEntregadoDto[]): Promise<boolean> {
    try {
      const resp = await apiClient.post<any>("entregables/MarcarEntregados", items);
      return resp.status >= 200 && resp.status < 300;
    } catch (err) {
      console.error("Error al marcar entregables como entregados:", err);
      return false;
    }
  }

  /**
   * 3. Catálogo general de entregables (referencia)
   * GET {UrlApi}entregables
   */
  static async getEntregables(): Promise<entregables[]> {
    try {
      const resp = await apiClient.get<entregables[]>("entregables");
      return resp.data || [];
    } catch (err) {
      console.error("Error al obtener catálogo de entregables:", err);
      return [];
    }
  }
}
