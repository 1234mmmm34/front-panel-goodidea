"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  Route,
  Plus,
  Search,
  Edit3,
  Trash2,
  RefreshCw,
  ChevronRight,
  AlertTriangle,
  X,
  ArrowLeft,
  FolderTree,
} from "lucide-react";
import { T_Rutas } from "@/types/rutas";
import { RutasService } from "@/services/rutas.service";
import { AppLayout } from "@/components/layout/AppLayout";
import { PaginadorCustom } from "@/components/ui/PaginadorCustom";
import { ModalCrearEditarRuta } from "@/components/rutas/ModalCrearEditarRuta";
import { useToast } from "@/context/ToastContext";
import { useMenu } from "@/context/MenuContext";

export default function RutasHijasPage() {
  const { toast } = useToast();
  const { refrescarMenu } = useMenu();
  const params = useParams();
  const idPadre = Number(params?.id || 0);

  const [nombrePadre, setNombrePadre] = useState<string>("");
  const [iconoPadre, setIconoPadre] = useState<string>("");
  const [cargandoPadre, setCargandoPadre] = useState<boolean>(true);

  const [rutasHijas, setRutasHijas] = useState<T_Rutas[]>([]);
  const [cargandoHijas, setCargandoHijas] = useState<boolean>(true);

  // Filtro de búsqueda local
  const [filtroTexto, setFiltroTexto] = useState<string>("");

  // Paginación (de 5 en 5)
  const [paginaActual, setPaginaActual] = useState<number>(1);
  const [tamanoPagina, setTamanoPagina] = useState<number>(5);

  // Modales
  const [modalFormAbierto, setModalFormAbierto] = useState<boolean>(false);
  const [rutaEditar, setRutaEditar] = useState<T_Rutas | null>(null);

  const [rutaEliminar, setRutaEliminar] = useState<T_Rutas | null>(null);
  const [eliminando, setEliminando] = useState<boolean>(false);

  // Cargar datos del padre para el breadcrumb y encabezado
  useEffect(() => {
    if (!idPadre) return;
    setCargandoPadre(true);
    RutasService.getRutasPadre()
      .then((padres) => {
        const p = padres.find((item) => item.i_CveFuncionalidad === idPadre);
        if (p) {
          setNombrePadre(p.v_NombreFuncionalidad || `Módulo #${idPadre}`);
          setIconoPadre(p.v_Icon || "");
        } else {
          setNombrePadre(`Módulo #${idPadre}`);
        }
      })
      .catch((err) => {
        console.error("Error al obtener información del padre:", err);
      })
      .finally(() => {
        setCargandoPadre(false);
      });
  }, [idPadre]);

  // Cargar rutas hijas
  const cargarRutasHijas = useCallback(async () => {
    if (!idPadre) return;
    setCargandoHijas(true);
    try {
      const data = await RutasService.getRutasHijas(idPadre);
      setRutasHijas(data || []);
    } catch (err) {
      console.error("Error al cargar rutas hijas:", err);
      toast.error("No se pudieron cargar las rutas hijas del módulo.");
    } finally {
      setCargandoHijas(false);
    }
  }, [idPadre, toast]);

  useEffect(() => {
    cargarRutasHijas();
  }, [cargarRutasHijas]);

  // Rutas hijas filtradas
  const hijasFiltradas = useMemo(() => {
    const q = filtroTexto.trim().toLowerCase();
    if (!q) return rutasHijas;
    return rutasHijas.filter((r) => {
      const nom = (r.v_NombreFuncionalidad || "").toLowerCase();
      const ruta = (r.v_RutaFuncionalidad || "").toLowerCase();
      const idStr = String(r.i_CveFuncionalidad);
      return nom.includes(q) || ruta.includes(q) || idStr.includes(q);
    });
  }, [rutasHijas, filtroTexto]);

  // Paginación
  const totalRegistros = hijasFiltradas.length;
  const totalPaginas = Math.ceil(totalRegistros / tamanoPagina) || 1;

  const hijasPaginadas = useMemo(() => {
    const inicio = (paginaActual - 1) * tamanoPagina;
    return hijasFiltradas.slice(inicio, inicio + tamanoPagina);
  }, [hijasFiltradas, paginaActual, tamanoPagina]);

  useEffect(() => {
    setPaginaActual(1);
  }, [filtroTexto, tamanoPagina]);

  // Siguiente orden para nueva ruta hija
  const siguienteOrden = useMemo(() => {
    if (rutasHijas.length === 0) return 1;
    const maxOrden = Math.max(...rutasHijas.map((r) => r.i_Orden || 0));
    return maxOrden >= 1 ? maxOrden + 1 : 1;
  }, [rutasHijas]);

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
        cargarRutasHijas();
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
        <Link
          href="/rutas"
          style={{ color: "#7a96b0", textDecoration: "none" }}
          className="hover:text-slate-900 transition-colors"
        >
          Rutas
        </Link>
        <ChevronRight size={13} style={{ color: "#b5cfe8" }} />
        <span style={{ color: "#1e293b", fontWeight: 500 }}>
          {cargandoPadre ? "Cargando..." : nombrePadre || `Módulo #${idPadre}`}
        </span>
      </div>

      {/* Encabezado de Sección */}
      <div className="page-header mb-5">
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <Link
              href="/rutas"
              className="btn btn-outline"
              style={{
                width: "32px",
                height: "32px",
                padding: 0,
                borderRadius: "50%",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
              }}
              title="Regresar a rutas padre"
            >
              <ArrowLeft size={16} />
            </Link>

            <h1 className="page-title flex items-center gap-2 text-xl font-bold text-slate-900" style={{ margin: 0 }}>
              {iconoPadre ? (
                <i className={`${iconoPadre} text-[#2B8FCC]`} style={{ fontSize: "20px" }}></i>
              ) : (
                <Route size={22} className="text-[#2B8FCC]" />
              )}
              Submenú de {cargandoPadre ? "..." : nombrePadre || `Módulo #${idPadre}`}
            </h1>
          </div>
          <p className="subtext text-slate-500 text-xs mt-1 ml-10">
            Administra las opciones internas y URLs accesibles dentro de este grupo de menú.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            className="btn btn-outline"
            onClick={cargarRutasHijas}
            disabled={cargandoHijas}
            title="Recargar rutas hijas"
          >
            <RefreshCw size={15} className={cargandoHijas ? "animate-spin" : ""} />
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
              Buscar ruta hija
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
                placeholder="Buscar por nombre o URL..."
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
              title="Agregar ruta hija"
            >
              <Plus size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Tabla de Rutas Hijas */}
      <div className="alegra-table-container border border-slate-200/80 shadow-sm rounded-xl overflow-hidden mb-4">
        <table className="alegra-table">
          <thead>
            <tr>
              <th style={{ width: "80px" }}>Orden</th>
              <th style={{ width: "240px" }}>Nombre</th>
              <th>Ruta</th>
              <th className="text-right" style={{ width: "100px" }}>
                Acciones
              </th>
            </tr>
          </thead>
          <tbody>
            {cargandoHijas ? (
              Array.from({ length: 5 }).map((_, idx) => (
                <tr key={`sk-hija-${idx}`}>
                  <td>
                    <div className="skeleton-box sm" style={{ width: "30px" }}></div>
                  </td>
                  <td>
                    <div className="skeleton-box" style={{ width: "65%" }}></div>
                  </td>
                  <td>
                    <div className="skeleton-box sm" style={{ width: "75%" }}></div>
                  </td>
                  <td className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <div className="skeleton-circle"></div>
                      <div className="skeleton-circle"></div>
                    </div>
                  </td>
                </tr>
              ))
            ) : hijasFiltradas.length === 0 ? (
              <tr>
                <td colSpan={4} style={{ textAlign: "center", padding: "48px 16px" }}>
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
                      No se encontraron rutas hijas
                    </p>
                    <p style={{ fontSize: "12px", color: "#64748b", margin: 0 }}>
                      {filtroTexto
                        ? "Intenta ajustando el filtro de búsqueda."
                        : "Comienza agregando una ruta hija con el botón '+'."}
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              hijasPaginadas.map((row) => (
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

                  {/* Nombre */}
                  <td>
                    <span className="font-semibold text-slate-900 text-xs truncate max-w-[240px]">
                      {row.v_NombreFuncionalidad || "—"}
                    </span>
                  </td>

                  {/* Ruta URL */}
                  <td>
                    <span className="font-mono text-xs text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                      {row.v_RutaFuncionalidad || "—"}
                    </span>
                  </td>

                  {/* Acciones */}
                  <td className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        className="btn-icon"
                        style={{ color: "#1e3a5f" }}
                        onClick={() => handleAbrirEditar(row)}
                        title="Editar ruta hija"
                      >
                        <Edit3 size={15} />
                      </button>

                      <button
                        type="button"
                        className="btn-icon danger"
                        onClick={() => setRutaEliminar(row)}
                        title="Eliminar ruta hija"
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

      {/* Modal Crear / Editar Ruta Hija */}
      <ModalCrearEditarRuta
        abierto={modalFormAbierto}
        modo="hija"
        idPadre={idPadre}
        siguienteOrden={siguienteOrden}
        rutaEditar={rutaEditar}
        onCerrar={() => {
          setModalFormAbierto(false);
          setRutaEditar(null);
        }}
        onGuardado={cargarRutasHijas}
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
