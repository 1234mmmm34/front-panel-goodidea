"use client";

import React, { useEffect, useState, useTransition } from "react";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, RefreshCw } from "lucide-react";
import { AgendaGetDto } from "@/types/calendario";
import { AgendaService } from "@/services/agenda.service";
import {
  generarGridCalendario,
  obtenerMesLabel,
  startOfMonth,
  endOfMonth,
  addMonths,
  subMonths,
  format,
} from "@/lib/date-utils";
import { GridCalendario } from "@/components/calendario/GridCalendario";
import { Navbar } from "@/components/ui/Navbar";

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

  return (
    <div className="app-container">
      <Navbar />

      <main className="main-content">
        <div className="page-header">
          <div>
            <h1 className="page-title">
              <CalendarIcon size={24} className="text-primary" />
              Calendario de Servicios
            </h1>
            <p className="subtext">
              Vista mensual de la programación y agenda de servicios.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              className="btn btn-outline"
              onClick={() => cargarEventosDelMes(mesActual)}
              disabled={cargando}
              title="Actualizar eventos"
            >
              <RefreshCw size={16} className={cargando ? "animate-spin" : ""} />
            </button>

            <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-1 shadow-sm">
              <button
                className="btn btn-outline btn-sm"
                onClick={handleMesAnterior}
                title="Mes anterior"
              >
                <ChevronLeft size={18} />
              </button>

              <button
                className="btn btn-primary btn-sm px-3"
                onClick={handleHoy}
              >
                Hoy
              </button>

              <button
                className="btn btn-outline btn-sm"
                onClick={handleMesSiguiente}
                title="Mes siguiente"
              >
                <ChevronRight size={18} />
              </button>
            </div>

            <h2 className="text-xl font-bold color-primary min-w-[180px] text-center">
              {obtenerMesLabel(mesActual)}
            </h2>
          </div>
        </div>

        {cargando ? (
          <div className="card text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-2"></div>
            <p className="text-secondary">Cargando eventos del mes...</p>
          </div>
        ) : (
          <GridCalendario celdas={celdas} eventos={eventos} />
        )}
      </main>
    </div>
  );
}
