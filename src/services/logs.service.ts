import { apiClient } from "@/lib/api-client";
import {
  AuditLogFiltros,
  AuditLogItem,
  AuditLogPaged,
  AuditLogQueryParams,
} from "@/types/logs";

function extraerMensajeError(err: any, fallback: string): string {
  const data = err?.response?.data;
  if (typeof data === "string" && data.trim()) return data.trim();
  if (data && typeof data === "object") {
    const msg = data.error || data.mensaje || data.message || data.title;
    if (typeof msg === "string" && msg.trim()) return msg.trim();
  }
  if (typeof err?.message === "string" && err.message.trim()) {
    return err.message.trim();
  }
  return fallback;
}

export const LogsService = {
  /**
   * GET logs
   * Consulta paginada de logs de auditoría de la API.
   */
  async getLogs(params: AuditLogQueryParams): Promise<AuditLogPaged> {
    try {
      const queryParams: Record<string, string | number> = {
        d_FechaInicio: params.d_FechaInicio,
        pagina: params.pagina,
        tamano: params.tamano,
      };

      if (params.d_FechaFin && params.d_FechaFin.trim() !== "") {
        queryParams.d_FechaFin = params.d_FechaFin.trim();
      }
      if (params.i_CveUsuario !== undefined && params.i_CveUsuario !== null) {
        queryParams.i_CveUsuario = params.i_CveUsuario;
      }
      if (params.v_Metodo && params.v_Metodo.trim() !== "") {
        queryParams.v_Metodo = params.v_Metodo.trim();
      }
      if (params.i_StatusCode !== undefined && params.i_StatusCode !== null) {
        queryParams.i_StatusCode = params.i_StatusCode;
      }
      if (params.v_Ruta && params.v_Ruta.trim() !== "") {
        queryParams.v_Ruta = params.v_Ruta.trim();
      }

      const resp = await apiClient.get<AuditLogPaged>("logs", {
        params: queryParams,
      });

      const raw = resp.data;
      const datos = Array.isArray(raw?.datos) ? raw.datos : [];
      const total = Number(raw?.total ?? datos.length ?? 0);
      const totalPaginas = Number(
        raw?.totalPaginas ?? (Math.ceil(total / (params.tamano || 20)) || 1)
      );

      return {
        datos,
        total,
        totalPaginas: totalPaginas > 0 ? totalPaginas : 1,
      };
    } catch (err: any) {
      throw new Error(
        extraerMensajeError(err, "No se pudieron cargar los logs de la API.")
      );
    }
  },

  /**
   * GET logs/{i_CveLog}
   * Obtiene el detalle completo de un log (incluyendo v_Payload y v_Respuesta).
   */
  async getLogById(i_CveLog: number): Promise<AuditLogItem> {
    try {
      const resp = await apiClient.get<AuditLogItem>(`logs/${i_CveLog}`);
      return resp.data;
    } catch (err: any) {
      if (err?.response?.status === 404) {
        throw new Error(
          extraerMensajeError(err, "El registro de log solicitado no existe (404).")
        );
      }
      throw new Error(
        extraerMensajeError(err, "No se pudo obtener el detalle del log.")
      );
    }
  },

  /**
   * GET logs/filtros
   * Obtiene el catálogo de usuarios y códigos HTTP registrados en el log.
   */
  async getFiltros(): Promise<AuditLogFiltros> {
    try {
      const resp = await apiClient.get<AuditLogFiltros>("logs/filtros");
      return {
        usuarios: Array.isArray(resp.data?.usuarios) ? resp.data.usuarios : [],
        codigos: Array.isArray(resp.data?.codigos) ? resp.data.codigos : [],
      };
    } catch (err: any) {
      throw new Error(
        extraerMensajeError(err, "No se pudieron cargar los filtros de logs.")
      );
    }
  },
};

