"use client";

import React from "react";
import { X, ClipboardList } from "lucide-react";
import { ActividadPendienteConsultor, ActividadPersonal } from "@/types/consultor";
import { formatearFechaTexto } from "@/lib/date-utils";
import { renderEstatusActividadBadge } from "./TablaConsultorSesiones";
import { renderPrioridadActividadBadge } from "./TablaConsultorActividades";

interface Props {
  abierto: boolean;
  actividad: ActividadPendienteConsultor | ActividadPersonal | null;
  onCerrar: () => void;
}

const labelStyle: React.CSSProperties = {
  fontSize: "12px",
  fontWeight: 600,
  color: "#64748b",
  marginBottom: "4px",
  display: "block",
};

const valueStyle: React.CSSProperties = {
  fontSize: "14px",
  color: "#1e293b",
  lineHeight: 1.45,
};

export const ModalDetalleActividadConsultor: React.FC<Props> = ({
  abierto,
  actividad,
  onCerrar,
}) => {
  if (!abierto || !actividad) return null;

  const esGeneral = actividad.i_CveServAgendaDet == null;
  const notasLimpias = actividad.v_Notas?.trim() || "";
  const esAtrasada = actividad.i_CveEstatus === 5;

  return (
    <div
      className="modal-overlay"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(15, 23, 42, 0.55)",
        backdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1050,
        padding: "16px",
      }}
      onClick={onCerrar}
    >
      <div
        className="modal-content no-scrollbar"
        style={{
          maxWidth: "520px",
          width: "100%",
          maxHeight: "88vh",
          backgroundColor: "#ffffff",
          borderRadius: "16px",
          boxShadow: "0 20px 40px -15px rgba(15, 23, 42, 0.25)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
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
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
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
              <ClipboardList size={18} />
            </div>

            <h3
              style={{
                fontSize: "15px",
                fontWeight: 700,
                color: "#0f172a",
                margin: 0,
              }}
            >
              Detalle de actividad
            </h3>
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
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div
          className="modal-body no-scrollbar"
          style={{
            padding: "20px 24px",
            flex: 1,
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            gap: "16px",
            backgroundColor: "#ffffff",
          }}
        >
          {/* 0. Personal (solo en Actividades del personal) */}
          {"v_Personal" in actividad && actividad.v_Personal && (
            <div>
              <div
                style={{
                  fontSize: "12px",
                  color: "#64748b",
                  fontWeight: 500,
                  marginBottom: "4px",
                }}
              >
                Personal
              </div>
              <div
                style={{
                  fontSize: "14px",
                  fontWeight: 600,
                  color: "#1e293b",
                }}
              >
                {actividad.v_Personal}
              </div>
            </div>
          )}

          {/* 1. Tema */}
          <div>
            <span style={labelStyle}>Tema</span>
            <div
              style={{
                ...valueStyle,
                fontWeight: 600,
                wordBreak: "break-word",
              }}
            >
              {actividad.v_Titulo || "—"}
            </div>
          </div>

          {/* 2. Notas */}
          <div>
            <span style={labelStyle}>Notas</span>
            {notasLimpias ? (
              <div
                style={{
                  ...valueStyle,
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                }}
              >
                {notasLimpias}
              </div>
            ) : (
              <div
                style={{
                  ...valueStyle,
                  color: "#94a3b8",
                  fontStyle: "italic",
                }}
              >
                Sin notas
              </div>
            )}
          </div>

          {/* 3. Ligada a */}
          <div>
            <span style={labelStyle}>Ligada a</span>
            {esGeneral ? (
              <span
                className="badge"
                style={{
                  backgroundColor: "#f1f5f9",
                  color: "#475569",
                  border: "1px solid #e2e8f0",
                }}
              >
                General
              </span>
            ) : (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  flexWrap: "wrap",
                }}
              >
                <span
                  className="badge"
                  style={{
                    backgroundColor: "#eef6fd",
                    color: "#2B8FCC",
                    border: "1px solid #bae6fd",
                  }}
                >
                  Proyecto
                </span>
                <span
                  style={{
                    ...valueStyle,
                    fontWeight: 700,
                    wordBreak: "break-word",
                  }}
                >
                  {actividad.v_Proyecto || "—"}
                </span>
              </div>
            )}
          </div>

          {/* 4. Cliente */}
          <div>
            <span style={labelStyle}>Cliente</span>
            {esGeneral ? (
              <div style={{ ...valueStyle, fontWeight: 700 }}>GOODiDEA</div>
            ) : (
              <div>
                <div
                  className="uppercase"
                  style={{ ...valueStyle, fontWeight: 700 }}
                >
                  {actividad.v_Empresa?.trim() || "—"}
                </div>
                {actividad.v_Planta && actividad.v_Planta.trim() !== "" && (
                  <div
                    style={{
                      fontSize: "12.5px",
                      color: "#64748b",
                      marginTop: "2px",
                    }}
                  >
                    {actividad.v_Planta}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 5. Fecha inicio · Fecha compromiso */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "16px",
            }}
          >
            <div>
              <span style={labelStyle}>Fecha inicio</span>
              <div style={valueStyle}>
                {formatearFechaTexto(actividad.d_FechaInicio) || "—"}
              </div>
            </div>

            <div>
              <span style={labelStyle}>Fecha compromiso</span>
              <div
                style={{
                  ...valueStyle,
                  color: esAtrasada ? "#dc3545" : "#1e293b",
                  fontWeight: esAtrasada ? 700 : 400,
                }}
              >
                {formatearFechaTexto(actividad.d_FinCompromiso) || "—"}
              </div>
            </div>
          </div>

          {/* 6. Prioridad · Estatus */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "16px",
            }}
          >
            <div>
              <span style={labelStyle}>Prioridad</span>
              <div>
                {renderPrioridadActividadBadge(
                  actividad.i_Prioridad,
                  actividad.v_Prioridad
                )}
              </div>
            </div>

            <div>
              <span style={labelStyle}>Estatus</span>
              <div>{renderEstatusActividadBadge(actividad.i_CveEstatus)}</div>
            </div>
          </div>
        </div>

        {/* Footer */}
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

