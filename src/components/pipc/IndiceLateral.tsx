"use client";

import React, { useMemo } from "react";
import { BadgeSemaforo } from "./comunes/BadgeSemaforo";
import { diasRestantes, getColorSemaforo } from "./pipcCalculos";
import { formatearFechaTexto } from "@/lib/date-utils";
import { PipcEstado } from "@/types/pipc";

export interface InfoSeccionIndice {
  id: string;
  indice: number;
  nombre: string;
  icono: string;
  porcentaje: number;
  conteoAnexos?: number;
}

interface Props {
  secciones: InfoSeccionIndice[];
  seccionActiva: number;
  avanceGlobal: number;
  diasProyecto?: string;
  pendientesAltaCount: number;
  onSelectSeccion: (indice: number) => void;
  onScrollAExportar: () => void;
  className?: string;
  d_FechaFin?: string | null;
  v_Estado?: PipcEstado | string | null;
}

export const IndiceLateral: React.FC<Props> = ({
  secciones,
  seccionActiva,
  avanceGlobal,
  diasProyecto,
  pendientesAltaCount,
  onSelectSeccion,
  onScrollAExportar,
  className = "",
  d_FechaFin,
  v_Estado,
}) => {

  // Helper para días restantes / estado (§3)
  const infoDias = useMemo(() => {
    if (v_Estado === "finalizado") {
      return {
        texto: "Finalizado",
        color: "#16a34a",
        fontWeight: 600,
      };
    }

    if (d_FechaFin === undefined && v_Estado === undefined && diasProyecto) {
      return {
        texto: diasProyecto === "—" ? "Sin fecha de fin" : diasProyecto,
        color: "#334155",
        fontWeight: 600,
      };
    }

    const dias = diasRestantes(d_FechaFin ?? null);
    if (dias === null) {
      return {
        texto: "Sin fecha de fin",
        color: "#64748b",
        fontWeight: 500,
      };
    }

    if (dias > 1) {
      return {
        texto: `${dias} días restantes`,
        color: "#334155",
        fontWeight: 600,
      };
    }

    if (dias === 1) {
      return {
        texto: "1 día restante",
        color: "#334155",
        fontWeight: 600,
      };
    }

    if (dias === 0) {
      return {
        texto: "Vence hoy",
        color: "#B9770E",
        fontWeight: 600,
      };
    }

    const abs = Math.abs(dias);
    return {
      texto: `Vencido hace ${abs} día${abs === 1 ? "" : "s"}`,
      color: "#DC3545",
      fontWeight: 600,
    };
  }, [v_Estado, d_FechaFin, diasProyecto]);

  const fechaFinTexto = d_FechaFin ? formatearFechaTexto(d_FechaFin) : null;

  return (
    <div className={`indice-lateral-wrapper ${className}`}>
      {/* VERSIÓN COMPACTA HORIZONTAL PARA PANTALLAS < 992px */}
      <div className="indice-compact-mobile">
        <div
          style={{
            backgroundColor: "#ffffff",
            borderRadius: "8px",
            border: "1px solid #e2e8f0",
            padding: "10px 14px",
            marginBottom: "12px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "10px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <BadgeSemaforo porcentaje={avanceGlobal} texto={`${avanceGlobal} % global`} />
            <span style={{ fontSize: "11px", color: "#64748b" }}>•</span>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: "12px", color: infoDias.color, fontWeight: infoDias.fontWeight, lineHeight: 1.2 }}>
                {infoDias.texto}
              </span>
              {fechaFinTexto && (
                <span style={{ fontSize: "10px", color: "#64748b", marginTop: "2px" }}>
                  Fin del servicio: {fechaFinTexto}
                </span>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={onScrollAExportar}
            style={{
              background: "none",
              border: "none",
              fontSize: "12px",
              fontWeight: 600,
              color: pendientesAltaCount > 0 ? "#dc2626" : "#64748b",
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            <span>{pendientesAltaCount} pendientes Alta</span>
            <i className="bi bi-arrow-right" style={{ fontSize: "11px" }} />
          </button>
        </div>

        {/* Select sticky en móvil / tableta */}
        <div style={{ position: "sticky", top: "10px", zIndex: 30, marginBottom: "14px" }}>
          <select
            className="form-select text-xs"
            value={seccionActiva}
            onChange={(e) => onSelectSeccion(Number(e.target.value))}
            style={{
              height: "40px",
              fontSize: "13px",
              fontWeight: 600,
              borderRadius: "8px",
              border: "1.5px solid #2B8FCC",
              backgroundColor: "#ffffff",
              boxShadow: "0 2px 4px rgba(0,0,0,0.06)",
            }}
          >
            {secciones.map((sec) => (
              <option key={sec.id} value={sec.indice}>
                {sec.indice + 1}. {sec.nombre}{" "}
                {sec.indice === 9
                  ? `(${sec.conteoAnexos || 0} anexos)`
                  : sec.indice === 10
                  ? ""
                  : `— ${sec.porcentaje} %`}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* VERSIÓN ESCRITORIO (>= 992px) — Sin card de resumen, empieza arriba */}
      <div className="indice-desktop-sticky">
        {/* Lista de las 11 Secciones */}
        <div
          style={{
            backgroundColor: "#ffffff",
            borderRadius: "10px",
            border: "1px solid #e2e8f0",
            overflow: "hidden",
            boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
            width: "100%",
          }}
        >
          <div
            style={{
              padding: "10px 16px",
              borderBottom: "1px solid #e2e8f0",
              fontSize: "11px",
              fontWeight: 700,
              color: "#64748b",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
            }}
          >
            Índice del documento
          </div>

          <div style={{ display: "flex", flexDirection: "column" }}>
            {secciones.map((sec) => {
              const activa = seccionActiva === sec.indice;
              const esAnexos = sec.indice === 9;
              const esExportar = sec.indice === 10;
              const colorBarra = getColorSemaforo(sec.porcentaje);

              return (
                <button
                  key={sec.id}
                  type="button"
                  onClick={() => onSelectSeccion(sec.indice)}
                  className={`indice-item-btn ${activa ? "activa" : ""}`}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    border: "none",
                    borderLeft: activa ? "3px solid #2B8FCC" : "3px solid transparent",
                    backgroundColor: activa ? "#EAF4FB" : "transparent",
                    cursor: "pointer",
                    textAlign: "left",
                    transition: "background-color 150ms ease, border-left-color 150ms ease",
                    borderBottom: "1px solid #f1f5f9",
                    width: "100%",
                  }}
                  onMouseEnter={(e) => {
                    if (!activa) e.currentTarget.style.backgroundColor = "#f8fafc";
                  }}
                  onMouseLeave={(e) => {
                    if (!activa) e.currentTarget.style.backgroundColor = "transparent";
                    else e.currentTarget.style.backgroundColor = "#EAF4FB";
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "6px", width: "100%" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", minWidth: 0 }}>
                      <i
                        className={sec.icono}
                        style={{
                          fontSize: "13px",
                          color: activa ? "#2B8FCC" : "#64748b",
                          flexShrink: 0,
                        }}
                      />
                      <span
                        style={{
                          fontSize: "12px",
                          fontWeight: activa ? 600 : 500,
                          color: activa ? "#1e293b" : "#475569",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {sec.indice + 1}. {sec.nombre}
                      </span>
                    </div>

                    {esAnexos ? (
                      <span
                        style={{
                          fontSize: "10px",
                          fontWeight: 700,
                          color: "#B9770E",
                          backgroundColor: "#FEF3E2",
                          padding: "1px 6px",
                          borderRadius: "10px",
                          flexShrink: 0,
                        }}
                      >
                        {sec.conteoAnexos || 0}
                      </span>
                    ) : esExportar ? null : (
                      <span
                        style={{
                          fontSize: "11px",
                          fontWeight: 700,
                          color: colorBarra,
                          flexShrink: 0,
                        }}
                      >
                        {sec.porcentaje}%
                      </span>
                    )}
                  </div>

                  {/* Mini barra de progreso: 3px de alto, margen superior 4px */}
                  {!esAnexos && !esExportar && (
                    <div
                      className="indice-mini-barra"
                      style={{
                        height: "3px",
                        width: "100%",
                        backgroundColor: "#f1f5f9",
                        borderRadius: "2px",
                        marginTop: "4px",
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          height: "100%",
                          width: `${sec.porcentaje}%`,
                          backgroundColor: colorBarra,
                          transition: "width 0.25s ease",
                        }}
                      />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <style jsx>{`
        .indice-lateral-wrapper {
          width: 100%;
          display: flex;
          flex-direction: column;
        }
        .indice-compact-mobile {
          display: none;
        }
        .indice-desktop-sticky {
          display: flex;
          flex-direction: column;
          width: 100%;
          overflow: hidden;
        }
        .indice-item-btn {
          height: 40px;
          min-height: 40px;
          padding: 8px 14px;
          box-sizing: border-box;
        }
        @media (max-height: 760px) {
          .indice-item-btn {
            height: 34px !important;
            min-height: 34px !important;
            padding: 6px 14px !important;
          }
          .indice-mini-barra {
            display: none !important;
          }
        }
        @media (max-width: 991px) {
          .indice-compact-mobile {
            display: block;
            position: sticky;
            top: 56px;
            z-index: 40;
          }
          .indice-desktop-sticky {
            display: none;
          }
        }
      `}</style>
    </div>
  );
};
