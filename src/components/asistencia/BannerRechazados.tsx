"use client";

import React from "react";
import type { AsistenciaResultado, AsistenciaSesion } from "@/types/asistencia";

interface Props {
  rechazados: AsistenciaResultado[];
  sesiones: AsistenciaSesion[];
  onCerrar: () => void;
}

export const BannerRechazados: React.FC<Props> = ({
  rechazados,
  sesiones,
  onCerrar,
}) => {
  if (rechazados.length === 0) return null;

  const describirRegistro = (r: AsistenciaResultado): string => {
    const sesion = sesiones.find(
      (s) => s.i_CveAgendaDetalle === r.i_CveAgendaDetalle
    );
    const alumno = sesion?.inscritos.find(
      (a) => a.i_CveAlumnoAgenda === r.i_CveAlumnoAgenda
    );
    if (alumno && sesion) {
      return `${alumno.v_Nombre || "Alumno"} (${
        sesion.v_Servicio || "Sesión"
      })`;
    }
    return `Alumno #${r.i_CveAlumnoAgenda ?? "?"} · Sesión #${
      r.i_CveAgendaDetalle ?? "?"
    }`;
  };

  return (
    <div
      style={{
        backgroundColor: "#fef2f2",
        border: "1px solid #fca5a5",
        borderRadius: "12px",
        padding: "12px 14px",
        color: "#991b1b",
        display: "flex",
        flexDirection: "column",
        gap: "8px",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "8px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            fontSize: "13px",
            fontWeight: 700,
          }}
        >
          <i className="bi bi-exclamation-triangle-fill" />
          <span>
            {rechazados.length}{" "}
            {rechazados.length === 1
              ? "registro rechazado por el servidor"
              : "registros rechazados por el servidor"}
          </span>
        </div>

        <button
          type="button"
          onClick={onCerrar}
          style={{
            background: "transparent",
            border: "none",
            color: "#991b1b",
            cursor: "pointer",
            fontSize: "16px",
            padding: "2px 6px",
          }}
          aria-label="Cerrar aviso"
        >
          <i className="bi bi-x-lg" />
        </button>
      </div>

      <ul
        style={{
          margin: 0,
          paddingLeft: "18px",
          fontSize: "12px",
          display: "flex",
          flexDirection: "column",
          gap: "4px",
        }}
      >
        {rechazados.map((r, idx) => (
          <li key={`${r.i_CveAlumnoAgenda}-${r.i_CveAgendaDetalle}-${idx}`}>
            <strong>{describirRegistro(r)}:</strong>{" "}
            {r.v_Motivo || "Rechazado sin motivo especificado"}
          </li>
        ))}
      </ul>
    </div>
  );
};
