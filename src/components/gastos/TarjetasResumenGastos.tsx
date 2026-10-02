"use client";

import React from "react";
import { FacturasProvResumen } from "@/types/gastos";

interface TarjetasResumenGastosProps {
  resumen: FacturasProvResumen | null;
  cargando: boolean;
}

export const TarjetasResumenGastos: React.FC<TarjetasResumenGastosProps> = ({
  resumen,
  cargando,
}) => {
  const formatMoneda = (val: number | null | undefined) => {
    if (val === null || val === undefined || isNaN(val)) return "$0.00";
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(val);
  };

  if (cargando || !resumen) {
    return (
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "16px",
        }}
      >
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={`sk-gasto-${i}`}
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "10px",
              padding: "14px 16px",
              border: "1px solid #e2e8f0",
              display: "flex",
              flexDirection: "column",
              gap: "10px",
            }}
          >
            <div className="skeleton-box" style={{ width: "50%", height: "14px" }} />
            <div className="skeleton-box" style={{ width: "80%", height: "24px" }} />
            <div className="skeleton-box sm" style={{ width: "40%", height: "12px" }} />
          </div>
        ))}
      </div>
    );
  }

  const cards = [
    {
      id: "monto_total",
      label: "Monto total",
      monto: formatMoneda(resumen.d_TotalFacturado),
      subtexto: `${resumen.i_TotalFacturas} ${
        resumen.i_TotalFacturas === 1 ? "gasto" : "gastos"
      } en el periodo`,
      colorMonto: "#1e3a5f",
      badge: "con IVA",
    },
    {
      id: "total_pagado",
      label: "Total pagado",
      monto: formatMoneda(resumen.d_TotalPagado),
      subtexto: "Pagos realizados",
      colorMonto: "#1e3a5f",
      badge: "con IVA",
    },
    {
      id: "total_pendiente",
      label: "Total pendiente",
      monto: formatMoneda(resumen.d_TotalPendiente),
      subtexto: "Saldo pendiente por pagar",
      colorMonto: "#1e3a5f",
      badge: "con IVA",
    },
    {
      id: "total_gastos",
      label: "Total gastos",
      monto: `${resumen.i_TotalFacturas}`,
      subtexto: "Gastos registrados en el periodo",
      colorMonto: "#1e3a5f",
      badge: "conteo",
    },
  ];

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
        gap: "16px",
      }}
    >
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
          {/* Header Tarjeta */}
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

            {/* Badge */}
            <span
              style={{
                fontSize: "10px",
                fontWeight: 600,
                padding: "2px 6px",
                borderRadius: "4px",
                backgroundColor: card.badge === "con IVA" ? "#eff6ff" : "#f1f5f9",
                color: card.badge === "con IVA" ? "#2563eb" : "#475569",
                border: `1px solid ${
                  card.badge === "con IVA" ? "#bfdbfe" : "#cbd5e1"
                }`,
              }}
            >
              {card.badge}
            </span>
          </div>

          {/* Monto Grande */}
          <div
            style={{
              fontSize: "22px",
              fontWeight: 700,
              color: card.colorMonto,
              marginBottom: "4px",
              letterSpacing: "-0.5px",
            }}
          >
            {card.monto}
          </div>

          {/* Subtexto */}
          <div style={{ fontSize: "12px", color: "#64748b", minHeight: "16px" }}>
            {card.subtexto}
          </div>
        </div>
      ))}
    </div>
  );
};
