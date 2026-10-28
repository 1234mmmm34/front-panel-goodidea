"use client";

import React from "react";
import {
  AgenteCatalogo,
  PROBABILIDADES_VALIDAS,
  PROBABILIDAD_TEXTO,
  PROBABILIDAD_TR,
  CONSECUENCIA_TEXTO,
} from "../pipcCatalogos";
import {
  AgenteEvaluado,
  calcMagnitud,
  colorMagnitud,
  migrateProbabilidad,
  migrateConsecuencia,
  estadoEvaluacionAgente,
} from "../pipcCalculos";
import { TextoPendiente } from "./TextoPendiente";

interface Props {
  agente: AgenteCatalogo;
  evaluacion: AgenteEvaluado;
  onChange: (cambios: Partial<AgenteEvaluado>) => void;
  soloLectura?: boolean;
}

const consOrden = ["POCO SIGNIFICATIVAS", "MODERADAS", "CRITICAS", "DESASTROSAS"];

export const TarjetaAgente: React.FC<Props> = ({
  agente,
  evaluacion,
  onChange,
  soloLectura = false,
}) => {
  const prob = migrateProbabilidad(evaluacion?.probabilidad);
  const cons = migrateConsecuencia(evaluacion?.consecuencia);
  const noAplica = !!evaluacion?.noAplica;
  const texto = evaluacion?.texto !== undefined ? evaluacion.texto : agente.textoWord || "";
  const mag = calcMagnitud(prob, cons);
  const colorMag = colorMagnitud(mag);
  const estado = estadoEvaluacionAgente(evaluacion);

  const getBadgeEstado = () => {
    switch (estado) {
      case "completo":
        return <span className="badge badge-soft-green" style={{ fontSize: "11px" }}>Evaluado</span>;
      case "no_aplica":
        return <span className="badge badge-secondary" style={{ fontSize: "11px" }}>No aplica</span>;
      case "falta_probabilidad":
        return <span className="badge badge-warning" style={{ fontSize: "11px" }}>Falta Probabilidad</span>;
      case "falta_consecuencia":
        return <span className="badge badge-warning" style={{ fontSize: "11px" }}>Falta Consecuencia</span>;
      case "falta_ambos":
      default:
        return <TextoPendiente title="Falta evaluar el agente (probabilidad y consecuencia)" />;
    }
  };

  return (
    <div
      style={{
        borderRadius: "8px",
        border: `1px solid ${noAplica ? "#e2e8f0" : estado === "completo" ? "#bbf7d0" : "#fed7aa"}`,
        backgroundColor: noAplica ? "#f8fafc" : "#ffffff",
        padding: "14px",
        marginBottom: "12px",
        opacity: noAplica ? 0.55 : 1,
        transition: "all 0.15s ease",
      }}
    >
      {/* Header de la tarjeta */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "8px",
          marginBottom: noAplica ? "0px" : "12px",
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
          <span className="badge badge-light" style={{ fontSize: "11px", border: "1px solid #cbd5e1" }}>
            {agente.clave}
          </span>
          <span style={{ fontSize: "13px", fontWeight: 700, color: "#1e293b" }}>
            {agente.nombre}
          </span>
          {getBadgeEstado()}
        </div>

        {!soloLectura && (
          <button
            type="button"
            onClick={() => onChange({ noAplica: !noAplica })}
            style={{
              fontSize: "11px",
              fontWeight: 600,
              padding: "3px 12px",
              borderRadius: "20px",
              border: `1.5px solid ${noAplica ? "#dc2626" : "#cbd5e1"}`,
              backgroundColor: noAplica ? "#dc2626" : "#ffffff",
              color: noAplica ? "#ffffff" : "#64748b",
              cursor: "pointer",
              whiteSpace: "nowrap",
              transition: "all 0.12s ease",
            }}
          >
            {noAplica ? "✓ No aplica" : "No aplica"}
          </button>
        )}
      </div>

      {/* Cuerpo de la tarjeta */}
      {!noAplica && (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <div>
            <label
              style={{
                fontSize: "11px",
                fontWeight: 600,
                color: "#64748b",
                display: "block",
                marginBottom: "4px",
              }}
            >
              Redacción para el documento{" "}
              <span style={{ color: "#94a3b8", fontWeight: 400 }}>
                (personalizable)
              </span>
            </label>
            <textarea
              className="form-control"
              rows={3}
              value={texto}
              disabled={soloLectura}
              onChange={(e) => onChange({ texto: e.target.value })}
              style={{ fontSize: "12px", lineHeight: "1.4" }}
            />
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: "10px",
              alignItems: "flex-end",
            }}
          >
            <div>
              <label style={{ fontSize: "11px", fontWeight: 600, color: "#64748b", marginBottom: "4px", display: "block" }}>
                Probabilidad de ocurrencia
              </label>
              <select
                className="form-select form-select-sm"
                value={prob}
                disabled={soloLectura}
                onChange={(e) => onChange({ probabilidad: e.target.value })}
                style={{ fontSize: "12px" }}
              >
                <option value="">— Sin evaluar —</option>
                {PROBABILIDADES_VALIDAS.map((opt) => (
                  <option key={opt} value={opt}>
                    {PROBABILIDAD_TEXTO[opt]} ({PROBABILIDAD_TR[opt]})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ fontSize: "11px", fontWeight: 600, color: "#64748b", marginBottom: "4px", display: "block" }}>
                Consecuencia
              </label>
              <select
                className="form-select form-select-sm"
                value={cons}
                disabled={soloLectura}
                onChange={(e) => onChange({ consecuencia: e.target.value })}
                style={{ fontSize: "12px" }}
              >
                <option value="">— Sin evaluar —</option>
                {consOrden.map((opt) => (
                  <option key={opt} value={opt}>
                    {CONSECUENCIA_TEXTO[opt]}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "8px", minHeight: "31px" }}>
              <span style={{ fontSize: "11px", fontWeight: 700, color: "#64748b" }}>
                MAGNITUD:
              </span>
              {mag ? (
                <span
                  style={{
                    backgroundColor: colorMag,
                    color: mag === "MEDIO" ? "#1e293b" : "#ffffff",
                    fontSize: "11px",
                    fontWeight: 700,
                    padding: "4px 12px",
                    borderRadius: "12px",
                  }}
                >
                  {mag}
                </span>
              ) : (
                <TextoPendiente
                  title="Falta evaluar probabilidad y/o consecuencia"
                  style={{ fontSize: "11px" }}
                />
              )}
            </div>
          </div>

          {(agente.brigadas_texto || agente.recursos) && (
            <div style={{ fontSize: "11px", color: "#64748b", background: "#f8fafc", padding: "6px 10px", borderRadius: "6px" }}>
              {agente.brigadas_texto && (
                <span>
                  <strong>Brigadas requeridas:</strong> {agente.brigadas_texto}
                </span>
              )}
              {agente.brigadas_texto && agente.recursos && <span> · </span>}
              {agente.recursos && (
                <span>
                  <strong>Recursos mínimos:</strong> {agente.recursos}
                </span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
