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
  ChevronRight,
  ChevronDown,
  Folder,
} from "lucide-react";
import {
  FacturaGetDto,
  AbonoFacturaDto,
  LineaServicioFacturaDto,
} from "@/types/facturas";
import { FacturasService } from "@/services/facturas.service";
import { formatearFechaTexto } from "@/lib/date-utils";
import { useToast } from "@/context/ToastContext";

interface Props {
  abierto: boolean;
  factura: FacturaGetDto | null;
  onCerrar: () => void;
  onCambio?: () => void;
}

interface GrupoLineaFactura {
  key: string;
  esProyecto: boolean;
  nombreProyecto?: string;
  montoProyecto: number;
  lineas: LineaServicioFacturaDto[];
}

export const ModalFacturaDetalle: React.FC<Props> = ({
  abierto,
  factura,
  onCerrar,
  onCambio,
}) => {
  const { toast } = useToast();
  const hoyStr = new Date().toISOString().split("T")[0];

  // Estados de datos
  const [cargando, setCargando] = useState<boolean>(true);
  const [lineas, setLineas] = useState<LineaServicioFacturaDto[]>([]);
  const [abonos, setAbonos] = useState<AbonoFacturaDto[]>([]);

  // Estado para expandir/colapsar carpetas de proyecto
  const [proyectosExpandidos, setProyectosExpandidos] = useState<Record<string, boolean>>({});

  const toggleProyecto = (key: string) => {
    setProyectosExpandidos((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // Estados para Sub-modales
  const [subModalPagadoAbierto, setSubModalPagadoAbierto] = useState<boolean>(false);
  const [subModalCancelarAbierto, setSubModalCancelarAbierto] = useState<boolean>(false);

  // Abono seleccionado para acciones
  const [abonoSeleccionado, setAbonoSeleccionado] = useState<AbonoFacturaDto | null>(null);

  // Campos de Sub-modal 1: Marcar como pagado
  const [fechaPagoReal, setFechaPagoReal] = useState<string>(hoyStr);
  const [notasPago, setNotasPago] = useState<string>("");
  const [errorSubModalPagado, setErrorSubModalPagado] = useState<string | null>(null);

  // Campos de Sub-modal 2: Cancelar pago
  const [motivoCancelacionAbono, setMotivoCancelacionAbono] = useState<string>("");
  const [errorSubModalCancelar, setErrorSubModalCancelar] = useState<string | null>(null);

  // Estado para Fila Editable: Agregar pago programado
  const [mostrandoFilaAgregar, setMostrandoFilaAgregar] = useState<boolean>(false);
  const [fechaAbonoProgramadaDraft, setFechaAbonoProgramadaDraft] = useState<string>(hoyStr);
  const [montoAbonoProgramadoDraft, setMontoAbonoProgramadoDraft] = useState<string>("");
  const [errorFilaAgregar, setErrorFilaAgregar] = useState<string | null>(null);
  const [guardandoFilaAgregar, setGuardandoFilaAgregar] = useState<boolean>(false);

  // Estado guardando acción en sub-modales
  const [guardandoAccion, setGuardandoAccion] = useState<boolean>(false);

  // Cargar detalle y abonos al abrir o cambiar factura
  const cargarDatosDetalle = useCallback(async (idFactura: number) => {
    setCargando(true);
    const [resDetalle, resAbonos] = await Promise.all([
      FacturasService.getFacturaDetalle(idFactura),
      FacturasService.getAbonosPorFactura(idFactura),
    ]);

    // Usar directamente la respuesta como array plano de líneas de servicio sin fallback inventado
    setLineas(Array.isArray(resDetalle) ? resDetalle : []);
    setAbonos(Array.isArray(resAbonos) ? resAbonos : []);
    setCargando(false);
  }, []);

  useEffect(() => {
    if (abierto && factura) {
      cargarDatosDetalle(factura.i_CveFacturas);
      setMostrandoFilaAgregar(false);
    }
  }, [abierto, factura, cargarDatosDetalle]);

  // Agrupamiento de líneas por Proyecto vs Líneas Normales
  const gruposLineas = useMemo(() => {
    const mapGrupos = new Map<string, GrupoLineaFactura>();
    const resultado: GrupoLineaFactura[] = [];

    lineas.forEach((linea, index) => {
      const esProyecto = (linea.v_TipoVenta || "").trim().toLowerCase() === "proyecto";
      if (esProyecto) {
        const key = `proj-${linea.i_CveAgenda ?? linea.v_NombreProyecto ?? index}`;
        if (!mapGrupos.has(key)) {
          const nuevoGrupo: GrupoLineaFactura = {
            key,
            esProyecto: true,
            nombreProyecto: linea.v_NombreProyecto || linea.v_Servicio || "PROYECTO",
            montoProyecto: linea.d_MontoProyecto || (linea.i_Cantidad * linea.d_PrecioUnitario) || 0,
            lineas: [linea],
          };
          mapGrupos.set(key, nuevoGrupo);
          resultado.push(nuevoGrupo);
        } else {
          mapGrupos.get(key)!.lineas.push(linea);
        }
      } else {
        resultado.push({
          key: `normal-${linea.i_CveFacturaDetalle ?? index}`,
          esProyecto: false,
          montoProyecto: 0,
          lineas: [linea],
        });
      }
    });

    return resultado;
  }, [lineas]);

  // Cálculos de Totales considerando d_MontoProyecto para carpetas y d_Subtotal para líneas normales
  const { subtotalTabla, ivaTabla, totalTabla } = useMemo(() => {
    let subtotal = 0;
    let iva = 0;

    gruposLineas.forEach((grupo) => {
      if (grupo.esProyecto) {
        const montoProj = grupo.montoProyecto || 0;
        const ivaProj = montoProj * 0.16;
        subtotal += montoProj;
        iva += ivaProj;
      } else {
        const linea = grupo.lineas[0];
        if (linea) {
          const sub = linea.d_Subtotal || (linea.i_Cantidad * linea.d_PrecioUnitario) || 0;
          const ivaLinea = linea.d_IVA && linea.d_IVA > 0 ? linea.d_IVA : sub * 0.16;
          subtotal += sub;
          iva += ivaLinea;
        }
      }
    });

    return {
      subtotalTabla: subtotal,
      ivaTabla: iva,
      totalTabla: subtotal + iva,
    };
  }, [gruposLineas]);

  // Porcentaje sobre venta total
  const montoFactura = factura?.d_Monto || 0;
  const porcentajeCobro = totalTabla > 0 && factura ? (montoFactura / totalTabla) * 100 : 100;

  // Cálculos de Abonos derivados strictly de i_Estado
  const abonosPagados = abonos.filter((a) => a.i_Estado === 1);
  const abonosActivos = abonos.filter((a) => a.i_Estado !== 2);

  const sumaPagados = abonosPagados.reduce((acc, a) => acc + (a.d_Monto || 0), 0);
  const sumaActivos = abonosActivos.reduce((acc, a) => acc + (a.d_Monto || 0), 0);

  const pendientePagar = montoFactura - sumaPagados;
  const hayDescuadre = factura ? Math.abs(sumaActivos - montoFactura) > 0.01 : false;

  // --- Handlers para Sub-modales y Fila Editable ---

  // Abrir Sub-modal Marcar como pagado
  const handleAbrirMarcarPagado = (abono: AbonoFacturaDto) => {
    setAbonoSeleccionado(abono);
    setFechaPagoReal(hoyStr);
    setNotasPago("");
    setErrorSubModalPagado(null);
    setSubModalPagadoAbierto(true);
  };

  // Abrir Sub-modal Cancelar pago
  const handleAbrirCancelarPago = (abono: AbonoFacturaDto) => {
    setAbonoSeleccionado(abono);
    setMotivoCancelacionAbono("");
    setErrorSubModalCancelar(null);
    setSubModalCancelarAbierto(true);
  };

  // Toggle Fila Editable Agregar pago programado
  const handleToggleFilaAgregar = () => {
    if (mostrandoFilaAgregar) {
      setMostrandoFilaAgregar(false);
      setErrorFilaAgregar(null);
    } else {
      if (pendientePagar <= 0) {
        toast.info("La factura ya está saldada. Si hubo un error en un pago, cancélalo primero para liberar el saldo y registrar el correcto.");
        return;
      }
      setFechaAbonoProgramadaDraft(hoyStr);
      setMontoAbonoProgramadoDraft(pendientePagar.toString());
      setErrorFilaAgregar(null);
      setMostrandoFilaAgregar(true);
    }
  };

  // Ejecutar Marcar como pagado
  const handleConfirmarMarcarPagado = async () => {
    if (!factura || !abonoSeleccionado) return;
    if (!fechaPagoReal) {
      setErrorSubModalPagado("Por favor selecciona la fecha en que se pagó.");
      return;
    }

    setGuardandoAccion(true);
    setErrorSubModalPagado(null);

    const cveAbonoVal =
      abonoSeleccionado.i_CveAbono ??
      (abonoSeleccionado as any).i_CveFacturaAbonos ??
      (abonoSeleccionado as any).i_CveAbonos ??
      (abonoSeleccionado as any).i_CveServAgendaAbono ??
      (abonoSeleccionado as any).id ??
      0;

    const res = await FacturasService.marcarAbonoPagado(
      cveAbonoVal,
      fechaPagoReal,
      notasPago
    );
    setGuardandoAccion(false);

    if (res.exito) {
      toast.success("Pago marcado como recibido correctamente.");
      setSubModalPagadoAbierto(false);
      cargarDatosDetalle(factura.i_CveFacturas);
      if (onCambio) onCambio();
    } else {
      setErrorSubModalPagado(res.mensaje || "Error al marcar el pago como recibido.");
    }
  };

  // Ejecutar Cancelar pago
  const handleConfirmarCancelarPago = async () => {
    if (!factura || !abonoSeleccionado) return;
    if (!motivoCancelacionAbono.trim()) {
      setErrorSubModalCancelar("Por favor ingresa el motivo de cancelación.");
      return;
    }

    setGuardandoAccion(true);
    setErrorSubModalCancelar(null);

    const cveAbonoVal =
      abonoSeleccionado.i_CveAbono ??
      (abonoSeleccionado as any).i_CveFacturaAbonos ??
      (abonoSeleccionado as any).i_CveAbonos ??
      (abonoSeleccionado as any).i_CveServAgendaAbono ??
      (abonoSeleccionado as any).id ??
      0;

    const res = await FacturasService.cancelarAbono(
      cveAbonoVal,
      motivoCancelacionAbono
    );
    setGuardandoAccion(false);

    if (res.exito) {
      toast.success("Pago cancelado correctamente.");
      setSubModalCancelarAbierto(false);
      cargarDatosDetalle(factura.i_CveFacturas);
      if (onCambio) onCambio();
    } else {
      setErrorSubModalCancelar(res.mensaje || "Error al cancelar el pago.");
    }
  };

  // Ejecutar Agregar pago programado desde fila editable
  const handleConfirmarAgregarPago = async () => {
    if (!factura) return;
    const cantidad = parseFloat(montoAbonoProgramadoDraft);
    if (!fechaAbonoProgramadaDraft) {
      setErrorFilaAgregar("Por favor selecciona la fecha de pago programada.");
      return;
    }
    if (isNaN(cantidad) || cantidad <= 0) {
      setErrorFilaAgregar("Por favor ingresa una cantidad válida mayor a 0.");
      return;
    }
    const maxPermitido = Math.max(0, Math.round(pendientePagar * 100) / 100);
    if (maxPermitido > 0 && cantidad > maxPermitido + 0.001) {
      setErrorFilaAgregar(`La cantidad no puede superar el monto pendiente de pagar ($${maxPermitido.toLocaleString("es-MX", { minimumFractionDigits: 2 })}).`);
      return;
    }

    setGuardandoFilaAgregar(true);
    setErrorFilaAgregar(null);

    const res = await FacturasService.agregarAbono({
      i_CveFactura: factura.i_CveFacturas,
      d_Monto: cantidad,
      d_FechaProgramada: fechaAbonoProgramadaDraft,
    });
    setGuardandoFilaAgregar(false);

    if (res.exito) {
      toast.success("Pago programado agregado correctamente.");
      setMostrandoFilaAgregar(false);
      cargarDatosDetalle(factura.i_CveFacturas);
      if (onCambio) onCambio();
    } else {
      setErrorFilaAgregar(res.mensaje || "Error al agregar el pago programado.");
    }
  };

  const formatearMonto = (v: number) =>
    `$${(v || 0).toLocaleString("es-MX", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  if (!abierto || !factura) return null;

  return (
    <>
      {/* Modal Principal Detalle de Factura */}
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
        <div className="modal-content" style={{ maxWidth: "860px", width: "95%", maxHeight: "90vh", display: "flex", flexDirection: "column" }}>
          
          {/* Header del Modal */}
          <div className="modal-header" style={{ padding: "10px 18px", borderBottom: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <FileText size={18} style={{ color: "#0284c7" }} />
              <h3 className="modal-title" style={{ fontSize: "16px", fontWeight: 700, color: "#0f172a", margin: 0 }}>
                Detalle de factura{factura.v_NoFactura ? ` ${factura.v_NoFactura}` : ""}
              </h3>
              {pendientePagar <= 0 && (
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
                  <Check size={12} /> Liquidado
                </span>
              )}
            </div>

            {/* Lado Derecho del Header: Card compacta de Monto a Cobrar + Botón X */}
            <div style={{ display: "flex", alignItems: "center", gap: "14px", flexWrap: "wrap" }}>
              {!cargando && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "14px",
                    flexWrap: "wrap",
                  }}
                >
                  <div>
                    <span style={{ fontSize: "10px", fontWeight: 600, color: "#64748b", display: "block", lineHeight: "1" }}>
                      Monto a cobrar en esta factura
                    </span>
                    <div style={{ display: "flex", alignItems: "baseline", gap: "4px", marginTop: "2px" }}>
                      <span style={{ fontSize: "15px", fontWeight: 800, color: "#0f172a", lineHeight: "1" }}>
                        {formatearMonto(factura.d_Monto)}
                      </span>
                      <span style={{ fontSize: "10px", fontWeight: 700, color: "#64748b" }}>MXN</span>
                    </div>
                  </div>

                  <div style={{ borderLeft: "1px solid #e2e8f0", paddingLeft: "12px", textAlign: "right" }}>
                    <span style={{ fontSize: "10px", fontWeight: 600, color: "#64748b", display: "block", lineHeight: "1" }}>
                      Porcentaje sobre venta total
                    </span>
                    <span style={{ fontSize: "13px", fontWeight: 700, color: "#0284c7", lineHeight: "1", display: "block", marginTop: "2px" }}>
                      {porcentajeCobro.toFixed(1)}%
                    </span>
                  </div>
                </div>
              )}

              <button
                type="button"
                className="btn-close"
                onClick={onCerrar}
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Body con Scroll */}
          <div className="modal-body" style={{ padding: "14px 18px", overflowY: "auto", flex: 1, display: "flex", flexDirection: "column", gap: "12px" }}>
            {cargando ? (
              <div style={{ textAlign: "center", padding: "30px" }}>
                <div className="inline-block animate-spin rounded-full h-7 w-7 border-b-2 border-sky-600 mb-2"></div>
                <p style={{ fontSize: "12px", color: "#64748b" }}>Cargando detalle de la factura...</p>
              </div>
            ) : (
              <>
                {/* 1. Tabla de líneas (servicios de la factura) */}
                <div>
                  <h4 style={{ fontSize: "13px", fontWeight: 600, color: "#334155", marginBottom: "4px" }}>
                    Servicios de la factura
                  </h4>

                  <div style={{ border: "1px solid #e2e8f0", borderRadius: "4px", overflowX: "auto", backgroundColor: "#ffffff" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
                      <thead>
                        <tr style={{ borderBottom: "1px solid #e2e8f0", backgroundColor: "#ffffff" }}>
                          <th style={{ textAlign: "left", padding: "6px 10px", fontWeight: 600, color: "#475569", borderRight: "1px solid #e2e8f0" }}>
                            Servicio
                          </th>
                          <th style={{ textAlign: "center", width: "90px", padding: "6px 10px", fontWeight: 600, color: "#475569", borderRight: "1px solid #e2e8f0" }}>
                            Cantidad
                          </th>
                          <th style={{ textAlign: "center", width: "90px", padding: "6px 10px", fontWeight: 600, color: "#475569", borderRight: "1px solid #e2e8f0" }}>
                            Unidad
                          </th>
                          <th style={{ textAlign: "right", padding: "6px 10px", fontWeight: 600, color: "#475569", borderRight: "1px solid #e2e8f0" }}>
                            Precio unit s/IVA
                          </th>
                          <th style={{ textAlign: "right", padding: "6px 10px", fontWeight: 600, color: "#475569", borderRight: "1px solid #e2e8f0" }}>
                            Impuesto (16%)
                          </th>
                          <th style={{ textAlign: "right", padding: "6px 10px", fontWeight: 600, color: "#475569" }}>
                            Total s/IVA
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {gruposLineas.length === 0 ? (
                          <tr>
                            <td colSpan={6} style={{ textAlign: "center", padding: "12px", color: "#94a3b8" }}>
                              Sin líneas de servicio registradas.
                            </td>
                          </tr>
                        ) : (
                          gruposLineas.map((grupo) => {
                            if (grupo.esProyecto) {
                              const expandido = !!proyectosExpandidos[grupo.key];
                              const montoProj = grupo.montoProyecto || 0;
                              const ivaProj = montoProj * 0.16;

                              return (
                                <React.Fragment key={grupo.key}>
                                  {/* Fila Carpeta de Proyecto */}
                                  <tr
                                    onClick={() => toggleProyecto(grupo.key)}
                                    style={{
                                      borderBottom: "1px solid #e2e8f0",
                                      backgroundColor: "#f4f8fc",
                                      borderLeft: "4px solid #0284c7",
                                      cursor: "pointer",
                                      userSelect: "none",
                                    }}
                                  >
                                    {/* Servicio (Nombre del Proyecto + Iconos + Subtexto) */}
                                    <td style={{ padding: "6px 10px", borderRight: "1px solid #e2e8f0" }}>
                                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                        {expandido ? (
                                          <ChevronDown size={16} style={{ color: "#0284c7", flexShrink: 0 }} />
                                        ) : (
                                          <ChevronRight size={16} style={{ color: "#0284c7", flexShrink: 0 }} />
                                        )}
                                        <Folder size={16} style={{ color: "#0284c7", flexShrink: 0 }} />
                                        <div style={{ display: "flex", flexDirection: "column" }}>
                                          <span style={{ fontWeight: 700, color: "#0f172a", fontSize: "12px" }}>
                                            {(grupo.nombreProyecto || "PROYECTO").toUpperCase()}
                                          </span>
                                          <span style={{ fontSize: "10px", color: "#64748b" }}>
                                            {grupo.lineas.length} servicio(s)
                                          </span>
                                        </div>
                                      </div>
                                    </td>

                                    {/* Cantidad: — */}
                                    <td style={{ padding: "6px 10px", textAlign: "center", color: "#94a3b8", borderRight: "1px solid #e2e8f0" }}>
                                      —
                                    </td>

                                    {/* Unidad: — */}
                                    <td style={{ padding: "6px 10px", textAlign: "center", color: "#94a3b8", borderRight: "1px solid #e2e8f0" }}>
                                      —
                                    </td>

                                    {/* Precio unit s/IVA: d_MontoProyecto */}
                                    <td style={{ padding: "6px 10px", textAlign: "right", color: "#334155", fontWeight: 600, borderRight: "1px solid #e2e8f0" }}>
                                      {formatearMonto(montoProj)}
                                    </td>

                                    {/* Impuesto (16%): d_MontoProyecto * 0.16 */}
                                    <td style={{ padding: "6px 10px", textAlign: "right", color: "#334155", fontWeight: 600, borderRight: "1px solid #e2e8f0" }}>
                                      {formatearMonto(ivaProj)}
                                    </td>

                                    {/* Total s/IVA: d_MontoProyecto */}
                                    <td style={{ padding: "6px 10px", textAlign: "right", fontWeight: 700, color: "#0f172a" }}>
                                      {formatearMonto(montoProj)}
                                    </td>
                                  </tr>

                                  {/* Sub-filas de los servicios del proyecto (si está expandido) */}
                                  {expandido &&
                                    grupo.lineas.map((linea, subIdx) => {
                                      const cantidadFormateada = (Number(linea.i_Cantidad) || 0).toFixed(2);
                                      const servicioNombre = (linea.v_Servicio || (linea as any).v_NombreServicio || "SERVICIO").toUpperCase();

                                      return (
                                        <tr
                                          key={`${grupo.key}-sub-${subIdx}`}
                                          style={{
                                            borderBottom: "1px solid #e2e8f0",
                                            backgroundColor: "#fafcff",
                                          }}
                                        >
                                          {/* Indentado con padding de 32px */}
                                          <td style={{ padding: "6px 10px 6px 32px", fontWeight: 600, color: "#475569", borderRight: "1px solid #e2e8f0" }}>
                                            {servicioNombre}
                                          </td>

                                          {/* Cantidad real */}
                                          <td style={{ padding: "6px 10px", textAlign: "center", color: "#475569", borderRight: "1px solid #e2e8f0" }}>
                                            {cantidadFormateada}
                                          </td>

                                          {/* Unidad real */}
                                          <td style={{ padding: "6px 10px", textAlign: "center", color: "#475569", borderRight: "1px solid #e2e8f0" }}>
                                            {linea.v_Unidad || "horas"}
                                          </td>

                                          {/* Precio unit s/IVA: — */}
                                          <td style={{ padding: "6px 10px", textAlign: "right", color: "#94a3b8", borderRight: "1px solid #e2e8f0" }}>
                                            —
                                          </td>

                                          {/* Impuesto (16%): — */}
                                          <td style={{ padding: "6px 10px", textAlign: "right", color: "#94a3b8", borderRight: "1px solid #e2e8f0" }}>
                                            —
                                          </td>

                                          {/* Total s/IVA: — */}
                                          <td style={{ padding: "6px 10px", textAlign: "right", color: "#94a3b8" }}>
                                            —
                                          </td>
                                        </tr>
                                      );
                                    })}
                                </React.Fragment>
                              );
                            }

                            // Fila Normal (No Proyecto)
                            const linea = grupo.lineas[0];
                            const subtotalLinea = linea.d_Subtotal || (linea.i_Cantidad * linea.d_PrecioUnitario) || 0;
                            const ivaLinea = linea.d_IVA && linea.d_IVA > 0 ? linea.d_IVA : subtotalLinea * 0.16;
                            const cantidadFormateada = (Number(linea.i_Cantidad) || 0).toFixed(2);
                            const servicioNombre = (linea.v_Servicio || (linea as any).v_NombreServicio || "SERVICIO").toUpperCase();

                            return (
                              <tr key={grupo.key} style={{ borderBottom: "1px solid #e2e8f0", backgroundColor: "#ffffff" }}>
                                <td style={{ padding: "6px 10px", fontWeight: 700, color: "#334155", borderRight: "1px solid #e2e8f0" }}>
                                  {servicioNombre}
                                </td>
                                <td style={{ padding: "6px 10px", textAlign: "center", color: "#475569", borderRight: "1px solid #e2e8f0" }}>
                                  {cantidadFormateada}
                                </td>
                                <td style={{ padding: "6px 10px", textAlign: "center", color: "#475569", borderRight: "1px solid #e2e8f0" }}>
                                  {linea.v_Unidad || "horas"}
                                </td>
                                <td style={{ padding: "6px 10px", textAlign: "right", color: "#475569", borderRight: "1px solid #e2e8f0" }}>
                                  {formatearMonto(linea.d_PrecioUnitario)}
                                </td>
                                <td style={{ padding: "6px 10px", textAlign: "right", color: "#475569", borderRight: "1px solid #e2e8f0" }}>
                                  {formatearMonto(ivaLinea)}
                                </td>
                                <td style={{ padding: "6px 10px", textAlign: "right", fontWeight: 600, color: "#334155" }}>
                                  {formatearMonto(subtotalLinea)}
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                      <tfoot>
                        <tr style={{ borderBottom: "1px solid #e2e8f0" }}>
                          <td colSpan={4} style={{ borderRight: "1px solid #e2e8f0" }}></td>
                          <td style={{ padding: "6px 10px", textAlign: "right", fontWeight: 700, color: "#334155", borderRight: "1px solid #e2e8f0" }}>
                            Subtotal
                          </td>
                          <td style={{ padding: "6px 10px", textAlign: "right", fontWeight: 700, color: "#334155" }}>
                            {formatearMonto(subtotalTabla)}
                          </td>
                        </tr>
                        <tr style={{ borderBottom: "1px solid #e2e8f0" }}>
                          <td colSpan={4} style={{ borderRight: "1px solid #e2e8f0" }}></td>
                          <td style={{ padding: "6px 10px", textAlign: "right", fontWeight: 600, color: "#475569", borderRight: "1px solid #e2e8f0" }}>
                            IVA (16%)
                          </td>
                          <td style={{ padding: "6px 10px", textAlign: "right", fontWeight: 600, color: "#334155" }}>
                            {formatearMonto(ivaTabla)}
                          </td>
                        </tr>
                        <tr>
                          <td colSpan={4} style={{ borderRight: "1px solid #e2e8f0" }}></td>
                          <td style={{ padding: "7px 10px", textAlign: "right", fontWeight: 700, fontSize: "13px", color: "#1e293b", borderRight: "1px solid #e2e8f0" }}>
                            Total
                          </td>
                          <td style={{ padding: "7px 10px", textAlign: "right", fontWeight: 800, fontSize: "14px", color: "#0f172a" }}>
                            {formatearMonto(totalTabla)}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>

                {/* 3. Historial de pagos (abonos) */}
                <div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "4px" }}>
                    <h4 style={{ fontSize: "13px", fontWeight: 700, color: "#0f172a", margin: 0 }}>
                      Historial de pagos (abonos)
                    </h4>

                    {/* Botón "+" circular */}
                    {pendientePagar > 0 && !factura.b_Cancelada && (
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
                          transition: "background-color 0.2s",
                        }}
                      >
                        <Plus size={14} />
                      </button>
                    )}
                  </div>

                  {/* Tabla de Abonos */}
                  {abonos.length === 0 && !mostrandoFilaAgregar ? (
                    <p style={{ fontSize: "12px", color: "#64748b", fontStyle: "italic", margin: "4px 0" }}>
                      Sin pagos programados todavía.
                    </p>
                  ) : (
                    <div style={{ border: "1px solid #e2e8f0", borderRadius: "6px", overflow: "hidden", backgroundColor: "#ffffff" }}>
                      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
                        <thead>
                          <tr style={{ borderBottom: "1px solid #e2e8f0", backgroundColor: "#f8fafc" }}>
                            <th style={{ textAlign: "left", padding: "6px 10px", fontWeight: 600, color: "#475569" }}>Fecha programada</th>
                            <th style={{ textAlign: "left", padding: "6px 10px", fontWeight: 600, color: "#475569" }}>Fecha en que se pagó</th>
                            <th style={{ textAlign: "right", padding: "6px 10px", fontWeight: 600, color: "#475569" }}>Cantidad</th>
                            <th style={{ textAlign: "center", width: "80px", padding: "6px 10px", fontWeight: 600, color: "#475569" }}>Acciones</th>
                          </tr>
                        </thead>
                        <tbody>
                          {abonos.map((abono, idx) => {
                            const esCancelado = abono.i_Estado === 2;
                            const esPagado = abono.i_Estado === 1;
                            const esPendiente = abono.i_Estado === 0;

                            const fechaProgramada = abono.d_FechaProgramada || (abono as any).d_FechaAbono;
                            const fechaPagoRealAbono = abono.d_FechaAbono;
                            const montoAbono = abono.d_Monto ?? (abono as any).f_Monto ?? 0;

                            return (
                              <tr key={abono.i_CveAbono || idx} style={{ borderBottom: (idx === abonos.length - 1 && !mostrandoFilaAgregar) ? "none" : "1px solid #e2e8f0" }}>
                                <td style={{ padding: "6px 10px" }}>
                                  {fechaProgramada ? formatearFechaTexto(fechaProgramada) : "—"}
                                </td>
                                <td style={{ padding: "6px 10px" }}>
                                  {esCancelado ? (
                                    <div style={{ display: "flex", flexDirection: "column" }}>
                                      <span style={{ color: "#dc2626", fontWeight: 700 }}>Cancelado</span>
                                      {abono.v_MotivoCancelacion && (
                                        <span style={{ fontSize: "10px", color: "#64748b" }}>
                                          {abono.v_MotivoCancelacion}
                                        </span>
                                      )}
                                    </div>
                                  ) : esPagado ? (
                                    <div style={{ display: "flex", flexDirection: "column" }}>
                                      <span style={{ color: "#16a34a", fontWeight: 700 }}>
                                        {fechaPagoRealAbono ? formatearFechaTexto(fechaPagoRealAbono) : "Pagado"}
                                      </span>
                                      {abono.v_Descripcion && (
                                        <span style={{ fontSize: "10px", color: "#64748b" }}>
                                          {abono.v_Descripcion}
                                        </span>
                                      )}
                                    </div>
                                  ) : (
                                    <span style={{ color: "#dc2626", fontWeight: 700 }}>Pendiente</span>
                                  )}
                                </td>
                                <td style={{ padding: "6px 10px", textAlign: "right", fontWeight: 700, color: "#0f172a" }}>
                                  {formatearMonto(montoAbono)}
                                </td>
                                <td style={{ padding: "6px 10px", textAlign: "center" }}>
                                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "4px" }}>
                                    <button
                                      type="button"
                                      className="btn-icon"
                                      disabled={!esPendiente}
                                      onClick={() => handleAbrirMarcarPagado(abono)}
                                      title={esPendiente ? "Marcar como pagado" : "Este pago ya no se puede marcar como pagado"}
                                      style={{
                                        color: esPendiente ? "#16a34a" : "#cbd5e1",
                                        cursor: esPendiente ? "pointer" : "not-allowed",
                                        padding: "2px",
                                      }}
                                    >
                                      <CheckCircle size={15} />
                                    </button>

                                    <button
                                      type="button"
                                      className="btn-icon"
                                      onClick={() => handleAbrirCancelarPago(abono)}
                                      title="Cancelar pago"
                                      style={{ color: "#dc2626", padding: "2px" }}
                                    >
                                      <Ban size={15} />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}

                          {/* Fila Editable Inline para agregar nuevo pago */}
                          {mostrandoFilaAgregar && pendientePagar > 0 && !factura.b_Cancelada && (
                            <tr style={{ backgroundColor: "#f0f9ff" }}>
                              <td style={{ padding: "4px 8px" }}>
                                <input
                                  type="date"
                                  value={fechaAbonoProgramadaDraft}
                                  onChange={(e) => setFechaAbonoProgramadaDraft(e.target.value)}
                                  style={{
                                    width: "100%",
                                    padding: "3px 6px",
                                    fontSize: "12px",
                                    border: "1px solid #cbd5e1",
                                    borderRadius: "4px",
                                    backgroundColor: "#ffffff",
                                    outline: "none",
                                  }}
                                />
                              </td>
                              <td style={{ padding: "4px 8px" }}>
                                <span style={{ color: "#dc2626", fontWeight: 700 }}>Pendiente</span>
                              </td>
                              <td style={{ padding: "4px 8px", textAlign: "right" }}>
                                <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "2px" }}>
                                  <span style={{ fontSize: "12px", fontWeight: 600, color: "#64748b" }}>$</span>
                                  <input
                                    type="number"
                                    step="0.01"
                                    min="0.01"
                                    max={pendientePagar > 0 ? pendientePagar : undefined}
                                    placeholder="0.00"
                                    value={montoAbonoProgramadoDraft}
                                    onChange={(e) => {
                                      const valStr = e.target.value;
                                      if (valStr === "") {
                                        setMontoAbonoProgramadoDraft("");
                                        return;
                                      }
                                      const valNum = Number(valStr);
                                      const maxVal = Math.max(0, Math.round(pendientePagar * 100) / 100);
                                      if (!isNaN(valNum) && maxVal > 0 && valNum > maxVal) {
                                        setMontoAbonoProgramadoDraft(maxVal.toString());
                                      } else {
                                        setMontoAbonoProgramadoDraft(valStr);
                                      }
                                    }}
                                    style={{
                                      width: "100px",
                                      padding: "3px 6px",
                                      fontSize: "12px",
                                      textAlign: "right",
                                      border: "1px solid #cbd5e1",
                                      borderRadius: "4px",
                                      backgroundColor: "#ffffff",
                                      outline: "none",
                                    }}
                                  />
                                </div>
                              </td>
                              <td style={{ padding: "4px 8px", textAlign: "center" }}>
                                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
                                  <button
                                    type="button"
                                    disabled={guardandoFilaAgregar}
                                    onClick={handleConfirmarAgregarPago}
                                    title="Guardar pago programado"
                                    style={{
                                      color: "#16a34a",
                                      background: "transparent",
                                      border: "none",
                                      cursor: guardandoFilaAgregar ? "not-allowed" : "pointer",
                                      padding: "2px",
                                      display: "flex",
                                      alignItems: "center",
                                    }}
                                  >
                                    <Check size={16} />
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
                                      cursor: guardandoFilaAgregar ? "not-allowed" : "pointer",
                                      padding: "2px",
                                      display: "flex",
                                      alignItems: "center",
                                    }}
                                  >
                                    <X size={16} />
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
                    <div style={{ padding: "6px 10px", marginTop: "4px", backgroundColor: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626", borderRadius: "4px", fontSize: "11px" }}>
                      {errorFilaAgregar}
                    </div>
                  )}

                  {/* 3.2 Resumen "Cantidad pendiente de pagar" */}
                  {pendientePagar > 0 ? (
                    <div
                      style={{
                        backgroundColor: "#fef2f2",
                        border: "1px solid #fecaca",
                        borderRadius: "6px",
                        padding: "6px 12px",
                        marginTop: "6px",
                        display: "flex",
                        flexDirection: "column",
                        gap: "4px",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <span style={{ fontSize: "12px", fontWeight: 600, color: "#991b1b" }}>
                          Cantidad pendiente de pagar:
                        </span>
                        <span
                          style={{
                            fontSize: "14px",
                            fontWeight: 800,
                            color: "#dc2626",
                          }}
                        >
                          {formatearMonto(pendientePagar)}
                        </span>
                      </div>

                      {/* Alerta de descuadre */}
                      {hayDescuadre && (
                        <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#dc2626", fontSize: "11px", fontWeight: 600, marginTop: "2px" }}>
                          <AlertTriangle size={14} style={{ flexShrink: 0 }} />
                          <span>
                            La suma de los pagos ({formatearMonto(sumaActivos)}) no coincide con el monto de la factura ({formatearMonto(factura.d_Monto)}). Ajusta los pagos para que cuadren.
                          </span>
                        </div>
                      )}
                    </div>
                  ) : hayDescuadre ? (
                    <div
                      style={{
                        backgroundColor: "#fef2f2",
                        border: "1px solid #fecaca",
                        borderRadius: "6px",
                        padding: "6px 12px",
                        marginTop: "6px",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#dc2626", fontSize: "11px", fontWeight: 600 }}>
                        <AlertTriangle size={14} style={{ flexShrink: 0 }} />
                        <span>
                          La suma de los pagos ({formatearMonto(sumaActivos)}) no coincide con el monto de la factura ({formatearMonto(factura.d_Monto)}). Ajusta los pagos para que cuadren.
                        </span>
                      </div>
                    </div>
                  ) : null}
                </div>
              </>
            )}
          </div>

          {/* Footer del Modal */}
          <div className="modal-footer" style={{ padding: "10px 18px", borderTop: "1px solid #e2e8f0" }}>
            <button type="button" className="btn btn-secondary" onClick={onCerrar} style={{ padding: "5px 14px", fontSize: "13px" }}>
              Cerrar
            </button>
          </div>
        </div>
      </div>

      {/* --- SUB-MODAL 1: Marcar pago como recibido --- */}
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
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1100,
            padding: "16px",
          }}
        >
          <div className="modal-content" style={{ maxWidth: "440px", width: "90%" }}>
            <div className="modal-header">
              <h3 className="modal-title" style={{ fontSize: "16px", fontWeight: 700 }}>
                Marcar pago como recibido
              </h3>
              <button
                type="button"
                className="btn-close"
                onClick={() => setSubModalPagadoAbierto(false)}
              >
                <X size={18} />
              </button>
            </div>
            <div className="modal-body" style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "14px" }}>
              {errorSubModalPagado && (
                <div style={{ padding: "10px 12px", backgroundColor: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626", borderRadius: "6px", fontSize: "12px" }}>
                  {errorSubModalPagado}
                </div>
              )}

              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <label className="form-label" style={{ fontSize: "12px", fontWeight: 600 }}>
                  Fecha en que se pagó<span style={{ color: "#dc2626" }}>*</span>
                </label>
                <input
                  type="date"
                  className="form-input text-xs p-2"
                  value={fechaPagoReal}
                  onChange={(e) => setFechaPagoReal(e.target.value)}
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <label className="form-label" style={{ fontSize: "12px", fontWeight: 600 }}>
                  Notas adicionales <span style={{ color: "#94a3b8", fontWeight: 400 }}>(opcional, máx. 100 caracteres)</span>
                </label>
                <textarea
                  className="form-input text-xs p-2"
                  rows={2}
                  maxLength={100}
                  placeholder="Ej. Transferencia bancaria No. Ref 4829"
                  value={notasPago}
                  onChange={(e) => setNotasPago(e.target.value)}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" disabled={guardandoAccion} onClick={() => setSubModalPagadoAbierto(false)}>
                Cancelar
              </button>
              <button
                type="button"
                className="btn btn-success"
                disabled={guardandoAccion}
                onClick={handleConfirmarMarcarPagado}
                style={{ backgroundColor: "#16a34a", color: "#ffffff", border: "none", display: "inline-flex", alignItems: "center", gap: "6px" }}
              >
                <Check size={16} />
                {guardandoAccion ? "Guardando..." : "Confirmar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- SUB-MODAL 2: Cancelar pago --- */}
      {subModalCancelarAbierto && abonoSeleccionado && (
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
            zIndex: 1100,
            padding: "16px",
          }}
        >
          <div className="modal-content" style={{ maxWidth: "440px", width: "90%" }}>
            <div className="modal-header">
              <h3 className="modal-title" style={{ fontSize: "16px", fontWeight: 700, color: "#dc2626" }}>
                Cancelar pago
              </h3>
              <button
                type="button"
                className="btn-close"
                onClick={() => setSubModalCancelarAbierto(false)}
              >
                <X size={18} />
              </button>
            </div>
            <div className="modal-body" style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "14px" }}>
              {errorSubModalCancelar && (
                <div style={{ padding: "10px 12px", backgroundColor: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626", borderRadius: "6px", fontSize: "12px" }}>
                  {errorSubModalCancelar}
                </div>
              )}

              <p style={{ fontSize: "13px", color: "#334155", margin: 0 }}>
                ¿Seguro que quieres cancelar este pago
                {(abonoSeleccionado.d_FechaProgramada || (abonoSeleccionado as any).d_FechaAbono)
                  ? ` programado para el ${formatearFechaTexto(abonoSeleccionado.d_FechaProgramada || (abonoSeleccionado as any).d_FechaAbono)}`
                  : ""} por{" "}
                <strong>{formatearMonto(abonoSeleccionado.d_Monto ?? (abonoSeleccionado as any).f_Monto ?? 0)}</strong>?
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <label className="form-label" style={{ fontSize: "12px", fontWeight: 600 }}>
                  Motivo<span style={{ color: "#dc2626" }}>*</span> <span style={{ color: "#94a3b8", fontWeight: 400 }}>(máx. 200 caracteres)</span>
                </label>
                <textarea
                  className="form-input text-xs p-2"
                  rows={3}
                  maxLength={200}
                  placeholder="Ingresa la razón de cancelación..."
                  value={motivoCancelacionAbono}
                  onChange={(e) => setMotivoCancelacionAbono(e.target.value)}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" disabled={guardandoAccion} onClick={() => setSubModalCancelarAbierto(false)}>
                Regresar
              </button>
              <button
                type="button"
                className="btn btn-danger"
                disabled={guardandoAccion}
                onClick={handleConfirmarCancelarPago}
                style={{ backgroundColor: "#dc2626", color: "#ffffff", border: "none", display: "inline-flex", alignItems: "center", gap: "6px" }}
              >
                <Ban size={16} />
                {guardandoAccion ? "Guardando..." : "Cancelar pago"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
