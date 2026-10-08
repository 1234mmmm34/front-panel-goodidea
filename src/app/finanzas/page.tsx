"use client";

import React, { useState, useEffect, useCallback } from "react";
import { format, startOfMonth } from "date-fns";
import { AppLayout } from "@/components/layout/AppLayout";
import { DashboardFinanzas } from "@/types/finanzas";
import { FinanzasService } from "@/services/finanzas.service";
import { FiltrosFinanzas } from "@/components/finanzas/FiltrosFinanzas";
import { TarjetasKpisFinanzas } from "@/components/finanzas/TarjetasKpisFinanzas";
import { GraficasFinanzas } from "@/components/finanzas/GraficasFinanzas";
import { TablaTopClientes } from "@/components/finanzas/TablaTopClientes";
import { useToast } from "@/context/ToastContext";

export default function FinanzasPage() {
  const { toast } = useToast();

  const anioActual = new Date().getFullYear();
  const primerDiaAnio = `${anioActual}-01-01`;
  const ultimoDiaAnio = `${anioActual}-12-31`;

  const [fechaInicio, setFechaInicio] = useState<string>(primerDiaAnio);
  const [fechaFin, setFechaFin] = useState<string>(ultimoDiaAnio);
  const [datos, setDatos] = useState<DashboardFinanzas | null>(null);
  const [cargando, setCargando] = useState<boolean>(true);

  // Cargar datos desde el endpoint
  const cargarDashboard = useCallback(
    async (ini: string, fin: string) => {
      setCargando(true);
      try {
        const res = await FinanzasService.getDashboard(ini, fin);
        setDatos(res);
      } catch (error: any) {
        console.error("[FinanzasPage API ERROR]:", error);
        let mensajeError = "No se pudieron obtener los datos del dashboard de finanzas.";
        if (error?.response?.data) {
          if (typeof error.response.data === "string") {
            mensajeError = error.response.data;
          } else if (typeof error.response.data === "object") {
            mensajeError =
              error.response.data.mensaje ||
              error.response.data.message ||
              error.response.data.error ||
              mensajeError;
          }
        } else if (error?.message) {
          mensajeError = error.message;
        }

        toast.error(mensajeError);
        // NOTA: Se conservan los datos anteriores en pantalla si ocurre un error (no se resetea a null)
      } finally {
        setCargando(false);
      }
    },
    [toast]
  );

  useEffect(() => {
    cargarDashboard(fechaInicio, fechaFin);
  }, [cargarDashboard, fechaInicio, fechaFin]);

  const handleCambiarFiltro = (ini: string, fin: string) => {
    if (ini && fin && ini > fin) {
      return;
    }
    setFechaInicio(ini);
    setFechaFin(fin);
  };

  const handleRecargar = () => {
    cargarDashboard(fechaInicio, fechaFin);
  };

  return (
    <AppLayout>
      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        {/* Encabezado y Filtros */}
        <FiltrosFinanzas
          fechaInicio={fechaInicio}
          fechaFin={fechaFin}
          fechaInicioAplicada={datos?.kpis?.d_FechaInicio}
          fechaFinAplicada={datos?.kpis?.d_FechaFin}
          cargando={cargando}
          onCambiarFiltro={handleCambiarFiltro}
          onRecargar={handleRecargar}
        />

        {/* Tarjetas KPIs (Cobranza y Rentabilidad) */}
        <TarjetasKpisFinanzas kpis={datos?.kpis ?? null} cargando={cargando} />

        {/* Gráficas (Total de ventas & Antigüedad de Cartera) */}
        <GraficasFinanzas
          serieMensual={datos?.serieMensual ?? []}
          antiguedad={datos?.antiguedad ?? []}
          fechaInicio={datos?.kpis?.d_FechaInicio || fechaInicio}
          fechaFin={datos?.kpis?.d_FechaFin || fechaFin}
          fechaCorte={datos?.kpis?.d_FechaCorte}
          cargando={cargando}
        />

        {/* Tabla: Saldo pendiente por cliente */}
        <TablaTopClientes
          topClientes={datos?.topClientes ?? []}
          totalPorCobrar={datos?.kpis?.d_PorCobrar ?? 0}
          cargando={cargando}
        />
      </div>
    </AppLayout>
  );
}
