"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  X,
  FileText,
  Plus,
  CheckCircle,
  Ban,
  AlertTriangle,
  Check,
} from "lucide-react";
import { FacturaProv, FacturaProvLinea, AbonoProv } from "@/types/gastos";
import { GastosService } from "@/services/gastos.service";
import { formatearFechaTexto, calcularDiasRetraso } from "@/lib/date-utils";
import { useToast } from "@/context/ToastContext";

interface Props {
  abierto: boolean;
  gasto: FacturaProv | null;
  autoAbrirProgramar?: boolean;
  onCerrar: () => void;
  onCambio?: () => void;
}

export const ModalDetalleGasto: React.FC<Props> = ({
  abierto,
  gasto,
  autoAbrirProgramar = false,
  onCerrar,
  onCambio,
}) => {
  const { toast } = useToast();
  const hoyStr = new Date().toISOString().split("T")[0];

  const [cargando, setCargando] = useState<boolean>(true);
  const [lineas, setLineas] = useState<FacturaProvLinea[]>([]);
  const [abonos, setAbonos] = useState<AbonoProv[]>([]);
  const [gastoLocal, setGastoLocal] = useState<FacturaProv | null>(null);

  // Sub-modales
  const [subModalPagadoAbierto, setSubModalPagadoAbierto] = useState<boolean>(false);
  const [subModalCancelarAbierto, setSubModalCancelarAbierto] = useState<boolean>(false);
  const [abonoSeleccionado, setAbonoSeleccionado] = useState<AbonoProv | null>(null);

  // Sub-modal pagado
  const [fechaPagoReal, setFechaPagoReal] = useState<string>(hoyStr);
  const [notasPago, setNotasPago] = useState<string>("");
  const [errorSubModalPagado, setErrorSubModalPagado] = useState<string | null>(null);

  // Sub-modal cancelar
  const [motivoCancelacionAbono, setMotivoCancelacionAbono] = useState<string>("");
  const [errorSubModalCancelar, setErrorSubModalCancelar] = useState<string | null>(null);

  // Fila editable inline para agregar abono
  const [mostrandoFilaAgregar, setMostrandoFilaAgregar] = useState<boolean>(false);
  const [fechaAbonoProgramadaDraft, setFechaAbonoProgramadaDraft] = useState<string>(hoyStr);
  const [montoAbonoProgramadoDraft, setMontoAbonoProgramadoDraft] = useState<string>("");
  const [errorFilaAgregar, setErrorFilaAgregar] = useState<string | null>(null);
  const [guardandoFilaAgregar, setGuardandoFilaAgregar] = useState<boolean>(false);

  const [guardandoAccion, setGuardandoAccion] = useState<boolean>(false);

  const cargarDatosDetalle = useCallback(async (idGasto: number) => {
    setCargando(true);
    const [resDetalle, resAbonos] = await Promise.all([
      GastosService.getGastoDetalle(idGasto),
      GastosService.getAbonosPorGasto(idGasto),
    ]);
    setLineas(Array.isArray(resDetalle) ? resDetalle : []);
    setAbonos(Array.isArray(resAbonos) ? resAbonos : []);
    setCargando(false);
  }, []);

  const recargarAbonosYSaldo = useCallback(async (idGasto: number) => {
    const resAbonos = await GastosService.getAbonosPorGasto(idGasto);
    const abonosNuevos = Array.isArray(resAbonos) ? resAbonos : [];
    setAbonos(abonosNuevos);

    const abonosPagados = abonosNuevos.filter((a) => a.i_Estado === 1);
    const sumaPagados = abonosPagados.reduce((acc, a) => acc + (a.d_Monto || 0), 0);

    setGastoLocal((prev) => {
      if (!prev) return null;
      const montoGasto = prev.d_Monto || 0;
      const nuevoSaldo = Math.max(0, montoGasto - sumaPagados);
      return {
        ...prev,
        d_SaldoPendiente: nuevoSaldo,
      };
    });
  }, []);

  // Estado Descuento (%)
  const [porcentajeDescuentoDraft, setPorcentajeDescuentoDraft] = useState<string>("0");
  const [guardandoDescuento, setGuardandoDescuento] = useState<boolean>(false);

  useEffect(() => {
    if (abierto && gasto) {
      setGastoLocal(gasto);
      cargarDatosDetalle(gasto.i_CveFacturaProv);
      setPorcentajeDescuentoDraft(
        gasto.d_PorcentajeDescuento !== undefined && gasto.d_PorcentajeDescuento !== null
          ? gasto.d_PorcentajeDescuento.toString()
          : "0"
      );
      if (autoAbrirProgramar) {
        setMostrandoFilaAgregar(true);
        setMontoAbonoProgramadoDraft(
          gasto.d_SaldoPendiente > 0 ? gasto.d_SaldoPendiente.toString() : "0"
        );
      } else {
        setMostrandoFilaAgregar(false);
      }
    } else if (!abierto) {
      setGastoLocal(null);
    }
  }, [abierto, gasto, autoAbrirProgramar, cargarDatosDetalle]);

  const handleAplicarDescuento = async () => {
    if (!gastoLocal) return;
    const pct = parseFloat(porcentajeDescuentoDraft);
    if (isNaN(pct) || pct < 0 || pct > 100) {
      toast.error("El porcentaje de descuento debe estar entre 0 y 100.");
      return;
    }

    setGuardandoDescuento(true);
    const res = await GastosService.aplicarDescuento({
      i_CveFacturaProv: gastoLocal.i_CveFacturaProv,
      d_PorcentajeDescuento: pct,
    });
    setGuardandoDescuento(false);

    if (res.exito && res.datos) {
      toast.success("Descuento aplicado correctamente.");
      const datosNuevos = res.datos;
      setGastoLocal((prev) =>
        prev
          ? {
              ...prev,
              d_PorcentajeDescuento: datosNuevos.d_PorcentajeDescuento,
              d_Monto: datosNuevos.d_Monto,
              d_SaldoPendiente: datosNuevos.d_SaldoPendiente,
              v_EstadoPago: datosNuevos.v_EstadoPago,
            }
          : null
      );
      setPorcentajeDescuentoDraft(datosNuevos.d_PorcentajeDescuento.toString());
      cargarDatosDetalle(gastoLocal.i_CveFacturaProv);
      if (onCambio) onCambio();
    } else {
      toast.error(res.mensaje || "Error al aplicar el descuento.");
    }
  };

  const formatearMonto = (monto: number): string => {
    const val = isNaN(monto) ? 0 : monto;
    return `$${val.toLocaleString("es-MX", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  // Cálculos de resumen de servicios y descuento
  const { subtotalTabla, porcentajeDesc, montoDescuento, subtotalConDescuento, ivaCalculado } = useMemo(() => {
    let sub = 0;
    lineas.forEach((l) => {
      sub += l.d_Subtotal || 0;
    });

    const pct = gastoLocal?.d_PorcentajeDescuento || 0;
    const desc = sub * (pct / 100);
    const subConDesc = sub - desc;
    const iva = pct > 0 ? subConDesc * 0.16 : lineas.reduce((acc, l) => acc + (l.d_IVA || 0), 0);

    return {
      subtotalTabla: sub,
      porcentajeDesc: pct,
      montoDescuento: desc,
      subtotalConDescuento: subConDesc,
      ivaCalculado: iva,
    };
  }, [lineas, gastoLocal]);

  // Abonos
  const abonosPagados = abonos.filter((a) => a.i_Estado === 1);
  const abonosActivos = abonos.filter((a) => a.i_Estado !== 2);

  const sumaPagados = abonosPagados.reduce((acc, a) => acc + (a.d_Monto || 0), 0);
  const sumaActivos = abonosActivos.reduce((acc, a) => acc + (a.d_Monto || 0), 0);

  const montoGasto = gastoLocal?.d_Monto || 0;
  const saldoPendienteReal = Math.max(0, montoGasto - sumaPagados);
  const hayDescuadre = gastoLocal ? Math.abs(sumaActivos - montoGasto) > 0.01 : false;

  // Porcentaje sobre venta / gasto total
  const porcentajeCobro = subtotalTabla > 0 && gastoLocal ? Math.min(100, (montoGasto / (subtotalTabla * 1.16)) * 100) : 100;

  // Acciones
  const handleAbrirMarcarPagado = (abono: AbonoProv) => {
    setAbonoSeleccionado(abono);
    setFechaPagoReal(hoyStr);
    setNotasPago("");
    setErrorSubModalPagado(null);
    setSubModalPagadoAbierto(true);
  };

  const handleAbrirCancelarPago = (abono: AbonoProv) => {
    setAbonoSeleccionado(abono);
    setMotivoCancelacionAbono("");
    setErrorSubModalCancelar(null);
    setSubModalCancelarAbierto(true);
  };

  const handleToggleFilaAgregar = () => {
    if (mostrandoFilaAgregar) {
      setMostrandoFilaAgregar(false);
      setErrorFilaAgregar(null);
    } else {
      if (saldoPendienteReal <= 0) {
        toast.info("El gasto ya está saldado.");
        return;
      }
      setFechaAbonoProgramadaDraft(hoyStr);
      setMontoAbonoProgramadoDraft(saldoPendienteReal.toString());
      setErrorFilaAgregar(null);
      setMostrandoFilaAgregar(true);
    }
  };

  const handleConfirmarMarcarPagado = async () => {
    if (!gastoLocal || !abonoSeleccionado) return;
    if (!fechaPagoReal) {
      setErrorSubModalPagado("Por favor selecciona la fecha de pago.");
      return;
    }

    setGuardandoAccion(true);
    setErrorSubModalPagado(null);

    const res = await GastosService.marcarAbonoPagado({
      i_CveAbonoProv: abonoSeleccionado.i_CveAbonoProv,
      d_FechaAbono: fechaPagoReal,
      v_Referencia: notasPago,
    });
    setGuardandoAccion(false);

    if (res.exito) {
      toast.success("Pago registrado correctamente.");
      setSubModalPagadoAbierto(false);
      await recargarAbonosYSaldo(gastoLocal.i_CveFacturaProv);
      if (onCambio) onCambio();
    } else {
      setErrorSubModalPagado(res.mensaje || "Error al marcar el pago.");
    }
  };

  const handleConfirmarCancelarPago = async () => {
    if (!gastoLocal || !abonoSeleccionado) return;
    if (!motivoCancelacionAbono.trim()) {
      setErrorSubModalCancelar("Ingresa el motivo de cancelación.");
      return;
    }

    setGuardandoAccion(true);
    setErrorSubModalCancelar(null);

    const res = await GastosService.cancelarAbono({
      i_CveAbonoProv: abonoSeleccionado.i_CveAbonoProv,
      v_MotivoCancelacion: motivoCancelacionAbono,
    });
    setGuardandoAccion(false);

    if (res.exito) {
      toast.success("Abono cancelado.");
      setSubModalCancelarAbierto(false);
      await recargarAbonosYSaldo(gastoLocal.i_CveFacturaProv);
      if (onCambio) onCambio();
    } else {
      setErrorSubModalCancelar(res.mensaje || "Error al cancelar el abono.");
    }
  };

  const handleGuardarNuevoAbonoProgramado = async () => {
    if (!gastoLocal) return;
    const montoNum = parseFloat(montoAbonoProgramadoDraft);
    if (isNaN(montoNum) || montoNum <= 0) {
      setErrorFilaAgregar("El monto debe ser mayor a 0.");
      return;
    }
    if (!fechaAbonoProgramadaDraft) {
      setErrorFilaAgregar("Selecciona la fecha programada.");
      return;
    }

    setGuardandoFilaAgregar(true);
    setErrorFilaAgregar(null);

    const res = await GastosService.agregarAbono({
      i_CveFacturaProv: gastoLocal.i_CveFacturaProv,
      d_Monto: montoNum,
      d_FechaProgramada: fechaAbonoProgramadaDraft,
    });
    setGuardandoFilaAgregar(false);

    if (res.exito) {
      toast.success("Pago programado registrado.");
      setMostrandoFilaAgregar(false);
      await recargarAbonosYSaldo(gastoLocal.i_CveFacturaProv);
      if (onCambio) onCambio();
    } else {
      setErrorFilaAgregar(res.mensaje || "Error al agregar el pago programado.");
    }
  };

  if (!abierto || !gastoLocal) return null;

  const ocTitulo = gastoLocal.v_NoOrdenCompraProv
    ? `Detalle de la orden de compra ${gastoLocal.v_NoOrdenCompraProv}`
    : `Detalle de la orden de compra`;

  return (
    <>
      <div
        className="modal-overlay"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(15, 23, 42, 0.6)",
          backdropFilter: "blur(6px)",
          WebkitBackdropFilter: "blur(6px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000,
          padding: "16px",
        }}
      >
        <div
          className="modal-content"
          style={{
            maxWidth: "880px",
            width: "95%",
            maxHeight: "92vh",
            display: "flex",
            flexDirection: "column",
            borderRadius: "12px",
            overflow: "hidden",
            backgroundColor: "#ffffff",
            boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
          }}
        >
          {/* Header */}
          <div
            className="modal-header"
            style={{
              padding: "12px 20px",
              borderBottom: "1px solid #e2e8f0",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "16px",
              flexWrap: "nowrap",
              backgroundColor: "#ffffff",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div
                style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "8px",
                  backgroundColor: "#e0f2fe",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#0284c7",
                  flexShrink: 0,
                }}
              >
                <FileText size={18} />
              </div>
              <h3
                className="modal-title"
                style={{
                  fontSize: "17px",
                  fontWeight: 700,
                  color: "#0f172a",
                  margin: 0,
                  letterSpacing: "-0.01em",
                }}
              >
                {ocTitulo}
              </h3>
              {saldoPendienteReal <= 0 && (
                <span
                  style={{
                    backgroundColor: "#f0fdf4",
                    border: "1px solid #bbf7d0",
                    color: "#16a34a",
                    fontSize: "11px",
                    fontWeight: 700,
                    padding: "2px 8px",
                    borderRadius: "12px",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "4px",
                    marginLeft: "4px",
                  }}
                >
                  <Check size={12} /> Pagado
                </span>
              )}
            </div>

            {/* Header Right: Stats Card + Close Button */}
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              {!cargando && (
                <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                  <div style={{ textAlign: "right" }}>
                    <span
                      style={{
                        fontSize: "11px",
                        fontWeight: 600,
                        color: "#64748b",
                        display: "block",
                        lineHeight: "1.2",
                      }}
                    >
                      Monto de la orden de compra
                    </span>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "baseline",
                        justifyContent: "flex-end",
                        gap: "4px",
                        marginTop: "2px",
                      }}
                    >
                      <span
                        style={{
                          fontSize: "16px",
                          fontWeight: 800,
                          color: "#0f172a",
                          lineHeight: "1",
                        }}
                      >
                        {formatearMonto(gastoLocal.d_Monto)}
                      </span>
                      <span
                        style={{
                          fontSize: "10px",
                          fontWeight: 700,
                          color: "#64748b",
                        }}
                      >
                        MXN
                      </span>
                    </div>
                  </div>

                  <div
                    style={{
                      borderLeft: "1px solid #e2e8f0",
                      paddingLeft: "16px",
                      textAlign: "right",
                      height: "32px",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "center",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "11px",
                        fontWeight: 600,
                        color: "#64748b",
                        display: "block",
                        lineHeight: "1.2",
                      }}
                    >
                      Proveedor
                    </span>
                    <span
                      style={{
                        fontSize: "14px",
                        fontWeight: 700,
                        color: "#0284c7",
                        lineHeight: "1",
                        display: "block",
                        marginTop: "2px",
                      }}
                    >
                      {gastoLocal.v_Proveedor || "—"}
                    </span>
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={onCerrar}
                style={{
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  color: "#64748b",
                  padding: "4px",
                  borderRadius: "6px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Body */}
          <div
            className="modal-body custom-scrollbar"
            style={{
              padding: "16px 20px",
              overflowY: "auto",
              flex: 1,
              display: "flex",
              flexDirection: "column",
              gap: "16px",
            }}
          >
            {cargando ? (
              <div style={{ textAlign: "center", padding: "40px" }}>
                <div className="inline-block animate-spin rounded-full h-7 w-7 border-b-2 border-sky-600 mb-2"></div>
                <p style={{ fontSize: "12px", color: "#64748b" }}>Cargando detalle del gasto...</p>
              </div>
            ) : (
              <>
                {/* 1. Servicios de la orden de compra */}
                <div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: "8px",
                      marginTop: 0,
                      flexWrap: "wrap",
                      gap: "10px",
                    }}
                  >
                    <h4
                      style={{
                        fontSize: "13px",
                        fontWeight: 700,
                        color: "#334155",
                        margin: 0,
                      }}
                    >
                      Servicios de la orden de compra
                    </h4>

                    {/* Control de Descuento (%) */}
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <span style={{ fontSize: "12px", fontWeight: 600, color: "#475569" }}>
                        Descuento (%):
                      </span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        disabled={Boolean(gastoLocal.b_Cancelada) || guardandoDescuento}
                        value={porcentajeDescuentoDraft}
                        onChange={(e) => setPorcentajeDescuentoDraft(e.target.value)}
                        placeholder="0"
                        style={{
                          width: "70px",
                          padding: "4px 8px",
                          fontSize: "12px",
                          borderRadius: "6px",
                          border: "1px solid #cbd5e1",
                          textAlign: "right",
                          backgroundColor: gastoLocal.b_Cancelada ? "#f1f5f9" : "#ffffff",
                          outline: "none",
                        }}
                      />
                      <button
                        type="button"
                        disabled={Boolean(gastoLocal.b_Cancelada) || guardandoDescuento}
                        onClick={handleAplicarDescuento}
                        style={{
                          padding: "4px 12px",
                          fontSize: "12px",
                          fontWeight: 600,
                          borderRadius: "6px",
                          backgroundColor: gastoLocal.b_Cancelada ? "#cbd5e1" : "#0284c7",
                          color: gastoLocal.b_Cancelada ? "#94a3b8" : "#ffffff",
                          border: "none",
                          cursor: gastoLocal.b_Cancelada || guardandoDescuento ? "not-allowed" : "pointer",
                          transition: "background-color 0.2s",
                        }}
                      >
                        {guardandoDescuento ? "..." : "Aplicar"}
                      </button>
                    </div>
                  </div>

                  <div
                    style={{
                      border: "1px solid #e2e8f0",
                      borderRadius: "8px",
                      overflow: "hidden",
                      backgroundColor: "#ffffff",
                    }}
                  >
                    <table
                      style={{
                        width: "100%",
                        borderCollapse: "collapse",
                        fontSize: "12px",
                      }}
                    >
                      <thead>
                        <tr
                          style={{
                            borderBottom: "1px solid #e2e8f0",
                            backgroundColor: "#ffffff",
                          }}
                        >
                          <th
                            style={{
                              textAlign: "left",
                              padding: "8px 12px",
                              fontWeight: 600,
                              color: "#475569",
                              borderRight: "1px solid #e2e8f0",
                            }}
                          >
                            Servicio
                          </th>
                          <th
                            style={{
                              textAlign: "center",
                              width: "110px",
                              padding: "8px 12px",
                              fontWeight: 600,
                              color: "#475569",
                              borderRight: "1px solid #e2e8f0",
                            }}
                          >
                            Cot. GI
                          </th>
                          <th
                            style={{
                              textAlign: "center",
                              width: "90px",
                              padding: "8px 12px",
                              fontWeight: 600,
                              color: "#475569",
                              borderRight: "1px solid #e2e8f0",
                            }}
                          >
                            Cantidad
                          </th>
                          <th
                            style={{
                              textAlign: "center",
                              width: "90px",
                              padding: "8px 12px",
                              fontWeight: 600,
                              color: "#475569",
                              borderRight: "1px solid #e2e8f0",
                            }}
                          >
                            Unidad
                          </th>
                          <th
                            style={{
                              textAlign: "right",
                              padding: "8px 12px",
                              fontWeight: 600,
                              color: "#475569",
                              borderRight: "1px solid #e2e8f0",
                            }}
                          >
                            Precio unit s/IVA
                          </th>
                          <th
                            style={{
                              textAlign: "right",
                              padding: "8px 12px",
                              fontWeight: 600,
                              color: "#475569",
                              borderRight: "1px solid #e2e8f0",
                            }}
                          >
                            Impuesto (16%)
                          </th>
                          <th
                            style={{
                              textAlign: "right",
                              padding: "8px 12px",
                              fontWeight: 600,
                              color: "#475569",
                            }}
                          >
                            Total s/IVA
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {lineas.length === 0 ? (
                          <tr>
                            <td
                              colSpan={7}
                              style={{
                                textAlign: "center",
                                padding: "16px",
                                color: "#94a3b8",
                              }}
                            >
                              Sin líneas de servicio registradas.
                            </td>
                          </tr>
                        ) : (
                          lineas.map((linea, idx) => {
                            const cantidadFormateada = (Number(linea.i_Cantidad) || 0).toFixed(2);
                            const servicioNombre = (linea.v_Servicio || "SERVICIO").toUpperCase();

                            return (
                              <tr
                                key={`linea-${idx}`}
                                style={{
                                  borderBottom: "1px solid #e2e8f0",
                                  backgroundColor: "#ffffff",
                                }}
                              >
                                <td
                                  style={{
                                    padding: "8px 12px",
                                    fontWeight: 700,
                                    color: "#334155",
                                    borderRight: "1px solid #e2e8f0",
                                  }}
                                >
                                  {servicioNombre}
                                  {linea.v_Cliente && (
                                    <div
                                      style={{
                                        fontSize: "10px",
                                        color: "#64748b",
                                        fontWeight: 400,
                                      }}
                                    >
                                      Cliente: {linea.v_Cliente}
                                    </div>
                                  )}
                                </td>
                                <td
                                  style={{
                                    padding: "8px 12px",
                                    textAlign: "center",
                                    color: "#334155",
                                    fontWeight: 500,
                                    borderRight: "1px solid #e2e8f0",
                                  }}
                                >
                                  {linea.v_NoCotizacionGI || "—"}
                                </td>
                                <td
                                  style={{
                                    padding: "8px 12px",
                                    textAlign: "center",
                                    color: "#475569",
                                    borderRight: "1px solid #e2e8f0",
                                  }}
                                >
                                  {cantidadFormateada}
                                </td>
                                <td
                                  style={{
                                    padding: "8px 12px",
                                    textAlign: "center",
                                    color: "#475569",
                                    borderRight: "1px solid #e2e8f0",
                                  }}
                                >
                                  {linea.v_Unidad || "horas"}
                                </td>
                                <td
                                  style={{
                                    padding: "8px 12px",
                                    textAlign: "right",
                                    color: "#475569",
                                    borderRight: "1px solid #e2e8f0",
                                  }}
                                >
                                  {formatearMonto(linea.d_PrecioUnitario)}
                                </td>
                                <td
                                  style={{
                                    padding: "8px 12px",
                                    textAlign: "right",
                                    color: "#475569",
                                    borderRight: "1px solid #e2e8f0",
                                  }}
                                >
                                  {formatearMonto(linea.d_IVA)}
                                </td>
                                <td
                                  style={{
                                    padding: "8px 12px",
                                    textAlign: "right",
                                    fontWeight: 700,
                                    color: "#334155",
                                  }}
                                >
                                  {formatearMonto(linea.d_Subtotal)}
                                </td>
                              </tr>
                            );
                          })
                        )}

                        {/* Fila Subtotal */}
                        <tr style={{ borderBottom: "1px solid #e2e8f0", backgroundColor: "#ffffff" }}>
                          <td style={{ padding: "8px 12px", borderRight: "1px solid #e2e8f0" }}></td>
                          <td style={{ padding: "8px 12px", borderRight: "1px solid #e2e8f0" }}></td>
                          <td style={{ padding: "8px 12px", borderRight: "1px solid #e2e8f0" }}></td>
                          <td style={{ padding: "8px 12px", borderRight: "1px solid #e2e8f0" }}></td>
                          <td style={{ padding: "8px 12px", borderRight: "1px solid #e2e8f0" }}></td>
                          <td
                            style={{
                              padding: "8px 12px",
                              textAlign: "right",
                              fontWeight: 700,
                              color: "#334155",
                              borderRight: "1px solid #e2e8f0",
                            }}
                          >
                            Subtotal
                          </td>
                          <td
                            style={{
                              padding: "8px 12px",
                              textAlign: "right",
                              fontWeight: 700,
                              color: "#334155",
                            }}
                          >
                            {formatearMonto(subtotalTabla)}
                          </td>
                        </tr>

                        {/* Fila Descuento ({x}%) */}
                        {porcentajeDesc > 0 && (
                          <tr style={{ borderBottom: "1px solid #e2e8f0", backgroundColor: "#ffffff" }}>
                            <td style={{ padding: "8px 12px", borderRight: "1px solid #e2e8f0" }}></td>
                            <td style={{ padding: "8px 12px", borderRight: "1px solid #e2e8f0" }}></td>
                            <td style={{ padding: "8px 12px", borderRight: "1px solid #e2e8f0" }}></td>
                            <td style={{ padding: "8px 12px", borderRight: "1px solid #e2e8f0" }}></td>
                            <td style={{ padding: "8px 12px", borderRight: "1px solid #e2e8f0" }}></td>
                            <td
                              style={{
                                padding: "8px 12px",
                                textAlign: "right",
                                fontWeight: 600,
                                color: "#dc2626",
                                borderRight: "1px solid #e2e8f0",
                              }}
                            >
                              Descuento ({porcentajeDesc}%)
                            </td>
                            <td
                              style={{
                                padding: "8px 12px",
                                textAlign: "right",
                                fontWeight: 600,
                                color: "#dc2626",
                              }}
                            >
                              −{formatearMonto(montoDescuento)}
                            </td>
                          </tr>
                        )}

                        {/* Fila Subtotal con descuento */}
                        {porcentajeDesc > 0 && (
                          <tr style={{ borderBottom: "1px solid #e2e8f0", backgroundColor: "#ffffff" }}>
                            <td style={{ padding: "8px 12px", borderRight: "1px solid #e2e8f0" }}></td>
                            <td style={{ padding: "8px 12px", borderRight: "1px solid #e2e8f0" }}></td>
                            <td style={{ padding: "8px 12px", borderRight: "1px solid #e2e8f0" }}></td>
                            <td style={{ padding: "8px 12px", borderRight: "1px solid #e2e8f0" }}></td>
                            <td style={{ padding: "8px 12px", borderRight: "1px solid #e2e8f0" }}></td>
                            <td
                              style={{
                                padding: "8px 12px",
                                textAlign: "right",
                                fontWeight: 700,
                                color: "#334155",
                                borderRight: "1px solid #e2e8f0",
                              }}
                            >
                              Subtotal con descuento
                            </td>
                            <td
                              style={{
                                padding: "8px 12px",
                                textAlign: "right",
                                fontWeight: 700,
                                color: "#334155",
                              }}
                            >
                              {formatearMonto(subtotalConDescuento)}
                            </td>
                          </tr>
                        )}

                        {/* Fila IVA (16%) */}
                        <tr style={{ borderBottom: "1px solid #e2e8f0", backgroundColor: "#ffffff" }}>
                          <td style={{ padding: "8px 12px", borderRight: "1px solid #e2e8f0" }}></td>
                          <td style={{ padding: "8px 12px", borderRight: "1px solid #e2e8f0" }}></td>
                          <td style={{ padding: "8px 12px", borderRight: "1px solid #e2e8f0" }}></td>
                          <td style={{ padding: "8px 12px", borderRight: "1px solid #e2e8f0" }}></td>
                          <td style={{ padding: "8px 12px", borderRight: "1px solid #e2e8f0" }}></td>
                          <td
                            style={{
                              padding: "8px 12px",
                              textAlign: "right",
                              fontWeight: 600,
                              color: "#475569",
                              borderRight: "1px solid #e2e8f0",
                            }}
                          >
                            IVA (16%)
                          </td>
                          <td
                            style={{
                              padding: "8px 12px",
                              textAlign: "right",
                              fontWeight: 600,
                              color: "#334155",
                            }}
                          >
                            {formatearMonto(ivaCalculado)}
                          </td>
                        </tr>

                        {/* Fila Total */}
                        <tr style={{ backgroundColor: "#ffffff" }}>
                          <td style={{ padding: "9px 12px", borderRight: "1px solid #e2e8f0" }}></td>
                          <td style={{ padding: "9px 12px", borderRight: "1px solid #e2e8f0" }}></td>
                          <td style={{ padding: "9px 12px", borderRight: "1px solid #e2e8f0" }}></td>
                          <td style={{ padding: "9px 12px", borderRight: "1px solid #e2e8f0" }}></td>
                          <td style={{ padding: "9px 12px", borderRight: "1px solid #e2e8f0" }}></td>
                          <td
                            style={{
                              padding: "9px 12px",
                              textAlign: "right",
                              fontWeight: 800,
                              fontSize: "13px",
                              color: "#0f172a",
                              borderRight: "1px solid #e2e8f0",
                            }}
                          >
                            Total
                          </td>
                          <td
                            style={{
                              padding: "9px 12px",
                              textAlign: "right",
                              fontWeight: 800,
                              fontSize: "15px",
                              color: "#0f172a",
                            }}
                          >
                            {formatearMonto(gastoLocal.d_Monto)}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* 2. Historial de pagos (abonos) */}
                <div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: "8px",
                      marginTop: "4px",
                    }}
                  >
                    <h4
                      style={{
                        fontSize: "13px",
                        fontWeight: 700,
                        color: "#0f172a",
                        margin: 0,
                      }}
                    >
                      Historial de pagos (abonos)
                    </h4>

                    {/* Botón "+" circular */}
                    {saldoPendienteReal > 0 && !gastoLocal.b_Cancelada && (
                      <button
                        type="button"
                        onClick={handleToggleFilaAgregar}
                        title="Agregar pago programado"
                        style={{
                          width: "22px",
                          height: "22px",
                          borderRadius: "50%",
                          border: "1px solid #2B8FCC",
                          backgroundColor: mostrandoFilaAgregar ? "#f0f9ff" : "#ffffff",
                          color: "#2B8FCC",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          cursor: "pointer",
                          padding: 0,
                          transition: "background-color 0.2s, transform 0.1s",
                        }}
                      >
                        <Plus size={14} />
                      </button>
                    )}
                  </div>

                  {/* Tabla de Abonos */}
                  {abonos.length === 0 && !mostrandoFilaAgregar ? (
                    <p
                      style={{
                        fontSize: "12px",
                        color: "#64748b",
                        fontStyle: "italic",
                        margin: "4px 0",
                      }}
                    >
                      Este gasto todavía no tiene pagos programados.
                    </p>
                  ) : (
                    <div
                      style={{
                        border: "1px solid #e2e8f0",
                        borderRadius: "8px",
                        overflow: "hidden",
                        backgroundColor: "#ffffff",
                      }}
                    >
                      <table
                        style={{
                          width: "100%",
                          borderCollapse: "collapse",
                          fontSize: "12px",
                        }}
                      >
                        <thead>
                          <tr
                            style={{
                              borderBottom: "1px solid #e2e8f0",
                              backgroundColor: "#f8fafc",
                            }}
                          >
                            <th
                              style={{
                                textAlign: "left",
                                padding: "8px 12px",
                                fontWeight: 600,
                                color: "#475569",
                              }}
                            >
                              Fecha programada
                            </th>
                            <th
                              style={{
                                textAlign: "left",
                                padding: "8px 12px",
                                fontWeight: 600,
                                color: "#475569",
                              }}
                            >
                              Fecha en que se pagó
                            </th>
                            <th
                              style={{
                                textAlign: "center",
                                padding: "8px 12px",
                                fontWeight: 600,
                                color: "#475569",
                              }}
                            >
                              Días de retraso
                            </th>
                            <th
                              style={{
                                textAlign: "right",
                                padding: "8px 12px",
                                fontWeight: 600,
                                color: "#475569",
                              }}
                            >
                              Cantidad
                            </th>
                            <th
                              style={{
                                textAlign: "center",
                                width: "90px",
                                padding: "8px 12px",
                                fontWeight: 600,
                                color: "#475569",
                              }}
                            >
                              Acciones
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {abonos.map((abono, idx) => {
                            const esCancelado = abono.i_Estado === 2;
                            const esPagado = abono.i_Estado === 1;
                            const esPendiente = abono.i_Estado === 0;

                            const fechaProgramada = abono.d_FechaProgramada;
                            const fechaPagoRealAbono = abono.d_FechaAbono;
                            const montoAbono = abono.d_Monto || 0;

                            const infoRetraso = calcularDiasRetraso(
                              fechaProgramada,
                              fechaPagoRealAbono,
                              abono.i_Estado
                            );

                            return (
                              <tr
                                key={abono.i_CveAbonoProv || idx}
                                style={{
                                  borderBottom:
                                    idx === abonos.length - 1 && !mostrandoFilaAgregar
                                      ? "none"
                                      : "1px solid #e2e8f0",
                                }}
                              >
                                <td style={{ padding: "8px 12px", color: "#334155" }}>
                                  {fechaProgramada ? formatearFechaTexto(fechaProgramada) : "—"}
                                </td>
                                <td style={{ padding: "8px 12px" }}>
                                  {esCancelado ? (
                                    <div style={{ display: "flex", flexDirection: "column" }}>
                                      <span style={{ color: "#dc2626", fontWeight: 700 }}>
                                        Cancelado
                                      </span>
                                      {abono.v_MotivoCancelacion && (
                                        <span style={{ fontSize: "10px", color: "#64748b" }}>
                                          {abono.v_MotivoCancelacion}
                                        </span>
                                      )}
                                    </div>
                                  ) : esPagado ? (
                                    <div style={{ display: "flex", flexDirection: "column" }}>
                                      <span style={{ color: "#16a34a", fontWeight: 700 }}>
                                        {fechaPagoRealAbono
                                          ? formatearFechaTexto(fechaPagoRealAbono)
                                          : "Pagado"}
                                      </span>
                                      {abono.v_Referencia && (
                                        <span style={{ fontSize: "10px", color: "#64748b" }}>
                                          Ref: {abono.v_Referencia}
                                        </span>
                                      )}
                                    </div>
                                  ) : (
                                    <span style={{ color: "#dc2626", fontWeight: 700 }}>
                                      Pendiente
                                    </span>
                                  )}
                                </td>
                                <td style={{ padding: "8px 12px", textAlign: "center" }}>
                                  {infoRetraso ? (
                                    infoRetraso.esVencido ? (
                                      <span
                                        style={{
                                          display: "inline-block",
                                          padding: "2px 10px",
                                          borderRadius: "12px",
                                          backgroundColor: "#fef2f2",
                                          color: "#dc2626",
                                          fontWeight: 600,
                                          fontSize: "11px",
                                          border: "1px solid #fecaca",
                                        }}
                                      >
                                        {infoRetraso.texto}
                                      </span>
                                    ) : (
                                      <span
                                        style={{
                                          display: "inline-block",
                                          padding: "2px 10px",
                                          borderRadius: "12px",
                                          backgroundColor: "#f0fdf4",
                                          color: "#16a34a",
                                          fontWeight: 600,
                                          fontSize: "11px",
                                          border: "1px solid #bbf7d0",
                                        }}
                                      >
                                        {infoRetraso.texto}
                                      </span>
                                    )
                                  ) : (
                                    <span style={{ color: "#94a3b8" }}>—</span>
                                  )}
                                </td>
                                <td
                                  style={{
                                    padding: "8px 12px",
                                    textAlign: "right",
                                    fontWeight: 700,
                                    color: "#0f172a",
                                  }}
                                >
                                  {formatearMonto(montoAbono)}
                                </td>
                                <td style={{ padding: "8px 12px", textAlign: "center" }}>
                                  <div
                                    style={{
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      gap: "6px",
                                    }}
                                  >
                                    <button
                                      type="button"
                                      disabled={!esPendiente}
                                      onClick={() => handleAbrirMarcarPagado(abono)}
                                      title={
                                        esPendiente
                                          ? "Marcar como pagado"
                                          : "Este pago ya no se puede marcar como pagado"
                                      }
                                      style={{
                                        color: esPendiente ? "#16a34a" : "#cbd5e1",
                                        cursor: esPendiente ? "pointer" : "not-allowed",
                                        background: "transparent",
                                        border: "none",
                                        padding: "2px",
                                        display: "flex",
                                        alignItems: "center",
                                      }}
                                    >
                                      <CheckCircle size={16} />
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => handleAbrirCancelarPago(abono)}
                                      title="Cancelar pago"
                                      style={{
                                        color: "#dc2626",
                                        cursor: "pointer",
                                        background: "transparent",
                                        border: "none",
                                        padding: "2px",
                                        display: "flex",
                                        alignItems: "center",
                                      }}
                                    >
                                      <Ban size={16} />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}

                          {/* Fila Editable Inline para agregar nuevo pago */}
                          {mostrandoFilaAgregar &&
                            saldoPendienteReal > 0 &&
                            !gastoLocal.b_Cancelada && (
                              <tr style={{ backgroundColor: "#f0f9ff", borderBottom: "1px solid #e2e8f0" }}>
                                <td style={{ padding: "8px 12px" }}>
                                  <input
                                    type="date"
                                    value={fechaAbonoProgramadaDraft}
                                    onChange={(e) =>
                                      setFechaAbonoProgramadaDraft(e.target.value)
                                    }
                                    style={{
                                      width: "140px",
                                      padding: "5px 8px",
                                      fontSize: "12px",
                                      border: "1px solid #cbd5e1",
                                      borderRadius: "6px",
                                      backgroundColor: "#ffffff",
                                      color: "#334155",
                                      outline: "none",
                                      fontFamily: "inherit",
                                    }}
                                  />
                                </td>
                                <td style={{ padding: "8px 12px" }}>
                                  <span style={{ color: "#dc2626", fontWeight: 700, fontSize: "12px" }}>
                                    Pendiente
                                  </span>
                                </td>
                                <td
                                  style={{
                                    padding: "8px 12px",
                                    textAlign: "center",
                                    color: "#64748b",
                                  }}
                                >
                                  —
                                </td>
                                <td style={{ padding: "8px 12px", textAlign: "right" }}>
                                  <div
                                    style={{
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "flex-end",
                                      gap: "4px",
                                    }}
                                  >
                                    <span
                                      style={{
                                        fontSize: "12px",
                                        fontWeight: 600,
                                        color: "#64748b",
                                      }}
                                    >
                                      $
                                    </span>
                                    <input
                                      type="number"
                                      step="0.01"
                                      min="0.01"
                                      placeholder="0.00"
                                      value={montoAbonoProgramadoDraft}
                                      onChange={(e) =>
                                        setMontoAbonoProgramadoDraft(e.target.value)
                                      }
                                      style={{
                                        width: "110px",
                                        padding: "5px 8px",
                                        fontSize: "12px",
                                        textAlign: "right",
                                        border: "1px solid #cbd5e1",
                                        borderRadius: "6px",
                                        backgroundColor: "#ffffff",
                                        color: "#0f172a",
                                        fontWeight: 600,
                                        outline: "none",
                                      }}
                                    />
                                  </div>
                                </td>
                                <td style={{ padding: "8px 12px", textAlign: "center" }}>
                                  <div
                                    style={{
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      gap: "10px",
                                    }}
                                  >
                                    <button
                                      type="button"
                                      disabled={guardandoFilaAgregar}
                                      onClick={handleGuardarNuevoAbonoProgramado}
                                      title="Guardar pago programado"
                                      style={{
                                        color: "#16a34a",
                                        background: "transparent",
                                        border: "none",
                                        cursor: guardandoFilaAgregar
                                          ? "not-allowed"
                                          : "pointer",
                                        padding: 0,
                                        display: "flex",
                                        alignItems: "center",
                                      }}
                                    >
                                      <Check size={18} />
                                    </button>

                                    <button
                                      type="button"
                                      disabled={guardandoFilaAgregar}
                                      onClick={() => setMostrandoFilaAgregar(false)}
                                      title="Cancelar"
                                      style={{
                                        color: "#dc2626",
                                        background: "transparent",
                                        border: "none",
                                        cursor: guardandoFilaAgregar
                                          ? "not-allowed"
                                          : "pointer",
                                        padding: 0,
                                        display: "flex",
                                        alignItems: "center",
                                      }}
                                    >
                                      <X size={18} />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            )}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {errorFilaAgregar && (
                    <div
                      style={{
                        padding: "6px 10px",
                        marginTop: "6px",
                        backgroundColor: "#fef2f2",
                        border: "1px solid #fecaca",
                        color: "#dc2626",
                        borderRadius: "6px",
                        fontSize: "11px",
                      }}
                    >
                      {errorFilaAgregar}
                    </div>
                  )}

                  {/* Resumen "Cantidad pendiente de pagar:" */}
                  {saldoPendienteReal > 0 ? (
                    <div
                      style={{
                        backgroundColor: "#fef2f2",
                        border: "1px solid #fecaca",
                        borderRadius: "8px",
                        padding: "10px 14px",
                        marginTop: "12px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}
                    >
                      <span
                        style={{
                          fontSize: "13px",
                          fontWeight: 700,
                          color: "#dc2626",
                        }}
                      >
                        Cantidad pendiente de pagar:
                      </span>
                      <span
                        style={{
                          fontSize: "15px",
                          fontWeight: 800,
                          color: "#dc2626",
                        }}
                      >
                        {formatearMonto(saldoPendienteReal)}
                      </span>
                    </div>
                  ) : (
                    <div
                      style={{
                        backgroundColor: "#f0fdf4",
                        border: "1px solid #bbf7d0",
                        borderRadius: "8px",
                        padding: "10px 14px",
                        marginTop: "12px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}
                    >
                      <span
                        style={{
                          fontSize: "13px",
                          fontWeight: 700,
                          color: "#166534",
                        }}
                      >
                        Gasto totalmente saldado
                      </span>
                      <span
                        style={{
                          fontSize: "14px",
                          fontWeight: 800,
                          color: "#16a34a",
                        }}
                      >
                        $0.00
                      </span>
                    </div>
                  )}

                  {hayDescuadre && (
                    <div
                      style={{
                        padding: "8px 12px",
                        backgroundColor: "#fefce8",
                        border: "1px solid #fde047",
                        borderRadius: "6px",
                        color: "#ca8a04",
                        fontSize: "11px",
                        marginTop: "8px",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                      }}
                    >
                      <AlertTriangle size={14} />
                      <span>
                        La suma de los abonos ({formatearMonto(sumaActivos)}) no coincide
                        con el total del gasto ({formatearMonto(montoGasto)}).
                      </span>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Footer / Botón Cerrar */}
          <div
            className="modal-footer"
            style={{
              padding: "12px 20px",
              borderTop: "1px solid #e2e8f0",
              display: "flex",
              justifyContent: "flex-end",
              backgroundColor: "#ffffff",
            }}
          >
            <button
              type="button"
              onClick={onCerrar}
              style={{
                borderRadius: "6px",
                fontSize: "13px",
                fontWeight: 500,
                padding: "6px 18px",
                backgroundColor: "#ffffff",
                border: "1px solid #cbd5e1",
                color: "#475569",
                cursor: "pointer",
              }}
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>

      {/* Sub-modal: Marcar abono como pagado */}
      {subModalPagadoAbierto && (
        <div
          className="modal-overlay"
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(15, 23, 42, 0.6)",
            backdropFilter: "blur(6px)",
            WebkitBackdropFilter: "blur(6px)",
            zIndex: 1100,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px",
          }}
        >
          <div className="modal-content" style={{ maxWidth: "420px", width: "90%", borderRadius: "10px", backgroundColor: "#ffffff" }}>
            <div className="modal-header" style={{ padding: "14px 18px", borderBottom: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <h4 className="modal-title" style={{ fontSize: "15px", fontWeight: 700, color: "#1e3a5f", margin: 0 }}>
                Marcar pago como realizado
              </h4>
              <button
                type="button"
                className="btn-close"
                onClick={() => setSubModalPagadoAbierto(false)}
                style={{ background: "transparent", border: "none", cursor: "pointer", color: "#64748b" }}
              >
                <X size={18} />
              </button>
            </div>

            <div className="modal-body" style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: "12px" }}>
              <div>
                <label style={{ fontSize: "11px", fontWeight: 600, color: "#475569", marginBottom: "4px", display: "block" }}>
                  Fecha en que se pagó <span style={{ color: "#dc2626" }}>*</span>
                </label>
                <input
                  type="date"
                  className="form-control form-control-sm"
                  style={{ borderRadius: "6px", height: "34px", fontSize: "12px", width: "100%", border: "1px solid #cbd5e1", padding: "0 8px" }}
                  value={fechaPagoReal}
                  onChange={(e) => setFechaPagoReal(e.target.value)}
                />
              </div>

              <div>
                <label style={{ fontSize: "11px", fontWeight: 600, color: "#475569", marginBottom: "4px", display: "block" }}>
                  Referencia / Notas (opcional)
                </label>
                <input
                  type="text"
                  className="form-control form-control-sm"
                  style={{ borderRadius: "6px", height: "34px", fontSize: "12px", width: "100%", border: "1px solid #cbd5e1", padding: "0 8px" }}
                  placeholder="No. de transferencia, folio..."
                  value={notasPago}
                  onChange={(e) => setNotasPago(e.target.value)}
                />
              </div>

              {errorSubModalPagado && (
                <div style={{ color: "#dc2626", fontSize: "11px" }}>{errorSubModalPagado}</div>
              )}
            </div>

            <div className="modal-footer" style={{ padding: "12px 20px", borderTop: "1px solid #e2e8f0", display: "flex", justifyContent: "flex-end", gap: "8px" }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setSubModalPagadoAbierto(false)}
                disabled={guardandoAccion}
                style={{ borderRadius: "6px", fontSize: "12px", padding: "6px 14px", border: "1px solid #cbd5e1", backgroundColor: "#ffffff", color: "#475569" }}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn btn-success"
                onClick={handleConfirmarMarcarPagado}
                disabled={guardandoAccion}
                style={{ borderRadius: "6px", fontSize: "12px", padding: "6px 14px", border: "none", backgroundColor: "#16a34a", color: "#ffffff", fontWeight: 600 }}
              >
                {guardandoAccion ? "Guardando..." : "Confirmar pago"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sub-modal: Cancelar abono */}
      {subModalCancelarAbierto && (
        <div
          className="modal-overlay"
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(15, 23, 42, 0.6)",
            backdropFilter: "blur(6px)",
            WebkitBackdropFilter: "blur(6px)",
            zIndex: 1100,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px",
          }}
        >
          <div className="modal-content" style={{ maxWidth: "420px", width: "90%", borderRadius: "10px", backgroundColor: "#ffffff" }}>
            <div className="modal-header" style={{ padding: "14px 18px", borderBottom: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <h4 className="modal-title" style={{ fontSize: "15px", fontWeight: 700, color: "#dc2626", margin: 0 }}>
                Cancelar abono
              </h4>
              <button
                type="button"
                className="btn-close"
                onClick={() => setSubModalCancelarAbierto(false)}
                style={{ background: "transparent", border: "none", cursor: "pointer", color: "#64748b" }}
              >
                <X size={18} />
              </button>
            </div>

            <div className="modal-body" style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: "12px" }}>
              <div>
                <label style={{ fontSize: "11px", fontWeight: 600, color: "#475569", marginBottom: "4px", display: "block" }}>
                  Motivo de cancelación <span style={{ color: "#dc2626" }}>*</span>
                </label>
                <textarea
                  className="form-control form-control-sm"
                  rows={3}
                  style={{ borderRadius: "6px", fontSize: "12px", resize: "none", width: "100%", border: "1px solid #cbd5e1", padding: "6px 8px" }}
                  placeholder="Ingresa la razón de cancelación..."
                  value={motivoCancelacionAbono}
                  onChange={(e) => setMotivoCancelacionAbono(e.target.value)}
                />
              </div>

              {errorSubModalCancelar && (
                <div style={{ color: "#dc2626", fontSize: "11px" }}>{errorSubModalCancelar}</div>
              )}
            </div>

            <div className="modal-footer" style={{ padding: "12px 20px", borderTop: "1px solid #e2e8f0", display: "flex", justifyContent: "flex-end", gap: "8px" }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setSubModalCancelarAbierto(false)}
                disabled={guardandoAccion}
                style={{ borderRadius: "6px", fontSize: "12px", padding: "6px 14px", border: "1px solid #cbd5e1", backgroundColor: "#ffffff", color: "#475569" }}
              >
                Volver
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={handleConfirmarCancelarPago}
                disabled={guardandoAccion}
                style={{ borderRadius: "6px", fontSize: "12px", padding: "6px 14px", border: "none", backgroundColor: "#dc2626", color: "#ffffff", fontWeight: 600 }}
              >
                {guardandoAccion ? "Guardando..." : "Confirmar cancelación"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
