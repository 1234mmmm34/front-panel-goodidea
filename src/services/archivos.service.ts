import { apiClient, httpDefensivo } from "@/lib/api-client";
import {
  ServiciosPendientesArchivoDto,
  ServicioConEntregablesDto,
  SubirArchivoRequestDto,
} from "@/types/archivos";
import { EntregableDetalleDto } from "@/types/servicios";

export const ArchivosService = {
  /**
   * 3.3 Buscar servicios pendientes — Cotización / OC cliente
   * Endpoint: GET archivos/pendientes?v_Tipo={tipo}&v_Busqueda={texto}&i_CveEmpresa={id}&i_CvePlanta={id}
   */
  async getServiciosPendientes(params: {
    v_Tipo: string;
    v_Busqueda?: string;
    i_CveEmpresa?: number;
    i_CvePlanta?: number;
  }): Promise<ServiciosPendientesArchivoDto[]> {
    return httpDefensivo(async () => {
      const queryParams: Record<string, any> = { v_Tipo: params.v_Tipo };
      if (params.v_Busqueda) queryParams.v_Busqueda = params.v_Busqueda;
      if (params.i_CveEmpresa) queryParams.i_CveEmpresa = params.i_CveEmpresa;
      if (params.i_CvePlanta) queryParams.i_CvePlanta = params.i_CvePlanta;

      const resp = await apiClient.get<any>("archivos/pendientes", {
        params: queryParams,
      });

      const raw = Array.isArray(resp.data)
        ? resp.data
        : resp.data?.datos || resp.data?.data || resp.data?.Datos || [];
      return Array.isArray(raw) ? raw : [];
    }, []);
  },

  /**
   * 3.4 Buscar servicios con entregables pendientes
   * Endpoint: GET archivos/entregables-pendientes?v_Busqueda={texto}&i_CveEmpresa={id}&i_CvePlanta={id}
   */
  async getServiciosConEntregablesPendientes(params: {
    v_Busqueda?: string;
    i_CveEmpresa?: number;
    i_CvePlanta?: number;
  }): Promise<ServicioConEntregablesDto[]> {
    return httpDefensivo(async () => {
      const queryParams: Record<string, any> = {};
      if (params.v_Busqueda) queryParams.v_Busqueda = params.v_Busqueda;
      if (params.i_CveEmpresa) queryParams.i_CveEmpresa = params.i_CveEmpresa;
      if (params.i_CvePlanta) queryParams.i_CvePlanta = params.i_CvePlanta;

      const resp = await apiClient.get<any>("archivos/entregables-pendientes", {
        params: queryParams,
      });

      const raw = Array.isArray(resp.data)
        ? resp.data
        : resp.data?.datos || resp.data?.data || resp.data?.Datos || [];
      if (!Array.isArray(raw)) return [];

      return raw.map((item: any) => ({
        ...item,
        entregables: Array.isArray(item.entregables || item.Entregables)
          ? item.entregables || item.Entregables
          : [],
      }));
    }, []);
  },

  /**
   * 3.5 Subir archivo (envío final)
   * Endpoint: POST archivos/subir
   * Content-Type: multipart/form-data
   */
  async subirArchivo(archivo: File, datos: SubirArchivoRequestDto): Promise<boolean> {
    return httpDefensivo(async () => {
      const formData = new FormData();
      formData.append("archivo", archivo, archivo.name);
      formData.append("datos", JSON.stringify(datos));

      const resp = await apiClient.post("archivos/subir", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      return resp.status >= 200 && resp.status < 300;
    }, false);
  },

  /**
   * 3.6 Obtener URL temporal de un archivo
   * Endpoint: GET archivos/ObtenerUrlTemporal?key={key}
   */
  async obtenerUrlTemporal(key: string): Promise<string | null> {
    return httpDefensivo(async () => {
      if (!key) return null;
      const resp = await apiClient.get<string | { url?: string }>("archivos/ObtenerUrlTemporal", {
        params: { key },
      });
      if (typeof resp.data === "string") {
        return resp.data;
      }
      return resp.data?.url ?? null;
    }, null);
  },

  /**
   * Abre un documento con su URL firmada en una pestaña nueva
   */
  async abrirDocumento(key: string | null | undefined): Promise<boolean> {
    if (!key || !key.trim()) {
      console.error("No se pudo abrir el documento: Key no proporcionada");
      return false;
    }
    const url = await this.obtenerUrlTemporal(key.trim());
    if (url && url.trim().length > 0) {
      window.open(url.trim(), "_blank", "noopener,noreferrer");
      return true;
    } else {
      console.error("No se pudo abrir el documento: URL temporal no generada");
      return false;
    }
  },

  /**
   * 3.7 Entregables por servicio
   * Endpoint: GET entregables/porservicio/{i_CveServAgendaDet}
   */
  async getEntregablesPorServicio(iCveServAgendaDet: number): Promise<EntregableDetalleDto[]> {
    return httpDefensivo(async () => {
      const resp = await apiClient.get<any>(`entregables/porservicio/${iCveServAgendaDet}`);
      const raw = Array.isArray(resp.data) ? resp.data : resp.data?.datos || resp.data?.data || [];
      return Array.isArray(raw) ? raw : [];
    }, []);
  },
};

export const VerDocumento = (key: string | null | undefined) => ArchivosService.abrirDocumento(key);
