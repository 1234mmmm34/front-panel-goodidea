"use client";

import React from "react";
import { RefreshCw } from "lucide-react";
import { AgendaGetDto } from "@/types/calendario";
import { BadgeTipoServicio } from "@/components/ui/BadgeTipoServicio";
import { isToday, isSameDay, addDays, format } from "date-fns";
import { es } from "date-fns/locale";
import { limpiarDecimales } from "@/lib/date-utils";

interface Props {
  datos: AgendaGetDto[];
  cargando: boolean;
  onReprogramar: (item: AgendaGetDto) => void;
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

const renderEstatusBadge = (cveEstatus: number | null) => {
  switch (cveEstatus) {
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

export const TablaAgendaSesiones: React.FC<Props> = ({
  datos,
  cargando,
  onReprogramar,
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
            <th className="text-center">Acciones</th>
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
          ) : datos.length === 0 ? (
            <tr>
              <td colSpan={10} className="text-center py-8 text-secondary">
                No se encontraron registros de sesiones. Intenta ajustando los filtros de búsqueda.
              </td>
            </tr>
          ) : (
            datos.map((item, idx) => {
              const { texto: fechaTexto, esHoy } = formatearFechaSesion(item.d_FechaInicio);
              const horaIniStr = formatearHoraSesion(item.d_FechaInicio);
              const horaFinStr = formatearHoraSesion(item.d_FechaFin);

              const tieneTitular = item.v_Titular && item.v_Titular.trim().length > 0 && item.v_Titular.trim() !== "—";
              const tieneApoyo = item.v_Apoyo && item.v_Apoyo.trim().length > 0 && item.v_Apoyo.trim() !== "—";

              return (
                <tr
                  key={item.i_CveAgendaDetalle || item.i_CveAgenda || idx}
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
                    <span>{horaIniStr || "—"}</span>
                  </td>

                  {/* 3. Hora fin */}
                  <td>
                    <span>{horaFinStr || "—"}</span>
                  </td>

                  {/* 4. Cliente */}
                  <td>
                    <div style={{ fontWeight: 700, color: "#1e3a5f" }} className="uppercase">
                      {item.v_Empresa || "—"}
                    </div>
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
                      <span className="text-slate-400">—</span>
                    ) : (
                      <div>
                        {tieneTitular && <div className="font-medium">{item.v_Titular}</div>}
                        {tieneApoyo && <span className="subtext">Apoyo: {item.v_Apoyo}</span>}
                      </div>
                    )}
                  </td>

                  {/* 9. Total */}
                  <td>
                    <span>{limpiarDecimales(item.v_Total)}</span>
                  </td>

                  {/* 10. Acciones */}
                  <td className="text-center">
                    <div className="flex items-center justify-center">
                      <button
                        type="button"
                        className="btn-icon"
                        onClick={() => onReprogramar(item)}
                        title="Reprogramar sesión"
                        style={{ color: "#d97706" }}
                      >
                        <RefreshCw size={16} />
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
