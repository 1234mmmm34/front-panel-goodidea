"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  RefreshCw,
  Search,
  Eye,
  X,
  Edit2,
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Circle,
  Upload,
  ChevronDown,
  ChevronUp,
  Ban,
  Plus,
  History,
  User,
  Check,
} from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { PaginadorCustom } from "@/components/ui/PaginadorCustom";
import { BadgeTipoServicio } from "@/components/ui/BadgeTipoServicio";
import DateRangePickerPopover from "@/components/ui/DateRangePickerPopover";
import { formatearFechaTexto } from "@/lib/date-utils";
import { obtenerSesionActual } from "@/lib/api-client";
import { useToast } from "@/context/ToastContext";

// ============================================================================
// 1. TIPOS (MOCK — §6)
// ============================================================================

export interface AvanceHistorialMock {
  d_Fecha: string; // ISO
  v_Usuario: string;
  i_PorcentajeAvance: number;
  v_Nota: string | null;
}

export interface EntregableMock {
  i_CveAgendaEntregable: number;
  v_Entregable: string; // Diploma | DC-3 | Licencia | Estudio | Piezas | Plan de contingencia
  v_NombreArchivo: string | null; // archivo del entregable
  v_NombreArchivoCarta: string | null; // carta de entrega del mismo entregable
  b_Entregado: boolean;
}

export interface SesionDetalleMock {
  i_CveAgendaDetalle: number;
  i_Orden: number;
  d_FechaHoraInicio: string;
  d_FechaHoraFin: string;
  v_Titular: string;
  v_Apoyo: string | null;
  v_EstatusSesion: "Completada" | "Programado" | "Reprogramada" | "Cancelado";
}

export interface ServicioAvanceMock {
  i_CveServAgendaDet: number;
  v_Empresa: string;
  v_Planta: string;
  v_Servicio: string;
  i_Cantidad: number;
  v_Unidad: string;
  v_TipoServicio: "Servicios" | "Estudios" | "Capacitación";
  d_FechaInicio: string; // ISO
  d_FechaFin: string; // ISO, fecha fin estimada
  d_FechaTermino: string | null; // ISO, cuando se confirmó el término
  v_ConfirmadoPor?: string | null;
  v_Estatus: "Programado" | "En proceso" | "Por confirmar" | "Terminado";
  v_TitularApoyo: string;
  v_Notas: string | null;
  b_AplicaVoBo: boolean;
  v_NombreArchivoVoBo?: string | null;
  i_PorcentajeAvance: number; // 0–100
  historial: AvanceHistorialMock[];
  entregables: EntregableMock[];
  sesiones: SesionDetalleMock[];
}

export type EstatusFilaAgenda = "En curso" | "Programado" | "Terminado";

export interface SesionMock {
  i_CveAgendaDetalle: number;
  i_Orden?: number;
  v_Actividad: string; // "Sesión 1" | "Sesión 2" | "Inicio" | "Fin" | "Inicio y fin"
  v_ModoHorario: "rango" | "inicio" | "fin";
  d_FechaHoraInicio: string;
  d_FechaHoraFin: string;
  v_Empresa: string;
  v_Planta: string;
  v_Servicio: string;
  v_TipoServicio: "Servicios" | "Estudios" | "Capacitación";
  v_Duracion: string;
  v_TitularApoyo: string;
  v_Estatus: EstatusFilaAgenda;
  i_CveServAgendaDet: number | null;
}

export interface ActividadMock {
  i_CveActividad: number;
  v_Titulo: string; // máx. 20 caracteres
  b_General: boolean; // true = no ligada a proyecto
  i_CveServAgendaDet: number | null; // proyecto ligado (null si es general)
  d_FechaInicio: string; // ISO, fecha (y hora si b_TieneHorario)
  d_FechaFin: string; // ISO, fecha (y hora si b_TieneHorario)
  b_TieneHorario: boolean;
  v_Notas: string | null;
  v_Estatus: "Activa" | "Reprogramada" | "Cancelada";
  i_CveReprograma: number | null; // apunta a la nueva actividad si fue reprogramada
  v_Motivo: string | null; // motivo de reprogramación o cancelación
  v_Registro: string; // consultor que la registró
}

export type MomentoActividadFila = "unico" | "inicio" | "fin";

export type AgendaConsultorFila =
  | { tipo: "sesion"; sesion: SesionMock }
  | {
      tipo: "actividad";
      actividad: ActividadMock;
      momento: MomentoActividadFila;
    };

// ============================================================================
// 2. CONSTANTES Y CÁLCULO DE DÍAS
// ============================================================================

const HOY_MOCK = "2026-11-06";
const AHORA_MOCK = "2026-11-06T11:30:00";
const COLOR_VERDE_AVANCE = "#16a34a";
const COLOR_ROJO_ALERTA = "#DC3545";

function parseIsoDateOnly(iso: string): Date {
  const clean = iso.split("T")[0];
  const [y, m, d] = clean.split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

function diffNaturalDays(fechaFinIso: string, fechaInicioIso: string): number {
  const dFin = parseIsoDateOnly(fechaFinIso);
  const dIni = parseIsoDateOnly(fechaInicioIso);
  return Math.round((dFin.getTime() - dIni.getTime()) / 86400000);
}

export interface CalculoDiasServicio {
  i_DiasTotales: number;
  i_DiasExcedidos: number;
  i_DiasTranscurridos: number;
  i_DiasRestantes: number;
}

export function calcularMetricasDias(srv: ServicioAvanceMock): CalculoDiasServicio {
  const referencia =
    srv.v_Estatus === "Terminado" && srv.d_FechaTermino
      ? srv.d_FechaTermino
      : HOY_MOCK;

  const i_DiasTotales = Math.max(0, diffNaturalDays(srv.d_FechaFin, srv.d_FechaInicio));
  const i_DiasExcedidos = Math.max(0, diffNaturalDays(referencia, srv.d_FechaFin));
  const i_DiasTranscurridos = Math.max(0, diffNaturalDays(referencia, srv.d_FechaInicio));
  const i_DiasRestantes = Math.max(0, diffNaturalDays(srv.d_FechaFin, HOY_MOCK));

  return {
    i_DiasTotales,
    i_DiasExcedidos,
    i_DiasTranscurridos,
    i_DiasRestantes,
  };
}

function formatearFechaSesionMock(fechaIso: string): {
  texto: string;
  esHoy: boolean;
} {
  const clean = fechaIso.split("T")[0];
  if (clean === HOY_MOCK) {
    return { texto: "Hoy", esHoy: true };
  }
  if (clean === "2026-11-07") {
    return { texto: "Mañana", esHoy: false };
  }
  return { texto: formatearFechaTexto(clean), esHoy: false };
}

function formatearHorarioSesionMock(
  inicioIso: string,
  finIso: string,
  modo: "rango" | "inicio" | "fin" = "rango"
): string {
  const hIni = inicioIso.includes("T") ? inicioIso.split("T")[1].slice(0, 5) : "";
  const hFin = finIso.includes("T") ? finIso.split("T")[1].slice(0, 5) : "";
  if (modo === "inicio") return hIni && hIni !== "00:00" ? hIni : "—";
  if (modo === "fin") return hFin && hFin !== "00:00" ? hFin : hIni || "—";
  if (!hIni || hIni === "00:00") return "—";
  return hFin && hFin !== "23:59" ? `${hIni} – ${hFin}` : hIni;
}

const MESES_HISTORIAL = [
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

function formatearFechaCortaHistorial(fechaIso: string): string {
  const clean = fechaIso.split("T")[0];
  const parts = clean.split("-");
  if (parts.length !== 3) return clean;
  const [y, m, d] = parts;
  const mesIdx = parseInt(m, 10) - 1;
  const mesTxt = MESES_HISTORIAL[mesIdx] || m;
  return `${d.padStart(2, "0")} de ${mesTxt}, ${y}`;
}

function formatearFechaHoraHistorial(
  inicioIso: string,
  finIso: string,
  modo: "rango" | "inicio" | "fin" = "rango"
): string {
  const fechaBase = formatearFechaCortaHistorial(inicioIso);
  const hIni = inicioIso.includes("T") ? inicioIso.split("T")[1].slice(0, 5) : "";
  const hFin = finIso.includes("T") ? finIso.split("T")[1].slice(0, 5) : "";
  if (modo === "inicio") {
    return hIni ? `${fechaBase}, ${hIni}` : fechaBase;
  }
  if (modo === "fin") {
    const hora = hFin || hIni;
    return hora ? `${fechaBase}, ${hora}` : fechaBase;
  }
  if (!hIni) return fechaBase;
  return hFin ? `${fechaBase}, ${hIni} - ${hFin}` : `${fechaBase}, ${hIni}`;
}

function calcularDuracionHorasTexto(inicioIso: string, finIso: string): string {
  const hIniStr = inicioIso.includes("T") ? inicioIso.split("T")[1].slice(0, 5) : "";
  const hFinStr = finIso.includes("T") ? finIso.split("T")[1].slice(0, 5) : "";
  if (!hIniStr || !hFinStr) return "—";
  const [h1, m1] = hIniStr.split(":").map(Number);
  const [h2, m2] = hFinStr.split(":").map(Number);
  const diffMin = h2 * 60 + (m2 || 0) - (h1 * 60 + (m1 || 0));
  if (diffMin <= 0) return "—";
  const horas = Number((diffMin / 60).toFixed(2));
  return `${horas} hrs`;
}

function expandirActividadEnFilas(
  actividad: ActividadMock
): Extract<AgendaConsultorFila, { tipo: "actividad" }>[] {
  const diaIni = actividad.d_FechaInicio.split("T")[0];
  const diaFin = actividad.d_FechaFin.split("T")[0];
  if (diaIni === diaFin) {
    return [{ tipo: "actividad", actividad, momento: "unico" }];
  }
  return [
    { tipo: "actividad", actividad, momento: "inicio" },
    { tipo: "actividad", actividad, momento: "fin" },
  ];
}

function obtenerRangoEfectivoFilaActividad(
  act: ActividadMock,
  momento: MomentoActividadFila
): { inicio: string; fin: string; dia: string } {
  if (momento === "unico") {
    const dia = act.d_FechaInicio.split("T")[0];
    if (act.b_TieneHorario && act.d_FechaInicio.includes("T")) {
      return { inicio: act.d_FechaInicio, fin: act.d_FechaFin, dia };
    }
    return { inicio: `${dia}T00:00:00`, fin: `${dia}T23:59:59`, dia };
  }

  if (momento === "inicio") {
    const dia = act.d_FechaInicio.split("T")[0];
    if (act.b_TieneHorario && act.d_FechaInicio.includes("T")) {
      return { inicio: act.d_FechaInicio, fin: act.d_FechaInicio, dia };
    }
    return { inicio: `${dia}T00:00:00`, fin: `${dia}T23:59:59`, dia };
  }

  // momento === "fin"
  const dia = act.d_FechaFin.split("T")[0];
  if (act.b_TieneHorario && act.d_FechaFin.includes("T")) {
    return { inicio: act.d_FechaFin, fin: act.d_FechaFin, dia };
  }
  return { inicio: `${dia}T00:00:00`, fin: `${dia}T23:59:59`, dia };
}

function formatearFechaActividadTabla(
  act: ActividadMock,
  momento: MomentoActividadFila
): {
  texto: string;
  esHoy: boolean;
} {
  const dia =
    momento === "fin"
      ? act.d_FechaFin.split("T")[0]
      : act.d_FechaInicio.split("T")[0];
  return formatearFechaSesionMock(dia);
}

function formatearHorarioActividadTabla(
  act: ActividadMock,
  momento: MomentoActividadFila
): {
  texto: string;
  esTodoElDia: boolean;
} {
  if (!act.b_TieneHorario) {
    return { texto: "Todo el día", esTodoElDia: true };
  }
  const hIni = act.d_FechaInicio.includes("T")
    ? act.d_FechaInicio.split("T")[1].slice(0, 5)
    : "";
  const hFin = act.d_FechaFin.includes("T")
    ? act.d_FechaFin.split("T")[1].slice(0, 5)
    : "";
  if (momento === "inicio") {
    return { texto: hIni || "—", esTodoElDia: false };
  }
  if (momento === "fin") {
    return { texto: hFin || "—", esTodoElDia: false };
  }
  return {
    texto: hIni && hFin ? `${hIni} – ${hFin}` : hIni || "—",
    esTodoElDia: false,
  };
}

function calcularDuracionActividadTabla(
  act: ActividadMock,
  momento: MomentoActividadFila
): string {
  if (momento !== "unico") {
    return "—";
  }
  if (act.b_TieneHorario) {
    return calcularDuracionHorasTexto(act.d_FechaInicio, act.d_FechaFin);
  }
  return "1 día";
}

function obtenerTituloActividadConMomento(
  act: ActividadMock,
  momento: MomentoActividadFila
): string {
  if (momento === "inicio") return `Inicio · ${act.v_Titulo}`;
  if (momento === "fin") return `Fin · ${act.v_Titulo}`;
  return act.v_Titulo;
}

function formatearFechaActividadHistorial(act: ActividadMock): string {
  const diaIni = act.d_FechaInicio.split("T")[0];
  const diaFin = act.d_FechaFin.split("T")[0];
  const [y1, m1, d1] = diaIni.split("-");
  const [y2, m2, d2] = diaFin.split("-");
  const mes1 = MESES_HISTORIAL[parseInt(m1, 10) - 1] || m1;
  const mes2 = MESES_HISTORIAL[parseInt(m2, 10) - 1] || m2;

  if (act.b_TieneHorario) {
    const hIni = act.d_FechaInicio.includes("T")
      ? act.d_FechaInicio.split("T")[1].slice(0, 5)
      : "";
    const hFin = act.d_FechaFin.includes("T")
      ? act.d_FechaFin.split("T")[1].slice(0, 5)
      : "";
    if (diaIni === diaFin) {
      return `${formatearFechaCortaHistorial(diaIni)}, ${hIni} – ${hFin}`;
    }
    return `${formatearFechaCortaHistorial(diaIni)}, ${hIni} – ${formatearFechaCortaHistorial(diaFin)}, ${hFin}`;
  }

  // Sin horario (Todo el día)
  if (diaIni === diaFin) {
    return `${formatearFechaCortaHistorial(diaIni)} · Todo el día`;
  }
  if (y1 === y2 && m1 === m2) {
    return `${d1.padStart(2, "0")} – ${d2.padStart(2, "0")} de ${mes1}, ${y1} · Todo el día`;
  }
  if (y1 === y2) {
    return `${d1.padStart(2, "0")} de ${mes1} – ${d2.padStart(2, "0")} de ${mes2}, ${y1} · Todo el día`;
  }
  return `${formatearFechaCortaHistorial(diaIni)} – ${formatearFechaCortaHistorial(diaFin)} · Todo el día`;
}

function formatearFechaNodoActividadHistorial(
  act: ActividadMock,
  momento: MomentoActividadFila
): string {
  if (momento === "unico") {
    return formatearFechaActividadHistorial(act);
  }
  const isoRef = momento === "fin" ? act.d_FechaFin : act.d_FechaInicio;
  const diaRef = isoRef.split("T")[0];
  if (act.b_TieneHorario) {
    const hora = isoRef.includes("T") ? isoRef.split("T")[1].slice(0, 5) : "";
    return hora
      ? `${formatearFechaCortaHistorial(diaRef)}, ${hora}`
      : formatearFechaCortaHistorial(diaRef);
  }
  return `${formatearFechaCortaHistorial(diaRef)} · Todo el día`;
}

// ============================================================================
// 3. DATOS MOCK INICIALES (§6: 6 servicios con entregables de catálogo)
// ============================================================================

const SERVICIOS_MOCK_INICIAL: ServicioAvanceMock[] = [
  {
    i_CveServAgendaDet: 101,
    v_Empresa: "VESUVIUS MÉXICO S.A. DE C.V.",
    v_Planta: "Planta Guadalupe",
    v_Servicio: "Programa Interno de Protección Civil (PIPC) 2026",
    i_Cantidad: 1,
    v_Unidad: "Servicio",
    v_TipoServicio: "Servicios",
    d_FechaInicio: "2026-10-12",
    d_FechaFin: "2026-11-21",
    d_FechaTermino: null,
    v_Estatus: "En proceso",
    v_TitularApoyo: "Ing. Roberto Garza, Lic. Sofía Méndez",
    v_Notas:
      "Cliente solicita entrega preliminar digital antes de ingreso a Protección Civil Estatal.",
    b_AplicaVoBo: true,
    v_NombreArchivoVoBo: null,
    i_PorcentajeAvance: 65,
    historial: [
      {
        d_Fecha: "2026-11-03",
        v_Usuario: "Roberto Garza",
        i_PorcentajeAvance: 65,
        v_Nota:
          "Se completó levantamiento fotográfico y análisis de riesgos internos.",
      },
      {
        d_Fecha: "2026-10-22",
        v_Usuario: "Roberto Garza",
        i_PorcentajeAvance: 35,
        v_Nota: "Integración de actas constitutivas de la UIPC y directorios.",
      },
    ],
    entregables: [
      {
        i_CveAgendaEntregable: 1001,
        v_Entregable: "Plan de contingencia",
        v_NombreArchivo: null,
        v_NombreArchivoCarta: null,
        b_Entregado: false,
      },
    ],
    sesiones: [
      {
        i_CveAgendaDetalle: 5001,
        i_Orden: 1,
        d_FechaHoraInicio: "2026-10-12T09:00:00",
        d_FechaHoraFin: "2026-10-16T17:00:00",
        v_Titular: "Ing. Roberto Garza",
        v_Apoyo: "Lic. Sofía Méndez",
        v_EstatusSesion: "Completada",
      },
      {
        i_CveAgendaDetalle: 5002,
        i_Orden: 2,
        d_FechaHoraInicio: "2026-11-06T09:00:00",
        d_FechaHoraFin: "2026-11-21T17:00:00",
        v_Titular: "Ing. Roberto Garza",
        v_Apoyo: "Lic. Sofía Méndez",
        v_EstatusSesion: "Programado",
      },
    ],
  },
  {
    i_CveServAgendaDet: 102,
    v_Empresa: "TERNIUM MÉXICO S.A. DE C.V.",
    v_Planta: "Planta Churubusco",
    v_Servicio: "Estudio de Grado de Riesgo de Incendio (NOM-002-STPS)",
    i_Cantidad: 1,
    v_Unidad: "Estudio",
    v_TipoServicio: "Estudios",
    d_FechaInicio: "2026-09-20",
    d_FechaFin: "2026-10-25",
    d_FechaTermino: null,
    v_Estatus: "En proceso",
    v_TitularApoyo: "Ing. Daniel Villarreal",
    v_Notas:
      "En espera de listado actualizado de sustancias químicas del almacén norte.",
    b_AplicaVoBo: false,
    v_NombreArchivoVoBo: null,
    i_PorcentajeAvance: 45,
    historial: [
      {
        d_Fecha: "2026-10-28",
        v_Usuario: "Daniel Villarreal",
        i_PorcentajeAvance: 45,
        v_Nota:
          "Pendiente información de cargas combustibles del almacén norte por parte del cliente.",
      },
      {
        d_Fecha: "2026-10-05",
        v_Usuario: "Daniel Villarreal",
        i_PorcentajeAvance: 20,
        v_Nota: "Visita inicial de reconocimiento y medición de áreas.",
      },
    ],
    entregables: [
      {
        i_CveAgendaEntregable: 1002,
        v_Entregable: "Estudio",
        v_NombreArchivo: null,
        v_NombreArchivoCarta: null,
        b_Entregado: false,
      },
    ],
    sesiones: [
      {
        i_CveAgendaDetalle: 5003,
        i_Orden: 1,
        d_FechaHoraInicio: "2026-09-20T09:00:00",
        d_FechaHoraFin: "2026-10-25T17:00:00",
        v_Titular: "Ing. Daniel Villarreal",
        v_Apoyo: null,
        v_EstatusSesion: "Programado",
      },
    ],
  },
  {
    i_CveServAgendaDet: 103,
    v_Empresa: "NEMAK MÉXICO S.A.",
    v_Planta: "Planta García",
    v_Servicio: "Estudio de Ruido Laboral (NOM-011-STPS)",
    i_Cantidad: 1,
    v_Unidad: "Estudio",
    v_TipoServicio: "Estudios",
    d_FechaInicio: "2026-11-02",
    d_FechaFin: "2026-11-27",
    d_FechaTermino: null,
    v_Estatus: "Programado",
    v_TitularApoyo: "Ing. Alejandro Lozano",
    v_Notas: null,
    b_AplicaVoBo: false,
    v_NombreArchivoVoBo: null,
    i_PorcentajeAvance: 0,
    historial: [],
    entregables: [
      {
        i_CveAgendaEntregable: 1003,
        v_Entregable: "Estudio",
        v_NombreArchivo: null,
        v_NombreArchivoCarta: null,
        b_Entregado: false,
      },
    ],
    sesiones: [
      {
        i_CveAgendaDetalle: 5004,
        i_Orden: 1,
        d_FechaHoraInicio: "2026-11-02T08:30:00",
        d_FechaHoraFin: "2026-11-27T17:30:00",
        v_Titular: "Ing. Alejandro Lozano",
        v_Apoyo: null,
        v_EstatusSesion: "Programado",
      },
    ],
  },
  {
    i_CveServAgendaDet: 104,
    v_Empresa: "CEMEX SAB DE C.V.",
    v_Planta: "Planta Monterrey",
    v_Servicio: "Actualización de Atlas de Riesgos y Plan de Emergencias",
    i_Cantidad: 1,
    v_Unidad: "Servicio",
    v_TipoServicio: "Servicios",
    d_FechaInicio: "2026-09-10",
    d_FechaFin: "2026-10-20",
    d_FechaTermino: "2026-10-18",
    v_ConfirmadoPor: "MariCarmen",
    v_Estatus: "Terminado",
    v_TitularApoyo: "Ing. Roberto Garza",
    v_Notas: "Expediente completo entregado en físico y digital.",
    b_AplicaVoBo: true,
    v_NombreArchivoVoBo: "VoBo_ProteccionCivil_CEMEX_2026.pdf",
    i_PorcentajeAvance: 100,
    historial: [
      {
        d_Fecha: "2026-10-18",
        v_Usuario: "MariCarmen",
        i_PorcentajeAvance: 100,
        v_Nota: "Expediente entregado y validado con acuse de recibido.",
      },
      {
        d_Fecha: "2026-10-02",
        v_Usuario: "Roberto Garza",
        i_PorcentajeAvance: 60,
        v_Nota: "Revisión de planos de rutas de evacuación concluida.",
      },
    ],
    entregables: [
      {
        i_CveAgendaEntregable: 1004,
        v_Entregable: "Plan de contingencia",
        v_NombreArchivo: "Plan_Contingencia_CEMEX_2026.pdf",
        v_NombreArchivoCarta: "Carta_Entrega_CEMEX_2026.pdf",
        b_Entregado: true,
      },
    ],
    sesiones: [
      {
        i_CveAgendaDetalle: 5005,
        i_Orden: 1,
        d_FechaHoraInicio: "2026-09-10T09:00:00",
        d_FechaHoraFin: "2026-10-20T18:00:00",
        v_Titular: "Ing. Roberto Garza",
        v_Apoyo: null,
        v_EstatusSesion: "Completada",
      },
    ],
  },
  {
    i_CveServAgendaDet: 105,
    v_Empresa: "FRISA FORJADOS S.A. DE C.V.",
    v_Planta: "Planta Santa Catarina",
    v_Servicio: "Gestoría y Trámite de Visto Bueno de Protección Civil",
    i_Cantidad: 1,
    v_Unidad: "Servicio",
    v_TipoServicio: "Servicios",
    d_FechaInicio: "2026-09-26",
    d_FechaFin: "2026-10-30",
    d_FechaTermino: null,
    v_Estatus: "Por confirmar",
    v_TitularApoyo: "Lic. Sofía Méndez",
    v_Notas:
      "Trámite concluido al 100 %; falta confirmar término y adjuntar acuses finales.",
    b_AplicaVoBo: true,
    v_NombreArchivoVoBo: null,
    i_PorcentajeAvance: 100,
    historial: [
      {
        d_Fecha: "2026-11-05",
        v_Usuario: "Sofía Méndez",
        i_PorcentajeAvance: 100,
        v_Nota:
          "Dictamen liberado en ventanilla municipal; listo para cierre y entrega.",
      },
      {
        d_Fecha: "2026-11-01",
        v_Usuario: "Sofía Méndez",
        i_PorcentajeAvance: 80,
        v_Nota:
          "Carpeta ingresada en ventanilla municipal; en espera de dictamen.",
      },
    ],
    entregables: [
      {
        i_CveAgendaEntregable: 1005,
        v_Entregable: "Licencia",
        v_NombreArchivo: null,
        v_NombreArchivoCarta: null,
        b_Entregado: false,
      },
    ],
    sesiones: [
      {
        i_CveAgendaDetalle: 5006,
        i_Orden: 1,
        d_FechaHoraInicio: "2026-09-26T09:00:00",
        d_FechaHoraFin: "2026-10-30T17:00:00",
        v_Titular: "Lic. Sofía Méndez",
        v_Apoyo: null,
        v_EstatusSesion: "Completada",
      },
    ],
  },
  {
    i_CveServAgendaDet: 106,
    v_Empresa: "SIGMA ALIMENTOS S.A. DE C.V.",
    v_Planta: "Planta Apodaca",
    v_Servicio: "Estudio de Iluminación y Tierras Físicas (NOM-025 / NOM-022)",
    i_Cantidad: 1,
    v_Unidad: "Estudio",
    v_TipoServicio: "Estudios",
    d_FechaInicio: "2026-10-25",
    d_FechaFin: "2026-11-29",
    d_FechaTermino: null,
    v_Estatus: "En proceso",
    v_TitularApoyo: "Ing. Daniel Villarreal, Ing. Alejandro Lozano",
    v_Notas: "Falta medición nocturna en patio de maniobras.",
    b_AplicaVoBo: false,
    v_NombreArchivoVoBo: null,
    i_PorcentajeAvance: 30,
    historial: [
      {
        d_Fecha: "2026-11-04",
        v_Usuario: "Daniel Villarreal",
        i_PorcentajeAvance: 30,
        v_Nota: "Levantamiento de luxometría completado en nave de empaque.",
      },
    ],
    entregables: [
      {
        i_CveAgendaEntregable: 1006,
        v_Entregable: "Estudio",
        v_NombreArchivo: null,
        v_NombreArchivoCarta: null,
        b_Entregado: false,
      },
      {
        i_CveAgendaEntregable: 1007,
        v_Entregable: "Diploma",
        v_NombreArchivo: null,
        v_NombreArchivoCarta: null,
        b_Entregado: false,
      },
    ],
    sesiones: [
      {
        i_CveAgendaDetalle: 5007,
        i_Orden: 1,
        d_FechaHoraInicio: "2026-10-25T09:00:00",
        d_FechaHoraFin: "2026-11-29T18:00:00",
        v_Titular: "Ing. Daniel Villarreal",
        v_Apoyo: "Ing. Alejandro Lozano",
        v_EstatusSesion: "Programado",
      },
    ],
  },
];

const SESIONES_MOCK: SesionMock[] = [
  // Capacitación con al menos dos sesiones (Sesión 1 hoy en la mañana, Sesión 2 mañana)
  {
    i_CveAgendaDetalle: 501,
    i_Orden: 1,
    v_Actividad: "Sesión 1",
    v_ModoHorario: "rango",
    d_FechaHoraInicio: "2026-11-06T07:00:00",
    d_FechaHoraFin: "2026-11-06T12:00:00",
    v_Empresa: "TERNIUM MÉXICO S.A. DE C.V.",
    v_Planta: "Planta Churubusco",
    v_Servicio: "Manejo Seguro de Montacargas",
    v_TipoServicio: "Capacitación",
    v_Duracion: "5 hrs",
    v_TitularApoyo: "Inst. Carlos Palacios",
    v_Estatus: "En curso",
    i_CveServAgendaDet: 106,
  },
  {
    i_CveAgendaDetalle: 502,
    i_Orden: 2,
    v_Actividad: "Sesión 2",
    v_ModoHorario: "rango",
    d_FechaHoraInicio: "2026-11-07T07:00:00",
    d_FechaHoraFin: "2026-11-07T12:00:00",
    v_Empresa: "TERNIUM MÉXICO S.A. DE C.V.",
    v_Planta: "Planta Churubusco",
    v_Servicio: "Manejo Seguro de Montacargas",
    v_TipoServicio: "Capacitación",
    v_Duracion: "5 hrs",
    v_TitularApoyo: "Inst. Carlos Palacios",
    v_Estatus: "Programado",
    i_CveServAgendaDet: 106,
  },
  // Servicio que inició antes de hoy (03/nov/2026) y sigue en curso: su fila Inicio NO debe aparecer, su fila Fin (21/nov/2026) sí aparece
  {
    i_CveAgendaDetalle: 503,
    v_Actividad: "Inicio",
    v_ModoHorario: "inicio",
    d_FechaHoraInicio: "2026-11-03T09:00:00",
    d_FechaHoraFin: "2026-11-03T09:00:00",
    v_Empresa: "VESUVIUS MÉXICO S.A. DE C.V.",
    v_Planta: "Planta Guadalupe",
    v_Servicio: "Programa Interno de Protección Civil (PIPC) 2026",
    v_TipoServicio: "Servicios",
    v_Duracion: "—",
    v_TitularApoyo: "Ing. Roberto Garza, Lic. Sofía Méndez",
    v_Estatus: "Terminado",
    i_CveServAgendaDet: 101,
  },
  {
    i_CveAgendaDetalle: 504,
    v_Actividad: "Fin",
    v_ModoHorario: "fin",
    d_FechaHoraInicio: "2026-11-21T18:00:00",
    d_FechaHoraFin: "2026-11-21T18:00:00",
    v_Empresa: "VESUVIUS MÉXICO S.A. DE C.V.",
    v_Planta: "Planta Guadalupe",
    v_Servicio: "Programa Interno de Protección Civil (PIPC) 2026",
    v_TipoServicio: "Servicios",
    v_Duracion: "—",
    v_TitularApoyo: "Ing. Roberto Garza, Lic. Sofía Méndez",
    v_Estatus: "Programado",
    i_CveServAgendaDet: 101,
  },
  // Estudio / Servicio con inicio y fin el mismo día -> una sola fila "Inicio y fin"
  {
    i_CveAgendaDetalle: 505,
    v_Actividad: "Inicio y fin",
    v_ModoHorario: "rango",
    d_FechaHoraInicio: "2026-11-07T08:30:00",
    d_FechaHoraFin: "2026-11-07T17:30:00",
    v_Empresa: "NEMAK MÉXICO S.A.",
    v_Planta: "Planta García",
    v_Servicio: "Estudio de Ruido Laboral (NOM-011-STPS)",
    v_TipoServicio: "Estudios",
    v_Duracion: "—",
    v_TitularApoyo: "Ing. Alejandro Lozano",
    v_Estatus: "Programado",
    i_CveServAgendaDet: 103,
  },
  // Fila Fin de días anteriores ya Terminado (no aparece por default — §2.1 y §6)
  {
    i_CveAgendaDetalle: 506,
    v_Actividad: "Fin",
    v_ModoHorario: "fin",
    d_FechaHoraInicio: "2026-10-20T18:00:00",
    d_FechaHoraFin: "2026-10-20T18:00:00",
    v_Empresa: "CEMEX SAB DE C.V.",
    v_Planta: "Planta Monterrey",
    v_Servicio: "Actualización de Atlas de Riesgos y Plan de Emergencias",
    v_TipoServicio: "Servicios",
    v_Duracion: "—",
    v_TitularApoyo: "Ing. Roberto Garza",
    v_Estatus: "Terminado",
    i_CveServAgendaDet: 104,
  },
  // Servicio con fecha fin estimada antes de hoy (05/nov/2026): su fila Fin NO debe aparecer (§6)
  {
    i_CveAgendaDetalle: 507,
    v_Actividad: "Fin",
    v_ModoHorario: "fin",
    d_FechaHoraInicio: "2026-11-05T18:00:00",
    d_FechaHoraFin: "2026-11-05T18:00:00",
    v_Empresa: "FRISA FORJADOS S.A. DE C.V.",
    v_Planta: "Planta Santa Catarina",
    v_Servicio: "Estudio de Grado de Riesgo de Incendio (NOM-002-STPS-2010)",
    v_TipoServicio: "Estudios",
    v_Duracion: "—",
    v_TitularApoyo: "Ing. Daniel Villarreal",
    v_Estatus: "Terminado",
    i_CveServAgendaDet: 102,
  },
  // Estudio con inicio y fin en fechas distintas (futuras) para ver filas Inicio y Fin en tabla
  {
    i_CveAgendaDetalle: 508,
    v_Actividad: "Inicio",
    v_ModoHorario: "inicio",
    d_FechaHoraInicio: "2026-11-08T09:00:00",
    d_FechaHoraFin: "2026-11-08T09:00:00",
    v_Empresa: "DEACERO S.A.P.I. DE C.V.",
    v_Planta: "Planta Celaya",
    v_Servicio: "Estudio de Iluminación y Tierras Físicas (NOM-025 / NOM-022)",
    v_TipoServicio: "Estudios",
    v_Duracion: "—",
    v_TitularApoyo: "Ing. Daniel Villarreal, Ing. Alejandro Lozano",
    v_Estatus: "Programado",
    i_CveServAgendaDet: 107,
  },
  {
    i_CveAgendaDetalle: 509,
    v_Actividad: "Fin",
    v_ModoHorario: "fin",
    d_FechaHoraInicio: "2026-11-29T18:00:00",
    d_FechaHoraFin: "2026-11-29T18:00:00",
    v_Empresa: "DEACERO S.A.P.I. DE C.V.",
    v_Planta: "Planta Celaya",
    v_Servicio: "Estudio de Iluminación y Tierras Físicas (NOM-025 / NOM-022)",
    v_TipoServicio: "Estudios",
    v_Duracion: "—",
    v_TitularApoyo: "Ing. Daniel Villarreal, Ing. Alejandro Lozano",
    v_Estatus: "Programado",
    i_CveServAgendaDet: 107,
  },
];

const ACTIVIDADES_MOCK_INICIAL: ActividadMock[] = [
  // Hoy: actividad ya terminada (hora fin 09:00 pasada vs AHORA_MOCK 11:30): NO debe aparecer en tabla (§2.1 y §6)
  {
    i_CveActividad: 1,
    v_Titulo: "Revisión carpeta",
    b_General: false,
    i_CveServAgendaDet: 105,
    d_FechaInicio: "2026-11-06T08:00:00",
    d_FechaFin: "2026-11-06T09:00:00",
    b_TieneHorario: true,
    v_Notas: "Revisión de dictamen municipal antes de confirmar cierre.",
    v_Estatus: "Activa",
    i_CveReprograma: null,
    v_Motivo: null,
    v_Registro: "Ing. Roberto Garza",
  },
  // 1) Actividad corta de un día con horario de 2 horas: 13:00 – 15:00 (duración 2 hrs) (es la nueva tras reprogramarse la actividad #6)
  {
    i_CveActividad: 2,
    v_Titulo: "Junta de avance",
    b_General: false,
    i_CveServAgendaDet: 101,
    d_FechaInicio: "2026-11-06T13:00:00",
    d_FechaFin: "2026-11-06T15:00:00",
    b_TieneHorario: true,
    v_Notas: "Presentación de avance del 65 % del PIPC con el cliente.",
    v_Estatus: "Activa",
    i_CveReprograma: null,
    v_Motivo: null,
    v_Registro: "Ing. Roberto Garza",
  },
  // Hoy: actividad general en la tarde
  {
    i_CveActividad: 3,
    v_Titulo: "Junta interna GI",
    b_General: true,
    i_CveServAgendaDet: null,
    d_FechaInicio: "2026-11-06T15:00:00",
    d_FechaFin: "2026-11-06T18:00:00",
    b_TieneHorario: true,
    v_Notas: "Revisión semanal de pendientes con dirección.",
    v_Estatus: "Activa",
    i_CveReprograma: null,
    v_Motivo: null,
    v_Registro: "Ing. Roberto Garza",
  },
  // 2) Actividad corta de un día con horario de 1 hora: 09:00 – 10:00 (duración 1 hrs)
  {
    i_CveActividad: 4,
    v_Titulo: "Salida a planta",
    b_General: false,
    i_CveServAgendaDet: 101,
    d_FechaInicio: "2026-11-07T09:00:00",
    d_FechaFin: "2026-11-07T10:00:00",
    b_TieneHorario: true,
    v_Notas: "Recorrido en almacén norte para verificar cargas combustibles.",
    v_Estatus: "Activa",
    i_CveReprograma: null,
    v_Motivo: null,
    v_Registro: "Lic. Sofía Méndez",
  },
  // Actividad de días anteriores ya terminada (no aparece por default en tabla, sí en el historial del proyecto 101)
  {
    i_CveActividad: 5,
    v_Titulo: "Visita previa",
    b_General: false,
    i_CveServAgendaDet: 101,
    d_FechaInicio: "2026-11-03T11:00:00",
    d_FechaFin: "2026-11-03T13:00:00",
    b_TieneHorario: true,
    v_Notas: "Recorrido inicial en planta.",
    v_Estatus: "Activa",
    i_CveReprograma: null,
    v_Motivo: null,
    v_Registro: "Ing. Roberto Garza",
  },
  // Actividad original Reprogramada (apunta a la actividad #2 del 06/nov) ligada al mismo proyecto 101 (§6)
  {
    i_CveActividad: 6,
    v_Titulo: "Junta de avance",
    b_General: false,
    i_CveServAgendaDet: 101,
    d_FechaInicio: "2026-11-04T13:00:00",
    d_FechaFin: "2026-11-04T15:00:00",
    b_TieneHorario: true,
    v_Notas: "Primera cita agendada para revisión de carpeta.",
    v_Estatus: "Reprogramada",
    i_CveReprograma: 2,
    v_Motivo: "El coordinador de EHS tuvo auditoría corporativa.",
    v_Registro: "Ing. Roberto Garza",
  },
  // Actividad Cancelada ligada al mismo proyecto 101 (§6)
  {
    i_CveActividad: 7,
    v_Titulo: "Revisión brigadas",
    b_General: false,
    i_CveServAgendaDet: 101,
    d_FechaInicio: "2026-11-05T11:00:00",
    d_FechaFin: "2026-11-05T12:00:00",
    b_TieneHorario: true,
    v_Notas: "Validación de organigrama de brigadas.",
    v_Estatus: "Cancelada",
    i_CveReprograma: null,
    v_Motivo: "Se integró el punto en la junta de avance.",
    v_Registro: "Lic. Sofía Méndez",
  },
  // 3) Actividad de varios días con horario que empezó ayer (05/nov) y termina mañana (07/nov) -> sale "En curso" arriba
  {
    i_CveActividad: 8,
    v_Titulo: "Auditoría en planta",
    b_General: false,
    i_CveServAgendaDet: 101,
    d_FechaInicio: "2026-11-05T16:00:00",
    d_FechaFin: "2026-11-07T10:00:00",
    b_TieneHorario: true,
    v_Notas:
      "Revisar extintores, rutas de evacuación y señalética del área de almacén.",
    v_Estatus: "Activa",
    i_CveReprograma: null,
    v_Motivo: null,
    v_Registro: "Ing. Roberto Garza",
  },
  // 4) Actividad de un día sin horario ("Todo el día", duración "1 día")
  {
    i_CveActividad: 9,
    v_Titulo: "Trámite municipal",
    b_General: false,
    i_CveServAgendaDet: 105,
    d_FechaInicio: "2026-11-07",
    d_FechaFin: "2026-11-07",
    b_TieneHorario: false,
    v_Notas: "Recolección de dictamen y sellos en ventanilla.",
    v_Estatus: "Activa",
    i_CveReprograma: null,
    v_Motivo: null,
    v_Registro: "Lic. Sofía Méndez",
  },
  // 5) Actividad de varios días sin horario en el futuro (09/nov al 11/nov -> "Todo el día", duración "3 días")
  {
    i_CveActividad: 10,
    v_Titulo: "Congreso EHS",
    b_General: true,
    i_CveServAgendaDet: null,
    d_FechaInicio: "2026-11-09",
    d_FechaFin: "2026-11-11",
    b_TieneHorario: false,
    v_Notas: "Participación en congreso anual de seguridad industrial.",
    v_Estatus: "Activa",
    i_CveReprograma: null,
    v_Motivo: null,
    v_Registro: "Ing. Roberto Garza",
  },
];

// ============================================================================
// 4. SUBCOMPONENTE: CELDA / BARRA DE AVANCE EN TABLA (§5)
// ============================================================================

interface BarraAvanceProyectoProps {
  porcentaje: number;
  estatus: ServicioAvanceMock["v_Estatus"];
  diasExcedidos: number;
  diasRestantes: number;
  maxWidth?: string;
}

const BarraAvanceProyecto: React.FC<BarraAvanceProyectoProps> = ({
  porcentaje,
  estatus,
  diasExcedidos,
  diasRestantes,
  maxWidth = "165px",
}) => {
  const pct = Math.min(100, Math.max(0, Math.round(porcentaje)));
  const esCero = pct === 0;
  const colorNumero = esCero ? COLOR_ROJO_ALERTA : COLOR_VERDE_AVANCE;

  let textoInferior = "";
  let esTextoRojo = false;

  // §5: En la columna Avance de la tabla, con 100 % el texto debajo de la barra es "Completado"
  if (pct === 100 || estatus === "Terminado") {
    textoInferior = "Completado";
  } else if (diasExcedidos > 0) {
    textoInferior = "Fuera de tiempo";
    esTextoRojo = true;
  } else if (pct === 0) {
    textoInferior = `Sin iniciar · ${diasRestantes} días restantes`;
  } else {
    textoInferior = `${diasRestantes} días restantes`;
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "3px",
        width: "100%",
        minWidth: "130px",
        maxWidth,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
        <div
          style={{
            flex: 1,
            height: "6px",
            backgroundColor: "#E9EEF3",
            borderRadius: "4px",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: `${pct}%`,
              height: "100%",
              backgroundColor: COLOR_VERDE_AVANCE,
              borderRadius: "4px",
              transition: "width 0.25s ease",
            }}
          />
        </div>
        <span
          style={{
            fontSize: "12px",
            fontWeight: 600,
            color: colorNumero,
            lineHeight: 1,
            whiteSpace: "nowrap",
          }}
        >
          {pct} %
        </span>
      </div>
      <div
        style={{
          fontSize: "11px",
          lineHeight: 1.2,
          fontWeight: esTextoRojo ? 600 : 400,
          color: esTextoRojo ? COLOR_ROJO_ALERTA : "#64748b",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {textoInferior}
      </div>
    </div>
  );
};

// ============================================================================
// 5. PÁGINA PRINCIPAL: AVANCE DE PROYECTOS
// ============================================================================

export default function AvanceProyectosPage() {
  const { toast, confirmModal } = useToast();

  // Estado local de servicios mock y actividades del consultor
  const [servicios, setServicios] = useState<ServicioAvanceMock[]>(
    SERVICIOS_MOCK_INICIAL
  );
  const [actividades, setActividades] = useState<ActividadMock[]>(
    ACTIVIDADES_MOCK_INICIAL
  );
  const [cargando, setCargando] = useState<boolean>(false);

  // Estado del Modal Agregar / Editar Actividad (§4)
  const [modalActividadAbierto, setModalActividadAbierto] =
    useState<boolean>(false);
  const [actividadEditandoId, setActividadEditandoId] = useState<number | null>(
    null
  );
  const [formActividad, setFormActividad] = useState<{
    v_Titulo: string;
    b_General: boolean;
    i_CveServAgendaDet: number | null;
    fechaInicio: string;
    fechaFin: string;
    b_TieneHorario: boolean;
    horaInicio: string;
    horaFin: string;
    v_Notas: string;
  }>({
    v_Titulo: "",
    b_General: false,
    i_CveServAgendaDet: null,
    fechaInicio: HOY_MOCK,
    fechaFin: HOY_MOCK,
    b_TieneHorario: true,
    horaInicio: "09:00",
    horaFin: "10:00",
    v_Notas: "",
  });
  const [selectProyectoAbierto, setSelectProyectoAbierto] =
    useState<boolean>(false);
  const [busquedaProyectoSelect, setBusquedaProyectoSelect] =
    useState<string>("");

  // Estado del Modal Reprogramar Actividad (§4)
  const [actividadReprogramando, setActividadReprogramando] =
    useState<ActividadMock | null>(null);
  const [formReprogramar, setFormReprogramar] = useState<{
    fechaInicio: string;
    fechaFin: string;
    b_TieneHorario: boolean;
    horaInicio: string;
    horaFin: string;
    v_Motivo: string;
  }>({
    fechaInicio: HOY_MOCK,
    fechaFin: HOY_MOCK,
    b_TieneHorario: true,
    horaInicio: "09:00",
    horaFin: "10:00",
    v_Motivo: "",
  });

  // Estado del Modal Cancelar Actividad (§4)
  const [actividadCancelando, setActividadCancelando] =
    useState<ActividadMock | null>(null);
  const [motivoCancelar, setMotivoCancelar] = useState<string>("");

  // Estado del Modal Historial de actividades (ojo — §4.1)
  const [filaEnHistorial, setFilaEnHistorial] =
    useState<AgendaConsultorFila | null>(null);
  const nodoActualHistorialRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!filaEnHistorial) return;
    const timer = setTimeout(() => {
      nodoActualHistorialRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }, 80);
    return () => clearTimeout(timer);
  }, [filaEnHistorial]);

  // Filtros
  const [vista, setVista] = useState<"servicios" | "sesiones">("servicios");
  const [soloExcedidos, setSoloExcedidos] = useState<boolean>(false);
  const [rangoServicios, setRangoServicios] = useState<{
    inicio: string;
    fin: string;
  }>({
    inicio: "2026-01-01",
    fin: "2026-12-31",
  });
  const [fechaSesiones, setFechaSesiones] = useState<string>(HOY_MOCK);
  const [busquedaTexto, setBusquedaTexto] = useState<string>("");

  // Paginación visual
  const [paginaActual, setPaginaActual] = useState<number>(1);
  const [tamanoPagina, setTamanoPagina] = useState<number>(10);

  // Estado del Modal de Detalle (§2, §3, §4, §5)
  const [modalServicioId, setModalServicioId] = useState<number | null>(null);
  const [modalSesionCapacitacion, setModalSesionCapacitacion] =
    useState<SesionMock | null>(null);

  // Estados editables dentro del modal (igual al modal de detalle actual)
  const [notas, setNotas] = useState<string>("");
  const [notasBase, setNotasBase] = useState<string>("");

  // Estados de la sección "Avance del proyecto" (§3)
  const [sliderPorcentaje, setSliderPorcentaje] = useState<number>(0);
  const [notaAvance, setNotaAvance] = useState<string>("");
  const [acordeonHistorialAvance, setAcordeonHistorialAvance] =
    useState<boolean>(false);

  // Acordeón de sesiones de la agenda
  const [acordeonSesiones, setAcordeonSesiones] = useState<boolean>(true);

  // Input oculto para subir archivo o carta de entrega a un entregable (§4)
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploadTarget, setUploadTarget] = useState<{
    i_CveAgendaEntregable: number;
    tipo: "entregable" | "carta";
  } | null>(null);

  // Servicio activo en el modal
  const servicioEnModal = useMemo(() => {
    if (modalServicioId === null) return null;
    return (
      servicios.find((s) => s.i_CveServAgendaDet === modalServicioId) || null
    );
  }, [servicios, modalServicioId]);

  // Filtrado de Servicios ("Solo con días excedidos" + búsqueda local)
  const serviciosFiltrados = useMemo(() => {
    return servicios.filter((srv) => {
      if (soloExcedidos) {
        const { i_DiasExcedidos } = calcularMetricasDias(srv);
        if (i_DiasExcedidos <= 0) return false;
      }
      if (busquedaTexto.trim()) {
        const q = busquedaTexto.trim().toLowerCase();
        const coincide =
          srv.v_Empresa.toLowerCase().includes(q) ||
          srv.v_Planta.toLowerCase().includes(q) ||
          srv.v_Servicio.toLowerCase().includes(q) ||
          srv.v_TitularApoyo.toLowerCase().includes(q);
        if (!coincide) return false;
      }
      return true;
    });
  }, [servicios, soloExcedidos, busquedaTexto]);

  // §4: Proyectos elegibles para ligar una actividad ("En proceso" o "Por confirmar")
  const proyectosEnCurso = useMemo(() => {
    return servicios.filter(
      (s) => s.v_Estatus === "En proceso" || s.v_Estatus === "Por confirmar"
    );
  }, [servicios]);

  const proyectosEnCursoFiltrados = useMemo(() => {
    const q = busquedaProyectoSelect.trim().toLowerCase();
    if (!q) return proyectosEnCurso;
    return proyectosEnCurso.filter((p) => {
      const label = `${p.v_Servicio} · ${p.v_Empresa} (${p.v_Planta})`.toLowerCase();
      return label.includes(q);
    });
  }, [proyectosEnCurso, busquedaProyectoSelect]);

  // §3: Estatus de cada renglón depende SOLO de su momento propio (igual que Inicio / Fin de los servicios)
  const obtenerEstatusFilaAgenda = (
    fila: AgendaConsultorFila
  ): EstatusFilaAgenda => {
    if (fila.tipo === "sesion") {
      const dIni = fila.sesion.d_FechaHoraInicio;
      const dFin = fila.sesion.d_FechaHoraFin;
      if (dIni > AHORA_MOCK) return "Programado";
      if (dIni <= AHORA_MOCK && AHORA_MOCK < dFin) return "En curso";
      return "Terminado";
    }

    const { inicio, fin } = obtenerRangoEfectivoFilaActividad(
      fila.actividad,
      fila.momento
    );
    if (inicio > AHORA_MOCK) return "Programado";
    if (inicio <= AHORA_MOCK && AHORA_MOCK < fin) return "En curso";
    return "Terminado";
  };

  // §1, §2 y §3: Lista unificada de sesiones + renglones de actividades activas del consultor agrupada por estatus y ordenada por fecha/hora de su momento
  const filasAgendaConsultor = useMemo<AgendaConsultorFila[]>(() => {
    const combinadas: AgendaConsultorFila[] = [
      ...SESIONES_MOCK.map(
        (sesion): AgendaConsultorFila => ({ tipo: "sesion", sesion })
      ),
      ...actividades
        .filter((actividad) => actividad.v_Estatus === "Activa")
        .flatMap((actividad) => expandirActividadEnFilas(actividad)),
    ];

    // Filas visibles por default (§3):
    // - Cada renglón es un momento propio; lo Terminado no aparece por default (ej. el renglón Inicio de ayer ya no sale; el renglón Fin sale en su fecha).
    const visibles = combinadas.filter((fila) => {
      if (fila.tipo === "sesion") {
        const fechaDia = fila.sesion.d_FechaHoraInicio.split("T")[0];
        if (fechaDia < HOY_MOCK) return false;
      } else {
        const { dia } = obtenerRangoEfectivoFilaActividad(
          fila.actividad,
          fila.momento
        );
        if (dia < HOY_MOCK) return false;
      }
      const estatus = obtenerEstatusFilaAgenda(fila);
      return estatus === "En curso" || estatus === "Programado";
    });

    // Agrupación por estatus: 1. En curso, 2. Programado (Terminado al final si llegara a filtrarse)
    const ordenEstatus: Record<EstatusFilaAgenda, number> = {
      "En curso": 1,
      Programado: 2,
      Terminado: 3,
    };

    visibles.sort((a, b) => {
      const estA = obtenerEstatusFilaAgenda(a);
      const estB = obtenerEstatusFilaAgenda(b);
      if (ordenEstatus[estA] !== ordenEstatus[estB]) {
        return ordenEstatus[estA] - ordenEstatus[estB];
      }
      const fechaA =
        a.tipo === "sesion"
          ? a.sesion.d_FechaHoraInicio
          : obtenerRangoEfectivoFilaActividad(a.actividad, a.momento).inicio;
      const fechaB =
        b.tipo === "sesion"
          ? b.sesion.d_FechaHoraInicio
          : obtenerRangoEfectivoFilaActividad(b.actividad, b.momento).inicio;
      return fechaA.localeCompare(fechaB);
    });

    if (!busquedaTexto.trim()) return visibles;

    const q = busquedaTexto.trim().toLowerCase();
    return visibles.filter((fila) => {
      if (fila.tipo === "sesion") {
        const s = fila.sesion;
        return (
          s.v_Empresa.toLowerCase().includes(q) ||
          s.v_Planta.toLowerCase().includes(q) ||
          s.v_Actividad.toLowerCase().includes(q) ||
          s.v_Servicio.toLowerCase().includes(q) ||
          s.v_TitularApoyo.toLowerCase().includes(q)
        );
      }
      const act = fila.actividad;
      const tituloMomento = obtenerTituloActividadConMomento(
        act,
        fila.momento
      ).toLowerCase();
      const srv = act.i_CveServAgendaDet
        ? servicios.find((s) => s.i_CveServAgendaDet === act.i_CveServAgendaDet)
        : null;
      return (
        tituloMomento.includes(q) ||
        act.v_Titulo.toLowerCase().includes(q) ||
        (act.v_Notas && act.v_Notas.toLowerCase().includes(q)) ||
        (act.b_General && "general".includes(q)) ||
        (srv &&
          (srv.v_Empresa.toLowerCase().includes(q) ||
            srv.v_Planta.toLowerCase().includes(q) ||
            srv.v_Servicio.toLowerCase().includes(q))) ||
        false
      );
    });
  }, [actividades, servicios, busquedaTexto]);

  // §1: Handlers de Crear / Editar actividad del consultor
  const handleAbrirCrearActividad = () => {
    setActividadEditandoId(null);
    setFormActividad({
      v_Titulo: "",
      b_General: false,
      i_CveServAgendaDet: null,
      fechaInicio: HOY_MOCK,
      fechaFin: HOY_MOCK,
      b_TieneHorario: true,
      horaInicio: "09:00",
      horaFin: "10:00",
      v_Notas: "",
    });
    setSelectProyectoAbierto(false);
    setBusquedaProyectoSelect("");
    setModalActividadAbierto(true);
  };

  const handleAbrirEditarActividad = (act: ActividadMock) => {
    const fechaIniStr = act.d_FechaInicio.split("T")[0] || HOY_MOCK;
    const fechaFinStr = act.d_FechaFin.split("T")[0] || fechaIniStr;
    const hIni =
      act.b_TieneHorario && act.d_FechaInicio.includes("T")
        ? act.d_FechaInicio.split("T")[1].slice(0, 5)
        : "";
    const hFin =
      act.b_TieneHorario && act.d_FechaFin.includes("T")
        ? act.d_FechaFin.split("T")[1].slice(0, 5)
        : "";

    setActividadEditandoId(act.i_CveActividad);
    setFormActividad({
      v_Titulo: act.v_Titulo,
      b_General: act.b_General,
      i_CveServAgendaDet: act.b_General ? null : act.i_CveServAgendaDet,
      fechaInicio: fechaIniStr,
      fechaFin: fechaFinStr,
      b_TieneHorario: act.b_TieneHorario,
      horaInicio: hIni,
      horaFin: hFin,
      v_Notas: act.v_Notas || "",
    });
    setSelectProyectoAbierto(false);
    setBusquedaProyectoSelect("");
    setModalActividadAbierto(true);
  };

  const handleCerrarModalActividad = () => {
    setModalActividadAbierto(false);
    setActividadEditandoId(null);
    setSelectProyectoAbierto(false);
    setBusquedaProyectoSelect("");
  };

  const handleGuardarActividad = () => {
    const tituloTrim = formActividad.v_Titulo.trim();

    if (!tituloTrim) {
      toast.error("El título de la actividad es obligatorio.");
      return;
    }
    if (tituloTrim.length > 200) {
      toast.error("El título no puede exceder los 200 caracteres.");
      return;
    }
    if (!formActividad.b_General && !formActividad.i_CveServAgendaDet) {
      toast.error("Selecciona un proyecto en curso.");
      return;
    }

    const notasLimpias = formActividad.v_Notas.trim()
      ? formActividad.v_Notas.trim()
      : null;

    if (actividadEditandoId !== null) {
      // En Editar solo cambia título, proyecto/general y notas; la fecha y las horas no se editan aquí
      setActividades((prev) =>
        prev.map((item) =>
          item.i_CveActividad === actividadEditandoId
            ? {
                ...item,
                v_Titulo: tituloTrim,
                b_General: formActividad.b_General,
                i_CveServAgendaDet: formActividad.b_General
                  ? null
                  : formActividad.i_CveServAgendaDet,
                v_Notas: notasLimpias,
              }
            : item
        )
      );
      toast.success("Actividad actualizada exitosamente");
    } else {
      if (!formActividad.fechaInicio || !formActividad.fechaFin) {
        toast.error("La fecha de inicio y la fecha de fin son obligatorias.");
        return;
      }
      if (formActividad.fechaFin < formActividad.fechaInicio) {
        toast.error(
          "La fecha de fin no puede ser menor que la fecha de inicio."
        );
        return;
      }

      if (formActividad.b_TieneHorario) {
        if (!formActividad.horaInicio || !formActividad.horaFin) {
          toast.error("La hora de inicio y la hora de fin son obligatorias.");
          return;
        }
        // Con horario y mismo día: hora fin menor o igual a hora inicio
        if (
          formActividad.fechaInicio === formActividad.fechaFin &&
          formActividad.horaFin <= formActividad.horaInicio
        ) {
          toast.error("La hora de fin debe ser mayor que la hora de inicio.");
          return;
        }
      }

      const dInicio = formActividad.b_TieneHorario
        ? `${formActividad.fechaInicio}T${formActividad.horaInicio}:00`
        : formActividad.fechaInicio;
      const dFin = formActividad.b_TieneHorario
        ? `${formActividad.fechaFin}T${formActividad.horaFin}:00`
        : formActividad.fechaFin;

      const sesionUsuario = obtenerSesionActual();
      const nombreConsultor =
        sesionUsuario?.username ||
        sesionUsuario?.email ||
        "Ing. Roberto Garza";

      const nuevoId =
        actividades.reduce((max, a) => Math.max(max, a.i_CveActividad), 0) + 1;
      const nuevaActividad: ActividadMock = {
        i_CveActividad: nuevoId,
        v_Titulo: tituloTrim,
        b_General: formActividad.b_General,
        i_CveServAgendaDet: formActividad.b_General
          ? null
          : formActividad.i_CveServAgendaDet,
        d_FechaInicio: dInicio,
        d_FechaFin: dFin,
        b_TieneHorario: formActividad.b_TieneHorario,
        v_Notas: notasLimpias,
        v_Estatus: "Activa",
        i_CveReprograma: null,
        v_Motivo: null,
        v_Registro: nombreConsultor,
      };
      setActividades((prev) => [...prev, nuevaActividad]);
      toast.success("Actividad agregada exitosamente");
    }

    handleCerrarModalActividad();
  };

  // §1: Reprogramar actividad del consultor (usa los mismos campos y validaciones)
  const handleAbrirReprogramarActividad = (act: ActividadMock) => {
    const fechaIniStr = act.d_FechaInicio.split("T")[0] || HOY_MOCK;
    const fechaFinStr = act.d_FechaFin.split("T")[0] || fechaIniStr;
    const hIni =
      act.b_TieneHorario && act.d_FechaInicio.includes("T")
        ? act.d_FechaInicio.split("T")[1].slice(0, 5)
        : "";
    const hFin =
      act.b_TieneHorario && act.d_FechaFin.includes("T")
        ? act.d_FechaFin.split("T")[1].slice(0, 5)
        : "";
    setActividadReprogramando(act);
    setFormReprogramar({
      fechaInicio: fechaIniStr,
      fechaFin: fechaFinStr,
      b_TieneHorario: act.b_TieneHorario,
      horaInicio: hIni,
      horaFin: hFin,
      v_Motivo: "",
    });
  };

  const handleCerrarReprogramarActividad = () => {
    setActividadReprogramando(null);
    setFormReprogramar({
      fechaInicio: HOY_MOCK,
      fechaFin: HOY_MOCK,
      b_TieneHorario: true,
      horaInicio: "09:00",
      horaFin: "10:00",
      v_Motivo: "",
    });
  };

  const handleGuardarReprogramarActividad = () => {
    if (!actividadReprogramando) return;
    if (!formReprogramar.fechaInicio || !formReprogramar.fechaFin) {
      toast.error("La fecha de inicio y la fecha de fin son obligatorias.");
      return;
    }
    if (formReprogramar.fechaFin < formReprogramar.fechaInicio) {
      toast.error("La fecha de fin no puede ser menor que la fecha de inicio.");
      return;
    }
    if (formReprogramar.b_TieneHorario) {
      if (!formReprogramar.horaInicio || !formReprogramar.horaFin) {
        toast.error("La hora de inicio y la hora de fin son obligatorias.");
        return;
      }
      if (
        formReprogramar.fechaInicio === formReprogramar.fechaFin &&
        formReprogramar.horaFin <= formReprogramar.horaInicio
      ) {
        toast.error("La hora de fin debe ser mayor que la hora de inicio.");
        return;
      }
    }

    const dInicio = formReprogramar.b_TieneHorario
      ? `${formReprogramar.fechaInicio}T${formReprogramar.horaInicio}:00`
      : formReprogramar.fechaInicio;
    const dFin = formReprogramar.b_TieneHorario
      ? `${formReprogramar.fechaFin}T${formReprogramar.horaFin}:00`
      : formReprogramar.fechaFin;
    const motivoLimpio = formReprogramar.v_Motivo.trim()
      ? formReprogramar.v_Motivo.trim()
      : null;

    const nuevoId =
      actividades.reduce((max, a) => Math.max(max, a.i_CveActividad), 0) + 1;

    const nuevaActividad: ActividadMock = {
      i_CveActividad: nuevoId,
      v_Titulo: actividadReprogramando.v_Titulo,
      b_General: actividadReprogramando.b_General,
      i_CveServAgendaDet: actividadReprogramando.i_CveServAgendaDet,
      d_FechaInicio: dInicio,
      d_FechaFin: dFin,
      b_TieneHorario: formReprogramar.b_TieneHorario,
      v_Notas: actividadReprogramando.v_Notas,
      v_Estatus: "Activa",
      i_CveReprograma: null,
      v_Motivo: null,
      v_Registro: actividadReprogramando.v_Registro,
    };

    setActividades((prev) => [
      ...prev.map((item) =>
        item.i_CveActividad === actividadReprogramando.i_CveActividad
          ? {
              ...item,
              v_Estatus: "Reprogramada" as const,
              i_CveReprograma: nuevoId,
              v_Motivo: motivoLimpio,
            }
          : item
      ),
      nuevaActividad,
    ]);

    toast.success("Actividad reprogramada exitosamente");
    handleCerrarReprogramarActividad();
  };

  // §4: Cancelar actividad del consultor
  const handleAbrirCancelarActividad = (act: ActividadMock) => {
    setActividadCancelando(act);
    setMotivoCancelar("");
  };

  const handleCerrarCancelarActividad = () => {
    setActividadCancelando(null);
    setMotivoCancelar("");
  };

  const handleConfirmarCancelarActividad = () => {
    if (!actividadCancelando) return;
    const motivoLimpio = motivoCancelar.trim() ? motivoCancelar.trim() : null;

    setActividades((prev) =>
      prev.map((item) =>
        item.i_CveActividad === actividadCancelando.i_CveActividad
          ? {
              ...item,
              v_Estatus: "Cancelada" as const,
              v_Motivo: motivoLimpio,
            }
          : item
      )
    );

    toast.success("Actividad cancelada exitosamente");
    handleCerrarCancelarActividad();
  };

  // §4.1: Abrir modal "Historial de actividades" desde el ojo de la tabla Actividades
  const handleAbrirHistorialActividad = (fila: AgendaConsultorFila) => {
    setFilaEnHistorial(fila);
  };

  const handleCerrarHistorialActividad = () => {
    setFilaEnHistorial(null);
  };

  // Recargar
  const handleRecargar = () => {
    setCargando(true);
    setTimeout(() => {
      setCargando(false);
    }, 220);
  };

  // Abrir modal para un servicio
  const handleAbrirModalServicio = (srv: ServicioAvanceMock) => {
    setModalSesionCapacitacion(null);
    setModalServicioId(srv.i_CveServAgendaDet);
    setNotas(srv.v_Notas || "");
    setNotasBase(srv.v_Notas || "");
    setSliderPorcentaje(srv.i_PorcentajeAvance);
    setNotaAvance("");
    setAcordeonHistorialAvance(false);
    setAcordeonSesiones(true);
  };

  // Abrir modal desde la tabla de Sesiones
  const handleAccionOjoSesion = (sesion: SesionMock) => {
    if (sesion.v_TipoServicio === "Capacitación") {
      setModalServicioId(null);
      setModalSesionCapacitacion(sesion);
      return;
    }
    const encontrado =
      servicios.find(
        (s) => s.i_CveServAgendaDet === sesion.i_CveServAgendaDet
      ) || servicios[0];
    if (encontrado) {
      handleAbrirModalServicio(encontrado);
    }
  };

  const handleCerrarModal = () => {
    setModalServicioId(null);
    setModalSesionCapacitacion(null);
    setNotaAvance("");
    setUploadTarget(null);
  };

  // §2: Guardar notas del servicio
  const notasHanCambiado = (notas.trim() || "") !== (notasBase.trim() || "");
  const deshabilitarGuardarNotas = !notasHanCambiado;

  const handleGuardarNotas = () => {
    if (!servicioEnModal || deshabilitarGuardarNotas) return;
    const nuevoValor = notas.trim() === "" ? null : notas.trim();
    setServicios((prev) =>
      prev.map((item) =>
        item.i_CveServAgendaDet === servicioEnModal.i_CveServAgendaDet
          ? { ...item, v_Notas: nuevoValor }
          : item
      )
    );
    setNotas(nuevoValor ?? "");
    setNotasBase(nuevoValor ?? "");
    toast.success("Notas guardadas exitosamente");
  };

  // §3 y §5: Guardar avance en estado local (NO cierra el modal)
  const avanceHaCambiado = servicioEnModal
    ? sliderPorcentaje !== servicioEnModal.i_PorcentajeAvance ||
      notaAvance.trim() !== ""
    : false;
  const deshabilitarGuardarAvance = !avanceHaCambiado;

  const handleGuardarAvance = () => {
    if (!servicioEnModal || deshabilitarGuardarAvance) return;

    const sesionUsuario = obtenerSesionActual();
    const nombreUsuario =
      sesionUsuario?.username || sesionUsuario?.email || "Admin GI";

    const nuevoRegistro: AvanceHistorialMock = {
      d_Fecha: HOY_MOCK,
      v_Usuario: nombreUsuario,
      i_PorcentajeAvance: sliderPorcentaje,
      v_Nota: notaAvance.trim() ? notaAvance.trim() : null,
    };

    setServicios((prev) =>
      prev.map((item) => {
        if (item.i_CveServAgendaDet !== servicioEnModal.i_CveServAgendaDet) {
          return item;
        }

        // §5 Reglas de estatus:
        // - Avance menor a 100 % -> "En proceso"
        // - Avance en 100 % y término no confirmado (con o sin archivos subidos) -> "Por confirmar"
        // - Se pulsa Confirmar terminado -> "Terminado"
        let nuevoEstatus: ServicioAvanceMock["v_Estatus"] = item.v_Estatus;
        let nuevaFechaTermino = item.d_FechaTermino;

        if (sliderPorcentaje < 100) {
          nuevoEstatus = "En proceso";
          nuevaFechaTermino = null;
        } else if (sliderPorcentaje === 100) {
          if (item.v_Estatus !== "Terminado") {
            nuevoEstatus = "Por confirmar";
          }
        }

        return {
          ...item,
          i_PorcentajeAvance: sliderPorcentaje,
          v_Estatus: nuevoEstatus,
          d_FechaTermino: nuevaFechaTermino,
          historial: [nuevoRegistro, ...item.historial],
        };
      })
    );

    setNotaAvance("");
    toast.success("Avance del proyecto actualizado");
  };

  // §2 y §5: Confirmar terminado
  const handleConfirmarTerminoClick = () => {
    if (!servicioEnModal) return;
    confirmModal({
      title: "¿Confirmas que este servicio ya terminó?",
      message: "Se avisará a administración para facturar.",
      confirmText: "Confirmar",
      cancelText: "Cancelar",
      variant: "primary",
      onConfirm: () => {
        setServicios((prev) =>
          prev.map((item) =>
            item.i_CveServAgendaDet === servicioEnModal.i_CveServAgendaDet
              ? {
                  ...item,
                  v_Estatus: "Terminado",
                  d_FechaTermino: HOY_MOCK,
                  v_ConfirmadoPor: "ALIX CASANOVA",
                }
              : item
          )
        );
        toast.success("Servicio confirmado como terminado");
      },
    });
  };

  // §4: Checklist de entregables: entregable + carta de entrega (bloqueado hasta llegar a 100 %)
  const handleToggleEntregable = (iCveAgendaEntregable: number) => {
    if (!servicioEnModal || servicioEnModal.i_PorcentajeAvance < 100) return;

    setServicios((prev) =>
      prev.map((item) => {
        if (item.i_CveServAgendaDet !== servicioEnModal.i_CveServAgendaDet) {
          return item;
        }
        return {
          ...item,
          entregables: item.entregables.map((ent) =>
            ent.i_CveAgendaEntregable === iCveAgendaEntregable
              ? { ...ent, b_Entregado: !ent.b_Entregado }
              : ent
          ),
        };
      })
    );
  };

  const handleClickSubirArchivo = (
    iCveAgendaEntregable: number,
    tipo: "entregable" | "carta"
  ) => {
    if (!servicioEnModal || servicioEnModal.i_PorcentajeAvance < 100) return;
    setUploadTarget({ i_CveAgendaEntregable: iCveAgendaEntregable, tipo });
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
      fileInputRef.current.click();
    }
  };

  const handleArchivoSeleccionado = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file || !servicioEnModal || !uploadTarget) return;

    const { i_CveAgendaEntregable, tipo } = uploadTarget;

    setServicios((prev) =>
      prev.map((item) => {
        if (item.i_CveServAgendaDet !== servicioEnModal.i_CveServAgendaDet) {
          return item;
        }
        return {
          ...item,
          entregables: item.entregables.map((ent) => {
            if (ent.i_CveAgendaEntregable !== i_CveAgendaEntregable) return ent;
            if (tipo === "entregable") {
              return { ...ent, v_NombreArchivo: file.name };
            }
            return { ...ent, v_NombreArchivoCarta: file.name };
          }),
        };
      })
    );

    toast.success(
      tipo === "entregable"
        ? `Archivo "${file.name}" cargado en el entregable`
        : `Carta de entrega "${file.name}" cargada`
    );
    setUploadTarget(null);
  };

  // Guardar general del footer del modal (igual a ModalDetalleServicio)
  const handleGuardarDetalleFooter = () => {
    if (!servicioEnModal) return;
    toast.success("Detalle del servicio guardado exitosamente");
    handleCerrarModal();
  };

  // Badges de estatus en tabla Servicios (§5)
  const renderEstatusServicioBadge = (
    estatus: ServicioAvanceMock["v_Estatus"]
  ) => {
    switch (estatus) {
      case "Terminado":
        return <span className="badge badge-success">Terminado</span>;
      case "Por confirmar":
        return (
          <span
            className="badge"
            title="Llegó la fecha de finalización estimada. Falta confirmar que terminó."
            style={{ backgroundColor: "#ffe5d0", color: "#984c0c" }}
          >
            Por confirmar
          </span>
        );
      case "En proceso":
        return <span className="badge badge-warning">En proceso</span>;
      default:
        return <span className="badge badge-primary">Programado</span>;
    }
  };

  const renderEstatusSesionBadge = (estatus: EstatusFilaAgenda) => {
    switch (estatus) {
      case "Terminado":
        return <span className="badge badge-success">Terminado</span>;
      case "En curso":
        return <span className="badge badge-warning">En curso</span>;
      default:
        return <span className="badge badge-primary">Programado</span>;
    }
  };

  const renderBadgeSesionModal = (
    estatusSesion: SesionDetalleMock["v_EstatusSesion"]
  ) => {
    if (estatusSesion === "Cancelado") {
      return (
        <span
          style={{
            padding: "3px 14px",
            borderRadius: "20px",
            fontSize: "12px",
            fontWeight: 700,
            backgroundColor: "#ef4444",
            color: "#ffffff",
            display: "inline-block",
          }}
        >
          Cancelado
        </span>
      );
    }
    if (estatusSesion === "Reprogramada") {
      return (
        <span
          style={{
            padding: "3px 14px",
            borderRadius: "20px",
            fontSize: "12px",
            fontWeight: 700,
            backgroundColor: "#f59e0b",
            color: "#ffffff",
            display: "inline-block",
          }}
        >
          Reprogramada
        </span>
      );
    }
    if (estatusSesion === "Completada") {
      return (
        <span
          style={{
            padding: "3px 14px",
            borderRadius: "20px",
            fontSize: "12px",
            fontWeight: 700,
            backgroundColor: "#10b981",
            color: "#ffffff",
            display: "inline-block",
          }}
        >
          Completada
        </span>
      );
    }
    return (
      <span
        style={{
          padding: "3px 14px",
          borderRadius: "20px",
          fontSize: "12px",
          fontWeight: 700,
          backgroundColor: "#208bfe",
          color: "#ffffff",
          display: "inline-block",
        }}
      >
        Programado
      </span>
    );
  };

  const totalRegistrosActivos =
    vista === "servicios"
      ? serviciosFiltrados.length
      : filasAgendaConsultor.length;

  return (
    <AppLayout>
      {/* Input oculto para subir archivo / carta de entrega en mockup */}
      <input
        ref={fileInputRef}
        type="file"
        style={{ display: "none" }}
        onChange={handleArchivoSeleccionado}
      />

      {/* Encabezado */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Avance de proyectos</h1>
          <p className="subtext">
            Servicios agendados con el seguimiento de días y porcentaje de avance
            de cada proyecto.
          </p>
        </div>

        <button
          type="button"
          className="btn btn-outline"
          onClick={handleRecargar}
          disabled={cargando}
          title="Recargar datos"
        >
          <RefreshCw size={16} className={cargando ? "animate-spin" : ""} />
          Recargar
        </button>
      </div>

      {/* Card de Filtros */}
      <div
        className="card mb-4 p-4 filter-card"
        style={{ position: "relative", zIndex: 40, overflow: "visible" }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "flex-end",
            gap: "16px",
            flexWrap: "wrap",
            paddingBottom: "4px",
            overflow: "visible",
          }}
        >
          {/* Visualizar */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "4px",
              minWidth: "140px",
            }}
          >
            <label className="form-label" style={{ marginBottom: 0 }}>
              Visualizar
            </label>
            <select
              className="form-select text-xs py-1.5"
              style={{ borderRadius: "20px", height: "32px", fontWeight: 600 }}
              value={vista}
              onChange={(e) => {
                setVista(e.target.value as "servicios" | "sesiones");
                setPaginaActual(1);
              }}
            >
              <option value="servicios">Servicios</option>
              <option value="sesiones">Actividades</option>
            </select>
          </div>

          {/* Rango de fechas */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "4px",
              minWidth: "220px",
              position: "relative",
              zIndex: 50,
            }}
          >
            <label className="form-label" style={{ marginBottom: 0 }}>
              Rango de fechas
            </label>
            {vista === "servicios" ? (
              <DateRangePickerPopover
                fechaInicio={rangoServicios.inicio}
                fechaFin={rangoServicios.fin}
                onChangeRange={(ini, fin) =>
                  setRangoServicios({ inicio: ini, fin: fin || ini })
                }
              />
            ) : (
              <DateRangePickerPopover
                fechaInicio={fechaSesiones}
                fechaFin=""
                onChangeRange={(ini) => setFechaSesiones(ini)}
              />
            )}
          </div>

          {/* Checkbox "Solo con días excedidos" (solo en vista Servicios) */}
          {vista === "servicios" && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                height: "32px",
              }}
            >
              <label
                htmlFor="chk-solo-dias-excedidos"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "7px",
                  fontSize: "12px",
                  fontWeight: 500,
                  color: "#334155",
                  cursor: "pointer",
                  userSelect: "none",
                  margin: 0,
                }}
              >
                <input
                  id="chk-solo-dias-excedidos"
                  type="checkbox"
                  checked={soloExcedidos}
                  onChange={(e) => {
                    setSoloExcedidos(e.target.checked);
                    setPaginaActual(1);
                  }}
                  style={{
                    width: "15px",
                    height: "15px",
                    accentColor: "#2B8FCC",
                    cursor: "pointer",
                    margin: 0,
                  }}
                />
                <span>Solo con días excedidos</span>
              </label>
            </div>
          )}

          {/* Buscar + Botón Agregar actividad (solo en Sesiones — §3) */}
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              alignItems: "flex-end",
              gap: "8px",
              marginLeft: "auto",
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "4px",
                width: "220px",
                minWidth: "160px",
              }}
            >
              <label className="form-label" style={{ marginBottom: 0 }}>
                Buscar
              </label>
              <div style={{ position: "relative", width: "100%" }}>
                <Search
                  size={14}
                  style={{
                    position: "absolute",
                    left: "10px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "#94a3b8",
                    pointerEvents: "none",
                  }}
                />
                <input
                  type="text"
                  className="form-control text-xs py-1.5"
                  style={{
                    width: "100%",
                    paddingLeft: "28px",
                    borderRadius: "20px",
                    height: "32px",
                  }}
                  placeholder={
                    vista === "servicios"
                      ? "Buscar servicio (Enter)..."
                      : "Buscar actividad (Enter)..."
                  }
                  value={busquedaTexto}
                  onChange={(e) => setBusquedaTexto(e.target.value)}
                />
              </div>
            </div>

            {vista === "sesiones" && (
              <button
                type="button"
                className="btn btn-outline"
                onClick={handleAbrirCrearActividad}
                style={{
                  height: "32px",
                  padding: "0 12px",
                  fontSize: "12px",
                  whiteSpace: "nowrap",
                }}
              >
                <Plus size={16} />
                Agregar actividad
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ====================================================================
          VISTA SERVICIOS
      ==================================================================== */}
      {vista === "servicios" ? (
        <div className="alegra-table-container">
          <table className="alegra-table">
            <thead>
              <tr>
                <th>Cliente</th>
                <th>Servicio</th>
                <th>Fechas</th>
                <th>Días</th>
                <th style={{ minWidth: "155px" }}>Avance</th>
                <th>Estatus</th>
                <th>Titular / Apoyo</th>
                <th>Entregables</th>
                <th
                  className="text-center whitespace-nowrap"
                  style={{ width: "80px", minWidth: "80px" }}
                >
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody>
              {cargando ? (
                Array.from({ length: 4 }).map((_, idx) => (
                  <tr key={`sk-srv-${idx}`}>
                    <td>
                      <div
                        className="skeleton-box"
                        style={{ width: "80%", marginBottom: "4px" }}
                      />
                      <div className="skeleton-box sm" style={{ width: "45%" }} />
                    </td>
                    <td>
                      <div
                        className="skeleton-box"
                        style={{ width: "75%", marginBottom: "4px" }}
                      />
                      <div className="skeleton-box sm" style={{ width: "35%" }} />
                    </td>
                    <td>
                      <div className="skeleton-box sm" style={{ width: "90px" }} />
                    </td>
                    <td>
                      <div className="skeleton-box sm" style={{ width: "70px" }} />
                    </td>
                    <td>
                      <div className="skeleton-box" style={{ width: "120px" }} />
                    </td>
                    <td>
                      <div
                        className="skeleton-box"
                        style={{
                          width: "75px",
                          height: "20px",
                          borderRadius: "10px",
                        }}
                      />
                    </td>
                    <td>
                      <div className="skeleton-box sm" style={{ width: "70%" }} />
                    </td>
                    <td>
                      <div className="skeleton-box sm" style={{ width: "65%" }} />
                    </td>
                    <td className="text-center">
                      <div
                        className="skeleton-circle"
                        style={{ margin: "0 auto" }}
                      />
                    </td>
                  </tr>
                ))
              ) : serviciosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-8 text-secondary">
                    No se encontraron servicios con los filtros seleccionados.
                  </td>
                </tr>
              ) : (
                serviciosFiltrados.map((row) => {
                  const {
                    i_DiasTotales,
                    i_DiasExcedidos,
                    i_DiasRestantes,
                  } = calcularMetricasDias(row);

                  return (
                    <tr key={row.i_CveServAgendaDet}>
                      {/* 1. Cliente */}
                      <td>
                        <div
                          style={{ fontWeight: 700, color: "#1e3a5f" }}
                          className="uppercase"
                        >
                          {row.v_Empresa.trim()}
                        </div>
                        <span className="subtext">{row.v_Planta}</span>
                      </td>

                      {/* 2. Servicio (nombre en negritas + chip de tipo) */}
                      <td>
                        <div
                          style={{
                            fontWeight: 700,
                            color: "#1e3a5f",
                            marginBottom: "4px",
                          }}
                        >
                          {row.v_Servicio}
                        </div>
                        <BadgeTipoServicio tipoServicio={row.v_TipoServicio} />
                      </td>

                      {/* 3. Fechas */}
                      <td style={{ whiteSpace: "nowrap" }}>
                        <div style={{ fontSize: "12px", color: "#1e293b" }}>
                          {formatearFechaTexto(row.d_FechaInicio)} –
                        </div>
                        <div style={{ fontSize: "12px", color: "#475569" }}>
                          {formatearFechaTexto(row.d_FechaFin)}
                        </div>
                      </td>

                      {/* 4. Días */}
                      <td style={{ whiteSpace: "nowrap" }}>
                        <div
                          style={{
                            fontWeight: 700,
                            color: "#1e3a5f",
                            fontSize: "12.5px",
                            marginBottom: "3px",
                          }}
                        >
                          {i_DiasTotales} días
                        </div>
                        {i_DiasExcedidos > 0 ? (
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              padding: "2px 7px",
                              borderRadius: "10px",
                              fontSize: "11px",
                              fontWeight: 600,
                              backgroundColor: "#fee2e2",
                              color: "#b91c1c",
                            }}
                          >
                            +{i_DiasExcedidos} excedidos
                          </span>
                        ) : (
                          <span
                            style={{
                              fontSize: "11px",
                              color: "#64748b",
                            }}
                          >
                            En tiempo
                          </span>
                        )}
                      </td>

                      {/* 5. Avance */}
                      <td>
                        <BarraAvanceProyecto
                          porcentaje={row.i_PorcentajeAvance}
                          estatus={row.v_Estatus}
                          diasExcedidos={i_DiasExcedidos}
                          diasRestantes={i_DiasRestantes}
                        />
                      </td>

                      {/* 6. Estatus */}
                      <td>{renderEstatusServicioBadge(row.v_Estatus)}</td>

                      {/* 7. Titular / Apoyo */}
                      <td>
                        <div
                          className="font-medium"
                          style={{ fontSize: "13px", color: "#1e3a5f" }}
                        >
                          {row.v_TitularApoyo}
                        </div>
                      </td>

                      {/* 8. Entregables (§4: igual que hoy en Programación: link si ya se subió/entregó, o en rojo si está pendiente) */}
                      <td>
                        {(() => {
                          const partes: React.ReactNode[] = [];

                          row.entregables.forEach((ent) => {
                            if (ent.b_Entregado && ent.v_NombreArchivo) {
                              partes.push(
                                <a
                                  key={`ent-${ent.i_CveAgendaEntregable}`}
                                  href="#"
                                  style={{
                                    color: "#2B8FCC",
                                    textDecoration: "underline",
                                    cursor: "pointer",
                                    fontSize: "12px",
                                    fontWeight: 500,
                                    whiteSpace: "nowrap",
                                  }}
                                  onClick={(e) => {
                                    e.preventDefault();
                                    toast.info(
                                      `Vista previa (mock): ${ent.v_NombreArchivo}`
                                    );
                                  }}
                                  title={`Ver documento: ${ent.v_NombreArchivo}`}
                                >
                                  {ent.v_Entregable}
                                </a>
                              );
                            } else if (ent.b_Entregado) {
                              partes.push(
                                <span
                                  key={`ent-${ent.i_CveAgendaEntregable}`}
                                  style={{
                                    color: "#1e293b",
                                    fontSize: "12px",
                                    fontWeight: 400,
                                    whiteSpace: "nowrap",
                                  }}
                                >
                                  {ent.v_Entregable}
                                </span>
                              );
                            } else if (ent.v_NombreArchivo) {
                              partes.push(
                                <a
                                  key={`ent-${ent.i_CveAgendaEntregable}`}
                                  href="#"
                                  style={{
                                    color: "#2B8FCC",
                                    textDecoration: "underline",
                                    cursor: "pointer",
                                    fontSize: "12px",
                                    fontWeight: 500,
                                    whiteSpace: "nowrap",
                                  }}
                                  onClick={(e) => {
                                    e.preventDefault();
                                    toast.info(
                                      `Vista previa (mock): ${ent.v_NombreArchivo}`
                                    );
                                  }}
                                  title={`Ver documento: ${ent.v_NombreArchivo}`}
                                >
                                  {ent.v_Entregable}
                                </a>
                              );
                            } else {
                              partes.push(
                                <span
                                  key={`ent-${ent.i_CveAgendaEntregable}`}
                                  style={{
                                    color: "#dc3545",
                                    fontWeight: 500,
                                    fontSize: "12px",
                                    whiteSpace: "nowrap",
                                  }}
                                >
                                  {ent.v_Entregable}
                                </span>
                              );
                            }
                          });

                          if (row.b_AplicaVoBo) {
                            if (row.v_NombreArchivoVoBo) {
                              partes.push(
                                <a
                                  key={`vobo-${row.i_CveServAgendaDet}`}
                                  href="#"
                                  style={{
                                    color: "#2B8FCC",
                                    textDecoration: "underline",
                                    cursor: "pointer",
                                    fontSize: "12px",
                                    fontWeight: 500,
                                    whiteSpace: "nowrap",
                                  }}
                                  onClick={(e) => {
                                    e.preventDefault();
                                    toast.info(
                                      `Vista previa (mock): ${row.v_NombreArchivoVoBo}`
                                    );
                                  }}
                                  title="Ver visto bueno de la autoridad"
                                >
                                  VoBo autoridad
                                </a>
                              );
                            } else {
                              partes.push(
                                <span
                                  key={`vobo-${row.i_CveServAgendaDet}`}
                                  style={{
                                    color: "#dc3545",
                                    fontWeight: 500,
                                    fontSize: "12px",
                                    whiteSpace: "nowrap",
                                  }}
                                >
                                  VoBo autoridad
                                </span>
                              );
                            }
                          }

                          return (
                            <div
                              style={{
                                display: "flex",
                                flexWrap: "wrap",
                                gap: "4px",
                                alignItems: "center",
                              }}
                            >
                              {partes.map((nodo, idx) => (
                                <React.Fragment key={`frag-${idx}`}>
                                  {nodo}
                                  {idx < partes.length - 1 && (
                                    <span
                                      style={{
                                        color: "#94a3b8",
                                        fontSize: "12px",
                                        marginRight: "2px",
                                      }}
                                    >
                                      ,
                                    </span>
                                  )}
                                </React.Fragment>
                              ))}
                            </div>
                          );
                        })()}
                      </td>

                      {/* 9. Acciones */}
                      <td className="text-center whitespace-nowrap">
                        <button
                          type="button"
                          className="btn-icon"
                          onClick={() => handleAbrirModalServicio(row)}
                          title="Ver detalle del servicio"
                        >
                          <Eye size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      ) : (
        /* ====================================================================
            VISTA SESIONES (Agenda del consultor: Sesiones + Actividades — §2)
        ==================================================================== */
        <div className="alegra-table-container">
          <table className="alegra-table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Horario</th>
                <th>Cliente</th>
                <th style={{ minWidth: "320px", width: "38%" }}>Actividad</th>
                <th>Duración</th>
                <th>Estatus</th>
                <th className="text-center" style={{ width: "90px" }}>
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody>
              {filasAgendaConsultor.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-secondary">
                    No se encontraron sesiones ni actividades.
                  </td>
                </tr>
              ) : (
                filasAgendaConsultor.map((fila) => {
                  const estatusFila = obtenerEstatusFilaAgenda(fila);

                  if (fila.tipo === "sesion") {
                    const ses = fila.sesion;
                    const { texto: fechaTexto, esHoy } =
                      formatearFechaSesionMock(ses.d_FechaHoraInicio);
                    const horarioTexto = formatearHorarioSesionMock(
                      ses.d_FechaHoraInicio,
                      ses.d_FechaHoraFin,
                      ses.v_ModoHorario
                    );

                    return (
                      <tr
                        key={`ses-${ses.i_CveAgendaDetalle}`}
                        style={
                          esHoy ? { backgroundColor: "#eef6fd" } : undefined
                        }
                      >
                        {/* 1. Fecha */}
                        <td>
                          <div
                            style={{
                              fontWeight: esHoy ? 700 : 400,
                              color: esHoy ? "#188ae2" : "#1e3a5f",
                            }}
                          >
                            {fechaTexto}
                          </div>
                        </td>

                        {/* 2. Horario */}
                        <td style={{ whiteSpace: "nowrap" }}>
                          <span>{horarioTexto}</span>
                        </td>

                        {/* 3. Cliente */}
                        <td>
                          <div
                            style={{ fontWeight: 700, color: "#1e3a5f" }}
                            className="uppercase"
                          >
                            {ses.v_Empresa}
                          </div>
                          {ses.v_Planta && (
                            <span className="subtext">{ses.v_Planta}</span>
                          )}
                        </td>

                        {/* 4. Actividad (Título: descripción + chip de tipo debajo) */}
                        <td
                          style={{
                            whiteSpace: "normal",
                            wordBreak: "break-word",
                            minWidth: "280px",
                          }}
                        >
                          <div
                            style={{
                              color: "#1e3a5f",
                              lineHeight: 1.4,
                              marginBottom: "4px",
                            }}
                          >
                            <span style={{ fontWeight: 700 }}>
                              {ses.v_Actividad}:
                            </span>{" "}
                            <span style={{ fontWeight: 400 }}>
                              {ses.v_Servicio}
                            </span>
                          </div>
                          <BadgeTipoServicio
                            tipoServicio={ses.v_TipoServicio}
                          />
                        </td>

                        {/* 5. Duración */}
                        <td style={{ whiteSpace: "nowrap" }}>
                          <span>{ses.v_Duracion}</span>
                        </td>

                        {/* 6. Estatus */}
                        <td>
                          {renderEstatusSesionBadge(estatusFila)}
                        </td>

                        {/* 7. Acciones: Ojo abre Historial de actividades (§3) */}
                        <td className="text-center whitespace-nowrap">
                          <button
                            type="button"
                            className="btn-icon"
                            onClick={() => handleAbrirHistorialActividad(fila)}
                            title="Historial de actividades"
                            style={{ color: "#188ae2" }}
                          >
                            <Eye size={16} />
                          </button>
                        </td>
                      </tr>
                    );
                  }

                  // Fila de Actividad del consultor (§1 y §2)
                  const act = fila.actividad;
                  const momento = fila.momento;
                  const { texto: fechaTexto, esHoy } =
                    formatearFechaActividadTabla(act, momento);
                  const { texto: horarioTexto, esTodoElDia } =
                    formatearHorarioActividadTabla(act, momento);
                  const duracionTexto = calcularDuracionActividadTabla(
                    act,
                    momento
                  );
                  const tituloConMomento = obtenerTituloActividadConMomento(
                    act,
                    momento
                  );
                  const notasLimpia = act.v_Notas ? act.v_Notas.trim() : "";
                  const srvLigado =
                    !act.b_General && act.i_CveServAgendaDet
                      ? servicios.find(
                          (s) => s.i_CveServAgendaDet === act.i_CveServAgendaDet
                        ) || null
                      : null;

                  return (
                    <tr
                      key={`act-${act.i_CveActividad}-${momento}`}
                      style={esHoy ? { backgroundColor: "#eef6fd" } : undefined}
                    >
                      {/* 1. Fecha */}
                      <td>
                        <div
                          style={{
                            fontWeight: esHoy ? 700 : 400,
                            color: esHoy ? "#188ae2" : "#1e3a5f",
                          }}
                        >
                          {fechaTexto}
                        </div>
                      </td>

                      {/* 2. Horario */}
                      <td style={{ whiteSpace: "nowrap" }}>
                        <span
                          style={
                            esTodoElDia ? { color: "#64748b" } : undefined
                          }
                        >
                          {horarioTexto}
                        </span>
                      </td>

                      {/* 3. Cliente */}
                      <td>
                        {act.b_General || !srvLigado ? (
                          <span style={{ color: "#64748b" }}>—</span>
                        ) : (
                          <>
                            <div
                              style={{ fontWeight: 700, color: "#1e3a5f" }}
                              className="uppercase"
                            >
                              {srvLigado.v_Empresa.trim()}
                            </div>
                            <span className="subtext">
                              {srvLigado.v_Planta}
                            </span>
                          </>
                        )}
                      </td>

                      {/* 4. Actividad (Título / Inicio · Título / Fin · Título: notas, o sin dos puntos si no tiene notas) */}
                      <td
                        style={{
                          whiteSpace: "normal",
                          wordBreak: "break-word",
                          minWidth: "280px",
                        }}
                      >
                        <div
                          style={{
                            color: "#1e3a5f",
                            lineHeight: 1.4,
                          }}
                        >
                          {notasLimpia ? (
                            <>
                              <span style={{ fontWeight: 700 }}>
                                {tituloConMomento}:
                              </span>{" "}
                              <span style={{ fontWeight: 400 }}>
                                {notasLimpia}
                              </span>
                            </>
                          ) : (
                            <span style={{ fontWeight: 700 }}>
                              {tituloConMomento}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* 5. Duración */}
                      <td style={{ whiteSpace: "nowrap" }}>
                        <span>{duracionTexto}</span>
                      </td>

                      {/* 6. Estatus */}
                      <td>{renderEstatusSesionBadge(estatusFila)}</td>

                      {/* 7. Acciones: Ojo (Historial), Lápiz (editar), Reprogramar y Cancelar (§2) */}
                      <td
                        className="text-center whitespace-nowrap"
                        style={{ width: "130px", minWidth: "130px" }}
                      >
                        <div
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "6px",
                          }}
                        >
                          <button
                            type="button"
                            className="btn-icon"
                            onClick={() => handleAbrirHistorialActividad(fila)}
                            title="Historial de actividades"
                            style={{ color: "#188ae2" }}
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            type="button"
                            className="btn-icon"
                            onClick={() => handleAbrirEditarActividad(act)}
                            title="Editar actividad"
                            style={{ color: "#2B8FCC" }}
                          >
                            <Edit2 size={15} />
                          </button>
                          <button
                            type="button"
                            className="btn-icon"
                            onClick={() => handleAbrirReprogramarActividad(act)}
                            title="Reprogramar actividad"
                            style={{ color: "#d97706" }}
                          >
                            <RefreshCw size={15} />
                          </button>
                          <button
                            type="button"
                            className="btn-icon"
                            onClick={() => handleAbrirCancelarActividad(act)}
                            title="Cancelar actividad"
                            style={{ color: "#dc3545" }}
                          >
                            <Ban size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Paginador */}
      <PaginadorCustom
        paginaActual={paginaActual}
        totalPaginas={1}
        totalRegistros={totalRegistrosActivos}
        tamano={tamanoPagina}
        onCambioPagina={(pag) => setPaginaActual(pag)}
        onCambioTamano={(tam) => {
          setTamanoPagina(tam);
          setPaginaActual(1);
        }}
      />

      {/* ====================================================================
          MODAL DE DETALLE (§2, §3, §4, §5 — Igual al modal actual de Programación)
      ==================================================================== */}
      {(servicioEnModal || modalSesionCapacitacion) && (
        <div
          className="modal-overlay"
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(15, 23, 42, 0.6)",
            backdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "16px",
          }}
          onClick={handleCerrarModal}
        >
          <div
            className="modal-content no-scrollbar"
            style={{
              maxWidth: "850px",
              width: "100%",
              maxHeight: "98vh",
              backgroundColor: "#ffffff",
              borderRadius: "16px",
              boxShadow:
                "0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0, 0, 0, 0.05)",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
              scrollbarWidth: "none",
              msOverflowStyle: "none",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header del Modal (idéntico a ModalDetalleServicio) */}
            <div
              className="modal-header shrink-0"
              style={{
                padding: "18px 24px",
                borderBottom: "1px solid #f1f5f9",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                background: "#ffffff",
              }}
            >
              <h3
                style={{
                  fontSize: "15px",
                  fontWeight: 500,
                  color: "#0f172a",
                  margin: 0,
                }}
              >
                Detalle del servicio
              </h3>
              <button
                type="button"
                className="btn-icon"
                onClick={handleCerrarModal}
                style={{
                  padding: "6px",
                  borderRadius: "50%",
                  border: "none",
                  background: "transparent",
                  color: "#64748b",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Body del Modal con Scroll Interno (24px gap entre secciones) */}
            <div
              className="modal-body no-scrollbar"
              style={{
                padding: "24px",
                flex: 1,
                overflowY: "auto",
                scrollbarWidth: "none",
                msOverflowStyle: "none",
                display: "flex",
                flexDirection: "column",
                gap: "24px",
              }}
            >
              {/* Caso Capacitación desde Sesiones */}
              {modalSesionCapacitacion && (
                <>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(auto-fit, minmax(160px, 1fr))",
                      gap: "16px",
                    }}
                  >
                    <div>
                      <span
                        style={{
                          fontSize: "11px",
                          fontWeight: 400,
                          color: "#64748b",
                          display: "block",
                          marginBottom: "2px",
                        }}
                      >
                        servicio
                      </span>
                      <p
                        style={{
                          fontSize: "13px",
                          fontWeight: 400,
                          color: "#0f172a",
                          margin: 0,
                          lineHeight: 1.3,
                        }}
                      >
                        {modalSesionCapacitacion.v_Servicio}
                      </p>
                    </div>
                    <div>
                      <span
                        style={{
                          fontSize: "11px",
                          fontWeight: 400,
                          color: "#64748b",
                          display: "block",
                          marginBottom: "2px",
                        }}
                      >
                        tipo
                      </span>
                      <p
                        style={{
                          fontSize: "13px",
                          fontWeight: 400,
                          color: "#0f172a",
                          margin: 0,
                          lineHeight: 1.3,
                        }}
                      >
                        {modalSesionCapacitacion.v_TipoServicio}
                      </p>
                    </div>
                    <div>
                      <span
                        style={{
                          fontSize: "11px",
                          fontWeight: 400,
                          color: "#64748b",
                          display: "block",
                          marginBottom: "2px",
                        }}
                      >
                        empresa
                      </span>
                      <p
                        style={{
                          fontSize: "13px",
                          fontWeight: 400,
                          color: "#0f172a",
                          margin: 0,
                          textTransform: "uppercase",
                          lineHeight: 1.3,
                        }}
                      >
                        {modalSesionCapacitacion.v_Empresa}
                      </p>
                    </div>
                  </div>

                  <div
                    style={{
                      padding: "16px",
                      borderRadius: "10px",
                      backgroundColor: "#f8fafc",
                      border: "1px solid #e2e8f0",
                      color: "#475569",
                      fontSize: "13px",
                    }}
                  >
                    Las capacitaciones no manejan porcentaje de avance; el
                    detalle se muestra como hoy.
                  </div>
                </>
              )}

              {/* Caso Servicio / Estudio (Orden exacto de las 7 secciones §2) */}
              {servicioEnModal &&
                (() => {
                  const entregablesHabilitados =
                    servicioEnModal.i_PorcentajeAvance === 100;

                  return (
                    <>
                      {/* SECCIONES 1, 2 y 3: Encabezado + Aviso Por confirmar + Notas */}
                      <div>
                        {/* 1. Encabezado: servicio (con cantidad y unidad debajo), tipo, empresa, planta */}
                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns:
                              "repeat(auto-fit, minmax(160px, 1fr))",
                            gap: "16px",
                          }}
                        >
                          <div>
                            <span
                              style={{
                                fontSize: "11px",
                                fontWeight: 400,
                                color: "#64748b",
                                display: "block",
                                marginBottom: "2px",
                              }}
                            >
                              servicio
                            </span>
                            <p
                              style={{
                                fontSize: "13px",
                                fontWeight: 400,
                                color: "#0f172a",
                                margin: 0,
                                lineHeight: 1.3,
                              }}
                            >
                              {servicioEnModal.v_Servicio || "—"}
                            </p>
                            <p
                              style={{
                                fontSize: "12px",
                                fontWeight: 400,
                                color: "#64748b",
                                margin: "2px 0 0 0",
                              }}
                            >
                              {servicioEnModal.i_Cantidad}{" "}
                              {servicioEnModal.v_Unidad}
                            </p>
                          </div>

                          <div>
                            <span
                              style={{
                                fontSize: "11px",
                                fontWeight: 400,
                                color: "#64748b",
                                display: "block",
                                marginBottom: "2px",
                              }}
                            >
                              tipo
                            </span>
                            <p
                              style={{
                                fontSize: "13px",
                                fontWeight: 400,
                                color: "#0f172a",
                                margin: 0,
                                lineHeight: 1.3,
                              }}
                            >
                              {servicioEnModal.v_TipoServicio || "—"}
                            </p>
                          </div>

                          <div>
                            <span
                              style={{
                                fontSize: "11px",
                                fontWeight: 400,
                                color: "#64748b",
                                display: "block",
                                marginBottom: "2px",
                              }}
                            >
                              empresa
                            </span>
                            <p
                              style={{
                                fontSize: "13px",
                                fontWeight: 400,
                                color: "#0f172a",
                                margin: 0,
                                textTransform: "uppercase",
                                lineHeight: 1.3,
                              }}
                            >
                              {servicioEnModal.v_Empresa.trim() || "—"}
                            </p>
                          </div>

                          <div>
                            <span
                              style={{
                                fontSize: "11px",
                                fontWeight: 400,
                                color: "#64748b",
                                display: "block",
                                marginBottom: "2px",
                              }}
                            >
                              planta
                            </span>
                            <p
                              style={{
                                fontSize: "13px",
                                fontWeight: 400,
                                color: "#0f172a",
                                margin: 0,
                                lineHeight: 1.3,
                              }}
                            >
                              {servicioEnModal.v_Planta || "—"}
                            </p>
                          </div>
                        </div>

                        {/* 2. Aviso "Por confirmar" con botón "Confirmar terminado" (solo cuando estatus es Por confirmar) */}
                        {servicioEnModal.v_Estatus === "Por confirmar" && (
                          <div
                            style={{
                              marginTop: "14px",
                              padding: "12px 14px",
                              backgroundColor: "#fff4ec",
                              border: "1px solid #ffd3b0",
                              borderRadius: "8px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              gap: "12px",
                              flexWrap: "wrap",
                              fontSize: "12px",
                              color: "#b54708",
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                                flex: "1 1 auto",
                                minWidth: 0,
                              }}
                            >
                              <AlertTriangle
                                size={16}
                                style={{ color: "#b54708", flexShrink: 0 }}
                              />
                              <span style={{ fontWeight: 500, lineHeight: 1.4 }}>
                                Por confirmar · Llegó la fecha de finalización
                                estimada. ¿Ya terminó?
                              </span>
                            </div>

                            <button
                              type="button"
                              className="btn"
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "6px",
                                backgroundColor: "#16a34a",
                                color: "#ffffff",
                                fontSize: "12px",
                                fontWeight: 600,
                                padding: "6px 14px",
                                borderRadius: "6px",
                                border: "none",
                                cursor: "pointer",
                                whiteSpace: "nowrap",
                                flexShrink: 0,
                              }}
                              onClick={handleConfirmarTerminoClick}
                            >
                              <CheckCircle2 size={16} />
                              Confirmar terminado
                            </button>
                          </div>
                        )}

                        {/* 3. Notas con "Guardar notas" (igual al actual) */}
                        <div style={{ marginTop: "16px" }}>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              marginBottom: "6px",
                            }}
                          >
                            <span
                              style={{
                                fontSize: "11px",
                                fontWeight: 400,
                                color: "#64748b",
                                display: "block",
                              }}
                            >
                              notas
                            </span>
                            <button
                              type="button"
                              className="btn btn-sm btn-primary"
                              onClick={handleGuardarNotas}
                              disabled={deshabilitarGuardarNotas}
                              style={{
                                fontSize: "12px",
                                height: "28px",
                                padding: "0 12px",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "6px",
                                backgroundColor: deshabilitarGuardarNotas
                                  ? "#e2e8f0"
                                  : "#2B8FCC",
                                color: deshabilitarGuardarNotas
                                  ? "#94a3b8"
                                  : "#ffffff",
                                borderColor: "transparent",
                                cursor: deshabilitarGuardarNotas
                                  ? "not-allowed"
                                  : "pointer",
                                borderRadius: "6px",
                                fontWeight: 500,
                              }}
                            >
                              Guardar notas
                            </button>
                          </div>
                          <textarea
                            rows={2}
                            className="form-control"
                            placeholder="Sin notas"
                            value={notas}
                            onChange={(e) => setNotas(e.target.value)}
                            style={{
                              width: "100%",
                              fontSize: "13px",
                              borderRadius: "8px",
                              border: "1px solid #d0dce8",
                              padding: "8px 12px",
                              resize: "vertical",
                              minHeight: "56px",
                              backgroundColor: "#ffffff",
                              color: "#0f172a",
                              fontFamily: "inherit",
                            }}
                          />
                        </div>
                      </div>

                      {/* 4. SECCIÓN NUEVA: "Avance del proyecto" (§3 — mismo estilo de card que Información de montos) */}
                      <div
                        style={{
                          backgroundColor: "#f8fafc",
                          border: "1px solid #e2e8f0",
                          borderRadius: "10px",
                          padding: "16px",
                          display: "flex",
                          flexDirection: "column",
                          gap: "12px",
                        }}
                      >
                        {/* Título gris + Porcentaje a la derecha */}
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}
                        >
                          <h4
                            style={{
                              fontSize: "12px",
                              fontWeight: 500,
                              color: "#64748b",
                              margin: 0,
                            }}
                          >
                            Avance del proyecto
                          </h4>
                          <span
                            style={{
                              fontSize: "14px",
                              fontWeight: 600,
                              color:
                                sliderPorcentaje === 0
                                  ? COLOR_ROJO_ALERTA
                                  : COLOR_VERDE_AVANCE,
                            }}
                          >
                            {sliderPorcentaje} %
                          </span>
                        </div>

                        {/* Slider de 0 a 100 en pasos de 5 con escala debajo */}
                        <div>
                          <input
                            type="range"
                            min={0}
                            max={100}
                            step={5}
                            value={sliderPorcentaje}
                            onChange={(e) =>
                              setSliderPorcentaje(Number(e.target.value))
                            }
                            style={{
                              width: "100%",
                              accentColor: "#2B8FCC",
                              cursor: "pointer",
                            }}
                          />
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              fontSize: "11px",
                              color: "#64748b",
                              marginTop: "2px",
                            }}
                          >
                            <span>0 %</span>
                            <span>25 %</span>
                            <span>50 %</span>
                            <span>75 %</span>
                            <span>100 %</span>
                          </div>
                        </div>

                        {/* Nota del avance + botón Guardar avance */}
                        <div>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              marginBottom: "6px",
                            }}
                          >
                            <span
                              style={{
                                fontSize: "11px",
                                fontWeight: 400,
                                color: "#64748b",
                                display: "block",
                              }}
                            >
                              nota del avance
                            </span>
                            <button
                              type="button"
                              className="btn btn-sm btn-primary"
                              onClick={handleGuardarAvance}
                              disabled={deshabilitarGuardarAvance}
                              style={{
                                fontSize: "12px",
                                height: "28px",
                                padding: "0 12px",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "6px",
                                backgroundColor: deshabilitarGuardarAvance
                                  ? "#e2e8f0"
                                  : "#2B8FCC",
                                color: deshabilitarGuardarAvance
                                  ? "#94a3b8"
                                  : "#ffffff",
                                borderColor: "transparent",
                                cursor: deshabilitarGuardarAvance
                                  ? "not-allowed"
                                  : "pointer",
                                borderRadius: "6px",
                                fontWeight: 500,
                              }}
                            >
                              Guardar avance
                            </button>
                          </div>
                          <textarea
                            rows={2}
                            className="form-control"
                            placeholder="Sin nota del avance"
                            value={notaAvance}
                            onChange={(e) => setNotaAvance(e.target.value)}
                            style={{
                              width: "100%",
                              fontSize: "13px",
                              borderRadius: "8px",
                              border: "1px solid #d0dce8",
                              padding: "8px 12px",
                              resize: "vertical",
                              minHeight: "56px",
                              backgroundColor: "#ffffff",
                              color: "#0f172a",
                              fontFamily: "inherit",
                            }}
                          />
                        </div>

                        {/* Desplegable "Ver historial de avance" (mismo estilo que Ver historial de sesiones) */}
                        <div
                          style={{
                            border: "1px solid #e2e8f0",
                            borderRadius: "8px",
                            overflow: "hidden",
                            backgroundColor: "#ffffff",
                          }}
                        >
                          <button
                            type="button"
                            style={{
                              width: "100%",
                              height: "40px",
                              padding: "0 14px",
                              backgroundColor: "#f8fafc",
                              border: "none",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              cursor: "pointer",
                              textAlign: "left",
                            }}
                            onClick={() =>
                              setAcordeonHistorialAvance(
                                !acordeonHistorialAvance
                              )
                            }
                          >
                            <span
                              style={{
                                fontSize: "13px",
                                fontWeight: 500,
                                color: "#334155",
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                              }}
                            >
                              <Clock size={15} style={{ color: "#94a3b8" }} />
                              Ver historial de avance
                            </span>
                            {acordeonHistorialAvance ? (
                              <ChevronUp
                                size={16}
                                style={{ color: "#94a3b8" }}
                              />
                            ) : (
                              <ChevronDown
                                size={16}
                                style={{ color: "#94a3b8" }}
                              />
                            )}
                          </button>

                          {acordeonHistorialAvance && (
                            <div
                              style={{
                                padding: "12px",
                                backgroundColor: "#ffffff",
                                borderTop: "1px solid #e2e8f0",
                                display: "flex",
                                flexDirection: "column",
                                gap: "8px",
                              }}
                            >
                              {servicioEnModal.historial.length === 0 ? (
                                <p
                                  style={{
                                    fontSize: "12px",
                                    color: "#64748b",
                                    margin: 0,
                                  }}
                                >
                                  Sin registros de avance
                                </p>
                              ) : (
                                servicioEnModal.historial.map((h, idx) => (
                                  <div
                                    key={`hist-avance-${idx}`}
                                    style={{
                                      minHeight: "38px",
                                      padding: "6px 12px",
                                      backgroundColor: "#ffffff",
                                      border: "1px solid #e2e8f0",
                                      borderRadius: "6px",
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "space-between",
                                      gap: "12px",
                                      flexWrap: "wrap",
                                      fontSize: "13px",
                                    }}
                                  >
                                    <div
                                      style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "10px",
                                        flexShrink: 0,
                                        whiteSpace: "nowrap",
                                      }}
                                    >
                                      <span style={{ color: "#475569" }}>
                                        {formatearFechaTexto(h.d_Fecha)}
                                      </span>
                                      <span
                                        style={{
                                          fontWeight: 500,
                                          color: "#1e293b",
                                        }}
                                      >
                                        {h.v_Usuario}
                                      </span>
                                      <span
                                        style={{
                                          fontWeight: 700,
                                          color: COLOR_VERDE_AVANCE,
                                        }}
                                      >
                                        {h.i_PorcentajeAvance} %
                                      </span>
                                    </div>
                                    <span
                                      style={{
                                        fontSize: "12px",
                                        color: "#64748b",
                                        flex: "1 1 180px",
                                        textAlign: "right",
                                      }}
                                    >
                                      {h.v_Nota || "—"}
                                    </span>
                                  </div>
                                ))
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* 5. Sesiones de la agenda (igual al actual) */}
                      <div>
                        <h4
                          style={{
                            fontSize: "12px",
                            fontWeight: 500,
                            color: "#64748b",
                            margin: "0 0 8px 0",
                          }}
                        >
                          Sesiones de la agenda (
                          {servicioEnModal.sesiones.length})
                        </h4>

                        <div
                          style={{
                            border: "1px solid #e2e8f0",
                            borderRadius: "8px",
                            overflow: "hidden",
                          }}
                        >
                          <button
                            type="button"
                            style={{
                              width: "100%",
                              height: "40px",
                              padding: "0 14px",
                              backgroundColor: "#f8fafc",
                              border: "none",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              cursor: "pointer",
                              textAlign: "left",
                            }}
                            onClick={() =>
                              setAcordeonSesiones(!acordeonSesiones)
                            }
                          >
                            <span
                              style={{
                                fontSize: "13px",
                                fontWeight: 500,
                                color: "#334155",
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                              }}
                            >
                              <Calendar
                                size={15}
                                style={{ color: "#94a3b8" }}
                              />
                              Ver historial de sesiones
                            </span>
                            {acordeonSesiones ? (
                              <ChevronUp
                                size={16}
                                style={{ color: "#94a3b8" }}
                              />
                            ) : (
                              <ChevronDown
                                size={16}
                                style={{ color: "#94a3b8" }}
                              />
                            )}
                          </button>

                          {acordeonSesiones && (
                            <div
                              style={{
                                padding: "12px",
                                backgroundColor: "#ffffff",
                                borderTop: "1px solid #e2e8f0",
                                display: "flex",
                                flexDirection: "column",
                                gap: "8px",
                              }}
                            >
                              {servicioEnModal.sesiones.length === 0 ? (
                                <p
                                  style={{
                                    fontSize: "12px",
                                    color: "#64748b",
                                    margin: 0,
                                  }}
                                >
                                  No hay sesiones registradas.
                                </p>
                              ) : (
                                servicioEnModal.sesiones.map((sesion, sIdx) => {
                                  const instructoresTxt = [
                                    sesion.v_Titular,
                                    sesion.v_Apoyo,
                                  ]
                                    .filter(Boolean)
                                    .join(", ");

                                  return (
                                    <div
                                      key={`ses-det-${sesion.i_CveAgendaDetalle}-${sIdx}`}
                                      style={{
                                        border: "1px solid #e2e8f0",
                                        borderRadius: "6px",
                                        overflow: "hidden",
                                      }}
                                    >
                                      <div
                                        style={{
                                          minHeight: "38px",
                                          padding: "6px 12px",
                                          backgroundColor: "#ffffff",
                                          display: "flex",
                                          alignItems: "center",
                                          justifyContent: "space-between",
                                          gap: "12px",
                                          flexWrap: "nowrap",
                                        }}
                                      >
                                        <div
                                          style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "8px",
                                            flexShrink: 0,
                                            fontSize: "13px",
                                            whiteSpace: "nowrap",
                                          }}
                                        >
                                          <span
                                            style={{
                                              fontWeight: 500,
                                              color: "#1e293b",
                                            }}
                                          >
                                            Sesión {sesion.i_Orden || sIdx + 1}
                                          </span>
                                          <span style={{ color: "#475569" }}>
                                            —{" "}
                                            {formatearFechaTexto(
                                              sesion.d_FechaHoraInicio
                                            )}{" "}
                                            –{" "}
                                            {formatearFechaTexto(
                                              sesion.d_FechaHoraFin
                                            )}
                                          </span>
                                        </div>

                                        <div
                                          style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "8px",
                                            flex: 1,
                                            minWidth: 0,
                                            justifyContent: "flex-end",
                                            flexWrap: "nowrap",
                                          }}
                                        >
                                          {instructoresTxt && (
                                            <span
                                              style={{
                                                fontSize: "12px",
                                                color: "#64748b",
                                                fontWeight: 400,
                                                overflow: "hidden",
                                                textOverflow: "ellipsis",
                                                whiteSpace: "nowrap",
                                                flex: "0 1 auto",
                                                minWidth: 0,
                                                textAlign: "right",
                                              }}
                                              title={instructoresTxt}
                                            >
                                              {instructoresTxt}
                                            </span>
                                          )}

                                          <div
                                            style={{
                                              display: "flex",
                                              alignItems: "center",
                                              gap: "6px",
                                              flexShrink: 0,
                                              whiteSpace: "nowrap",
                                            }}
                                          >
                                            {renderBadgeSesionModal(
                                              sesion.v_EstatusSesion
                                            )}
                                            <button
                                              type="button"
                                              className="btn-icon"
                                              title="Editar sesión"
                                              onClick={() =>
                                                toast.info(
                                                  "Edición de sesión disponible en el módulo Programación"
                                                )
                                              }
                                              style={{
                                                padding: "4px",
                                                border: "none",
                                                background: "transparent",
                                                color: "#2B8FCC",
                                                cursor: "pointer",
                                                display: "inline-flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                              }}
                                            >
                                              <Edit2 size={15} />
                                            </button>
                                            <button
                                              type="button"
                                              className="btn-icon"
                                              title="Reprogramar esta sesión"
                                              onClick={() =>
                                                toast.info(
                                                  "Reprogramación disponible en el módulo Programación"
                                                )
                                              }
                                              style={{
                                                padding: "4px",
                                                border: "none",
                                                background: "transparent",
                                                color: "#d97706",
                                                cursor: "pointer",
                                                display: "inline-flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                              }}
                                            >
                                              <RefreshCw size={15} />
                                            </button>
                                            <button
                                              type="button"
                                              className="btn-icon"
                                              title="Cancelar esta sesión"
                                              onClick={() =>
                                                toast.info(
                                                  "Cancelación de sesión disponible en el módulo Programación"
                                                )
                                              }
                                              style={{
                                                padding: "4px",
                                                border: "none",
                                                background: "transparent",
                                                color: "#ef4444",
                                                cursor: "pointer",
                                                display: "inline-flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                              }}
                                            >
                                              <Ban size={15} />
                                            </button>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* 7. Checklist de entregables (§4: cada entregable lleva su archivo y su carta de entrega; bloqueado si avance < 100 %) */}
                      <div>
                        <div style={{ marginBottom: "8px" }}>
                          <h4
                            style={{
                              fontSize: "12px",
                              fontWeight: 500,
                              color: "#64748b",
                              margin: 0,
                            }}
                          >
                            Checklist de entregables
                          </h4>
                          {!entregablesHabilitados && (
                            <p
                              style={{
                                fontSize: "11px",
                                color: "#94a3b8",
                                margin: "2px 0 0 0",
                                fontWeight: 400,
                              }}
                            >
                              Disponible al llegar al 100 % de avance
                            </p>
                          )}
                        </div>

                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "8px",
                          }}
                        >
                          {servicioEnModal.entregables.map((ent) => {
                            const deshabilitado = !entregablesHabilitados;

                            return (
                              <div
                                key={ent.i_CveAgendaEntregable}
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "space-between",
                                  flexWrap: "wrap",
                                  gap: "12px",
                                  padding: "10px 12px",
                                  backgroundColor: deshabilitado
                                    ? "#f8fafc"
                                    : "#ffffff",
                                  border: "1px solid #e2e8f0",
                                  borderRadius: "6px",
                                  fontSize: "13px",
                                  opacity: deshabilitado ? 0.78 : 1,
                                  transition: "all 0.2s ease",
                                }}
                              >
                                {/* Izquierda: Círculo + nombre + estatus + archivos */}
                                <div
                                  style={{
                                    display: "flex",
                                    alignItems: "flex-start",
                                    gap: "10px",
                                    flex: "1 1 260px",
                                    minWidth: 0,
                                  }}
                                >
                                  <div style={{ paddingTop: "2px", flexShrink: 0 }}>
                                    {ent.b_Entregado ? (
                                      <CheckCircle2
                                        size={15}
                                        style={{
                                          color: deshabilitado
                                            ? "#94a3b8"
                                            : "#10b981",
                                        }}
                                      />
                                    ) : (
                                      <Circle
                                        size={15}
                                        style={{ color: "#cbd5e1" }}
                                      />
                                    )}
                                  </div>

                                  <div
                                    style={{
                                      display: "flex",
                                      flexDirection: "column",
                                      gap: "2px",
                                      minWidth: 0,
                                    }}
                                  >
                                    {/* Nombre del entregable */}
                                    <span
                                      style={{
                                        fontWeight: 500,
                                        color: deshabilitado
                                          ? "#64748b"
                                          : "#1e293b",
                                        lineHeight: 1.25,
                                      }}
                                    >
                                      {ent.v_Entregable}
                                    </span>

                                    {/* Estatus debajo del nombre: Pendiente (rojo) o Entregado (verde) */}
                                    {ent.b_Entregado ? (
                                      <span
                                        style={{
                                          fontSize: "11px",
                                          color: "#10b981",
                                          fontWeight: 500,
                                          lineHeight: 1.2,
                                        }}
                                      >
                                        Entregado
                                      </span>
                                    ) : (
                                      <span
                                        style={{
                                          fontSize: "11px",
                                          color: "#dc3545",
                                          fontWeight: 500,
                                          lineHeight: 1.2,
                                        }}
                                      >
                                        Pendiente
                                      </span>
                                    )}

                                    {/* Archivos debajo del estatus (texto gris pequeño): Entregable: nombre.pdf · Carta de entrega: nombre.pdf */}
                                    <div
                                      style={{
                                        fontSize: "11px",
                                        color: "#64748b",
                                        lineHeight: 1.35,
                                        marginTop: "1px",
                                        display: "flex",
                                        flexWrap: "wrap",
                                        alignItems: "center",
                                        gap: "4px",
                                      }}
                                    >
                                      <span>
                                        Entregable:{" "}
                                        {ent.v_NombreArchivo ? (
                                          <button
                                            type="button"
                                            onClick={() =>
                                              toast.info(
                                                `Vista previa (mock): ${ent.v_NombreArchivo}`
                                              )
                                            }
                                            style={{
                                              background: "none",
                                              border: "none",
                                              padding: 0,
                                              color: "#2B8FCC",
                                              textDecoration: "underline",
                                              cursor: "pointer",
                                              fontSize: "11px",
                                              fontWeight: 500,
                                            }}
                                          >
                                            {ent.v_NombreArchivo}
                                          </button>
                                        ) : (
                                          "sin archivo"
                                        )}
                                      </span>
                                      <span style={{ color: "#94a3b8" }}>·</span>
                                      <span>
                                        Carta de entrega:{" "}
                                        {ent.v_NombreArchivoCarta ? (
                                          <button
                                            type="button"
                                            onClick={() =>
                                              toast.info(
                                                `Vista previa (mock): ${ent.v_NombreArchivoCarta}`
                                              )
                                            }
                                            style={{
                                              background: "none",
                                              border: "none",
                                              padding: 0,
                                              color: "#2B8FCC",
                                              textDecoration: "underline",
                                              cursor: "pointer",
                                              fontSize: "11px",
                                              fontWeight: 500,
                                            }}
                                          >
                                            {ent.v_NombreArchivoCarta}
                                          </button>
                                        ) : (
                                          "sin archivo"
                                        )}
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                {/* Derecha: 3 botones (Subir archivo, Subir carta de entrega, Marcar entregado) */}
                                <div
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "8px",
                                    flexWrap: "wrap",
                                  }}
                                >
                                  {/* 1. Subir archivo */}
                                  <button
                                    type="button"
                                    disabled={deshabilitado}
                                    onClick={() =>
                                      handleClickSubirArchivo(
                                        ent.i_CveAgendaEntregable,
                                        "entregable"
                                      )
                                    }
                                    style={{
                                      height: "28px",
                                      padding: "0 10px",
                                      fontSize: "12px",
                                      fontWeight: 500,
                                      borderRadius: "6px",
                                      display: "inline-flex",
                                      alignItems: "center",
                                      gap: "5px",
                                      border: deshabilitado
                                        ? "1px solid #e2e8f0"
                                        : "1px solid #cbd5e1",
                                      backgroundColor: deshabilitado
                                        ? "#e2e8f0"
                                        : "#ffffff",
                                      color: deshabilitado
                                        ? "#94a3b8"
                                        : "#334155",
                                      cursor: deshabilitado
                                        ? "not-allowed"
                                        : "pointer",
                                      whiteSpace: "nowrap",
                                    }}
                                  >
                                    <Upload size={13} />
                                    <span>Subir archivo</span>
                                  </button>

                                  {/* 2. Subir carta de entrega */}
                                  <button
                                    type="button"
                                    disabled={deshabilitado}
                                    onClick={() =>
                                      handleClickSubirArchivo(
                                        ent.i_CveAgendaEntregable,
                                        "carta"
                                      )
                                    }
                                    style={{
                                      height: "28px",
                                      padding: "0 10px",
                                      fontSize: "12px",
                                      fontWeight: 500,
                                      borderRadius: "6px",
                                      display: "inline-flex",
                                      alignItems: "center",
                                      gap: "5px",
                                      border: deshabilitado
                                        ? "1px solid #e2e8f0"
                                        : "1px solid #cbd5e1",
                                      backgroundColor: deshabilitado
                                        ? "#e2e8f0"
                                        : "#ffffff",
                                      color: deshabilitado
                                        ? "#94a3b8"
                                        : "#334155",
                                      cursor: deshabilitado
                                        ? "not-allowed"
                                        : "pointer",
                                      whiteSpace: "nowrap",
                                    }}
                                  >
                                    <Upload size={13} />
                                    <span>Subir carta de entrega</span>
                                  </button>

                                  {/* 3. Marcar entregado */}
                                  <button
                                    type="button"
                                    disabled={deshabilitado}
                                    onClick={() =>
                                      handleToggleEntregable(
                                        ent.i_CveAgendaEntregable
                                      )
                                    }
                                    style={{
                                      height: "28px",
                                      padding: "0 10px",
                                      fontSize: "12px",
                                      fontWeight: 500,
                                      borderRadius: "6px",
                                      display: "inline-flex",
                                      alignItems: "center",
                                      gap: "5px",
                                      border: "none",
                                      backgroundColor: deshabilitado
                                        ? "#e2e8f0"
                                        : ent.b_Entregado
                                        ? "#dcfce7"
                                        : "#2B8FCC",
                                      color: deshabilitado
                                        ? "#94a3b8"
                                        : ent.b_Entregado
                                        ? "#166534"
                                        : "#ffffff",
                                      cursor: deshabilitado
                                        ? "not-allowed"
                                        : "pointer",
                                      whiteSpace: "nowrap",
                                    }}
                                  >
                                    <CheckCircle2 size={13} />
                                    <span>
                                      {ent.b_Entregado
                                        ? "Entregado"
                                        : "Marcar entregado"}
                                    </span>
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </>
                  );
                })()}
            </div>

            {/* Footer del Modal Sticky (con Cerrar y Guardar #2B8FCC igual al actual) */}
            <div
              className="modal-footer"
              style={{
                position: "sticky",
                bottom: 0,
                backgroundColor: "#ffffff",
                borderTop: "1px solid #e2e8f0",
                padding: "12px 24px",
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-end",
                gap: "10px",
                zIndex: 10,
              }}
            >
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleCerrarModal}
              >
                Cerrar
              </button>
              {servicioEnModal && (
                <button
                  type="button"
                  className="btn btn-primary"
                  style={{ backgroundColor: "#2B8FCC" }}
                  onClick={handleGuardarDetalleFooter}
                >
                  Guardar
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
          MODAL "AGREGAR ACTIVIDAD" / "EDITAR ACTIVIDAD" (§4)
      ==================================================================== */}
      {modalActividadAbierto && (
        <div
          className="modal-overlay"
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(15, 23, 42, 0.6)",
            backdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "16px",
          }}
          onClick={handleCerrarModalActividad}
        >
          <div
            className="modal-content no-scrollbar"
            style={{
              maxWidth: "560px",
              width: "100%",
              maxHeight: "95vh",
              backgroundColor: "#ffffff",
              borderRadius: "16px",
              boxShadow:
                "0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0, 0, 0, 0.05)",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
              scrollbarWidth: "none",
              msOverflowStyle: "none",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div
              className="modal-header shrink-0"
              style={{
                padding: "18px 24px",
                borderBottom: "1px solid #f1f5f9",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                background: "#ffffff",
              }}
            >
              <h3
                style={{
                  fontSize: "15px",
                  fontWeight: 500,
                  color: "#0f172a",
                  margin: 0,
                }}
              >
                {actividadEditandoId !== null
                  ? "Editar actividad"
                  : "Agregar actividad"}
              </h3>
              <button
                type="button"
                className="btn-icon"
                onClick={handleCerrarModalActividad}
                style={{
                  padding: "6px",
                  borderRadius: "50%",
                  border: "none",
                  background: "transparent",
                  color: "#64748b",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <div
              className="modal-body no-scrollbar"
              style={{
                padding: "24px",
                flex: 1,
                overflowY: "auto",
                display: "flex",
                flexDirection: "column",
                gap: "16px",
              }}
            >
              {/* 1. Título * (máx. 200 caracteres con contador n/200) */}
              <div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: "6px",
                  }}
                >
                  <label className="form-label" style={{ marginBottom: 0 }}>
                    Título <span style={{ color: "#2B8FCC" }}>*</span>
                  </label>
                  <span
                    style={{
                      fontSize: "11px",
                      fontWeight: 500,
                      color:
                        formActividad.v_Titulo.length > 200
                          ? COLOR_ROJO_ALERTA
                          : "#64748b",
                    }}
                  >
                    {formActividad.v_Titulo.length}/200
                  </span>
                </div>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Ej. Junta de avance, Salida a planta"
                  value={formActividad.v_Titulo}
                  onChange={(e) =>
                    setFormActividad((prev) => ({
                      ...prev,
                      v_Titulo: e.target.value,
                    }))
                  }
                  style={{
                    width: "100%",
                    fontSize: "13px",
                    height: "36px",
                    borderRadius: "8px",
                    border:
                      formActividad.v_Titulo.length > 200
                        ? "1px solid #dc3545"
                        : "1px solid #d0dce8",
                    padding: "0 12px",
                  }}
                />
              </div>

              {/* 2. ¿A qué está ligada? * (Radio: Proyecto en curso / General) */}
              <div>
                <label className="form-label" style={{ marginBottom: "8px" }}>
                  ¿A qué está ligada?{" "}
                  <span style={{ color: "#2B8FCC" }}>*</span>
                </label>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "20px",
                    flexWrap: "wrap",
                  }}
                >
                  <label
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "7px",
                      fontSize: "13px",
                      color: "#1e293b",
                      cursor: "pointer",
                      margin: 0,
                    }}
                  >
                    <input
                      type="radio"
                      name="tipo-liga-actividad"
                      checked={!formActividad.b_General}
                      onChange={() =>
                        setFormActividad((prev) => ({
                          ...prev,
                          b_General: false,
                        }))
                      }
                      style={{
                        accentColor: "#2B8FCC",
                        width: "15px",
                        height: "15px",
                        cursor: "pointer",
                      }}
                    />
                    <span>Proyecto en curso</span>
                  </label>

                  <label
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "7px",
                      fontSize: "13px",
                      color: "#1e293b",
                      cursor: "pointer",
                      margin: 0,
                    }}
                  >
                    <input
                      type="radio"
                      name="tipo-liga-actividad"
                      checked={formActividad.b_General}
                      onChange={() => {
                        setFormActividad((prev) => ({
                          ...prev,
                          b_General: true,
                          i_CveServAgendaDet: null,
                        }));
                        setSelectProyectoAbierto(false);
                      }}
                      style={{
                        accentColor: "#2B8FCC",
                        width: "15px",
                        height: "15px",
                        cursor: "pointer",
                      }}
                    />
                    <span>General</span>
                  </label>
                </div>
              </div>

              {/* 3. Proyecto * (Select con buscador; solo visible con Proyecto en curso) */}
              {!formActividad.b_General && (
                <div style={{ position: "relative" }}>
                  <label className="form-label" style={{ marginBottom: "6px" }}>
                    Proyecto <span style={{ color: "#2B8FCC" }}>*</span>
                  </label>

                  {(() => {
                    const seleccionado = formActividad.i_CveServAgendaDet
                      ? proyectosEnCurso.find(
                          (p) =>
                            p.i_CveServAgendaDet ===
                            formActividad.i_CveServAgendaDet
                        ) ||
                        servicios.find(
                          (p) =>
                            p.i_CveServAgendaDet ===
                            formActividad.i_CveServAgendaDet
                        ) ||
                        null
                      : null;

                    return (
                      <>
                        <button
                          type="button"
                          onClick={() =>
                            setSelectProyectoAbierto((prev) => !prev)
                          }
                          style={{
                            width: "100%",
                            minHeight: "38px",
                            padding: "6px 12px",
                            borderRadius: "8px",
                            border: "1px solid #d0dce8",
                            backgroundColor: "#ffffff",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: "8px",
                            cursor: "pointer",
                            textAlign: "left",
                            fontSize: "13px",
                            color: seleccionado ? "#0f172a" : "#94a3b8",
                          }}
                        >
                          <span
                            style={{
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {seleccionado
                              ? `${seleccionado.v_Servicio} · ${seleccionado.v_Empresa.trim()} (${seleccionado.v_Planta})`
                              : "Seleccionar proyecto en curso..."}
                          </span>
                          {selectProyectoAbierto ? (
                            <ChevronUp
                              size={16}
                              style={{ color: "#64748b", flexShrink: 0 }}
                            />
                          ) : (
                            <ChevronDown
                              size={16}
                              style={{ color: "#64748b", flexShrink: 0 }}
                            />
                          )}
                        </button>

                        {selectProyectoAbierto && (
                          <div
                            style={{
                              marginTop: "6px",
                              border: "1px solid #cbd5e1",
                              borderRadius: "8px",
                              backgroundColor: "#ffffff",
                              boxShadow:
                                "0 10px 15px -3px rgba(0, 0, 0, 0.08)",
                              padding: "8px",
                              display: "flex",
                              flexDirection: "column",
                              gap: "6px",
                            }}
                          >
                            {/* Buscador del select */}
                            <div style={{ position: "relative" }}>
                              <Search
                                size={14}
                                style={{
                                  position: "absolute",
                                  left: "10px",
                                  top: "50%",
                                  transform: "translateY(-50%)",
                                  color: "#94a3b8",
                                  pointerEvents: "none",
                                }}
                              />
                              <input
                                type="text"
                                className="form-control"
                                placeholder="Buscar proyecto o empresa..."
                                value={busquedaProyectoSelect}
                                onChange={(e) =>
                                  setBusquedaProyectoSelect(e.target.value)
                                }
                                style={{
                                  width: "100%",
                                  height: "32px",
                                  fontSize: "12px",
                                  paddingLeft: "28px",
                                  borderRadius: "6px",
                                  border: "1px solid #d0dce8",
                                }}
                              />
                            </div>

                            {/* Opciones: SERVICIO · EMPRESA (planta) */}
                            <div
                              style={{
                                maxHeight: "170px",
                                overflowY: "auto",
                                display: "flex",
                                flexDirection: "column",
                                gap: "2px",
                              }}
                            >
                              {proyectosEnCursoFiltrados.length === 0 ? (
                                <div
                                  style={{
                                    padding: "8px 10px",
                                    fontSize: "12px",
                                    color: "#64748b",
                                  }}
                                >
                                  No se encontraron proyectos en curso.
                                </div>
                              ) : (
                                proyectosEnCursoFiltrados.map((proy) => {
                                  const activo =
                                    formActividad.i_CveServAgendaDet ===
                                    proy.i_CveServAgendaDet;
                                  const labelOpcion = `${proy.v_Servicio} · ${proy.v_Empresa.trim()} (${proy.v_Planta})`;

                                  return (
                                    <button
                                      key={proy.i_CveServAgendaDet}
                                      type="button"
                                      onClick={() => {
                                        setFormActividad((prev) => ({
                                          ...prev,
                                          i_CveServAgendaDet:
                                            proy.i_CveServAgendaDet,
                                        }));
                                        setSelectProyectoAbierto(false);
                                      }}
                                      style={{
                                        width: "100%",
                                        padding: "7px 10px",
                                        borderRadius: "6px",
                                        border: "none",
                                        backgroundColor: activo
                                          ? "#eff6ff"
                                          : "transparent",
                                        color: activo ? "#1d4ed8" : "#1e293b",
                                        fontWeight: activo ? 600 : 400,
                                        fontSize: "12.5px",
                                        textAlign: "left",
                                        cursor: "pointer",
                                      }}
                                    >
                                      {labelOpcion}
                                    </button>
                                  );
                                })
                              )}
                            </div>
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              )}

              {/* 4, 5 y 6. Fecha inicio *, Fecha fin *, ¿Tiene horario? y Hora inicio * / Hora fin * (solo al agregar; al editar se cambian reprogramando — §1 y §4) */}
              {actividadEditandoId === null && (
                <>
                  {/* Renglón 1: Fecha inicio y Fecha fin */}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(auto-fit, minmax(140px, 1fr))",
                      gap: "12px",
                    }}
                  >
                    <div>
                      <label
                        className="form-label"
                        style={{ marginBottom: "6px" }}
                      >
                        Fecha inicio <span style={{ color: "#2B8FCC" }}>*</span>
                      </label>
                      <input
                        type="date"
                        className="form-control"
                        value={formActividad.fechaInicio}
                        onChange={(e) => {
                          const nuevaIni = e.target.value;
                          setFormActividad((prev) => ({
                            ...prev,
                            fechaInicio: nuevaIni,
                            fechaFin:
                              !prev.fechaFin || prev.fechaFin < nuevaIni
                                ? nuevaIni
                                : prev.fechaFin,
                          }));
                        }}
                        style={{
                          width: "100%",
                          height: "36px",
                          fontSize: "13px",
                          borderRadius: "8px",
                          border: "1px solid #d0dce8",
                          padding: "0 10px",
                        }}
                      />
                    </div>

                    <div>
                      <label
                        className="form-label"
                        style={{ marginBottom: "6px" }}
                      >
                        Fecha fin <span style={{ color: "#2B8FCC" }}>*</span>
                      </label>
                      <input
                        type="date"
                        className="form-control"
                        min={formActividad.fechaInicio || undefined}
                        value={formActividad.fechaFin}
                        onChange={(e) =>
                          setFormActividad((prev) => ({
                            ...prev,
                            fechaFin: e.target.value,
                          }))
                        }
                        style={{
                          width: "100%",
                          height: "36px",
                          fontSize: "13px",
                          borderRadius: "8px",
                          border: "1px solid #d0dce8",
                          padding: "0 10px",
                        }}
                      />
                    </div>
                  </div>

                  {/* Renglón 2: Checkbox ¿Tiene horario? */}
                  <div>
                    <label
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "8px",
                        cursor: "pointer",
                        fontSize: "13px",
                        fontWeight: 500,
                        color: "#334155",
                        userSelect: "none",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={formActividad.b_TieneHorario}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setFormActividad((prev) => ({
                            ...prev,
                            b_TieneHorario: checked,
                            horaInicio: checked
                              ? prev.horaInicio || "09:00"
                              : "",
                            horaFin: checked ? prev.horaFin || "10:00" : "",
                          }));
                        }}
                        style={{
                          width: "16px",
                          height: "16px",
                          accentColor: "#2B8FCC",
                          cursor: "pointer",
                        }}
                      />
                      <span>¿Tiene horario?</span>
                    </label>
                  </div>

                  {/* Renglón 3: Hora inicio y Hora fin (solo visible si tiene horario) */}
                  {formActividad.b_TieneHorario && (
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns:
                          "repeat(auto-fit, minmax(140px, 1fr))",
                        gap: "12px",
                      }}
                    >
                      <div>
                        <label
                          className="form-label"
                          style={{ marginBottom: "6px" }}
                        >
                          Hora inicio{" "}
                          <span style={{ color: "#2B8FCC" }}>*</span>
                        </label>
                        <input
                          type="time"
                          className="form-control"
                          value={formActividad.horaInicio}
                          onChange={(e) =>
                            setFormActividad((prev) => ({
                              ...prev,
                              horaInicio: e.target.value,
                            }))
                          }
                          style={{
                            width: "100%",
                            height: "36px",
                            fontSize: "13px",
                            borderRadius: "8px",
                            border: "1px solid #d0dce8",
                            padding: "0 10px",
                          }}
                        />
                      </div>

                      <div>
                        <label
                          className="form-label"
                          style={{ marginBottom: "6px" }}
                        >
                          Hora fin <span style={{ color: "#2B8FCC" }}>*</span>
                        </label>
                        <input
                          type="time"
                          className="form-control"
                          value={formActividad.horaFin}
                          onChange={(e) =>
                            setFormActividad((prev) => ({
                              ...prev,
                              horaFin: e.target.value,
                            }))
                          }
                          style={{
                            width: "100%",
                            height: "36px",
                            fontSize: "13px",
                            borderRadius: "8px",
                            border: "1px solid #d0dce8",
                            padding: "0 10px",
                          }}
                        />
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* 7. Notas (opcional) */}
              <div>
                <label className="form-label" style={{ marginBottom: "6px" }}>
                  Notas
                </label>
                <textarea
                  rows={3}
                  className="form-control"
                  placeholder="Notas opcionales de la actividad..."
                  value={formActividad.v_Notas}
                  onChange={(e) =>
                    setFormActividad((prev) => ({
                      ...prev,
                      v_Notas: e.target.value,
                    }))
                  }
                  style={{
                    width: "100%",
                    fontSize: "13px",
                    borderRadius: "8px",
                    border: "1px solid #d0dce8",
                    padding: "8px 12px",
                    resize: "vertical",
                    minHeight: "68px",
                    backgroundColor: "#ffffff",
                    color: "#0f172a",
                    fontFamily: "inherit",
                  }}
                />
              </div>
            </div>

            {/* Footer */}
            <div
              className="modal-footer"
              style={{
                position: "sticky",
                bottom: 0,
                backgroundColor: "#ffffff",
                borderTop: "1px solid #e2e8f0",
                padding: "12px 24px",
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-end",
                gap: "10px",
                zIndex: 10,
              }}
            >
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleCerrarModalActividad}
              >
                Cerrar
              </button>
              <button
                type="button"
                className="btn btn-primary"
                style={{ backgroundColor: "#2B8FCC" }}
                onClick={handleGuardarActividad}
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
          MODAL: REPROGRAMAR ACTIVIDAD (§4)
      ==================================================================== */}
      {actividadReprogramando && (
        <div
          className="modal-overlay"
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(15, 23, 42, 0.6)",
            backdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1050,
            padding: "16px",
          }}
          onClick={handleCerrarReprogramarActividad}
        >
          <div
            className="modal-content no-scrollbar"
            style={{
              maxWidth: "480px",
              width: "100%",
              backgroundColor: "#ffffff",
              borderRadius: "16px",
              boxShadow:
                "0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0, 0, 0, 0.05)",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="modal-header shrink-0"
              style={{
                padding: "18px 24px",
                borderBottom: "1px solid #f1f5f9",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                background: "#ffffff",
              }}
            >
              <h3
                style={{
                  fontSize: "15px",
                  fontWeight: 600,
                  color: "#0f172a",
                  margin: 0,
                }}
              >
                Reprogramar actividad
              </h3>
              <button
                type="button"
                className="btn-icon"
                onClick={handleCerrarReprogramarActividad}
                style={{
                  padding: "6px",
                  borderRadius: "50%",
                  border: "none",
                  background: "transparent",
                  color: "#64748b",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <X size={18} />
              </button>
            </div>

            <div
              className="modal-body"
              style={{
                padding: "20px 24px",
                display: "flex",
                flexDirection: "column",
                gap: "16px",
              }}
            >
              <div
                style={{
                  padding: "10px 12px",
                  borderRadius: "8px",
                  backgroundColor: "#f8fafc",
                  border: "1px solid #e2e8f0",
                  fontSize: "12.5px",
                  color: "#334155",
                }}
              >
                <strong>{actividadReprogramando.v_Titulo}</strong>
                <span style={{ color: "#64748b", marginLeft: "8px" }}>
                  ({formatearFechaActividadHistorial(actividadReprogramando)})
                </span>
              </div>

              {/* Renglón 1: Fecha inicio y Fecha fin */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
                  gap: "12px",
                }}
              >
                <div>
                  <label className="form-label" style={{ marginBottom: "6px" }}>
                    Fecha inicio <span style={{ color: "#2B8FCC" }}>*</span>
                  </label>
                  <input
                    type="date"
                    className="form-control"
                    value={formReprogramar.fechaInicio}
                    onChange={(e) => {
                      const nuevaIni = e.target.value;
                      setFormReprogramar((prev) => ({
                        ...prev,
                        fechaInicio: nuevaIni,
                        fechaFin:
                          !prev.fechaFin || prev.fechaFin < nuevaIni
                            ? nuevaIni
                            : prev.fechaFin,
                      }));
                    }}
                    style={{
                      width: "100%",
                      height: "36px",
                      fontSize: "13px",
                      borderRadius: "8px",
                      border: "1px solid #d0dce8",
                      padding: "0 10px",
                    }}
                  />
                </div>

                <div>
                  <label className="form-label" style={{ marginBottom: "6px" }}>
                    Fecha fin <span style={{ color: "#2B8FCC" }}>*</span>
                  </label>
                  <input
                    type="date"
                    className="form-control"
                    min={formReprogramar.fechaInicio || undefined}
                    value={formReprogramar.fechaFin}
                    onChange={(e) =>
                      setFormReprogramar((prev) => ({
                        ...prev,
                        fechaFin: e.target.value,
                      }))
                    }
                    style={{
                      width: "100%",
                      height: "36px",
                      fontSize: "13px",
                      borderRadius: "8px",
                      border: "1px solid #d0dce8",
                      padding: "0 10px",
                    }}
                  />
                </div>
              </div>

              {/* Renglón 2: Checkbox ¿Tiene horario? */}
              <div>
                <label
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                    cursor: "pointer",
                    fontSize: "13px",
                    fontWeight: 500,
                    color: "#334155",
                    userSelect: "none",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={formReprogramar.b_TieneHorario}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setFormReprogramar((prev) => ({
                        ...prev,
                        b_TieneHorario: checked,
                        horaInicio: checked
                          ? prev.horaInicio || "09:00"
                          : "",
                        horaFin: checked ? prev.horaFin || "10:00" : "",
                      }));
                    }}
                    style={{
                      width: "16px",
                      height: "16px",
                      accentColor: "#2B8FCC",
                      cursor: "pointer",
                    }}
                  />
                  <span>¿Tiene horario?</span>
                </label>
              </div>

              {/* Renglón 3: Hora inicio y Hora fin (solo visible si tiene horario) */}
              {formReprogramar.b_TieneHorario && (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
                    gap: "12px",
                  }}
                >
                  <div>
                    <label
                      className="form-label"
                      style={{ marginBottom: "6px" }}
                    >
                      Hora inicio <span style={{ color: "#2B8FCC" }}>*</span>
                    </label>
                    <input
                      type="time"
                      className="form-control"
                      value={formReprogramar.horaInicio}
                      onChange={(e) =>
                        setFormReprogramar((prev) => ({
                          ...prev,
                          horaInicio: e.target.value,
                        }))
                      }
                      style={{
                        width: "100%",
                        height: "36px",
                        fontSize: "13px",
                        borderRadius: "8px",
                        border: "1px solid #d0dce8",
                        padding: "0 10px",
                      }}
                    />
                  </div>

                  <div>
                    <label
                      className="form-label"
                      style={{ marginBottom: "6px" }}
                    >
                      Hora fin <span style={{ color: "#2B8FCC" }}>*</span>
                    </label>
                    <input
                      type="time"
                      className="form-control"
                      value={formReprogramar.horaFin}
                      onChange={(e) =>
                        setFormReprogramar((prev) => ({
                          ...prev,
                          horaFin: e.target.value,
                        }))
                      }
                      style={{
                        width: "100%",
                        height: "36px",
                        fontSize: "13px",
                        borderRadius: "8px",
                        border: "1px solid #d0dce8",
                        padding: "0 10px",
                      }}
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="form-label" style={{ marginBottom: "6px" }}>
                  Motivo
                </label>
                <textarea
                  rows={3}
                  className="form-control"
                  placeholder="Motivo de la reprogramación (opcional)..."
                  value={formReprogramar.v_Motivo}
                  onChange={(e) =>
                    setFormReprogramar((prev) => ({
                      ...prev,
                      v_Motivo: e.target.value,
                    }))
                  }
                  style={{
                    width: "100%",
                    fontSize: "13px",
                    borderRadius: "8px",
                    border: "1px solid #d0dce8",
                    padding: "8px 12px",
                    resize: "vertical",
                    minHeight: "64px",
                  }}
                />
              </div>
            </div>

            <div
              className="modal-footer"
              style={{
                backgroundColor: "#ffffff",
                borderTop: "1px solid #e2e8f0",
                padding: "12px 24px",
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-end",
                gap: "10px",
              }}
            >
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleCerrarReprogramarActividad}
              >
                Cerrar
              </button>
              <button
                type="button"
                className="btn btn-primary"
                style={{ backgroundColor: "#2B8FCC" }}
                onClick={handleGuardarReprogramarActividad}
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
          MODAL: CANCELAR ACTIVIDAD (§4)
      ==================================================================== */}
      {actividadCancelando && (
        <div
          className="modal-overlay"
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(15, 23, 42, 0.6)",
            backdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1050,
            padding: "16px",
          }}
          onClick={handleCerrarCancelarActividad}
        >
          <div
            className="modal-content no-scrollbar"
            style={{
              maxWidth: "460px",
              width: "100%",
              backgroundColor: "#ffffff",
              borderRadius: "16px",
              boxShadow:
                "0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0, 0, 0, 0.05)",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="modal-header shrink-0"
              style={{
                padding: "18px 24px",
                borderBottom: "1px solid #f1f5f9",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                background: "#ffffff",
              }}
            >
              <h3
                style={{
                  fontSize: "15px",
                  fontWeight: 600,
                  color: "#0f172a",
                  margin: 0,
                }}
              >
                ¿Deseas cancelar {actividadCancelando.v_Titulo}?
              </h3>
              <button
                type="button"
                className="btn-icon"
                onClick={handleCerrarCancelarActividad}
                style={{
                  padding: "6px",
                  borderRadius: "50%",
                  border: "none",
                  background: "transparent",
                  color: "#64748b",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <X size={18} />
              </button>
            </div>

            <div
              className="modal-body"
              style={{
                padding: "20px 24px",
                display: "flex",
                flexDirection: "column",
                gap: "12px",
              }}
            >
              <div>
                <label className="form-label" style={{ marginBottom: "6px" }}>
                  Motivo
                </label>
                <textarea
                  rows={3}
                  className="form-control"
                  placeholder="Motivo de cancelación (opcional)..."
                  value={motivoCancelar}
                  onChange={(e) => setMotivoCancelar(e.target.value)}
                  style={{
                    width: "100%",
                    fontSize: "13px",
                    borderRadius: "8px",
                    border: "1px solid #d0dce8",
                    padding: "8px 12px",
                    resize: "vertical",
                    minHeight: "64px",
                  }}
                />
              </div>
            </div>

            <div
              className="modal-footer"
              style={{
                backgroundColor: "#ffffff",
                borderTop: "1px solid #e2e8f0",
                padding: "12px 24px",
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-end",
                gap: "10px",
              }}
            >
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleCerrarCancelarActividad}
              >
                Cerrar
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={handleConfirmarCancelarActividad}
              >
                Cancelar actividad
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
          MODAL: HISTORIAL DE ACTIVIDADES (OJO — §4.1)
      ==================================================================== */}
      {filaEnHistorial &&
        (() => {
          // Determinar si la fila está ligada a un proyecto o es general
          const cveProyecto =
            filaEnHistorial.tipo === "sesion"
              ? filaEnHistorial.sesion.i_CveServAgendaDet
              : filaEnHistorial.actividad.b_General
              ? null
              : filaEnHistorial.actividad.i_CveServAgendaDet;

          const srvProyecto =
            cveProyecto != null
              ? servicios.find((s) => s.i_CveServAgendaDet === cveProyecto) ||
                null
              : null;

          // Subtítulo del encabezado (§4.1): "NOMBRE DEL SERVICIO — EMPRESA" o "GENERAL"
          let subtituloModal = "GENERAL";
          if (srvProyecto) {
            subtituloModal = `${srvProyecto.v_Servicio.toUpperCase()} — ${srvProyecto.v_Empresa
              .trim()
              .toUpperCase()}`;
          } else if (filaEnHistorial.tipo === "sesion") {
            subtituloModal = `${filaEnHistorial.sesion.v_Servicio.toUpperCase()} — ${filaEnHistorial.sesion.v_Empresa
              .trim()
              .toUpperCase()}`;
          }

          // Construir lista de elementos de la línea del tiempo (§4.1)
          let elementos: AgendaConsultorFila[] = [];

          if (cveProyecto != null) {
            // Fila ligada a un proyecto: todas las sesiones, Inicio, Fin y actividades del consultor de ese servicio
            const sesionesProy = SESIONES_MOCK.filter(
              (s) => s.i_CveServAgendaDet === cveProyecto
            ).map((sesion): AgendaConsultorFila => ({ tipo: "sesion", sesion }));

            const actividadesProy = actividades
              .filter(
                (a) => !a.b_General && a.i_CveServAgendaDet === cveProyecto
              )
              .flatMap((actividad) => expandirActividadEnFilas(actividad));

            elementos = [...sesionesProy, ...actividadesProy];
          } else if (filaEnHistorial.tipo === "sesion") {
            // Sesión sin i_CveServAgendaDet: agrupar por nombre de servicio y empresa
            const sesRef = filaEnHistorial.sesion;
            elementos = SESIONES_MOCK.filter(
              (s) =>
                s.v_Servicio === sesRef.v_Servicio &&
                s.v_Empresa === sesRef.v_Empresa
            ).map((sesion): AgendaConsultorFila => ({ tipo: "sesion", sesion }));
          } else {
            // Actividad general: solo esa actividad con sus reprogramaciones y cancelación (§4.1)
            const actActual = filaEnHistorial.actividad;
            const idsCadena = new Set<number>([actActual.i_CveActividad]);
            let cambio = true;
            while (cambio) {
              cambio = false;
              for (const item of actividades) {
                if (
                  idsCadena.has(item.i_CveActividad) &&
                  item.i_CveReprograma != null &&
                  !idsCadena.has(item.i_CveReprograma)
                ) {
                  idsCadena.add(item.i_CveReprograma);
                  cambio = true;
                }
                if (
                  item.i_CveReprograma != null &&
                  idsCadena.has(item.i_CveReprograma) &&
                  !idsCadena.has(item.i_CveActividad)
                ) {
                  idsCadena.add(item.i_CveActividad);
                  cambio = true;
                }
              }
            }
            elementos = actividades
              .filter((a) => idsCadena.has(a.i_CveActividad))
              .flatMap((actividad) => expandirActividadEnFilas(actividad));
          }

          // Ordenar por fecha y hora de arriba hacia abajo
          elementos.sort((a, b) => {
            const fA =
              a.tipo === "sesion"
                ? a.sesion.d_FechaHoraInicio
                : obtenerRangoEfectivoFilaActividad(a.actividad, a.momento)
                    .inicio;
            const fB =
              b.tipo === "sesion"
                ? b.sesion.d_FechaHoraInicio
                : obtenerRangoEfectivoFilaActividad(b.actividad, b.momento)
                    .inicio;
            return fA.localeCompare(fB);
          });

          // Índice del elemento actual (en el que se pulsó el ojo)
          const idxActual = elementos.findIndex((el) => {
            if (
              el.tipo === "sesion" &&
              filaEnHistorial.tipo === "sesion"
            ) {
              return (
                el.sesion.i_CveAgendaDetalle ===
                filaEnHistorial.sesion.i_CveAgendaDetalle
              );
            }
            if (
              el.tipo === "actividad" &&
              filaEnHistorial.tipo === "actividad"
            ) {
              return (
                el.actividad.i_CveActividad ===
                  filaEnHistorial.actividad.i_CveActividad &&
                el.momento === filaEnHistorial.momento
              );
            }
            return false;
          });

          return (
            <div
              className="modal-overlay"
              style={{
                position: "fixed",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: "rgba(15, 23, 42, 0.5)",
                backdropFilter: "blur(6px)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 1050,
                padding: "16px",
              }}
              onClick={handleCerrarHistorialActividad}
            >
              <div
                className="modal-content no-scrollbar"
                style={{
                  maxWidth: "580px",
                  width: "100%",
                  maxHeight: "85vh",
                  backgroundColor: "#ffffff",
                  borderRadius: "16px",
                  boxShadow: "0 20px 40px -15px rgba(15, 23, 42, 0.25)",
                  display: "flex",
                  flexDirection: "column",
                  overflow: "hidden",
                }}
                onClick={(e) => e.stopPropagation()}
              >
                {/* Encabezado (§4.1 — mismo diseño que ModalLineaTiempoSesiones) */}
                <div
                  className="modal-header shrink-0"
                  style={{
                    padding: "18px 24px",
                    borderBottom: "1px solid #f1f5f9",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    background: "#ffffff",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                    }}
                  >
                    <div
                      style={{
                        width: "36px",
                        height: "36px",
                        borderRadius: "10px",
                        backgroundColor: "#eef6fd",
                        border: "1px solid #bae6fd",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#2B8FCC",
                      }}
                    >
                      <History size={18} />
                    </div>

                    <div>
                      <h3
                        style={{
                          fontSize: "15px",
                          fontWeight: 700,
                          color: "#0f172a",
                          margin: 0,
                        }}
                      >
                        Historial de actividades
                      </h3>
                      <p
                        style={{
                          fontSize: "12px",
                          color: "#64748b",
                          margin: "1px 0 0 0",
                          fontWeight: 500,
                        }}
                      >
                        {subtituloModal}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="btn-icon"
                    onClick={handleCerrarHistorialActividad}
                    style={{
                      padding: "6px",
                      borderRadius: "50%",
                      border: "none",
                      background: "#f8fafc",
                      color: "#64748b",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <X size={16} />
                  </button>
                </div>

                {/* Body con línea del tiempo vertical */}
                <div
                  className="modal-body no-scrollbar"
                  style={{
                    padding: "20px 24px 24px 24px",
                    flex: 1,
                    overflowY: "auto",
                    display: "flex",
                    flexDirection: "column",
                    backgroundColor: "#ffffff",
                  }}
                >
                  {elementos.map((el, idx) => {
                    const esActual = idx === idxActual;
                    const esUltimo = idx === elementos.length - 1;

                    const fechaHoraStr =
                      el.tipo === "sesion"
                        ? formatearFechaHoraHistorial(
                            el.sesion.d_FechaHoraInicio,
                            el.sesion.d_FechaHoraFin,
                            el.sesion.v_ModoHorario
                          )
                        : formatearFechaNodoActividadHistorial(
                            el.actividad,
                            el.momento
                          );

                    const nombreActividad =
                      el.tipo === "sesion"
                        ? el.sesion.v_Actividad
                        : obtenerTituloActividadConMomento(
                            el.actividad,
                            el.momento
                          );

                    // Estatus del nodo: Terminado, En curso, Programado, Reprogramada o Cancelada
                    let estatusLabel:
                      | "Terminado"
                      | "En curso"
                      | "Programado"
                      | "Reprogramada"
                      | "Cancelada";

                    if (
                      el.tipo === "actividad" &&
                      el.actividad.v_Estatus === "Cancelada"
                    ) {
                      estatusLabel = "Cancelada";
                    } else if (
                      el.tipo === "actividad" &&
                      el.actividad.v_Estatus === "Reprogramada"
                    ) {
                      estatusLabel = "Reprogramada";
                    } else {
                      estatusLabel = obtenerEstatusFilaAgenda(el);
                    }

                    const esCancelada = estatusLabel === "Cancelada";
                    const esReprogramada = estatusLabel === "Reprogramada";
                    const esPasada =
                      !esActual &&
                      !esCancelada &&
                      (estatusLabel === "Terminado" ||
                        esReprogramada ||
                        (idxActual >= 0 && idx < idxActual));
                    const esFutura = !esActual && !esCancelada && !esPasada;

                    // Estilos de badge de estado
                    let badgeStyle: React.CSSProperties = {
                      backgroundColor: "#eef6fd",
                      color: "#1d4ed8",
                      border: "1px solid #bfdbfe",
                    };
                    if (estatusLabel === "Terminado") {
                      badgeStyle = {
                        backgroundColor: "#ecfdf5",
                        color: "#065f46",
                        border: "1px solid #a7f3d0",
                      };
                    } else if (estatusLabel === "En curso") {
                      badgeStyle = {
                        backgroundColor: "#fef3c7",
                        color: "#92400e",
                        border: "1px solid #fde68a",
                      };
                    } else if (estatusLabel === "Reprogramada") {
                      badgeStyle = {
                        backgroundColor: "#f8fafc",
                        color: "#64748b",
                        border: "1px solid #e2e8f0",
                      };
                    } else if (estatusLabel === "Cancelada") {
                      badgeStyle = {
                        backgroundColor: "#fef2f2",
                        color: "#991b1b",
                        border: "1px solid #fecaca",
                      };
                    }

                    // Línea que une este círculo con el siguiente:
                    // Sólida hasta la actividad actual (idx < idxActual), punteada hacia las futuras (idx >= idxActual)
                    const lineaHaciaSiguienteEsSolida =
                      idxActual >= 0 ? idx < idxActual : esPasada;

                    const dotSize = esActual ? 24 : 20;
                    const actividadNuevaReprogramada =
                      el.tipo === "actividad" &&
                      el.actividad.i_CveReprograma != null
                        ? actividades.find(
                            (a) =>
                              a.i_CveActividad === el.actividad.i_CveReprograma
                          ) || null
                        : null;

                    return (
                      <div
                        key={
                          el.tipo === "sesion"
                            ? `hist-ses-${el.sesion.i_CveAgendaDetalle}`
                            : `hist-act-${el.actividad.i_CveActividad}-${el.momento}`
                        }
                        ref={esActual ? nodoActualHistorialRef : undefined}
                        style={{
                          display: "flex",
                          position: "relative",
                          paddingBottom: esUltimo ? "0px" : "20px",
                        }}
                      >
                        {/* Línea vertical conectora (sólida hasta la actual, punteada hacia las futuras) */}
                        {!esUltimo && (
                          <div
                            style={{
                              position: "absolute",
                              top: `${dotSize + 2}px`,
                              left: esActual ? "11px" : "9px",
                              bottom: "0px",
                              width: 0,
                              borderLeft: lineaHaciaSiguienteEsSolida
                                ? "2px solid #94a3b8"
                                : "2px dashed #cbd5e1",
                              zIndex: 0,
                            }}
                          />
                        )}

                        {/* Círculo indicador según momento (§4.1) */}
                        <div
                          style={{
                            position: "relative",
                            zIndex: 1,
                            width: `${dotSize}px`,
                            height: `${dotSize}px`,
                            borderRadius: "50%",
                            backgroundColor: esCancelada
                              ? "#94a3b8"
                              : esActual
                              ? "#2B8FCC"
                              : esPasada
                              ? "#10b981"
                              : "#ffffff",
                            border: esCancelada
                              ? "1.5px solid #94a3b8"
                              : esActual
                              ? "1.5px solid #2B8FCC"
                              : esPasada
                              ? "1.5px solid #10b981"
                              : "1.5px solid #cbd5e1",
                            color: "#ffffff",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                            boxShadow: esActual
                              ? "0 0 0 4px rgba(43, 143, 204, 0.22)"
                              : "none",
                            marginTop: esActual ? "8px" : "2px",
                          }}
                        >
                          {esCancelada ? (
                            <X size={11} strokeWidth={2.5} />
                          ) : esActual || esPasada ? (
                            <Check size={esActual ? 12 : 11} strokeWidth={2.5} />
                          ) : null}
                        </div>

                        {/* Bloque de contenido del elemento */}
                        <div
                          style={{
                            marginLeft: "14px",
                            flex: 1,
                            display: "flex",
                            flexDirection: "column",
                            gap: "2px",
                            padding: esActual ? "8px 12px" : "0px",
                            borderRadius: esActual ? "10px" : undefined,
                            backgroundColor: esActual
                              ? "#f0f7ff"
                              : "transparent",
                            border: esActual
                              ? "1px solid #bae6fd"
                              : "1px solid transparent",
                          }}
                        >
                          {/* 1. Fecha y horario en gris pequeño */}
                          <span
                            style={{
                              fontSize: "11px",
                              color: "#94a3b8",
                              fontWeight: 500,
                            }}
                          >
                            {fechaHoraStr}
                          </span>

                          {/* 2. Nombre de la actividad en negritas + Badge de estado */}
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "8px",
                              flexWrap: "wrap",
                            }}
                          >
                            <span
                              style={{
                                fontSize: "14px",
                                fontWeight: 700,
                                color: esCancelada
                                  ? "#94a3b8"
                                  : esActual
                                  ? "#2B8FCC"
                                  : esFutura
                                  ? "#94a3b8"
                                  : "#1e293b",
                                textDecoration: esCancelada
                                  ? "line-through"
                                  : "none",
                              }}
                            >
                              {nombreActividad}
                            </span>

                            <span
                              style={{
                                fontSize: "10px",
                                fontWeight: 600,
                                padding: "1px 7px",
                                borderRadius: "8px",
                                ...badgeStyle,
                              }}
                            >
                              {estatusLabel}
                            </span>
                          </div>

                          {/* 3. Si fue reprogramada: "Reprogramada al 14 de nov, 2026" y motivo (§3) */}
                          {esReprogramada && el.tipo === "actividad" && (
                            <div
                              style={{
                                fontSize: "11.5px",
                                color: "#64748b",
                                marginTop: "2px",
                                display: "flex",
                                flexDirection: "column",
                                gap: "1px",
                              }}
                            >
                              <span>
                                {actividadNuevaReprogramada
                                  ? `Reprogramada al ${formatearFechaCortaHistorial(
                                      actividadNuevaReprogramada.d_FechaInicio
                                    )}`
                                  : "Reprogramada"}
                              </span>
                              {el.actividad.v_Motivo && (
                                <span>Motivo: {el.actividad.v_Motivo}</span>
                              )}
                            </div>
                          )}

                          {/* 4. Si fue cancelada: motivo (§3) */}
                          {esCancelada &&
                            el.tipo === "actividad" &&
                            el.actividad.v_Motivo && (
                              <div
                                style={{
                                  fontSize: "11.5px",
                                  color: "#64748b",
                                  marginTop: "2px",
                                }}
                              >
                                <span>Motivo: {el.actividad.v_Motivo}</span>
                              </div>
                            )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Footer con Cerrar */}
                <div
                  className="modal-footer shrink-0"
                  style={{
                    padding: "14px 24px",
                    borderTop: "1px solid #f1f5f9",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "flex-end",
                    background: "#ffffff",
                  }}
                >
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={handleCerrarHistorialActividad}
                    style={{
                      height: "34px",
                      padding: "0 20px",
                      fontSize: "12px",
                      fontWeight: 600,
                      borderRadius: "8px",
                      backgroundColor: "#ffffff",
                      borderColor: "#cbd5e1",
                      color: "#334155",
                    }}
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            </div>
          );
        })()}
    </AppLayout>
  );
}
