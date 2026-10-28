"use client";

import React from "react";
import { PipcExpediente, ActividadCalendario } from "../pipcCalculos";
import { ZonaFotos } from "../comunes/ZonaFotos";
import { CalendarioActividades } from "../comunes/CalendarioActividades";

interface Props {
  expediente: PipcExpediente;
  setFormField: (field: any, value: any) => void;
  setMantCalendarioEdificio: (actividades: ActividadCalendario[]) => void;
  setMantCalendarioGeneral: (actividades: ActividadCalendario[]) => void;
  agregarFoto: (seccionKey: string, archivo: File, soloUna?: boolean) => void;
  quitarFoto: (seccionKey: string, fotoId: string) => void;
  soloLectura?: boolean;
}

export const SeccionMantenimiento: React.FC<Props> = ({
  expediente,
  setFormField,
  setMantCalendarioEdificio,
  setMantCalendarioGeneral,
  agregarFoto,
  quitarFoto,
  soloLectura = false,
}) => {
  const anio = expediente.form.calendario_anio || new Date().getFullYear();
  const modoEdificio = expediente.form.mant_edificio_modo || "imagen";
  const modoGeneral = expediente.form.mant_general_modo || "imagen";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {/* 1. Programa de mantenimiento al edificio */}
      <div className="card p-4">
        <div style={{ borderLeft: "3px solid #2B8FCC", paddingLeft: "10px", marginBottom: "14px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "8px" }}>
            <div>
              <h3 style={{ fontSize: "13px", fontWeight: 700, color: "#1e293b", textTransform: "uppercase", margin: 0 }}>
                Programa de mantenimiento a edificio e instalaciones
              </h3>
              <p style={{ fontSize: "11px", color: "#64748b", margin: 0 }}>
                Estructura, impermeabilización, instalaciones eléctricas e hidrosanitarias.
              </p>
            </div>

            {!soloLectura && (
              <div style={{ display: "inline-flex", borderRadius: "6px", border: "1px solid #cbd5e1", overflow: "hidden" }}>
                <button
                  type="button"
                  onClick={() => setFormField("mant_edificio_modo", "imagen")}
                  style={{
                    padding: "4px 12px",
                    fontSize: "12px",
                    fontWeight: 600,
                    border: "none",
                    backgroundColor: modoEdificio === "imagen" ? "#2B8FCC" : "#ffffff",
                    color: modoEdificio === "imagen" ? "#ffffff" : "#475569",
                    cursor: "pointer",
                  }}
                >
                  <i className="bi bi-image me-1" />
                  Imagen
                </button>
                <button
                  type="button"
                  onClick={() => setFormField("mant_edificio_modo", "calendario")}
                  style={{
                    padding: "4px 12px",
                    fontSize: "12px",
                    fontWeight: 600,
                    border: "none",
                    backgroundColor: modoEdificio === "calendario" ? "#2B8FCC" : "#ffffff",
                    color: modoEdificio === "calendario" ? "#ffffff" : "#475569",
                    cursor: "pointer",
                  }}
                >
                  <i className="bi bi-calendar3 me-1" />
                  Calendario
                </button>
              </div>
            )}
          </div>
        </div>

        {modoEdificio === "imagen" ? (
          <div>
            <label className="form-label text-xs">Fotografías o escaneo del programa de mantenimiento a edificio</label>
            <ZonaFotos
              fotos={expediente.fotos["mant-edificio"] || []}
              onSubir={(arch) => agregarFoto("mant-edificio", arch, false)}
              onQuitar={(fId) => quitarFoto("mant-edificio", fId)}
              label="Subir fotos del programa de mantenimiento al edificio"
              soloLectura={soloLectura}
            />
          </div>
        ) : (
          <CalendarioActividades
            anio={anio}
            actividades={expediente.mantCalendarioEdificio || []}
            onChange={setMantCalendarioEdificio}
            soloLectura={soloLectura}
          />
        )}
      </div>

      {/* 2. Programa de mantenimiento general */}
      <div className="card p-4">
        <div style={{ borderLeft: "3px solid #2B8FCC", paddingLeft: "10px", marginBottom: "14px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "8px" }}>
            <div>
              <h3 style={{ fontSize: "13px", fontWeight: 700, color: "#1e293b", textTransform: "uppercase", margin: 0 }}>
                Programa de mantenimiento general (maquinaria y equipos)
              </h3>
              <p style={{ fontSize: "11px", color: "#64748b", margin: 0 }}>
                Mantenimiento a maquinaria productiva, montacargas, compresores y líneas de proceso.
              </p>
            </div>

            {!soloLectura && (
              <div style={{ display: "inline-flex", borderRadius: "6px", border: "1px solid #cbd5e1", overflow: "hidden" }}>
                <button
                  type="button"
                  onClick={() => setFormField("mant_general_modo", "imagen")}
                  style={{
                    padding: "4px 12px",
                    fontSize: "12px",
                    fontWeight: 600,
                    border: "none",
                    backgroundColor: modoGeneral === "imagen" ? "#2B8FCC" : "#ffffff",
                    color: modoGeneral === "imagen" ? "#ffffff" : "#475569",
                    cursor: "pointer",
                  }}
                >
                  <i className="bi bi-image me-1" />
                  Imagen
                </button>
                <button
                  type="button"
                  onClick={() => setFormField("mant_general_modo", "calendario")}
                  style={{
                    padding: "4px 12px",
                    fontSize: "12px",
                    fontWeight: 600,
                    border: "none",
                    backgroundColor: modoGeneral === "calendario" ? "#2B8FCC" : "#ffffff",
                    color: modoGeneral === "calendario" ? "#ffffff" : "#475569",
                    cursor: "pointer",
                  }}
                >
                  <i className="bi bi-calendar3 me-1" />
                  Calendario
                </button>
              </div>
            )}
          </div>
        </div>

        {modoGeneral === "imagen" ? (
          <div>
            <label className="form-label text-xs">Fotografías o escaneo del programa de mantenimiento general</label>
            <ZonaFotos
              fotos={expediente.fotos["mant-general"] || []}
              onSubir={(arch) => agregarFoto("mant-general", arch, false)}
              onQuitar={(fId) => quitarFoto("mant-general", fId)}
              label="Subir fotos del programa de mantenimiento general"
              soloLectura={soloLectura}
            />
          </div>
        ) : (
          <CalendarioActividades
            anio={anio}
            actividades={expediente.mantCalendarioGeneral || []}
            onChange={setMantCalendarioGeneral}
            soloLectura={soloLectura}
          />
        )}
      </div>
    </div>
  );
};
