"use client";

import React from "react";
import { CheckCheck, X, Loader2 } from "lucide-react";

interface ModalConfirmarMarcarEntregablesProps {
  abierto: boolean;
  totalAlumnos: number;
  onCerrar: () => void;
  onConfirmar: () => void;
  cargando?: boolean;
}

export const ModalConfirmarMarcarEntregables: React.FC<ModalConfirmarMarcarEntregablesProps> = ({
  abierto,
  totalAlumnos,
  onCerrar,
  onConfirmar,
  cargando = false,
}) => {
  if (!abierto) return null;

  return (
    <div
      className="modal-overlay"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(15, 23, 42, 0.6)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1050,
        padding: "16px",
      }}
      onClick={cargando ? undefined : onCerrar}
    >
      <div
        className="modal-content"
        style={{
          maxWidth: "440px",
          width: "100%",
          backgroundColor: "#ffffff",
          borderRadius: "14px",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="modal-header shrink-0"
          style={{
            padding: "16px 20px",
            borderBottom: "1px solid #f1f5f9",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "#ffffff",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "8px",
                backgroundColor: "#ecfdf5",
                color: "#059669",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <CheckCheck size={20} />
            </div>
            <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#0f172a", margin: 0 }}>
              Confirmar entrega
            </h3>
          </div>
          <button className="btn-icon" onClick={onCerrar} disabled={cargando} title="Cerrar">
            <X size={18} />
          </button>
        </div>

        <div className="modal-body" style={{ padding: "20px" }}>
          <p style={{ fontSize: "14px", color: "#334155", margin: 0, lineHeight: "1.5" }}>
            ¿Marcar como entregados todos los entregables de {totalAlumnos} {totalAlumnos === 1 ? "alumno" : "alumnos"}?
          </p>
        </div>

        <div
          className="modal-footer shrink-0"
          style={{
            padding: "12px 20px",
            borderTop: "1px solid #f1f5f9",
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            gap: "8px",
            backgroundColor: "#f8fafc",
          }}
        >
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onCerrar}
            disabled={cargando}
            style={{ height: "32px", fontSize: "13px", padding: "0 14px" }}
          >
            Cancelar
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={onConfirmar}
            disabled={cargando}
            style={{
              height: "32px",
              fontSize: "13px",
              padding: "0 16px",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              backgroundColor: "#2B8FCC",
            }}
          >
            {cargando && <Loader2 size={14} className="animate-spin" />}
            <span>Marcar</span>
          </button>
        </div>
      </div>
    </div>
  );
};
