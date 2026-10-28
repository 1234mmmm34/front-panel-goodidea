"use client";

import React from "react";

interface Props {
  porcentaje?: number | null;
  texto?: string;
  sinIniciar?: boolean;
  conteoAnexos?: number;
  className?: string;
  style?: React.CSSProperties;
}

export const BadgeSemaforo: React.FC<Props> = ({
  porcentaje,
  texto,
  sinIniciar = false,
  conteoAnexos,
  className = "",
  style = {},
}) => {
  // Caso 1: Expediente inexistente o sin iniciar
  if (sinIniciar) {
    return (
      <span
        className={`inline-flex items-center justify-center font-medium ${className}`}
        style={{
          backgroundColor: "#f1f5f9",
          color: "#64748b",
          padding: "3px 8px",
          borderRadius: "12px",
          fontSize: "11px",
          fontWeight: 600,
          border: "1px solid #e2e8f0",
          ...style,
        }}
      >
        Sin iniciar
      </span>
    );
  }

  // Caso 2: Conteo de anexos (badge amarillo)
  if (conteoAnexos !== undefined) {
    return (
      <span
        className={`inline-flex items-center justify-center font-medium ${className}`}
        style={{
          backgroundColor: "#FEF3E2",
          color: "#B9770E",
          padding: "3px 8px",
          borderRadius: "12px",
          fontSize: "11px",
          fontWeight: 600,
          border: "1px solid #fed7aa",
          ...style,
        }}
      >
        {conteoAnexos} anexo{conteoAnexos === 1 ? "" : "s"}
      </span>
    );
  }

  // Caso 3: Porcentaje semáforo
  const pct = Math.min(100, Math.max(0, Math.round(porcentaje ?? 0)));

  let bg = "#FDECEA";
  let text = "#C0392B";

  if (pct >= 81) {
    bg = "#008040";
    text = "#FFFFFF";
  } else if (pct >= 61) {
    bg = "#EAFAF1";
    text = "#239B56";
  } else if (pct >= 41) {
    bg = "#FEF9E7";
    text = "#9A7D0A";
  } else if (pct >= 21) {
    bg = "#FEF3E2";
    text = "#B9770E";
  } else {
    bg = "#FDECEA";
    text = "#C0392B";
  }

  return (
    <span
      className={`inline-flex items-center justify-center font-medium ${className}`}
      style={{
        backgroundColor: bg,
        color: text,
        padding: "3px 9px",
        borderRadius: "12px",
        fontSize: "11px",
        fontWeight: 700,
        letterSpacing: "0.2px",
        ...style,
      }}
    >
      {texto || `${pct} %`}
    </span>
  );
};
