import axios from "axios";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "/api-proxy/";

// Instancia de Axios pública sin token Authorization y sin interceptores 401/403
const publicApiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 20000,
  headers: {
    "Content-Type": "application/json",
  },
});

export interface UsuarioToken {
  id: number;
  v_email: string | null;
}

export interface ResultadoToken {
  exito: boolean;
  usuario?: UsuarioToken;
  mensaje?: string;
}

export interface ResultadoConfirmar {
  exito: boolean;
  mensaje?: string;
}

export const ContraseniaService = {
  /**
   * 2.1 GET {UrlApi}token/{token}
   * Valida el token recibido y devuelve la cuenta del usuario.
   */
  async validarToken(token: string): Promise<ResultadoToken> {
    try {
      if (!token || !token.trim()) {
        return { exito: false, mensaje: "Usuario no existente o token expirado" };
      }

      const response = await publicApiClient.get(`token/${encodeURIComponent(token.trim())}`);
      const data = response.data;

      // Si la respuesta viene como arreglo (compatibilidad Blazor), tomamos el primer elemento
      const userObj = Array.isArray(data) ? data[0] : data;

      if (!userObj) {
        return { exito: false, mensaje: "Usuario no existente o token expirado" };
      }

      const userId = Number(userObj.id ?? userObj.id_usuario ?? userObj.Id ?? 0);
      const userEmail = userObj.v_email ?? userObj.email ?? userObj.Email ?? null;

      if (!userId || isNaN(userId) || userId <= 0) {
        return { exito: false, mensaje: "Usuario no existente o token expirado" };
      }

      return {
        exito: true,
        usuario: {
          id: userId,
          v_email: userEmail,
        },
      };
    } catch (error) {
      return {
        exito: false,
        mensaje: "Usuario no existente o token expirado",
      };
    }
  },

  /**
   * 2.2 POST {UrlApi}token/confirmar?id_usuario={id}&password={encodeURIComponent(password)}
   * Confirma el registro y define la contraseña del usuario.
   */
  async confirmarRegistro(idUsuario: number, password: string): Promise<ResultadoConfirmar> {
    try {
      const url = `token/confirmar?id_usuario=${idUsuario}&password=${encodeURIComponent(password)}`;
      const response = await publicApiClient.post(url, null);

      if (response.status >= 200 && response.status < 300) {
        return { exito: true };
      }

      return {
        exito: false,
        mensaje: "Error al registrarse. Por favor, contacte al administrador",
      };
    } catch (error) {
      return {
        exito: false,
        mensaje: "Error al registrarse. Por favor, contacte al administrador",
      };
    }
  },
};
