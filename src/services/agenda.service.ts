import { apiClient, httpDefensivo } from "@/lib/api-client";
import { AgendaGetDto, RespuestaAgendaGet } from "@/types/calendario";
import {
  AgendaServicioGetDto,
  AgendaDetalleGetDto,
  AgendaDetalleUpdateDto,
  PaginadoResponse,
  InstructorGetDto,
  ProveedorGetDto,
  AreaGetDto,
  RangoFechaDto,
  AgendaInsertDto,
  ReprogramacionInsertDto,
} from "@/types/servicios";

export const AgendaService = {
  /**
   * Módulo 1 — Calendario
   * Obtiene la agenda completa del rango especificado (mes actual) en una sola llamada.
   */
  async getAgendaMes(fechaInicio: string, fechaFin: string): Promise<AgendaGetDto[]> {
    return httpDefensivo(async () => {
      const resp = await apiClient.get<any>("agenda/GetAgenda", {
        params: {
          i_CveRubro: 0,
          i_CveTServicio: 0,
          fechaInicio,
          fechaFin,
          pagina: 1,
          tamano: 2147483647,
        },
      });

      const raw = Array.isArray(resp.data)
        ? resp.data
        : resp.data?.datos || resp.data?.data || resp.data?.Datos || [];

      if (!Array.isArray(raw)) return [];

      return raw.map((item: any) => ({
        ...item,
        i_CveAgenda: item.i_CveAgenda ?? item.I_CveAgenda ?? item.iCveAgenda ?? 0,
        i_CveServAgendaDet: item.i_CveServAgendaDet ?? item.I_CveServAgendaDet ?? item.iCveServAgendaDet ?? 0,
        i_CveAgendaDetalle: item.i_CveAgendaDetalle ?? item.I_CveAgendaDetalle ?? item.iCveAgendaDetalle ?? 0,
        i_Orden: item.i_Orden ?? item.I_Orden ?? item.iOrden ?? 1,
        d_FechaInicio: item.d_FechaInicio ?? item.f_FechaInicio ?? item.FechaInicio ?? null,
        d_FechaFin: item.d_FechaFin ?? item.f_FechaFin ?? item.FechaFin ?? null,
        v_Empresa: item.v_Empresa ?? item.s_RazonSocial ?? item.v_NombreEmpresa ?? "",
        v_Servicio: item.v_Servicio ?? item.s_NombreServicio ?? item.v_NombreServicio ?? "",
        v_TipoServicio: item.v_TipoServicio ?? item.s_TipoServicio ?? "",
        v_Titular: item.v_Titular ?? item.v_NomTitular ?? item.v_NombreTitular ?? "",
        v_Apoyo: item.v_Apoyo ?? item.v_NomApoyo ?? "",
        b_TipoDato: Boolean(item.b_TipoDato ?? item.B_TipoDato),
      }));
    }, []);
  },

  /**
   * Módulo 2.1 — Vista Sesiones
   * Obtiene la lista de sesiones paginada (GET agenda/GetAgenda).
   */
  async getAgenda(params: {
    fechaInicio: string;
    fechaFin?: string;
    pagina: number;
    tamano: number;
    searchTerm?: string;
  }): Promise<PaginadoResponse<AgendaGetDto>> {
    return httpDefensivo(async () => {
      const queryParams: Record<string, unknown> = {
        i_CveRubro: 0,
        i_CveTServicio: 0,
        fechaInicio: params.fechaInicio,
        pagina: params.pagina,
        tamano: params.tamano,
      };

      if (params.fechaFin) {
        queryParams.fechaFin = params.fechaFin;
      }
      if (params.searchTerm && params.searchTerm.trim().length > 0) {
        queryParams.searchTerm = params.searchTerm.trim();
      }

      const resp = await apiClient.get<any>("agenda/GetAgenda", {
        params: queryParams,
      });

      let rawDatos: AgendaGetDto[] = [];
      let total = 0;

      const data = resp.data;
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
        i_CveAgenda: item.i_CveAgenda ?? item.I_CveAgenda ?? item.iCveAgenda ?? 0,
        i_CveServAgendaDet: item.i_CveServAgendaDet ?? item.I_CveServAgendaDet ?? item.iCveServAgendaDet ?? 0,
        i_CveAgendaDetalle: item.i_CveAgendaDetalle ?? item.I_CveAgendaDetalle ?? item.iCveAgendaDetalle ?? 0,
        i_Orden: item.i_Orden ?? item.I_Orden ?? item.iOrden ?? 1,
        d_FechaInicio: item.d_FechaInicio ?? item.f_FechaInicio ?? item.FechaInicio ?? null,
        d_FechaFin: item.d_FechaFin ?? item.f_FechaFin ?? item.FechaFin ?? null,
        v_Empresa: item.v_Empresa ?? item.s_RazonSocial ?? item.v_NombreEmpresa ?? "",
        v_Servicio: item.v_Servicio ?? item.s_NombreServicio ?? item.v_NombreServicio ?? "",
        v_TipoServicio: item.v_TipoServicio ?? item.s_TipoServicio ?? "",
        v_Titular: item.v_Titular ?? item.v_NomTitular ?? item.v_NombreTitular ?? "",
        v_Apoyo: item.v_Apoyo ?? item.v_NomApoyo ?? "",
        v_Total: item.v_Total ?? item.s_Total ?? "",
        b_TipoDato: Boolean(item.b_TipoDato ?? item.B_TipoDato),
        i_CveEstatus: item.i_CveEstatus ?? item.I_CveEstatus ?? item.iCveEstatus ?? 1,
      }));

      if (!total) {
        total = rawDatos[0]?.i_TotalRegistros ?? datosParseados.length;
      }
      const totalPaginas = Math.ceil(total / (params.tamano || 10)) || 1;

      return {
        datos: datosParseados,
        total,
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
   * Obtiene el detalle completo del servicio agendado por i_CveAgenda e i_CveServAgendaDet.
   * Endpoint: GET agenda/GetAgendaDetalle?i_CveAgenda={iCveAgenda}&i_CveServAgendaDet={iCveServAgendaDet}
   */
  async getAgendaDetalle(iCveAgenda: number, iCveServAgendaDet?: number | null): Promise<AgendaDetalleGetDto | null> {
    return httpDefensivo(async () => {
      const queryParams: Record<string, any> = { i_CveAgenda: iCveAgenda };
      if (iCveServAgendaDet) {
        queryParams.i_CveServAgendaDet = iCveServAgendaDet;
      }
      const resp = await apiClient.get<any>("agenda/GetAgendaDetalle", {
        params: queryParams,
      });

      const raw = resp.data;
      if (!raw) return null;

      const data = raw.datos || raw.data || raw;

      const sesiones = data.Sesiones || data.sesiones || data.Detalles || data.detalles || data.Sesion || data.sesion || [];
      const alumnos = data.Alumnos || data.alumnos || [];
      const facturas = data.Facturas || data.facturas || [];
      const entregables = data.Entregables || data.entregables || [];

      return {
        ...data,
        Sesiones: Array.isArray(sesiones) ? sesiones : [],
        Alumnos: Array.isArray(alumnos) ? alumnos : [],
        Facturas: Array.isArray(facturas) ? facturas : [],
        Entregables: Array.isArray(entregables) ? entregables : [],
      };
    }, null);
  },

  /**
   * Guarda las modificaciones del detalle del servicio agendado.
   * Endpoint: PUT agenda/UpdateAgendaDetalle
   */
  async updateAgendaDetalle(payload: AgendaDetalleUpdateDto): Promise<boolean> {
    return httpDefensivo(async () => {
      try {
        const resp = await apiClient.put("agenda/UpdateAgendaDetalle", payload);
        return resp.status >= 200 && resp.status < 300;
      } catch {
        const respPost = await apiClient.post("agenda/UpdateAgendaDetalle", payload);
        return respPost.status >= 200 && respPost.status < 300;
      }
    }, false);
  },

  /**
   * Elimina un alumno inscrito de un servicio agendado.
   * Endpoint: DELETE alumnos/DeleteAlumno/{id} (vía AgendaService)
   */
  async deleteAlumno(id: number): Promise<boolean> {
    return httpDefensivo(async () => {
      try {
        const resp = await apiClient.delete(`alumnos/DeleteAlumno/${id}`);
        return resp.status >= 200 && resp.status < 300;
      } catch {
        const resp = await apiClient.delete(`alumnos/borrar/${id}`);
        return resp.status >= 200 && resp.status < 300;
      }
    }, false);
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

  /**
   * 2.1 Listar instructores
   * Endpoint: GET instructores
   */
  async getInstructores(): Promise<InstructorGetDto[]> {
    return httpDefensivo(async () => {
      const resp = await apiClient.get<any>("instructores");
      const raw = Array.isArray(resp.data) ? resp.data : resp.data?.datos || resp.data?.data || resp.data?.Datos || [];
      return Array.isArray(raw) ? raw : [];
    }, []);
  },

  /**
   * 2.2 Listar proveedores
   * Endpoint: GET proveedores
   */
  async getProveedores(): Promise<ProveedorGetDto[]> {
    return httpDefensivo(async () => {
      const resp = await apiClient.get<any>("proveedores");
      const raw = Array.isArray(resp.data) ? resp.data : resp.data?.datos || resp.data?.data || resp.data?.Datos || [];
      return Array.isArray(raw) ? raw : [];
    }, []);
  },

  /**
   * 2.3 Áreas/Salas de la planta (solo Capacitación)
   * Endpoint: GET areas/0/{idCentro}
   * Nota: Deduplica por i_CveArea
   */
  async getAreas(idCentro: number): Promise<AreaGetDto[]> {
    if (idCentro === undefined || idCentro === null || isNaN(Number(idCentro))) return [];
    return httpDefensivo(async () => {
      const resp = await apiClient.get<any>(`areas/0/${idCentro}`);
      const raw = Array.isArray(resp.data)
        ? resp.data
        : resp.data?.datos || resp.data?.data || resp.data?.Datos || resp.data?.Areas || resp.data?.areas || [];
      if (!Array.isArray(raw)) return [];
      const map = new Map<number | string, AreaGetDto>();
      raw.forEach((item: any, idx: number) => {
        if (!item) return;
        const cve = item.i_CveArea ?? item.iD_Area ?? item.id_area ?? item.i_CveCentro ?? idx + 1;
        const nombre =
          item.v_NombreArea ||
          item.v_Nombre ||
          item.v_Area ||
          item.v_Descripcion ||
          item.nombreArea ||
          item.nombre ||
          item.s_Nombre ||
          `Área ${cve}`;
        if (!map.has(cve)) {
          map.set(cve, {
            i_CveArea: Number(cve) || idx + 1,
            v_NombreArea: nombre,
            v_Nombre: nombre,
            i_CveCentro: item.i_CveCentro || idCentro,
          });
        }
      });
      return Array.from(map.values());
    }, []);
  },

  /**
   * 2.4 Horas ocupadas — instructor
   * Endpoint: GET instructores/horas-ocupadas?i_CveInstructor={id}&fecha={yyyy-MM-dd}
   */
  async getHorasOcupadasInstructor(iCveInstructor: number, fecha: string): Promise<RangoFechaDto[]> {
    if (!iCveInstructor || !fecha) return [];
    return httpDefensivo(async () => {
      const resp = await apiClient.get<any>("instructores/horas-ocupadas", {
        params: { i_CveInstructor: iCveInstructor, fecha },
      });
      const raw = Array.isArray(resp.data) ? resp.data : resp.data?.datos || resp.data?.data || resp.data?.Datos || [];
      return Array.isArray(raw) ? raw : [];
    }, []);
  },

  /**
   * 2.5 Horas ocupadas — proveedor
   * Endpoint: GET proveedores/horas-ocupadas?i_CveProveedor={id}&fecha={yyyy-MM-dd}
   */
  async getHorasOcupadasProveedor(iCveProveedor: number, fecha: string): Promise<RangoFechaDto[]> {
    if (!iCveProveedor || !fecha) return [];
    return httpDefensivo(async () => {
      const resp = await apiClient.get<any>("proveedores/horas-ocupadas", {
        params: { i_CveProveedor: iCveProveedor, fecha },
      });
      const raw = Array.isArray(resp.data) ? resp.data : resp.data?.datos || resp.data?.data || resp.data?.Datos || [];
      return Array.isArray(raw) ? raw : [];
    }, []);
  },

  /**
   * 2.6 Instructores disponibles (filtrado por fecha — Estudios/Productos/Servicios)
   * Endpoint: POST instructores/disponibles
   */
  async getInstructoresDisponibles(rangos: RangoFechaDto[]): Promise<InstructorGetDto[]> {
    return httpDefensivo(async () => {
      const resp = await apiClient.post<any>("instructores/disponibles", rangos);
      const raw = Array.isArray(resp.data) ? resp.data : resp.data?.datos || resp.data?.data || resp.data?.Datos || [];
      return Array.isArray(raw) ? raw : [];
    }, []);
  },

  /**
   * 2.7 Proveedores disponibles (filtrado por fecha)
   * Endpoint: POST proveedores/disponibles
   */
  async getProveedoresDisponibles(rangos: RangoFechaDto[]): Promise<ProveedorGetDto[]> {
    return httpDefensivo(async () => {
      const resp = await apiClient.post<any>("proveedores/disponibles", rangos);
      const raw = Array.isArray(resp.data) ? resp.data : resp.data?.datos || resp.data?.data || resp.data?.Datos || [];
      return Array.isArray(raw) ? raw : [];
    }, []);
  },

  /**
   * Envío final del modal Agendar Servicio (POST agenda)
   * Recibe un array de AgendaInsertDto (un objeto por cada servicio agregado)
   */
  async postAgenda(payload: AgendaInsertDto[]): Promise<boolean> {
    return httpDefensivo(async () => {
      const resp = await apiClient.post("agenda", payload);
      return resp.status >= 200 && resp.status < 300;
    }, false);
  },

  /**
   * 3. Confirmar reprogramación de sesión
   * Prueba endpoints alternativos (agenda/PostReprogramacion, agenda/reprogramar, agenda/Reprogramar)
   */
  async postReprogramacion(payload: ReprogramacionInsertDto): Promise<{ exito: boolean; mensaje?: string }> {
    const endpoints = [
      "agenda/PostReprogramacion",
      "agenda/reprogramar",
      "agenda/Reprogramar",
      "agenda/postReprogramar",
    ];

    let ultimoMensaje = "Ocurrió un error al reprogramar la sesión";

    for (const ep of endpoints) {
      try {
        const resp = await apiClient.post(ep, payload);
        if (resp.status >= 200 && resp.status < 300) {
          if (resp.data && typeof resp.data === "object") {
            if (resp.data.exito === false || resp.data.success === false) {
              ultimoMensaje = resp.data.mensaje || resp.data.message || resp.data.error || ultimoMensaje;
              continue;
            }
          }
          return { exito: true };
        }
      } catch (err: any) {
        const status = err?.response?.status;
        console.warn(`[postReprogramacion] Endpoint '${ep}' falló (Status ${status || "red"}):`, err?.response?.data || err?.message);
        if (err?.response?.data) {
          const data = err.response.data;
          let detailedMsg = "";

          // 1. Extraer errores de validación de ASP.NET Core ValidationProblem (data.errors)
          if (data.errors && typeof data.errors === "object") {
            const fieldErrors: string[] = [];
            Object.entries(data.errors).forEach(([field, msgs]) => {
              if (Array.isArray(msgs)) {
                fieldErrors.push(`${field}: ${msgs.join(", ")}`);
              } else if (typeof msgs === "string") {
                fieldErrors.push(`${field}: ${msgs}`);
              }
            });
            if (fieldErrors.length > 0) {
              detailedMsg = fieldErrors.join(" | ");
            }
          }

          // 2. Fallbacks estándar si no hay data.errors
          if (!detailedMsg) {
            detailedMsg =
              data?.mensaje ||
              data?.message ||
              (data?.title && data.title !== "One or more validation errors occurred." ? data.title : null) ||
              (typeof data === "string" ? data : null);
          }

          if (detailedMsg) ultimoMensaje = detailedMsg;
        }
      }
    }

    return { exito: false, mensaje: ultimoMensaje };
  },
};
