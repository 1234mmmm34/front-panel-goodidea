"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { MESES_ABREV } from "@/lib/date-utils";
import { NotificacionesService } from "@/services/notificaciones.service";
import type { NotificacionDto } from "@/types/notificaciones";

interface Props {
  buttonSize?: number;
}

function formatearFechaNotificacion(fechaStr: string | null | undefined): string {
  if (!fechaStr) return "";
  const d = new Date(fechaStr);
  if (Number.isNaN(d.getTime())) return "";

  const p = (n: number) => String(n).padStart(2, "0");
  const hora = `${p(d.getHours())}:${p(d.getMinutes())}`;

  const hoy = new Date();
  const hoyInicio = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
  const ayerInicio = new Date(hoyInicio);
  ayerInicio.setDate(ayerInicio.getDate() - 1);
  const fechaInicio = new Date(d.getFullYear(), d.getMonth(), d.getDate());

  if (fechaInicio.getTime() === hoyInicio.getTime()) {
    return `Hoy ${hora}`;
  }
  if (fechaInicio.getTime() === ayerInicio.getTime()) {
    return `Ayer ${hora}`;
  }

  return `${p(d.getDate())}/${MESES_ABREV[d.getMonth()]}/${d.getFullYear()}`;
}

function iconoPorTipo(v_Tipo: string): string {
  switch ((v_Tipo || "").toUpperCase()) {
    case "ACTIVIDAD_ASIGNADA":
      return "bi-clipboard-check";
    default:
      return "bi-bell";
  }
}

export const NotificacionesBell: React.FC<Props> = ({ buttonSize = 32 }) => {
  const router = useRouter();
  const pathname = usePathname();

  const [abierto, setAbierto] = useState<boolean>(false);
  const [noLeidas, setNoLeidas] = useState<number>(0);
  const [notificaciones, setNotificaciones] = useState<NotificacionDto[]>([]);

  const dropdownRef = useRef<HTMLDivElement>(null);

  const cargarNotificaciones = useCallback(async () => {
    if (typeof navigator !== "undefined" && !navigator.onLine) return;
    if (
      typeof document !== "undefined" &&
      document.visibilityState === "hidden"
    ) {
      return;
    }

    try {
      const res = await NotificacionesService.getNotificaciones(20);
      setNoLeidas(res.i_NoLeidas);
      setNotificaciones(res.Notificaciones);
    } catch {
      // Conservar último estado sin mostrar error
    }
  }, []);

  // Consulta al montar y en cada cambio de ruta
  useEffect(() => {
    const timer = setTimeout(() => {
      cargarNotificaciones();
    }, 0);
    return () => clearTimeout(timer);
  }, [pathname, cargarNotificaciones]);

  // Polling cada 60 s pausado si la pestaña está oculta o sin conexión
  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval> | null = null;

    const iniciarIntervalo = () => {
      if (intervalId) return;
      if (
        document.visibilityState === "visible" &&
        (typeof navigator === "undefined" || navigator.onLine)
      ) {
        intervalId = setInterval(() => {
          cargarNotificaciones();
        }, 60_000);
      }
    };

    const detenerIntervalo = () => {
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }
    };

    const evaluarEstado = () => {
      const visible = document.visibilityState === "visible";
      const enLinea = typeof navigator === "undefined" || navigator.onLine;
      if (visible && enLinea) {
        iniciarIntervalo();
      } else {
        detenerIntervalo();
      }
    };

    evaluarEstado();
    document.addEventListener("visibilitychange", evaluarEstado);
    window.addEventListener("online", evaluarEstado);
    window.addEventListener("offline", evaluarEstado);

    return () => {
      detenerIntervalo();
      document.removeEventListener("visibilitychange", evaluarEstado);
      window.removeEventListener("online", evaluarEstado);
      window.removeEventListener("offline", evaluarEstado);
    };
  }, [cargarNotificaciones]);

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setAbierto(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleClickNotificacion = async (n: NotificacionDto) => {
    if (!n.b_Leida) {
      setNotificaciones((prev) =>
        prev.map((item) =>
          item.i_CveNotificacion === n.i_CveNotificacion
            ? { ...item, b_Leida: true }
            : item
        )
      );
      setNoLeidas((prev) => Math.max(0, prev - 1));

      try {
        await NotificacionesService.marcarLeida(n.i_CveNotificacion);
      } catch {
        // Silencioso si falla red
      }
    }

    setAbierto(false);
    if (n.v_Ruta) {
      router.push(n.v_Ruta);
    }
  };

  const handleMarcarTodas = async () => {
    setNotificaciones((prev) => prev.map((n) => ({ ...n, b_Leida: true })));
    setNoLeidas(0);

    try {
      await NotificacionesService.marcarTodasLeidas();
    } catch {
      // Silencioso si falla red
    }
  };

  const badgeTexto = noLeidas > 9 ? "9+" : String(noLeidas);

  return (
    <div ref={dropdownRef} style={{ position: "relative" }}>
      <button
        type="button"
        className="btn-icon-top"
        title="Notificaciones"
        aria-label="Notificaciones"
        aria-expanded={abierto}
        onClick={() => setAbierto((v) => !v)}
        style={{
          width: `${buttonSize}px`,
          height: `${buttonSize}px`,
          position: "relative",
          backgroundColor: abierto ? "#eaf4fb" : undefined,
          color: abierto ? "#2B8FCC" : undefined,
        }}
      >
        <i className="bi bi-bell" style={{ fontSize: "16px" }} />
        {noLeidas > 0 && (
          <span
            style={{
              position: "absolute",
              top: "-4px",
              right: "-4px",
              minWidth: "17px",
              height: "17px",
              padding: "0 4px",
              borderRadius: "999px",
              backgroundColor: "#dc2626",
              color: "#ffffff",
              fontSize: "10px",
              fontWeight: 700,
              lineHeight: "17px",
              textAlign: "center",
              border: "1.5px solid #ffffff",
              pointerEvents: "none",
            }}
          >
            {badgeTexto}
          </span>
        )}
      </button>

      {abierto && (
        <div
          style={{
            position: "absolute",
            top: `${buttonSize + 10}px`,
            right: 0,
            width: "360px",
            maxWidth: "calc(100vw - 24px)",
            maxHeight: "420px",
            backgroundColor: "#ffffff",
            borderRadius: "14px",
            border: "1px solid #e2e8f0",
            boxShadow:
              "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05)",
            zIndex: 1200,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          {/* Encabezado */}
          <div
            style={{
              padding: "12px 16px",
              borderBottom: "1px solid #f1f5f9",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "8px",
              flexShrink: 0,
            }}
          >
            <span
              style={{
                fontSize: "14px",
                fontWeight: 700,
                color: "#1e293b",
              }}
            >
              Notificaciones
            </span>

            {noLeidas > 0 && (
              <button
                type="button"
                onClick={handleMarcarTodas}
                style={{
                  background: "none",
                  border: "none",
                  padding: 0,
                  color: "#2B8FCC",
                  fontSize: "12px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Marcar todas como leídas
              </button>
            )}
          </div>

          {/* Lista con scroll */}
          <div style={{ overflowY: "auto", flex: 1 }}>
            {notificaciones.length === 0 ? (
              <div
                style={{
                  padding: "32px 16px",
                  textAlign: "center",
                  color: "#64748b",
                  fontSize: "13px",
                }}
              >
                <i
                  className="bi bi-bell-slash"
                  style={{
                    fontSize: "24px",
                    display: "block",
                    marginBottom: "6px",
                    color: "#94a3b8",
                  }}
                />
                No tienes notificaciones
              </div>
            ) : (
              notificaciones.map((n) => (
                <button
                  key={n.i_CveNotificacion}
                  type="button"
                  onClick={() => handleClickNotificacion(n)}
                  style={{
                    width: "100%",
                    textAlign: "left",
                    padding: "12px 16px",
                    border: "none",
                    borderBottom: "1px solid #f1f5f9",
                    backgroundColor: n.b_Leida ? "#ffffff" : "#f0f9ff",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "10px",
                    transition: "background-color 0.15s ease",
                  }}
                >
                  <div
                    style={{
                      width: "32px",
                      height: "32px",
                      borderRadius: "8px",
                      backgroundColor: n.b_Leida ? "#f1f5f9" : "#e0f2fe",
                      color: n.b_Leida ? "#64748b" : "#2B8FCC",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      fontSize: "15px",
                      marginTop: "2px",
                    }}
                  >
                    <i className={`bi ${iconoPorTipo(n.v_Tipo)}`} />
                  </div>

                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "baseline",
                        justifyContent: "space-between",
                        gap: "8px",
                      }}
                    >
                      <span
                        style={{
                          fontSize: "13px",
                          fontWeight: 700,
                          color: "#0f172a",
                          lineHeight: 1.3,
                        }}
                      >
                        {n.v_Titulo}
                      </span>
                      <span
                        style={{
                          fontSize: "11px",
                          color: "#64748b",
                          whiteSpace: "nowrap",
                          flexShrink: 0,
                        }}
                      >
                        {formatearFechaNotificacion(n.d_FechaRegistro)}
                      </span>
                    </div>

                    {n.v_Mensaje && (
                      <div
                        style={{
                          fontSize: "12px",
                          color: "#475569",
                          marginTop: "3px",
                          lineHeight: 1.35,
                          wordBreak: "break-word",
                        }}
                      >
                        {n.v_Mensaje}
                      </div>
                    )}
                  </div>

                  {!n.b_Leida && (
                    <span
                      style={{
                        width: "8px",
                        height: "8px",
                        borderRadius: "50%",
                        backgroundColor: "#2B8FCC",
                        flexShrink: 0,
                        marginTop: "6px",
                      }}
                    />
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
