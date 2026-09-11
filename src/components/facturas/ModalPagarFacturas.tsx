"use client";

import React, { useEffect, useState, useMemo, useCallback } from "react";
import {
  X,
  CheckCircle2,
  Loader2,
  CreditCard,
  Check,
} from "lucide-react";
import { PagoPendienteMasivoDto } from "@/types/facturas";
import { FacturasService } from "@/services/facturas.service";
import { useToast } from "@/context/ToastContext";
import { formatearFechaTexto } from "@/lib/date-utils";

interface ModalPagarFacturasProps {
  abierto: boolean;
  onCerrar: () => void;
  onGuardadoExitoso?: () => void;
}

export const ModalPagarFacturas: React.FC<ModalPagarFacturasProps> = ({
  abierto,
  onCerrar,
  onGuardadoExitoso,
}) => {
  const { toast } = useToast();

  const hoyIso = useMemo(() => new Date().toISOString().split("T")[0], []);

  const [cargando, setCargando] = useState<boolean>(false);
  const [guardando, setGuardando] = useState<boolean>(false);
  const [listaPagos, setListaPagos] = useState<PagoPendienteMasivoDto[]>([]);
  
  // Set de IDs de facturas seleccionadas
  const [seleccionadosIds, setSeleccionadosIds] = useState<number[]>([]);
  
  // Fecha en que se pagó (global)
  const [fechaPagoGlobal, setFechaPagoGlobal] = useState<string>(hoyIso);

  // Cargar lista completa de pagos pendientes masivos desde el backend (sin parámetros)
  const recargarLista = useCallback(async () => {
    setCargando(true);
    try {
      const res = await FacturasService.getPagosPendientesMasivo();
      const items = res || [];
      setListaPagos(items);
      // Checkboxes por default sin marcar
      setSeleccionadosIds([]);
    } catch (err) {
      console.error("Error al cargar pagos pendientes masivos:", err);
      setListaPagos([]);
      setSeleccionadosIds([]);
    } finally {
      setCargando(false);
    }
  }, []);

  // Cargar datos al abrir el modal
  useEffect(() => {
    if (abierto) {
      setFechaPagoGlobal(hoyIso);
      recargarLista();
    }
  }, [abierto, hoyIso, recargarLista]);

  // Cálculo del Total a pagar acumulado (con IVA) de las filas seleccionadas
  const totalAPagar = useMemo(() => {
    return listaPagos
      .filter((item) => seleccionadosIds.includes(item.i_CveFactura))
      .reduce((acc, item) => acc + (Number(item.d_Monto) || 0), 0);
  }, [listaPagos, seleccionadosIds]);

  // Selección "seleccionar todos" implícito en el header
  const todosSeleccionados =
    listaPagos.length > 0 &&
    listaPagos.every((item) => seleccionadosIds.includes(item.i_CveFactura));

  const handleToggleSeleccionarTodos = () => {
    if (todosSeleccionados) {
      setSeleccionadosIds([]);
    } else {
      setSeleccionadosIds(listaPagos.map((item) => item.i_CveFactura));
    }
  };

  const handleToggleFila = (id: number) => {
    setSeleccionadosIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  // Guardado Masivo (Sección 4 & 4.1)
  const handleGuardarPagosMasivos = async () => {
    if (seleccionadosIds.length === 0) {
      toast.warning("Selecciona al menos una factura para marcar.");
      return;
    }

    const fechaEnvio = fechaPagoGlobal || hoyIso;
    setGuardando(true);
    const fallidos: string[] = [];

    const filasSeleccionadas = listaPagos.filter((f) =>
      seleccionadosIds.includes(f.i_CveFactura)
    );

    for (const fila of filasSeleccionadas) {
      const idsAbonos = (fila.v_AbonosIds ?? "")
        .split(",")
        .map(Number)
        .filter(Boolean);

      for (const idAbono of idsAbonos) {
        const res = await FacturasService.marcarAbonoPagado(
          idAbono,
          fechaEnvio,
          null
        );
        if (!res.exito) {
          console.error(
            `[PagosMasivos] Error al marcar abono #${idAbono} de la factura ${fila.v_NoFactura || fila.i_CveFactura}:`,
            res.mensaje
          );
          const idFacturaTxt = fila.v_NoFactura || `Factura #${fila.i_CveFactura}`;
          if (!fallidos.includes(idFacturaTxt)) {
            fallidos.push(idFacturaTxt);
          }
        }
      }
    }

    setGuardando(false);

    if (fallidos.length > 0) {
      toast.error(
        `No se pudieron marcar: ${fallidos.join(", ")}. El resto sí se guardó correctamente.`
      );
    } else {
      toast.success("Pagos marcados correctamente.");
      if (onGuardadoExitoso) onGuardadoExitoso();
      onCerrar();
    }

    recargarLista();
  };

  if (!abierto) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(15, 23, 42, 0.6)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1050,
        padding: "16px",
      }}
    >
      <div
        style={{
          backgroundColor: "#ffffff",
          borderRadius: "16px",
          width: "100%",
          maxWidth: "1150px",
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
          overflow: "hidden",
          border: "1px solid #e2e8f0",
        }}
      >
        {/* HEADER */}
        <div
          style={{
            padding: "16px 24px",
            borderBottom: "1px solid #ddeaf5",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            backgroundColor: "#f8fafc",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "10px",
                backgroundColor: "#e0f2fe",
                color: "#0284c7",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <CreditCard size={22} />
            </div>
            <div>
              <h2
                style={{
                  margin: 0,
                  fontSize: "18px",
                  fontWeight: 700,
                  color: "#0f172a",
                  lineHeight: "1.2",
                }}
              >
                Pagos masivos
              </h2>
              <span style={{ fontSize: "12px", color: "#64748b" }}>
                Marca como pagados los abonos vencidos de tus facturas.
              </span>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            {/* Total a pagar acumulado */}
            <div
              style={{
                backgroundColor: "#f0fdf4",
                border: "1px solid #bbf7d0",
                borderRadius: "8px",
                padding: "6px 14px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <span style={{ fontSize: "12px", color: "#166534", fontWeight: 600 }}>Total a pagar:</span>
              <span style={{ fontSize: "16px", color: "#15803d", fontWeight: 800 }}>
                ${totalAPagar.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>

            <button
              type="button"
              onClick={onCerrar}
              disabled={guardando}
              style={{
                background: "none",
                border: "none",
                color: guardando ? "#cbd5e1" : "#64748b",
                cursor: guardando ? "not-allowed" : "pointer",
                padding: "6px",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* BODY */}
        <div
          style={{
            padding: "20px 24px",
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            gap: "16px",
            flex: 1,
          }}
        >
          {/* 3.1 BARRA SUPERIOR (RESUMEN Y CONTADOR) */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              backgroundColor: "#f8fafc",
              padding: "10px 16px",
              borderRadius: "8px",
              border: "1px solid #e2e8f0",
              fontSize: "12px",
              fontWeight: 600,
              color: "#64748b",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ color: "#475569" }}>Total a pagar seleccionado:</span>
              <span style={{ color: "#15803d", fontWeight: 700, fontSize: "13px" }}>
                ${totalAPagar.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>

            <div>
              Pendientes: <span style={{ color: "#0f172a" }}>{listaPagos.length}</span> |{" "}
              Seleccionados:{" "}
              <span style={{ color: "#2B8FCC" }}>{seleccionadosIds.length}</span>
            </div>
          </div>

          {/* 3.3 ESTADOS DE CARGA / SKELETON / TABLA */}
          {cargando ? (
            <div style={{ border: "1px solid #e2e8f0", borderRadius: "10px", overflow: "hidden" }}>
              <div style={{ padding: "16px" }}>
                {Array.from({ length: 5 }).map((_, idx) => (
                  <div
                    key={`sk-pagos-${idx}`}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "16px",
                      padding: "12px 0",
                      borderBottom: idx < 4 ? "1px solid #f1f5f9" : "none",
                    }}
                  >
                    <div className="skeleton-box" style={{ width: "20px", height: "20px", borderRadius: "4px" }}></div>
                    <div style={{ flex: 2 }}>
                      <div className="skeleton-box" style={{ width: "70%", height: "14px", marginBottom: "6px" }}></div>
                      <div className="skeleton-box sm" style={{ width: "40%", height: "10px" }}></div>
                    </div>
                    <div style={{ flex: 2 }}>
                      <div className="skeleton-box sm" style={{ width: "80%", height: "12px" }}></div>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div className="skeleton-box sm" style={{ width: "60px", height: "12px" }}></div>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div className="skeleton-box sm" style={{ width: "75px", height: "12px" }}></div>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div className="skeleton-box sm" style={{ width: "70px", height: "14px" }}></div>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div className="skeleton-box" style={{ width: "60px", height: "20px", borderRadius: "10px" }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : listaPagos.length === 0 ? (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: "60px 20px",
                gap: "12px",
                backgroundColor: "#f8fafc",
                borderRadius: "12px",
                border: "1px border-dashed #cbd5e1",
              }}
            >
              <CheckCircle2 size={40} style={{ color: "#10b981" }} />
              <span style={{ fontSize: "15px", fontWeight: 600, color: "#1e293b" }}>
                ¡Sin pagos vencidos!
              </span>
              <span style={{ fontSize: "13px", color: "#64748b" }}>
                No se encontraron facturas con pagos pendientes por marcar.
              </span>
            </div>
          ) : (
            <div
              style={{
                border: "1px solid #e2e8f0",
                borderRadius: "10px",
                overflow: "hidden",
              }}
            >
              <div style={{ overflowX: "auto", maxHeight: "55vh" }}>
                <table
                  style={{
                    width: "100%",
                    margin: 0,
                    fontSize: "12px",
                    borderCollapse: "collapse",
                  }}
                >
                  <thead
                    style={{
                      backgroundColor: "#f1f5f9",
                      position: "sticky",
                      top: 0,
                      zIndex: 10,
                      color: "#334155",
                      fontWeight: 700,
                    }}
                  >
                    <tr>
                      <th style={{ width: "40px", padding: "10px 12px", textAlign: "center" }}>
                        <input
                          type="checkbox"
                          checked={todosSeleccionados}
                          onChange={handleToggleSeleccionarTodos}
                          style={{ cursor: "pointer", width: "16px", height: "16px" }}
                          title="Seleccionar / desmarcar todas"
                        />
                      </th>
                      <th style={{ width: "40px", padding: "10px 12px", textAlign: "center" }}>#</th>
                      <th style={{ padding: "10px 12px" }}>Empresa / Planta</th>
                      <th style={{ padding: "10px 12px" }}>Servicio</th>
                      <th style={{ padding: "10px 12px" }}>No. de factura</th>
                      <th style={{ padding: "10px 12px" }}>Fecha factura</th>
                      <th style={{ padding: "10px 12px" }}>Fecha de pago</th>
                      <th style={{ padding: "10px 12px", textAlign: "right" }}>Monto</th>
                      <th style={{ padding: "10px 12px", textAlign: "center", width: "90px" }}>Estatus</th>
                    </tr>
                  </thead>
                  <tbody>
                    {listaPagos.map((item, idx) => {
                      const estaSeleccionado = seleccionadosIds.includes(item.i_CveFactura);
                      const esPendienteFactura = !item.v_NoFactura || item.v_NoFactura === "Pendiente";

                      return (
                        <tr
                          key={item.i_CveFactura}
                          style={{
                            backgroundColor: estaSeleccionado ? "#f0f9ff" : "#ffffff",
                            borderBottom: "1px solid #f1f5f9",
                            transition: "background-color 0.15s",
                          }}
                        >
                          <td style={{ padding: "8px 12px", textAlign: "center" }}>
                            <input
                              type="checkbox"
                              checked={estaSeleccionado}
                              onChange={() => handleToggleFila(item.i_CveFactura)}
                              style={{ cursor: "pointer", width: "16px", height: "16px" }}
                            />
                          </td>

                          <td style={{ padding: "8px 12px", textAlign: "center", color: "#64748b", fontWeight: 600 }}>
                            {idx + 1}
                          </td>

                          <td style={{ padding: "8px 12px" }}>
                            <div style={{ fontWeight: 700, color: "#0f172a" }}>
                              {item.v_Empresa || "Sin Empresa"}
                            </div>
                            {item.v_Planta && (
                              <div style={{ fontSize: "11px", color: "#64748b" }}>
                                {item.v_Planta}
                              </div>
                            )}
                          </td>

                          <td style={{ padding: "8px 12px", color: "#1e3a5f" }}>
                            {item.v_Servicio || "—"}
                          </td>

                          <td style={{ padding: "8px 12px" }}>
                            {esPendienteFactura ? (
                              <span style={{ color: "#dc2626", fontWeight: 700 }}>Pendiente</span>
                            ) : (
                              <span style={{ fontWeight: 600, color: "#0f172a" }}>{item.v_NoFactura}</span>
                            )}
                          </td>

                          <td style={{ padding: "8px 12px", color: "#475569" }}>
                            {formatearFechaTexto(item.d_FechaFactura)}
                          </td>

                          <td style={{ padding: "8px 12px", color: "#475569" }}>
                            {formatearFechaTexto(item.d_FechaProximoPago)}
                          </td>

                          <td style={{ padding: "8px 12px", textAlign: "right", fontWeight: 700, color: "#dc2626" }}>
                            ${Number(item.d_Monto || 0).toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>

                          <td style={{ padding: "8px 12px", textAlign: "center" }}>
                            <span className="badge badge-danger">Vencido</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* 3.4 FOOTER */}
        <div
          style={{
            padding: "16px 24px",
            borderTop: "1px solid #ddeaf5",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            backgroundColor: "#f8fafc",
            gap: "16px",
          }}
        >
          <span style={{ fontSize: "13px", color: "#2B8FCC", fontWeight: 600 }}>
            {seleccionadosIds.length} factura(s) lista(s) para marcar
          </span>

          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <button
              type="button"
              onClick={onCerrar}
              disabled={guardando}
              style={{
                padding: "8px 20px",
                borderRadius: "8px",
                border: "1px solid #cbd5e1",
                backgroundColor: "#ffffff",
                color: "#475569",
                fontSize: "13px",
                fontWeight: 600,
                cursor: guardando ? "not-allowed" : "pointer",
              }}
            >
              Cancelar
            </button>

            <button
              type="button"
              onClick={handleGuardarPagosMasivos}
              disabled={guardando || seleccionadosIds.length === 0}
              style={{
                padding: "8px 24px",
                borderRadius: "8px",
                border: "none",
                backgroundColor:
                  guardando || seleccionadosIds.length === 0
                    ? "#94a3b8"
                    : "#2B8FCC",
                color: "#ffffff",
                fontSize: "13px",
                fontWeight: 700,
                cursor:
                  guardando || seleccionadosIds.length === 0
                    ? "not-allowed"
                    : "pointer",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                boxShadow: "0 2px 4px rgba(43, 143, 204, 0.2)",
              }}
            >
              {guardando ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Pagando...</span>
                </>
              ) : (
                <>
                  <Check size={16} strokeWidth={3} />
                  <span>Pagar</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
