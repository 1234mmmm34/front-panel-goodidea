"use client";

import React from "react";
import { Eye, FileCheck, Ban, Search } from "lucide-react";
import { FacturaGetDto, getEstadoFactura } from "@/types/facturas";
import { PaginadorCustom } from "@/components/ui/PaginadorCustom";
import { formatearFechaTexto } from "@/lib/date-utils";

interface Props {
  datos: FacturaGetDto[];
  cargando: boolean;
  paginaActual: number;
  totalPaginas: number;
  totalRegistros: number;
  tamano: number;
  onCambioPagina: (pagina: number) => void;
  onCambioTamano: (tamano: number) => void;
  onVerDetalle: (item: FacturaGetDto) => void;
  onTimbrar: (item: FacturaGetDto) => void;
  onCancelar: (item: FacturaGetDto) => void;
}

export const TablaFacturas: React.FC<Props> = ({
  datos,
  cargando,
  paginaActual,
  totalPaginas,
  totalRegistros,
  tamano,
  onCambioPagina,
  onCambioTamano,
  onVerDetalle,
  onTimbrar,
  onCancelar,
}) => {
  const hoyStr = new Date().toISOString().split("T")[0];

  const formatearMonto = (monto: number): string => {
    const val = isNaN(monto) ? 0 : monto;
    return `$${val.toLocaleString("es-MX", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const renderProximoPago = (item: FacturaGetDto) => {
    const saldo = item.d_SaldoPendiente ?? (item as any).f_PorCobrar ?? 0;
    // "Sin deuda" (gris) si está cancelada o el saldo pendiente es <= 0
    if (item.b_Cancelada || saldo <= 0) {
      return <span style={{ color: "#64748b", fontWeight: 500 }}>Sin deuda</span>;
    }
    // Si no tiene fecha de próximo pago pero sí deuda > 0: "Sin programar" (rojo)
    if (!item.d_ProximoPago) {
      return <span style={{ color: "#ef4444", fontWeight: 600 }}>Sin programar</span>;
    }

    const fechaSolo = item.d_ProximoPago.split("T")[0];
    if (fechaSolo === hoyStr) {
      return <span style={{ color: "#ef4444", fontWeight: 700 }}>Hoy</span>;
    }

    return (
      <span style={{ color: "#334155", fontWeight: 500 }}>
        {formatearFechaTexto(item.d_ProximoPago)}
      </span>
    );
  };

  const renderPagosPendientesBadge = (item: FacturaGetDto) => {
    const saldo = item.d_SaldoPendiente ?? (item as any).f_PorCobrar ?? 0;
    if (saldo <= 0) {
      return <span className="badge badge-success">Pagado</span>;
    }
    if (item.i_PagosPendientes > 0) {
      const label = item.i_PagosPendientes === 1 ? "1 pendiente" : `${item.i_PagosPendientes} pendientes`;
      return <span className="badge badge-warning">{label}</span>;
    }
    return <span style={{ color: "#ef4444", fontWeight: 600, fontSize: "12px" }}>Sin programar</span>;
  };

  const renderEstadoBadge = (item: FacturaGetDto) => {
    const estadoCalculado = getEstadoFactura(item);

    // Cancelada tiene prioridad sobre cualquier otro estado
    if (item.b_Cancelada || estadoCalculado === "Cancelada") {
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
          <span className="badge badge-danger">Cancelada</span>
          {item.v_MotivoCancelacion && (
            <span style={{ fontSize: "11px", color: "#dc2626", lineHeight: "1.2" }}>
              {item.v_MotivoCancelacion}
            </span>
          )}
        </div>
      );
    }

    if (estadoCalculado === "Cobrada" || estadoCalculado === "Liquidada") {
      return <span className="badge badge-success">Liquidada</span>;
    }

    if (estadoCalculado === "Abonada") {
      return <span className="badge badge-warning">Abonada</span>;
    }

    return <span className="badge badge-secondary">No cobrada</span>;
  };

  return (
    <div className="alegra-table-container">
      <table className="alegra-table">
        <thead>
          <tr>
            <th>Cliente</th>
            <th>Factura</th>
            <th>Creación</th>
            <th>Próximo pago</th>
            <th style={{ textAlign: "right" }}>Total</th>
            <th style={{ textAlign: "right" }}>Por cobrar</th>
            <th style={{ textAlign: "center" }}>Pagos pendientes</th>
            <th style={{ textAlign: "center" }}>Estado timbre</th>
            <th style={{ textAlign: "center" }}>Estado</th>
            <th style={{ textAlign: "center", width: "110px" }}>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {cargando ? (
            Array.from({ length: 5 }).map((_, idx) => (
              <tr key={`sk-facturas-${idx}`}>
                <td>
                  <div className="skeleton-box" style={{ width: "80%", marginBottom: "4px" }}></div>
                  <div className="skeleton-box sm" style={{ width: "45%" }}></div>
                </td>
                <td>
                  <div className="skeleton-box sm" style={{ width: "70px" }}></div>
                </td>
                <td>
                  <div className="skeleton-box sm" style={{ width: "85px" }}></div>
                </td>
                <td>
                  <div className="skeleton-box sm" style={{ width: "85px" }}></div>
                </td>
                <td style={{ textAlign: "right" }}>
                  <div className="skeleton-box sm" style={{ width: "65px", marginLeft: "auto" }}></div>
                </td>
                <td style={{ textAlign: "right" }}>
                  <div className="skeleton-box sm" style={{ width: "65px", marginLeft: "auto" }}></div>
                </td>
                <td style={{ textAlign: "center" }}>
                  <div className="skeleton-box" style={{ width: "75px", height: "20px", borderRadius: "10px", margin: "0 auto" }}></div>
                </td>
                <td style={{ textAlign: "center" }}>
                  <div className="skeleton-box" style={{ width: "75px", height: "20px", borderRadius: "10px", margin: "0 auto" }}></div>
                </td>
                <td style={{ textAlign: "center" }}>
                  <div className="skeleton-box" style={{ width: "75px", height: "20px", borderRadius: "10px", margin: "0 auto" }}></div>
                </td>
                <td style={{ textAlign: "center" }}>
                  <div className="flex items-center justify-center gap-1.5">
                    <div className="skeleton-circle"></div>
                    <div className="skeleton-circle"></div>
                  </div>
                </td>
              </tr>
            ))
          ) : datos.length === 0 ? (
            <tr>
              <td colSpan={10} style={{ textAlign: "center", padding: "28px 16px", color: "#475569", fontSize: "13px" }}>
                No se encontraron registros de facturas.
              </td>
            </tr>
          ) : (
            datos.map((item, idx) => {
              const cancelada = item.b_Cancelada || item.v_Estado === "Cancelada";
              const keyVal = item.i_CveFacturas || (item as any).i_CveFactura || (item as any).id || `factura-${idx}`;
              const noFactura = item.v_NoFactura || (item as any).v_NumeroFactura;
              const fechaHora = item.d_FechaHora || (item as any).d_FechaCreacion;
              const montoTotal = item.d_Monto ?? (item as any).f_Total ?? 0;
              const saldoPendiente = item.d_SaldoPendiente ?? (item as any).f_PorCobrar ?? 0;

              return (
                <tr key={keyVal}>
                  {/* Cliente */}
                  <td>
                    <span style={{ fontWeight: 600, color: "#0f172a" }}>
                      {item.v_Empresa}
                    </span>
                  </td>

                  {/* Factura (v_NoFactura) */}
                  <td>
                    {noFactura ? (
                      <span style={{ fontWeight: 600, color: "#1e293b" }}>
                        {noFactura}
                      </span>
                    ) : (
                      <span style={{ fontWeight: 600, color: "#ef4444" }}>
                        Pendiente
                      </span>
                    )}
                  </td>

                  {/* Creación (d_FechaHora) */}
                  <td>
                    {fechaHora ? (
                      <span style={{ color: "#334155" }}>
                        {formatearFechaTexto(fechaHora)}
                      </span>
                    ) : (
                      <span style={{ fontWeight: 500, color: "#ef4444" }}>
                        Pendiente
                      </span>
                    )}
                  </td>

                  {/* Próximo pago */}
                  <td>{renderProximoPago(item)}</td>

                  {/* Total (d_Monto) */}
                  <td style={{ textAlign: "right", fontWeight: 600, color: "#0f172a" }}>
                    {formatearMonto(montoTotal)}
                  </td>

                  {/* Por cobrar (d_SaldoPendiente) */}
                  <td
                    style={{
                      textAlign: "right",
                      fontWeight: 600,
                      color: saldoPendiente <= 0 ? "#16a34a" : "#dc2626",
                    }}
                  >
                    {formatearMonto(saldoPendiente)}
                  </td>

                  {/* Pagos pendientes */}
                  <td style={{ textAlign: "center" }}>
                    {renderPagosPendientesBadge(item)}
                  </td>

                  {/* Estado timbre */}
                  <td style={{ textAlign: "center" }}>
                    {item.b_Timbrada ? (
                      <span className="badge badge-primary">Timbrada</span>
                    ) : (
                      <span className="badge badge-secondary">No timbrada</span>
                    )}
                  </td>

                  {/* Estado (getEstadoFactura) */}
                  <td style={{ textAlign: "center" }}>{renderEstadoBadge(item)}</td>

                  {/* Acciones */}
                  <td style={{ textAlign: "center" }}>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "6px",
                      }}
                    >
                      {/* Ver detalle (siempre visible) */}
                      <button
                        type="button"
                        className="btn-icon"
                        onClick={() => onVerDetalle(item)}
                        title="Ver detalle"
                        style={{ color: "#0284c7" }}
                      >
                        <Eye size={16} />
                      </button>

                      {/* Timbrar factura (oculta si está cancelada) */}
                      {!cancelada && (
                        <button
                          type="button"
                          className="btn-icon"
                          onClick={() => onTimbrar(item)}
                          title="Timbrar factura"
                          style={{ color: "#2563eb" }}
                        >
                          <FileCheck size={16} />
                        </button>
                      )}

                      {/* Cancelar factura (oculta si está cancelada) */}
                      {!cancelada && (
                        <button
                          type="button"
                          className="btn-icon"
                          onClick={() => onCancelar(item)}
                          title="Cancelar factura"
                          style={{ color: "#dc2626" }}
                        >
                          <Ban size={16} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>

      {/* Paginador custom al pie de la tabla */}
      <PaginadorCustom
        paginaActual={paginaActual}
        totalPaginas={totalPaginas}
        totalRegistros={totalRegistros}
        tamano={tamano}
        onCambioPagina={onCambioPagina}
        onCambioTamano={onCambioTamano}
      />
    </div>
  );
};
