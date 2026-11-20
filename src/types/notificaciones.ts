export interface NotificacionDto {
  i_CveNotificacion: number;
  v_Tipo: string; // 'ACTIVIDAD_ASIGNADA'
  v_Titulo: string; // "Nueva actividad asignada"
  v_Mensaje: string | null; // "Mariana Urquidy te asignó «...»"
  v_Ruta: string | null; // "/actividades?actividad=123"
  i_CveReferencia: number | null;
  d_FechaRegistro: string;
  b_Leida: boolean;
}

export interface NotificacionesResponse {
  i_NoLeidas: number;
  Notificaciones: NotificacionDto[];
}
