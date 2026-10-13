"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Award, AlertCircle, Loader2, CheckCircle2 } from "lucide-react";
import {
  HistorialAlumno,
  HistorialAlumnoPutDto,
  EntregableAlumno,
} from "@/types/alumnosCatalogo";
import { AlumnosCatalogoService } from "@/services/alumnosCatalogo.service";
import { useToast } from "@/context/ToastContext";
import { formatearFechaTexto } from "@/lib/date-utils";

interface FilaAlumnoEdicion {
  original: HistorialAlumno;
  i_CveAlumnoAgenda: number;
  v_Nomina: string | null;
  v_Nombre: string | null;
  asistio: boolean | null;
  v_Curso: string | null;
  d_FechaInicio: string | null;
  evTeorica: string;
  evPractica: string;
  evFinal: string;
  entregables: EntregableAlumno[];
  estado: "pendiente" | "guardando" | "guardado" | "error";
  errorMensaje?: string;
}

interface ModalEvaluacionAlumnoProps {
  abierto: boolean;
  alumnos: HistorialAlumno[];
  onCerrar: (huboGuardadoParcial: boolean) => void;
  onGuardadoExitoso: () => void;
}

function filaHaCambiado(original: HistorialAlumno, actual: FilaAlumnoEdicion): boolean {
  if (original.b_Asistio !== actual.asistio) return true;

  const tOrig = (original.v_EvTeorica || "").trim();
  const tAct = actual.evTeorica.trim();
  if (tOrig !== tAct) return true;

  const pOrig = (original.v_EvPractica || "").trim();
  const pAct = actual.evPractica.trim();
  if (pOrig !== pAct) return true;

  const fOrig = (original.v_EvFinal || "").trim();
  const fAct = actual.evFinal.trim();
  if (fOrig !== fAct) return true;

  const origMap = new Map(
    (original.entregables || []).map((e) => [e.i_CveAgendaEntregable, e.v_Estatus])
  );
  for (const ent of actual.entregables) {
    const origStatus = origMap.get(ent.i_CveAgendaEntregable) || "PENDIENTE";
    if (ent.v_Estatus !== origStatus) return true;
  }

  return false;
}

/**
 * Ejecuta tareas con un límite de concurrencia (máximo 5 simultáneas)
 */
async function ejecutarConcurrente<T>(
  tasks: (() => Promise<T>)[],
  limite: number = 5
): Promise<void> {
  let index = 0;
  async function worker() {
    while (index < tasks.length) {
      const i = index++;
      await tasks[i]();
    }
  }
  const workers = Array.from(
    { length: Math.min(limite, tasks.length) },
    () => worker()
  );
  await Promise.all(workers);
}

export const ModalEvaluacionAlumno: React.FC<ModalEvaluacionAlumnoProps> = ({
  abierto,
  alumnos,
  onCerrar,
  onGuardadoExitoso,
}) => {
  const { toast } = useToast();
  const [mounted, setMounted] = useState(false);
  const [filas, setFilas] = useState<FilaAlumnoEdicion[]>([]);
  const [guardando, setGuardando] = useState(false);
  const [huboGuardadoParcial, setHuboGuardadoParcial] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (abierto && alumnos && alumnos.length > 0) {
      setFilas(
        alumnos.map((al) => ({
          original: al,
          i_CveAlumnoAgenda: al.i_CveAlumnoAgenda,
          v_Nomina: al.v_Nomina,
          v_Nombre: al.v_Nombre,
          asistio: al.b_Asistio ?? null,
          v_Curso: al.v_Curso,
          d_FechaInicio: al.d_FechaInicio,
          evTeorica: al.v_EvTeorica || "",
          evPractica: al.v_EvPractica || "",
          evFinal: al.v_EvFinal || "",
          entregables: (al.entregables || []).map((e) => ({ ...e })),
          estado: "pendiente",
          errorMensaje: undefined,
        }))
      );
      setHuboGuardadoParcial(false);
    } else {
      setFilas([]);
      setHuboGuardadoParcial(false);
    }
  }, [abierto, alumnos]);

  if (!mounted || !abierto || alumnos.length === 0) return null;

  const handleCambioAsistio = (id: number, val: boolean | null) => {
    setFilas((prev) =>
      prev.map((f) =>
        f.i_CveAlumnoAgenda === id
          ? {
              ...f,
              asistio: val,
              errorMensaje: undefined,
              estado: f.estado === "error" ? "pendiente" : f.estado,
            }
          : f
      )
    );
  };

  const handleCambioTeorica = (id: number, val: string) => {
    setFilas((prev) =>
      prev.map((f) =>
        f.i_CveAlumnoAgenda === id
          ? {
              ...f,
              evTeorica: val,
              errorMensaje: undefined,
              estado: f.estado === "error" ? "pendiente" : f.estado,
            }
          : f
      )
    );
  };

  const handleCambioPractica = (id: number, val: string) => {
    setFilas((prev) =>
      prev.map((f) =>
        f.i_CveAlumnoAgenda === id
          ? {
              ...f,
              evPractica: val,
              errorMensaje: undefined,
              estado: f.estado === "error" ? "pendiente" : f.estado,
            }
          : f
      )
    );
  };

  const handleCambioFinal = (id: number, val: string) => {
    setFilas((prev) =>
      prev.map((f) =>
        f.i_CveAlumnoAgenda === id
          ? {
              ...f,
              evFinal: val,
              errorMensaje: undefined,
              estado: f.estado === "error" ? "pendiente" : f.estado,
            }
          : f
      )
    );
  };

  const handleToggleEntregableModal = (id: number, idEnt: number) => {
    setFilas((prev) =>
      prev.map((f) => {
        if (f.i_CveAlumnoAgenda !== id) return f;
        const nuevosEnt = f.entregables.map((e) =>
          e.i_CveAgendaEntregable === idEnt
            ? {
                ...e,
                v_Estatus: (e.v_Estatus === "ENTREGADO"
                  ? "PENDIENTE"
                  : "ENTREGADO") as "ENTREGADO" | "PENDIENTE",
              }
            : e
        );
        return {
          ...f,
          entregables: nuevosEnt,
          errorMensaje: undefined,
          estado: f.estado === "error" ? "pendiente" : f.estado,
        };
      })
    );
  };

  const handleGuardar = async (e: React.FormEvent) => {
    e.preventDefault();

    // Identificar las filas que cambiaron y que aún no han sido guardadas
    const filasParaGuardar = filas.filter(
      (f) => f.estado !== "guardado" && filaHaCambiado(f.original, f)
    );

    // Si nada cambió
    if (filasParaGuardar.length === 0) {
      if (huboGuardadoParcial) {
        onCerrar(true);
      } else {
        onCerrar(false);
      }
      return;
    }

    setGuardando(true);

    // Marcar como "guardando"
    setFilas((prev) =>
      prev.map((f) =>
        filasParaGuardar.some((m) => m.i_CveAlumnoAgenda === f.i_CveAlumnoAgenda)
          ? { ...f, estado: "guardando", errorMensaje: undefined }
          : f
      )
    );

    let exitoCount = 0;
    let errorCount = 0;

    const tareas = filasParaGuardar.map((f) => async () => {
      const dto: HistorialAlumnoPutDto = {
        b_Asistio: f.asistio,
        v_EvTeorica: f.evTeorica.trim() === "" ? null : f.evTeorica.trim(),
        v_EvPractica: f.evPractica.trim() === "" ? null : f.evPractica.trim(),
        v_EvFinal: f.evFinal.trim() === "" ? null : f.evFinal.trim(),
        Entregables: f.entregables.map((ent) => ({
          i_CveAgendaEntregable: ent.i_CveAgendaEntregable,
          b_Entregado: ent.v_Estatus === "ENTREGADO",
        })),
      };

      try {
        const res = await AlumnosCatalogoService.putHistorialAlumno(
          f.i_CveAlumnoAgenda,
          dto
        );

        if (res.exito) {
          exitoCount++;
          setHuboGuardadoParcial(true);
          setFilas((prev) =>
            prev.map((item) =>
              item.i_CveAlumnoAgenda === f.i_CveAlumnoAgenda
                ? {
                    ...item,
                    estado: "guardado",
                    errorMensaje: undefined,
                    original: {
                      ...item.original,
                      b_Asistio: dto.b_Asistio,
                      v_EvTeorica: dto.v_EvTeorica,
                      v_EvPractica: dto.v_EvPractica,
                      v_EvFinal: dto.v_EvFinal,
                      entregables: item.entregables.map((e) => ({ ...e })),
                    },
                  }
                : item
            )
          );
        } else {
          errorCount++;
          setFilas((prev) =>
            prev.map((item) =>
              item.i_CveAlumnoAgenda === f.i_CveAlumnoAgenda
                ? {
                    ...item,
                    estado: "error",
                    errorMensaje:
                      res.error || "Ocurrió un error al guardar la evaluación.",
                  }
                : item
            )
          );
        }
      } catch (err: any) {
        errorCount++;
        const msg =
          err?.response?.data?.error ||
          err?.response?.data?.mensaje ||
          err?.message ||
          "Error inesperado al guardar.";
        setFilas((prev) =>
          prev.map((item) =>
            item.i_CveAlumnoAgenda === f.i_CveAlumnoAgenda
              ? { ...item, estado: "error", errorMensaje: msg }
              : item
          )
        );
      }
    });

    // Enviar en paralelo con un máximo de 5 simultáneas
    await ejecutarConcurrente(tareas, 5);

    setGuardando(false);

    // Evaluar resultado final
    if (errorCount === 0) {
      // Todas las filas salieron bien
      const totalGuardados = filasParaGuardar.length;
      toast.success(
        `${totalGuardados} ${
          totalGuardados === 1 ? "alumno actualizado" : "alumnos actualizados"
        }`
      );
      onGuardadoExitoso();
    } else {
      // Al menos una fila falló: el modal NO se cierra
      if (exitoCount > 0) {
        toast.warning(
          `Se guardaron ${exitoCount} alumnos, pero ${errorCount} fallaron. Revisa los errores marcados en rojo.`
        );
      } else {
        toast.error(
          `No se pudieron guardar las evaluaciones. Revisa los errores señalados.`
        );
      }
    }
  };

  const handleCerrar = () => {
    if (guardando) return;
    onCerrar(huboGuardadoParcial);
  };

  const tieneErroresPendientes = filas.some((f) => f.estado === "error");

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
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1050,
        padding: "16px",
      }}
      onClick={handleCerrar}
    >
      <div
        className="modal-content"
        style={{
          maxWidth: "1050px",
          width: "95vw",
          backgroundColor: "#ffffff",
          borderRadius: "14px",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
          display: "flex",
          flexDirection: "column",
          maxHeight: "90vh",
          overflow: "hidden",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="modal-header shrink-0"
          style={{
            padding: "16px 20px",
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
                borderRadius: "8px",
                backgroundColor: "#eff6ff",
                color: "#2563eb",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Award size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#0f172a", margin: 0 }}>
                Editar evaluaciones
              </h3>
              <p style={{ fontSize: "12px", color: "#64748b", margin: 0 }}>
                {alumnos.length} {alumnos.length === 1 ? "alumno" : "alumnos"}
              </p>
            </div>
          </div>
          <button
            className="btn-icon"
            onClick={handleCerrar}
            disabled={guardando}
            title="Cerrar modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form & Table Body */}
        <form
          onSubmit={handleGuardar}
          style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}
        >
          <div
            style={{
              padding: "16px 20px",
              overflowY: "auto",
              overflowX: "auto",
              flex: 1,
            }}
          >
            <table
              className="alegra-table alegra-table-compact"
              style={{ minWidth: "980px", margin: 0 }}
            >
              <thead
                style={{
                  position: "sticky",
                  top: 0,
                  zIndex: 10,
                  backgroundColor: "#f8fafc",
                }}
              >
                <tr>
                  <th style={{ width: "95px", padding: "6px 12px", whiteSpace: "nowrap", fontSize: "12px" }}>
                    Nómina
                  </th>
                  <th style={{ width: "180px", padding: "6px 12px", fontSize: "12px" }}>Nombre</th>
                  <th style={{ width: "125px", padding: "6px 12px", whiteSpace: "nowrap", fontSize: "12px" }}>
                    Asistió
                  </th>
                  <th style={{ width: "210px", padding: "6px 12px", fontSize: "12px" }}>Curso</th>
                  <th
                    style={{
                      width: "105px",
                      padding: "6px 12px",
                      textAlign: "center",
                      whiteSpace: "nowrap",
                      fontSize: "12px",
                    }}
                  >
                    EV teórica
                  </th>
                  <th
                    style={{
                      width: "105px",
                      padding: "6px 12px",
                      textAlign: "center",
                      whiteSpace: "nowrap",
                      fontSize: "12px",
                    }}
                  >
                    EV práctica
                  </th>
                  <th
                    style={{
                      width: "105px",
                      padding: "6px 12px",
                      textAlign: "center",
                      whiteSpace: "nowrap",
                      fontSize: "12px",
                    }}
                  >
                    EV final
                  </th>
                  <th style={{ minWidth: "200px", padding: "6px 12px", fontSize: "12px" }}>Entregables</th>
                  <th
                    style={{
                      width: "80px",
                      padding: "6px 12px",
                      textAlign: "center",
                      whiteSpace: "nowrap",
                      fontSize: "12px",
                    }}
                  >
                    Estatus
                  </th>
                </tr>
              </thead>
              <tbody>
                {filas.map((f) => {
                  const bloqueado = f.estado === "guardado" || guardando;
                  const tieneError = f.estado === "error";
                  const estaGuardado = f.estado === "guardado";

                  return (
                    <React.Fragment key={f.i_CveAlumnoAgenda}>
                      <tr
                        style={{
                          backgroundColor: estaGuardado
                            ? "#f0fdf4"
                            : tieneError
                            ? "#fef2f2"
                            : undefined,
                          transition: "background-color 0.2s",
                        }}
                        className="hover:bg-slate-50/50"
                      >
                        {/* Nómina */}
                        <td
                          style={{
                            padding: "6px 12px",
                            verticalAlign: "middle",
                            fontWeight: 500,
                            color: "#334155",
                            fontSize: "12px",
                          }}
                        >
                          {f.v_Nomina || "—"}
                        </td>

                        {/* Nombre */}
                        <td
                          style={{
                            padding: "6px 12px",
                            verticalAlign: "middle",
                            color: "#1e293b",
                            fontWeight: 600,
                            fontSize: "12px",
                          }}
                        >
                          {f.v_Nombre || "—"}
                        </td>

                        {/* Asistió */}
                        <td style={{ padding: "6px 12px", verticalAlign: "middle" }}>
                          <select
                            className="form-control text-xs"
                            value={
                              f.asistio === true
                                ? "true"
                                : f.asistio === false
                                ? "false"
                                : ""
                            }
                            onChange={(e) => {
                              const val =
                                e.target.value === "true"
                                  ? true
                                  : e.target.value === "false"
                                  ? false
                                  : null;
                              handleCambioAsistio(f.i_CveAlumnoAgenda, val);
                            }}
                            disabled={bloqueado}
                            style={{
                              height: "28px",
                              fontSize: "12px",
                              padding: "2px 6px",
                              borderRadius: "6px",
                              backgroundColor: bloqueado ? "#f8fafc" : "#ffffff",
                              borderColor: tieneError ? "#f87171" : undefined,
                              cursor: bloqueado ? "not-allowed" : "pointer",
                              width: "110px",
                            }}
                          >
                            <option value="">Pendiente</option>
                            <option value="true">Sí</option>
                            <option value="false">No</option>
                          </select>
                        </td>

                        {/* Curso con fecha de inicio debajo en gris */}
                        <td style={{ padding: "6px 12px", verticalAlign: "middle" }}>
                          <div
                            style={{
                              fontWeight: 600,
                              color: "#1e293b",
                              fontSize: "12px",
                              lineHeight: "1.3",
                            }}
                          >
                            {f.v_Curso || "—"}
                          </div>
                          <div
                            style={{
                              fontSize: "11px",
                              color: "#64748b",
                              marginTop: "2px",
                            }}
                          >
                            {f.d_FechaInicio ? formatearFechaTexto(f.d_FechaInicio) : "—"}
                          </div>
                        </td>

                        {/* EV teórica */}
                        <td
                          style={{
                            padding: "6px 12px",
                            verticalAlign: "middle",
                            textAlign: "center",
                          }}
                        >
                          <input
                            type="text"
                            maxLength={10}
                            className="form-control text-xs"
                            placeholder="Pendiente"
                            value={f.evTeorica}
                            onChange={(e) =>
                              handleCambioTeorica(f.i_CveAlumnoAgenda, e.target.value)
                            }
                            disabled={bloqueado}
                            style={{
                              width: "76px",
                              height: "28px",
                              fontSize: "12px",
                              textAlign: "center",
                              margin: "0 auto",
                              borderColor: tieneError ? "#f87171" : undefined,
                              borderRadius: "6px",
                              backgroundColor: bloqueado ? "#f8fafc" : "#ffffff",
                            }}
                          />
                        </td>

                        {/* EV práctica */}
                        <td
                          style={{
                            padding: "6px 12px",
                            verticalAlign: "middle",
                            textAlign: "center",
                          }}
                        >
                          <input
                            type="text"
                            maxLength={10}
                            className="form-control text-xs"
                            placeholder="Pendiente"
                            value={f.evPractica}
                            onChange={(e) =>
                              handleCambioPractica(f.i_CveAlumnoAgenda, e.target.value)
                            }
                            disabled={bloqueado}
                            style={{
                              width: "76px",
                              height: "28px",
                              fontSize: "12px",
                              textAlign: "center",
                              margin: "0 auto",
                              borderColor: tieneError ? "#f87171" : undefined,
                              borderRadius: "6px",
                              backgroundColor: bloqueado ? "#f8fafc" : "#ffffff",
                            }}
                          />
                        </td>

                        {/* EV final */}
                        <td
                          style={{
                            padding: "6px 12px",
                            verticalAlign: "middle",
                            textAlign: "center",
                          }}
                        >
                          <input
                            type="text"
                            maxLength={10}
                            className="form-control text-xs"
                            placeholder="Pendiente"
                            value={f.evFinal}
                            onChange={(e) =>
                              handleCambioFinal(f.i_CveAlumnoAgenda, e.target.value)
                            }
                            disabled={bloqueado}
                            style={{
                              width: "76px",
                              height: "28px",
                              fontSize: "12px",
                              textAlign: "center",
                              margin: "0 auto",
                              borderColor: tieneError ? "#f87171" : undefined,
                              borderRadius: "6px",
                              backgroundColor: bloqueado ? "#f8fafc" : "#ffffff",
                            }}
                          />
                        </td>

                        {/* Entregables */}
                        <td style={{ padding: "6px 12px", verticalAlign: "middle" }}>
                          {!f.entregables || f.entregables.length === 0 ? (
                            <span
                              style={{
                                color: "#94a3b8",
                                fontSize: "11px",
                                fontStyle: "italic",
                              }}
                            >
                              Sin entregables
                            </span>
                          ) : (
                            <div
                              style={{
                                display: "flex",
                                flexWrap: "wrap",
                                gap: "4px",
                                alignItems: "center",
                              }}
                            >
                              {f.entregables.map((ent) => {
                                const estaEntregado = ent.v_Estatus === "ENTREGADO";
                                return (
                                  <label
                                    key={ent.i_CveAgendaEntregable}
                                    style={{
                                      display: "inline-flex",
                                      alignItems: "center",
                                      gap: "4px",
                                      fontSize: "11px",
                                      color: estaEntregado ? "#065f46" : "#dc2626",
                                      cursor: bloqueado ? "not-allowed" : "pointer",
                                      backgroundColor: estaEntregado
                                        ? "#ecfdf5"
                                        : "#fef2f2",
                                      border: estaEntregado
                                        ? "1px solid #a7f3d0"
                                        : "1px solid #fecaca",
                                      borderRadius: "5px",
                                      padding: "1px 5px",
                                      userSelect: "none",
                                      opacity: bloqueado ? 0.7 : 1,
                                    }}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={estaEntregado}
                                      disabled={bloqueado}
                                      onChange={() =>
                                        handleToggleEntregableModal(
                                          f.i_CveAlumnoAgenda,
                                          ent.i_CveAgendaEntregable
                                        )
                                      }
                                      style={{
                                        cursor: bloqueado ? "not-allowed" : "pointer",
                                        accentColor: estaEntregado ? "#059669" : "#dc2626",
                                        width: "12px",
                                        height: "12px",
                                      }}
                                    />
                                    <span style={{ fontWeight: estaEntregado ? 600 : 500 }}>
                                      {ent.v_Entregable}
                                    </span>
                                  </label>
                                );
                              })}
                            </div>
                          )}
                        </td>

                        {/* Estatus */}
                        <td
                          style={{
                            padding: "6px 12px",
                            verticalAlign: "middle",
                            textAlign: "center",
                          }}
                        >
                          {f.estado === "guardando" && (
                            <span
                              title="Guardando..."
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "4px",
                                color: "#2563eb",
                                fontSize: "11px",
                              }}
                            >
                              <Loader2 size={14} className="animate-spin" />
                            </span>
                          )}
                          {f.estado === "guardado" && (
                            <span
                              title="Guardado con éxito"
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "3px",
                                color: "#059669",
                                fontSize: "11px",
                                fontWeight: 600,
                              }}
                            >
                              <CheckCircle2 size={15} />
                              <span>Listo</span>
                            </span>
                          )}
                          {f.estado === "error" && (
                            <span
                              title="Error al guardar"
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "3px",
                                color: "#dc2626",
                                fontSize: "11px",
                                fontWeight: 600,
                              }}
                            >
                              <AlertCircle size={15} />
                              <span>Error</span>
                            </span>
                          )}
                          {f.estado === "pendiente" && (
                            <span style={{ color: "#dc2626", fontSize: "11px", fontWeight: 500 }}>
                              Pendiente
                            </span>
                          )}
                        </td>
                      </tr>

                      {/* Mensaje de error para corregir */}
                      {tieneError && f.errorMensaje && (
                        <tr style={{ backgroundColor: "#fef2f2" }}>
                          <td
                            colSpan={9}
                            style={{
                              padding: "4px 12px 8px 12px",
                              borderTop: "none",
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "6px",
                                color: "#b91c1c",
                                fontSize: "11px",
                              }}
                            >
                              <AlertCircle size={13} style={{ flexShrink: 0 }} />
                              <span>
                                <strong>Error:</strong> {f.errorMensaje}
                              </span>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div
            style={{
              padding: "12px 20px",
              borderTop: "1px solid #f1f5f9",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              backgroundColor: "#f8fafc",
            }}
          >
            <div>
              {tieneErroresPendientes ? (
                <span
                  style={{
                    color: "#dc2626",
                    fontSize: "12px",
                    fontWeight: 500,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "5px",
                  }}
                >
                  <AlertCircle size={14} />
                  Corrige los errores señalados para volver a guardar las filas pendientes.
                </span>
              ) : (
                <span style={{ color: "#64748b", fontSize: "11px" }}>
                  Solo se enviarán las filas que tengan cambios.
                </span>
              )}
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <button
                type="button"
                className="btn btn-outline"
                onClick={handleCerrar}
                disabled={guardando}
                style={{ height: "32px", fontSize: "12px", padding: "0 14px" }}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={guardando}
                style={{
                  height: "32px",
                  fontSize: "12px",
                  padding: "0 16px",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  backgroundColor: "#2B8FCC",
                }}
              >
                {guardando && <Loader2 size={13} className="animate-spin" />}
                Guardar
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
