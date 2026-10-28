"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PipcResumen } from "@/types/pipc";
import { PipcService, extraerMensajeError } from "@/services/pipc.service";
import { useToast } from "@/context/ToastContext";
import { BadgeSemaforo } from "./comunes/BadgeSemaforo";
import { obtenerEstadoInfo, getColorSemaforo, diasRestantes } from "./pipcCalculos";

interface Props {
  servicioId: number;
  resumen?: PipcResumen | null;
  d_FechaFin?: string | null;
  onCerrarModal?: () => void;
}

export const BloquePipcEntregable: React.FC<Props> = ({
  servicioId,
  resumen: resumenProp,
  d_FechaFin,
  onCerrarModal,
}) => {
  const router = useRouter();
  const { toast } = useToast();

  const [resumenLocal, setResumenLocal] = useState<PipcResumen | null>(null);
  const [cargando, setCargando] = useState<boolean>(false);
  const [iniciando, setIniciando] = useState<boolean>(false);

  // Si no viene resumenProp, se puede cargar bajo demanda
  useEffect(() => {
    if (resumenProp !== undefined) return;
    let activo = true;

    async function cargarResumen() {
      if (!servicioId) return;
      setCargando(true);
      try {
        const data = await PipcService.getResumen(servicioId);
        if (activo) setResumenLocal(data);
      } catch (err: any) {
        if (activo) {
          const status = err?.response?.status;
          if (status !== 404) {
            toast.error(extraerMensajeError(err, "Error al cargar resumen PIPC"));
          }
          setResumenLocal(null);
        }
      } finally {
        if (activo) setCargando(false);
      }
    }

    cargarResumen();
    return () => {
      activo = false;
    };
  }, [servicioId, resumenProp, toast]);

  const resumen = resumenProp !== undefined ? resumenProp : resumenLocal;

  // 1. Mientras carga o si no hay resumen o si no aplica Plan de contingencia, no mostrar nada
  if (cargando || !resumen) {
    return null;
  }
  if (!resumen.b_TienePlanContingencia) {
    return null;
  }

  const estadoInfo = obtenerEstadoInfo(resumen.v_Estado || "en_captura");
  const estaIniciado = resumen.i_CvePipcExpediente !== null;
  const esCancelado = Boolean(resumen.b_Cancelado);
  const avance = resumen.i_Avance ?? 0;
  const pendientesCriticosCount = resumen.i_PendientesAlta ?? 0;

  const handleIniciarChecklist = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIniciando(true);
    try {
      await PipcService.iniciarChecklist(servicioId);
      if (typeof window !== "undefined") {
        sessionStorage.setItem("pipc_origen_programacion", "1");
      }
      router.push(`/programacion/pipc/${servicioId}`);
    } catch (err: any) {
      toast.error(extraerMensajeError(err, "No se pudo iniciar el checklist PIPC"));
      setIniciando(false);
    }
  };

  const handleNavegar = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (typeof window !== "undefined") {
      sessionStorage.setItem("pipc_origen_programacion", "1");
    }
    router.push(`/programacion/pipc/${servicioId}`);
  };

  // Cálculo de días restantes
  const dias = diasRestantes(d_FechaFin || resumen.d_FechaFin);
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

  return (
    <>
      <style>{`
        @media (max-width: 767px) {
          .bloque-pipc-entregable {
            width: 100% !important;
            margin-top: 8px;
            padding-top: 8px;
            border-top: 1px dashed #e2e8f0;
          }
        }
        @media (min-width: 768px) {
          .bloque-pipc-entregable {
            width: 380px;
            max-width: 380px;
          }
        }
      `}</style>
      <div
        className="bloque-pipc-entregable"
        onClick={(e) => e.stopPropagation()}
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "3px",
          flexShrink: 0,
          cursor: "default",
        }}
      >
        {/* Línea 1: Barra (6px), BadgeSemaforo %, Badge estado, Botón */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            flexWrap: "nowrap",
          }}
        >
          {/* Barra de progreso */}
          <div
            style={{
              width: "140px",
              minWidth: "100px",
              height: "6px",
              backgroundColor: "#E9EEF3",
              borderRadius: "4px",
              overflow: "hidden",
              flexShrink: 0,
            }}
          >
            <div
              style={{
                width: estaIniciado ? `${avance}%` : "0%",
                height: "100%",
                backgroundColor: estaIniciado ? getColorSemaforo(avance) : "#cbd5e1",
                borderRadius: "4px",
                transition: "width 0.3s ease",
              }}
            />
          </div>

          {/* Badge % o Sin iniciar */}
          {estaIniciado ? (
            <BadgeSemaforo porcentaje={avance} />
          ) : (
            <BadgeSemaforo sinIniciar={true} />
          )}

          {/* Badge del estado (solo cuando está iniciado) */}
          {estaIniciado && (
            <span
              className={`badge ${estadoInfo.badgeClass}`}
              style={{
                fontSize: "11px",
                fontWeight: 600,
                padding: "3px 8px",
                borderRadius: "12px",
                lineHeight: 1.2,
                whiteSpace: "nowrap",
              }}
            >
              {estadoInfo.texto}
            </span>
          )}

          {/* Botón de acción */}
          <div style={{ marginLeft: "auto" }}>
            {esCancelado ? (
              estaIniciado ? (
                <button
                  type="button"
                  className="btn btn-outline-primary btn-sm"
                  style={{
                    padding: "2px 8px",
                    fontSize: "11px",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "4px",
                    height: "26px",
                    borderRadius: "6px",
                    whiteSpace: "nowrap",
                    lineHeight: 1,
                  }}
                  onClick={handleNavegar}
                >
                  <i className="bi bi-box-arrow-up-right" style={{ fontSize: "11px" }} />
                  <span>Ver checklist</span>
                </button>
              ) : null
            ) : !estaIniciado ? (
              <button
                type="button"
                className="btn btn-outline-primary btn-sm"
                style={{
                  padding: "2px 8px",
                  fontSize: "11px",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                  height: "26px",
                  borderRadius: "6px",
                  whiteSpace: "nowrap",
                  lineHeight: 1,
                }}
                onClick={handleIniciarChecklist}
                disabled={iniciando}
              >
                {iniciando ? "Iniciando…" : "Iniciar checklist"}
              </button>
            ) : (
              <button
                type="button"
                className="btn btn-outline-primary btn-sm"
                style={{
                  padding: "2px 8px",
                  fontSize: "11px",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                  height: "26px",
                  borderRadius: "6px",
                  whiteSpace: "nowrap",
                  lineHeight: 1,
                }}
                onClick={handleNavegar}
              >
                <i className="bi bi-box-arrow-up-right" style={{ fontSize: "11px" }} />
                <span>Ir al checklist</span>
              </button>
            )}
          </div>
        </div>

        {/* Línea 2 (11 px, gris): Pendientes críticos · Días restantes / Estado */}
        <div
          style={{
            fontSize: "11px",
            color: "#64748b",
            display: "flex",
            alignItems: "center",
            gap: "6px",
            flexWrap: "wrap",
            lineHeight: 1.2,
          }}
        >
          {esCancelado && !estaIniciado ? (
            <span>El servicio está cancelado</span>
          ) : !estaIniciado ? (
            <span>El checklist aún no se ha iniciado</span>
          ) : (
            <>
              {pendientesCriticosCount > 0 ? (
                <span style={{ color: "#dc2626", fontWeight: 600 }}>
                  {pendientesCriticosCount} {pendientesCriticosCount === 1 ? "pendiente crítico" : "pendientes críticos"}
                </span>
              ) : (
                <span style={{ color: "#16a34a", fontWeight: 600 }}>
                  Sin pendientes críticos
                </span>
              )}
              {textoDias && (
                <>
                  <span>·</span>
                  <span style={{ color: colorDias, fontWeight: pesoDias }}>
                    {textoDias}
                  </span>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
};

export const CardPipcDetalleServicio = BloquePipcEntregable;
