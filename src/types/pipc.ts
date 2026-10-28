// Tipos e interfaces oficiales del módulo PIPC conectados al backend

export type PipcSeccionClave =
  | 'generales' | 'inmueble' | 'organizacion' | 'directorios' | 'inventarios' | 'atlas'
  | 'riesgos' | 'mantenimiento' | 'seguridad' | 'anexos' | 'exportar';

export type PipcEstado =
  | 'en_captura' | 'pendiente_cliente' | 'visita_tecnica'
  | 'revision_interna' | 'listo_word' | 'finalizado';

export type PipcZona =
  | 'logo-cliente' | 'politica-seguridad' | 'organigrama' | 'carta-compromiso-comite' | 'vecinos-img'
  | 'layout-general' | 'fotos-generales' | 'layout-emergencias' | 'equipo-emergencia-foto'
  | 'atlas-externo' | 'atlas-interno' | 'sustancias-quimicas' | 'mant-edificio' | 'mant-general'
  | 'equipo-identificacion';

export interface PipcResumen {
  i_CveServAgendaDet: number;
  v_Servicio: string | null;
  v_Empresa: string | null;
  v_Planta: string | null;
  b_Cancelado: boolean;
  b_TienePlanContingencia: boolean;
  d_FechaInicio: string | null;      // primera sesión del servicio
  d_FechaFin: string | null;         // fin de la última sesión vigente del servicio
  v_ConsultorSesion: string | null;  // instructor de la primera sesión
  // null = checklist sin iniciar
  i_CvePipcExpediente: number | null;
  v_Estado: PipcEstado | null;
  i_Avance: number | null;
  i_PendientesAlta: number | null;
  v_Consultor: string | null;
  v_AppVersion: string | null;
  v_SchemaVersion: string | null;
  d_FechaModificacion: string | null;
}

export interface PipcSeccion {
  v_Seccion: PipcSeccionClave;
  v_Json: string | null;   // null = sección nunca guardada
  i_Version: number;       // 0 = nunca guardada
}

export interface PipcArchivo {
  i_CvePipcArchivo: number;
  v_Zona: PipcZona;
  v_NombreOriginal: string;
  v_ContentType: string;
  i_PesoBytes: number;
  i_Orden: number;
  d_FechaCarga: string;
}

export interface PipcExpediente {
  resumen: PipcResumen;
  secciones: PipcSeccion[];
  archivos: PipcArchivo[];
}

export interface PipcSeccionPut {
  v_Seccion: PipcSeccionClave;
  v_Json: string;          // JSON.stringify del estado de la sección
  i_Version: number;       // la versión que se tenía al editar
  v_Estado: PipcEstado;
  i_Avance: number;        // 0–100, avance global calculado en el front
  i_PendientesAlta: number;
  v_Consultor: string | null;
}

export interface PipcSeccionGuardada {
  v_Seccion: PipcSeccionClave;
  i_Version: number;
  d_FechaModificacion: string;
}

export interface PipcArchivoSubido extends PipcArchivo {
  v_KeyAnterior: string | null; // solo informativo; el backend ya borró la anterior
}
