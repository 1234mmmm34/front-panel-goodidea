"use client";

import React, { useEffect, useState } from "react";
import { Sun } from "lucide-react";
import { obtenerSesionActual } from "@/lib/api-client";
import { SesionAlmacenada } from "@/types/auth";

export const SaludoBienvenida: React.FC = () => {
  const [sesion, setSesion] = useState<SesionAlmacenada | null>(null);

  useEffect(() => {
    setSesion(obtenerSesionActual());
  }, []);

  const nombreUsuario = sesion?.username || sesion?.email || "Usuario";

  return (
    <div style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: "8px" }}>
      <Sun size={20} style={{ color: "#f59e0b", fill: "#fbbf24", flexShrink: 0 }} />
      <h1 style={{ fontSize: "18px", fontWeight: "600", color: "#1e293b", margin: 0, padding: 0 }}>
        Bienvenido/a, {nombreUsuario}
      </h1>
    </div>
  );
};

