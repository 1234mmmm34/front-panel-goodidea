"use client";

import React from "react";
import { PipcExpediente } from "../pipcCalculos";
import { TEXTO_OBJETIVO_PIPC } from "../pipcCatalogos";
import { ZonaFotos } from "../comunes/ZonaFotos";
import { TextoPendiente } from "../comunes/TextoPendiente";

interface Props {
  expediente: PipcExpediente;
  setFormField: (field: any, value: any) => void;
  agregarFoto: (seccionKey: string, archivo: File, soloUna?: boolean) => void;
  quitarFoto: (seccionKey: string, fotoId: string) => void;
  soloLectura?: boolean;
}

export const SeccionInmueble: React.FC<Props> = ({
  expediente,
  setFormField,
  agregarFoto,
  quitarFoto,
  soloLectura = false,
}) => {
  const form = expediente.form;
  const modoPolitica = form.politica_modo || "texto";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {/* Historia */}
      <div className="card p-4">
        <div style={{ borderLeft: "3px solid #2B8FCC", paddingLeft: "10px", marginBottom: "14px" }}>
          <h3 style={{ fontSize: "13px", fontWeight: 700, color: "#1e293b", textTransform: "uppercase", margin: 0 }}>
            Historia de la empresa
          </h3>
          <p style={{ fontSize: "11px", color: "#64748b", margin: 0 }}>
            Breve reseña sobre los antecedentes y evolución del establecimiento.
          </p>
        </div>

        <div>
          <label className="form-label text-xs">Antecedentes históricos</label>
          <textarea
            className="form-control text-xs"
            rows={4}
            value={form.historia_empresa}
            disabled={soloLectura}
            onChange={(e) => setFormField("historia_empresa", e.target.value)}
            placeholder="Ej. Inició operaciones en 1998 especializada en..."
          />
        </div>
      </div>

      {/* Descripción física */}
      <div className="card p-4">
        <div style={{ borderLeft: "3px solid #2B8FCC", paddingLeft: "10px", marginBottom: "14px" }}>
          <h3 style={{ fontSize: "13px", fontWeight: 700, color: "#1e293b", textTransform: "uppercase", margin: 0 }}>
            Descripción física del inmueble
          </h3>
          <p style={{ fontSize: "11px", color: "#64748b", margin: 0 }}>
            Texto autogenerado a partir de los m² de construcción. Puedes personalizar la redacción manteniendo el formato.
          </p>
        </div>

        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "4px" }}>
            <label className="form-label text-xs" style={{ marginBottom: 0 }}>Descripción constructiva y funcional</label>
            {(!form.superficie_m2 || Number(form.superficie_m2) <= 0 || (form.descripcion_inmueble && form.descripcion_inmueble.includes("___,___"))) && (
              <span style={{ fontSize: "11px", color: "#64748b" }}>
                m² de construcción: <TextoPendiente title="Falta capturar los m² de construcción en la Sección 1 — Datos generales" />
              </span>
            )}
          </div>
          <textarea
            className="form-control text-xs"
            rows={6}
            value={form.descripcion_inmueble}
            disabled={soloLectura}
            onChange={(e) => setFormField("descripcion_inmueble", e.target.value)}
            style={{ lineHeight: "1.5" }}
          />
        </div>
      </div>

      {/* Política de seguridad */}
      <div className="card p-4">
        <div style={{ borderLeft: "3px solid #2B8FCC", paddingLeft: "10px", marginBottom: "14px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "8px" }}>
            <div>
              <h3 style={{ fontSize: "13px", fontWeight: 700, color: "#1e293b", textTransform: "uppercase", margin: 0 }}>
                Política de seguridad y salud en el trabajo
              </h3>
              <p style={{ fontSize: "11px", color: "#64748b", margin: 0 }}>
                Puede capturarse en texto redactado o subirse como imagen de la política firmada.
              </p>
            </div>

            {!soloLectura && (
              <div style={{ display: "inline-flex", borderRadius: "6px", border: "1px solid #cbd5e1", overflow: "hidden" }}>
                <button
                  type="button"
                  onClick={() => setFormField("politica_modo", "texto")}
                  style={{
                    padding: "4px 12px",
                    fontSize: "12px",
                    fontWeight: 600,
                    border: "none",
                    backgroundColor: modoPolitica === "texto" ? "#2B8FCC" : "#ffffff",
                    color: modoPolitica === "texto" ? "#ffffff" : "#475569",
                    cursor: "pointer",
                  }}
                >
                  <i className="bi bi-fonts me-1" />
                  Texto
                </button>
                <button
                  type="button"
                  onClick={() => setFormField("politica_modo", "imagen")}
                  style={{
                    padding: "4px 12px",
                    fontSize: "12px",
                    fontWeight: 600,
                    border: "none",
                    backgroundColor: modoPolitica === "imagen" ? "#2B8FCC" : "#ffffff",
                    color: modoPolitica === "imagen" ? "#ffffff" : "#475569",
                    cursor: "pointer",
                  }}
                >
                  <i className="bi bi-image me-1" />
                  Imagen
                </button>
              </div>
            )}
          </div>
        </div>

        {modoPolitica === "texto" ? (
          <div>
            <label className="form-label text-xs">Texto de la política</label>
            <textarea
              className="form-control text-xs"
              rows={4}
              value={form.politica_seguridad}
              disabled={soloLectura}
              onChange={(e) => setFormField("politica_seguridad", e.target.value)}
              placeholder="Ej. La Dirección General se compromete a salvaguardar la integridad de sus colaboradores..."
            />
          </div>
        ) : (
          <div>
            <label className="form-label text-xs">Imagen de la política de seguridad</label>
            <ZonaFotos
              fotos={expediente.fotos["politica-seguridad"] || []}
              onSubir={(arch) => agregarFoto("politica-seguridad", arch, false)}
              onQuitar={(fId) => quitarFoto("politica-seguridad", fId)}
              label="Subir fotografía de la política de seguridad firmada"
              soloLectura={soloLectura}
            />
          </div>
        )}
      </div>

      {/* Objetivo del PIPC (solo lectura) */}
      <div className="card p-4" style={{ backgroundColor: "#f8fafc" }}>
        <div style={{ borderLeft: "3px solid #64748b", paddingLeft: "10px", marginBottom: "10px" }}>
          <h3 style={{ fontSize: "13px", fontWeight: 700, color: "#1e293b", textTransform: "uppercase", margin: 0 }}>
            Objetivo del PIPC <span style={{ fontSize: "11px", color: "#64748b", fontWeight: 500 }}>(Normativo · Solo lectura)</span>
          </h3>
        </div>
        <p style={{ fontSize: "12px", color: "#475569", lineHeight: "1.5", margin: 0 }}>
          {TEXTO_OBJETIVO_PIPC}
        </p>
      </div>
    </div>
  );
};
