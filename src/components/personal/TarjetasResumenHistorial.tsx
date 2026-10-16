"use client";

import React from "react";
import { HistorialResumenDto } from "@/types/alumnosCatalogo";

interface TarjetasResumenHistorialProps {
  resumen: HistorialResumenDto | null;
  cargando: boolean;
}

export const TarjetasResumenHistorial: React.FC<TarjetasResumenHistorialProps> = ({
  resumen,
  cargando,
}) => {
  const formatNumero = (val: number | null | undefined): string => {
    if (val === null || val === undefined || isNaN(val)) return "—";
    return new Intl.NumberFormat("es-MX").format(val);
  };

  const totalEvaluados = resumen
    ? (resumen.i_Aprobados ?? 0) + (resumen.i_Reprobados ?? 0)
    : 0;

  const calcularPct = (valor: number | undefined): string => {
    if (!resumen || totalEvaluados === 0 || valor === undefined || isNaN(valor)) {
      return "—";
    }
    const pct = Math.round((valor / totalEvaluados) * 100);
    return `${pct}%`;
  };

  const subtituloAprobados = () => {
    if (!resumen) return "—";
    const pct = calcularPct(resumen.i_Aprobados);
    return pct === "—" ? "— de los evaluados" : `${pct} de los evaluados`;
  };

  const subtituloReprobados = () => {
    if (!resumen) return "—";
    const pct = calcularPct(resumen.i_Reprobados);
    const sinEvaluar = formatNumero(resumen.i_SinEvaluar);
    const parteEvaluados = pct === "—" ? "— de los evaluados" : `${pct} de los evaluados`;
    return `${parteEvaluados} · ${sinEvaluar} sin evaluar`;
  };

  const cards = [
    {
      id: "cursos",
      label: "Cursos",
      numero: resumen ? formatNumero(resumen.i_Cursos) : "—",
      subtexto: resumen ? "Cursos en el periodo" : "—",
      colorNumero: resumen ? "#1e3a5f" : "#64748b",
    },
    {
      id: "alumnos",
      label: "Alumnos",
      numero: resumen ? formatNumero(resumen.i_Alumnos) : "—",
      subtexto: resumen ? `${formatNumero(resumen.i_Inscripciones)} inscripciones` : "—",
      colorNumero: resumen ? "#1e3a5f" : "#64748b",
    },
    {
      id: "aprobados",
      label: "Aprobados",
      numero: resumen ? formatNumero(resumen.i_Aprobados) : "—",
      subtexto: subtituloAprobados(),
      colorNumero: resumen ? "#16a34a" : "#64748b",
    },
    {
      id: "reprobados",
      label: "Reprobados",
      numero: resumen ? formatNumero(resumen.i_Reprobados) : "—",
      subtexto: subtituloReprobados(),
      colorNumero: resumen ? "#dc2626" : "#64748b",
    },
  ];

  return (
    <div className="tarjetas-resumen-historial-grid">
      {cards.map((card) => (
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
          {/* Header Tarjeta: Título arriba a la izquierda */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "6px",
            }}
          >
            <span style={{ fontSize: "12px", color: "#64748b", fontWeight: 500 }}>
              {card.label}
            </span>
          </div>

          {/* Número Grande */}
          <div
            style={{
              fontSize: "22px",
              fontWeight: 700,
              color: card.colorNumero,
              marginBottom: "4px",
              letterSpacing: "-0.5px",
              display: "flex",
              alignItems: "center",
            }}
          >
            {cargando ? (
              <div
                className="skeleton-box"
                style={{ width: "50px", height: "26px", borderRadius: "4px" }}
              />
            ) : (
              card.numero
            )}
          </div>

          {/* Subtítulo gris abajo */}
          <div
            style={{
              fontSize: "12px",
              color: "#64748b",
              minHeight: "16px",
              display: "flex",
              alignItems: "center",
            }}
          >
            {cargando ? (
              <div
                className="skeleton-box sm"
                style={{ width: "110px", height: "12px", borderRadius: "3px" }}
              />
            ) : (
              card.subtexto
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
