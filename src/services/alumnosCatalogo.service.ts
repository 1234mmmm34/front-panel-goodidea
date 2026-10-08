import { apiClient } from "@/lib/api-client";
import {
  AlumnoCatalogo,
  AlumnosCatalogoResponse,
  AlumnoPostDto,
  AlumnoCargaMasivaDto,
  AlumnoCargaResultado,
} from "@/types/alumnosCatalogo";

export const AlumnosCatalogoService = {
  /**
   * 3.1 Listar alumnos de una empresa
   * GET api/alumnos/catalogo/empresa/{i_CveEmpresa}
   */
  async getAlumnosCatalogo(
    i_CveEmpresa: number,
    params?: { searchTerm?: string; pagina?: number; tamano?: number }
  ): Promise<AlumnosCatalogoResponse> {
    try {
      const queryParams: Record<string, any> = {};
      if (params?.searchTerm && params.searchTerm.trim()) {
        queryParams.searchTerm = params.searchTerm.trim();
      }
      if (params?.pagina) {
        queryParams.pagina = params.pagina;
      }
      if (params?.tamano) {
        queryParams.tamano = params.tamano;
      }

      const resp = await apiClient.get<AlumnosCatalogoResponse>(
        `alumnos/catalogo/empresa/${i_CveEmpresa}`,
        { params: queryParams }
      );

      return (
        resp.data || {
          datos: [],
          total: 0,
          pagina: 1,
          tamano: 10,
          totalPaginas: 0,
        }
      );
    } catch (err: any) {
      console.error("[AlumnosCatalogoService.getAlumnosCatalogo] Error:", err);
      throw err;
    }
  },

  /**
   * 3.2 Alta individual de alumno
   * POST api/alumnos/catalogo
   */
  async postAlumnoCatalogo(
    dto: AlumnoPostDto
  ): Promise<{ exito: boolean; status: number; data?: AlumnoCatalogo; error?: string }> {
    try {
      const resp = await apiClient.post<AlumnoCatalogo>("alumnos/catalogo", dto);
      return { exito: true, status: resp.status, data: resp.data };
    } catch (err: any) {
      const status = err.response?.status || 500;
      const errorMsg =
        err.response?.data?.error ||
        err.response?.data?.mensaje ||
        err.response?.data?.message ||
        "Error al crear el alumno.";
      return { exito: false, status, error: errorMsg };
    }
  },

  /**
   * 3.3 Carga masiva de alumnos
   * POST api/alumnos/catalogo/carga-masiva
   */
  async postAlumnosCargaMasiva(
    dto: AlumnoCargaMasivaDto
  ): Promise<{ exito: boolean; status: number; data?: AlumnoCargaResultado; error?: string }> {
    try {
      const resp = await apiClient.post<AlumnoCargaResultado>("alumnos/catalogo/carga-masiva", dto);
      return { exito: true, status: resp.status, data: resp.data };
    } catch (err: any) {
      const status = err.response?.status || 500;
      const errorMsg =
        err.response?.data?.error ||
        err.response?.data?.mensaje ||
        err.response?.data?.message ||
        "Error en la carga masiva de alumnos.";
      return { exito: false, status, error: errorMsg };
    }
  },

  /**
   * 3.4 Editar alumno existente
   * PUT api/alumnos/catalogo/{i_CveAlumno}
   */
  async putAlumnoCatalogo(
    i_CveAlumno: number,
    dto: AlumnoPostDto
  ): Promise<{ exito: boolean; status: number; data?: AlumnoCatalogo; error?: string }> {
    try {
      const resp = await apiClient.put<AlumnoCatalogo>(`alumnos/catalogo/${i_CveAlumno}`, dto);
      return { exito: true, status: resp.status, data: resp.data };
    } catch (err: any) {
      const status = err.response?.status || 500;
      const errorMsg =
        err.response?.data?.error ||
        err.response?.data?.mensaje ||
        err.response?.data?.message ||
        "Error al actualizar el alumno.";
      return { exito: false, status, error: errorMsg };
    }
  },

  /**
   * 3.5 Eliminar alumno
   * DELETE api/alumnos/catalogo/{i_CveAlumno}
   */
  async deleteAlumnoCatalogo(
    i_CveAlumno: number
  ): Promise<{ exito: boolean; status: number; mensaje?: string; error?: string }> {
    try {
      const resp = await apiClient.delete<{ exito: boolean; mensaje?: string }>(
        `alumnos/catalogo/${i_CveAlumno}`
      );
      return {
        exito: true,
        status: resp.status,
        mensaje: resp.data?.mensaje || "Alumno eliminado exitosamente",
      };
    } catch (err: any) {
      const status = err.response?.status || 500;
      const errorMsg =
        err.response?.data?.error ||
        err.response?.data?.mensaje ||
        err.response?.data?.message ||
        "Error al eliminar el alumno.";
      return { exito: false, status, error: errorMsg };
    }
  },
};
