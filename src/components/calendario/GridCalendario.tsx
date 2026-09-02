"use client";

import React from "react";
import { AgendaGetDto } from "@/types/calendario";
import { CeldaCalendario, isSameDay } from "@/lib/date-utils";
import { CeldaDia } from "./CeldaDia";

interface Props {
  celdas: CeldaCalendario[];
  eventos: AgendaGetDto[];
}

const DIAS_SEMANA = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

export const GridCalendario: React.FC<Props> = ({ celdas, eventos }) => {
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
          const eventosDelDia = eventos.filter((ev) => {
            if (!ev.d_FechaInicio) return false;
            return isSameDay(new Date(ev.d_FechaInicio), celda.fecha);
          });

          return (
            <CeldaDia
              key={`${celda.claveIso}-${idx}`}
              celda={celda}
              eventos={eventosDelDia}
            />
          );
        })}
      </div>

      <style jsx>{`
        .grid-calendario-container {
          background: #ffffff;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
          overflow: hidden;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
        }
        .grid-header {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          background-color: #f8fafc;
          border-bottom: 1px solid #e2e8f0;
        }
        .dia-semana-title {
          padding: 12px 8px;
          text-align: center;
          font-weight: 700;
          font-size: 0.85rem;
          color: #475569;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .grid-body {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
        }
      `}</style>
    </div>
  );
};
