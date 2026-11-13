"use client";

import React from "react";
import { Eye, AlertCircle } from "lucide-react";
import { AgendaServicioConsultorGetDto } from "@/types/consultor";
import { BadgeTipoServicio } from "@/components/ui/BadgeTipoServicio";
import { EstadoVacioTabla } from "@/components/ui/EstadoVacioTabla";
import { formatearFechaTexto } from "@/lib/date-utils";
import { VerDocumento } from "@/services/archivos.service";
import {
  CeldaEstatusPipc,
  CeldaEstatusPipcBadge,
} from "@/components/pipc/CeldaEstatusPipc";

const COLOR_VERDE_AVANCE = "#16a34a";
const COLOR_ROJO_ALERTA = "#DC3545";

interface Props {
  datos: AgendaServicioConsultorGetDto[];
  cargando: boolean;
  error?: string | null;
  onVerDetalle: (item: AgendaServicioConsultorGetDto) => void;
}

const BarraAvanceServicio: React.FC<{
  porcentaje: number | null;
}> = ({ porcentaje }) => {
  const pct = Math.min(100, Math.max(0, Math.round(porcentaje ?? 0)));
  const esCero = pct === 0;
  const colorNumero = esCero ? COLOR_ROJO_ALERTA : COLOR_VERDE_AVANCE;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "6px",
        width: "100%",
        minWidth: "130px",
        maxWidth: "170px",
      }}
    >
      <div
        style={{
          flex: 1,
          height: "6px",
          backgroundColor: "#E9EEF3",
          borderRadius: "4px",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${pct}%`,
            height: "100%",
            backgroundColor: COLOR_VERDE_AVANCE,
            borderRadius: "4px",
            transition: "width 0.25s ease",
          }}
        />
      </div>
      <span
        style={{
          fontSize: "11px",
          fontWeight: 600,
          color: colorNumero,
          whiteSpace: "nowrap",
          minWidth: "34px",
          textAlign: "right",
        }}
      >
        {pct} %
      </span>
    </div>
  );
};

export const TablaConsultorServicios: React.FC<Props> = ({
  datos,
  cargando,
  error,
  onVerDetalle,
}) => {
  const renderEstatusBadge = (estatus: number | null) => {
    switch (estatus) {
      case 0:
        return <span className="badge badge-danger">Cancelado</span>;
      case 1:
        return <span className="badge badge-primary">Programado</span>;
      case 2:
        return <span className="badge badge-warning">En curso</span>;
      case 3:
        return <span className="badge badge-success">Terminado</span>;
      case 4:
        return <span className="badge badge-secondary">Reprogramado</span>;
      case 5:
        return (
          <span
            className="badge"
            title="Llegó la fecha de finalización estimada. Falta confirmar que terminó."
            style={{ backgroundColor: "#ffe5d0", color: "#984c0c" }}
          >
            Por confirmar
          </span>
        );
      case 6:
        return <span className="badge badge-primary">PIPC en proceso</span>;
      default:
        return <span className="badge badge-primary">Programado</span>;
    }
  };

  const formatearRangoFechas = (
    inicio: string | null,
    fin: string | null,
    esEstudioOServicio?: boolean
  ) => {
    const txtInicio = inicio ? formatearFechaTexto(inicio) : "";
    const txtFin = fin ? formatearFechaTexto(fin) : "";

    if (txtInicio && txtFin) {
      if (esEstudioOServicio || txtInicio !== txtFin) {
        return `${txtInicio} – ${txtFin}`;
      }
    }
    return txtInicio || txtFin || "—";
  };

  return (
    <div className="alegra-table-container">
      <table className="alegra-table">
        <thead>
          <tr>
            <th>Cliente</th>
            <th>Servicio</th>
            <th>Fechas</th>
            <th>Días</th>
            <th style={{ minWidth: "150px" }}>Estatus</th>
            <th>Titular / Apoyo</th>
            <th>Entregables</th>
            <th
              className="text-center whitespace-nowrap"
              style={{ width: "90px", minWidth: "90px" }}
            >
              Acciones
            </th>
          </tr>
        </thead>
        <tbody>
          {cargando ? (
            Array.from({ length: 5 }).map((_, idx) => (
              <tr key={`sk-servicios-${idx}`}>
                <td>
                  <div
                    className="skeleton-box"
                    style={{ width: "80%", marginBottom: "4px" }}
                  ></div>
                  <div
                    className="skeleton-box sm"
                    style={{ width: "45%" }}
                  ></div>
                </td>
                <td>
                  <div
                    className="skeleton-box"
                    style={{ width: "75%", marginBottom: "4px" }}
                  ></div>
                  <div
                    className="skeleton-box sm"
                    style={{ width: "35%" }}
                  ></div>
                </td>
                <td>
                  <div
                    className="skeleton-box sm"
                    style={{ width: "110px" }}
                  ></div>
                </td>
                <td>
                  <div
                    className="skeleton-box sm"
                    style={{ width: "70px" }}
                  ></div>
                </td>
                <td>
                  <div
                    className="skeleton-box"
                    style={{
                      width: "130px",
                      height: "20px",
                      borderRadius: "10px",
                    }}
                  ></div>
                </td>
                <td>
                  <div
                    className="skeleton-box sm"
                    style={{ width: "70%", marginBottom: "4px" }}
                  ></div>
                  <div
                    className="skeleton-box sm"
                    style={{ width: "40%" }}
                  ></div>
                </td>
                <td>
                  <div
                    className="skeleton-box sm"
                    style={{ width: "90px" }}
                  ></div>
                </td>
                <td className="text-center">
                  <div className="flex items-center justify-center">
                    <div className="skeleton-circle"></div>
                  </div>
                </td>
              </tr>
            ))
          ) : error ? (
            <tr>
              <td colSpan={8} className="text-center py-8">
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <AlertCircle size={24} style={{ color: "#ef4444" }} />
                  <span
                    style={{
                      color: "#ef4444",
                      fontWeight: 600,
                      fontSize: "14px",
                    }}
                  >
                    {error}
                  </span>
                  <span style={{ fontSize: "12px", color: "#64748b" }}>
                    Presiona el botón &quot;Recargar&quot; o cambia los filtros
                    para volver a intentar.
                  </span>
                </div>
              </td>
            </tr>
          ) : datos.length === 0 ? (
            <EstadoVacioTabla colSpan={8} alt="No hay servicios" />
          ) : (
            datos.map((row, idx) => {
              const tieneTitular =
                row.v_Titular &&
                row.v_Titular.trim().length > 0 &&
                row.v_Titular.trim() !== "—";
              const tieneApoyo =
                row.v_Apoyo &&
                row.v_Apoyo.trim().length > 0 &&
                row.v_Apoyo.trim() !== "—";

              const totalEntregables = row.i_TotalEntregables ?? 0;
              const entregados = row.i_EntregablesEntregados ?? 0;
              const bAplicaVoBo = Boolean(row.b_AplicaVoBo);
              const bVoBoEntregado = Boolean(row.b_VoBoEntregado);
              const keyVoBo = row.v_KeyVoBo;

              return (
                <tr
                  key={`servicio-${row.i_CveAgenda || "ag"}-${
                    row.i_CveServAgendaDet || "det"
                  }-${idx}`}
                >
                  {/* 1. Cliente */}
                  <td>
                    <div
                      style={{ fontWeight: 700, color: "#1e3a5f" }}
                      className="uppercase"
                    >
                      {row.v_Empresa || "—"}
                    </div>
                    {row.v_Planta && (
                      <span className="subtext">{row.v_Planta}</span>
                    )}
                  </td>

                  {/* 2. Servicio */}
                  <td>
                    <div
                      style={{
                        fontWeight: 600,
                        color: "#1e3a5f",
                        marginBottom: "2px",
                      }}
                    >
                      {row.v_Servicio || "—"}
                    </div>
                    {row.v_TipoServicio && (
                      <BadgeTipoServicio tipoServicio={row.v_TipoServicio} />
                    )}
                  </td>

                  {/* 3. Fechas */}
                  <td>
                    {(() => {
                      const tipoUpper = (
                        row.v_TipoServicio || ""
                      ).toUpperCase();
                      const esEstudioOServicio =
                        (row as any).i_CveTipoServicio === 3 ||
                        (row as any).i_CveTipoServicio === 6 ||
                        tipoUpper.includes("ESTUDIO") ||
                        tipoUpper.includes("SERVICIO");
                      return (
                        <span style={{ fontSize: "12px", color: "#334155" }}>
                          {formatearRangoFechas(
                            row.d_FechaInicio,
                            row.d_FechaFin,
                            esEstudioOServicio
                          )}
                        </span>
                      );
                    })()}
                  </td>

                  {/* 4. Días */}
                  <td style={{ whiteSpace: "nowrap" }}>
                    {(() => {
                      if (row.i_DiasExcedidos > 0) {
                        const n = row.i_DiasExcedidos;
                        return (
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              padding: "2px 7px",
                              borderRadius: "10px",
                              fontSize: "11px",
                              fontWeight: 600,
                              backgroundColor: "#fee2e2",
                              color: "#b91c1c",
                            }}
                          >
                            {n} {n === 1 ? "día excedido" : "días excedidos"}
                          </span>
                        );
                      }

                      if (row.i_CveEstatus === 3) {
                        const ant = row.i_DiasAnticipacion ?? 0;
                        return (
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              padding: "2px 7px",
                              borderRadius: "10px",
                              fontSize: "11px",
                              fontWeight: 600,
                              backgroundColor: "#d1e7dd",
                              color: "#0f5132",
                            }}
                          >
                            {ant > 0
                              ? `${ant} ${ant === 1 ? "día antes" : "días antes"}`
                              : "A tiempo"}
                          </span>
                        );
                      }

                      if (row.i_DiasRestantes > 0) {
                        const n = row.i_DiasRestantes;
                        return (
                          <span
                            style={{
                              fontSize: "12.5px",
                              fontWeight: 700,
                              color: "#1e293b",
                            }}
                          >
                            {n} {n === 1 ? "día restante" : "días restantes"}
                          </span>
                        );
                      }

                      if (row.i_DiasRestantes === 0) {
                        return (
                          <span
                            style={{
                              fontSize: "12.5px",
                              fontWeight: 700,
                              color: "#d97706",
                            }}
                          >
                            Vence hoy
                          </span>
                        );
                      }

                      return <span style={{ color: "#94a3b8" }}>—</span>;
                    })()}
                  </td>

                  {/* 5. Estatus */}
                  <td>
                    {(() => {
                      const mostrarBarra =
                        row.i_CveEstatus === 2 && row.b_AplicaAvance;
                      const contenidoEstatus = mostrarBarra ? (
                        <BarraAvanceServicio
                          porcentaje={row.i_PorcentajeAvance}
                        />
                      ) : (
                        renderEstatusBadge(row.i_CveEstatus)
                      );

                      if (!row.b_TienePlanContingencia) {
                        return contenidoEstatus;
                      }

                      if (row.i_CveEstatus === 6) {
                        return (
                          <CeldaEstatusPipc
                            row={row}
                            rutaChecklist={(id) => `/mis-servicios/pipc/${id}`}
                            sessionStorageKey="pipc_origen_mis_servicios"
                            ocultarDias
                          />
                        );
                      }

                      return (
                        <CeldaEstatusPipcBadge
                          row={row}
                          badgeNode={contenidoEstatus}
                          rutaChecklist={(id) => `/mis-servicios/pipc/${id}`}
                          sessionStorageKey="pipc_origen_mis_servicios"
                        />
                      );
                    })()}
                  </td>

                  {/* 7. Titular / Apoyo */}
                  <td>
                    {!tieneTitular && !tieneApoyo ? (
                      <span
                        style={{
                          color: "#DC3545",
                          fontWeight: 600,
                          fontSize: "12px",
                        }}
                        title="Pendiente de asignar"
                      >
                        Pendiente
                      </span>
                    ) : (
                      <div>
                        {tieneTitular && (
                          <div className="font-medium text-xs text-slate-800">
                            {row.v_Titular}
                          </div>
                        )}
                        {tieneApoyo && (
                          <span className="subtext text-xs text-slate-500">
                            Apoyo: {row.v_Apoyo}
                          </span>
                        )}
                      </div>
                    )}
                  </td>

                  {/* 8. Entregables */}
                  <td>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "4px",
                      }}
                    >
                      {totalEntregables > 0 ? (
                        entregados >= totalEntregables ? (
                          <span
                            className="badge badge-success"
                            style={{ alignSelf: "flex-start" }}
                          >
                            Completado ({entregados}/{totalEntregables})
                          </span>
                        ) : (
                          <span
                            style={{
                              fontSize: "12px",
                              fontWeight: 500,
                              color: "#475569",
                            }}
                          >
                            {entregados} / {totalEntregables} entregados
                          </span>
                        )
                      ) : (
                        <span style={{ fontSize: "12px", color: "#94a3b8" }}>
                          Sin entregables
                        </span>
                      )}

                      {/* VoBo autoridad si aplica */}
                      {bAplicaVoBo && (
                        <div style={{ marginTop: "2px" }}>
                          {bVoBoEntregado ? (
                            keyVoBo ? (
                              <a
                                href="#"
                                style={{
                                  color: "#2B8FCC",
                                  textDecoration: "underline",
                                  cursor: "pointer",
                                  fontSize: "11px",
                                  fontWeight: 600,
                                }}
                                onClick={(e) => {
                                  e.preventDefault();
                                  VerDocumento(keyVoBo);
                                }}
                                title="Ver visto bueno de la autoridad"
                              >
                                VoBo autoridad ✓
                              </a>
                            ) : (
                              <span
                                style={{
                                  fontSize: "11px",
                                  fontWeight: 600,
                                  color: "#10b981",
                                }}
                              >
                                VoBo autoridad ✓
                              </span>
                            )
                          ) : (
                            <span
                              style={{
                                fontSize: "11px",
                                fontWeight: 600,
                                color: "#d97706",
                              }}
                            >
                              VoBo autoridad pendiente
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </td>

                  {/* 9. Acciones */}
                  <td
                    className="text-center whitespace-nowrap"
                    style={{ width: "90px", minWidth: "90px" }}
                  >
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "6px",
                      }}
                    >
                      <button
                        type="button"
                        className="btn-icon"
                        onClick={() => onVerDetalle(row)}
                        title="Ver detalle del servicio"
                        style={{ color: "#2B8FCC" }}
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
    </div>
  );
};
