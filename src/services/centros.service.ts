import { apiClient, httpDefensivo } from "@/lib/api-client";
import { PlantaGetDto } from "@/types/empresas";

export interface AreaGetDto {
  i_CveArea: number;
  i_CvePlanta: number;
  v_NombreArea: string;
  v_SiglasArea?: string;
  i_CveContacto?: number;
  v_Descripcion?: string;
  [key: string]: any;
}

export interface AreaSavePayload {
  i_CveArea?: number;
  i_CvePlanta: number;
  v_NombreArea: string;
  v_SiglasArea?: string;
  i_CveContacto?: number;
  [key: string]: any;
}

export interface CentroPostPayload {
  i_CvePlanta?: number;
  i_CveEmpresa: number;
  v_NombrePlanta: string;
  v_Siglas?: string;
  v_NombreCalle?: string;
  v_NumeroExterior?: string;
  v_NumeroInterior?: string;
  v_Fraccionamiento?: string;
  i_CodigoPostal?: number;
  [key: string]: any;
}

export const CentrosTrabajoService = {
  /**
   * 2.1 Listar centros de trabajo (incluye v_Areas resuelto desde backend)
   * GET centros/GetAll/{id_empresa}
   */
  async GetCentros(idEmpresa: number, searchTerm?: string): Promise<PlantaGetDto[]> {
    if (!idEmpresa || isNaN(Number(idEmpresa))) return [];
    return httpDefensivo(async () => {
      const resp = await apiClient.get<PlantaGetDto[]>(`centros/GetAll/${idEmpresa}`);
      let lista = resp.data || [];
      if (searchTerm && searchTerm.trim()) {
        const term = searchTerm.trim().toLowerCase();
        lista = lista.filter((c) =>
          (c.v_NombrePlanta || "").toLowerCase().includes(term) ||
          (c.v_Siglas || c.s_Siglas || "").toLowerCase().includes(term) ||
          (c.v_Areas || "").toLowerCase().includes(term) ||
          (c.v_NombreCalle || c.s_Domicilio || "").toLowerCase().includes(term) ||
          (c.v_Fraccionamiento || "").toLowerCase().includes(term)
        );
      }
      return lista;
    }, []);
  },

  /**
   * 2.3 Eliminar centro
   * DELETE centros/{id_centro}
   * Envía header Authorization: Bearer {token} a través de apiClient
   */
  async DeleteCentro(idCentro: number): Promise<boolean> {
    if (!idCentro || isNaN(Number(idCentro))) return false;
    return httpDefensivo(async () => {
      const resp = await apiClient.delete(`centros/${idCentro}`);
      return resp.status >= 200 && resp.status < 300;
    }, false);
  },

  /**
   * Guardar / Crear / Editar centro de trabajo
   * POST centros o POST centros/editar
   */
  async SaveCentro(payload: CentroPostPayload): Promise<boolean> {
    return httpDefensivo(async () => {
      const isEdit = payload.i_CvePlanta && payload.i_CvePlanta > 0;
      const url = isEdit ? "centros/editar" : "centros";
      const resp = await apiClient.post(url, payload);
      return resp.status >= 200 && resp.status < 300;
    }, false);
  },

  /**
   * Listar áreas de un centro
   * GET areas/0/{id_centro}?searchTerm={texto}
   */
  async GetAreas(idCentro: number, searchTerm?: string): Promise<AreaGetDto[]> {
    if (!idCentro || isNaN(Number(idCentro))) return [];
    return httpDefensivo(async () => {
      const params: Record<string, string> = {};
      if (searchTerm && searchTerm.trim()) {
        params.searchTerm = searchTerm.trim();
      }
      const resp = await apiClient.get<any>(`areas/0/${idCentro}`, { params });
      const raw = Array.isArray(resp.data)
        ? resp.data
        : resp.data?.datos || resp.data?.data || resp.data?.Datos || resp.data?.Areas || resp.data?.areas || [];
      if (!Array.isArray(raw)) return [];
      return raw.map((item: any, idx: number) => ({
        i_CveArea: item.i_CveArea ?? item.iD_Area ?? item.id_area ?? idx + 1,
        i_CvePlanta: item.i_CvePlanta ?? item.i_CveCentro ?? idCentro,
        v_NombreArea: item.v_NombreArea || item.v_Nombre || item.v_Area || item.s_NombreArea || `Área #${idx + 1}`,
        v_SiglasArea: item.v_SiglasArea || item.s_SiglasArea || item.v_Siglas || "",
        i_CveContacto: item.i_CveContacto ?? 0,
        v_Descripcion: item.v_Descripcion || item.s_Descripcion || "",
      }));
    }, []);
  },

  /**
   * Obtener un área por ID
   * GET areas/{id_area}/{id_centro}
   */
  async GetAreaById(idArea: number, idCentro: number): Promise<AreaGetDto | null> {
    if (!idArea || !idCentro) return null;
    return httpDefensivo(async () => {
      const resp = await apiClient.get<any>(`areas/${idArea}/${idCentro}`);
      const raw = Array.isArray(resp.data) ? resp.data : resp.data?.datos || [];
      if (Array.isArray(raw) && raw.length > 0) {
        const item = raw[0];
        return {
          i_CveArea: item.i_CveArea ?? idArea,
          i_CvePlanta: item.i_CvePlanta ?? idCentro,
          v_NombreArea: item.v_NombreArea || item.v_Nombre || "",
          v_SiglasArea: item.v_SiglasArea || item.v_Siglas || "",
          i_CveContacto: item.i_CveContacto ?? 0,
        };
      }
      return null;
    }, null);
  },

  /**
   * Crear o Editar área
   * Crear: POST areas { i_CveArea: 0, i_CvePlanta: id_centro, v_NombreArea, v_SiglasArea, i_CveContacto }
   * Editar: POST areas/editar { i_CveArea: id_area, i_CvePlanta: id_centro, v_NombreArea, v_SiglasArea, i_CveContacto }
   */
  async SaveArea(payload: AreaSavePayload): Promise<{ exito: boolean; mensaje?: string }> {
    const centroId = payload.i_CvePlanta;
    if (!centroId || isNaN(Number(centroId))) {
      return { exito: false, mensaje: "ID del centro de trabajo no válido." };
    }

    const isEdit = payload.i_CveArea && payload.i_CveArea > 0;
    const url = isEdit ? "areas/editar" : "areas";

    const body = {
      i_CveArea: payload.i_CveArea ?? 0,
      i_CvePlanta: Number(centroId),
      v_NombreArea: payload.v_NombreArea.trim(),
      v_SiglasArea: (payload.v_SiglasArea || "").trim(),
      i_CveContacto: payload.i_CveContacto ?? 0,
    };

    try {
      const resp = await apiClient.post(url, body);
      if (resp.status >= 200 && resp.status < 300) {
        return { exito: true };
      }
      return { exito: false, mensaje: "No se pudo procesar la solicitud en el servidor." };
    } catch (err: any) {
      console.warn(`[CentrosService] SaveArea fallo en ${url}:`, err?.response?.data || err?.message);
      let msg = "";
      if (err?.response?.data) {
        const data = err.response.data;
        if (typeof data === "string") msg = data;
        else if (data.message || data.Message) msg = data.message || data.Message;
        else if (data.title) msg = data.title;
        else if (data.errors) {
          msg = Object.values(data.errors).flatMap((e: any) => e).join(", ");
        }
      }
      return { exito: false, mensaje: msg || "Ocurrió un error al intentar guardar el área." };
    }
  },

  /**
   * Eliminar área
   * DELETE areas/{id_area}
   */
  async DeleteArea(idArea: number): Promise<boolean> {
    if (!idArea || isNaN(Number(idArea))) return false;
    return httpDefensivo(async () => {
      const resp = await apiClient.delete(`areas/${idArea}`);
      return resp.status >= 200 && resp.status < 300;
    }, false);
  },
};
