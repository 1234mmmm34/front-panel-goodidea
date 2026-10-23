import { apiClient } from "@/lib/api-client";
import { AgendaGetDto } from "@/types/calendario";
import { PaginadoResponse } from "@/types/servicios";
import {
  AgendaServicioConsultorGetDto,
  AgendaDetalleConsultorDto,
  EntregableResumen,
} from "@/types/consultor";

export const ConsultorService = {
  /**
   * GET instructores/consultor/sesiones
   * Listado de sesiones filtradas al personal ligado al usuario en sesión
   */
  async getSesiones(params: {
    fechaInicio?: string;
    fechaFin?: string;
    searchTerm?: string;
    pagina?: number;
    tamano?: number;
    iCveRubro?: number;
    iCveTServicio?: number;
  }): Promise<PaginadoResponse<AgendaGetDto>> {
    const queryParams: Record<string, unknown> = {
      iCveRubro: params.iCveRubro ?? 0,
      iCveTServicio: params.iCveTServicio ?? 0,
      fechaInicio: params.fechaInicio || new Date().toISOString().split("T")[0],
      pagina: params.pagina ?? 1,
      tamano: params.tamano ?? 10,
    };

    if (params.fechaFin && params.fechaFin.trim()) {
      queryParams.fechaFin = params.fechaFin.trim();
    }
    if (params.searchTerm && params.searchTerm.trim()) {
      queryParams.searchTerm = params.searchTerm.trim();
    }

    const resp = await apiClient.get<any>("instructores/consultor/sesiones", {
      params: queryParams,
    });

    const data = resp.data;
    let rawDatos: AgendaGetDto[] = [];
    let total = 0;

    if (Array.isArray(data)) {
      rawDatos = data;
    } else if (data && typeof data === "object") {
      if (Array.isArray(data.datos)) rawDatos = data.datos;
      else if (Array.isArray(data.data)) rawDatos = data.data;
      else if (Array.isArray(data.Datos)) rawDatos = data.Datos;

      if (typeof data.total === "number") total = data.total;
      else if (typeof data.Total === "number") total = data.Total;
    }

    const datosParseados: AgendaGetDto[] = rawDatos.map((item: any) => ({
      ...item,
      i_CveAgenda: item.i_CveAgenda ?? item.I_CveAgenda ?? 0,
      i_CveServAgendaDet: item.i_CveServAgendaDet ?? item.I_CveServAgendaDet ?? 0,
      i_CveAgendaDetalle: item.i_CveAgendaDetalle ?? item.I_CveAgendaDetalle ?? 0,
      i_Orden: item.i_Orden ?? item.I_Orden ?? 1,
      d_FechaInicio: item.d_FechaInicio ?? item.FechaInicio ?? "",
      d_FechaFin: item.d_FechaFin ?? item.FechaFin ?? "",
      v_Empresa: item.v_Empresa ?? item.s_RazonSocial ?? "",
      v_MotivoCancelacion: item.v_MotivoCancelacion ?? null,
      i_CveEstatus: item.i_CveEstatus ?? item.I_CveEstatus ?? 1,
      v_Servicio: item.v_Servicio ?? item.s_NombreServicio ?? "",
      v_TipoServicio: item.v_TipoServicio ?? "",
      v_Titular: item.v_Titular ?? null,
      v_Apoyo: item.v_Apoyo ?? null,
      v_Unidad: item.v_Unidad ?? "",
      b_TipoDato: item.b_TipoDato !== undefined ? Boolean(item.b_TipoDato) : null,
      v_Total: item.v_Total ?? item.s_Total ?? "",
      i_TotalRegistros: item.i_TotalRegistros ?? 0,
    }));

    if (!total) {
      total = rawDatos[0]?.i_TotalRegistros ?? datosParseados.length;
    }
    const tam = params.tamano || 10;
    const totalPaginas = Math.ceil(total / tam) || 1;

    return {
      datos: datosParseados,
      total,
      pagina: params.pagina ?? 1,
      tamano: tam,
      totalPaginas,
    };
  },

  /**
   * GET instructores/consultor/servicios
   * Listado de servicios integrales filtrados al personal ligado
   */
  async getServicios(params: {
    fechaInicio?: string;
    fechaFin?: string;
    searchTerm?: string;
    pagina?: number;
    tamano?: number;
    iCveRubro?: number;
    iCveTServicio?: number;
  }): Promise<PaginadoResponse<AgendaServicioConsultorGetDto>> {
    const queryParams: Record<string, unknown> = {
      iCveRubro: params.iCveRubro ?? 0,
      iCveTServicio: params.iCveTServicio ?? 0,
      fechaInicio: params.fechaInicio || new Date().toISOString().split("T")[0],
      pagina: params.pagina ?? 1,
      tamano: params.tamano ?? 10,
    };

    if (params.fechaFin && params.fechaFin.trim()) {
      queryParams.fechaFin = params.fechaFin.trim();
    }
    if (params.searchTerm && params.searchTerm.trim()) {
      queryParams.searchTerm = params.searchTerm.trim();
    }

    const resp = await apiClient.get<any>("instructores/consultor/servicios", {
      params: queryParams,
    });

    const data = resp.data;
    let rawDatos: AgendaServicioConsultorGetDto[] = [];
    let total = 0;

    if (Array.isArray(data)) {
      rawDatos = data;
    } else if (data && typeof data === "object") {
      if (Array.isArray(data.datos)) rawDatos = data.datos;
      else if (Array.isArray(data.data)) rawDatos = data.data;
      else if (Array.isArray(data.Datos)) rawDatos = data.Datos;

      if (typeof data.total === "number") total = data.total;
      else if (typeof data.Total === "number") total = data.Total;
    }

    const datosParseados: AgendaServicioConsultorGetDto[] = rawDatos.map((item: any) => {
      let entregablesParseados: EntregableResumen[] = [];
      if (item.v_EntregablesJson && typeof item.v_EntregablesJson === "string") {
        try {
          const parsed = JSON.parse(item.v_EntregablesJson);
          if (Array.isArray(parsed)) entregablesParseados = parsed;
        } catch {
          entregablesParseados = [];
        }
      } else if (Array.isArray(item.entregablesParseados)) {
        entregablesParseados = item.entregablesParseados;
      }

      return {
        ...item,
        i_CveAgenda: item.i_CveAgenda ?? 0,
        i_CveServAgendaDet: item.i_CveServAgendaDet ?? 0,
        v_Empresa: item.v_Empresa ?? "",
        v_Planta: item.v_Planta ?? null,
        v_Servicio: item.v_Servicio ?? "",
        v_TipoServicio: item.v_TipoServicio ?? "",
        v_Unidad: item.v_Unidad ?? "",
        i_Cantidad: item.i_Cantidad ?? null,
        i_CveEstatus: item.i_CveEstatus ?? 1,
        d_FechaInicio: item.d_FechaInicio ?? null,
        d_FechaFin: item.d_FechaFin ?? null,
        v_Titular: item.v_Titular ?? null,
        v_Apoyo: item.v_Apoyo ?? null,
        i_TotalEntregables: item.i_TotalEntregables ?? 0,
        i_EntregablesEntregados: item.i_EntregablesEntregados ?? 0,
        b_TipoDato: item.b_TipoDato !== undefined ? Boolean(item.b_TipoDato) : null,
        v_Notas: item.v_Notas ?? null,
        b_AplicaVoBo: item.b_AplicaVoBo !== undefined ? Boolean(item.b_AplicaVoBo) : null,
        b_VoBoEntregado: Boolean(item.b_VoBoEntregado),
        v_EntregablesJson: item.v_EntregablesJson ?? null,
        i_TotalRegistros: item.i_TotalRegistros ?? 0,
        entregablesParseados,
      };
    });

    if (!total) {
      total = rawDatos[0]?.i_TotalRegistros ?? datosParseados.length;
    }
    const tam = params.tamano || 10;
    const totalPaginas = Math.ceil(total / tam) || 1;

    return {
      datos: datosParseados,
      total,
      pagina: params.pagina ?? 1,
      tamano: tam,
      totalPaginas,
    };
  },

  /**
   * GET instructores/consultor/detalle/{iCveAgenda}/{iCveServAgendaDet}
   * Obtiene el detalle en modo lectura para el consultor/personal
   */
  async getDetalle(
    iCveAgenda: number,
    iCveServAgendaDet: number
  ): Promise<AgendaDetalleConsultorDto> {
    const resp = await apiClient.get<any>(
      `instructores/consultor/detalle/${iCveAgenda}/${iCveServAgendaDet}`
    );

    const raw = resp.data?.datos || resp.data?.data || resp.data;

    const cabeceraRaw = raw.cabecera || raw.Cabecera || raw;
    const sesionesRaw = raw.sesiones || raw.Sesiones || [];
    const entregablesRaw = raw.entregables || raw.Entregables || [];
    const alumnosRaw = raw.alumnos || raw.Alumnos || [];

    const cabecera = {
      i_CveAgenda: cabeceraRaw.i_CveAgenda ?? 0,
      i_CveServAgendaDet: cabeceraRaw.i_CveServAgendaDet ?? 0,
      v_Servicio: cabeceraRaw.v_Servicio ?? "",
      v_TipoServicio: cabeceraRaw.v_TipoServicio ?? "",
      v_Empresa: cabeceraRaw.v_Empresa ?? "",
      v_Planta: cabeceraRaw.v_Planta ?? null,
      v_Unidad: cabeceraRaw.v_Unidad ?? "",
      b_TipoDato: cabeceraRaw.b_TipoDato !== undefined ? Boolean(cabeceraRaw.b_TipoDato) : null,
      i_CveEstatus: cabeceraRaw.i_CveEstatus ?? 1,
      i_CveEmpresa: cabeceraRaw.i_CveEmpresa ?? 0,
      i_CvePlanta: cabeceraRaw.i_CvePlanta ?? null,
      i_NumAlumnos: cabeceraRaw.i_NumAlumnos ?? 0,
      b_SinProgramar: cabeceraRaw.b_SinProgramar !== undefined ? Boolean(cabeceraRaw.b_SinProgramar) : null,
      i_Cantidad: cabeceraRaw.i_Cantidad ?? null,
      b_AplicaVoBo: cabeceraRaw.b_AplicaVoBo !== undefined ? Boolean(cabeceraRaw.b_AplicaVoBo) : null,
      d_FechaVoBo: cabeceraRaw.d_FechaVoBo ?? null,
      v_KeyVoBo: cabeceraRaw.v_KeyVoBo ?? null,
      i_CveTipoServicio: cabeceraRaw.i_CveTipoServicio ?? 0,
      v_Notas: cabeceraRaw.v_Notas ?? null,
      d_FechaConfirmacionTermino: cabeceraRaw.d_FechaConfirmacionTermino ?? null,
      v_ConfirmadoPor: cabeceraRaw.v_ConfirmadoPor ?? null,
    };

    const sesiones = (Array.isArray(sesionesRaw) ? sesionesRaw : []).map((s: any) => ({
      i_CveAgendaDetalle: s.i_CveAgendaDetalle ?? 0,
      i_Orden: s.i_Orden ?? null,
      d_FechaHoraInicio: s.d_FechaHoraInicio ?? null,
      d_FechaHoraFin: s.d_FechaHoraFin ?? null,
      i_CveReprograma: s.i_CveReprograma ?? null,
      i_CveContactoReprograma: s.i_CveContactoReprograma ?? null,
      v_Observaciones: s.v_Observaciones ?? null,
      i_CveArea: s.i_CveArea ?? null,
      v_NombreArea: s.v_NombreArea ?? null,
      b_Cancelada: s.b_Cancelada !== undefined ? Boolean(s.b_Cancelada) : null,
      v_MotivoCancelacion: s.v_MotivoCancelacion ?? null,
      v_Titular: s.v_Titular ?? null,
      i_CveTitular: s.i_CveTitular ?? null,
      b_TipoProvInsTitular: s.b_TipoProvInsTitular !== undefined ? Boolean(s.b_TipoProvInsTitular) : null,
      v_Apoyo: s.v_Apoyo ?? null,
      i_CveApoyo: s.i_CveApoyo ?? null,
      b_TipoProvInsApoyo: s.b_TipoProvInsApoyo !== undefined ? Boolean(s.b_TipoProvInsApoyo) : null,
      v_Contacto: s.v_Contacto ?? null,
    }));

    const entregables = (Array.isArray(entregablesRaw) ? entregablesRaw : []).map((e: any) => ({
      i_CveAgendaEntregables: e.i_CveAgendaEntregables ?? 0,
      v_Nombre: e.v_Nombre ?? "",
      b_Entregado: e.b_Entregado !== undefined ? Boolean(e.b_Entregado) : null,
      f_FechaEntregable: e.f_FechaEntregable ?? null,
      i_CveArchivo: e.i_CveArchivo ?? null,
      v_Key: e.v_Key ?? null,
    }));

    const alumnos = (Array.isArray(alumnosRaw) ? alumnosRaw : []).map((a: any) => ({
      i_CveAlumnoAgenda: a.i_CveAlumnoAgenda ?? 0,
      v_Nomina: a.v_Nomina ?? null,
      f_FechaInscripcion: a.f_FechaInscripcion ?? null,
      v_Nombre: a.v_Nombre ?? a.v_NombreCompleto ?? null,
      v_CURP: a.v_CURP ?? a.v_Curp ?? null,
      v_Puesto: a.v_Puesto ?? null,
    }));

    return {
      cabecera,
      sesiones,
      entregables,
      alumnos,
    };
  },

  /**
   * POST instructores/consultor/entregables/marcar
   * Marca o desmarca un entregable del servicio
   */
  async marcarEntregable(
    i_CveAgendaEntregables: number,
    b_Entregado: boolean
  ): Promise<void> {
    await apiClient.post("instructores/consultor/entregables/marcar", {
      i_CveAgendaEntregables,
      b_Entregado,
    });
  },

  /**
   * POST instructores/consultor/confirmarTermino/{i_CveServAgendaDet}
   * Confirma la terminación de un servicio desde Mis servicios
   */
  async confirmarTermino(
    iCveServAgendaDet: number
  ): Promise<{ exito: boolean; mensaje?: string; status?: number }> {
    try {
      const resp = await apiClient.post(
        `instructores/consultor/confirmarTermino/${iCveServAgendaDet}`
      );
      return {
        exito: true,
        mensaje: resp.data?.mensaje || resp.data?.v_Mensaje || "Servicio confirmado como terminado",
        status: resp.status,
      };
    } catch (error: any) {
      const msg =
        error.response?.data?.mensaje ||
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        "Error al confirmar terminado";
      return {
        exito: false,
        mensaje: msg,
        status: error?.response?.status,
      };
    }
  },
};
