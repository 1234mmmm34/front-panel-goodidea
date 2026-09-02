import { apiClient, httpDefensivo } from "@/lib/api-client";
import { entregables, Norma, rubros, unidades } from "@/types/catalogos";
import { tiposServicios } from "@/types/servicios";

export const CatalogosService = {
  async getRubros(): Promise<rubros[]> {
    return httpDefensivo(async () => {
      const resp = await apiClient.get<rubros[]>("rubros/GetAll");
      return resp.data || [];
    }, []);
  },

  async getTiposServicios(): Promise<tiposServicios[]> {
    return httpDefensivo(async () => {
      const resp = await apiClient.get<tiposServicios[]>("tiposservicios/GetAll");
      return resp.data || [];
    }, []);
  },

  async getUnidades(): Promise<unidades[]> {
    return httpDefensivo(async () => {
      const resp = await apiClient.get<unidades[]>("unidades/GetAll");
      return resp.data || [];
    }, []);
  },

  async getNormas(searchTerm?: string): Promise<Norma[]> {
    return httpDefensivo(async () => {
      const url = searchTerm ? "normas/busqueda_noms" : "normas";
      const params = searchTerm ? { searchTerm } : undefined;
      const resp = await apiClient.get<Norma[]>(url, { params });
      return resp.data || [];
    }, []);
  },

  async getEntregables(): Promise<entregables[]> {
    return httpDefensivo(async () => {
      const resp = await apiClient.get<entregables[]>("entregables");
      return resp.data || [];
    }, []);
  },
};
