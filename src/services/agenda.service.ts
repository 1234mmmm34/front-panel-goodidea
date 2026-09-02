import { apiClient, httpDefensivo } from "@/lib/api-client";
import { AgendaGetDto, RespuestaAgendaGet } from "@/types/calendario";
import { AgendaServicioGetDto, PaginadoResponse } from "@/types/servicios";

export const AgendaService = {
  /**
   * Módulo 1 — Calendario
   * Obtiene la agenda completa del rango especificado (mes actual) en una sola llamada.
   */
  async getAgendaMes(fechaInicio: string, fechaFin: string): Promise<AgendaGetDto[]> {
    return httpDefensivo(async () => {
      const resp = await apiClient.get<RespuestaAgendaGet | AgendaGetDto[]>("agenda/GetAgenda", {
        params: {
          i_CveRubro: 0,
          i_CveTServicio: 0,
          fechaInicio,
          fechaFin,
          pagina: 1,
          tamano: 2147483647,
        },
      });

      if (Array.isArray(resp.data)) {
        return resp.data;
      }
      return resp.data?.datos ?? [];
    }, []);
  },

  /**
   * Módulo 2 — Servicios Agendados
   * Obtiene la lista de servicios agendados paginada.
   * Normaliza la respuesta para exponer { datos, total, totalPaginas }.
   */
  async getAgendaServicios(params: {
    soloSinProgramar: boolean;
    pagina: number;
    tamano: number;
    fechaInicio?: string;
    fechaFin?: string;
    searchTerm?: string;
    facturado?: number;
  }): Promise<PaginadoResponse<AgendaServicioGetDto>> {
    return httpDefensivo(async () => {
      const queryParams: Record<string, unknown> = {
        i_CveRubro: 0,
        i_CveTServicio: 0,
        soloSinProgramar: params.soloSinProgramar,
        pagina: params.pagina,
        tamano: params.tamano,
      };

      if (!params.soloSinProgramar && params.fechaInicio) {
        queryParams.fechaInicio = params.fechaInicio;
      }
      if (!params.soloSinProgramar && params.fechaFin) {
        queryParams.fechaFin = params.fechaFin;
      }
      if (params.searchTerm) {
        queryParams.searchTerm = params.searchTerm;
      }
      if (params.facturado !== undefined && params.facturado !== null) {
        queryParams.facturado = params.facturado;
      }

      const resp = await apiClient.get<AgendaServicioGetDto[] | PaginadoResponse<AgendaServicioGetDto>>(
        "agenda/GetAgendaServicios",
        { params: queryParams }
      );

      let rawDatos: AgendaServicioGetDto[] = [];
      if (Array.isArray(resp.data)) {
        rawDatos = resp.data;
      } else if (resp.data && Array.isArray((resp.data as PaginadoResponse<AgendaServicioGetDto>).datos)) {
        rawDatos = (resp.data as PaginadoResponse<AgendaServicioGetDto>).datos;
      }

      const datosParseados = rawDatos.map((item) => {
        let entregablesParseados = item.entregablesParseados;
        if (!entregablesParseados && item.v_EntregablesJson) {
          try {
            entregablesParseados = JSON.parse(item.v_EntregablesJson);
          } catch {
            entregablesParseados = [];
          }
        }
        return {
          ...item,
          entregablesParseados: entregablesParseados ?? [],
        };
      });

      const totalRegistros = rawDatos[0]?.i_TotalRegistros ?? datosParseados.length;
      const totalPaginas = Math.ceil(totalRegistros / (params.tamano || 10)) || 1;

      return {
        datos: datosParseados,
        total: totalRegistros,
        pagina: params.pagina,
        tamano: params.tamano,
        totalPaginas,
      };
    }, {
      datos: [],
      total: 0,
      pagina: params.pagina,
      tamano: params.tamano,
      totalPaginas: 1,
    });
  },

  /**
   * Elimina un registro de agenda por ID.
   */
  async deleteAgenda(id: number): Promise<boolean> {
    return httpDefensivo(async () => {
      const resp = await apiClient.delete(`agenda/DeleteAgenda/${id}`);
      return resp.status >= 200 && resp.status < 300;
    }, false);
  },
};
