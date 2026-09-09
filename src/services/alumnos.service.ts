import { apiClient, httpDefensivo } from "@/lib/api-client";

export const AlumnosService = {
  /**
   * Descarga la nómina de alumnos inscritos en formato Excel (.xlsx).
   * Endpoint: GET alumnos/Nomina/descargar/{idServAgendaDet}
   */
  async descargarNomina(idServAgendaDet: number): Promise<boolean> {
    return httpDefensivo(async () => {
      if (!idServAgendaDet) return false;
      const resp = await apiClient.get(`alumnos/Nomina/descargar/${idServAgendaDet}`, {
        responseType: "blob",
      });

      const url = window.URL.createObjectURL(new Blob([resp.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `Nomina_Servicio_${idServAgendaDet}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      return true;
    }, false);
  },
};
