"use client";

import React from "react";
import {
  Eye,
  Edit2,
  RefreshCw,
  Ban,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { ActividadConsultor, MomentoActividadConsultor } from "@/types/consultor";
import { formatearFechaTexto } from "@/lib/date-utils";
import { isToday, isSameDay, addDays, format } from "date-fns";
import { es } from "date-fns/locale";

interface Props {
  datos: ActividadConsultor[];
  cargando: boolean;
  error?: string | null;
  onVerHistorial: (item: ActividadConsultor) => void;
  onConfirmarTermino: (item: ActividadConsultor) => void;
  onEditarActividad: (item: ActividadConsultor) => void;
  onReprogramarActividad: (item: ActividadConsultor) => void;
  onCancelarActividad: (item: ActividadConsultor) => void;
}

export function formatearFechaActividadReal(fechaStr: string | null): {
  texto: string;
  esHoy: boolean;
} {
  if (!fechaStr) return { texto: "—", esHoy: false };
  try {
    // Parsear año/mes/día local si viene como YYYY-MM-DD sin zona para evitar desfase UTC
    const clean = fechaStr.split("T")[0];
    const parts = clean.split("-");
    const d =
      parts.length === 3
        ? new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]))
        : new Date(fechaStr);
    if (isNaN(d.getTime())) return { texto: fechaStr, esHoy: false };

    if (isToday(d)) return { texto: "Hoy", esHoy: true };
    const manana = addDays(new Date(), 1);
    if (isSameDay(d, manana)) return { texto: "Mañana", esHoy: false };

    const res = format(d, "dd/MMM/yyyy", { locale: es });
    return { texto: res.replace(/\./g, "").toLowerCase(), esHoy: false };
  } catch {
    return { texto: fechaStr, esHoy: false };
  }
}

export function extraerHoraIso(fechaStr: string | null | undefined): string {
  if (!fechaStr) return "";
  if (fechaStr.includes("T")) {
    const timePart = fechaStr.split("T")[1];
    if (timePart && timePart.length >= 5) {
      return timePart.slice(0, 5);
    }
  }
  try {
    const d = new Date(fechaStr);
    if (isNaN(d.getTime())) return "";
    const hh = String(d.getHours()).padStart(2, "0");
    const mm = String(d.getMinutes()).padStart(2, "0");
    return `${hh}:${mm}`;
  } catch {
    return "";
  }
}

export function formatearHorarioActividadReal(item: {
  b_TieneHorario: boolean;
  v_Momento: MomentoActividadConsultor;
  d_FechaInicio: string;
  d_FechaFin: string;
}): { texto: string; esTodoElDia: boolean } {
  if (!item.b_TieneHorario) {
    return { texto: "Todo el día", esTodoElDia: true };
  }
  const hIni = extraerHoraIso(item.d_FechaInicio);
  const hFin = extraerHoraIso(item.d_FechaFin);

  if (item.v_Momento === "INICIO") {
    return { texto: hIni || "—", esTodoElDia: false };
  }
  if (item.v_Momento === "FIN") {
    return { texto: hFin || hIni || "—", esTodoElDia: false };
  }
  // UNICO
  if (hIni && hFin && hIni !== hFin) {
    return { texto: `${hIni} – ${hFin}`, esTodoElDia: false };
  }
  return { texto: hIni || hFin || "—", esTodoElDia: false };
}

export const renderEstatusActividadBadge = (cveEstatus: number | null) => {
  switch (cveEstatus) {
    case 0:
      return <span className="badge badge-danger">Cancelada</span>;
    case 1:
      return <span className="badge badge-primary">Programado</span>;
    case 2:
    case 6:
      return <span className="badge badge-warning">En curso</span>;
    case 3:
      return <span className="badge badge-success">Terminado</span>;
    case 4:
      return <span className="badge badge-secondary">Reprogramada</span>;
    case 5:
      return (
        <span
          className="badge"
          style={{ backgroundColor: "#ffe5d0", color: "#984c0c" }}
        >
          Por confirmar
        </span>
      );
    default:
      return <span className="badge badge-primary">Programado</span>;
  }
};

export const TablaConsultorSesiones: React.FC<Props> = ({
  datos,
  cargando,
  error,
  onVerHistorial,
  onConfirmarTermino,
  onEditarActividad,
  onReprogramarActividad,
  onCancelarActividad,
}) => {
  return (
    <div className="alegra-table-container">
      <table className="alegra-table">
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Horario</th>
            <th>Cliente</th>
            <th style={{ minWidth: "300px", width: "34%" }}>Actividad</th>
            <th style={{ whiteSpace: "nowrap" }}>Fin compromiso</th>
            <th style={{ whiteSpace: "nowrap" }}>Fin real</th>
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
              <tr key={`sk-actividades-${idx}`}>
                <td>
                  <div
                    className="skeleton-box"
                    style={{ width: "70px", height: "16px" }}
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
                    style={{ width: "85%" }}
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
              <td colSpan={8} className="text-center py-8">
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
            <tr>
              <td colSpan={8} className="text-center py-8 text-secondary">
                No se encontraron sesiones ni actividades. Intenta ajustando los
                filtros de búsqueda.
              </td>
            </tr>
          ) : (
            datos.map((item, idx) => {
              const { texto: fechaTexto, esHoy } = formatearFechaActividadReal(
                item.d_FechaInicio
              );
              const { texto: horarioTexto, esTodoElDia } =
                formatearHorarioActividadReal(item);
              const descripcionLimpia = item.v_Descripcion
                ? item.v_Descripcion.trim()
                : "";
              const esActividadConsultor = item.v_Origen === "ACTIVIDAD";
              const finCompromisoTexto = item.d_FinCompromiso
                ? formatearFechaTexto(item.d_FinCompromiso) || "—"
                : "—";

              const puedeConfirmar = Boolean(
                item.b_RequiereConfirmacion && !item.d_FinReal
              );
              const tooltipConfirmar = puedeConfirmar
                ? "Confirmar terminado"
                : item.b_RequiereConfirmacion && Boolean(item.d_FinReal)
                ? "Ya confirmado"
                : "No requiere confirmación";

              return (
                <tr
                  key={`act-row-${item.v_Origen}-${item.v_Momento}-${
                    item.i_CveActividad ??
                    item.i_CveAgendaDetalle ??
                    item.i_CveServAgendaDet ??
                    idx
                  }-${idx}`}
                  style={esHoy ? { backgroundColor: "#eef6fd" } : undefined}
                >
                  {/* 1. Fecha */}
                  <td>
                    <div
                      style={{
                        fontWeight: esHoy ? 700 : 400,
                        color: esHoy ? "#188ae2" : "#1e3a5f",
                      }}
                    >
                      {fechaTexto}
                    </div>
                  </td>

                  {/* 2. Horario */}
                  <td style={{ whiteSpace: "nowrap" }}>
                    <span
                      style={esTodoElDia ? { color: "#64748b" } : undefined}
                    >
                      {horarioTexto}
                    </span>
                  </td>

                  {/* 3. Cliente */}
                  <td>
                    {item.v_Empresa && item.v_Empresa.trim() ? (
                      <>
                        <div
                          style={{ fontWeight: 700, color: "#1e3a5f" }}
                          className="uppercase"
                        >
                          {item.v_Empresa.trim()}
                        </div>
                        {item.v_Planta && (
                          <span className="subtext">{item.v_Planta}</span>
                        )}
                      </>
                    ) : (
                      <span style={{ color: "#64748b" }}>—</span>
                    )}
                  </td>

                  {/* 4. Actividad (v_Actividad: v_Descripcion sin chip de tipo) */}
                  <td
                    style={{
                      whiteSpace: "normal",
                      wordBreak: "break-word",
                      minWidth: "260px",
                    }}
                  >
                    <div
                      style={{
                        color: "#1e3a5f",
                        lineHeight: 1.4,
                      }}
                    >
                      {descripcionLimpia ? (
                        <>
                          <span style={{ fontWeight: 700 }}>
                            {item.v_Actividad}:
                          </span>{" "}
                          <span style={{ fontWeight: 400 }}>
                            {descripcionLimpia}
                          </span>
                        </>
                      ) : (
                        <span style={{ fontWeight: 700 }}>
                          {item.v_Actividad}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* 5. Fin compromiso */}
                  <td style={{ whiteSpace: "nowrap" }}>
                    <span>{finCompromisoTexto}</span>
                  </td>

                  {/* 6. Fin real */}
                  <td style={{ whiteSpace: "nowrap" }}>
                    {item.v_Origen === "SESION" ? (
                      <span style={{ color: "#64748b" }}>N/A</span>
                    ) : item.b_RequiereConfirmacion && !item.d_FinReal ? (
                      <span style={{ color: "#984c0c", fontWeight: 600 }}>
                        Por confirmar
                      </span>
                    ) : item.d_FinReal ? (
                      <span>{formatearFechaTexto(item.d_FinReal) || "—"}</span>
                    ) : (
                      <span>—</span>
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

                      <span
                        title={tooltipConfirmar}
                        style={{ display: "inline-flex" }}
                      >
                        <button
                          type="button"
                          className="btn-icon"
                          disabled={!puedeConfirmar}
                          onClick={() => {
                            if (puedeConfirmar) {
                              onConfirmarTermino(item);
                            }
                          }}
                          title={tooltipConfirmar}
                          style={{
                            color: puedeConfirmar ? "#16a34a" : "#94a3b8",
                            cursor: puedeConfirmar ? "pointer" : "not-allowed",
                            opacity: puedeConfirmar ? 1 : 0.65,
                          }}
                        >
                          <CheckCircle2 size={16} />
                        </button>
                      </span>

                      {esActividadConsultor && (
                        <>
                          <button
                            type="button"
                            className="btn-icon"
                            onClick={() => onEditarActividad(item)}
                            title="Editar actividad"
                            style={{ color: "#2B8FCC" }}
                          >
                            <Edit2 size={15} />
                          </button>
                          <button
                            type="button"
                            className="btn-icon"
                            onClick={() => onReprogramarActividad(item)}
                            title="Reprogramar actividad"
                            style={{ color: "#d97706" }}
                          >
                            <RefreshCw size={15} />
                          </button>
                          <button
                            type="button"
                            className="btn-icon"
                            onClick={() => onCancelarActividad(item)}
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
