"use client";

import React, { useState } from "react";
import { ChevronDown } from "lucide-react";
import { obtenerSesionActual } from "@/lib/api-client";
import { SesionAlmacenada } from "@/types/auth";
import { QuickActionsMenu, UserAvatarMenu } from "./HeaderActions";
import { NotificacionesBell } from "./NotificacionesBell";

export const TopHeader: React.FC = () => {
  const [sesion] = useState<SesionAlmacenada | null>(() =>
    obtenerSesionActual()
  );

  const nombreTenant = sesion?.tenant || "GOODIDEA";
  const nombreUsuario = sesion?.username || sesion?.email || "Usuario";
  const emailUsuario = sesion?.email || "administracion@good-idea.com.mx";

  return (
    <header
      className="top-header"
      style={{
        height: "56px",
        minHeight: "56px",
        maxHeight: "56px",
        boxSizing: "border-box",
        margin: 0,
        padding: "0 20px",
        borderBottom: "1px solid #e2e8f0",
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-end",
        background: "#ffffff",
        position: "relative",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <NotificacionesBell buttonSize={32} />
        <QuickActionsMenu buttonSize={32} />

        <div className="tenant-dropdown-pill">
          <span className="font-semibold text-slate-700">{nombreTenant}</span>
          <ChevronDown size={14} className="text-slate-400" />
        </div>

        <UserAvatarMenu
          nombreUsuario={nombreUsuario}
          emailUsuario={emailUsuario}
          nombreTenant={nombreTenant}
          avatarSize={36}
        />
      </div>
    </header>
  );
};
