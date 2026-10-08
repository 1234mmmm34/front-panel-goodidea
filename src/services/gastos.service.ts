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
} from "@/types/gastos";
import { PaginadoResponse } from "@/types/servicios";

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
   * GET facturasProveedor?searchTerm={texto}&fechaInicio={yyyy-MM-dd}&fechaFin={yyyy-MM-dd}&i_CveProveedor={n}&estado={texto}&pagina={n}&tamano={n}
   */
  async getGastos(params: {
    estado?: string;
    fechaInicio?: string | null;
    fechaFin?: string | null;
    searchTerm?: string;
    i_CveProveedor?: number;
    pagina: number;
    tamano: number;
  }): Promise<PaginadoResponse<FacturaProv>> {
    return httpDefensivo(
      async () => {
        const queryParams: Record<string, string | number> = {
          searchTerm: params.searchTerm ?? "",
          i_CveProveedor: params.i_CveProveedor ?? 0,
          estado: params.estado ?? "",
          pagina: params.pagina,
          tamano: params.tamano,
        };

        const inicio = (params.fechaInicio || "").trim();
        const fin = (params.fechaFin || "").trim();

        if (inicio.length > 0) queryParams.fechaInicio = inicio;
        if (fin.length > 0) queryParams.fechaFin = fin;

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
   * GET facturasProveedor/Resumen?searchTerm={texto}&fechaInicio={yyyy-MM-dd}&fechaFin={yyyy-MM-dd}&i_CveProveedor={n}&estado={texto}
   */
  async getGastosResumen(params: {
    estado?: string;
    fechaInicio?: string | null;
    fechaFin?: string | null;
    searchTerm?: string;
    i_CveProveedor?: number;
  }): Promise<FacturasProvResumen> {
    return httpDefensivo(
      async () => {
        const queryParams: Record<string, string | number> = {
          estado: params.estado ?? "Pendientes",
        };

        if (params.searchTerm && params.searchTerm.trim().length > 0) {
          queryParams.searchTerm = params.searchTerm.trim();
        }
        if (params.i_CveProveedor && params.i_CveProveedor > 0) {
          queryParams.i_CveProveedor = params.i_CveProveedor;
        }

        const inicio = (params.fechaInicio || "").trim();
        const fin = (params.fechaFin || "").trim();

        if (inicio.length > 0) queryParams.fechaInicio = inicio;
        if (fin.length > 0) queryParams.fechaFin = fin;

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
