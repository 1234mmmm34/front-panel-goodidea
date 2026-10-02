"use client";

import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { X, FileSpreadsheet, Download, Upload, CheckCircle2, AlertCircle, Trash2 } from "lucide-react";
import * as XLSX from "xlsx";
import { AlumnoPersonal } from "@/mocks/personalMock";
import { useToast } from "@/context/ToastContext";

interface ModalCargaMasivaPersonalProps {
  abierto: boolean;
  idEmpresa: number;
  alumnosExistentes: AlumnoPersonal[];
  onCerrar: () => void;
  onImportar: (nuevosAlumnos: AlumnoPersonal[], validosCount: number, erroresCount: number) => void;
}

interface FilaPrevia {
  idTemp: string;
  nomina: string;
  nombre: string;
  curp: string;
  puesto: string;
  planta: string;
  esValido: boolean;
  motivoError?: string;
}

const CURP_REGEX = /^[A-Z]{4}\d{6}[HM][A-Z]{5}[A-Z0-9]\d$/;

export const ModalCargaMasivaPersonal: React.FC<ModalCargaMasivaPersonalProps> = ({
  abierto,
  idEmpresa,
  alumnosExistentes,
  onCerrar,
  onImportar,
}) => {
  const { toast } = useToast();
  const [mounted, setMounted] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [archivoNombre, setArchivoNombre] = useState<string | null>(null);
  const [errorHeader, setErrorHeader] = useState<string | null>(null);
  const [filasPrevias, setFilasPrevias] = useState<FilaPrevia[]>([]);
  const [procesando, setProcesando] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (abierto) {
      setArchivoNombre(null);
      setErrorHeader(null);
      setFilasPrevias([]);
      setProcesando(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }, [abierto]);

  if (!abierto || !mounted) return null;

  // Paso 1: Descargar Plantilla XLSX
  const descargarPlantilla = () => {
    const data = [
      ["NOMINA", "NOMBRE", "CURP", "PUESTO", "PLANTA"],
      ["10999", "JUAN PÉREZ GÓMEZ", "PEGJ900101HNLXXX01", "Operador de montacargas", "Planta Guadalupe"],
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "PlantillaPersonal");

    XLSX.writeFile(workbook, "plantilla_personal.xlsx");
  };

  // Paso 2: Procesar Archivo Excel Seleccionado
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setArchivoNombre(file.name);
    setErrorHeader(null);
    setFilasPrevias([]);
    setProcesando(true);

    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array" });
      const firstSheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[firstSheetName];

      const rawData = XLSX.utils.sheet_to_json<Record<string, any>>(sheet, { defval: "" });

      if (!rawData || rawData.length === 0) {
        setErrorHeader("El archivo está vacío o no contiene filas de datos.");
        setProcesando(false);
        return;
      }

      // Validar Encabezados
      const primeraFila = rawData[0];
      const keys = Object.keys(primeraFila).map((k) => k.trim().toUpperCase());

      const headersRequeridos = ["NOMINA", "NOMBRE", "CURP", "PUESTO", "PLANTA"];
      const faltanHeaders = headersRequeridos.some((h) => !keys.includes(h));

      if (faltanHeaders) {
        setErrorHeader("El archivo no tiene el formato de la plantilla.");
        setProcesando(false);
        return;
      }

      // Map headers dynamically regardless of casing
      const getKey = (rowObj: Record<string, any>, targetHeader: string) => {
        const foundKey = Object.keys(rowObj).find((k) => k.trim().toUpperCase() === targetHeader);
        return foundKey ? String(rowObj[foundKey] || "").trim() : "";
      };

      // Validar filas y duplicados acumulados
      const nominEnArchivo = new Set<string>();
      const curpsEnArchivo = new Set<string>();

      const procesadas: FilaPrevia[] = rawData.map((row, index) => {
        const nominaVal = getKey(row, "NOMINA");
        const nombreVal = getKey(row, "NOMBRE").toUpperCase();
        const curpVal = getKey(row, "CURP").toUpperCase();
        const puestoVal = getKey(row, "PUESTO");
        const plantaVal = getKey(row, "PLANTA");

        let esValido = true;
        let motivoError = "";

        // 1. Campo vacío
        if (!nominaVal || !nombreVal || !curpVal || !puestoVal || !plantaVal) {
          esValido = false;
          motivoError = "Campo requerido vacío";
        }
        // 2. CURP inválida
        else if (curpVal.length !== 18 || !CURP_REGEX.test(curpVal)) {
          esValido = false;
          motivoError = "CURP con formato inválido";
        }
        // 3. Nómina duplicada en archivo
        else if (nominEnArchivo.has(nominaVal.toLowerCase())) {
          esValido = false;
          motivoError = "Nómina duplicada en archivo";
        }
        // 4. CURP duplicada en archivo
        else if (curpsEnArchivo.has(curpVal)) {
          esValido = false;
          motivoError = "CURP duplicada en archivo";
        }
        // 5. Nómina duplicada en existentes
        else if (alumnosExistentes.some((a) => a.v_Nomina.trim().toLowerCase() === nominaVal.toLowerCase())) {
          esValido = false;
          motivoError = "Nómina ya registrada";
        }
        // 6. CURP duplicada en existentes
        else if (alumnosExistentes.some((a) => a.v_CURP.trim().toUpperCase() === curpVal)) {
          esValido = false;
          motivoError = "CURP ya registrada";
        }

        if (nominaVal) nominEnArchivo.add(nominaVal.toLowerCase());
        if (curpVal) curpsEnArchivo.add(curpVal);

        return {
          idTemp: `row-${index}-${Date.now()}`,
          nomina: nominaVal,
          nombre: nombreVal,
          curp: curpVal,
          puesto: puestoVal,
          planta: plantaVal,
          esValido,
          motivoError,
        };
      });

      setFilasPrevias(procesadas);
    } catch (err) {
      setErrorHeader("Ocurrió un error al leer el archivo Excel.");
    } finally {
      setProcesando(false);
    }
  };

  const validosCount = filasPrevias.filter((f) => f.esValido).length;
  const erroresCount = filasPrevias.filter((f) => !f.esValido).length;

  const handleConfirmarImportar = () => {
    const validas = filasPrevias.filter((f) => f.esValido);
    if (validas.length === 0) return;

    const nuevosAlumnos: AlumnoPersonal[] = validas.map((f, idx) => ({
      i_CveAlumno: Date.now() + idx,
      i_CveEmpresa: idEmpresa,
      v_Nomina: f.nomina,
      v_Nombre: f.nombre.toUpperCase(),
      v_CURP: f.curp.toUpperCase(),
      v_Puesto: f.puesto,
      v_Planta: f.planta,
    }));

    onImportar(nuevosAlumnos, validosCount, erroresCount);

    let msg = `${validosCount} alumnos importados`;
    if (erroresCount > 0) {
      msg += ` · ${erroresCount} omitidos`;
    }
    toast.success(msg);
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
          maxWidth: "960px",
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
                backgroundColor: "#f0fdf4",
                color: "#16a34a",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <FileSpreadsheet size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#0f172a", margin: 0 }}>
                Carga masiva de alumnos
              </h3>
              <p style={{ fontSize: "12px", color: "#64748b", margin: 0 }}>
                Importa alumnos desde un archivo Excel de forma masiva.
              </p>
            </div>
          </div>
          <button className="btn-icon" onClick={onCerrar} title="Cerrar">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: "24px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* Paso 1: Descargar Plantilla */}
          <div style={{ padding: "16px", backgroundColor: "#f8fafc", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
              <div>
                <h4 style={{ fontSize: "13px", fontWeight: 700, color: "#1e293b", margin: "0 0 4px 0" }}>
                  Paso 1. Plantilla
                </h4>
                <p style={{ fontSize: "12px", color: "#64748b", margin: 0 }}>
                  Descarga la plantilla, llénala y súbela. No cambies los encabezados.
                </p>
              </div>
              <button
                type="button"
                className="btn btn-outline"
                onClick={descargarPlantilla}
                style={{ fontSize: "12px", padding: "6px 14px", display: "inline-flex", alignItems: "center", gap: "6px" }}
              >
                <Download size={15} />
                <span>Descargar plantilla</span>
              </button>
            </div>
          </div>

          {/* Paso 2: Subir Archivo */}
          <div>
            <h4 style={{ fontSize: "13px", fontWeight: 700, color: "#1e293b", margin: "0 0 8px 0" }}>
              Paso 2. Subir archivo
            </h4>

            <div
              style={{
                border: "2px dashed #cbd5e1",
                borderRadius: "12px",
                padding: "24px",
                textAlign: "center",
                backgroundColor: "#f8fafc",
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx, .xls"
                style={{ display: "none" }}
                onChange={handleFileChange}
              />
              <Upload size={28} style={{ margin: "0 auto 8px auto", color: "#64748b" }} />
              <p style={{ fontSize: "13px", fontWeight: 600, color: "#334155", margin: "0 0 4px 0" }}>
                {archivoNombre ? archivoNombre : "Haz clic para seleccionar o arrastra tu archivo Excel aquí"}
              </p>
              <p style={{ fontSize: "11px", color: "#94a3b8", margin: 0 }}>
                Formatos permitidos: .xlsx, .xls
              </p>
            </div>

            {errorHeader && (
              <div
                style={{
                  marginTop: "12px",
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
                <AlertCircle size={16} />
                <span>{errorHeader}</span>
              </div>
            )}
          </div>

          {/* Paso 3: Vista Previa */}
          {filasPrevias.length > 0 && (
            <div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
                <h4 style={{ fontSize: "13px", fontWeight: 700, color: "#1e293b", margin: 0 }}>
                  Paso 3. Vista previa
                </h4>
                <div style={{ fontSize: "12px", fontWeight: 600, color: "#475569" }}>
                  <span style={{ color: "#16a34a" }}>{validosCount} válidos</span>
                  <span style={{ margin: "0 6px" }}>·</span>
                  <span style={{ color: "#dc2626" }}>{erroresCount} con error</span>
                </div>
              </div>

              <div className="alegra-table-container" style={{ maxHeight: "280px", overflowY: "auto" }}>
                <table className="alegra-table alegra-table-compact" style={{ fontSize: "12px" }}>
                  <thead>
                    <tr>
                      <th>NOMINA</th>
                      <th>NOMBRE</th>
                      <th>CURP</th>
                      <th>PUESTO</th>
                      <th>PLANTA</th>
                      <th className="text-center">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filasPrevias.map((row) => (
                      <tr key={row.idTemp}>
                        <td>{row.nomina || "—"}</td>
                        <td style={{ fontWeight: 500 }}>{row.nombre || "—"}</td>
                        <td className="font-mono text-xs">{row.curp || "—"}</td>
                        <td>{row.puesto || "—"}</td>
                        <td>{row.planta || "—"}</td>
                        <td className="text-center">
                          {row.esValido ? (
                            <span
                              style={{
                                backgroundColor: "#dcfce7",
                                color: "#166534",
                                border: "1px solid #bbf7d0",
                                padding: "2px 8px",
                                borderRadius: "12px",
                                fontSize: "11px",
                                fontWeight: 600,
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "4px",
                              }}
                            >
                              <CheckCircle2 size={12} />
                              Válido
                            </span>
                          ) : (
                            <span
                              style={{
                                backgroundColor: "#fee2e2",
                                color: "#991b1b",
                                border: "1px solid #fecaca",
                                padding: "2px 8px",
                                borderRadius: "12px",
                                fontSize: "11px",
                                fontWeight: 600,
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "4px",
                              }}
                              title={row.motivoError}
                            >
                              <AlertCircle size={12} />
                              Error: {row.motivoError}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
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
          <button
            type="button"
            className="btn btn-primary"
            disabled={validosCount === 0 || procesando}
            onClick={handleConfirmarImportar}
          >
            Importar {validosCount} {validosCount === 1 ? "alumno" : "alumnos"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
