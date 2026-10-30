import { apiClient } from "@/lib/api-client";
import {
  AlumnoCatalogo,
  AlumnosCatalogoResponse,
  AlumnoPostDto,
  AlumnoCargaMasivaDto,
  AlumnoCargaResultado,
  HistorialAlumnosResponse,
  HistorialAlumnoPutDto,
  HistorialResumenDto,
  CursoHistorial,
  CargaHistorialPayload,
  CargaHistorialResultado,
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

  /**
   * 3.6 Listar historial de alumnos de una empresa
   * GET api/alumnos/historial/empresa/{i_CveEmpresa}
   */
  async getHistorialAlumnos(
    i_CveEmpresa: number,
    params?: {
      searchTerm?: string;
      pagina?: number;
      tamano?: number;
      fechaInicio?: string;
      fechaFin?: string;
    }
  ): Promise<HistorialAlumnosResponse> {
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
      if (params?.fechaInicio && params.fechaInicio.trim()) {
        queryParams.fechaInicio = params.fechaInicio.trim();
      }
      if (params?.fechaFin && params.fechaFin.trim()) {
        queryParams.fechaFin = params.fechaFin.trim();
      }

      const resp = await apiClient.get<HistorialAlumnosResponse>(
        `alumnos/historial/empresa/${i_CveEmpresa}`,
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
      console.error("[AlumnosCatalogoService.getHistorialAlumnos] Error:", err);
      throw err;
    }
  },

  /**
   * 3.7 Guardar evaluación y entregables
   * PUT api/alumnos/historial/{i_CveAlumnoAgenda}
   */
  async putHistorialAlumno(
    i_CveAlumnoAgenda: number,
    dto: HistorialAlumnoPutDto
  ): Promise<{ exito: boolean; status: number; error?: string }> {
    try {
      const resp = await apiClient.put(`alumnos/historial/${i_CveAlumnoAgenda}`, dto);
      return { exito: true, status: resp.status };
    } catch (err: any) {
      const status = err.response?.status || 500;
      const errorMsg =
        err.response?.data?.error ||
        err.response?.data?.mensaje ||
        err.response?.data?.message ||
        "Error al actualizar la evaluación y entregables.";
      return { exito: false, status, error: errorMsg };
    }
  },

  /**
   * 3.8 Resumen del historial de alumnos de una empresa
   * GET api/alumnos/historial/empresa/{i_CveEmpresa}/resumen
   */
  async getHistorialResumen(
    i_CveEmpresa: number,
    params?: {
      searchTerm?: string;
      fechaInicio?: string;
      fechaFin?: string;
    }
  ): Promise<HistorialResumenDto> {
    try {
      const queryParams: Record<string, any> = {};
      if (params?.searchTerm && params.searchTerm.trim()) {
        queryParams.searchTerm = params.searchTerm.trim();
      }
      if (params?.fechaInicio && params.fechaInicio.trim()) {
        queryParams.fechaInicio = params.fechaInicio.trim();
      }
      if (params?.fechaFin && params.fechaFin.trim()) {
        queryParams.fechaFin = params.fechaFin.trim();
      }

      const resp = await apiClient.get<HistorialResumenDto>(
        `alumnos/historial/empresa/${i_CveEmpresa}/resumen`,
        { params: queryParams }
      );

      return (
        resp.data || {
          i_Cursos: 0,
          i_Alumnos: 0,
          i_Inscripciones: 0,
          i_Aprobados: 0,
          i_Reprobados: 0,
          i_SinEvaluar: 0,
        }
      );
    } catch (err: any) {
      console.error("[AlumnosCatalogoService.getHistorialResumen] Error:", err);
      throw err;
    }
  },

  /**
   * 3.9 Cursos de la empresa con alumnos inscritos (búsqueda manual en carga masiva de historial)
   * GET api/alumnos/historial/cursos/empresa/{i_CveEmpresa}
   */
  async getHistorialCursosEmpresa(
    i_CveEmpresa: number,
    params?: {
      fechaInicio?: string;
      fechaFin?: string;
      searchTerm?: string;
    }
  ): Promise<CursoHistorial[]> {
    try {
      const queryParams: Record<string, string> = {};
      if (params?.fechaInicio && params.fechaInicio.trim()) {
        queryParams.fechaInicio = params.fechaInicio.trim();
      }
      if (params?.fechaFin && params.fechaFin.trim()) {
        queryParams.fechaFin = params.fechaFin.trim();
      }
      if (params?.searchTerm !== undefined && params.searchTerm.trim() !== "") {
        queryParams.searchTerm = params.searchTerm.trim();
      }

      const resp = await apiClient.get<CursoHistorial[]>(
        `alumnos/historial/cursos/empresa/${i_CveEmpresa}`,
        { params: queryParams }
      );

      return Array.isArray(resp.data) ? resp.data : [];
    } catch (err: any) {
      console.error("[AlumnosCatalogoService.getHistorialCursosEmpresa] Error:", err);
      throw err;
    }
  },

  /**
   * 3.10 Validar carga masiva de historial (vista previa, no guarda nada)
   * POST api/alumnos/historial/carga-masiva/validar
   */
  async validarCargaMasivaHistorial(
    payload: CargaHistorialPayload
  ): Promise<CargaHistorialResultado> {
    try {
      const resp = await apiClient.post<CargaHistorialResultado>(
        "alumnos/historial/carga-masiva/validar",
        payload
      );
      return resp.data;
    } catch (err: any) {
      console.error("[AlumnosCatalogoService.validarCargaMasivaHistorial] Error:", err);
      throw err;
    }
  },

  /**
   * 3.11 Importar carga masiva de historial
   * POST api/alumnos/historial/carga-masiva
   */
  async postCargaMasivaHistorial(
    payload: CargaHistorialPayload
  ): Promise<CargaHistorialResultado> {
    try {
      const resp = await apiClient.post<CargaHistorialResultado>(
        "alumnos/historial/carga-masiva",
        payload
      );
      return resp.data;
    } catch (err: any) {
      console.error("[AlumnosCatalogoService.postCargaMasivaHistorial] Error:", err);
      throw err;
    }
  },
};
