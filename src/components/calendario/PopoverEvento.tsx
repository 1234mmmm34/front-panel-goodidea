import React from "react";
import { MapPin, Clock, User, Users } from "lucide-react";
import { AgendaGetDto } from "@/types/calendario";
import { formatearFechaLarga, formatearHora } from "@/lib/date-utils";
import { BadgeTipoServicio } from "@/components/ui/BadgeTipoServicio";

interface Props {
  evento: AgendaGetDto;
  onCerrar?: () => void;
}

export const PopoverEvento: React.FC<Props> = ({ evento }) => {
  const horaInicio = formatearHora(evento.d_FechaInicio);
  const horaFin = formatearHora(evento.d_FechaFin);
  const fechaTexto = formatearFechaLarga(evento.d_FechaInicio);

  return (
    <div className="popover-card">
      <div className="popover-header">
        <BadgeTipoServicio tipoServicio={evento.v_TipoServicio} />
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

      <style jsx>{`
        .popover-card {
          background: #ffffff;
          border-radius: 8px;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
          border: 1px solid #e2e8f0;
          padding: 14px;
          min-width: 260px;
          max-width: 320px;
          font-size: 0.85rem;
          color: #1e293b;
          z-index: 1000;
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
      `}</style>
    </div>
  );
};
