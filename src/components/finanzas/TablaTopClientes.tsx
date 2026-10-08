"use client";

import React from "react";
import { DashboardClienteSaldo } from "@/types/finanzas";

interface TablaTopClientesProps {
  topClientes: DashboardClienteSaldo[];
  totalPorCobrar: number;
  cargando: boolean;
}

const formatMoneda = (val: number): string => {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(val);
};

export const TablaTopClientes: React.FC<TablaTopClientesProps> = ({
  topClientes,
  totalPorCobrar,
  cargando,
}) => {
  if (cargando) {
    return (
      <div
        style={{
          backgroundColor: "#ffffff",
          borderRadius: "10px",
          padding: "20px",
          border: "1px solid #e2e8f0",
          boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
          display: "flex",
          flexDirection: "column",
          gap: "14px",
        }}
      >
        <div className="skeleton-box" style={{ width: "220px", height: "18px" }} />
        <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "10px" }}>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={`sk-row-${i}`} style={{ display: "flex", gap: "16px", alignItems: "center" }}>
              <div className="skeleton-box sm" style={{ width: "20px" }} />
              <div className="skeleton-box" style={{ width: "35%" }} />
              <div className="skeleton-box sm" style={{ width: "15%" }} />
              <div className="skeleton-box" style={{ width: "20%" }} />
              <div className="skeleton-box" style={{ width: "25%" }} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        backgroundColor: "#ffffff",
        borderRadius: "10px",
        padding: "20px",
        border: "1px solid #e2e8f0",
        boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
        <h3
          style={{
            fontSize: "15px",
            fontWeight: 700,
            color: "#0f172a",
            margin: 0,
          }}
        >
          Saldo pendiente por cliente
        </h3>
        <span style={{ fontSize: "12px", color: "#64748b" }}>
          Top 10 saldos pendientes
        </span>
      </div>

      {topClientes.length === 0 ? (
        <div
          style={{
            padding: "32px 16px",
            textAlign: "center",
            color: "#94a3b8",
            fontSize: "13px",
            backgroundColor: "#f8fafc",
            borderRadius: "8px",
            border: "1px dashed #cbd5e1",
          }}
        >
          No hay saldos pendientes a la fecha.
        </div>
      ) : (
        <div style={{ overflowX: "auto" }}>
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
                  borderBottom: "1px solid #e2e8f0",
                  backgroundColor: "#f8fafc",
                  color: "#64748b",
                  fontWeight: 600,
                  fontSize: "11px",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}
              >
                <th style={{ padding: "10px 12px", width: "40px" }}>#</th>
                <th style={{ padding: "10px 12px" }}>Cliente</th>
                <th style={{ padding: "10px 12px", textAlign: "center", width: "160px" }}>
                  Facturas con saldo
                </th>
                <th style={{ padding: "10px 12px", textAlign: "right", width: "160px" }}>
                  Saldo
                </th>
                <th style={{ padding: "10px 12px", width: "220px" }}>% de la cartera</th>
              </tr>
            </thead>
            <tbody>
              {topClientes.slice(0, 10).map((cliente, idx) => {
                const pctCartera =
                  totalPorCobrar > 0 ? (cliente.d_Saldo / totalPorCobrar) * 100 : 0;

                return (
                  <tr
                    key={cliente.i_CveEmpresa ?? `cli-${idx}`}
                    style={{
                      borderBottom: "1px solid #f1f5f9",
                      transition: "background-color 0.15s ease",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f8fafc")}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                  >
                    <td style={{ padding: "12px", color: "#94a3b8", fontWeight: 600 }}>
                      {idx + 1}
                    </td>
                    <td style={{ padding: "12px", color: "#1e293b", fontWeight: 600 }}>
                      {cliente.v_Empresa || "Sin nombre registrado"}
                    </td>
                    <td
                      style={{
                        padding: "12px",
                        textAlign: "center",
                        color: "#475569",
                        fontWeight: 500,
                      }}
                    >
                      {cliente.i_Facturas}
                    </td>
                    <td
                      style={{
                        padding: "12px",
                        textAlign: "right",
                        color: "#1e3a5f",
                        fontWeight: 700,
                      }}
                    >
                      {formatMoneda(cliente.d_Saldo)}
                    </td>
                    <td style={{ padding: "12px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <div
                          style={{
                            flex: 1,
                            height: "6px",
                            backgroundColor: "#f1f5f9",
                            borderRadius: "3px",
                            overflow: "hidden",
                          }}
                        >
                          <div
                            style={{
                              height: "100%",
                              width: `${Math.min(pctCartera, 100)}%`,
                              backgroundColor: "#2B8FCC",
                              borderRadius: "3px",
                            }}
                          />
                        </div>
                        <span
                          style={{
                            fontSize: "11px",
                            fontWeight: 600,
                            color: "#475569",
                            width: "45px",
                            textAlign: "right",
                          }}
                        >
                          {pctCartera.toFixed(1)}%
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
