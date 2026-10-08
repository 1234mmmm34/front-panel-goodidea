export interface T_Rutas {
  i_CveFuncionalidad: number;
  v_NombreFuncionalidad: string;
  v_RutaFuncionalidad: string;   // "" en rutas padre
  i_SCveFuncionalidad: number;   // 0 = ruta padre; en hijas = id de su padre
  v_Icon: string | null;         // clase de Bootstrap Icons, solo rutas padre ("" en hijas)
  i_Orden: number;               // posición en el menú (padres entre sí; hijas dentro de su padre)
}

export interface RutaDto {
  i_CvePerfil: number;
  v_Ruta: string;      // URL de la opción (ruta hija), ej. "/facturas"
  v_RutaRaiz: string;  // nombre del grupo (ruta padre), ej. "Finanzas"
  v_RutaHija: string;  // nombre de la opción, ej. "Facturas"
  v_Icon: string | null; // ícono del grupo, clase de Bootstrap Icons, ej. "bi bi-cash-stack"
}

export interface ResultadoRespuestaRutas {
  exito: boolean;
  mensaje?: string;
}
