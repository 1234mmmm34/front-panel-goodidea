"use client";

import React, { useMemo, useState } from "react";
import { useToast } from "@/context/ToastContext";
import {
  formatearFechaVisible,
  formatearHoraLocal,
  obtenerEstadoSesion,
  obtenerMapaCola,
  obtenerValorAsistencia,
} from "@/lib/asistencia-utils";
import type {
  AsistenciaAlumno,
  AsistenciaRegistro,
  AsistenciaSesion,
  CursoAsistenciaDia,
} from "@/types/asistencia";

interface Props {
  curso: CursoAsistenciaDia;
  cola: AsistenciaRegistro[];
  ahora: Date;
  onMarcarAlumno: (
    i_CveAgendaDetalle: number,
    i_CveAlumnoAgenda: number,
    b_Asistio: boolean
  ) => void;
  onMarcarVarios: (
    i_CveAgendaDetalle: number,
    alumnosIds: number[],
    b_Asistio: boolean
  ) => void;
}

export const DetalleSesionView: React.FC<Props> = ({
  curso,
  cola,
  ahora,
  onMarcarAlumno,
  onMarcarVarios,
}) => {
  const { confirmModal } = useToast();
  const [sesionActivaId, setSesionActivaId] = useState<number>(
    curso.sesionEnPuerta.i_CveAgendaDetalle
  );
  const [busqueda, setBusqueda] = useState<string>("");

  const sesionActiva: AsistenciaSesion = useMemo(() => {
    return (
      curso.sesiones.find((s) => s.i_CveAgendaDetalle === sesionActivaId) ||
      curso.sesionEnPuerta
    );
  }, [curso, sesionActivaId]);

  const estado = obtenerEstadoSesion(sesionActiva, ahora);
  const habilitada = estado === "HABILITADA";
  const mapaCola = useMemo(() => obtenerMapaCola(cola), [cola]);

  const inscritos = useMemo(() => sesionActiva.inscritos ?? [], [sesionActiva]);

  const conteos = useMemo(() => {
    let presentes = 0;
    let faltas = 0;
    let pendientes = 0;
    for (const al of inscritos) {
      const val = obtenerValorAsistencia(
        al,
        sesionActiva.i_CveAgendaDetalle,
        mapaCola
      );
      if (val === true) presentes++;
      else if (val === false) faltas++;
      else pendientes++;
    }
    return { presentes, faltas, pendientes };
  }, [inscritos, sesionActiva.i_CveAgendaDetalle, mapaCola]);

  const inscritosFiltrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return inscritos;
    return inscritos.filter((al) => {
      const nombre = (al.v_Nombre || "").toLowerCase();
      const nomina = (al.v_Nomina || "").toLowerCase();
      const puesto = (al.v_Puesto || "").toLowerCase();
      return nombre.includes(q) || nomina.includes(q) || puesto.includes(q);
    });
  }, [inscritos, busqueda]);

  const handleToggleAlumno = (al: AsistenciaAlumno) => {
    if (!habilitada) return;
    const actual = obtenerValorAsistencia(
      al,
      sesionActiva.i_CveAgendaDetalle,
      mapaCola
    );
    // Desde Pendiente (null) pasa a Asistió (true); luego alterna Asistió <-> Falta
    const nuevoValor = actual === true ? false : true;
    onMarcarAlumno(
      sesionActiva.i_CveAgendaDetalle,
      al.i_CveAlumnoAgenda,
      nuevoValor
    );
  };

  const obtenerIdsPendientes = (): number[] => {
    const ids: number[] = [];
    for (const al of inscritos) {
      const val = obtenerValorAsistencia(
        al,
        sesionActiva.i_CveAgendaDetalle,
        mapaCola
      );
      if (val === null) {
        ids.push(al.i_CveAlumnoAgenda);
      }
    }
    return ids;
  };

  const handleMarcarTodos = () => {
    if (!habilitada) return;
    const pendientesIds = obtenerIdsPendientes();
    if (pendientesIds.length === 0) return;
    onMarcarVarios(sesionActiva.i_CveAgendaDetalle, pendientesIds, true);
  };

  const handleTerminarLista = () => {
    if (!habilitada) return;
    const pendientesIds = obtenerIdsPendientes();
    if (pendientesIds.length === 0) return;

    confirmModal({
      title: "Terminar lista",
      message: `Los ${pendientesIds.length} ${
        pendientesIds.length === 1
          ? "alumno pendiente quedará"
          : "alumnos pendientes quedarán"
      } como Falta.`,
      confirmText: "Confirmar faltas",
      cancelText: "Cancelar",
      variant: "warning",
      onConfirm: () => {
        onMarcarVarios(sesionActiva.i_CveAgendaDetalle, pendientesIds, false);
      },
    });
  };

  const instructores = [sesionActiva.v_Titular, sesionActiva.v_Apoyo]
    .filter(Boolean)
    .join(" · ");
  const ubicacion = [sesionActiva.v_Empresa, sesionActiva.v_Planta]
    .filter(Boolean)
    .join(" · ");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
      {/* Tabs si el curso tiene más de una sesión ese día */}
      {curso.sesiones.length > 1 && (
        <div
          style={{
            display: "flex",
            gap: "8px",
            overflowX: "auto",
            paddingBottom: "2px",
          }}
        >
          {curso.sesiones.map((s) => {
            const activa = s.i_CveAgendaDetalle === sesionActiva.i_CveAgendaDetalle;
            const est = obtenerEstadoSesion(s, ahora);
            return (
              <button
                key={s.i_CveAgendaDetalle}
                type="button"
                onClick={() => setSesionActivaId(s.i_CveAgendaDetalle)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "8px 14px",
                  borderRadius: "10px",
                  border: activa ? "1.5px solid #2B8FCC" : "1px solid #e2e8f0",
                  backgroundColor: activa ? "#eef6fd" : "#ffffff",
                  color: activa ? "#1d6fa3" : "#475569",
                  fontSize: "12px",
                  fontWeight: 600,
                  whiteSpace: "nowrap",
                  cursor: "pointer",
                }}
              >
                <span
                  style={{
                    width: "8px",
                    height: "8px",
                    borderRadius: "50%",
                    backgroundColor:
                      est === "HABILITADA"
                        ? "#10b981"
                        : est === "PROXIMA"
                        ? "#94a3b8"
                        : "#334155",
                  }}
                />
                Sesión {s.i_NumSesion} ·{" "}
                {formatearHoraLocal(s.d_FechaHoraInicio)}
              </button>
            );
          })}
        </div>
      )}

      {/* Encabezado de sesión */}
      <div
        style={{
          backgroundColor: "#ffffff",
          border: "1px solid #e2e8f0",
          borderRadius: "14px",
          padding: "16px",
          display: "flex",
          flexDirection: "column",
          gap: "8px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: "10px",
            flexWrap: "wrap",
          }}
        >
          <h2
            style={{
              margin: 0,
              fontSize: "17px",
              fontWeight: 700,
              color: "#0f172a",
              lineHeight: 1.3,
            }}
          >
            {sesionActiva.v_Servicio || "Capacitación"}
          </h2>

          <span
            style={{
              padding: "4px 10px",
              borderRadius: "999px",
              fontSize: "11px",
              fontWeight: 600,
              backgroundColor:
                estado === "HABILITADA"
                  ? "#2B8FCC"
                  : estado === "PROXIMA"
                  ? "#e2e8f0"
                  : "#334155",
              color: estado === "PROXIMA" ? "#475569" : "#ffffff",
            }}
          >
            Sesión {sesionActiva.i_NumSesion} de {sesionActiva.i_TotalSesiones}
          </span>
        </div>

        {ubicacion && (
          <div style={{ fontSize: "13px", color: "#475569", fontWeight: 500 }}>
            {ubicacion}
            {sesionActiva.v_Area ? ` · ${sesionActiva.v_Area}` : ""}
          </div>
        )}

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "12px",
            fontSize: "12px",
            color: "#64748b",
          }}
        >
          <span>
            <i className="bi bi-calendar-event" style={{ marginRight: "5px" }} />
            {formatearFechaVisible(sesionActiva.d_FechaHoraInicio)} ·{" "}
            {formatearHoraLocal(sesionActiva.d_FechaHoraInicio)} -{" "}
            {formatearHoraLocal(sesionActiva.d_FechaHoraFin)}
          </span>

          <span>
            <i className="bi bi-person-badge" style={{ marginRight: "5px" }} />
            {instructores || "Sin instructor asignado"}
          </span>
        </div>

        {/* Banner solo lectura */}
        {!habilitada && (
          <div
            style={{
              marginTop: "4px",
              padding: "10px 12px",
              borderRadius: "10px",
              backgroundColor: estado === "PROXIMA" ? "#f1f5f9" : "#f8fafc",
              border: "1px solid #cbd5e1",
              color: "#334155",
              fontSize: "13px",
              fontWeight: 500,
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <i
              className={`bi ${
                estado === "PROXIMA" ? "bi-clock" : "bi-lock-fill"
              }`}
            />
            {estado === "PROXIMA"
              ? `Solo lectura — Se habilita a las ${formatearHoraLocal(
                  sesionActiva.d_HabilitaDesde
                )}`
              : "Solo lectura — Esta sesión ya cerró"}
          </div>
        )}
      </div>

      {/* Contadores */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "8px",
        }}
      >
        <div
          style={{
            backgroundColor: "#ecfdf5",
            border: "1px solid #a7f3d0",
            borderRadius: "10px",
            padding: "10px",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: "18px", fontWeight: 700, color: "#047857" }}>
            {conteos.presentes}
          </div>
          <div style={{ fontSize: "11px", fontWeight: 600, color: "#065f46" }}>
            Presentes
          </div>
        </div>

        <div
          style={{
            backgroundColor: "#fef2f2",
            border: "1px solid #fecaca",
            borderRadius: "10px",
            padding: "10px",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: "18px", fontWeight: 700, color: "#b91c1c" }}>
            {conteos.faltas}
          </div>
          <div style={{ fontSize: "11px", fontWeight: 600, color: "#991b1b" }}>
            Faltas
          </div>
        </div>

        <div
          style={{
            backgroundColor: "#f8fafc",
            border: "1px solid #cbd5e1",
            borderRadius: "10px",
            padding: "10px",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: "18px", fontWeight: 700, color: "#475569" }}>
            {conteos.pendientes}
          </div>
          <div style={{ fontSize: "11px", fontWeight: 600, color: "#64748b" }}>
            Pendientes
          </div>
        </div>
      </div>

      {/* Buscador y acciones masivas */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "10px",
        }}
      >
        <div style={{ position: "relative" }}>
          <i
            className="bi bi-search"
            style={{
              position: "absolute",
              left: "14px",
              top: "50%",
              transform: "translateY(-50%)",
              color: "#94a3b8",
              fontSize: "14px",
            }}
          />
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por nómina, nombre o puesto..."
            style={{
              width: "100%",
              height: "42px",
              padding: "0 14px 0 38px",
              borderRadius: "10px",
              border: "1px solid #cbd5e1",
              backgroundColor: "#ffffff",
              fontSize: "14px",
            }}
          />
        </div>

        {habilitada && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "8px",
            }}
          >
            <button
              type="button"
              onClick={handleMarcarTodos}
              disabled={conteos.pendientes === 0}
              style={{
                height: "40px",
                borderRadius: "10px",
                border: "1px solid #10b981",
                backgroundColor:
                  conteos.pendientes === 0 ? "#f1f5f9" : "#ecfdf5",
                color: conteos.pendientes === 0 ? "#94a3b8" : "#047857",
                borderColor: conteos.pendientes === 0 ? "#e2e8f0" : "#10b981",
                fontSize: "13px",
                fontWeight: 600,
                cursor: conteos.pendientes === 0 ? "not-allowed" : "pointer",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
              }}
            >
              <i className="bi bi-check-all" />
              Marcar todos
            </button>

            <button
              type="button"
              onClick={handleTerminarLista}
              disabled={conteos.pendientes === 0}
              style={{
                height: "40px",
                borderRadius: "10px",
                border: "1px solid #dc3545",
                backgroundColor:
                  conteos.pendientes === 0 ? "#f1f5f9" : "#fef2f2",
                color: conteos.pendientes === 0 ? "#94a3b8" : "#b91c1c",
                borderColor: conteos.pendientes === 0 ? "#e2e8f0" : "#fca5a5",
                fontSize: "13px",
                fontWeight: 600,
                cursor: conteos.pendientes === 0 ? "not-allowed" : "pointer",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
              }}
            >
              <i className="bi bi-list-check" />
              Terminar lista
            </button>
          </div>
        )}
      </div>

      {/* Lista de inscritos */}
      {inscritosFiltrados.length === 0 ? (
        <div
          style={{
            backgroundColor: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: "12px",
            padding: "32px 16px",
            textAlign: "center",
            color: "#64748b",
            fontSize: "13px",
          }}
        >
          <i
            className="bi bi-people"
            style={{ fontSize: "28px", display: "block", marginBottom: "8px" }}
          />
          {inscritos.length === 0
            ? "No hay alumnos inscritos en esta sesión."
            : "No se encontraron alumnos con esa búsqueda."}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {inscritosFiltrados.map((al) => {
            const val = obtenerValorAsistencia(
              al,
              sesionActiva.i_CveAgendaDetalle,
              mapaCola
            );
            const enCola = mapaCola.has(
              `${al.i_CveAlumnoAgenda}-${sesionActiva.i_CveAgendaDetalle}`
            );

            const estadoUI =
              val === true
                ? {
                    label: "Asistió",
                    icon: "bi-check-circle-fill",
                    color: "#10b981",
                    bg: "#ecfdf5",
                    border: "#a7f3d0",
                  }
                : val === false
                ? {
                    label: "Falta",
                    icon: "bi-x-circle-fill",
                    color: "#dc3545",
                    bg: "#fef2f2",
                    border: "#fecaca",
                  }
                : {
                    label: "Pendiente",
                    icon: "bi-dash-circle",
                    color: "#64748b",
                    bg: "#ffffff",
                    border: "#e2e8f0",
                  };

            return (
              <button
                key={al.i_CveAlumnoAgenda}
                type="button"
                onClick={() => handleToggleAlumno(al)}
                disabled={!habilitada}
                style={{
                  width: "100%",
                  minHeight: "64px",
                  textAlign: "left",
                  backgroundColor: estadoUI.bg,
                  border: `1px solid ${estadoUI.border}`,
                  borderRadius: "12px",
                  padding: "12px 14px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "12px",
                  cursor: habilitada ? "pointer" : "default",
                }}
              >
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      flexWrap: "wrap",
                    }}
                  >
                    {al.v_Nomina && (
                      <span
                        className="font-mono"
                        style={{
                          fontSize: "12px",
                          fontWeight: 600,
                          color: "#2B8FCC",
                          backgroundColor: "#eef6fd",
                          padding: "1px 6px",
                          borderRadius: "6px",
                        }}
                      >
                        {al.v_Nomina}
                      </span>
                    )}
                    <span
                      style={{
                        fontSize: "14px",
                        fontWeight: 600,
                        color: "#0f172a",
                      }}
                    >
                      {al.v_Nombre || "Sin nombre"}
                    </span>
                    {enCola && (
                      <span
                        title="Pendiente de sincronizar"
                        style={{
                          fontSize: "10px",
                          fontWeight: 600,
                          color: "#b45309",
                          backgroundColor: "#fef3c7",
                          padding: "1px 6px",
                          borderRadius: "999px",
                        }}
                      >
                        Local
                      </span>
                    )}
                  </div>
                  {al.v_Puesto && (
                    <div
                      style={{
                        fontSize: "12px",
                        color: "#64748b",
                        marginTop: "2px",
                      }}
                    >
                      {al.v_Puesto}
                    </div>
                  )}
                </div>

                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "2px",
                    minWidth: "56px",
                    color: estadoUI.color,
                  }}
                >
                  <i
                    className={`bi ${estadoUI.icon}`}
                    style={{ fontSize: "24px", lineHeight: 1 }}
                  />
                  <span style={{ fontSize: "10px", fontWeight: 700 }}>
                    {estadoUI.label}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Nota informativa */}
      <div
        style={{
          fontSize: "11px",
          color: "#64748b",
          backgroundColor: "#f8fafc",
          border: "1px solid #e2e8f0",
          borderRadius: "10px",
          padding: "10px 12px",
          lineHeight: 1.4,
        }}
      >
        <i className="bi bi-info-circle" style={{ marginRight: "6px" }} />
        Cada cambio se guarda al instante en el dispositivo. En el historial del
        alumno, el curso queda como asistió únicamente cuando asiste a todas las
        sesiones.
      </div>
    </div>
  );
};
