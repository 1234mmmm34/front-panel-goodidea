import { apiClient } from "@/lib/api-client";
import type { NotificacionesResponse } from "@/types/notificaciones";

export const NotificacionesService = {
  /**
   * GET api/notificaciones?top=20
   */
  async getNotificaciones(top: number = 20): Promise<NotificacionesResponse> {
    const resp = await apiClient.get<NotificacionesResponse>("notificaciones", {
      params: { top },
    });
    const data = resp.data;
    return {
      i_NoLeidas: typeof data?.i_NoLeidas === "number" ? data.i_NoLeidas : 0,
      Notificaciones: Array.isArray(data?.Notificaciones)
        ? data.Notificaciones
        : [],
    };
  },

  /**
   * POST api/notificaciones/{i_CveNotificacion}/leida
   */
  async marcarLeida(id: number): Promise<void> {
    await apiClient.post(`notificaciones/${id}/leida`);
  },

  /**
   * POST api/notificaciones/leidas
   */
  async marcarTodasLeidas(): Promise<void> {
    await apiClient.post("notificaciones/leidas");
  },
};
