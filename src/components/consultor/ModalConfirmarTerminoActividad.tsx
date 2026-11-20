"use client";

import React, { useState } from "react";
import { AlertTriangle, X } from "lucide-react";
import type { ActividadPendienteConsultor } from "@/types/consultor";

interface Props {
  actividad: ActividadPendienteConsultor;
  confirmando: boolean;
  onCerrar: () => void;
  onConfirmar: (v_NotasFinales: string | null) => void;
}

export const ModalConfirmarTerminoActividad: React.FC<Props> = ({
  actividad,
  confirmando,
  onCerrar,
  onConfirmar,
}) => {
  const [notasFinales, setNotasFinales] = useState<string>("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (confirmando) return;
    const texto = notasFinales.trim();
    onConfirmar(texto ? texto : null);
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(15, 23, 42, 0.5)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 100000,
        padding: "16px",
      }}
      onClick={() => {
        if (!confirmando) onCerrar();
      }}
    >
      <form
        onSubmit={handleSubmit}
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: "480px",
          width: "100%",
          backgroundColor: "#ffffff",
          borderRadius: "20px",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
          padding: "24px",
          display: "flex",
          flexDirection: "column",
          gap: "16px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: "12px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <div
              style={{
                width: "44px",
                height: "44px",
                borderRadius: "50%",
                backgroundColor: "#fff6da",
                color: "#856404",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <AlertTriangle size={22} />
            </div>
            <div>
              <h4
                style={{
                  fontSize: "16px",
                  fontWeight: 700,
                  color: "#0f172a",
                  margin: 0,
                  lineHeight: 1.3,
                }}
              >
                {`¿Confirmas que «${actividad.v_Titulo}» ya terminó?`}
              </h4>
              <p
                style={{
                  fontSize: "13px",
                  color: "#64748b",
                  margin: "6px 0 0 0",
                  lineHeight: 1.4,
                }}
              >
                Se guardará hoy como fecha de fin real y la actividad dejará de
                aparecer en pendientes. Esta acción no se puede deshacer.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onCerrar}
            disabled={confirmando}
            style={{
              background: "transparent",
              border: "none",
              color: "#64748b",
              cursor: confirmando ? "not-allowed" : "pointer",
              padding: "4px",
              display: "flex",
              alignItems: "center",
            }}
            aria-label="Cerrar"
          >
            <X size={18} />
          </button>
        </div>

        <div>
          <label
            htmlFor="notas-finales-termino"
            className="form-label"
            style={{ marginBottom: "6px" }}
          >
            Notas finales (opcional)
          </label>
          <textarea
            id="notas-finales-termino"
            rows={4}
            value={notasFinales}
            onChange={(e) => setNotasFinales(e.target.value)}
            disabled={confirmando}
            placeholder="Agrega observaciones o resultados finales de la actividad..."
            style={{
              width: "100%",
              padding: "10px 12px",
              borderRadius: "10px",
              border: "1px solid #cbd5e1",
              fontSize: "13px",
              lineHeight: 1.4,
              resize: "vertical",
            }}
          />
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            gap: "10px",
          }}
        >
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onCerrar}
            disabled={confirmando}
            style={{ borderRadius: "20px", height: "38px", padding: "0 20px" }}
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={confirmando}
            style={{ borderRadius: "20px", height: "38px", padding: "0 20px" }}
          >
            {confirmando ? "Confirmando..." : "Confirmar"}
          </button>
        </div>
      </form>
    </div>
  );
};
