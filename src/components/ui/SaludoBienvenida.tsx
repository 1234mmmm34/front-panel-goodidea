"use client";

import React, { useState } from "react";
import { Sun } from "lucide-react";
import { obtenerSesionActual } from "@/lib/api-client";
import { SesionAlmacenada } from "@/types/auth";

export const SaludoBienvenida: React.FC = () => {
  const [sesion] = useState<SesionAlmacenada | null>(() =>
    obtenerSesionActual()
  );

  const nombreUsuario = sesion?.username?.trim() || sesion?.email?.trim() || "";

  return (
    <div style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: "8px" }}>
      <Sun size={20} style={{ color: "#f59e0b", fill: "#fbbf24", flexShrink: 0 }} />
      <h1 style={{ fontSize: "18px", fontWeight: "600", color: "#1e293b", margin: 0, padding: 0 }}>
        {nombreUsuario ? `Bienvenido/a, ${nombreUsuario}` : "Bienvenido/a"}
      </h1>
    </div>
  );
};

