"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { obtenerEstadoInfo, getColorSemaforo, diasRestantes } from "./pipcCalculos";
import { formatearFechaTexto } from "@/lib/date-utils";
import { GuardandoEstado } from "./usePipcExpediente";
import { TextoPendiente } from "./comunes/TextoPendiente";

interface Props {
  nombreComercial: string;
  planta: string;
  consultor: string;
  servicioId: number | null;
  estado: string;
  soloLectura?: boolean;
  guardandoEstado?: GuardandoEstado;
  ultimaHoraGuardado?: string | null;
  onReintentarGuardado?: () => void;
  // Props del resumen (§1)
  avanceGlobal?: number;
  d_FechaFin?: string | null;
  v_Estado?: string | null;
  pendientesAltaCount?: number;
  onScrollAExportar?: () => void;
}

export const EncabezadoExpediente: React.FC<Props> = ({
  nombreComercial,
  planta,
  consultor,
  servicioId,
  estado,
  soloLectura = false,
  guardandoEstado = "idle",
  ultimaHoraGuardado,
  onReintentarGuardado,
  avanceGlobal = 0,
  d_FechaFin,
  v_Estado,
  pendientesAltaCount = 0,
  onScrollAExportar,
}) => {
  const estadoInfo = obtenerEstadoInfo(estado);
  const ringColor = getColorSemaforo(avanceGlobal);

  // Anillo de avance de 44px
  const ringSize = 44;
  const stroke = 3.5;
  const radius = ringSize / 2;
  const normalizedRadius = radius - stroke;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (avanceGlobal / 100) * circumference;

  // Días restantes / estado (§1 y §3)
  const infoDias = useMemo(() => {
    if (v_Estado === "finalizado" || estado === "finalizado") {
      return {
        texto: "Finalizado",
        color: "#16a34a",
        fontWeight: 600,
      };
    }

    const dias = diasRestantes(d_FechaFin ?? null);
    if (dias === null) {
      return {
        texto: "Sin fecha de fin",
        color: "#64748b",
        fontWeight: 500,
      };
    }

    if (dias > 1) {
      return {
        texto: `${dias} días restantes`,
        color: "#334155",
        fontWeight: 600,
      };
    }

    if (dias === 1) {
      return {
        texto: "1 día restante",
        color: "#334155",
        fontWeight: 600,
      };
    }

    if (dias === 0) {
      return {
        texto: "Vence hoy",
        color: "#B9770E",
        fontWeight: 600,
      };
    }

    const abs = Math.abs(dias);
    return {
      texto: `Vencido hace ${abs} día${abs === 1 ? "" : "s"}`,
      color: "#DC3545",
      fontWeight: 600,
    };
  }, [v_Estado, estado, d_FechaFin]);

  const fechaFinTexto = d_FechaFin ? formatearFechaTexto(d_FechaFin) : null;

  const router = useRouter();

  const handleVolverProgramacion = (e: React.MouseEvent) => {
    e.preventDefault();
    if (typeof window !== "undefined") {
      const vinoDeProgramacion =
        sessionStorage.getItem("pipc_origen_programacion") === "1" ||
        (document.referrer && document.referrer.includes("/programacion"));

      if (vinoDeProgramacion && window.history.length > 1) {
        sessionStorage.removeItem("pipc_origen_programacion");
        router.back();
        return;
      }
    }
    router.push(`/programacion?vista=servicios${servicioId ? `&detalle=${servicioId}` : ""}`);
  };

  return (
    <div style={{ marginBottom: "16px" }}>
      {/* Breadcrumb */}
      <div
        style={{
          fontSize: "12px",
          color: "#7a96b0",
          display: "flex",
          alignItems: "center",
          gap: "6px",
          marginBottom: "12px",
        }}
      >
        <a
          href="/programacion"
          onClick={handleVolverProgramacion}
          style={{ color: "#7a96b0", textDecoration: "none", cursor: "pointer" }}
          className="hover:text-slate-900 transition-colors"
        >
          Programación
        </a>
        <ChevronRight size={13} style={{ color: "#b5cfe8" }} />
        <span style={{ color: "#1e293b", fontWeight: 500 }}>
          Checklist PIPC
        </span>
      </div>

      {/* Page Header con Card de Resumen */}
      <div className="pipc-header-row">
        <div className="pipc-header-titles">
          <h1 className="page-title" style={{ margin: 0 }}>
            PIPC — {nombreComercial ? nombreComercial : <TextoPendiente title="Falta nombre comercial de la empresa" />}
          </h1>
          <p className="subtext" style={{ margin: "4px 0 0 0" }}>
            {planta ? planta : <TextoPendiente title="Falta planta de la empresa" />} · Consultor:{" "}
            {consultor ? consultor : <TextoPendiente title="Falta consultor responsable asignado" />}
            {servicioId !== null && (
              <span style={{ color: "#2B8FCC", fontWeight: 600 }}>
                {" "}· Servicio #{servicioId}
              </span>
            )}
          </p>
        </div>

        {/* Franja de resumen compacta (§1) */}
        <div className="pipc-header-resumen-card">
          {/* Bloque 1: Anillo de avance 44px */}
          <div className="resumen-bloque-anillo">
            <div style={{ position: "relative", width: `${ringSize}px`, height: `${ringSize}px`, flexShrink: 0 }}>
              <svg height={ringSize} width={ringSize} style={{ transform: "rotate(-90deg)" }}>
                <circle
                  stroke="#f1f5f9"
                  fill="transparent"
                  strokeWidth={stroke}
                  r={normalizedRadius}
                  cx={radius}
                  cy={radius}
                />
                <circle
                  stroke={ringColor}
                  fill="transparent"
                  strokeWidth={stroke}
                  strokeDasharray={`${circumference} ${circumference}`}
                  style={{ strokeDashoffset, transition: "stroke-dashoffset 0.35s ease, stroke 0.3s ease" }}
                  strokeLinecap="round"
                  r={normalizedRadius}
                  cx={radius}
                  cy={radius}
                />
              </svg>
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <span style={{ fontSize: "11px", fontWeight: 700, color: ringColor, lineHeight: 1 }}>
                  {avanceGlobal}%
                </span>
              </div>
            </div>
            <span style={{ fontSize: "10px", fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Avance
            </span>
          </div>

          {/* Divisor vertical */}
          <div className="resumen-divisor" />

          {/* Bloque 2: Días restantes + Fin del servicio */}
          <div className="resumen-bloque-dias">
            <span style={{ fontSize: "12px", color: infoDias.color, fontWeight: infoDias.fontWeight, whiteSpace: "nowrap", lineHeight: 1.2 }}>
              {infoDias.texto}
            </span>
            {fechaFinTexto && (
              <span style={{ fontSize: "10px", color: "#64748b", whiteSpace: "nowrap", marginTop: "2px" }}>
                Fin: {fechaFinTexto}
              </span>
            )}
          </div>

          {/* Divisor vertical */}
          <div className="resumen-divisor" />

          {/* Bloque 3: Pendientes Alta */}
          <div className="resumen-bloque-pendientes">
            <button
              type="button"
              onClick={onScrollAExportar}
              style={{
                background: pendientesAltaCount > 0 ? "#fef2f2" : "#f0fdf4",
                border: `1px solid ${pendientesAltaCount > 0 ? "#fecaca" : "#bbf7d0"}`,
                padding: "4px 10px",
                borderRadius: "6px",
                cursor: "pointer",
                fontSize: "11px",
                fontWeight: 600,
                color: pendientesAltaCount > 0 ? "#dc2626" : "#16a34a",
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
                whiteSpace: "nowrap",
                transition: "all 0.15s ease",
              }}
              title="Ir a lista de pendientes en Exportar"
            >
              <i className={pendientesAltaCount > 0 ? "bi bi-exclamation-circle" : "bi bi-check-circle"} />
              <span>
                {pendientesAltaCount > 0
                  ? `${pendientesAltaCount} pendiente${pendientesAltaCount === 1 ? "" : "s"} Alta`
                  : "0 pendientes Alta"}
              </span>
            </button>
          </div>
        </div>

        {/* Acciones de guardado y estado */}
        <div className="pipc-header-actions">
          {/* Indicador de guardado (§5.3) */}
          {!soloLectura && (
            <div style={{ display: "inline-flex", alignItems: "center" }}>
              {guardandoEstado === "guardando" && (
                <span
                  style={{
                    fontSize: "11px",
                    color: "#64748b",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <span
                    className="spinner-border spinner-border-sm"
                    style={{ width: "11px", height: "11px", borderWidth: "1.5px" }}
                  />
                  Guardando…
                </span>
              )}
              {guardandoEstado === "guardado" && (
                <span
                  style={{
                    fontSize: "11px",
                    color: "#64748b",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                >
                  <i className="bi bi-check2 text-slate-500" />
                  Guardado · {ultimaHoraGuardado || "reciente"}
                </span>
              )}
              {guardandoEstado === "error" && (
                <button
                  type="button"
                  onClick={onReintentarGuardado}
                  style={{
                    background: "none",
                    border: "none",
                    padding: 0,
                    fontSize: "11px",
                    fontWeight: 600,
                    color: "#dc2626",
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                  title="Reintentar guardado de secciones pendientes"
                >
                  <i className="bi bi-exclamation-circle" />
                  <span>Error al guardar · </span>
                  <span style={{ textDecoration: "underline" }}>Reintentar</span>
                </button>
              )}
            </div>
          )}

          {soloLectura && (
            <span
              style={{
                fontSize: "11px",
                fontWeight: 600,
                backgroundColor: "#fef2f2",
                color: "#dc2626",
                padding: "3px 8px",
                borderRadius: "12px",
                border: "1px solid #fecaca",
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              <i className="bi bi-lock" />
              Solo lectura
            </span>
          )}

          <span
            className={`badge ${estadoInfo.badgeClass}`}
            style={{
              fontSize: "12px",
              fontWeight: 600,
              padding: "5px 12px",
              borderRadius: "14px",
            }}
          >
            {estadoInfo.texto}
          </span>
        </div>
      </div>

      <style jsx>{`
        .pipc-header-row {
          display: flex;
          align-items: center;
          justifyContent: space-between;
          gap: 16px;
        }
        .pipc-header-titles {
          flex-shrink: 0;
        }
        .pipc-header-resumen-card {
          background-color: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          height: 56px;
          max-height: 64px;
          display: inline-flex;
          align-items: center;
          padding: 0 6px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
          flex-shrink: 0;
        }
        .resumen-bloque-anillo {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 0 10px;
        }
        .resumen-divisor {
          width: 1px;
          height: 32px;
          background-color: #e2e8f0;
          flex-shrink: 0;
        }
        .resumen-bloque-dias {
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 0 14px;
        }
        .resumen-bloque-pendientes {
          display: flex;
          align-items: center;
          padding: 0 10px;
        }
        .pipc-header-actions {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-shrink: 0;
        }

        @media (max-width: 1199px) and (min-width: 992px) {
          .pipc-header-row {
            flex-wrap: wrap;
          }
          .pipc-header-resumen-card {
            order: 3;
            width: 100%;
            justifyContent: space-around;
            margin-top: 10px;
          }
        }

        @media (max-width: 991px) {
          .pipc-header-resumen-card {
            display: none;
          }
          .pipc-header-row {
            flex-wrap: wrap;
          }
        }
      `}</style>
    </div>
  );
};
