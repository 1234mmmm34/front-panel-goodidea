import { apiClient, httpDefensivo } from "@/lib/api-client";
import {
  Perfil,
  Tenant,
  Usuario,
  UsuariosPagedDto,
} from "@/types/usuarios";

export interface ResultadoRespuestaUsuarios {
  exito: boolean;
  mensaje?: string;
}

export const UsuariosService = {
  /**
   * 1. Listar usuarios (paginado)
   * GET usuarios?i_Activo={}&i_Confirmado={}&i_Tenant={}&pagina={}&tamano={}[&searchTerm={}]
   */
  async getUsuariosPaginado(params: {
    i_CveTenant: number;
    i_Activo: number;
    i_Confirmado: number;
    pagina: number;
    tamano: number;
    searchTerm?: string;
  }): Promise<UsuariosPagedDto> {
    return httpDefensivo(
      async () => {
        const queryParams: Record<string, any> = {
          i_Activo: params.i_Activo,
          i_Confirmado: params.i_Confirmado,
          i_Tenant: params.i_CveTenant,
          pagina: params.pagina,
          tamano: params.tamano,
        };

        if (params.searchTerm && params.searchTerm.trim() !== "") {
          queryParams.searchTerm = params.searchTerm.trim();
        }

        const resp = await apiClient.get<any>("usuarios", {
          params: queryParams,
        });

        const rawData =
          resp.data?.data ||
          resp.data?.datos ||
          resp.data?.Data ||
          resp.data?.Datos ||
          resp.data?.items ||
          resp.data?.result ||
          (Array.isArray(resp.data) ? resp.data : []);

        const total =
          resp.data?.i_TotalRegistros ??
          resp.data?.totalRegistros ??
          resp.data?.TotalRegistros ??
          resp.data?.total ??
          resp.data?.count ??
          (Array.isArray(rawData) ? rawData.length : 0);

        const normalizados: Usuario[] = (Array.isArray(rawData) ? rawData : []).map((u: any) => ({
          id: u.id ?? u.Id ?? u.id_usuario ?? u.IdUsuario ?? 0,
          username: u.username ?? u.Username ?? u.v_Username ?? u.v_email ?? u.email ?? "",
          password: "",
          v_email: u.v_email ?? u.v_Email ?? u.email ?? u.Email ?? "",
          b_mailConfirmed: Boolean(u.b_mailConfirmed ?? u.b_MailConfirmed ?? u.mailConfirmed ?? false),
          b_Active: Boolean(u.b_Active ?? u.b_active ?? u.active ?? u.Active ?? false),
          d_FechaCreacion: u.d_FechaCreacion ?? u.d_fechaCreacion ?? u.FechaCreacion ?? "",
          d_UltimoLogin: u.d_UltimoLogin ?? u.d_ultimoLogin ?? null,
          v_telefono: u.v_telefono ?? u.v_Telefono ?? u.telefono ?? u.Telefono ?? "",
          i_CvePerfil: u.i_CvePerfil ?? u.iCvePerfil ?? u.IdPerfil ?? null,
          i_CveTenant: u.i_CveTenant ?? u.iCveTenant ?? u.IdTenant ?? null,
          v_Nombres: u.v_Nombres ?? u.v_nombres ?? u.Nombres ?? "",
          v_ApellidoPaterno: u.v_ApellidoPaterno ?? u.v_apellidoPaterno ?? u.ApellidoPaterno ?? "",
          v_ApellidoMaterno: u.v_ApellidoMaterno ?? u.v_apellidoMaterno ?? u.ApellidoMaterno ?? "",
        }));

        return {
          data: normalizados,
          i_TotalRegistros: Number(total || 0),
        };
      },
      { data: [], i_TotalRegistros: 0 }
    );
  },

  /**
   * 2. Obtener un usuario por ID
   * GET usuarios/{id}?iCveTenant={tenant}
   */
  async getUsuarioById(id: number, iCveTenant: number): Promise<Usuario | null> {
    return httpDefensivo(
      async () => {
        const resp = await apiClient.get<any>(`usuarios/${id}`, {
          params: { iCveTenant },
        });
        if (!resp.data) return null;
        return resp.data?.data || resp.data;
      },
      null
    );
  },

  /**
   * 3. Crear usuario
   * POST usuarios
   */
  async crearUsuario(payload: {
    username: string;
    v_email: string;
    v_Nombres: string;
    v_ApellidoPaterno: string;
    v_ApellidoMaterno?: string | null;
    b_Active: boolean;
    v_telefono?: string | null;
    i_CvePerfil: number;
    i_CveTenant: number;
  }): Promise<ResultadoRespuestaUsuarios> {
    try {
      const body = {
        Id: 0,
        username: payload.username.trim(),
        password: "",
        v_email: payload.v_email.trim(),
        v_Nombres: payload.v_Nombres.trim(),
        v_ApellidoPaterno: payload.v_ApellidoPaterno.trim(),
        v_ApellidoMaterno: payload.v_ApellidoMaterno ? payload.v_ApellidoMaterno.trim() : null,
        b_mailConfirmed: false,
        b_Active: payload.b_Active,
        d_FechaCreacion: new Date().toISOString(),
        d_UltimoLogin: null,
        v_telefono: payload.v_telefono ? payload.v_telefono.trim() : null,
        i_CvePerfil: payload.i_CvePerfil,
        i_CveTenant: payload.i_CveTenant,
      };

      const resp = await apiClient.post("usuarios", body);
      return {
        exito: resp.status >= 200 && resp.status < 300,
      };
    } catch (error: any) {
      const msg =
        error.response?.data?.message ||
        error.response?.data?.mensaje ||
        (typeof error.response?.data === "string" ? error.response.data : "") ||
        "Error: correo ya asociado a una cuenta existente";

      return {
        exito: false,
        mensaje: msg,
      };
    }
  },

  /**
   * 4. Editar usuario
   * POST usuarios/editar
   */
  async editarUsuario(payload: {
    id: number;
    username: string;
    v_email: string;
    v_Nombres: string;
    v_ApellidoPaterno: string;
    v_ApellidoMaterno?: string | null;
    b_Active: boolean;
    v_telefono?: string | null;
    i_CvePerfil: number;
    i_CveTenant: number;
  }): Promise<ResultadoRespuestaUsuarios> {
    try {
      const body = {
        Id: payload.id,
        username: payload.username.trim(),
        password: "",
        v_email: payload.v_email.trim(),
        v_Nombres: payload.v_Nombres.trim(),
        v_ApellidoPaterno: payload.v_ApellidoPaterno.trim(),
        v_ApellidoMaterno: payload.v_ApellidoMaterno ? payload.v_ApellidoMaterno.trim() : null,
        b_Active: payload.b_Active,
        v_telefono: payload.v_telefono ? payload.v_telefono.trim() : null,
        i_CvePerfil: payload.i_CvePerfil,
        i_CveTenant: payload.i_CveTenant,
      };

      const resp = await apiClient.post("usuarios/editar", body);
      return {
        exito: resp.status >= 200 && resp.status < 300,
      };
    } catch (error: any) {
      const msg =
        error.response?.data?.message ||
        error.response?.data?.mensaje ||
        (typeof error.response?.data === "string" ? error.response.data : "") ||
        "Error: correo ya asociado a una cuenta existente";

      return {
        exito: false,
        mensaje: msg,
      };
    }
  },

  /**
   * 5. Eliminar usuario
   * DELETE usuarios/borrar/{id}
   */
  async eliminarUsuario(id: number): Promise<ResultadoRespuestaUsuarios> {
    try {
      const resp = await apiClient.delete(`usuarios/borrar/${id}`);
      return {
        exito: resp.status >= 200 && resp.status < 300,
      };
    } catch (error: any) {
      return {
        exito: false,
        mensaje: error.response?.data?.message || "Ocurrió un error al intentar eliminar el usuario.",
      };
    }
  },

  /**
   * 6. Obtener perfiles
   * GET perfiles/GetAll/{i_CveTenant}
   */
  async getPerfiles(iCveTenant: number): Promise<Perfil[]> {
    return httpDefensivo(
      async () => {
        const resp = await apiClient.get<any>(`perfiles/GetAll/${iCveTenant}`);
        const raw = Array.isArray(resp.data) ? resp.data : resp.data?.datos || resp.data?.data || [];
        return Array.isArray(raw) ? raw : [];
      },
      []
    );
  },

  /**
   * 7. Obtener tenants (empresas)
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
