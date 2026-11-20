"use client";

import React from "react";
import { formatearHoraLocal } from "@/lib/asistencia-utils";
import type { CursoAsistenciaDia } from "@/types/asistencia";

interface Props {
  curso: CursoAsistenciaDia;
  onSelect: (curso: CursoAsistenciaDia) => void;
}

export const CursoAsistenciaCard: React.FC<Props> = ({ curso, onSelect }) => {
  const { sesionEnPuerta, estadoEnPuerta } = curso;

  const badgeEstilo = (() => {
    if (estadoEnPuerta === "HABILITADA") {
      return {
        bg: "#2B8FCC",
        color: "#ffffff",
        texto: "Habilitada",
        icon: "bi-unlock-fill",
      };
    }
    if (estadoEnPuerta === "PROXIMA") {
      return {
        bg: "#e2e8f0",
        color: "#475569",
        texto: `Próxima · Se habilita a las ${formatearHoraLocal(
          sesionEnPuerta.d_HabilitaDesde
        )}`,
        icon: "bi-clock",
      };
    }
    return {
      bg: "#334155",
      color: "#ffffff",
      texto: "Cerrada",
      icon: "bi-lock-fill",
    };
  })();

  const instructores = [sesionEnPuerta.v_Titular, sesionEnPuerta.v_Apoyo]
    .filter(Boolean)
    .join(" · ");

  const ubicacion = [curso.v_Empresa, curso.v_Planta]
    .filter(Boolean)
    .join(" · ");

  return (
    <button
      type="button"
      onClick={() => onSelect(curso)}
      style={{
        width: "100%",
        textAlign: "left",
        backgroundColor: "#ffffff",
        border:
          estadoEnPuerta === "HABILITADA"
            ? "1.5px solid #2B8FCC"
            : "1px solid #e2e8f0",
        borderRadius: "14px",
        padding: "16px",
        boxShadow: "0 2px 6px rgba(15, 23, 42, 0.04)",
        cursor: "pointer",
        display: "flex",
        flexDirection: "column",
        gap: "10px",
        transition: "transform 0.1s ease, box-shadow 0.15s ease",
      }}
    >
      {/* Badges superiores */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "8px",
          flexWrap: "wrap",
        }}
      >
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "5px",
            padding: "4px 10px",
            borderRadius: "999px",
            fontSize: "11px",
            fontWeight: 600,
            backgroundColor: badgeEstilo.bg,
            color: badgeEstilo.color,
          }}
        >
          <i className={`bi ${badgeEstilo.icon}`} />
          {badgeEstilo.texto}
        </span>

        {curso.sinSincronizar > 0 && (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
              padding: "3px 9px",
              borderRadius: "999px",
              fontSize: "11px",
              fontWeight: 600,
              backgroundColor: "#fef3c7",
              color: "#b45309",
            }}
          >
            <i className="bi bi-cloud-upload" />
            {curso.sinSincronizar} sin sincronizar
          </span>
        )}
      </div>

      {/* Título y empresa */}
      <div>
        <div
          style={{
            fontSize: "15px",
            fontWeight: 700,
            color: "#0f172a",
            lineHeight: 1.3,
          }}
        >
          {curso.v_Servicio}
        </div>
        {ubicacion && (
          <div
            style={{
              fontSize: "13px",
              color: "#475569",
              marginTop: "2px",
              fontWeight: 500,
            }}
          >
            {ubicacion}
          </div>
        )}
        {curso.v_Area && (
          <div style={{ fontSize: "12px", color: "#64748b", marginTop: "2px" }}>
            Área: {curso.v_Area}
          </div>
        )}
      </div>

      {/* Horario y Sesión */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "4px",
          paddingTop: "8px",
          borderTop: "1px solid #f1f5f9",
          fontSize: "12px",
          color: "#475569",
        }}
      >
        {curso.sesiones.map((s) => (
          <div
            key={s.i_CveAgendaDetalle}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "8px",
              fontWeight:
                s.i_CveAgendaDetalle === sesionEnPuerta.i_CveAgendaDetalle
                  ? 600
                  : 400,
              color:
                s.i_CveAgendaDetalle === sesionEnPuerta.i_CveAgendaDetalle
                  ? "#1e293b"
                  : "#64748b",
            }}
          >
            <span>
              <i className="bi bi-clock" style={{ marginRight: "5px" }} />
              {formatearHoraLocal(s.d_FechaHoraInicio)} -{" "}
              {formatearHoraLocal(s.d_FechaHoraFin)}
            </span>
            <span>
              Sesión {s.i_NumSesion} de {s.i_TotalSesiones}
            </span>
          </div>
        ))}
      </div>

      {/* Instructor y conteo */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "8px",
          flexWrap: "wrap",
          fontSize: "12px",
          color: "#64748b",
          paddingTop: "4px",
        }}
      >
        <span style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}>
          <i className="bi bi-person-badge" />
          {instructores || "Sin instructor asignado"}
        </span>

        <span
          style={{
            fontWeight: 600,
            color: "#1e293b",
            display: "inline-flex",
            alignItems: "center",
            gap: "4px",
          }}
        >
          <i className="bi bi-people-fill" style={{ color: "#2B8FCC" }} />
          {curso.totalInscritos} inscritos · {curso.totalPresentes} presentes
        </span>
      </div>
    </button>
  );
};
