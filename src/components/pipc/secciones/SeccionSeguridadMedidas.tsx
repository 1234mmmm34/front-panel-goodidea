"use client";

import React from "react";
import {
  PipcExpediente,
  CapacitacionRow,
  SimulacroRow,
} from "../pipcCalculos";
import {
  TEXTO_PREVENCION_EXPLOSIONES_APLICA,
  TEXTO_PREVENCION_EXPLOSIONES_NO_APLICA,
} from "../pipcCatalogos";
import { formatearFechaTexto } from "@/lib/date-utils";
import { TablaEditable, ColumnaEditable } from "../comunes/TablaEditable";
import { ZonaFotos } from "../comunes/ZonaFotos";
import { TextoPendiente } from "../comunes/TextoPendiente";
import { MESES_PROG } from "../pipcMock";

interface Props {
  expediente: PipcExpediente;
  setCapacitacion: (rows: CapacitacionRow[]) => void;
  setSimulacros: (rows: SimulacroRow[]) => void;
  setFormField: (field: any, value: any) => void;
  setMaterialesPeligrosos: (list: string[]) => void;
  setRecomendaciones: (list: string[]) => void;
  agregarFoto: (seccionKey: string, archivo: File, soloUna?: boolean) => void;
  quitarFoto: (seccionKey: string, fotoId: string) => void;
  soloLectura?: boolean;
}

const MESES_OPTS = [
  "",
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

const columnasCapacitacion: ColumnaEditable[] = [
  { key: "tema", label: "Tema de capacitación", placeholder: "Ej. Uso y manejo de extintores", width: "320px" },
  { key: "mes", label: "Mes programado", type: "select", options: MESES_OPTS, width: "180px" },
];

const columnasSimulacros: ColumnaEditable[] = [
  { key: "tipo", label: "Hipótesis / Tipo de simulacro", placeholder: "Ej. Evacuación por conato de incendio", width: "320px" },
  { key: "mes", label: "Mes programado", type: "select", options: MESES_OPTS, width: "180px" },
];

export const SeccionSeguridadMedidas: React.FC<Props> = ({
  expediente,
  setCapacitacion,
  setSimulacros,
  setFormField,
  setMaterialesPeligrosos,
  setRecomendaciones,
  agregarFoto,
  quitarFoto,
  soloLectura = false,
}) => {
  const form = expediente.form;

  // Toggle prevención explosiones
  const handleToggleNoAplicaExplosiones = (noAplica: boolean) => {
    setFormField("prevencion_explosiones_no_aplica", noAplica);
    setFormField(
      "prevencion_explosiones_texto",
      noAplica ? TEXTO_PREVENCION_EXPLOSIONES_NO_APLICA : TEXTO_PREVENCION_EXPLOSIONES_APLICA
    );
  };

  // Párrafo de seguro
  const fechaSeguroFormateada = formatearFechaTexto(form.seguro_fecha);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {/* 1. Capacitación anual de brigadas */}
      <div className="card p-4">
        <div style={{ borderLeft: "3px solid #2B8FCC", paddingLeft: "10px", marginBottom: "14px" }}>
          <h3 style={{ fontSize: "13px", fontWeight: 700, color: "#1e293b", textTransform: "uppercase", margin: 0 }}>
            Programa anual de capacitación a brigadistas
          </h3>
          <p style={{ fontSize: "11px", color: "#64748b", margin: 0 }}>
            Cursos programados para la formación teórica y práctica del personal de respuesta.
          </p>
        </div>

        <TablaEditable
          columnas={columnasCapacitacion}
          filas={expediente.capacitacion}
          onChangeFila={(i, k, v) => {
            const list = [...expediente.capacitacion];
            list[i] = { ...list[i], [k]: v };
            setCapacitacion(list);
          }}
          onAgregarFila={() => {
            setCapacitacion([
              ...expediente.capacitacion,
              { tema: "", mes: "" },
            ]);
          }}
          onQuitarFila={(i) => {
            setCapacitacion(expediente.capacitacion.filter((_, idx) => idx !== i));
          }}
          textoBotonAgregar="+ Agregar curso de capacitación"
          soloLectura={soloLectura}
          isRowPending={(row) => {
            const tieneTema = String(row.tema || "").trim().length > 0;
            const mes = String(row.mes || "").trim();
            const tieneMes = mes.length > 0 && mes !== "— Seleccionar mes —";
            return tieneTema && !tieneMes;
          }}
          pendingTitle="Selecciona al menos un mes"
        />

        {/* Vista previa del cronograma de Capacitación */}
        {expediente.capacitacion.filter((r) => String(r.tema || "").trim()).length > 0 && (
          <div style={{ marginTop: "12px" }}>
            <div style={{ fontSize: "12px", fontWeight: 600, color: "#475569", marginBottom: "6px" }}>
              Vista previa del cronograma de capacitación
            </div>
            <div style={{ overflowX: "auto" }}>
              <table
                className="table table-sm table-bordered"
                style={{ fontSize: "11px", marginBottom: 0, minWidth: "600px", background: "#fff" }}
              >
                <thead className="table-light">
                  <tr>
                    <th style={{ width: "35px", textAlign: "center" }}>#</th>
                    <th>Tema</th>
                    {MESES_PROG.map((m) => (
                      <th key={m} style={{ width: "38px", textAlign: "center" }}>
                        {m}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {expediente.capacitacion
                    .filter((r) => String(r.tema || "").trim())
                    .map((row, i) => {
                      const mes = String(row.mes || "").trim();
                      const tieneMes = mes.length > 0 && mes !== "— Seleccionar mes —";
                      const sinMeses = !tieneMes;
                      const rowBg = sinMeses ? "#FDECEA" : undefined;

                      return (
                        <tr
                          key={i}
                          style={{
                            backgroundColor: rowBg,
                            borderLeft: sinMeses ? "3px solid #DC3545" : undefined,
                          }}
                        >
                          <td
                            style={{
                              textAlign: "center",
                              color: "#64748b",
                              backgroundColor: rowBg,
                              borderLeft: sinMeses ? "3px solid #DC3545" : undefined,
                            }}
                          >
                            {i + 1}
                          </td>
                          <td style={{ fontWeight: 500, color: "#1e293b", backgroundColor: rowBg }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                              <span>{row.tema}</span>
                              {sinMeses && (
                                <TextoPendiente
                                  title="Selecciona al menos un mes"
                                  style={{ fontSize: "11px", whiteSpace: "nowrap" }}
                                />
                              )}
                            </div>
                          </td>
                          {MESES_OPTS.slice(1).map((mNombre) => {
                            const marcado = (row.mes || "").trim().toLowerCase() === mNombre.toLowerCase();
                            return (
                              <td
                                key={mNombre}
                                style={{
                                  textAlign: "center",
                                  fontWeight: 700,
                                  color: marcado ? "#16a34a" : "#cbd5e1",
                                  backgroundColor: marcado ? "#f0fdf4" : (sinMeses ? "#FDECEA" : "transparent"),
                                }}
                              >
                                {marcado ? "✓" : "—"}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* 2. Simulacros */}
      <div className="card p-4">
        <div style={{ borderLeft: "3px solid #2B8FCC", paddingLeft: "10px", marginBottom: "14px" }}>
          <h3 style={{ fontSize: "13px", fontWeight: 700, color: "#1e293b", textTransform: "uppercase", margin: 0 }}>
            Programa anual de simulacros
          </h3>
          <p style={{ fontSize: "11px", color: "#64748b", margin: 0 }}>
            Calendario de ejercicios de evacuación con hipótesis de emergencia conforme a la normativa.
          </p>
        </div>

        <TablaEditable
          columnas={columnasSimulacros}
          filas={expediente.simulacros}
          onChangeFila={(i, k, v) => {
            const list = [...expediente.simulacros];
            list[i] = { ...list[i], [k]: v };
            setSimulacros(list);
          }}
          onAgregarFila={() => {
            setSimulacros([
              ...expediente.simulacros,
              { tipo: "", mes: "" },
            ]);
          }}
          onQuitarFila={(i) => {
            setSimulacros(expediente.simulacros.filter((_, idx) => idx !== i));
          }}
          textoBotonAgregar="+ Agregar simulacro programado"
          soloLectura={soloLectura}
          isRowPending={(row) => {
            const tieneTipo = String(row.tipo || "").trim().length > 0;
            const mes = String(row.mes || "").trim();
            const tieneMes = mes.length > 0 && mes !== "— Seleccionar mes —";
            return tieneTipo && !tieneMes;
          }}
          pendingTitle="Selecciona al menos un mes"
        />

        {/* Vista previa del cronograma de Simulacros */}
        {expediente.simulacros.filter((r) => String(r.tipo || "").trim()).length > 0 && (
          <div style={{ marginTop: "12px" }}>
            <div style={{ fontSize: "12px", fontWeight: 600, color: "#475569", marginBottom: "6px" }}>
              Vista previa del cronograma de ejercicios y simulacros
            </div>
            <div style={{ overflowX: "auto" }}>
              <table
                className="table table-sm table-bordered"
                style={{ fontSize: "11px", marginBottom: 0, minWidth: "600px", background: "#fff" }}
              >
                <thead className="table-light">
                  <tr>
                    <th style={{ width: "35px", textAlign: "center" }}>#</th>
                    <th>Tipo de simulacro</th>
                    {MESES_PROG.map((m) => (
                      <th key={m} style={{ width: "38px", textAlign: "center" }}>
                        {m}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {expediente.simulacros
                    .filter((r) => String(r.tipo || "").trim())
                    .map((row, i) => {
                      const mes = String(row.mes || "").trim();
                      const tieneMes = mes.length > 0 && mes !== "— Seleccionar mes —";
                      const sinMeses = !tieneMes;
                      const rowBg = sinMeses ? "#FDECEA" : undefined;

                      return (
                        <tr
                          key={i}
                          style={{
                            backgroundColor: rowBg,
                            borderLeft: sinMeses ? "3px solid #DC3545" : undefined,
                          }}
                        >
                          <td
                            style={{
                              textAlign: "center",
                              color: "#64748b",
                              backgroundColor: rowBg,
                              borderLeft: sinMeses ? "3px solid #DC3545" : undefined,
                            }}
                          >
                            {i + 1}
                          </td>
                          <td style={{ fontWeight: 500, color: "#1e293b", backgroundColor: rowBg }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                              <span>{row.tipo}</span>
                              {sinMeses && (
                                <TextoPendiente
                                  title="Selecciona al menos un mes"
                                  style={{ fontSize: "11px", whiteSpace: "nowrap" }}
                                />
                              )}
                            </div>
                          </td>
                          {MESES_OPTS.slice(1).map((mNombre) => {
                            const marcado = (row.mes || "").trim().toLowerCase() === mNombre.toLowerCase();
                            return (
                              <td
                                key={mNombre}
                                style={{
                                  textAlign: "center",
                                  fontWeight: 700,
                                  color: marcado ? "#16a34a" : "#cbd5e1",
                                  backgroundColor: marcado ? "#f0fdf4" : (sinMeses ? "#FDECEA" : "transparent"),
                                }}
                              >
                                {marcado ? "✓" : "—"}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* 3. Seguro de Responsabilidad Civil */}
      <div className="card p-4">
        <div style={{ borderLeft: "3px solid #2B8FCC", paddingLeft: "10px", marginBottom: "14px" }}>
          <h3 style={{ fontSize: "13px", fontWeight: 700, color: "#1e293b", textTransform: "uppercase", margin: 0 }}>
            Póliza de seguro de responsabilidad civil
          </h3>
          <p style={{ fontSize: "11px", color: "#64748b", margin: 0 }}>
            Aseguramiento de daños a terceros y cobertura patrimonial requerida por Protección Civil.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "14px", marginBottom: "14px" }}>
          <div>
            <label className="form-label text-xs">
              Número de póliza <span style={{ color: "#dc2626" }}>*</span>
            </label>
            <input
              type="text"
              className="form-control text-xs"
              value={form.seguro_poliza}
              disabled={soloLectura}
              onChange={(e) => setFormField("seguro_poliza", e.target.value)}
              placeholder="Ej. RC-2026-987654"
            />
          </div>

          <div>
            <label className="form-label text-xs">
              Compañía aseguradora <span style={{ color: "#dc2626" }}>*</span>
            </label>
            <input
              type="text"
              className="form-control text-xs"
              value={form.seguro_aseguradora}
              disabled={soloLectura}
              onChange={(e) => setFormField("seguro_aseguradora", e.target.value)}
              placeholder="Ej. AXA Seguros / GNP Seguros"
            />
          </div>

          <div>
            <label className="form-label text-xs">
              Inicio de vigencia <span style={{ color: "#dc2626" }}>*</span>
            </label>
            <input
              type="date"
              className="form-control text-xs"
              value={form.seguro_fecha}
              disabled={soloLectura}
              onChange={(e) => setFormField("seguro_fecha", e.target.value)}
            />
          </div>
        </div>

        <div style={{ background: "#f8fafc", padding: "12px", borderRadius: "6px", border: "1px solid #e2e8f0" }}>
          <div style={{ fontSize: "11px", fontWeight: 600, color: "#64748b", marginBottom: "4px" }}>
            Texto generado para el documento:
          </div>
          <p style={{ fontSize: "12px", color: "#334155", margin: 0, fontStyle: "italic", lineHeight: 1.5 }}>
            "La empresa cuenta con póliza de seguro de responsabilidad civil número{" "}
            {form.seguro_poliza ? (
              form.seguro_poliza
            ) : (
              <TextoPendiente title="Falta capturar el número de póliza" />
            )}
            , expedida por la compañía aseguradora{" "}
            {form.seguro_aseguradora ? (
              form.seguro_aseguradora
            ) : (
              <TextoPendiente title="Falta capturar la compañía aseguradora" />
            )}
            , con inicio de vigencia a partir del{" "}
            {fechaSeguroFormateada ? (
              fechaSeguroFormateada
            ) : (
              <TextoPendiente title="Falta capturar la fecha de inicio de vigencia" />
            )}
            ."
          </p>
        </div>
      </div>

      {/* 4. Prevención de Explosiones y Sustancias Peligrosas */}
      <div className="card p-4">
        <div style={{ borderLeft: "3px solid #2B8FCC", paddingLeft: "10px", marginBottom: "14px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
            <div>
              <h3 style={{ fontSize: "13px", fontWeight: 700, color: "#1e293b", textTransform: "uppercase", margin: 0 }}>
                Prevención de explosiones y manejo de materiales peligrosos
              </h3>
              <p style={{ fontSize: "11px", color: "#64748b", margin: 0 }}>
                Medidas preventivas contra atmósferas explosivas y sustancias reactivas.
              </p>
            </div>

            {!soloLectura && (
              <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", fontWeight: 600, color: "#475569", cursor: "pointer", background: "#f8fafc", padding: "6px 12px", borderRadius: "6px", border: "1px solid #cbd5e1" }}>
                <input
                  type="checkbox"
                  checked={form.prevencion_explosiones_no_aplica}
                  onChange={(e) => handleToggleNoAplicaExplosiones(e.target.checked)}
                />
                No aplica
              </label>
            )}
          </div>
        </div>

        <div style={{ marginBottom: "16px" }}>
          <label className="form-label text-xs">Redacción para el documento</label>
          <textarea
            className="form-control text-xs"
            rows={4}
            value={form.prevencion_explosiones_texto}
            disabled={soloLectura}
            onChange={(e) => setFormField("prevencion_explosiones_texto", e.target.value)}
          />
        </div>

        {/* Tabla de materiales peligrosos (solo si aplica) */}
        {!form.prevencion_explosiones_no_aplica && (
          <div>
            <h4 style={{ fontSize: "12px", fontWeight: 700, color: "#334155", marginBottom: "8px" }}>
              Listado de materiales peligrosos y sustancias químicas relevantes
            </h4>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {expediente.materialesPeligrosos.map((mat, i) => (
                <div key={i} style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                  <input
                    type="text"
                    className="form-control form-control-sm text-xs"
                    value={mat}
                    disabled={soloLectura}
                    placeholder="Ej. Gas LP en tanque estacionario de 1000 lts"
                    onChange={(e) => {
                      const list = [...expediente.materialesPeligrosos];
                      list[i] = e.target.value;
                      setMaterialesPeligrosos(list);
                    }}
                  />
                  {!soloLectura && (
                    <button
                      type="button"
                      className="btn btn-outline-danger btn-sm"
                      onClick={() => {
                        setMaterialesPeligrosos(expediente.materialesPeligrosos.filter((_, idx) => idx !== i));
                      }}
                      style={{ padding: "2px 8px" }}
                    >
                      <i className="bi bi-x-lg" />
                    </button>
                  )}
                </div>
              ))}
              {!soloLectura && (
                <div>
                  <button
                    type="button"
                    className="btn btn-outline-primary btn-sm"
                    onClick={() => setMaterialesPeligrosos([...expediente.materialesPeligrosos, ""])}
                    style={{ fontSize: "12px", display: "inline-flex", alignItems: "center", gap: "6px" }}
                  >
                    <i className="bi bi-plus-lg" />
                    Agregar material peligroso
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 5. Equipo de Identificación de Brigadistas */}
      <div className="card p-4">
        <div style={{ borderLeft: "3px solid #2B8FCC", paddingLeft: "10px", marginBottom: "14px" }}>
          <h3 style={{ fontSize: "13px", fontWeight: 700, color: "#1e293b", textTransform: "uppercase", margin: 0 }}>
            Equipo de identificación y protección de brigadistas
          </h3>
          <p style={{ fontSize: "11px", color: "#64748b", margin: 0 }}>
            Fotografías de chalecos distintivos por color de brigada, brazaletes, cascos o EPP.
          </p>
        </div>

        <ZonaFotos
          fotos={expediente.fotos["equipo-identificacion"] || []}
          onSubir={(arch) => agregarFoto("equipo-identificacion", arch, false)}
          onQuitar={(fId) => quitarFoto("equipo-identificacion", fId)}
          label="Subir fotos de chalecos, brazaletes o equipo de protección de los brigadistas"
          soloLectura={soloLectura}
        />
      </div>

      {/* 6. Atención Médica */}
      <div className="card p-4">
        <div style={{ borderLeft: "3px solid #2B8FCC", paddingLeft: "10px", marginBottom: "14px" }}>
          <h3 style={{ fontSize: "13px", fontWeight: 700, color: "#1e293b", textTransform: "uppercase", margin: 0 }}>
            Centro médico y atención de emergencias
          </h3>
          <p style={{ fontSize: "11px", color: "#64748b", margin: 0 }}>
            Procedimiento de primer contacto, convenio con clínica u hospital más cercano y traslado en ambulancia.
          </p>
        </div>

        <div>
          <label className="form-label text-xs">
            Procedimiento de atención médica y traslado <span style={{ color: "#dc2626" }}>*</span>
          </label>
          <textarea
            className="form-control text-xs"
            rows={4}
            value={form.atencion_medica}
            disabled={soloLectura}
            onChange={(e) => setFormField("atencion_medica", e.target.value)}
          />
        </div>
      </div>

      {/* 7. Recomendaciones Preventivas */}
      <div className="card p-4">
        <div style={{ borderLeft: "3px solid #2B8FCC", paddingLeft: "10px", marginBottom: "14px" }}>
          <h3 style={{ fontSize: "13px", fontWeight: 700, color: "#1e293b", textTransform: "uppercase", margin: 0 }}>
            Recomendaciones generales de seguridad
          </h3>
          <p style={{ fontSize: "11px", color: "#64748b", margin: 0 }}>
            Puntos de mejora detectados por el consultor durante la visita técnica preventiva.
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {expediente.recomendaciones.map((rec, i) => (
            <div key={i} style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              <input
                type="text"
                className="form-control form-control-sm text-xs"
                value={rec}
                disabled={soloLectura}
                placeholder="Ej. Reubicar extintor obstruido en nave de almacén"
                onChange={(e) => {
                  const list = [...expediente.recomendaciones];
                  list[i] = e.target.value;
                  setRecomendaciones(list);
                }}
              />
              {!soloLectura && (
                <button
                  type="button"
                  className="btn btn-outline-danger btn-sm"
                  onClick={() => {
                    setRecomendaciones(expediente.recomendaciones.filter((_, idx) => idx !== i));
                  }}
                  style={{ padding: "2px 8px" }}
                >
                  <i className="bi bi-x-lg" />
                </button>
              )}
            </div>
          ))}
          {!soloLectura && (
            <div>
              <button
                type="button"
                className="btn btn-outline-primary btn-sm"
                onClick={() => setRecomendaciones([...expediente.recomendaciones, ""])}
                style={{ fontSize: "12px", display: "inline-flex", alignItems: "center", gap: "6px" }}
              >
                <i className="bi bi-plus-lg" />
                Agregar recomendación
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
