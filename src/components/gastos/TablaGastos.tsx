"use client";

import { Eye } from "lucide-react";
import { FacturaProv } from "@/types/gastos";
import { PaginadoResponse } from "@/types/servicios";
import { PaginadorCustom } from "@/components/ui/PaginadorCustom";
import { formatearFechaTexto } from "@/lib/date-utils";

interface Props {
  datosPaginados: PaginadoResponse<FacturaProv> | null;
  cargando: boolean;
  paginaActual: number;
  tamano: number;
  onVerDetalle: (gasto: FacturaProv) => void;
  onProgramarPago?: (gasto: FacturaProv) => void;
  onCancelarGasto: (gasto: FacturaProv) => void;
  onCambioPagina: (pagina: number) => void;
  onCambioTamano: (tamano: number) => void;
}

export const TablaGastos: React.FC<Props> = ({
  datosPaginados,
  cargando,
  paginaActual,
  tamano,
  onVerDetalle,
  onProgramarPago,
  onCancelarGasto,
  onCambioPagina,
  onCambioTamano,
}) => {
  const formatearMonto = (monto: number): string => {
    const val = isNaN(monto) ? 0 : monto;
    return `$${val.toLocaleString("es-MX", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const obtenerEstadoProximoPago = (fechaStr: string): "vencido" | "proximo" | "normal" => {
    if (!fechaStr) return "normal";
    const fechaSolo = fechaStr.split("T")[0];
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const [year, month, day] = fechaSolo.split("-").map(Number);
    const fechaPago = new Date(year, month - 1, day);
    fechaPago.setHours(0, 0, 0, 0);

    const diffMs = fechaPago.getTime() - hoy.getTime();
    const diffDias = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDias < 0) return "vencido";
    if (diffDias <= 5) return "proximo";
    return "normal";
  };

  const renderProximoPagoCell = (item: FacturaProv) => {
    const cancelada = Boolean(item.b_Cancelada);
    const saldo = item.d_SaldoPendiente ?? 0;

    if (cancelada || saldo <= 0) {
      return (
        <td style={{ color: "#64748b", fontWeight: 500, fontSize: "12px" }}>
          Sin deuda
        </td>
      );
    }

    if (!item.d_ProximoPago) {
      return (
        <td style={{ backgroundColor: "#fee2e2", color: "#991b1b", fontWeight: 600, fontSize: "12px" }}>
          Sin programar
        </td>
      );
    }

    const estadoPago = obtenerEstadoProximoPago(item.d_ProximoPago);
    const textoFecha = formatearFechaTexto(item.d_ProximoPago);

    if (estadoPago === "vencido") {
      return (
        <td
          style={{
            backgroundColor: "#fee2e2",
            color: "#991b1b",
            fontWeight: 600,
            fontSize: "12px",
          }}
          title="Próximo pago vencido"
        >
          {textoFecha}
        </td>
      );
    }

    if (estadoPago === "proximo") {
      return (
        <td
          style={{
            backgroundColor: "#fef9c3",
            color: "#854d0e",
            fontWeight: 600,
            fontSize: "12px",
          }}
          title="Próximo pago vence en 5 días o menos"
        >
          {textoFecha}
        </td>
      );
    }

    return (
      <td style={{ color: "#334155", fontWeight: 500, fontSize: "12px" }}>
        {textoFecha}
      </td>
    );
  };

  const renderPagosPendientesBadge = (item: FacturaProv) => {
    const cancelada = Boolean(item.b_Cancelada);
    const saldo = item.d_SaldoPendiente ?? 0;

    if (cancelada) {
      return <span className="badge badge-danger">Cancelada</span>;
    }

    if (saldo <= 0) {
      return <span className="badge badge-success">Pagado</span>;
    }

    if (item.i_PagosPendientes > 0) {
      const label = item.i_PagosPendientes === 1 ? "1 pendiente" : `${item.i_PagosPendientes} pendientes`;
      return <span className="badge badge-warning">{label}</span>;
    }

    return <span style={{ color: "#ef4444", fontWeight: 600, fontSize: "12px" }}>Sin programar</span>;
  };

  const renderEstadoBadge = (item: FacturaProv) => {
    const cancelada = Boolean(item.b_Cancelada);
    const estado = item.v_EstadoPago || "Sin pagar";

    if (cancelada) {
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

    if (item.d_SaldoPendiente <= 0 || estado === "Pagada") {
      return <span className="badge badge-success">Pagada</span>;
    }

    if (estado === "Abonada") {
      return <span className="badge badge-warning">Abonada</span>;
    }

    return <span className="badge badge-secondary">Sin pagar</span>;
  };

  const datos = datosPaginados?.datos || [];
  const totalPaginas = datosPaginados?.totalPaginas || 1;
  const totalRegistros = datosPaginados?.total || 0;

  return (
    <div className="alegra-table-container">
      <table className="alegra-table">
        <thead>
          <tr>
            <th>Proveedor</th>
            <th>OC prov.</th>
            <th>Cotización prov.</th>
            <th>Servicios</th>
            <th>Fecha del servicio</th>
            <th>Próximo pago</th>
            <th style={{ textAlign: "right" }}>Total s/IVA</th>
            <th style={{ textAlign: "right" }}>Total c/IVA</th>
            <th style={{ textAlign: "right" }}>Por pagar</th>
            <th style={{ textAlign: "center" }}>Pagos pendientes</th>
            <th style={{ textAlign: "center" }}>Estado</th>
            <th style={{ textAlign: "center", width: "110px" }}>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {cargando ? (
            Array.from({ length: 5 }).map((_, idx) => (
              <tr key={`sk-gastos-${idx}`}>
                <td>
                  <div className="skeleton-box" style={{ width: "80%", marginBottom: "4px" }}></div>
                </td>
                <td><div className="skeleton-box sm" style={{ width: "70px" }}></div></td>
                <td><div className="skeleton-box sm" style={{ width: "70px" }}></div></td>
                <td><div className="skeleton-box sm" style={{ width: "120px" }}></div></td>
                <td><div className="skeleton-box sm" style={{ width: "85px" }}></div></td>
                <td><div className="skeleton-box sm" style={{ width: "85px" }}></div></td>
                <td style={{ textAlign: "right" }}>
                  <div className="skeleton-box sm" style={{ width: "65px", marginLeft: "auto" }}></div>
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
                  <div className="flex items-center justify-center gap-1.5">
                    <div className="skeleton-circle"></div>
                    <div className="skeleton-circle"></div>
                  </div>
                </td>
              </tr>
            ))
          ) : datos.length === 0 ? (
            <tr>
              <td colSpan={12} style={{ textAlign: "center", padding: "28px 16px", color: "#475569", fontSize: "13px" }}>
                No se encontraron gastos con los filtros seleccionados.
              </td>
            </tr>
          ) : (
            datos.map((item, idx) => {
              const cancelada = Boolean(item.b_Cancelada);
              const keyVal = item.i_CveFacturaProv || `gasto-${idx}`;
              const totalSinIva = item.d_Monto ? item.d_Monto / 1.16 : 0;

              return (
                <tr key={keyVal}>
                  {/* Proveedor */}
                  <td>
                    <span style={{ fontWeight: 600, color: "#0f172a" }}>
                      {item.v_Proveedor || "—"}
                    </span>
                  </td>

                  {/* OC prov. */}
                  <td>
                    {item.v_NoOrdenCompraProv ? (
                      <span style={{ fontWeight: 600, color: "#1e293b" }}>
                        {item.v_NoOrdenCompraProv}
                      </span>
                    ) : (
                      <span style={{ color: "#94a3b8" }}>—</span>
                    )}
                  </td>

                  {/* Cotización prov. */}
                  <td>
                    <span style={{ color: "#334155" }}>
                      {item.v_NoCotizacionProv || "—"}
                    </span>
                  </td>

                  {/* Servicios */}
                  <td title={item.v_Servicio || ""}>
                    <span style={{ color: "#334155" }}>
                      {item.v_Servicio || "—"}
                    </span>
                  </td>

                  {/* Fecha del servicio */}
                  <td>
                    {item.d_FechaHora ? (
                      <span style={{ color: "#334155" }}>
                        {formatearFechaTexto(item.d_FechaHora)}
                      </span>
                    ) : (
                      <span style={{ color: "#94a3b8" }}>—</span>
                    )}
                  </td>

                  {/* Próximo pago */}
                  {renderProximoPagoCell(item)}

                  {/* Total s/IVA */}
                  <td style={{ textAlign: "right", color: "#334155" }}>
                    {formatearMonto(totalSinIva)}
                  </td>

                  {/* Total c/IVA */}
                  <td style={{ textAlign: "right", fontWeight: 600, color: "#0f172a" }}>
                    <div>{formatearMonto(item.d_Monto)}</div>
                    {item.d_PorcentajeDescuento && item.d_PorcentajeDescuento > 0 ? (
                      <div style={{ fontSize: "11px", fontWeight: 400, color: "#64748b", marginTop: "1px" }}>
                        −{item.d_PorcentajeDescuento}% desc.
                      </div>
                    ) : null}
                  </td>

                  {/* Por pagar */}
                  <td
                    style={{
                      textAlign: "right",
                      fontWeight: 600,
                      color: item.d_SaldoPendiente <= 0 ? "#16a34a" : "#dc2626",
                    }}
                  >
                    {formatearMonto(item.d_SaldoPendiente)}
                  </td>

                  {/* Pagos pendientes */}
                  <td style={{ textAlign: "center" }}>
                    {renderPagosPendientesBadge(item)}
                  </td>

                  {/* Estado */}
                  <td style={{ textAlign: "center" }}>
                    {renderEstadoBadge(item)}
                  </td>

                  {/* Acciones */}
                  <td style={{ textAlign: "center" }}>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {/* Ver detalle */}
                      <button
                        type="button"
                        className="btn-icon"
                        onClick={() => onVerDetalle(item)}
                        title="Ver detalle de gasto"
                        style={{ color: "#0284c7" }}
                      >
                        <Eye size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>

      {/* Paginador custom */}
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
