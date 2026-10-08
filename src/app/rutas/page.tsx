"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  FolderTree,
  Plus,
  Search,
  Edit3,
  Trash2,
  RefreshCw,
  ChevronRight,
  AlertTriangle,
  X,
  ExternalLink,
} from "lucide-react";
import { T_Rutas } from "@/types/rutas";
import { RutasService } from "@/services/rutas.service";
import { AppLayout } from "@/components/layout/AppLayout";
import { PaginadorCustom } from "@/components/ui/PaginadorCustom";
import { ModalCrearEditarRuta } from "@/components/rutas/ModalCrearEditarRuta";
import { useToast } from "@/context/ToastContext";
import { useMenu } from "@/context/MenuContext";

export default function RutasPadrePage() {
  const { toast } = useToast();
  const { refrescarMenu } = useMenu();

  const [rutas, setRutas] = useState<T_Rutas[]>([]);
  const [cargando, setCargando] = useState<boolean>(true);

  // Filtro de búsqueda local
  const [filtroTexto, setFiltroTexto] = useState<string>("");

  // Paginación (de 5 en 5 según especificación)
  const [paginaActual, setPaginaActual] = useState<number>(1);
  const [tamanoPagina, setTamanoPagina] = useState<number>(5);

  // Modales
  const [modalFormAbierto, setModalFormAbierto] = useState<boolean>(false);
  const [rutaEditar, setRutaEditar] = useState<T_Rutas | null>(null);

  const [rutaEliminar, setRutaEliminar] = useState<T_Rutas | null>(null);
  const [eliminando, setEliminando] = useState<boolean>(false);

  // Cargar rutas padre (GET rutas/0)
  const cargarRutasPadre = useCallback(async () => {
    setCargando(true);
    try {
      const data = await RutasService.getRutasPadre();
      setRutas(data || []);
    } catch (err) {
      console.error("Error al cargar rutas padre:", err);
      toast.error("No se pudieron cargar las rutas padre del sistema.");
    } finally {
      setCargando(false);
    }
  }, [toast]);

  useEffect(() => {
    cargarRutasPadre();
  }, [cargarRutasPadre]);

  // Rutas filtradas
  const rutasFiltradas = useMemo(() => {
    const q = filtroTexto.trim().toLowerCase();
    if (!q) return rutas;
    return rutas.filter((r) => {
      const nom = (r.v_NombreFuncionalidad || "").toLowerCase();
      const idStr = String(r.i_CveFuncionalidad);
      const iconStr = (r.v_Icon || "").toLowerCase();
      return nom.includes(q) || idStr.includes(q) || iconStr.includes(q);
    });
  }, [rutas, filtroTexto]);

  // Paginación
  const totalRegistros = rutasFiltradas.length;
  const totalPaginas = Math.ceil(totalRegistros / tamanoPagina) || 1;

  const rutasPaginadas = useMemo(() => {
    const inicio = (paginaActual - 1) * tamanoPagina;
    return rutasFiltradas.slice(inicio, inicio + tamanoPagina);
  }, [rutasFiltradas, paginaActual, tamanoPagina]);

  useEffect(() => {
    setPaginaActual(1);
  }, [filtroTexto, tamanoPagina]);

  // Siguiente orden para nueva ruta padre
  const siguienteOrden = useMemo(() => {
    if (rutas.length === 0) return 1;
    const maxOrden = Math.max(...rutas.map((r) => r.i_Orden || 0));
    return maxOrden >= 1 ? maxOrden + 1 : 1;
  }, [rutas]);

  // Handlers
  const handleAbrirCrear = () => {
    setRutaEditar(null);
    setModalFormAbierto(true);
  };

  const handleAbrirEditar = (ruta: T_Rutas) => {
    setRutaEditar(ruta);
    setModalFormAbierto(true);
  };

  const handleConfirmarEliminar = async () => {
    if (!rutaEliminar) return;
    setEliminando(true);

    try {
      const res = await RutasService.eliminarRuta(rutaEliminar.i_CveFuncionalidad);
      if (res.exito) {
        toast.success("Ruta eliminada exitosamente.");
        setRutaEliminar(null);
        refrescarMenu(true);
        cargarRutasPadre();
      } else {
        toast.error(res.mensaje || "Ocurrió un error al eliminar la ruta.");
      }
    } catch (err: any) {
      console.error("Error al eliminar ruta:", err);
      toast.error(err?.message || "Ocurrió un error al eliminar la ruta.");
    } finally {
      setEliminando(false);
    }
  };

  return (
    <AppLayout>
      {/* Breadcrumb Minimalista */}
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
        <span style={{ color: "#1e293b", fontWeight: 500 }}>Rutas</span>
      </div>

      {/* Encabezado de Sección */}
      <div className="page-header mb-5">
        <div>
          <h1 className="page-title flex items-center gap-2 text-xl font-bold text-slate-900">
            <FolderTree size={22} className="text-[#2B8FCC]" />
            Rutas
          </h1>
          <p className="subtext text-slate-500 text-xs mt-0.5">
            Catálogo de módulos y grupos de menú del sistema. Haz clic en el nombre de una ruta padre para administrar sus rutas hijas.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            className="btn btn-outline"
            onClick={cargarRutasPadre}
            disabled={cargando}
            title="Recargar rutas"
          >
            <RefreshCw size={15} className={cargando ? "animate-spin" : ""} />
            Recargar
          </button>
        </div>
      </div>

      {/* Barra de Filtros (Horizontal encima de la tabla) */}
      <div className="card mb-4 p-4 border border-slate-200/80 shadow-sm rounded-xl filter-card">
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "flex-end",
            justifyContent: "space-between",
            gap: "16px",
            flexWrap: "wrap",
          }}
        >
          {/* Izquierda: Buscador */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "4px",
              width: "280px",
              minWidth: "180px",
            }}
          >
            <label
              className="form-label text-[11px] font-semibold text-slate-600"
              style={{ marginBottom: 0 }}
            >
              Buscar ruta padre
            </label>
            <div style={{ position: "relative", width: "100%" }}>
              <Search
                size={14}
                style={{
                  position: "absolute",
                  left: "10px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "#94a3b8",
                }}
              />
              <input
                type="text"
                className="form-control text-xs py-1.5"
                style={{
                  width: "100%",
                  paddingLeft: "30px",
                  borderRadius: "20px",
                  height: "32px",
                }}
                placeholder="Buscar por nombre o ícono..."
                value={filtroTexto}
                onChange={(e) => setFiltroTexto(e.target.value)}
              />
              {filtroTexto && (
                <button
                  type="button"
                  onClick={() => setFiltroTexto("")}
                  style={{
                    position: "absolute",
                    right: "8px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    color: "#94a3b8",
                    cursor: "pointer",
                    padding: 0,
                  }}
                  title="Limpiar búsqueda"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          {/* Derecha: Botón de alta "+" (solo ícono, sin texto) */}
          <div style={{ display: "flex", flexDirection: "row", alignItems: "flex-end", gap: "8px" }}>
            <button
              type="button"
              className="btn btn-primary"
              style={{
                width: "34px",
                height: "34px",
                padding: 0,
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "#2B8FCC",
                boxShadow: "0 2px 6px rgba(43, 143, 204, 0.35)",
              }}
              onClick={handleAbrirCrear}
              title="Agregar ruta padre"
            >
              <Plus size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Tabla de Rutas Padre */}
      <div className="alegra-table-container border border-slate-200/80 shadow-sm rounded-xl overflow-hidden mb-4">
        <table className="alegra-table">
          <thead>
            <tr>
              <th style={{ width: "80px" }}>Orden</th>
              <th>Nombre</th>
              <th className="text-right" style={{ width: "100px" }}>
                Acciones
              </th>
            </tr>
          </thead>
          <tbody>
            {cargando ? (
              Array.from({ length: 5 }).map((_, idx) => (
                <tr key={`sk-ruta-${idx}`}>
                  <td>
                    <div className="skeleton-box sm" style={{ width: "30px" }}></div>
                  </td>
                  <td>
                    <div className="skeleton-box" style={{ width: "65%" }}></div>
                  </td>
                  <td className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <div className="skeleton-circle"></div>
                      <div className="skeleton-circle"></div>
                    </div>
                  </td>
                </tr>
              ))
            ) : rutasFiltradas.length === 0 ? (
              <tr>
                <td colSpan={3} style={{ textAlign: "center", padding: "48px 16px" }}>
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
                      <Search size={22} />
                    </div>
                    <p style={{ fontSize: "14px", fontWeight: 600, color: "#334155", margin: 0 }}>
                      No se encontraron rutas
                    </p>
                    <p style={{ fontSize: "12px", color: "#64748b", margin: 0 }}>
                      {filtroTexto
                        ? "Intenta ajustando el filtro de búsqueda."
                        : "Comienza agregando una ruta padre con el botón '+'."}
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              rutasPaginadas.map((row) => (
                <tr key={row.i_CveFuncionalidad} className="hover:bg-slate-50/60 transition-colors">
                  {/* Orden */}
                  <td>
                    <span
                      className="inline-flex items-center justify-center font-mono text-xs font-semibold px-2 py-0.5 rounded"
                      style={{
                        backgroundColor: "#f1f5f9",
                        color: "#1e293b",
                      }}
                    >
                      {row.i_Orden ?? 0}
                    </span>
                  </td>

                  {/* Nombre (Enlace a las rutas hijas) */}
                  <td>
                    <div style={{ display: "flex", alignItems: "center" }}>
                      {row.v_Icon && (
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            width: "24px",
                            marginRight: "8px",
                            color: "#2B8FCC",
                            fontSize: "16px",
                            flexShrink: 0,
                          }}
                        >
                          <i className={row.v_Icon}></i>
                        </span>
                      )}
                      <Link
                        href={`/rutas/${row.i_CveFuncionalidad}`}
                        style={{
                          color: "#2B8FCC",
                          fontWeight: 600,
                          fontSize: "12px",
                          textDecoration: "underline",
                          cursor: "pointer",
                        }}
                        className="hover:text-[#2275ab] transition-colors"
                        title="Ver rutas hijas de este módulo"
                      >
                        {row.v_NombreFuncionalidad || "—"}
                      </Link>
                    </div>
                  </td>

                  {/* Acciones */}
                  <td className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        className="btn-icon"
                        style={{ color: "#1e3a5f" }}
                        onClick={() => handleAbrirEditar(row)}
                        title="Editar ruta padre"
                      >
                        <Edit3 size={15} />
                      </button>

                      <button
                        type="button"
                        className="btn-icon danger"
                        onClick={() => setRutaEliminar(row)}
                        title="Eliminar ruta padre"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Paginación de 5 en 5 */}
      <PaginadorCustom
        paginaActual={paginaActual}
        totalPaginas={totalPaginas}
        totalRegistros={totalRegistros}
        tamano={tamanoPagina}
        onCambioPagina={(pag) => setPaginaActual(pag)}
        onCambioTamano={(tam) => {
          setTamanoPagina(tam);
          setPaginaActual(1);
        }}
      />

      {/* Modal Crear / Editar Ruta Padre */}
      <ModalCrearEditarRuta
        abierto={modalFormAbierto}
        modo="padre"
        siguienteOrden={siguienteOrden}
        rutaEditar={rutaEditar}
        onCerrar={() => {
          setModalFormAbierto(false);
          setRutaEditar(null);
        }}
        onGuardado={cargarRutasPadre}
      />

      {/* Modal Confirmar Eliminar */}
      {rutaEliminar && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: "460px" }}>
            <div className="modal-header">
              <div className="flex items-center gap-2 text-danger">
                <AlertTriangle size={20} className="text-danger" />
                <h3 className="modal-title" style={{ fontWeight: 700 }}>
                  Confirmar eliminación
                </h3>
              </div>
              <button
                type="button"
                className="btn-close"
                onClick={() => setRutaEliminar(null)}
                disabled={eliminando}
                title="Cerrar"
              >
                <X size={18} />
              </button>
            </div>

            <div className="modal-body" style={{ padding: "20px 24px" }}>
              <p style={{ fontSize: "13px", color: "var(--text-primary)", margin: 0, lineHeight: 1.5 }}>
                ¿Deseas eliminar a <strong>{rutaEliminar.v_NombreFuncionalidad}</strong>? Si lo
                haces, se perderán todos sus datos.
              </p>
            </div>

            <div className="modal-footer" style={{ padding: "14px 24px" }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setRutaEliminar(null)}
                disabled={eliminando}
              >
                Cerrar
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={handleConfirmarEliminar}
                disabled={eliminando}
              >
                {eliminando ? "Eliminando..." : "Eliminar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
