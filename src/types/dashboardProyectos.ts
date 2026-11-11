export type v_Rubro =
  | "SEGURIDAD INDUSTRIAL"
  | "PROTECCIÓN CIVIL"
  | "MEDIO AMBIENTE";

export interface ProyectoDashboardMock {
  i_CveServAgendaDet: number;
  v_Asesor: string;
  v_Rubro: v_Rubro;
  v_Empresa: string;
  v_Servicio: string;
  v_TipoServicio: "Estudios" | "Servicios";
  d_FechaInicio: string; // ISO YYYY-MM-DD
  v_Estatus: "En proceso" | "Terminado";
}

export const HOY_MOCK_ISO = "2026-11-09";

export const RUBROS_MOCK: v_Rubro[] = [
  "SEGURIDAD INDUSTRIAL",
  "PROTECCIÓN CIVIL",
  "MEDIO AMBIENTE",
];

export const PROYECTOS_DASHBOARD_MOCK: ProyectoDashboardMock[] = [
  {
    i_CveServAgendaDet: 1,
    v_Asesor: "ALIX",
    v_Rubro: "SEGURIDAD INDUSTRIAL",
    v_Empresa: "VESUVIUS MÉXICO",
    v_Servicio: "Estudio NOM-017-STPS (EPP)",
    v_TipoServicio: "Estudios",
    d_FechaInicio: "2026-09-15",
    v_Estatus: "En proceso",
  },
  {
    i_CveServAgendaDet: 2,
    v_Asesor: "ALIX",
    v_Rubro: "SEGURIDAD INDUSTRIAL",
    v_Empresa: "CAMAS Y MUEBLES MONTERREY",
    v_Servicio: "Análisis de riesgos NOM-005",
    v_TipoServicio: "Estudios",
    d_FechaInicio: "2026-09-28",
    v_Estatus: "En proceso",
  },
  {
    i_CveServAgendaDet: 3,
    v_Asesor: "ALIX",
    v_Rubro: "SEGURIDAD INDUSTRIAL",
    v_Empresa: "NEMAK MÉXICO",
    v_Servicio: "Estudio de ruido NOM-011",
    v_TipoServicio: "Estudios",
    d_FechaInicio: "2026-10-20",
    v_Estatus: "Terminado",
  },
  {
    i_CveServAgendaDet: 4,
    v_Asesor: "ALIX",
    v_Rubro: "PROTECCIÓN CIVIL",
    v_Empresa: "VESUVIUS MÉXICO",
    v_Servicio: "Plan de contingencias",
    v_TipoServicio: "Servicios",
    d_FechaInicio: "2026-11-03",
    v_Estatus: "En proceso",
  },
  {
    i_CveServAgendaDet: 5,
    v_Asesor: "IVÁN",
    v_Rubro: "SEGURIDAD INDUSTRIAL",
    v_Empresa: "TERNIUM MÉXICO",
    v_Servicio: "Estudio de grado de riesgo NOM-002",
    v_TipoServicio: "Estudios",
    d_FechaInicio: "2026-09-20",
    v_Estatus: "En proceso",
  },
  {
    i_CveServAgendaDet: 6,
    v_Asesor: "IVÁN",
    v_Rubro: "SEGURIDAD INDUSTRIAL",
    v_Empresa: "ABB INSTALLATION PRODUCTS",
    v_Servicio: "Estudio de iluminación NOM-025",
    v_TipoServicio: "Estudios",
    d_FechaInicio: "2026-09-30",
    v_Estatus: "En proceso",
  },
  {
    i_CveServAgendaDet: 7,
    v_Asesor: "IVÁN",
    v_Rubro: "SEGURIDAD INDUSTRIAL",
    v_Empresa: "FRISA FORJADOS",
    v_Servicio: "Estudio de ergonomía NOM-036",
    v_TipoServicio: "Estudios",
    d_FechaInicio: "2026-10-02",
    v_Estatus: "En proceso",
  },
  {
    i_CveServAgendaDet: 8,
    v_Asesor: "IVÁN",
    v_Rubro: "SEGURIDAD INDUSTRIAL",
    v_Empresa: "WATSON-MARLOW",
    v_Servicio: "Estudio NOM-035",
    v_TipoServicio: "Estudios",
    d_FechaInicio: "2026-07-10",
    v_Estatus: "Terminado",
  },
  {
    i_CveServAgendaDet: 9,
    v_Asesor: "IVÁN",
    v_Rubro: "SEGURIDAD INDUSTRIAL",
    v_Empresa: "PANASONIC ENERGY",
    v_Servicio: "Estudio de ruido NOM-011",
    v_TipoServicio: "Estudios",
    d_FechaInicio: "2026-08-05",
    v_Estatus: "Terminado",
  },
  {
    i_CveServAgendaDet: 10,
    v_Asesor: "IVÁN",
    v_Rubro: "PROTECCIÓN CIVIL",
    v_Empresa: "FARMACÉUTICA RACEL",
    v_Servicio: "Programa interno de protección civil",
    v_TipoServicio: "Servicios",
    d_FechaInicio: "2026-11-01",
    v_Estatus: "En proceso",
  },
  {
    i_CveServAgendaDet: 11,
    v_Asesor: "JORGE",
    v_Rubro: "SEGURIDAD INDUSTRIAL",
    v_Empresa: "CEMEX",
    v_Servicio: "Atlas de riesgos",
    v_TipoServicio: "Servicios",
    d_FechaInicio: "2026-10-01",
    v_Estatus: "En proceso",
  },
  {
    i_CveServAgendaDet: 12,
    v_Asesor: "JORGE",
    v_Rubro: "SEGURIDAD INDUSTRIAL",
    v_Empresa: "MANUFACTURAS INDUSTRIALES GAMI",
    v_Servicio: "Estudio NOM-022",
    v_TipoServicio: "Estudios",
    d_FechaInicio: "2026-06-12",
    v_Estatus: "Terminado",
  },
  {
    i_CveServAgendaDet: 13,
    v_Asesor: "JORGE",
    v_Rubro: "SEGURIDAD INDUSTRIAL",
    v_Empresa: "DEACERO",
    v_Servicio: "Estudio de iluminación NOM-025",
    v_TipoServicio: "Estudios",
    d_FechaInicio: "2026-07-22",
    v_Estatus: "Terminado",
  },
  {
    i_CveServAgendaDet: 14,
    v_Asesor: "JORGE",
    v_Rubro: "MEDIO AMBIENTE",
    v_Empresa: "COLLIS DE MÉXICO",
    v_Servicio: "Plan de manejo de residuos",
    v_TipoServicio: "Servicios",
    d_FechaInicio: "2026-08-18",
    v_Estatus: "Terminado",
  },
];

// Asesores únicos en orden alfabético (es-MX)
export const ASESORES_MOCK: string[] = Array.from(
  new Set(PROYECTOS_DASHBOARD_MOCK.map((p) => p.v_Asesor))
).sort((a, b) => a.localeCompare(b, "es"));

const MESES_ABREV = [
  "ene",
  "feb",
  "mar",
  "abr",
  "may",
  "jun",
  "jul",
  "ago",
  "sep",
  "oct",
  "nov",
  "dic",
];

/**
 * Calcula los días naturales transcurridos entre d_FechaInicio y HOY (09/nov/2026)
 */
export function calcularDiasTranscurridos(
  d_FechaInicio: string,
  hoyIso: string = HOY_MOCK_ISO
): number {
  const [y1, m1, d1] = d_FechaInicio.split("T")[0].split("-").map(Number);
  const [y2, m2, d2] = hoyIso.split("T")[0].split("-").map(Number);
  const utcInicio = Date.UTC(y1, m1 - 1, d1);
  const utcHoy = Date.UTC(y2, m2 - 1, d2);
  return Math.round((utcHoy - utcInicio) / 86400000);
}

/**
 * Determina si un proyecto cuenta como "Más de 30 días" (En proceso y días > 30)
 */
export function esProyectoMasDe30Dias(
  proyecto: ProyectoDashboardMock,
  hoyIso: string = HOY_MOCK_ISO
): boolean {
  return (
    proyecto.v_Estatus === "En proceso" &&
    calcularDiasTranscurridos(proyecto.d_FechaInicio, hoyIso) > 30
  );
}

/**
 * Formatea una fecha ISO (YYYY-MM-DD) como dd/mmm/yyyy (ej. 09/nov/2026)
 */
export function formatearFechaMesAbrev(fechaIso: string): string {
  const parts = (fechaIso || "").split("T")[0].split("-");
  if (parts.length < 3) return fechaIso;
  const anio = parts[0];
  const mesIdx = parseInt(parts[1], 10) - 1;
  const dia = parts[2].padStart(2, "0");
  return `${dia}/${MESES_ABREV[mesIdx] || ""}/${anio}`;
}

