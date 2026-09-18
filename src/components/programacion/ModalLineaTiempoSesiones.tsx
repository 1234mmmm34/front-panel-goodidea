"use client";

import React, { useEffect, useState } from "react";
import {
  X,
  User,
  MapPin,
  AlertCircle,
  History,
  Clock,
  Check,
  RefreshCw,
  Ban,
  Sparkles,
} from "lucide-react";
import { AgendaDetalleGetDto, SesionDetalleDto } from "@/types/servicios";
import { AgendaService } from "@/services/agenda.service";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface Props {
  abierto: boolean;
  iCveAgenda: number | null;
  iCveServAgendaDet: number | null;
  iCveAgendaDetalleResaltar?: number | null;
  onCerrar: () => void;
}

interface GrupoSesiones {
  i_Orden: number;
  nodos: SesionDetalleDto[];
}

function formatearFechaHoraNodo(inicioIso: string | null, finIso: string | null): string {
  if (!inicioIso) return "—";
  try {
    const dIni = new Date(inicioIso);
    if (isNaN(dIni.getTime())) return inicioIso;

    const fechaStr = format(dIni, "dd 'de' MMM, yyyy", { locale: es });
    const hhIni = String(dIni.getHours()).padStart(2, "0");
    const mmIni = String(dIni.getMinutes()).padStart(2, "0");

    let horaStr = `${hhIni}:${mmIni}`;
    if (finIso) {
      const dFin = new Date(finIso);
      if (!isNaN(dFin.getTime())) {
        const hhFin = String(dFin.getHours()).padStart(2, "0");
        const mmFin = String(dFin.getMinutes()).padStart(2, "0");
        horaStr += ` - ${hhFin}:${mmFin}`;
      }
    }
    return `${fechaStr}, ${horaStr}`;
  } catch {
    return inicioIso;
  }
}

function agruparSesiones(sesiones: SesionDetalleDto[]): GrupoSesiones[] {
  const map = new Map<number, SesionDetalleDto[]>();

  sesiones.forEach((s) => {
    const orden = s.i_Orden || 1;
    if (!map.has(orden)) {
      map.set(orden, []);
    }
    map.get(orden)!.push(s);
  });

  return Array.from(map.entries())
    .map(([i_Orden, list]) => {
      // Ordenar por i_CveAgendaDetalle ascendente (orden de creación)
      const nodosOrdenados = [...list].sort(
        (a, b) => (a.i_CveAgendaDetalle || 0) - (b.i_CveAgendaDetalle || 0)
      );
      return { i_Orden, nodos: nodosOrdenados };
    })
    .sort((a, b) => a.i_Orden - b.i_Orden);
}

function obtenerEstatusNodo(sesion: SesionDetalleDto) {
  const bCancelada = Boolean(
    sesion.b_Cancelada ||
    (sesion as any).b_cancelada ||
    (sesion as any).bCancelada
  );

  if (bCancelada) {
    return {
      label: "Cancelada",
      tipo: "cancelada" as const,
      color: "#ef4444",
      circleBg: "#ef4444",
      circleBorder: "#ef4444",
      circleIcon: Ban,
      isSolid: true,
      badgeStyle: { backgroundColor: "#fef2f2", color: "#991b1b", border: "1px solid #fecaca" },
      lineColor: "#fca5a5",
    };
  }

  const iCveReprograma =
    sesion.i_CveReprograma ??
    (sesion as any).i_cveReprograma ??
    (sesion as any).iCveReprograma;

  if (iCveReprograma != null && Number(iCveReprograma) > 0) {
    return {
      label: "Reprogramada",
      tipo: "reprogramada" as const,
      color: "#94a3b8",
      circleBg: "#ffffff",
      circleBorder: "#d1d5db",
      circleIcon: Clock,
      isSolid: false,
      badgeStyle: { backgroundColor: "#f8fafc", color: "#64748b", border: "1px solid #e2e8f0" },
      lineColor: "#e5e7eb",
    };
  }

  // Vigente (actual)
  const completada = Boolean(
    sesion.Completada ||
    (sesion as any).completada ||
    (sesion as any).b_Completada ||
    (sesion as any).i_CveEstatus === 3
  );

  const enCurso = (sesion as any).i_CveEstatus === 2;

  if (completada) {
    return {
      label: "Terminado",
      tipo: "vigente" as const,
      color: "#10b981",
      circleBg: "#10b981",
      circleBorder: "#10b981",
      circleIcon: Check,
      isSolid: true,
      badgeStyle: { backgroundColor: "#ecfdf5", color: "#065f46", border: "1px solid #a7f3d0" },
      lineColor: "#10b981",
    };
  }

  if (enCurso) {
    return {
      label: "En curso",
      tipo: "vigente" as const,
      color: "#6366f1",
      circleBg: "#ffffff",
      circleBorder: "#6366f1",
      circleIcon: Clock,
      isSolid: false,
      badgeStyle: { backgroundColor: "#eef2ff", color: "#3730a3", border: "1px solid #c7d2fe" },
      lineColor: "#6366f1",
    };
  }

  // Default: Programado
  return {
    label: "Programado",
    tipo: "vigente" as const,
    color: "#4f46e5",
    circleBg: "#4f46e5",
    circleBorder: "#4f46e5",
    circleIcon: Check,
    isSolid: true,
    badgeStyle: { backgroundColor: "#eef2ff", color: "#3730a3", border: "1px solid #c7d2fe" },
    lineColor: "#4f46e5",
  };
}

export const ModalLineaTiempoSesiones: React.FC<Props> = ({
  abierto,
  iCveAgenda,
  iCveServAgendaDet,
  iCveAgendaDetalleResaltar,
  onCerrar,
}) => {
  const [detalle, setDetalle] = useState<AgendaDetalleGetDto | null>(null);
  const [cargando, setCargando] = useState<boolean>(false);

  useEffect(() => {
    if (abierto && iCveAgenda) {
      setCargando(true);
      AgendaService.getAgendaDetalle(iCveAgenda, iCveServAgendaDet)
        .then((data) => {
          setDetalle(data);
        })
        .finally(() => {
          setCargando(false);
        });
    } else {
      setDetalle(null);
    }
  }, [abierto, iCveAgenda, iCveServAgendaDet]);

  if (!abierto) return null;

  const listaSesiones: SesionDetalleDto[] = detalle
    ? detalle.Sesiones || (detalle as any).sesiones || (detalle as any).Detalles || []
    : [];

  const grupos = agruparSesiones(listaSesiones);

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
        zIndex: 1000,
        padding: "16px",
      }}
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
      >
        {/* Header Elegante & Soft */}
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
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "10px",
                backgroundColor: "#eef2ff",
                border: "1px solid #c7d2fe",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#4f46e5",
              }}
            >
              <History size={18} />
            </div>

            <div>
              <h3 style={{ fontSize: "15px", fontWeight: 700, color: "#0f172a", margin: 0 }}>
                Sesiones
              </h3>
              <p style={{ fontSize: "12px", color: "#64748b", margin: "1px 0 0 0" }}>
                {detalle?.v_Servicio ? (
                  <>
                    <strong style={{ color: "#334155", fontWeight: 600 }}>{detalle.v_Servicio}</strong>
                    {detalle.v_Empresa && (
                      <span style={{ color: "#64748b" }}> — {detalle.v_Empresa}</span>
                    )}
                  </>
                ) : (
                  "Historial de sesiones del servicio"
                )}
              </p>
            </div>
          </div>

          <button
            type="button"
            className="btn-icon"
            onClick={onCerrar}
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
              transition: "all 0.2s ease",
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Body con Scroll */}
        <div
          className="modal-body no-scrollbar"
          style={{
            padding: "20px 24px 24px 24px",
            flex: 1,
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            gap: "24px",
            backgroundColor: "#ffffff",
          }}
        >
          {cargando ? (
            <div style={{ padding: "48px 0", textAlign: "center", color: "#64748b" }}>
              <div className="spinner-border text-primary mb-3" style={{ width: "24px", height: "24px" }}></div>
              <p style={{ fontSize: "13px", margin: 0, fontWeight: 500 }}>Cargando línea temporal...</p>
            </div>
          ) : grupos.length === 0 ? (
            <div style={{ padding: "48px 0", textAlign: "center", color: "#64748b" }}>
              <Clock size={32} style={{ margin: "0 auto 10px auto", opacity: 0.3 }} />
              <p style={{ fontSize: "14px", margin: 0, fontWeight: 500 }}>No hay información de sesiones registrada.</p>
            </div>
          ) : (
            grupos.map((grupo) => (
              <div
                key={`grupo-orden-${grupo.i_Orden}`}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "14px",
                }}
              >
                {/* Header de la Sesión N */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    paddingBottom: "6px",
                    borderBottom: "1px solid #f1f5f9",
                  }}
                >
                  <span
                    style={{
                      fontSize: "14px",
                      fontWeight: 700,
                      color: "#1e293b",
                    }}
                  >
                    Sesión {grupo.i_Orden}
                  </span>
                </div>

                {/* Vertical Minimalist Timeline List */}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    position: "relative",
                    paddingLeft: "4px",
                  }}
                >
                  {grupo.nodos.map((nodo, idx) => {
                    const esResaltado =
                      iCveAgendaDetalleResaltar != null &&
                      nodo.i_CveAgendaDetalle === iCveAgendaDetalleResaltar;

                    const estatus = obtenerEstatusNodo(nodo);
                    const esUltimo = idx === grupo.nodos.length - 1;
                    const IconComponent = estatus.circleIcon;

                    // Etiqueta del nodo
                    let tituloNodo = "Original";
                    if (idx > 0) {
                      if (esUltimo && estatus.tipo === "vigente") {
                        tituloNodo = "Vigente";
                      } else {
                        tituloNodo = `Reprogramada ${idx}`;
                      }
                    }

                    const tieneTitular = nodo.v_Titular && nodo.v_Titular.trim().length > 0 && nodo.v_Titular.trim() !== "—";
                    const tieneApoyo = nodo.v_Apoyo && nodo.v_Apoyo.trim().length > 0 && nodo.v_Apoyo.trim() !== "—";
                    const fechaFormateada = formatearFechaHoraNodo(nodo.d_FechaHoraInicio, nodo.d_FechaHoraFin);

                    const dotSize = esResaltado ? 24 : 20;
                    const iconSize = esResaltado ? 12 : 11;

                    return (
                      <div
                        key={`nodo-step-${nodo.i_CveAgendaDetalle || idx}`}
                        style={{
                          display: "flex",
                          position: "relative",
                          paddingBottom: esUltimo ? "0px" : "22px",
                        }}
                      >
                        {/* Thin Connecting Vertical Line */}
                        {!esUltimo && (
                          <div
                            style={{
                              position: "absolute",
                              top: `${dotSize + 2}px`,
                              left: esResaltado ? "12px" : "10px",
                              width: "1.5px",
                              bottom: "0px",
                              backgroundColor: estatus.isSolid ? estatus.lineColor : "#e5e7eb",
                              zIndex: 0,
                            }}
                          />
                        )}

                        {/* Timeline Node Dot Marker */}
                        <div
                          style={{
                            position: "relative",
                            zIndex: 1,
                            width: `${dotSize}px`,
                            height: `${dotSize}px`,
                            borderRadius: "50%",
                            backgroundColor: estatus.isSolid ? estatus.circleBg : "#ffffff",
                            border: estatus.isSolid
                              ? `1.5px solid ${estatus.circleBorder}`
                              : `1.5px solid ${estatus.circleBorder}`,
                            color: estatus.isSolid ? "#ffffff" : estatus.color,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                            boxShadow: esResaltado
                              ? `0 0 0 4px rgba(99, 102, 241, 0.18)`
                              : "none",
                            transition: "all 0.2s ease",
                            marginTop: "1px",
                          }}
                        >
                          <IconComponent size={iconSize} strokeWidth={2.2} />
                        </div>

                        {/* Content Block Next to Node Marker */}
                        <div
                          style={{
                            marginLeft: "14px",
                            flex: 1,
                            display: "flex",
                            flexDirection: "column",
                            gap: "1px",
                          }}
                        >
                          {/* 1. Date & Time Timestamp */}
                          <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                            <span style={{ fontSize: "11px", color: "#94a3b8", fontWeight: 500 }}>
                              {fechaFormateada}
                            </span>
                          </div>

                          {/* 2. Main Title & Status Badge */}
                          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "1px" }}>
                            <h4
                              style={{
                                fontSize: "14px",
                                fontWeight: esResaltado ? 700 : 600,
                                color: esResaltado ? "#4f46e5" : "#1e293b",
                                margin: 0,
                                lineHeight: "1.3",
                              }}
                            >
                              {tituloNodo}
                            </h4>

                            <span
                              style={{
                                fontSize: "10px",
                                fontWeight: 600,
                                padding: "1px 6px",
                                borderRadius: "8px",
                                ...estatus.badgeStyle,
                              }}
                            >
                              {estatus.label}
                            </span>
                          </div>

                          {/* 3. Subtext Details */}
                          <div
                            style={{
                              fontSize: "12px",
                              color: "#64748b",
                              display: "flex",
                              flexDirection: "column",
                              gap: "2px",
                              marginTop: "2px",
                            }}
                          >
                            {(tieneTitular || tieneApoyo) && (
                              <div style={{ display: "flex", alignItems: "center", gap: "5px", color: "#64748b" }}>
                                <User size={12} style={{ color: "#94a3b8", flexShrink: 0 }} />
                                <span>
                                  {tieneTitular && <span style={{ fontWeight: 500, color: "#334155" }}>{nodo.v_Titular}</span>}
                                  {tieneTitular && tieneApoyo && <span style={{ color: "#94a3b8" }}> (Apoyo: {nodo.v_Apoyo})</span>}
                                  {!tieneTitular && tieneApoyo && <span>Apoyo: {nodo.v_Apoyo}</span>}
                                </span>
                              </div>
                            )}

                            {nodo.v_NombreArea && nodo.v_NombreArea.trim().length > 0 && (
                              <div style={{ display: "flex", alignItems: "center", gap: "5px", color: "#64748b", fontSize: "11px" }}>
                                <MapPin size={12} style={{ color: "#94a3b8", flexShrink: 0 }} />
                                <span>{nodo.v_NombreArea}</span>
                              </div>
                            )}

                            {/* Motivo cuando la sesión es reprogramada o cancelada */}
                            {(() => {
                              const esCancelada = estatus.tipo === "cancelada";
                              const esReprogramada = estatus.tipo === "reprogramada";

                              if (!esCancelada && !esReprogramada) return null;

                              const motivoTexto = (
                                nodo.v_MotivoCancelacion ||
                                nodo.v_Observaciones ||
                                (nodo as any).v_motivoCancelacion ||
                                (nodo as any).v_motivoReprogramacion ||
                                (nodo as any).v_motivo ||
                                (nodo as any).v_Observaciones ||
                                ""
                              ).trim();

                              if (!motivoTexto) return null;

                              return (
                                <div
                                  style={{
                                    fontSize: "11px",
                                    color: esCancelada ? "#b91c1c" : "#475569",
                                    marginTop: "2px",
                                    display: "flex",
                                    alignItems: "baseline",
                                    gap: "4px",
                                  }}
                                >
                                  <span style={{ fontWeight: 600 }}>Motivo:</span>
                                  <span>{motivoTexto}</span>
                                </div>
                              );
                            })()}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer del Modal */}
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
            onClick={onCerrar}
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
};
