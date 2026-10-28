"use client";

import React from "react";
import { ActividadCalendario } from "../pipcCalculos";
import { SelectorMeses } from "./SelectorMeses";
import { MESES_PROG } from "../pipcMock";
import { TextoPendiente } from "./TextoPendiente";

interface CalendarioActividadesProps {
  anio: number | string;
  actividades: ActividadCalendario[];
  onChange: (actividades: ActividadCalendario[]) => void;
  titulo?: string;
  soloLectura?: boolean;
}

export const CalendarioActividades: React.FC<CalendarioActividadesProps> = ({
  anio,
  actividades = [],
  onChange,
  titulo,
  soloLectura = false,
}) => {
  const handleAddActividad = () => {
    onChange([...actividades, { actividad: "", meses: [] }]);
  };

  const handleRemoveActividad = (index: number) => {
    onChange(actividades.filter((_, i) => i !== index));
  };

  const handleActividadNombreChange = (index: number, nombre: string) => {
    const next = [...actividades];
    next[index] = { ...next[index], actividad: nombre };
    onChange(next);
  };

  const handleToggleMes = (index: number, mes: number) => {
    const next = [...actividades];
    const currentMeses = next[index]?.meses || [];
    const updatedMeses = currentMeses.includes(mes)
      ? currentMeses.filter((m) => m !== mes)
      : [...currentMeses, mes].sort((a, b) => a - b);
    next[index] = { ...next[index], meses: updatedMeses };
    onChange(next);
  };

  const activas = actividades.filter((a) => String(a.actividad || "").trim().length > 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {titulo && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h4 style={{ margin: 0, fontSize: "13px", fontWeight: 700, color: "#1e293b" }}>{titulo}</h4>
          <span className="badge badge-light" style={{ fontSize: "12px", border: "1px solid #cbd5e1" }}>
            Año: <strong>{anio}</strong>
          </span>
        </div>
      )}

      {/* Editor de actividades */}
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {actividades.map((item, idx) => {
          const tieneNombre = String(item.actividad || "").trim().length > 0;
          const tieneMeses = (item.meses || []).length > 0;
          const sinMeses = tieneNombre && !tieneMeses;

          return (
            <div
              key={idx}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "10px 12px",
                background: sinMeses ? "#FDECEA" : "#f8fafc",
                border: "1px solid #e2e8f0",
                borderLeft: sinMeses ? "3px solid #DC3545" : "1px solid #e2e8f0",
                borderRadius: "8px",
                flexWrap: "wrap",
                transition: "background-color 0.15s ease, border-color 0.15s ease",
              }}
            >
              <span style={{ fontWeight: 700, color: "#64748b", fontSize: "12px", width: "20px" }}>
                {idx + 1}
              </span>
              <div style={{ flex: "1 1 220px", minWidth: "180px", display: "flex", alignItems: "center", gap: "8px" }}>
                <input
                  type="text"
                  className="form-control form-control-sm"
                  placeholder="Nombre de la actividad..."
                  value={item.actividad}
                  disabled={soloLectura}
                  onChange={(e) => handleActividadNombreChange(idx, e.target.value)}
                  style={{ fontSize: "12px" }}
                />
                {sinMeses && (
                  <TextoPendiente
                    title="Selecciona al menos un mes"
                    style={{ fontSize: "11px", whiteSpace: "nowrap" }}
                  />
                )}
              </div>
              <div style={{ flex: "2 1 360px" }}>
                <SelectorMeses
                  mesesSeleccionados={item.meses || []}
                  onToggleMes={(mes) => handleToggleMes(idx, mes)}
                  soloLectura={soloLectura}
                />
              </div>
              {!soloLectura && (
                <button
                  type="button"
                  className="btn btn-outline-danger btn-sm"
                  onClick={() => handleRemoveActividad(idx)}
                  title="Eliminar actividad"
                  style={{ padding: "3px 8px", fontSize: "12px" }}
                >
                  <i className="bi bi-x-lg" />
                </button>
              )}
            </div>
          );
        })}

        {!soloLectura && (
          <div>
            <button
              type="button"
              className="btn btn-sm btn-outline-primary"
              onClick={handleAddActividad}
              style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "12px" }}
            >
              <i className="bi bi-plus-lg" />
              Agregar actividad
            </button>
          </div>
        )}
      </div>

      {/* Tabla resumen / vista previa con palomitas ✓ */}
      {activas.length > 0 && (
        <div style={{ marginTop: "8px" }}>
          <div style={{ fontSize: "12px", fontWeight: 600, color: "#475569", marginBottom: "6px" }}>
            Vista previa del cronograma ({anio})
          </div>
          <div style={{ overflowX: "auto" }}>
            <table
              className="table table-sm table-bordered"
              style={{ fontSize: "11px", marginBottom: 0, minWidth: "600px", background: "#fff" }}
            >
              <thead className="table-light">
                <tr>
                  <th style={{ width: "35px", textAlign: "center" }}>#</th>
                  <th>Actividad</th>
                  {MESES_PROG.map((m) => (
                    <th key={m} style={{ width: "38px", textAlign: "center" }}>
                      {m}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {activas.map((a, i) => {
                  const tieneMeses = (a.meses || []).length > 0;
                  const sinMeses = !tieneMeses;
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
                          <span>{a.actividad}</span>
                          {sinMeses && (
                            <TextoPendiente
                              title="Selecciona al menos un mes"
                              style={{ fontSize: "11px", whiteSpace: "nowrap" }}
                            />
                          )}
                        </div>
                      </td>
                      {MESES_PROG.map((_, mIdx) => {
                        const mesNum = mIdx + 1;
                        const marcado = (a.meses || []).includes(mesNum);
                        return (
                          <td
                            key={mesNum}
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
  );
};
