"use client";

import React from "react";
import {
  PROBABILIDADES_VALIDAS,
  PROBABILIDAD_TEXTO,
  PROBABILIDAD_TR,
  CONSECUENCIA_TEXTO,
  CONSECUENCIA_DESC,
  riskMatrix,
  magnitudColors,
} from "../pipcCatalogos";

interface ModalMatrizRiesgoProps {
  abierto: boolean;
  onCerrar: () => void;
}

const consOrden = ["DESASTROSAS", "CRITICAS", "MODERADAS", "POCO SIGNIFICATIVAS"];
const magnitudTextColors: Record<string, string> = {
  BAJO: "#ffffff",
  MEDIO: "#333333",
  ALTO: "#ffffff",
};

export const ModalMatrizRiesgo: React.FC<ModalMatrizRiesgoProps> = ({ abierto, onCerrar }) => {
  if (!abierto) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "rgba(0,0,0,0.45)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
      }}
      onClick={onCerrar}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: "12px",
          maxWidth: "920px",
          width: "100%",
          maxHeight: "90vh",
          overflowY: "auto",
          padding: "24px",
          boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "#1e293b", display: "flex", alignItems: "center", gap: "8px" }}>
            <i className="bi bi-grid-3x3" style={{ color: "#2B8FCC" }} />
            Matriz de Evaluación de Riesgos (5 × 4)
          </h3>
          <button
            type="button"
            onClick={onCerrar}
            style={{
              background: "transparent",
              border: "none",
              fontSize: "18px",
              cursor: "pointer",
              color: "#64748b",
            }}
          >
            <i className="bi bi-x-lg" />
          </button>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: "12px",
              minWidth: "680px",
            }}
          >
            <thead>
              <tr>
                <th
                  style={{
                    padding: "8px",
                    border: "1px solid #cbd5e1",
                    background: "#2B8FCC",
                    color: "#fff",
                    textAlign: "left",
                    width: "130px",
                  }}
                  rowSpan={2}
                >
                  Consecuencias
                </th>
                <th
                  style={{
                    padding: "8px",
                    border: "1px solid #cbd5e1",
                    background: "#2B8FCC",
                    color: "#fff",
                    textAlign: "left",
                  }}
                  rowSpan={2}
                >
                  Descripción
                </th>
                <th
                  style={{
                    padding: "8px",
                    border: "1px solid #cbd5e1",
                    background: "#2B8FCC",
                    color: "#fff",
                    textAlign: "center",
                  }}
                  colSpan={5}
                >
                  Probabilidad de ocurrencia
                </th>
              </tr>
              <tr>
                {PROBABILIDADES_VALIDAS.map((p) => (
                  <th
                    key={p}
                    style={{
                      padding: "6px",
                      border: "1px solid #cbd5e1",
                      background: "#e0f2fe",
                      color: "#0369a1",
                      textAlign: "center",
                      minWidth: "85px",
                    }}
                  >
                    <div style={{ fontWeight: 700 }}>{PROBABILIDAD_TEXTO[p]}</div>
                    <div style={{ fontWeight: 400, fontSize: "10px", color: "#64748b" }}>
                      ({PROBABILIDAD_TR[p]})
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {consOrden.map((c) => (
                <tr key={c}>
                  <td style={{ padding: "8px", border: "1px solid #cbd5e1", fontWeight: 700, color: "#1e293b" }}>
                    {CONSECUENCIA_TEXTO[c]}
                  </td>
                  <td style={{ padding: "8px", border: "1px solid #cbd5e1", color: "#475569", lineHeight: 1.4 }}>
                    {CONSECUENCIA_DESC[c]}
                  </td>
                  {PROBABILIDADES_VALIDAS.map((p) => {
                    const m = (riskMatrix as any)[p]?.[c] || "BAJO";
                    const bg = (magnitudColors as any)[m] || "#2e9e42";
                    const color = magnitudTextColors[m] || "#fff";
                    return (
                      <td
                        key={p}
                        style={{
                          padding: "6px",
                          border: "1px solid #cbd5e1",
                          textAlign: "center",
                          fontWeight: 700,
                          backgroundColor: bg,
                          color: color,
                        }}
                      >
                        {m.charAt(0) + m.slice(1).toLowerCase()}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p style={{ fontSize: "12px", color: "#64748b", marginTop: "14px", marginBottom: "16px", lineHeight: 1.5 }}>
          <strong>TR:</strong> Periodo de retorno del fenómeno en años. La magnitud del riesgo se calcula automáticamente al seleccionar Probabilidad y Consecuencia para cada agente perturbador.
        </p>

        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onCerrar}
            style={{
              padding: "6px 16px",
              borderRadius: "6px",
              cursor: "pointer",
            }}
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
