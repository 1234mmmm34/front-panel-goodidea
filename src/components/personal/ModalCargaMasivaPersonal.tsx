"use client";

import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import {
  X,
  FileSpreadsheet,
  Download,
  Upload,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
} from "lucide-react";
import * as XLSX from "xlsx";
import { AlumnoCargaFila, AlumnoCargaMasivaDto, AlumnoCargaResultado } from "@/types/alumnosCatalogo";
import { AlumnosCatalogoService } from "@/services/alumnosCatalogo.service";
import { useToast } from "@/context/ToastContext";

interface ModalCargaMasivaPersonalProps {
  abierto: boolean;
  idEmpresa: number;
  onCerrar: () => void;
  onGuardadoExitoso: () => void;
}

interface FilaPrevia {
  idTemp: string;
  nomina: string;
  nombre: string;
  curp: string;
  puesto: string;
  esValido: boolean;
  motivoError?: string;
}

const CURP_REGEX = /^[A-Z]{4}\d{6}[HM][A-Z]{5}[A-Z0-9]\d$/;

export const ModalCargaMasivaPersonal: React.FC<ModalCargaMasivaPersonalProps> = ({
  abierto,
  idEmpresa,
  onCerrar,
  onGuardadoExitoso,
}) => {
  const { toast } = useToast();
  const [mounted, setMounted] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [archivoNombre, setArchivoNombre] = useState<string | null>(null);
  const [errorHeader, setErrorHeader] = useState<string | null>(null);
  const [filasPrevias, setFilasPrevias] = useState<FilaPrevia[]>([]);
  const [procesandoArchivo, setProcesandoArchivo] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [resultado, setResultado] = useState<AlumnoCargaResultado | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (abierto) {
      setArchivoNombre(null);
      setErrorHeader(null);
      setFilasPrevias([]);
      setProcesandoArchivo(false);
      setEnviando(false);
      setResultado(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }, [abierto]);

  if (!abierto || !mounted) return null;

  // Paso 1: Descargar Plantilla XLSX (Sin Planta)
  const descargarPlantilla = () => {
    const data = [
      ["NOMINA", "NOMBRE", "CURP", "PUESTO"],
      ["10999", "JUAN PÉREZ GÓMEZ", "PEGJ900101HNLXXX01", "Operador de montacargas"],
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
    setResultado(null);
    setProcesandoArchivo(true);

    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array" });
      const firstSheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[firstSheetName];

      const rawData = XLSX.utils.sheet_to_json<Record<string, any>>(sheet, { defval: "" });

      if (!rawData || rawData.length === 0) {
        setErrorHeader("El archivo está vacío o no contiene filas de datos.");
        setProcesandoArchivo(false);
        return;
      }

      // Validar Encabezados
      const primeraFila = rawData[0];
      const keys = Object.keys(primeraFila).map((k) => k.trim().toUpperCase());

      const headersRequeridos = ["NOMINA", "NOMBRE", "CURP", "PUESTO"];
      const faltanHeaders = headersRequeridos.some((h) => !keys.includes(h));

      if (faltanHeaders) {
        setErrorHeader("El archivo no tiene el formato de la plantilla (columnas: NOMINA, NOMBRE, CURP, PUESTO).");
        setProcesandoArchivo(false);
        return;
      }

      const getKey = (rowObj: Record<string, any>, targetHeader: string) => {
        const foundKey = Object.keys(rowObj).find((k) => k.trim().toUpperCase() === targetHeader);
        return foundKey ? String(rowObj[foundKey] || "").trim() : "";
      };

      const nominEnArchivo = new Set<string>();
      const curpsEnArchivo = new Set<string>();

      const procesadas: FilaPrevia[] = rawData.map((row, index) => {
        const nominaVal = getKey(row, "NOMINA");
        const nombreVal = getKey(row, "NOMBRE").toUpperCase();
        const curpVal = getKey(row, "CURP").toUpperCase();
        const puestoVal = getKey(row, "PUESTO");

        let esValido = true;
        let motivoError = "";

        // 1. Campo vacío
        if (!nominaVal || !nombreVal || !curpVal || !puestoVal) {
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

        if (nominaVal) nominEnArchivo.add(nominaVal.toLowerCase());
        if (curpVal) curpsEnArchivo.add(curpVal);

        return {
          idTemp: `row-${index}-${Date.now()}`,
          nomina: nominaVal,
          nombre: nombreVal,
          curp: curpVal,
          puesto: puestoVal,
          esValido,
          motivoError,
        };
      });

      setFilasPrevias(procesadas);
    } catch {
      setErrorHeader("Ocurrió un error al leer el archivo Excel.");
    } finally {
      setProcesandoArchivo(false);
    }
  };

  const validosCount = filasPrevias.filter((f) => f.esValido).length;
  const erroresPreviosCount = filasPrevias.filter((f) => !f.esValido).length;

  const handleConfirmarImportar = async () => {
    const validas = filasPrevias.filter((f) => f.esValido);
    if (validas.length === 0) return;

    const dto: AlumnoCargaMasivaDto = {
      i_CveEmpresa: idEmpresa,
      Alumnos: validas.map((f) => ({
        v_Nomina: f.nomina,
        v_Nombre: f.nombre.toUpperCase(),
        v_CURP: f.curp.toUpperCase(),
        v_Puesto: f.puesto,
      })),
    };

    setEnviando(true);
    setErrorHeader(null);

    try {
      const res = await AlumnosCatalogoService.postAlumnosCargaMasiva(dto);

      if (res.exito && res.data) {
        setResultado(res.data);
        if (res.data.insertados > 0) {
          onGuardadoExitoso();
        }

        if (res.data.errores && res.data.errores.length > 0) {
          toast.warning(
            `${res.data.insertados} alumnos importados · ${res.data.omitidos} omitidos por conflicto`
          );
        } else {
          toast.success(`${res.data.insertados} alumnos importados exitosamente`);
          onCerrar();
        }
      } else {
        setErrorHeader(res.error || "Ocurrió un error al importar los alumnos.");
      }
    } catch {
      setErrorHeader("Error de conexión al enviar la carga masiva.");
    } finally {
      setEnviando(false);
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
          <button className="btn-icon" onClick={onCerrar} disabled={enviando} title="Cerrar">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: "24px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* Si ya hay resultado de servidor con errores */}
          {resultado && (
            <div
              style={{
                padding: "16px",
                borderRadius: "12px",
                backgroundColor: resultado.errores.length > 0 ? "#fffbeb" : "#f0fdf4",
                border: `1px solid ${resultado.errores.length > 0 ? "#fef3c7" : "#bbf7d0"}`,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                {resultado.errores.length > 0 ? (
                  <AlertTriangle size={18} style={{ color: "#d97706" }} />
                ) : (
                  <CheckCircle2 size={18} style={{ color: "#16a34a" }} />
                )}
                <span style={{ fontSize: "13px", fontWeight: 700, color: "#1e293b" }}>
                  Resultado de la importación: {resultado.insertados} de {resultado.totalProcesados} procesados correctamente.
                </span>
              </div>

              {resultado.omitidos > 0 && (
                <p style={{ fontSize: "12px", color: "#92400e", margin: "0 0 12px 0" }}>
                  Se omitieron <strong>{resultado.omitidos}</strong> filas debido a los siguientes motivos:
                </p>
              )}

              {resultado.errores.length > 0 && (
                <div className="alegra-table-container" style={{ maxHeight: "200px", overflowY: "auto" }}>
                  <table className="alegra-table alegra-table-compact" style={{ fontSize: "12px" }}>
                    <thead>
                      <tr>
                        <th style={{ width: "25%" }}>Nómina</th>
                        <th style={{ width: "75%" }}>Motivo</th>
                      </tr>
                    </thead>
                    <tbody>
                      {resultado.errores.map((err, idx) => (
                        <tr key={`err-${idx}`}>
                          <td style={{ fontWeight: 600, color: "#1e293b" }}>{err.v_Nomina || "—"}</td>
                          <td style={{ color: "#dc2626" }}>{err.motivo}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {!resultado && (
            <>
              {/* Paso 1: Descargar Plantilla */}
              <div style={{ padding: "16px", backgroundColor: "#f8fafc", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
                  <div>
                    <h4 style={{ fontSize: "13px", fontWeight: 700, color: "#1e293b", margin: "0 0 4px 0" }}>
                      Paso 1. Plantilla
                    </h4>
                    <p style={{ fontSize: "12px", color: "#64748b", margin: 0 }}>
                      Descarga la plantilla, llénala y súbela. Columnas: NOMINA, NOMBRE, CURP, PUESTO.
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
                    <AlertCircle size={16} style={{ flexShrink: 0 }} />
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
                      {erroresPreviosCount > 0 && (
                        <>
                          <span style={{ margin: "0 6px" }}>·</span>
                          <span style={{ color: "#dc2626" }}>{erroresPreviosCount} con error de formato</span>
                        </>
                      )}
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
            </>
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
          {resultado ? (
            <button type="button" className="btn btn-primary" onClick={onCerrar}>
              Cerrar
            </button>
          ) : (
            <>
              <button type="button" className="btn btn-secondary" onClick={onCerrar} disabled={enviando}>
                Cancelar
              </button>
              <button
                type="button"
                className="btn btn-primary"
                disabled={validosCount === 0 || procesandoArchivo || enviando}
                onClick={handleConfirmarImportar}
              >
                {enviando ? "Importando..." : `Importar ${validosCount} ${validosCount === 1 ? "alumno" : "alumnos"}`}
              </button>
            </>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};
