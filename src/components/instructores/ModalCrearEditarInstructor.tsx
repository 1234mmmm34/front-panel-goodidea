"use client";

import React, { useEffect, useState } from "react";
import { X, UserCheck, Loader2 } from "lucide-react";
import { InstructorDto } from "@/types/instructores";
import { InstructoresService } from "@/services/instructores.service";
import { useToast } from "@/context/ToastContext";

interface Props {
  abierto: boolean;
  instructorEditar: InstructorDto | null;
  onCerrar: () => void;
  onGuardado: () => void;
}

export const ModalCrearEditarInstructor: React.FC<Props> = ({
  abierto,
  instructorEditar,
  onCerrar,
  onGuardado,
}) => {
  const { toast } = useToast();
  const [nombre, setNombre] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [guardando, setGuardando] = useState<boolean>(false);
  const [errorNombre, setErrorNombre] = useState<string | null>(null);

  useEffect(() => {
    if (abierto) {
      if (instructorEditar) {
        setNombre(instructorEditar.v_Nombre || "");
        setEmail(instructorEditar.v_Email || "");
      } else {
        setNombre("");
        setEmail("");
      }
      setErrorNombre(null);
    }
  }, [abierto, instructorEditar]);

  if (!abierto) return null;

  const esEdicion = Boolean(instructorEditar);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const nombreTrim = nombre.trim();
    if (!nombreTrim) {
      setErrorNombre("El nombre del instructor es obligatorio.");
      return;
    }
    setErrorNombre(null);

    const emailVal = email.trim() !== "" ? email.trim() : null;

    setGuardando(true);

    if (esEdicion && instructorEditar) {
      const res = await InstructoresService.actualizar({
        i_CveInstructor: instructorEditar.i_CveInstructor,
        v_Nombre: nombreTrim,
        v_Email: emailVal,
      });

      setGuardando(false);

      if (res.exito) {
        toast.success("Instructor actualizado exitosamente.");
        onGuardado();
        onCerrar();
      } else {
        toast.error(res.mensaje || "Error al actualizar el instructor.");
      }
    } else {
      const res = await InstructoresService.crear({
        v_Nombre: nombreTrim,
        v_Email: emailVal,
      });

      setGuardando(false);

      if (res.exito) {
        toast.success("Instructor registrado exitosamente.");
        onGuardado();
        onCerrar();
      } else {
        toast.error(res.mensaje || "Error al crear el instructor.");
      }
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
        backgroundColor: "rgba(15, 23, 42, 0.5)",
        backdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: "16px",
      }}
    >
      <div
        className="modal-content no-scrollbar"
        style={{
          maxWidth: "480px",
          width: "100%",
          backgroundColor: "#ffffff",
          borderRadius: "16px",
          boxShadow: "0 20px 40px -15px rgba(15, 23, 42, 0.25)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* Header del Modal */}
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
                backgroundColor: "#eef2ff",
                border: "1px solid #c7d2fe",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#4f46e5",
              }}
            >
              <UserCheck size={18} />
            </div>

            <div>
              <h3 style={{ fontSize: "15px", fontWeight: 700, color: "#0f172a", margin: 0 }}>
                {esEdicion ? "Editar instructor" : "Nuevo instructor"}
              </h3>
              <p style={{ fontSize: "12px", color: "#64748b", margin: "1px 0 0 0" }}>
                {esEdicion
                  ? "Modifica la información del instructor registrado."
                  : "Registra un nuevo instructor en el catálogo."}
              </p>
            </div>
          </div>

          <button
            type="button"
            className="btn-icon"
            onClick={onCerrar}
            disabled={guardando}
            style={{
              padding: "6px",
              borderRadius: "50%",
              border: "none",
              background: "#f8fafc",
              color: "#64748b",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit}>
          <div
            className="modal-body"
            style={{
              padding: "20px 24px",
              display: "flex",
              flexDirection: "column",
              gap: "16px",
            }}
          >
            {/* Campo 1: Nombre (Obligatorio) */}
            <div className="form-group mb-0">
              <label className="form-label text-xs font-semibold text-slate-700">
                Nombre <span style={{ color: "#ef4444" }}>*</span>
              </label>
              <input
                type="text"
                className={`form-control text-xs ${errorNombre ? "is-invalid" : ""}`}
                style={{ height: "36px", borderRadius: "8px" }}
                placeholder="Ej. Juan Pérez González"
                value={nombre}
                onChange={(e) => {
                  setNombre(e.target.value);
                  if (errorNombre) setErrorNombre(null);
                }}
                disabled={guardando}
                autoFocus
              />
              {errorNombre && (
                <span style={{ fontSize: "11px", color: "#ef4444", marginTop: "4px" }}>
                  {errorNombre}
                </span>
              )}
            </div>

            {/* Campo 2: Email (Opcional, sin validación estricta de formato) */}
            <div className="form-group mb-0">
              <label className="form-label text-xs font-semibold text-slate-700">
                Email <span style={{ color: "#94a3b8", fontWeight: 400 }}>(Opcional)</span>
              </label>
              <input
                type="text"
                className="form-control text-xs"
                style={{ height: "36px", borderRadius: "8px" }}
                placeholder="Ej. instructor@ejemplo.com o N/A"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={guardando}
              />
            </div>
          </div>

          {/* Footer Footer */}
          <div
            className="modal-footer shrink-0"
            style={{
              padding: "14px 24px",
              borderTop: "1px solid #f1f5f9",
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-end",
              gap: "8px",
              background: "#ffffff",
            }}
          >
            <button
              type="button"
              className="btn btn-outline"
              onClick={onCerrar}
              disabled={guardando}
              style={{
                height: "34px",
                padding: "0 16px",
                fontSize: "12px",
                fontWeight: 600,
                borderRadius: "8px",
                backgroundColor: "#ffffff",
                borderColor: "#cbd5e1",
                color: "#334155",
              }}
            >
              Cancelar
            </button>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={guardando}
              style={{
                height: "34px",
                padding: "0 20px",
                fontSize: "12px",
                fontWeight: 600,
                borderRadius: "8px",
                backgroundColor: "#4f46e5",
                borderColor: "#4f46e5",
                color: "#ffffff",
              }}
            >
              {guardando ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Guardando...
                </>
              ) : esEdicion ? (
                "Guardar cambios"
              ) : (
                "Guardar instructor"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
