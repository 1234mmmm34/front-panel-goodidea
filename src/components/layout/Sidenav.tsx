"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LogOut,
  ChevronDown,
  ChevronRight,
  PanelLeft,
} from "lucide-react";
import { AuthService } from "@/services/auth.service";
import { RutaDto } from "@/types/rutas";
import { useToast } from "@/context/ToastContext";
import { useMenu } from "@/context/MenuContext";

interface Props {
  collapsed: boolean;
  onToggleCollapse: () => void;
}

interface GrupoMenu {
  v_RutaRaiz: string;
  v_Icon: string;
  opciones: RutaDto[];
}

export const Sidenav: React.FC<Props> = ({ collapsed, onToggleCollapse }) => {
  const pathname = usePathname();
  const router = useRouter();
  const { confirmModal, toast } = useToast();
  const { rutasNavBar, cargandoMenu } = useMenu();

  const [gruposAbiertos, setGruposAbiertos] = useState<Record<string, boolean>>({});

  // Agrupar rutas por v_RutaRaiz conservando el orden de llegada
  const gruposMenu = useMemo(() => {
    const map = new Map<string, GrupoMenu>();

    rutasNavBar.forEach((item) => {
      const raiz = item.v_RutaRaiz.trim();
      if (!map.has(raiz)) {
        map.set(raiz, {
          v_RutaRaiz: raiz,
          v_Icon: item.v_Icon?.trim() || "bi bi-folder",
          opciones: [],
        });
      }
      map.get(raiz)!.opciones.push(item);
    });

    return Array.from(map.values());
  }, [rutasNavBar]);

  // Separar grupos superiores del grupo Configuración (fijo abajo)
  const esGrupoConfiguracion = (nombre: string) => {
    const n = nombre.trim().toLowerCase();
    return n === "configuración" || n === "configuracion";
  };

  const { gruposSuperiores, grupoConfig } = useMemo(() => {
    const superiores: GrupoMenu[] = [];
    let config: GrupoMenu | null = null;

    gruposMenu.forEach((g) => {
      if (esGrupoConfiguracion(g.v_RutaRaiz)) {
        config = g;
      } else {
        superiores.push(g);
      }
    });

    return { gruposSuperiores: superiores, grupoConfig: config };
  }, [gruposMenu]);

  // Función para evaluar si una ruta está activa
  const isRutaActiva = (ruta: string): boolean => {
    if (!ruta) return false;
    const cleanRuta = ruta.trim();
    if (cleanRuta === "/" || cleanRuta === "/calendario") {
      return pathname === "/" || pathname === "/calendario" || pathname.startsWith("/calendario/");
    }
    return pathname === cleanRuta || pathname.startsWith(cleanRuta + "/");
  };

  // Mantener abiertos automáticamente los grupos que contengan la opción activa
  useEffect(() => {
    if (gruposMenu.length === 0) return;

    setGruposAbiertos((prev) => {
      const actualizados = { ...prev };
      gruposMenu.forEach((grupo) => {
        const esEnlaceDirecto =
          grupo.opciones.length === 1 &&
          grupo.opciones[0].v_RutaHija.trim().toLowerCase() ===
            grupo.v_RutaRaiz.trim().toLowerCase();

        if (!esEnlaceDirecto) {
          const tieneActiva = grupo.opciones.some((opt) => isRutaActiva(opt.v_Ruta));
          if (tieneActiva && actualizados[grupo.v_RutaRaiz] === undefined) {
            actualizados[grupo.v_RutaRaiz] = true;
          } else if (actualizados[grupo.v_RutaRaiz] === undefined) {
            actualizados[grupo.v_RutaRaiz] = true;
          }
        }
      });
      return actualizados;
    });
  }, [gruposMenu, pathname]);

  const toggleGrupo = (nombreGrupo: string) => {
    if (collapsed) {
      onToggleCollapse();
      setGruposAbiertos((prev) => ({ ...prev, [nombreGrupo]: true }));
    } else {
      setGruposAbiertos((prev) => ({
        ...prev,
        [nombreGrupo]: !prev[nombreGrupo],
      }));
    }
  };

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

  // Renderizador de un grupo de menú
  const renderizarGrupo = (grupo: GrupoMenu, extraClass?: string) => {
    const esEnlaceDirecto =
      grupo.opciones.length === 1 &&
      grupo.opciones[0].v_RutaHija.trim().toLowerCase() ===
        grupo.v_RutaRaiz.trim().toLowerCase();

    // Caso 1: Enlace directo (exactamente 1 opción y v_RutaHija === v_RutaRaiz)
    if (esEnlaceDirecto) {
      const unicaOpcion = grupo.opciones[0];
      const activa = isRutaActiva(unicaOpcion.v_Ruta);

      return (
        <Link
          key={grupo.v_RutaRaiz}
          href={unicaOpcion.v_Ruta}
          className={`sidebar-nav-item ${activa ? "active" : ""} ${extraClass || ""}`}
          title={grupo.v_RutaRaiz}
        >
          <div className="nav-icon-wrapper">
            <i
              className={`${grupo.v_Icon || "bi bi-folder"} nav-item-icon`}
              style={{ fontSize: "17px" }}
            />
          </div>
          {!collapsed && <span className="menu-text">{grupo.v_RutaRaiz}</span>}
        </Link>
      );
    }

    // Caso 2: Grupo desplegable
    const abierto = gruposAbiertos[grupo.v_RutaRaiz] ?? true;
    const tieneHijaActiva = grupo.opciones.some((opt) => isRutaActiva(opt.v_Ruta));

    return (
      <div key={grupo.v_RutaRaiz} className={`sidebar-section ${extraClass || ""}`}>
        <button
          type="button"
          className={`sidebar-nav-item sidebar-header-btn ${
            tieneHijaActiva && !abierto ? "active" : ""
          }`}
          onClick={() => toggleGrupo(grupo.v_RutaRaiz)}
          title={grupo.v_RutaRaiz}
        >
          <div className="nav-icon-wrapper">
            <i
              className={`${grupo.v_Icon || "bi bi-folder"} nav-item-icon`}
              style={{ fontSize: "17px" }}
            />
          </div>

          {!collapsed && (
            <>
              <span className="menu-text" style={{ flex: 1, textAlign: "left" }}>
                {grupo.v_RutaRaiz}
              </span>
              {abierto ? (
                <ChevronDown size={15} className="submenu-arrow" />
              ) : (
                <ChevronRight size={15} className="submenu-arrow" />
              )}
            </>
          )}
        </button>

        {!collapsed && abierto && (
          <div className="sidebar-subitems-container">
            <div className="sidebar-guide-line" />
            <div className="sidebar-subitems">
              {grupo.opciones.map((opcion, idx) => {
                const subActiva = isRutaActiva(opcion.v_Ruta);
                return (
                  <Link
                    key={`${opcion.v_Ruta}_${idx}`}
                    href={opcion.v_Ruta}
                    className={`sidebar-subitem ${subActiva ? "active-sub" : ""}`}
                    title={opcion.v_RutaHija}
                  >
                    <span>{opcion.v_RutaHija}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
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

      {/* Menú de navegación dinámico */}
      <nav className="sidebar-menu-body">
        {cargandoMenu ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px", padding: "8px 4px" }}>
            <div className="skeleton-box" style={{ height: "34px", borderRadius: "6px" }} />
            <div className="skeleton-box" style={{ height: "34px", borderRadius: "6px" }} />
            <div className="skeleton-box" style={{ height: "34px", borderRadius: "6px" }} />
            <div className="skeleton-box" style={{ height: "34px", borderRadius: "6px" }} />
          </div>
        ) : gruposMenu.length === 0 ? (
          <div style={{ padding: "20px 8px", textAlign: "center", color: "#94a3b8", fontSize: "12px" }}>
            {!collapsed && <span>Sin opciones disponibles</span>}
          </div>
        ) : (
          <>
            {/* 1. Grupos superiores en su orden original */}
            {gruposSuperiores.map((grupo) => renderizarGrupo(grupo))}

            {/* 2. Grupo Configuración (fijo abajo, arriba de Salir) */}
            {grupoConfig && (
              <div className="sidebar-config-container mt-auto" style={{ marginTop: "auto" }}>
                {gruposSuperiores.length > 0 && <div className="sidebar-divider" />}
                {renderizarGrupo(grupoConfig)}
              </div>
            )}
          </>
        )}
      </nav>

      {/* Salir (Fijo al final) */}
      <div className="sidebar-footer">
        <button
          type="button"
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
