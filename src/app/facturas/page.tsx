"use client";

import React, { useState, useEffect, useCallback } from "react";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { AppLayout } from "@/components/layout/AppLayout";
import { FacturaGetDto, FiltrosFacturasState, FacturasResumenDto } from "@/types/facturas";
import { FacturasService } from "@/services/facturas.service";
import { FiltrosFacturas } from "@/components/facturas/FiltrosFacturas";
import { TablaFacturas } from "@/components/facturas/TablaFacturas";
import { TarjetasResumenFacturas } from "@/components/facturas/TarjetasResumenFacturas";
import {
  ModalNuevaFactura,
  ModalFacturaDetalle,
  ModalTimbrado,
  ModalCancelarFacturas,
} from "@/components/facturas/ModalesFacturas";

export default function FacturasPage() {
  const ahora = new Date();
  const primerDiaMes = format(startOfMonth(ahora), "yyyy-MM-dd");
  const ultimoDiaMes = format(endOfMonth(ahora), "yyyy-MM-dd");

  // 1. Estado de filtros (Default: "Pendientes" y Rango del mes completo)
  const [filtros, setFiltros] = useState<FiltrosFacturasState>({
    estado: "Pendientes",
    fechaInicio: primerDiaMes,
    fechaFin: ultimoDiaMes,
    fechaPago: primerDiaMes,
    searchTerm: "",
  });

  // 2. Estado de paginación
  const [pagina, setPagina] = useState<number>(1);
  const [tamano, setTamano] = useState<number>(10);
  const [totalPaginas, setTotalPaginas] = useState<number>(1);
  const [totalRegistros, setTotalRegistros] = useState<number>(0);

  // 3. Datos, Resumen y estado de carga
  const [datos, setDatos] = useState<FacturaGetDto[]>([]);
  const [resumen, setResumen] = useState<FacturasResumenDto | null>(null);
  const [cargando, setCargando] = useState<boolean>(true);
  const [cargandoResumen, setCargandoResumen] = useState<boolean>(true);

  // 4. Estados para Modales
  const [modalNuevaAbierto, setModalNuevaAbierto] = useState<boolean>(false);
  const [facturaSeleccionada, setFacturaSeleccionada] = useState<FacturaGetDto | null>(null);
  const [modalDetalleAbierto, setModalDetalleAbierto] = useState<boolean>(false);
  const [modalTimbradoAbierto, setModalTimbradoAbierto] = useState<boolean>(false);
  const [modalCancelarAbierto, setModalCancelarAbierto] = useState<boolean>(false);

  // Carga de datos y resumen de facturas
  const cargarFacturas = useCallback(
    async (pageToLoad: number, pageSizeToLoad: number, currentFiltros: FiltrosFacturasState) => {
      setCargando(true);
      setCargandoResumen(true);

      const [resFacturas, resResumen] = await Promise.all([
        FacturasService.getFacturas({
          estado: currentFiltros.estado,
          fechaInicio: currentFiltros.fechaInicio,
          fechaFin: currentFiltros.fechaFin,
          fechaPago: currentFiltros.fechaInicio,
          fechaPagoFin: currentFiltros.fechaFin,
          searchTerm: currentFiltros.searchTerm,
          pagina: pageToLoad,
          tamano: pageSizeToLoad,
        }),
        FacturasService.getFacturasResumen({
          estado: currentFiltros.estado,
          fechaInicio: currentFiltros.fechaInicio,
          fechaFin: currentFiltros.fechaFin,
          fechaPago: currentFiltros.fechaInicio,
          fechaPagoFin: currentFiltros.fechaFin,
          searchTerm: currentFiltros.searchTerm,
        }),
      ]);

      setDatos(resFacturas.datos);
      setTotalRegistros(resFacturas.total);
      setTotalPaginas(resFacturas.totalPaginas);
      setCargando(false);

      setResumen(resResumen);
      setCargandoResumen(false);
    },
    []
  );

  useEffect(() => {
    cargarFacturas(pagina, tamano, filtros);
  }, [pagina, tamano, filtros, cargarFacturas]);

  // Manejadores de cambios en filtros
  const handleCambiarFiltros = (nuevosFiltros: FiltrosFacturasState) => {
    setFiltros(nuevosFiltros);
    setPagina(1); // Resetea a página 1 al cambiar filtro
  };

  const handleBuscar = () => {
    setPagina(1);
    cargarFacturas(1, tamano, filtros);
  };

  const handleCambioPagina = (nuevaPagina: number) => {
    setPagina(nuevaPagina);
  };

  const handleCambioTamano = (nuevoTamano: number) => {
    setTamano(nuevoTamano);
    setPagina(1); // Resetea a página 1 al cambiar tamaño
  };

  // Manejadores de modales
  const handleAbrirDetalle = (item: FacturaGetDto) => {
    setFacturaSeleccionada(item);
    setModalDetalleAbierto(true);
  };

  const handleAbrirTimbrado = (item: FacturaGetDto) => {
    setFacturaSeleccionada(item);
    setModalTimbradoAbierto(true);
  };

  const handleAbrirCancelar = (item: FacturaGetDto) => {
    setFacturaSeleccionada(item);
    setModalCancelarAbierto(true);
  };

  return (
    <AppLayout>
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {/* Título de la página */}
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
            Facturas
          </h1>
        </div>

        {/* Tarjetas de Resumen de Facturas */}
        <TarjetasResumenFacturas resumen={resumen} cargando={cargandoResumen} />

        {/* 1. Encabezado y barra de filtros */}
        <FiltrosFacturas
          filtros={filtros}
          onCambiarFiltros={handleCambiarFiltros}
          onBuscar={handleBuscar}
          onNuevaFactura={() => setModalNuevaAbierto(true)}
        />

        {/* 2. Tabla de Facturas */}
        <TablaFacturas
          datos={datos}
          cargando={cargando}
          paginaActual={pagina}
          totalPaginas={totalPaginas}
          totalRegistros={totalRegistros}
          tamano={tamano}
          onCambioPagina={handleCambioPagina}
          onCambioTamano={handleCambioTamano}
          onVerDetalle={handleAbrirDetalle}
          onTimbrar={handleAbrirTimbrado}
          onCancelar={handleAbrirCancelar}
        />
      </div>

      {/* Modales */}
      <ModalNuevaFactura
        abierto={modalNuevaAbierto}
        onCerrar={() => setModalNuevaAbierto(false)}
        onGuardar={() => cargarFacturas(pagina, tamano, filtros)}
      />

      <ModalFacturaDetalle
        abierto={modalDetalleAbierto}
        factura={facturaSeleccionada}
        onCerrar={() => {
          setModalDetalleAbierto(false);
          setFacturaSeleccionada(null);
        }}
        onCambio={() => cargarFacturas(pagina, tamano, filtros)}
      />

      <ModalTimbrado
        abierto={modalTimbradoAbierto}
        factura={facturaSeleccionada}
        onCerrar={() => {
          setModalTimbradoAbierto(false);
          setFacturaSeleccionada(null);
        }}
        onGuardar={() => cargarFacturas(pagina, tamano, filtros)}
      />

      <ModalCancelarFacturas
        abierto={modalCancelarAbierto}
        factura={facturaSeleccionada}
        onCerrar={() => {
          setModalCancelarAbierto(false);
          setFacturaSeleccionada(null);
        }}
        onGuardadoExitoso={() => cargarFacturas(pagina, tamano, filtros)}
      />
    </AppLayout>
  );
}
