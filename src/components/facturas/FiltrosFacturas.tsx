"use client";

import React, { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import { FiltrosFacturasState, EsEstadoPendiente } from "@/types/facturas";
import InputFechaTexto from "@/components/ui/InputFechaTexto";

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

    let nuevaFecha = filtros.fechaPago;
    if (!esPendienteNuevo) {
      // Limpiar al cambiar a estado no-pendiente
      nuevaFecha = null;
    } else if (!esPendientePrevio && esPendienteNuevo && !nuevaFecha) {
      // Restablecer a hoy si vuelve a pendiente sin fecha capturada
      nuevaFecha = new Date().toISOString().split("T")[0];
    }

    onCambiarFiltros({
      ...filtros,
      estado: nuevoEstado,
      fechaPago: nuevaFecha,
    });
  };

  const handleFechaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onCambiarFiltros({
      ...filtros,
      fechaPago: e.target.value || null,
    });
  };

  const handleKeyDownSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      onCambiarFiltros({ ...filtros, searchTerm: localSearch });
      onBuscar();
    }
  };

  return (
    <div className="card mb-4 p-3 sm:p-4 filter-card" style={{ position: "relative", zIndex: 10 }}>
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "flex-end",
          justifyContent: "space-between",
          gap: "12px",
          flexWrap: "wrap",
          width: "100%",
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

          {/* 1.2 Filtro Fecha de pago (Condicional) */}
          {EsEstadoPendiente(filtros.estado) && (
            <div style={{ display: "flex", flexDirection: "column", gap: "3px", flex: "1 1 130px", minWidth: "120px" }}>
              <label className="form-label" style={{ marginBottom: 0, fontSize: "11px", fontWeight: 600, color: "#475569" }}>
                Fecha de pago
              </label>
              <InputFechaTexto
                value={filtros.fechaPago || ""}
                onChange={(val) =>
                  onCambiarFiltros({
                    ...filtros,
                    fechaPago: val || null,
                  })
                }
                height="34px"
                style={{ borderRadius: "20px" }}
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
