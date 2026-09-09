"use client";

import React, { useEffect, useState, useMemo } from "react";
import {
  X,
  Check,
  ChevronLeft,
  Loader2,
  Building2,
  FileText,
  CheckCircle2,
  PackageCheck,
} from "lucide-react";
import { entregables } from "@/types/catalogos";
import { CatalogosService } from "@/services/catalogos.service";
import {
  InstructorGetDto,
  ProveedorGetDto,
  ServiciosDropdownDto,
} from "@/types/servicios";

export interface ServicioAgregadoItemConfirmation {
  idTemp: string;
  i_CveServicio: number;
  v_Nombre: string;
  i_CveTipoServicio: number;
  v_TipoServicio: string;
  v_Rubro: string;
  v_Unidad: string;
  cantidad: number;
  precioUnitario: number;
  sesiones: number;
  noCotizacionGI: string;
  noOCCliente: string;
  costo: number;
}

export interface SesionProgramacionConfirmation {
  fecha: string;
  horaInicio: string;
  horaFin: string;
  areaSalaId: string;
}

export interface ProgramacionItemConfirmation {
  b_ProgramarDespues: boolean;
  v_TipoCupo: "Abierto" | "Limitado";
  i_CupoAlumnos: number;
  v_Titular: string;
  v_Apoyo: string;
  v_TipoApoyo: "Ninguno" | "Instructor" | "Proveedor";
  v_NoCotProveedor: string;
  v_NoOCProveedor: string;
  d_PrecioProveedor: number;
  d_FechaInicioEntrega: string;
  sesiones: SesionProgramacionConfirmation[];
}

export interface ModalConfirmarAgendaProps {
  abierto: boolean;
  onRegresar: () => void;
  onConfirmar: () => Promise<void> | void;
  empresaData: {
    razonSocial: string;
    planta: string;
    contacto: string;
    correoContacto: string;
  };
  ventaData: {
    totalConIVA: number;
    totalCostosConIVA: number;
    totalUtilidad: number;
    compartirCotizacion: boolean;
    compartirOC: boolean;
    noCotizacionGlobal: string;
    noOCGlobal: string;
  };
  serviciosAgregados: ServicioAgregadoItemConfirmation[];
  programacionMap: Record<string, ProgramacionItemConfirmation>;
  serviciosCatalogo?: ServiciosDropdownDto[];
  instructoresCatalogo?: InstructorGetDto[];
  proveedoresCatalogo?: ProveedorGetDto[];
}

const MESES_ABREV = [
  "Ene", "Feb", "Mar", "Abr", "May", "Jun",
  "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"
];

function formatearFechaTexto(fechaIso: string): string {
  if (!fechaIso) return "";
  const parts = fechaIso.split("-");
  if (parts.length !== 3) return fechaIso;
  const year = parts[0];
  const monthIdx = parseInt(parts[1], 10) - 1;
  const day = parts[2].padStart(2, "0");
  if (monthIdx >= 0 && monthIdx < 12) {
    return `${day}/${MESES_ABREV[monthIdx]}/${year}`;
  }
  return fechaIso;
}

function formatearMoneda(monto: number): string {
  return (monto || 0).toLocaleString("es-MX", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

const GROUP_CONFIG: Record<
  number,
  { nombre: string; colorBorder: string; bg: string; colorText: string }
> = {
  2: {
    nombre: "CAPACITACIÓN",
    colorBorder: "#f59e0b",
    bg: "#fffdf0",
    colorText: "#b45309",
  },
  3: {
    nombre: "ESTUDIOS",
    colorBorder: "#188ae2",
    bg: "#f4f8fe",
    colorText: "#0369a1",
  },
  5: {
    nombre: "PRODUCTOS",
    colorBorder: "#8b5cf6",
    bg: "#faf5ff",
    colorText: "#6b21a8",
  },
  6: {
    nombre: "SERVICIOS",
    colorBorder: "#10b981",
    bg: "#f0fdf4",
    colorText: "#15803d",
  },
};

function getTipoServicioId(item: ServicioAgregadoItemConfirmation): number {
  if ([2, 3, 5, 6].includes(item.i_CveTipoServicio)) {
    return item.i_CveTipoServicio;
  }
  const tipoUpper = (item.v_TipoServicio || "").toUpperCase();
  if (tipoUpper.includes("CAPACITA")) return 2;
  if (tipoUpper.includes("ESTUDIO")) return 3;
  if (tipoUpper.includes("PRODUCTO")) return 5;
  return 6;
}

export const ModalConfirmarAgenda: React.FC<ModalConfirmarAgendaProps> = ({
  abierto,
  onRegresar,
  onConfirmar,
  empresaData,
  ventaData,
  serviciosAgregados,
  programacionMap,
  serviciosCatalogo = [],
  instructoresCatalogo = [],
  proveedoresCatalogo = [],
}) => {
  const [guardando, setGuardando] = useState<boolean>(false);
  const [catalogoEntregables, setCatalogoEntregables] = useState<entregables[]>([]);

  useEffect(() => {
    if (abierto) {
      setGuardando(false);
      CatalogosService.getEntregables()
        .then((res) => setCatalogoEntregables(res || []))
        .catch(() => setCatalogoEntregables([]));
    }
  }, [abierto]);

  const entregablesMap = useMemo(() => {
    const map = new Map<number, string>();
    catalogoEntregables.forEach((e) => {
      map.set(e.i_CveEntregables, e.v_Nombre);
    });
    return map;
  }, [catalogoEntregables]);

  const obtenerNombrePersona = (personaId: string): string => {
    if (!personaId || personaId === "NA" || personaId === "0") return "";
    if (personaId.startsWith("ins_")) {
      const idRaw = Number(personaId.replace("ins_", ""));
      const ins = instructoresCatalogo.find((i) => i.i_CveInstructor === idRaw);
      if (ins) return ins.v_NombreCompleto || ins.v_Nombre || `Instructor #${idRaw}`;
      return `Instructor #${idRaw}`;
    }
    if (personaId.startsWith("prov_")) {
      const idRaw = Number(personaId.replace("prov_", ""));
      const prv = proveedoresCatalogo.find((p) => p.i_CveProveedor === idRaw);
      if (prv) return prv.v_RazonSocial || prv.v_Nombre || `Proveedor #${idRaw}`;
      return `Proveedor #${idRaw}`;
    }
    return personaId;
  };

  const getProgState = (srv: ServicioAgregadoItemConfirmation): ProgramacionItemConfirmation => {
    if (programacionMap && programacionMap[srv.idTemp]) {
      return programacionMap[srv.idTemp];
    }
    const todayStr = new Date().toISOString().split("T")[0];
    const numSesiones = srv.sesiones || 1;
    const sesionesInit: SesionProgramacionConfirmation[] = Array.from({
      length: numSesiones,
    }).map(() => ({
      fecha: todayStr,
      horaInicio: "09:00",
      horaFin: "13:00",
      areaSalaId: "1",
    }));

    return {
      b_ProgramarDespues: false,
      v_TipoCupo: "Abierto",
      i_CupoAlumnos: 20,
      v_Titular: "ins_1",
      v_Apoyo: "NA",
      v_TipoApoyo: "Ninguno",
      v_NoCotProveedor: "",
      v_NoOCProveedor: "",
      d_PrecioProveedor: 0,
      d_FechaInicioEntrega: todayStr,
      sesiones: sesionesInit,
    };
  };

  const handleEjecutarConfirmacion = async () => {
    try {
      setGuardando(true);
      await onConfirmar();
    } catch (err) {
      console.error("Error al confirmar agenda:", err);
    } finally {
      setGuardando(false);
    }
  };

  if (!abierto) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(15, 23, 42, 0.65)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1100,
        padding: "16px",
      }}
    >
      <div
        style={{
          backgroundColor: "#ffffff",
          borderRadius: "16px",
          width: "100%",
          maxWidth: "1150px",
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
          overflow: "hidden",
          border: "1px solid #e2e8f0",
        }}
      >
        {/* HEADER DEL MODAL */}
        <div
          style={{
            padding: "16px 24px",
            borderBottom: "1px solid #ddeaf5",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            backgroundColor: "#f8fafc",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "10px",
                backgroundColor: "#e6f4ea",
                color: "#198754",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <CheckCircle2 size={22} />
            </div>
            <div>
              <h2
                style={{
                  margin: 0,
                  fontSize: "18px",
                  fontWeight: 700,
                  color: "#0f172a",
                  lineHeight: "1.2",
                }}
              >
                Confirmar agenda
              </h2>
              <span style={{ fontSize: "12px", color: "#64748b" }}>
                Verifica el resumen general antes de enviar la información
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onRegresar}
            disabled={guardando}
            style={{
              background: "none",
              border: "none",
              color: guardando ? "#cbd5e1" : "#64748b",
              cursor: guardando ? "not-allowed" : "pointer",
              padding: "6px",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* CUERPO DEL MODAL (3 BLOQUES VERTICALES) */}
        <div
          style={{
            padding: "24px",
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            gap: "20px",
            backgroundColor: "#ffffff",
          }}
        >
          {/* BLOQUE 1: EMPRESA */}
          <div>
            <div
              style={{
                fontSize: "11px",
                fontWeight: 700,
                color: "#64748b",
                letterSpacing: "0.5px",
                textTransform: "uppercase",
                marginBottom: "6px",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <Building2 size={13} style={{ color: "#2B8FCC" }} />
              <span>Empresa</span>
            </div>
            <div
              style={{
                border: "1px solid #d0dce8",
                borderRadius: "10px",
                padding: "16px",
                backgroundColor: "#f8fafc",
              }}
            >
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                  gap: "14px 24px",
                }}
              >
                <div>
                  <span
                    style={{
                      display: "block",
                      fontSize: "11px",
                      color: "#64748b",
                      marginBottom: "2px",
                    }}
                  >
                    Razón social
                  </span>
                  <strong style={{ fontSize: "13px", color: "#0f172a" }}>
                    {empresaData.razonSocial || "—"}
                  </strong>
                </div>

                <div>
                  <span
                    style={{
                      display: "block",
                      fontSize: "11px",
                      color: "#64748b",
                      marginBottom: "2px",
                    }}
                  >
                    Planta
                  </span>
                  <strong style={{ fontSize: "13px", color: "#0f172a" }}>
                    {empresaData.planta || "—"}
                  </strong>
                </div>

                <div>
                  <span
                    style={{
                      display: "block",
                      fontSize: "11px",
                      color: "#64748b",
                      marginBottom: "2px",
                    }}
                  >
                    Contacto
                  </span>
                  <strong style={{ fontSize: "13px", color: "#0f172a" }}>
                    {empresaData.contacto || "—"}
                  </strong>
                </div>

                <div>
                  <span
                    style={{
                      display: "block",
                      fontSize: "11px",
                      color: "#64748b",
                      marginBottom: "2px",
                    }}
                  >
                    Correo de contacto
                  </span>
                  <strong style={{ fontSize: "13px", color: "#0f172a" }}>
                    {empresaData.correoContacto || "N/A"}
                  </strong>
                </div>
              </div>
            </div>
          </div>

          {/* BLOQUE 2: VENTA */}
          <div>
            <div
              style={{
                fontSize: "11px",
                fontWeight: 700,
                color: "#64748b",
                letterSpacing: "0.5px",
                textTransform: "uppercase",
                marginBottom: "6px",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <FileText size={13} style={{ color: "#2B8FCC" }} />
              <span>Venta</span>
            </div>
            <div
              style={{
                border: "1px solid #d0dce8",
                borderRadius: "10px",
                padding: "16px",
                backgroundColor: "#f8fafc",
                display: "flex",
                flexDirection: "column",
                gap: "14px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "16px",
                }}
              >
                <div>
                  <span
                    style={{
                      display: "block",
                      fontSize: "11px",
                      color: "#64748b",
                      marginBottom: "2px",
                    }}
                  >
                    Total c/IVA
                  </span>
                  <strong style={{ fontSize: "15px", color: "#0f172a" }}>
                    $ {formatearMoneda(ventaData.totalConIVA)} MXN
                  </strong>
                </div>

                <div>
                  <span
                    style={{
                      display: "block",
                      fontSize: "11px",
                      color: "#64748b",
                      marginBottom: "2px",
                    }}
                  >
                    Total Costos c/IVA
                  </span>
                  <strong style={{ fontSize: "15px", color: "#dc3545" }}>
                    $ {formatearMoneda(ventaData.totalCostosConIVA)} MXN
                  </strong>
                </div>

                <div>
                  <span
                    style={{
                      display: "block",
                      fontSize: "11px",
                      color: "#64748b",
                      marginBottom: "2px",
                    }}
                  >
                    Total Utilidad
                  </span>
                  <strong
                    style={{
                      fontSize: "15px",
                      color: ventaData.totalUtilidad >= 0 ? "#198754" : "#dc3545",
                    }}
                  >
                    $ {formatearMoneda(ventaData.totalUtilidad)} MXN
                  </strong>
                </div>
              </div>

              {/* NOTA O PILLS SI COTIZACIÓN O OC SON COMPARTIDAS GLOBALMENTE */}
              {(ventaData.compartirCotizacion || ventaData.compartirOC) && (
                <div
                  style={{
                    paddingTop: "12px",
                    borderTop: "1px solid #e2e8f0",
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "10px",
                  }}
                >
                  {ventaData.compartirCotizacion && (
                    <div
                      style={{
                        backgroundColor: "#e0f2fe",
                        border: "1px solid #bae6fd",
                        borderRadius: "6px",
                        padding: "6px 12px",
                        fontSize: "11px",
                        color: "#0369a1",
                        fontWeight: 600,
                      }}
                    >
                      No. cotización GI (compartida):{" "}
                      <span style={{ fontWeight: 700 }}>
                        {ventaData.noCotizacionGlobal || "N/A"}
                      </span>
                    </div>
                  )}

                  {ventaData.compartirOC && (
                    <div
                      style={{
                        backgroundColor: "#fef3c7",
                        border: "1px solid #fde68a",
                        borderRadius: "6px",
                        padding: "6px 12px",
                        fontSize: "11px",
                        color: "#b45309",
                        fontWeight: 600,
                      }}
                    >
                      No. OC cliente (compartida):{" "}
                      <span style={{ fontWeight: 700 }}>
                        {ventaData.noOCGlobal || "N/A"}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* BLOQUE 3: SERVICIOS (TABLA DE CONFIRMACIÓN) */}
          <div>
            <div
              style={{
                fontSize: "11px",
                fontWeight: 700,
                color: "#64748b",
                letterSpacing: "0.5px",
                textTransform: "uppercase",
                marginBottom: "6px",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <PackageCheck size={13} style={{ color: "#2B8FCC" }} />
              <span>Servicios</span>
            </div>

            <div
              style={{
                border: "1px solid #d0dce8",
                borderRadius: "10px",
                overflow: "hidden",
                boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
              }}
            >
              <div style={{ overflowX: "auto" }}>
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    fontSize: "12px",
                  }}
                >
                  <thead>
                    <tr
                      style={{
                        backgroundColor: "#f1f5f9",
                        borderBottom: "1px solid #cbd5e1",
                        color: "#64748b",
                        fontSize: "11px",
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                      }}
                    >
                      <th style={{ padding: "10px 12px", textAlign: "left" }}>
                        Servicio
                      </th>
                      <th style={{ padding: "10px 12px", textAlign: "left" }}>
                        Cantidad
                      </th>
                      <th style={{ padding: "10px 12px", textAlign: "left" }}>
                        Entregables
                      </th>
                      <th style={{ padding: "10px 12px", textAlign: "left" }}>
                        Detalle
                      </th>
                      {!ventaData.compartirCotizacion && (
                        <th style={{ padding: "10px 12px", textAlign: "left" }}>
                          No. cotización GI
                        </th>
                      )}
                      {!ventaData.compartirOC && (
                        <th style={{ padding: "10px 12px", textAlign: "left" }}>
                          No. OC cliente
                        </th>
                      )}
                      <th style={{ padding: "10px 12px", textAlign: "right" }}>
                        Total s/IVA
                      </th>
                      <th style={{ padding: "10px 12px", textAlign: "right" }}>
                        Costo total s/IVA
                      </th>
                      <th style={{ padding: "10px 12px", textAlign: "right" }}>
                        Utilidad
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {serviciosAgregados.map((srv) => {
                      const tipoId = getTipoServicioId(srv);
                      const groupCfg = GROUP_CONFIG[tipoId] || GROUP_CONFIG[6];
                      const progState = getProgState(srv);
                      const esProveedor = progState?.v_TipoApoyo === "Proveedor";
                      const totalSinIVA = (srv.cantidad || 0) * (srv.precioUnitario || 0);
                      const costoSinIVA =
                        esProveedor && progState?.d_PrecioProveedor
                          ? progState.d_PrecioProveedor * srv.cantidad
                          : srv.costo || 0;
                      const utilidadSinIVA = totalSinIVA - costoSinIVA;

                      // Obtener entregables de este servicio
                      const srvCat = serviciosCatalogo.find(
                        (sc) => sc.i_CveServicio === srv.i_CveServicio
                      );
                      const entregablesIds = srvCat?.entregables || [];
                      const nombresEntregables = entregablesIds
                        .map((id) => entregablesMap.get(id))
                        .filter(Boolean);
                      const textoEntregables =
                        nombresEntregables.length > 0
                          ? nombresEntregables.join(", ")
                          : "Sin entregables";

                      // Formatear columna Detalle según tipo
                      const detalleElementos: React.ReactNode[] = [];

                      if (tipoId === 2) {
                        // Capacitación
                        const titular = obtenerNombrePersona(progState.v_Titular);
                        const apoyo = obtenerNombrePersona(progState.v_Apoyo);

                        if (titular) {
                          detalleElementos.push(
                            <div key="titular">
                              <span style={{ color: "#64748b" }}>Titular:</span>{" "}
                              <strong>{titular}</strong>
                            </div>
                          );
                        }

                        if (apoyo) {
                          detalleElementos.push(
                            <div key="apoyo">
                              <span style={{ color: "#64748b" }}>Apoyo:</span>{" "}
                              <strong>{apoyo}</strong>
                            </div>
                          );
                        }

                        if (
                          progState.b_ProgramarDespues ||
                          !progState.sesiones ||
                          progState.sesiones.length === 0
                        ) {
                          detalleElementos.push(
                            <div key="fechas_pendientes" style={{ color: "#94a3b8", fontStyle: "italic" }}>
                              Fecha pendiente de programar
                            </div>
                          );
                        } else {
                          progState.sesiones.forEach((ses, idx) => {
                            const fTexto = formatearFechaTexto(ses.fecha);
                            detalleElementos.push(
                              <div key={`ses_${idx}`}>
                                <span style={{ color: "#64748b" }}>
                                  Sesión {idx + 1}:
                                </span>{" "}
                                {fTexto ? `${fTexto} ${ses.horaInicio || ""} - ${ses.horaFin || ""}` : "Fecha pendiente de programar"}
                              </div>
                            );
                          });
                        }
                      } else {
                        // Estudios, Productos, Servicios (3, 5, 6)
                        const apoyo = obtenerNombrePersona(progState.v_Apoyo);
                        if (apoyo) {
                          detalleElementos.push(
                            <div key="apoyo">
                              <span style={{ color: "#64748b" }}>Apoyo:</span>{" "}
                              <strong>{apoyo}</strong>
                            </div>
                          );
                        }

                        if (progState.b_ProgramarDespues || !progState.d_FechaInicioEntrega) {
                          detalleElementos.push(
                            <div key="fecha_pend" style={{ color: "#94a3b8", fontStyle: "italic" }}>
                              Fecha pendiente de programar
                            </div>
                          );
                        } else {
                          const fEntrega = formatearFechaTexto(progState.d_FechaInicioEntrega);
                          detalleElementos.push(
                            <div key="f_entrega">
                              <span style={{ color: "#64748b" }}>Entrega:</span>{" "}
                              <strong>{fEntrega}</strong>
                            </div>
                          );
                        }
                      }

                      return (
                        <tr
                          key={srv.idTemp}
                          style={{
                            backgroundColor: groupCfg.bg,
                            borderBottom: "1px solid #e2e8f0",
                            borderLeft: `4px solid ${groupCfg.colorBorder}`,
                          }}
                        >
                          {/* SERVICIO */}
                          <td style={{ padding: "10px 12px", verticalAlign: "top" }}>
                            <div style={{ fontWeight: 700, color: "#0f172a" }}>
                              {srv.v_Nombre}
                            </div>
                            <div
                              style={{
                                fontSize: "11px",
                                color: groupCfg.colorText,
                                fontWeight: 600,
                              }}
                            >
                              {srv.v_TipoServicio}
                            </div>
                          </td>

                          {/* CANTIDAD */}
                          <td
                            style={{
                              padding: "10px 12px",
                              verticalAlign: "top",
                              whiteSpace: "nowrap",
                            }}
                          >
                            <span style={{ fontWeight: 600, color: "#0f172a" }}>
                              {srv.cantidad} {srv.v_Unidad}
                            </span>
                          </td>

                          {/* ENTREGABLES */}
                          <td
                            style={{
                              padding: "10px 12px",
                              verticalAlign: "top",
                              color: "#475569",
                              fontSize: "11px",
                            }}
                          >
                            {textoEntregables}
                          </td>

                          {/* DETALLE */}
                          <td
                            style={{
                              padding: "10px 12px",
                              verticalAlign: "top",
                              fontSize: "11px",
                              color: "#475569",
                              lineHeight: "1.4",
                            }}
                          >
                            {detalleElementos}
                          </td>

                          {/* NO COTIZACIÓN GI (SI NO COMPARTIDO) */}
                          {!ventaData.compartirCotizacion && (
                            <td
                              style={{
                                padding: "10px 12px",
                                verticalAlign: "top",
                                color: "#0f172a",
                              }}
                            >
                              {srv.noCotizacionGI || "N/A"}
                            </td>
                          )}

                          {/* NO OC CLIENTE (SI NO COMPARTIDO) */}
                          {!ventaData.compartirOC && (
                            <td
                              style={{
                                padding: "10px 12px",
                                verticalAlign: "top",
                                color: "#0f172a",
                              }}
                            >
                              {srv.noOCCliente || "N/A"}
                            </td>
                          )}

                          {/* TOTAL S/IVA */}
                          <td
                            style={{
                              padding: "10px 12px",
                              verticalAlign: "top",
                              textAlign: "right",
                              fontWeight: 700,
                              color: "#0f172a",
                            }}
                          >
                            $ {formatearMoneda(totalSinIVA)}
                          </td>

                          {/* COSTO TOTAL S/IVA */}
                          <td
                            style={{
                              padding: "10px 12px",
                              verticalAlign: "top",
                              textAlign: "right",
                              fontWeight: 700,
                              color: "#dc3545",
                            }}
                          >
                            $ {formatearMoneda(costoSinIVA)}
                          </td>

                          {/* UTILIDAD */}
                          <td
                            style={{
                              padding: "10px 12px",
                              verticalAlign: "top",
                              textAlign: "right",
                              fontWeight: 700,
                              color: utilidadSinIVA >= 0 ? "#198754" : "#dc3545",
                            }}
                          >
                            $ {formatearMoneda(utilidadSinIVA)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* FOOTER DEL MODAL */}
        <div
          style={{
            padding: "14px 24px",
            borderTop: "1px solid #ddeaf5",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            backgroundColor: "#ffffff",
          }}
        >
          <div>
            <button
              type="button"
              onClick={onRegresar}
              disabled={guardando}
              style={{
                height: "36px",
                padding: "0 18px",
                borderRadius: "20px",
                backgroundColor: guardando ? "#e2e8f0" : "#f4f8fc",
                border: "1px solid #d0dce8",
                color: guardando ? "#94a3b8" : "#4a6580",
                fontSize: "13px",
                fontWeight: 500,
                cursor: guardando ? "not-allowed" : "pointer",
              }}
            >
              Cerrar
            </button>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <button
              type="button"
              onClick={onRegresar}
              disabled={guardando}
              style={{
                height: "36px",
                padding: "0 22px",
                borderRadius: "20px",
                backgroundColor: guardando ? "#b5cfe8" : "#2B8FCC",
                color: "#ffffff",
                border: "none",
                fontSize: "13px",
                fontWeight: 500,
                cursor: guardando ? "not-allowed" : "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <ChevronLeft size={16} />
              <span>Regresar</span>
            </button>

            <button
              type="button"
              onClick={handleEjecutarConfirmacion}
              disabled={guardando}
              style={{
                height: "36px",
                padding: "0 22px",
                borderRadius: "20px",
                backgroundColor: guardando ? "#86efac" : "#198754",
                color: "#ffffff",
                border: "none",
                fontSize: "13px",
                fontWeight: 500,
                cursor: guardando ? "not-allowed" : "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              {guardando ? (
                <>
                  <Loader2 className="animate-spin" size={16} />
                  <span>Guardando...</span>
                </>
              ) : (
                <>
                  <Check size={16} />
                  <span>Confirmar</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
