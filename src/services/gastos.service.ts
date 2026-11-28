import { apiClient, httpDefensivo } from "@/lib/api-client";
import {
  FacturaProv,
  FacturasProvResumen,
  FacturaProvLinea,
  AbonoProv,
  ServicioSinFacturaProv,
  CrearFacturaProvDto,
  ResultadoRespuestaApi,
  ResultadoAplicarDescuentoApi,
  GastoOpcionFiltroDto,
  GastoPagosPendientesFiltroDto,
} from "@/types/gastos";
import { AgendaEmpresaFiltroDto, PaginadoResponse } from "@/types/servicios";

interface FiltrosGastosExtra {
  fechaPagoInicio?: string | null;
  fechaPagoFin?: string | null;
  ocs?: string[] | null;
  cotizaciones?: string[] | null;
  conceptos?: string[] | null;
  pagosPendientes?: number[] | null;
}

function agregarFiltrosGastosExtra(
  queryParams: Record<string, string | number>,
  params: FiltrosGastosExtra,
  incluirPagosPendientes: boolean = true
) {
  if (params.fechaPagoInicio && params.fechaPagoInicio.trim().length > 0) {
    queryParams.fechaPagoInicio = params.fechaPagoInicio.trim();
  }
  if (params.fechaPagoFin && params.fechaPagoFin.trim().length > 0) {
    queryParams.fechaPagoFin = params.fechaPagoFin.trim();
  }
  if (Array.isArray(params.ocs)) {
    queryParams.ocs = params.ocs.length > 0 ? params.ocs.join("|") : "~";
  }
  if (Array.isArray(params.cotizaciones)) {
    queryParams.cotizaciones =
      params.cotizaciones.length > 0 ? params.cotizaciones.join("|") : "~";
  }
  if (Array.isArray(params.conceptos)) {
    queryParams.conceptos =
      params.conceptos.length > 0 ? params.conceptos.join("|") : "~";
  }
  if (incluirPagosPendientes && Array.isArray(params.pagosPendientes)) {
    queryParams.pagosPendientes =
      params.pagosPendientes.length > 0 ? params.pagosPendientes.join(",") : "-1";
  }
}

function normalizarListaRespuesta(data: any): any[] {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.datos)) return data.datos;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.Datos)) return data.Datos;
  return [];
}

function extraerMensajeError(error: any, defaultMsg: string): string {
  if (!error?.response?.data) {
    return error?.message || defaultMsg;
  }
  let d = error.response.data;
  if (typeof d === "string") {
    try {
      d = JSON.parse(d);
    } catch {
      // No JSON
    }
  }
  if (typeof d === "string") {
    return d.trim() || defaultMsg;
  }
  if (typeof d === "object" && d !== null) {
    if (d.errors && typeof d.errors === "object") {
      const list = Object.values(d.errors).flat().join("; ");
      if (list) return list;
    }
    return d.error || d.mensaje || d.message || d.v_Mensaje || d.title || defaultMsg;
  }
  return defaultMsg;
}

export const GastosService = {
  /**
   * 1. Listado paginado de gastos
   * GET facturasProveedor?searchTerm={texto}&fechaInicio={yyyy-MM-dd}&fechaFin={yyyy-MM-dd}&proveedores={ids}&ordenProveedor={ASC|DESC}&estado={texto}&pagina={n}&tamano={n}
   */
  async getGastos(params: {
    estado?: string;
    fechaInicio?: string | null;
    fechaFin?: string | null;
    fechaPagoInicio?: string | null;
    fechaPagoFin?: string | null;
    searchTerm?: string;
    proveedores?: number[] | null;
    ocs?: string[] | null;
    cotizaciones?: string[] | null;
    conceptos?: string[] | null;
    pagosPendientes?: number[] | null;
    ordenProveedor?: "ASC" | "DESC" | null;
    pagina: number;
    tamano: number;
  }): Promise<PaginadoResponse<FacturaProv>> {
    return httpDefensivo(
      async () => {
        const queryParams: Record<string, string | number> = {
          searchTerm: params.searchTerm ?? "",
          estado: params.estado ?? "",
          pagina: params.pagina,
          tamano: params.tamano,
        };

        const inicio = (params.fechaInicio || "").trim();
        const fin = (params.fechaFin || "").trim();

        if (inicio.length > 0) queryParams.fechaInicio = inicio;
        if (fin.length > 0) queryParams.fechaFin = fin;

        if (Array.isArray(params.proveedores)) {
          queryParams.proveedores =
            params.proveedores.length > 0 ? params.proveedores.join(",") : "0";
        }
        if (params.ordenProveedor) {
          queryParams.ordenProveedor = params.ordenProveedor;
        }
        agregarFiltrosGastosExtra(queryParams, params);

        const resp = await apiClient.get<any>("facturasProveedor", { params: queryParams });
        let rawDatos: FacturaProv[] = [];
        const data = resp.data;

        if (Array.isArray(data)) {
          rawDatos = data;
        } else if (data && typeof data === "object") {
          if (Array.isArray(data.datos)) rawDatos = data.datos;
          else if (Array.isArray(data.data)) rawDatos = data.data;
          else if (Array.isArray(data.Datos)) rawDatos = data.Datos;
        }

        if (rawDatos.length === 0) {
          return {
            datos: [],
            total: 0,
            pagina: params.pagina,
            tamano: params.tamano,
            totalPaginas: 1,
          };
        }

        const primerElem = rawDatos[0] as any;
        const totalRegistros =
          primerElem?.total ??
          primerElem?.Total ??
          primerElem?.i_TotalRegistros ??
          rawDatos.length;

        const totalPaginas = Math.ceil(totalRegistros / (params.tamano || 10)) || 1;

        return {
          datos: rawDatos,
          total: totalRegistros,
          pagina: params.pagina,
          tamano: params.tamano,
          totalPaginas,
        };
      },
      {
        datos: [],
        total: 0,
        pagina: params.pagina,
        tamano: params.tamano,
        totalPaginas: 1,
      }
    );
  },

  /**
   * 2. Tarjetas de resumen
   * GET facturasProveedor/Resumen?searchTerm={texto}&fechaInicio={yyyy-MM-dd}&fechaFin={yyyy-MM-dd}&proveedores={ids}&estado={texto}
   */
  async getGastosResumen(params: {
    estado?: string;
    fechaInicio?: string | null;
    fechaFin?: string | null;
    fechaPagoInicio?: string | null;
    fechaPagoFin?: string | null;
    searchTerm?: string;
    proveedores?: number[] | null;
    ocs?: string[] | null;
    cotizaciones?: string[] | null;
    conceptos?: string[] | null;
    pagosPendientes?: number[] | null;
  }): Promise<FacturasProvResumen> {
    return httpDefensivo(
      async () => {
        const queryParams: Record<string, string | number> = {
          estado: params.estado ?? "Pendientes",
        };

        if (params.searchTerm && params.searchTerm.trim().length > 0) {
          queryParams.searchTerm = params.searchTerm.trim();
        }

        const inicio = (params.fechaInicio || "").trim();
        const fin = (params.fechaFin || "").trim();

        if (inicio.length > 0) queryParams.fechaInicio = inicio;
        if (fin.length > 0) queryParams.fechaFin = fin;

        if (Array.isArray(params.proveedores)) {
          queryParams.proveedores =
            params.proveedores.length > 0 ? params.proveedores.join(",") : "0";
        }
        agregarFiltrosGastosExtra(queryParams, params);

        const resp = await apiClient.get<any>("facturasProveedor/Resumen", {
          params: queryParams,
        });
        const data = resp.data;

        return {
          d_TotalPagado: Number(data?.d_TotalPagado ?? data?.TotalPagado ?? 0),
          d_TotalPendiente: Number(data?.d_TotalPendiente ?? data?.TotalPendiente ?? 0),
          d_TotalFacturado: Number(data?.d_TotalFacturado ?? data?.TotalFacturado ?? 0),
          i_TotalFacturas: Number(data?.i_TotalFacturas ?? data?.TotalFacturas ?? 0),
        };
      },
      {
        d_TotalPagado: 0,
        d_TotalPendiente: 0,
        d_TotalFacturado: 0,
        i_TotalFacturas: 0,
      }
    );
  },

  /**
   * 2.1 Catálogo de proveedores para filtro de columna (Checklist)
   * GET facturasProveedor/GetProveedoresFiltro?searchTerm={texto}&fechaInicio={yyyy-MM-dd}&fechaFin={yyyy-MM-dd}&estado={texto}
   */
  async getProveedoresFiltro(params: {
    searchTerm?: string;
    fechaInicio?: string | null;
    fechaFin?: string | null;
    fechaPagoInicio?: string | null;
    fechaPagoFin?: string | null;
    estado?: string;
    ocs?: string[] | null;
    cotizaciones?: string[] | null;
    conceptos?: string[] | null;
    pagosPendientes?: number[] | null;
  }): Promise<AgendaEmpresaFiltroDto[]> {
    try {
      const queryParams: Record<string, string | number> = {};
      if (params.searchTerm && params.searchTerm.trim().length > 0) {
        queryParams.searchTerm = params.searchTerm.trim();
      }
      if (params.fechaInicio && params.fechaInicio.trim().length > 0) {
        queryParams.fechaInicio = params.fechaInicio.trim();
      }
      if (params.fechaFin && params.fechaFin.trim().length > 0) {
        queryParams.fechaFin = params.fechaFin.trim();
      }
      if (params.estado && params.estado.trim().length > 0) {
        queryParams.estado = params.estado.trim();
      }
      agregarFiltrosGastosExtra(queryParams, params);

      const resp = await apiClient.get<any>("facturasProveedor/GetProveedoresFiltro", {
        params: queryParams,
      });
      const raw = normalizarListaRespuesta(resp.data);

      return raw.map((item: any) => ({
        i_CveEmpresa: Number(
          item.i_CveEmpresa ?? item.i_CveProveedor ?? item.iCveProveedor ?? item.iCveEmpresa ?? 0
        ),
        v_Empresa:
          item.v_Empresa ?? item.v_Proveedor ?? item.vProveedor ?? item.vEmpresa ?? "",
      }));
    } catch {
      return [];
    }
  },

  /**
   * 2.2 Opciones de OC, Cotización o Concepto para filtro de columna (Checklist)
   * GET facturasProveedor/GetOpcionesFiltro?campo={OC|COT|CONCEPTO}
   */
  async getOpcionesFiltro(
    campo: "OC" | "COT" | "CONCEPTO",
    filtros: {
      searchTerm?: string;
      fechaInicio?: string | null;
      fechaFin?: string | null;
      fechaPagoInicio?: string | null;
      fechaPagoFin?: string | null;
      estado?: string;
      proveedores?: number[] | null;
      ocs?: string[] | null;
      cotizaciones?: string[] | null;
      conceptos?: string[] | null;
      pagosPendientes?: number[] | null;
    }
  ): Promise<GastoOpcionFiltroDto[]> {
    try {
      const queryParams: Record<string, string | number> = { campo };
      if (filtros.searchTerm && filtros.searchTerm.trim().length > 0) {
        queryParams.searchTerm = filtros.searchTerm.trim();
      }
      if (filtros.fechaInicio && filtros.fechaInicio.trim().length > 0) {
        queryParams.fechaInicio = filtros.fechaInicio.trim();
      }
      if (filtros.fechaFin && filtros.fechaFin.trim().length > 0) {
        queryParams.fechaFin = filtros.fechaFin.trim();
      }
      if (filtros.estado && filtros.estado.trim().length > 0) {
        queryParams.estado = filtros.estado.trim();
      }
      if (Array.isArray(filtros.proveedores)) {
        queryParams.proveedores =
          filtros.proveedores.length > 0 ? filtros.proveedores.join(",") : "0";
      }
      agregarFiltrosGastosExtra(queryParams, filtros);

      const resp = await apiClient.get<any>("facturasProveedor/GetOpcionesFiltro", {
        params: queryParams,
      });
      const raw = normalizarListaRespuesta(resp.data);

      return raw.map((item: any) => ({
        v_Valor: item.v_Valor ?? item.vValor ?? null,
      }));
    } catch {
      return [];
    }
  },

  /**
   * 2.3 Opciones de pagos pendientes para filtro de columna (Checklist)
   * GET facturasProveedor/GetPagosPendientesFiltro
   */
  async getPagosPendientesFiltro(filtros: {
    searchTerm?: string;
    fechaInicio?: string | null;
    fechaFin?: string | null;
    fechaPagoInicio?: string | null;
    fechaPagoFin?: string | null;
    estado?: string;
    proveedores?: number[] | null;
    ocs?: string[] | null;
    cotizaciones?: string[] | null;
    conceptos?: string[] | null;
  }): Promise<GastoPagosPendientesFiltroDto[]> {
    try {
      const queryParams: Record<string, string | number> = {};
      if (filtros.searchTerm && filtros.searchTerm.trim().length > 0) {
        queryParams.searchTerm = filtros.searchTerm.trim();
      }
      if (filtros.fechaInicio && filtros.fechaInicio.trim().length > 0) {
        queryParams.fechaInicio = filtros.fechaInicio.trim();
      }
      if (filtros.fechaFin && filtros.fechaFin.trim().length > 0) {
        queryParams.fechaFin = filtros.fechaFin.trim();
      }
      if (filtros.estado && filtros.estado.trim().length > 0) {
        queryParams.estado = filtros.estado.trim();
      }
      if (Array.isArray(filtros.proveedores)) {
        queryParams.proveedores =
          filtros.proveedores.length > 0 ? filtros.proveedores.join(",") : "0";
      }
      agregarFiltrosGastosExtra(queryParams, filtros, false);

      const resp = await apiClient.get<any>("facturasProveedor/GetPagosPendientesFiltro", {
        params: queryParams,
      });
      const raw = normalizarListaRespuesta(resp.data);

      return raw.map((item: any) => ({
        i_PagosPendientes: Number(item.i_PagosPendientes ?? item.iPagosPendientes ?? 0),
      }));
    } catch {
      return [];
    }
  },

  /**
   * 3. Desglose de servicios de un gasto
   * GET facturasProveedor/GetDetalle?i_CveFacturaProv={id}
   */
  async getGastoDetalle(iCveFacturaProv: number): Promise<FacturaProvLinea[]> {
    return httpDefensivo(async () => {
      const resp = await apiClient.get<any>("facturasProveedor/GetDetalle", {
        params: { i_CveFacturaProv: iCveFacturaProv },
      });
      const data = resp.data;
      const raw = Array.isArray(data)
        ? data
        : data?.datos || data?.data || data?.lineas || [];
      return Array.isArray(raw) ? raw : [];
    }, []);
  },

  /**
   * 4. Historial de abonos
   * GET facturasProveedor/GetAbonos?i_CveFacturaProv={id}
   */
  async getAbonosPorGasto(iCveFacturaProv: number): Promise<AbonoProv[]> {
    return httpDefensivo(async () => {
      const resp = await apiClient.get<any>("facturasProveedor/GetAbonos", {
        params: { i_CveFacturaProv: iCveFacturaProv },
      });
      const data = resp.data;
      const raw = Array.isArray(data)
        ? data
        : data?.datos || data?.data || [];
      return Array.isArray(raw) ? raw : [];
    }, []);
  },

  /**
   * 5. Servicios del proveedor aún sin registrar
   * GET facturasProveedor/GetServiciosSinFactura?i_CveProveedor={id}&v_Busqueda={texto}
   */
  async getServiciosSinFactura(
    iCveProveedor: number = 0,
    vBusqueda: string = ""
  ): Promise<ServicioSinFacturaProv[]> {
    return httpDefensivo(async () => {
      const resp = await apiClient.get<any>("facturasProveedor/GetServiciosSinFactura", {
        params: { i_CveProveedor: iCveProveedor, v_Busqueda: vBusqueda },
      });
      const data = resp.data;
      const raw = Array.isArray(data)
        ? data
        : data?.datos || data?.data || [];
      return Array.isArray(raw) ? raw : [];
    }, []);
  },

  /**
   * 6. Crear gasto
   * POST facturasProveedor/Crear
   */
  async crearGasto(payload: CrearFacturaProvDto): Promise<ResultadoRespuestaApi> {
    try {
      const resp = await apiClient.post("facturasProveedor/Crear", payload);
      if (resp.status >= 200 && resp.status < 300) {
        if (resp.data && typeof resp.data === "object" && (resp.data.exito === false || resp.data.b_Exito === false)) {
          return {
            exito: false,
            mensaje: resp.data.mensaje || resp.data.error || resp.data.v_Mensaje || "Error al crear el gasto",
          };
        }
        return { exito: true };
      }
      return {
        exito: false,
        mensaje: resp.data?.error || resp.data?.mensaje || "Error al crear el gasto",
      };
    } catch (error: any) {
      const msg = extraerMensajeError(error, "No se pudo registrar el gasto");
      return { exito: false, mensaje: msg };
    }
  },

  /**
   * 7. Editar fecha / descripción
   * POST facturasProveedor/Actualizar
   */
  async actualizarGasto(payload: {
    i_CveFacturaProv: number;
    v_NoFactura?: string | null;
    d_FechaHora: string;
    v_Descripcion?: string | null;
  }): Promise<ResultadoRespuestaApi> {
    try {
      const body = {
        i_CveFacturaProv: payload.i_CveFacturaProv,
        v_NoFactura: null,
        d_FechaHora: payload.d_FechaHora,
        v_Descripcion: payload.v_Descripcion ?? null,
      };
      const resp = await apiClient.post("facturasProveedor/Actualizar", body);
      if (resp.status >= 200 && resp.status < 300) {
        return { exito: true };
      }
      return {
        exito: false,
        mensaje: resp.data?.error || resp.data?.mensaje || "Error al actualizar el gasto",
      };
    } catch (error: any) {
      const msg = extraerMensajeError(error, "No se pudo actualizar el gasto");
      return { exito: false, mensaje: msg };
    }
  },

  /**
   * 8. Programar abono
   * POST facturasProveedor/AgregarAbono
   */
  async agregarAbono(payload: {
    i_CveFacturaProv: number;
    d_Monto: number;
    d_FechaProgramada: string;
  }): Promise<ResultadoRespuestaApi> {
    try {
      const resp = await apiClient.post("facturasProveedor/AgregarAbono", payload);
      if (resp.status >= 200 && resp.status < 300) {
        if (resp.data && typeof resp.data === "object" && (resp.data.exito === false || resp.data.b_Exito === false)) {
          return {
            exito: false,
            mensaje: resp.data.mensaje || resp.data.error || resp.data.v_Mensaje || "Error al agregar el abono",
          };
        }
        return { exito: true };
      }
      return {
        exito: false,
        mensaje: resp.data?.error || resp.data?.mensaje || "Error al agregar el abono",
      };
    } catch (error: any) {
      const msg = extraerMensajeError(error, "No se pudo registrar el abono");
      return { exito: false, mensaje: msg };
    }
  },

  /**
   * 9. Marcar abono pagado
   * POST facturasProveedor/MarcarAbonoPagado
   */
  async marcarAbonoPagado(payload: {
    i_CveAbonoProv: number;
    d_FechaAbono: string;
    v_Referencia?: string | null;
  }): Promise<ResultadoRespuestaApi> {
    try {
      const resp = await apiClient.post("facturasProveedor/MarcarAbonoPagado", {
        i_CveAbonoProv: payload.i_CveAbonoProv,
        d_FechaAbono: payload.d_FechaAbono,
        v_Referencia: payload.v_Referencia ?? "",
      });
      if (resp.status >= 200 && resp.status < 300) {
        if (resp.data && typeof resp.data === "object" && (resp.data.exito === false || resp.data.b_Exito === false)) {
          return {
            exito: false,
            mensaje: resp.data.mensaje || resp.data.error || resp.data.v_Mensaje || "Error al marcar el abono como pagado",
          };
        }
        return { exito: true };
      }
      return {
        exito: false,
        mensaje: resp.data?.error || resp.data?.mensaje || "Error al marcar el abono como pagado",
      };
    } catch (error: any) {
      const msg = extraerMensajeError(error, "No se pudo marcar el abono como pagado");
      return { exito: false, mensaje: msg };
    }
  },

  /**
   * 10. Cancelar abono
   * POST facturasProveedor/CancelarAbono
   */
  async cancelarAbono(payload: {
    i_CveAbonoProv: number;
    v_MotivoCancelacion: string;
  }): Promise<ResultadoRespuestaApi> {
    try {
      const resp = await apiClient.post("facturasProveedor/CancelarAbono", payload);
      if (resp.status >= 200 && resp.status < 300) {
        return { exito: true };
      }
      return {
        exito: false,
        mensaje: resp.data?.error || resp.data?.mensaje || "Error al cancelar el abono",
      };
    } catch (error: any) {
      const msg = extraerMensajeError(error, "No se pudo cancelar el abono");
      return { exito: false, mensaje: msg };
    }
  },

  /**
   * 11. Cancelar gasto
   * POST facturasProveedor/Cancelar
   */
  async cancelarGasto(payload: {
    i_CveFacturaProv: number;
    v_MotivoCancelacion: string;
  }): Promise<ResultadoRespuestaApi> {
    try {
      const resp = await apiClient.post("facturasProveedor/Cancelar", payload);
      if (resp.status >= 200 && resp.status < 300) {
        if (resp.data && typeof resp.data === "object" && (resp.data.exito === false || resp.data.b_Exito === false)) {
          return {
            exito: false,
            mensaje: resp.data.mensaje || resp.data.error || resp.data.v_Mensaje || "Error al cancelar el gasto",
          };
        }
        return { exito: true };
      }
      return {
        exito: false,
        mensaje: resp.data?.error || resp.data?.mensaje || "Error al cancelar el gasto",
      };
    } catch (error: any) {
      const msg = extraerMensajeError(error, "No se pudo cancelar el gasto");
      return { exito: false, mensaje: msg };
    }
  },

  /**
   * 12. Aplicar descuento a gasto
   * POST facturasProveedor/AplicarDescuento
   */
  async aplicarDescuento(payload: {
    i_CveFacturaProv: number;
    d_PorcentajeDescuento: number;
  }): Promise<ResultadoAplicarDescuentoApi> {
    try {
      const resp = await apiClient.post("facturasProveedor/AplicarDescuento", payload);
      if (resp.status >= 200 && resp.status < 300) {
        if (resp.data && typeof resp.data === "object" && (resp.data.exito === false || resp.data.b_Exito === false)) {
          return {
            exito: false,
            mensaje: resp.data.mensaje || resp.data.error || resp.data.v_Mensaje || "Error al aplicar el descuento",
          };
        }

        const dataObj = resp.data?.datos || resp.data?.data || resp.data;
        const datosExtraidos =
          dataObj && typeof dataObj === "object" && dataObj.i_CveFacturaProv !== undefined
            ? {
                i_CveFacturaProv: Number(dataObj.i_CveFacturaProv),
                d_PorcentajeDescuento: Number(dataObj.d_PorcentajeDescuento ?? payload.d_PorcentajeDescuento),
                d_Monto: Number(dataObj.d_Monto ?? 0),
                d_SaldoPendiente: Number(dataObj.d_SaldoPendiente ?? 0),
                v_EstadoPago: String(dataObj.v_EstadoPago ?? "Sin pagar"),
              }
            : undefined;

        return { exito: true, datos: datosExtraidos };
      }
      return {
        exito: false,
        mensaje: resp.data?.error || resp.data?.mensaje || "Error al aplicar el descuento",
      };
    } catch (error: any) {
      const msg = extraerMensajeError(error, "No se pudo aplicar el descuento");
      return { exito: false, mensaje: msg };
    }
  },
};
