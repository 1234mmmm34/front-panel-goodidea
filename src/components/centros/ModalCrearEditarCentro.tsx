"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Building2, MapPin, Plus, Check } from "lucide-react";
import { PlantaGetDto } from "@/types/empresas";
import { CentrosTrabajoService, CentroPostPayload } from "@/services/centros.service";
import { useToast } from "@/context/ToastContext";

interface Props {
  abierto: boolean;
  idEmpresa: number;
  centroEditar?: PlantaGetDto | null;
  onCerrar: () => void;
  onGuardado: () => void;
}

export const ModalCrearEditarCentro: React.FC<Props> = ({
  abierto,
  idEmpresa,
  centroEditar,
  onCerrar,
  onGuardado,
}) => {
  const { toast } = useToast();
  const [mounted, setMounted] = useState(false);
  const [guardando, setGuardando] = useState(false);

  // Campos del formulario
  const [nombrePlanta, setNombrePlanta] = useState("");
  const [siglas, setSiglas] = useState("");
  const [calle, setCalle] = useState("");
  const [numeroExt, setNumeroExt] = useState("");
  const [numeroInt, setNumeroInt] = useState("");
  const [fraccionamiento, setFraccionamiento] = useState("");
  const [codigoPostal, setCodigoPostal] = useState("");

  const [errorNombre, setErrorNombre] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (abierto) {
      if (centroEditar) {
        setNombrePlanta(centroEditar.v_NombrePlanta || "");
        setSiglas(centroEditar.v_Siglas || centroEditar.s_Siglas || "");
        setCalle(centroEditar.v_NombreCalle || centroEditar.s_Domicilio || "");
        setNumeroExt(centroEditar.v_NumeroExterior || "");
        setNumeroInt(centroEditar.v_NumeroInterior || "");
        setFraccionamiento(centroEditar.v_Fraccionamiento || "");
        setCodigoPostal(centroEditar.i_CodigoPostal ? String(centroEditar.i_CodigoPostal) : "");
      } else {
        setNombrePlanta("");
        setSiglas("");
        setCalle("");
        setNumeroExt("");
        setNumeroInt("");
        setFraccionamiento("");
        setCodigoPostal("");
      }
      setErrorNombre(false);
    }
  }, [abierto, centroEditar]);

  if (!abierto || !mounted) return null;

  const handleGuardar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombrePlanta.trim()) {
      setErrorNombre(true);
      return;
    }

    setGuardando(true);
    const payload: CentroPostPayload = {
      i_CvePlanta: centroEditar?.i_CvePlanta,
      i_CveEmpresa: idEmpresa,
      v_NombrePlanta: nombrePlanta.trim(),
      v_Siglas: siglas.trim() || undefined,
      v_NombreCalle: calle.trim() || undefined,
      v_NumeroExterior: numeroExt.trim() || undefined,
      v_NumeroInterior: numeroInt.trim() || undefined,
      v_Fraccionamiento: fraccionamiento.trim() || undefined,
      i_CodigoPostal: codigoPostal ? Number(codigoPostal) : undefined,
    };

    const exito = await CentrosTrabajoService.SaveCentro(payload);
    setGuardando(false);

    if (exito) {
      toast.success(centroEditar ? "Centro de trabajo actualizado." : "Centro de trabajo creado exitosamente.");
      onGuardado();
      onCerrar();
    } else {
      toast.error("Ocurrió un error al guardar el centro de trabajo.");
    }
  };

  return createPortal(
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
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1100,
        padding: "16px",
      }}
    >
      <div
        className="modal-content no-scrollbar"
        style={{
          maxWidth: "600px",
          width: "100%",
          maxHeight: "90vh",
          backgroundColor: "#ffffff",
          borderRadius: "16px",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0, 0, 0, 0.05)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* Header (Estilo ModalDetalleServicio) */}
        <div
          className="modal-header shrink-0"
          style={{
            padding: "18px 24px",
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
                borderRadius: "10px",
                backgroundColor: "#f0f9ff",
                border: "1px solid #e0f2fe",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#0284c7",
              }}
            >
              <Building2 size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: "15px", fontWeight: 600, color: "#0f172a", margin: 0, lineHeight: 1.2 }}>
                {centroEditar ? "Editar Centro de Trabajo" : "Nuevo Centro de Trabajo"}
              </h3>
              <p style={{ fontSize: "12px", color: "#64748b", margin: "2px 0 0 0", fontWeight: 400 }}>
                {centroEditar ? "Modifica los datos del centro de trabajo seleccionado." : "Ingresa los datos para registrar un centro de trabajo."}
              </p>
            </div>
          </div>
          <button
            className="btn-icon"
            onClick={onCerrar}
            style={{
              padding: "6px",
              borderRadius: "50%",
              border: "none",
              background: "transparent",
              color: "#64748b",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            title="Cerrar"
          >
            <X size={18} />
          </button>
        </div>

        {/* Formulario Body */}
        <form onSubmit={handleGuardar} style={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden" }}>
          <div
            className="modal-body no-scrollbar"
            style={{
              padding: "24px",
              flex: 1,
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
              gap: "20px",
            }}
          >
            {/* Nombre y Siglas */}
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "12px" }}>
              <div>
                <label style={{ fontSize: "11px", fontWeight: 500, color: "#475569", display: "block", marginBottom: "4px" }}>
                  Nombre del Centro / Planta <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <input
                  type="text"
                  className="form-control text-xs"
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    borderRadius: "8px",
                    border: errorNombre ? "1px solid #ef4444" : "1px solid #cbd5e1",
                    backgroundColor: "#ffffff",
                    fontSize: "13px",
                  }}
                  placeholder="Ej. Planta Monterrey / Matriz"
                  value={nombrePlanta}
                  onChange={(e) => {
                    setNombrePlanta(e.target.value);
                    if (e.target.value.trim()) setErrorNombre(false);
                  }}
                />
                {errorNombre && (
                  <span style={{ fontSize: "11px", color: "#ef4444", marginTop: "4px", display: "block" }}>
                    El nombre es requerido.
                  </span>
                )}
              </div>

              <div>
                <label style={{ fontSize: "11px", fontWeight: 500, color: "#475569", display: "block", marginBottom: "4px" }}>
                  Siglas / Clave
                </label>
                <input
                  type="text"
                  className="form-control text-xs font-mono uppercase"
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    backgroundColor: "#ffffff",
                    fontSize: "13px",
                  }}
                  placeholder="Ej. MTY-1"
                  value={siglas}
                  onChange={(e) => setSiglas(e.target.value)}
                />
              </div>
            </div>

            {/* Dirección */}
            <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: "16px", display: "flex", flexDirection: "column", gap: "12px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <MapPin size={14} style={{ color: "#0284c7" }} />
                <span style={{ fontSize: "12px", fontWeight: 600, color: "#334155", textTransform: "uppercase", letterSpacing: "0.03em" }}>
                  Ubicación y Dirección
                </span>
              </div>

              <div>
                <label style={{ fontSize: "11px", fontWeight: 500, color: "#475569", display: "block", marginBottom: "4px" }}>
                  Calle o Avenida
                </label>
                <input
                  type="text"
                  className="form-control text-xs"
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    backgroundColor: "#ffffff",
                    fontSize: "13px",
                  }}
                  placeholder="Ej. Av. Ruiz Cortines"
                  value={calle}
                  onChange={(e) => setCalle(e.target.value)}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ fontSize: "11px", fontWeight: 500, color: "#475569", display: "block", marginBottom: "4px" }}>
                    Núm. Exterior
                  </label>
                  <input
                    type="text"
                    className="form-control text-xs"
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      borderRadius: "8px",
                      border: "1px solid #cbd5e1",
                      backgroundColor: "#ffffff",
                      fontSize: "13px",
                    }}
                    placeholder="123"
                    value={numeroExt}
                    onChange={(e) => setNumeroExt(e.target.value)}
                  />
                </div>

                <div>
                  <label style={{ fontSize: "11px", fontWeight: 500, color: "#475569", display: "block", marginBottom: "4px" }}>
                    Núm. Interior
                  </label>
                  <input
                    type="text"
                    className="form-control text-xs"
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      borderRadius: "8px",
                      border: "1px solid #cbd5e1",
                      backgroundColor: "#ffffff",
                      fontSize: "13px",
                    }}
                    placeholder="A-1"
                    value={numeroInt}
                    onChange={(e) => setNumeroInt(e.target.value)}
                  />
                </div>

                <div>
                  <label style={{ fontSize: "11px", fontWeight: 500, color: "#475569", display: "block", marginBottom: "4px" }}>
                    C.P.
                  </label>
                  <input
                    type="text"
                    className="form-control text-xs font-mono"
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      borderRadius: "8px",
                      border: "1px solid #cbd5e1",
                      backgroundColor: "#ffffff",
                      fontSize: "13px",
                    }}
                    placeholder="67119"
                    maxLength={5}
                    value={codigoPostal}
                    onChange={(e) => setCodigoPostal(e.target.value.replace(/\D/g, ""))}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: "11px", fontWeight: 500, color: "#475569", display: "block", marginBottom: "4px" }}>
                  Colonia / Fraccionamiento
                </label>
                <input
                  type="text"
                  className="form-control text-xs"
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    backgroundColor: "#ffffff",
                    fontSize: "13px",
                  }}
                  placeholder="Ej. Jardines de San Rafael"
                  value={fraccionamiento}
                  onChange={(e) => setFraccionamiento(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Footer (Estilo ModalDetalleServicio) */}
          <div
            className="modal-footer shrink-0"
            style={{
              padding: "16px 24px",
              borderTop: "1px solid #f1f5f9",
              background: "#f8fafc",
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-end",
              gap: "8px",
              borderRadius: "0 0 16px 16px",
            }}
          >
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onCerrar}
              disabled={guardando}
              style={{
                padding: "8px 20px",
                borderRadius: "8px",
                fontSize: "13px",
                fontWeight: 500,
              }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={guardando}
              style={{
                padding: "8px 20px",
                borderRadius: "8px",
                fontSize: "13px",
                fontWeight: 500,
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <Check size={16} />
              <span>{guardando ? "Guardando..." : centroEditar ? "Guardar cambios" : "Crear Centro"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
