import axios, { AxiosInstance } from "axios";
import { SesionAlmacenada } from "@/types/auth";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export const apiClient: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

/**
 * Lee la sesión desde localStorage desde "userData" (formato legacy Blazor) o "sesion_stps".
 */
export function obtenerSesionActual(): SesionAlmacenada | null {
  if (typeof window === "undefined") return null;

  try {
    // 1. Intentar leer desde "userData"
    const rawUserData = localStorage.getItem("userData");
    if (rawUserData) {
      const parsed = JSON.parse(rawUserData);
      const token = parsed.token || parsed.password || "";
      if (token) {
        return {
          id_usuario: parsed.id_usuario ?? parsed.IdUsuario ?? 0,
          username: parsed.username ?? "",
          email: parsed.email ?? parsed.v_email ?? "",
          tenant: parsed.tenant ?? parsed.v_Nombre ?? "",
          token,
          id_perfil: parsed.id_perfil ?? parsed.i_CvePerfil ?? 1,
          id_tenant: parsed.id_tenant ?? parsed.i_CveTenant ?? parsed.IdTenant ?? 1,
        };
      }
    }

    // 2. Intentar leer desde "sesion_stps"
    const rawSesion = localStorage.getItem("sesion_stps");
    if (rawSesion) {
      const parsed = JSON.parse(rawSesion);
      const token = parsed.token || parsed.Token || parsed.password || "";
      if (token) {
        return {
          id_usuario: parsed.id_usuario ?? parsed.IdUsuario ?? 0,
          username: parsed.username ?? "",
          email: parsed.email ?? parsed.v_email ?? "",
          tenant: parsed.tenant ?? parsed.v_Nombre ?? "",
          token,
          id_perfil: parsed.id_perfil ?? parsed.i_CvePerfil ?? parsed.IdPerfil ?? 1,
          id_tenant: parsed.id_tenant ?? parsed.i_CveTenant ?? parsed.IdTenant ?? 1,
        };
      }
    }
  } catch (e) {
    console.warn("Error leyendo sesión almacenada:", e);
  }

  return null;
}

// Interceptor de Request: inyecta Bearer token
apiClient.interceptors.request.use(
  (config) => {
    const sesion = obtenerSesionActual();
    if (sesion?.token) {
      config.headers.Authorization = `Bearer ${sesion.token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor de Response: intercepta 401 Unauthorized y desloguea
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (typeof window !== "undefined" && error.response?.status === 401) {
      // Limpiar sesión y redirigir a login si no estamos en /login
      if (!window.location.pathname.startsWith("/login")) {
        localStorage.removeItem("userData");
        localStorage.removeItem("sesion_stps");
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

/**
 * Wrapper defensivo para peticiones HTTP.
 */
export async function httpDefensivo<T>(
  requestFn: () => Promise<T>,
  fallbackValue: T
): Promise<T> {
  try {
    return await requestFn();
  } catch (error: any) {
    const status = error?.response?.status;
    const msg = error?.message || "Error desconocido";
    console.warn(`[HTTP Defensivo] ${status ? `Status ${status}: ` : ""}${msg}`);
    return fallbackValue;
  }
}
