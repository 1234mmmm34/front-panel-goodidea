"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sun, Calendar, Clock, Layers, Building2 } from "lucide-react";
import { obtenerSesionActual } from "@/lib/api-client";

export const Navbar: React.FC = () => {
  const pathname = usePathname();
  const [nombreUsuario, setNombreUsuario] = useState<string>("Usuario STPS");

  useEffect(() => {
    async function cargarSesion() {
      const sesion = await obtenerSesionActual();
      if (sesion?.IdUsuario) {
        setNombreUsuario(`Usuario #${sesion.IdUsuario}`);
      }
    }
    cargarSesion();
  }, []);

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
            className={`nav-link ${pathname.startsWith("/calendario") || pathname === "/" ? "active" : ""}`}
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
              <Building2 size={16} /> Clientes
            </span>
          </Link>
        </nav>

        <div className="navbar-user">
          <Sun size={18} className="sun-icon" />
          <span>Bienvenido/a, <strong>{nombreUsuario}</strong></span>
        </div>
      </div>
    </header>
  );
};
