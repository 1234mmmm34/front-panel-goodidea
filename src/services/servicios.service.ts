import { apiClient, httpDefensivo } from "@/lib/api-client";
import {
  PaginadoResponse,
  PlantillaLicenciaInfoDto,
  ServiciosDrpDto,
  ServiciosDropdownDto,
  ServiciosPostDto,
} from "@/types/servicios";

export interface ResultadoEliminacionServicio {
  exito: boolean;
  mensaje?: string;
  statusCode?: number;
}

export const ServiciosService = {
  /**
   * Módulo 3 — Catálogo de Servicios
   * Obtiene la lista paginada del catálogo de servicios.
   */
  async getAll(params: {
    i_CveRubro?: number;
    i_CveTServicio?: number;
    pagina: number;
    tamano: number;
    searchTerm?: string;
  }): Promise<PaginadoResponse<ServiciosDrpDto>> {
    return httpDefensivo(async () => {
      const resp = await apiClient.get<PaginadoResponse<ServiciosDrpDto>>("servicios/GetAll", {
        params: {
          i_CveRubro: params.i_CveRubro ?? 0,
          i_CveTServicio: params.i_CveTServicio ?? 0,
          pagina: params.pagina,
          tamano: params.tamano,
          searchTerm: params.searchTerm || undefined,
        },
      });
      return resp.data;
    }, {
      datos: [],
      total: 0,
      pagina: params.pagina,
      tamano: params.tamano,
      totalPaginas: 1,
    });
  },

  /**
   * Obtiene el detalle completo de un servicio por ID.
   */
  async getById(id: number): Promise<ServiciosDropdownDto | null> {
    return httpDefensivo(async () => {
      const resp = await apiClient.get<ServiciosDropdownDto>(`servicios/${id}`);
      return resp.data;
    }, null);
  },

  /**
   * Crea un nuevo servicio en el catálogo.
   */
  async crear(dto: ServiciosPostDto): Promise<boolean> {
    return httpDefensivo(async () => {
      const resp = await apiClient.post("servicios", dto);
      return resp.status >= 200 && resp.status < 300;
    }, false);
  },

  /**
   * Edita un servicio existente. Nota: El backend expone POST servicios/editar.
   */
  async editar(dto: ServiciosPostDto): Promise<boolean> {
    return httpDefensivo(async () => {
      const resp = await apiClient.post("servicios/editar", dto);
      return resp.status >= 200 && resp.status < 300;
    }, false);
  },

  /**
   * Elimina un servicio por ID. Maneja de forma explícita el error 409 Conflict si está en uso.
   */
  async eliminar(id: number): Promise<ResultadoEliminacionServicio> {
    try {
      const resp = await apiClient.delete(`servicios/${id}`);
      if (resp.status >= 200 && resp.status < 300) {
        return { exito: true };
      }
      return { exito: false, mensaje: "No se pudo eliminar el servicio." };
    } catch (error: any) {
      if (error.response?.status === 409) {
        const mensajeBackend = error.response.data?.message || "El servicio no se puede eliminar porque ya está en uso.";
        return { exito: false, mensaje: mensajeBackend, statusCode: 409 };
      }
      return {
        exito: false,
        mensaje: error.response?.data?.message || "Ocurrió un error al intentar eliminar el servicio.",
        statusCode: error.response?.status,
      };
    }
  },

  /**
   * Obtiene lista desplegable de servicios para selects.
   */
  async getDropdown(): Promise<ServiciosDropdownDto[]> {
    return httpDefensivo(async () => {
      const resp = await apiClient.get<ServiciosDropdownDto[]>("servicios/GetDropdown");
      return resp.data || [];
    }, []);
  },

  /**
   * Obtiene la información de la plantilla general de licencia del curso.
   * GET servicios/{i_CveServicio}/plantilla-licencia
   */
  async getPlantillaLicencia(i_CveServicio: number): Promise<PlantillaLicenciaInfoDto | null> {
    return httpDefensivo(async () => {
      const resp = await apiClient.get<{ plantilla: PlantillaLicenciaInfoDto | null }>(
        `servicios/${i_CveServicio}/plantilla-licencia`
      );
      return resp.data?.plantilla ?? null;
    }, null);
  },

  /**
   * Sube o reemplaza la plantilla general de licencia (.pptx, máx. 20 MB).
   * POST servicios/{i_CveServicio}/plantilla-licencia
   */
  async subirPlantillaLicencia(
    i_CveServicio: number,
    archivo: File
  ): Promise<{ exito: boolean; plantilla?: PlantillaLicenciaInfoDto; mensaje?: string }> {
    try {
      const formData = new FormData();
      formData.append("archivo", archivo);
      const resp = await apiClient.post<PlantillaLicenciaInfoDto>(
        `servicios/${i_CveServicio}/plantilla-licencia`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      return { exito: true, plantilla: resp.data };
    } catch (err: any) {
      const data = err?.response?.data;
      const mensaje =
        data?.error ||
        data?.mensaje ||
        data?.message ||
        (typeof data === "string" && data.trim() ? data : null) ||
        "Ocurrió un error al subir la plantilla.";
      return { exito: false, mensaje };
    }
  },

  /**
   * Elimina la plantilla general de licencia del curso.
   * DELETE servicios/{i_CveServicio}/plantilla-licencia
   */
  async eliminarPlantillaLicencia(
    i_CveServicio: number
  ): Promise<{ exito: boolean; mensaje?: string }> {
    try {
      await apiClient.delete(`servicios/${i_CveServicio}/plantilla-licencia`);
      return { exito: true };
    } catch (err: any) {
      const data = err?.response?.data;
      const mensaje =
        data?.error ||
        data?.mensaje ||
        data?.message ||
        "Ocurrió un error al eliminar la plantilla.";
      return { exito: false, mensaje };
    }
  },
};
