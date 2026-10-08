"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, User, AlertCircle } from "lucide-react";
import { AlumnoCatalogo, AlumnoPostDto } from "@/types/alumnosCatalogo";
import { AlumnosCatalogoService } from "@/services/alumnosCatalogo.service";
import { useToast } from "@/context/ToastContext";

interface ModalNuevoAlumnoProps {
  abierto: boolean;
  idEmpresa: number;
  alumnoEditar?: AlumnoCatalogo | null;
  onCerrar: () => void;
  onGuardadoExitoso: () => void;
}

const CURP_REGEX = /^[A-Z]{4}\d{6}[HM][A-Z]{5}[A-Z0-9]\d$/;

export const ModalNuevoAlumno: React.FC<ModalNuevoAlumnoProps> = ({
  abierto,
  idEmpresa,
  alumnoEditar,
  onCerrar,
  onGuardadoExitoso,
}) => {
  const { toast } = useToast();
  const [mounted, setMounted] = useState(false);

  const [nomina, setNomina] = useState("");
  const [nombre, setNombre] = useState("");
  const [curp, setCurp] = useState("");
  const [puesto, setPuesto] = useState("");

  const [errores, setErrores] = useState<Record<string, string>>({});
  const [errorServidor, setErrorServidor] = useState<string | null>(null);
  const [seIntentoGuardar, setSeIntentoGuardar] = useState(false);
  const [guardando, setGuardando] = useState(false);

  const esEdicion = Boolean(alumnoEditar && alumnoEditar.i_CveAlumno > 0);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (abierto) {
      if (alumnoEditar) {
        setNomina(alumnoEditar.v_Nomina || "");
        setNombre(alumnoEditar.v_Nombre || "");
        setCurp(alumnoEditar.v_CURP || "");
        setPuesto(alumnoEditar.v_Puesto || "");
      } else {
        setNomina("");
        setNombre("");
        setCurp("");
        setPuesto("");
      }
      setErrores({});
      setErrorServidor(null);
      setSeIntentoGuardar(false);
      setGuardando(false);
    }
  }, [abierto, alumnoEditar]);

  if (!abierto || !mounted) return null;

  const validarCampos = (): boolean => {
    const nuevosErrores: Record<string, string> = {};

    // Nómina
    const nomClean = nomina.trim();
    if (!nomClean) {
      nuevosErrores.nomina = "La nómina es obligatoria.";
    }

    // Nombre
    const nombClean = nombre.trim();
    if (!nombClean) {
      nuevosErrores.nombre = "El nombre completo es obligatorio.";
    }

    // CURP
    const curpClean = curp.trim().toUpperCase();
    if (!curpClean) {
      nuevosErrores.curp = "La CURP es obligatoria.";
    } else if (curpClean.length !== 18 || !CURP_REGEX.test(curpClean)) {
      nuevosErrores.curp = "La CURP no tiene un formato válido (18 caracteres).";
    }

    // Puesto
    if (!puesto.trim()) {
      nuevosErrores.puesto = "El puesto es obligatorio.";
    }

    setErrores(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSeIntentoGuardar(true);
    setErrorServidor(null);

    if (!validarCampos()) return;

    const dto: AlumnoPostDto = {
      i_CveEmpresa: idEmpresa,
      v_Nomina: nomina.trim(),
      v_Nombre: nombre.trim().toUpperCase(),
      v_CURP: curp.trim().toUpperCase(),
      v_Puesto: puesto.trim(),
    };

    setGuardando(true);

    try {
      if (esEdicion && alumnoEditar) {
        // PUT
        const res = await AlumnosCatalogoService.putAlumnoCatalogo(alumnoEditar.i_CveAlumno, dto);

        if (res.exito) {
          toast.success("Alumno actualizado");
          onGuardadoExitoso();
          onCerrar();
        } else if (res.status === 404) {
          toast.error(res.error || "Alumno no encontrado.");
          onGuardadoExitoso();
          onCerrar();
        } else if (res.status === 409) {
          const errMsg = res.error || "La nómina o CURP ya está registrada en la empresa.";
          if (errMsg.toLowerCase().includes("nómina") || errMsg.toLowerCase().includes("nomina")) {
            setErrores((prev) => ({ ...prev, nomina: errMsg }));
          } else if (errMsg.toLowerCase().includes("curp")) {
            setErrores((prev) => ({ ...prev, curp: errMsg }));
          } else {
            setErrorServidor(errMsg);
          }
        } else {
          setErrorServidor(res.error || "Ocurrió un error al actualizar el alumno.");
        }
      } else {
        // POST
        const res = await AlumnosCatalogoService.postAlumnoCatalogo(dto);

        if (res.exito) {
          toast.success("Alumno agregado");
          onGuardadoExitoso();
          onCerrar();
        } else if (res.status === 409) {
          const errMsg = res.error || "La nómina o CURP ya está registrada en la empresa.";
          if (errMsg.toLowerCase().includes("nómina") || errMsg.toLowerCase().includes("nomina")) {
            setErrores((prev) => ({ ...prev, nomina: errMsg }));
          } else if (errMsg.toLowerCase().includes("curp")) {
            setErrores((prev) => ({ ...prev, curp: errMsg }));
          } else {
            setErrorServidor(errMsg);
          }
        } else {
          setErrorServidor(res.error || "Ocurrió un error al registrar el alumno.");
        }
      }
    } catch {
      setErrorServidor("Error inesperado al procesar la solicitud.");
    } finally {
      setGuardando(false);
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
          maxWidth: "520px",
          width: "100%",
          maxHeight: "90vh",
          backgroundColor: "#ffffff",
          borderRadius: "16px",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* Header */}
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
                backgroundColor: "#eff6ff",
                color: "#2563eb",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <User size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#0f172a", margin: 0 }}>
                {esEdicion ? "Editar alumno" : "Nuevo alumno"}
              </h3>
              <p style={{ fontSize: "12px", color: "#64748b", margin: 0 }}>
                {esEdicion
                  ? "Modifica los datos del alumno registrado."
                  : "Ingresa los datos para registrar a un alumno."}
              </p>
            </div>
          </div>
          <button className="btn-icon" onClick={onCerrar} disabled={guardando} title="Cerrar">
            <X size={18} />
          </button>
        </div>

        {/* Body / Form */}
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden" }}>
          <div style={{ padding: "24px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "16px" }}>
            {errorServidor && (
              <div
                style={{
                  padding: "10px 14px",
                  backgroundColor: "#fef2f2",
                  border: "1px solid #fecaca",
                  borderRadius: "8px",
                  color: "#b91c1c",
                  fontSize: "12px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <AlertCircle size={16} style={{ flexShrink: 0 }} />
                <span>{errorServidor}</span>
              </div>
            )}

            {/* Nómina */}
            <div>
              <label className="form-label" style={{ fontSize: "12px", fontWeight: 600, color: "#334155" }}>
                Nómina <span style={{ color: "#ef4444" }}>*</span>
              </label>
              <input
                type="text"
                className={`form-control ${errores.nomina ? "border-red-500" : ""}`}
                style={{ height: "38px", fontSize: "13px", borderRadius: "8px" }}
                placeholder="Ej. 10234"
                value={nomina}
                onChange={(e) => {
                  setNomina(e.target.value);
                  if (errores.nomina) setErrores((prev) => ({ ...prev, nomina: "" }));
                  if (errorServidor) setErrorServidor(null);
                }}
              />
              {errores.nomina && (
                <span style={{ fontSize: "11px", color: "#ef4444", marginTop: "4px", display: "block" }}>
                  {errores.nomina}
                </span>
              )}
            </div>

            {/* Nombre Completo */}
            <div>
              <label className="form-label" style={{ fontSize: "12px", fontWeight: 600, color: "#334155" }}>
                Nombre completo <span style={{ color: "#ef4444" }}>*</span>
              </label>
              <input
                type="text"
                className={`form-control ${errores.nombre ? "border-red-500" : ""}`}
                style={{ height: "38px", fontSize: "13px", borderRadius: "8px" }}
                placeholder="Ej. JUAN CARLOS HERNÁNDEZ LÓPEZ"
                value={nombre}
                onChange={(e) => {
                  setNombre(e.target.value.toUpperCase());
                  if (errores.nombre) setErrores((prev) => ({ ...prev, nombre: "" }));
                  if (errorServidor) setErrorServidor(null);
                }}
              />
              {errores.nombre && (
                <span style={{ fontSize: "11px", color: "#ef4444", marginTop: "4px", display: "block" }}>
                  {errores.nombre}
                </span>
              )}
            </div>

            {/* CURP */}
            <div>
              <label className="form-label" style={{ fontSize: "12px", fontWeight: 600, color: "#334155" }}>
                CURP <span style={{ color: "#ef4444" }}>*</span>
              </label>
              <input
                type="text"
                maxLength={18}
                className={`form-control font-mono ${errores.curp ? "border-red-500" : ""}`}
                style={{ height: "38px", fontSize: "13px", borderRadius: "8px", textTransform: "uppercase" }}
                placeholder="Ej. HELJ850312HNLRPN04"
                value={curp}
                onChange={(e) => {
                  setCurp(e.target.value.toUpperCase());
                  if (errores.curp) setErrores((prev) => ({ ...prev, curp: "" }));
                  if (errorServidor) setErrorServidor(null);
                }}
              />
              {errores.curp && (
                <span style={{ fontSize: "11px", color: "#ef4444", marginTop: "4px", display: "block" }}>
                  {errores.curp}
                </span>
              )}
            </div>

            {/* Puesto */}
            <div>
              <label className="form-label" style={{ fontSize: "12px", fontWeight: 600, color: "#334155" }}>
                Puesto <span style={{ color: "#ef4444" }}>*</span>
              </label>
              <input
                type="text"
                className={`form-control ${errores.puesto ? "border-red-500" : ""}`}
                style={{ height: "38px", fontSize: "13px", borderRadius: "8px" }}
                placeholder="Ej. Operador de montacargas"
                value={puesto}
                onChange={(e) => {
                  setPuesto(e.target.value);
                  if (errores.puesto) setErrores((prev) => ({ ...prev, puesto: "" }));
                  if (errorServidor) setErrorServidor(null);
                }}
              />
              {errores.puesto && (
                <span style={{ fontSize: "11px", color: "#ef4444", marginTop: "4px", display: "block" }}>
                  {errores.puesto}
                </span>
              )}
            </div>
          </div>

          {/* Footer */}
          <div
            style={{
              padding: "16px 24px",
              borderTop: "1px solid #f1f5f9",
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-end",
              gap: "10px",
              background: "#ffffff",
            }}
          >
            <button type="button" className="btn btn-secondary" onClick={onCerrar} disabled={guardando}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" disabled={guardando}>
              {guardando ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
