import { MESES_ABREV } from "@/lib/date-utils";
import { claveCola } from "@/lib/asistencia-db";
import { fechaLocalYYYYMMDD } from "@/services/asistencia.service";
import type {
  AsistenciaAlumno,
  AsistenciaRegistro,
  AsistenciaSesion,
  CursoAsistenciaDia,
  EstadoSesion,
} from "@/types/asistencia";

export function obtenerEstadoSesion(
  s: AsistenciaSesion,
  ahora = new Date()
): EstadoSesion {
  const desde = new Date(s.d_HabilitaDesde);
  const hasta = new Date(s.d_HabilitaHasta);
  if (desde <= ahora && ahora < hasta) return "HABILITADA";
  if (ahora < desde) return "PROXIMA";
  return "CERRADA";
}

export function obtenerMapaCola(
  cola: AsistenciaRegistro[]
): Map<string, AsistenciaRegistro> {
  const map = new Map<string, AsistenciaRegistro>();
  for (const reg of cola) {
    map.set(claveCola(reg.i_CveAlumnoAgenda, reg.i_CveAgendaDetalle), reg);
  }
  return map;
}

export function obtenerValorAsistencia(
  alumno: AsistenciaAlumno,
  i_CveAgendaDetalle: number,
  mapaCola: Map<string, AsistenciaRegistro>
): boolean | null {
  const enCola = mapaCola.get(
    claveCola(alumno.i_CveAlumnoAgenda, i_CveAgendaDetalle)
  );
  if (enCola) return enCola.b_Asistio;
  return alumno.b_Asistio;
}

export function formatearHoraLocal(fechaStr: string | null | undefined): string {
  if (!fechaStr) return "--:--";
  const match = fechaStr.match(/T(\d{2}):(\d{2})/);
  if (match) return `${match[1]}:${match[2]}`;
  const d = new Date(fechaStr);
  if (Number.isNaN(d.getTime())) return "--:--";
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(d.getHours())}:${p(d.getMinutes())}`;
}

export function formatearFechaVisible(fechaStr: string | null | undefined): string {
  if (!fechaStr) return "—";
  const iso = fechaStr.slice(0, 10);
  const hoy = fechaLocalYYYYMMDD(new Date());
  const dManana = new Date();
  dManana.setDate(dManana.getDate() + 1);
  const manana = fechaLocalYYYYMMDD(dManana);

  if (iso === hoy) return "Hoy";
  if (iso === manana) return "Mañana";

  const parts = iso.split("-");
  if (parts.length !== 3) return iso;
  const year = parts[0];
  const monthIdx = parseInt(parts[1], 10) - 1;
  const day = parts[2].padStart(2, "0");
  if (monthIdx >= 0 && monthIdx < 12) {
    return `${day}/${MESES_ABREV[monthIdx]}/${year}`;
  }
  return iso;
}

export function formatearActualizado(ultimaDescarga: string | null): string {
  if (!ultimaDescarga) return "Sin descargas";
  const fechaTexto = formatearFechaVisible(ultimaDescarga).toLowerCase();
  const hora = formatearHoraLocal(ultimaDescarga);
  return `Actualizado: ${fechaTexto} ${hora}`;
}

/**
 * Selecciona la sesión en puerta de un curso en el día:
 * 1. Si hay sesión habilitada -> esa (si hay varias, la de inicio más reciente).
 * 2. Si no, la próxima más cercana.
 * 3. Si todas cerraron -> la última.
 */
export function seleccionarSesionEnPuerta(
  sesionesOrdenadas: AsistenciaSesion[],
  ahora = new Date()
): { sesion: AsistenciaSesion; estado: EstadoSesion } {
  const habilitadas = sesionesOrdenadas.filter(
    (s) => obtenerEstadoSesion(s, ahora) === "HABILITADA"
  );
  if (habilitadas.length > 0) {
    const ultima = habilitadas[habilitadas.length - 1];
    return { sesion: ultima, estado: "HABILITADA" };
  }

  const proximas = sesionesOrdenadas.filter(
    (s) => obtenerEstadoSesion(s, ahora) === "PROXIMA"
  );
  if (proximas.length > 0) {
    return { sesion: proximas[0], estado: "PROXIMA" };
  }

  return {
    sesion: sesionesOrdenadas[sesionesOrdenadas.length - 1],
    estado: "CERRADA",
  };
}

/**
 * Agrupa sesiones del día por curso (i_CveServAgendaDet) y ordena:
 * habilitadas primero, luego próximas por hora, luego cerradas.
 */
export function agruparCursosPorDia(
  sesiones: AsistenciaSesion[],
  diaIso: string,
  cola: AsistenciaRegistro[],
  ahora = new Date()
): CursoAsistenciaDia[] {
  const mapaCola = obtenerMapaCola(cola);
  const sesionesDia = sesiones.filter(
    (s) => (s.d_FechaHoraInicio || "").slice(0, 10) === diaIso
  );

  const porCurso = new Map<number, AsistenciaSesion[]>();
  for (const s of sesionesDia) {
    const arr = porCurso.get(s.i_CveServAgendaDet) ?? [];
    arr.push(s);
    porCurso.set(s.i_CveServAgendaDet, arr);
  }

  const cursos: CursoAsistenciaDia[] = [];

  for (const [i_CveServAgendaDet, lista] of porCurso.entries()) {
    const sesionesOrdenadas = [...lista].sort((a, b) =>
      a.d_FechaHoraInicio.localeCompare(b.d_FechaHoraInicio)
    );
    const { sesion: sesionEnPuerta, estado: estadoEnPuerta } =
      seleccionarSesionEnPuerta(sesionesOrdenadas, ahora);

    const inscritos = sesionEnPuerta.inscritos ?? [];
    let totalPresentes = 0;
    for (const al of inscritos) {
      if (
        obtenerValorAsistencia(al, sesionEnPuerta.i_CveAgendaDetalle, mapaCola) ===
        true
      ) {
        totalPresentes++;
      }
    }

    const idsSesionesCurso = new Set(
      sesionesOrdenadas.map((s) => s.i_CveAgendaDetalle)
    );
    let sinSincronizar = 0;
    for (const reg of cola) {
      if (idsSesionesCurso.has(reg.i_CveAgendaDetalle)) {
        sinSincronizar++;
      }
    }

    cursos.push({
      i_CveServAgendaDet,
      v_Servicio: sesionEnPuerta.v_Servicio || "Capacitación sin título",
      v_Empresa: sesionEnPuerta.v_Empresa,
      v_Planta: sesionEnPuerta.v_Planta,
      v_Area: sesionEnPuerta.v_Area,
      sesiones: sesionesOrdenadas,
      sesionEnPuerta,
      estadoEnPuerta,
      totalInscritos: inscritos.length,
      totalPresentes,
      sinSincronizar,
    });
  }

  const prioridadEstado: Record<EstadoSesion, number> = {
    HABILITADA: 0,
    PROXIMA: 1,
    CERRADA: 2,
  };

  cursos.sort((a, b) => {
    const pDiff =
      prioridadEstado[a.estadoEnPuerta] - prioridadEstado[b.estadoEnPuerta];
    if (pDiff !== 0) return pDiff;
    return a.sesionEnPuerta.d_FechaHoraInicio.localeCompare(
      b.sesionEnPuerta.d_FechaHoraInicio
    );
  });

  return cursos;
}
