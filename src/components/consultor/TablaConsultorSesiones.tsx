"use client";

import React from "react";
import { Eye, AlertCircle } from "lucide-react";
import { AgendaGetDto } from "@/types/calendario";
import { BadgeTipoServicio } from "@/components/ui/BadgeTipoServicio";
import { isToday, isSameDay, addDays, format } from "date-fns";
import { es } from "date-fns/locale";
import { limpiarDecimales } from "@/lib/date-utils";

interface Props {
  datos: AgendaGetDto[];
  cargando: boolean;
  error?: string | null;
  onVerDetalle: (item: AgendaGetDto) => void;
}

function formatearFechaSesion(fechaStr: string | null): { texto: string; esHoy: boolean } {
  if (!fechaStr) return { texto: "—", esHoy: false };
  try {
    const d = new Date(fechaStr);
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

const renderEstatusBadge = (cveEstatus: number | null, motivoCancelacion?: string | null) => {
  switch (cveEstatus) {
    case 0:
      return (
        <span
          className="badge badge-danger"
          title={motivoCancelacion || "Sesión cancelada"}
          style={{ cursor: motivoCancelacion ? "help" : "default" }}
        >
          Cancelado
        </span>
      );
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

export const TablaConsultorSesiones: React.FC<Props> = ({
  datos,
  cargando,
  error,
  onVerDetalle,
}) => {
  return (
    <div className="alegra-table-container">
      <table className="alegra-table">
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Horario</th>
            <th>Cliente</th>
            <th>Servicio</th>
            <th>Duración</th>
            <th>Titular / Apoyo</th>
            <th>Estatus</th>
            <th className="text-center" style={{ width: "90px", minWidth: "90px" }}>Acciones</th>
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
                  <div className="skeleton-box sm" style={{ width: "75px" }}></div>
                </td>
                <td>
                  <div className="skeleton-box" style={{ width: "80%", marginBottom: "4px" }}></div>
                </td>
                <td>
                  <div className="skeleton-box" style={{ width: "75%", marginBottom: "4px" }}></div>
                  <div className="skeleton-box sm" style={{ width: "50px" }}></div>
                </td>
                <td>
                  <div className="skeleton-box sm" style={{ width: "50px" }}></div>
                </td>
                <td>
                  <div className="skeleton-box sm" style={{ width: "70%", marginBottom: "4px" }}></div>
                  <div className="skeleton-box sm" style={{ width: "40%" }}></div>
                </td>
                <td>
                  <div className="skeleton-box" style={{ width: "75px", height: "20px", borderRadius: "10px" }}></div>
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
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
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
              <td colSpan={8} className="text-center py-8 text-secondary">
                No se encontraron registros de sesiones. Intenta ajustando los filtros de búsqueda.
              </td>
            </tr>
          ) : (
            datos.map((item, idx) => {
              const { texto: fechaTexto, esHoy } = formatearFechaSesion(item.d_FechaInicio);
              const horaIniStr = formatearHoraSesion(item.d_FechaInicio);
              const horaFinStr = formatearHoraSesion(item.d_FechaFin);
              const horarioTexto =
                horaIniStr && horaFinStr
                  ? `${horaIniStr} – ${horaFinStr}`
                  : horaIniStr || horaFinStr || "—";

              const tieneTitular = item.v_Titular && item.v_Titular.trim().length > 0 && item.v_Titular.trim() !== "—";
              const tieneApoyo = item.v_Apoyo && item.v_Apoyo.trim().length > 0 && item.v_Apoyo.trim() !== "—";

              return (
                <tr
                  key={`sesion-${item.i_CveAgendaDetalle || 'det'}-${item.i_CveAgenda || 'ag'}-${idx}`}
                  style={esHoy ? { backgroundColor: "#eef6fd" } : undefined}
                >
                  {/* 1. Fecha */}
                  <td>
                    <div style={{ fontWeight: esHoy ? 700 : 500, color: esHoy ? "#188ae2" : "#1e3a5f" }}>
                      {fechaTexto}
                    </div>
                  </td>

                  {/* 2. Horario */}
                  <td>
                    <span style={{ fontSize: "12px", color: "#334155" }}>{horarioTexto}</span>
                  </td>

                  {/* 3. Cliente */}
                  <td>
                    <div style={{ fontWeight: 700, color: "#1e3a5f" }} className="uppercase">
                      {item.v_Empresa || "—"}
                    </div>
                  </td>

                  {/* 4. Servicio */}
                  <td>
                    <div style={{ fontWeight: 600, color: "#1e3a5f", marginBottom: "2px" }}>
                      {item.v_Servicio || "—"}
                    </div>
                    {item.v_TipoServicio && (
                      <BadgeTipoServicio tipoServicio={item.v_TipoServicio} />
                    )}
                  </td>

                  {/* 5. Duración */}
                  <td>
                    <span>{limpiarDecimales(item.v_Total)}</span>
                  </td>

                  {/* 6. Titular / Apoyo */}
                  <td>
                    {!tieneTitular && !tieneApoyo ? (
                      <span className="text-slate-400">—</span>
                    ) : (
                      <div>
                        {tieneTitular && <div className="font-medium text-xs text-slate-800">{item.v_Titular}</div>}
                        {tieneApoyo && <span className="subtext text-xs text-slate-500">Apoyo: {item.v_Apoyo}</span>}
                      </div>
                    )}
                  </td>

                  {/* 7. Estatus */}
                  <td>{renderEstatusBadge(item.i_CveEstatus, item.v_MotivoCancelacion)}</td>

                  {/* 8. Acciones */}
                  <td className="text-center whitespace-nowrap" style={{ width: "90px", minWidth: "90px" }}>
                    <div style={{ display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: "6px" }}>
                      <button
                        type="button"
                        className="btn-icon"
                        onClick={() => onVerDetalle(item)}
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
