import { apiClient, httpDefensivo } from "@/lib/api-client";

export const ArchivosService = {
  /**
   * Obtiene la URL firmada temporal de R2 para visualizar/descargar un documento.
   */
  async obtenerUrlTemporal(key: string): Promise<string | null> {
    return httpDefensivo(async () => {
      if (!key) return null;
      const resp = await apiClient.get<string | { url?: string }>("archivos/ObtenerUrlTemporal", {
        params: { key },
      });
      if (typeof resp.data === "string") {
        return resp.data;
      }
      return resp.data?.url ?? null;
    }, null);
  },

  /**
   * Abre un documento con su URL firmada en una pestaña nueva del navegador.
   */
  async abrirDocumento(key: string): Promise<boolean> {
    if (!key) return false;
    const url = await this.obtenerUrlTemporal(key);
    if (url) {
      window.open(url, "_blank", "noopener,noreferrer");
      return true;
    }
    return false;
  },
};
