import { apiClient, httpDefensivo } from "@/lib/api-client";
import {
  T_Perfiles,
  RutasPerfilResponse,
  PerfilPayload,
  ResultadoRespuestaPerfiles,
} from "@/types/perfiles";
import { Tenant } from "@/types/usuarios";

export const PerfilesService = {
  /**
   * 1. Listar perfiles del tenant
   * GET perfiles/GetAll/{i_CveTenant}
   */
  async getPerfiles(i_CveTenant: number): Promise<T_Perfiles[]> {
    return httpDefensivo(
      async () => {
        const resp = await apiClient.get<any>(`perfiles/GetAll/${i_CveTenant}`);
        const raw =
          resp.data?.data ||
          resp.data?.datos ||
          resp.data?.Data ||
          resp.data?.Datos ||
          (Array.isArray(resp.data) ? resp.data : []);
        return Array.isArray(raw) ? raw : [];
      },
      []
    );
  },

  /**
   * 2. Rutas para el formulario
   * GET rutas/perfil/{i_CvePerfil}
   */
  async getRutasPerfil(i_CvePerfil: number): Promise<RutasPerfilResponse> {
    return httpDefensivo(
      async () => {
        const resp = await apiClient.get<any>(`rutas/perfil/${i_CvePerfil}`);
        const data = resp.data?.data || resp.data?.datos || resp.data || {};
        return {
          rutasRaiz: Array.isArray(data.rutasRaiz) ? data.rutasRaiz : [],
          rutasHijas: Array.isArray(data.rutasHijas) ? data.rutasHijas : [],
        };
      },
      { rutasRaiz: [], rutasHijas: [] }
    );
  },

  /**
   * 3. Crear perfil
   * POST perfiles
   */
  async crearPerfil(payload: PerfilPayload): Promise<ResultadoRespuestaPerfiles> {
    try {
      const resp = await apiClient.post("perfiles", payload);
      return {
        exito: resp.status >= 200 && resp.status < 300,
      };
    } catch (error: any) {
      const msg =
        error.response?.data?.message ||
        error.response?.data?.mensaje ||
        (typeof error.response?.data === "string" ? error.response.data : "") ||
        "Ocurrió un error al registrar el perfil.";

      return {
        exito: false,
        mensaje: msg,
      };
    }
  },

  /**
   * 4. Editar perfil
   * POST perfiles/editar
   */
  async editarPerfil(payload: PerfilPayload): Promise<ResultadoRespuestaPerfiles> {
    try {
      const resp = await apiClient.post("perfiles/editar", payload);
      return {
        exito: resp.status >= 200 && resp.status < 300,
      };
    } catch (error: any) {
      const msg =
        error.response?.data?.message ||
        error.response?.data?.mensaje ||
        (typeof error.response?.data === "string" ? error.response.data : "") ||
        "Ocurrió un error al actualizar el perfil.";

      return {
        exito: false,
        mensaje: msg,
      };
    }
  },

  /**
   * 5. Eliminar perfil
   * DELETE perfiles/{i_CvePerfil}
   */
  async eliminarPerfil(i_CvePerfil: number): Promise<ResultadoRespuestaPerfiles> {
    try {
      const resp = await apiClient.delete(`perfiles/${i_CvePerfil}`);
      return {
        exito: resp.status >= 200 && resp.status < 300,
      };
    } catch (error: any) {
      const msg =
        error.response?.data?.message ||
        error.response?.data?.mensaje ||
        (typeof error.response?.data === "string" ? error.response.data : "") ||
        "Ocurrió un error al eliminar el perfil.";

      return {
        exito: false,
        mensaje: msg,
      };
    }
  },

  /**
   * 6. Obtener tenants (empresas) del usuario
   * GET tenant/{id_usuario}
   */
  async getTenants(idUsuario: number): Promise<Tenant[]> {
    return httpDefensivo(
      async () => {
        const resp = await apiClient.get<any>(`tenant/${idUsuario}`);
        const raw = Array.isArray(resp.data) ? resp.data : resp.data?.datos || resp.data?.data || [];
        return Array.isArray(raw) ? raw : [];
      },
      []
    );
  },
};
