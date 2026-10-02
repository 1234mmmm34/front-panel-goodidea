"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, User, Plus } from "lucide-react";
import { AlumnoPersonal, plantasMock } from "@/mocks/personalMock";
import { useToast } from "@/context/ToastContext";

interface ModalNuevoAlumnoProps {
  abierto: boolean;
  idEmpresa: number;
  alumnosExistentes: AlumnoPersonal[];
  onCerrar: () => void;
  onGuardar: (nuevoAlumno: AlumnoPersonal) => void;
}

const CURP_REGEX = /^[A-Z]{4}\d{6}[HM][A-Z]{5}[A-Z0-9]\d$/;

export const ModalNuevoAlumno: React.FC<ModalNuevoAlumnoProps> = ({
  abierto,
  idEmpresa,
  alumnosExistentes,
  onCerrar,
  onGuardar,
}) => {
  const { toast } = useToast();
  const [mounted, setMounted] = useState(false);

  const [nomina, setNomina] = useState("");
  const [nombre, setNombre] = useState("");
  const [curp, setCurp] = useState("");
  const [puesto, setPuesto] = useState("");
  const [planta, setPlanta] = useState(plantasMock[0] || "");

  const [errores, setErrores] = useState<Record<string, string>>({});
  const [seIntentoGuardar, setSeIntentoGuardar] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (abierto) {
      setNomina("");
      setNombre("");
      setCurp("");
      setPuesto("");
      setPlanta(plantasMock[0] || "");
      setErrores({});
      setSeIntentoGuardar(false);
    }
  }, [abierto]);

  if (!abierto || !mounted) return null;

  const validarCampos = (): boolean => {
    const nuevosErrores: Record<string, string> = {};

    // Nómina
    const nomClean = nomina.trim();
    if (!nomClean) {
      nuevosErrores.nomina = "La nómina es obligatoria.";
    } else if (alumnosExistentes.some((a) => a.v_Nomina.trim().toLowerCase() === nomClean.toLowerCase())) {
      nuevosErrores.nomina = "Esta nómina ya está registrada en la empresa.";
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
    } else if (alumnosExistentes.some((a) => a.v_CURP.trim().toUpperCase() === curpClean)) {
      nuevosErrores.curp = "Esta CURP ya está registrada en la empresa.";
    }

    // Puesto
    if (!puesto.trim()) {
      nuevosErrores.puesto = "El puesto es obligatorio.";
    }

    // Planta
    if (!planta.trim()) {
      nuevosErrores.planta = "La planta es obligatoria.";
    }

    setErrores(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSeIntentoGuardar(true);

    if (!validarCampos()) return;

    const nuevoAlumno: AlumnoPersonal = {
      i_CveAlumno: Date.now(),
      i_CveEmpresa: idEmpresa,
      v_Nomina: nomina.trim(),
      v_Nombre: nombre.trim().toUpperCase(),
      v_CURP: curp.trim().toUpperCase(),
      v_Puesto: puesto.trim(),
      v_Planta: planta,
    };

    onGuardar(nuevoAlumno);
    toast.success("Alumno agregado");
    onCerrar();
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
                Nuevo alumno
              </h3>
              <p style={{ fontSize: "12px", color: "#64748b", margin: 0 }}>
                Ingresa los datos para registrar a un alumno.
              </p>
            </div>
          </div>
          <button className="btn-icon" onClick={onCerrar} title="Cerrar">
            <X size={18} />
          </button>
        </div>

        {/* Body / Form */}
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden" }}>
          <div style={{ padding: "24px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "16px" }}>
            {/* Nómina */}
            <div>
              <label className="form-label" style={{ fontSize: "12px", fontWeight: 600, color: "#334155" }}>
                Nómina <span style={{ color: "#ef4444" }}>*</span>
              </label>
              <input
                type="text"
                className={`form-control ${seIntentoGuardar && errores.nomina ? "border-red-500" : ""}`}
                style={{ height: "38px", fontSize: "13px", borderRadius: "8px" }}
                placeholder="Ej. 10234"
                value={nomina}
                onChange={(e) => {
                  setNomina(e.target.value);
                  if (errores.nomina) setErrores((prev) => ({ ...prev, nomina: "" }));
                }}
              />
              {seIntentoGuardar && errores.nomina && (
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
                className={`form-control ${seIntentoGuardar && errores.nombre ? "border-red-500" : ""}`}
                style={{ height: "38px", fontSize: "13px", borderRadius: "8px" }}
                placeholder="Ej. JUAN CARLOS HERNÁNDEZ LÓPEZ"
                value={nombre}
                onChange={(e) => {
                  setNombre(e.target.value.toUpperCase());
                  if (errores.nombre) setErrores((prev) => ({ ...prev, nombre: "" }));
                }}
              />
              {seIntentoGuardar && errores.nombre && (
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
                className={`form-control font-mono ${seIntentoGuardar && errores.curp ? "border-red-500" : ""}`}
                style={{ height: "38px", fontSize: "13px", borderRadius: "8px", textTransform: "uppercase" }}
                placeholder="Ej. HELJ850312HNLRPN04"
                value={curp}
                onChange={(e) => {
                  setCurp(e.target.value.toUpperCase());
                  if (errores.curp) setErrores((prev) => ({ ...prev, curp: "" }));
                }}
              />
              {seIntentoGuardar && errores.curp && (
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
                className={`form-control ${seIntentoGuardar && errores.puesto ? "border-red-500" : ""}`}
                style={{ height: "38px", fontSize: "13px", borderRadius: "8px" }}
                placeholder="Ej. Operador de montacargas"
                value={puesto}
                onChange={(e) => {
                  setPuesto(e.target.value);
                  if (errores.puesto) setErrores((prev) => ({ ...prev, puesto: "" }));
                }}
              />
              {seIntentoGuardar && errores.puesto && (
                <span style={{ fontSize: "11px", color: "#ef4444", marginTop: "4px", display: "block" }}>
                  {errores.puesto}
                </span>
              )}
            </div>

            {/* Planta */}
            <div>
              <label className="form-label" style={{ fontSize: "12px", fontWeight: 600, color: "#334155" }}>
                Planta <span style={{ color: "#ef4444" }}>*</span>
              </label>
              <select
                className={`form-select ${seIntentoGuardar && errores.planta ? "border-red-500" : ""}`}
                style={{ height: "38px", fontSize: "13px", borderRadius: "8px" }}
                value={planta}
                onChange={(e) => {
                  setPlanta(e.target.value);
                  if (errores.planta) setErrores((prev) => ({ ...prev, planta: "" }));
                }}
              >
                {plantasMock.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
              {seIntentoGuardar && errores.planta && (
                <span style={{ fontSize: "11px", color: "#ef4444", marginTop: "4px", display: "block" }}>
                  {errores.planta}
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
            <button type="button" className="btn btn-secondary" onClick={onCerrar}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary">
              Guardar
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
