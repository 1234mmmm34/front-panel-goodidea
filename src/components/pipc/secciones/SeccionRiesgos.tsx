"use client";

import React, { useState, useMemo } from "react";
import {
  PipcExpediente,
  AgenteEvaluado,
  estadoEvaluacionAgente,
  calcMagnitud,
  brigadasFaltantesPorRiesgos,
  colorMagnitud,
} from "../pipcCalculos";
import {
  agentesExt,
  agentesInt,
  getAllAgentesBase,
} from "../pipcCatalogos";
import { TarjetaAgente } from "../comunes/TarjetaAgente";
import { ZonaFotos } from "../comunes/ZonaFotos";
import { ModalMatrizRiesgo } from "../comunes/ModalMatrizRiesgo";

interface Props {
  expediente: PipcExpediente;
  setAgente: (idAgente: string, cambios: Partial<AgenteEvaluado>) => void;
  setFormField: (field: any, value: any) => void;
  agregarFoto: (seccionKey: string, archivo: File, soloUna?: boolean) => void;
  quitarFoto: (seccionKey: string, fotoId: string) => void;
  soloLectura?: boolean;
}

export const SeccionRiesgos: React.FC<Props> = ({
  expediente,
  setAgente,
  setFormField,
  agregarFoto,
  quitarFoto,
  soloLectura = false,
}) => {
  const [modalMatrizAbierto, setModalMatrizAbierto] = useState<boolean>(false);

  // Resumen de evaluación de riesgos
  const resumen = useMemo(() => {
    const todos = getAllAgentesBase();
    let completos = 0;
    let noAplica = 0;
    let incompletos = 0;
    let bajo = 0;
    let medio = 0;
    let alto = 0;

    todos.forEach((ag) => {
      const d = expediente.agentesData[ag.id];
      const e = estadoEvaluacionAgente(d);
      if (e === "completo") {
        completos++;
        const mag = calcMagnitud(d.probabilidad, d.consecuencia);
        if (mag === "BAJO") bajo++;
        else if (mag === "MEDIO") medio++;
        else if (mag === "ALTO") alto++;
      } else if (e === "no_aplica") {
        noAplica++;
      } else {
        incompletos++;
      }
    });

    return {
      total: todos.length,
      completos,
      noAplica,
      incompletos,
      bajo,
      medio,
      alto,
    };
  }, [expediente.agentesData]);

  // Brigadas faltantes
  const faltantes = useMemo(() => {
    return brigadasFaltantesPorRiesgos(expediente);
  }, [expediente]);

  const tieneFaltantes = Object.keys(faltantes).length > 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {/* 1. Resumen de Evaluación de Riesgos y Botón Ver Matriz */}
      <div className="card p-4">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px", marginBottom: "14px" }}>
          <div style={{ borderLeft: "3px solid #2B8FCC", paddingLeft: "10px" }}>
            <h3 style={{ fontSize: "13px", fontWeight: 700, color: "#1e293b", textTransform: "uppercase", margin: 0 }}>
              Resumen de evaluación de agentes perturbadores
            </h3>
            <p style={{ fontSize: "11px", color: "#64748b", margin: 0 }}>
              Evaluación cualitativa de los 39 fenómenos perturbadores según la matriz de riesgo 5 × 4.
            </p>
          </div>

          <button
            type="button"
            className="btn btn-outline-primary btn-sm"
            onClick={() => setModalMatrizAbierto(true)}
            style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "12px", height: "32px" }}
          >
            <i className="bi bi-grid-3x3" />
            Ver matriz de riesgo
          </button>
        </div>

        {/* Franja de estado */}
        <div
          style={{
            padding: "10px 14px",
            borderRadius: "8px",
            backgroundColor: resumen.incompletos > 0 ? "#fef2f2" : "#f0fdf4",
            border: `1px solid ${resumen.incompletos > 0 ? "#fecaca" : "#bbf7d0"}`,
            marginBottom: "14px",
            fontSize: "12px",
            fontWeight: 600,
            color: resumen.incompletos > 0 ? "#b91c1c" : "#166534",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <i className={resumen.incompletos > 0 ? "bi bi-exclamation-triangle-fill" : "bi bi-check-circle-fill"} />
          {resumen.incompletos > 0
            ? `⚠️ ${resumen.incompletos} de ${resumen.total} agentes pendientes de evaluar (falta Probabilidad, Consecuencia o marcar "No aplica").`
            : `✅ Los ${resumen.total} agentes están evaluados o marcados como "No aplica".`}
        </div>

        {/* Métricas rápidas */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))", gap: "8px" }}>
          <div style={{ padding: "8px 10px", background: "#f8fafc", borderRadius: "6px", border: "1px solid #e2e8f0", textAlign: "center" }}>
            <div style={{ fontSize: "10px", color: "#64748b", textTransform: "uppercase" }}>Evaluados</div>
            <div style={{ fontSize: "16px", fontWeight: 700, color: "#166534" }}>{resumen.completos}</div>
          </div>
          <div style={{ padding: "8px 10px", background: "#f8fafc", borderRadius: "6px", border: "1px solid #e2e8f0", textAlign: "center" }}>
            <div style={{ fontSize: "10px", color: "#64748b", textTransform: "uppercase" }}>No aplica</div>
            <div style={{ fontSize: "16px", fontWeight: 700, color: "#64748b" }}>{resumen.noAplica}</div>
          </div>
          <div style={{ padding: "8px 10px", background: "#f8fafc", borderRadius: "6px", border: "1px solid #e2e8f0", textAlign: "center" }}>
            <div style={{ fontSize: "10px", color: "#64748b", textTransform: "uppercase" }}>Pendientes</div>
            <div style={{ fontSize: "16px", fontWeight: 700, color: resumen.incompletos > 0 ? "#b91c1c" : "#64748b" }}>{resumen.incompletos}</div>
          </div>
          <div style={{ padding: "8px 10px", background: "#f0fdf4", borderRadius: "6px", border: "1px solid #bbf7d0", textAlign: "center" }}>
            <div style={{ fontSize: "10px", color: "#166534", textTransform: "uppercase" }}>Riesgo Bajo</div>
            <div style={{ fontSize: "16px", fontWeight: 700, color: colorMagnitud("BAJO") }}>{resumen.bajo}</div>
          </div>
          <div style={{ padding: "8px 10px", background: "#fefce8", borderRadius: "6px", border: "1px solid #fef08a", textAlign: "center" }}>
            <div style={{ fontSize: "10px", color: "#854d0e", textTransform: "uppercase" }}>Riesgo Medio</div>
            <div style={{ fontSize: "16px", fontWeight: 700, color: "#b45309" }}>{resumen.medio}</div>
          </div>
          <div style={{ padding: "8px 10px", background: "#fef2f2", borderRadius: "6px", border: "1px solid #fecaca", textAlign: "center" }}>
            <div style={{ fontSize: "10px", color: "#991b1b", textTransform: "uppercase" }}>Riesgo Alto</div>
            <div style={{ fontSize: "16px", fontWeight: 700, color: colorMagnitud("ALTO") }}>{resumen.alto}</div>
          </div>
        </div>
      </div>

      {/* Aviso de Brigadas Faltantes */}
      {tieneFaltantes && (
        <div
          className="alert alert-warning"
          style={{
            padding: "12px 16px",
            borderRadius: "8px",
            border: "1px solid #fef08a",
            background: "#fffbeb",
            fontSize: "12px",
            marginBottom: 0,
          }}
        >
          <div style={{ fontWeight: 700, color: "#92400e", marginBottom: "6px", display: "flex", alignItems: "center", gap: "6px" }}>
            <i className="bi bi-exclamation-triangle-fill" />
            Atención: Faltan brigadistas requeridos por los agentes que aplican
          </div>
          <ul style={{ margin: 0, paddingLeft: "20px", color: "#78350f" }}>
            {Object.keys(faltantes).map((br) => {
              const list = faltantes[br];
              return (
                <li key={br} style={{ marginBottom: "2px" }}>
                  <strong>{br}:</strong> requerida por {list.slice(0, 4).join(", ")}
                  {list.length > 4 ? ` (+${list.length - 4} más)` : ""}
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* 2. Bloque 1: Agentes Perturbadores de Origen Externo */}
      <div className="card p-4">
        <div style={{ borderLeft: "3px solid #2B8FCC", paddingLeft: "10px", marginBottom: "14px" }}>
          <h3 style={{ fontSize: "13px", fontWeight: 700, color: "#1e293b", textTransform: "uppercase", margin: 0 }}>
            Agentes Perturbadores de Origen Externo
          </h3>
          <p style={{ fontSize: "11px", color: "#64748b", margin: 0 }}>
            Fenómenos de origen natural o antropogénico que se originan fuera del inmueble.
          </p>
        </div>

        {agentesExt.map((grupo) => (
          <div key={grupo.grupo} style={{ marginBottom: "16px" }}>
            <h4
              style={{
                fontSize: "12px",
                fontWeight: 700,
                color: "#2B8FCC",
                backgroundColor: "#f8fafc",
                padding: "6px 10px",
                borderRadius: "6px",
                marginBottom: "10px",
              }}
            >
              {grupo.grupo}
            </h4>

            {grupo.agentes.map((ag) => (
              <TarjetaAgente
                key={ag.id}
                agente={ag}
                evaluacion={expediente.agentesData[ag.id] || { probabilidad: "", consecuencia: "", texto: ag.textoWord || "", noAplica: false }}
                onChange={(cambios) => setAgente(ag.id, cambios)}
                soloLectura={soloLectura}
              />
            ))}
          </div>
        ))}
      </div>

      {/* 3. Bloque 2: Agentes Perturbadores de Origen Interno */}
      <div className="card p-4">
        <div style={{ borderLeft: "3px solid #2B8FCC", paddingLeft: "10px", marginBottom: "14px" }}>
          <h3 style={{ fontSize: "13px", fontWeight: 700, color: "#1e293b", textTransform: "uppercase", margin: 0 }}>
            Agentes Perturbadores de Origen Interno
          </h3>
          <p style={{ fontSize: "11px", color: "#64748b", margin: 0 }}>
            Riesgos asociados a procesos productivos, instalaciones electromecánicas, manejo de materiales y factores humanos internos.
          </p>
        </div>

        {agentesInt.map((grupo) => (
          <div key={grupo.grupo} style={{ marginBottom: "16px" }}>
            <h4
              style={{
                fontSize: "12px",
                fontWeight: 700,
                color: "#2B8FCC",
                backgroundColor: "#f8fafc",
                padding: "6px 10px",
                borderRadius: "6px",
                marginBottom: "10px",
              }}
            >
              {grupo.grupo}
            </h4>

            {grupo.agentes.map((ag) => (
              <TarjetaAgente
                key={ag.id}
                agente={ag}
                evaluacion={expediente.agentesData[ag.id] || { probabilidad: "", consecuencia: "", texto: ag.textoWord || "", noAplica: false }}
                onChange={(cambios) => setAgente(ag.id, cambios)}
                soloLectura={soloLectura}
              />
            ))}
          </div>
        ))}
      </div>

      {/* 4. Foto de Tabla de Sustancias Químicas */}
      <div className="card p-4">
        <div style={{ borderLeft: "3px solid #2B8FCC", paddingLeft: "10px", marginBottom: "14px" }}>
          <h3 style={{ fontSize: "13px", fontWeight: 700, color: "#1e293b", textTransform: "uppercase", margin: 0 }}>
            Inventario de sustancias químicas
          </h3>
          <p style={{ fontSize: "11px", color: "#64748b", margin: 0 }}>
            Fotografía o tabla del listado de sustancias químicas y hojas de datos de seguridad (HDS).
          </p>
        </div>

        <ZonaFotos
          fotos={expediente.fotos["sustancias-quimicas"] || []}
          onSubir={(arch) => agregarFoto("sustancias-quimicas", arch, false)}
          onQuitar={(fId) => quitarFoto("sustancias-quimicas", fId)}
          label="Subir fotografía de la tabla de sustancias químicas"
          soloLectura={soloLectura}
        />
      </div>

      {/* 5. Contexto de la Zona y Colindancias */}
      <div className="card p-4">
        <div style={{ borderLeft: "3px solid #2B8FCC", paddingLeft: "10px", marginBottom: "14px" }}>
          <h3 style={{ fontSize: "13px", fontWeight: 700, color: "#1e293b", textTransform: "uppercase", margin: 0 }}>
            Contexto de la zona y colindancias
          </h3>
          <p style={{ fontSize: "11px", color: "#64748b", margin: 0 }}>
            Descripción del entorno circundante, vialidades principales, vías férreas, gasoductos o empresas aledañas.
          </p>
        </div>

        <div>
          <label className="form-label text-xs">Entorno geográfico e industrial</label>
          <textarea
            className="form-control text-xs"
            rows={3}
            value={expediente.form.contexto_zona}
            disabled={soloLectura}
            onChange={(e) => setFormField("contexto_zona", e.target.value)}
            placeholder="Ej. Inmueble ubicado en parque industrial con colindancias a naves de manufactura al norte y este..."
          />
        </div>
      </div>

      {/* Modal Matriz de Riesgo */}
      <ModalMatrizRiesgo
        abierto={modalMatrizAbierto}
        onCerrar={() => setModalMatrizAbierto(false)}
      />
    </div>
  );
};
