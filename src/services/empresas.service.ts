import { apiClient, httpDefensivo, obtenerSesionActual } from "@/lib/api-client";
import { EmpresaGetDto, EmpresaPostPayload, SP_CodigoPostal } from "@/types/empresas";

export const EmpresasService = {
  /**
   * Módulo 4 — Catálogo de Clientes
   * Obtiene la lista completa de empresas del tenant o realiza búsqueda por término.
   */
  async getEmpresas(searchTerm?: string): Promise<EmpresaGetDto[]> {
    return httpDefensivo(async () => {
      const sesion = await obtenerSesionActual();
      const tenantId = sesion?.IdTenant ?? 1;

      let url = `empresas/${tenantId}`;
      const params: Record<string, string> = {};

      if (searchTerm && searchTerm.trim().length > 0) {
        url = `empresas/busqueda_empresas/${tenantId}`;
        params.searchTerm = searchTerm.trim();
      }

      const resp = await apiClient.get<EmpresaGetDto[]>(url, { params });
      return resp.data || [];
    }, []);
  },

  /**
   * Obtiene una empresa por ID. Normaliza el retorno (el backend devuelve un array `EmpresaGetDto[]`).
   */
  async getById(id: number): Promise<EmpresaGetDto | null> {
    return httpDefensivo(async () => {
      const resp = await apiClient.get<EmpresaGetDto[] | EmpresaGetDto>(`empresas/GetEmpresaById/${id}`);
      if (Array.isArray(resp.data)) {
        return resp.data[0] ?? null;
      }
      return resp.data ?? null;
    }, null);
  },

  /**
   * Crea una nueva empresa / cliente.
   */
  async crear(payload: EmpresaPostPayload): Promise<boolean> {
    return httpDefensivo(async () => {
      const resp = await apiClient.post("empresas", payload);
      return resp.status >= 200 && resp.status < 300;
    }, false);
  },

  /**
   * Edita una empresa existente.
   */
  async editar(payload: EmpresaPostPayload): Promise<boolean> {
    return httpDefensivo(async () => {
      const resp = await apiClient.post("empresas/editar", payload);
      return resp.status >= 200 && resp.status < 300;
    }, false);
  },

  /**
   * Elimina una empresa por ID.
   */
  async eliminar(id: number): Promise<boolean> {
    return httpDefensivo(async () => {
      const resp = await apiClient.delete(`empresas/borrar/${id}`);
      return resp.status >= 200 && resp.status < 300;
    }, false);
  },

  /**
   * Busca información geográfica a partir de un Código Postal.
   */
  async buscarCodigoPostal(cp: number | string): Promise<SP_CodigoPostal[]> {
    return httpDefensivo(async () => {
      const resp = await apiClient.get<SP_CodigoPostal[]>("Domicilios/busqueda_CPostal", {
        params: { codigoPostal: cp },
      });
      return resp.data || [];
    }, []);
  },
};
