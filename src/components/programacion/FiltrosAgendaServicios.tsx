"use client";

import React, { useState } from "react";
import { Search, Plus } from "lucide-react";
import DateRangePickerPopover from "@/components/ui/DateRangePickerPopover";

export interface FiltrosState {
  programacion: "programados" | "pendientes";
  facturacion: "todos" | "facturado" | "pendiente";
  fechaInicio: string;
  fechaFin: string;
  usarRango: boolean;
  searchTerm: string;
}

interface Props {
  filtros: FiltrosState;
  onCambiarFiltros: (nuevosFiltros: FiltrosState) => void;
  onCambiarVisualizar: (nuevaVista: "sesiones" | "servicios") => void;
  onBuscar: () => void;
  onNuevo?: () => void;
}

export const FiltrosAgendaServicios: React.FC<Props> = ({
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
    <div className="card mb-4 p-4" style={{ position: "relative", zIndex: 40, overflow: "visible" }}>
      {/* Contenedor principal en fila horizontal estricta con flex-row */}
      <div style={{ display: "flex", flexDirection: "row", alignItems: "flex-end", gap: "16px", flexWrap: "wrap", paddingBottom: "4px", overflow: "visible" }}>
        {/* Selector Visualizar (Primero en la barra de filtros) */}
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

        {/* Programación */}
        <div style={{ display: "flex", flexDirection: "column", gap: "4px", minWidth: "160px" }}>
          <label className="form-label" style={{ marginBottom: 0 }}>Programación</label>
          <select
            className="form-select text-xs py-1.5"
            style={{ borderRadius: "20px", height: "32px" }}
            value={filtros.programacion}
            onChange={(e) =>
              onCambiarFiltros({
                ...filtros,
                programacion: e.target.value as "programados" | "pendientes",
              })
            }
          >
            <option value="programados">Programados</option>
            <option value="pendientes">Pendientes de programar</option>
          </select>
        </div>

        {/* Facturación */}
        <div style={{ display: "flex", flexDirection: "column", gap: "4px", minWidth: "120px" }}>
          <label className="form-label" style={{ marginBottom: 0 }}>Facturación</label>
          <select
            className="form-select text-xs py-1.5"
            style={{ borderRadius: "20px", height: "32px" }}
            value={filtros.facturacion}
            onChange={(e) =>
              onCambiarFiltros({
                ...filtros,
                facturacion: e.target.value as "todos" | "facturado" | "pendiente",
              })
            }
          >
            <option value="todos">Todos</option>
            <option value="facturado">Facturado</option>
            <option value="pendiente">Pendiente</option>
          </select>
        </div>

        {/* Selector de Rango de Fechas (Estilo Alegra / SaaS) */}
        {filtros.programacion === "programados" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
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
        )}

        {/* Buscador + Botón + Nuevo al lado */}
        <div style={{ display: "flex", flexDirection: "row", alignItems: "flex-end", gap: "8px", width: "auto", marginLeft: "auto" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "4px", width: "220px", minWidth: "220px" }}>
            <label className="form-label" style={{ marginBottom: 0 }}>Buscar</label>
            <div style={{ position: "relative", width: "100%" }}>
              <Search size={14} style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8", pointerEvents: "none" }} />
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

          {onNuevo && (
            <button
              type="button"
              className="btn btn-primary text-xs py-1.5 px-4 flex items-center gap-1.5 shrink-0"
              style={{ height: "32px", borderRadius: "20px", display: "inline-flex", alignItems: "center", justifyContent: "center" }}
              onClick={onNuevo}
              title="Agendar Servicio"
            >
              <Plus size={16} />
              <span>Agendar</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
