"use client";

import React, { useState } from "react";
import { MapPin, Clock, User, Users, RefreshCw, X } from "lucide-react";
import { AgendaGetDto } from "@/types/calendario";
import { formatearFechaLarga, formatearHora, esFechaPasada } from "@/lib/date-utils";
import { BadgeTipoServicio } from "@/components/ui/BadgeTipoServicio";
import { ModalReprogramarSesion } from "@/components/programacion/ModalReprogramarSesion";

interface Props {
  evento: AgendaGetDto;
  onCerrar?: () => void;
  onReprogramarExitoso?: () => void;
}

export const PopoverEvento: React.FC<Props> = ({ evento, onCerrar, onReprogramarExitoso }) => {
  const [modalReprogramarAbierto, setModalReprogramarAbierto] = useState<boolean>(false);

  const horaInicio = formatearHora(evento.d_FechaInicio);
  const horaFin = formatearHora(evento.d_FechaFin);
  const fechaTexto = formatearFechaLarga(evento.d_FechaInicio);
  const esPasada = esFechaPasada(evento.d_FechaInicio);

  const handleOpenReprogramar = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setModalReprogramarAbierto(true);
  };

  return (
    <>
      <div className="popover-card" onClick={(e) => e.stopPropagation()}>
        <div className="popover-header">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
            <BadgeTipoServicio tipoServicio={evento.v_TipoServicio} />
            {onCerrar && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onCerrar();
                }}
                style={{
                  background: "none",
                  border: "none",
                  color: "#94a3b8",
                  cursor: "pointer",
                  padding: "2px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: "4px",
                }}
                title="Cerrar"
              >
                <X size={15} />
              </button>
            )}
          </div>
          <h4 className="popover-title">{evento.v_Servicio || "Servicio sin nombre"}</h4>
        </div>

        <div className="popover-body">
          {evento.v_Empresa && (
            <div className="popover-item">
              <MapPin size={14} className="text-primary" />
              <span>{evento.v_Empresa}</span>
            </div>
          )}

          <div className="popover-item">
            <Clock size={14} className="text-secondary" />
            <span>{fechaTexto} | {horaInicio} – {horaFin}</span>
          </div>

          <div className="popover-item">
            <User size={14} className="text-secondary" />
            <span>Instructor: <strong>{evento.v_Titular || "—"}</strong></span>
          </div>

          {evento.v_Apoyo && evento.v_Apoyo.trim().length > 0 && (
            <div className="popover-item">
              <Users size={14} className="text-secondary" />
              <span>Apoyo: {evento.v_Apoyo}</span>
            </div>
          )}
        </div>

        {/* Botón Acción Reprogramar en Tooltip */}
        <div className="popover-footer">
          <button
            type="button"
            className="btn-reprogramar-popover"
            title="Reprogramar sesión"
            onClick={handleOpenReprogramar}
            style={{
              cursor: "pointer",
              backgroundColor: "#fffbeb",
              borderColor: "#f59e0b",
              color: "#b45309",
            }}
          >
            <RefreshCw size={13} />
            <span>Reprogramar sesión</span>
          </button>
        </div>

        <style jsx>{`
          .popover-card {
            background: #ffffff;
            border-radius: 8px;
            box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.18), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
            border: 1px solid #e2e8f0;
            padding: 14px;
            min-width: 260px;
            max-width: 320px;
            font-size: 0.85rem;
            color: #1e293b;
            z-index: 1000;
            pointer-events: auto;
          }
          .popover-header {
            display: flex;
            flex-direction: column;
            gap: 6px;
            margin-bottom: 10px;
            padding-bottom: 8px;
            border-bottom: 1px solid #f1f5f9;
          }
          .popover-title {
            font-size: 0.95rem;
            font-weight: 700;
            color: #0f172a;
            margin: 0;
          }
          .popover-body {
            display: flex;
            flex-direction: column;
            gap: 8px;
          }
          .popover-item {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 0.825rem;
            color: #475569;
          }
          .popover-footer {
            margin-top: 10px;
            padding-top: 8px;
            border-top: 1px solid #f1f5f9;
          }
          .btn-reprogramar-popover {
            width: 100%;
            height: 28px;
            border-radius: 6px;
            border: 1px solid #f59e0b;
            background-color: #fffbeb;
            color: #b45309;
            font-size: 12px;
            font-weight: 600;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 6px;
            cursor: pointer;
            transition: all 0.15s ease;
          }
          .btn-reprogramar-popover:hover {
            background-color: #fef3c7;
            border-color: #d97706;
            color: #92400e;
          }
        `}</style>
      </div>

      {/* Modal Reprogramar Sesión */}
      <ModalReprogramarSesion
        abierto={modalReprogramarAbierto}
        onCerrar={() => setModalReprogramarAbierto(false)}
        iCveAgenda={evento.i_CveAgenda}
        iCveServAgendaDet={evento.i_CveServAgendaDet}
        iCveAgendaDetalle={evento.i_CveAgendaDetalle}
        onReprogramacionExitosa={() => {
          if (onReprogramarExitoso) onReprogramarExitoso();
        }}
      />
    </>
  );
};
