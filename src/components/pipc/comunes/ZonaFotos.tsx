"use client";

import React, { useRef, useState } from "react";
import { FotoMock } from "../pipcCalculos";
import { TextoPendiente } from "./TextoPendiente";

interface Props {
  fotos: FotoMock[];
  onSubir: (archivo: File) => void;
  onQuitar: (fotoId: string) => void;
  multiple?: boolean;
  label?: string;
  sublabel?: string;
  soloLectura?: boolean;
}

export const ZonaFotos: React.FC<Props> = ({
  fotos = [],
  onSubir,
  onQuitar,
  multiple = true,
  label = "Arrastra o selecciona fotografías",
  sublabel = "Formatos admitidos: JPG, PNG, WEBP (cámara disponible en tabletas)",
  soloLectura = false,
}) => {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [arrastrando, setArrastrando] = useState(false);

  const handleFiles = (files: FileList | null) => {
    if (!files || soloLectura) return;
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.type.startsWith("image/")) {
        onSubir(file);
        if (!multiple) break;
      }
    }
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!soloLectura) setArrastrando(true);
  };

  const onDragLeave = () => {
    setArrastrando(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setArrastrando(false);
    if (!soloLectura && e.dataTransfer.files) {
      handleFiles(e.dataTransfer.files);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
      {!soloLectura && (
        <div
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
          style={{
            border: `2px dashed ${arrastrando ? "#2B8FCC" : "#cbd5e1"}`,
            backgroundColor: arrastrando ? "#f0f7ff" : "#f8fafc",
            borderRadius: "8px",
            padding: "16px",
            textAlign: "center",
            cursor: "pointer",
            transition: "all 0.15s ease",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "4px",
            minHeight: "72px",
          }}
        >
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple={multiple}
            style={{ display: "none" }}
            onChange={(e) => {
              handleFiles(e.target.files);
              e.target.value = "";
            }}
          />
          <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#2B8FCC", fontWeight: 500, fontSize: "13px" }}>
            <i className="bi bi-camera" style={{ fontSize: "16px" }} />
            <span>{label}</span>
          </div>
          <span style={{ fontSize: "11px", color: "#94a3b8" }}>{sublabel}</span>
        </div>
      )}

      {/* Miniaturas en cuadrícula */}
      {fotos.length > 0 ? (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))",
            gap: "10px",
            marginTop: "4px",
          }}
        >
          {fotos.map((foto) => (
            <div
              key={foto.id}
              style={{
                position: "relative",
                borderRadius: "8px",
                border: "1px solid #e2e8f0",
                backgroundColor: "#ffffff",
                overflow: "hidden",
                boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <div
                style={{
                  height: "90px",
                  width: "100%",
                  backgroundColor: "#f1f5f9",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                {foto.url ? (
                  <img
                    src={foto.url}
                    alt={foto.nombre}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      display: "block",
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: "100%",
                      height: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#94a3b8",
                    }}
                  >
                    <span
                      className="spinner-border spinner-border-sm"
                      role="status"
                      style={{ width: "16px", height: "16px", borderWidth: "2px" }}
                    />
                  </div>
                )}
                {!soloLectura && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onQuitar(foto.id);
                    }}
                    title="Quitar foto"
                    style={{
                      position: "absolute",
                      top: "4px",
                      right: "4px",
                      backgroundColor: "rgba(15, 23, 42, 0.75)",
                      color: "#ffffff",
                      border: "none",
                      borderRadius: "50%",
                      width: "22px",
                      height: "22px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "10px",
                      lineHeight: 1,
                      transition: "background-color 0.15s ease",
                    }}
                  >
                    <i className="bi bi-x-lg" />
                  </button>
                )}
              </div>
              <div
                style={{
                  padding: "4px 6px",
                  fontSize: "11px",
                  color: "#475569",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  backgroundColor: "#ffffff",
                }}
                title={foto.nombre}
              >
                {foto.nombre}
              </div>
            </div>
          ))}
        </div>
      ) : (
        soloLectura && (
          <div style={{ fontSize: "12px" }}>
            <TextoPendiente title="Sin fotografías registradas" />
          </div>
        )
      )}
    </div>
  );
};
