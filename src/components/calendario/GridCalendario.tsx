"use client";

import React from "react";
import { AgendaGetDto } from "@/types/calendario";
import { CeldaCalendario, isSameDay } from "@/lib/date-utils";
import { CeldaDia } from "./CeldaDia";

interface Props {
  celdas: CeldaCalendario[];
  eventos: AgendaGetDto[];
  onReprogramarExitoso?: () => void;
}

const DIAS_SEMANA = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

const EMPTY_EVENTOS: AgendaGetDto[] = [];

export const GridCalendario: React.FC<Props> = ({ celdas, eventos, onReprogramarExitoso }) => {
  const [eventoSeleccionado, setEventoSeleccionado] = React.useState<AgendaGetDto | null>(null);

  const eventosPorDia = React.useMemo(() => {
    const map: Record<string, AgendaGetDto[]> = {};
    for (const ev of eventos) {
      if (!ev.d_FechaInicio) continue;
      const isoKey = ev.d_FechaInicio.split("T")[0];
      if (!map[isoKey]) map[isoKey] = [];
      map[isoKey].push(ev);
    }
    return map;
  }, [eventos]);

  React.useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (
        !target.closest(".popover-card") &&
        !target.closest(".evento-pill") &&
        !target.closest(".btn-mas-wrapper")
      ) {
        setEventoSeleccionado(null);
      }
    };
    document.addEventListener("click", handleOutsideClick);
    return () => document.removeEventListener("click", handleOutsideClick);
  }, []);

  return (
    <div className="grid-calendario-container">
      <div className="grid-header">
        {DIAS_SEMANA.map((dia) => (
          <div key={dia} className="dia-semana-title">
            {dia}
          </div>
        ))}
      </div>

      <div className="grid-body">
        {celdas.map((celda, idx) => {
          const eventosDelDia = eventosPorDia[celda.claveIso] || EMPTY_EVENTOS;
          const rowIndex = Math.floor(idx / 7);
          const colIndex = idx % 7;

          return (
            <CeldaDia
              key={`${celda.claveIso}-${idx}`}
              celda={celda}
              eventos={eventosDelDia}
              eventoSeleccionado={eventoSeleccionado}
              onSeleccionarEvento={setEventoSeleccionado}
              onReprogramarExitoso={onReprogramarExitoso}
              rowIndex={rowIndex}
              colIndex={colIndex}
            />
          );
        })}
      </div>

      <style jsx>{`
        .grid-calendario-container {
          background: #ffffff;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
          width: 100%;
          overflow: visible;
          position: relative;
          z-index: 10;
        }
        .grid-header {
          display: grid;
          grid-template-columns: repeat(7, minmax(0, 1fr));
          background-color: #f8fafc;
          border-bottom: 1px solid #e2e8f0;
          border-top-left-radius: 12px;
          border-top-right-radius: 12px;
        }
        .dia-semana-title {
          padding: 10px 4px;
          text-align: center;
          font-weight: 600;
          font-size: 11px;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .grid-body {
          display: grid;
          grid-template-columns: repeat(7, minmax(0, 1fr));
          background-color: #e2e8f0;
          gap: 1px;
          width: 100%;
          overflow: visible;
          border-bottom-left-radius: 12px;
          border-bottom-right-radius: 12px;
        }
      `}</style>
    </div>
  );
};
