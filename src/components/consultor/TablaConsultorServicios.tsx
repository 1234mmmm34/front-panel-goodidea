"use client";

import React from "react";
import { Eye, AlertCircle } from "lucide-react";
import { AgendaServicioConsultorGetDto } from "@/types/consultor";
import { BadgeTipoServicio } from "@/components/ui/BadgeTipoServicio";
import { formatearFechaTexto } from "@/lib/date-utils";
import { VerDocumento } from "@/services/archivos.service";

interface Props {
  datos: AgendaServicioConsultorGetDto[];
  cargando: boolean;
  error?: string | null;
  onVerDetalle: (item: AgendaServicioConsultorGetDto) => void;
}

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
      default:
        return <span className="badge badge-primary">Programado</span>;
    }
  };

  const formatearRangoFechas = (inicio: string | null, fin: string | null) => {
    const txtInicio = inicio ? formatearFechaTexto(inicio) : "";
    const txtFin = fin ? formatearFechaTexto(fin) : "";

    if (txtInicio && txtFin && txtInicio !== txtFin) {
      return `${txtInicio} – ${txtFin}`;
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
            <th>Estatus</th>
            <th>Titular / Apoyo</th>
            <th>Entregables</th>
            <th className="text-center whitespace-nowrap" style={{ width: "90px", minWidth: "90px" }}>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {cargando ? (
            Array.from({ length: 5 }).map((_, idx) => (
              <tr key={`sk-servicios-${idx}`}>
                <td>
                  <div className="skeleton-box" style={{ width: "80%", marginBottom: "4px" }}></div>
                  <div className="skeleton-box sm" style={{ width: "45%" }}></div>
                </td>
                <td>
                  <div className="skeleton-box" style={{ width: "75%", marginBottom: "4px" }}></div>
                  <div className="skeleton-box sm" style={{ width: "35%" }}></div>
                </td>
                <td>
                  <div className="skeleton-box sm" style={{ width: "110px" }}></div>
                </td>
                <td>
                  <div className="skeleton-box" style={{ width: "75px", height: "20px", borderRadius: "10px" }}></div>
                </td>
                <td>
                  <div className="skeleton-box sm" style={{ width: "70%", marginBottom: "4px" }}></div>
                  <div className="skeleton-box sm" style={{ width: "40%" }}></div>
                </td>
                <td>
                  <div className="skeleton-box sm" style={{ width: "90px" }}></div>
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
              <td colSpan={7} className="text-center py-8">
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
                  <AlertCircle size={24} style={{ color: "#ef4444" }} />
                  <span style={{ color: "#ef4444", fontWeight: 600, fontSize: "14px" }}>
                    {error}
                  </span>
                  <span style={{ fontSize: "12px", color: "#64748b" }}>
                    Presiona el botón &quot;Recargar&quot; o cambia los filtros para volver a intentar.
                  </span>
                </div>
              </td>
            </tr>
          ) : datos.length === 0 ? (
            <tr>
              <td colSpan={7} className="text-center py-8 text-secondary">
                No se encontraron servicios agendados. Intenta ajustando los filtros de búsqueda.
              </td>
            </tr>
          ) : (
            datos.map((row, idx) => {
              const tieneTitular = row.v_Titular && row.v_Titular.trim().length > 0 && row.v_Titular.trim() !== "—";
              const tieneApoyo = row.v_Apoyo && row.v_Apoyo.trim().length > 0 && row.v_Apoyo.trim() !== "—";

              const totalEntregables = row.i_TotalEntregables ?? 0;
              const entregados = row.i_EntregablesEntregados ?? 0;
              const bAplicaVoBo = Boolean(row.b_AplicaVoBo);
              const bVoBoEntregado = Boolean(row.b_VoBoEntregado);
              const keyVoBo = row.v_KeyVoBo;

              return (
                <tr key={`servicio-${row.i_CveAgenda || 'ag'}-${row.i_CveServAgendaDet || 'det'}-${idx}`}>
                  {/* 1. Cliente */}
                  <td>
                    <div style={{ fontWeight: 700, color: "#1e3a5f" }} className="uppercase">
                      {row.v_Empresa || "—"}
                    </div>
                    {row.v_Planta && (
                      <span className="subtext">{row.v_Planta}</span>
                    )}
                  </td>

                  {/* 2. Servicio */}
                  <td>
                    <div style={{ fontWeight: 600, color: "#1e3a5f", marginBottom: "2px" }}>
                      {row.v_Servicio || "—"}
                    </div>
                    {row.v_TipoServicio && (
                      <BadgeTipoServicio tipoServicio={row.v_TipoServicio} />
                    )}
                  </td>

                  {/* 3. Fechas */}
                  <td>
                    <span style={{ fontSize: "12px", color: "#334155" }}>
                      {formatearRangoFechas(row.d_FechaInicio, row.d_FechaFin)}
                    </span>
                  </td>

                  {/* 4. Estatus */}
                  <td>{renderEstatusBadge(row.i_CveEstatus)}</td>

                  {/* 5. Titular / Apoyo */}
                  <td>
                    {!tieneTitular && !tieneApoyo ? (
                      <span className="text-slate-400">—</span>
                    ) : (
                      <div>
                        {tieneTitular && <div className="font-medium text-xs text-slate-800">{row.v_Titular}</div>}
                        {tieneApoyo && <span className="subtext text-xs text-slate-500">Apoyo: {row.v_Apoyo}</span>}
                      </div>
                    )}
                  </td>

                  {/* 6. Entregables */}
                  <td>
                    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                      {totalEntregables > 0 ? (
                        entregados >= totalEntregables ? (
                          <span className="badge badge-success" style={{ alignSelf: "flex-start" }}>
                            Completado ({entregados}/{totalEntregables})
                          </span>
                        ) : (
                          <span style={{ fontSize: "12px", fontWeight: 500, color: "#475569" }}>
                            {entregados} / {totalEntregables} entregados
                          </span>
                        )
                      ) : (
                        <span style={{ fontSize: "12px", color: "#94a3b8" }}>Sin entregables</span>
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
                              <span style={{ fontSize: "11px", fontWeight: 600, color: "#10b981" }}>
                                VoBo autoridad ✓
                              </span>
                            )
                          ) : (
                            <span style={{ fontSize: "11px", fontWeight: 600, color: "#d97706" }}>
                              VoBo autoridad pendiente
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </td>

                  {/* 7. Acciones */}
                  <td className="text-center whitespace-nowrap" style={{ width: "90px", minWidth: "90px" }}>
                    <div style={{ display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: "6px" }}>
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
