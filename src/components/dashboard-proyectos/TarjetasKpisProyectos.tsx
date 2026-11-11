"use client";

import React, { useState } from "react";
import { Info } from "lucide-react";
import {
  ProyectoDashboardMock,
  ASESORES_MOCK,
  esProyectoMasDe30Dias,
} from "@/types/dashboardProyectos";

interface TarjetasKpisProyectosProps {
  proyectos: ProyectoDashboardMock[];
  asesorSeleccionado: string;
  cargando: boolean;
}

export const TarjetasKpisProyectos: React.FC<TarjetasKpisProyectosProps> = ({
  proyectos,
  asesorSeleccionado,
  cargando,
}) => {
  const [tooltipActivo, setTooltipActivo] = useState<string | null>(null);

  if (cargando) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        <div
          className="skeleton-box"
          style={{ width: "160px", height: "16px" }}
        />
        <div
          className="skeleton-box sm"
          style={{ width: "320px", height: "12px" }}
        />
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "16px",
            marginTop: "4px",
          }}
        >
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={`sk-kpi-proy-${i}`}
              style={{
                backgroundColor: "#ffffff",
                borderRadius: "10px",
                padding: "16px",
                border: "1px solid #e2e8f0",
                display: "flex",
                flexDirection: "column",
                gap: "10px",
              }}
            >
              <div
                className="skeleton-box"
                style={{ width: "55%", height: "14px" }}
              />
              <div
                className="skeleton-box"
                style={{ width: "45%", height: "24px" }}
              />
              <div
                className="skeleton-box sm"
                style={{ width: "40%", height: "12px" }}
              />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const total = proyectos.length;
  const enProceso = proyectos.filter((p) => p.v_Estatus === "En proceso").length;
  const terminados = proyectos.filter((p) => p.v_Estatus === "Terminado").length;
  const masDe30 = proyectos.filter((p) => esProyectoMasDe30Dias(p)).length;

  const pctEnProceso = total > 0 ? Math.round((enProceso / total) * 100) : 0;
  const pctTerminados = total > 0 ? Math.round((terminados / total) * 100) : 0;
  const pctMasDe30 =
    enProceso > 0 ? Math.round((masDe30 / enProceso) * 100) : 0;

  const pieAsesores = asesorSeleccionado
    ? "1 asesor"
    : `${ASESORES_MOCK.length} asesores`;

  const tarjetas = [
    {
      id: "totales",
      label: "Proyectos totales",
      valor: total,
      colorValor: "#1e3a5f",
      pie: pieAsesores,
      tooltipText: "Estudios y servicios con fecha de inicio en el periodo.",
    },
    {
      id: "en_proceso",
      label: "En proceso",
      valor: enProceso,
      colorValor: "#c2410c",
      pie: `${pctEnProceso}% del total`,
      tooltipText: "Proyectos que aún no se confirman como terminados.",
    },
    {
      id: "terminados",
      label: "Terminados",
      valor: terminados,
      colorValor: "#16a34a",
      pie: `${pctTerminados}% del total`,
      tooltipText: "Proyectos confirmados como terminados.",
    },
    {
      id: "mas_30_dias",
      label: "Más de 30 días",
      valor: masDe30,
      colorValor: masDe30 > 0 ? "#dc2626" : "#1e3a5f",
      pie: `${pctMasDe30}% de los en proceso`,
      tooltipText:
        "Proyectos en proceso con más de 30 días desde su fecha de inicio.",
    },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
        <h2
          style={{
            fontSize: "13px",
            fontWeight: 700,
            color: "#0f172a",
            textTransform: "uppercase",
            letterSpacing: "0.5px",
            margin: 0,
          }}
        >
          RESUMEN
        </h2>
        <span style={{ fontSize: "12px", color: "#64748b" }}>
          Proyectos (estudios y servicios) iniciados en el periodo.
        </span>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "16px",
        }}
      >
        {tarjetas.map((card) => (
          <div
            key={card.id}
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "10px",
              padding: "14px 16px",
              border: "1px solid #e2e8f0",
              boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              position: "relative",
            }}
          >
            {/* Header Tarjeta */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "6px",
              }}
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: "6px" }}
              >
                <span
                  style={{
                    fontSize: "12px",
                    color: "#64748b",
                    fontWeight: 500,
                  }}
                >
                  {card.label}
                </span>
                {/* Info Tooltip */}
                <div
                  style={{ position: "relative", display: "inline-flex" }}
                  onMouseEnter={() => setTooltipActivo(card.id)}
                  onMouseLeave={() => setTooltipActivo(null)}
                >
                  <Info
                    size={14}
                    style={{
                      color: "#94a3b8",
                      cursor: "pointer",
                      transition: "color 0.15s",
                    }}
                    onClick={() =>
                      setTooltipActivo(
                        tooltipActivo === card.id ? null : card.id
                      )
                    }
                  />
                  {tooltipActivo === card.id && (
                    <div
                      style={{
                        position: "absolute",
                        bottom: "125%",
                        left: "50%",
                        transform: "translateX(-50%)",
                        backgroundColor: "#0f172a",
                        color: "#ffffff",
                        padding: "8px 12px",
                        borderRadius: "6px",
                        fontSize: "11px",
                        whiteSpace: "normal",
                        width: "230px",
                        zIndex: 50,
                        boxShadow: "0 4px 6px -1px rgba(0,0,0,0.15)",
                        pointerEvents: "none",
                        textAlign: "left",
                        lineHeight: 1.35,
                      }}
                    >
                      {card.tooltipText}
                      <div
                        style={{
                          position: "absolute",
                          top: "100%",
                          left: "50%",
                          transform: "translateX(-50%)",
                          borderWidth: "5px",
                          borderStyle: "solid",
                          borderColor:
                            "#0f172a transparent transparent transparent",
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Valor Grande */}
            <div
              style={{
                fontSize: "22px",
                fontWeight: 700,
                color: card.colorValor,
                marginBottom: "4px",
                letterSpacing: "-0.5px",
              }}
            >
              {card.valor}
            </div>

            {/* Subtexto / Pie */}
            <div
              style={{ fontSize: "12px", color: "#64748b", minHeight: "16px" }}
            >
              {card.pie}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

