"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, Trash2 } from "lucide-react";
import { AgendaServicioGetDto, EntregableResumenDto } from "@/types/servicios";
import { BadgeTipoServicio } from "@/components/ui/BadgeTipoServicio";
import { formatearFechaCorta, formatearFechaTexto, limpiarDecimales } from "@/lib/date-utils";
import { VerDocumento } from "@/services/archivos.service";
import { diasRestantes, getColorSemaforo } from "@/components/pipc/pipcCalculos";
import { useToast } from "@/context/ToastContext";
import { PipcService, extraerMensajeError } from "@/services/pipc.service";

interface Props {
  datos: AgendaServicioGetDto[];
  cargando: boolean;
  onVerDetalle: (item: AgendaServicioGetDto) => void;
  onEliminar: (item: AgendaServicioGetDto) => void;
}

const CeldaEstatusPipc: React.FC<{ row: AgendaServicioGetDto }> = ({ row }) => {
  const router = useRouter();
  const { toast } = useToast();
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [iniciando, setIniciando] = useState(false);

  const sinIniciar = row.i_AvancePipc === null || row.i_AvancePipc === undefined;
  const pct = sinIniciar ? 0 : Math.min(100, Math.max(0, Math.round(row.i_AvancePipc ?? 0)));
  const colorSemaforo = getColorSemaforo(pct);

  const dias = diasRestantes(row.d_FechaFin);
  let textoDias = "";
  let colorDias = "#64748b";
  let pesoDias: number | string = 400;

  if (dias !== null) {
    if (dias > 1) {
      textoDias = `${dias} días restantes`;
      colorDias = "#64748b";
      pesoDias = 400;
    } else if (dias === 1) {
      textoDias = "1 día restante";
      colorDias = "#64748b";
      pesoDias = 400;
    } else if (dias === 0) {
      textoDias = "Vence hoy";
      colorDias = "#B9770E";
      pesoDias = 600;
    } else {
      const n = Math.abs(dias);
      textoDias = n === 1 ? "Vencido hace 1 día" : `Vencido hace ${n} días`;
      colorDias = "#DC3545";
      pesoDias = 600;
    }
  }

  const lineaInferior = sinIniciar
    ? (textoDias ? `Sin iniciar · ${textoDias}` : "Sin iniciar")
    : textoDias;

  const isActivo = hovered || focused;

  const handleClick = async (e: React.MouseEvent | React.KeyboardEvent) => {
    e.stopPropagation();
    if (iniciando) return;

    if (sinIniciar) {
      setIniciando(true);
      try {
        await PipcService.iniciarChecklist(row.i_CveServAgendaDet);
        if (typeof window !== "undefined") {
          sessionStorage.setItem("pipc_origen_programacion", "1");
        }
        router.push(`/programacion/pipc/${row.i_CveServAgendaDet}`);
      } catch (err: any) {
        toast.error(extraerMensajeError(err, "No se pudo iniciar el checklist PIPC"));
        setIniciando(false);
      }
    } else {
      if (typeof window !== "undefined") {
        sessionStorage.setItem("pipc_origen_programacion", "1");
      }
      router.push(`/programacion/pipc/${row.i_CveServAgendaDet}`);
    }
  };

  return (
    <div
      role="link"
      tabIndex={0}
      aria-label={sinIniciar ? "Iniciar checklist PIPC" : "Ir al checklist PIPC"}
      title={sinIniciar ? "Iniciar checklist PIPC" : "Ir al checklist PIPC"}
      onClick={handleClick}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          handleClick(e);
        }
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={{
        cursor: "pointer",
        display: "flex",
        flexDirection: "column",
        gap: "2px",
        width: "100%",
        minWidth: "125px",
        maxWidth: "160px",
        padding: "4px 6px",
        borderRadius: "6px",
        backgroundColor: isActivo ? "#EAF4FB" : "transparent",
        transition: "background-color 150ms ease",
        userSelect: "none",
        outline: focused ? "2px solid #2B8FCC" : "none",
        outlineOffset: "1px",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
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
              width: sinIniciar ? "0%" : `${pct}%`,
              height: "100%",
              backgroundColor: colorSemaforo,
              borderRadius: "4px",
              transition: "width 0.3s ease",
            }}
          />
        </div>
        <span
          style={{
            fontSize: "12px",
            fontWeight: 600,
            color: colorSemaforo,
            lineHeight: 1,
            whiteSpace: "nowrap",
          }}
        >
          {pct} %
        </span>
      </div>
      <div
        style={{
          fontSize: "11px",
          lineHeight: 1.2,
          fontWeight: isActivo ? 600 : pesoDias,
          color: isActivo ? "#2B8FCC" : colorDias,
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
          display: "flex",
          alignItems: "center",
          gap: "4px",
          minHeight: "14px",
        }}
      >
        {isActivo ? (
          <>
            <span>{sinIniciar ? (iniciando ? "Iniciando…" : "Iniciar checklist") : "Ir al checklist"}</span>
            <i className="bi bi-box-arrow-up-right" style={{ fontSize: "10px" }} />
          </>
        ) : (
          <span>{lineaInferior}</span>
        )}
      </div>
    </div>
  );
};

const CeldaEstatusPipcBadge: React.FC<{
  row: AgendaServicioGetDto;
  badgeNode: React.ReactNode;
}> = ({ row, badgeNode }) => {
  const router = useRouter();
  const { toast } = useToast();
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [iniciando, setIniciando] = useState(false);

  const esCanceladoOReprogramado = row.i_CveEstatus === 0 || row.i_CveEstatus === 4;
  const sinIniciar = row.i_AvancePipc === null || row.i_AvancePipc === undefined;

  // Si está cancelado o reprogramado y sin iniciar: sin hover ni clic (§1.1)
  if (esCanceladoOReprogramado && sinIniciar) {
    return <>{badgeNode}</>;
  }

  const isActivo = hovered || focused;
  const labelAria = esCanceladoOReprogramado
    ? "Ver checklist PIPC"
    : sinIniciar
    ? "Iniciar checklist PIPC"
    : "Ir al checklist PIPC";

  const handleClick = async (e: React.MouseEvent | React.KeyboardEvent) => {
    e.stopPropagation();
    if (iniciando) return;

    if (esCanceladoOReprogramado) {
      if (!sinIniciar) {
        if (typeof window !== "undefined") {
          sessionStorage.setItem("pipc_origen_programacion", "1");
        }
        router.push(`/programacion/pipc/${row.i_CveServAgendaDet}`);
      }
      return;
    }

    if (sinIniciar) {
      setIniciando(true);
      try {
        await PipcService.iniciarChecklist(row.i_CveServAgendaDet);
        if (typeof window !== "undefined") {
          sessionStorage.setItem("pipc_origen_programacion", "1");
        }
        router.push(`/programacion/pipc/${row.i_CveServAgendaDet}`);
      } catch (err: any) {
        toast.error(extraerMensajeError(err, "No se pudo iniciar el checklist PIPC"));
        setIniciando(false);
      }
    } else {
      if (typeof window !== "undefined") {
        sessionStorage.setItem("pipc_origen_programacion", "1");
      }
      router.push(`/programacion/pipc/${row.i_CveServAgendaDet}`);
    }
  };

  return (
    <div
      role="link"
      tabIndex={0}
      aria-label={labelAria}
      title={labelAria}
      onClick={handleClick}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          handleClick(e);
        }
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        padding: "4px 6px",
        borderRadius: "6px",
        backgroundColor: isActivo ? "#EAF4FB" : "transparent",
        transition: "background-color 150ms ease",
        cursor: "pointer",
        outline: focused ? "2px solid #2B8FCC" : "none",
        outlineOffset: "1px",
        userSelect: "none",
      }}
    >
      {badgeNode}
      <i
        className="bi bi-box-arrow-up-right"
        style={{
          fontSize: "12px",
          color: "#2B8FCC",
          visibility: isActivo ? "visible" : "hidden",
          flexShrink: 0,
          lineHeight: 1,
        }}
      />
    </div>
  );
};

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

  return (
    <div className="alegra-table-container">
      <table className="alegra-table">
        <thead>
          <tr>
            <th>Cliente</th>
            <th>Servicio</th>
            <th>Tipo</th>
            <th>Fechas</th>
            <th style={{ minWidth: "135px" }}>Estatus</th>
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

                  {/* 4. Fechas */}
                  <td>
                    {row.b_SinProgramar ? (
                      <span style={{ color: "#dc3545", fontWeight: 500, fontSize: "12px" }}>Pendiente de programar</span>
                    ) : (() => {
                      const tipoUpper = (row.v_TipoServicio || "").toUpperCase();
                      const esEstudioOServicio =
                        (row as any).i_CveTipoServicio === 3 ||
                        (row as any).i_CveTipoServicio === 6 ||
                        tipoUpper.includes("ESTUDIO") ||
                        tipoUpper.includes("SERVICIO");
                      if (esEstudioOServicio && row.d_FechaInicio && row.d_FechaFin) {
                        return (
                          <span>
                            {formatearFechaTexto(row.d_FechaInicio)} – {formatearFechaTexto(row.d_FechaFin)}
                          </span>
                        );
                      }
                      return (
                        <span>{formatearFechaTexto(row.d_FechaInicio) || formatearFechaCorta(row.d_FechaInicio)}</span>
                      );
                    })()}
                  </td>


                  {/* 5. Estatus */}
                  <td>
                    {(() => {
                      if (!row.b_TienePlanContingencia) {
                        return renderEstatusBadge(row.i_CveEstatus, row.b_SinProgramar);
                      }

                      if (row.i_CveEstatus === 6 && !row.b_SinProgramar) {
                        return <CeldaEstatusPipc row={row} />;
                      }

                      return (
                        <CeldaEstatusPipcBadge
                          row={row}
                          badgeNode={renderEstatusBadge(row.i_CveEstatus, row.b_SinProgramar)}
                        />
                      );
                    })()}
                  </td>

                  {/* 6. Titular / Apoyo */}
                  <td>
                    {(() => {
                      const fuentes = [
                        row.v_Titular,
                        (row as any).v_Titulares,
                        (row as any).v_Instructores,
                        row.v_Apoyo,
                        (row as any).v_Apoyos,
                        (row as any).v_Proveedor,
                        (row as any).v_Proveedores,
                        (row as any).v_NombreProveedor,
                      ];

                      const nombresSet = new Set<string>();
                      const nombresLista: string[] = [];

                      for (const f of fuentes) {
                        if (!f || typeof f !== "string") continue;
                        const partes = f.split(",").map((s) => s.trim()).filter(Boolean);
                        for (const p of partes) {
                          if (
                            p === "-" ||
                            p === "—" ||
                            p.toLowerCase() === "sin instructor" ||
                            p.toLowerCase() === "sin apoyo"
                          ) {
                            continue;
                          }
                          const keyLower = p.toLowerCase();
                          if (!nombresSet.has(keyLower)) {
                            nombresSet.add(keyLower);
                            nombresLista.push(p);
                          }
                        }
                      }

                      if (nombresLista.length === 0) {
                        return (
                          <span
                            style={{ color: "#DC3545", fontWeight: 600, fontSize: "13px" }}
                            title="Pendiente de asignar"
                          >
                            Pendiente
                          </span>
                        );
                      }

                      return (
                        <div className="font-medium" style={{ fontSize: "13px", color: "#1e3a5f" }}>
                          {nombresLista.join(", ")}
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

                      const partes: React.ReactNode[] = [];

                      if (list.length > 0) {
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

                        // 1. Entregados con v_Key -> link <a> azul #2B8FCC con subrayado
                        gruposConKeyMap.forEach((nombres, key) => {
                          const labelText = nombres.join(", ");
                          partes.push(
                            <a
                              key={`ent-group-${key}`}
                              href="#"
                              style={{
                                color: "#2B8FCC",
                                textDecoration: "underline",
                                cursor: "pointer",
                                fontSize: "12px",
                                fontWeight: 500,
                                whiteSpace: "nowrap",
                              }}
                              onClick={(e) => {
                                e.preventDefault();
                                VerDocumento(key);
                              }}
                              title={`Ver documento: ${labelText}`}
                            >
                              {labelText}
                            </a>
                          );
                        });

                        // 2. Entregados sin v_Key -> texto plano
                        entregadosSinKey.forEach((nombre, idx) => {
                          partes.push(
                            <span
                              key={`ent-nokey-${idx}`}
                              style={{ color: "#1e293b", fontSize: "12px", fontWeight: 400, whiteSpace: "nowrap" }}
                            >
                              {nombre}
                            </span>
                          );
                        });

                        // 3. Pendientes (b_Entregado = false) -> texto rojo sin link
                        pendientes.forEach((item, idx) => {
                          partes.push(
                            <span
                              key={`ent-pend-${idx}`}
                              style={{ color: "#dc3545", fontWeight: 500, fontSize: "12px", whiteSpace: "nowrap" }}
                            >
                              {item.v_Nombre}
                            </span>
                          );
                        });
                      } else {
                        const texto = (row as any).v_Entregables || "";
                        if (typeof texto === "string" && texto.trim()) {
                          const items: string[] = texto.split(",").map((s: string) => s.trim()).filter(Boolean);
                          items.forEach((item: string, iIdx: number) => {
                            partes.push(
                              <span key={`ent-txt-${iIdx}`} style={{ color: "#dc3545", fontWeight: 500, fontSize: "12px", whiteSpace: "nowrap" }}>
                                {item}
                              </span>
                            );
                          });
                        }
                      }

                      // VoBo autoridad (si aplica) se agrega AL FINAL de la lista
                      const bAplicaVoBo = Boolean(row.b_AplicaVoBo ?? (row as any).b_aplicaVoBo ?? (row as any).bAplicaVoBo);
                      const bVoBoEntregado = Boolean(row.b_VoBoEntregado ?? (row as any).b_voBoEntregado ?? (row as any).bVoBoEntregado);
                      const keyVoBo = row.v_KeyVoBo || (row as any).v_keyVoBo || (row as any).vKeyVoBo || null;

                      if (bAplicaVoBo) {
                        if (bVoBoEntregado) {
                          partes.push(
                            <a
                              key="vobo-entregado-link"
                              href="#"
                              style={{
                                color: "#2B8FCC",
                                textDecoration: "underline",
                                cursor: "pointer",
                                fontSize: "12px",
                                fontWeight: 500,
                                whiteSpace: "nowrap",
                              }}
                              onClick={(e) => {
                                e.preventDefault();
                                if (keyVoBo) {
                                  VerDocumento(keyVoBo);
                                } else {
                                  onVerDetalle(row);
                                }
                              }}
                              title="Ver visto bueno de la autoridad"
                            >
                              VoBo autoridad
                            </a>
                          );
                        } else {
                          partes.push(
                            <span
                              key="vobo-pendiente"
                              style={{ color: "#dc3545", fontWeight: 500, fontSize: "12px", whiteSpace: "nowrap" }}
                            >
                              VoBo autoridad
                            </span>
                          );
                        }
                      }

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
                      const numCot = row.v_NoCotizacionGI && row.v_NoCotizacionGI.trim() !== "" ? row.v_NoCotizacionGI.trim() : null;
                      const keyCot = row.v_KeyCotizacion && row.v_KeyCotizacion.trim() !== "" ? row.v_KeyCotizacion.trim() : null;

                      if (keyCot) {
                        return (
                          <a
                            href="#"
                            style={{
                              color: "#2B8FCC",
                              textDecoration: "underline",
                              cursor: "pointer",
                              fontSize: "12px",
                              fontWeight: 500,
                            }}
                            onClick={(e) => {
                              e.preventDefault();
                              VerDocumento(keyCot);
                            }}
                            title="Consultar Cotización"
                          >
                            {numCot || "Cotización"}
                          </a>
                        );
                      }

                      if (numCot && numCot.toLowerCase() !== "pendiente") {
                        return <span style={{ color: "#1e293b", fontSize: "12px", fontWeight: 400 }}>{numCot}</span>;
                      }

                      return <span style={{ color: "#dc3545", fontWeight: 500, fontSize: "12px" }}>Pendiente</span>;
                    })()}
                  </td>

                  {/* 9. OC cliente */}
                  <td>
                    {(() => {
                      const numOC = row.v_NoOrdenCompraCliente && row.v_NoOrdenCompraCliente.trim() !== "" ? row.v_NoOrdenCompraCliente.trim() : null;
                      const keyOC = row.v_KeyOC && row.v_KeyOC.trim() !== "" ? row.v_KeyOC.trim() : null;

                      if (keyOC) {
                        return (
                          <a
                            href="#"
                            style={{
                              color: "#2B8FCC",
                              textDecoration: "underline",
                              cursor: "pointer",
                              fontSize: "12px",
                              fontWeight: 500,
                            }}
                            onClick={(e) => {
                              e.preventDefault();
                              VerDocumento(keyOC);
                            }}
                            title="Consultar Orden de Compra"
                          >
                            {numOC || "OC"}
                          </a>
                        );
                      }

                      if (numOC && numOC.toLowerCase() !== "pendiente") {
                        return <span style={{ color: "#1e293b", fontSize: "12px", fontWeight: 400 }}>{numOC}</span>;
                      }

                      return <span style={{ color: "#dc3545", fontWeight: 500, fontSize: "12px" }}>Pendiente</span>;
                    })()}
                  </td>

                  {/* 10. Facturas: solo texto plano, nunca es link */}
                  <td>
                    {row.v_Facturas && row.v_Facturas.trim() !== "" && row.v_Facturas.toLowerCase() !== "pendiente" ? (
                      <span style={{ color: "#1e293b", fontSize: "12px", fontWeight: 400 }}>{row.v_Facturas}</span>
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
