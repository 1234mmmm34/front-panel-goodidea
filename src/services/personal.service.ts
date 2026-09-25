import { apiClient, httpDefensivo } from "@/lib/api-client";
import {
  PersonalListaDto,
  PersonalDetalleDto,
  PersonalGuardarDto,
} from "@/types/instructores";

export interface PersonalPaginadoResponse {
  datos: PersonalListaDto[];
  total: number;
  pagina: number;
  tamano: number;
  totalPaginas: number;
}

export const PersonalService = {
  /**
   * GET personal?searchTerm=&pagina=&tamano=&i_Vigencia=
   * i_Vigencia: 2 = todos (default) · 1 = vigentes · 0 = vencidos / sin actualizar
   */
  async getPaginado(params: {
    searchTerm?: string;
    pagina: number;
    tamano: number;
    i_Vigencia: number;
  }): Promise<PersonalPaginadoResponse> {
    return httpDefensivo(
      async () => {
        const queryParams: Record<string, string | number> = {
          pagina: params.pagina,
          tamano: params.tamano,
          i_Vigencia: params.i_Vigencia,
        };
        if (params.searchTerm && params.searchTerm.trim() !== "") {
          queryParams.searchTerm = params.searchTerm.trim();
        }

        const resp = await apiClient.get<any>("personal", {
          params: queryParams,
        });

        const data = resp.data;
        let rawDatos: PersonalListaDto[] = [];
        let total = 0;
        let totalPaginas = 1;

        if (Array.isArray(data)) {
          rawDatos = data;
          total = data.length;
        } else if (data && typeof data === "object") {
          if (Array.isArray(data.datos)) rawDatos = data.datos;
          else if (Array.isArray(data.data)) rawDatos = data.data;
          else if (Array.isArray(data.Datos)) rawDatos = data.Datos;

          total = data.total ?? data.Total ?? data.i_TotalRegistros ?? rawDatos.length;
          totalPaginas =
            (data.totalPaginas ??
            data.TotalPaginas ??
            Math.ceil(total / (params.tamano || 10))) || 1;
        }

        return {
          datos: rawDatos,
          total,
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
   * GET personal/{i_CveInstructor}
   */
  async getById(id: number): Promise<PersonalDetalleDto | null> {
    return httpDefensivo(async () => {
      const resp = await apiClient.get<PersonalDetalleDto>(`personal/${id}`);
      return resp.data || null;
    }, null);
  },

  /**
   * POST personal
   * Body: PersonalGuardarDto (i_CveInstructor = 0)
   */
  async crear(data: PersonalGuardarDto): Promise<{ exito: boolean; data?: PersonalDetalleDto; mensaje?: string }> {
    try {
      const resp = await apiClient.post<PersonalDetalleDto>("personal", data);
      return { exito: true, data: resp.data };
    } catch (err: any) {
      const mensaje =
        (typeof err?.response?.data === "string" ? err.response.data : null) ||
        err?.response?.data?.mensaje ||
        err?.response?.data?.message ||
        err?.message ||
        "Error al crear el registro de personal.";
      return { exito: false, mensaje };
    }
  },

  /**
   * PUT personal
   * Body: PersonalGuardarDto
   */
  async actualizar(data: PersonalGuardarDto): Promise<{ exito: boolean; data?: PersonalDetalleDto; mensaje?: string }> {
    try {
      const resp = await apiClient.put<PersonalDetalleDto>("personal", data);
      return { exito: true, data: resp.data };
    } catch (err: any) {
      const mensaje =
        (typeof err?.response?.data === "string" ? err.response.data : null) ||
        err?.response?.data?.mensaje ||
        err?.response?.data?.message ||
        err?.message ||
        "Error al actualizar el registro de personal.";
      return { exito: false, mensaje };
    }
  },

  /**
   * POST personal/{i_CveInstructor}/foto
   * multipart/form-data, campo "archivo" (JPG/PNG/WEBP, máx 2 MB)
   */
  async subirFoto(idInstructor: number, archivo: File): Promise<{ exito: boolean; keyFoto?: string; mensaje?: string }> {
    try {
      const formData = new FormData();
      formData.append("archivo", archivo, archivo.name);

      const resp = await apiClient.post<{ v_KeyFoto?: string }>(`personal/${idInstructor}/foto`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      const keyFoto = resp.data?.v_KeyFoto;
      return { exito: true, keyFoto };
    } catch (err: any) {
      const mensaje =
        (typeof err?.response?.data === "string" ? err.response.data : null) ||
        err?.response?.data?.mensaje ||
        err?.response?.data?.message ||
        err?.message ||
        "No se pudo subir la foto.";
      return { exito: false, mensaje };
    }
  },

  /**
   * DELETE personal/{i_CveInstructor}
   * 409 si tiene sesiones asignadas: regresa mensaje del backend.
   */
  async eliminar(id: number): Promise<{ exito: boolean; mensaje?: string }> {
    try {
      await apiClient.delete(`personal/${id}`);
      return { exito: true };
    } catch (err: any) {
      const mensaje =
        (typeof err?.response?.data === "string" ? err.response.data : null) ||
        err?.response?.data?.mensaje ||
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        "Error al eliminar el registro de personal.";
      return { exito: false, mensaje };
    }
  },
};
