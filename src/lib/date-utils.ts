import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  isSameMonth,
  isSameDay,
  isToday,
  addMonths,
  subMonths,
} from "date-fns";
import { es } from "date-fns/locale";

export function capitalizar(str: string): string {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Remueve decimales innecesarios de cadenas numéricas o formateadas (ej. "1.00 pts" -> "1 pts", "2.50" -> "2.5").
 */
export function limpiarDecimales(val: string | number | null | undefined): string {
  if (val === null || val === undefined || val === "") return "—";
  let str = String(val).trim();
  // 1. Reemplazar ceros decimales redondos: "1.00", "1.00 pts", "10.00 Pts" -> "1", "1 pts", "10 Pts"
  str = str.replace(/(\d+)\.00(?=\s|$|[a-zA-Z])/g, "$1");
  // 2. Reemplazar ceros sobrantes a la derecha después de decimal: "2.50 pts" -> "2.5 pts"
  str = str.replace(/(\d+\.[1-9])0+(?=\s|$|[a-zA-Z])/g, "$1");
  return str;
}

export function obtenerMesLabel(fecha: Date): string {
  const label = format(fecha, "MMMM yyyy", { locale: es });
  return capitalizar(label);
}

export function formatearFechaLarga(fechaStr: string | null): string {
  if (!fechaStr) return "—";
  try {
    const d = new Date(fechaStr);
    const texto = format(d, "EEEE d 'de' MMMM", { locale: es });
    return capitalizar(texto);
  } catch {
    return fechaStr;
  }
}

export function formatearHora(fechaStr: string | null): string {
  if (!fechaStr) return "--:--";
  try {
    const d = new Date(fechaStr);
    return format(d, "HH:mm");
  } catch {
    return "--:--";
  }
}

export const MESES_ABREV = [
  "ene", "feb", "mar", "abr", "may", "jun",
  "jul", "ago", "sep", "oct", "nov", "dic"
];

export function formatearFechaTexto(fechaIso: string | null | undefined): string {
  if (!fechaIso) return "";
  const str = fechaIso.split("T")[0];
  const parts = str.split("-");
  if (parts.length !== 3) return fechaIso;
  const year = parts[0];
  const monthIdx = parseInt(parts[1], 10) - 1;
  const day = parts[2].padStart(2, "0");
  if (monthIdx >= 0 && monthIdx < 12) {
    return `${day}/${MESES_ABREV[monthIdx]}/${year}`;
  }
  return fechaIso;
}

export function formatearFechaBonita(str?: string): string {
  if (!str) return "";
  const clean = str.split("T")[0];
  const parts = clean.split("-");
  if (parts.length !== 3) return str;
  const year = parts[0];
  const monthIdx = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  const meses = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
  return `${day} ${meses[monthIdx] || ""} ${year}`;
}

export function formatearFechaCorta(fechaStr: string | null): string {
  if (!fechaStr) return "—";
  try {
    const d = new Date(fechaStr);
    if (isToday(d)) return "Hoy";
    const manana = addDays(new Date(), 1);
    if (isSameDay(d, manana)) return "Mañana";
    const res = format(d, "dd/MMM/yyyy", { locale: es });
    return res.replace(/\./g, "").toLowerCase();
  } catch {
    return fechaStr;
  }
}

export interface CeldaCalendario {
  fecha: Date;
  esMesActual: boolean;
  esHoy: boolean;
  claveIso: string;
}

/**
 * Genera el grid de días para el calendario mensual.
 * Corta exactamente la 6ª fila si esa fila completa ya no pertenece al mes actual.
 */
export function generarGridCalendario(mesActual: Date): CeldaCalendario[] {
  const inicioMes = startOfMonth(mesActual);
  // Domingo como primer día de la semana
  const inicioGrid = startOfWeek(inicioMes, { weekStartsOn: 0 });

  const celdas: CeldaCalendario[] = [];
  let fechaIter = inicioGrid;

  // Generamos hasta 6 semanas (42 días)
  for (let semana = 0; semana < 6; semana++) {
    const celdasSemana: CeldaCalendario[] = [];
    let semanaPerteneceAlMes = false;

    for (let dia = 0; dia < 7; dia++) {
      const pertenece = isSameMonth(fechaIter, mesActual);
      if (pertenece) {
        semanaPerteneceAlMes = true;
      }

      celdasSemana.push({
        fecha: new Date(fechaIter),
        esMesActual: pertenece,
        esHoy: isToday(fechaIter),
        claveIso: format(fechaIter, "yyyy-MM-dd"),
      });

      fechaIter = addDays(fechaIter, 1);
    }

    // Regla de corte: si la 6ª fila entera está fuera del mes actual, la descartamos
    if (semana === 5 && !semanaPerteneceAlMes) {
      break;
    }

    celdas.push(...celdasSemana);
  }

  return celdas;
}

/**
 * Determina si una fecha (en formato ISO o string) es estrictamente anterior a hoy (días pasados).
 * Las fechas del día de hoy y futuras retornan false (NO han pasado, sí se pueden reprogramar).
 */
export function esFechaPasada(fechaIsoStr: string | null | undefined): boolean {
  if (!fechaIsoStr) return false;
  try {
    const str = fechaIsoStr.split("T")[0];
    const parts = str.split("-");
    if (parts.length !== 3) return false;
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10) - 1;
    const d = parseInt(parts[2], 10);
    if (isNaN(y) || isNaN(m) || isNaN(d)) return false;

    const fechaSesion = new Date(y, m, d);
    const hoy = new Date();
    const hoyMidnight = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());

    return fechaSesion.getTime() < hoyMidnight.getTime();
  } catch {
    return false;
  }
}

export interface InfoRetraso {
  dias: number;
  esVencido: boolean;
  texto: string;
}

/**
 * Calcula los días de retraso de un pago o abono.
 * - Si ya está PAGADO (iEstado === 1): compara la fecha real de pago (fechaPagoStr) vs la fecha programada (fechaProgStr).
 * - Si está PENDIENTE (iEstado === 0): compara la fecha de hoy vs la fecha programada (fechaProgStr).
 * - Si está CANCELADO (iEstado === 2): retorna null.
 */
export function calcularDiasRetraso(
  fechaProgStr?: string | null,
  fechaPagoStr?: string | null,
  iEstado: number = 0
): InfoRetraso | null {
  if (iEstado === 2 || !fechaProgStr) return null;

  try {
    const cleanProg = fechaProgStr.split("T")[0];
    const partsProg = cleanProg.split("-");
    if (partsProg.length !== 3) return null;

    const yearP = parseInt(partsProg[0], 10);
    const monthP = parseInt(partsProg[1], 10) - 1;
    const dayP = parseInt(partsProg[2], 10);
    if (isNaN(yearP) || isNaN(monthP) || isNaN(dayP)) return null;
    const progDate = new Date(yearP, monthP, dayP);

    if (iEstado === 1) {
      // Pagado
      if (!fechaPagoStr) return { dias: 0, esVencido: false, texto: "A tiempo" };
      const cleanPago = fechaPagoStr.split("T")[0];
      const partsPago = cleanPago.split("-");
      if (partsPago.length !== 3) return { dias: 0, esVencido: false, texto: "A tiempo" };

      const yearReal = parseInt(partsPago[0], 10);
      const monthReal = parseInt(partsPago[1], 10) - 1;
      const dayReal = parseInt(partsPago[2], 10);
      if (isNaN(yearReal) || isNaN(monthReal) || isNaN(dayReal)) {
        return { dias: 0, esVencido: false, texto: "A tiempo" };
      }
      const pagoDate = new Date(yearReal, monthReal, dayReal);

      const diffMs = pagoDate.getTime() - progDate.getTime();
      const diffDias = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffDias > 0) {
        return {
          dias: diffDias,
          esVencido: true,
          texto: `${diffDias} ${diffDias === 1 ? "día" : "días"}`,
        };
      }
      return { dias: 0, esVencido: false, texto: "A tiempo" };
    } else if (iEstado === 0) {
      // Pendiente
      const hoy = new Date();
      const hoyMidnight = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
      const diffMs = hoyMidnight.getTime() - progDate.getTime();
      const diffDias = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffDias > 0) {
        return {
          dias: diffDias,
          esVencido: true,
          texto: `${diffDias} ${diffDias === 1 ? "día" : "días"}`,
        };
      }
      return { dias: 0, esVencido: false, texto: "En tiempo" };
    }
  } catch {
    return null;
  }

  return null;
}

export {
  format,
  startOfMonth,
  endOfMonth,
  isSameDay,
  addDays,
  addMonths,
  subMonths,
};

