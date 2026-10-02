"use client";

import React, { useState, useEffect } from "react";
import { FiltrosGastosState } from "@/types/gastos";
import { ProveedorGetDto } from "@/types/servicios";
import DateRangePickerPopover from "@/components/ui/DateRangePickerPopover";

interface Props {
  filtros: FiltrosGastosState;
  proveedores: ProveedorGetDto[];
  onCambiarFiltros: (nuevosFiltros: FiltrosGastosState) => void;
  onBuscar: () => void;
}

export const FiltrosGastos: React.FC<Props> = ({
  filtros,
  proveedores,
  onCambiarFiltros,
  onBuscar,
}) => {
  const [localSearch, setLocalSearch] = useState<string>(filtros.searchTerm);

  useEffect(() => {
    setLocalSearch(filtros.searchTerm);
  }, [filtros.searchTerm]);

  const handleEstadoChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const nuevoEstado = e.target.value;
    onCambiarFiltros({
      ...filtros,
      estado: nuevoEstado,
    });
  };

  const handleProveedorChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const idProv = Number(e.target.value) || 0;
    onCambiarFiltros({
      ...filtros,
      i_CveProveedor: idProv,
    });
  };

  const obtenerLabelFecha = (estado: string): string => {
    switch (estado) {
      case "Pagada":
        return "Fecha de pago";
      case "Pendientes":
      case "Sin pagar":
      case "Abonada":
      case "Vencidas":
        return "Fecha de pago programada";
      case "Cancelada":
      case "SinProgramar":
      case "":
      default:
        return "Fecha del servicio";
    }
  };

  const handleKeyDownSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      onCambiarFiltros({ ...filtros, searchTerm: localSearch });
      onBuscar();
    }
  };

  return (
    <div
      className="card mb-4 p-3 sm:p-4 filter-card"
      style={{ position: "relative", zIndex: 40, overflow: "visible" }}
    >
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
        {/* Filtros a la izquierda */}
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
          {/* 1. Estado */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "3px",
              width: "200px",
              maxWidth: "220px",
            }}
          >
            <label
              className="form-label"
              style={{
                marginBottom: 0,
                fontSize: "11px",
                fontWeight: 600,
                color: "#475569",
              }}
            >
              Estado
            </label>
            <select
              className="form-select text-xs py-1.5"
              style={{
                borderRadius: "20px",
                height: "34px",
                width: "100%",
                border: "1px solid #cbd5e1",
                outline: "none",
              }}
              value={filtros.estado}
              onChange={handleEstadoChange}
            >
              <option value="">Todos</option>
              <option value="Pendientes">Pendientes de pago</option>
              <option value="Pagada">Pagada</option>
              <option value="Abonada">Abonada</option>
              <option value="Sin pagar">Sin pagar</option>
              <option value="Vencidas">Vencidas</option>
              <option value="SinProgramar">Sin pagos programados</option>
              <option value="Cancelada">Cancelada</option>
            </select>
          </div>

          {/* 2. Proveedor */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "3px",
              width: "220px",
              maxWidth: "240px",
            }}
          >
            <label
              className="form-label"
              style={{
                marginBottom: 0,
                fontSize: "11px",
                fontWeight: 600,
                color: "#475569",
              }}
            >
              Proveedor
            </label>
            <select
              className="form-select text-xs py-1.5"
              style={{
                borderRadius: "20px",
                height: "34px",
                width: "100%",
                border: "1px solid #cbd5e1",
                outline: "none",
              }}
              value={filtros.i_CveProveedor}
              onChange={handleProveedorChange}
            >
              <option value={0}>Todos los proveedores</option>
              {proveedores.map((prov) => (
                <option key={prov.i_CveProveedor} value={prov.i_CveProveedor}>
                  {prov.v_Nombre || prov.v_RazonSocial || `Proveedor #${prov.i_CveProveedor}`}
                </option>
              ))}
            </select>
          </div>

          {/* 3. Rango de fechas */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "3px",
              minWidth: "220px",
              position: "relative",
              zIndex: 50,
            }}
          >
            <label
              className="form-label"
              style={{
                marginBottom: 0,
                fontSize: "11px",
                fontWeight: 600,
                color: "#475569",
              }}
            >
              {obtenerLabelFecha(filtros.estado)}
            </label>
            <DateRangePickerPopover
              fechaInicio={filtros.fechaInicio}
              fechaFin={filtros.fechaFin}
              onChangeRange={(inicio, fin) => {
                onCambiarFiltros({
                  ...filtros,
                  fechaInicio: inicio,
                  fechaFin: fin,
                });
                onBuscar();
              }}
            />
          </div>
        </div>

        {/* Buscador a la derecha */}
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            gap: "8px",
            flex: "1 1 auto",
            justifyContent: "flex-end",
          }}
        >
          <input
            type="text"
            className="form-input text-xs py-1.5 px-3"
            style={{
              borderRadius: "20px",
              height: "34px",
              flex: "1 1 200px",
              maxWidth: "280px",
              minWidth: "140px",
              border: "1px solid #cbd5e1",
              outline: "none",
            }}
            placeholder="Buscar por proveedor, servicio, OC o cotización..."
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            onKeyDown={handleKeyDownSearch}
          />
        </div>
      </div>
    </div>
  );
};
