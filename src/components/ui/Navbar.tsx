"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sun, Calendar, Clock, Layers, Building2, Key, LogOut, User as UserIcon } from "lucide-react";
import { obtenerSesionActual } from "@/lib/api-client";
import { AuthService } from "@/services/auth.service";
import { SesionAlmacenada } from "@/types/auth";

import { useToast } from "@/context/ToastContext";

export const Navbar: React.FC = () => {
  const pathname = usePathname();
  const [sesion, setSesion] = useState<SesionAlmacenada | null>(null);
  const [mostrarModalSesion, setMostrarModalSesion] = useState<boolean>(false);
  const [tokenInput, setTokenInput] = useState<string>("");
  const [idUsuarioInput, setIdUsuarioInput] = useState<number>(1);
  const [idTenantInput, setIdTenantInput] = useState<number>(1);
  const { toast, confirmModal } = useToast();

  useEffect(() => {
    const s = obtenerSesionActual();
    if (s) {
      setSesion(s);
      if (s.token) setTokenInput(s.token);
      if (s.id_usuario) setIdUsuarioInput(s.id_usuario);
      if (s.id_tenant) setIdTenantInput(s.id_tenant);
    }
  }, []);

  const handleLogout = () => {
    confirmModal({
      title: "Cerrar sesión",
      message: "¿Deseas cerrar sesión?",
      confirmText: "Cerrar sesión",
      cancelText: "Cancelar",
      onConfirm: () => {
        toast.info("Sesión cerrada exitosamente");
        AuthService.logout();
      },
    });
  };

  return (
    <header className="navbar">
      <div className="navbar-inner">
        <div className="navbar-brand">
          <Sun size={24} className="sun-icon" />
          <span>STPS Control Panel</span>
        </div>

        <nav className="nav-links">
          <Link
            href="/calendario"
            className={`nav-link ${pathname.startsWith("/calendario") ? "active" : ""}`}
          >
            <span className="flex items-center gap-1.5">
              <Calendar size={16} /> Calendario
            </span>
          </Link>

          <Link
            href="/programacion"
            className={`nav-link ${pathname.startsWith("/programacion") ? "active" : ""}`}
          >
            <span className="flex items-center gap-1.5">
              <Clock size={16} /> Servicios Agendados
            </span>
          </Link>

          <Link
            href="/servicios"
            className={`nav-link ${pathname.startsWith("/servicios") ? "active" : ""}`}
          >
            <span className="flex items-center gap-1.5">
              <Layers size={16} /> Catálogo Servicios
            </span>
          </Link>

          <Link
            href="/empresas"
            className={`nav-link ${pathname.startsWith("/empresas") ? "active" : ""}`}
          >
            <span className="flex items-center gap-1.5">
              <Building2 size={16} /> Empresas
            </span>
          </Link>
        </nav>

        <div className="navbar-user flex items-center gap-3">
          <div className="flex items-center gap-2">
            <button
              className="btn btn-outline btn-sm flex items-center gap-1.5"
              onClick={() => setMostrarModalSesion(true)}
              title="Ver datos de sesión JWT"
            >
              <UserIcon size={16} className="text-primary" />
              <span>{sesion?.username || sesion?.email || "Usuario STPS"}</span>
              {sesion?.tenant && (
                <span className="badge badge-info text-[10px] ml-1">{sesion.tenant}</span>
              )}
            </button>
          </div>

          <button
            className="btn btn-danger btn-sm flex items-center gap-1"
            onClick={handleLogout}
            title="Cerrar sesión"
          >
            <LogOut size={15} />
            <span>Salir</span>
          </button>
        </div>
      </div>

      {/* Modal para inspeccionar/configurar Token JWT */}
      {mostrarModalSesion && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: "480px" }}>
            <div className="modal-header">
              <h3 className="modal-title flex items-center gap-2">
                <Key size={18} className="text-primary" /> Información de Sesión Activa
              </h3>
              <button className="btn-icon" onClick={() => setMostrarModalSesion(false)}>
                ✕
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Token JWT Actual</label>
                <textarea
                  className="form-control text-xs font-mono"
                  rows={4}
                  value={tokenInput}
                  onChange={(e) => setTokenInput(e.target.value)}
                  placeholder="Bearer Token..."
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="form-group">
                  <label className="form-label">ID Usuario</label>
                  <input
                    type="number"
                    className="form-control"
                    value={idUsuarioInput}
                    onChange={(e) => setIdUsuarioInput(Number(e.target.value))}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">ID Tenant</label>
                  <input
                    type="number"
                    className="form-control"
                    value={idTenantInput}
                    onChange={(e) => setIdTenantInput(Number(e.target.value))}
                  />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setMostrarModalSesion(false)}>
                Cerrar
              </button>
              <button
                className="btn btn-primary"
                onClick={() => {
                  const sActual: SesionAlmacenada = {
                    id_usuario: idUsuarioInput,
                    username: sesion?.username || "Usuario",
                    email: sesion?.email || "usuario@stps.com",
                    tenant: sesion?.tenant || "STPS",
                    token: tokenInput.trim(),
                    id_perfil: sesion?.id_perfil || 1,
                    id_tenant: idTenantInput,
                  };
                  localStorage.setItem("userData", JSON.stringify(sActual));
                  localStorage.setItem("sesion_stps", JSON.stringify(sActual));
                  setSesion(sActual);
                  setMostrarModalSesion(false);
                  window.location.reload();
                }}
              >
                Actualizar Sesión
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
