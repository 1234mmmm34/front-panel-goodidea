"use client";

import React, { useState, useMemo } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { PROYECTOS_DASHBOARD_MOCK } from "@/types/dashboardProyectos";
import { FiltrosDashboardProyectos } from "@/components/dashboard-proyectos/FiltrosDashboardProyectos";
import { TarjetasKpisProyectos } from "@/components/dashboard-proyectos/TarjetasKpisProyectos";
import { GraficasProyectos } from "@/components/dashboard-proyectos/GraficasProyectos";
import { TablaProyectosMas30Dias } from "@/components/dashboard-proyectos/TablaProyectosMas30Dias";

export default function DashboardProyectosPage() {
  const [fechaInicio, setFechaInicio] = useState<string>("2026-01-01");
  const [fechaFin, setFechaFin] = useState<string>("2026-12-31");
  const [rubroSeleccionado, setRubroSeleccionado] = useState<string>("");
  const [asesorSeleccionado, setAsesorSeleccionado] = useState<string>("");
  const [cargando, setCargando] = useState<boolean>(false);
  const [reloadTick, setReloadTick] = useState<number>(0);

  const handleCambiarFecha = (ini: string, fin: string) => {
    if (ini && fin && ini > fin) {
      return;
    }
    setFechaInicio(ini);
    setFechaFin(fin);
  };

  // Recargar vuelve a pintar los mocks sin reiniciar los filtros
  const handleRecargar = () => {
    setCargando(true);
    setTimeout(() => {
      setReloadTick((prev) => prev + 1);
      setCargando(false);
    }, 180);
  };

  const proyectosFiltrados = useMemo(() => {
    void reloadTick;
    return PROYECTOS_DASHBOARD_MOCK.filter((p) => {
      const cumpleRubro = !rubroSeleccionado || p.v_Rubro === rubroSeleccionado;
      const cumpleAsesor =
        !asesorSeleccionado || p.v_Asesor === asesorSeleccionado;
      return cumpleRubro && cumpleAsesor;
    });
  }, [rubroSeleccionado, asesorSeleccionado, reloadTick]);

  return (
    <AppLayout>
      <div
        key={reloadTick}
        style={{ display: "flex", flexDirection: "column", gap: "20px" }}
      >
        {/* Encabezado y Barra de Filtros */}
        <FiltrosDashboardProyectos
          fechaInicio={fechaInicio}
          fechaFin={fechaFin}
          rubroSeleccionado={rubroSeleccionado}
          asesorSeleccionado={asesorSeleccionado}
          cargando={cargando}
          onCambiarFecha={handleCambiarFecha}
          onCambiarRubro={setRubroSeleccionado}
          onCambiarAsesor={setAsesorSeleccionado}
          onRecargar={handleRecargar}
        />

        {/* Sección RESUMEN (KPIs) */}
        <TarjetasKpisProyectos
          proyectos={proyectosFiltrados}
          asesorSeleccionado={asesorSeleccionado}
          cargando={cargando}
        />

        {/* Sección DISTRIBUCIÓN y Segunda Fila de Gráficas */}
        <GraficasProyectos
          proyectos={proyectosFiltrados}
          rubroSeleccionado={rubroSeleccionado}
          asesorSeleccionado={asesorSeleccionado}
          cargando={cargando}
        />

        {/* Tabla: Detalle de proyectos con más de 30 días */}
        <TablaProyectosMas30Dias
          proyectos={proyectosFiltrados}
          cargando={cargando}
        />
      </div>
    </AppLayout>
  );
}

