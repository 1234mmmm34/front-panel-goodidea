"use client";

import React, { useState, useEffect } from "react";
import { X, Ban, Loader2 } from "lucide-react";
import { FacturaProv } from "@/types/gastos";
import { GastosService } from "@/services/gastos.service";
import { useToast } from "@/context/ToastContext";

interface Props {
  abierto: boolean;
  gasto: FacturaProv | null;
  onCerrar: () => void;
  onExito: () => void;
}

export const ModalCancelarGasto: React.FC<Props> = ({
  abierto,
  gasto,
  onCerrar,
  onExito,
}) => {
  const { toast } = useToast();
  const [motivo, setMotivo] = useState<string>("");
  const [guardando, setGuardando] = useState<boolean>(false);

  useEffect(() => {
    if (abierto) {
      setMotivo("");
      setGuardando(false);
    }
  }, [abierto]);

  if (!abierto || !gasto) return null;

  const handleCancelarGasto = async () => {
    if (!motivo.trim()) {
      toast.warning("Por favor ingresa el motivo de cancelación.");
      return;
    }

    setGuardando(true);

    const res = await GastosService.cancelarGasto({
      i_CveFacturaProv: gasto.i_CveFacturaProv,
      v_MotivoCancelacion: motivo.trim(),
    });

    setGuardando(false);

    if (res.exito) {
      toast.success("Gasto cancelado correctamente.");
      onExito();
      onCerrar();
    } else {
      toast.error(res.mensaje || "No se pudo cancelar el gasto.");
    }
  };

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
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: "16px",
      }}
    >
      <div className="modal-content" style={{ maxWidth: "500px", width: "90%" }}>
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Ban size={20} style={{ color: "#dc2626" }} />
            <h3 className="modal-title" style={{ color: "#dc2626" }}>
              Cancelar gasto
            </h3>
          </div>
          <button type="button" className="btn-close" onClick={onCerrar} disabled={guardando}>
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="modal-body" style={{ padding: "20px" }}>
          <p style={{ fontSize: "14px", color: "#334155", margin: "0 0 12px 0" }}>
            ¿Estás seguro de cancelar el gasto del proveedor{" "}
            <strong>{gasto.v_Proveedor || "seleccionado"}</strong>?
          </p>

          <div
            style={{
              padding: "12px",
              backgroundColor: "#fef2f2",
              borderRadius: "8px",
              border: "1px solid #fecaca",
              marginBottom: "16px",
            }}
          >
            <span style={{ fontSize: "13px", color: "#991b1b" }}>
              Esta acción es permanente y registrará el gasto como cancelado.
            </span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label className="form-label" style={{ fontSize: "12px", fontWeight: 600 }}>
              Motivo de cancelación<span style={{ color: "#dc2626" }}>*</span>:
            </label>
            <textarea
              className="form-input text-xs p-2"
              rows={3}
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Ingresa el motivo de cancelación..."
              disabled={guardando}
              style={{
                width: "100%",
                padding: "8px 12px",
                borderRadius: "6px",
                border: "1px solid #cbd5e1",
                fontSize: "13px",
                outline: "none",
              }}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={onCerrar} disabled={guardando}>
            Regresar
          </button>
          <button
            type="button"
            className="btn btn-danger"
            onClick={handleCancelarGasto}
            disabled={guardando || !motivo.trim()}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              backgroundColor: guardando || !motivo.trim() ? "#f87171" : "#dc2626",
              color: "#ffffff",
              border: "none",
              padding: "8px 16px",
              borderRadius: "6px",
              fontWeight: 600,
              cursor: guardando || !motivo.trim() ? "not-allowed" : "pointer",
            }}
          >
            {guardando ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Cancelando...</span>
              </>
            ) : (
              <span>Confirmar Cancelación</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
