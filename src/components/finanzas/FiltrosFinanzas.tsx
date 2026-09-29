"use client";

import React from "react";
import { RefreshCw, ChevronRight } from "lucide-react";
import DateRangePickerPopover from "@/components/ui/DateRangePickerPopover";

interface FiltrosFinanzasProps {
  fechaInicio: string;
  fechaFin: string;
  fechaInicioAplicada?: string;
  fechaFinAplicada?: string;
  cargando: boolean;
  onCambiarFiltro: (inicio: string, fin: string) => void;
  onRecargar: () => void;
}

export const FiltrosFinanzas: React.FC<FiltrosFinanzasProps> = ({
  fechaInicio,
  fechaFin,
  cargando,
  onCambiarFiltro,
  onRecargar,
}) => {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
      {/* Breadcrumb & Header */}
      <div>
        <nav
          aria-label="Breadcrumb"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            fontSize: "12px",
            color: "#64748b",
            marginBottom: "4px",
          }}
        >
          <span>Inicio</span>
          <ChevronRight size={12} />
          <span style={{ fontWeight: 600, color: "#1e293b" }}>Finanzas</span>
        </nav>
        <h1
          style={{
            fontSize: "22px",
            fontWeight: 700,
            color: "#0f172a",
            margin: "0 0 2px 0",
            padding: 0,
          }}
        >
          Dashboard de finanzas
        </h1>
        <p style={{ margin: 0, fontSize: "13px", color: "#64748b" }}>
          Facturación, cobranza, cartera y utilidad del periodo seleccionado.
        </p>
      </div>

      {/* Barra de Filtros Horizontal */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "12px",
          backgroundColor: "#ffffff",
          padding: "12px 16px",
          borderRadius: "10px",
          border: "1px solid #e2e8f0",
          boxShadow: "0 1px 2px rgba(0,0,0,0.03)",
          position: "relative",
          zIndex: 40,
          overflow: "visible",
        }}
      >
        {/* Left: Date Range Picker Popover */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", position: "relative", zIndex: 50 }}>
          <label style={{ fontSize: "12px", fontWeight: 600, color: "#475569" }}>
            Fecha:
          </label>
          <DateRangePickerPopover
            fechaInicio={fechaInicio}
            fechaFin={fechaFin}
            onChangeRange={(inicio, fin) => {
              onCambiarFiltro(inicio, fin);
            }}
          />
        </div>

        {/* Right: Refresh Button */}
        <div style={{ display: "flex", alignItems: "center", gap: "14px", marginLeft: "auto" }}>
          <button
            type="button"
            onClick={onRecargar}
            disabled={cargando}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "6px 14px",
              fontSize: "12px",
              fontWeight: 500,
              color: "#334155",
              backgroundColor: "#f8fafc",
              border: "1px solid #cbd5e1",
              borderRadius: "20px",
              cursor: cargando ? "wait" : "pointer",
              transition: "all 0.15s ease",
            }}
            title="Recargar datos"
          >
            <RefreshCw size={14} className={cargando ? "animate-spin" : ""} />
            <span>Recargar</span>
          </button>
        </div>
      </div>
    </div>
  );
};

