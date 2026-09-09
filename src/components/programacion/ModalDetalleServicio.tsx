"use client";

import React, { useEffect, useState } from "react";
import {
  X,
  Calendar,
  User,
  Users,
  AlertTriangle,
  CheckCircle2,
  Circle,
  Edit2,
  Check,
  FileSpreadsheet,
  Paperclip,
  ChevronDown,
  ChevronUp,
  RefreshCw,
} from "lucide-react";
import { ModalReprogramarSesion } from "./ModalReprogramarSesion";
import {
  AgendaDetalleGetDto,
  AgendaDetalleUpdateDto,
  AlumnoAgendaDto,
  EntregableDetalleDto,
  FacturaDetalleDto,
  SesionDetalleDto,
} from "@/types/servicios";
import { AgendaService } from "@/services/agenda.service";
import { AlumnosService } from "@/services/alumnos.service";
import { VerDocumento } from "@/services/archivos.service";
import { formatearFechaCorta, esFechaPasada } from "@/lib/date-utils";
import { useToast } from "@/context/ToastContext";

interface Props {
  abierto: boolean;
  iCveAgenda: number | null;
  iCveServAgendaDet: number | null;
  onCerrar: () => void;
  onGuardadoExitoso?: () => void;
  onProgramar?: (detalle: AgendaDetalleGetDto) => void;
}

const IVA = 0.16;

export const ModalDetalleServicio: React.FC<Props> = ({
  abierto,
  iCveAgenda,
  iCveServAgendaDet,
  onCerrar,
  onGuardadoExitoso,
  onProgramar,
}) => {
  const { toast, confirmModal } = useToast();
  const [detalle, setDetalle] = useState<AgendaDetalleGetDto | null>(null);
  const [cargando, setCargando] = useState<boolean>(false);
  const [guardando, setGuardando] = useState<boolean>(false);

  // Reprogramar sesión modal state
  const [modalReprogramarAbierto, setModalReprogramarAbierto] = useState<boolean>(false);
  const [sesionAReprogramarId, setSesionAReprogramarId] = useState<number | null>(null);

  // Estados locales editables
  const [cotizacionGI, setCotizacionGI] = useState<string>("");
  const [ordenCompra, setOrdenCompra] = useState<string>("");
  const [editandoCotizacion, setEditandoCotizacion] = useState<boolean>(false);
  const [editandoOC, setEditandoOC] = useState<boolean>(false);

  const [facturas, setFacturas] = useState<FacturaDetalleDto[]>([]);
  const [entregables, setEntregables] = useState<EntregableDetalleDto[]>([]);
  const [alumnos, setAlumnos] = useState<AlumnoAgendaDto[]>([]);

  // Acordeones
  const [acordeonSesiones, setAcordeonSesiones] = useState<boolean>(true);
  const [acordeonAlumnos, setAcordeonAlumnos] = useState<boolean>(true);
  const [sesionAbiertaIdx, setSesionAbiertaIdx] = useState<number | null>(0);

  const cargarDetalle = async () => {
    if (!iCveAgenda || !iCveServAgendaDet) return;
    setCargando(true);
    const data = await AgendaService.getAgendaDetalle(iCveAgenda, iCveServAgendaDet);
    setDetalle(data);

    if (data) {
      setCotizacionGI(data.v_NoCotizacionGI || (data as any).v_noCotizacionGI || "");
      setOrdenCompra(data.v_NoOrdenCompraCliente || (data as any).v_noOrdenCompraCliente || "");
      const fArr = data.Facturas || (data as any).facturas || [];
      const eArr = data.Entregables || (data as any).entregables || [];
      const aArr = data.Alumnos || (data as any).alumnos || [];
      setFacturas(Array.isArray(fArr) ? [...fArr] : []);
      setEntregables(Array.isArray(eArr) ? [...eArr] : []);
      setAlumnos(Array.isArray(aArr) ? [...aArr] : []);
    }
    setCargando(false);
  };

  useEffect(() => {
    if (abierto && iCveAgenda && iCveServAgendaDet) {
      cargarDetalle();
      setEditandoCotizacion(false);
      setEditandoOC(false);
    } else {
      setDetalle(null);
    }
  }, [abierto, iCveAgenda, iCveServAgendaDet]);

  if (!abierto) return null;

  // Lógica de Cupos y Alumnos
  const esCapacitacion = detalle?.v_TipoServicio
    ? detalle.v_TipoServicio.toUpperCase().includes("CAPACITACI")
    : false;

  const cupos = detalle?.i_NumAlumnos ?? 0;
  const inscritos = alumnos.length;
  const sinLimite = cupos === 0;

  const getBadgeColorAlumnos = () => {
    if (!sinLimite && inscritos >= cupos) return "bg-rose-50 text-rose-700 border-rose-200";
    if (inscritos === 0) return "bg-slate-100 text-slate-600 border-slate-200";
    return "bg-emerald-50 text-emerald-700 border-emerald-200";
  };

  const handleEliminarAlumno = async (idAlumnoAgenda: number) => {
    confirmModal({
      title: "Eliminar alumno",
      message: "¿Deseas eliminar este alumno de la nómina?",
      confirmText: "Eliminar",
      cancelText: "Cancelar",
      onConfirm: async () => {
        const ok = await AgendaService.deleteAlumno(idAlumnoAgenda);
        if (ok) {
          toast.success("Alumno eliminado de la nómina exitosamente");
          setAlumnos((prev) => prev.filter((a) => a.i_CveAlumnoAgenda !== idAlumnoAgenda));
        } else {
          toast.error("No se pudo eliminar el alumno.");
        }
      },
    });
  };

  const handleDescargarNomina = async () => {
    if (!detalle) return;
    const ok = await AlumnosService.descargarNomina(detalle.i_CveServAgendaDet);
    if (!ok) {
      toast.error("Ocurrió un problema al generar o descargar el archivo de nómina.");
    }
  };

  // Toggle entregable en memoria
  const handleToggleEntregable = (index: number) => {
    setEntregables((prev) => {
      const copy = [...prev];
      const actual = copy[index];
      const nuevoEstado = !actual.b_Entregado;
      copy[index] = {
        ...actual,
        b_Entregado: nuevoEstado,
        f_FechaEntregable: nuevoEstado ? new Date().toISOString() : null,
      };
      return copy;
    });
  };

  // Resumen de Pendientes client-side
  const calcularPendientes = (): string[] => {
    if (!detalle) return [];
    const p: string[] = [];
    if (detalle.b_SinProgramar) p.push("Programación");
    if (!cotizacionGI.trim()) p.push("No. cotización GI");
    if (!ordenCompra.trim()) p.push("No. OC cliente");
    if (entregables.some((e) => !e.b_Entregado)) p.push("Entregables");
    if (facturas.length === 0) p.push("Factura");
    return p;
  };

  const pendientesList = calcularPendientes();

  // Guardar cambios
  const handleGuardar = async () => {
    if (!detalle) return;
    setGuardando(true);

    const payload: AgendaDetalleUpdateDto = {
      i_CveServAgendaDet: detalle.i_CveServAgendaDet,
      v_NoCotizacionGI: cotizacionGI.trim() || null,
      v_NoOrdenCompraCliente: ordenCompra.trim() || null,
      Facturas: facturas.map((f) => ({
        i_CveFacturas: f.i_CveFacturas,
        v_NoFactura: f.v_NoFactura,
        b_Timbrada: f.b_Timbrada,
        v_EstadoCobro: f.v_EstadoCobro,
        d_FechaHora: f.d_FechaHora,
      })),
      Entregables: entregables.map((e) => ({
        i_CveAgendaEntregables: e.i_CveAgendaEntregables,
        b_Entregado: e.b_Entregado,
        f_FechaEntregable: e.f_FechaEntregable,
      })),
    };

    const exito = await AgendaService.updateAgendaDetalle(payload);
    setGuardando(false);

    if (exito) {
      toast.success("Detalle del servicio guardado exitosamente");
      onGuardadoExitoso?.();
      onCerrar();
    } else {
      toast.error("Ocurrió un error al guardar los cambios del detalle.");
    }
  };

  // Badges de Estado
  const renderBadgeSesion = (sesion: SesionDetalleDto) => {
    const iCveReprograma =
      sesion.i_CveReprograma ??
      (sesion as any).i_cveReprograma ??
      (sesion as any).iCveReprograma;

    const esCompletada = Boolean(
      sesion.Completada ||
      (sesion as any).completada ||
      (sesion as any).b_Completada ||
      (sesion as any).b_Completado ||
      (sesion as any).bCompletada ||
      (sesion as any).i_CveEstatus === 3
    );

    // 1. Si i_CveReprograma tiene valor -> Reprogramada (Amarillo)
    if (iCveReprograma != null && iCveReprograma > 0) {
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

    // 2. Si no, y Completada es true -> Completada (Verde)
    if (esCompletada) {
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

    // 3. Si no cumple las anteriores -> Programado (Azul pill)
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

  const renderBadgeCobroFactura = (f: FacturaDetalleDto) => {
    if (f.b_Cancelada) {
      return (
        <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-rose-50 text-rose-800 border border-rose-200">
          Cancelada
        </span>
      );
    }
    if (f.v_EstadoCobro === "Cobrada") {
      return (
        <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-800 border border-emerald-200">
          Cobrada
        </span>
      );
    }
    if (f.v_EstadoCobro === "Abonada") {
      return (
        <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-amber-50 text-amber-800 border border-amber-200">
          Abonada — falta ${f.d_SaldoPendiente?.toLocaleString("es-MX", { minimumFractionDigits: 2 }) ?? "0.00"}
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-rose-50 text-rose-800 border border-rose-200">
        {f.d_Monto != null
          ? `Pendiente — $${f.d_Monto.toLocaleString("es-MX", { minimumFractionDigits: 2 })}`
          : "Pendiente"}
      </span>
    );
  };

  // Obtener arreglo seguro de sesiones
  const listaSesiones: SesionDetalleDto[] = detalle
    ? detalle.Sesiones || (detalle as any).sesiones || (detalle as any).Detalles || (detalle as any).detalles || []
    : [];

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
        {/* Header del Modal (15px / 500) */}
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
          {cargando || !detalle ? (
            <div style={{ padding: "48px 0", textAlign: "center", color: "#64748b" }}>
              <div className="spinner-border text-primary mb-3" style={{ width: "24px", height: "24px" }}></div>
              <p style={{ fontSize: "12px", margin: 0 }}>Cargando detalle del servicio...</p>
            </div>
          ) : (
            <>
              {/* BLOQUE 1.1 — Info General (Sin caja contenedora exterior, Grid 2-4 columnas) */}
              <div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "16px" }}>
                  <div>
                    <span style={{ fontSize: "11px", fontWeight: 400, color: "#64748b", display: "block", marginBottom: "2px" }}>servicio</span>
                    <p style={{ fontSize: "13px", fontWeight: 400, color: "#0f172a", margin: 0, lineHeight: 1.3 }}>{detalle.v_Servicio || "—"}</p>
                    <p style={{ fontSize: "12px", fontWeight: 400, color: "#64748b", margin: "2px 0 0 0" }}>
                      {detalle.i_Cantidad ?? 0} {detalle.v_Unidad || ""}
                    </p>
                  </div>

                  <div>
                    <span style={{ fontSize: "11px", fontWeight: 400, color: "#64748b", display: "block", marginBottom: "2px" }}>tipo</span>
                    <p style={{ fontSize: "13px", fontWeight: 400, color: "#0f172a", margin: 0, lineHeight: 1.3 }}>{detalle.v_TipoServicio || "—"}</p>
                  </div>

                  <div>
                    <span style={{ fontSize: "11px", fontWeight: 400, color: "#64748b", display: "block", marginBottom: "2px" }}>empresa</span>
                    <p style={{ fontSize: "13px", fontWeight: 400, color: "#0f172a", margin: 0, textTransform: "uppercase", lineHeight: 1.3 }}>{detalle.v_Empresa || "—"}</p>
                  </div>

                  <div>
                    <span style={{ fontSize: "11px", fontWeight: 400, color: "#64748b", display: "block", marginBottom: "2px" }}>planta</span>
                    <p style={{ fontSize: "13px", fontWeight: 400, color: "#0f172a", margin: 0, lineHeight: 1.3 }}>{detalle.v_Planta || "—"}</p>
                  </div>
                </div>

                {detalle.b_SinProgramar && (
                  <div
                    style={{
                      marginTop: "14px",
                      padding: "12px 14px",
                      backgroundColor: "#fffbeb",
                      border: "1px solid #fde68a",
                      borderRadius: "8px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "12px",
                      fontSize: "12px",
                      color: "#92400e",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <AlertTriangle size={16} style={{ color: "#d97706", flexShrink: 0 }} />
                      <span>
                        Este servicio está <strong>pendiente de programar</strong> — falta definir fecha, hora e instructor.
                      </span>
                    </div>
                    {onProgramar && (
                      <button
                        type="button"
                        className="btn btn-primary"
                        style={{ height: "30px", padding: "0 12px", fontSize: "12px", backgroundColor: "#2B8FCC", flexShrink: 0 }}
                        onClick={() => onProgramar(detalle)}
                      >
                        Programar
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* BLOQUE 1.2 — Sesiones (Sin caja contenedora exterior) */}
              <div>
                <h4 style={{ fontSize: "12px", fontWeight: 500, color: "#64748b", margin: "0 0 8px 0" }}>
                  Sesiones de la agenda ({listaSesiones.length})
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
                      {listaSesiones.length === 0 ? (
                        <p style={{ fontSize: "12px", color: "#64748b", margin: 0 }}>No hay sesiones registradas.</p>
                      ) : (
                        listaSesiones.map((sesion, sIdx) => {
                          const iCveReprograma =
                            sesion.i_CveReprograma ??
                            (sesion as any).i_cveReprograma ??
                            (sesion as any).iCveReprograma;
                          const esReprogramada = iCveReprograma != null && Number(iCveReprograma) > 0;

                          const estaAbierto = sesionAbiertaIdx === sIdx;
                          const sesionNueva = esReprogramada
                            ? listaSesiones.find((s) => s.i_CveAgendaDetalle === iCveReprograma)
                            : null;

                          const personas = [sesion.v_Titular, sesion.v_Apoyo]
                            .filter((p) => Boolean(p && typeof p === "string" && p.trim()))
                            .join(", ");

                          return (
                            <div key={sesion.i_CveAgendaDetalle || sIdx} style={{ border: "1px solid #e2e8f0", borderRadius: "6px", overflow: "hidden" }}>
                              <div
                                style={{
                                  minHeight: "38px",
                                  padding: "6px 12px",
                                  backgroundColor: "#ffffff",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "space-between",
                                  cursor: esReprogramada ? "pointer" : "default",
                                  gap: "12px",
                                }}
                                onClick={() => {
                                  if (esReprogramada) {
                                    setSesionAbiertaIdx(estaAbierto ? null : sIdx);
                                  }
                                }}
                              >
                                <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", fontSize: "13px" }}>
                                  <span style={{ fontWeight: 500, color: "#1e293b" }}>
                                    Sesión {sesion.i_Orden || sIdx + 1}
                                  </span>
                                  <span style={{ color: "#475569" }}>
                                    — {formatearFechaCorta(sesion.d_FechaHoraInicio)}
                                  </span>

                                  {detalle.b_TipoDato && (
                                    <span style={{ color: "#64748b", fontFamily: "var(--font-mono)", fontSize: "12px" }}>
                                      (
                                      {new Date(sesion.d_FechaHoraInicio).toLocaleTimeString("en-US", {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      })}{" "}
                                      a{" "}
                                      {new Date(sesion.d_FechaHoraFin).toLocaleTimeString("en-US", {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      })}
                                      )
                                    </span>
                                  )}
                                </div>

                                <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                                  {personas && (
                                    <span style={{ fontSize: "12px", color: "#475569", fontWeight: 400 }}>
                                      {personas}
                                    </span>
                                  )}
                                  {renderBadgeSesion(sesion)}
                                  {!esReprogramada && (() => {
                                    const fechaSesionIso = sesion.d_FechaHoraInicio || (sesion as any).d_FechaInicio || (sesion as any).f_FechaHoraInicio;
                                    const esPasada = esFechaPasada(fechaSesionIso);
                                    return (
                                      <button
                                        type="button"
                                        className="btn btn-sm"
                                        disabled={esPasada}
                                        title={esPasada ? "No se puede reprogramar una sesión de una fecha pasada" : "Reprogramar esta sesión"}
                                        onClick={(e) => {
                                          if (esPasada) return;
                                          e.stopPropagation();
                                          setSesionAReprogramarId(sesion.i_CveAgendaDetalle);
                                          setModalReprogramarAbierto(true);
                                        }}
                                        style={{
                                          height: "26px",
                                          fontSize: "11px",
                                          padding: "0 8px",
                                          display: "inline-flex",
                                          alignItems: "center",
                                          gap: "4px",
                                          borderRadius: "4px",
                                          border: esPasada ? "1px solid #cbd5e1" : "1px solid #d97706",
                                          color: esPasada ? "#94a3b8" : "#d97706",
                                          backgroundColor: esPasada ? "#f1f5f9" : "#fffbeb",
                                          fontWeight: 600,
                                          cursor: esPasada ? "not-allowed" : "pointer",
                                          opacity: esPasada ? 0.65 : 1,
                                        }}
                                      >
                                        <RefreshCw size={12} />
                                        <span>Reprogramar</span>
                                      </button>
                                    );
                                  })()}
                                  {esReprogramada && (
                                    estaAbierto ? <ChevronUp size={14} style={{ color: "#94a3b8" }} /> : <ChevronDown size={14} style={{ color: "#94a3b8" }} />
                                  )}
                                </div>
                              </div>

                              {esReprogramada && estaAbierto && (
                                <div style={{ padding: "12px", backgroundColor: "#f8fafc", fontSize: "12px", borderTop: "1px solid #e2e8f0", display: "flex", flexDirection: "column", gap: "6px" }}>
                                  <div style={{ padding: "10px", backgroundColor: "#fffbeb", border: "1px solid #fde68a", borderRadius: "6px", color: "#92400e", display: "flex", flexDirection: "column", gap: "4px", fontSize: "11px" }}>
                                    <span style={{ fontWeight: 500, color: "#b45309" }}>Detalles de Reprogramación:</span>
                                    {sesion.v_Observaciones && <span>• Motivo: {sesion.v_Observaciones}</span>}
                                    {sesion.v_Contacto && <span>• Solicitado por: {sesion.v_Contacto}</span>}
                                    {sesionNueva && (
                                      <span>
                                        • Nueva Fecha: <strong>{formatearFechaCorta(sesionNueva.d_FechaHoraInicio)}</strong>
                                      </span>
                                    )}
                                  </div>
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
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
                    <h4 style={{ fontSize: "12px", fontWeight: 500, color: "#64748b", margin: 0 }}>
                      Alumnos inscritos
                    </h4>
                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium border ${getBadgeColorAlumnos()}`}>
                      {inscritos} / {sinLimite ? "∞" : cupos}
                    </span>
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
                          style={{ padding: "4px", color: "#64748b", cursor: "pointer" }}
                          onClick={handleDescargarNomina}
                          disabled={inscritos === 0}
                          title="Descargar Nómina en Excel"
                        >
                          <FileSpreadsheet size={16} />
                        </button>

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
                      <div style={{ padding: "12px", backgroundColor: "#ffffff", borderTop: "1px solid #e2e8f0" }}>
                        {alumnos.length === 0 ? (
                          <p style={{ fontSize: "12px", color: "#64748b", margin: 0 }}>No hay alumnos inscritos en este servicio.</p>
                        ) : (
                          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                            {alumnos.map((alumno) => (
                              <div
                                key={alumno.i_CveAlumnoAgenda}
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "6px",
                                  padding: "4px 10px",
                                  backgroundColor: "#f1f5f9",
                                  border: "1px solid #e2e8f0",
                                  borderRadius: "16px",
                                  fontSize: "12px",
                                  color: "#1e293b",
                                }}
                                title={`Inscrito el: ${alumno.f_FechaInscripcion ? formatearFechaCorta(alumno.f_FechaInscripcion) : "—"}`}
                              >
                                <User size={12} style={{ color: "#94a3b8" }} />
                                <span>{alumno.v_Nomina || "Sin nómina"}</span>
                                <button
                                  type="button"
                                  style={{ background: "none", border: "none", color: "#94a3b8", fontWeight: "bold", cursor: "pointer", padding: "0 2px", fontSize: "14px" }}
                                  onClick={() => handleEliminarAlumno(alumno.i_CveAlumnoAgenda)}
                                  title="Eliminar alumno"
                                >
                                  ×
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* BLOQUE 1.4 — Montos (Con Card/Contenedor diferenciado surface-2) */}
              <div style={{ backgroundColor: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "16px" }}>
                <h4 style={{ fontSize: "12px", fontWeight: 500, color: "#64748b", margin: "0 0 12px 0" }}>
                  Información de montos
                </h4>

                {detalle.v_TipoVenta === "proyecto" ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "16px" }}>
                      <div>
                        <span style={{ fontSize: "11px", fontWeight: 400, color: "#64748b", display: "block", marginBottom: "2px" }}>cantidad / unidad</span>
                        <p style={{ fontSize: "13px", fontWeight: 400, color: "#1e293b", margin: 0 }}>
                          {detalle.i_Cantidad} {detalle.v_Unidad}
                        </p>
                      </div>
                      <div>
                        <span style={{ fontSize: "11px", fontWeight: 400, color: "#64748b", display: "block", marginBottom: "2px" }}>monto global s/IVA</span>
                        <p style={{ fontSize: "13px", fontFamily: "var(--font-mono)", fontWeight: 400, color: "#1e293b", margin: 0 }}>
                          ${(detalle.d_MontoProyecto ?? 0).toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                      <div>
                        <span style={{ fontSize: "11px", fontWeight: 400, color: "#64748b", display: "block", marginBottom: "2px" }}>monto global c/IVA</span>
                        <p style={{ fontSize: "14px", fontFamily: "var(--font-mono)", fontWeight: 500, color: "#2B8FCC", margin: 0 }}>
                          ${((detalle.d_MontoProyecto ?? 0) * (1 + IVA)).toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                    </div>
                    <p style={{ fontSize: "11px", color: "#64748b", fontStyle: "italic", margin: "4px 0 0 0" }}>
                      Nota: Este servicio forma parte de un proyecto con monto global — el monto se factura por grupo, no de forma individual.
                    </p>
                  </div>
                ) : (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "16px" }}>
                    <div>
                      <span style={{ fontSize: "11px", fontWeight: 400, color: "#64748b", display: "block", marginBottom: "2px" }}>cantidad / unidad</span>
                      <p style={{ fontSize: "13px", fontWeight: 400, color: "#1e293b", margin: 0 }}>
                        {detalle.i_Cantidad} {detalle.v_Unidad}
                      </p>
                    </div>
                    <div>
                      <span style={{ fontSize: "11px", fontWeight: 400, color: "#64748b", display: "block", marginBottom: "2px" }}>precio unitario s/IVA</span>
                      <p style={{ fontSize: "13px", fontFamily: "var(--font-mono)", fontWeight: 400, color: "#1e293b", margin: 0 }}>
                        ${(detalle.d_PrecioUnitario ?? 0).toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                    <div>
                      <span style={{ fontSize: "11px", fontWeight: 400, color: "#64748b", display: "block", marginBottom: "2px" }}>precio total s/IVA</span>
                      <p style={{ fontSize: "13px", fontFamily: "var(--font-mono)", fontWeight: 400, color: "#1e293b", margin: 0 }}>
                        ${((detalle.d_PrecioUnitario ?? 0) * detalle.i_Cantidad).toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                    <div>
                      <span style={{ fontSize: "11px", fontWeight: 400, color: "#64748b", display: "block", marginBottom: "2px" }}>precio final c/IVA</span>
                      <p style={{ fontSize: "14px", fontFamily: "var(--font-mono)", fontWeight: 500, color: "#2B8FCC", margin: 0 }}>
                        ${((detalle.d_PrecioUnitario ?? 0) * detalle.i_Cantidad * (1 + IVA)).toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* BLOQUE 1.5 — Datos de Venta (Con Card/Contenedor diferenciado) */}
              <div style={{ border: "1px solid #e2e8f0", borderRadius: "10px", padding: "16px", display: "flex", flexDirection: "column", gap: "16px" }}>
                <h4 style={{ fontSize: "12px", fontWeight: 500, color: "#64748b", margin: 0 }}>
                  Datos de venta y cotización
                </h4>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}>
                  {/* Cotización GI Inline */}
                  <div style={{ padding: "12px", backgroundColor: "#f8fafc", borderRadius: "6px", border: "1px solid #e2e8f0", display: "flex", flexDirection: "column", gap: "4px" }}>
                    <span style={{ fontSize: "11px", fontWeight: 400, color: "#64748b" }}>cotización GI</span>
                    {editandoCotizacion ? (
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "2px" }}>
                        <input
                          type="text"
                          className="form-control"
                          style={{ fontSize: "12px", padding: "4px 8px", height: "28px" }}
                          value={cotizacionGI}
                          onChange={(e) => setCotizacionGI(e.target.value)}
                          placeholder="No. Cotización GI"
                        />
                        <button
                          type="button"
                          className="btn-icon"
                          style={{ color: "#10b981", padding: "4px" }}
                          onClick={() => setEditandoCotizacion(false)}
                          title="Confirmar edición"
                        >
                          <Check size={16} />
                        </button>
                      </div>
                    ) : (
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "2px" }}>
                        {cotizacionGI.trim() ? (
                          <span style={{ fontSize: "13px", fontFamily: "var(--font-mono)", fontWeight: 400, color: "#1e293b" }}>{cotizacionGI}</span>
                        ) : (
                          <span style={{ fontSize: "12px", color: "#dc3545", fontWeight: 500 }}>Pendiente</span>
                        )}
                        <button
                          type="button"
                          className="btn-icon"
                          style={{ color: "#94a3b8", padding: "2px", cursor: "pointer" }}
                          onClick={() => setEditandoCotizacion(true)}
                          title="Editar Cotización GI"
                        >
                          <Edit2 size={12} />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* OC Cliente Inline */}
                  <div style={{ padding: "12px", backgroundColor: "#f8fafc", borderRadius: "6px", border: "1px solid #e2e8f0", display: "flex", flexDirection: "column", gap: "4px" }}>
                    <span style={{ fontSize: "11px", fontWeight: 400, color: "#64748b" }}>OC cliente</span>
                    {editandoOC ? (
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "2px" }}>
                        <input
                          type="text"
                          className="form-control"
                          style={{ fontSize: "12px", padding: "4px 8px", height: "28px" }}
                          value={ordenCompra}
                          onChange={(e) => setOrdenCompra(e.target.value)}
                          placeholder="No. Orden de Compra"
                        />
                        <button
                          type="button"
                          className="btn-icon"
                          style={{ color: "#10b981", padding: "4px" }}
                          onClick={() => setEditandoOC(false)}
                          title="Confirmar edición"
                        >
                          <Check size={16} />
                        </button>
                      </div>
                    ) : (
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "2px" }}>
                        {ordenCompra.trim() ? (
                          <span style={{ fontSize: "13px", fontFamily: "var(--font-mono)", fontWeight: 400, color: "#1e293b" }}>{ordenCompra}</span>
                        ) : (
                          <span style={{ fontSize: "12px", color: "#dc3545", fontWeight: 500 }}>Pendiente</span>
                        )}
                        <button
                          type="button"
                          className="btn-icon"
                          style={{ color: "#94a3b8", padding: "2px", cursor: "pointer" }}
                          onClick={() => setEditandoOC(true)}
                          title="Editar OC Cliente"
                        >
                          <Edit2 size={12} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Tabla de Facturas Reales */}
                <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "4px" }}>
                  <span style={{ fontSize: "11px", fontWeight: 400, color: "#64748b" }}>facturas asociadas</span>
                  {facturas.length === 0 ? (
                    <div style={{ padding: "12px", backgroundColor: "#fffbeb", border: "1px solid #fde68a", borderRadius: "6px", fontSize: "12px", color: "#92400e" }}>
                      Este servicio no tiene facturas asociadas.
                    </div>
                  ) : (
                    <div style={{ overflowX: "auto", border: "1px solid #e2e8f0", borderRadius: "6px" }}>
                      <table style={{ width: "100%", fontSize: "12px", borderCollapse: "collapse", textAlign: "left" }}>
                        <thead>
                          <tr style={{ backgroundColor: "#f8fafc", borderBottom: "1px solid #e2e8f0", color: "#64748b" }}>
                            <th style={{ padding: "8px 12px", fontWeight: 400 }}>No. Factura</th>
                            <th style={{ padding: "8px 12px", fontWeight: 400 }}>Fecha</th>
                            <th style={{ padding: "8px 12px", fontWeight: 400 }}>Monto</th>
                            <th style={{ padding: "8px 12px", fontWeight: 400 }}>Timbrado</th>
                            <th style={{ padding: "8px 12px", fontWeight: 400 }}>Estado Cobro</th>
                          </tr>
                        </thead>
                        <tbody style={{ fontFamily: "var(--font-mono)" }}>
                          {facturas.map((f, idx) => (
                            <tr key={f.i_CveFacturas || idx} style={{ borderBottom: "1px solid #f1f5f9" }}>
                              <td style={{ padding: "8px 12px", fontWeight: 400 }}>{f.v_NoFactura || "Sin número"}</td>
                              <td style={{ padding: "8px 12px", fontWeight: 400 }}>
                                {f.d_FechaHora ? (
                                  formatearFechaCorta(f.d_FechaHora)
                                ) : (
                                  <span style={{ color: "#dc3545", fontWeight: 500 }}>Pendiente</span>
                                )}
                              </td>
                              <td style={{ padding: "8px 12px" }}>
                                ${f.d_Monto?.toLocaleString("es-MX", { minimumFractionDigits: 2 }) ?? "0.00"}
                              </td>
                              <td style={{ padding: "8px 12px" }}>
                                {f.b_Timbrada ? (
                                  <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-[#cfe2ff] text-[#084298]">
                                    Timbrada
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-[#f8f9fa] text-[#6c757d]">
                                    No timbrada
                                  </span>
                                )}
                              </td>
                              <td style={{ padding: "8px 12px" }}>{renderBadgeCobroFactura(f)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>

              {/* BLOQUE 1.6 — Entregables (Checklist simple sin caja exterior) */}
              <div>
                <h4 style={{ fontSize: "12px", fontWeight: 500, color: "#64748b", margin: "0 0 8px 0" }}>
                  Checklist de entregables
                </h4>

                {entregables.length === 0 ? (
                  <p style={{ fontSize: "12px", color: "#64748b", margin: 0 }}>No hay entregables configurados para este servicio.</p>
                ) : (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "8px" }}>
                    {entregables.map((ent, idx) => {
                      const keyArchivo = ent.v_Key || (ent.i_CveArchivo ? String(ent.i_CveArchivo) : null);
                      return (
                        <div
                          key={ent.i_CveAgendaEntregables || idx}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            padding: "10px 12px",
                            backgroundColor: "#ffffff",
                            border: "1px solid #e2e8f0",
                            borderRadius: "6px",
                            fontSize: "13px",
                            cursor: "pointer",
                            transition: "background-color 0.2s ease",
                          }}
                          onClick={() => handleToggleEntregable(idx)}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            {ent.b_Entregado ? (
                              <CheckCircle2 size={14} style={{ color: "#10b981", flexShrink: 0 }} />
                            ) : (
                              <Circle size={14} style={{ color: "#cbd5e1", flexShrink: 0 }} />
                            )}
                            <div style={{ display: "flex", flexDirection: "column" }}>
                              <span style={{ fontWeight: 400, color: "#1e293b" }}>{ent.v_Nombre}</span>
                              {ent.b_Entregado ? (
                                <span style={{ fontSize: "11px", color: "#64748b" }}>
                                  Entregado: {ent.f_FechaEntregable ? formatearFechaCorta(ent.f_FechaEntregable) : "Fecha no especificada"}
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
                              style={{ padding: "4px", color: "#94a3b8" }}
                              onClick={(e) => {
                                e.stopPropagation();
                                VerDocumento(keyArchivo);
                              }}
                              title={`Ver archivo de ${ent.v_Nombre}`}
                            >
                              <Paperclip size={14} />
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

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

        {/* Footer del Modal Sticky (#2B8FCC para Guardar, nunca verde) */}
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
          <button type="button" className="btn btn-secondary" onClick={onCerrar} disabled={guardando}>
            Cerrar
          </button>
          <button
            type="button"
            className="btn btn-primary"
            style={{ backgroundColor: "#2B8FCC" }}
            onClick={handleGuardar}
            disabled={guardando || !detalle}
          >
            {guardando ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </div>
      {/* Modal Reprogramar Sesión */}
      <ModalReprogramarSesion
        abierto={modalReprogramarAbierto}
        onCerrar={() => {
          setModalReprogramarAbierto(false);
          setSesionAReprogramarId(null);
        }}
        iCveAgenda={iCveAgenda}
        iCveServAgendaDet={iCveServAgendaDet}
        iCveAgendaDetalle={sesionAReprogramarId}
        onReprogramacionExitosa={() => {
          cargarDetalle();
          if (onGuardadoExitoso) onGuardadoExitoso();
        }}
      />
    </div>
  );
};
