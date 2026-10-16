"use client";

import React, { useState } from "react";
import { Search } from "lucide-react";
import DateRangePickerPopover from "@/components/ui/DateRangePickerPopover";
import { FiltrosConsultorServiciosState } from "@/types/consultor";

interface Props {
  filtros: FiltrosConsultorServiciosState;
  onCambiarFiltros: (nuevosFiltros: FiltrosConsultorServiciosState) => void;
  onCambiarVisualizar: (nuevaVista: "sesiones" | "servicios") => void;
  onBuscar: () => void;
}

export const FiltrosConsultorServicios: React.FC<Props> = ({
  filtros,
  onCambiarFiltros,
  onCambiarVisualizar,
  onBuscar,
}) => {
  const [localSearch, setLocalSearch] = useState(filtros.searchTerm);

  React.useEffect(() => {
    setLocalSearch(filtros.searchTerm);
  }, [filtros.searchTerm]);

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
        {/* Selector Visualizar */}
        <div style={{ display: "flex", flexDirection: "column", gap: "4px", minWidth: "140px" }}>
          <label className="form-label" style={{ marginBottom: 0 }}>Visualizar</label>
          <select
            className="form-select text-xs py-1.5"
            style={{ borderRadius: "20px", height: "32px", fontWeight: 600 }}
            value="servicios"
            onChange={(e) => onCambiarVisualizar(e.target.value as "sesiones" | "servicios")}
          >
            <option value="sesiones">Sesiones</option>
            <option value="servicios">Servicios</option>
          </select>
        </div>

        {/* Selector de Rango de Fechas */}
        <div style={{ display: "flex", flexDirection: "column", gap: "4px", minWidth: "220px", position: "relative", zIndex: 50 }}>
          <label className="form-label" style={{ marginBottom: 0 }}>Rango de fechas</label>
          <DateRangePickerPopover
            fechaInicio={filtros.fechaInicio}
            fechaFin={filtros.fechaFin}
            onChangeRange={(inicio, fin) => {
              const nuevosFiltros = { ...filtros, fechaInicio: inicio, fechaFin: fin, usarRango: true };
              onCambiarFiltros(nuevosFiltros);
              onBuscar();
            }}
          />
        </div>

        {/* Buscador */}
        <div style={{ display: "flex", flexDirection: "row", alignItems: "flex-end", gap: "8px", width: "auto", marginLeft: "auto" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "4px", width: "240px", minWidth: "160px" }}>
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
                placeholder="Buscar servicio (Enter)..."
                value={localSearch}
                onChange={(e) => setLocalSearch(e.target.value)}
                onKeyDown={handleKeyDownSearch}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
