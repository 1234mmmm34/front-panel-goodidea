"use client";

import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { DashboardProyectos, mapaIniciales } from "@/types/dashboardProyectos";
import { DashboardProyectosService } from "@/services/dashboardProyectos.service";
import { FiltrosDashboardProyectos } from "@/components/dashboard-proyectos/FiltrosDashboardProyectos";
import { TarjetasKpisProyectos } from "@/components/dashboard-proyectos/TarjetasKpisProyectos";
import { GraficasProyectos } from "@/components/dashboard-proyectos/GraficasProyectos";
import { TablaProyectosMas30Dias } from "@/components/dashboard-proyectos/TablaProyectosMas30Dias";
import { useToast } from "@/context/ToastContext";

export default function DashboardProyectosPage() {
  const { toast } = useToast();
  const toastRef = useRef(toast);
  useEffect(() => {
    toastRef.current = toast;
  }, [toast]);

  const anioActual = new Date().getFullYear();
  const [fechaInicio, setFechaInicio] = useState<string>(`${anioActual}-01-01`);
  const [fechaFin, setFechaFin] = useState<string>(`${anioActual}-12-31`);
  const [iCveRubro, setICveRubro] = useState<number>(0);
  const [iCveInstructor, setICveInstructor] = useState<number>(0);
  const [datos, setDatos] = useState<DashboardProyectos | null>(null);
  const [cargando, setCargando] = useState<boolean>(true);

  const cargarDatos = useCallback(async () => {
    setCargando(true);
    try {
      const res = await DashboardProyectosService.getDashboard({
        fechaInicio,
        fechaFin,
        iCveRubro,
        iCveInstructor,
      });
      setDatos(res);
      if (
        iCveInstructor !== 0 &&
        !res.asesores.some((a) => a.i_CveInstructor === iCveInstructor)
      ) {
        setICveInstructor(0);
      }
    } catch {
      toastRef.current.error("No se pudo cargar el dashboard de proyectos.");
      setDatos({
        proyectos: [],
        asignaciones: [],
        rubros: [],
        asesores: [],
      });
    } finally {
      setCargando(false);
    }
  }, [fechaInicio, fechaFin, iCveRubro, iCveInstructor]);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  const handleCambiarFecha = (ini: string, fin: string) => {
    if (ini && fin && ini > fin) {
      return;
    }
    setFechaInicio(ini);
    setFechaFin(fin);
  };

  const proyectos = datos?.proyectos ?? [];
  const asignaciones = datos?.asignaciones ?? [];
  const rubros = datos?.rubros ?? [];
  const asesores = datos?.asesores ?? [];

  const inicialesMap = useMemo(
    () => mapaIniciales(asesores.map((a) => a.v_Asesor)),
    [asesores]
  );

  return (
    <AppLayout>
      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        {/* Encabezado y Barra de Filtros */}
        <FiltrosDashboardProyectos
          fechaInicio={fechaInicio}
          fechaFin={fechaFin}
          iCveRubro={iCveRubro}
          iCveInstructor={iCveInstructor}
          rubros={rubros}
          asesores={asesores}
          cargando={cargando}
          onCambiarFecha={handleCambiarFecha}
          onCambiarRubro={setICveRubro}
          onCambiarAsesor={setICveInstructor}
          onRecargar={cargarDatos}
        />

        {/* Sección RESUMEN (KPIs) */}
        <TarjetasKpisProyectos
          proyectos={proyectos}
          asignaciones={asignaciones}
          iCveInstructor={iCveInstructor}
          cargando={cargando}
        />

        {/* Sección DISTRIBUCIÓN y Segunda Fila de Gráficas */}
        <GraficasProyectos
          proyectos={proyectos}
          asignaciones={asignaciones}
          iCveRubro={iCveRubro}
          iCveInstructor={iCveInstructor}
          inicialesMap={inicialesMap}
          cargando={cargando}
        />

        {/* Tabla: Detalle de proyectos con más de 30 días */}
        <TablaProyectosMas30Dias
          proyectos={proyectos}
          inicialesMap={inicialesMap}
          cargando={cargando}
        />
      </div>
    </AppLayout>
  );
}
