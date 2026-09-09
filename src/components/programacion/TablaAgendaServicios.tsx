"use client";

import React from "react";
import { Eye, Trash2 } from "lucide-react";
import { AgendaServicioGetDto, EntregableResumenDto } from "@/types/servicios";
import { BadgeTipoServicio } from "@/components/ui/BadgeTipoServicio";
import { formatearFechaCorta, limpiarDecimales } from "@/lib/date-utils";
import { VerDocumento } from "@/services/archivos.service";

interface Props {
  datos: AgendaServicioGetDto[];
  cargando: boolean;
  onVerDetalle: (item: AgendaServicioGetDto) => void;
  onEliminar: (item: AgendaServicioGetDto) => void;
}

export const TablaAgendaServicios: React.FC<Props> = ({
  datos,
  cargando,
  onVerDetalle,
  onEliminar,
}) => {
  const renderEstatusBadge = (estatus: number | null, sinProgramar: boolean) => {
    if (sinProgramar) {
      return <span className="badge badge-warning">Pendiente</span>;
    }
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

  return (
    <div className="alegra-table-container">
      <table className="alegra-table">
        <thead>
          <tr>
            <th>Cliente</th>
            <th>Servicio</th>
            <th>Tipo</th>
            <th>Fecha de inicio</th>
            <th>Estatus</th>
            <th>Titular / Apoyo</th>
            <th>Entregables</th>
            <th>Cot. GI</th>
            <th>OC cliente</th>
            <th>Facturas</th>
            <th className="text-center whitespace-nowrap" style={{ width: "90px", minWidth: "90px" }}>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {cargando ? (
            Array.from({ length: 5 }).map((_, idx) => (
              <tr key={`sk-agenda-${idx}`}>
                <td>
                  <div className="skeleton-box" style={{ width: "80%", marginBottom: "4px" }}></div>
                  <div className="skeleton-box sm" style={{ width: "45%" }}></div>
                </td>
                <td>
                  <div className="skeleton-box" style={{ width: "75%", marginBottom: "4px" }}></div>
                  <div className="skeleton-box sm" style={{ width: "35%" }}></div>
                </td>
                <td>
                  <div className="skeleton-box" style={{ width: "70px", height: "20px", borderRadius: "10px" }}></div>
                </td>
                <td>
                  <div className="skeleton-box sm" style={{ width: "85px" }}></div>
                </td>
                <td>
                  <div className="skeleton-box" style={{ width: "75px", height: "20px", borderRadius: "10px" }}></div>
                </td>
                <td>
                  <div className="skeleton-box sm" style={{ width: "70%", marginBottom: "4px" }}></div>
                  <div className="skeleton-box sm" style={{ width: "40%" }}></div>
                </td>
                <td>
                  <div className="skeleton-box sm" style={{ width: "65%" }}></div>
                </td>
                <td>
                  <div className="skeleton-box sm" style={{ width: "50px" }}></div>
                </td>
                <td>
                  <div className="skeleton-box sm" style={{ width: "50px" }}></div>
                </td>
                <td>
                  <div className="skeleton-box sm" style={{ width: "50px" }}></div>
                </td>
                <td className="text-center">
                  <div className="flex items-center justify-center gap-1.5">
                    <div className="skeleton-circle"></div>
                    <div className="skeleton-circle"></div>
                  </div>
                </td>
              </tr>
            ))
          ) : datos.length === 0 ? (
            <tr>
              <td colSpan={11} className="text-center py-8 text-secondary">
                No se encontraron registros de servicios agendados.
              </td>
            </tr>
          ) : (
            datos.map((row, idx) => {
              return (
                <tr key={`${row.i_CveAgenda}-${row.i_CveServAgendaDet}-${idx}`}>
                  {/* 1. Cliente */}
                  <td>
                    <div style={{ fontWeight: 700, color: "#1e3a5f" }} className="uppercase">
                      {row.v_Empresa || "—"}
                    </div>
                    {row.v_Planta && <span className="subtext">{row.v_Planta}</span>}
                  </td>

                  {/* 2. Servicio */}
                  <td>
                    <div style={{ fontWeight: 700, color: "#1e3a5f" }}>
                      {row.v_Servicio || "—"}
                    </div>
                    <span className="subtext">
                      {limpiarDecimales(row.i_Cantidad)} {row.v_Unidad || ""}
                    </span>
                  </td>

                  {/* 3. Tipo */}
                  <td>
                    <BadgeTipoServicio tipoServicio={row.v_TipoServicio} />
                  </td>

                  {/* 4. Fecha de inicio */}
                  <td>
                    {row.b_SinProgramar ? (
                      <span style={{ color: "#dc3545", fontWeight: 500, fontSize: "12px" }}>Pendiente de programar</span>
                    ) : (
                      <span>{formatearFechaCorta(row.d_FechaInicio)}</span>
                    )}
                  </td>


                  {/* 5. Estatus */}
                  <td>{renderEstatusBadge(row.i_CveEstatus, row.b_SinProgramar)}</td>

                  {/* 6. Titular / Apoyo */}
                  <td>
                    {(() => {
                      const titularVal =
                        row.v_Titular &&
                        row.v_Titular.trim() !== "" &&
                        row.v_Titular.trim() !== "-" &&
                        row.v_Titular.trim() !== "—"
                          ? row.v_Titular.trim()
                          : null;

                      const apoyoVal =
                        row.v_Apoyo &&
                        row.v_Apoyo.trim() !== "" &&
                        row.v_Apoyo.trim() !== "-" &&
                        row.v_Apoyo.trim() !== "—"
                          ? row.v_Apoyo.trim()
                          : null;

                      if (!titularVal && !apoyoVal) {
                        return null;
                      }

                      return (
                        <div>
                          {titularVal && <div className="font-medium">{titularVal}</div>}
                          {apoyoVal && <span className="subtext">Apoyo: {apoyoVal}</span>}
                        </div>
                      );
                    })()}
                  </td>

                  {/* 7. Entregables */}
                  <td>
                    {(() => {
                      let list: EntregableResumenDto[] = [];
                      if (row.v_EntregablesJson && row.v_EntregablesJson.trim() !== "") {
                        try {
                          const parsed = JSON.parse(row.v_EntregablesJson);
                          if (Array.isArray(parsed)) list = parsed;
                        } catch {
                          list = [];
                        }
                      }
                      if (list.length === 0 && row.entregablesParseados && row.entregablesParseados.length > 0) {
                        list = row.entregablesParseados;
                      }

                      if (list.length === 0) {
                        const texto = (row as any).v_Entregables || "";
                        if (typeof texto === "string" && texto.trim()) {
                          const items: string[] = texto.split(",").map((s: string) => s.trim()).filter(Boolean);
                          return (
                            <div className="flex flex-wrap items-center gap-x-1 gap-y-0.5">
                              {items.map((item: string, iIdx: number) => (
                                <React.Fragment key={`ent-txt-${iIdx}`}>
                                  <span style={{ color: "#dc3545", fontWeight: 500, fontSize: "12px" }}>{item}</span>
                                  {iIdx < items.length - 1 && <span className="text-slate-400 text-xs">, </span>}
                                </React.Fragment>
                              ))}
                            </div>
                          );
                        }
                        return <span style={{ color: "#dc3545", fontWeight: 500, fontSize: "12px" }}>Pendiente</span>;
                      }

                      const entregados = list.filter((item) => item.b_Entregado);
                      const pendientes = list.filter((item) => !item.b_Entregado);

                      const gruposConKeyMap = new Map<string, string[]>();
                      const entregadosSinKey: string[] = [];

                      for (const item of entregados) {
                        const key = item.v_Key && item.v_Key.trim() !== "" ? item.v_Key.trim() : null;
                        if (key) {
                          const actual = gruposConKeyMap.get(key) || [];
                          actual.push(item.v_Nombre);
                          gruposConKeyMap.set(key, actual);
                        } else {
                          entregadosSinKey.push(item.v_Nombre);
                        }
                      }

                      const partes: React.ReactNode[] = [];

                      // 1. Entregados con v_Key -> link azul subrayado
                      gruposConKeyMap.forEach((nombres, key) => {
                        const labelText = nombres.join(", ");
                        partes.push(
                          <button
                            key={`ent-group-${key}`}
                            className="text-blue-600 underline font-medium hover:text-blue-800 cursor-pointer text-xs text-left"
                            onClick={() => VerDocumento(key)}
                            title={`Ver documento: ${labelText}`}
                          >
                            {labelText}
                          </button>
                        );
                      });

                      // 2. Entregados sin v_Key -> texto plano negro
                      entregadosSinKey.forEach((nombre, idx) => {
                        partes.push(
                          <span key={`ent-nokey-${idx}`} className="text-slate-800 text-xs font-normal">
                            {nombre}
                          </span>
                        );
                      });

                      // 3. Pendientes (b_Entregado = false) -> texto rojo
                      pendientes.forEach((item, idx) => {
                        partes.push(
                          <span key={`ent-pend-${idx}`} style={{ color: "#dc3545", fontWeight: 500, fontSize: "12px" }}>
                            {item.v_Nombre}
                          </span>
                        );
                      });

                      if (partes.length === 0) {
                        return <span style={{ color: "#dc3545", fontWeight: 500, fontSize: "12px" }}>Pendiente</span>;
                      }

                      return (
                        <div className="flex flex-wrap items-center gap-x-1 gap-y-0.5">
                          {partes.map((part, pIdx) => (
                            <React.Fragment key={pIdx}>
                              {part}
                              {pIdx < partes.length - 1 && <span className="text-slate-400 text-xs">, </span>}
                            </React.Fragment>
                          ))}
                        </div>
                      );
                    })()}
                  </td>

                  {/* 8. Cot. GI */}
                  <td>
                    {(() => {
                      const tieneCotizacion = row.b_TieneCotizacion;
                      const numCot = row.v_NoCotizacionGI && row.v_NoCotizacionGI.trim() !== "" ? row.v_NoCotizacionGI.trim() : null;
                      const keyCot = row.v_KeyCotizacion && row.v_KeyCotizacion.trim() !== "" ? row.v_KeyCotizacion.trim() : null;

                      if (tieneCotizacion && keyCot) {
                        return (
                          <button
                            className="text-blue-600 underline font-medium hover:text-blue-800 cursor-pointer text-xs"
                            onClick={() => VerDocumento(keyCot)}
                            title="Consultar Cotización"
                          >
                            {numCot || "Cotización"}
                          </button>
                        );
                      }

                      if (tieneCotizacion && numCot && numCot.toLowerCase() !== "pendiente") {
                        return <span className="text-slate-800 text-xs font-normal">{numCot}</span>;
                      }

                      return <span style={{ color: "#dc3545", fontWeight: 500, fontSize: "12px" }}>Pendiente</span>;
                    })()}
                  </td>

                  {/* 9. OC cliente */}
                  <td>
                    {(() => {
                      const tieneOC = row.b_TieneOC;
                      const numOC = row.v_NoOrdenCompraCliente && row.v_NoOrdenCompraCliente.trim() !== "" ? row.v_NoOrdenCompraCliente.trim() : null;
                      const keyOC = row.v_KeyOC && row.v_KeyOC.trim() !== "" ? row.v_KeyOC.trim() : null;

                      if (tieneOC && keyOC) {
                        return (
                          <button
                            className="text-blue-600 underline font-medium hover:text-blue-800 cursor-pointer text-xs"
                            onClick={() => VerDocumento(keyOC)}
                            title="Consultar Orden de Compra"
                          >
                            {numOC || "OC"}
                          </button>
                        );
                      }

                      if (tieneOC && numOC && numOC.toLowerCase() !== "pendiente") {
                        return <span className="text-slate-800 text-xs font-normal">{numOC}</span>;
                      }

                      return <span style={{ color: "#dc3545", fontWeight: 500, fontSize: "12px" }}>Pendiente</span>;
                    })()}
                  </td>

                  {/* 10. Facturas: solo texto plano, nunca es link */}
                  <td>
                    {row.v_Facturas && row.v_Facturas.trim() !== "" && row.v_Facturas.toLowerCase() !== "pendiente" ? (
                      <span className="text-slate-800 text-xs font-normal">{row.v_Facturas}</span>
                    ) : (
                      <span style={{ color: "#dc3545", fontWeight: 500, fontSize: "12px" }}>Pendiente</span>
                    )}
                  </td>


                  {/* 11. Acciones */}
                  <td className="text-center whitespace-nowrap" style={{ width: "90px", minWidth: "90px" }}>
                    <div className="flex items-center justify-center gap-1 flex-nowrap" style={{ flexWrap: "nowrap" }}>
                      <button
                        className="btn-icon"
                        onClick={() => onVerDetalle(row)}
                        title="Ver detalle"
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        className="btn-icon danger"
                        onClick={() => onEliminar(row)}
                        title="Eliminar agenda"
                      >
                        <Trash2 size={16} />
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
