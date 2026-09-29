import { apiClient } from "@/lib/api-client";
import { DashboardFinanzas } from "@/types/finanzas";

export const FinanzasService = {
  /**
   * Obtiene la información del dashboard de finanzas.
   * GET dashboard/finanzas?fechaInicio=YYYY-MM-DD&fechaFin=YYYY-MM-DD
   */
  async getDashboard(fechaInicio?: string | null, fechaFin?: string | null): Promise<DashboardFinanzas> {
    const params: Record<string, string> = {};
    if (fechaInicio && fechaInicio.trim().length > 0) {
      params.fechaInicio = fechaInicio.trim();
    }
    if (fechaFin && fechaFin.trim().length > 0) {
      params.fechaFin = fechaFin.trim();
    }

    const response = await apiClient.get<DashboardFinanzas>("dashboard/finanzas", {
      params,
    });
    return response.data;
  },
};
