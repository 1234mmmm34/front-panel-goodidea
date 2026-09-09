"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Home,
  Calendar,
  Folder,
  LogOut,
  ChevronDown,
  ChevronRight,
  PanelLeft,
} from "lucide-react";
import { AuthService } from "@/services/auth.service";
import { useToast } from "@/context/ToastContext";

interface Props {
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export const Sidenav: React.FC<Props> = ({ collapsed, onToggleCollapse }) => {
  const pathname = usePathname();
  const router = useRouter();
  const [catalogosAbiertos, setCatalogosAbiertos] = useState<boolean>(true);

  const esInicio = pathname.startsWith("/calendario") || pathname === "/";
  const esProgramacion = pathname.startsWith("/programacion");
  const esEmpresas = pathname.startsWith("/empresas");
  const esServicios = pathname.startsWith("/servicios");

  const { confirmModal, toast } = useToast();

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

  const handleLogoClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (collapsed) {
      onToggleCollapse();
    } else {
      router.push("/calendario");
    }
  };

  return (
    <aside className={`stps-sidebar ${collapsed ? "collapsed" : ""}`}>
      {/* Header del Sidebar */}
      <div
        className="stps-sidebar-header"
        style={{
          height: "56px",
          minHeight: "56px",
          maxHeight: "56px",
          boxSizing: "border-box",
          margin: 0,
          padding: collapsed ? "0" : "0 16px",
          borderBottom: "1px solid #e2e8f0",
          display: "flex",
          alignItems: "center",
          justifyContent: collapsed ? "center" : "space-between",
        }}
      >
        <a
          href="/calendario"
          onClick={handleLogoClick}
          className="sidebar-logo-link"
          title={collapsed ? "Clic para expandir menú" : "GOODIDEA - Inicio"}
        >
          {collapsed ? (
            <img
              src="/assets/gi_slogo.png"
              alt="GOODIDEA Logo Corto"
              className="logo-slogo"
            />
          ) : (
            <div className="flex items-center gap-2 overflow-hidden">
              <img
                src="/assets/gi_slogo.png"
                alt="Foco GOODIDEA"
                className="logo-slogo"
              />
              <img
                src="/assets/gi_logo.png"
                alt="GOODIDEA Logo"
                className="logo-main"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
            </div>
          )}
        </a>

        {!collapsed && (
          <button
            className="btn-toggle-sidebar"
            onClick={onToggleCollapse}
            title="Colapsar menú"
          >
            <PanelLeft size={18} />
          </button>
        )}
      </div>

      {/* Menú de navegación */}
      <nav className="sidebar-menu-body">
        {/* 1. Inicio (estático) */}
        <Link
          href="/calendario"
          className={`sidebar-nav-item ${esInicio ? "active" : ""}`}
          title="Inicio"
        >
          <div className="nav-icon-wrapper">
            <Home size={18} className="nav-item-icon" />
          </div>
          {!collapsed && <span className="menu-text">Inicio</span>}
        </Link>

        {/* 2. Mis proyectos (estático) */}
        <Link
          href="/programacion"
          className={`sidebar-nav-item ${esProgramacion ? "active" : ""}`}
          title="Mis proyectos"
        >
          <div className="nav-icon-wrapper">
            <Calendar size={18} className="nav-item-icon" />
          </div>
          {!collapsed && <span className="menu-text">Mis proyectos</span>}
        </Link>


        {/* 3. Divisor */}
        <div className="sidebar-divider" />

        {/* 4. Menú dinámico (Catálogos) */}
        <div className="sidebar-section">
          <button
            className="sidebar-nav-item sidebar-header-btn"
            onClick={() => {
              if (collapsed) {
                onToggleCollapse();
              } else {
                setCatalogosAbiertos(!catalogosAbiertos);
              }
            }}
            title="Catálogos"
          >
            <div className="nav-icon-wrapper">
              <Folder size={18} className="nav-item-icon" />
            </div>

            {!collapsed && (
              <>
                <span className="menu-text" style={{ flex: 1, textAlign: "left" }}>
                  Catálogos
                </span>
                {catalogosAbiertos ? (
                  <ChevronDown size={15} className="submenu-arrow" />
                ) : (
                  <ChevronRight size={15} className="submenu-arrow" />
                )}
              </>
            )}
          </button>

          {!collapsed && catalogosAbiertos && (
            <div className="sidebar-subitems-container">
              <div className="sidebar-guide-line" />
              <div className="sidebar-subitems">
                <Link
                  href="/empresas"
                  className={`sidebar-subitem ${esEmpresas ? "active-sub" : ""}`}
                  title="Empresas"
                >
                  <span>Empresas</span>
                </Link>
                <Link
                  href="/servicios"
                  className={`sidebar-subitem ${esServicios ? "active-sub" : ""}`}
                  title="Servicios"
                >
                  <span>Servicios</span>
                </Link>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* 5. Salir (Incondicional) */}
      <div className="sidebar-footer">
        <button
          className="sidebar-nav-item nav-logout-btn"
          onClick={handleLogout}
          title="Salir"
        >
          <div className="nav-icon-wrapper">
            <LogOut size={18} className="nav-item-icon" />
          </div>
          {!collapsed && <span className="menu-text">Salir</span>}
        </button>
      </div>
    </aside>
  );
};
