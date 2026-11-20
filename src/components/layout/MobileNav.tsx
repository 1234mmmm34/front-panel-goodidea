"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AuthService } from "@/services/auth.service";
import { obtenerSesionActual } from "@/lib/api-client";
import { RutaDto } from "@/types/rutas";
import { SesionAlmacenada } from "@/types/auth";
import { useToast } from "@/context/ToastContext";
import { useMenu } from "@/context/MenuContext";

interface GrupoMenu {
  v_RutaRaiz: string;
  v_Icon: string;
  opciones: RutaDto[];
}

export const MobileNav: React.FC = () => {
  const pathname = usePathname();
  const { confirmModal, toast } = useToast();
  const { rutasNavBar, cargandoMenu, haCargadoExitoso } = useMenu();

  const [abierto, setAbierto] = useState<boolean>(false);
  const [gruposAbiertos, setGruposAbiertos] = useState<Record<string, boolean>>({});
  const [sesion] = useState<SesionAlmacenada | null>(() => obtenerSesionActual());

  const hamburgerRef = useRef<HTMLButtonElement>(null);
  const menuContainerRef = useRef<HTMLDivElement>(null);
  const prevAbiertoRef = useRef<boolean>(false);

  const gruposMenu = useMemo(() => {
    const map = new Map<string, GrupoMenu>();
    rutasNavBar.forEach((item) => {
      const raiz = item.v_RutaRaiz?.trim() || "";
      if (!raiz) return;
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

  const isRutaActiva = (ruta: string): boolean => {
    if (!ruta) return false;
    const cleanRuta = ruta.trim();
    if (!cleanRuta) return false;
    const current = pathname || "/";
    if (cleanRuta === "/") return current === "/";
    return current === cleanRuta || current.startsWith(cleanRuta + "/");
  };

  // Cerrar si el usuario navega con botón atrás del navegador
  useEffect(() => {
    const handlePopState = () => setAbierto(false);
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  // Bloquear scroll del body y manejar tecla Escape + foco accesible
  useEffect(() => {
    if (!abierto) {
      if (prevAbiertoRef.current) {
        hamburgerRef.current?.focus();
      }
      prevAbiertoRef.current = false;
      return;
    }

    prevAbiertoRef.current = true;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    // Foco al primer elemento interactivo del menú
    const timer = requestAnimationFrame(() => {
      const primerElemento = menuContainerRef.current?.querySelector<HTMLElement>(
        "a[href], button:not([disabled])"
      );
      primerElemento?.focus();
    });

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setAbierto(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      cancelAnimationFrame(timer);
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [abierto]);

  const toggleGrupo = (nombreGrupo: string, abiertoActual: boolean) => {
    setGruposAbiertos((prev) => ({
      ...prev,
      [nombreGrupo]: !abiertoActual,
    }));
  };

  const handleLogout = () => {
    setAbierto(false);
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

  const nombreTenant = sesion?.tenant || "GOODiDEA";
  const nombreUsuario = sesion?.username || sesion?.email || "Usuario";
  const inicial = nombreUsuario.charAt(0).toUpperCase() || "U";

  const renderizarGrupo = (grupo: GrupoMenu) => {
    const esEnlaceDirecto =
      grupo.opciones.length === 1 &&
      grupo.opciones[0].v_RutaHija.trim().toLowerCase() ===
        grupo.v_RutaRaiz.trim().toLowerCase();

    if (esEnlaceDirecto) {
      const unicaOpcion = grupo.opciones[0];
      const activa = isRutaActiva(unicaOpcion.v_Ruta);

      return (
        <Link
          key={grupo.v_RutaRaiz}
          href={unicaOpcion.v_Ruta}
          onClick={() => setAbierto(false)}
          className={`mobile-nav-item ${activa ? "active" : ""}`}
        >
          <i className={`${grupo.v_Icon || "bi bi-folder"} mobile-nav-icon`} />
          <span className="mobile-nav-label">{grupo.v_RutaRaiz}</span>
        </Link>
      );
    }

    const tieneHijaActiva = grupo.opciones.some((opt) => isRutaActiva(opt.v_Ruta));
    const abiertoGrupo = gruposAbiertos[grupo.v_RutaRaiz] ?? tieneHijaActiva;

    return (
      <div key={grupo.v_RutaRaiz} className="mobile-nav-group">
        <button
          type="button"
          className={`mobile-nav-item mobile-nav-group-btn ${
            tieneHijaActiva && !abiertoGrupo ? "active" : ""
          }`}
          onClick={() => toggleGrupo(grupo.v_RutaRaiz, abiertoGrupo)}
          aria-expanded={abiertoGrupo}
        >
          <i className={`${grupo.v_Icon || "bi bi-folder"} mobile-nav-icon`} />
          <span className="mobile-nav-label">{grupo.v_RutaRaiz}</span>
          <i
            className={`bi bi-chevron-${abiertoGrupo ? "down" : "right"} mobile-nav-chevron`}
          />
        </button>

        {abiertoGrupo && (
          <div className="mobile-nav-subitems">
            {grupo.opciones.map((opcion, idx) => {
              const subActiva = isRutaActiva(opcion.v_Ruta);
              return (
                <Link
                  key={`${opcion.v_Ruta}_${idx}`}
                  href={opcion.v_Ruta}
                  onClick={() => setAbierto(false)}
                  className={`mobile-nav-subitem ${subActiva ? "active" : ""}`}
                >
                  <span>{opcion.v_RutaHija}</span>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <header className="mobile-topbar">
        <button
          ref={hamburgerRef}
          type="button"
          className="mobile-hamburger-btn"
          onClick={() => setAbierto((v) => !v)}
          aria-label={abierto ? "Cerrar menú" : "Abrir menú"}
          aria-expanded={abierto}
          aria-controls="mobile-nav-drawer"
        >
          <i className={`bi ${abierto ? "bi-x-lg" : "bi-list"}`} />
        </button>

        <Link
          href="/calendario"
          className="mobile-topbar-logo"
          aria-label="Inicio GOODiDEA"
          onClick={() => setAbierto(false)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/assets/gi_slogo.png"
            alt="GOODiDEA"
            style={{ height: "24px", width: "auto" }}
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/assets/gi_logo.png"
            alt="GOODiDEA"
            style={{ height: "20px", width: "auto" }}
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
        </Link>

        <div className="mobile-topbar-user" title={`${nombreUsuario} (${nombreTenant})`}>
          <span className="mobile-topbar-avatar">{inicial}</span>
        </div>
      </header>

      {abierto && (
        <>
          <div
            className="mobile-nav-overlay"
            onClick={() => setAbierto(false)}
            aria-hidden="true"
          />

          <nav
            id="mobile-nav-drawer"
            ref={menuContainerRef}
            className="mobile-nav-drawer"
            aria-label="Menú principal"
          >
            {/* Info compacta de usuario/tenant */}
            <div className="mobile-nav-user-card">
              <div className="mobile-nav-user-avatar">{inicial}</div>
              <div className="mobile-nav-user-info">
                <div className="mobile-nav-user-name">{nombreUsuario}</div>
                <div className="mobile-nav-user-tenant">{nombreTenant}</div>
              </div>
            </div>

            <div className="mobile-nav-list">
              {cargandoMenu ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "8px", padding: "8px 0" }}>
                  <div className="skeleton-box" style={{ height: "44px", borderRadius: "8px" }} />
                  <div className="skeleton-box" style={{ height: "44px", borderRadius: "8px" }} />
                  <div className="skeleton-box" style={{ height: "44px", borderRadius: "8px" }} />
                </div>
              ) : gruposMenu.length === 0 ? (
                haCargadoExitoso ? (
                  <div style={{ padding: "16px", textAlign: "center", color: "#94a3b8", fontSize: "13px" }}>
                    Sin opciones disponibles
                  </div>
                ) : null
              ) : (
                <>
                  {gruposSuperiores.map((grupo) => renderizarGrupo(grupo))}

                  <div className="mobile-nav-divider" />

                  {grupoConfig && renderizarGrupo(grupoConfig)}

                  <button
                    type="button"
                    className="mobile-nav-item mobile-nav-logout"
                    onClick={handleLogout}
                  >
                    <i className="bi bi-box-arrow-right mobile-nav-icon" />
                    <span className="mobile-nav-label">Salir</span>
                  </button>
                </>
              )}
            </div>
          </nav>
        </>
      )}
    </>
  );
};
