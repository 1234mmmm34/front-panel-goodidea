"use client";

import React, { useEffect, useState, useMemo } from "react";
import {
  X,
  CheckSquare,
  CheckCircle2,
  Square,
  Loader2,
  Calendar,
  Building2,
  Factory,
  AlertCircle,
  FileCheck,
} from "lucide-react";
import { EntregablesPorServicioDto, MarcarEntregadoDto } from "@/types/entregables";
import { EntregablesService } from "@/services/entregables.service";
import { useToast } from "@/context/ToastContext";

interface ModalMarcarEntregadosProps {
  abierto: boolean;
  onCerrar: () => void;
  iCveAgenda?: number;
  onGuardadoExitoso?: () => void;
}

const MESES_ABREV = [
  "Ene", "Feb", "Mar", "Abr", "May", "Jun",
  "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"
];

function formatearFechaTexto(fechaIso: string | null | undefined): string {
  if (!fechaIso) return "Pendiente";
  const str = fechaIso.split("T")[0];
  const parts = str.split("-");
  if (parts.length !== 3) return fechaIso;
  const year = parts[0];
  const monthIdx = parseInt(parts[1], 10) - 1;
  const day = parts[2].padStart(2, "0");
  if (monthIdx >= 0 && monthIdx < 12) {
    return `${day}/${MESES_ABREV[monthIdx]}/${year}`;
  }
  return fechaIso;
}

export const ModalMarcarEntregados: React.FC<ModalMarcarEntregadosProps> = ({
  abierto,
  onCerrar,
  iCveAgenda,
  onGuardadoExitoso,
}) => {
  const { toast } = useToast();

  const [cargando, setCargando] = useState<boolean>(false);
  const [guardando, setGuardando] = useState<boolean>(false);
  const [listaEntregables, setListaEntregables] = useState<EntregablesPorServicioDto[]>([]);
  
  // Set de IDs de servicios seleccionados para marcar
  const [seleccionadosIds, setSeleccionadosIds] = useState<number[]>([]);
  
  // Mapa de fecha de entrega por i_CveServAgendaDet (YYYY-MM-DD)
  const [fechasEntregaMap, setFechasEntregaMap] = useState<Record<number, string>>({});

  const hoyIso = useMemo(() => new Date().toISOString().split("T")[0], []);

  // Cargar datos al abrir el modal
  useEffect(() => {
    if (abierto) {
      setCargando(true);
      setSeleccionadosIds([]);
      setFechasEntregaMap({});

      EntregablesService.getEntregablesPendientesMarcar(iCveAgenda)
        .then((res) => {
          const items = res || [];
          setListaEntregables(items);

          // Inicializar fecha de entrega por defecto (hoy) para cada servicio
          const mapaInicial: Record<number, string> = {};
          items.forEach((item) => {
            mapaInicial[item.i_CveServAgendaDet] = hoyIso;
          });
          setFechasEntregaMap(mapaInicial);
        })
        .finally(() => {
          setCargando(false);
        });
    }
  }, [abierto, iCveAgenda, hoyIso]);

  // Checkbox seleccionar todos
  const todosSeleccionados =
    listaEntregables.length > 0 &&
    seleccionadosIds.length === listaEntregables.length;

  const handleToggleSeleccionarTodos = () => {
    if (todosSeleccionados) {
      setSeleccionadosIds([]);
    } else {
      setSeleccionadosIds(listaEntregables.map((item) => item.i_CveServAgendaDet));
    }
  };

  const handleToggleFila = (id: number) => {
    setSeleccionadosIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleCambiarFechaEntregaFila = (id: number, fecha: string) => {
    setFechasEntregaMap((prev) => ({ ...prev, [id]: fecha }));
    // Si modifica la fecha y no está seleccionado, auto-seleccionarlo
    if (fecha && !seleccionadosIds.includes(id)) {
      setSeleccionadosIds((prev) => [...prev, id]);
    }
  };

  const handleGuardar = async () => {
    if (seleccionadosIds.length === 0) {
      toast.error("Selecciona al menos un servicio para marcar sus entregables");
      return;
    }

    // Validar que todas las filas seleccionadas tengan fecha válida
    for (const id of seleccionadosIds) {
      const fecha = fechasEntregaMap[id];
      if (!fecha) {
        toast.error("Todas las filas seleccionadas deben tener una fecha de entrega válida");
        return;
      }
    }

    try {
      setGuardando(true);

      const itemsDto: MarcarEntregadoDto[] = seleccionadosIds.map((id) => ({
        i_CveServAgendaDet: id,
        f_FechaEntregable: fechasEntregaMap[id] || hoyIso,
      }));

      const exito = await EntregablesService.marcarEntregados(itemsDto);

      if (exito) {
        toast.success("Entregables marcados como entregados correctamente");
        if (onGuardadoExitoso) onGuardadoExitoso();
        onCerrar();
      } else {
        toast.error("Error al marcar los entregables. Intenta de nuevo.");
      }
    } catch (err) {
      console.error("Error al guardar entregables marcados:", err);
      toast.error("Ocurrió un error al procesar la solicitud");
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
        backgroundColor: "rgba(15, 23, 42, 0.6)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1050,
        padding: "16px",
      }}
    >
      <div
        style={{
          backgroundColor: "#ffffff",
          borderRadius: "16px",
          width: "100%",
          maxWidth: "1080px",
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
          overflow: "hidden",
          border: "1px solid #e2e8f0",
        }}
      >
        {/* HEADER */}
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
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "10px",
                backgroundColor: "#e0f2fe",
                color: "#0284c7",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <FileCheck size={22} />
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
                Marcar entregables como entregados
              </h2>
              <span style={{ fontSize: "12px", color: "#64748b" }}>
                {iCveAgenda
                  ? `Filtrado por servicio / agenda #${iCveAgenda}`
                  : "Listado de todos los entregables pendientes por marcar"}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onCerrar}
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

        {/* CUERPO DEL MODAL */}
        <div
          className="custom-scrollbar"
          style={{
            padding: "20px 24px",
            overflowY: "auto",
            flex: 1,
            display: "flex",
            flexDirection: "column",
            gap: "16px",
            backgroundColor: "#ffffff",
          }}
        >
          {cargando ? (
            <div
              style={{
                padding: "60px 20px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: "12px",
                color: "#2B8FCC",
              }}
            >
              <Loader2 size={32} className="animate-spin" />
              <span style={{ fontSize: "14px", fontWeight: 600, color: "#475569" }}>
                Cargando entregables pendientes...
              </span>
            </div>
          ) : listaEntregables.length === 0 ? (
            <div
              style={{
                padding: "60px 20px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: "10px",
                color: "#64748b",
                textAlign: "center",
              }}
            >
              <CheckCircle2 size={40} style={{ color: "#10b981" }} />
              <span style={{ fontSize: "15px", fontWeight: 600, color: "#1e293b" }}>
                ¡Sin entregables pendientes!
              </span>
              <span style={{ fontSize: "13px", color: "#64748b", maxWidth: "400px" }}>
                No se encontraron servicios con cartas de entrega pendientes por marcar.
              </span>
            </div>
          ) : (
            <>
              {/* Resumen de selección */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  backgroundColor: "#f8fafc",
                  padding: "10px 16px",
                  borderRadius: "8px",
                  border: "1px solid #e2e8f0",
                  fontSize: "13px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <button
                    type="button"
                    onClick={handleToggleSeleccionarTodos}
                    style={{
                      background: "none",
                      border: "none",
                      padding: 0,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      color: "#2B8FCC",
                      fontWeight: 600,
                    }}
                  >
                    {todosSeleccionados ? (
                      <CheckSquare size={18} style={{ color: "#2B8FCC" }} />
                    ) : (
                      <Square size={18} style={{ color: "#94a3b8" }} />
                    )}
                    <span>
                      {todosSeleccionados
                        ? "Desmarcar todos"
                        : "Seleccionar todos los servicios"}
                    </span>
                  </button>
                </div>
                <div style={{ color: "#64748b", fontSize: "12px", fontWeight: 600 }}>
                  Pendientes: <span style={{ color: "#0f172a" }}>{listaEntregables.length}</span> |
                  Seleccionados:{" "}
                  <span style={{ color: "#2B8FCC" }}>{seleccionadosIds.length}</span>
                </div>
              </div>

              {/* TABLA DE ENTREGABLES PENDIENTES */}
              <div
                style={{
                  border: "1px solid #e2e8f0",
                  borderRadius: "10px",
                  overflow: "hidden",
                }}
              >
                <div style={{ overflowX: "auto", maxHeight: "55vh" }}>
                  <table
                    className="table"
                    style={{
                      width: "100%",
                      margin: 0,
                      fontSize: "12px",
                      borderCollapse: "collapse",
                    }}
                  >
                    <thead
                      style={{
                        backgroundColor: "#f1f5f9",
                        position: "sticky",
                        top: 0,
                        zIndex: 10,
                        color: "#334155",
                        fontWeight: 700,
                      }}
                    >
                      <tr>
                        <th style={{ width: "40px", padding: "10px 12px", textAlign: "center" }}>
                          #
                        </th>
                        <th style={{ padding: "10px 12px" }}>Empresa / Planta</th>
                        <th style={{ padding: "10px 12px" }}>Servicio</th>
                        <th style={{ padding: "10px 12px" }}>Fecha inicio</th>
                        <th style={{ padding: "10px 12px" }}>No. Cotización</th>
                        <th style={{ padding: "10px 12px" }}>OC Cliente</th>
                        <th style={{ padding: "10px 12px" }}>Entregables pendientes</th>
                        <th style={{ padding: "10px 12px", width: "150px" }}>Fecha entrega</th>
                      </tr>
                    </thead>
                    <tbody>
                      {listaEntregables.map((item) => {
                        const estaSeleccionado = seleccionadosIds.includes(
                          item.i_CveServAgendaDet
                        );

                        const cotizacionTexto = item.v_NoCotizacionGI || "Pendiente";
                        const ocTexto = item.v_NoOrdenCompraCliente || "Pendiente";

                        return (
                          <tr
                            key={item.i_CveServAgendaDet}
                            style={{
                              backgroundColor: estaSeleccionado ? "#f0f9ff" : "#ffffff",
                              borderBottom: "1px solid #f1f5f9",
                              transition: "background-color 0.15s",
                            }}
                          >
                            <td style={{ padding: "10px 12px", textAlign: "center" }}>
                              <input
                                type="checkbox"
                                className="form-check-input"
                                checked={estaSeleccionado}
                                onChange={() => handleToggleFila(item.i_CveServAgendaDet)}
                                style={{ cursor: "pointer", width: "16px", height: "16px" }}
                              />
                            </td>

                            <td style={{ padding: "10px 12px" }}>
                              <div style={{ fontWeight: 600, color: "#0f172a" }}>
                                {item.v_NombreEmpresa}
                              </div>
                              <div style={{ fontSize: "11px", color: "#64748b" }}>
                                {item.v_NombrePlanta}
                              </div>
                            </td>

                            <td style={{ padding: "10px 12px", fontWeight: 600, color: "#1e3a5f" }}>
                              {item.v_NombreServicio}
                            </td>

                            <td style={{ padding: "10px 12px", color: "#475569" }}>
                              {formatearFechaTexto(item.d_FechaInicio)}
                            </td>

                            <td style={{ padding: "10px 12px" }}>
                              <span
                                style={{
                                  color: item.v_NoCotizacionGI ? "#0f172a" : "#dc3545",
                                  fontWeight: item.v_NoCotizacionGI ? 500 : 700,
                                }}
                              >
                                {cotizacionTexto}
                              </span>
                            </td>

                            <td style={{ padding: "10px 12px" }}>
                              <span
                                style={{
                                  color: item.v_NoOrdenCompraCliente ? "#0f172a" : "#dc3545",
                                  fontWeight: item.v_NoOrdenCompraCliente ? 500 : 700,
                                }}
                              >
                                {ocTexto}
                              </span>
                            </td>

                            <td style={{ padding: "10px 12px" }}>
                              <span
                                style={{
                                  fontSize: "11px",
                                  backgroundColor: "#e0f2fe",
                                  color: "#0369a1",
                                  padding: "3px 8px",
                                  borderRadius: "6px",
                                  fontWeight: 600,
                                  display: "inline-block",
                                }}
                              >
                                {item.v_Entregables || "Cartas de entrega"}
                              </span>
                            </td>

                            <td style={{ padding: "10px 12px" }}>
                              <input
                                type="date"
                                className="form-control"
                                disabled={!estaSeleccionado}
                                value={fechasEntregaMap[item.i_CveServAgendaDet] || hoyIso}
                                onChange={(e) =>
                                  handleCambiarFechaEntregaFila(
                                    item.i_CveServAgendaDet,
                                    e.target.value
                                  )
                                }
                                style={{
                                  height: "32px",
                                  fontSize: "12px",
                                  borderRadius: "6px",
                                  borderColor: estaSeleccionado ? "#2B8FCC" : "#e2e8f0",
                                  backgroundColor: estaSeleccionado ? "#ffffff" : "#f1f5f9",
                                  cursor: estaSeleccionado ? "pointer" : "not-allowed",
                                  opacity: estaSeleccionado ? 1 : 0.6,
                                }}
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>

        {/* FOOTER */}
        <div
          style={{
            padding: "16px 24px",
            borderTop: "1px solid #e2e8f0",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            backgroundColor: "#f8fafc",
          }}
        >
          <div style={{ fontSize: "13px", color: "#64748b" }}>
            {seleccionadosIds.length > 0 ? (
              <span style={{ color: "#2B8FCC", fontWeight: 600 }}>
                {seleccionadosIds.length} servicio(s) listo(s) para marcar
              </span>
            ) : (
              <span>Marca el checkbox de los servicios a entregar</span>
            )}
          </div>

          <div style={{ display: "flex", gap: "10px" }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onCerrar}
              disabled={guardando}
              style={{
                height: "38px",
                padding: "0 18px",
                borderRadius: "8px",
                fontSize: "13px",
                fontWeight: 600,
              }}
            >
              Cancelar
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleGuardar}
              disabled={guardando || seleccionadosIds.length === 0}
              style={{
                height: "38px",
                padding: "0 22px",
                borderRadius: "8px",
                fontSize: "13px",
                fontWeight: 600,
                backgroundColor: "#2B8FCC",
                borderColor: "#2B8FCC",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              {guardando ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Guardando...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 size={16} />
                  <span>Guardar</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
