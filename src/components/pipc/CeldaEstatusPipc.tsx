"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { diasRestantes, getColorSemaforo } from "@/components/pipc/pipcCalculos";
import { useToast } from "@/context/ToastContext";
import { PipcService, extraerMensajeError } from "@/services/pipc.service";

export interface ItemServicioPipc {
  i_CveServAgendaDet: number;
  i_AvancePipc?: number | null;
  d_FechaFin?: string | null;
  i_CveEstatus?: number | null;
  b_TienePlanContingencia?: boolean;
}

export interface CeldaEstatusPipcProps {
  row: ItemServicioPipc;
  rutaChecklist?: (id: number) => string;
  sessionStorageKey?: string;
}

export const CeldaEstatusPipc: React.FC<CeldaEstatusPipcProps> = ({
  row,
  rutaChecklist = (id) => `/programacion/pipc/${id}`,
  sessionStorageKey = "pipc_origen_programacion",
}) => {
  const router = useRouter();
  const { toast } = useToast();
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [iniciando, setIniciando] = useState(false);

  const sinIniciar = row.i_AvancePipc === null || row.i_AvancePipc === undefined;
  const pct = sinIniciar ? 0 : Math.min(100, Math.max(0, Math.round(row.i_AvancePipc ?? 0)));
  const colorSemaforo = getColorSemaforo(pct);

  const dias = diasRestantes(row.d_FechaFin);
  let textoDias = "";
  let colorDias = "#64748b";
  let pesoDias: number | string = 400;

  if (dias !== null) {
    if (dias > 1) {
      textoDias = `${dias} días restantes`;
      colorDias = "#64748b";
      pesoDias = 400;
    } else if (dias === 1) {
      textoDias = "1 día restante";
      colorDias = "#64748b";
      pesoDias = 400;
    } else if (dias === 0) {
      textoDias = "Vence hoy";
      colorDias = "#B9770E";
      pesoDias = 600;
    } else {
      const n = Math.abs(dias);
      textoDias = n === 1 ? "Vencido hace 1 día" : `Vencido hace ${n} días`;
      colorDias = "#DC3545";
      pesoDias = 600;
    }
  }

  const lineaInferior = sinIniciar
    ? (textoDias ? `Sin iniciar · ${textoDias}` : "Sin iniciar")
    : textoDias;

  const isActivo = hovered || focused;

  const handleClick = async (e: React.MouseEvent | React.KeyboardEvent) => {
    e.stopPropagation();
    if (iniciando) return;

    if (sinIniciar) {
      setIniciando(true);
      try {
        await PipcService.iniciarChecklist(row.i_CveServAgendaDet);
        if (typeof window !== "undefined") {
          sessionStorage.setItem(sessionStorageKey, "1");
        }
        router.push(rutaChecklist(row.i_CveServAgendaDet));
      } catch (err: any) {
        toast.error(extraerMensajeError(err, "No se pudo iniciar el checklist PIPC"));
        setIniciando(false);
      }
    } else {
      if (typeof window !== "undefined") {
        sessionStorage.setItem(sessionStorageKey, "1");
      }
      router.push(rutaChecklist(row.i_CveServAgendaDet));
    }
  };

  return (
    <div
      role="link"
      tabIndex={0}
      aria-label={sinIniciar ? "Iniciar checklist PIPC" : "Ir al checklist PIPC"}
      title={sinIniciar ? "Iniciar checklist PIPC" : "Ir al checklist PIPC"}
      onClick={handleClick}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          handleClick(e);
        }
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={{
        cursor: "pointer",
        display: "flex",
        flexDirection: "column",
        gap: "2px",
        width: "100%",
        minWidth: "125px",
        maxWidth: "160px",
        padding: "4px 6px",
        borderRadius: "6px",
        backgroundColor: isActivo ? "#EAF4FB" : "transparent",
        transition: "background-color 150ms ease",
        userSelect: "none",
        outline: focused ? "2px solid #2B8FCC" : "none",
        outlineOffset: "1px",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
        <div
          style={{
            flex: 1,
            height: "6px",
            backgroundColor: "#E9EEF3",
            borderRadius: "4px",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: sinIniciar ? "0%" : `${pct}%`,
              height: "100%",
              backgroundColor: colorSemaforo,
              borderRadius: "4px",
              transition: "width 0.3s ease",
            }}
          />
        </div>
        <span
          style={{
            fontSize: "12px",
            fontWeight: 600,
            color: colorSemaforo,
            lineHeight: 1,
            whiteSpace: "nowrap",
          }}
        >
          {pct} %
        </span>
      </div>
      <div
        style={{
          fontSize: "11px",
          lineHeight: 1.2,
          fontWeight: isActivo ? 600 : pesoDias,
          color: isActivo ? "#2B8FCC" : colorDias,
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
          display: "flex",
          alignItems: "center",
          gap: "4px",
          minHeight: "14px",
        }}
      >
        {isActivo ? (
          <>
            <span>{sinIniciar ? (iniciando ? "Iniciando…" : "Iniciar checklist") : "Ir al checklist"}</span>
            <i className="bi bi-box-arrow-up-right" style={{ fontSize: "10px" }} />
          </>
        ) : (
          <span>{lineaInferior}</span>
        )}
      </div>
    </div>
  );
};

export interface CeldaEstatusPipcBadgeProps {
  row: ItemServicioPipc;
  badgeNode: React.ReactNode;
  rutaChecklist?: (id: number) => string;
  sessionStorageKey?: string;
}

export const CeldaEstatusPipcBadge: React.FC<CeldaEstatusPipcBadgeProps> = ({
  row,
  badgeNode,
  rutaChecklist = (id) => `/programacion/pipc/${id}`,
  sessionStorageKey = "pipc_origen_programacion",
}) => {
  const router = useRouter();
  const { toast } = useToast();
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [iniciando, setIniciando] = useState(false);

  const esCanceladoOReprogramado = row.i_CveEstatus === 0 || row.i_CveEstatus === 4;
  const sinIniciar = row.i_AvancePipc === null || row.i_AvancePipc === undefined;

  // Si está cancelado o reprogramado y sin iniciar: sin hover ni clic (§1.1)
  if (esCanceladoOReprogramado && sinIniciar) {
    return <>{badgeNode}</>;
  }

  const isActivo = hovered || focused;
  const labelAria = esCanceladoOReprogramado
    ? "Ver checklist PIPC"
    : sinIniciar
    ? "Iniciar checklist PIPC"
    : "Ir al checklist PIPC";

  const handleClick = async (e: React.MouseEvent | React.KeyboardEvent) => {
    e.stopPropagation();
    if (iniciando) return;

    if (esCanceladoOReprogramado) {
      if (!sinIniciar) {
        if (typeof window !== "undefined") {
          sessionStorage.setItem(sessionStorageKey, "1");
        }
        router.push(rutaChecklist(row.i_CveServAgendaDet));
      }
      return;
    }

    if (sinIniciar) {
      setIniciando(true);
      try {
        await PipcService.iniciarChecklist(row.i_CveServAgendaDet);
        if (typeof window !== "undefined") {
          sessionStorage.setItem(sessionStorageKey, "1");
        }
        router.push(rutaChecklist(row.i_CveServAgendaDet));
      } catch (err: any) {
        toast.error(extraerMensajeError(err, "No se pudo iniciar el checklist PIPC"));
        setIniciando(false);
      }
    } else {
      if (typeof window !== "undefined") {
        sessionStorage.setItem(sessionStorageKey, "1");
      }
      router.push(rutaChecklist(row.i_CveServAgendaDet));
    }
  };

  return (
    <div
      role="link"
      tabIndex={0}
      aria-label={labelAria}
      title={labelAria}
      onClick={handleClick}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          handleClick(e);
        }
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        padding: "4px 6px",
        borderRadius: "6px",
        backgroundColor: isActivo ? "#EAF4FB" : "transparent",
        transition: "background-color 150ms ease",
        cursor: "pointer",
        outline: focused ? "2px solid #2B8FCC" : "none",
        outlineOffset: "1px",
        userSelect: "none",
      }}
    >
      {badgeNode}
      <i
        className="bi bi-box-arrow-up-right"
        style={{
          fontSize: "12px",
          color: "#2B8FCC",
          visibility: isActivo ? "visible" : "hidden",
          flexShrink: 0,
          lineHeight: 1,
        }}
      />
    </div>
  );
};
