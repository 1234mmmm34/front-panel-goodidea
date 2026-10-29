"use client";

import React, { useEffect, useState } from "react";
import {
  X,
  Calendar,
  Users,
  AlertTriangle,
  CheckCircle2,
  Circle,
  Paperclip,
  ChevronDown,
  ChevronUp,
  Loader2,
  PlayCircle,
  XCircle,
  RefreshCw,
} from "lucide-react";
import {
  AgendaDetalleConsultorCabeceraDto,
  SesionConsultorDto,
  EntregableConsultorDto,
  AlumnoConsultorDto,
} from "@/types/consultor";
import { ConsultorService } from "@/services/consultor.service";
import { VerDocumento } from "@/services/archivos.service";
import { formatearFechaTexto } from "@/lib/date-utils";
import { useToast } from "@/context/ToastContext";
import { BloquePipcEntregable } from "@/components/pipc/CardPipcDetalleServicio";
import { PipcService, extraerMensajeError } from "@/services/pipc.service";
import { PipcResumen } from "@/types/pipc";
import { normalizarTexto } from "@/components/pipc/pipcCalculos";

function obtenerFechasExtremosSesiones(sesiones?: Array<{
  d_FechaHoraInicio?: string | null;
  d_FechaHoraFin?: string | null;
  b_Cancelada?: boolean | null;
}> | null): { fechaInicio: string | null; fechaFin: string | null } {
  if (!sesiones || sesiones.length === 0) {
    return { fechaInicio: null, fechaFin: null };
  }
  const validas = sesiones.filter((s) => !s.b_Cancelada && !(s as any).b_cancelada);
  const pool = validas.length > 0 ? validas : sesiones;

  let minInicio: string | null = null;
  let maxFin: string | null = null;

  for (const s of pool) {
    if (s.d_FechaHoraInicio) {
      if (!minInicio || s.d_FechaHoraInicio < minInicio) {
        minInicio = s.d_FechaHoraInicio;
      }
    }
    if (s.d_FechaHoraFin) {
      if (!maxFin || s.d_FechaHoraFin > maxFin) {
        maxFin = s.d_FechaHoraFin;
      }
    }
  }

  return { fechaInicio: minInicio, fechaFin: maxFin };
}

interface Props {
  abierto: boolean;
  iCveAgenda: number | null;
  iCveServAgendaDet: number | null;
  onCerrar: () => void;
  onGuardadoExitoso?: () => void;
}

export const ModalDetalleServicioConsultor: React.FC<Props> = ({
  abierto,
  iCveAgenda,
  iCveServAgendaDet,
  onCerrar,
  onGuardadoExitoso,
}) => {
  const { toast, confirmModal } = useToast();
  const [cargando, setCargando] = useState<boolean>(true);
  const [errorCarga, setErrorCarga] = useState<string | null>(null);

  const [cabecera, setCabecera] = useState<AgendaDetalleConsultorCabeceraDto | null>(null);
  const [sesiones, setSesiones] = useState<SesionConsultorDto[]>([]);
  const [entregables, setEntregables] = useState<EntregableConsultorDto[]>([]);
  const [alumnos, setAlumnos] = useState<AlumnoConsultorDto[]>([]);
  const [pipcResumen, setPipcResumen] = useState<PipcResumen | null>(null);

  // Estados de guardado de entregables
  const [entregablesGuardando, setEntregablesGuardando] = useState<Set<number>>(new Set());

  // Acordeones
  const [acordeonSesiones, setAcordeonSesiones] = useState<boolean>(true);
  const [acordeonAlumnos, setAcordeonAlumnos] = useState<boolean>(true);
  const [sesionAbiertaIdx, setSesionAbiertaIdx] = useState<number | null>(0);

  const cargarResumenPipc = async (servicioId: number) => {
    try {
      const data = await PipcService.getResumen(servicioId);
      setPipcResumen(data);
    } catch (err: any) {
      if (err?.response?.status !== 404) {
        toast.error(extraerMensajeError(err, "Error al cargar resumen PIPC"));
      }
      setPipcResumen(null);
    }
  };

  useEffect(() => {
    if (abierto && iCveServAgendaDet) {
      cargarDetalle();
      cargarResumenPipc(iCveServAgendaDet);
    } else {
      setCabecera(null);
      setSesiones([]);
      setEntregables([]);
      setAlumnos([]);
      setErrorCarga(null);
      setPipcResumen(null);
    }
  }, [abierto, iCveAgenda, iCveServAgendaDet]);

  const cargarDetalle = async () => {
    if (!iCveServAgendaDet) return;
    setCargando(true);
    setErrorCarga(null);
    try {
      const data = await ConsultorService.getDetalle(iCveAgenda || 0, iCveServAgendaDet);
      setCabecera(data.cabecera);
      setSesiones(data.sesiones || []);
      setEntregables(data.entregables || []);
      setAlumnos(data.alumnos || []);
    } catch (err: any) {
      if (err?.response?.status === 403) {
        toast.error("No tienes acceso a este servicio.");
        setErrorCarga("No tienes acceso a este servicio.");
      } else {
        const msg =
          err?.response?.data?.mensaje ||
          err?.response?.data?.message ||
          "Ocurrió un error al cargar el detalle del servicio.";
        toast.error(msg);
        setErrorCarga(msg);
      }
    } finally {
      setCargando(false);
    }
  };

  const handleConfirmarTerminoClick = () => {
    if (!cabecera) return;
    confirmModal({
      title: "¿Confirmas que este servicio ya terminó?",
      message: "Se avisará a administración para facturar.",
      confirmText: "Confirmar",
      cancelText: "Cancelar",
      variant: "primary",
      onConfirm: async () => {
        try {
          const res = await ConsultorService.confirmarTermino(cabecera.i_CveServAgendaDet);
          if (res.exito) {
            toast.success("Servicio confirmado como terminado");
            await cargarDetalle();
            onGuardadoExitoso?.();
          } else {
            toast.error(res.mensaje || "Error al confirmar terminado");
          }
        } catch (error: any) {
          const msg =
            error?.response?.data?.mensaje ||
            error?.response?.data?.message ||
            error?.response?.data?.error ||
            "Error al confirmar terminado";
          toast.error(msg);
        }
      },
    });
  };

  const renderBannerEstatus = () => {
    if (!cabecera) return null;
    if (cabecera.b_SinProgramar && cabecera.i_CveEstatus !== 0) return null;

    const estatus = cabecera.i_CveEstatus ?? 1;
    const { fechaInicio, fechaFin } = obtenerFechasExtremosSesiones(sesiones);
    const fInicioStr = fechaInicio ? formatearFechaTexto(fechaInicio) : "";
    const fFinStr = fechaFin ? formatearFechaTexto(fechaFin) : "";

    let config = {
      bg: "#e7f1fb",
      border: "#b6d4f2",
      text: "#1f5f9e",
      icon: Calendar,
      texto: `Programado${fInicioStr ? ` · Inicia el ${fInicioStr}` : ""}`,
    };

    switch (estatus) {
      case 0:
        config = {
          bg: "#fef3f2",
          border: "#fecdca",
          text: "#b42318",
          icon: XCircle,
          texto: "Cancelado",
        };
        break;
      case 1:
        config = {
          bg: "#e7f1fb",
          border: "#b6d4f2",
          text: "#1f5f9e",
          icon: Calendar,
          texto: `Programado${fInicioStr ? ` · Inicia el ${fInicioStr}` : ""}`,
        };
        break;
      case 2:
      case 6:
        config = {
          bg: "#fff8e1",
          border: "#ffe08a",
          text: "#8a6100",
          icon: PlayCircle,
          texto: `En curso${fFinStr ? ` · Finaliza el ${fFinStr}` : ""}`,
        };
        break;
      case 3: {
        const porQuien = cabecera.v_ConfirmadoPor?.trim();
        config = {
          bg: "#ecfdf3",
          border: "#abefc6",
          text: "#067647",
          icon: CheckCircle2,
          texto: cabecera.d_FechaConfirmacionTermino
            ? `Terminado · Confirmado ${porQuien ? `por ${porQuien} ` : ""}el ${formatearFechaTexto(cabecera.d_FechaConfirmacionTermino)}`
            : "Terminado",
        };
        break;
      }
      case 4:
        config = {
          bg: "#f2f4f7",
          border: "#d0d5dd",
          text: "#475467",
          icon: RefreshCw,
          texto: "Reprogramado",
        };
        break;
      case 5:
        config = {
          bg: "#fff4ec",
          border: "#ffd3b0",
          text: "#b54708",
          icon: AlertTriangle,
          texto: "Por confirmar · Llegó la fecha de finalización estimada. ¿Ya terminó?",
        };
        break;
      default:
        break;
    }

    const IconComp = config.icon;

    return (
      <div
        style={{
          marginTop: "14px",
          padding: "12px 14px",
          backgroundColor: config.bg,
          border: `1px solid ${config.border}`,
          borderRadius: "8px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "12px",
          flexWrap: "wrap",
          fontSize: "12px",
          color: config.text,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px", flex: "1 1 auto", minWidth: 0 }}>
          <IconComp size={16} style={{ color: config.text, flexShrink: 0 }} />
          <span style={{ fontWeight: 500, lineHeight: 1.4 }}>{config.texto}</span>
        </div>

        {estatus === 5 && (
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
        )}
      </div>
    );
  };

  const handleToggleEntregable = async (ent: EntregableConsultorDto) => {
    const nuevoValor = !ent.b_Entregado;
    const valorAnterior = Boolean(ent.b_Entregado);

    setEntregablesGuardando((prev) => new Set(prev).add(ent.i_CveAgendaEntregables));

    // Optimistic update
    setEntregables((prev) =>
      prev.map((e) =>
        e.i_CveAgendaEntregables === ent.i_CveAgendaEntregables
          ? {
              ...e,
              b_Entregado: nuevoValor,
              f_FechaEntregable: nuevoValor ? new Date().toISOString() : null,
            }
          : e
      )
    );

    try {
      await ConsultorService.marcarEntregable(ent.i_CveAgendaEntregables, nuevoValor);
      toast.success(
        nuevoValor
          ? "Entregable marcado como entregado"
          : "Entregable marcado como pendiente"
      );
      onGuardadoExitoso?.();
    } catch (err: any) {
      // Revertir
      setEntregables((prev) =>
        prev.map((e) =>
          e.i_CveAgendaEntregables === ent.i_CveAgendaEntregables
            ? { ...e, b_Entregado: valorAnterior }
            : e
        )
      );

      if (err?.response?.status === 403) {
        toast.error("No tienes acceso a este servicio.");
      } else {
        const msg =
          err?.response?.data?.mensaje ||
          err?.response?.data?.message ||
          "No se pudo actualizar el estado del entregable.";
        toast.error(msg);
      }
    } finally {
      setEntregablesGuardando((prev) => {
        const next = new Set(prev);
        next.delete(ent.i_CveAgendaEntregables);
        return next;
      });
    }
  };

  if (!abierto) return null;

  // Lógica de Cupos y Alumnos (2 = Capacitación)
  const esCapacitacion =
    cabecera?.i_CveTipoServicio !== undefined && cabecera?.i_CveTipoServicio !== null
      ? Number(cabecera.i_CveTipoServicio) === 2
      : cabecera?.v_TipoServicio
      ? cabecera.v_TipoServicio.toUpperCase().includes("CAPACITACI")
      : false;

  const cupos = cabecera?.i_NumAlumnos ?? 0;
  const inscritos = alumnos.length;
  const sinLimite = cupos === 0;

  const getBadgeColorAlumnos = () => {
    if (!sinLimite && inscritos >= cupos) return "bg-rose-50 text-rose-700 border-rose-200";
    if (inscritos === 0) return "bg-slate-100 text-slate-600 border-slate-200";
    return "bg-emerald-50 text-emerald-700 border-emerald-200";
  };

  const obtenerTextoPersonalSesion = (sesion: SesionConsultorDto): string => {
    const titular = sesion.v_Titular?.trim();
    const esProveedorApoyo = Boolean(sesion.b_TipoProvInsApoyo);
    const apoyo = !esProveedorApoyo ? sesion.v_Apoyo?.trim() : null;

    const personas = [titular, apoyo].filter((p): p is string => Boolean(p && p.trim()));
    if (personas.length > 0) {
      return personas.join(", ");
    }
    return esCapacitacion ? "Sin personal" : (esProveedorApoyo ? "" : "Sin apoyo");
  };

  const renderBadgeSesion = (sesion: SesionConsultorDto) => {
    const bCancelada = Boolean(sesion.b_Cancelada);
    if (bCancelada) {
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
          Cancelada
        </span>
      );
    }

    const iCveReprograma = sesion.i_CveReprograma;
    if (iCveReprograma != null && Number(iCveReprograma) > 0) {
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

  const renderEstatusBadge = (estatus: number) => {
    switch (estatus) {
      case 0:
        return <span className="badge badge-danger">Cancelado</span>;
      case 1:
        return <span className="badge badge-primary">Programado</span>;
      case 2:
      case 6:
        return <span className="badge badge-warning">En curso</span>;
      case 3:
        return <span className="badge badge-success">Terminado</span>;
      case 4:
        return <span className="badge badge-secondary">Reprogramado</span>;
      case 5:
        return (
          <span
            className="badge"
            title="Llegó la fecha de finalización estimada. Falta confirmar que terminó."
            style={{ backgroundColor: "#ffe5d0", color: "#984c0c" }}
          >
            Por confirmar
          </span>
        );
      default:
        return <span className="badge badge-primary">Programado</span>;
    }
  };

  // Resumen de Pendientes client-side (solo lo aplicable al personal)
  const calcularPendientes = (): string[] => {
    if (!cabecera) return [];
    const p: string[] = [];
    if (cabecera.b_SinProgramar) p.push("Programación");
    if (entregables.some((e) => !e.b_Entregado)) p.push("Entregables");
    if (cabecera.b_AplicaVoBo && !cabecera.v_KeyVoBo) p.push("Visto bueno");
    return p;
  };

  const pendientesList = calcularPendientes();

  return (
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
    >
      <div
        className="modal-content no-scrollbar"
        style={{
          maxWidth: "850px",
          width: "100%",
          maxHeight: "98vh",
          backgroundColor: "#ffffff",
          borderRadius: "16px",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0, 0, 0, 0.05)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          scrollbarWidth: "none",
          msOverflowStyle: "none",
        }}
      >
        {/* Header del Modal */}
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
          <h3 style={{ fontSize: "15px", fontWeight: 500, color: "#0f172a", margin: 0 }}>
            Detalle del servicio
          </h3>
          <button
            className="btn-icon"
            onClick={onCerrar}
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

        {/* Body del Modal con Scroll Interno */}
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
          {cargando || !cabecera ? (
            <div style={{ padding: "48px 0", textAlign: "center", color: "#64748b" }}>
              <div className="spinner-border text-primary mb-3" style={{ width: "24px", height: "24px" }}></div>
              <p style={{ fontSize: "12px", margin: 0 }}>Cargando detalle del servicio...</p>
            </div>
          ) : errorCarga ? (
            <div
              style={{
                padding: "20px 16px",
                textAlign: "center",
                color: "#b91c1c",
                backgroundColor: "#fef2f2",
                borderRadius: "10px",
                border: "1px solid #fecaca",
              }}
            >
              <p style={{ fontSize: "13px", fontWeight: 500, margin: 0 }}>{errorCarga}</p>
            </div>
          ) : (
            <>
              {/* BLOQUE 1.1 — Info General (Sin caja contenedora exterior, Grid 2-4 columnas) */}
              <div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "16px" }}>
                  <div>
                    <span style={{ fontSize: "11px", fontWeight: 400, color: "#64748b", display: "block", marginBottom: "2px" }}>servicio</span>
                    <p style={{ fontSize: "13px", fontWeight: 400, color: "#0f172a", margin: 0, lineHeight: 1.3 }}>{cabecera.v_Servicio || "—"}</p>
                    <p style={{ fontSize: "12px", fontWeight: 400, color: "#64748b", margin: "2px 0 0 0" }}>
                      {cabecera.i_Cantidad ?? 0} {cabecera.v_Unidad || ""}
                    </p>
                  </div>

                  <div>
                    <span style={{ fontSize: "11px", fontWeight: 400, color: "#64748b", display: "block", marginBottom: "2px" }}>tipo</span>
                    <p style={{ fontSize: "13px", fontWeight: 400, color: "#0f172a", margin: 0, lineHeight: 1.3 }}>{cabecera.v_TipoServicio || "—"}</p>
                  </div>

                  <div>
                    <span style={{ fontSize: "11px", fontWeight: 400, color: "#64748b", display: "block", marginBottom: "2px" }}>empresa</span>
                    <p style={{ fontSize: "13px", fontWeight: 400, color: "#0f172a", margin: 0, textTransform: "uppercase", lineHeight: 1.3 }}>{cabecera.v_Empresa || "—"}</p>
                  </div>

                  <div>
                    <span style={{ fontSize: "11px", fontWeight: 400, color: "#64748b", display: "block", marginBottom: "2px" }}>planta</span>
                    <p style={{ fontSize: "13px", fontWeight: 400, color: "#0f172a", margin: 0, lineHeight: 1.3 }}>{cabecera.v_Planta || "—"}</p>
                  </div>
                </div>

                {renderBannerEstatus()}

                {cabecera.b_SinProgramar && (
                  <div
                    style={{
                      marginTop: "14px",
                      padding: "12px 14px",
                      backgroundColor: "#fffbeb",
                      border: "1px solid #fde68a",
                      borderRadius: "8px",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      fontSize: "12px",
                      color: "#92400e",
                    }}
                  >
                    <AlertTriangle size={16} style={{ color: "#d97706", flexShrink: 0 }} />
                    <span>
                      Este servicio está <strong>pendiente de programar</strong> — falta definir fecha, hora y personal.
                    </span>
                  </div>
                )}

                {/* Sección Notas del servicio (en solo lectura, solo si hay contenido) */}
                {cabecera.v_Notas && cabecera.v_Notas.trim() !== "" && (
                  <div style={{ marginTop: "16px" }}>
                    <span
                      style={{
                        fontSize: "11px",
                        fontWeight: 400,
                        color: "#64748b",
                        display: "block",
                        marginBottom: "6px",
                      }}
                    >
                      notas
                    </span>
                    <div
                      style={{
                        width: "100%",
                        fontSize: "13px",
                        borderRadius: "8px",
                        border: "1px solid #d0dce8",
                        padding: "8px 12px",
                        backgroundColor: "#f8fafc",
                        color: "#0f172a",
                        whiteSpace: "pre-wrap",
                        lineHeight: 1.5,
                      }}
                    >
                      {cabecera.v_Notas}
                    </div>
                  </div>
                )}
              </div>

              {/* BLOQUE 1.2 — Sesiones (Sin caja contenedora exterior) */}
              <div>
                <h4 style={{ fontSize: "12px", fontWeight: 500, color: "#64748b", margin: "0 0 8px 0" }}>
                  Sesiones de la agenda ({sesiones.length})
                </h4>

                <div style={{ border: "1px solid #e2e8f0", borderRadius: "8px", overflow: "hidden" }}>
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
                    onClick={() => setAcordeonSesiones(!acordeonSesiones)}
                  >
                    <span style={{ fontSize: "13px", fontWeight: 500, color: "#334155", display: "flex", alignItems: "center", gap: "8px" }}>
                      <Calendar size={15} style={{ color: "#94a3b8" }} />
                      Ver historial de sesiones
                    </span>
                    {acordeonSesiones ? <ChevronUp size={16} style={{ color: "#94a3b8" }} /> : <ChevronDown size={16} style={{ color: "#94a3b8" }} />}
                  </button>

                  {acordeonSesiones && (
                    <div style={{ padding: "12px", backgroundColor: "#ffffff", borderTop: "1px solid #e2e8f0", display: "flex", flexDirection: "column", gap: "8px" }}>
                      {sesiones.length === 0 ? (
                        <p style={{ fontSize: "12px", color: "#64748b", margin: 0 }}>No hay sesiones registradas.</p>
                      ) : (
                        sesiones.map((sesion, sIdx) => {
                          const bCancelada = Boolean(sesion.b_Cancelada);
                          const iCveReprograma = sesion.i_CveReprograma;
                          const esReprogramada = iCveReprograma != null && Number(iCveReprograma) > 0;

                          const esExpandible = esReprogramada || (bCancelada && Boolean(sesion.v_MotivoCancelacion));
                          const estaAbierto = sesionAbiertaIdx === sIdx;
                          const sesionNueva = esReprogramada
                            ? sesiones.find((s) => s.i_CveAgendaDetalle === iCveReprograma)
                            : null;

                          return (
                            <div key={`det-sesion-${sesion.i_CveAgendaDetalle || 'det'}-${sIdx}`} style={{ border: "1px solid #e2e8f0", borderRadius: "6px", overflow: "hidden" }}>
                              <div
                                style={{
                                  minHeight: "38px",
                                  padding: "6px 12px",
                                  backgroundColor: "#ffffff",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "space-between",
                                  cursor: esExpandible ? "pointer" : "default",
                                  gap: "12px",
                                  flexWrap: "nowrap",
                                }}
                                onClick={() => {
                                  if (esExpandible) {
                                    setSesionAbiertaIdx(estaAbierto ? null : sIdx);
                                  }
                                }}
                              >
                                <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0, fontSize: "13px", whiteSpace: "nowrap" }}>
                                  <span style={{ fontWeight: 500, color: "#1e293b" }}>
                                    Sesión {sesion.i_Orden || sIdx + 1}
                                  </span>
                                  {cabecera.i_CveTipoServicio === 3 || cabecera.i_CveTipoServicio === 6 ? (
                                    <span style={{ color: "#475569" }}>
                                      — {formatearFechaTexto(sesion.d_FechaHoraInicio)} – {formatearFechaTexto(sesion.d_FechaHoraFin)}
                                    </span>
                                  ) : (
                                    <>
                                      <span style={{ color: "#475569" }}>
                                        — {formatearFechaTexto(sesion.d_FechaHoraInicio)}
                                      </span>

                                      {cabecera.b_TipoDato && sesion.d_FechaHoraInicio && (
                                        <span style={{ color: "#64748b", fontFamily: "var(--font-mono)", fontSize: "12px" }}>
                                          (
                                          {new Date(sesion.d_FechaHoraInicio).toLocaleTimeString("en-US", {
                                            hour: "2-digit",
                                            minute: "2-digit",
                                          })}
                                          {sesion.d_FechaHoraFin && (
                                            <>
                                              {" a "}
                                              {new Date(sesion.d_FechaHoraFin).toLocaleTimeString("en-US", {
                                                hour: "2-digit",
                                                minute: "2-digit",
                                              })}
                                            </>
                                          )}
                                          )
                                        </span>
                                      )}
                                    </>
                                  )}
                                </div>

                                <div style={{ display: "flex", alignItems: "center", gap: "8px", flex: 1, minWidth: 0, justifyContent: "flex-end", flexWrap: "nowrap" }}>
                                  {sesion.v_NombreArea ? (
                                    <span
                                      style={{
                                        fontSize: "11px",
                                        color: "#64748b",
                                        backgroundColor: "#f1f5f9",
                                        padding: "2px 8px",
                                        borderRadius: "10px",
                                        whiteSpace: "nowrap",
                                      }}
                                      title={sesion.v_NombreArea}
                                    >
                                      {sesion.v_NombreArea}
                                    </span>
                                  ) : null}

                                  {obtenerTextoPersonalSesion(sesion) ? (
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
                                      title={obtenerTextoPersonalSesion(sesion)}
                                    >
                                      {obtenerTextoPersonalSesion(sesion)}
                                    </span>
                                  ) : null}

                                  <div style={{ display: "flex", alignItems: "center", gap: "6px", flexShrink: 0, whiteSpace: "nowrap" }}>
                                    {renderBadgeSesion(sesion)}
                                    {esExpandible && (
                                      estaAbierto ? <ChevronUp size={14} style={{ color: "#94a3b8" }} /> : <ChevronDown size={14} style={{ color: "#94a3b8" }} />
                                    )}
                                  </div>
                                </div>
                              </div>

                              {esExpandible && estaAbierto && (
                                <div style={{ padding: "12px", backgroundColor: "#f8fafc", fontSize: "12px", borderTop: "1px solid #e2e8f0", display: "flex", flexDirection: "column", gap: "6px" }}>
                                  {esReprogramada && (
                                    <div style={{ padding: "10px", backgroundColor: "#fffbeb", border: "1px solid #fde68a", borderRadius: "6px", color: "#92400e", display: "flex", flexDirection: "column", gap: "4px", fontSize: "11px" }}>
                                      <span style={{ fontWeight: 500, color: "#b45309" }}>Detalles de Reprogramación:</span>
                                      {sesion.v_Observaciones && <span>• Motivo: {sesion.v_Observaciones}</span>}
                                      {sesion.v_Contacto && <span>• Solicitado por: {sesion.v_Contacto}</span>}
                                      {sesionNueva && (
                                        <span>
                                          • Nueva Fecha: <strong>{formatearFechaTexto(sesionNueva.d_FechaHoraInicio)}</strong>
                                        </span>
                                      )}
                                    </div>
                                  )}
                                  {bCancelada && sesion.v_MotivoCancelacion && (
                                    <div style={{ padding: "10px", backgroundColor: "#fef2f2", border: "1px solid #fecaca", borderRadius: "6px", color: "#991b1b", display: "flex", flexDirection: "column", gap: "4px", fontSize: "11px" }}>
                                      <span style={{ fontWeight: 500, color: "#991b1b" }}>Detalles de Cancelación:</span>
                                      <span>• Motivo: {sesion.v_MotivoCancelacion}</span>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* BLOQUE 1.3 — Alumnos Inscritos (Sin caja contenedora exterior) */}
              {esCapacitacion && (
                <div>
                  <div style={{ marginBottom: "8px" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "8px" }}>
                      <h4 style={{ fontSize: "12px", fontWeight: 500, color: "#64748b", margin: 0 }}>
                        Alumnos inscritos
                      </h4>
                      <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium border ${getBadgeColorAlumnos()}`}>
                        {inscritos} / {sinLimite ? "∞" : cupos}
                      </span>
                    </div>
                  </div>

                  <div style={{ border: "1px solid #e2e8f0", borderRadius: "8px", overflow: "hidden" }}>
                    <div style={{ height: "40px", padding: "0 14px", backgroundColor: "#f8fafc", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <button
                        type="button"
                        style={{ background: "none", border: "none", display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", fontWeight: 500, color: "#334155", cursor: "pointer", padding: 0 }}
                        onClick={() => setAcordeonAlumnos(!acordeonAlumnos)}
                      >
                        <Users size={15} style={{ color: "#94a3b8" }} />
                        Ver lista de alumnos ({inscritos})
                      </button>

                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <button
                          type="button"
                          className="btn-icon"
                          style={{ padding: "4px", color: "#94a3b8", cursor: "pointer" }}
                          onClick={() => setAcordeonAlumnos(!acordeonAlumnos)}
                        >
                          {acordeonAlumnos ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </button>
                      </div>
                    </div>

                    {acordeonAlumnos && (
                      <div style={{ padding: "10px 12px", backgroundColor: "#ffffff", borderTop: "1px solid #e2e8f0" }}>
                        {alumnos.length === 0 ? (
                          <p style={{ fontSize: "12px", color: "#64748b", margin: 0, padding: "8px 0" }}>No hay alumnos inscritos en este servicio.</p>
                        ) : (
                          <div
                            className={`alegra-table-container ${alumnos.length >= 7 ? "custom-scrollbar" : ""}`}
                            style={{
                              borderRadius: "6px",
                              border: "1px solid #e2e8f0",
                              maxHeight: alumnos.length >= 7 ? "260px" : undefined,
                              overflowY: alumnos.length >= 7 ? "auto" : undefined,
                              scrollbarWidth: "thin",
                              scrollbarColor: "#cbd5e1 transparent",
                            }}
                          >
                            <table className="alegra-table alegra-table-compact" style={{ width: "100%", tableLayout: "fixed" }}>
                              <thead style={{ position: alumnos.length >= 7 ? "sticky" : undefined, top: 0, zIndex: 2, backgroundColor: "#f8fafc" }}>
                                <tr>
                                  <th style={{ width: "20%", padding: "6px 10px", fontSize: "12px", backgroundColor: "#f8fafc", position: alumnos.length >= 7 ? "sticky" : undefined, top: 0, boxShadow: alumnos.length >= 7 ? "0 1px 0 #e2e8f0" : undefined }}>
                                    Nómina
                                  </th>
                                  <th style={{ width: "40%", padding: "6px 10px", fontSize: "12px", backgroundColor: "#f8fafc", position: alumnos.length >= 7 ? "sticky" : undefined, top: 0, boxShadow: alumnos.length >= 7 ? "0 1px 0 #e2e8f0" : undefined }}>
                                    Nombre
                                  </th>
                                  <th style={{ width: "20%", padding: "6px 10px", fontSize: "12px", backgroundColor: "#f8fafc", position: alumnos.length >= 7 ? "sticky" : undefined, top: 0, boxShadow: alumnos.length >= 7 ? "0 1px 0 #e2e8f0" : undefined }}>
                                    CURP
                                  </th>
                                  <th style={{ width: "20%", padding: "6px 10px", fontSize: "12px", backgroundColor: "#f8fafc", position: alumnos.length >= 7 ? "sticky" : undefined, top: 0, boxShadow: alumnos.length >= 7 ? "0 1px 0 #e2e8f0" : undefined }}>
                                    Puesto
                                  </th>
                                </tr>
                              </thead>
                              <tbody>
                                {alumnos.map((alumno) => {
                                  return (
                                    <tr
                                      key={`inscrito-${alumno.i_CveAlumnoAgenda}`}
                                      className="hover:bg-slate-50/60 transition-colors"
                                      style={{ height: "30px" }}
                                    >
                                      <td
                                        style={{
                                          padding: "4px 10px",
                                          fontSize: "12px",
                                          fontWeight: 500,
                                          color: "#1e293b",
                                          whiteSpace: "nowrap",
                                          overflow: "hidden",
                                          textOverflow: "ellipsis",
                                          verticalAlign: "middle",
                                        }}
                                        title={alumno.v_Nomina || ""}
                                      >
                                        {alumno.v_Nomina || "—"}
                                      </td>
                                      <td
                                        style={{
                                          padding: "4px 10px",
                                          fontSize: "12px",
                                          whiteSpace: "nowrap",
                                          overflow: "hidden",
                                          textOverflow: "ellipsis",
                                          verticalAlign: "middle",
                                        }}
                                        title={alumno.v_Nombre || "Sin registro en el catálogo"}
                                      >
                                        {alumno.v_Nombre ? (
                                          <span style={{ fontWeight: 500, color: "#1e293b", textTransform: "uppercase" }}>
                                            {alumno.v_Nombre}
                                          </span>
                                        ) : (
                                          <span style={{ color: "#94a3b8", fontStyle: "italic", fontSize: "11px" }}>
                                            Sin registro en el catálogo
                                          </span>
                                        )}
                                      </td>
                                      <td
                                        style={{
                                          padding: "4px 10px",
                                          fontSize: "12px",
                                          fontFamily: "var(--font-mono)",
                                          whiteSpace: "nowrap",
                                          overflow: "hidden",
                                          textOverflow: "ellipsis",
                                          verticalAlign: "middle",
                                        }}
                                        title={alumno.v_CURP || ""}
                                      >
                                        {alumno.v_CURP ? (
                                          <span className="text-secondary text-xs">{alumno.v_CURP}</span>
                                        ) : (
                                          <span style={{ color: "#cbd5e1" }}>—</span>
                                        )}
                                      </td>
                                      <td
                                        style={{
                                          padding: "4px 10px",
                                          fontSize: "12px",
                                          color: "#475569",
                                          whiteSpace: "nowrap",
                                          overflow: "hidden",
                                          textOverflow: "ellipsis",
                                          verticalAlign: "middle",
                                        }}
                                        title={alumno.v_Puesto || ""}
                                      >
                                        {alumno.v_Puesto ? (
                                          alumno.v_Puesto
                                        ) : (
                                          <span style={{ color: "#cbd5e1" }}>—</span>
                                        )}
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* BLOQUE 1.6 — Entregables (Checklist simple sin caja exterior) */}
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                  <h4 style={{ fontSize: "12px", fontWeight: 500, color: "#64748b", margin: 0 }}>
                    Checklist de entregables
                  </h4>
                </div>

                {entregables.length === 0 ? (
                  <p style={{ fontSize: "12px", color: "#64748b", margin: 0 }}>No hay entregables configurados para este servicio.</p>
                ) : (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "8px" }}>
                    {entregables.map((ent) => {
                      const keyArchivo = ent.v_Key || (ent.i_CveArchivo ? String(ent.i_CveArchivo) : null);
                      const estaGuardando = entregablesGuardando.has(ent.i_CveAgendaEntregables);
                      const esPlanContingenciaPipc =
                        normalizarTexto(ent.v_Nombre).startsWith("PLAN DE CONTINGENCIA") &&
                        pipcResumen?.b_TienePlanContingencia === true;

                      return (
                        <div
                          key={`ent-${ent.i_CveAgendaEntregables}`}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            flexWrap: "wrap",
                            gap: "12px",
                            padding: "10px 12px",
                            backgroundColor: "#ffffff",
                            border: "1px solid #e2e8f0",
                            borderRadius: "6px",
                            fontSize: "13px",
                            cursor: estaGuardando ? "wait" : "pointer",
                            transition: "background-color 0.2s ease",
                            gridColumn: esPlanContingenciaPipc ? "1 / -1" : undefined,
                          }}
                          onClick={() => !estaGuardando && handleToggleEntregable(ent)}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap", flex: esPlanContingenciaPipc ? "1 1 240px" : undefined }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                              {estaGuardando ? (
                                <Loader2 size={14} className="animate-spin text-sky-600" />
                              ) : ent.b_Entregado ? (
                                <CheckCircle2 size={14} style={{ color: "#10b981", flexShrink: 0 }} />
                              ) : (
                                <Circle size={14} style={{ color: "#cbd5e1", flexShrink: 0 }} />
                              )}
                              <div style={{ display: "flex", flexDirection: "column" }}>
                                <span style={{ fontWeight: 400, color: "#1e293b" }}>{ent.v_Nombre}</span>
                                {ent.b_Entregado ? (
                                  <span style={{ fontSize: "11px", color: "#10b981", fontWeight: 500 }}>
                                    Entregado el {formatearFechaTexto(ent.f_FechaEntregable)}
                                  </span>
                                ) : (
                                  <span style={{ fontSize: "11px", color: "#dc3545", fontWeight: 500 }}>Pendiente</span>
                                )}
                              </div>
                            </div>

                            {keyArchivo && (
                              <button
                                type="button"
                                className="btn-icon"
                                style={{
                                  padding: "4px 8px",
                                  color: "#2B8FCC",
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "4px",
                                  fontSize: "12px",
                                  fontWeight: 500,
                                  background: "none",
                                  border: "none",
                                  cursor: "pointer",
                                  textDecoration: "underline",
                                }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  VerDocumento(keyArchivo);
                                }}
                                title={`Ver archivo de ${ent.v_Nombre}`}
                              >
                                <Paperclip size={14} />
                                <span>Ver archivo</span>
                              </button>
                            )}
                          </div>

                          {esPlanContingenciaPipc && pipcResumen && iCveServAgendaDet && (
                            <BloquePipcEntregable
                              servicioId={iCveServAgendaDet}
                              resumen={pipcResumen}
                              d_FechaFin={obtenerFechasExtremosSesiones(sesiones).fechaFin || pipcResumen.d_FechaFin}
                              onCerrarModal={onCerrar}
                              rutaChecklist={(id) => `/mis-servicios/pipc/${id}`}
                              sessionStorageKey="pipc_origen_mis_servicios"
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Card: Visto bueno de la autoridad (solo si b_AplicaVoBo === true) */}
              {cabecera.b_AplicaVoBo && (
                <div>
                  <h4 style={{ fontSize: "12px", fontWeight: 500, color: "#64748b", margin: "0 0 8px 0" }}>
                    Visto bueno de la autoridad
                  </h4>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "10px 12px",
                      backgroundColor: "#ffffff",
                      border: "1px solid #e2e8f0",
                      borderRadius: "6px",
                      fontSize: "13px",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      {cabecera.v_KeyVoBo ? (
                        <CheckCircle2 size={14} style={{ color: "#10b981", flexShrink: 0 }} />
                      ) : (
                        <Circle size={14} style={{ color: "#cbd5e1", flexShrink: 0 }} />
                      )}
                      <div style={{ display: "flex", flexDirection: "column" }}>
                        <span style={{ fontWeight: 400, color: "#1e293b" }}>Visto bueno de la autoridad</span>
                        {cabecera.v_KeyVoBo ? (
                          <span style={{ fontSize: "11px", color: "#10b981", fontWeight: 500 }}>
                            Entregado el {formatearFechaTexto(cabecera.d_FechaVoBo)}
                          </span>
                        ) : (
                          <span style={{ fontSize: "11px", color: "#dc3545", fontWeight: 500 }}>Pendiente</span>
                        )}
                      </div>
                    </div>

                    {cabecera.v_KeyVoBo && (
                      <button
                        type="button"
                        className="btn-icon"
                        style={{
                          padding: "4px 8px",
                          color: "#2B8FCC",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                          fontSize: "12px",
                          fontWeight: 500,
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          textDecoration: "underline",
                        }}
                        onClick={() => VerDocumento(cabecera.v_KeyVoBo!)}
                        title="Ver visto bueno de la autoridad"
                      >
                        <Paperclip size={14} />
                        <span>Ver archivo</span>
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* BLOQUE 1.7 — Resumen de Pendientes (Banner Final) */}
              {pendientesList.length > 0 ? (
                <div
                  style={{
                    padding: "12px",
                    backgroundColor: "#fffbeb",
                    border: "1px solid #fde68a",
                    color: "#92400e",
                    borderRadius: "6px",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    fontSize: "13px",
                  }}
                >
                  <AlertTriangle size={16} style={{ color: "#d97706", flexShrink: 0 }} />
                  <span>
                    <strong>Pendientes:</strong> {pendientesList.join(", ")}
                  </span>
                </div>
              ) : (
                <div
                  style={{
                    padding: "12px",
                    backgroundColor: "#ecfdf5",
                    border: "1px solid #a7f3d0",
                    color: "#065f46",
                    borderRadius: "6px",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    fontSize: "13px",
                  }}
                >
                  <CheckCircle2 size={16} style={{ color: "#10b981", flexShrink: 0 }} />
                  <span>
                    <strong>Todo completado:</strong> El servicio no tiene pendientes registrados.
                  </span>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer del Modal Sticky */}
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
          <button type="button" className="btn btn-secondary" onClick={onCerrar}>
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
