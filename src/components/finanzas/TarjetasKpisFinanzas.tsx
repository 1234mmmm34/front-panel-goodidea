"use client";

import React, { useState } from "react";
import { Info } from "lucide-react";
import { DashboardKpis } from "@/types/finanzas";
import { formatearFechaBonita } from "@/lib/date-utils";

interface TarjetasKpisFinanzasProps {
  kpis: DashboardKpis | null;
  cargando: boolean;
}

const formatMoneda = (valor: number | null | undefined): string => {
  if (valor === null || valor === undefined || isNaN(valor)) return "$0.00";
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(valor);
};

export const TarjetasKpisFinanzas: React.FC<TarjetasKpisFinanzasProps> = ({ kpis, cargando }) => {
  const [tooltipActivo, setTooltipActivo] = useState<string | null>(null);

  if (cargando || !kpis) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        {/* Fila 1 Skeleton */}
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <div className="skeleton-box" style={{ width: "200px", height: "16px" }} />
          <div className="skeleton-box sm" style={{ width: "320px", height: "12px" }} />
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
                key={`sk-row1-${i}`}
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
                <div className="skeleton-box" style={{ width: "50%", height: "14px" }} />
                <div className="skeleton-box" style={{ width: "80%", height: "24px" }} />
                <div className="skeleton-box sm" style={{ width: "40%", height: "12px" }} />
              </div>
            ))}
          </div>
        </div>

        {/* Fila 2 Skeleton */}
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <div className="skeleton-box" style={{ width: "200px", height: "16px" }} />
          <div className="skeleton-box sm" style={{ width: "360px", height: "12px" }} />
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
                key={`sk-row2-${i}`}
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
                <div className="skeleton-box" style={{ width: "50%", height: "14px" }} />
                <div className="skeleton-box" style={{ width: "80%", height: "24px" }} />
                <div className="skeleton-box sm" style={{ width: "40%", height: "12px" }} />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const vencidoPct =
    kpis.d_PorCobrar > 0
      ? `${((kpis.d_Vencido / kpis.d_PorCobrar) * 100).toFixed(1)}% de la cartera`
      : "0% de la cartera";

  // Fila 1: Facturas y Pagos (con IVA)
  const fila1 = [
    {
      id: "facturado",
      label: "Facturado",
      monto: formatMoneda(kpis.d_Facturado),
      subtexto: `${kpis.i_Facturas} facturas`,
      colorMonto: "#1e3a5f",
      badge: "con IVA",
      tooltipText: "Monto total de facturas emitidas en el periodo.",
    },
    {
      id: "cobrado",
      label: "Cobrado",
      monto: formatMoneda(kpis.d_Cobrado),
      subtexto: "Pagos recibidos en el periodo",
      colorMonto: "#1e3a5f",
      badge: "con IVA",
      tooltipText:
        "Pagos recibidos dentro del periodo, sin importar cuándo se emitió la factura. Puede ser mayor que lo facturado si se cobraron facturas de meses anteriores.",
    },
    {
      id: "por_cobrar",
      label: "Por cobrar",
      monto: formatMoneda(kpis.d_PorCobrar),
      subtexto: `Saldo al ${formatearFechaBonita(kpis.d_FechaCorte || kpis.d_FechaFin)}`,
      colorMonto: "#1e3a5f",
      badge: "con IVA",
      tooltipText:
        "Saldo pendiente de todas las facturas vigentes a la fecha final, incluye no timbradas.",
    },
    {
      id: "vencido",
      label: "Vencido",
      monto: formatMoneda(kpis.d_Vencido),
      subtexto: vencidoPct,
      colorMonto: kpis.d_Vencido > 0 ? "#dc2626" : "#1e3a5f",
      badge: "con IVA",
      tooltipText:
        "Pagos programados con fecha anterior a la fecha final que no se habían pagado.",
    },
  ];

  // Fila 2: Ventas y Ganancia
  const ventaConIva = Math.round(kpis.d_VentaPeriodo * 1.16 * 100) / 100;
  const costoConIva = Math.round(kpis.d_CostoProveedores * 1.16 * 100) / 100;

  const fila2 = [
    {
      id: "venta",
      label: "Servicios vendidos",
      monto: formatMoneda(ventaConIva),
      subtexto: "Servicios iniciados en el periodo",
      colorMonto: "#1e3a5f",
      badge: "con IVA",
      tooltipText:
        "Precio de venta de los servicios cuya primera sesión cae en el periodo, se hayan facturado o no.",
    },
    {
      id: "costo",
      label: "Pago a externos",
      monto: formatMoneda(costoConIva),
      subtexto: "Servicios dados por terceros",
      colorMonto: "#1e3a5f",
      badge: "con IVA",
      tooltipText:
        "Lo que se paga a proveedores externos contratados para dar el servicio. Los servicios dados por el equipo interno no tienen costo aquí.",
    },
    {
      id: "utilidad",
      label: "Ganancia",
      monto: formatMoneda(kpis.d_Utilidad),
      subtexto: `Margen ${kpis.d_MargenPct}%`,
      colorMonto: kpis.d_Utilidad > 0 ? "#16a34a" : kpis.d_Utilidad < 0 ? "#dc2626" : "#1e3a5f",
      badge: "sin IVA",
      tooltipText:
        "Servicios vendidos menos pago a externos. No descuenta sueldos ni gastos internos.",
    },
    {
      id: "sin_facturar",
      label: "Pendiente de facturar",
      monto: formatMoneda(kpis.d_SinFacturar),
      subtexto: "Total actual · con IVA",
      colorMonto: "#1e3a5f",
      badge: "con IVA",
      tooltipText:
        "Servicios vendidos que todavía no se facturan completos. No depende del filtro de fechas.",
    },
  ];

  const renderFila = (
    items: typeof fila1,
    tituloFila: string,
    descripcionFila: string
  ) => (
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
          {tituloFila}
        </h2>
        <span style={{ fontSize: "12px", color: "#64748b" }}>
          {descripcionFila}
        </span>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "16px",
        }}
      >
        {items.map((card) => (
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
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ fontSize: "12px", color: "#64748b", fontWeight: 500 }}>
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
                    style={{ color: "#94a3b8", cursor: "pointer", transition: "color 0.15s" }}
                    onClick={() =>
                      setTooltipActivo(tooltipActivo === card.id ? null : card.id)
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
                          borderColor: "#0f172a transparent transparent transparent",
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Badge (con IVA / sin IVA) */}
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
              {card.subtexto || " "}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {renderFila(
        fila1,
        "FACTURAS Y PAGOS",
        "Lo que se facturó y lo que se cobró en el periodo. Montos con IVA."
      )}
      {renderFila(
        fila2,
        "VENTAS Y GANANCIA",
        "Servicios que se dieron en el periodo y lo que se pagó a externos, con IVA. La ganancia es sin IVA."
      )}
    </div>
  );
};
