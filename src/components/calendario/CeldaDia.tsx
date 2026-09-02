"use client";

import React, { useState } from "react";
import { AgendaGetDto } from "@/types/calendario";
import { CeldaCalendario, formatearHora } from "@/lib/date-utils";
import { BadgeTipoServicio } from "@/components/ui/BadgeTipoServicio";
import { PopoverEvento } from "./PopoverEvento";
import { X } from "lucide-react";

interface Props {
  celda: CeldaCalendario;
  eventos: AgendaGetDto[];
}

export const CeldaDia: React.FC<Props> = ({ celda, eventos }) => {
  const [eventoHover, setEventoHover] = useState<AgendaGetDto | null>(null);
  const [mostrarModalMas, setMostrarModalMas] = useState<boolean>(false);

  // Ordenar eventos por fecha de inicio ascendente
  const eventosOrdenados = [...eventos].sort((a, b) => {
    const fA = a.d_FechaInicio ? new Date(a.d_FechaInicio).getTime() : 0;
    const fB = b.d_FechaInicio ? new Date(b.d_FechaInicio).getTime() : 0;
    return fA - fB;
  });

  const visibles = eventosOrdenados.slice(0, 2);
  const restantes = eventosOrdenados.slice(2);

  const diaNumero = celda.fecha.getDate();

  return (
    <div
      className={`celda-dia ${!celda.esMesActual ? "fuera-mes" : ""} ${
        celda.esHoy ? "hoy" : ""
      }`}
    >
      <div className="dia-header">
        <span className={`dia-numero ${celda.esHoy ? "numero-hoy" : ""}`}>
          {diaNumero}
        </span>
      </div>

      <div className="eventos-lista">
        {visibles.map((ev, idx) => (
          <div
            key={ev.i_CveAgenda || idx}
            className="evento-pill"
            onMouseEnter={() => setEventoHover(ev)}
            onMouseLeave={() => setEventoHover(null)}
          >
            <div className="evento-badge-wrapper">
              <BadgeTipoServicio tipoServicio={ev.v_TipoServicio} showIcon={false} />
            </div>
            <span className="evento-titulo text-ellipsis">
              {formatearHora(ev.d_FechaInicio)} {ev.v_Servicio}
            </span>

            {eventoHover?.i_CveAgenda === ev.i_CveAgenda && (
              <div className="popover-wrapper">
                <PopoverEvento evento={ev} />
              </div>
            )}
          </div>
        ))}

        {restantes.length > 0 && (
          <button
            className="btn-mas-eventos"
            onClick={() => setMostrarModalMas(true)}
          >
            +{restantes.length} más
          </button>
        )}
      </div>

      {/* Modal para ver todos los +N eventos colapsados */}
      {mostrarModalMas && (
        <div className="modal-overlay" onClick={() => setMostrarModalMas(false)}>
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: "450px" }}
          >
            <div className="modal-header">
              <h3 className="modal-title">
                Eventos del {diaNumero} de {celda.fecha.toLocaleString("es-MX", { month: "long" })}
              </h3>
              <button
                className="btn-icon"
                onClick={() => setMostrarModalMas(false)}
              >
                <X size={18} />
              </button>
            </div>
            <div className="modal-body flex flex-col gap-3">
              {eventosOrdenados.map((ev, i) => (
                <div key={i} className="mb-2">
                  <PopoverEvento evento={ev} />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .celda-dia {
          min-height: 110px;
          background: #ffffff;
          border: 1px solid #e2e8f0;
          padding: 6px;
          display: flex;
          flex-direction: column;
          position: relative;
          transition: background-color 0.2s ease;
        }
        .celda-dia.fuera-mes {
          background-color: #f8fafc;
          color: #94a3b8;
        }
        .celda-dia.hoy {
          background-color: #eef6fd;
        }
        .dia-header {
          display: flex;
          justify-content: flex-end;
          margin-bottom: 4px;
        }
        .dia-numero {
          font-weight: 600;
          font-size: 0.85rem;
          color: #475569;
          width: 26px;
          height: 26px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
        }
        .numero-hoy {
          background-color: #188ae2;
          color: #ffffff !important;
          font-weight: 700;
        }
        .eventos-lista {
          display: flex;
          flex-direction: column;
          gap: 4px;
          flex: 1;
        }
        .evento-pill {
          position: relative;
          padding: 3px 6px;
          border-radius: 4px;
          background: #f1f5f9;
          font-size: 0.75rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 4px;
          border-left: 3px solid #188ae2;
        }
        .evento-pill:hover {
          background: #e2e8f0;
        }
        .evento-titulo {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 100%;
          font-weight: 500;
        }
        .popover-wrapper {
          position: absolute;
          top: 100%;
          left: 0;
          z-index: 500;
        }
        .btn-mas-eventos {
          border: none;
          background: #e0f2fe;
          color: #0369a1;
          font-size: 0.725rem;
          font-weight: 600;
          border-radius: 4px;
          padding: 2px 6px;
          cursor: pointer;
          align-self: flex-start;
          margin-top: auto;
        }
        .btn-mas-eventos:hover {
          background: #bae6fd;
        }
      `}</style>
    </div>
  );
};
