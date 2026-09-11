"use client";

import React, { useState, useEffect, useCallback } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { FacturaGetDto, FiltrosFacturasState } from "@/types/facturas";
import { FacturasService } from "@/services/facturas.service";
import { FiltrosFacturas } from "@/components/facturas/FiltrosFacturas";
import { TablaFacturas } from "@/components/facturas/TablaFacturas";
import {
  ModalNuevaFactura,
  ModalFacturaDetalle,
  ModalTimbrado,
  ModalCancelarFacturas,
} from "@/components/facturas/ModalesFacturas";

export default function FacturasPage() {
  const hoyStr = new Date().toISOString().split("T")[0];

  // 1. Estado de filtros (Default: "Pendientes" y fechaPago = hoy)
  const [filtros, setFiltros] = useState<FiltrosFacturasState>({
    estado: "Pendientes",
    fechaPago: hoyStr,
    searchTerm: "",
  });

  // 2. Estado de paginación
  const [pagina, setPagina] = useState<number>(1);
  const [tamano, setTamano] = useState<number>(10);
  const [totalPaginas, setTotalPaginas] = useState<number>(1);
  const [totalRegistros, setTotalRegistros] = useState<number>(0);

  // 3. Datos y estado de carga
  const [datos, setDatos] = useState<FacturaGetDto[]>([]);
  const [cargando, setCargando] = useState<boolean>(true);

  // 4. Estados para Modales
  const [modalNuevaAbierto, setModalNuevaAbierto] = useState<boolean>(false);
  const [facturaSeleccionada, setFacturaSeleccionada] = useState<FacturaGetDto | null>(null);
  const [modalDetalleAbierto, setModalDetalleAbierto] = useState<boolean>(false);
  const [modalTimbradoAbierto, setModalTimbradoAbierto] = useState<boolean>(false);
  const [modalCancelarAbierto, setModalCancelarAbierto] = useState<boolean>(false);

  // Carga de datos de facturas
  const cargarFacturas = useCallback(
    async (pageToLoad: number, pageSizeToLoad: number, currentFiltros: FiltrosFacturasState) => {
      setCargando(true);
      const res = await FacturasService.getFacturas({
        estado: currentFiltros.estado,
        fechaPago: currentFiltros.fechaPago,
        searchTerm: currentFiltros.searchTerm,
        pagina: pageToLoad,
        tamano: pageSizeToLoad,
      });

      setDatos(res.datos);
      setTotalRegistros(res.total);
      setTotalPaginas(res.totalPaginas);
      setCargando(false);
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
