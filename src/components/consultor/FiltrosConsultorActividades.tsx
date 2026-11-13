"use client";

import React, { useState } from "react";
import { Search, Plus } from "lucide-react";
import DateRangePickerPopover from "@/components/ui/DateRangePickerPopover";
import {
  FiltrosConsultorActividadesState,
  PersonalActividadesOpcion,
  PrioridadActividad,
} from "@/types/consultor";

interface Props {
  filtros: FiltrosConsultorActividadesState;
  onCambiarFiltros: (f: FiltrosConsultorActividadesState) => void;
  onBuscar: () => void;
  onAgregarActividad?: () => void;
  opcionesPersonal?: PersonalActividadesOpcion[];
  personalSeleccionado?: number;
  onCambiarPersonal?: (id: number) => void;
}

export const FiltrosConsultorActividades: React.FC<Props> = ({
  filtros,
  onCambiarFiltros,
  onBuscar,
  onAgregarActividad,
  opcionesPersonal,
  personalSeleccionado,
  onCambiarPersonal,
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
    <div
      className="card mb-4 p-4 filter-card"
      style={{ position: "relative", zIndex: 40, overflow: "visible" }}
    >
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
          {/* 0. Personal (solo cuando se pasan opcionesPersonal) */}
          {opcionesPersonal && (
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <label
                style={{
                  fontSize: "12px",
                  fontWeight: 500,
                  color: "#475569",
                  fontFamily: "Roboto, sans-serif",
                }}
              >
                Personal
              </label>
              <select
                value={personalSeleccionado ?? 0}
                onChange={(e) => onCambiarPersonal?.(Number(e.target.value))}
                style={{
                  height: "36px",
                  padding: "0 10px",
                  border: "1px solid #cbd5e1",
                  borderRadius: "6px",
                  fontSize: "13px",
                  color: "#1e293b",
                  background: "#fff",
                  fontFamily: "Roboto, sans-serif",
                  outline: "none",
                  cursor: "pointer",
                  minWidth: "180px",
                }}
              >
                {opcionesPersonal.some((o) => o.b_EsPropio) && (
                  <option value={-1}>Mías</option>
                )}
                <option value={0}>Todos</option>
                {opcionesPersonal
                  .filter((o) => !o.b_EsPropio)
                  .map((o) => (
                    <option key={o.i_CveInstructor} value={o.i_CveInstructor}>
                      {o.v_Nombre}
                    </option>
                  ))}
              </select>
            </div>
          )}

          {/* 1. Fin compromiso */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "4px",
              minWidth: "200px",
              position: "relative",
              zIndex: 50,
            }}
          >
            <label className="form-label" style={{ marginBottom: 0 }}>
              Fin compromiso
            </label>
            <DateRangePickerPopover
              fechaInicio={filtros.fechaInicio}
              fechaFin={filtros.fechaFin}
              placeholder="Todas las fechas"
              onChangeRange={(inicio, fin) => {
                const nuevosFiltros: FiltrosConsultorActividadesState = {
                  ...filtros,
                  fechaInicio: inicio,
                  fechaFin: fin,
                  usarRango: true,
                };
                onCambiarFiltros(nuevosFiltros);
                onBuscar();
              }}
              onLimpiar={() => {
                const nuevosFiltros: FiltrosConsultorActividadesState = {
                  ...filtros,
                  fechaInicio: "",
                  fechaFin: "",
                  usarRango: false,
                };
                onCambiarFiltros(nuevosFiltros);
                onBuscar();
              }}
            />
          </div>

          {/* 3. Prioridad */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "4px",
              minWidth: "130px",
            }}
          >
            <label className="form-label" style={{ marginBottom: 0 }}>
              Prioridad
            </label>
            <select
              className="form-select text-xs py-1.5"
              style={{ borderRadius: "20px", height: "32px", fontWeight: 500 }}
              value={filtros.iPrioridad}
              onChange={(e) => {
                const val = Number(e.target.value) as 0 | PrioridadActividad;
                onCambiarFiltros({ ...filtros, iPrioridad: val });
                onBuscar();
              }}
            >
              <option value={0}>Todas</option>
              <option value={1}>Alta</option>
              <option value={2}>Media</option>
              <option value={3}>Baja</option>
            </select>
          </div>

          {/* 4. Ligada a */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "4px",
              minWidth: "130px",
            }}
          >
            <label className="form-label" style={{ marginBottom: 0 }}>
              Ligada a
            </label>
            <select
              className="form-select text-xs py-1.5"
              style={{ borderRadius: "20px", height: "32px", fontWeight: 500 }}
              value={filtros.iLiga}
              onChange={(e) => {
                const val = Number(e.target.value) as 0 | 1 | 2;
                onCambiarFiltros({ ...filtros, iLiga: val });
                onBuscar();
              }}
            >
              <option value={0}>Todas</option>
              <option value={1}>Proyecto</option>
              <option value={2}>General</option>
            </select>
          </div>

          {/* 5. Buscador + 6. Botón Agregar actividad */}
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              alignItems: "flex-end",
              gap: "10px",
              marginLeft: "auto",
              flexWrap: "wrap",
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "4px",
                width: "250px",
                minWidth: "160px",
              }}
            >
              <label className="form-label" style={{ marginBottom: 0 }}>
                Buscar
              </label>
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
                  style={{
                    width: "100%",
                    paddingLeft: "28px",
                    borderRadius: "20px",
                    height: "32px",
                  }}
                  placeholder="Buscar actividad o proyecto (Enter)..."
                  value={localSearch}
                  onChange={(e) => setLocalSearch(e.target.value)}
                  onKeyDown={handleKeyDownSearch}
                />
              </div>
            </div>

            {onAgregarActividad && (
              <button
                type="button"
                className="btn btn-primary"
                onClick={onAgregarActividad}
                style={{
                  height: "32px",
                  padding: "0 14px",
                  fontSize: "12.5px",
                  fontWeight: 600,
                  borderRadius: "20px",
                  backgroundColor: "#2B8FCC",
                  borderColor: "#2B8FCC",
                  color: "#ffffff",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  whiteSpace: "nowrap",
                }}
              >
                <Plus size={15} />
                <span>Agregar actividad</span>
              </button>
            )}
          </div>
        </div>
    </div>
  );
};

