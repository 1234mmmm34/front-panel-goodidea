"use client";

import React from "react";
import { RefreshCw, ChevronRight } from "lucide-react";
import DateRangePickerPopover from "@/components/ui/DateRangePickerPopover";
import {
  DashboardRubroOpcion,
  DashboardAsesorOpcion,
} from "@/types/dashboardProyectos";

interface FiltrosDashboardProyectosProps {
  fechaInicio: string;
  fechaFin: string;
  iCveRubro: number;
  iCveInstructor: number;
  rubros: DashboardRubroOpcion[];
  asesores: DashboardAsesorOpcion[];
  cargando: boolean;
  onCambiarFecha: (inicio: string, fin: string) => void;
  onCambiarRubro: (id: number) => void;
  onCambiarAsesor: (id: number) => void;
  onRecargar: () => void;
}

const pillSelectStyle: React.CSSProperties = {
  height: "32px",
  padding: "0 14px",
  borderRadius: "20px",
  border: "1px solid #cbd5e1",
  backgroundColor: "#ffffff",
  color: "#1e293b",
  fontSize: "12px",
  fontWeight: 500,
  fontFamily: "Roboto, sans-serif",
  cursor: "pointer",
  outline: "none",
  transition: "border-color 0.15s ease",
};

export const FiltrosDashboardProyectos: React.FC<
  FiltrosDashboardProyectosProps
> = ({
  fechaInicio,
  fechaFin,
  iCveRubro,
  iCveInstructor,
  rubros,
  asesores,
  cargando,
  onCambiarFecha,
  onCambiarRubro,
  onCambiarAsesor,
  onRecargar,
}) => {
  const asesorValido =
    iCveInstructor !== 0 &&
    asesores.some((a) => a.i_CveInstructor === iCveInstructor)
      ? iCveInstructor
      : 0;
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
          <span style={{ fontWeight: 600, color: "#1e293b" }}>Proyectos</span>
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
          Resumen de proyectos
        </h1>
        <p style={{ margin: 0, fontSize: "13px", color: "#64748b" }}>
          Cantidad de proyectos por rubro y asesor, su estatus y los que llevan
          más de 30 días abiertos.
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
        {/* Left: Filtros Fecha, Rubro y Asesor */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            flexWrap: "wrap",
            position: "relative",
            zIndex: 50,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <label
              style={{ fontSize: "12px", fontWeight: 600, color: "#475569" }}
            >
              Fecha:
            </label>
            <DateRangePickerPopover
              fechaInicio={fechaInicio}
              fechaFin={fechaFin}
              onChangeRange={(inicio, fin) => {
                onCambiarFecha(inicio, fin);
              }}
            />
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <label
              htmlFor="sel-rubro-proyectos"
              style={{ fontSize: "12px", fontWeight: 600, color: "#475569" }}
            >
              Rubro:
            </label>
            <select
              id="sel-rubro-proyectos"
              value={iCveRubro}
              onChange={(e) => onCambiarRubro(Number(e.target.value))}
              style={pillSelectStyle}
            >
              <option value={0}>Todos</option>
              {rubros.map((rubro) => (
                <option key={rubro.i_CveRubro} value={rubro.i_CveRubro}>
                  {rubro.v_Nombre}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <label
              htmlFor="sel-asesor-proyectos"
              style={{ fontSize: "12px", fontWeight: 600, color: "#475569" }}
            >
              Asesor:
            </label>
            <select
              id="sel-asesor-proyectos"
              value={asesorValido}
              onChange={(e) => onCambiarAsesor(Number(e.target.value))}
              style={pillSelectStyle}
            >
              <option value={0}>Todos</option>
              {asesores.map((asesor) => (
                <option
                  key={asesor.i_CveInstructor}
                  value={asesor.i_CveInstructor}
                >
                  {asesor.v_Asesor}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Right: Refresh Button */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "14px",
            marginLeft: "auto",
          }}
        >
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
            onMouseEnter={(e) => {
              if (!cargando) e.currentTarget.style.backgroundColor = "#f1f5f9";
            }}
            onMouseLeave={(e) => {
              if (!cargando) e.currentTarget.style.backgroundColor = "#f8fafc";
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

