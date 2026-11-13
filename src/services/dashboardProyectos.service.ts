import { apiClient } from "@/lib/api-client";
import { DashboardProyectos } from "@/types/dashboardProyectos";

export const DashboardProyectosService = {
  /**
   * GET dashboard/proyectos?fechaInicio=YYYY-MM-DD&fechaFin=YYYY-MM-DD&iCveRubro=0&iCveInstructor=0
   */
  async getDashboard(params: {
    fechaInicio?: string | null;
    fechaFin?: string | null;
    iCveRubro?: number;
    iCveInstructor?: number;
  }): Promise<DashboardProyectos> {
    const query: Record<string, string | number> = {
      iCveRubro: params.iCveRubro ?? 0,
      iCveInstructor: params.iCveInstructor ?? 0,
    };
    if (params.fechaInicio && params.fechaInicio.trim()) {
      query.fechaInicio = params.fechaInicio.trim();
    }
    if (params.fechaFin && params.fechaFin.trim()) {
      query.fechaFin = params.fechaFin.trim();
    }

    const response = await apiClient.get<DashboardProyectos>(
      "dashboard/proyectos",
      { params: query }
    );
    const d = response.data ?? ({} as DashboardProyectos);
    return {
      proyectos: d.proyectos ?? [],
      asignaciones: d.asignaciones ?? [],
      rubros: d.rubros ?? [],
      asesores: d.asesores ?? [],
    };
  },
};

