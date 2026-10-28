"use client";

import React from "react";
import { TextoPendiente } from "./TextoPendiente";

export interface ColumnaEditable {
  key: string;
  label: string;
  placeholder?: string;
  type?: "text" | "number" | "tel" | "select";
  options?: string[];
  width?: string;
  readOnly?: boolean;
}

interface Props {
  columnas: ColumnaEditable[];
  filas: any[];
  onChangeFila: (index: number, key: string, valor: any) => void;
  onAgregarFila?: () => void;
  onQuitarFila?: (index: number) => void;
  textoBotonAgregar?: string;
  soloLectura?: boolean;
  className?: string;
  isRowPending?: (row: any) => boolean;
  pendingTitle?: string;
}

export const TablaEditable: React.FC<Props> = ({
  columnas,
  filas = [],
  onChangeFila,
  onAgregarFila,
  onQuitarFila,
  textoBotonAgregar = "Agregar renglón",
  soloLectura = false,
  className = "",
  isRowPending,
  pendingTitle = "Selecciona al menos un mes",
}) => {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }} className={className}>
      <div
        className="alegra-table-container"
        style={{
          overflowX: "auto",
          maxWidth: "100%",
          borderRadius: "8px",
          border: "1px solid #e2e8f0",
          backgroundColor: "#ffffff",
        }}
      >
        <table className="alegra-table alegra-table-compact" style={{ width: "100%", minWidth: "480px" }}>
          <thead>
            <tr>
              <th style={{ width: "42px", textAlign: "center" }}>#</th>
              {columnas.map((col) => (
                <th key={col.key} style={{ width: col.width || "auto" }}>
                  {col.label}
                </th>
              ))}
              {!soloLectura && onQuitarFila && (
                <th style={{ width: "42px", textAlign: "center" }}></th>
              )}
            </tr>
          </thead>
          <tbody>
            {filas.length === 0 ? (
              <tr>
                <td
                  colSpan={columnas.length + (soloLectura || !onQuitarFila ? 1 : 2)}
                  style={{ textAlign: "center", color: "#94a3b8", padding: "16px", fontStyle: "italic" }}
                >
                  Sin registros
                </td>
              </tr>
            ) : (
              filas.map((row, idx) => {
                const isPending = isRowPending ? isRowPending(row) : false;
                const rowBg = isPending ? "#FDECEA" : undefined;

                return (
                  <tr key={`row-${idx}`} style={{ backgroundColor: rowBg }}>
                    <td
                      style={{
                        textAlign: "center",
                        color: "#64748b",
                        fontWeight: 500,
                        fontSize: "11px",
                        backgroundColor: rowBg,
                        borderLeft: isPending ? "3px solid #DC3545" : undefined,
                      }}
                    >
                      {idx + 1}
                    </td>
                    {columnas.map((col, colIdx) => {
                      const valor = row[col.key] ?? "";
                      const isReadOnly = soloLectura || col.readOnly;
                      const isFirstEditableField = colIdx === 0;

                      return (
                        <td key={`${col.key}-${idx}`} style={{ padding: "4px 8px", backgroundColor: rowBg }}>
                          {col.type === "select" ? (
                            <select
                              className="form-select"
                              value={valor}
                              disabled={isReadOnly}
                              onChange={(e) => onChangeFila(idx, col.key, e.target.value)}
                              style={{
                                fontSize: "12px",
                                padding: "4px 8px",
                                height: "32px",
                                width: "100%",
                                backgroundColor: isReadOnly ? "#f8fafc" : (rowBg || "#ffffff"),
                              }}
                            >
                              {(col.options || []).map((opt) => (
                                <option key={opt} value={opt}>
                                  {opt || "— Seleccionar mes —"}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                              <input
                                type={col.type || "text"}
                                className="form-control"
                                value={valor}
                                disabled={isReadOnly}
                                placeholder={col.placeholder || ""}
                                onChange={(e) => onChangeFila(idx, col.key, e.target.value)}
                                style={{
                                  fontSize: "12px",
                                  padding: "4px 8px",
                                  height: "32px",
                                  width: "100%",
                                  backgroundColor: isReadOnly ? "#f8fafc" : (rowBg || "#ffffff"),
                                }}
                              />
                              {isPending && isFirstEditableField && (
                                <TextoPendiente
                                  title={pendingTitle}
                                  style={{ fontSize: "11px", whiteSpace: "nowrap" }}
                                />
                              )}
                            </div>
                          )}
                        </td>
                      );
                    })}
                    {!soloLectura && onQuitarFila && (
                      <td style={{ textAlign: "center", padding: "4px", backgroundColor: rowBg }}>
                      <button
                        type="button"
                        onClick={() => onQuitarFila(idx)}
                        className="btn-icon"
                        title="Quitar renglón"
                        style={{
                          color: "#94a3b8",
                          width: "28px",
                          height: "28px",
                          borderRadius: "4px",
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          border: "none",
                          background: "transparent",
                          cursor: "pointer",
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = "#dc2626")}
                        onMouseLeave={(e) => (e.currentTarget.style.color = "#94a3b8")}
                      >
                        <i className="bi bi-x-lg" style={{ fontSize: "13px" }} />
                      </button>
                    </td>
                  )}
                </tr>
              );
            })
          )}
          </tbody>
        </table>
      </div>

      {!soloLectura && onAgregarFila && (
        <div style={{ display: "flex", justifyContent: "flex-start" }}>
          <button
            type="button"
            onClick={onAgregarFila}
            className="btn btn-outline btn-sm"
            style={{
              fontSize: "12px",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "4px 12px",
              height: "32px",
            }}
          >
            <i className="bi bi-plus-lg" />
            <span>{textoBotonAgregar}</span>
          </button>
        </div>
      )}
    </div>
  );
};
