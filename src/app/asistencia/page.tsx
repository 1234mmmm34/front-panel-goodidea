"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AsistenciaTopBar } from "@/components/asistencia/AsistenciaTopBar";
import { BannerRechazados } from "@/components/asistencia/BannerRechazados";
import { CursoAsistenciaCard } from "@/components/asistencia/CursoAsistenciaCard";
import { DetalleSesionView } from "@/components/asistencia/DetalleSesionView";
import {
  eliminarDeColaSincronizados,
  guardarEnCola,
  guardarUltimaDescarga,
  guardarVariosEnCola,
  obtenerCola,
  obtenerTodasSesiones,
  obtenerUltimaDescarga,
  reemplazarSesionesRango,
} from "@/lib/asistencia-db";
import { agruparCursosPorDia } from "@/lib/asistencia-utils";
import {
  AsistenciaService,
  fechaLocalSinZona,
  fechaLocalYYYYMMDD,
} from "@/services/asistencia.service";
import type {
  AsistenciaRegistro,
  AsistenciaResultado,
  AsistenciaSesion,
  CursoAsistenciaDia,
} from "@/types/asistencia";

function obtenerHoyYManana() {
  const dHoy = new Date();
  const dManana = new Date(dHoy);
  dManana.setDate(dManana.getDate() + 1);
  return {
    hoy: fechaLocalYYYYMMDD(dHoy),
    manana: fechaLocalYYYYMMDD(dManana),
  };
}

export default function AsistenciaPage() {
  const [online, setOnline] = useState<boolean>(() =>
    typeof navigator !== "undefined" ? navigator.onLine : true
  );
  const [sesiones, setSesiones] = useState<AsistenciaSesion[]>([]);
  const [cola, setCola] = useState<AsistenciaRegistro[]>([]);
  const [ultimaDescarga, setUltimaDescarga] = useState<string | null>(null);
  const [cargandoInicial, setCargandoInicial] = useState<boolean>(true);
  const [sincronizando, setSincronizando] = useState<boolean>(false);
  const [rechazados, setRechazados] = useState<AsistenciaResultado[]>([]);

  const [{ hoy, manana }] = useState(obtenerHoyYManana);
  const [diaSeleccionado, setDiaSeleccionado] = useState<string>(hoy);
  const [busqueda, setBusqueda] = useState<string>("");
  const [cursoSeleccionadoId, setCursoSeleccionadoId] = useState<number | null>(
    null
  );
  const [ahora, setAhora] = useState<Date>(() => new Date());

  const sincronizandoRef = useRef<boolean>(false);

  const cargarEstadoLocal = useCallback(async () => {
    const [ses, col, meta] = await Promise.all([
      obtenerTodasSesiones(),
      obtenerCola(),
      obtenerUltimaDescarga(),
    ]);
    setSesiones(ses);
    setCola(col);
    setUltimaDescarga(meta);
  }, []);

  /**
   * Sincroniza la cola completa con el servidor.
   * Tanto OK como RECHAZADO se quitan de la cola; los rechazados se muestran al usuario.
   */
  const sincronizarCola = useCallback(async (): Promise<boolean> => {
    if (typeof navigator !== "undefined" && !navigator.onLine) return false;
    if (sincronizandoRef.current) return false;

    const colaActual = await obtenerCola();
    if (colaActual.length === 0) return true;

    sincronizandoRef.current = true;
    setSincronizando(true);
    try {
      const resultados = await AsistenciaService.sincronizarRegistros(colaActual);
      await eliminarDeColaSincronizados(colaActual);

      const nuevosRechazados = resultados.filter(
        (r) => r.v_Estatus === "RECHAZADO"
      );
      if (nuevosRechazados.length > 0) {
        setRechazados((prev) => [...prev, ...nuevosRechazados]);
      }

      const colaRestante = await obtenerCola();
      setCola(colaRestante);
      return true;
    } catch {
      // Error de red: la cola se conserva, sin toast repetitivo
      return false;
    } finally {
      sincronizandoRef.current = false;
      setSincronizando(false);
    }
  }, []);

  /**
   * Descarga paquete de hoy y mañana y actualiza IndexedDB (sin borrar la cola).
   */
  const descargarPaquete = useCallback(async () => {
    if (typeof navigator !== "undefined" && !navigator.onLine) return;
    try {
      const { hoy: fHoy, manana: fManana } = obtenerHoyYManana();
      const nuevas = await AsistenciaService.obtenerPaquete(fHoy, fManana);
      await reemplazarSesionesRango(fHoy, fManana, nuevas);
      const fechaDesc = fechaLocalSinZona();
      await guardarUltimaDescarga(fechaDesc);
      await cargarEstadoLocal();
    } catch {
      // Error de red: se mantienen los datos locales
    }
  }, [cargarEstadoLocal]);

  /**
   * Flujo completo: primero sincronizar la cola, después descargar paquete.
   */
  const sincronizarYDescargar = useCallback(async () => {
    if (typeof navigator !== "undefined" && !navigator.onLine) return;
    await sincronizarCola();
    await descargarPaquete();
  }, [sincronizarCola, descargarPaquete]);

  // Carga inicial desde IndexedDB + sincronización/descarga si hay red
  useEffect(() => {
    let montado = true;
    (async () => {
      await cargarEstadoLocal();
      if (montado) setCargandoInicial(false);
      if (typeof navigator !== "undefined" && navigator.onLine) {
        await sincronizarYDescargar();
      }
    })();
    return () => {
      montado = false;
    };
  }, [cargarEstadoLocal, sincronizarYDescargar]);

  // Listeners online / offline
  useEffect(() => {
    const handleOnline = () => {
      setOnline(true);
      sincronizarYDescargar();
    };
    const handleOffline = () => {
      setOnline(false);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [sincronizarYDescargar]);

  // Auto-sincronización cada 60 s si hay conexión y cola no está vacía
  useEffect(() => {
    const interval = setInterval(() => {
      if (online && cola.length > 0) {
        sincronizarCola();
      }
    }, 60_000);
    return () => clearInterval(interval);
  }, [online, cola.length, sincronizarCola]);

  // Actualizar reloj local cada 30 s para transiciones de habilitación
  useEffect(() => {
    const timer = setInterval(() => setAhora(new Date()), 30_000);
    return () => clearInterval(timer);
  }, []);

  // Días disponibles en los datos descargados (Hoy / Mañana)
  const diasDisponibles = useMemo(() => {
    const setDias = new Set(
      sesiones.map((s) => (s.d_FechaHoraInicio || "").slice(0, 10))
    );
    const opciones: { iso: string; label: string }[] = [];
    if (setDias.has(hoy) || diaSeleccionado === hoy) {
      opciones.push({ iso: hoy, label: "Hoy" });
    }
    if (setDias.has(manana)) {
      opciones.push({ iso: manana, label: "Mañana" });
    }
    return opciones;
  }, [sesiones, hoy, manana, diaSeleccionado]);

  // Cards agrupadas por curso para el día seleccionado
  const cursosDelDia = useMemo(
    () => agruparCursosPorDia(sesiones, diaSeleccionado, cola, ahora),
    [sesiones, diaSeleccionado, cola, ahora]
  );

  // Filtro de búsqueda local (curso, empresa, planta, instructor)
  const cursosFiltrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return cursosDelDia;
    return cursosDelDia.filter((c) => {
      const texto = [
        c.v_Servicio,
        c.v_Empresa,
        c.v_Planta,
        c.v_Area,
        ...c.sesiones.flatMap((s) => [s.v_Titular, s.v_Apoyo]),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return texto.includes(q);
    });
  }, [cursosDelDia, busqueda]);

  const cursoActivo: CursoAsistenciaDia | null = useMemo(() => {
    if (cursoSeleccionadoId === null) return null;
    return (
      cursosDelDia.find((c) => c.i_CveServAgendaDet === cursoSeleccionadoId) ||
      null
    );
  }, [cursosDelDia, cursoSeleccionadoId]);

  const handleMarcarAlumno = async (
    i_CveAgendaDetalle: number,
    i_CveAlumnoAgenda: number,
    b_Asistio: boolean
  ) => {
    const registro: AsistenciaRegistro = {
      i_CveAlumnoAgenda,
      i_CveAgendaDetalle,
      b_Asistio,
      d_FechaCaptura: fechaLocalSinZona(),
    };
    await guardarEnCola(registro);
    const nuevaCola = await obtenerCola();
    setCola(nuevaCola);

    if (online) {
      sincronizarCola();
    }
  };

  const handleMarcarVarios = async (
    i_CveAgendaDetalle: number,
    alumnosIds: number[],
    b_Asistio: boolean
  ) => {
    if (alumnosIds.length === 0) return;
    const fecha = fechaLocalSinZona();
    const registros: AsistenciaRegistro[] = alumnosIds.map((id) => ({
      i_CveAlumnoAgenda: id,
      i_CveAgendaDetalle,
      b_Asistio,
      d_FechaCaptura: fecha,
    }));
    await guardarVariosEnCola(registros);
    const nuevaCola = await obtenerCola();
    setCola(nuevaCola);

    if (online) {
      sincronizarCola();
    }
  };

  return (
    <>
      <AsistenciaTopBar
        online={online}
        ultimaDescarga={ultimaDescarga}
        pendientesCount={cola.length}
        sincronizando={sincronizando}
        onSincronizar={sincronizarYDescargar}
      />

      <main
        style={{
          flex: 1,
          width: "100%",
          maxWidth: "1100px",
          margin: "0 auto",
          padding: "16px",
          display: "flex",
          flexDirection: "column",
          gap: "14px",
        }}
      >
        <BannerRechazados
          rechazados={rechazados}
          sesiones={sesiones}
          onCerrar={() => setRechazados([])}
        />

        {cursoActivo ? (
          <DetalleSesionView
            curso={cursoActivo}
            cola={cola}
            ahora={ahora}
            onVolver={() => setCursoSeleccionadoId(null)}
            onMarcarAlumno={handleMarcarAlumno}
            onMarcarVarios={handleMarcarVarios}
          />
        ) : (
          <>
            {/* Selector de día + Buscador */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "10px",
              }}
            >
              {diasDisponibles.length > 0 && (
                <div style={{ display: "flex", gap: "8px" }}>
                  {diasDisponibles.map((d) => {
                    const activo = d.iso === diaSeleccionado;
                    return (
                      <button
                        key={d.iso}
                        type="button"
                        onClick={() => setDiaSeleccionado(d.iso)}
                        style={{
                          padding: "8px 16px",
                          borderRadius: "999px",
                          border: activo
                            ? "1.5px solid #2B8FCC"
                            : "1px solid #cbd5e1",
                          backgroundColor: activo ? "#2B8FCC" : "#ffffff",
                          color: activo ? "#ffffff" : "#475569",
                          fontSize: "13px",
                          fontWeight: 600,
                          cursor: "pointer",
                        }}
                      >
                        {d.label}
                      </button>
                    );
                  })}
                </div>
              )}

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
                  placeholder="Buscar curso, empresa, planta o instructor..."
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
            </div>

            {/* Listado de cards (1 columna móvil, grid en pantallas grandes) */}
            {cargandoInicial ? (
              <div
                style={{
                  backgroundColor: "#ffffff",
                  border: "1px solid #e2e8f0",
                  borderRadius: "14px",
                  padding: "32px 16px",
                  textAlign: "center",
                  color: "#64748b",
                  fontSize: "13px",
                }}
              >
                Cargando capacitaciones...
              </div>
            ) : cursosFiltrados.length === 0 ? (
              <div
                style={{
                  backgroundColor: "#ffffff",
                  border: "1px solid #e2e8f0",
                  borderRadius: "14px",
                  padding: "40px 16px",
                  textAlign: "center",
                  color: "#64748b",
                  fontSize: "14px",
                }}
              >
                <i
                  className="bi bi-calendar-x"
                  style={{
                    fontSize: "32px",
                    display: "block",
                    marginBottom: "8px",
                    color: "#94a3b8",
                  }}
                />
                No hay capacitaciones para este día
              </div>
            ) : (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(auto-fill, minmax(min(100%, 340px), 1fr))",
                  gap: "12px",
                }}
              >
                {cursosFiltrados.map((curso) => (
                  <CursoAsistenciaCard
                    key={curso.i_CveServAgendaDet}
                    curso={curso}
                    onSelect={(c) =>
                      setCursoSeleccionadoId(c.i_CveServAgendaDet)
                    }
                  />
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </>
  );
}
