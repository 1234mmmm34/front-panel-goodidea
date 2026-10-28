"use client";

import React from "react";
import { FotoMock } from "../pipcCalculos";
import { TextoPendiente } from "./TextoPendiente";

interface Props {
  uiriData: Record<string, { nombre: string }>;
  fotoOrganigrama?: FotoMock;
}

export const Organigrama: React.FC<Props> = ({ uiriData = {}, fotoOrganigrama }) => {
  if (fotoOrganigrama?.url) {
    return (
      <div
        style={{
          border: "1px solid #e2e8f0",
          borderRadius: "8px",
          padding: "16px",
          backgroundColor: "#f8fafc",
          textAlign: "center",
        }}
      >
        <div
          style={{
            display: "inline-block",
            padding: "4px 10px",
            backgroundColor: "#eff6ff",
            color: "#1d4ed8",
            fontSize: "12px",
            fontWeight: 600,
            borderRadius: "16px",
            marginBottom: "12px",
          }}
        >
          <i className="bi bi-info-circle me-1" />
          Se usará la imagen subida
        </div>
        <div style={{ maxWidth: "500px", margin: "0 auto", overflow: "hidden", borderRadius: "8px" }}>
          {fotoOrganigrama.url ? (
            <img
              src={fotoOrganigrama.url}
              alt={fotoOrganigrama.nombre}
              style={{ width: "100%", height: "auto", display: "block" }}
            />
          ) : (
            <div style={{ padding: "40px", color: "#94a3b8", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
              <span className="spinner-border spinner-border-sm" role="status" />
              <span>Cargando organigrama…</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  const renderCaja = (rolKey: string, rolTitulo: string, ancho = "180px") => {
    const nombre = (uiriData[rolKey]?.nombre || "").trim();
    return (
      <div
        style={{
          width: ancho,
          backgroundColor: "#ffffff",
          border: "1.5px solid #2B8FCC",
          borderRadius: "6px",
          padding: "6px 8px",
          textAlign: "center",
          boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
        }}
      >
        <div
          style={{
            fontSize: "10px",
            fontWeight: 700,
            color: "#2B8FCC",
            textTransform: "uppercase",
            letterSpacing: "0.4px",
            lineHeight: 1.2,
            marginBottom: "2px",
          }}
        >
          {rolTitulo}
        </div>
        <div
          style={{
            fontSize: "11px",
            fontWeight: 500,
            color: nombre ? "#1e293b" : "#94a3b8",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
          title={nombre || "Falta capturar el nombre en la UIRI (Organización UIPC)"}
        >
          {nombre ? nombre : <TextoPendiente title="Falta capturar el nombre en la UIRI (Organización UIPC)" />}
        </div>
      </div>
    );
  };

  return (
    <div
      style={{
        overflowX: "auto",
        maxWidth: "100%",
        padding: "16px",
        backgroundColor: "#f8fafc",
        borderRadius: "8px",
        border: "1px solid #e2e8f0",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          minWidth: "620px",
          gap: "14px",
        }}
      >
        {/* Nivel 1: Presidente */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          {renderCaja("presidente", "Presidente", "200px")}
          <div style={{ width: "2px", height: "14px", backgroundColor: "#94a3b8" }} />
        </div>

        {/* Nivel 2: Secretario Ejecutivo y Director */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100%" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: "48px",
              position: "relative",
              width: "100%",
            }}
          >
            {/* Línea horizontal que une Secretario y Director */}
            <div
              style={{
                position: "absolute",
                top: "-14px",
                left: "calc(50% - 130px)",
                right: "calc(50% - 130px)",
                height: "2px",
                backgroundColor: "#94a3b8",
              }}
            />

            {/* Secretario Ejecutivo */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <div style={{ width: "2px", height: "14px", backgroundColor: "#94a3b8" }} />
              {renderCaja("secretario_ejecutivo", "Secretario Ejecutivo", "180px")}
            </div>

            {/* Director + Suplente abajo */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <div style={{ width: "2px", height: "14px", backgroundColor: "#94a3b8" }} />
              {renderCaja("director", "Director", "180px")}
              <div style={{ width: "2px", height: "12px", backgroundColor: "#94a3b8" }} />
              {renderCaja("suplente", "Suplente", "160px")}
            </div>
          </div>
        </div>

        {/* Línea vertical hacia las brigadas */}
        <div style={{ width: "2px", height: "14px", backgroundColor: "#94a3b8" }} />

        {/* Nivel 3: 4 Jefes de Brigada */}
        <div style={{ position: "relative", width: "100%", display: "flex", justifyContent: "center" }}>
          {/* Línea horizontal que conecta las 4 brigadas */}
          <div
            style={{
              position: "absolute",
              top: "-14px",
              left: "calc(50% - 240px)",
              right: "calc(50% - 240px)",
              height: "2px",
              backgroundColor: "#94a3b8",
            }}
          />

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 150px)",
              gap: "16px",
              justifyContent: "center",
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <div style={{ width: "2px", height: "14px", backgroundColor: "#94a3b8" }} />
              {renderCaja("jefe_brigada_pa", "Jefe Primeros Auxilios", "145px")}
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <div style={{ width: "2px", height: "14px", backgroundColor: "#94a3b8" }} />
              {renderCaja("jefe_brigada_ci", "Jefe Contra Incendios", "145px")}
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <div style={{ width: "2px", height: "14px", backgroundColor: "#94a3b8" }} />
              {renderCaja("jefe_brigada_br", "Jefe Búsqueda y Rescate", "145px")}
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <div style={{ width: "2px", height: "14px", backgroundColor: "#94a3b8" }} />
              {renderCaja("jefe_brigada_ev", "Jefe Evacuación", "145px")}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
