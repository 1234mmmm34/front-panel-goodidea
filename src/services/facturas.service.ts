import { apiClient, httpDefensivo } from "@/lib/api-client";
import {
  FacturaGetDto,
  FacturaDetalleDto,
  LineaServicioFacturaDto,
  AbonoFacturaDto,
  ServicioSinFacturaDto,
  FacturaSinTimbrarDto,
  PagoPendienteMasivoDto,
  ResultadoRespuestaApi,
} from "@/types/facturas";
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
      // Si no es JSON válido, se conserva como string
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

export const FacturasService = {
  /**
   * 1. Listar facturas (tabla principal)
   * GET facturas?searchTerm={texto}&empresa={texto}&estado={texto}&pagina={n}&tamano={n}&fechaInicio={yyyy-MM-dd}
   * Nota: searchTerm, empresa y estado SIEMPRE van en la URL (incluso si estan vacíos). fechaInicio solo si tiene valor.
   */
  async getFacturas(params: {
    estado?: string;
    fechaPago?: string | null;
    searchTerm?: string;
    empresa?: string;
    pagina: number;
    tamano: number;
  }): Promise<PaginadoResponse<FacturaGetDto>> {
    return httpDefensivo(async () => {
      const queryParams: Record<string, string | number> = {
        searchTerm: params.searchTerm ?? "",
        empresa: params.empresa ?? "",
        estado: params.estado ?? "",
        pagina: params.pagina,
        tamano: params.tamano,
      };

      if (params.fechaPago && params.fechaPago.trim().length > 0) {
        queryParams.fechaInicio = params.fechaPago.trim();
      }

      const resp = await apiClient.get<any>("facturas", { params: queryParams });

      let rawDatos: FacturaGetDto[] = [];
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

      const primerElemento = rawDatos[0] as any;
      const totalRegistros =
        primerElemento?.total ??
        primerElemento?.Total ??
        primerElemento?.i_TotalRegistros ??
        rawDatos.length;

      const totalPaginas = Math.ceil(totalRegistros / (params.tamano || 10)) || 1;

      return {
        datos: rawDatos,
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

  // --- 2. Endpoints para los 4 modales ---

  /**
   * GET facturas/GetFacturaDetalle?i_CveFactura={id}
   * Regresa un array plano de líneas de servicio (LineaServicioFacturaDto[])
   */
  async getFacturaDetalle(iCveFactura: number): Promise<LineaServicioFacturaDto[]> {
    return httpDefensivo(async () => {
      const resp = await apiClient.get<any>("facturas/GetFacturaDetalle", {
        params: { i_CveFactura: iCveFactura },
      });
      const data = resp.data;
      const raw = Array.isArray(data)
        ? data
        : data?.datos || data?.data || data?.lineas || [];
      return Array.isArray(raw) ? raw : [];
    }, []);
  },

  /**
   * GET facturas/GetAbonosPorFactura?i_CveFactura={id}
   */
  async getAbonosPorFactura(iCveFactura: number): Promise<AbonoFacturaDto[]> {
    return httpDefensivo(async () => {
      const resp = await apiClient.get<any>("facturas/GetAbonosPorFactura", {
        params: { i_CveFactura: iCveFactura },
      });
      const raw = Array.isArray(resp.data)
        ? resp.data
        : resp.data?.datos || resp.data?.data || [];
      return Array.isArray(raw) ? raw : [];
    }, []);
  },

  /**
   * POST facturas/ActualizarFactura
   */
  async actualizarFactura(payload: any): Promise<boolean> {
    return httpDefensivo(async () => {
      const resp = await apiClient.post("facturas/ActualizarFactura", payload);
      return resp.status >= 200 && resp.status < 300;
    }, false);
  },

  /**
   * GET facturas/GetFacturasSinTimbrar?i_CveEmpresa={id}
   */
  async getFacturasSinTimbrar(iCveEmpresa: number): Promise<FacturaSinTimbrarDto[]> {
    return httpDefensivo(async () => {
      const resp = await apiClient.get<any>("facturas/GetFacturasSinTimbrar", {
        params: { i_CveEmpresa: iCveEmpresa },
      });
      const raw = Array.isArray(resp.data)
        ? resp.data
        : resp.data?.datos || resp.data?.data || [];
      return Array.isArray(raw) ? raw : [];
    }, []);
  },

  /**
   * POST facturas/AgregarServicioAFactura
   */
  async agregarServicioAFactura(payload: any): Promise<boolean> {
    return httpDefensivo(async () => {
      const resp = await apiClient.post("facturas/AgregarServicioAFactura", payload);
      return resp.status >= 200 && resp.status < 300;
    }, false);
  },

  /**
   * GET facturas/GetServiciosSinFactura?i_CveEmpresa={id}&v_Busqueda={texto}
   */
  async getServiciosSinFactura(
    iCveEmpresa: number,
    vBusqueda: string = ""
  ): Promise<ServicioSinFacturaDto[]> {
    return httpDefensivo(async () => {
      const resp = await apiClient.get<any>("facturas/GetServiciosSinFactura", {
        params: { i_CveEmpresa: iCveEmpresa, v_Busqueda: vBusqueda },
      });
      const raw = Array.isArray(resp.data)
        ? resp.data
        : resp.data?.datos || resp.data?.data || [];
      return Array.isArray(raw) ? raw : [];
    }, []);
  },

  /**
   * POST facturas/CrearVentaFacturas
   */
  async crearVentaFacturas(payload: any): Promise<ResultadoRespuestaApi> {
    try {
      const resp = await apiClient.post("facturas/CrearVentaFacturas", payload);
      if (resp.status >= 200 && resp.status < 300) {
        return { exito: true };
      }
      return {
        exito: false,
        mensaje: resp.data?.error || resp.data?.mensaje || "Error al crear la venta",
      };
    } catch (error: any) {
      const msg =
        error.response?.data?.error ||
        error.response?.data?.mensaje ||
        error.response?.data?.message ||
        "Error al comunicarse con el servidor";
      return { exito: false, mensaje: msg };
    }
  },

  /**
   * POST facturas/CancelarFactura
   * Extrae el mensaje real de error del backend en caso de fallo ({ error: "..." }).
   */
  async cancelarFactura(payload: {
    i_CveFacturas: number;
    v_MotivoCancelacion: string;
  }): Promise<ResultadoRespuestaApi> {
    try {
      const body = {
        i_CveFacturas: Number(payload.i_CveFacturas),
        v_MotivoCancelacion: payload.v_MotivoCancelacion,
      };
      const resp = await apiClient.post("facturas/CancelarFactura", body);
      if (resp.status >= 200 && resp.status < 300) {
        if (resp.data && typeof resp.data === "object" && (resp.data.exito === false || resp.data.b_Exito === false)) {
          return {
            exito: false,
            mensaje: resp.data.mensaje || resp.data.error || resp.data.v_Mensaje || "Error al cancelar la factura",
          };
        }
        return { exito: true };
      }
      return {
        exito: false,
        mensaje: resp.data?.error || resp.data?.mensaje || "Error al cancelar la factura",
      };
    } catch (error: any) {
      console.error(
        "[FacturasService.cancelarFactura API ERROR]:",
        error.response?.status,
        error.response?.data || error.message
      );
      const msg = extraerMensajeError(error, "No se pudo cancelar la factura");
      return { exito: false, mensaje: msg };
    }
  },

  /**
   * GET facturas/PagosPendientesMasivo
   */
  async getPagosPendientesMasivo(): Promise<PagoPendienteMasivoDto[]> {
    return httpDefensivo(async () => {
      const resp = await apiClient.get<any>("facturas/PagosPendientesMasivo");
      const raw = Array.isArray(resp.data) ? resp.data : resp.data?.datos || resp.data?.data || [];
      return Array.isArray(raw) ? raw : [];
    }, []);
  },

  /**
   * POST facturas/MarcarAbonoPagado
   * Body: { i_CveAbono, d_FechaAbono, v_Referencia }
   */
  async marcarAbonoPagado(
    iCveAbono: number,
    fechaPago: string,
    notas: string | null = null
  ): Promise<ResultadoRespuestaApi> {
    try {
      const payload = {
        i_CveAbono: Number(iCveAbono),
        d_FechaAbono: fechaPago,
        v_Referencia: notas ?? "",
      };
      const resp = await apiClient.post("facturas/MarcarAbonoPagado", payload);
      if (resp.status >= 200 && resp.status < 300) {
        if (resp.data && typeof resp.data === "object" && (resp.data.exito === false || resp.data.b_Exito === false)) {
          return {
            exito: false,
            mensaje: resp.data.mensaje || resp.data.error || resp.data.v_Mensaje || "Error al marcar abono como pagado",
          };
        }
        return { exito: true };
      }
      return {
        exito: false,
        mensaje: resp.data?.error || resp.data?.mensaje || "Error al marcar abono como pagado",
      };
    } catch (error: any) {
      console.error(
        "[FacturasService.marcarAbonoPagado API ERROR]:",
        error.response?.status,
        error.response?.data || error.message
      );
      const msg = extraerMensajeError(error, "No se pudo marcar el abono");
      return { exito: false, mensaje: msg };
    }
  },

  /**
   * POST facturas/AgregarAbono
   * Body: { i_CveFactura, d_Monto, d_FechaProgramada }
   */
  async agregarAbono(payload: {
    i_CveFactura: number;
    d_Monto: number;
    d_FechaProgramada: string;
  }): Promise<ResultadoRespuestaApi> {
    try {
      const resp = await apiClient.post("facturas/AgregarAbono", payload);
      if (resp.status >= 200 && resp.status < 300) {
        return { exito: true };
      }
      return {
        exito: false,
        mensaje: resp.data?.error || resp.data?.mensaje || "Error al agregar el abono",
      };
    } catch (error: any) {
      const msg =
        error.response?.data?.error ||
        error.response?.data?.mensaje ||
        error.response?.data?.message ||
        "No se pudo registrar el abono";
      return { exito: false, mensaje: msg };
    }
  },

  /**
   * POST facturas/CancelarAbono
   * Body: { i_CveAbono, v_MotivoCancelacion }
   */
  async cancelarAbono(
    iCveAbono: number,
    motivo: string
  ): Promise<ResultadoRespuestaApi> {
    try {
      const payload = {
        i_CveAbono: iCveAbono,
        v_MotivoCancelacion: motivo,
      };
      const resp = await apiClient.post("facturas/CancelarAbono", payload);
      if (resp.status >= 200 && resp.status < 300) {
        return { exito: true };
      }
      return {
        exito: false,
        mensaje: resp.data?.error || resp.data?.mensaje || "Error al cancelar el abono",
      };
    } catch (error: any) {
      const msg =
        error.response?.data?.error ||
        error.response?.data?.mensaje ||
        error.response?.data?.message ||
        "No se pudo cancelar el abono";
      return { exito: false, mensaje: msg };
    }
  },
};
