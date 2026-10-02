"use client";

import React, { useState, useEffect } from "react";
import { X, Search, Plus, Trash2, AlertTriangle } from "lucide-react";
import { GastosService } from "@/services/gastos.service";
import { ProveedorGetDto } from "@/types/servicios";
import { ServicioSinFacturaProv, AbonoCrearDto } from "@/types/gastos";
import { useToast } from "@/context/ToastContext";

interface Props {
  abierto: boolean;
  proveedores: ProveedorGetDto[];
  onCerrar: () => void;
  onExito: () => void;
}

export const ModalNuevoGasto: React.FC<Props> = ({
  abierto,
  proveedores,
  onCerrar,
  onExito,
}) => {
  const { toast } = useToast();

  const [idProveedor, setIdProveedor] = useState<number>(0);
  const [servicios, setServicios] = useState<ServicioSinFacturaProv[]>([]);
  const [busquedaServicio, setBusquedaServicio] = useState<string>("");
  const [cargandoServicios, setCargandoServicios] = useState<boolean>(false);
  const [seleccionados, setSeleccionados] = useState<number[]>([]);

  // Datos del pago
  const [fechaRegistro, setFechaRegistro] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [montoTotal, setMontoTotal] = useState<number>(0);
  const [montoModificadoManualmente, setMontoModificadoManualmente] = useState<boolean>(false);
  const [descripcion, setDescripcion] = useState<string>("");

  // Pagos programados
  const [abonos, setAbonos] = useState<AbonoCrearDto[]>([]);

  const [guardando, setGuardando] = useState<boolean>(false);

  // Cargar servicios al cambiar de proveedor o búsqueda
  useEffect(() => {
    if (!abierto) return;
    if (idProveedor <= 0) {
      setServicios([]);
      setSeleccionados([]);
      return;
    }

    const cargar = async () => {
      setCargandoServicios(true);
      const res = await GastosService.getServiciosSinFactura(idProveedor, busquedaServicio);
      setServicios(res);
      setCargandoServicios(false);
    };

    cargar();
  }, [idProveedor, busquedaServicio, abierto]);

  // Reset del modal al abrir
  useEffect(() => {
    if (abierto) {
      setIdProveedor(0);
      setServicios([]);
      setBusquedaServicio("");
      setSeleccionados([]);
      setFechaRegistro(new Date().toISOString().split("T")[0]);
      setMontoTotal(0);
      setMontoModificadoManualmente(false);
      setDescripcion("");
      setAbonos([]);
    }
  }, [abierto]);

  // Recalcular monto total precargado cuando cambian los seleccionados
  const sumaTotalServiciosSeleccionados = servicios
    .filter((s) => seleccionados.includes(s.i_CveDatosVentaProv))
    .reduce((acc, curr) => acc + (curr.d_Total || 0), 0);

  useEffect(() => {
    if (!montoModificadoManualmente) {
      setMontoTotal(sumaTotalServiciosSeleccionados);
    }
  }, [seleccionados, sumaTotalServiciosSeleccionados, montoModificadoManualmente]);

  if (!abierto) return null;

  const handleToggleSeleccionarTodo = () => {
    if (seleccionados.length === servicios.length) {
      setSeleccionados([]);
    } else {
      setSeleccionados(servicios.map((s) => s.i_CveDatosVentaProv));
    }
  };

  const handleToggleServicio = (idDatosVenta: number) => {
    if (seleccionados.includes(idDatosVenta)) {
      setSeleccionados(seleccionados.filter((id) => id !== idDatosVenta));
    } else {
      setSeleccionados([...seleccionados, idDatosVenta]);
    }
  };

  // Manejo de abonos programados
  const handleAgregarAbono = () => {
    setAbonos([
      ...abonos,
      {
        d_Monto: 0,
        d_FechaProgramada: new Date().toISOString().split("T")[0],
      },
    ]);
  };

  const handleEliminarAbono = (index: number) => {
    setAbonos(abonos.filter((_, i) => i !== index));
  };

  const handleCambiarAbono = (
    index: number,
    campo: keyof AbonoCrearDto,
    valor: any
  ) => {
    const copia = [...abonos];
    copia[index] = { ...copia[index], [campo]: valor };
    setAbonos(copia);
  };

  const sumaAbonosProgramados = abonos.reduce(
    (acc, curr) => acc + (Number(curr.d_Monto) || 0),
    0
  );

  const formatMoneda = (val: number) => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
      minimumFractionDigits: 2,
    }).format(val);
  };

  const handleGuardar = async () => {
    if (idProveedor <= 0) {
      toast.error("Debes seleccionar un proveedor.");
      return;
    }
    if (seleccionados.length === 0) {
      toast.error("Debes seleccionar al menos un servicio.");
      return;
    }
    if (!fechaRegistro) {
      toast.error("Ingresa la fecha de registro.");
      return;
    }
    if (montoTotal <= 0) {
      toast.error("El monto total debe ser mayor a 0.");
      return;
    }

    setGuardando(true);

    const payload = {
      i_CveProveedor: idProveedor,
      v_NoFactura: null,
      d_FechaHora: fechaRegistro,
      d_Monto: montoTotal,
      v_Descripcion: descripcion.trim() || null,
      DatosVentaIds: seleccionados,
      Abonos: abonos.map((a) => ({
        d_Monto: Number(a.d_Monto) || 0,
        d_FechaProgramada: a.d_FechaProgramada,
      })),
    };

    const res = await GastosService.crearGasto(payload);
    setGuardando(false);

    if (res.exito) {
      toast.success("Gasto registrado exitosamente.");
      onExito();
      onCerrar();
    } else {
      toast.error(res.mensaje || "Error al registrar el gasto.");
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(15, 23, 42, 0.5)",
        backdropFilter: "blur(4px)",
        zIndex: 1050,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
      }}
    >
      <div
        style={{
          backgroundColor: "#ffffff",
          borderRadius: "12px",
          boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)",
          width: "100%",
          maxWidth: "920px",
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "16px 20px",
            borderBottom: "1px solid #e2e8f0",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            backgroundColor: "#f8fafc",
          }}
        >
          <div>
            <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "#1e3a5f" }}>
              Nuevo gasto (Cuenta por pagar a proveedor)
            </h3>
            <p style={{ margin: 0, fontSize: "12px", color: "#64748b" }}>
              Registra la cuenta por pagar seleccionando los servicios del proveedor.
            </p>
          </div>
          <button
            type="button"
            className="btn-close"
            onClick={onCerrar}
            style={{ border: "none", background: "none", cursor: "pointer", color: "#64748b" }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div
          className="custom-scrollbar"
          style={{
            padding: "20px",
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            gap: "20px",
          }}
        >
          {/* 1. Proveedor */}
          <div>
            <label style={{ fontSize: "12px", fontWeight: 700, color: "#475569", marginBottom: "6px", display: "block" }}>
              Proveedor <span style={{ color: "#dc2626" }}>*</span>
            </label>
            <select
              className="form-select"
              style={{
                borderRadius: "8px",
                height: "38px",
                fontSize: "13px",
                border: "1px solid #cbd5e1",
              }}
              value={idProveedor}
              onChange={(e) => {
                setIdProveedor(Number(e.target.value) || 0);
                setMontoModificadoManualmente(false);
              }}
            >
              <option value={0}>-- Selecciona un proveedor --</option>
              {proveedores.map((prov) => (
                <option key={prov.i_CveProveedor} value={prov.i_CveProveedor}>
                  {prov.v_Nombre || prov.v_RazonSocial || `Proveedor #${prov.i_CveProveedor}`}
                </option>
              ))}
            </select>
          </div>

          {/* 2. Servicios que cubre */}
          {idProveedor > 0 && (
            <div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: "8px",
                }}
              >
                <label style={{ fontSize: "12px", fontWeight: 700, color: "#475569", margin: 0 }}>
                  Servicios que cubre <span style={{ color: "#dc2626" }}>*</span> ({seleccionados.length} seleccionados)
                </label>

                {/* Buscador de servicios */}
                <div style={{ position: "relative", width: "240px" }}>
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    style={{
                      borderRadius: "6px",
                      paddingLeft: "28px",
                      fontSize: "12px",
                      height: "30px",
                      border: "1px solid #cbd5e1",
                    }}
                    placeholder="Buscar servicio, OC o cotización..."
                    value={busquedaServicio}
                    onChange={(e) => setBusquedaServicio(e.target.value)}
                  />
                  <Search
                    size={14}
                    style={{
                      position: "absolute",
                      left: "8px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      color: "#94a3b8",
                    }}
                  />
                </div>
              </div>

              {cargandoServicios ? (
                <div className="p-4 text-center text-muted" style={{ fontSize: "12px" }}>
                  Cargando servicios pendientes...
                </div>
              ) : servicios.length === 0 ? (
                <div
                  style={{
                    padding: "20px",
                    backgroundColor: "#f8fafc",
                    borderRadius: "8px",
                    border: "1px solid #e2e8f0",
                    textAlign: "center",
                    fontSize: "13px",
                    color: "#64748b",
                  }}
                >
                  Este proveedor no tiene servicios pendientes de registrar.
                </div>
              ) : (
                <div
                  style={{
                    border: "1px solid #cbd5e1",
                    borderRadius: "8px",
                    maxHeight: "220px",
                    overflowY: "auto",
                  }}
                >
                  <table className="table table-sm align-middle mb-0" style={{ fontSize: "11px", width: "100%" }}>
                    <thead style={{ backgroundColor: "#f1f5f9", position: "sticky", top: 0, zIndex: 10 }}>
                      <tr>
                        <th style={{ width: "36px", textAlign: "center" }}>
                          <input
                            type="checkbox"
                            checked={seleccionados.length > 0 && seleccionados.length === servicios.length}
                            onChange={handleToggleSeleccionarTodo}
                          />
                        </th>
                        <th>Cliente</th>
                        <th>Servicio</th>
                        <th>Fecha</th>
                        <th>Cant.</th>
                        <th>Precio unit s/IVA</th>
                        <th>Total c/IVA</th>
                        <th>Cotización prov.</th>
                        <th>OC prov.</th>
                      </tr>
                    </thead>
                    <tbody>
                      {servicios.map((s) => {
                        const esChecked = seleccionados.includes(s.i_CveDatosVentaProv);
                        return (
                          <tr
                            key={s.i_CveDatosVentaProv}
                            style={{ backgroundColor: esChecked ? "#eff6ff" : "transparent", cursor: "pointer" }}
                            onClick={() => handleToggleServicio(s.i_CveDatosVentaProv)}
                          >
                            <td style={{ textAlign: "center" }} onClick={(e) => e.stopPropagation()}>
                              <input
                                type="checkbox"
                                checked={esChecked}
                                onChange={() => handleToggleServicio(s.i_CveDatosVentaProv)}
                              />
                            </td>
                            <td style={{ fontWeight: 600, color: "#1e3a5f" }}>{s.v_Cliente || "—"}</td>
                            <td>{s.v_Servicio || "—"}</td>
                            <td>{s.d_FechaInicio ? s.d_FechaInicio.split("T")[0] : "—"}</td>
                            <td>{s.i_Cantidad}</td>
                            <td>{formatMoneda(s.d_PrecioUnitario)}</td>
                            <td style={{ fontWeight: 600, color: "#1e3a5f" }}>{formatMoneda(s.d_Total)}</td>
                            <td>{s.v_NoCotizacionProv || "—"}</td>
                            <td>{s.v_NoOrdenCompraProv || "—"}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* 3. Datos del pago */}
          <div
            style={{
              padding: "16px",
              backgroundColor: "#f8fafc",
              borderRadius: "8px",
              border: "1px solid #e2e8f0",
              display: "flex",
              flexDirection: "column",
              gap: "12px",
            }}
          >
            <h4 style={{ margin: 0, fontSize: "13px", fontWeight: 700, color: "#1e3a5f" }}>
              Datos del pago
            </h4>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              {/* Fecha de registro */}
              <div>
                <label style={{ fontSize: "11px", fontWeight: 600, color: "#475569", marginBottom: "4px", display: "block" }}>
                  Fecha de registro <span style={{ color: "#dc2626" }}>*</span>
                </label>
                <input
                  type="date"
                  className="form-control form-control-sm"
                  style={{ borderRadius: "6px", height: "34px", fontSize: "12px" }}
                  value={fechaRegistro}
                  onChange={(e) => setFechaRegistro(e.target.value)}
                />
              </div>

              {/* Monto con IVA */}
              <div>
                <label style={{ fontSize: "11px", fontWeight: 600, color: "#475569", marginBottom: "4px", display: "block" }}>
                  Monto con IVA ($) <span style={{ color: "#dc2626" }}>*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className="form-control form-control-sm"
                  style={{ borderRadius: "6px", height: "34px", fontSize: "12px" }}
                  value={montoTotal}
                  onChange={(e) => {
                    setMontoTotal(Number(e.target.value) || 0);
                    setMontoModificadoManualmente(true);
                  }}
                />
              </div>
            </div>

            {/* Aviso amarillo si el monto no coincide con la suma de servicios */}
            {seleccionados.length > 0 &&
              Math.abs(montoTotal - sumaTotalServiciosSeleccionados) > 0.01 && (
                <div
                  style={{
                    padding: "8px 12px",
                    backgroundColor: "#fefce8",
                    border: "1px solid #fde047",
                    borderRadius: "6px",
                    color: "#ca8a04",
                    fontSize: "11px",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <AlertTriangle size={14} />
                  <span>
                    El monto no coincide con el total de los servicios seleccionados (
                    {formatMoneda(sumaTotalServiciosSeleccionados)}).
                  </span>
                </div>
              )}

            {/* Descripción */}
            <div>
              <label style={{ fontSize: "11px", fontWeight: 600, color: "#475569", marginBottom: "4px", display: "block" }}>
                Descripción (opcional)
              </label>
              <textarea
                className="form-control form-control-sm"
                rows={2}
                style={{ borderRadius: "6px", fontSize: "12px", resize: "none" }}
                placeholder="Notas o descripción del gasto..."
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
              />
            </div>
          </div>

          {/* 4. Pagos programados */}
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "8px",
              }}
            >
              <label style={{ fontSize: "12px", fontWeight: 700, color: "#475569", margin: 0 }}>
                Pagos programados (Opcional)
              </label>
              <button
                type="button"
                className="btn btn-sm btn-outline-primary"
                onClick={handleAgregarAbono}
                style={{ borderRadius: "6px", fontSize: "11px", padding: "3px 8px" }}
              >
                <Plus size={13} className="me-1" />
                Agregar pago programado
              </button>
            </div>

            {abonos.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {abonos.map((ab, idx) => (
                  <div
                    key={`abono-${idx}`}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr 36px",
                      gap: "8px",
                      alignItems: "center",
                      padding: "8px",
                      backgroundColor: "#f8fafc",
                      borderRadius: "6px",
                      border: "1px solid #e2e8f0",
                    }}
                  >
                    <div>
                      <label style={{ fontSize: "10px", color: "#64748b", display: "block" }}>Monto ($)</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        className="form-control form-control-sm"
                        style={{ height: "30px", fontSize: "12px", borderRadius: "4px" }}
                        value={ab.d_Monto}
                        onChange={(e) => handleCambiarAbono(idx, "d_Monto", e.target.value)}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: "10px", color: "#64748b", display: "block" }}>Fecha programada</label>
                      <input
                        type="date"
                        className="form-control form-control-sm"
                        style={{ height: "30px", fontSize: "12px", borderRadius: "4px" }}
                        value={ab.d_FechaProgramada}
                        onChange={(e) => handleCambiarAbono(idx, "d_FechaProgramada", e.target.value)}
                      />
                    </div>
                    <div style={{ textAlign: "center", paddingTop: "14px" }}>
                      <button
                        type="button"
                        className="btn btn-sm text-danger"
                        onClick={() => handleEliminarAbono(idx)}
                        title="Eliminar pago"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}

                {/* Aviso si la suma no coincide */}
                {Math.abs(sumaAbonosProgramados - montoTotal) > 0.01 && (
                  <div
                    style={{
                      padding: "8px 12px",
                      backgroundColor: "#fefce8",
                      border: "1px solid #fde047",
                      borderRadius: "6px",
                      color: "#ca8a04",
                      fontSize: "11px",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    <AlertTriangle size={14} />
                    <span>
                      La suma de los pagos programados ({formatMoneda(sumaAbonosProgramados)}) no coincide con el monto total del gasto ({formatMoneda(montoTotal)}).
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: "12px 20px",
            borderTop: "1px solid #e2e8f0",
            backgroundColor: "#f8fafc",
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            gap: "10px",
          }}
        >
          <button
            type="button"
            className="btn btn-light"
            onClick={onCerrar}
            disabled={guardando}
            style={{ borderRadius: "6px", fontSize: "13px", padding: "6px 14px", border: "1px solid #cbd5e1" }}
          >
            Cancelar
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleGuardar}
            disabled={guardando}
            style={{ borderRadius: "6px", fontSize: "13px", padding: "6px 14px" }}
          >
            {guardando ? "Guardando..." : "Guardar gasto"}
          </button>
        </div>
      </div>
    </div>
  );
};
