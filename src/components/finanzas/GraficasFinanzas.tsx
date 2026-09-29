"use client";

import React from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from "recharts";
import { DashboardMes, DashboardAntiguedad } from "@/types/finanzas";
import { formatearFechaBonita } from "@/lib/date-utils";

interface GraficasFinanzasProps {
  serieMensual: DashboardMes[];
  antiguedad: DashboardAntiguedad[];
  fechaCorte?: string;
  fechaFin?: string;
  cargando: boolean;
}

const COLOR_ORDEN: Record<number, string> = {
  1: "#2B8FCC", // Por vencer
  2: "#f5b942", // 1-30 días
  3: "#f08c3a", // 31-60 días
  4: "#e35d3a", // 61-90 días
  5: "#b91c1c", // Más de 90 días
  6: "#9ca3af", // Sin programar
};

function formatearMesEjeX(mesIso?: string): string {
  if (!mesIso) return "";
  const clean = mesIso.split("T")[0];
  const parts = clean.split("-");
  if (parts.length < 2) return mesIso;
  const year = parts[0];
  const monthIdx = parseInt(parts[1], 10) - 1;
  const meses = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
  return `${meses[monthIdx] || ""} ${year}`;
}

function formatMoneda(val: number): string {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(val);
}

function formatShortCurrency(val: number): string {
  if (val >= 1000000) return `$${(val / 1000000).toFixed(1)}M`;
  if (val >= 1000) return `$${(val / 1000).toFixed(0)}k`;
  return `$${val}`;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div
        style={{
          backgroundColor: "#0f172a",
          color: "#ffffff",
          padding: "10px 14px",
          borderRadius: "8px",
          fontSize: "12px",
          boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
        }}
      >
        <p style={{ margin: "0 0 6px 0", fontWeight: 600, color: "#cbd5e1" }}>{label}</p>
        {payload.map((entry: any, index: number) => (
          <div
            key={`tt-${index}`}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              marginBottom: index === payload.length - 1 ? 0 : "4px",
            }}
          >
            <div
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                backgroundColor: entry.color,
              }}
            />
            <span style={{ color: "#94a3b8" }}>{entry.name}:</span>
            <span style={{ fontWeight: 600 }}>{formatMoneda(entry.value)}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export const GraficasFinanzas: React.FC<GraficasFinanzasProps> = ({
  serieMensual,
  antiguedad,
  fechaCorte,
  fechaFin,
  cargando,
}) => {
  if (cargando) {
    return (
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "60% 40%",
          gap: "16px",
        }}
        className="graficas-responsive-grid"
      >
        <div
          style={{
            backgroundColor: "#ffffff",
            borderRadius: "10px",
            padding: "20px",
            border: "1px solid #e2e8f0",
            height: "360px",
            display: "flex",
            flexDirection: "column",
            gap: "16px",
          }}
        >
          <div className="skeleton-box" style={{ width: "200px", height: "18px" }} />
          <div className="skeleton-box" style={{ width: "100%", height: "260px", borderRadius: "8px" }} />
        </div>

        <div
          style={{
            backgroundColor: "#ffffff",
            borderRadius: "10px",
            padding: "20px",
            border: "1px solid #e2e8f0",
            height: "360px",
            display: "flex",
            flexDirection: "column",
            gap: "16px",
          }}
        >
          <div className="skeleton-box" style={{ width: "180px", height: "18px" }} />
          <div className="skeleton-box" style={{ width: "100%", height: "260px", borderRadius: "8px" }} />
        </div>
      </div>
    );
  }

  // Formatear serie mensual para Recharts
  const dataChart = serieMensual.map((item) => ({
    mesOriginal: item.d_Mes,
    mesFormateado: formatearMesEjeX(item.d_Mes),
    Facturado: item.d_Facturado,
    Cobrado: item.d_Cobrado,
  }));

  // Calcular monto máximo en antigüedad de cartera para la barra
  const maxAntiguedad = Math.max(...antiguedad.map((a) => a.d_Monto), 1);
  const totalAntiguedad = antiguedad.reduce((acc, curr) => acc + curr.d_Monto, 0);

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1.5fr 1fr",
        gap: "16px",
      }}
      className="graficas-responsive-grid"
    >
      {/* 4.1 Facturado vs Cobrado por mes */}
      <div
        style={{
          backgroundColor: "#ffffff",
          borderRadius: "10px",
          padding: "20px",
          border: "1px solid #e2e8f0",
          boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <h3
          style={{
            fontSize: "15px",
            fontWeight: 700,
            color: "#0f172a",
            margin: "0 0 16px 0",
          }}
        >
          Facturado vs Cobrado por mes
        </h3>

        {dataChart.length === 0 ? (
          <div
            style={{
              height: "280px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#94a3b8",
              fontSize: "13px",
            }}
          >
            No hay información para el periodo seleccionado.
          </div>
        ) : (
          <div style={{ width: "100%", height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dataChart} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="mesFormateado"
                  tick={{ fontSize: 11, fill: "#64748b" }}
                  axisLine={{ stroke: "#cbd5e1" }}
                  tickLine={false}
                />
                <YAxis
                  tickFormatter={formatShortCurrency}
                  tick={{ fontSize: 11, fill: "#64748b" }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  verticalAlign="top"
                  align="right"
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{ fontSize: "12px", paddingBottom: "10px" }}
                />
                <Bar dataKey="Facturado" fill="#2B8FCC" radius={[4, 4, 0, 0]} maxBarSize={40} />
                <Bar dataKey="Cobrado" fill="#14b8a6" radius={[4, 4, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* 4.2 Antigüedad de la cartera */}
      <div
        style={{
          backgroundColor: "#ffffff",
          borderRadius: "10px",
          padding: "20px",
          border: "1px solid #e2e8f0",
          boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
        }}
      >
        <div>
          <h3
            style={{
              fontSize: "15px",
              fontWeight: 700,
              color: "#0f172a",
              margin: "0 0 16px 0",
            }}
          >
            Antigüedad de la cartera
          </h3>

          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {antiguedad.map((item) => {
              const color = COLOR_ORDEN[item.i_Orden] || "#9ca3af";
              const pctWidth = maxAntiguedad > 0 ? (item.d_Monto / maxAntiguedad) * 100 : 0;
              const pctTotal = totalAntiguedad > 0 ? ((item.d_Monto / totalAntiguedad) * 100).toFixed(1) : "0";

              return (
                <div key={`antig-${item.i_Orden}`} style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
                    <span style={{ fontWeight: 500, color: "#334155" }}>{item.v_Rango}</span>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <span style={{ fontWeight: 700, color: "#0f172a" }}>{formatMoneda(item.d_Monto)}</span>
                      <span style={{ fontSize: "11px", color: "#94a3b8" }}>({pctTotal}%)</span>
                    </div>
                  </div>

                  {/* Barra horizontal */}
                  <div
                    style={{
                      width: "100%",
                      height: "8px",
                      backgroundColor: "#f1f5f9",
                      borderRadius: "4px",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        width: `${Math.max(pctWidth, item.d_Monto > 0 ? 3 : 0)}%`,
                        backgroundColor: color,
                        borderRadius: "4px",
                        transition: "width 0.3s ease",
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer de Cartera */}
        <div style={{ marginTop: "16px", paddingTop: "12px", borderTop: "1px solid #f1f5f9", textAlign: "right" }}>
          <span style={{ fontSize: "12px", color: "#94a3b8" }}>
            Cartera al {formatearFechaBonita(fechaCorte || fechaFin)}
          </span>
        </div>
      </div>
    </div>
  );
};
