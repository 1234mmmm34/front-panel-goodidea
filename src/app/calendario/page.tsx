"use client";

import React, { useEffect, useState, useTransition } from "react";
import { ChevronLeft, ChevronRight, Sun } from "lucide-react";
import { AgendaGetDto } from "@/types/calendario";
import { AgendaService } from "@/services/agenda.service";
import {
  generarGridCalendario,
  startOfMonth,
  endOfMonth,
  addMonths,
  subMonths,
  format,
  capitalizar,
} from "@/lib/date-utils";
import { es } from "date-fns/locale";
import { GridCalendario } from "@/components/calendario/GridCalendario";
import { CalendarioSkeleton } from "@/components/calendario/CalendarioSkeleton";
import { AppLayout } from "@/components/layout/AppLayout";

export default function CalendarioPage() {
  const [mesActual, setMesActual] = useState<Date>(startOfMonth(new Date()));
  const [eventos, setEventos] = useState<AgendaGetDto[]>([]);
  const [cargando, setCargando] = useState<boolean>(true);
  const [, startTransition] = useTransition();

  const cargarEventosDelMes = async (fechaMes: Date) => {
    setCargando(true);
    const inicio = format(startOfMonth(fechaMes), "yyyy-MM-dd");
    const fin = format(endOfMonth(fechaMes), "yyyy-MM-dd");

    const datos = await AgendaService.getAgendaMes(inicio, fin);
    setEventos(datos);
    setCargando(false);
  };

  useEffect(() => {
    cargarEventosDelMes(mesActual);
  }, [mesActual]);

  const handleMesAnterior = () => {
    startTransition(() => {
      setMesActual((prev) => subMonths(prev, 1));
    });
  };

  const handleMesSiguiente = () => {
    startTransition(() => {
      setMesActual((prev) => addMonths(prev, 1));
    });
  };

  const handleHoy = () => {
    startTransition(() => {
      setMesActual(startOfMonth(new Date()));
    });
  };

  const celdas = generarGridCalendario(mesActual);

  const mesNombre = capitalizar(format(mesActual, "MMMM", { locale: es }));
  const anoNombre = format(mesActual, "yyyy");

  return (
    <AppLayout>
      <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginBottom: "20px" }}>
        {/* Fila 1: Saludo con icono sol */}
        <div style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: "8px" }}>
          <Sun size={20} style={{ color: "#f59e0b", fill: "#fbbf24", flexShrink: 0 }} />
          <h1 style={{ fontSize: "18px", fontWeight: "600", color: "#1e293b", margin: 0, padding: 0 }}>
            Bienvenido/a, MariCarmen
          </h1>
        </div>

        {/* Fila 2: Leyenda (Izquierda) | Navegación y Mes (Derecha) */}
        <div style={{ display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px", width: "100%" }}>
          {/* Leyenda por tipo de servicio */}
          <div style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: "12px" }}>
            <div style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: "6px", padding: "4px 10px", borderRadius: "4px", backgroundColor: "#fffbeb", borderLeft: "3px solid #f59e0b" }}>
              <span style={{ fontSize: "12px", fontWeight: "500", color: "#475569" }}>Capacitación</span>
            </div>
            <div style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: "6px", padding: "4px 10px", borderRadius: "4px", backgroundColor: "#eff6ff", borderLeft: "3px solid #188ae2" }}>
              <span style={{ fontSize: "12px", fontWeight: "500", color: "#475569" }}>Estudios</span>
            </div>
            <div style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: "6px", padding: "4px 10px", borderRadius: "4px", backgroundColor: "#f5f3ff", borderLeft: "3px solid #8b5cf6" }}>
              <span style={{ fontSize: "12px", fontWeight: "500", color: "#475569" }}>Productos</span>
            </div>
            <div style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: "6px", padding: "4px 10px", borderRadius: "4px", backgroundColor: "#f0fdf4", borderLeft: "3px solid #10b981" }}>
              <span style={{ fontSize: "12px", fontWeight: "500", color: "#475569" }}>Servicios</span>
            </div>
          </div>

          {/* Navegación y Etiqueta del Mes */}
          <div style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: "12px" }}>
            <div style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: "4px" }}>
              <button
                onClick={handleMesAnterior}
                title="Mes anterior"
                style={{
                  width: "28px",
                  height: "28px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: "1px solid #cbd5e1",
                  borderRadius: "6px",
                  backgroundColor: "#ffffff",
                  color: "#475569",
                  cursor: "pointer",
                }}
              >
                <ChevronLeft size={14} />
              </button>
              <button
                onClick={handleHoy}
                style={{
                  height: "28px",
                  padding: "0 12px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: "1px solid #cbd5e1",
                  borderRadius: "6px",
                  backgroundColor: "#ffffff",
                  color: "#334155",
                  fontWeight: "500",
                  fontSize: "12px",
                  cursor: "pointer",
                }}
              >
                Hoy
              </button>
              <button
                onClick={handleMesSiguiente}
                title="Mes siguiente"
                style={{
                  width: "28px",
                  height: "28px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: "1px solid #cbd5e1",
                  borderRadius: "6px",
                  backgroundColor: "#ffffff",
                  color: "#475569",
                  cursor: "pointer",
                }}
              >
                <ChevronRight size={14} />
              </button>
            </div>

            <span style={{ fontSize: "14px", color: "#475569" }}>
              Tu mes de <strong style={{ color: "#0f172a", fontWeight: "700" }}>{mesNombre} {anoNombre}</strong>
            </span>
          </div>
        </div>
      </div>

      {cargando ? (
        <CalendarioSkeleton />
      ) : (
        <GridCalendario
          celdas={celdas}
          eventos={eventos}
          onReprogramarExitoso={() => cargarEventosDelMes(mesActual)}
        />
      )}
    </AppLayout>
  );
}
