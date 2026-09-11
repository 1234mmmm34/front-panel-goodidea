import React, { useState, useEffect } from "react";
import { X, FileText, Ban, Stamp, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { FacturaGetDto } from "@/types/facturas";
import InputFechaTexto from "@/components/ui/InputFechaTexto";
import { FacturasService } from "@/services/facturas.service";
import { useToast } from "@/context/ToastContext";

export { ModalNuevaFactura } from "./ModalNuevaFactura";
export { ModalFacturaDetalle } from "./ModalFacturaDetalle";

// --- 3. Modal Timbrado / Editar Factura ---
interface ModalTimbradoProps {
  abierto: boolean;
  factura: FacturaGetDto | null;
  onCerrar: () => void;
  onGuardar?: (datos: {
    i_CveFacturas: number;
    b_Timbrada: boolean;
    v_NoFactura: string;
    d_FechaHora: string;
  }) => Promise<void> | void;
}

export const ModalTimbrado: React.FC<ModalTimbradoProps> = ({
  abierto,
  factura,
  onCerrar,
  onGuardar,
}) => {
  const [bTimbrada, setBTimbrada] = useState<boolean>(false);
  const [noFactura, setNoFactura] = useState<string>("");
  const [fechaExpedicion, setFechaExpedicion] = useState<string>("");
  const [guardando, setGuardando] = useState<boolean>(false);

  useEffect(() => {
    if (factura) {
      setBTimbrada(Boolean(factura.b_Timbrada));
      setNoFactura(factura.v_NoFactura || "");
      let f = "";
      if (factura.d_FechaHora) {
        f = factura.d_FechaHora.split("T")[0];
      }
      setFechaExpedicion(f);
    }
  }, [factura, abierto]);

  if (!abierto || !factura) return null;

  const handleTimbrar = async () => {
    setGuardando(true);
    setBTimbrada(true);
    if (onGuardar) {
      await onGuardar({
        i_CveFacturas: factura.i_CveFacturas,
        b_Timbrada: true,
        v_NoFactura: noFactura,
        d_FechaHora: fechaExpedicion,
      });
    }
    setGuardando(false);
  };

  const handleCancelarTimbre = async () => {
    setGuardando(true);
    setBTimbrada(false);
    if (onGuardar) {
      await onGuardar({
        i_CveFacturas: factura.i_CveFacturas,
        b_Timbrada: false,
        v_NoFactura: noFactura,
        d_FechaHora: fechaExpedicion,
      });
    }
    setGuardando(false);
  };

  const handleGuardarFooter = async () => {
    setGuardando(true);
    if (onGuardar) {
      await onGuardar({
        i_CveFacturas: factura.i_CveFacturas,
        b_Timbrada: bTimbrada,
        v_NoFactura: noFactura,
        d_FechaHora: fechaExpedicion,
      });
    }
    setGuardando(false);
    onCerrar();
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
      <div className="modal-content" style={{ maxWidth: "460px", width: "90%", borderRadius: "12px", overflow: "hidden" }}>
        {/* Header */}
        <div className="modal-header" style={{ padding: "16px 20px", borderBottom: "1px solid #e2e8f0" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <FileText size={18} style={{ color: "#2563eb" }} />
            <h3 className="modal-title" style={{ fontSize: "16px", fontWeight: 700, margin: 0 }}>Editar factura</h3>
          </div>
          <button type="button" className="btn-close" onClick={onCerrar}>
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="modal-body" style={{ padding: "20px" }}>
          {!bTimbrada ? (
            <div
              style={{
                backgroundColor: "#fff3cd",
                border: "1px solid #ffe69c",
                borderRadius: "8px",
                padding: "12px 14px",
                marginBottom: "18px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "12px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#856404", fontSize: "13px" }}>
                <Stamp size={18} style={{ color: "#856404", flexShrink: 0 }} />
                <span>
                  Esta factura <strong>no ha sido timbrada</strong>.
                </span>
              </div>
              <button
                type="button"
                onClick={handleTimbrar}
                disabled={guardando}
                style={{
                  backgroundColor: "#856404",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "6px",
                  padding: "6px 12px",
                  fontSize: "12px",
                  fontWeight: 600,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                }}
              >
                <Stamp size={14} />
                {guardando ? "Timbrando..." : "Timbrar"}
              </button>
            </div>
          ) : (
            <div
              style={{
                backgroundColor: "#eaf4fb",
                border: "1px solid #b5d4f4",
                borderRadius: "8px",
                padding: "12px 14px",
                marginBottom: "18px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "12px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#185FA5", fontSize: "13px" }}>
                <CheckCircle2 size={18} style={{ color: "#185FA5", flexShrink: 0 }} />
                <span>
                  Esta factura está <strong>timbrada</strong>.
                </span>
              </div>
              <button
                type="button"
                onClick={handleCancelarTimbre}
                disabled={guardando}
                style={{
                  backgroundColor: "#185FA5",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "6px",
                  padding: "6px 12px",
                  fontSize: "12px",
                  fontWeight: 600,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                }}
              >
                <XCircle size={14} />
                {guardando ? "Cancelando..." : "Cancelar timbre"}
              </button>
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <label style={{ fontSize: "12px", fontWeight: 700, color: "#4a6580", marginBottom: "4px", display: "block" }}>
                No. factura GI
              </label>
              <input
                type="text"
                className="form-input"
                style={{
                  border: "1px solid #d0dce8",
                  borderRadius: "8px",
                  height: "34px",
                  color: "#1e3a5f",
                  fontSize: "13px",
                  padding: "0 12px",
                  width: "100%",
                  outline: "none",
                }}
                placeholder="FAC-GI-001"
                value={noFactura}
                onChange={(e) => setNoFactura(e.target.value)}
              />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <label style={{ fontSize: "12px", fontWeight: 700, color: "#4a6580", marginBottom: "4px", display: "block" }}>
                Fecha de expedición
              </label>
              <InputFechaTexto
                value={fechaExpedicion}
                onChange={(val) => setFechaExpedicion(val)}
                height="34px"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="modal-footer" style={{ padding: "16px 20px", borderTop: "1px solid #e2e8f0", display: "flex", justifyContent: "flex-end", gap: "10px" }}>
          <button type="button" className="btn btn-secondary" onClick={onCerrar} disabled={guardando}>
            Cancelar
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleGuardarFooter}
            disabled={guardando}
            style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
          >
            {guardando ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </div>
    </div>
  );
};

// --- 4. Modal Cancelar Facturas ---
interface ModalCancelarFacturasProps {
  abierto: boolean;
  factura: FacturaGetDto | null;
  onCerrar: () => void;
  onGuardadoExitoso?: () => void;
}

export const ModalCancelarFacturas: React.FC<ModalCancelarFacturasProps> = ({
  abierto,
  factura,
  onCerrar,
  onGuardadoExitoso,
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

  if (!abierto || !factura) return null;

  const handleConfirmarCancelacion = async () => {
    if (!motivo.trim()) {
      toast.warning("Por favor ingresa el motivo de cancelación.");
      return;
    }

    const cveFacturaVal =
      factura.i_CveFacturas ??
      (factura as any).i_CveFactura ??
      (factura as any).id ??
      0;

    if (!cveFacturaVal) {
      toast.error("No se pudo obtener la clave de la factura.");
      return;
    }

    setGuardando(true);
    try {
      const res = await FacturasService.cancelarFactura({
        i_CveFacturas: cveFacturaVal,
        v_MotivoCancelacion: motivo.trim(),
      });

      if (res.exito) {
        toast.success("Factura cancelada correctamente.");
        if (onGuardadoExitoso) onGuardadoExitoso();
        onCerrar();
      } else {
        toast.error(res.mensaje || "No se pudo cancelar la factura.");
      }
    } catch (err) {
      console.error("Error al cancelar factura:", err);
      toast.error("Ocurrió un error inesperado al cancelar la factura.");
    } finally {
      setGuardando(false);
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
        <div className="modal-header">
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Ban size={20} style={{ color: "#dc2626" }} />
            <h3 className="modal-title" style={{ color: "#dc2626" }}>
              Cancelar Factura
            </h3>
          </div>
          <button type="button" className="btn-close" onClick={onCerrar} disabled={guardando}>
            <X size={18} />
          </button>
        </div>
        <div className="modal-body" style={{ padding: "20px" }}>
          <p style={{ fontSize: "14px", color: "#334155", margin: "0 0 12px 0" }}>
            ¿Estás seguro de que deseas cancelar la factura de <strong>{factura.v_Empresa}</strong>?
          </p>
          <div style={{ padding: "12px", backgroundColor: "#fef2f2", borderRadius: "8px", border: "1px solid #fecaca", marginBottom: "16px" }}>
            <span style={{ fontSize: "13px", color: "#991b1b" }}>
              Esta acción revocará la factura fiscal y no se podrá deshacer.
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
        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={onCerrar} disabled={guardando}>
            Regresar
          </button>
          <button
            type="button"
            className="btn btn-danger"
            onClick={handleConfirmarCancelacion}
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
