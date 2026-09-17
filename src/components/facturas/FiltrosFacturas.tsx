"use client";

import React, { useState, useEffect } from "react";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { Plus } from "lucide-react";
import { FiltrosFacturasState, EsEstadoPendiente } from "@/types/facturas";
import DateRangePickerPopover from "@/components/ui/DateRangePickerPopover";

interface Props {
  filtros: FiltrosFacturasState;
  onCambiarFiltros: (nuevosFiltros: FiltrosFacturasState) => void;
  onBuscar: () => void;
  onNuevaFactura: () => void;
}

export const FiltrosFacturas: React.FC<Props> = ({
  filtros,
  onCambiarFiltros,
  onBuscar,
  onNuevaFactura,
}) => {
  const [localSearch, setLocalSearch] = useState<string>(filtros.searchTerm);

  useEffect(() => {
    setLocalSearch(filtros.searchTerm);
  }, [filtros.searchTerm]);

  const handleEstadoChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const nuevoEstado = e.target.value;
    const esPendientePrevio = EsEstadoPendiente(filtros.estado);
    const esPendienteNuevo = EsEstadoPendiente(nuevoEstado);

    let nuevaFechaIni = filtros.fechaInicio;
    let nuevaFechaFin = filtros.fechaFin;
    let nuevaFechaPago = filtros.fechaPago;

    if (!esPendienteNuevo) {
      // Limpiar al cambiar a estado no-pendiente
      nuevaFechaIni = "";
      nuevaFechaFin = "";
      nuevaFechaPago = null;
    } else if (!esPendientePrevio && esPendienteNuevo && !nuevaFechaIni) {
      // Restablecer al mes completo por default
      const ahora = new Date();
      nuevaFechaIni = format(startOfMonth(ahora), "yyyy-MM-dd");
      nuevaFechaFin = format(endOfMonth(ahora), "yyyy-MM-dd");
      nuevaFechaPago = nuevaFechaIni;
    }

    onCambiarFiltros({
      ...filtros,
      estado: nuevoEstado,
      fechaInicio: nuevaFechaIni,
      fechaFin: nuevaFechaFin,
      fechaPago: nuevaFechaPago,
    });
  };

  const handleKeyDownSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      onCambiarFiltros({ ...filtros, searchTerm: localSearch });
      onBuscar();
    }
  };

  return (
    <div className="card mb-4 p-3 sm:p-4 filter-card" style={{ position: "relative", zIndex: 40, overflow: "visible" }}>
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "flex-end",
          justifyContent: "space-between",
          gap: "12px",
          flexWrap: "wrap",
          width: "100%",
          overflow: "visible",
        }}
      >
        {/* Controles de filtro a la izquierda */}
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "flex-end",
            gap: "12px",
            flexWrap: "wrap",
            flex: "1 1 auto",
            overflow: "visible",
          }}
        >
          {/* 1.1 Filtro Estado */}
          <div style={{ display: "flex", flexDirection: "column", gap: "3px", width: "220px", maxWidth: "240px" }}>
            <label className="form-label" style={{ marginBottom: 0, fontSize: "11px", fontWeight: 600, color: "#475569" }}>
              Estado
            </label>
            <select
              className="form-select text-xs py-1.5"
              style={{ borderRadius: "20px", height: "34px", width: "100%", border: "1px solid #cbd5e1", outline: "none" }}
              value={filtros.estado}
              onChange={handleEstadoChange}
            >
              <option value="">Todos</option>
              <option value="Pendientes">Pendientes de cobro</option>
              <option value="Abonada">Abonada</option>
              <option value="Cobrada">Liquidada</option>
              <option value="SinProgramar">Sin pago programado</option>
            </select>
          </div>

          {/* 1.2 Filtro Rango de fechas de pago (Condicional) */}
          {EsEstadoPendiente(filtros.estado) && (
            <div style={{ display: "flex", flexDirection: "column", gap: "3px", minWidth: "220px", position: "relative", zIndex: 50 }}>
              <label className="form-label" style={{ marginBottom: 0, fontSize: "11px", fontWeight: 600, color: "#475569" }}>
                Fecha de pago
              </label>
              <DateRangePickerPopover
                fechaInicio={filtros.fechaInicio}
                fechaFin={filtros.fechaFin}
                onChangeRange={(inicio, fin) => {
                  onCambiarFiltros({
                    ...filtros,
                    fechaInicio: inicio,
                    fechaFin: fin,
                    fechaPago: inicio,
                  });
                  onBuscar();
                }}
              />
            </div>
          )}
        </div>

        {/* Buscador y botón + a la derecha */}
        <div style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: "8px", flex: "1 1 auto", justifyContent: "flex-end" }}>
          {/* 1.3 Buscador con Enter */}
          <input
            type="text"
            className="form-input text-xs py-1.5 px-3"
            style={{ borderRadius: "20px", height: "34px", flex: "1 1 160px", maxWidth: "240px", minWidth: "120px", border: "1px solid #cbd5e1", outline: "none" }}
            placeholder="Buscar..."
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            onKeyDown={handleKeyDownSearch}
          />

          {/* 1.4 Botón "+" / "Nueva factura" */}
          <button
            type="button"
            className="btn btn-primary filter-action-btn"
            onClick={onNuevaFactura}
            title="Nueva Factura"
          >
            <Plus size={16} />
            <span className="filter-btn-text">Nueva factura</span>
          </button>
        </div>
      </div>
    </div>
  );
};
