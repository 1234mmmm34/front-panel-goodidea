"use client";

import React, { useState } from "react";
import { AgendaGetDto } from "@/types/calendario";
import { CeldaCalendario, formatearHora } from "@/lib/date-utils";
import { PopoverEvento } from "./PopoverEvento";

interface Props {
  celda: CeldaCalendario;
  eventos: AgendaGetDto[];
  eventoSeleccionado?: AgendaGetDto | null;
  onSeleccionarEvento?: (ev: AgendaGetDto | null) => void;
  onReprogramarExitoso?: () => void;
  rowIndex?: number;
  colIndex?: number;
}

const getEstiloTipoServicio = (tipoServicio: string | null) => {
  const tipo = (tipoServicio || "").trim().toUpperCase();
  switch (tipo) {
    case "CAPACITACIÓN":
    case "CAPACITACION":
      return { borderLeftColor: "#f59e0b", backgroundColor: "#fffbeb", color: "#92400e" };
    case "ESTUDIOS":
      return { borderLeftColor: "#188ae2", backgroundColor: "#eff6ff", color: "#1e40af" };
    case "PRODUCTOS":
      return { borderLeftColor: "#8b5cf6", backgroundColor: "#f5f3ff", color: "#5b21b6" };
    case "SERVICIO":
      return { borderLeftColor: "#0d9488", backgroundColor: "#f0fdf4", color: "#166534" };
    default:
      return { borderLeftColor: "#64748b", backgroundColor: "#f8fafc", color: "#334155" };
  }
};

const getPopoverStyle = (rIdx: number = 0, cIdx: number = 0): React.CSSProperties => {
  const isTopRow = rIdx <= 1;
  const isLeftEdge = cIdx <= 1;
  const isRightEdge = cIdx >= 5;

  const style: React.CSSProperties = {
    position: "absolute",
    zIndex: 999999,
    pointerEvents: "auto",
  };

  if (isTopRow) {
    style.top = "calc(100% + 4px)";
    style.bottom = "auto";
  } else {
    style.bottom = "calc(100% + 4px)";
    style.top = "auto";
  }

  if (isLeftEdge) {
    style.left = "0px";
    style.right = "auto";
    style.transform = "none";
  } else if (isRightEdge) {
    style.right = "0px";
    style.left = "auto";
    style.transform = "none";
  } else {
    style.left = "50%";
    style.right = "auto";
    style.transform = "translateX(-50%)";
  }

  return style;
};

const CeldaDiaComponent: React.FC<Props> = ({
  celda,
  eventos,
  eventoSeleccionado,
  onSeleccionarEvento,
  onReprogramarExitoso,
  rowIndex = 0,
  colIndex = 0,
}) => {
  const [eventoHover, setEventoHover] = useState<AgendaGetDto | null>(null);
  const [hoverMasEvents, setHoverMasEvents] = useState<boolean>(false);

  const masTimerRef = React.useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnterPill = (ev: AgendaGetDto) => {
    if (onSeleccionarEvento) {
      onSeleccionarEvento(ev);
    } else {
      setEventoHover(ev);
    }
  };

  const handlePillClick = (ev: AgendaGetDto, e: React.MouseEvent) => {
    e.stopPropagation();
    if (onSeleccionarEvento) {
      const prevId = eventoSeleccionado?.i_CveAgendaDetalle || eventoSeleccionado?.i_CveAgenda;
      const currentId = ev.i_CveAgendaDetalle || ev.i_CveAgenda;
      onSeleccionarEvento(prevId === currentId ? null : ev);
    } else {
      setEventoHover((prev) => {
        if (!prev) return ev;
        const prevId = prev.i_CveAgendaDetalle || prev.i_CveAgenda;
        const currentId = ev.i_CveAgendaDetalle || ev.i_CveAgenda;
        return prevId === currentId ? null : ev;
      });
    }
  };

  const handleCerrarPopover = () => {
    if (onSeleccionarEvento) {
      onSeleccionarEvento(null);
    }
    setEventoHover(null);
  };

  const handleMouseEnterMas = () => {
    if (masTimerRef.current) clearTimeout(masTimerRef.current);
    setHoverMasEvents(true);
  };

  const handleMouseLeaveMas = () => {
    masTimerRef.current = setTimeout(() => {
      setHoverMasEvents(false);
    }, 400);
  };

  const handleMouseEnterPopoverMas = () => {
    if (masTimerRef.current) clearTimeout(masTimerRef.current);
  };

  // Ordenar eventos por fecha de inicio ascendente
  const eventosOrdenados = React.useMemo(() => {
    return [...eventos].sort((a, b) => {
      const fA = a.d_FechaInicio ? new Date(a.d_FechaInicio).getTime() : 0;
      const fB = b.d_FechaInicio ? new Date(b.d_FechaInicio).getTime() : 0;
      return fA - fB;
    });
  }, [eventos]);

  const maxVisibles = 2;
  const visibles = eventosOrdenados.slice(0, maxVisibles);
  const restantes = eventosOrdenados.slice(maxVisibles);

  const diaNumero = celda.fecha.getDate();

  const isTopRow = rowIndex <= 1;
  const popoverPosClass = isTopRow ? "pos-below" : "pos-above";
  const popoverStyle = getPopoverStyle(rowIndex, colIndex);

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
        {visibles.map((ev, idx) => {
          const estilo = getEstiloTipoServicio(ev.v_TipoServicio);
          const evKey = ev.i_CveAgendaDetalle
            ? `det_${ev.i_CveAgendaDetalle}`
            : `ag_${ev.i_CveAgenda}_${idx}`;

          const activeEv = eventoSeleccionado !== undefined ? eventoSeleccionado : eventoHover;
          const isHovered = activeEv
            ? (activeEv.i_CveAgendaDetalle
                ? activeEv.i_CveAgendaDetalle === ev.i_CveAgendaDetalle
                : activeEv.i_CveAgenda === ev.i_CveAgenda)
            : false;

          return (
            <div
              key={evKey}
              className="evento-pill"
              style={{
                borderLeftColor: estilo.borderLeftColor,
                backgroundColor: estilo.backgroundColor,
                cursor: "pointer",
              }}
              onMouseEnter={() => handleMouseEnterPill(ev)}
              onClick={(e) => handlePillClick(ev, e)}
            >
              <span className="evento-titulo" style={{ color: estilo.color }}>
                {formatearHora(ev.d_FechaInicio)} {ev.v_Servicio}
              </span>

              {isHovered && (
                <div
                  className={`popover-wrapper ${popoverPosClass}`}
                  style={popoverStyle}
                  onClick={(e) => e.stopPropagation()}
                >
                  <PopoverEvento
                    evento={ev}
                    onCerrar={handleCerrarPopover}
                    onReprogramarExitoso={() => {
                      handleCerrarPopover();
                      if (onReprogramarExitoso) onReprogramarExitoso();
                    }}
                  />
                </div>
              )}
            </div>
          );
        })}

        {restantes.length > 0 && (
          <div
            className="btn-mas-wrapper"
            onMouseEnter={handleMouseEnterMas}
            onMouseLeave={handleMouseLeaveMas}
          >
            <button className="btn-mas-eventos">
              +{restantes.length} más
            </button>

            {hoverMasEvents && (
              <div
                className={`popover-wrapper-mas ${popoverPosClass}`}
                style={popoverStyle}
                onMouseEnter={handleMouseEnterPopoverMas}
                onMouseLeave={handleMouseLeaveMas}
              >
                <div className="popover-card-mas">
                  <div className="popover-mas-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span>Eventos adicionales del día {diaNumero} ({restantes.length})</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setHoverMasEvents(false);
                      }}
                      style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: "12px" }}
                    >
                      ✕
                    </button>
                  </div>
                  <div className="flex flex-col gap-2">
                    {restantes.map((ev, i) => {
                      const resKey = ev.i_CveAgendaDetalle
                        ? `det_rest_${ev.i_CveAgendaDetalle}`
                        : `ag_rest_${ev.i_CveAgenda}_${i}`;
                      return (
                        <PopoverEvento
                          key={resKey}
                          evento={ev}
                          onCerrar={() => setHoverMasEvents(false)}
                          onReprogramarExitoso={() => {
                            setHoverMasEvents(false);
                            if (onReprogramarExitoso) onReprogramarExitoso();
                          }}
                        />
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <style jsx>{`
        .celda-dia {
          height: 105px;
          max-height: 105px;
          min-height: 105px;
          min-width: 0;
          width: 100%;
          background: #ffffff;
          padding: 6px 8px;
          display: flex;
          flex-direction: column;
          position: relative;
          box-sizing: border-box;
          transition: background-color 0.15s ease;
          z-index: 1;
          overflow: visible;
        }
        .celda-dia:hover {
          z-index: 999;
        }
        .celda-dia.fuera-mes {
          background-color: #fafafa;
          opacity: 0.55;
        }
        .celda-dia.hoy {
          background-color: #eef6fd;
        }
        .dia-header {
          display: flex;
          justify-content: flex-end;
          margin-bottom: 4px;
          flex-shrink: 0;
        }
        .dia-numero {
          font-weight: 600;
          font-size: 12px;
          color: #475569;
          width: 22px;
          height: 22px;
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
          gap: 3px;
          flex: 1;
          min-width: 0;
          width: 100%;
          overflow: visible;
        }
        .evento-pill {
          position: relative;
          padding: 2px 6px;
          border-radius: 4px;
          border: 1px solid rgba(0, 0, 0, 0.05);
          border-left-width: 3px;
          border-left-style: solid;
          font-size: 11px;
          cursor: pointer;
          display: flex;
          align-items: center;
          width: 100%;
          max-width: 100%;
          min-width: 0;
          height: 24px;
          flex-shrink: 0;
          box-sizing: border-box;
          white-space: nowrap;
          overflow: visible;
          transition: opacity 0.15s ease;
        }
        .evento-pill:hover {
          opacity: 0.88;
        }
        .evento-titulo {
          display: block;
          flex: 1;
          min-width: 0;
          width: 100%;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          font-weight: 500;
        }
        .popover-wrapper {
          position: absolute;
          z-index: 999999;
          pointer-events: auto;
        }
        .popover-wrapper.pos-above {
          padding-bottom: 8px;
        }
        .popover-wrapper.pos-above::after {
          content: "";
          position: absolute;
          top: 100%;
          left: -30px;
          right: -30px;
          height: 16px;
          background: transparent;
        }
        .popover-wrapper.pos-below {
          padding-top: 8px;
        }
        .popover-wrapper.pos-below::after {
          content: "";
          position: absolute;
          bottom: 100%;
          left: -30px;
          right: -30px;
          height: 16px;
          background: transparent;
        }
        .btn-mas-wrapper {
          position: relative;
          display: inline-block;
          align-self: flex-start;
          margin-top: auto;
        }
        .btn-mas-eventos {
          border: none;
          background: #eef6fd;
          color: #188ae2;
          font-size: 10px;
          font-weight: 600;
          border-radius: 4px;
          padding: 1px 5px;
          cursor: pointer;
          white-space: nowrap;
        }
        .btn-mas-eventos:hover {
          background: #dbeafe;
        }
        .popover-wrapper-mas {
          position: absolute;
          z-index: 999999;
          pointer-events: auto;
        }
        .popover-wrapper-mas.pos-above {
          padding-bottom: 8px;
        }
        .popover-wrapper-mas.pos-below {
          padding-top: 8px;
        }
        .popover-card-mas {
          background: #ffffff;
          border-radius: 8px;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.18), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
          border: 1px solid #e2e8f0;
          padding: 10px;
          min-width: 280px;
          max-width: 320px;
          max-height: 320px;
          overflow-y: auto;
        }
        .popover-mas-header {
          font-size: 11px;
          font-weight: 600;
          color: #334155;
          margin-bottom: 8px;
          padding-bottom: 6px;
          border-bottom: 1px solid #f1f5f9;
        }
      `}</style>
    </div>
  );
};

export const CeldaDia = React.memo(CeldaDiaComponent);

