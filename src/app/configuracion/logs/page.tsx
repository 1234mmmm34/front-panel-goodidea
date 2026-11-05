"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { PaginadorCustom } from "@/components/ui/PaginadorCustom";
import { useToast } from "@/context/ToastContext";
import { LogsService } from "@/services/logs.service";
import { AuditLogFiltros, AuditLogItem } from "@/types/logs";
import {
  ModalDetalleLog,
  formatearFechaHoraLog,
  obtenerColoresStatusCode,
  renderBadgeMetodo,
} from "@/components/logs/ModalDetalleLog";

const TAMANO_PAGINA = 20;

function obtenerHoyLocalIso(): string {
  const hoy = new Date();
  const y = hoy.getFullYear();
  const m = String(hoy.getMonth() + 1).padStart(2, "0");
  const d = String(hoy.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export default function LogsApiPage() {
  const { toast } = useToast();

  // Estado de datos y carga
  const [datos, setDatos] = useState<AuditLogItem[]>([]);
  const [cargando, setCargando] = useState<boolean>(true);
  const [totalRegistros, setTotalRegistros] = useState<number>(0);
  const [totalPaginas, setTotalPaginas] = useState<number>(1);
  const [paginaActual, setPaginaActual] = useState<number>(1);

  // Catálogos de filtros (GET logs/filtros)
  const [catalogoFiltros, setCatalogoFiltros] = useState<AuditLogFiltros>({
    usuarios: [],
    codigos: [],
  });

  // Valores de filtros activos
  const [d_FechaInicio, setD_FechaInicio] = useState<string>(() =>
    obtenerHoyLocalIso()
  );
  const [buscarPorRango, setBuscarPorRango] = useState<boolean>(false);
  const [d_FechaFin, setD_FechaFin] = useState<string>(() =>
    obtenerHoyLocalIso()
  );
  const [usuarioFiltro, setUsuarioFiltro] = useState<string>(""); // "" = Todos, "0" = Anónimo, "{id}" = Usuario
  const [v_Metodo, setV_Metodo] = useState<string>(""); // "" = Todos
  const [statusCodeFiltro, setStatusCodeFiltro] = useState<string>(""); // "" = Todos
  const [v_RutaAplicada, setV_RutaAplicada] = useState<string>("");
  const [rutaInput, setRutaInput] = useState<string>("");

  // Estado del modal de detalle
  const [modalDetalleAbierto, setModalDetalleAbierto] = useState<boolean>(false);
  const [cargandoDetalle, setCargandoDetalle] = useState<boolean>(false);
  const [logSeleccionado, setLogSeleccionado] = useState<AuditLogItem | null>(
    null
  );

  // Cargar catálogos de filtros una sola vez al montar
  useEffect(() => {
    let cancelado = false;
    LogsService.getFiltros()
      .then((res) => {
        if (!cancelado) {
          setCatalogoFiltros(res);
        }
      })
      .catch((err: any) => {
        if (!cancelado) {
          toast.error(
            err?.message || "No se pudieron cargar los filtros de logs."
          );
        }
      });

    return () => {
      cancelado = true;
    };
  }, [toast]);

  // Cargar lista paginada de logs
  const cargarLogs = useCallback(async () => {
    if (!d_FechaInicio) return;

    setCargando(true);
    try {
      const res = await LogsService.getLogs({
        d_FechaInicio,
        d_FechaFin: buscarPorRango ? d_FechaFin || d_FechaInicio : undefined,
        i_CveUsuario:
          usuarioFiltro !== "" ? Number(usuarioFiltro) : undefined,
        v_Metodo: v_Metodo !== "" ? v_Metodo : undefined,
        i_StatusCode:
          statusCodeFiltro !== "" ? Number(statusCodeFiltro) : undefined,
        v_Ruta: v_RutaAplicada.trim() !== "" ? v_RutaAplicada.trim() : undefined,
        pagina: paginaActual,
        tamano: TAMANO_PAGINA,
      });

      setDatos(res.datos);
      setTotalRegistros(res.total);
      setTotalPaginas(res.totalPaginas);
    } catch (err: any) {
      toast.error(err?.message || "No se pudieron cargar los logs de la API.");
    } finally {
      setCargando(false);
    }
  }, [
    d_FechaInicio,
    buscarPorRango,
    d_FechaFin,
    usuarioFiltro,
    v_Metodo,
    statusCodeFiltro,
    v_RutaAplicada,
    paginaActual,
    toast,
  ]);

  useEffect(() => {
    cargarLogs();
  }, [cargarLogs]);

  // Handlers de filtros (cada cambio regresa a página 1)
  const handleCambioFechaInicio = (nuevaFecha: string) => {
    if (!nuevaFecha) return;
    setD_FechaInicio(nuevaFecha);
    if (d_FechaFin && nuevaFecha > d_FechaFin) {
      setD_FechaFin(nuevaFecha);
    }
    setPaginaActual(1);
  };

  const handleToggleRango = (activo: boolean) => {
    setBuscarPorRango(activo);
    if (activo && (!d_FechaFin || d_FechaInicio > d_FechaFin)) {
      setD_FechaFin(d_FechaInicio);
    }
    setPaginaActual(1);
  };

  const handleCambioFechaFin = (nuevaFechaFin: string) => {
    if (!nuevaFechaFin) return;
    const ajustada =
      nuevaFechaFin < d_FechaInicio ? d_FechaInicio : nuevaFechaFin;
    setD_FechaFin(ajustada);
    setPaginaActual(1);
  };

  const handleCambioUsuario = (val: string) => {
    setUsuarioFiltro(val);
    setPaginaActual(1);
  };

  const handleCambioMetodo = (val: string) => {
    setV_Metodo(val);
    setPaginaActual(1);
  };

  const handleCambioCodigo = (val: string) => {
    setStatusCodeFiltro(val);
    setPaginaActual(1);
  };

  const handleEjecutarBusquedaRuta = () => {
    const limpio = rutaInput.trim();
    if (limpio === v_RutaAplicada && paginaActual === 1) {
      cargarLogs();
      return;
    }
    setV_RutaAplicada(limpio);
    setPaginaActual(1);
  };

  // Abrir modal de detalle y consultar GET logs/{i_CveLog}
  const handleVerDetalle = async (item: AuditLogItem) => {
    setLogSeleccionado(item);
    setModalDetalleAbierto(true);
    setCargandoDetalle(true);

    try {
      const detalle = await LogsService.getLogById(item.i_CveLog);
      setLogSeleccionado(detalle);
    } catch (err: any) {
      toast.error(err?.message || "No se pudo obtener el detalle del log.");
    } finally {
      setCargandoDetalle(false);
    }
  };

  const handleCerrarDetalle = () => {
    setModalDetalleAbierto(false);
    setLogSeleccionado(null);
    setCargandoDetalle(false);
  };

  return (
    <AppLayout>
      {/* Breadcrumb */}
      <div
        style={{
          fontSize: "12px",
          color: "#7a96b0",
          display: "flex",
          alignItems: "center",
          gap: "6px",
          marginBottom: "14px",
        }}
      >
        <Link
          href="/calendario"
          style={{ color: "#7a96b0", textDecoration: "none" }}
          className="hover:text-slate-900 transition-colors"
        >
          Configuración
        </Link>
        <ChevronRight size={13} style={{ color: "#b5cfe8" }} />
        <span style={{ color: "#1e293b", fontWeight: 500 }}>
          Logs de la API
        </span>
      </div>

      {/* Encabezado */}
      <div className="page-header mb-5">
        <div>
          <h1 className="page-title flex items-center gap-2 text-xl font-bold text-slate-900">
            <i
              className="bi bi-journal-text"
              style={{ color: "#2B8FCC", fontSize: "20px" }}
            />
            Logs de la API
          </h1>
          <p className="subtext text-slate-500 text-xs mt-0.5">
            Peticiones registradas en la API: usuario, fecha y hora, payload y
            respuesta del servidor.
          </p>
        </div>
      </div>

      {/* Barra de filtros */}
      <div className="card mb-4 p-4 border border-slate-200/80 shadow-sm rounded-xl filter-card">
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "flex-end",
            gap: "12px",
            flexWrap: "wrap",
          }}
        >
          {/* 1. Fecha + Checkbox "Buscar por rango" + Hasta */}
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              alignItems: "flex-end",
              gap: "10px",
              flexWrap: "wrap",
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "4px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "10px",
                }}
              >
                <label
                  className="form-label text-[11px] font-semibold text-slate-600"
                  style={{ marginBottom: 0 }}
                >
                  Fecha
                </label>
                <label
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "5px",
                    fontSize: "11px",
                    fontWeight: 500,
                    color: "#475569",
                    cursor: "pointer",
                    userSelect: "none",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={buscarPorRango}
                    onChange={(e) => handleToggleRango(e.target.checked)}
                    style={{
                      accentColor: "#2B8FCC",
                      width: "13px",
                      height: "13px",
                      cursor: "pointer",
                      margin: 0,
                    }}
                  />
                  Buscar por rango
                </label>
              </div>
              <input
                type="date"
                className="form-control text-xs py-1.5"
                style={{
                  borderRadius: "20px",
                  height: "32px",
                  minWidth: "145px",
                }}
                value={d_FechaInicio}
                onChange={(e) => handleCambioFechaInicio(e.target.value)}
              />
            </div>

            {buscarPorRango && (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "4px",
                }}
              >
                <label
                  className="form-label text-[11px] font-semibold text-slate-600"
                  style={{ marginBottom: 0 }}
                >
                  Hasta
                </label>
                <input
                  type="date"
                  className="form-control text-xs py-1.5"
                  style={{
                    borderRadius: "20px",
                    height: "32px",
                    minWidth: "145px",
                  }}
                  min={d_FechaInicio}
                  value={d_FechaFin}
                  onChange={(e) => handleCambioFechaFin(e.target.value)}
                />
              </div>
            )}
          </div>

          {/* 2. Usuario */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "4px",
              minWidth: "170px",
            }}
          >
            <label
              className="form-label text-[11px] font-semibold text-slate-600"
              style={{ marginBottom: 0 }}
            >
              Usuario
            </label>
            <select
              className="form-select text-xs py-1.5"
              style={{ borderRadius: "20px", height: "32px" }}
              value={usuarioFiltro}
              onChange={(e) => handleCambioUsuario(e.target.value)}
            >
              <option value="">Todos</option>
              <option value="0">Anónimo</option>
              {catalogoFiltros.usuarios.map((u) => (
                <option key={u.i_CveUsuario} value={String(u.i_CveUsuario)}>
                  {u.v_Usuario}
                </option>
              ))}
            </select>
          </div>

          {/* 3. Método */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "4px",
              minWidth: "120px",
            }}
          >
            <label
              className="form-label text-[11px] font-semibold text-slate-600"
              style={{ marginBottom: 0 }}
            >
              Método
            </label>
            <select
              className="form-select text-xs py-1.5"
              style={{ borderRadius: "20px", height: "32px" }}
              value={v_Metodo}
              onChange={(e) => handleCambioMetodo(e.target.value)}
            >
              <option value="">Todos</option>
              <option value="POST">POST</option>
              <option value="PUT">PUT</option>
              <option value="DELETE">DELETE</option>
              <option value="GET">GET</option>
            </select>
          </div>

          {/* 4. Código */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "4px",
              minWidth: "115px",
            }}
          >
            <label
              className="form-label text-[11px] font-semibold text-slate-600"
              style={{ marginBottom: 0 }}
            >
              Código
            </label>
            <select
              className="form-select text-xs py-1.5"
              style={{ borderRadius: "20px", height: "32px" }}
              value={statusCodeFiltro}
              onChange={(e) => handleCambioCodigo(e.target.value)}
            >
              <option value="">Todos</option>
              {catalogoFiltros.codigos.map((code) => (
                <option key={code} value={String(code)}>
                  {code}
                </option>
              ))}
            </select>
          </div>

          {/* 5. Buscar ruta */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "4px",
              flex: "1 1 220px",
              minWidth: "200px",
              maxWidth: "320px",
            }}
          >
            <label
              className="form-label text-[11px] font-semibold text-slate-600"
              style={{ marginBottom: 0 }}
            >
              Buscar ruta
            </label>
            <div style={{ position: "relative", width: "100%" }}>
              <i
                className="bi bi-search"
                style={{
                  position: "absolute",
                  left: "11px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "#64748b",
                  fontSize: "13px",
                  cursor: "pointer",
                }}
                onClick={handleEjecutarBusquedaRuta}
                title="Buscar ruta"
              />
              <input
                type="text"
                className="form-control text-xs py-1.5"
                style={{
                  width: "100%",
                  paddingLeft: "32px",
                  borderRadius: "20px",
                  height: "32px",
                }}
                placeholder="Ej. empresas, usuarios, agenda..."
                value={rutaInput}
                onChange={(e) => setRutaInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleEjecutarBusquedaRuta();
                  }
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Tabla de Logs */}
      <div className="alegra-table-container border border-slate-200/80 shadow-sm rounded-xl overflow-hidden mb-4">
        <table className="alegra-table">
          <thead>
            <tr>
              <th style={{ width: "160px" }}>Fecha y hora</th>
              <th style={{ width: "160px" }}>Usuario</th>
              <th style={{ width: "95px" }} className="text-center">
                Método
              </th>
              <th>Ruta</th>
              <th style={{ width: "90px" }} className="text-center">
                Código
              </th>
              <th style={{ width: "110px" }} className="text-right">
                Duración
              </th>
              <th style={{ width: "80px" }} className="text-center">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody>
            {cargando ? (
              Array.from({ length: 8 }).map((_, idx) => (
                <tr key={`sk-log-${idx}`}>
                  <td>
                    <div
                      className="skeleton-box sm"
                      style={{ width: "130px" }}
                    />
                  </td>
                  <td>
                    <div className="skeleton-box" style={{ width: "75%" }} />
                  </td>
                  <td className="text-center">
                    <div
                      className="skeleton-box sm"
                      style={{ width: "52px", margin: "0 auto" }}
                    />
                  </td>
                  <td>
                    <div className="skeleton-box" style={{ width: "85%" }} />
                  </td>
                  <td className="text-center">
                    <div
                      className="skeleton-box sm"
                      style={{ width: "45px", margin: "0 auto" }}
                    />
                  </td>
                  <td className="text-right">
                    <div
                      className="skeleton-box sm"
                      style={{ width: "55px", marginLeft: "auto" }}
                    />
                  </td>
                  <td className="text-center">
                    <div
                      className="skeleton-circle"
                      style={{ margin: "0 auto" }}
                    />
                  </td>
                </tr>
              ))
            ) : datos.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  style={{ textAlign: "center", padding: "48px 16px" }}
                >
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "6px",
                    }}
                  >
                    <div
                      style={{
                        width: "44px",
                        height: "44px",
                        borderRadius: "50%",
                        backgroundColor: "#f1f5f9",
                        border: "1px solid #e2e8f0",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#94a3b8",
                        marginBottom: "4px",
                      }}
                    >
                      <i
                        className="bi bi-journal-text"
                        style={{ fontSize: "20px" }}
                      />
                    </div>
                    <p
                      style={{
                        fontSize: "13.5px",
                        fontWeight: 500,
                        color: "#475569",
                        margin: 0,
                      }}
                    >
                      Sin registros para los filtros seleccionados.
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              datos.map((row) => {
                const esAnonimo =
                  !row.i_CveUsuario ||
                  !row.v_Usuario ||
                  row.v_Usuario.trim().toLowerCase() === "anónimo" ||
                  row.v_Usuario.trim().toLowerCase() === "anonimo";

                const statusColors = obtenerColoresStatusCode(row.i_StatusCode);

                return (
                  <tr
                    key={row.i_CveLog}
                    className="hover:bg-slate-50/60 transition-colors"
                  >
                    {/* Fecha y hora */}
                    <td style={{ whiteSpace: "nowrap" }}>
                      <span className="text-slate-700 text-xs">
                        {formatearFechaHoraLog(row.d_Fecha)}
                      </span>
                    </td>

                    {/* Usuario */}
                    <td>
                      {esAnonimo ? (
                        <span
                          className="text-xs italic"
                          style={{ color: "#94a3b8" }}
                        >
                          Anónimo
                        </span>
                      ) : (
                        <div
                          className="font-medium text-slate-900 text-xs truncate max-w-[160px]"
                          title={row.v_Usuario || ""}
                        >
                          {row.v_Usuario}
                        </div>
                      )}
                    </td>

                    {/* Método */}
                    <td className="text-center">
                      {renderBadgeMetodo(row.v_Metodo)}
                    </td>

                    {/* Ruta */}
                    <td style={{ maxWidth: 0, width: "100%" }}>
                      <div
                        className="font-roboto-mono text-xs text-slate-800 truncate"
                        title={row.v_Ruta || ""}
                      >
                        {row.v_Ruta || "—"}
                      </div>
                    </td>

                    {/* Código (Celda completa pintada según rango) */}
                    <td
                      style={{
                        backgroundColor: statusColors.backgroundColor,
                        color: statusColors.color,
                        textAlign: "center",
                        fontWeight: 700,
                        fontSize: "12px",
                      }}
                    >
                      {row.i_StatusCode}
                    </td>

                    {/* Duración */}
                    <td
                      className="text-right"
                      style={{ whiteSpace: "nowrap" }}
                    >
                      <span className="text-slate-700 text-xs">
                        {row.i_DuracionMs} ms
                      </span>
                    </td>

                    {/* Acciones */}
                    <td className="text-center">
                      <button
                        type="button"
                        className="btn-icon text-slate-600 hover:text-[#2B8FCC]"
                        onClick={() => handleVerDetalle(row)}
                        title="Ver detalle"
                        style={{ margin: "0 auto" }}
                      >
                        <i className="bi bi-eye" style={{ fontSize: "15px" }} />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Paginador (20 por página) */}
      <PaginadorCustom
        paginaActual={paginaActual}
        totalPaginas={totalPaginas}
        totalRegistros={totalRegistros}
        tamano={TAMANO_PAGINA}
        onCambioPagina={(pag) => setPaginaActual(pag)}
      />

      {/* Modal de detalle */}
      <ModalDetalleLog
        abierto={modalDetalleAbierto}
        cargando={cargandoDetalle}
        log={logSeleccionado}
        onCerrar={handleCerrarDetalle}
      />
    </AppLayout>
  );
}

