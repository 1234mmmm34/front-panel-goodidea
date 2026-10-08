"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Shield,
  Plus,
  Search,
  Edit3,
  Trash2,
  RefreshCw,
  ChevronRight,
  ShieldCheck,
  AlertTriangle,
  X,
  Building2,
} from "lucide-react";
import { T_Perfiles } from "@/types/perfiles";
import { Tenant } from "@/types/usuarios";
import { PerfilesService } from "@/services/perfiles.service";
import { AppLayout } from "@/components/layout/AppLayout";
import { PaginadorCustom } from "@/components/ui/PaginadorCustom";
import { ModalCrearEditarPerfil } from "@/components/perfiles/ModalCrearEditarPerfil";
import { obtenerSesionActual } from "@/lib/api-client";
import { useToast } from "@/context/ToastContext";
import { useMenu } from "@/context/MenuContext";

export default function PerfilesPage() {
  const { toast } = useToast();
  const { refrescarMenu } = useMenu();

  const [perfiles, setPerfiles] = useState<T_Perfiles[]>([]);
  const [cargando, setCargando] = useState<boolean>(true);
  const [tenants, setTenants] = useState<Tenant[]>([]);

  // Tenant seleccionado
  const [i_CveTenant, setICveTenant] = useState<number>(() => {
    const sesion = obtenerSesionActual();
    return sesion?.id_tenant ?? 1;
  });

  // Filtro de búsqueda local
  const [filtroTexto, setFiltroTexto] = useState<string>("");

  // Paginación (de 5 en 5 según especificación)
  const [paginaActual, setPaginaActual] = useState<number>(1);
  const [tamanoPagina, setTamanoPagina] = useState<number>(5);

  // Modales
  const [modalFormAbierto, setModalFormAbierto] = useState<boolean>(false);
  const [perfilEditar, setPerfilEditar] = useState<T_Perfiles | null>(null);

  const [perfilEliminar, setPerfilEliminar] = useState<T_Perfiles | null>(null);
  const [eliminando, setEliminando] = useState<boolean>(false);

  // Cargar lista de tenants del usuario
  useEffect(() => {
    const sesion = obtenerSesionActual();
    const idUsuarioSesion = sesion?.id_usuario ?? 0;
    const idTenantSesion = sesion?.id_tenant ?? 1;

    if (idTenantSesion > 0) {
      setICveTenant(idTenantSesion);
    }

    if (idUsuarioSesion > 0) {
      PerfilesService.getTenants(idUsuarioSesion).then((list) => {
        setTenants(list || []);
      });
    }
  }, []);

  // Cargar perfiles del tenant
  const cargarPerfiles = useCallback(async () => {
    if (!i_CveTenant) return;
    setCargando(true);
    try {
      const data = await PerfilesService.getPerfiles(i_CveTenant);
      setPerfiles(data || []);
    } catch (err) {
      console.error("Error al cargar perfiles:", err);
      toast.error("No se pudieron cargar los perfiles del tenant.");
    } finally {
      setCargando(false);
    }
  }, [i_CveTenant, toast]);

  useEffect(() => {
    cargarPerfiles();
  }, [cargarPerfiles]);

  // Perfiles filtrados por búsqueda
  const perfilesFiltrados = useMemo(() => {
    const q = filtroTexto.trim().toLowerCase();
    if (!q) return perfiles;
    return perfiles.filter((p) => {
      const nom = (p.v_NombrePerfil || "").toLowerCase();
      const desc = (p.v_Descripcion || "").toLowerCase();
      const idStr = String(p.i_CvePerfil);
      return nom.includes(q) || desc.includes(q) || idStr.includes(q);
    });
  }, [perfiles, filtroTexto]);

  // Paginación sobre perfiles filtrados
  const totalRegistros = perfilesFiltrados.length;
  const totalPaginas = Math.ceil(totalRegistros / tamanoPagina) || 1;

  const perfilesPaginados = useMemo(() => {
    const inicio = (paginaActual - 1) * tamanoPagina;
    return perfilesFiltrados.slice(inicio, inicio + tamanoPagina);
  }, [perfilesFiltrados, paginaActual, tamanoPagina]);

  // Reset de página al cambiar filtro o tamaño
  useEffect(() => {
    setPaginaActual(1);
  }, [filtroTexto, i_CveTenant, tamanoPagina]);

  // Handlers
  const handleAbrirCrear = () => {
    setPerfilEditar(null);
    setModalFormAbierto(true);
  };

  const handleAbrirEditar = (perfil: T_Perfiles) => {
    setPerfilEditar(perfil);
    setModalFormAbierto(true);
  };

  const handleConfirmarEliminar = async () => {
    if (!perfilEliminar) return;
    setEliminando(true);

    try {
      const res = await PerfilesService.eliminarPerfil(perfilEliminar.i_CvePerfil);
      if (res.exito) {
        toast.success("Perfil eliminado exitosamente.");
        setPerfilEliminar(null);
        refrescarMenu(true);
        cargarPerfiles();
      } else {
        toast.error(res.mensaje || "Ocurrió un error al eliminar el perfil.");
      }
    } catch (err: any) {
      console.error("Error al eliminar perfil:", err);
      toast.error(err?.message || "Ocurrió un error al eliminar el perfil.");
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
        <span style={{ color: "#1e293b", fontWeight: 500 }}>Perfiles</span>
      </div>

      {/* Encabezado de Sección */}
      <div className="page-header mb-5">
        <div>
          <h1 className="page-title flex items-center gap-2 text-xl font-bold text-slate-900">
            <Shield size={22} className="text-[#2B8FCC]" />
            Perfiles
          </h1>
          <p className="subtext text-slate-500 text-xs mt-0.5">
            Catálogo de tipos de usuario del tenant y configuración de sus permisos sobre los módulos del sistema.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            className="btn btn-outline"
            onClick={cargarPerfiles}
            disabled={cargando}
            title="Recargar perfiles"
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
          {/* Izquierda: Filtros */}
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              alignItems: "flex-end",
              gap: "12px",
              flexWrap: "wrap",
            }}
          >
            {/* Empresa / Tenant (si hay tenants disponibles) */}
            {tenants.length > 1 && (
              <div style={{ display: "flex", flexDirection: "column", gap: "4px", minWidth: "180px" }}>
                <label
                  className="form-label text-[11px] font-semibold text-slate-600"
                  style={{ marginBottom: 0 }}
                >
                  Empresa
                </label>
                <select
                  className="form-select text-xs py-1.5"
                  style={{ borderRadius: "20px", height: "32px" }}
                  value={i_CveTenant}
                  onChange={(e) => setICveTenant(Number(e.target.value))}
                >
                  {tenants.map((t) => (
                    <option key={t.i_CveTenant} value={t.i_CveTenant}>
                      {t.v_Nombre}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Buscador en la barra horizontal */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "4px",
                width: "260px",
                minWidth: "180px",
              }}
            >
              <label
                className="form-label text-[11px] font-semibold text-slate-600"
                style={{ marginBottom: 0 }}
              >
                Buscar perfil
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
                  placeholder="Buscar por nombre o descripción..."
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
          </div>

          {/* Derecha: Botón de alta "+" (solo el ícono, sin texto) */}
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
              title="Crear nuevo perfil"
            >
              <Plus size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Tabla de Perfiles */}
      <div className="alegra-table-container border border-slate-200/80 shadow-sm rounded-xl overflow-hidden mb-4">
        <table className="alegra-table">
          <thead>
            <tr>
              <th style={{ width: "280px" }}>Nombre</th>
              <th>Descripción</th>
              <th className="text-right" style={{ width: "100px" }}>
                Acciones
              </th>
            </tr>
          </thead>
          <tbody>
            {cargando ? (
              Array.from({ length: 5 }).map((_, idx) => (
                <tr key={`sk-perfil-${idx}`}>
                  <td>
                    <div className="skeleton-box" style={{ width: "65%" }}></div>
                  </td>
                  <td>
                    <div className="skeleton-box sm" style={{ width: "85%" }}></div>
                  </td>
                  <td className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <div className="skeleton-circle"></div>
                      <div className="skeleton-circle"></div>
                    </div>
                  </td>
                </tr>
              ))
            ) : perfilesFiltrados.length === 0 ? (
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
                      No se encontraron perfiles
                    </p>
                    <p style={{ fontSize: "12px", color: "#64748b", margin: 0 }}>
                      {filtroTexto
                        ? "Intenta ajustando el filtro de búsqueda."
                        : "Comienza creando un nuevo perfil con el botón '+'."}
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              perfilesPaginados.map((row) => {
                const esAdmin = row.i_CvePerfil <= 1;

                return (
                  <tr key={row.i_CvePerfil} className="hover:bg-slate-50/60 transition-colors">
                    {/* Nombre */}
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        {esAdmin ? (
                          <ShieldCheck size={16} style={{ color: "#2B8FCC", flexShrink: 0 }} />
                        ) : (
                          <Shield size={16} style={{ color: "#94a3b8", flexShrink: 0 }} />
                        )}
                        <span className="font-semibold text-slate-900 text-xs truncate max-w-[240px]">
                          {row.v_NombrePerfil || "—"}
                        </span>
                        {esAdmin && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-sky-50 text-sky-700 border border-sky-200">
                            Sistema
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Descripción */}
                    <td>
                      <span className="text-slate-600 text-xs">
                        {row.v_Descripcion || <span className="text-slate-400 italic">Sin descripción</span>}
                      </span>
                    </td>

                    {/* Acciones */}
                    <td className="text-right">
                      {esAdmin ? (
                        <span
                          className="text-[11px] text-slate-400 italic font-normal"
                          title="Perfil de sistema protegido"
                        >
                          Protegido
                        </span>
                      ) : (
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            className="btn-icon"
                            style={{ color: "#1e3a5f" }}
                            onClick={() => handleAbrirEditar(row)}
                            title="Editar perfil"
                          >
                            <Edit3 size={15} />
                          </button>

                          <button
                            type="button"
                            className="btn-icon danger"
                            onClick={() => setPerfilEliminar(row)}
                            title="Eliminar perfil"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })
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

      {/* Modal Crear / Editar Perfil */}
      <ModalCrearEditarPerfil
        abierto={modalFormAbierto}
        perfilEditar={perfilEditar}
        onCerrar={() => {
          setModalFormAbierto(false);
          setPerfilEditar(null);
        }}
        onGuardado={cargarPerfiles}
      />

      {/* Modal Confirmar Eliminar Perfil */}
      {perfilEliminar && (
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
                onClick={() => setPerfilEliminar(null)}
                disabled={eliminando}
                title="Cerrar"
              >
                <X size={18} />
              </button>
            </div>

            <div className="modal-body" style={{ padding: "20px 24px" }}>
              <p style={{ fontSize: "13px", color: "var(--text-primary)", margin: 0, lineHeight: 1.5 }}>
                ¿Deseas eliminar el perfil <strong>{perfilEliminar.v_NombrePerfil}</strong>? Si lo
                haces, se perderán todos sus datos.
              </p>
            </div>

            <div className="modal-footer" style={{ padding: "14px 24px" }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setPerfilEliminar(null)}
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
