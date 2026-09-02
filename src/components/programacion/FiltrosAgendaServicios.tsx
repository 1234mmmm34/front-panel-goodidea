"use client";

import React, { useState } from "react";
import { Search, Calendar, Filter } from "lucide-react";

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
  onBuscar: () => void;
}

export const FiltrosAgendaServicios: React.FC<Props> = ({
  filtros,
  onCambiarFiltros,
  onBuscar,
}) => {
  const [localSearch, setLocalSearch] = useState(filtros.searchTerm);

  const handleKeyDownSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      onCambiarFiltros({ ...filtros, searchTerm: localSearch });
      onBuscar();
    }
  };

  return (
    <div className="card mb-4 p-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-secondary" />
            <span className="form-label mb-0">Programación:</span>
            <select
              className="form-select text-sm py-1.5"
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

          <div className="flex items-center gap-2">
            <span className="form-label mb-0">Facturación:</span>
            <select
              className="form-select text-sm py-1.5"
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

          {filtros.programacion === "programados" && (
            <div className="flex items-center gap-2">
              <Calendar size={16} className="text-secondary" />
              <span className="form-label mb-0">Fecha inicio:</span>
              <input
                type="date"
                className="form-control text-sm py-1"
                value={filtros.fechaInicio}
                onChange={(e) =>
                  onCambiarFiltros({ ...filtros, fechaInicio: e.target.value })
                }
              />

              <label className="flex items-center gap-1.5 text-xs text-secondary cursor-pointer ml-1">
                <input
                  type="checkbox"
                  checked={filtros.usarRango}
                  onChange={(e) =>
                    onCambiarFiltros({ ...filtros, usarRango: e.target.checked })
                  }
                />
                Rango
              </label>

              {filtros.usarRango && (
                <div className="flex items-center gap-1 ml-1">
                  <span className="text-xs text-secondary">Hasta:</span>
                  <input
                    type="date"
                    className="form-control text-sm py-1"
                    value={filtros.fechaFin}
                    onChange={(e) =>
                      onCambiarFiltros({ ...filtros, fechaFin: e.target.value })
                    }
                  />
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 min-w-[260px]">
          <div className="relative flex-1">
            <input
              type="text"
              className="form-control text-sm pl-8 pr-3 py-1.5 w-full"
              placeholder="Buscar (presiona Enter)..."
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              onKeyDown={handleKeyDownSearch}
            />
            <Search size={16} className="absolute left-2.5 top-2.5 text-slate-400" />
          </div>

          <button className="btn btn-primary btn-sm py-1.5" onClick={() => {
            onCambiarFiltros({ ...filtros, searchTerm: localSearch });
            onBuscar();
          }}>
            Buscar
          </button>
        </div>
      </div>
    </div>
  );
};
