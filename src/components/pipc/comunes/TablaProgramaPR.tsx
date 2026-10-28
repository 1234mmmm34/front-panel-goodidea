"use client";

import React from "react";
import { MESES_PROG } from "../pipcCatalogos";
import { ProgramaMantenimientoEquipos } from "../pipcCalculos";
import { TextoPendiente } from "./TextoPendiente";

interface Props {
  equipos: { equipo: string; cantidad?: string | number }[];
  programa: ProgramaMantenimientoEquipos;
  onChangePR: (equipo: string, mes: string, tipo: "p" | "r", valor: number) => void;
  onSincronizar?: () => void;
  titulo?: string;
  soloLectura?: boolean;
}

export const TablaProgramaPR: React.FC<Props> = ({
  equipos = [],
  programa = {},
  onChangePR,
  onSincronizar,
  titulo = "Programa anual de mantenimiento (P = Programado / R = Realizado)",
  soloLectura = false,
}) => {
  const equiposValidos = equipos.filter((e) => e.equipo && e.equipo.trim().length > 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "8px" }}>
        <span style={{ fontSize: "12px", fontWeight: 600, color: "#334155" }}>{titulo}</span>
        {!soloLectura && onSincronizar && (
          <button
            type="button"
            onClick={onSincronizar}
            className="btn btn-outline btn-sm"
            style={{
              fontSize: "11px",
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
              height: "28px",
              padding: "0 10px",
            }}
            title="Importar equipos desde el inventario"
          >
            <i className="bi bi-arrow-repeat" />
            <span>Sincronizar equipos</span>
          </button>
        )}
      </div>

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
        <table className="alegra-table alegra-table-compact" style={{ width: "100%", minWidth: "620px", fontSize: "11px" }}>
          <thead>
            <tr>
              <th style={{ minWidth: "160px" }}>Equipo</th>
              <th style={{ width: "24px", textAlign: "center" }}></th>
              {MESES_PROG.map((m) => (
                <th key={m} style={{ width: "36px", textAlign: "center", padding: "4px 2px" }}>
                  {m}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {equiposValidos.length === 0 ? (
              <tr>
                <td colSpan={14} style={{ textAlign: "center", color: "#94a3b8", padding: "16px", fontStyle: "italic" }}>
                  No hay equipos registrados. Agrega equipos arriba y haz clic en &ldquo;Sincronizar equipos&rdquo;.
                </td>
              </tr>
            ) : (
              equiposValidos.map((e) => {
                const nombreEquipo = e.equipo.trim();
                const dataEquipo = programa[nombreEquipo] || {};

                // Verifica si hay al menos una P o R marcada en algún mes
                const tieneMarcado = MESES_PROG.some((m) => {
                  const d = dataEquipo[m];
                  return (d?.p && d.p > 0) || (d?.r && d.r > 0);
                });
                const sinMeses = !tieneMarcado;
                const rowBg = sinMeses ? "#FDECEA" : undefined;

                return (
                  <React.Fragment key={nombreEquipo}>
                    {/* Fila P: Programado */}
                    <tr style={{ backgroundColor: rowBg || "#ffffff" }}>
                      <td
                        rowSpan={2}
                        style={{
                          verticalAlign: "middle",
                          fontWeight: 600,
                          color: "#1e293b",
                          borderRight: "1px solid #e2e8f0",
                          backgroundColor: rowBg || "#ffffff",
                          borderLeft: sinMeses ? "3px solid #DC3545" : undefined,
                          padding: "6px 10px",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
                          <span>{nombreEquipo}</span>
                          {sinMeses && (
                            <TextoPendiente
                              title="Selecciona al menos un mes"
                              style={{ fontSize: "11px", whiteSpace: "nowrap" }}
                            />
                          )}
                        </div>
                      </td>
                      <td
                        style={{
                          textAlign: "center",
                          fontWeight: 700,
                          color: "#2B8FCC",
                          backgroundColor: sinMeses ? "#FDECEA" : "#f0f7ff",
                          borderRight: "1px solid #e2e8f0",
                        }}
                      >
                        P
                      </td>
                      {MESES_PROG.map((m) => {
                        const val = dataEquipo[m]?.p ? 1 : 0;
                        return (
                          <td key={`p-${m}`} style={{ textAlign: "center", padding: "2px", backgroundColor: rowBg }}>
                            <input
                              type="checkbox"
                              checked={val === 1}
                              disabled={soloLectura}
                              onChange={(ev) => onChangePR(nombreEquipo, m, "p", ev.target.checked ? 1 : 0)}
                              style={{ width: "14px", height: "14px", cursor: soloLectura ? "default" : "pointer", accentColor: "#2B8FCC" }}
                            />
                          </td>
                        );
                      })}
                    </tr>

                    {/* Fila R: Realizado */}
                    <tr style={{ backgroundColor: rowBg || "#f8fafc", borderBottom: "2px solid #e2e8f0" }}>
                      <td
                        style={{
                          textAlign: "center",
                          fontWeight: 700,
                          color: "#16a34a",
                          backgroundColor: sinMeses ? "#FDECEA" : "#f0fdf4",
                          borderRight: "1px solid #e2e8f0",
                        }}
                      >
                        R
                      </td>
                      {MESES_PROG.map((m) => {
                        const val = dataEquipo[m]?.r ? 1 : 0;
                        return (
                          <td key={`r-${m}`} style={{ textAlign: "center", padding: "2px", backgroundColor: rowBg || "#f8fafc" }}>
                            <input
                              type="checkbox"
                              checked={val === 1}
                              disabled={soloLectura}
                              onChange={(ev) => onChangePR(nombreEquipo, m, "r", ev.target.checked ? 1 : 0)}
                              style={{ width: "14px", height: "14px", cursor: soloLectura ? "default" : "pointer", accentColor: "#16a34a" }}
                            />
                          </td>
                        );
                      })}
                    </tr>
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
