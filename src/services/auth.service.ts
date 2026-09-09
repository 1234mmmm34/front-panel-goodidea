import { apiClient } from "@/lib/api-client";
import { LoginPayload, LoginResponse, SesionAlmacenada } from "@/types/auth";

export interface ResultadoAuth {
  exito: boolean;
  sesion?: SesionAlmacenada;
  mensaje?: string;
}

export const AuthService = {
  /**
   * Realiza la autenticación contra POST usuarios/login.
   * Mapea el token recibido (deuda técnica: r.password) hacia sesion.token.
   */
  async login(payload: LoginPayload): Promise<ResultadoAuth> {
    try {
      const resp = await apiClient.post<LoginResponse>("usuarios/login", {
        v_email: payload.v_email.trim(),
        password: payload.password,
      });

      if (resp.data && resp.data.id_usuario) {
        const raw = resp.data;
        const tokenReal = raw.password || ""; // El token JWT viene en el campo "password"

        const sesion: SesionAlmacenada = {
          id_usuario: raw.id_usuario ?? 0,
          username: raw.username || raw.v_email,
          email: raw.v_email,
          tenant: raw.v_Nombre || "STPS",
          token: tokenReal,
          id_perfil: raw.i_CvePerfil || 1,
          id_tenant: raw.i_CveTenant || 1,
        };

        if (typeof window !== "undefined") {
          // Guardar en formato "userData" (legacy Blazor) y "sesion_stps"
          localStorage.setItem("userData", JSON.stringify(raw));
          localStorage.setItem("sesion_stps", JSON.stringify(sesion));
        }

        return { exito: true, sesion };
      }

      return {
        exito: false,
        mensaje: "El usuario no existe o credenciales incorrectas",
      };
    } catch (error: any) {
      return {
        exito: false,
        mensaje:
          error.response?.data?.message ||
          "El usuario no existe o credenciales incorrectas",
      };
    }
  },

  /**
   * Cierra la sesión activa borrando localStorage y redirigiendo a /login.
   */
  logout() {
    if (typeof window !== "undefined") {
      localStorage.removeItem("userData");
      localStorage.removeItem("sesion_stps");
      window.location.href = "/login";
    }
  },
};
