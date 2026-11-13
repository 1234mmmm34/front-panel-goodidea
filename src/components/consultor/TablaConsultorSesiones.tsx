"use client";

import React from "react";
import { Eye, AlertCircle } from "lucide-react";
import { AgendaGetDto } from "@/types/calendario";
import { MomentoActividadConsultor } from "@/types/consultor";
import { BadgeTipoServicio } from "@/components/ui/BadgeTipoServicio";
import { EstadoVacioTabla } from "@/components/ui/EstadoVacioTabla";
import { limpiarDecimales } from "@/lib/date-utils";
import { isToday, isSameDay, addDays, format } from "date-fns";
import { es } from "date-fns/locale";

interface Props {
  datos: AgendaGetDto[];
  cargando: boolean;
  error?: string | null;
  onVerLineaTiempo: (item: AgendaGetDto) => void;
}

/* ------------------------------------------------------------------
 * Helpers compartidos (usados por la vista Actividades, el historial
 * de actividades y ModalDetalleServicioConsultor).
 * ------------------------------------------------------------------ */

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

/* ------------------------------------------------------------------
 * Helpers de la tabla de sesiones (copiados de
 * programacion/TablaAgendaSesiones.tsx).
 * ------------------------------------------------------------------ */

function formatearFechaSesion(fechaStr: string | null): { texto: string; esHoy: boolean } {
  if (!fechaStr) return { texto: "—", esHoy: false };
  try {
    let d: Date;
    if (/^\d{4}-\d{2}-\d{2}$/.test(fechaStr)) {
      const [year, month, day] = fechaStr.split("-").map(Number);
      d = new Date(year, month - 1, day);
    } else {
      d = new Date(fechaStr);
    }
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

function formatearHoraSesion(fechaStr: string | null): string {
  if (!fechaStr) return "—";
  try {
    const d = new Date(fechaStr);
    if (isNaN(d.getTime())) return "—";

    const hh = String(d.getHours()).padStart(2, "0");
    const mm = String(d.getMinutes()).padStart(2, "0");
    const hora = `${hh}:${mm}`;

    if (hora === "00:00") return "";
    return hora;
  } catch {
    return "—";
  }
}

const renderEstatusBadge = (cveEstatus: number | null) => {
  switch (cveEstatus) {
    case 0:
      return <span className="badge badge-danger">Cancelado</span>;
    case 1:
      return <span className="badge badge-primary">Programado</span>;
    case 2:
    case 6:
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
    default:
      return <span className="badge badge-primary">Programado</span>;
  }
};

export const TablaConsultorSesiones: React.FC<Props> = ({
  datos,
  cargando,
  error,
  onVerLineaTiempo,
}) => {
  return (
    <div className="alegra-table-container">
      <table className="alegra-table">
        <thead>
          <tr>
            <th>Fecha inicio</th>
            <th>Hora inicio</th>
            <th>Hora fin</th>
            <th>Cliente</th>
            <th>Estatus</th>
            <th>Tema</th>
            <th>Tipo</th>
            <th>Titular / Apoyo</th>
            <th>Total</th>
            <th className="text-center" style={{ width: "60px", minWidth: "60px" }}>
              Acciones
            </th>
          </tr>
        </thead>
        <tbody>
          {cargando ? (
            Array.from({ length: 5 }).map((_, idx) => (
              <tr key={`sk-sesiones-${idx}`}>
                <td>
                  <div className="skeleton-box" style={{ width: "70px", height: "16px" }}></div>
                </td>
                <td>
                  <div className="skeleton-box sm" style={{ width: "45px" }}></div>
                </td>
                <td>
                  <div className="skeleton-box sm" style={{ width: "45px" }}></div>
                </td>
                <td>
                  <div className="skeleton-box" style={{ width: "80%", marginBottom: "4px" }}></div>
                </td>
                <td>
                  <div className="skeleton-box" style={{ width: "75px", height: "20px", borderRadius: "10px" }}></div>
                </td>
                <td>
                  <div className="skeleton-box" style={{ width: "75%", marginBottom: "4px" }}></div>
                </td>
                <td>
                  <div className="skeleton-box" style={{ width: "70px", height: "20px", borderRadius: "10px" }}></div>
                </td>
                <td>
                  <div className="skeleton-box sm" style={{ width: "70%", marginBottom: "4px" }}></div>
                  <div className="skeleton-box sm" style={{ width: "40%" }}></div>
                </td>
                <td>
                  <div className="skeleton-box sm" style={{ width: "50px" }}></div>
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
              <td colSpan={10} className="text-center py-8">
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
            <EstadoVacioTabla colSpan={10} alt="No hay sesiones" />
          ) : (
            datos.map((item, idx) => {
              const { texto: fechaTexto, esHoy } = formatearFechaSesion(item.d_FechaInicio);
              const horaIniStr = formatearHoraSesion(item.d_FechaInicio);
              const horaFinStr = formatearHoraSesion(item.d_FechaFin);

              const tieneTitular = item.v_Titular && item.v_Titular.trim().length > 0 && item.v_Titular.trim() !== "—";
              const tieneApoyo = item.v_Apoyo && item.v_Apoyo.trim().length > 0 && item.v_Apoyo.trim() !== "—";
              const tipoUpper = (item.v_TipoServicio || "").toUpperCase();
              const esEstudioOServicio =
                (item as any).i_CveTipoServicio === 3 ||
                (item as any).i_CveTipoServicio === 6 ||
                tipoUpper.includes("ESTUDIO") ||
                tipoUpper.includes("SERVICIO");

              return (
                <tr
                  key={`sesion-${item.i_CveAgendaDetalle || "det"}-${item.i_CveAgenda || "ag"}-${idx}`}
                  style={esHoy ? { backgroundColor: "#eef6fd" } : undefined}
                >
                  {/* 1. Fecha inicio */}
                  <td>
                    <div style={{ fontWeight: esHoy ? 700 : 400, color: esHoy ? "#188ae2" : "#1e3a5f" }}>
                      {fechaTexto}
                    </div>
                  </td>

                  {/* 2. Hora inicio */}
                  <td>
                    <span>{esEstudioOServicio ? "—" : (horaIniStr || "—")}</span>
                  </td>

                  {/* 3. Hora fin */}
                  <td>
                    <span>{esEstudioOServicio ? "—" : (horaFinStr || "—")}</span>
                  </td>

                  {/* 4. Cliente */}
                  <td>
                    <div style={{ fontWeight: 700, color: "#1e3a5f" }} className="uppercase">
                      {item.v_Empresa || "—"}
                    </div>
                    {item.v_Planta && item.v_Planta.trim() !== "" && (
                      <span className="subtext">{item.v_Planta}</span>
                    )}
                  </td>

                  {/* 5. Estatus */}
                  <td>{renderEstatusBadge(item.i_CveEstatus)}</td>

                  {/* 6. Tema (Servicio) */}
                  <td>
                    <div style={{ fontWeight: 700, color: "#1e3a5f" }}>
                      {item.v_Servicio || "—"}
                    </div>
                  </td>

                  {/* 7. Tipo */}
                  <td>
                    <BadgeTipoServicio tipoServicio={item.v_TipoServicio} />
                  </td>

                  {/* 8. Titular / Apoyo */}
                  <td>
                    {!tieneTitular && !tieneApoyo ? (
                      <span
                        style={{ color: "#DC3545", fontWeight: 600, fontSize: "13px" }}
                        title="Pendiente de asignar"
                      >
                        Pendiente
                      </span>
                    ) : (
                      <div>
                        {tieneTitular && <div className="font-medium">{item.v_Titular}</div>}
                        {tieneApoyo && <span className="subtext">Apoyo: {item.v_Apoyo}</span>}
                      </div>
                    )}
                  </td>

                  {/* 9. Total (duración o cantidad, no monto) */}
                  <td>
                    <span>{limpiarDecimales(item.v_Total)}</span>
                  </td>

                  {/* 10. Acciones */}
                  <td className="text-center whitespace-nowrap" style={{ width: "60px", minWidth: "60px" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <button
                        type="button"
                        className="btn-icon"
                        onClick={() => onVerLineaTiempo(item)}
                        title="Sesiones"
                        style={{ color: "#188ae2" }}
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
