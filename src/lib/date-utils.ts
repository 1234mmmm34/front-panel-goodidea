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

export function formatearFechaCorta(fechaStr: string | null): string {
  if (!fechaStr) return "—";
  try {
    const d = new Date(fechaStr);
    if (isToday(d)) return "Hoy";
    const manana = addDays(new Date(), 1);
    if (isSameDay(d, manana)) return "Mañana";
    return format(d, "dd/MMM/yyyy", { locale: es });
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

export {
  format,
  startOfMonth,
  endOfMonth,
  isSameDay,
  addMonths,
  subMonths,
};
