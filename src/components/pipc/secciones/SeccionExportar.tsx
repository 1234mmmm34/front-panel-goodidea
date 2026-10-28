"use client";

import React, { useState } from "react";
import { PipcExpediente, PendienteItem, ESTADOS_PIPC } from "../pipcCalculos";
import { generarZipExport } from "../pipcExport";
import { PipcService, extraerMensajeError } from "@/services/pipc.service";
import { useToast } from "@/context/ToastContext";

interface Props {
  expediente: PipcExpediente;
  pendientes: PendienteItem[];
  pendientesAlta: PendienteItem[];
  setFormField: (field: any, value: any) => void;
  onScrollASeccion?: (seccionIdx: number) => void;
  soloLectura?: boolean;
  forzarGuardadoPendiente?: () => Promise<boolean>;
}

export const SeccionExportar: React.FC<Props> = ({
  expediente,
  pendientes,
  pendientesAlta,
  setFormField,
  onScrollASeccion,
  soloLectura = false,
  forzarGuardadoPendiente,
}) => {
  const { toast } = useToast();
  const form = expediente.form;

  const [modalConfirmarCriticos, setModalConfirmarCriticos] = useState<boolean>(false);
  const [modalProgresoExport, setModalProgresoExport] = useState<boolean>(false);
  const [pasoProgreso, setPasoProgreso] = useState<string>("Preparando expediente...");
  const [pctProgreso, setPctProgreso] = useState<number>(5);

  const ejecutarExportacionZip = async () => {
    setModalConfirmarCriticos(false);
    setModalProgresoExport(true);
    setPasoProgreso("Guardando secciones pendientes...");
    setPctProgreso(10);

    try {
      if (forzarGuardadoPendiente) {
        await forzarGuardadoPendiente();
      }

      await generarZipExport(
        expediente,
        (paso, pct) => {
          setPasoProgreso(paso);
          if (pct !== undefined) setPctProgreso(pct);
        },
        (id) => PipcService.getArchivoBlob(id)
      );

      toast.success("ZIP generado");
    } catch (err: any) {
      toast.error(extraerMensajeError(err, "No se pudo generar el archivo ZIP"));
    } finally {
      setModalProgresoExport(false);
    }
  };

  const handleBotonExportarZip = async () => {
    if (forzarGuardadoPendiente) {
      await forzarGuardadoPendiente();
    }

    if (pendientesAlta.length > 0) {
      setModalConfirmarCriticos(true);
      return;
    }

    ejecutarExportacionZip();
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {/* 1. Control de Gestión y Estado */}
      <div className="card p-4">
        <div style={{ borderLeft: "3px solid #2B8FCC", paddingLeft: "10px", marginBottom: "14px" }}>
          <h3 style={{ fontSize: "13px", fontWeight: 700, color: "#1e293b", textTransform: "uppercase", margin: 0 }}>
            Control de gestión y consultoría
          </h3>
          <p style={{ fontSize: "11px", color: "#64748b", margin: 0 }}>
            Estatus operativo del expediente, consultor responsable y notas internas del servicio.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "14px", marginBottom: "14px" }}>
          <div>
            <label className="form-label text-xs">Estado del expediente</label>
            <select
              className="form-select text-xs"
              value={form.expediente_estado}
              disabled={soloLectura}
              onChange={(e) => setFormField("expediente_estado", e.target.value)}
              style={{ height: "34px" }}
            >
              {ESTADOS_PIPC.map((est) => (
                <option key={est.valor} value={est.valor}>
                  {est.texto}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="form-label text-xs">Consultor responsable</label>
            <input
              type="text"
              className="form-control text-xs"
              placeholder="Nombre del consultor"
              value={form.consultor_responsable || expediente.v_Consultor || ""}
              disabled={soloLectura}
              onChange={(e) => setFormField("consultor_responsable", e.target.value)}
              style={{ height: "34px" }}
            />
          </div>

          <div>
            <label className="form-label text-xs">Fecha de visita técnica</label>
            <input
              type="date"
              className="form-control text-xs"
              value={form.fecha_visita_tecnica}
              disabled={soloLectura}
              onChange={(e) => setFormField("fecha_visita_tecnica", e.target.value)}
              style={{ height: "34px" }}
            />
          </div>

          <div style={{ gridColumn: "1 / -1" }}>
            <label className="form-label text-xs">Notas internas del consultor</label>
            <textarea
              className="form-control text-xs"
              rows={3}
              value={form.notas_internas_consultor}
              disabled={soloLectura}
              onChange={(e) => setFormField("notas_internas_consultor", e.target.value)}
              placeholder="Anotaciones técnicas internas, compromisos pendientes del cliente..."
            />
          </div>
        </div>
      </div>

      {/* 2. Lista Automática de Pendientes */}
      <div className="card p-4">
        <div style={{ borderLeft: "3px solid #2B8FCC", paddingLeft: "10px", marginBottom: "14px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "8px" }}>
            <div>
              <h3 style={{ fontSize: "13px", fontWeight: 700, color: "#1e293b", textTransform: "uppercase", margin: 0 }}>
                Auditoría automática de pendientes
              </h3>
              <p style={{ fontSize: "11px", color: "#64748b", margin: 0 }}>
                Detección en vivo de campos obligatorios o evidencias fotográficas faltantes para generar el PIPC.
              </p>
            </div>

            <div style={{ display: "flex", gap: "8px" }}>
              <span
                style={{
                  backgroundColor: pendientesAlta.length > 0 ? "#FDECEA" : "#EAFAF1",
                  color: pendientesAlta.length > 0 ? "#C0392B" : "#239B56",
                  padding: "3px 10px",
                  borderRadius: "14px",
                  fontSize: "11px",
                  fontWeight: 600,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                <i className={pendientesAlta.length > 0 ? "bi bi-exclamation-circle" : "bi bi-check-circle"} />
                {pendientesAlta.length} Alta prioridad
              </span>
              <span
                style={{
                  backgroundColor: "#F4F6F7",
                  color: "#5D6D7E",
                  padding: "3px 10px",
                  borderRadius: "14px",
                  fontSize: "11px",
                  fontWeight: 600,
                }}
              >
                {pendientes.length} totales
              </span>
            </div>
          </div>
        </div>

        {pendientes.length === 0 ? (
          <div
            style={{
              padding: "24px",
              textAlign: "center",
              backgroundColor: "#f0fdf4",
              borderRadius: "8px",
              border: "1px solid #bbf7d0",
            }}
          >
            <i className="bi bi-check-circle-fill" style={{ fontSize: "28px", color: "#16a34a" }} />
            <h4 style={{ fontSize: "13px", fontWeight: 700, color: "#166534", margin: "8px 0 2px" }}>
              ¡Expediente 100% completo!
            </h4>
            <p style={{ fontSize: "12px", color: "#15803d", margin: 0 }}>
              No se detectaron campos obligatorios pendientes ni evidencias faltantes.
            </p>
          </div>
        ) : (
          <div className="table-responsive" style={{ maxHeight: "360px", overflowY: "auto" }}>
            <table className="table table-sm table-hover text-xs mb-0" style={{ fontSize: "11.5px" }}>
              <thead>
                <tr style={{ backgroundColor: "#F8FAFC", color: "#64748b" }}>
                  <th style={{ width: "160px" }}>Sección</th>
                  <th>Requisito pendiente</th>
                  <th style={{ width: "90px", textAlign: "center" }}>Prioridad</th>
                  <th style={{ width: "60px", textAlign: "center" }}>Ir</th>
                </tr>
              </thead>
              <tbody>
                {pendientes.map((p, idx) => {
                  const esAlta = p.prioridad === "Alta";
                  return (
                    <tr key={idx}>
                      <td style={{ fontWeight: 600, color: "#334155" }}>{p.seccion}</td>
                      <td style={{ color: "#475569" }}>{p.pendiente}</td>
                      <td style={{ textAlign: "center" }}>
                        <span
                          style={{
                            display: "inline-block",
                            padding: "2px 8px",
                            borderRadius: "10px",
                            fontSize: "10px",
                            fontWeight: 700,
                            backgroundColor: esAlta ? "#FDECEA" : "#FEF9E7",
                            color: esAlta ? "#C0392B" : "#B7950B",
                          }}
                        >
                          {p.prioridad}
                        </span>
                      </td>
                      <td style={{ textAlign: "center" }}>
                        {onScrollASeccion && p.seccionIdx !== undefined && (
                          <button
                            type="button"
                            className="btn btn-outline-secondary btn-sm"
                            style={{ padding: "1px 6px", fontSize: "10px" }}
                            onClick={() => onScrollASeccion(p.seccionIdx!)}
                            title={`Ir a ${p.seccion}`}
                          >
                            <i className="bi bi-arrow-right" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 3. Exportar ZIP (Botón único según §7) */}
      <div className="card p-4">
        <div style={{ borderLeft: "3px solid #2B8FCC", paddingLeft: "10px", marginBottom: "14px" }}>
          <h3 style={{ fontSize: "13px", fontWeight: 700, color: "#1e293b", textTransform: "uppercase", margin: 0 }}>
            Exportación de expediente para generación Word
          </h3>
          <p style={{ fontSize: "11px", color: "#64748b", margin: 0 }}>
            Genera el paquete ZIP con datos en formato JSON (schema 4.7), imágenes generadas, fotografías descargadas y documentación para la IA.
          </p>
        </div>

        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "center" }}>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleBotonExportarZip}
            style={{
              padding: "10px 22px",
              fontSize: "13px",
              fontWeight: 600,
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              borderRadius: "6px",
              backgroundColor: "#2B8FCC",
              borderColor: "#2B8FCC",
            }}
          >
            <i className="bi bi-file-earmark-zip" style={{ fontSize: "16px" }} />
            Exportar ZIP
          </button>

          <span style={{ fontSize: "11.5px", color: "#64748b" }}>
            El estado del expediente no se modificará al exportar.
          </span>
        </div>
      </div>

      {/* Modal de confirmación para exportar con pendientes críticos (§7.2) */}
      {modalConfirmarCriticos && (
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
        >
          <div
            style={{
              background: "#fff",
              borderRadius: "10px",
              maxWidth: "460px",
              width: "100%",
              padding: "20px",
              boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px", color: "#b91c1c", marginBottom: "12px" }}>
              <i className="bi bi-exclamation-triangle-fill" style={{ fontSize: "22px" }} />
              <h4 style={{ margin: 0, fontSize: "15px", fontWeight: 700, color: "#1e293b" }}>
                Pendientes críticos detectados
              </h4>
            </div>

            <p style={{ fontSize: "13px", color: "#475569", lineHeight: 1.5, marginBottom: "20px" }}>
              El expediente tiene <strong>{pendientesAlta.length} pendiente(s) críticos</strong>. ¿Deseas exportar el avance de todos modos?
            </p>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setModalConfirmarCriticos(false)}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn btn-danger btn-sm"
                onClick={ejecutarExportacionZip}
              >
                Exportar de todos modos
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de progreso no cerrable (§7.3) */}
      {modalProgresoExport && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 10000,
            background: "rgba(15, 23, 42, 0.65)",
            backdropFilter: "blur(2px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px",
          }}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: "12px",
              maxWidth: "440px",
              width: "100%",
              padding: "24px",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
              textAlign: "center",
            }}
          >
            <div
              className="spinner-border text-primary"
              role="status"
              style={{ width: "38px", height: "38px", borderWidth: "3px", marginBottom: "16px", color: "#2B8FCC" }}
            >
              <span className="visually-hidden">Generando ZIP...</span>
            </div>

            <h4 style={{ fontSize: "15px", fontWeight: 700, color: "#1e293b", marginBottom: "6px" }}>
              Generando ZIP…
            </h4>
            <p style={{ fontSize: "12.5px", color: "#64748b", marginBottom: "16px" }}>
              {pasoProgreso}
            </p>

            <div className="progress" style={{ height: "8px", backgroundColor: "#f1f5f9", borderRadius: "4px" }}>
              <div
                className="progress-bar progress-bar-striped progress-bar-animated"
                role="progressbar"
                style={{ width: `${pctProgreso}%`, backgroundColor: "#2B8FCC" }}
              />
            </div>
            <div style={{ textAlign: "right", fontSize: "10px", color: "#94a3b8", marginTop: "4px" }}>
              {pctProgreso}%
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
