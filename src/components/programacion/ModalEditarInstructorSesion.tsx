"use client";

import React, { useEffect, useState, useMemo } from "react";
import { X, Calendar, Clock, User, Users } from "lucide-react";
import { SesionDetalleDto, InstructorGetDto, CambiarTitularesSesionDto } from "@/types/servicios";
import { AgendaService } from "@/services/agenda.service";
import { formatearFechaCorta } from "@/lib/date-utils";
import InputFechaTexto from "@/components/ui/InputFechaTexto";
import { useToast } from "@/context/ToastContext";

const HORAS_OPCIONES: string[] = (() => {
  const arr: string[] = [];
  for (let h = 0; h < 24; h++) {
    const hh = h.toString().padStart(2, "0");
    arr.push(`${hh}:00`);
    arr.push(`${hh}:30`);
  }
  return arr;
})();

function sumarMinutosAHorario(horaInicioStr: string, minutosASumar: number): string {
  if (!horaInicioStr || !horaInicioStr.includes(":")) return "13:00";
  const [hhStr, mmStr] = horaInicioStr.split(":");
  let hh = parseInt(hhStr, 10) || 0;
  let mm = parseInt(mmStr, 10) || 0;

  let totalMins = hh * 60 + mm + Math.round(minutosASumar);
  if (totalMins < 0) totalMins = 0;

  const finHH = Math.floor(totalMins / 60) % 24;
  const finMM = totalMins % 60;

  const strHH = finHH.toString().padStart(2, "0");
  const strMM = finMM.toString().padStart(2, "0");
  return `${strHH}:${strMM}`;
}

function calcularDiferenciaMinutos(horaInicioStr: string, horaFinStr: string): number {
  if (!horaInicioStr || !horaFinStr || !horaInicioStr.includes(":") || !horaFinStr.includes(":")) {
    return 120;
  }
  const [h1, m1] = horaInicioStr.split(":").map(Number);
  const [h2, m2] = horaFinStr.split(":").map(Number);
  const total1 = (h1 || 0) * 60 + (m1 || 0);
  const total2 = (h2 || 0) * 60 + (m2 || 0);
  const diff = total2 - total1;
  return diff > 0 ? diff : 120;
}

function formatearMinutosTexto(minutosTotales: number): string {
  const mins = Math.max(0, Math.round(minutosTotales));
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h > 0 && m > 0) return `${h} h ${m} min`;
  if (h > 0) return `${h} h`;
  return `${m} min`;
}

interface Props {
  abierto: boolean;
  sesion: SesionDetalleDto | null;
  iCveTipoServicio?: number | null;
  bTipoDato?: boolean | null;
  cantidadTotal?: number | null;
  unidad?: string | null;
  todasLasSesiones?: SesionDetalleDto[];
  onCerrar: () => void;
  onGuardadoExitoso: () => void;
}

export const ModalEditarInstructorSesion: React.FC<Props> = ({
  abierto,
  sesion,
  iCveTipoServicio,
  bTipoDato,
  cantidadTotal,
  unidad,
  todasLasSesiones,
  onCerrar,
  onGuardadoExitoso,
}) => {
  const { toast } = useToast();
  const [instructores, setInstructores] = useState<InstructorGetDto[]>([]);
  const [cargandoInstructores, setCargandoInstructores] = useState<boolean>(false);
  const [guardando, setGuardando] = useState<boolean>(false);

  // Estados de Fecha y Horario
  const [formFecha, setFormFecha] = useState<string>("");
  const [formHoraInicio, setFormHoraInicio] = useState<string>("09:00");
  const [formHoraFin, setFormHoraFin] = useState<string>("13:00");

  // Estados de Instructores
  const [formTitular, setFormTitular] = useState<string>("");
  const [formApoyo, setFormApoyo] = useState<string>("");

  const esCapacitacion = Number(iCveTipoServicio) === 2;
  const tieneProveedor = Boolean(sesion?.b_TipoProvInsApoyo);

  const bTipoDatoManejaHorario =
    bTipoDato !== undefined && bTipoDato !== null
      ? Boolean(bTipoDato)
      : (sesion as any)?.b_TipoDato !== undefined
      ? Boolean((sesion as any).b_TipoDato)
      : true;

  const esUnidadHoras = useMemo(() => {
    if (Number(iCveTipoServicio) === 2) return true;
    if (!unidad) return false;
    const u = unidad.toLowerCase();
    return u.includes("hora") || u.includes("hr");
  }, [unidad, iCveTipoServicio]);

  useEffect(() => {
    if (!abierto || !sesion) {
      setFormFecha("");
      setFormHoraInicio("09:00");
      setFormHoraFin("13:00");
      setFormTitular("");
      setFormApoyo("");
      return;
    }

    // Precargar fecha y horas de la sesión
    const fechaIni = sesion.d_FechaHoraInicio || (sesion as any).f_FechaHoraInicio;
    const fechaFin = sesion.d_FechaHoraFin || (sesion as any).f_FechaHoraFin;

    if (fechaIni) {
      setFormFecha(fechaIni.split("T")[0]);
      const timeIni = fechaIni.includes("T") ? fechaIni.split("T")[1].substring(0, 5) : "09:00";
      setFormHoraInicio(timeIni);
    } else {
      setFormFecha(new Date().toISOString().split("T")[0]);
      setFormHoraInicio("09:00");
    }

    if (fechaFin) {
      const timeFin = fechaFin.includes("T") ? fechaFin.split("T")[1].substring(0, 5) : "13:00";
      setFormHoraFin(timeFin);
    } else {
      setFormHoraFin("13:00");
    }

    // Cargar catálogo de instructores si no está cargado
    if (instructores.length === 0) {
      setCargandoInstructores(true);
      AgendaService.getInstructores()
        .then((list) => setInstructores(list || []))
        .catch(() => toast.error("Error al cargar el catálogo de instructores"))
        .finally(() => setCargandoInstructores(false));
    }

    // Precargar titular solo si es capacitación
    if (esCapacitacion && sesion.i_CveTitular && Number(sesion.i_CveTitular) > 0) {
      setFormTitular(String(sesion.i_CveTitular));
    } else {
      setFormTitular("");
    }

    // Precargar apoyo solo si b_TipoProvInsApoyo es false
    if (!sesion.b_TipoProvInsApoyo && sesion.i_CveApoyo && Number(sesion.i_CveApoyo) > 0) {
      setFormApoyo(String(sesion.i_CveApoyo));
    } else {
      setFormApoyo("");
    }
  }, [abierto, sesion, iCveTipoServicio, esCapacitacion]);

  // Al cambiar hora de inicio, mover hora fin automáticamente conservando duración
  const handleCambiarHoraInicio = (nuevaHoraInicio: string) => {
    const duracionMins = calcularDiferenciaMinutos(formHoraInicio, formHoraFin);
    const nuevaHoraFin = sumarMinutosAHorario(nuevaHoraInicio, duracionMins);
    setFormHoraInicio(nuevaHoraInicio);
    setFormHoraFin(nuevaHoraFin);
  };

  // Cálculo de minutos programados sumando sesiones vigentes con el horario editado
  const minutosProgramados = useMemo(() => {
    if (!esUnidadHoras) return 0;

    const cveActual = Number(
      sesion?.i_CveAgendaDetalle ??
      (sesion as any)?.I_CveAgendaDetalle ??
      (sesion as any)?.iCveAgendaDetalle ??
      0
    );

    // 1. Sumar las otras sesiones vigentes en minutos
    const minsOtras = (todasLasSesiones || []).reduce((acc, s) => {
      const bCancelada = Boolean(s.b_Cancelada || (s as any).b_cancelada || (s as any).bCancelada);
      const iCveReprog = s.i_CveReprograma ?? (s as any).i_cveReprograma;
      const esReprog = iCveReprog != null && Number(iCveReprog) > 0;
      const esVig = !bCancelada && !esReprog;

      const cveIter = Number(
        s.i_CveAgendaDetalle ??
        (s as any)?.I_CveAgendaDetalle ??
        (s as any)?.iCveAgendaDetalle ??
        0
      );

      // Omitir si no es vigente o es la misma sesión en edición
      if (!esVig || (cveActual > 0 && cveIter === cveActual)) {
        return acc;
      }

      const ini = s.d_FechaHoraInicio || (s as any).f_FechaHoraInicio;
      const fin = s.d_FechaHoraFin || (s as any).f_FechaHoraFin;
      if (!ini || !fin) return acc;

      const diffMins = Math.round((new Date(fin).getTime() - new Date(ini).getTime()) / (1000 * 60));
      return acc + (diffMins > 0 ? diffMins : 0);
    }, 0);

    // 2. Sumar la sesión actual con los valores editados
    let minsActual = 0;
    if (bTipoDatoManejaHorario && formHoraInicio && formHoraFin) {
      const [h1, m1] = formHoraInicio.split(":").map(Number);
      const [h2, m2] = formHoraFin.split(":").map(Number);
      const diff = (h2 * 60 + (m2 || 0)) - (h1 * 60 + (m1 || 0));
      if (diff > 0) minsActual = diff;
    }

    return minsOtras + minsActual;
  }, [esUnidadHoras, todasLasSesiones, sesion, bTipoDatoManejaHorario, formHoraInicio, formHoraFin]);

  const minutosContratados = Math.round((Number(cantidadTotal) || 0) * 60);
  const diffMinutos = minutosProgramados - minutosContratados;

  const faltanHoras = minutosContratados > 0 && diffMinutos < 0;
  const sePasaHoras = minutosContratados > 0 && diffMinutos > 0;
  const coincideHoras = minutosContratados > 0 && diffMinutos === 0;

  // Formato del texto indicador
  const textoIndicador = useMemo(() => {
    if (!esUnidadHoras || minutosContratados <= 0) return "";
    const progStr = formatearMinutosTexto(minutosProgramados);
    const contStr = formatearMinutosTexto(minutosContratados);

    if (diffMinutos === 0) {
      return `Sesiones programadas: ${progStr} de ${contStr} contratadas`;
    }
    if (diffMinutos < 0) {
      const faltaStr = formatearMinutosTexto(Math.abs(diffMinutos));
      return `Sesiones programadas: ${progStr} de ${contStr} contratadas · faltan ${faltaStr}`;
    }
    const sobraStr = formatearMinutosTexto(diffMinutos);
    return `Sesiones programadas: ${progStr} de ${contStr} contratadas · sobran ${sobraStr}`;
  }, [esUnidadHoras, minutosProgramados, minutosContratados, diffMinutos]);

  // Gris si coincide (#64748b), ámbar si faltan (#d97706), rojo si se pasa (#dc2626)
  const colorHoras = sePasaHoras ? "#dc2626" : faltanHoras ? "#d97706" : "#64748b";

  if (!abierto || !sesion) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sesion) return;

    if (!formFecha) {
      toast.warning("Selecciona la fecha de la sesión.");
      return;
    }

    if (bTipoDatoManejaHorario) {
      if (!formHoraInicio) {
        toast.warning("Ingresa la hora de inicio.");
        return;
      }
      if (!formHoraFin) {
        toast.warning("Ingresa la hora de fin.");
        return;
      }
      if (formHoraFin <= formHoraInicio) {
        toast.warning("La hora fin debe ser posterior a la hora de inicio.");
        return;
      }
    }

    if (esUnidadHoras && sePasaHoras) {
      toast.warning("Las sesiones programadas exceden las horas contratadas.");
      return;
    }

    // Validación: No permitir elegir al mismo instructor como titular y apoyo
    if (esCapacitacion && formTitular && formApoyo && formTitular === formApoyo) {
      toast.warning("No puedes elegir al mismo instructor como titular y apoyo.");
      return;
    }

    const cveAgendaDetalle = Number(
      sesion.i_CveAgendaDetalle ??
      (sesion as any).I_CveAgendaDetalle ??
      (sesion as any).iCveAgendaDetalle ??
      (sesion as any).iD_AgendaDetalle ??
      (sesion as any).id_agendaDetalle ??
      0
    );

    const dFechaHoraInicio = bTipoDatoManejaHorario
      ? `${formFecha}T${formHoraInicio}:00`
      : `${formFecha}T00:00:00`;

    const dFechaHoraFin = bTipoDatoManejaHorario
      ? `${formFecha}T${formHoraFin}:00`
      : `${formFecha}T23:59:59`;

    const payload: CambiarTitularesSesionDto = {
      i_CveAgendaDetalle: cveAgendaDetalle,
      i_CveTitular: esCapacitacion && formTitular ? Number(formTitular) : null,
      i_CveApoyo: tieneProveedor ? null : formApoyo ? Number(formApoyo) : null,
      d_FechaHoraInicio: dFechaHoraInicio,
      d_FechaHoraFin: dFechaHoraFin,
    };

    setGuardando(true);
    try {
      const res = await AgendaService.cambiarTitularesSesion(payload);
      if (res.exito || res.status === 200) {
        toast.success("Sesión actualizada");
        onGuardadoExitoso();
        onCerrar();
      } else if (res.status === 409) {
        toast.warning(res.mensaje || "Conflicto al actualizar la sesión.");
      } else {
        toast.error(res.mensaje || "Error al actualizar la sesión.");
      }
    } catch {
      toast.error("Ocurrió un error inesperado al actualizar la sesión.");
    } finally {
      setGuardando(false);
    }
  };

  const getNombreInstructor = (ins: any): string => {
    const cve = ins.i_CveInstructor ?? ins.iD_Instructor ?? ins.id_instructor ?? ins.iCveInstructor;
    return (
      ins.v_NombreCompleto ||
      ins.v_NombreTitular ||
      `${ins.v_Nombre || ""} ${ins.v_ApPaterno || ""}`.trim() ||
      `Instructor #${cve}`
    );
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(15, 23, 42, 0.55)",
        backdropFilter: "blur(4px)",
        zIndex: 1100,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
      }}
    >
      <div
        style={{
          backgroundColor: "#ffffff",
          borderRadius: "14px",
          boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.15), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
          width: "100%",
          maxWidth: "480px",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "16px 20px",
            borderBottom: "1px solid #e2e8f0",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            backgroundColor: "#f8fafc",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                width: "34px",
                height: "34px",
                borderRadius: "8px",
                backgroundColor: "#e0f2fe",
                color: "#0284c7",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Calendar size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: "14px", fontWeight: 600, color: "#0f172a", margin: 0 }}>
                Editar sesión
              </h3>
              <p style={{ fontSize: "12px", color: "#64748b", margin: "2px 0 0 0" }}>
                Sesión {sesion.i_Orden || 1} — {formatearFechaCorta(sesion.d_FechaHoraInicio)}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCerrar}
            disabled={guardando}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "#64748b",
              padding: "4px",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "16px" }}>
          {cargandoInstructores ? (
            <div style={{ padding: "20px 0", textAlign: "center", color: "#64748b", fontSize: "13px" }}>
              Cargando información...
            </div>
          ) : (
            <>
              {/* 1. Fecha y Horario */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: bTipoDatoManejaHorario
                    ? "repeat(auto-fit, minmax(120px, 1fr))"
                    : "1fr",
                  gap: "12px",
                }}
              >
                <div>
                  <label
                    style={{
                      fontSize: "12px",
                      fontWeight: 600,
                      color: "#334155",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      marginBottom: "6px",
                    }}
                  >
                    <Calendar size={13} style={{ color: "#0284c7" }} />
                    Fecha <span style={{ color: "#dc2626" }}>*</span>
                  </label>
                  <InputFechaTexto
                    height="36px"
                    value={formFecha}
                    onChange={(val) => setFormFecha(val)}
                  />
                </div>

                {bTipoDatoManejaHorario && (
                  <>
                    <div>
                      <label
                        style={{
                          fontSize: "12px",
                          fontWeight: 600,
                          color: "#334155",
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                          marginBottom: "6px",
                        }}
                      >
                        <Clock size={13} style={{ color: "#0284c7" }} />
                        Hora inicio <span style={{ color: "#dc2626" }}>*</span>
                      </label>
                      <select
                        className="form-select"
                        value={formHoraInicio}
                        onChange={(e) => handleCambiarHoraInicio(e.target.value)}
                        disabled={guardando}
                        style={{ height: "36px", fontSize: "13px", borderRadius: "8px" }}
                        required
                      >
                        {HORAS_OPCIONES.map((h) => (
                          <option key={h} value={h}>
                            {h}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label
                        style={{
                          fontSize: "12px",
                          fontWeight: 600,
                          color: "#334155",
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                          marginBottom: "6px",
                        }}
                      >
                        <Clock size={13} style={{ color: "#64748b" }} />
                        Hora fin <span style={{ color: "#dc2626" }}>*</span>
                      </label>
                      <select
                        className="form-select"
                        value={formHoraFin}
                        onChange={(e) => setFormHoraFin(e.target.value)}
                        disabled={guardando}
                        style={{ height: "36px", fontSize: "13px", borderRadius: "8px" }}
                        required
                      >
                        {(() => {
                          let options = HORAS_OPCIONES.filter(
                            (h) => h > formHoraInicio
                          );
                          if (formHoraFin && !options.includes(formHoraFin)) {
                            options = Array.from(new Set([...options, formHoraFin])).sort();
                          }
                          return options.map((h) => (
                            <option key={h} value={h}>
                              {h}
                            </option>
                          ));
                        })()}
                      </select>
                    </div>
                  </>
                )}
              </div>

              {/* Indicador de Horas Programadas (si la unidad del servicio es horas) */}
              {esUnidadHoras && minutosContratados > 0 && (
                <div
                  style={{
                    fontSize: "12px",
                    fontWeight: 500,
                    color: colorHoras,
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    marginTop: "-4px",
                    marginBottom: "2px",
                  }}
                >
                  <span>{textoIndicador}</span>
                </div>
              )}

              {/* 2. Instructor Titular (solo si i_CveTipoServicio === 2) */}
              {esCapacitacion && (
                <div>
                  <label
                    style={{
                      fontSize: "12px",
                      fontWeight: 600,
                      color: "#334155",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      marginBottom: "6px",
                    }}
                  >
                    <User size={13} style={{ color: "#0284c7" }} />
                    Instructor titular
                  </label>
                  <select
                    className="form-select"
                    value={formTitular}
                    onChange={(e) => setFormTitular(e.target.value)}
                    disabled={guardando}
                    style={{ fontSize: "13px", height: "36px", borderRadius: "8px" }}
                  >
                    <option value="">— Sin titular —</option>
                    {instructores.map((ins: any) => {
                      const cve = ins.i_CveInstructor ?? ins.iD_Instructor ?? ins.id_instructor ?? ins.iCveInstructor;
                      const nombre = getNombreInstructor(ins);
                      const isSelectedAsApoyo = formApoyo !== "" && String(cve) === formApoyo;
                      return (
                        <option key={cve} value={cve} disabled={isSelectedAsApoyo}>
                          {nombre} {isSelectedAsApoyo ? "(Seleccionado en apoyo)" : ""}
                        </option>
                      );
                    })}
                  </select>
                </div>
              )}

              {/* 3. Instructor de Apoyo */}
              <div>
                <label
                  style={{
                    fontSize: "12px",
                    fontWeight: 600,
                    color: "#334155",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    marginBottom: "6px",
                  }}
                >
                  <Users size={13} style={{ color: "#64748b" }} />
                  Instructor de apoyo
                </label>
                <select
                  className="form-select"
                  value={tieneProveedor ? "" : formApoyo}
                  onChange={(e) => setFormApoyo(e.target.value)}
                  disabled={guardando || tieneProveedor}
                  style={{
                    fontSize: "13px",
                    height: "36px",
                    borderRadius: "8px",
                    backgroundColor: tieneProveedor ? "#f1f5f9" : "#ffffff",
                    cursor: tieneProveedor ? "not-allowed" : "default",
                  }}
                >
                  <option value="">— Sin apoyo —</option>
                  {!tieneProveedor &&
                    instructores.map((ins: any) => {
                      const cve = ins.i_CveInstructor ?? ins.iD_Instructor ?? ins.id_instructor ?? ins.iCveInstructor;
                      const nombre = getNombreInstructor(ins);
                      const isSelectedAsTitular = esCapacitacion && formTitular !== "" && String(cve) === formTitular;
                      return (
                        <option key={cve} value={cve} disabled={isSelectedAsTitular}>
                          {nombre} {isSelectedAsTitular ? "(Seleccionado en titular)" : ""}
                        </option>
                      );
                    })}
                </select>

                {tieneProveedor && (
                  <p
                    style={{
                      fontSize: "11px",
                      color: "#64748b",
                      marginTop: "6px",
                      marginBottom: 0,
                      lineHeight: "1.4",
                    }}
                  >
                    Este servicio tiene proveedor asignado. Quítalo para poder agregar un instructor de apoyo.
                  </p>
                )}
              </div>
            </>
          )}

          {/* Footer acciones */}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "12px" }}>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={onCerrar}
              disabled={guardando}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn btn-primary btn-sm"
              style={{ backgroundColor: "#2B8FCC" }}
              disabled={guardando || cargandoInstructores || (esUnidadHoras && sePasaHoras)}
            >
              {guardando ? "Guardando..." : "Guardar cambios"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const ModalEditarSesion = ModalEditarInstructorSesion;
