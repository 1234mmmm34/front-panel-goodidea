import axios, { AxiosInstance, AxiosRequestConfig } from "axios";
import { SesionAlmacenada } from "@/types/auth";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export const apiClient: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor para inyectar token JWT de autorización y Tenant ID
apiClient.interceptors.request.use(
  (config) => {
    if (typeof window !== "undefined") {
      const sesionRaw = localStorage.getItem("sesion_stps");
      if (sesionRaw) {
        try {
          const sesion: SesionAlmacenada = JSON.parse(sesionRaw);
          if (sesion.Token) {
            config.headers.Authorization = `Bearer ${sesion.Token}`;
          }
        } catch {
          // Si falla el parseo, omitir token
        }
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export async function obtenerSesionActual(): Promise<SesionAlmacenada | null> {
  if (typeof window === "undefined") return null;
  const sesionRaw = localStorage.getItem("sesion_stps");
  if (!sesionRaw) return null;
  try {
    return JSON.parse(sesionRaw);
  } catch {
    return null;
  }
}

/**
 * Wrapper defensivo para peticiones HTTP.
 * Asegura que ninguna excepción quede sin manejar y devuelve un fallback seguro en caso de error.
 */
export async function httpDefensivo<T>(
  requestFn: () => Promise<T>,
  fallbackValue: T
): Promise<T> {
  try {
    return await requestFn();
  } catch (error) {
    console.error("HTTP error en servicio defensivo:", error);
    return fallbackValue;
  }
}
