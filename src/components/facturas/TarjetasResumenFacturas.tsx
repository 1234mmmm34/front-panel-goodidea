"use client";

import React from "react";
import { DollarSign, CheckCircle2, Clock, FileText } from "lucide-react";
import { FacturasResumenDto } from "@/types/facturas";

interface TarjetasResumenFacturasProps {
  resumen: FacturasResumenDto | null;
  cargando: boolean;
}

export const TarjetasResumenFacturas: React.FC<TarjetasResumenFacturasProps> = ({
  resumen,
  cargando,
}) => {
  const formatearMonto = (val: number) => {
    return `$${(val || 0).toLocaleString("es-MX", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const cards = [
    {
      label: "Total Facturado",
      valor: resumen ? formatearMonto(resumen.d_TotalFacturado) : "$0.00",
      icon: DollarSign,
      iconColor: "#2563eb",
      bgColor: "#eff6ff",
      borderColor: "#bfdbfe",
    },
    {
      label: "Total Pagado",
      valor: resumen ? formatearMonto(resumen.d_TotalPagado) : "$0.00",
      icon: CheckCircle2,
      iconColor: "#16a34a",
      bgColor: "#f0fdf4",
      borderColor: "#bbf7d0",
    },
    {
      label: "Total Pendiente",
      valor: resumen ? formatearMonto(resumen.d_TotalPendiente) : "$0.00",
      icon: Clock,
      iconColor: "#d97706",
      bgColor: "#fffbeb",
      borderColor: "#fef08a",
    },
    {
      label: "Total Facturas",
      valor: resumen ? `${resumen.i_TotalFacturas}` : "0",
      icon: FileText,
      iconColor: "#475569",
      bgColor: "#f8fafc",
      borderColor: "#e2e8f0",
    },
  ];

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
        gap: "12px",
      }}
    >
      {cards.map((c, i) => {
        const IconComponent = c.icon;
        return (
          <div
            key={i}
            className="card"
            style={{
              padding: "12px 16px",
              display: "flex",
              alignItems: "center",
              gap: "12px",
              backgroundColor: "#ffffff",
              border: "1px solid #e2e8f0",
              borderRadius: "12px",
            }}
          >
            <div
              style={{
                width: "38px",
                height: "38px",
                borderRadius: "10px",
                backgroundColor: c.bgColor,
                border: `1px solid ${c.borderColor}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: c.iconColor,
                flexShrink: 0,
              }}
            >
              <IconComponent size={20} />
            </div>

            <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: 600,
                  color: "#64748b",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}
              >
                {c.label}
              </span>
              {cargando ? (
                <div
                  className="skeleton-box"
                  style={{ width: "80px", height: "18px", marginTop: "4px" }}
                />
              ) : (
                <span
                  style={{
                    fontSize: "16px",
                    fontWeight: 700,
                    color: "#0f172a",
                    lineHeight: "1.2",
                    marginTop: "2px",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {c.valor}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
