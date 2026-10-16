"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import {
  ChevronRight,
  Search,
  Plus,
  FileSpreadsheet,
  Trash2,
  Users,
  Edit2,
  RefreshCw,
  CheckCheck,
  Loader2,
} from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { ModalConfirmarEliminar } from "@/components/ui/ModalConfirmarEliminar";
import { ModalNuevoAlumno } from "@/components/personal/ModalNuevoAlumno";
import { ModalCargaMasivaPersonal } from "@/components/personal/ModalCargaMasivaPersonal";
import { ModalEvaluacionAlumno } from "@/components/personal/ModalEvaluacionAlumno";
import { ModalConfirmarMarcarEntregables } from "@/components/personal/ModalConfirmarMarcarEntregables";
import { DateRangePickerPopover } from "@/components/ui/DateRangePickerPopover";
import { PaginadorCustom } from "@/components/ui/PaginadorCustom";
import {
  AlumnoCatalogo,
  VistaPersonal,
  HistorialAlumno,
  EntregableAlumno,
  HistorialAlumnoPutDto,
} from "@/types/alumnosCatalogo";
import { AlumnosCatalogoService } from "@/services/alumnosCatalogo.service";
import { EmpresasService } from "@/services/empresas.service";
import { useToast } from "@/context/ToastContext";
import { formatearFechaTexto } from "@/lib/date-utils";

/**
 * Ejecuta tareas con límite de concurrencia máxima de 5
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

export default function CatalogosPersonalPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const idEmpresa = Number(params?.id) || 1;
  const razonSocialQuery = searchParams.get("razonSocial") || "";

  const [razonSocial, setRazonSocial] = useState<string>(razonSocialQuery);
  const [vista, setVista] = useState<VistaPersonal>("catalogo");
  const [alumnos, setAlumnos] = useState<AlumnoCatalogo[]>([]);
  const [historial, setHistorial] = useState<HistorialAlumno[]>([]);
  const [busqueda, setBusqueda] = useState<string>("");
  const [paginaActual, setPaginaActual] = useState<number>(1);
  const [tamanoPagina, setTamanoPagina] = useState<number>(10);
  const [totalRegistros, setTotalRegistros] = useState<number>(0);
  const [totalPaginas, setTotalPaginas] = useState<number>(1);
  const [cargando, setCargando] = useState<boolean>(true);

  // Modales catálogo
  const [modalNuevoAbierto, setModalNuevoAbierto] = useState<boolean>(false);
  const [alumnoEditar, setAlumnoEditar] = useState<AlumnoCatalogo | null>(null);
  const [modalCargaAbierto, setModalCargaAbierto] = useState<boolean>(false);
  const [alumnoEliminar, setAlumnoEliminar] = useState<AlumnoCatalogo | null>(null);
  const [eliminando, setEliminando] = useState<boolean>(false);

  // Modales y estados de historial
  const [seleccionados, setSeleccionados] = useState<Map<number, HistorialAlumno>>(new Map());
  const [modalEvaluacionAbierto, setModalEvaluacionAbierto] = useState<boolean>(false);
  const [alumnosModalEvaluacion, setAlumnosModalEvaluacion] = useState<HistorialAlumno[]>([]);
  const [guardandoEntregables, setGuardandoEntregables] = useState<Set<string>>(new Set());

  // Filtro de rango de fechas para historial
  const [fechaInicio, setFechaInicio] = useState<string>("");
  const [fechaFin, setFechaFin] = useState<string>("");

  // Modal y estado para marcar todos los entregables
  const [modalMarcarEntregablesAbierto, setModalMarcarEntregablesAbierto] = useState<boolean>(false);
  const [marcandoEntregables, setMarcandoEntregables] = useState<boolean>(false);

  // Cargar datos de la empresa
  useEffect(() => {
    if (!razonSocialQuery) {
      EmpresasService.getById(idEmpresa).then((emp) => {
        if (emp?.s_RazonSocial) {
          setRazonSocial(emp.s_RazonSocial);
        } else {
          setRazonSocial(`Empresa #${idEmpresa}`);
        }
      });
    } else {
      setRazonSocial(razonSocialQuery);
    }
  }, [idEmpresa, razonSocialQuery]);

  // Cargar lista de alumnos desde el servidor (Vista Catálogo)
  const cargarAlumnos = useCallback(async () => {
    setCargando(true);
    try {
      const res = await AlumnosCatalogoService.getAlumnosCatalogo(idEmpresa, {
        searchTerm: busqueda.trim() || undefined,
        pagina: paginaActual,
        tamano: tamanoPagina,
      });

      setAlumnos(res.datos || []);
      setTotalRegistros(res.total ?? 0);
      setTotalPaginas(res.totalPaginas > 0 ? res.totalPaginas : 1);
    } catch {
      toast.error("Ocurrió un error al cargar el catálogo de alumnos.");
      setAlumnos([]);
      setTotalRegistros(0);
      setTotalPaginas(1);
    } finally {
      setCargando(false);
    }
  }, [idEmpresa, busqueda, paginaActual, tamanoPagina, toast]);

  // Cargar lista de historial desde el servidor (Vista Historial)
  const cargarHistorial = useCallback(async () => {
    setCargando(true);
    try {
      const res = await AlumnosCatalogoService.getHistorialAlumnos(idEmpresa, {
        searchTerm: busqueda.trim() || undefined,
        pagina: paginaActual,
        tamano: tamanoPagina,
        fechaInicio: fechaInicio.trim() || undefined,
        fechaFin: fechaFin.trim() || undefined,
      });

      setHistorial(res.datos || []);
      setTotalRegistros(res.total ?? 0);
      setTotalPaginas(res.totalPaginas > 0 ? res.totalPaginas : 1);
    } catch (err: any) {
      const errorMsg =
        err?.response?.data?.error ||
        err?.response?.data?.mensaje ||
        err?.response?.data?.message ||
        "Ocurrió un error al cargar el historial de alumnos.";
      toast.error(errorMsg);
      setHistorial([]);
      setTotalRegistros(0);
      setTotalPaginas(1);
    } finally {
      setCargando(false);
    }
  }, [idEmpresa, busqueda, paginaActual, tamanoPagina, fechaInicio, fechaFin, toast]);

  useEffect(() => {
    if (vista === "catalogo") {
      cargarAlumnos();
    } else {
      cargarHistorial();
    }
  }, [vista, cargarAlumnos, cargarHistorial]);

  // Cambio de vista
  const handleCambioVista = (nuevaVista: VistaPersonal) => {
    setVista(nuevaVista);
    setBusqueda("");
    setPaginaActual(1);
    setSeleccionados(new Map());
    setFechaInicio("");
    setFechaFin("");
  };

  const handleCambiarRangoFechas = (inicio: string, fin: string) => {
    if (fin < inicio) {
      toast.error("La fecha final no puede ser menor que la fecha inicial.");
      return;
    }
    setFechaInicio(inicio);
    setFechaFin(fin);
    setPaginaActual(1);
    setSeleccionados(new Map());
  };

  const handleLimpiarRangoFechas = () => {
    setFechaInicio("");
    setFechaFin("");
    setPaginaActual(1);
    setSeleccionados(new Map());
  };

  const handleRecargar = () => {
    if (vista === "catalogo") {
      cargarAlumnos();
    } else {
      cargarHistorial();
    }
  };

  // Acciones Catálogo
  const handleAbrirNuevo = () => {
    setAlumnoEditar(null);
    setModalNuevoAbierto(true);
  };

  const handleAbrirEditar = (alumno: AlumnoCatalogo) => {
    setAlumnoEditar(alumno);
    setModalNuevoAbierto(true);
  };

  const handleConfirmarEliminar = async () => {
    if (!alumnoEliminar) return;
    setEliminando(true);

    try {
      const res = await AlumnosCatalogoService.deleteAlumnoCatalogo(alumnoEliminar.i_CveAlumno);
      if (res.exito) {
        toast.success(res.mensaje || "Alumno eliminado exitosamente");
        setAlumnoEliminar(null);

        // Si la página actual queda vacía y estamos en una página mayor a 1, retroceder
        if (alumnos.length === 1 && paginaActual > 1) {
          setPaginaActual((prev) => prev - 1);
        } else {
          cargarAlumnos();
        }
      } else {
        toast.error(res.error || "No se pudo eliminar el alumno.");
      }
    } catch {
      toast.error("Error inesperado al intentar eliminar el alumno.");
    } finally {
      setEliminando(false);
    }
  };

  // Acciones Historial: modal de edición
  const handleAbrirEvaluacionFila = (row: HistorialAlumno) => {
    setAlumnosModalEvaluacion([row]);
    setModalEvaluacionAbierto(true);
  };

  const handleAbrirEditarSeleccionados = () => {
    if (seleccionados.size === 0) return;
    setAlumnosModalEvaluacion(Array.from(seleccionados.values()));
    setModalEvaluacionAbierto(true);
  };

  // Botón "Marcar todos los entregables"
  const handleClicMarcarTodosEntregables = () => {
    if (seleccionados.size === 0) return;

    const filasSeleccionadas = Array.from(seleccionados.values());
    const filasConPendientes = filasSeleccionadas.filter((f) =>
      (f.entregables || []).some((ent) => ent.v_Estatus === "PENDIENTE")
    );

    if (filasConPendientes.length === 0) {
      toast.info("Los alumnos seleccionados ya tienen todos sus entregables.");
      return;
    }

    setModalMarcarEntregablesAbierto(true);
  };

  const handleConfirmarMarcarTodosEntregables = async () => {
    const filasSeleccionadas = Array.from(seleccionados.values());
    const filasConPendientes = filasSeleccionadas.filter((f) =>
      (f.entregables || []).some((ent) => ent.v_Estatus === "PENDIENTE")
    );

    if (filasConPendientes.length === 0) {
      setModalMarcarEntregablesAbierto(false);
      toast.info("Los alumnos seleccionados ya tienen todos sus entregables.");
      return;
    }

    setMarcandoEntregables(true);

    const fallidas: HistorialAlumno[] = [];
    const exitosas: HistorialAlumno[] = [];

    const tareas = filasConPendientes.map((f) => async () => {
      const dto: HistorialAlumnoPutDto = {
        b_Asistio: f.b_Asistio ?? null,
        v_EvTeorica: f.v_EvTeorica?.trim() || null,
        v_EvPractica: f.v_EvPractica?.trim() || null,
        v_EvFinal: (() => {
          const v = f.v_EvFinal?.trim().toUpperCase();
          if (v === "APROBADO") return "APROBADO";
          if (v === "NO APROBADO") return "NO APROBADO";
          return null;
        })(),
        Entregables: (f.entregables || []).map((ent) => ({
          i_CveAgendaEntregable: ent.i_CveAgendaEntregable,
          b_Entregado: true,
        })),
      };

      try {
        const res = await AlumnosCatalogoService.putHistorialAlumno(
          f.i_CveAlumnoAgenda,
          dto
        );
        if (res.exito) {
          exitosas.push(f);
        } else {
          fallidas.push(f);
        }
      } catch {
        fallidas.push(f);
      }
    });

    await ejecutarConcurrente(tareas, 5);

    setMarcandoEntregables(false);
    setModalMarcarEntregablesAbierto(false);

    if (fallidas.length === 0) {
      toast.success(`Entregables marcados para ${exitosas.length} alumnos`);
      setSeleccionados(new Map());
      cargarHistorial();
    } else {
      toast.error(
        `${fallidas.length} de ${filasConPendientes.length} no se pudieron actualizar.`
      );
      // Dejar seleccionadas solo las que fallaron para reintentar
      const nuevoMapa = new Map<number, HistorialAlumno>();
      fallidas.forEach((item) => nuevoMapa.set(item.i_CveAlumnoAgenda, item));
      setSeleccionados(nuevoMapa);
      cargarHistorial();
    }
  };

  // Marcar / desmarcar entregable de historial directamente en la tabla
  const handleToggleEntregable = async (row: HistorialAlumno, ent: EntregableAlumno) => {
    const clave = `${row.i_CveAlumnoAgenda}_${ent.i_CveAgendaEntregable}`;
    if (guardandoEntregables.has(clave)) return;

    const nuevoEstatus = ent.v_Estatus === "ENTREGADO" ? "PENDIENTE" : "ENTREGADO";
    const entregablesPrevios = row.entregables;
    const nuevosEntregables = (row.entregables || []).map((item) =>
      item.i_CveAgendaEntregable === ent.i_CveAgendaEntregable
        ? { ...item, v_Estatus: nuevoEstatus as "ENTREGADO" | "PENDIENTE" }
        : item
    );

    // Actualización optimista en memoria
    setHistorial((prev) =>
      prev.map((r) =>
        r.i_CveAlumnoAgenda === row.i_CveAlumnoAgenda
          ? { ...r, entregables: nuevosEntregables }
          : r
      )
    );

    // Si la fila está en seleccionados, sincronizarla también
    setSeleccionados((prev) => {
      if (!prev.has(row.i_CveAlumnoAgenda)) return prev;
      const next = new Map(prev);
      const item = next.get(row.i_CveAlumnoAgenda);
      if (item) {
        next.set(row.i_CveAlumnoAgenda, { ...item, entregables: nuevosEntregables });
      }
      return next;
    });

    // Deshabilitar casilla mientras guarda
    setGuardandoEntregables((prev) => {
      const next = new Set(prev);
      next.add(clave);
      return next;
    });

    const dto: HistorialAlumnoPutDto = {
      b_Asistio: row.b_Asistio ?? null,
      v_EvTeorica: row.v_EvTeorica?.trim() || null,
      v_EvPractica: row.v_EvPractica?.trim() || null,
      v_EvFinal: (() => {
        const v = row.v_EvFinal?.trim().toUpperCase();
        if (v === "APROBADO") return "APROBADO";
        if (v === "NO APROBADO") return "NO APROBADO";
        return null;
      })(),
      Entregables: nuevosEntregables.map((item) => ({
        i_CveAgendaEntregable: item.i_CveAgendaEntregable,
        b_Entregado: item.v_Estatus === "ENTREGADO",
      })),
    };

    try {
      const res = await AlumnosCatalogoService.putHistorialAlumno(
        row.i_CveAlumnoAgenda,
        dto
      );

      if (!res.exito) {
        // Revertir ante error devuelto por la API
        setHistorial((prev) =>
          prev.map((r) =>
            r.i_CveAlumnoAgenda === row.i_CveAlumnoAgenda
              ? { ...r, entregables: entregablesPrevios }
              : r
          )
        );
        setSeleccionados((prev) => {
          if (!prev.has(row.i_CveAlumnoAgenda)) return prev;
          const next = new Map(prev);
          const item = next.get(row.i_CveAlumnoAgenda);
          if (item) {
            next.set(row.i_CveAlumnoAgenda, { ...item, entregables: entregablesPrevios });
          }
          return next;
        });
        toast.error(res.error || "No se pudo actualizar el entregable.");
      }
    } catch (err: any) {
      // Revertir ante excepción
      setHistorial((prev) =>
        prev.map((r) =>
          r.i_CveAlumnoAgenda === row.i_CveAlumnoAgenda
            ? { ...r, entregables: entregablesPrevios }
            : r
        )
      );
      setSeleccionados((prev) => {
        if (!prev.has(row.i_CveAlumnoAgenda)) return prev;
        const next = new Map(prev);
        const item = next.get(row.i_CveAlumnoAgenda);
        if (item) {
          next.set(row.i_CveAlumnoAgenda, { ...item, entregables: entregablesPrevios });
        }
        return next;
      });
      const errorMsg =
        err?.response?.data?.error ||
        err?.message ||
        "Error inesperado al guardar el entregable.";
      toast.error(errorMsg);
    } finally {
      setGuardandoEntregables((prev) => {
        const next = new Set(prev);
        next.delete(clave);
        return next;
      });
    }
  };

  // Cálculo de selección de la página actual
  const paginaIds = historial.map((r) => r.i_CveAlumnoAgenda);
  const seleccionadosEnPagina = paginaIds.filter((id) => seleccionados.has(id));
  const todosEnPagina = paginaIds.length > 0 && seleccionadosEnPagina.length === paginaIds.length;
  const algunoEnPagina = seleccionadosEnPagina.length > 0 && !todosEnPagina;

  return (
    <AppLayout>
      {/* Breadcrumb */}
      <div style={{ fontSize: "12px", color: "#7a96b0", display: "flex", alignItems: "center", gap: "6px", marginBottom: "14px" }}>
        <Link href="/programacion" style={{ color: "#7a96b0", textDecoration: "none" }} className="hover:text-slate-900 transition-colors">
          Catálogos
        </Link>
        <ChevronRight size={13} style={{ color: "#b5cfe8" }} />
        <Link href="/empresas" style={{ color: "#7a96b0", textDecoration: "none" }} className="hover:text-slate-900 transition-colors">
          Empresas
        </Link>
        <ChevronRight size={13} style={{ color: "#b5cfe8" }} />
        <span style={{ color: "#475569", fontWeight: 500 }}>{razonSocial || `Empresa #${idEmpresa}`}</span>
        <ChevronRight size={13} style={{ color: "#b5cfe8" }} />
        <span style={{ color: "#1e293b", fontWeight: 500 }}>Personal</span>
      </div>

      {/* Encabezado */}
      <div className="page-header mb-4">
        <div>
          <h1 className="page-title">
            Catálogo de personal
          </h1>
          <p className="subtext">
            {vista === "historial"
              ? `Historial de cursos tomados por el personal de ${razonSocial || `Empresa #${idEmpresa}`}.`
              : `Personal de ${razonSocial || `Empresa #${idEmpresa}`} registrado para cursos y capacitaciones.`}
          </p>
        </div>

        <button
          className="btn btn-outline"
          onClick={handleRecargar}
          disabled={cargando}
          title="Recargar listado"
          style={{ height: "32px", fontSize: "13px", display: "inline-flex", alignItems: "center", gap: "6px" }}
        >
          <RefreshCw size={14} className={cargando ? "animate-spin" : ""} />
          <span>Recargar</span>
        </button>
      </div>

      {/* Barra superior (Barra de Filtros y Botones) */}
      <div className="card mb-4 p-4 filter-card" style={{ position: "relative", zIndex: 40, overflow: "visible" }}>
        <div style={{ display: "flex", flexDirection: "row", alignItems: "flex-end", gap: "16px", flexWrap: "wrap", justifyContent: "space-between", overflow: "visible" }}>
          
          {/* Lado izquierdo: Select de vista y Rango de fechas */}
          <div style={{ display: "flex", flexDirection: "row", alignItems: "flex-end", gap: "16px", flexWrap: "wrap", overflow: "visible" }}>
            {/* Select de vista */}
            <div style={{ display: "flex", flexDirection: "column", gap: "4px", width: "210px", minWidth: "170px" }}>
              <label className="form-label" style={{ marginBottom: 0 }}>Vista</label>
              <select
                className="form-control text-xs py-1.5"
                style={{
                  width: "100%",
                  borderRadius: "20px",
                  height: "32px",
                  paddingLeft: "12px",
                  paddingRight: "28px",
                  cursor: "pointer",
                  backgroundColor: "#fff",
                }}
                value={vista}
                onChange={(e) => handleCambioVista(e.target.value as VistaPersonal)}
              >
                <option value="catalogo">Catálogo de alumnos</option>
                <option value="historial">Historial de alumnos</option>
              </select>
            </div>

            {/* Rango de fechas (sólo en vista Historial de alumnos) */}
            {vista === "historial" && (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "4px",
                  minWidth: "220px",
                  position: "relative",
                  zIndex: 50,
                }}
              >
                <label className="form-label" style={{ marginBottom: 0 }}>
                  Rango de fechas
                </label>
                <DateRangePickerPopover
                  fechaInicio={fechaInicio}
                  fechaFin={fechaFin}
                  placeholder="Todas las fechas"
                  onLimpiar={handleLimpiarRangoFechas}
                  onChangeRange={handleCambiarRangoFechas}
                />
              </div>
            )}
          </div>

          {/* Lado derecho: Buscador + Botones / Selección */}
          <div style={{ display: "flex", flexDirection: "row", alignItems: "flex-end", gap: "10px", marginLeft: "auto", flexWrap: "wrap" }}>
            {/* Buscador */}
            <div style={{ display: "flex", flexDirection: "column", gap: "4px", width: "240px", minWidth: "160px" }}>
              <label className="form-label" style={{ marginBottom: 0 }}>Buscar</label>
              <div style={{ position: "relative", width: "100%" }}>
                <Search size={14} style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8", pointerEvents: "none" }} />
                <input
                  type="text"
                  className="form-control text-xs py-1.5"
                  style={{ width: "100%", paddingLeft: "28px", borderRadius: "20px", height: "32px" }}
                  placeholder={vista === "historial" ? "Buscar en historial..." : "Buscar alumno..."}
                  value={busqueda}
                  onChange={(e) => {
                    setBusqueda(e.target.value);
                    setPaginaActual(1);
                    if (vista === "historial") {
                      setSeleccionados(new Map());
                    }
                  }}
                />
              </div>
            </div>

            {/* Acciones de Selección Múltiple (sólo en vista Historial cuando hay seleccionados) */}
            {vista === "historial" && seleccionados.size > 0 && (
              <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                {/* 1. Botón Editar seleccionados (N) */}
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleAbrirEditarSeleccionados}
                  disabled={marcandoEntregables}
                  style={{
                    height: "32px",
                    fontSize: "13px",
                    padding: "0 14px",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    backgroundColor: "#2B8FCC",
                  }}
                >
                  <Edit2 size={14} />
                  <span>Editar seleccionados ({seleccionados.size})</span>
                </button>

                {/* 2. Botón Marcar todos los entregables */}
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={handleClicMarcarTodosEntregables}
                  disabled={marcandoEntregables}
                  title="Marcar como entregados todos los entregables de los alumnos seleccionados"
                  style={{
                    height: "32px",
                    fontSize: "13px",
                    padding: "0 14px",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    borderColor: "#2B8FCC",
                    color: "#2B8FCC",
                    backgroundColor: "#ffffff",
                  }}
                >
                  {marcandoEntregables ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <CheckCheck size={15} />
                  )}
                  <span>Marcar todos los entregables</span>
                </button>

                {/* 3. Enlace Quitar selección */}
                <button
                  type="button"
                  onClick={() => setSeleccionados(new Map())}
                  disabled={marcandoEntregables}
                  style={{
                    background: "none",
                    border: "none",
                    padding: "4px 8px",
                    fontSize: "12px",
                    color: "#2563eb",
                    textDecoration: "underline",
                    cursor: "pointer",
                  }}
                  className="hover:text-blue-800"
                >
                  Quitar selección
                </button>
              </div>
            )}

            {/* Botones sólo visibles en la vista Catálogo */}
            {vista === "catalogo" && (
              <>
                {/* Botón Carga Masiva (Secundario) */}
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setModalCargaAbierto(true)}
                  style={{ height: "32px", fontSize: "13px", padding: "0 14px", display: "inline-flex", alignItems: "center", gap: "6px" }}
                  title="Carga masiva de alumnos desde Excel"
                >
                  <FileSpreadsheet size={16} />
                  <span>Carga masiva</span>
                </button>

                {/* Botón Nuevo Alumno (Primario) */}
                <button
                  type="button"
                  className="btn btn-primary filter-action-btn"
                  onClick={handleAbrirNuevo}
                  title="Nuevo alumno"
                  style={{ height: "32px", fontSize: "13px", display: "inline-flex", alignItems: "center", gap: "6px" }}
                >
                  <Plus size={16} />
                  <span className="filter-btn-text">Nuevo alumno</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Contenedor de Tabla con Scroll Horizontal si se desborda */}
      <div className="alegra-table-container border border-slate-200/80 shadow-sm rounded-xl overflow-hidden mb-4">
        {vista === "catalogo" ? (
          /* Vista Catálogo de Alumnos */
          <div style={{ overflowX: "auto", width: "100%" }}>
            <table className="alegra-table alegra-table-compact">
              <thead>
                <tr>
                  <th style={{ width: "14%", padding: "8px 12px" }}>Nómina</th>
                  <th style={{ width: "30%", padding: "8px 12px" }}>Nombre</th>
                  <th style={{ width: "22%", padding: "8px 12px" }}>CURP</th>
                  <th style={{ width: "22%", padding: "8px 12px" }}>Puesto</th>
                  <th className="text-center" style={{ width: "12%", minWidth: "90px", padding: "8px 12px" }}>Estatus</th>
                  <th className="text-center" style={{ width: "90px", minWidth: "90px", padding: "8px 12px", whiteSpace: "nowrap" }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {cargando ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: "center", padding: "48px 16px" }}>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "8px", color: "#64748b" }}>
                        <div className="spinner-border text-primary" style={{ width: "24px", height: "24px" }}></div>
                        <span style={{ fontSize: "13px" }}>Cargando catálogo de alumnos...</span>
                      </div>
                    </td>
                  </tr>
                ) : alumnos.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: "center", padding: "48px 16px" }}>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "6px" }}>
                        <div
                          style={{
                            width: "44px",
                            height: "44px",
                            borderRadius: "50%",
                            backgroundColor: "#f1f5f9",
                            border: "1px solid #e2e8f0",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "#94a3b8",
                            marginBottom: "4px",
                          }}
                        >
                          <Users size={22} />
                        </div>
                        <p style={{ fontSize: "14px", fontWeight: 600, color: "#334155", margin: 0 }}>
                          No se encontraron alumnos
                        </p>
                        <p style={{ fontSize: "12px", color: "#64748b", margin: 0 }}>
                          Intenta ajustando el filtro de búsqueda o registra a un nuevo alumno.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  alumnos.map((row) => (
                    <tr key={row.i_CveAlumno} className="hover:bg-slate-50/60 transition-colors">
                      <td style={{ fontWeight: 500, color: "#334155", padding: "6px 12px", verticalAlign: "middle" }}>{row.v_Nomina}</td>
                      <td style={{ padding: "6px 12px", verticalAlign: "middle" }}>
                        <button
                          type="button"
                          onClick={() => handleAbrirEditar(row)}
                          style={{
                            background: "none",
                            border: "none",
                            padding: 0,
                            textAlign: "left",
                            cursor: "pointer",
                            color: "#2B8FCC",
                            fontWeight: 600,
                            display: "inline",
                            lineHeight: "1.25",
                          }}
                          className="uppercase text-sm hover:underline"
                          title="Editar datos del alumno"
                        >
                          {row.v_Nombre}
                        </button>
                      </td>
                      <td style={{ padding: "6px 12px", verticalAlign: "middle" }}>
                        <span className="font-mono text-xs text-secondary">
                          {row.v_CURP && row.v_CURP.trim() ? row.v_CURP : "—"}
                        </span>
                      </td>
                      <td style={{ color: "#334155", padding: "6px 12px", verticalAlign: "middle" }}>{row.v_Puesto}</td>
                      <td className="text-center" style={{ padding: "6px 12px", verticalAlign: "middle", whiteSpace: "nowrap" }}>
                        {row.b_Vigente ? (
                          <span
                            className="badge-soft-green"
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              padding: "2px 8px",
                              borderRadius: "12px",
                              fontSize: "11px",
                              fontWeight: 600,
                              backgroundColor: "#ecfdf5",
                              color: "#065f46",
                              border: "1px solid #a7f3d0",
                            }}
                          >
                            Activo
                          </span>
                        ) : (
                          <span
                            className="badge-soft-gray"
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              padding: "2px 8px",
                              borderRadius: "12px",
                              fontSize: "11px",
                              fontWeight: 600,
                              backgroundColor: "#f1f5f9",
                              color: "#475569",
                              border: "1px solid #cbd5e1",
                            }}
                          >
                            Inactivo
                          </span>
                        )}
                      </td>
                      <td className="text-center" style={{ width: "90px", minWidth: "90px", padding: "6px 12px", verticalAlign: "middle", whiteSpace: "nowrap" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", flexWrap: "nowrap" }}>
                          <button
                            type="button"
                            className="btn-icon"
                            onClick={() => handleAbrirEditar(row)}
                            title="Editar alumno"
                            style={{ color: "#2B8FCC", padding: "4px", width: "28px", height: "28px" }}
                          >
                            <Edit2 size={15} />
                          </button>
                          <button
                            type="button"
                            className="btn-icon danger"
                            onClick={() => setAlumnoEliminar(row)}
                            title="Eliminar alumno"
                            style={{ padding: "4px", width: "28px", height: "28px" }}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        ) : (
          /* Vista Historial de Alumnos */
          <div style={{ overflowX: "auto", width: "100%" }}>
            <table className="alegra-table alegra-table-compact" style={{ minWidth: "1400px" }}>
              <thead>
                <tr>
                  {/* Casilla de selección múltiple (todos los de la página actual) */}
                  <th style={{ width: "42px", minWidth: "42px", padding: "6px 12px", textAlign: "center" }}>
                    <input
                      type="checkbox"
                      checked={todosEnPagina}
                      ref={(el) => {
                        if (el) el.indeterminate = algunoEnPagina;
                      }}
                      onChange={() => {
                        setSeleccionados((prev) => {
                          const next = new Map(prev);
                          if (todosEnPagina) {
                            // Quitar todos los de la página actual
                            paginaIds.forEach((id) => next.delete(id));
                          } else {
                            // Seleccionar todos los de la página actual
                            historial.forEach((r) => next.set(r.i_CveAlumnoAgenda, r));
                          }
                          return next;
                        });
                      }}
                      style={{ cursor: "pointer", width: "14px", height: "14px" }}
                      title={todosEnPagina ? "Deseleccionar página" : "Seleccionar página"}
                    />
                  </th>
                  <th style={{ padding: "6px 12px", whiteSpace: "nowrap", fontSize: "12px" }}>Fecha inicio</th>
                  <th style={{ padding: "6px 12px", whiteSpace: "nowrap", textAlign: "center", fontSize: "12px" }}>Horas</th>
                  <th style={{ padding: "6px 12px", minWidth: "190px", fontSize: "12px" }}>Curso</th>
                  <th style={{ padding: "6px 12px", whiteSpace: "nowrap", fontSize: "12px" }}>Nómina</th>
                  <th style={{ padding: "6px 12px", minWidth: "150px", fontSize: "12px" }}>Puesto</th>
                  <th style={{ padding: "6px 12px", minWidth: "200px", fontSize: "12px" }}>Nombre</th>
                  <th style={{ padding: "6px 12px", whiteSpace: "nowrap", textAlign: "center", fontSize: "12px" }}>Asistió</th>
                  <th style={{ padding: "6px 12px", whiteSpace: "nowrap", textAlign: "center", fontSize: "12px" }}>EV teórica</th>
                  <th style={{ padding: "6px 12px", whiteSpace: "nowrap", textAlign: "center", fontSize: "12px" }}>EV práctica</th>
                  <th style={{ padding: "6px 12px", whiteSpace: "nowrap", textAlign: "center", fontSize: "12px", minWidth: "105px" }}>EV final</th>
                  <th style={{ padding: "6px 12px", minWidth: "220px", fontSize: "12px" }}>Entregables</th>
                  <th style={{ padding: "6px 12px", minWidth: "150px", fontSize: "12px" }}>Solicitado por</th>
                  <th style={{ padding: "6px 12px", whiteSpace: "nowrap", fontSize: "12px" }}>Orden de compra</th>
                  <th className="text-center" style={{ width: "70px", minWidth: "70px", padding: "6px 12px", whiteSpace: "nowrap", fontSize: "12px" }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {cargando ? (
                  <tr>
                    <td colSpan={15} style={{ textAlign: "center", padding: "48px 16px" }}>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "8px", color: "#64748b" }}>
                        <div className="spinner-border text-primary" style={{ width: "24px", height: "24px" }}></div>
                        <span style={{ fontSize: "13px" }}>Cargando historial de alumnos...</span>
                      </div>
                    </td>
                  </tr>
                ) : historial.length === 0 ? (
                  <tr>
                    <td colSpan={15} style={{ textAlign: "center", padding: "48px 16px" }}>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "6px" }}>
                        <div
                          style={{
                            width: "44px",
                            height: "44px",
                            borderRadius: "50%",
                            backgroundColor: "#f1f5f9",
                            border: "1px solid #e2e8f0",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "#94a3b8",
                            marginBottom: "4px",
                          }}
                        >
                          <Users size={22} />
                        </div>
                        <p style={{ fontSize: "14px", fontWeight: 600, color: "#334155", margin: 0 }}>
                          No se encontraron registros en el historial
                        </p>
                        <p style={{ fontSize: "12px", color: "#64748b", margin: 0 }}>
                          Intenta ajustando el filtro de búsqueda.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  historial.map((row) => {
                    const estaSeleccionada = seleccionados.has(row.i_CveAlumnoAgenda);

                    return (
                      <tr
                        key={row.i_CveAlumnoAgenda}
                        style={{
                          backgroundColor: estaSeleccionada ? "#eff6ff" : undefined,
                          transition: "background-color 0.15s",
                        }}
                        className={estaSeleccionada ? "bg-blue-50/70" : "hover:bg-slate-50/60 transition-colors"}
                      >
                        {/* Casilla de selección individual */}
                        <td
                          style={{
                            width: "42px",
                            minWidth: "42px",
                            padding: "6px 12px",
                            textAlign: "center",
                            verticalAlign: "middle",
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={estaSeleccionada}
                            onChange={() => {
                              setSeleccionados((prev) => {
                                const next = new Map(prev);
                                if (next.has(row.i_CveAlumnoAgenda)) {
                                  next.delete(row.i_CveAlumnoAgenda);
                                } else {
                                  next.set(row.i_CveAlumnoAgenda, row);
                                }
                                return next;
                              });
                            }}
                            style={{ cursor: "pointer", width: "14px", height: "14px" }}
                          />
                        </td>

                        {/* Fecha inicio: 07/oct/2026 */}
                        <td style={{ padding: "6px 12px", verticalAlign: "middle", whiteSpace: "nowrap", color: "#334155", fontSize: "12px" }}>
                          {row.d_FechaInicio ? formatearFechaTexto(row.d_FechaInicio) : "—"}
                        </td>

                        {/* Horas: entero si no tiene decimales */}
                        <td style={{ padding: "6px 12px", verticalAlign: "middle", textAlign: "center", color: "#334155", fontSize: "12px" }}>
                          {row.d_Horas != null
                            ? Number(row.d_Horas) % 1 === 0
                              ? Math.trunc(Number(row.d_Horas))
                              : row.d_Horas
                            : "—"}
                        </td>

                        {/* Curso */}
                        <td style={{ padding: "6px 12px", verticalAlign: "middle", fontWeight: 600, color: "#1e293b", fontSize: "12px" }}>
                          {row.v_Curso || "—"}
                        </td>

                        {/* Nómina */}
                        <td style={{ padding: "6px 12px", verticalAlign: "middle", fontWeight: 500, color: "#334155", fontSize: "12px" }}>
                          {row.v_Nomina || "—"}
                        </td>

                        {/* Puesto */}
                        <td style={{ padding: "6px 12px", verticalAlign: "middle", color: "#475569", fontSize: "12px" }}>
                          {row.v_Puesto || "—"}
                        </td>

                        {/* Nombre (no enlace) */}
                        <td style={{ padding: "6px 12px", verticalAlign: "middle", color: "#1e293b", fontWeight: 600, fontSize: "12px" }}>
                          {row.v_Nombre || "—"}
                        </td>

                        {/* Asistió: badge Sí (verde) · No (rojo) · Pendiente (rojo) si es null */}
                        <td style={{ padding: "6px 12px", verticalAlign: "middle", textAlign: "center", whiteSpace: "nowrap" }}>
                          {row.b_Asistio === true ? (
                            <span
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                padding: "2px 7px",
                                borderRadius: "12px",
                                fontSize: "11px",
                                fontWeight: 600,
                                backgroundColor: "#ecfdf5",
                                color: "#065f46",
                                border: "1px solid #a7f3d0",
                              }}
                            >
                              Sí
                            </span>
                          ) : row.b_Asistio === false ? (
                            <span
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                padding: "2px 7px",
                                borderRadius: "12px",
                                fontSize: "11px",
                                fontWeight: 600,
                                backgroundColor: "#fef2f2",
                                color: "#991b1b",
                                border: "1px solid #fecaca",
                              }}
                            >
                              No
                            </span>
                          ) : (
                            <span style={{ color: "#dc2626", fontSize: "12px", fontWeight: 500 }}>
                              Pendiente
                            </span>
                          )}
                        </td>

                        {/* EV teórica */}
                        <td style={{ padding: "6px 12px", verticalAlign: "middle", textAlign: "center", color: "#334155", fontSize: "12px" }}>
                          {row.v_EvTeorica && row.v_EvTeorica.trim() ? (
                            row.v_EvTeorica
                          ) : (
                            <span style={{ color: "#dc2626", fontSize: "12px", fontWeight: 500 }}>
                              Pendiente
                            </span>
                          )}
                        </td>

                        {/* EV práctica */}
                        <td style={{ padding: "6px 12px", verticalAlign: "middle", textAlign: "center", color: "#334155", fontSize: "12px" }}>
                          {row.v_EvPractica && row.v_EvPractica.trim() ? (
                            row.v_EvPractica
                          ) : (
                            <span style={{ color: "#dc2626", fontSize: "12px", fontWeight: 500 }}>
                              Pendiente
                            </span>
                          )}
                        </td>

                        {/* EV final */}
                        <td style={{ padding: "6px 12px", verticalAlign: "middle", textAlign: "center", fontSize: "12px", whiteSpace: "nowrap" }}>
                          {(() => {
                            const valor = row.v_EvFinal?.trim().toUpperCase();
                            if (valor === "APROBADO") {
                              return (
                                <span
                                  style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    padding: "2px 8px",
                                    borderRadius: "12px",
                                    fontSize: "11px",
                                    fontWeight: 600,
                                    backgroundColor: "#ecfdf5",
                                    color: "#065f46",
                                    border: "1px solid #a7f3d0",
                                  }}
                                >
                                  Aprobado
                                </span>
                              );
                            }
                            if (valor === "NO APROBADO") {
                              return (
                                <span
                                  style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    padding: "2px 8px",
                                    borderRadius: "12px",
                                    fontSize: "11px",
                                    fontWeight: 600,
                                    backgroundColor: "#fef2f2",
                                    color: "#991b1b",
                                    border: "1px solid #fecaca",
                                  }}
                                >
                                  No aprobado
                                </span>
                              );
                            }
                            return <span style={{ color: "#94a3b8" }}>—</span>;
                          })()}
                        </td>

                        {/* Entregables */}
                        <td style={{ padding: "6px 12px", verticalAlign: "middle" }}>
                          {(!row.entregables || row.entregables.length === 0) ? (
                            <span style={{ color: "#94a3b8", fontSize: "11px", fontStyle: "italic" }}>Sin entregables</span>
                          ) : (
                            <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", alignItems: "center" }}>
                              {row.entregables.map((ent) => {
                                const clave = `${row.i_CveAlumnoAgenda}_${ent.i_CveAgendaEntregable}`;
                                const guardandoEstaCasilla = guardandoEntregables.has(clave);
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
                                      cursor: guardandoEstaCasilla ? "not-allowed" : "pointer",
                                      backgroundColor: estaEntregado ? "#ecfdf5" : "#fef2f2",
                                      border: estaEntregado ? "1px solid #a7f3d0" : "1px solid #fecaca",
                                      borderRadius: "5px",
                                      padding: "1px 6px",
                                      userSelect: "none",
                                      opacity: guardandoEstaCasilla ? 0.6 : 1,
                                      transition: "all 0.15s ease",
                                    }}
                                    title={`${ent.v_Entregable}: ${ent.v_Estatus}`}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={estaEntregado}
                                      disabled={guardandoEstaCasilla}
                                      onChange={() => handleToggleEntregable(row, ent)}
                                      style={{
                                        cursor: guardandoEstaCasilla ? "not-allowed" : "pointer",
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

                        {/* Solicitado por */}
                        <td style={{ padding: "6px 12px", verticalAlign: "middle", color: "#475569", fontSize: "12px" }}>
                          {row.v_SolicitadoPor || "—"}
                        </td>

                        {/* Orden de compra */}
                        <td style={{ padding: "6px 12px", verticalAlign: "middle", color: "#475569", fontSize: "12px" }}>
                          {row.v_OrdenCompra || "—"}
                        </td>

                        {/* Acciones (Lápiz para editar evaluación solo de esta fila) */}
                        <td className="text-center" style={{ width: "70px", minWidth: "70px", padding: "6px 12px", verticalAlign: "middle", whiteSpace: "nowrap" }}>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <button
                              type="button"
                              className="btn-icon"
                              onClick={() => handleAbrirEvaluacionFila(row)}
                              title="Editar evaluaciones de esta fila"
                              style={{ color: "#2B8FCC", padding: "4px", width: "26px", height: "26px" }}
                            >
                              <Edit2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Paginador custom al pie de la tabla */}
        <PaginadorCustom
          paginaActual={paginaActual}
          totalPaginas={totalPaginas}
          totalRegistros={totalRegistros}
          tamano={tamanoPagina}
          onCambioPagina={(pag) => setPaginaActual(pag)}
          onCambioTamano={(tam) => {
            setTamanoPagina(tam);
            setPaginaActual(1);
          }}
        />
      </div>

      {/* Modal Nuevo / Editar Alumno (Catálogo) */}
      <ModalNuevoAlumno
        abierto={modalNuevoAbierto}
        idEmpresa={idEmpresa}
        alumnoEditar={alumnoEditar}
        onCerrar={() => {
          setModalNuevoAbierto(false);
          setAlumnoEditar(null);
        }}
        onGuardadoExitoso={cargarAlumnos}
      />

      {/* Modal Carga Masiva (Catálogo) */}
      <ModalCargaMasivaPersonal
        abierto={modalCargaAbierto}
        idEmpresa={idEmpresa}
        onCerrar={() => setModalCargaAbierto(false)}
        onGuardadoExitoso={cargarAlumnos}
      />

      {/* Modal Confirmar Eliminar (Catálogo) */}
      <ModalConfirmarEliminar
        abierto={!!alumnoEliminar}
        nombreElemento={alumnoEliminar?.v_Nombre || "este alumno"}
        mensajePersonalizado={
          alumnoEliminar
            ? `¿Deseas eliminar a ${alumnoEliminar.v_Nombre}? Si lo haces, se removerá del catálogo de personal de esta empresa.`
            : undefined
        }
        onCerrar={() => setAlumnoEliminar(null)}
        onConfirmar={handleConfirmarEliminar}
        cargando={eliminando}
      />

      {/* Modal Editar Evaluaciones (Historial - uno o varios alumnos) */}
      <ModalEvaluacionAlumno
        abierto={modalEvaluacionAbierto}
        alumnos={alumnosModalEvaluacion}
        onCerrar={(huboGuardadoParcial) => {
          setModalEvaluacionAbierto(false);
          setAlumnosModalEvaluacion([]);
          if (huboGuardadoParcial) {
            cargarHistorial();
          }
        }}
        onGuardadoExitoso={() => {
          setModalEvaluacionAbierto(false);
          setAlumnosModalEvaluacion([]);
          setSeleccionados(new Map());
          cargarHistorial();
        }}
      />

      {/* Modal Confirmar Marcar Todos los Entregables */}
      <ModalConfirmarMarcarEntregables
        abierto={modalMarcarEntregablesAbierto}
        totalAlumnos={seleccionados.size}
        onCerrar={() => {
          if (!marcandoEntregables) {
            setModalMarcarEntregablesAbierto(false);
          }
        }}
        onConfirmar={handleConfirmarMarcarTodosEntregables}
        cargando={marcandoEntregables}
      />
    </AppLayout>
  );
}

