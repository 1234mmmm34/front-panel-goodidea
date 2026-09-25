"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Users, Plus, Search, Edit3, Trash2, RefreshCw, ChevronRight, Phone } from "lucide-react";
import { FiltrosUsuariosState, Tenant, Usuario } from "@/types/usuarios";
import { UsuariosService } from "@/services/usuarios.service";
import { AppLayout } from "@/components/layout/AppLayout";
import { PaginadorCustom } from "@/components/ui/PaginadorCustom";
import { ModalConfirmarEliminar } from "@/components/ui/ModalConfirmarEliminar";
import { ModalCrearEditarUsuario } from "@/components/usuarios/ModalCrearEditarUsuario";
import { obtenerSesionActual } from "@/lib/api-client";
import { useToast } from "@/context/ToastContext";
import { format } from "date-fns";
import { es } from "date-fns/locale";

function formatearTelefono(tel: string | null | undefined): string {
  if (!tel || !tel.trim() || tel.trim().toUpperCase() === "N/A") return "";
  const clean = tel.trim().replace(/\D/g, "");
  if (clean.length === 10) {
    return `${clean.slice(0, 3)}-${clean.slice(3, 6)}-${clean.slice(6)}`;
  }
  return tel.trim();
}

function formatearFechaCreacion(fechaIso: string | null | undefined): string {
  if (!fechaIso) return "—";
  try {
    const d = new Date(fechaIso);
    if (isNaN(d.getTime())) return fechaIso;
    return format(d, "dd/MMM/yyyy HH:mm", { locale: es });
  } catch {
    return fechaIso;
  }
}

export default function UsuariosPage() {
  const { toast } = useToast();

  const [datos, setDatos] = useState<Usuario[]>([]);
  const [cargando, setCargando] = useState<boolean>(true);
  const [tenants, setTenants] = useState<Tenant[]>([]);

  // Paginación (Default tamano = 8)
  const [paginaActual, setPaginaActual] = useState<number>(1);
  const [tamanoPagina, setTamanoPagina] = useState<number>(8);
  const [totalRegistros, setTotalRegistros] = useState<number>(0);
  const [totalPaginas, setTotalPaginas] = useState<number>(1);

  // Filtros
  const [filtros, setFiltros] = useState<FiltrosUsuariosState>(() => {
    const sesion = obtenerSesionActual();
    return {
      i_CveTenant: sesion?.id_tenant ?? 0,
      i_Activo: 2,
      i_Confirmado: 2,
      searchTerm: "",
    };
  });
  const [localSearch, setLocalSearch] = useState<string>("");

  // Modales
  const [modalFormAbierto, setModalFormAbierto] = useState<boolean>(false);
  const [usuarioEditar, setUsuarioEditar] = useState<Usuario | null>(null);

  const [itemEliminar, setItemEliminar] = useState<Usuario | null>(null);
  const [eliminando, setEliminando] = useState<boolean>(false);

  // Cargar lista de tenants inicial
  useEffect(() => {
    const sesion = obtenerSesionActual();
    const idUsuarioSesion = sesion?.id_usuario ?? 0;
    const idTenantSesion = sesion?.id_tenant ?? 0;

    if (idTenantSesion > 0) {
      setFiltros((prev) => ({
        ...prev,
        i_CveTenant: prev.i_CveTenant || idTenantSesion,
      }));
    }

    if (idUsuarioSesion > 0) {
      UsuariosService.getTenants(idUsuarioSesion).then((list) => {
        setTenants(list || []);
      });
    }
  }, []);

  // Cargar usuarios paginados
  const cargarUsuarios = useCallback(async () => {
    setCargando(true);
    const res = await UsuariosService.getUsuariosPaginado({
      i_CveTenant: filtros.i_CveTenant,
      i_Activo: filtros.i_Activo,
      i_Confirmado: filtros.i_Confirmado,
      pagina: paginaActual,
      tamano: tamanoPagina,
      searchTerm: filtros.searchTerm,
    });

    setDatos(res.data);
    setTotalRegistros(res.i_TotalRegistros);
    const calcPaginas = Math.ceil(res.i_TotalRegistros / tamanoPagina);
    setTotalPaginas(calcPaginas > 0 ? calcPaginas : 1);
    setCargando(false);
  }, [filtros, paginaActual, tamanoPagina]);

  useEffect(() => {
    cargarUsuarios();
  }, [cargarUsuarios]);

  // Handlers de Filtros
  const handleCambiarFiltro = (campo: keyof FiltrosUsuariosState, valor: any) => {
    setFiltros((prev) => ({ ...prev, [campo]: valor }));
    setPaginaActual(1);
  };

  const handleEjecutarBusqueda = () => {
    setFiltros((prev) => ({ ...prev, searchTerm: localSearch }));
    setPaginaActual(1);
  };

  // Handler Eliminar
  const handleConfirmarEliminar = async () => {
    if (!itemEliminar) return;
    setEliminando(true);
    const res = await UsuariosService.eliminarUsuario(itemEliminar.id);
    setEliminando(false);
    setItemEliminar(null);

    if (res.exito) {
      toast.success("Usuario eliminado exitosamente.");
      cargarUsuarios();
    } else {
      toast.error(res.mensaje || "Ocurrió un error al intentar eliminar el usuario.");
    }
  };

  return (
    <AppLayout>
      {/* Breadcrumb Minimalista */}
      <div style={{ fontSize: "12px", color: "#7a96b0", display: "flex", alignItems: "center", gap: "6px", marginBottom: "14px" }}>
        <Link href="/calendario" style={{ color: "#7a96b0", textDecoration: "none" }} className="hover:text-slate-900 transition-colors">
          Configuración
        </Link>
        <ChevronRight size={13} style={{ color: "#b5cfe8" }} />
        <span style={{ color: "#1e293b", fontWeight: 500 }}>Usuarios</span>
      </div>

      {/* Encabezado de Sección */}
      <div className="page-header mb-5">
        <div>
          <h1 className="page-title flex items-center gap-2 text-xl font-bold text-slate-900">
            <Users size={22} className="text-sky-600" />
            Usuarios del sistema
          </h1>
          <p className="subtext text-slate-500 text-xs mt-0.5">
            Administra los usuarios de la plataforma, su acceso, estado de cuenta y confirmación de correo.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            className="btn btn-outline"
            onClick={cargarUsuarios}
            disabled={cargando}
            title="Recargar usuarios"
          >
            <RefreshCw size={15} className={cargando ? "animate-spin" : ""} />
            Recargar
          </button>
        </div>
      </div>

      {/* Barra de Filtros (Horizontal) */}
      <div className="card mb-4 p-4 border border-slate-200/80 shadow-sm rounded-xl filter-card">
        <div style={{ display: "flex", flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", gap: "16px", flexWrap: "wrap" }}>
          {/* Izquierda: Filtros Selects */}
          <div style={{ display: "flex", flexDirection: "row", alignItems: "flex-end", gap: "12px", flexWrap: "wrap" }}>
            {/* Empresa (Tenant) */}
            <div style={{ display: "flex", flexDirection: "column", gap: "4px", minWidth: "180px" }}>
              <label className="form-label text-[11px] font-semibold text-slate-600" style={{ marginBottom: 0 }}>
                Empresa
              </label>
              <select
                className="form-select text-xs py-1.5"
                style={{ borderRadius: "20px", height: "32px" }}
                value={filtros.i_CveTenant}
                onChange={(e) => handleCambiarFiltro("i_CveTenant", Number(e.target.value))}
              >
                <option value={0}>Todas las empresas</option>
                {tenants.map((t) => (
                  <option key={t.i_CveTenant} value={t.i_CveTenant}>
                    {t.v_Nombre}
                  </option>
                ))}
              </select>
            </div>

            {/* Estado de la cuenta (b_Active) */}
            <div style={{ display: "flex", flexDirection: "column", gap: "4px", minWidth: "160px" }}>
              <label className="form-label text-[11px] font-semibold text-slate-600" style={{ marginBottom: 0 }}>
                Estado de la cuenta
              </label>
              <select
                className="form-select text-xs py-1.5"
                style={{ borderRadius: "20px", height: "32px" }}
                value={filtros.i_Activo}
                onChange={(e) => handleCambiarFiltro("i_Activo", Number(e.target.value))}
              >
                <option value={2}>Todas las cuentas</option>
                <option value={1}>Usuarios activos</option>
                <option value={0}>Usuarios inactivos</option>
              </select>
            </div>

            {/* Estado de la invitación (b_mailConfirmed) */}
            <div style={{ display: "flex", flexDirection: "column", gap: "4px", minWidth: "160px" }}>
              <label className="form-label text-[11px] font-semibold text-slate-600" style={{ marginBottom: 0 }}>
                Estado de la invitación
              </label>
              <select
                className="form-select text-xs py-1.5"
                style={{ borderRadius: "20px", height: "32px" }}
                value={filtros.i_Confirmado}
                onChange={(e) => handleCambiarFiltro("i_Confirmado", Number(e.target.value))}
              >
                <option value={2}>Todos los registros</option>
                <option value={1}>Mail confirmado</option>
                <option value={0}>Invitación enviada</option>
              </select>
            </div>
          </div>

          {/* Derecha: Buscador y Botón "+" */}
          <div style={{ display: "flex", flexDirection: "row", alignItems: "flex-end", gap: "8px" }}>
            {/* Buscador de texto */}
            <div style={{ display: "flex", flexDirection: "column", gap: "4px", width: "220px", minWidth: "160px" }}>
              <div style={{ position: "relative", width: "100%" }}>
                <Search
                  size={14}
                  style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8", cursor: "pointer" }}
                  onClick={handleEjecutarBusqueda}
                />
                <input
                  type="text"
                  className="form-control text-xs py-1.5"
                  style={{ width: "100%", paddingLeft: "30px", borderRadius: "20px", height: "32px" }}
                  placeholder="Buscar usuario (Enter)..."
                  value={localSearch}
                  onChange={(e) => setLocalSearch(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleEjecutarBusqueda();
                    }
                  }}
                />
              </div>
            </div>

            {/* Botón "+" (sin texto) */}
            <button
              type="button"
              className="btn btn-primary"
              style={{
                width: "32px",
                height: "32px",
                padding: 0,
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
              onClick={() => {
                setUsuarioEditar(null);
                setModalFormAbierto(true);
              }}
              title="Agregar usuario"
            >
              <Plus size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Tabla de Usuarios */}
      <div className="alegra-table-container border border-slate-200/80 shadow-sm rounded-xl overflow-hidden mb-4">
        <table className="alegra-table">
          <thead>
            <tr>
              <th>Usuario</th>
              <th>Email</th>
              <th>Teléfono</th>
              <th className="text-center">Email confirmado</th>
              <th className="text-center">Activo</th>
              <th>Fecha de creación</th>
              <th className="text-right" style={{ width: "90px" }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {cargando ? (
              Array.from({ length: 5 }).map((_, idx) => (
                <tr key={`sk-user-${idx}`}>
                  <td><div className="skeleton-box" style={{ width: "70%" }}></div></td>
                  <td><div className="skeleton-box" style={{ width: "80%" }}></div></td>
                  <td><div className="skeleton-box sm" style={{ width: "90px" }}></div></td>
                  <td className="text-center"><div className="skeleton-box sm" style={{ width: "40px", margin: "0 auto" }}></div></td>
                  <td className="text-center"><div className="skeleton-box sm" style={{ width: "40px", margin: "0 auto" }}></div></td>
                  <td><div className="skeleton-box sm" style={{ width: "110px" }}></div></td>
                  <td className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <div className="skeleton-circle"></div>
                      <div className="skeleton-circle"></div>
                    </div>
                  </td>
                </tr>
              ))
            ) : datos.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: "center", padding: "48px 16px" }}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "6px" }}>
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
                      No se encontró información
                    </p>
                    <p style={{ fontSize: "12px", color: "#64748b", margin: 0 }}>
                      Intenta ajustando los filtros de búsqueda.
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              datos.map((row) => {
                const telFormateado = formatearTelefono(row.v_telefono);

                return (
                  <tr key={row.id} className="hover:bg-slate-50/60 transition-colors">
                    {/* Usuario (truncado con ellipsis) */}
                    <td>
                      <div
                        className="font-semibold text-slate-900 text-xs truncate max-w-[150px]"
                        title={row.username || "—"}
                      >
                        {row.username || "—"}
                      </div>
                    </td>

                    {/* Email (truncado con ellipsis) */}
                    <td>
                      <div
                        className="text-slate-700 text-xs truncate max-w-[200px]"
                        title={row.v_email || "—"}
                      >
                        {row.v_email || "—"}
                      </div>
                    </td>

                    {/* Teléfono */}
                    <td>
                      {telFormateado ? (
                        <div style={{ display: "inline-flex", alignItems: "center", gap: "6px" }} className="text-xs text-slate-700">
                          <Phone size={13} style={{ color: "#94a3b8", flexShrink: 0 }} />
                          <span>{telFormateado}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 text-xs italic">—</span>
                      )}
                    </td>

                    {/* Email confirmado */}
                    <td className="text-center">
                      {row.b_mailConfirmed ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                          Sí
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                          No
                        </span>
                      )}
                    </td>

                    {/* Activo */}
                    <td className="text-center">
                      {row.b_Active ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                          Sí
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                          No
                        </span>
                      )}
                    </td>

                    {/* Fecha de creación */}
                    <td>
                      <span className="text-slate-500 text-xs font-normal">
                        {formatearFechaCreacion(row.d_FechaCreacion)}
                      </span>
                    </td>

                    {/* Acciones */}
                    <td className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          className="btn-icon text-slate-600 hover:text-slate-900"
                          onClick={() => {
                            setUsuarioEditar(row);
                            setModalFormAbierto(true);
                          }}
                          title="Editar usuario"
                        >
                          <Edit3 size={15} />
                        </button>

                        <button
                          type="button"
                          className="btn-icon danger"
                          onClick={() => setItemEliminar(row)}
                          title="Eliminar usuario"
                        >
                          <Trash2 size={15} />
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

      {/* Paginación (Tamano por defecto = 8) */}
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

      {/* Modal Crear / Editar Usuario */}
      <ModalCrearEditarUsuario
        abierto={modalFormAbierto}
        usuarioEditar={usuarioEditar}
        iCveTenantFiltro={filtros.i_CveTenant}
        onCerrar={() => {
          setModalFormAbierto(false);
          setUsuarioEditar(null);
        }}
        onGuardado={cargarUsuarios}
      />

      {/* Modal Confirmar Eliminar Usuario */}
      <ModalConfirmarEliminar
        abierto={!!itemEliminar}
        nombreElemento={itemEliminar?.username || "este usuario"}
        mensajePersonalizado={
          itemEliminar
            ? `¿Deseas eliminar a ${itemEliminar.username || "este usuario"}? Si lo haces, se perderán sus datos.`
            : undefined
        }
        onCerrar={() => setItemEliminar(null)}
        onConfirmar={handleConfirmarEliminar}
        cargando={eliminando}
      />
    </AppLayout>
  );
}
