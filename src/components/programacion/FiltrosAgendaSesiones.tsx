"use client";

import React, { useState } from "react";
import { Search, Plus } from "lucide-react";

export interface FiltrosSesionesState {
  visualizar: "sesiones" | "servicios";
  fechaInicio: string;
  fechaFin: string;
  usarRango: boolean;
  searchTerm: string;
}

interface Props {
  filtros: FiltrosSesionesState;
  onCambiarFiltros: (nuevosFiltros: FiltrosSesionesState) => void;
  onCambiarVisualizar: (nuevaVista: "sesiones" | "servicios") => void;
  onBuscar: () => void;
  onNuevo?: () => void;
}

export const FiltrosAgendaSesiones: React.FC<Props> = ({
  filtros,
  onCambiarFiltros,
  onCambiarVisualizar,
  onBuscar,
  onNuevo,
}) => {
  const [localSearch, setLocalSearch] = useState(filtros.searchTerm);

  const handleKeyDownSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      onCambiarFiltros({ ...filtros, searchTerm: localSearch });
      onBuscar();
    }
  };

  return (
    <div className="card mb-4 p-4 filter-card" style={{ position: "relative", zIndex: 40, overflow: "visible" }}>
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "flex-end",
          gap: "16px",
          flexWrap: "wrap",
          paddingBottom: "4px",
          overflow: "visible",
        }}
      >
        {/* Selector Visualizar (Primero en la barra de filtros) */}
        <div style={{ display: "flex", flexDirection: "column", gap: "4px", minWidth: "140px" }}>
          <label className="form-label" style={{ marginBottom: 0 }}>Visualizar</label>
          <select
            className="form-select text-xs py-1.5"
            style={{ borderRadius: "20px", height: "32px", fontWeight: 600 }}
            value={filtros.visualizar}
            onChange={(e) => onCambiarVisualizar(e.target.value as "sesiones" | "servicios")}
          >
            <option value="sesiones">Sesiones</option>
            <option value="servicios">Servicios</option>
          </select>
        </div>

        {/* Fecha Inicio */}
        <div style={{ display: "flex", flexDirection: "column", gap: "4px", minWidth: "150px" }}>
          <label className="form-label" style={{ marginBottom: 0 }}>Buscar por fecha</label>
          <input
            type="date"
            className="form-control text-xs py-1.5"
            style={{ borderRadius: "20px", height: "32px" }}
            value={filtros.fechaInicio}
            onChange={(e) => {
              const nuevaIni = e.target.value;
              const nuevos = { ...filtros, fechaInicio: nuevaIni };
              if (filtros.usarRango && filtros.fechaFin && filtros.fechaFin < nuevaIni) {
                nuevos.fechaFin = nuevaIni;
              }
              onCambiarFiltros(nuevos);
            }}
          />
        </div>

        {/* Checkbox Buscar por Rango */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px", height: "32px" }}>
          <input
            type="checkbox"
            id="chkUsarRangoSesiones"
            className="form-checkbox h-4 w-4 text-primary rounded cursor-pointer"
            checked={filtros.usarRango}
            onChange={(e) => {
              const checked = e.target.checked;
              onCambiarFiltros({
                ...filtros,
                usarRango: checked,
                fechaFin: checked && !filtros.fechaFin ? filtros.fechaInicio : filtros.fechaFin,
              });
            }}
          />
          <label htmlFor="chkUsarRangoSesiones" className="text-xs text-slate-700 font-medium cursor-pointer select-none">
            Buscar por rango
          </label>
        </div>

        {/* Fecha Fin ("Hasta" - aparece al activar rango) */}
        {filtros.usarRango && (
          <div style={{ display: "flex", flexDirection: "column", gap: "4px", minWidth: "150px" }}>
            <label className="form-label" style={{ marginBottom: 0 }}>Hasta</label>
            <input
              type="date"
              className="form-control text-xs py-1.5"
              style={{ borderRadius: "20px", height: "32px" }}
              min={filtros.fechaInicio}
              value={filtros.fechaFin || filtros.fechaInicio}
              onChange={(e) =>
                onCambiarFiltros({ ...filtros, fechaFin: e.target.value })
              }
            />
          </div>
        )}

        {/* Buscador y Botón Agendar al lado */}
        <div style={{ display: "flex", flexDirection: "row", alignItems: "flex-end", gap: "8px", marginLeft: "auto" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "4px", width: "220px", minWidth: "160px" }}>
            <label className="form-label" style={{ marginBottom: 0 }}>Buscar</label>
            <div style={{ position: "relative", width: "100%" }}>
              <Search
                size={14}
                style={{
                  position: "absolute",
                  left: "10px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "#94a3b8",
                  pointerEvents: "none",
                }}
              />
              <input
                type="text"
                className="form-control text-xs py-1.5"
                style={{ width: "100%", paddingLeft: "28px", borderRadius: "20px", height: "32px" }}
                placeholder="Buscar sesión (Enter)..."
                value={localSearch}
                onChange={(e) => setLocalSearch(e.target.value)}
                onKeyDown={handleKeyDownSearch}
              />
            </div>
          </div>

          {onNuevo && (
            <button
              type="button"
              className="btn btn-primary filter-action-btn"
              onClick={onNuevo}
              title="Agendar Servicio"
            >
              <Plus size={16} />
              <span className="filter-btn-text">Agendar</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
