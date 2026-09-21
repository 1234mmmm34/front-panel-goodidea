import { apiClient, httpDefensivo } from "@/lib/api-client";
import { InstructorDto } from "@/types/instructores";
import { PaginadoResponse } from "@/types/servicios";

export const InstructoresService = {
  /**
   * GET instructores (Lista completa sin paginar)
   */
  async getTodos(): Promise<InstructorDto[]> {
    return httpDefensivo(async () => {
      const resp = await apiClient.get<any>("instructores");
      const raw = Array.isArray(resp.data)
        ? resp.data
        : resp.data?.datos || resp.data?.data || resp.data?.Datos || [];
      return Array.isArray(raw) ? raw : [];
    }, []);
  },

  /**
   * GET instructores/Simple/GetAll?searchTerm=&pagina=&tamano=
   */
  async getPaginado(params: {
    searchTerm?: string;
    pagina: number;
    tamano: number;
  }): Promise<PaginadoResponse<InstructorDto>> {
    return httpDefensivo(
      async () => {
        const queryParams: Record<string, string | number> = {
          pagina: params.pagina,
          tamano: params.tamano,
        };
        if (params.searchTerm && params.searchTerm.trim() !== "") {
          queryParams.searchTerm = params.searchTerm.trim();
        }

        const resp = await apiClient.get<any>("instructores/Simple/GetAll", {
          params: queryParams,
        });

        const data = resp.data;
        let rawDatos: InstructorDto[] = [];
        let total = 0;
        let totalPaginas = 1;

        if (Array.isArray(data)) {
          rawDatos = data;
          total = data.length;
        } else if (data && typeof data === "object") {
          if (Array.isArray(data.datos)) rawDatos = data.datos;
          else if (Array.isArray(data.data)) rawDatos = data.data;
          else if (Array.isArray(data.Datos)) rawDatos = data.Datos;

          total = data.total ?? data.Total ?? data.i_TotalRegistros ?? rawDatos.length;
          totalPaginas =
            (data.totalPaginas ??
            data.TotalPaginas ??
            Math.ceil(total / (params.tamano || 10))) || 1;
        }

        return {
          datos: rawDatos,
          total,
          pagina: params.pagina,
          tamano: params.tamano,
          totalPaginas,
        };
      },
      {
        datos: [],
        total: 0,
        pagina: params.pagina,
        tamano: params.tamano,
        totalPaginas: 1,
      }
    );
  },

  /**
   * GET instructores/Simple/{i_CveInstructor}
   */
  async getById(id: number): Promise<InstructorDto | null> {
    return httpDefensivo(async () => {
      const resp = await apiClient.get<InstructorDto>(`instructores/Simple/${id}`);
      return resp.data || null;
    }, null);
  },

  /**
   * POST / PUT instructores/Simple
   * Probamos las combinaciones posibles del controlador de ASP.NET Core (POST/PUT a /Simple, /Save, /Guardar, /Post, /Insert, etc.)
   */
  async crear(data: {
    v_Nombre: string;
    v_Email: string | null;
  }): Promise<{ exito: boolean; data?: InstructorDto; mensaje?: string }> {
    const payloadConZero = {
      i_CveInstructor: 0,
      v_Nombre: data.v_Nombre,
      v_Email: data.v_Email,
    };
    const payloadSinZero = {
      v_Nombre: data.v_Nombre,
      v_Email: data.v_Email,
    };

    const intentos: Array<{ metodo: "post" | "put"; ruta: string; payload: any }> = [
      { metodo: "post", ruta: "instructores/Simple", payload: payloadSinZero },
      { metodo: "put", ruta: "instructores/Simple", payload: payloadConZero },
      { metodo: "post", ruta: "instructores/Simple", payload: payloadConZero },
      { metodo: "put", ruta: "instructores/Simple", payload: payloadSinZero },
      { metodo: "post", ruta: "instructores/Save", payload: payloadConZero },
      { metodo: "post", ruta: "instructores/Guardar", payload: payloadConZero },
      { metodo: "post", ruta: "instructores/Post", payload: payloadConZero },
      { metodo: "post", ruta: "instructores/Insert", payload: payloadConZero },
      { metodo: "post", ruta: "instructores", payload: payloadSinZero },
      { metodo: "put", ruta: "instructores", payload: payloadConZero },
      { metodo: "post", ruta: "instructores/Simple/Save", payload: payloadConZero },
      { metodo: "post", ruta: "instructores/Simple/Create", payload: payloadConZero },
    ];

    let ultimoError: any = null;

    for (const intento of intentos) {
      try {
        console.log(`[InstructoresService] Probando ${intento.metodo.toUpperCase()} ${intento.ruta}...`);
        const resp =
          intento.metodo === "put"
            ? await apiClient.put<InstructorDto>(intento.ruta, intento.payload)
            : await apiClient.post<InstructorDto>(intento.ruta, intento.payload);
        
        console.log(`[InstructoresService] ✅ ÉXITO en ${intento.metodo.toUpperCase()} ${intento.ruta}`, resp.data);
        return { exito: true, data: resp.data };
      } catch (err: any) {
        ultimoError = err;
        const status = err?.response?.status;
        if (status === 405 || status === 404) {
          continue;
        }
        break; // Si retorna un status distinto a 405/404 (ej. 400 bad request o 200/201), detener
      }
    }

    const mensaje =
      ultimoError?.response?.data?.mensaje ||
      ultimoError?.response?.data?.message ||
      ultimoError?.response?.data?.error ||
      ultimoError?.message ||
      "Error al crear el instructor.";
    return { exito: false, mensaje };
  },

  /**
   * PUT instructores/Simple
   * Body: { i_CveInstructor: number, v_Nombre: string, v_Email: string | null }
   * En caso de HTTP 405/404, prueba fallbacks (PUT/POST en instructores, instructores/editar, etc.)
   */
  async actualizar(data: {
    i_CveInstructor: number;
    v_Nombre: string;
    v_Email: string | null;
  }): Promise<{ exito: boolean; data?: InstructorDto; mensaje?: string }> {
    const intentos: Array<{ metodo: "put" | "post"; ruta: string }> = [
      { metodo: "put", ruta: "instructores/Simple" },
      { metodo: "put", ruta: "instructores" },
      { metodo: "put", ruta: "instructores/simple" },
      { metodo: "post", ruta: "instructores/Simple" },
      { metodo: "post", ruta: "instructores/editar" },
      { metodo: "post", ruta: "instructores" },
    ];
    let ultimoError: any = null;

    for (const intento of intentos) {
      try {
        const resp =
          intento.metodo === "put"
            ? await apiClient.put<InstructorDto>(intento.ruta, data)
            : await apiClient.post<InstructorDto>(intento.ruta, data);
        return { exito: true, data: resp.data };
      } catch (err: any) {
        ultimoError = err;
        const status = err?.response?.status;
        if (status === 405 || status === 404) {
          console.warn(`[InstructoresService] ${intento.metodo.toUpperCase()} '${intento.ruta}' devolvió HTTP ${status}, intentando opción alternativa...`);
          continue;
        }
        break;
      }
    }

    const mensaje =
      ultimoError?.response?.data?.mensaje ||
      ultimoError?.response?.data?.message ||
      ultimoError?.response?.data?.error ||
      ultimoError?.message ||
      "Error al actualizar el instructor.";
    return { exito: false, mensaje };
  },

  /**
   * DELETE instructores/{i_CveInstructor}
   */
  async eliminar(id: number): Promise<{ exito: boolean; mensaje?: string }> {
    const rutas = [`instructores/${id}`, `instructores/Simple/${id}`, `instructores/simple/${id}`];
    let ultimoError: any = null;

    for (const ruta of rutas) {
      try {
        await apiClient.delete(ruta);
        return { exito: true };
      } catch (err: any) {
        ultimoError = err;
        const status = err?.response?.status;
        if (status === 405 || status === 404) {
          console.warn(`[InstructoresService] DELETE '${ruta}' devolvió HTTP ${status}, intentando opción alternativa...`);
          continue;
        }
        break;
      }
    }

    const mensaje =
      ultimoError?.response?.data?.mensaje ||
      ultimoError?.response?.data?.message ||
      ultimoError?.response?.data?.error ||
      ultimoError?.message ||
      "Error al eliminar el instructor.";
    return { exito: false, mensaje };
  },
};
