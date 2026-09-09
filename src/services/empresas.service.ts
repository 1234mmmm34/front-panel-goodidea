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
      const tenantId = sesion?.id_tenant ?? 1;

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

  /**
   * 1.1 Cargar plantas de la empresa (GET centros/GetAll/{id_empresa})
   */
  async getPlantas(idEmpresa: number): Promise<import("@/types/empresas").PlantaGetDto[]> {
    return httpDefensivo(async () => {
      const resp = await apiClient.get<import("@/types/empresas").PlantaGetDto[]>(`centros/GetAll/${idEmpresa}`);
      return resp.data || [];
    }, []);
  },

  /**
   * 1.2 Generar link de agenda (POST agenda/GenerateTokenAgenda?i_CveEmpresa={id}&i_CvePlanta={id})
   */
  async generarLinkAgenda(idEmpresa: number, idPlanta: number): Promise<string | null> {
    return httpDefensivo(async () => {
      const resp = await apiClient.post<import("@/types/empresas").TokenAgendaResponse>(
        `agenda/GenerateTokenAgenda?i_CveEmpresa=${idEmpresa}&i_CvePlanta=${idPlanta}`
      );
      if (resp.data) {
        if (typeof resp.data === "string") return resp.data;
        if (resp.data.link) return resp.data.link;
        if (resp.data.v_LinkAgenda) return resp.data.v_LinkAgenda;
      }
      return null;
    }, null);
  },

  /**
   * 1.3 Enviar link por correo (POST token/EnviarCorreoCalendario)
   */
  async enviarCorreoCalendario(payload: import("@/types/empresas").EnviarCorreoPayload): Promise<boolean> {
    return httpDefensivo(async () => {
      const resp = await apiClient.post("token/EnviarCorreoCalendario", payload);
      return resp.status >= 200 && resp.status < 300;
    }, false);
  },

  /**
   * 2.1 Listar contactos (GET ContactosXEmpresa/GetAll/{id_empresa})
   */
  async getContactos(idEmpresa: number): Promise<import("@/types/empresas").ContactoXEmpresa[]> {
    return httpDefensivo(async () => {
      const resp = await apiClient.get<import("@/types/empresas").ContactoXEmpresa[]>(`ContactosXEmpresa/GetAll/${idEmpresa}`);
      return resp.data || [];
    }, []);
  },

  /**
   * 2.2 Cargar un contacto por ID (GET ContactosXEmpresa/{id_contacto})
   */
  async getContactoById(idContacto: number): Promise<import("@/types/empresas").ContactoXEmpresa | null> {
    return httpDefensivo(async () => {
      const resp = await apiClient.get<import("@/types/empresas").ContactoXEmpresa[]>(`ContactosXEmpresa/${idContacto}`);
      if (Array.isArray(resp.data) && resp.data.length > 0) {
        return resp.data[0];
      }
      return null;
    }, null);
  },

  /**
   * 2.3 Crear contacto (POST ContactosXEmpresa)
   */
  async crearContacto(payload: Partial<import("@/types/empresas").ContactoXEmpresa>): Promise<boolean> {
    return httpDefensivo(async () => {
      const resp = await apiClient.post("ContactosXEmpresa", payload);
      return resp.status >= 200 && resp.status < 300;
    }, false);
  },

  /**
   * 2.4 Editar contacto (POST ContactosXEmpresa/editar)
   */
  async editarContacto(payload: Partial<import("@/types/empresas").ContactoXEmpresa>): Promise<boolean> {
    return httpDefensivo(async () => {
      const resp = await apiClient.post("ContactosXEmpresa/editar", payload);
      return resp.status >= 200 && resp.status < 300;
    }, false);
  },

  /**
   * 2.5 Eliminar contacto (DELETE ContactosXEmpresa/{id_contacto})
   */
  async eliminarContacto(idContacto: number): Promise<boolean> {
    return httpDefensivo(async () => {
      const resp = await apiClient.delete(`ContactosXEmpresa/${idContacto}`);
      return resp.status >= 200 && resp.status < 300;
    }, false);
  },
};

