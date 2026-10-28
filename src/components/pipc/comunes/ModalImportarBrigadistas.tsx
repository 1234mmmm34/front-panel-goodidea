"use client";

import React, { useState, useRef } from "react";
import * as XLSX from "xlsx";
import {
  BrigadistaRow,
  interpretarBrigada,
  interpretarRol,
  interpretarTurno,
  interpretarTelefono,
  erroresBrigadista,
  normTxt,
} from "../pipcCalculos";

interface ModalImportarBrigadistasProps {
  abierto: boolean;
  onCerrar: () => void;
  onAplicar: (filas: BrigadistaRow[], modo: "agregar" | "reemplazar") => void;
  turnos: string[];
  nombresJefes: string[];
}

export const ModalImportarBrigadistas: React.FC<ModalImportarBrigadistasProps> = ({
  abierto,
  onCerrar,
  onAplicar,
  turnos,
  nombresJefes,
}) => {
  const [archivoNombre, setArchivoNombre] = useState<string>("");
  const [filasLeidas, setFilasLeidas] = useState<BrigadistaRow[]>([]);
  const [omitidos, setOmitidos] = useState<string[]>([]);
  const [errorLectura, setErrorLectura] = useState<string>("");
  const [modo, setModo] = useState<"agregar" | "reemplazar">("agregar");
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!abierto) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!/\.xlsx$/i.test(file.name)) {
      setErrorLectura("Por favor selecciona un archivo con extensión .xlsx");
      return;
    }

    setArchivoNombre(file.name);
    setErrorLectura("");

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames.includes("Brigadistas")
          ? "Brigadistas"
          : workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];

        if (!sheet) {
          throw new Error("El archivo de Excel no contiene hojas de cálculo.");
        }

        const rawRows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });
        if (!rawRows.length) {
          throw new Error("La hoja de cálculo está vacía.");
        }

        // Buscar encabezados en los primeros 10 renglones
        let hdrIndex = -1;
        const mapa: Record<string, number> = {};

        for (let r = 0; r < Math.min(10, rawRows.length); r++) {
          const row = rawRows[r] || [];
          row.forEach((cell, colIdx) => {
            const h = normTxt(cell).replace(/[*()]/g, "").trim();
            if (mapa.nombre === undefined && h.startsWith("nombre")) mapa.nombre = colIdx;
            else if (mapa.puesto === undefined && h.startsWith("puesto")) mapa.puesto = colIdx;
            else if (mapa.brigada === undefined && h.startsWith("brigada")) mapa.brigada = colIdx;
            else if (mapa.rol === undefined && (h.startsWith("rol") || h.startsWith("funcion"))) mapa.rol = colIdx;
            else if (mapa.turno === undefined && h.startsWith("turno")) mapa.turno = colIdx;
            else if (mapa.telefono === undefined && (h.startsWith("tel") || h.startsWith("celular"))) mapa.telefono = colIdx;
            else if (mapa.ubicacion === undefined && (h.startsWith("ubicacion") || h.startsWith("area"))) mapa.ubicacion = colIdx;
          });

          if (mapa.nombre !== undefined) {
            hdrIndex = r;
            break;
          }
        }

        if (hdrIndex === -1 || mapa.nombre === undefined) {
          throw new Error('No se encontró la columna "Nombre completo". Usa el formato descargable.');
        }

        const leidos: BrigadistaRow[] = [];
        const omits: string[] = [];
        const vistos: Record<string, boolean> = {};
        const jefesNorm = nombresJefes.map((n) => normTxt(n)).filter(Boolean);

        for (let r = hdrIndex + 1; r < rawRows.length; r++) {
          const row = rawRows[r] || [];
          const getVal = (k: string) => {
            const idx = mapa[k];
            return idx !== undefined && row[idx] != null ? String(row[idx]).trim() : "";
          };

          const nombre = getVal("nombre").replace(/\s+/g, " ");
          if (!nombre) continue;

          const nn = normTxt(nombre);
          if (jefesNorm.includes(nn)) {
            omits.push(`Renglón ${r + 1}: ${nombre} ya está registrado como Jefe de Brigada (se omitió).`);
            continue;
          }
          if (vistos[nn]) {
            omits.push(`Renglón ${r + 1}: ${nombre} está duplicado en el archivo (se omitió).`);
            continue;
          }
          vistos[nn] = true;

          const brigada = interpretarBrigada(getVal("brigada"));
          const b: BrigadistaRow = {
            num: leidos.length + 1,
            nombre,
            puesto: getVal("puesto"),
            brigada,
            rol: interpretarRol(getVal("rol"), brigada),
            turno: interpretarTurno(getVal("turno"), turnos),
            telefono: interpretarTelefono(getVal("telefono")),
            ubicacion: getVal("ubicacion"),
          };

          leidos.push(b);
        }

        if (!leidos.length) {
          throw new Error("No se encontraron registros de brigadistas con nombre en el archivo.");
        }

        setFilasLeidas(leidos);
        setOmitidos(omits);
      } catch (err: any) {
        setErrorLectura(err?.message || "Error al procesar el archivo Excel.");
        setFilasLeidas([]);
      }
    };

    reader.readAsArrayBuffer(file);
  };

  const conErrores = filasLeidas.filter((b) => {
    const err = erroresBrigadista(b, turnos);
    return err.brigada || err.rol || err.turno || err.telefono;
  });
  const validos = filasLeidas.filter((b) => {
    const err = erroresBrigadista(b, turnos);
    return !err.brigada && !err.rol && !err.turno && !err.telefono;
  });

  const handleConfirmar = () => {
    if (!filasLeidas.length) return;
    onAplicar(filasLeidas, modo);
    onCerrar();
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "rgba(0,0,0,0.45)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
      }}
      onClick={onCerrar}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: "12px",
          maxWidth: "850px",
          width: "100%",
          maxHeight: "90vh",
          overflowY: "auto",
          padding: "24px",
          boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "#1e293b", display: "flex", alignItems: "center", gap: "8px" }}>
            <i className="bi bi-file-earmark-spreadsheet" style={{ color: "#16a34a" }} />
            Importar Brigadistas desde Excel
          </h3>
          <button
            type="button"
            onClick={onCerrar}
            style={{ background: "transparent", border: "none", fontSize: "18px", cursor: "pointer", color: "#64748b" }}
          >
            <i className="bi bi-x-lg" />
          </button>
        </div>

        {/* Carga de archivo */}
        <div
          style={{
            border: "2px dashed #cbd5e1",
            borderRadius: "8px",
            padding: "20px",
            textAlign: "center",
            background: "#f8fafc",
            marginBottom: "16px",
          }}
        >
          <input
            type="file"
            ref={fileInputRef}
            accept=".xlsx"
            onChange={handleFileChange}
            style={{ display: "none" }}
          />
          <button
            type="button"
            className="btn btn-outline-primary btn-sm"
            onClick={() => fileInputRef.current?.click()}
            style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
          >
            <i className="bi bi-upload" />
            Seleccionar archivo .xlsx
          </button>
          {archivoNombre && (
            <div style={{ marginTop: "8px", fontSize: "12px", fontWeight: 600, color: "#1e293b" }}>
              Archivo: {archivoNombre}
            </div>
          )}
        </div>

        {errorLectura && (
          <div className="alert alert-danger" style={{ fontSize: "12px", padding: "10px 14px", marginBottom: "16px" }}>
            <i className="bi bi-exclamation-triangle-fill me-2" />
            {errorLectura}
          </div>
        )}

        {/* Resumen */}
        {filasLeidas.length > 0 && (
          <div style={{ marginBottom: "16px" }}>
            <div style={{ display: "flex", gap: "12px", alignItems: "center", marginBottom: "12px" }}>
              <span className="badge badge-success" style={{ fontSize: "12px", padding: "6px 10px" }}>
                <i className="bi bi-check-circle me-1" />
                {validos.length} válidos
              </span>
              {conErrores.length > 0 && (
                <span className="badge badge-warning" style={{ fontSize: "12px", padding: "6px 10px" }}>
                  <i className="bi bi-exclamation-circle me-1" />
                  {conErrores.length} con advertencia / error
                </span>
              )}
            </div>

            {/* Opciones de importación */}
            <div style={{ display: "flex", gap: "16px", marginBottom: "12px", fontSize: "13px" }}>
              <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer" }}>
                <input
                  type="radio"
                  name="modoImport"
                  checked={modo === "agregar"}
                  onChange={() => setModo("agregar")}
                />
                Agregar a brigadistas existentes (sin duplicar)
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer" }}>
                <input
                  type="radio"
                  name="modoImport"
                  checked={modo === "reemplazar"}
                  onChange={() => setModo("reemplazar")}
                />
                Reemplazar lista de brigadistas manuales
              </label>
            </div>

            {/* Tabla de vista previa */}
            <div style={{ maxHeight: "280px", overflowY: "auto", border: "1px solid #e2e8f0", borderRadius: "8px" }}>
              <table className="table table-sm table-hover" style={{ fontSize: "11px", marginBottom: 0 }}>
                <thead className="table-light" style={{ position: "sticky", top: 0, zIndex: 1 }}>
                  <tr>
                    <th>#</th>
                    <th>Nombre</th>
                    <th>Puesto</th>
                    <th>Brigada</th>
                    <th>Rol</th>
                    <th>Turno</th>
                    <th>Teléfono</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {filasLeidas.map((b, i) => {
                    const err = erroresBrigadista(b, turnos);
                    const tieneErr = err.brigada || err.rol || err.turno || err.telefono;
                    const msgs: string[] = [];
                    if (err.brigada) msgs.push("Brigada no válida");
                    if (err.rol) msgs.push("Rol no válido");
                    if (err.turno) msgs.push("Turno no registrado");
                    if (err.telefono) msgs.push("Teléfono debe tener 10 dígitos");

                    return (
                      <tr key={i} style={{ background: tieneErr ? "#fffbeb" : "#fff" }}>
                        <td>{i + 1}</td>
                        <td style={{ fontWeight: 600 }}>{b.nombre}</td>
                        <td>{b.puesto || "—"}</td>
                        <td>{b.brigada}</td>
                        <td>{b.rol}</td>
                        <td>{b.turno}</td>
                        <td>{b.telefono || "—"}</td>
                        <td>
                          {tieneErr ? (
                            <span className="badge badge-warning" title={msgs.join(", ")}>
                              {msgs.join(", ")}
                            </span>
                          ) : (
                            <span className="badge badge-soft-green">Válido</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {omitidos.length > 0 && (
              <div style={{ marginTop: "10px", fontSize: "11px", color: "#64748b" }}>
                <strong>Filas omitidas:</strong> {omitidos.join(" · ")}
              </div>
            )}
          </div>
        )}

        <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "16px" }}>
          <button type="button" className="btn btn-secondary btn-sm" onClick={onCerrar}>
            Cancelar
          </button>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            disabled={!filasLeidas.length}
            onClick={handleConfirmar}
          >
            Aplicar ({filasLeidas.length} brigadistas)
          </button>
        </div>
      </div>
    </div>
  );
};
