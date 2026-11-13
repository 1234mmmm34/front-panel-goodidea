"use client";

import React from "react";
import {
  DashboardProyecto,
  formatearFechaMesAbrev,
  formatearAsesoresIniciales,
} from "@/types/dashboardProyectos";

interface TablaProyectosMas30DiasProps {
  proyectos: DashboardProyecto[];
  inicialesMap: Map<string, string>;
  cargando: boolean;
}

export const TablaProyectosMas30Dias: React.FC<TablaProyectosMas30DiasProps> = ({
  proyectos,
  inicialesMap,
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
        <div
          className="skeleton-box"
          style={{ width: "260px", height: "18px" }}
        />
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "10px",
            marginTop: "10px",
          }}
        >
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={`sk-row-p30-${i}`}
              style={{ display: "flex", gap: "16px", alignItems: "center" }}
            >
              <div className="skeleton-box sm" style={{ width: "12%" }} />
              <div className="skeleton-box" style={{ width: "22%" }} />
              <div className="skeleton-box" style={{ width: "28%" }} />
              <div className="skeleton-box sm" style={{ width: "18%" }} />
              <div className="skeleton-box sm" style={{ width: "10%" }} />
              <div className="skeleton-box sm" style={{ width: "10%" }} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const proyectosMas30 = proyectos
    .filter((p) => p.b_MasDe30Dias)
    .sort(
      (a, b) => (b.i_DiasTranscurridos ?? 0) - (a.i_DiasTranscurridos ?? 0)
    );

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
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "12px",
          flexWrap: "wrap",
          marginBottom: "16px",
        }}
      >
        <h3
          style={{
            fontSize: "15px",
            fontWeight: 700,
            color: "#0f172a",
            margin: 0,
          }}
        >
          Detalle de proyectos con más de 30 días
        </h3>
        <span style={{ fontSize: "13px", color: "#64748b" }}>
          Ordenados por días transcurridos
        </span>
      </div>

      {proyectosMas30.length === 0 ? (
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
          Sin proyectos con más de 30 días
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
                <th style={{ padding: "10px 12px" }}>Asesor</th>
                <th style={{ padding: "10px 12px" }}>Cliente</th>
                <th style={{ padding: "10px 12px" }}>Proyecto</th>
                <th style={{ padding: "10px 12px" }}>Rubro</th>
                <th style={{ padding: "10px 12px" }}>Inicio</th>
                <th style={{ padding: "10px 12px", textAlign: "right" }}>
                  Días
                </th>
              </tr>
            </thead>
            <tbody>
              {proyectosMas30.map((p) => {
                const esServicio = p.v_TipoServicio === "Servicios";

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
                    <td style={{ padding: "12px", color: "#64748b" }}>
                      {p.v_Rubro}
                    </td>
                    <td style={{ padding: "12px", color: "#1e293b" }}>
                      {formatearFechaMesAbrev(p.d_FechaInicio)}
                    </td>
                    <td style={{ padding: "12px", textAlign: "right" }}>
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
                        {p.i_DiasTranscurridos ?? 0} días
                      </span>
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

