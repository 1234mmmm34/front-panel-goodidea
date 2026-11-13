"use client";

import React, { useEffect } from "react";
import { X } from "lucide-react";
import {
  DashboardProyecto,
  formatearFechaMesAbrev,
  formatearAsesoresIniciales,
} from "@/types/dashboardProyectos";

export interface DetalleBarraSeleccionada {
  subtitulo: string;
  proyectos: DashboardProyecto[];
  ocultarAsesor: boolean;
  ocultarRubro: boolean;
}

interface ModalDetalleProyectosProps {
  detalle: DetalleBarraSeleccionada | null;
  inicialesMap: Map<string, string>;
  onCerrar: () => void;
}

export const ModalDetalleProyectos: React.FC<ModalDetalleProyectosProps> = ({
  detalle,
  inicialesMap,
  onCerrar,
}) => {
  useEffect(() => {
    if (!detalle) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onCerrar();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [detalle, onCerrar]);

  if (!detalle) return null;

  // Orden: primero En proceso (de más días a menos) y después Terminados (fecha de inicio más reciente a más antigua)
  const proyectosOrdenados = [...detalle.proyectos].sort((a, b) => {
    const aEnProceso = !a.b_Terminado;
    const bEnProceso = !b.b_Terminado;
    if (aEnProceso && !bEnProceso) return -1;
    if (!aEnProceso && bEnProceso) return 1;
    if (aEnProceso && bEnProceso) {
      return (b.i_DiasTranscurridos ?? 0) - (a.i_DiasTranscurridos ?? 0);
    }
    return b.d_FechaInicio.localeCompare(a.d_FechaInicio);
  });

  const thStickyStyle: React.CSSProperties = {
    padding: "10px 12px",
    position: "sticky",
    top: 0,
    backgroundColor: "#f8fafc",
    zIndex: 2,
    boxShadow: "0 1px 0 #e2e8f0",
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-detalle-proyectos-titulo"
      onClick={onCerrar}
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(15, 23, 42, 0.45)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
        zIndex: 1000,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: "#ffffff",
          borderRadius: "10px",
          border: "1px solid #e2e8f0",
          boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.15)",
          width: "100%",
          maxWidth: "900px",
          maxHeight: "85vh",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: "12px",
            padding: "16px 20px",
            borderBottom: "1px solid #e2e8f0",
          }}
        >
          <div>
            <h2
              id="modal-detalle-proyectos-titulo"
              style={{
                fontSize: "17px",
                fontWeight: 700,
                color: "#0f172a",
                margin: 0,
              }}
            >
              Detalle de proyectos
            </h2>
            <p
              style={{
                fontSize: "13px",
                color: "#64748b",
                margin: "2px 0 0 0",
              }}
            >
              {detalle.subtitulo}
            </p>
          </div>

          <button
            type="button"
            onClick={onCerrar}
            aria-label="Cerrar"
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: "30px",
              height: "30px",
              borderRadius: "6px",
              border: "none",
              backgroundColor: "transparent",
              color: "#64748b",
              cursor: "pointer",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#f1f5f9";
              e.currentTarget.style.color = "#0f172a";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
              e.currentTarget.style.color = "#64748b";
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Body con scroll si supera ~10 renglones */}
        <div
          style={{
            padding: "0 20px",
            overflowY: "auto",
            maxHeight: "540px",
          }}
        >
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              textAlign: "left",
              fontSize: "13px",
            }}
          >
            <thead>
              <tr
                style={{
                  color: "#64748b",
                  fontWeight: 600,
                  fontSize: "11px",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}
              >
                {!detalle.ocultarAsesor && (
                  <th style={thStickyStyle}>Asesor</th>
                )}
                <th style={thStickyStyle}>Cliente</th>
                <th style={thStickyStyle}>Proyecto</th>
                {!detalle.ocultarRubro && <th style={thStickyStyle}>Rubro</th>}
                <th style={thStickyStyle}>Inicio</th>
                <th style={thStickyStyle}>Estatus</th>
                <th style={{ ...thStickyStyle, textAlign: "right" }}>Días</th>
              </tr>
            </thead>
            <tbody>
              {proyectosOrdenados.map((p) => {
                const esServicio = p.v_TipoServicio === "Servicios";
                const esEnProceso = !p.b_Terminado;
                const dias = p.i_DiasTranscurridos ?? 0;

                return (
                  <tr
                    key={p.i_CveServAgendaDet}
                    style={{
                      borderBottom: "1px solid #f1f5f9",
                      transition: "background-color 0.15s ease",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.backgroundColor = "#f8fafc")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.backgroundColor = "transparent")
                    }
                  >
                    {!detalle.ocultarAsesor && (
                      <td
                        title={p.v_Asesores || undefined}
                        style={{
                          padding: "12px",
                          fontWeight: 600,
                          color: "#1e293b",
                        }}
                      >
                        {formatearAsesoresIniciales(p.v_Asesores, inicialesMap)}
                      </td>
                    )}
                    <td
                      style={{
                        padding: "12px",
                        fontWeight: 600,
                        color: "#1e293b",
                      }}
                    >
                      {p.v_Empresa}
                    </td>
                    <td style={{ padding: "12px", color: "#1e293b" }}>
                      <div>{p.v_Servicio}</div>
                      <span
                        style={{
                          display: "inline-block",
                          marginTop: "4px",
                          padding: "2px 10px",
                          borderRadius: "4px",
                          borderLeft: `3px solid ${
                            esServicio ? "#22c55e" : "#3b82f6"
                          }`,
                          backgroundColor: esServicio ? "#ecfdf3" : "#eef5fd",
                          color: "#1e293b",
                          fontSize: "12px",
                        }}
                      >
                        {p.v_TipoServicio}
                      </span>
                    </td>
                    {!detalle.ocultarRubro && (
                      <td style={{ padding: "12px", color: "#64748b" }}>
                        {p.v_Rubro}
                      </td>
                    )}
                    <td
                      style={{
                        padding: "12px",
                        color: "#1e293b",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {formatearFechaMesAbrev(p.d_FechaInicio)}
                    </td>
                    <td style={{ padding: "12px", whiteSpace: "nowrap" }}>
                      <span
                        style={{
                          display: "inline-block",
                          padding: "2px 8px",
                          borderRadius: "10px",
                          fontSize: "12px",
                          fontWeight: 600,
                          backgroundColor: esEnProceso ? "#fff1e6" : "#dcfce7",
                          color: esEnProceso ? "#c2410c" : "#15803d",
                        }}
                      >
                        {p.v_Estatus}
                      </span>
                    </td>
                    <td
                      style={{
                        padding: "12px",
                        textAlign: "right",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {p.b_Terminado ? (
                        <span style={{ color: "#94a3b8" }}>—</span>
                      ) : p.b_MasDe30Dias ? (
                        <span
                          style={{
                            display: "inline-block",
                            padding: "2px 8px",
                            borderRadius: "10px",
                            fontSize: "12px",
                            fontWeight: 600,
                            backgroundColor: "#fde8e6",
                            color: "#b91c1c",
                          }}
                        >
                          {dias} días
                        </span>
                      ) : (
                        <span style={{ color: "#1e293b" }}>{dias} días</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            padding: "14px 20px",
            borderTop: "1px solid #e2e8f0",
            backgroundColor: "#f8fafc",
          }}
        >
          <button
            type="button"
            onClick={onCerrar}
            style={{
              padding: "8px 18px",
              fontSize: "13px",
              fontWeight: 500,
              color: "#334155",
              backgroundColor: "#ffffff",
              border: "1px solid #cbd5e1",
              borderRadius: "6px",
              cursor: "pointer",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#f1f5f9";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "#ffffff";
            }}
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

