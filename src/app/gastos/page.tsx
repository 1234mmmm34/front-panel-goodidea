"use client";

import React, { useState, useEffect, useCallback } from "react";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { AppLayout } from "@/components/layout/AppLayout";
import {
  FacturaProv,
  FacturasProvResumen,
  FiltrosGastosState,
} from "@/types/gastos";
import { ProveedorGetDto } from "@/types/servicios";
import { GastosService } from "@/services/gastos.service";
import { AgendaService } from "@/services/agenda.service";
import { TarjetasResumenGastos } from "@/components/gastos/TarjetasResumenGastos";
import { FiltrosGastos } from "@/components/gastos/FiltrosGastos";
import { TablaGastos } from "@/components/gastos/TablaGastos";
import { ModalDetalleGasto } from "@/components/gastos/ModalDetalleGasto";
import { ModalCancelarGasto } from "@/components/gastos/ModalCancelarGasto";
import { PaginadoResponse } from "@/types/servicios";

export default function GastosPage() {
  const ahora = new Date();
  const primerDiaMes = format(startOfMonth(ahora), "yyyy-MM-dd");
  const ultimoDiaMes = format(endOfMonth(ahora), "yyyy-MM-dd");

  // Filtros (Default: "Todos" y rango del mes en curso)
  const [filtros, setFiltros] = useState<FiltrosGastosState>({
    estado: "",
    fechaInicio: primerDiaMes,
    fechaFin: ultimoDiaMes,
    i_CveProveedor: 0,
    searchTerm: "",
  });

  // Paginación
  const [pagina, setPagina] = useState<number>(1);
  const [tamano, setTamano] = useState<number>(10);

  // Lista de proveedores para el select
  const [proveedores, setProveedores] = useState<ProveedorGetDto[]>([]);

  // Datos paginados y resumen
  const [datosPaginados, setDatosPaginados] = useState<PaginadoResponse<FacturaProv> | null>(null);
  const [resumen, setResumen] = useState<FacturasProvResumen | null>(null);
  const [cargando, setCargando] = useState<boolean>(true);
  const [cargandoResumen, setCargandoResumen] = useState<boolean>(true);

  // Modales
  const [gastoSeleccionado, setGastoSeleccionado] = useState<FacturaProv | null>(null);
  const [modalDetalleAbierto, setModalDetalleAbierto] = useState<boolean>(false);
  const [autoAbrirProgramar, setAutoAbrirProgramar] = useState<boolean>(false);
  const [modalCancelarAbierto, setModalCancelarAbierto] = useState<boolean>(false);

  // Cargar lista de proveedores al montar
  useEffect(() => {
    const cargarProveedores = async () => {
      const list = await AgendaService.getProveedores();
      setProveedores(list);
    };
    cargarProveedores();
  }, []);

  // Carga de gastos y resumen
  const cargarGastos = useCallback(
    async (pageToLoad: number, pageSizeToLoad: number, currentFiltros: FiltrosGastosState) => {
      setCargando(true);
      setCargandoResumen(true);

      const [resGastos, resResumen] = await Promise.all([
        GastosService.getGastos({
          estado: currentFiltros.estado,
          fechaInicio: currentFiltros.fechaInicio,
          fechaFin: currentFiltros.fechaFin,
          i_CveProveedor: currentFiltros.i_CveProveedor,
          searchTerm: currentFiltros.searchTerm,
          pagina: pageToLoad,
          tamano: pageSizeToLoad,
        }),
        GastosService.getGastosResumen({
          estado: currentFiltros.estado,
          fechaInicio: currentFiltros.fechaInicio,
          fechaFin: currentFiltros.fechaFin,
          i_CveProveedor: currentFiltros.i_CveProveedor,
          searchTerm: currentFiltros.searchTerm,
        }),
      ]);

      setDatosPaginados(resGastos);
      setCargando(false);

      setResumen(resResumen);
      setCargandoResumen(false);
    },
    []
  );

  useEffect(() => {
    cargarGastos(pagina, tamano, filtros);
  }, [pagina, tamano, filtros, cargarGastos]);

  const handleCambiarFiltros = (nuevosFiltros: FiltrosGastosState) => {
    setFiltros(nuevosFiltros);
    setPagina(1);
  };

  const handleBuscar = () => {
    setPagina(1);
    cargarGastos(1, tamano, filtros);
  };

  const handleCambioPagina = (nuevaPagina: number) => {
    setPagina(nuevaPagina);
  };

  const handleAbrirDetalle = (gasto: FacturaProv) => {
    setAutoAbrirProgramar(false);
    setGastoSeleccionado(gasto);
    setModalDetalleAbierto(true);
  };

  const handleProgramarPago = (gasto: FacturaProv) => {
    setAutoAbrirProgramar(true);
    setGastoSeleccionado(gasto);
    setModalDetalleAbierto(true);
  };

  const handleAbrirCancelar = (gasto: FacturaProv) => {
    setGastoSeleccionado(gasto);
    setModalCancelarAbierto(true);
  };

  return (
    <AppLayout>
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {/* Encabezado */}
        <div>
          <h1
            style={{
              fontSize: "20px",
              fontWeight: 700,
              color: "#0f172a",
              margin: 0,
              padding: 0,
            }}
          >
            Gastos
          </h1>
          <p style={{ margin: 0, fontSize: "13px", color: "#64748b" }}>
            Cuentas por pagar a proveedores y sus pagos.
          </p>
        </div>

        {/* Tarjetas de Resumen */}
        <TarjetasResumenGastos resumen={resumen} cargando={cargandoResumen} />

        {/* Filtros */}
        <FiltrosGastos
          filtros={filtros}
          proveedores={proveedores}
          onCambiarFiltros={handleCambiarFiltros}
          onBuscar={handleBuscar}
        />

        {/* Tabla */}
        <TablaGastos
          datosPaginados={datosPaginados}
          cargando={cargando}
          paginaActual={pagina}
          tamano={tamano}
          onVerDetalle={handleAbrirDetalle}
          onProgramarPago={handleProgramarPago}
          onCancelarGasto={handleAbrirCancelar}
          onCambioPagina={handleCambioPagina}
          onCambioTamano={(nuevoTamano) => {
            setTamano(nuevoTamano);
            setPagina(1);
          }}
        />
      </div>

      {/* Modales */}
      <ModalDetalleGasto
        abierto={modalDetalleAbierto}
        gasto={gastoSeleccionado}
        autoAbrirProgramar={autoAbrirProgramar}
        onCerrar={() => {
          setModalDetalleAbierto(false);
          setGastoSeleccionado(null);
          setAutoAbrirProgramar(false);
        }}
        onCambio={() => cargarGastos(pagina, tamano, filtros)}
      />

      <ModalCancelarGasto
        abierto={modalCancelarAbierto}
        gasto={gastoSeleccionado}
        onCerrar={() => {
          setModalCancelarAbierto(false);
          setGastoSeleccionado(null);
        }}
        onExito={() => cargarGastos(pagina, tamano, filtros)}
      />
    </AppLayout>
  );
}
