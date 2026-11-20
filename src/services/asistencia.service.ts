import { apiClient } from "@/lib/api-client";
import type {
  AsistenciaRegistro,
  AsistenciaResultado,
  AsistenciaSesion,
  AsistenciaSincronizarBody,
} from "@/types/asistencia";

const MAX_LOTE_SINCRONIZAR = 2000;

export const fechaLocalSinZona = (d = new Date()): string => {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(
    d.getHours()
  )}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
};

export const fechaLocalYYYYMMDD = (d = new Date()): string => {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};

export const AsistenciaService = {
  /**
   * GET api/asistencia/paquete?fechaInicio=YYYY-MM-DD&fechaFin=YYYY-MM-DD
   */
  async obtenerPaquete(
    fechaInicio?: string,
    fechaFin?: string
  ): Promise<AsistenciaSesion[]> {
    const params: Record<string, string> = {};
    if (fechaInicio) params.fechaInicio = fechaInicio;
    if (fechaFin) params.fechaFin = fechaFin;

    const resp = await apiClient.get<AsistenciaSesion[]>("asistencia/paquete", {
      params,
    });
    return Array.isArray(resp.data) ? resp.data : [];
  },

  /**
   * POST api/asistencia/sincronizar (en lotes de hasta 2000 registros).
   * Propaga errores de red para que el orquestador mantenga la cola intacta.
   */
  async sincronizarRegistros(
    registros: AsistenciaRegistro[]
  ): Promise<AsistenciaResultado[]> {
    if (registros.length === 0) return [];

    const resultados: AsistenciaResultado[] = [];
    for (let i = 0; i < registros.length; i += MAX_LOTE_SINCRONIZAR) {
      const lote = registros.slice(i, i + MAX_LOTE_SINCRONIZAR);
      const body: AsistenciaSincronizarBody = { registros: lote };
      const resp = await apiClient.post<AsistenciaResultado[]>(
        "asistencia/sincronizar",
        body
      );
      if (Array.isArray(resp.data)) {
        resultados.push(...resp.data);
      }
    }
    return resultados;
  },
};
