"use client";

import React from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from "recharts";
import { Info } from "lucide-react";
import { DashboardMes, DashboardAntiguedad } from "@/types/finanzas";
import { formatearFechaBonita } from "@/lib/date-utils";

interface GraficasFinanzasProps {
  serieMensual: DashboardMes[];
  antiguedad: DashboardAntiguedad[];
  fechaInicio?: string;
  fechaFin?: string;
  fechaCorte?: string;
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

const MESES_MIN = [
  "ene",
  "feb",
  "mar",
  "abr",
  "may",
  "jun",
  "jul",
  "ago",
  "sep",
  "oct",
  "nov",
  "dic",
];

function formatMoneda(val: number): string {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(val);
}

function formatShortCurrency(val: number): string {
  if (val === 0) return "$0";
  if (val >= 1000000) {
    const formatted = (val / 1000000).toFixed(val % 1000000 === 0 ? 0 : 1);
    return `$${formatted} M`;
  }
  if (val >= 1000) {
    const formatted = (val / 1000).toFixed(val % 1000 === 0 ? 0 : 0);
    return `$${formatted} K`;
  }
  return `$${val}`;
}

function formatearRangoLeyenda(
  fechaInicioIso?: string,
  fechaFinIso?: string,
  restarAnios: number = 0
): string {
  if (!fechaInicioIso || !fechaFinIso) return "";

  const formatearFecha = (iso: string, shift: number) => {
    const parts = iso.split("T")[0].split("-");
    if (parts.length < 3) return iso;
    const year = parseInt(parts[0], 10) - shift;
    const monthIdx = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    return `${day} ${MESES_MIN[monthIdx] || ""} ${year}`;
  };

  return `${formatearFecha(fechaInicioIso, restarAnios)} - ${formatearFecha(
    fechaFinIso,
    restarAnios
  )}`;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
}

const CustomVentasTooltip: React.FC<CustomTooltipProps> = ({
  active,
  payload,
}) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
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
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            marginBottom: "4px",
          }}
        >
          <div
            style={{
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              backgroundColor: "#3f51b5",
            }}
          />
          <span style={{ color: "#cbd5e1" }}>{data.mesActualCompleto}:</span>
          <span style={{ fontWeight: 600 }}>{formatMoneda(data.d_Venta)}</span>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <div
            style={{
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              backgroundColor: "#34d399",
            }}
          />
          <span style={{ color: "#cbd5e1" }}>{data.mesAnteriorCompleto}:</span>
          <span style={{ fontWeight: 600 }}>
            {formatMoneda(data.d_VentaAnterior)}
          </span>
        </div>
      </div>
    );
  }
  return null;
};

export const GraficasFinanzas: React.FC<GraficasFinanzasProps> = ({
  serieMensual,
  antiguedad,
  fechaInicio,
  fechaFin,
  fechaCorte,
  cargando,
}) => {
  if (cargando) {
    return (
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1.5fr 1fr",
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
            height: "380px",
            display: "flex",
            flexDirection: "column",
            gap: "16px",
          }}
        >
          <div
            className="skeleton-box"
            style={{ width: "200px", height: "18px" }}
          />
          <div
            className="skeleton-box"
            style={{ width: "100%", height: "280px", borderRadius: "8px" }}
          />
        </div>

        <div
          style={{
            backgroundColor: "#ffffff",
            borderRadius: "10px",
            padding: "20px",
            border: "1px solid #e2e8f0",
            height: "380px",
            display: "flex",
            flexDirection: "column",
            gap: "16px",
          }}
        >
          <div
            className="skeleton-box"
            style={{ width: "180px", height: "18px" }}
          />
          <div
            className="skeleton-box"
            style={{ width: "100%", height: "280px", borderRadius: "8px" }}
          />
        </div>
      </div>
    );
  }

  // 1. Cálculos de totales y variación
  const sumaVentaActual = serieMensual.reduce(
    (acc, m) => acc + (Number(m.d_Venta) || 0),
    0
  );
  const sumaVentaAnterior = serieMensual.reduce(
    (acc, m) => acc + (Number(m.d_VentaAnterior) || 0),
    0
  );

  const tieneVentaAnterior = sumaVentaAnterior > 0;
  const variacionPct = tieneVentaAnterior
    ? Math.round(
        ((sumaVentaActual - sumaVentaAnterior) / sumaVentaAnterior) * 100
      )
    : null;

  const sinDatosVentas =
    serieMensual.length === 0 ||
    (sumaVentaActual === 0 && sumaVentaAnterior === 0);

  // 2. Orden cronológico de izquierda a derecha
  const mesesCronologicos = [...serieMensual].sort((a, b) => {
    const fechaA = new Date(a.d_Mes).getTime();
    const fechaB = new Date(b.d_Mes).getTime();
    return fechaA - fechaB;
  });

  // 3. Mapear datos para Recharts
  const dataChart = mesesCronologicos.map((item) => {
    const clean = (item.d_Mes || "").split("T")[0];
    const parts = clean.split("-");
    const yearStr = parts[0] || "";
    const monthIdx = parseInt(parts[1] || "1", 10) - 1;
    const mesNombre = MESES_MIN[monthIdx] || "";
    const yearAnteriorStr = yearStr ? String(Number(yearStr) - 1) : "";

    return {
      mesKey: item.d_Mes,
      mesLabel: mesNombre,
      mesActualCompleto: `${mesNombre} ${yearStr}`,
      mesAnteriorCompleto: `${mesNombre} ${yearAnteriorStr}`,
      d_Venta: Number(item.d_Venta) || 0,
      d_VentaAnterior: Number(item.d_VentaAnterior) || 0,
    };
  });

  // 4. Fechas para la leyenda
  const fInicioReal =
    fechaInicio ||
    (mesesCronologicos.length > 0 ? mesesCronologicos[0].d_Mes : "");
  const fFinReal =
    fechaFin ||
    (mesesCronologicos.length > 0
      ? mesesCronologicos[mesesCronologicos.length - 1].d_Mes
      : "");

  const rangoActualStr =
    formatearRangoLeyenda(fInicioReal, fFinReal, 0) || "Periodo actual";
  const rangoAnteriorStr =
    formatearRangoLeyenda(fInicioReal, fFinReal, 1) || "Año anterior";

  // 5. Cálculos para la gráfica de Antigüedad de Cartera
  const maxAntiguedad = Math.max(...antiguedad.map((a) => a.d_Monto), 1);
  const totalAntiguedad = antiguedad.reduce(
    (acc, curr) => acc + curr.d_Monto,
    0
  );

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1.5fr 1fr",
        gap: "16px",
      }}
      className="graficas-responsive-grid"
    >
      {/* 4.1 Card: Total de ventas (Líneas) */}
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
        {/* Encabezado */}
        <div>
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              gap: "16px",
              flexWrap: "wrap",
              marginBottom: "4px",
            }}
          >
            {/* Izquierda: Título subrayado + Ícono Info */}
            <div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <h3
                  style={{
                    fontSize: "15px",
                    fontWeight: 700,
                    color: "#0f172a",
                    margin: 0,
                    textDecoration: "underline",
                    textUnderlineOffset: "3px",
                  }}
                >
                  Total de ventas
                </h3>
                <span
                  title="Compara las ventas de cada mes del periodo contra el mismo mes del año anterior. Una venta cuenta en el mes en que inicia el servicio."
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    cursor: "help",
                  }}
                >
                  <Info size={15} style={{ color: "#94a3b8" }} />
                </span>
              </div>
              <p
                style={{
                  fontSize: "12px",
                  color: "#64748b",
                  margin: "4px 0 0 0",
                }}
              >
                La gráfica muestra el valor de tus ventas con impuestos incluidos.
              </p>
            </div>

            {/* Derecha: Total del periodo + Variación */}
            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                gap: "10px",
                textAlign: "right",
              }}
            >
              <span
                style={{
                  fontSize: "22px",
                  fontWeight: 700,
                  color: "#0f172a",
                  letterSpacing: "-0.5px",
                }}
              >
                {formatMoneda(sumaVentaActual)}
              </span>

              {variacionPct !== null && (
                <span
                  style={{
                    fontSize: "14px",
                    fontWeight: 600,
                    color: variacionPct >= 0 ? "#22c55e" : "#ef4444",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "2px",
                  }}
                >
                  {variacionPct >= 0 ? `↑ ${variacionPct}%` : `↓ ${Math.abs(variacionPct)}%`}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Cuerpo / Gráfica de Líneas */}
        <div style={{ marginTop: "16px" }}>
          {sinDatosVentas ? (
            <div
              style={{
                height: "260px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#94a3b8",
                fontSize: "13px",
                backgroundColor: "#f8fafc",
                borderRadius: "8px",
                border: "1px dashed #cbd5e1",
              }}
            >
              No hay ventas en el periodo seleccionado.
            </div>
          ) : (
            <div style={{ width: "100%", height: 260 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={dataChart}
                  margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#f1f5f9"
                  />
                  <XAxis
                    dataKey="mesLabel"
                    interval={0}
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
                  <Tooltip
                    content={<CustomVentasTooltip />}
                    cursor={{ stroke: "#cbd5e1", strokeDasharray: "3 3" }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    align="center"
                    iconType="circle"
                    iconSize={8}
                    wrapperStyle={{ fontSize: "12px", paddingTop: "14px" }}
                  />
                  {/* Periodo actual: línea continua azul #3f51b5, 2px */}
                  <Line
                    type="linear"
                    dataKey="d_Venta"
                    name={rangoActualStr}
                    stroke="#3f51b5"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4, fill: "#3f51b5" }}
                  />
                  {/* Año anterior: línea punteada verde #34d399, 3px */}
                  <Line
                    type="linear"
                    dataKey="d_VentaAnterior"
                    name={rangoAnteriorStr}
                    stroke="#34d399"
                    strokeWidth={3}
                    strokeDasharray="4 4"
                    dot={false}
                    activeDot={{ r: 4, fill: "#34d399" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* 4.2 Card: Antigüedad de la cartera */}
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

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "12px",
            }}
          >
            {antiguedad.map((item) => {
              const color = COLOR_ORDEN[item.i_Orden] || "#9ca3af";
              const pctWidth =
                maxAntiguedad > 0 ? (item.d_Monto / maxAntiguedad) * 100 : 0;
              const pctTotal =
                totalAntiguedad > 0
                  ? ((item.d_Monto / totalAntiguedad) * 100).toFixed(1)
                  : "0";

              return (
                <div
                  key={`antig-${item.i_Orden}`}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "4px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: "12px",
                    }}
                  >
                    <span style={{ fontWeight: 500, color: "#334155" }}>
                      {item.v_Rango}
                    </span>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                      }}
                    >
                      <span style={{ fontWeight: 700, color: "#0f172a" }}>
                        {formatMoneda(item.d_Monto)}
                      </span>
                      <span style={{ fontSize: "11px", color: "#94a3b8" }}>
                        ({pctTotal}%)
                      </span>
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
                        width: `${Math.max(
                          pctWidth,
                          item.d_Monto > 0 ? 3 : 0
                        )}%`,
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
        <div
          style={{
            marginTop: "16px",
            paddingTop: "12px",
            borderTop: "1px solid #f1f5f9",
            textAlign: "right",
          }}
        >
          <span style={{ fontSize: "12px", color: "#94a3b8" }}>
            Cartera al {formatearFechaBonita(fechaCorte || fechaFin)}
          </span>
        </div>
      </div>
    </div>
  );
};
