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

      const raw: any = resp.data;
      console.log("[AuthService.login] Respuesta del servidor:", raw);

      if (raw && (raw.id_usuario || raw.IdUsuario || raw.idUsuario || raw.token || raw.Token || raw.password)) {
        const tokenReal = raw.token || raw.Token || raw.password || raw.jwtToken || "";

        const sesion: SesionAlmacenada = {
          id_usuario: raw.id_usuario ?? raw.IdUsuario ?? raw.idUsuario ?? 0,
          username: raw.username ?? raw.Username ?? raw.v_email ?? raw.email ?? "",
          email: raw.v_email ?? raw.email ?? raw.Email ?? "",
          tenant: raw.v_Nombre ?? raw.tenant ?? raw.Tenant ?? "STPS",
          token: tokenReal,
          id_perfil: raw.i_CvePerfil ?? raw.IdPerfil ?? raw.id_perfil ?? 1,
          id_tenant: raw.i_CveTenant ?? raw.IdTenant ?? raw.id_tenant ?? 1,
        };

        if (typeof window !== "undefined") {
          // Guardar en formato "userData" (legacy Blazor) y "sesion_stps"
          localStorage.setItem("userData", JSON.stringify(raw));
          localStorage.setItem("sesion_stps", JSON.stringify(sesion));
          console.log("[AuthService.login] Sesión guardada con éxito:", {
            id_usuario: sesion.id_usuario,
            hasToken: Boolean(sesion.token),
          });
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
