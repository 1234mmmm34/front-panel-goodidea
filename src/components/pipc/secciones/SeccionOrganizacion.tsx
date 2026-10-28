"use client";

import React, { useState } from "react";
import * as XLSX from "xlsx";
import {
  PipcExpediente,
  UipcMiembroRow,
  BrigadistaRow,
  ActividadCalendario,
  getTurnosDisponibles,
  formatTelefono,
  erroresBrigadista,
} from "../pipcCalculos";
import {
  uiriRoles,
  BRIGADAS_OPCIONES,
  ROL_OPCIONES,
  BRIG_XLS_COLUMNAS,
} from "../pipcCatalogos";
import { Organigrama } from "../comunes/Organigrama";
import { ZonaFotos } from "../comunes/ZonaFotos";
import { CalendarioActividades } from "../comunes/CalendarioActividades";
import { ModalImportarBrigadistas } from "../comunes/ModalImportarBrigadistas";
import { TextoPendiente } from "../comunes/TextoPendiente";

interface Props {
  expediente: PipcExpediente;
  setUiriNombre: (rolId: string, nombre: string) => void;
  setUipcData: (rows: UipcMiembroRow[]) => void;
  setCalendarioActividades: (actividades: ActividadCalendario[]) => void;
  setBrigadistas: (rows: BrigadistaRow[]) => void;
  aplicarImportBrigadistas: (rows: BrigadistaRow[], modo: "agregar" | "reemplazar") => void;
  agregarFoto: (seccionKey: string, archivo: File, soloUna?: boolean) => void;
  quitarFoto: (seccionKey: string, fotoId: string) => void;
  soloLectura?: boolean;
}

export const SeccionOrganizacion: React.FC<Props> = ({
  expediente,
  setUiriNombre,
  setUipcData,
  setCalendarioActividades,
  setBrigadistas,
  aplicarImportBrigadistas,
  agregarFoto,
  quitarFoto,
  soloLectura = false,
}) => {
  const anio = expediente.form.calendario_anio || new Date().getFullYear();
  const fotosOrganigrama = expediente.fotos["organigrama"] || [];
  const turnosDisp = getTurnosDisponibles(expediente.turnosOperativo, expediente.turnosAdmin);
  const [modalImportAbierto, setModalImportAbierto] = useState<boolean>(false);

  // Inicializar / mantener filas UIPC para los 8 roles si están vacíos
  const uipcRows: UipcMiembroRow[] =
    expediente.uipcData && expediente.uipcData.length > 0
      ? expediente.uipcData
      : uiriRoles.map((r) => ({
          nombre: expediente.uiriData[r.id]?.nombre || "",
          funcion: r.label,
          puesto: "",
          ubicacion: "",
          telefono: "",
        }));

  const handleUipcChange = (idx: number, campo: keyof UipcMiembroRow, val: string) => {
    const list = [...uipcRows];
    list[idx] = { ...list[idx], [campo]: campo === "telefono" ? formatTelefono(val) : val };
    setUipcData(list);
  };

  // Manejo de brigadistas manuales
  const handleAddBrigadista = () => {
    const nuevo: BrigadistaRow = {
      num: expediente.brigadistas.length + 1,
      nombre: "",
      puesto: "",
      brigada: BRIGADAS_OPCIONES[0],
      rol: ROL_OPCIONES[0],
      turno: turnosDisp[0] || "Turno 1",
      telefono: "",
      ubicacion: "",
    };
    setBrigadistas([...expediente.brigadistas, nuevo]);
  };

  const handleRemoveBrigadista = (index: number) => {
    setBrigadistas(expediente.brigadistas.filter((_, i) => i !== index));
  };

  const handleBrigadistaChange = (index: number, campo: keyof BrigadistaRow, val: any) => {
    const list = [...expediente.brigadistas];
    const item = { ...list[index] };
    const valorFormateado = campo === "telefono" ? formatTelefono(val) : val;
    (item as any)[campo] = valorFormateado;

    if (item.jefeRoleId && (campo === "puesto" || campo === "telefono" || campo === "ubicacion")) {
      item.editado = {
        ...item.editado,
        [campo]: true,
      };
    }

    list[index] = item;
    setBrigadistas(list);
  };

  const handleRestablecerCampoJefe = (index: number, campo: "puesto" | "telefono" | "ubicacion") => {
    const list = [...expediente.brigadistas];
    const item = { ...list[index] };
    if (!item.jefeRoleId) return;

    const matchRol = uiriRoles.find((r) => r.id === item.jefeRoleId);
    const uipcRow = matchRol
      ? (expediente.uipcData || []).find((r) => r.funcion === matchRol.label)
      : undefined;

    const valorOriginal = uipcRow ? (uipcRow[campo] || "") : "";

    item[campo] = valorOriginal;
    item.editado = {
      ...item.editado,
      [campo]: false,
    };

    list[index] = item;
    setBrigadistas(list);
  };

  const handleDescargarFormato = () => {
    const wb = XLSX.utils.book_new();
    const wsData = [
      BRIG_XLS_COLUMNAS.map((c) => c.titulo),
      [
        "Juan Pérez Gómez",
        "Supervisor de Seguridad",
        "Primeros Auxilios",
        "Brigadista de primeros auxilios",
        turnosDisp[0] || "Turno 1",
        "(81) 1234-5678",
        "Edificio A - Planta Baja",
      ],
    ];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    XLSX.utils.book_append_sheet(wb, ws, "Brigadistas");
    XLSX.writeFile(wb, "Formato_Brigadistas_PIPC.xlsx");
  };

  const nombresJefes = (expediente.brigadistas || [])
    .filter((b) => b.jefeRoleId)
    .map((b) => b.nombre);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {/* Card 1: 8 roles UIRI */}
      <div className="card p-4">
        <div style={{ borderLeft: "3px solid #2B8FCC", paddingLeft: "10px", marginBottom: "14px" }}>
          <h3 style={{ fontSize: "13px", fontWeight: 700, color: "#1e293b", textTransform: "uppercase", margin: 0 }}>
            Integrantes de la UIRI (Unidad Interna de Respuesta Inmediata)
          </h3>
          <p style={{ fontSize: "11px", color: "#64748b", margin: 0 }}>
            Captura los nombres de los 8 roles normativos. Estos nombres alimentan en vivo el organigrama, el directorio UIPC y a los 4 Jefes de Brigada.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "12px" }}>
          {uiriRoles.map((rol) => (
            <div
              key={rol.id}
              style={{
                backgroundColor: "#f8fafc",
                padding: "10px 12px",
                borderRadius: "8px",
                border: "1px solid #e2e8f0",
              }}
            >
              <label
                style={{
                  fontSize: "11px",
                  fontWeight: 600,
                  color: "#2B8FCC",
                  textTransform: "uppercase",
                  display: "block",
                  marginBottom: "4px",
                }}
              >
                {rol.label}
              </label>
              <input
                type="text"
                className="form-control text-xs"
                value={expediente.uiriData[rol.id]?.nombre || ""}
                disabled={soloLectura}
                onChange={(e) => setUiriNombre(rol.id, e.target.value)}
                placeholder="Nombre completo"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Card 2: Organigrama */}
      <div className="card p-4">
        <div style={{ borderLeft: "3px solid #2B8FCC", paddingLeft: "10px", marginBottom: "14px" }}>
          <h3 style={{ fontSize: "13px", fontWeight: 700, color: "#1e293b", textTransform: "uppercase", margin: 0 }}>
            Organigrama UIPC
          </h3>
          <p style={{ fontSize: "11px", color: "#64748b", margin: 0 }}>
            Generado automáticamente a partir de los integrantes de la UIRI. Si subes una imagen del organigrama institucional, se usará la imagen subida.
          </p>
        </div>

        <div style={{ marginBottom: "16px" }}>
          <Organigrama
            uiriData={expediente.uiriData}
            fotoOrganigrama={fotosOrganigrama[0]}
          />
        </div>

        <div>
          <label className="form-label text-xs">Foto opcional del organigrama institucional</label>
          <ZonaFotos
            fotos={fotosOrganigrama}
            onSubir={(arch) => agregarFoto("organigrama", arch, true)}
            onQuitar={(fId) => quitarFoto("organigrama", fId)}
            multiple={false}
            label="Subir imagen de organigrama personalizado (reemplaza el diagrama generado)"
            soloLectura={soloLectura}
          />
        </div>
      </div>

      {/* Card 3: Integrantes de la UIPC (Directorio de funciones) */}
      <div className="card p-4">
        <div style={{ borderLeft: "3px solid #2B8FCC", paddingLeft: "10px", marginBottom: "14px" }}>
          <h3 style={{ fontSize: "13px", fontWeight: 700, color: "#1e293b", textTransform: "uppercase", margin: 0 }}>
            Integrantes de la UIPC (Directorio y Ubicación)
          </h3>
          <p style={{ fontSize: "11px", color: "#64748b", margin: 0 }}>
            Los nombres y funciones se sincronizan automáticamente desde la UIRI. Completa puesto, ubicación y teléfono de contacto.
          </p>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table className="table table-sm table-bordered" style={{ fontSize: "12px", minWidth: "680px", marginBottom: 0 }}>
            <thead className="table-light">
              <tr>
                <th style={{ width: "35px", textAlign: "center" }}>#</th>
                <th style={{ width: "200px" }}>Nombre (UIRI)</th>
                <th style={{ width: "160px" }}>Función en UIPC</th>
                <th>Puesto en la empresa</th>
                <th>Ubicación en instalación</th>
                <th style={{ width: "150px" }}>Teléfono</th>
              </tr>
            </thead>
            <tbody>
              {uipcRows.map((r, i) => (
                <tr key={i}>
                  <td style={{ textAlign: "center", color: "#64748b", fontWeight: 600 }}>{i + 1}</td>
                  <td style={{ fontWeight: 600, color: "#1e293b" }}>
                    {r.nombre ? r.nombre : <TextoPendiente title="Falta capturar el nombre en la UIRI (Organización UIPC)" />}
                  </td>
                  <td style={{ color: "#2B8FCC", fontWeight: 500 }}>{r.funcion}</td>
                  <td>
                    <input
                      type="text"
                      className="form-control form-control-sm text-xs"
                      value={r.puesto}
                      disabled={soloLectura}
                      placeholder="Puesto interno"
                      onChange={(e) => handleUipcChange(i, "puesto", e.target.value)}
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      className="form-control form-control-sm text-xs"
                      value={r.ubicacion}
                      disabled={soloLectura}
                      placeholder="Ej. Oficina 2do piso"
                      onChange={(e) => handleUipcChange(i, "ubicacion", e.target.value)}
                    />
                  </td>
                  <td>
                    <input
                      type="tel"
                      className="form-control form-control-sm text-xs"
                      value={r.telefono}
                      disabled={soloLectura}
                      placeholder="(81) 1234-5678"
                      onChange={(e) => handleUipcChange(i, "telefono", e.target.value)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Card 4: Integrantes de Brigadas de Emergencia */}
      <div className="card p-4">
        <div style={{ borderLeft: "3px solid #2B8FCC", paddingLeft: "10px", marginBottom: "14px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
            <div>
              <h3 style={{ fontSize: "13px", fontWeight: 700, color: "#1e293b", textTransform: "uppercase", margin: 0 }}>
                Integrantes de las Brigadas de Emergencia
              </h3>
              <p style={{ fontSize: "11px", color: "#64748b", margin: 0 }}>
                Los primeros 4 renglones corresponden a los Jefes de Brigada (sincronizados desde la UIRI). Puedes agregar brigadistas manualmente o importar desde Excel.
              </p>
            </div>

            {!soloLectura && (
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  type="button"
                  className="btn btn-outline-secondary btn-sm"
                  onClick={handleDescargarFormato}
                  style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "12px" }}
                >
                  <i className="bi bi-download" />
                  Descargar formato
                </button>
                <button
                  type="button"
                  className="btn btn-outline-success btn-sm"
                  onClick={() => setModalImportAbierto(true)}
                  style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "12px" }}
                >
                  <i className="bi bi-file-earmark-arrow-up" />
                  Importar Excel
                </button>
              </div>
            )}
          </div>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table className="table table-sm table-bordered" style={{ fontSize: "11px", minWidth: "850px", marginBottom: "10px" }}>
            <thead className="table-light">
              <tr>
                <th style={{ width: "35px", textAlign: "center" }}>#</th>
                <th style={{ minWidth: "160px" }}>Nombre completo *</th>
                <th style={{ minWidth: "120px" }}>Puesto</th>
                <th style={{ width: "150px" }}>Brigada *</th>
                <th style={{ width: "160px" }}>Rol / Función *</th>
                <th style={{ width: "110px" }}>Turno *</th>
                <th style={{ width: "130px" }}>Teléfono</th>
                <th style={{ minWidth: "120px" }}>Ubicación</th>
                {!soloLectura && <th style={{ width: "40px", textAlign: "center" }}></th>}
              </tr>
            </thead>
            <tbody>
              {expediente.brigadistas.map((b, idx) => {
                const esJefe = !!b.jefeRoleId;
                const err = erroresBrigadista(b, turnosDisp);

                return (
                  <tr key={idx} style={{ background: esJefe ? "#f0fdf4" : "#ffffff" }}>
                    <td style={{ textAlign: "center", fontWeight: 600, color: esJefe ? "#16a34a" : "#64748b" }}>
                      {idx + 1}
                    </td>
                    <td>
                      {esJefe ? (
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <span
                            style={{ fontWeight: 600, color: "#64748b" }}
                            title="Se sincroniza con la UIRI"
                          >
                            {b.nombre ? (
                              b.nombre
                            ) : (
                              <TextoPendiente title="Se sincroniza con la UIRI" />
                            )}
                          </span>
                          <span className="badge badge-soft-green" style={{ fontSize: "10px" }}>
                            Líder UIRI
                          </span>
                        </div>
                      ) : (
                        <input
                          type="text"
                          className="form-control form-control-sm text-xs"
                          value={b.nombre}
                          disabled={soloLectura}
                          placeholder="Nombre del brigadista"
                          onChange={(e) => handleBrigadistaChange(idx, "nombre", e.target.value)}
                        />
                      )}
                    </td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                        <input
                          type="text"
                          className="form-control form-control-sm text-xs"
                          style={{ flex: 1, minWidth: 0 }}
                          value={b.puesto || ""}
                          disabled={soloLectura}
                          placeholder="Puesto interno"
                          onChange={(e) => handleBrigadistaChange(idx, "puesto", e.target.value)}
                        />
                        {esJefe && b.editado?.puesto && !soloLectura && (
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-secondary"
                            style={{ padding: "2px 5px", fontSize: "11px", lineHeight: 1, flexShrink: 0 }}
                            title="Volver a tomar de la UIPC"
                            onClick={() => handleRestablecerCampoJefe(idx, "puesto")}
                          >
                            <i className="bi bi-arrow-counterclockwise" />
                          </button>
                        )}
                      </div>
                    </td>
                    <td>
                      <select
                        className={`form-select form-select-sm text-xs ${err.brigada ? "is-invalid" : ""}`}
                        value={b.brigada}
                        disabled={soloLectura}
                        onChange={(e) => handleBrigadistaChange(idx, "brigada", e.target.value)}
                      >
                        {BRIGADAS_OPCIONES.map((br) => (
                          <option key={br} value={br}>
                            {br}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <select
                        className={`form-select form-select-sm text-xs ${err.rol ? "is-invalid" : ""}`}
                        value={b.rol}
                        disabled={soloLectura}
                        onChange={(e) => handleBrigadistaChange(idx, "rol", e.target.value)}
                      >
                        {ROL_OPCIONES.map((r) => (
                          <option key={r} value={r}>
                            {r}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <select
                        className={`form-select form-select-sm text-xs ${err.turno ? "is-invalid" : ""}`}
                        value={b.turno}
                        disabled={soloLectura}
                        onChange={(e) => handleBrigadistaChange(idx, "turno", e.target.value)}
                      >
                        {turnosDisp.map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                        <input
                          type="tel"
                          className={`form-control form-control-sm text-xs ${err.telefono ? "is-invalid" : ""}`}
                          style={{ flex: 1, minWidth: 0 }}
                          value={b.telefono || ""}
                          disabled={soloLectura}
                          placeholder="(81) 1234-5678"
                          onChange={(e) => handleBrigadistaChange(idx, "telefono", e.target.value)}
                        />
                        {esJefe && b.editado?.telefono && !soloLectura && (
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-secondary"
                            style={{ padding: "2px 5px", fontSize: "11px", lineHeight: 1, flexShrink: 0 }}
                            title="Volver a tomar de la UIPC"
                            onClick={() => handleRestablecerCampoJefe(idx, "telefono")}
                          >
                            <i className="bi bi-arrow-counterclockwise" />
                          </button>
                        )}
                      </div>
                    </td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                        <input
                          type="text"
                          className="form-control form-control-sm text-xs"
                          style={{ flex: 1, minWidth: 0 }}
                          value={b.ubicacion || ""}
                          disabled={soloLectura}
                          placeholder="Área de trabajo"
                          onChange={(e) => handleBrigadistaChange(idx, "ubicacion", e.target.value)}
                        />
                        {esJefe && b.editado?.ubicacion && !soloLectura && (
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-secondary"
                            style={{ padding: "2px 5px", fontSize: "11px", lineHeight: 1, flexShrink: 0 }}
                            title="Volver a tomar de la UIPC"
                            onClick={() => handleRestablecerCampoJefe(idx, "ubicacion")}
                          >
                            <i className="bi bi-arrow-counterclockwise" />
                          </button>
                        )}
                      </div>
                    </td>
                    {!soloLectura && (
                      <td style={{ textAlign: "center" }}>
                        {esJefe ? (
                          <span
                            style={{ color: "#94a3b8", cursor: "help" }}
                            title="Jefe de brigada (sincronizado con la UIRI/UIPC)"
                          >
                            <i className="bi bi-lock-fill" />
                          </span>
                        ) : (
                          <button
                            type="button"
                            className="btn btn-outline-danger btn-sm"
                            onClick={() => handleRemoveBrigadista(idx)}
                            style={{ padding: "2px 6px", fontSize: "11px" }}
                            title="Eliminar brigadista"
                          >
                            <i className="bi bi-x-lg" />
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {!soloLectura && (
          <div>
            <button
              type="button"
              className="btn btn-outline-primary btn-sm"
              onClick={handleAddBrigadista}
              style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "12px" }}
            >
              <i className="bi bi-plus-lg" />
              Agregar brigadista
            </button>
          </div>
        )}
      </div>

      {/* Card 5: Calendario anual de actividades */}
      <div className="card p-4">
        <div style={{ borderLeft: "3px solid #2B8FCC", paddingLeft: "10px", marginBottom: "14px" }}>
          <h3 style={{ fontSize: "13px", fontWeight: 700, color: "#1e293b", textTransform: "uppercase", margin: 0 }}>
            Calendario anual de actividades de Protección Civil
          </h3>
          <p style={{ fontSize: "11px", color: "#64748b", margin: 0 }}>
            Programa preventivo de actividades del inmueble para el año en curso.
          </p>
        </div>

        <CalendarioActividades
          anio={anio}
          actividades={expediente.calendarioActividades || []}
          onChange={setCalendarioActividades}
          soloLectura={soloLectura}
        />
      </div>

      {/* Modal Importar Brigadistas */}
      <ModalImportarBrigadistas
        abierto={modalImportAbierto}
        onCerrar={() => setModalImportAbierto(false)}
        onAplicar={aplicarImportBrigadistas}
        turnos={turnosDisp}
        nombresJefes={nombresJefes}
      />
    </div>
  );
};
