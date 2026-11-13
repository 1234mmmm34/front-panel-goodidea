export interface DashboardProyecto {
  i_CveServAgendaDet: number;
  i_CveAgenda: number;
  v_Empresa: string;
  v_Planta: string | null;
  v_Servicio: string;
  v_TipoServicio: string; // "Estudios" | "Servicios"
  i_CveTipoServicio: number;
  i_CveRubro: number | null;
  v_Rubro: string;
  d_FechaInicio: string;
  d_FechaFin: string | null;
  b_Terminado: boolean;
  v_Estatus: "En proceso" | "Terminado";
  i_DiasTranscurridos: number | null; // días desde su inicio; null si Terminado
  b_MasDe30Dias: boolean; // En proceso y más de 30 días desde su inicio
  v_Asesores: string | null; // asesores separados por coma
}

export interface DashboardProyectoAsesor {
  i_CveServAgendaDet: number;
  i_CveInstructor: number;
  v_Asesor: string;
}

export interface DashboardRubroOpcion {
  i_CveRubro: number;
  v_Nombre: string;
}

export interface DashboardAsesorOpcion {
  i_CveInstructor: number;
  v_Asesor: string;
}

export interface DashboardProyectos {
  proyectos: DashboardProyecto[];
  asignaciones: DashboardProyectoAsesor[];
  rubros: DashboardRubroOpcion[];
  asesores: DashboardAsesorOpcion[];
}

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

const TITULOS_Y_PARTICULAS = new Set([
  "DR",
  "DRA",
  "ING",
  "LIC",
  "MTRO",
  "MTRA",
  "ARQ",
  "CP",
  "DE",
  "DEL",
  "LA",
  "LAS",
  "LOS",
  "Y",
]);

function normalizarPalabra(palabra: string): string {
  return palabra
    .replace(/\./g, "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase();
}

/**
 * Iniciales de un nombre del personal: primera letra de cada palabra, en mayúsculas.
 * Ignora títulos y partículas: DR, DRA, ING, LIC, MTRO, MTRA, ARQ, C.P., DE, DEL, LA, LAS, LOS, Y.
 * "ALIX CASANOVA" → "AC" · "DR. EMILIANO MACIAS" → "EM" · "JORGE ALFREDO CRUZ" → "JAC"
 */
export function obtenerIniciales(nombre: string | null | undefined): string {
  if (!nombre) return "";
  const palabrasOriginales = nombre
    .trim()
    .split(/\s+/)
    .map((w) => normalizarPalabra(w))
    .filter(Boolean);

  if (palabrasOriginales.length === 0) return "";

  const filtradas = palabrasOriginales.filter(
    (w) => !TITULOS_Y_PARTICULAS.has(w)
  );
  const base = filtradas.length > 0 ? filtradas : palabrasOriginales;
  return base.map((w) => w.charAt(0)).join("");
}

/**
 * Mapa nombre completo → etiqueta corta para un conjunto de nombres.
 * Si dos personas comparten iniciales, a ambas se les agrega un número: "AC1", "AC2"
 * (orden alfabético del nombre completo), para que nunca se confundan en una gráfica.
 */
export function mapaIniciales(nombres: string[]): Map<string, string> {
  const unicos = Array.from(
    new Set(nombres.map((n) => n.trim()).filter(Boolean))
  ).sort((a, b) => a.localeCompare(b, "es"));

  const grupos = new Map<string, string[]>();
  for (const nombre of unicos) {
    const ini = obtenerIniciales(nombre);
    const lista = grupos.get(ini) ?? [];
    lista.push(nombre);
    grupos.set(ini, lista);
  }

  const resultado = new Map<string, string>();
  for (const [ini, lista] of grupos.entries()) {
    if (lista.length === 1) {
      resultado.set(lista[0], ini);
    } else {
      lista.forEach((nombre, idx) => {
        resultado.set(nombre, `${ini}${idx + 1}`);
      });
    }
  }
  return resultado;
}

/**
 * Convierte una lista separada por comas de nombres ("ALIX CASANOVA, IVÁN LÓPEZ")
 * a sus iniciales usando mapaIniciales ("AC, IL").
 */
export function formatearAsesoresIniciales(
  v_Asesores: string | null | undefined,
  inicialesMap: Map<string, string>
): string {
  if (!v_Asesores || !v_Asesores.trim()) return "—";
  return v_Asesores
    .split(",")
    .map((n) => n.trim())
    .filter(Boolean)
    .map((n) => inicialesMap.get(n) ?? obtenerIniciales(n))
    .join(", ");
}
