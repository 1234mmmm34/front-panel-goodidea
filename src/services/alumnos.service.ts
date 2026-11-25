import { apiClient, httpDefensivo } from "@/lib/api-client";
import { AlumnoInscrito } from "@/types/servicios";

export const AlumnosService = {
  /**
   * Obtiene la lista de alumnos inscritos en un servicio agendado cruzado con el catálogo de personal.
   * Endpoint: GET api/alumnos/inscritos/{i_CveServAgendaDet}
   */
  async getAlumnosInscritos(i_CveServAgendaDet: number): Promise<AlumnoInscrito[]> {
    const resp = await apiClient.get<any>(`alumnos/inscritos/${i_CveServAgendaDet}`);
    const raw = Array.isArray(resp.data)
      ? resp.data
      : resp.data?.datos || resp.data?.data || resp.data?.Datos || [];

    if (!Array.isArray(raw)) return [];

    return raw.map((item: any) => ({
      i_CveAlumnoAgenda: item.i_CveAlumnoAgenda ?? item.I_CveAlumnoAgenda ?? item.iCveAlumnoAgenda ?? 0,
      v_Nomina: String(item.v_Nomina ?? item.vNomina ?? item.nomina ?? ""),
      f_FechaInscripcion: item.f_FechaInscripcion ?? item.fFechaInscripcion ?? null,
      i_CveAlumno: item.i_CveAlumno ?? item.I_CveAlumno ?? item.iCveAlumno ?? null,
      v_Nombre: item.v_Nombre ?? item.vNombre ?? null,
      v_CURP: item.v_CURP ?? item.vCurp ?? item.curp ?? null,
      v_Puesto: item.v_Puesto ?? item.vPuesto ?? item.puesto ?? null,
      v_EvFinal: item.v_EvFinal ?? item.vEvFinal ?? null,
    }));
  },

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

  /**
   * Descarga los diplomas de los alumnos aprobados seleccionados en formato PowerPoint (.pptx).
   * Endpoint: GET alumnos/Diplomas/descargar/{idServAgendaDet}?alumnos=12,15,18
   */
  async descargarDiplomas(idServAgendaDet: number, alumnos: number[]): Promise<string | null> {
    if (!idServAgendaDet || alumnos.length === 0) {
      return "Selecciona alumnos aprobados para descargar sus diplomas.";
    }
    try {
      const resp = await apiClient.get(`alumnos/Diplomas/descargar/${idServAgendaDet}`, {
        params: { alumnos: alumnos.join(",") },
        responseType: "blob",
      });

      const url = window.URL.createObjectURL(new Blob([resp.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `Diplomas_Servicio_${idServAgendaDet}.pptx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      return null;
    } catch (error: any) {
      if (error?.response?.status === 400 && error?.response?.data instanceof Blob) {
        try {
          const text = await error.response.data.text();
          if (text && text.trim()) return text.trim();
        } catch {
          // fallback al mensaje genérico
        }
      }
      return "Ocurrió un problema al generar los diplomas.";
    }
  },
};

