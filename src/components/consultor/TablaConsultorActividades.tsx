"use client";

import React from "react";
import {
  Eye,
  Edit2,
  Ban,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import {
  ActividadPendienteConsultor,
  ActividadPersonal,
  PrioridadActividad,
} from "@/types/consultor";
import { formatearFechaTexto } from "@/lib/date-utils";
import { EstadoVacioTabla } from "@/components/ui/EstadoVacioTabla";
import { renderEstatusActividadBadge } from "./TablaConsultorSesiones";

interface Props {
  datos: (ActividadPendienteConsultor | ActividadPersonal)[];
  cargando: boolean;
  error?: string | null;
  hayFiltrosActivos?: boolean;
  mostrarPersonal?: boolean;
  onVerHistorial: (item: ActividadPendienteConsultor) => void;
  onConfirmar: (item: ActividadPendienteConsultor) => void;
  onEditar: (item: ActividadPendienteConsultor) => void;
  onCancelar: (item: ActividadPendienteConsultor) => void;
}

export const renderPrioridadActividadBadge = (
  prioridad: PrioridadActividad | number,
  etiqueta?: string | null
) => {
  if (prioridad === 1) {
    return (
      <span
        className="badge"
        style={{ backgroundColor: "#f8d7da", color: "#842029" }}
      >
        {etiqueta || "Alta"}
      </span>
    );
  }
  if (prioridad === 2) {
    return (
      <span
        className="badge"
        style={{ backgroundColor: "#fff3cd", color: "#856404" }}
      >
        {etiqueta || "Media"}
      </span>
    );
  }
  return (
    <span
      className="badge"
      style={{ backgroundColor: "#d1e7dd", color: "#0f5132" }}
    >
      {etiqueta || "Baja"}
    </span>
  );
};

export const TablaConsultorActividades: React.FC<Props> = ({
  datos,
  cargando,
  error,
  mostrarPersonal = false,
  onVerHistorial,
  onConfirmar,
  onEditar,
  onCancelar,
}) => {
  const totalColumnas = mostrarPersonal ? 9 : 8;

  return (
    <div className="alegra-table-container">
      <table className="alegra-table">
        <thead>
          <tr>
            {mostrarPersonal && <th style={{ minWidth: "160px" }}>Personal</th>}
            <th style={{ minWidth: "240px" }}>Título</th>
            <th style={{ minWidth: "220px" }}>Proyecto</th>
            <th style={{ whiteSpace: "nowrap" }}>Fecha inicio</th>
            <th style={{ whiteSpace: "nowrap" }}>Fin compromiso</th>
            <th style={{ whiteSpace: "nowrap" }}>Fin real</th>
            <th style={{ whiteSpace: "nowrap" }}>Prioridad</th>
            <th>Estatus</th>
            <th
              className="text-center"
              style={{ width: "150px", minWidth: "150px" }}
            >
              Acciones
            </th>
          </tr>
        </thead>
        <tbody>
          {cargando ? (
            Array.from({ length: 5 }).map((_, idx) => (
              <tr key={`sk-act-pend-${idx}`}>
                {mostrarPersonal && (
                  <td>
                    <div
                      className="skeleton-box"
                      style={{ width: "75%", height: "16px" }}
                    ></div>
                  </td>
                )}
                <td>
                  <div
                    className="skeleton-box"
                    style={{ width: "85%", height: "16px" }}
                  ></div>
                </td>
                <td>
                  <div
                    className="skeleton-box"
                    style={{ width: "80%", marginBottom: "4px" }}
                  ></div>
                  <div
                    className="skeleton-box sm"
                    style={{ width: "50%" }}
                  ></div>
                </td>
                <td>
                  <div
                    className="skeleton-box sm"
                    style={{ width: "75px" }}
                  ></div>
                </td>
                <td>
                  <div
                    className="skeleton-box sm"
                    style={{ width: "75px" }}
                  ></div>
                </td>
                <td>
                  <div
                    className="skeleton-box sm"
                    style={{ width: "75px" }}
                  ></div>
                </td>
                <td>
                  <div
                    className="skeleton-box"
                    style={{
                      width: "60px",
                      height: "20px",
                      borderRadius: "10px",
                    }}
                  ></div>
                </td>
                <td>
                  <div
                    className="skeleton-box"
                    style={{
                      width: "75px",
                      height: "20px",
                      borderRadius: "10px",
                    }}
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
              <td colSpan={totalColumnas} className="text-center py-8">
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "8px",
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
            <EstadoVacioTabla colSpan={totalColumnas} alt="No hay actividades" />
          ) : (
            datos.map((item) => {
              const esPropia = "b_EsPropia" in item ? item.b_EsPropia : true;
              const nombrePersonal = "v_Personal" in item ? item.v_Personal : "";
              const esVencida = item.i_CveEstatus === 5;
              const fechaInicioTexto = item.d_FechaInicio
                ? formatearFechaTexto(item.d_FechaInicio) || "—"
                : "—";
              const finCompromisoTexto = item.d_FinCompromiso
                ? formatearFechaTexto(item.d_FinCompromiso) || "—"
                : "—";

              return (
                <tr key={`act-pend-row-${item.i_CveActividad}`}>
                  {/* 0. Personal (opcional) */}
                  {mostrarPersonal && (
                    <td>
                      <div
                        style={{
                          fontWeight: 600,
                          color: "#1e293b",
                          fontSize: "13px",
                          lineHeight: 1.35,
                        }}
                      >
                        {nombrePersonal || "—"}
                      </div>
                      {esPropia && (
                        <span
                          style={{
                            display: "inline-block",
                            marginTop: "4px",
                            padding: "1px 7px",
                            borderRadius: "4px",
                            background: "#f1f5f9",
                            color: "#475569",
                            fontSize: "11px",
                            fontWeight: 600,
                            lineHeight: 1.4,
                          }}
                        >
                          Mía
                        </span>
                      )}
                    </td>
                  )}

                  {/* 1. Título */}
                  <td
                    style={{
                      minWidth: "240px",
                      whiteSpace: "normal",
                      wordBreak: "break-word",
                    }}
                  >
                    <div
                      style={{
                        fontWeight: 700,
                        color: "#1e3a5f",
                        lineHeight: 1.4,
                      }}
                    >
                      {item.v_Titulo}
                    </div>
                  </td>

                  {/* 2. Proyecto */}
                  <td
                    style={{
                      minWidth: "220px",
                      whiteSpace: "normal",
                    }}
                  >
                    {item.i_CveServAgendaDet != null ? (
                      <>
                        <div
                          style={{
                            fontWeight: 700,
                            color: "#1e3a5f",
                            lineHeight: 1.35,
                          }}
                        >
                          {item.v_Proyecto}
                        </div>
                        {item.v_Empresa && item.v_Empresa.trim() && (
                          <span className="subtext">
                            {item.v_Empresa.trim().toUpperCase()}
                            {item.v_Planta ? ` · ${item.v_Planta}` : ""}
                          </span>
                        )}
                      </>
                    ) : (
                      <span
                        style={{
                          fontWeight: 700,
                          color: "#64748b",
                        }}
                      >
                        GENERAL
                      </span>
                    )}
                  </td>

                  {/* 3. Fecha inicio */}
                  <td style={{ whiteSpace: "nowrap" }}>
                    <span>{fechaInicioTexto}</span>
                  </td>

                  {/* 4. Fin compromiso */}
                  <td style={{ whiteSpace: "nowrap" }}>
                    <span
                      style={
                        esVencida
                          ? { color: "#dc3545", fontWeight: 700 }
                          : undefined
                      }
                    >
                      {finCompromisoTexto}
                    </span>
                  </td>

                  {/* 5. Fin real */}
                  <td style={{ whiteSpace: "nowrap" }}>
                    <span style={{ color: "#984c0c", fontWeight: 600 }}>
                      Por confirmar
                    </span>
                  </td>

                  {/* 6. Prioridad */}
                  <td style={{ whiteSpace: "nowrap" }}>
                    {renderPrioridadActividadBadge(
                      item.i_Prioridad,
                      item.v_Prioridad
                    )}
                  </td>

                  {/* 7. Estatus */}
                  <td>{renderEstatusActividadBadge(item.i_CveEstatus)}</td>

                  {/* 8. Acciones */}
                  <td
                    className="text-center whitespace-nowrap"
                    style={{ width: "150px", minWidth: "150px" }}
                  >
                    <div
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "6px",
                      }}
                    >
                      <button
                        type="button"
                        className="btn-icon"
                        onClick={() => onVerHistorial(item)}
                        title="Historial de actividades"
                        style={{ color: "#188ae2" }}
                      >
                        <Eye size={16} />
                      </button>

                      {esPropia && (
                        <>
                          <button
                            type="button"
                            className="btn-icon"
                            onClick={() => onConfirmar(item)}
                            title="Confirmar terminado"
                            style={{ color: "#16a34a" }}
                          >
                            <CheckCircle2 size={16} />
                          </button>

                          <button
                            type="button"
                            className="btn-icon"
                            onClick={() => onEditar(item)}
                            title="Editar actividad"
                            style={{ color: "#2B8FCC" }}
                          >
                            <Edit2 size={15} />
                          </button>

                          <button
                            type="button"
                            className="btn-icon"
                            onClick={() => onCancelar(item)}
                            title="Cancelar actividad"
                            style={{ color: "#dc3545" }}
                          >
                            <Ban size={15} />
                          </button>
                        </>
                      )}
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

