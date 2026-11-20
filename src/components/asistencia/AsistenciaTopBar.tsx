"use client";

import React from "react";
import Link from "next/link";
import { formatearActualizado } from "@/lib/asistencia-utils";

interface Props {
  online: boolean;
  ultimaDescarga: string | null;
  pendientesCount: number;
  sincronizando: boolean;
  onSincronizar: () => void;
}

export const AsistenciaTopBar: React.FC<Props> = ({
  online,
  ultimaDescarga,
  pendientesCount,
  sincronizando,
  onSincronizar,
}) => {
  return (
    <header
      style={{
        backgroundColor: "#ffffff",
        borderBottom: "1px solid #e2e8f0",
        position: "sticky",
        top: 0,
        zIndex: 50,
        boxShadow: "0 1px 3px rgba(0, 0, 0, 0.04)",
      }}
    >
      <div
        style={{
          maxWidth: "1100px",
          margin: "0 auto",
          padding: "10px 16px",
          display: "flex",
          flexDirection: "column",
          gap: "8px",
        }}
      >
        {/* Fila superior: Logo + estado de red + volver al panel */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "10px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/assets/gi_slogo.png"
              alt="GOODiDEA"
              style={{ height: "28px", width: "auto" }}
            />
            <span
              style={{
                fontSize: "16px",
                fontWeight: 700,
                color: "#1e293b",
                letterSpacing: "-0.01em",
              }}
            >
              Asistencia
            </span>

            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
                padding: "3px 10px",
                borderRadius: "999px",
                fontSize: "11px",
                fontWeight: 600,
                backgroundColor: online ? "#dcfce7" : "#fee2e2",
                color: online ? "#15803d" : "#b91c1c",
              }}
            >
              <i className={`bi ${online ? "bi-wifi" : "bi-wifi-off"}`} />
              {online ? "En línea" : "Sin conexión"}
            </span>
          </div>

          {online && (
            <Link
              href="/programacion"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "6px 12px",
                borderRadius: "8px",
                border: "1px solid #e2e8f0",
                backgroundColor: "#f8fafc",
                color: "#475569",
                fontSize: "12px",
                fontWeight: 500,
                whiteSpace: "nowrap",
              }}
            >
              <i className="bi bi-grid" />
              <span>Panel</span>
            </Link>
          )}
        </div>

        {/* Fila inferior: Última descarga + pendientes + botón Sincronizar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "10px",
            flexWrap: "wrap",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              flexWrap: "wrap",
              fontSize: "12px",
              color: "#64748b",
            }}
          >
            <span>
              <i
                className="bi bi-clock-history"
                style={{ marginRight: "4px" }}
              />
              {formatearActualizado(ultimaDescarga)}
            </span>

            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                padding: "2px 8px",
                borderRadius: "999px",
                fontSize: "11px",
                fontWeight: 600,
                backgroundColor: pendientesCount > 0 ? "#fef3c7" : "#f1f5f9",
                color: pendientesCount > 0 ? "#b45309" : "#64748b",
              }}
            >
              <i
                className={`bi ${
                  pendientesCount > 0
                    ? "bi-cloud-arrow-up"
                    : "bi-check2-circle"
                }`}
              />
              {pendientesCount}{" "}
              {pendientesCount === 1 ? "pendiente" : "pendientes"}
            </span>
          </div>

          <button
            type="button"
            onClick={onSincronizar}
            disabled={!online || sincronizando}
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
              height: "34px",
              padding: "0 14px",
              borderRadius: "8px",
              border: "none",
              backgroundColor: !online || sincronizando ? "#cbd5e1" : "#2B8FCC",
              color: "#ffffff",
              fontSize: "12px",
              fontWeight: 600,
              cursor: !online || sincronizando ? "not-allowed" : "pointer",
            }}
          >
            <i
              className={`bi ${
                sincronizando ? "bi-arrow-repeat" : "bi-arrow-clockwise"
              }`}
              style={
                sincronizando
                  ? { display: "inline-block", animation: "spin 1s linear infinite" }
                  : undefined
              }
            />
            {sincronizando ? "Sincronizando..." : "Sincronizar"}
          </button>
        </div>
      </div>
    </header>
  );
};
