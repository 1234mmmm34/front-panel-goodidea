import { apiClient, httpDefensivo } from "@/lib/api-client";
import { T_Rutas, RutaDto, ResultadoRespuestaRutas } from "@/types/rutas";

export const RutasService = {
  /**
   * 1. Listar rutas padre (raíz)
   * GET rutas/0
   */
  async getRutasPadre(): Promise<T_Rutas[]> {
    return httpDefensivo(
      async () => {
        const resp = await apiClient.get<any>("rutas/0");
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
   * 2. Listar hijas de una ruta padre
   * GET rutas/{i_CveFuncionalidad}
   */
  async getRutasHijas(i_CveFuncionalidad: number): Promise<T_Rutas[]> {
    return httpDefensivo(
      async () => {
        const resp = await apiClient.get<any>(`rutas/${i_CveFuncionalidad}`);
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
   * 3. Crear ruta (padre o hija)
   * POST rutas
   */
  async crearRuta(payload: T_Rutas): Promise<ResultadoRespuestaRutas> {
    try {
      const resp = await apiClient.post("rutas", payload);
      return {
        exito: resp.status >= 200 && resp.status < 300,
      };
    } catch (error: any) {
      const msg =
        error.response?.data?.message ||
        error.response?.data?.mensaje ||
        (typeof error.response?.data === "string" ? error.response.data : "") ||
        "Ocurrió un error al registrar la ruta.";

      return {
        exito: false,
        mensaje: msg,
      };
    }
  },

  /**
   * 4. Editar ruta (padre o hija)
   * POST rutas/editar
   */
  async editarRuta(payload: T_Rutas): Promise<ResultadoRespuestaRutas> {
    try {
      const resp = await apiClient.post("rutas/editar", payload);
      return {
        exito: resp.status >= 200 && resp.status < 300,
      };
    } catch (error: any) {
      const msg =
        error.response?.data?.message ||
        error.response?.data?.mensaje ||
        (typeof error.response?.data === "string" ? error.response.data : "") ||
        "Ocurrió un error al actualizar la ruta.";

      return {
        exito: false,
        mensaje: msg,
      };
    }
  },

  /**
   * 5. Eliminar ruta
   * DELETE rutas/{i_CveFuncionalidad}
   */
  async eliminarRuta(i_CveFuncionalidad: number): Promise<ResultadoRespuestaRutas> {
    try {
      const resp = await apiClient.delete(`rutas/${i_CveFuncionalidad}`);
      return {
        exito: resp.status >= 200 && resp.status < 300,
      };
    } catch (error: any) {
      const msg =
        error.response?.data?.message ||
        error.response?.data?.mensaje ||
        (typeof error.response?.data === "string" ? error.response.data : "") ||
        "Ocurrió un error al eliminar la ruta.";

      return {
        exito: false,
        mensaje: msg,
      };
    }
  },

  /**
   * 6. Obtener menú dinámico del perfil de usuario
   * GET rutas/navBar/{i_CvePerfil}
   */
  async getRutasNavBar(i_CvePerfil: number): Promise<RutaDto[]> {
    return httpDefensivo(
      async () => {
        const resp = await apiClient.get<any>(`rutas/navBar/${i_CvePerfil}`);
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
};
