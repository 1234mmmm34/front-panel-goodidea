"use client";

import React, { useState } from "react";
import { PipcExpediente } from "../pipcCalculos";
import { ANEXOS_CATALOGO } from "../pipcCatalogos";

interface Props {
  expediente: PipcExpediente;
  toggleAnexo: (id: string) => void;
  marcarTodosAnexos: () => void;
  desmarcarTodosAnexos: () => void;
  agregarAnexoPersonalizado: (descripcion: string) => void;
  quitarAnexoPersonalizado: (id: string) => void;
  toggleAnexoPersonalizado: (id: string) => void;
  soloLectura?: boolean;
}

export const SeccionAnexos: React.FC<Props> = ({
  expediente,
  toggleAnexo,
  marcarTodosAnexos,
  desmarcarTodosAnexos,
  agregarAnexoPersonalizado,
  quitarAnexoPersonalizado,
  toggleAnexoPersonalizado,
  soloLectura = false,
}) => {
  const [nuevaDescripcion, setNuevaDescripcion] = useState("");

  const seleccionados = expediente.anexosSeleccionados || [];
  const personalizados = expediente.anexosPersonalizados || [];

  const totalCatalogo = ANEXOS_CATALOGO.length;
  const totalPersonalizados = personalizados.length;
  const totalTodos = totalCatalogo + totalPersonalizados;

  const marcadosCatalogo = seleccionados.length;
  const marcadosPersonalizados = personalizados.filter((p) => p.aplica).length;
  const totalMarcados = marcadosCatalogo + marcadosPersonalizados;

  const handleAgregar = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevaDescripcion.trim() || soloLectura) return;
    agregarAnexoPersonalizado(nuevaDescripcion.trim());
    setNuevaDescripcion("");
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <div className="card p-4">
        {/* Encabezado con contador y botones de marcar/desmarcar todos */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "12px",
            marginBottom: "16px",
            borderBottom: "1px solid #e2e8f0",
            paddingBottom: "12px",
          }}
        >
          <div style={{ borderLeft: "3px solid #2B8FCC", paddingLeft: "10px" }}>
            <h3 style={{ fontSize: "13px", fontWeight: 700, color: "#1e293b", textTransform: "uppercase", margin: 0 }}>
              Anexos documentales del PIPC
            </h3>
            <p style={{ fontSize: "11px", color: "#64748b", margin: 0 }}>
              Marca los documentos que aplican al expediente de esta empresa.
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span
              style={{
                backgroundColor: "#FEF3E2",
                color: "#B9770E",
                padding: "4px 10px",
                borderRadius: "16px",
                fontSize: "12px",
                fontWeight: 700,
                border: "1px solid #fed7aa",
              }}
            >
              Aplican {totalMarcados} de {totalTodos}
            </span>

            {!soloLectura && (
              <div style={{ display: "flex", gap: "6px" }}>
                <button
                  type="button"
                  onClick={marcarTodosAnexos}
                  className="btn btn-outline btn-sm"
                  style={{ fontSize: "11px", height: "28px", padding: "0 8px" }}
                >
                  Marcar todos
                </button>
                <button
                  type="button"
                  onClick={desmarcarTodosAnexos}
                  className="btn btn-outline btn-sm"
                  style={{ fontSize: "11px", height: "28px", padding: "0 8px" }}
                >
                  Desmarcar todos
                </button>
              </div>
            )}
          </div>
        </div>

        {/* 14 Anexos del catálogo */}
        <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "20px" }}>
          {ANEXOS_CATALOGO.map((item, idx) => {
            const checked = seleccionados.includes(item.id);
            return (
              <label
                key={item.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "8px 12px",
                  borderRadius: "6px",
                  backgroundColor: checked ? "#f0f7ff" : "#ffffff",
                  border: `1px solid ${checked ? "#bfdbfe" : "#e2e8f0"}`,
                  cursor: soloLectura ? "default" : "pointer",
                  transition: "all 0.12s ease",
                }}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  disabled={soloLectura}
                  onChange={() => toggleAnexo(item.id)}
                  style={{ width: "16px", height: "16px", accentColor: "#2B8FCC", cursor: soloLectura ? "default" : "pointer" }}
                />
                <span style={{ fontSize: "12px", fontWeight: 700, color: "#64748b", width: "22px" }}>
                  {idx + 1}.
                </span>
                <span style={{ fontSize: "12px", fontWeight: checked ? 600 : 400, color: "#1e293b", flex: 1 }}>
                  {item.descripcion}
                </span>
              </label>
            );
          })}
        </div>

        {/* Anexos personalizados */}
        {personalizados.length > 0 && (
          <div style={{ marginBottom: "16px" }}>
            <span style={{ fontSize: "12px", fontWeight: 700, color: "#334155", display: "block", marginBottom: "8px" }}>
              Anexos personalizados agregados
            </span>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              {personalizados.map((p, idx) => (
                <div
                  key={p.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "8px 12px",
                    borderRadius: "6px",
                    backgroundColor: p.aplica ? "#f0f7ff" : "#ffffff",
                    border: `1px solid ${p.aplica ? "#bfdbfe" : "#e2e8f0"}`,
                    gap: "8px",
                  }}
                >
                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      cursor: soloLectura ? "default" : "pointer",
                      flex: 1,
                      margin: 0,
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={p.aplica}
                      disabled={soloLectura}
                      onChange={() => toggleAnexoPersonalizado(p.id)}
                      style={{ width: "16px", height: "16px", accentColor: "#2B8FCC" }}
                    />
                    <span style={{ fontSize: "12px", fontWeight: 700, color: "#64748b" }}>
                      P{idx + 1}.
                    </span>
                    <span style={{ fontSize: "12px", fontWeight: p.aplica ? 600 : 400, color: "#1e293b" }}>
                      {p.descripcion}
                    </span>
                  </label>

                  {!soloLectura && (
                    <button
                      type="button"
                      onClick={() => quitarAnexoPersonalizado(p.id)}
                      className="btn-icon"
                      title="Quitar anexo personalizado"
                      style={{ color: "#94a3b8" }}
                    >
                      <i className="bi bi-x-lg" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Agregar anexo personalizado */}
        {!soloLectura && (
          <form
            onSubmit={handleAgregar}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              paddingTop: "12px",
              borderTop: "1px solid #e2e8f0",
            }}
          >
            <input
              type="text"
              className="form-control text-xs"
              value={nuevaDescripcion}
              onChange={(e) => setNuevaDescripcion(e.target.value)}
              placeholder="Descripción del anexo personalizado (ej. Permiso de uso de suelo)..."
              style={{ flex: 1, height: "32px" }}
            />
            <button
              type="submit"
              disabled={!nuevaDescripcion.trim()}
              className="btn btn-outline btn-sm"
              style={{ height: "32px", fontSize: "12px", whiteSpace: "nowrap" }}
            >
              + Agregar anexo
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
