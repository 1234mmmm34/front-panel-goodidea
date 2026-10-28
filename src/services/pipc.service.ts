import { apiClient } from "@/lib/api-client";
import {
  PipcResumen,
  PipcExpediente,
  PipcSeccionPut,
  PipcSeccionGuardada,
  PipcArchivoSubido,
  PipcZona,
} from "@/types/pipc";

export function extraerMensajeError(error: any, fallback: string = "Ocurrió un error inesperado"): string {
  if (error?.response?.data) {
    const data = error.response.data;
    if (typeof data === "string" && data.trim()) return data;
    if (typeof data === "object") {
      if (typeof data.mensaje === "string") return data.mensaje;
      if (typeof data.message === "string") return data.message;
      if (typeof data.title === "string") return data.title;
      if (typeof data.error === "string") return data.error;
    }
  }
  if (error?.message) return error.message;
  return fallback;
}

export const PipcService = {
  /**
   * Obtiene el resumen del checklist PIPC de un servicio
   * Endpoint: GET /api/pipc/{i_CveServAgendaDet}/resumen
   */
  async getResumen(i_CveServAgendaDet: number): Promise<PipcResumen> {
    const resp = await apiClient.get<PipcResumen>(`pipc/${i_CveServAgendaDet}/resumen`);
    return resp.data;
  },

  /**
   * Inicia el checklist PIPC para un servicio
   * Endpoint: POST /api/pipc/{i_CveServAgendaDet}/iniciar
   */
  async iniciarChecklist(i_CveServAgendaDet: number): Promise<PipcResumen> {
    const resp = await apiClient.post<PipcResumen>(`pipc/${i_CveServAgendaDet}/iniciar`);
    return resp.data;
  },

  /**
   * Obtiene el expediente completo (resumen, secciones y archivos)
   * Endpoint: GET /api/pipc/{i_CveServAgendaDet}
   */
  async getExpediente(i_CveServAgendaDet: number): Promise<PipcExpediente> {
    const resp = await apiClient.get<PipcExpediente>(`pipc/${i_CveServAgendaDet}`);
    return resp.data;
  },

  /**
   * Guarda o actualiza el estado de una sección del checklist
   * Endpoint: PUT /api/pipc/{i_CveServAgendaDet}/seccion
   */
  async putSeccion(
    i_CveServAgendaDet: number,
    payload: PipcSeccionPut
  ): Promise<PipcSeccionGuardada> {
    const resp = await apiClient.put<PipcSeccionGuardada>(
      `pipc/${i_CveServAgendaDet}/seccion`,
      payload
    );
    return resp.data;
  },

  /**
   * Sube un archivo a una zona específica del checklist
   * Endpoint: POST /api/pipc/{i_CveServAgendaDet}/archivos
   */
  async subirArchivo(
    i_CveServAgendaDet: number,
    v_Zona: PipcZona,
    archivo: File | Blob,
    nombreArchivo?: string
  ): Promise<PipcArchivoSubido> {
    const formData = new FormData();
    formData.append("v_Zona", v_Zona);
    if (nombreArchivo) {
      formData.append("archivo", archivo, nombreArchivo);
    } else {
      formData.append("archivo", archivo);
    }

    const resp = await apiClient.post<PipcArchivoSubido>(
      `pipc/${i_CveServAgendaDet}/archivos`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return resp.data;
  },

  /**
   * Elimina un archivo del checklist
   * Endpoint: DELETE /api/pipc/archivos/{i_CvePipcArchivo}
   */
  async deleteArchivo(i_CvePipcArchivo: number): Promise<void> {
    await apiClient.delete(`pipc/archivos/${i_CvePipcArchivo}`);
  },

  /**
   * Descarga los bytes de una imagen
   * Endpoint: GET /api/pipc/archivos/{i_CvePipcArchivo} (responseType: blob)
   */
  async getArchivoBlob(i_CvePipcArchivo: number): Promise<Blob> {
    const resp = await apiClient.get<Blob>(`pipc/archivos/${i_CvePipcArchivo}`, {
      responseType: "blob",
    });
    return resp.data;
  },
};
