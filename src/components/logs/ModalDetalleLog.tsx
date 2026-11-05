"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AuditLogItem } from "@/types/logs";
import { MESES_ABREV } from "@/lib/date-utils";

export function formatearFechaHoraLog(fechaIso: string | null | undefined): string {
  if (!fechaIso) return "—";
  const match = fechaIso.match(
    /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2}):(\d{2})/
  );
  if (match) {
    const year = match[1];
    const monthIdx = parseInt(match[2], 10) - 1;
    const day = match[3];
    const hh = match[4];
    const mm = match[5];
    const ss = match[6];
    const mesAbrev = MESES_ABREV[monthIdx] || match[2];
    return `${day}/${mesAbrev}/${year} ${hh}:${mm}:${ss}`;
  }
  try {
    const d = new Date(fechaIso);
    if (isNaN(d.getTime())) return fechaIso;
    const day = String(d.getDate()).padStart(2, "0");
    const mes = MESES_ABREV[d.getMonth()] || "";
    const year = d.getFullYear();
    const hh = String(d.getHours()).padStart(2, "0");
    const mm = String(d.getMinutes()).padStart(2, "0");
    const ss = String(d.getSeconds()).padStart(2, "0");
    return `${day}/${mes}/${year} ${hh}:${mm}:${ss}`;
  } catch {
    return fechaIso;
  }
}

export function obtenerColoresStatusCode(code: number): {
  backgroundColor: string;
  color: string;
} {
  if (code >= 200 && code < 300) {
    return { backgroundColor: "#d1e7dd", color: "#0f5132" };
  }
  if (code >= 300 && code < 400) {
    return { backgroundColor: "#cfe2ff", color: "#084298" };
  }
  if (code >= 400 && code < 500) {
    return { backgroundColor: "#fff3cd", color: "#856404" };
  }
  if (code >= 500) {
    return { backgroundColor: "#f8d7da", color: "#842029" };
  }
  return { backgroundColor: "#f1f5f9", color: "#475569" };
}

export function renderBadgeMetodo(metodo: string | null | undefined) {
  const m = (metodo || "").trim().toUpperCase();
  let bg = "#f1f5f9";
  let text = "#475569";
  let border = "#cbd5e1";

  if (m === "POST") {
    bg = "#e0f2fe";
    text = "#0369a1";
    border = "#bae6fd";
  } else if (m === "PUT") {
    bg = "#fef3c7";
    text = "#92400e";
    border = "#fde68a";
  } else if (m === "DELETE") {
    bg = "#fee2e2";
    text = "#991b1b";
    border = "#fecaca";
  } else if (m === "GET") {
    bg = "#f1f5f9";
    text = "#475569";
    border = "#e2e8f0";
  }

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "2px 8px",
        borderRadius: "6px",
        fontSize: "11px",
        fontWeight: 700,
        backgroundColor: bg,
        color: text,
        border: `1px solid ${border}`,
        letterSpacing: "0.3px",
      }}
    >
      {m || "—"}
    </span>
  );
}

function formatearContenidoBloque(raw: string | null | undefined): {
  esVacio: boolean;
  texto: string;
} {
  if (raw === null || raw === undefined || raw === "") {
    return { esVacio: true, texto: "Sin contenido" };
  }
  try {
    const parsed = JSON.parse(raw);
    if (parsed !== null && typeof parsed === "object") {
      return { esVacio: false, texto: JSON.stringify(parsed, null, 2) };
    }
    return { esVacio: false, texto: JSON.stringify(parsed, null, 2) };
  } catch {
    return { esVacio: false, texto: raw };
  }
}

interface ModalDetalleLogProps {
  abierto: boolean;
  cargando: boolean;
  log: AuditLogItem | null;
  onCerrar: () => void;
}

export const ModalDetalleLog: React.FC<ModalDetalleLogProps> = ({
  abierto,
  cargando,
  log,
  onCerrar,
}) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!abierto || !mounted) return null;

  const esAnonimo =
    !log?.i_CveUsuario ||
    !log?.v_Usuario ||
    log.v_Usuario.trim().toLowerCase() === "anónimo" ||
    log.v_Usuario.trim().toLowerCase() === "anonimo";

  const statusColors = obtenerColoresStatusCode(log?.i_StatusCode ?? 0);
  const payloadInfo = formatearContenidoBloque(log?.v_Payload);
  const respuestaInfo = formatearContenidoBloque(log?.v_Respuesta);

  return createPortal(
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        backgroundColor: "rgba(15, 23, 42, 0.55)",
        backdropFilter: "blur(2px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
      }}
      onClick={onCerrar}
    >
      <div
        style={{
          backgroundColor: "#ffffff",
          borderRadius: "14px",
          width: "100%",
          maxWidth: "820px",
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
          overflow: "hidden",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header del Modal */}
        <div
          style={{
            padding: "16px 24px",
            borderBottom: "1px solid #e2e8f0",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            backgroundColor: "#f8fafc",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <i
              className="bi bi-journal-text"
              style={{ fontSize: "18px", color: "#2B8FCC" }}
            />
            <div>
              <h2
                style={{
                  margin: 0,
                  fontSize: "15px",
                  fontWeight: 700,
                  color: "#1e293b",
                }}
              >
                Detalle de petición {log ? `#${log.i_CveLog}` : ""}
              </h2>
              <span style={{ fontSize: "12px", color: "#64748b" }}>
                Información registrada en el log de auditoría de la API
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onCerrar}
            style={{
              border: "none",
              background: "transparent",
              color: "#64748b",
              cursor: "pointer",
              padding: "6px",
              borderRadius: "8px",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            title="Cerrar"
          >
            <i className="bi bi-x-lg" style={{ fontSize: "15px" }} />
          </button>
        </div>

        {/* Cuerpo del Modal */}
        <div
          className="custom-scrollbar"
          style={{
            padding: "20px 24px",
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            gap: "16px",
          }}
        >
          {cargando && !log ? (
            <div style={{ padding: "36px 0", textAlign: "center" }}>
              <div className="inline-block animate-spin rounded-full h-7 w-7 border-b-2 border-[#2B8FCC] mb-2"></div>
              <p style={{ fontSize: "13px", color: "#64748b", margin: 0 }}>
                Cargando detalle del registro...
              </p>
            </div>
          ) : log ? (
            <>
              {/* Cabecera de metadatos */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                  gap: "12px",
                  padding: "14px 16px",
                  backgroundColor: "#f8fafc",
                  border: "1px solid #e2e8f0",
                  borderRadius: "10px",
                }}
              >
                {/* Fecha y hora */}
                <div>
                  <div
                    style={{
                      fontSize: "11px",
                      fontWeight: 600,
                      color: "#64748b",
                      marginBottom: "3px",
                    }}
                  >
                    Fecha y hora
                  </div>
                  <div
                    style={{
                      fontSize: "13px",
                      fontWeight: 500,
                      color: "#1e293b",
                    }}
                  >
                    {formatearFechaHoraLog(log.d_Fecha)}
                  </div>
                </div>

                {/* Usuario (+ correo) */}
                <div>
                  <div
                    style={{
                      fontSize: "11px",
                      fontWeight: 600,
                      color: "#64748b",
                      marginBottom: "3px",
                    }}
                  >
                    Usuario
                  </div>
                  {esAnonimo ? (
                    <div
                      style={{
                        fontSize: "13px",
                        fontStyle: "italic",
                        color: "#94a3b8",
                      }}
                    >
                      Anónimo
                    </div>
                  ) : (
                    <div>
                      <div
                        style={{
                          fontSize: "13px",
                          fontWeight: 600,
                          color: "#1e293b",
                        }}
                      >
                        {log.v_Usuario}
                      </div>
                      {log.v_Email && (
                        <div style={{ fontSize: "11.5px", color: "#64748b" }}>
                          {log.v_Email}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Método y Código */}
                <div style={{ display: "flex", gap: "18px", alignItems: "flex-start" }}>
                  <div>
                    <div
                      style={{
                        fontSize: "11px",
                        fontWeight: 600,
                        color: "#64748b",
                        marginBottom: "4px",
                      }}
                    >
                      Método
                    </div>
                    {renderBadgeMetodo(log.v_Metodo)}
                  </div>

                  <div>
                    <div
                      style={{
                        fontSize: "11px",
                        fontWeight: 600,
                        color: "#64748b",
                        marginBottom: "4px",
                      }}
                    >
                      Código
                    </div>
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: "2px 10px",
                        borderRadius: "6px",
                        fontSize: "12px",
                        fontWeight: 700,
                        backgroundColor: statusColors.backgroundColor,
                        color: statusColors.color,
                      }}
                    >
                      {log.i_StatusCode}
                    </span>
                  </div>
                </div>

                {/* Duración y Tenant */}
                <div style={{ display: "flex", gap: "20px", alignItems: "flex-start" }}>
                  <div>
                    <div
                      style={{
                        fontSize: "11px",
                        fontWeight: 600,
                        color: "#64748b",
                        marginBottom: "3px",
                      }}
                    >
                      Duración
                    </div>
                    <div
                      style={{
                        fontSize: "13px",
                        fontWeight: 500,
                        color: "#1e293b",
                      }}
                    >
                      {log.i_DuracionMs} ms
                    </div>
                  </div>

                  <div>
                    <div
                      style={{
                        fontSize: "11px",
                        fontWeight: 600,
                        color: "#64748b",
                        marginBottom: "3px",
                      }}
                    >
                      Tenant
                    </div>
                    <div
                      style={{
                        fontSize: "13px",
                        fontWeight: 500,
                        color: "#1e293b",
                      }}
                    >
                      {log.i_CveTenant !== null && log.i_CveTenant !== undefined
                        ? log.i_CveTenant
                        : "—"}
                    </div>
                  </div>
                </div>
              </div>

              {/* Ruta completa en Roboto Mono */}
              <div>
                <div
                  style={{
                    fontSize: "11px",
                    fontWeight: 600,
                    color: "#475569",
                    marginBottom: "5px",
                  }}
                >
                  Ruta
                </div>
                <div
                  className="font-roboto-mono"
                  style={{
                    padding: "9px 12px",
                    backgroundColor: "#f8fafc",
                    border: "1px solid #e2e8f0",
                    borderRadius: "8px",
                    fontSize: "12.5px",
                    color: "#0f172a",
                    wordBreak: "break-all",
                  }}
                >
                  {log.v_Ruta || "—"}
                </div>
              </div>

              {/* Bloque Payload */}
              <div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: "5px",
                  }}
                >
                  <span
                    style={{
                      fontSize: "11px",
                      fontWeight: 600,
                      color: "#475569",
                    }}
                  >
                    Payload
                  </span>
                  {cargando && (
                    <span style={{ fontSize: "11px", color: "#64748b" }}>
                      Cargando contenido...
                    </span>
                  )}
                </div>
                <pre
                  className="font-roboto-mono custom-scrollbar"
                  style={{
                    margin: 0,
                    padding: "12px 14px",
                    backgroundColor: "#f8fafc",
                    border: "1px solid #e2e8f0",
                    borderRadius: "8px",
                    maxHeight: "300px",
                    overflow: "auto",
                    fontSize: "12px",
                    lineHeight: 1.5,
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                    color: payloadInfo.esVacio ? "#94a3b8" : "#1e293b",
                    fontStyle: payloadInfo.esVacio ? "italic" : "normal",
                  }}
                >
                  {cargando && log.v_Payload === null
                    ? "Cargando..."
                    : payloadInfo.texto}
                </pre>
              </div>

              {/* Bloque Respuesta */}
              <div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: "5px",
                  }}
                >
                  <span
                    style={{
                      fontSize: "11px",
                      fontWeight: 600,
                      color: "#475569",
                    }}
                  >
                    Respuesta
                  </span>
                </div>
                <pre
                  className="font-roboto-mono custom-scrollbar"
                  style={{
                    margin: 0,
                    padding: "12px 14px",
                    backgroundColor: "#f8fafc",
                    border: "1px solid #e2e8f0",
                    borderRadius: "8px",
                    maxHeight: "300px",
                    overflow: "auto",
                    fontSize: "12px",
                    lineHeight: 1.5,
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                    color: respuestaInfo.esVacio ? "#94a3b8" : "#1e293b",
                    fontStyle: respuestaInfo.esVacio ? "italic" : "normal",
                  }}
                >
                  {cargando && log.v_Respuesta === null
                    ? "Cargando..."
                    : respuestaInfo.texto}
                </pre>
              </div>
            </>
          ) : null}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: "12px 24px",
            borderTop: "1px solid #e2e8f0",
            display: "flex",
            justifyContent: "flex-end",
            backgroundColor: "#f8fafc",
          }}
        >
          <button
            type="button"
            className="btn btn-outline"
            onClick={onCerrar}
            style={{ height: "34px", padding: "0 18px", borderRadius: "8px" }}
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

