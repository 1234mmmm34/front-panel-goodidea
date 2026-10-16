export interface T_Perfiles {
  i_CvePerfil: number;
  i_CveTenant: number;
  v_NombrePerfil: string;
  v_Descripcion: string;
  i_CveFuncionalidadInicio: number | null; // NUEVO: id de la ruta hija que es la página de inicio
}

export interface RutasPerfilesGetDto {
  i_CveFuncionalidad: number;
  v_NombreFuncionalidad: string;
  v_RutaFuncionalidad: string;
  i_SCveFuncionalidad: number; // padre; 0 = raíz
  i_Flag: number;              // 1 = la ruta está habilitada para el perfil
  v_Icon: string | null;
}

export interface RutasPerfilResponse {
  rutasRaiz: RutasPerfilesGetDto[];   // i_SCveFuncionalidad == 0
  rutasHijas: RutasPerfilesGetDto[];  // i_SCveFuncionalidad != 0
}

export interface T_RutasPerfiles {
  i_CveRPerfiles: number;
  i_CveFuncionalidad: number;
  i_CvePerfil: number;
}

export interface PerfilPayload {
  Perfil: {
    i_CvePerfil: number;
    v_NombrePerfil: string;
    v_Descripcion: string;
    i_CveFuncionalidadInicio: number | null; // NUEVO
  };
  Rutas: T_RutasPerfiles[];
}

export interface RutaInicioPerfilResponse {
  v_RutaInicio: string | null;
}

export interface ResultadoRespuestaPerfiles {
  exito: boolean;
  mensaje?: string;
}
