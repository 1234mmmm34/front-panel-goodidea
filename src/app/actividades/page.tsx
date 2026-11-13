"use client";

import React, {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  RefreshCw,
  UserX,
  X,
  Search,
  ChevronDown,
  Loader2,
} from "lucide-react";
import {
  ActividadPendienteConsultor,
  CrearEditarActividadPayload,
  FiltrosConsultorActividadesState,
  PrioridadActividad,
  ProyectoEnCursoConsultorDto,
} from "@/types/consultor";
import {
  ConsultorService,
  extraerMensajeErrorConsultor,
} from "@/services/consultor.service";
import { AppLayout } from "@/components/layout/AppLayout";
import { PaginadorCustom } from "@/components/ui/PaginadorCustom";
import { AvisoInfo } from "@/components/ui/AvisoInfo";
import { SaludoBienvenida } from "@/components/ui/SaludoBienvenida";
import { FiltrosConsultorActividades } from "@/components/consultor/FiltrosConsultorActividades";
import { TablaConsultorActividades } from "@/components/consultor/TablaConsultorActividades";
import { ModalDetalleActividadConsultor } from "@/components/consultor/ModalDetalleActividadConsultor";
import { useToast } from "@/context/ToastContext";

function MisActividadesContent() {
  const { toast, confirmModal } = useToast();
  const toastRef = useRef(toast);
  useEffect(() => {
    toastRef.current = toast;
  }, [toast]);

  const router = useRouter();
  const searchParams = useSearchParams();

  // Lectura de query params
  const paramDesde = searchParams.get("desde");
  const paramHasta = searchParams.get("hasta");
  const paramQ = searchParams.get("q");
  const paramPagina = searchParams.get("pagina");
  const paramPrioridad = searchParams.get("prioridad");
  const paramLiga = searchParams.get("liga");

  const hoy = useMemo(() => new Date().toISOString().split("T")[0], []);

  // Paginación
  const [paginaActual, setPaginaActual] = useState<number>(() => {
    const p = paramPagina ? parseInt(paramPagina, 10) : 1;
    return isNaN(p) || p < 1 ? 1 : p;
  });
  const [tamanoPagina, setTamanoPagina] = useState<number>(10);
  const [totalRegistros, setTotalRegistros] = useState<number>(0);
  const [totalPaginas, setTotalPaginas] = useState<number>(1);
  const [cargando, setCargando] = useState<boolean>(true);

  // Estado 403 usuario no ligado a personal
  const [noLigadoPersonal, setNoLigadoPersonal] = useState<boolean>(false);
  const [errorActividades, setErrorActividades] = useState<string | null>(null);

  // Datos y filtros
  const [datosActividades, setDatosActividades] = useState<
    ActividadPendienteConsultor[]
  >([]);
  const [filtrosActividades, setFiltrosActividades] =
    useState<FiltrosConsultorActividadesState>(() => {
      const prio =
        paramPrioridad === "1" ||
        paramPrioridad === "2" ||
        paramPrioridad === "3"
          ? (Number(paramPrioridad) as PrioridadActividad)
          : 0;
      const liga =
        paramLiga === "1" || paramLiga === "2"
          ? (Number(paramLiga) as 1 | 2)
          : 0;

      return {
        fechaInicio: paramDesde || "",
        fechaFin: paramHasta || "",
        usarRango: Boolean(paramDesde || paramHasta),
        searchTerm: paramQ || "",
        iPrioridad: prio,
        iLiga: liga,
      };
    });

  // --- ESTADOS DE MODALES ---
  const [proyectosEnCurso, setProyectosEnCurso] = useState<
    ProyectoEnCursoConsultorDto[]
  >([]);
  const [cargandoProyectos, setCargandoProyectos] = useState<boolean>(false);

  // Modal Agregar / Editar Actividad
  const [modalActividadAbierto, setModalActividadAbierto] =
    useState<boolean>(false);
  const [actividadEditando, setActividadEditando] =
    useState<ActividadPendienteConsultor | null>(null);
  const [guardandoActividad, setGuardandoActividad] = useState<boolean>(false);
  const [selectProyectoAbierto, setSelectProyectoAbierto] =
    useState<boolean>(false);
  const [busquedaProyectoSelect, setBusquedaProyectoSelect] =
    useState<string>("");
  const [formActividad, setFormActividad] = useState<{
    v_Titulo: string;
    b_General: boolean;
    i_CveServAgendaDet: number | null;
    fechaInicio: string;
    fechaFin: string;
    v_Notas: string;
  }>({
    v_Titulo: "",
    b_General: false,
    i_CveServAgendaDet: null,
    fechaInicio: hoy,
    fechaFin: hoy,
    v_Notas: "",
  });

  // Modal Cancelar Actividad
  const [actividadCancelando, setActividadCancelando] =
    useState<ActividadPendienteConsultor | null>(null);
  const [motivoCancelar, setMotivoCancelar] = useState<string>("");
  const [guardandoCancelar, setGuardandoCancelar] = useState<boolean>(false);

  // Modal Detalle de Actividad (Ojo)
  const [actividadDetalle, setActividadDetalle] =
    useState<ActividadPendienteConsultor | null>(null);

  // Helper para mantener URL en sincronía con replace
  const actualizarUrl = useCallback(
    (cambios: {
      nuevosFiltrosActividades?: FiltrosConsultorActividadesState;
      nuevaPagina?: number;
    }) => {
      const targetPagina = cambios.nuevaPagina ?? paginaActual;
      const fact = cambios.nuevosFiltrosActividades ?? filtrosActividades;

      const params = new URLSearchParams();

      if (fact.usarRango && fact.fechaInicio) {
        params.set("desde", fact.fechaInicio);
      }
      if (fact.usarRango && fact.fechaFin) {
        params.set("hasta", fact.fechaFin);
      }
      if (fact.searchTerm && fact.searchTerm.trim() !== "") {
        params.set("q", fact.searchTerm.trim());
      }
      if (fact.iPrioridad !== 0) {
        params.set("prioridad", String(fact.iPrioridad));
      }
      if (fact.iLiga !== 0) {
        params.set("liga", String(fact.iLiga));
      }
      if (targetPagina > 1) {
        params.set("pagina", String(targetPagina));
      }

      const qs = params.toString();
      const url = qs ? `/actividades?${qs}` : `/actividades`;
      router.replace(url, { scroll: false });
    },
    [paginaActual, filtrosActividades, router]
  );

  // --- Cargar datos de Actividades ---
  const cargarActividades = useCallback(async () => {
    setCargando(true);
    setErrorActividades(null);
    try {
      const res = await ConsultorService.getActividades({
        fechaInicio:
          filtrosActividades.usarRango && filtrosActividades.fechaInicio
            ? filtrosActividades.fechaInicio
            : undefined,
        fechaFin:
          filtrosActividades.usarRango && filtrosActividades.fechaFin
            ? filtrosActividades.fechaFin
            : undefined,
        searchTerm: filtrosActividades.searchTerm || undefined,
        iPrioridad: filtrosActividades.iPrioridad,
        iLiga: filtrosActividades.iLiga,
        pagina: paginaActual,
        tamano: tamanoPagina,
      });

      setDatosActividades(res.datos);
      setTotalRegistros(res.total);
      setTotalPaginas(res.totalPaginas);
      setNoLigadoPersonal(false);
      setErrorActividades(null);
    } catch (err: any) {
      setDatosActividades([]);
      setTotalRegistros(0);
      setTotalPaginas(1);
      if (err?.response?.status === 403) {
        setNoLigadoPersonal(true);
        setErrorActividades(
          "Tu usuario no está ligado a un registro de personal. Contacta al administrador."
        );
      } else {
        const msg = extraerMensajeErrorConsultor(
          err,
          "Ocurrió un error al cargar las actividades."
        );
        setErrorActividades(msg);
        toastRef.current.error(msg);
      }
    } finally {
      setCargando(false);
    }
  }, [
    filtrosActividades.fechaInicio,
    filtrosActividades.fechaFin,
    filtrosActividades.usarRango,
    filtrosActividades.searchTerm,
    filtrosActividades.iPrioridad,
    filtrosActividades.iLiga,
    paginaActual,
    tamanoPagina,
  ]);

  useEffect(() => {
    cargarActividades();
  }, [cargarActividades]);

  // --- Cargar proyectos en curso para el select del modal de actividad ---
  const asegurarProyectosEnCurso = async () => {
    setCargandoProyectos(true);
    try {
      const lista = await ConsultorService.getProyectosEnCurso();
      setProyectosEnCurso(lista);
    } catch (err: any) {
      toastRef.current.error(
        extraerMensajeErrorConsultor(
          err,
          "No se pudieron cargar los proyectos en curso."
        )
      );
    } finally {
      setCargandoProyectos(false);
    }
  };

  const proyectosEnCursoFiltrados = useMemo(() => {
    const q = busquedaProyectoSelect.trim().toLowerCase();
    if (!q) return proyectosEnCurso;
    return proyectosEnCurso.filter((p) => {
      const label = `${p.v_Servicio} · ${p.v_Empresa}${
        p.v_Planta ? ` (${p.v_Planta})` : ""
      }`.toLowerCase();
      return label.includes(q);
    });
  }, [proyectosEnCurso, busquedaProyectoSelect]);

  // --- Handlers Modal Agregar / Editar actividad ---
  const handleAbrirCrearActividad = () => {
    setActividadEditando(null);
    setFormActividad({
      v_Titulo: "",
      b_General: false,
      i_CveServAgendaDet: null,
      fechaInicio: hoy,
      fechaFin: hoy,
      v_Notas: "",
    });
    setSelectProyectoAbierto(false);
    setBusquedaProyectoSelect("");
    setModalActividadAbierto(true);
    asegurarProyectosEnCurso();
  };

  const handleAbrirEditarActividad = (item: ActividadPendienteConsultor) => {
    const fechaIniStr = (item.d_FechaInicio || "").substring(0, 10) || hoy;
    const fechaFinStr = (item.d_FinCompromiso || "").substring(0, 10) || fechaIniStr;

    setActividadEditando(item);
    setFormActividad({
      v_Titulo: (item.v_Titulo || "").slice(0, 200),
      b_General: item.i_CveServAgendaDet == null,
      i_CveServAgendaDet: item.i_CveServAgendaDet,
      fechaInicio: fechaIniStr,
      fechaFin: fechaFinStr,
      v_Notas: item.v_Notas || "",
    });
    setSelectProyectoAbierto(false);
    setBusquedaProyectoSelect("");
    setModalActividadAbierto(true);
    asegurarProyectosEnCurso();
  };

  const handleCerrarModalActividad = () => {
    if (guardandoActividad) return;
    setModalActividadAbierto(false);
    setActividadEditando(null);
    setSelectProyectoAbierto(false);
    setBusquedaProyectoSelect("");
  };

  const handleGuardarActividad = async () => {
    const tituloTrim = formActividad.v_Titulo.trim();
    if (!tituloTrim) {
      toast.error("El título de la actividad es obligatorio.");
      return;
    }
    if (tituloTrim.length > 200) {
      toast.error("El título no puede exceder 200 caracteres.");
      return;
    }
    if (!formActividad.b_General && !formActividad.i_CveServAgendaDet) {
      toast.error("Selecciona un proyecto en curso.");
      return;
    }

    if (!formActividad.fechaInicio || !formActividad.fechaFin) {
      toast.error(
        "Selecciona la fecha de inicio y la fecha compromiso."
      );
      return;
    }
    if (formActividad.fechaFin < formActividad.fechaInicio) {
      toast.error(
        "La fecha compromiso no puede ser menor que la fecha inicio."
      );
      return;
    }

    const payload: CrearEditarActividadPayload = {
      v_Titulo: tituloTrim,
      i_CveServAgendaDet: formActividad.b_General
        ? null
        : formActividad.i_CveServAgendaDet,
      v_Notas: formActividad.v_Notas.trim()
        ? formActividad.v_Notas.trim()
        : null,
      d_FechaInicio: `${formActividad.fechaInicio}T00:00:00`,
      d_FechaFin: `${formActividad.fechaFin}T00:00:00`,
    };

    setGuardandoActividad(true);
    try {
      if (actividadEditando && actividadEditando.i_CveActividad != null) {
        await ConsultorService.editarActividad(
          actividadEditando.i_CveActividad,
          payload
        );
        toast.success("Actividad actualizada correctamente");
      } else {
        await ConsultorService.crearActividad(payload);
        toast.success("Actividad registrada correctamente");
      }
      setModalActividadAbierto(false);
      setActividadEditando(null);
      cargarActividades();
    } catch (err: any) {
      toast.error(
        extraerMensajeErrorConsultor(err, "No se pudo guardar la actividad.")
      );
    } finally {
      setGuardandoActividad(false);
    }
  };

  // --- Handlers Modal Cancelar actividad ---
  const handleAbrirCancelarActividad = (item: ActividadPendienteConsultor) => {
    setActividadCancelando(item);
    setMotivoCancelar("");
  };

  const handleCerrarCancelarActividad = () => {
    if (guardandoCancelar) return;
    setActividadCancelando(null);
    setMotivoCancelar("");
  };

  const handleConfirmarCancelarActividad = async () => {
    if (!actividadCancelando || actividadCancelando.i_CveActividad == null)
      return;
    setGuardandoCancelar(true);
    try {
      await ConsultorService.cancelarActividad(
        actividadCancelando.i_CveActividad,
        {
          v_Motivo: motivoCancelar.trim() ? motivoCancelar.trim() : null,
        }
      );
      toast.success("Actividad cancelada");
      setActividadCancelando(null);
      setMotivoCancelar("");
      cargarActividades();
    } catch (err: any) {
      toast.error(
        extraerMensajeErrorConsultor(err, "No se pudo cancelar la actividad.")
      );
    } finally {
      setGuardandoCancelar(false);
    }
  };

  // --- Acción Confirmar terminado ---
  const handleConfirmarActividadPendiente = (
    item: ActividadPendienteConsultor
  ) => {
    confirmModal({
      title: `¿Confirmas que «${item.v_Titulo}» ya terminó?`,
      message:
        "Se guardará hoy como fecha de fin real y la actividad dejará de aparecer en pendientes. Esta acción no se puede deshacer.",
      confirmText: "Confirmar",
      cancelText: "Cancelar",
      variant: "warning",
      onConfirm: async () => {
        try {
          await ConsultorService.confirmarActividad(item.i_CveActividad);
          toast.success("Actividad confirmada como terminada");
          cargarActividades();
        } catch (err: any) {
          toast.error(
            extraerMensajeErrorConsultor(err, "Error al confirmar terminado")
          );
        }
      },
    });
  };

  const hayFiltrosActivosActividades = Boolean(
    filtrosActividades.usarRango ||
      filtrosActividades.searchTerm.trim() !== "" ||
      filtrosActividades.iPrioridad !== 0 ||
      filtrosActividades.iLiga !== 0
  );

  return (
    <AppLayout>
      <div style={{ marginBottom: "14px" }}>
        <SaludoBienvenida />
      </div>

      <div className="page-header">
        <div>
          <h1 className="page-title">Mis actividades</h1>
          <p className="subtext">
            Registra y da seguimiento a tus actividades pendientes.
          </p>
        </div>

        <button
          className="btn btn-outline"
          onClick={cargarActividades}
          disabled={cargando}
          title="Recargar datos"
        >
          <RefreshCw size={16} className={cargando ? "animate-spin" : ""} />
          Recargar
        </button>
      </div>

      {noLigadoPersonal ? (
        <div
          className="card p-8 text-center my-6"
          style={{
            maxWidth: 600,
            margin: "3rem auto",
            backgroundColor: "#fff",
            borderRadius: "12px",
            boxShadow: "0 4px 16px rgba(0,0,0,0.06)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              marginBottom: "1.25rem",
            }}
          >
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: "50%",
                backgroundColor: "rgba(239, 68, 68, 0.1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#ef4444",
              }}
            >
              <UserX size={32} />
            </div>
          </div>
          <h2
            style={{
              fontSize: "1.25rem",
              fontWeight: 600,
              marginBottom: "0.5rem",
              color: "#1e293b",
            }}
          >
            Sin registro de personal
          </h2>
          <p
            className="text-secondary"
            style={{
              fontSize: "0.95rem",
              lineHeight: 1.6,
              margin: "0 auto",
              maxWidth: "460px",
            }}
          >
            Tu usuario no está ligado a un registro de personal. Contacta al
            administrador.
          </p>
        </div>
      ) : (
        <>
          <FiltrosConsultorActividades
            filtros={filtrosActividades}
            onCambiarFiltros={(nuevos) => {
              setFiltrosActividades(nuevos);
              setPaginaActual(1);
              actualizarUrl({
                nuevosFiltrosActividades: nuevos,
                nuevaPagina: 1,
              });
            }}
            onBuscar={() => {
              setPaginaActual(1);
              actualizarUrl({ nuevaPagina: 1 });
            }}
            onAgregarActividad={handleAbrirCrearActividad}
          />

          <TablaConsultorActividades
            datos={datosActividades}
            cargando={cargando}
            error={errorActividades}
            hayFiltrosActivos={hayFiltrosActivosActividades}
            onVerHistorial={(item) => setActividadDetalle(item)}
            onConfirmar={handleConfirmarActividadPendiente}
            onEditar={handleAbrirEditarActividad}
            onCancelar={handleAbrirCancelarActividad}
          />

          <PaginadorCustom
            paginaActual={paginaActual}
            totalPaginas={totalPaginas}
            totalRegistros={totalRegistros}
            tamano={tamanoPagina}
            onCambioPagina={(pag) => {
              setPaginaActual(pag);
              actualizarUrl({ nuevaPagina: pag });
            }}
            onCambioTamano={(tam) => {
              setTamanoPagina(tam);
              setPaginaActual(1);
              actualizarUrl({ nuevaPagina: 1 });
            }}
          />
        </>
      )}

      {/* Modal Detalle de actividad */}
      <ModalDetalleActividadConsultor
        abierto={!!actividadDetalle}
        actividad={actividadDetalle}
        onCerrar={() => setActividadDetalle(null)}
      />

      {/* ====================================================================
          MODAL "AGREGAR ACTIVIDAD" / "EDITAR ACTIVIDAD"
      ==================================================================== */}
      {modalActividadAbierto && (
        <div
          className="modal-overlay"
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(15, 23, 42, 0.6)",
            backdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "16px",
          }}
          onClick={handleCerrarModalActividad}
        >
          <div
            className="modal-content no-scrollbar"
            style={{
              maxWidth: "560px",
              width: "100%",
              maxHeight: "95vh",
              backgroundColor: "#ffffff",
              borderRadius: "16px",
              boxShadow:
                "0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0, 0, 0, 0.05)",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
              scrollbarWidth: "none",
              msOverflowStyle: "none",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div
              className="modal-header shrink-0"
              style={{
                padding: "18px 24px",
                borderBottom: "1px solid #f1f5f9",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                background: "#ffffff",
              }}
            >
              <h3
                style={{
                  fontSize: "15px",
                  fontWeight: 600,
                  color: "#0f172a",
                  margin: 0,
                }}
              >
                {actividadEditando === null
                  ? "Agregar actividad"
                  : "Editar actividad"}
              </h3>
              <button
                type="button"
                className="btn-icon"
                onClick={handleCerrarModalActividad}
                style={{
                  padding: "6px",
                  borderRadius: "50%",
                  border: "none",
                  background: "transparent",
                  color: "#64748b",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <div
              className="modal-body no-scrollbar"
              style={{
                padding: "20px 24px",
                flex: 1,
                overflowY: "auto",
                display: "flex",
                flexDirection: "column",
                gap: "16px",
              }}
            >
              {/* 1. Título * (máximo 200 caracteres, con contador n/200) */}
              <div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: "6px",
                  }}
                >
                  <label className="form-label" style={{ marginBottom: 0 }}>
                    Título <span style={{ color: "#2B8FCC" }}>*</span>
                  </label>
                  <span
                    style={{
                      fontSize: "11px",
                      fontWeight: 500,
                      color:
                        formActividad.v_Titulo.length >= 200
                          ? "#dc3545"
                          : "#64748b",
                    }}
                  >
                    {formActividad.v_Titulo.length}/200
                  </span>
                </div>
                <input
                  type="text"
                  maxLength={200}
                  className="form-control"
                  placeholder="Ej. Junta de avance, Salida a planta, Visita previa..."
                  value={formActividad.v_Titulo}
                  onChange={(e) =>
                    setFormActividad((prev) => ({
                      ...prev,
                      v_Titulo: e.target.value.slice(0, 200),
                    }))
                  }
                  style={{
                    width: "100%",
                    height: "36px",
                    fontSize: "13px",
                    borderRadius: "8px",
                    border: "1px solid #d0dce8",
                    padding: "0 12px",
                  }}
                />
              </div>

              {/* 2. ¿A qué está ligada? * (Proyecto en curso / General) */}
              <div>
                <label className="form-label" style={{ marginBottom: "6px" }}>
                  ¿A qué está ligada?{" "}
                  <span style={{ color: "#2B8FCC" }}>*</span>
                </label>
                <div style={{ display: "flex", gap: "10px" }}>
                  <button
                    type="button"
                    onClick={() =>
                      setFormActividad((prev) => ({
                        ...prev,
                        b_General: false,
                      }))
                    }
                    style={{
                      flex: 1,
                      height: "36px",
                      borderRadius: "8px",
                      fontSize: "13px",
                      fontWeight: 600,
                      border: !formActividad.b_General
                        ? "1.5px solid #2B8FCC"
                        : "1px solid #cbd5e1",
                      backgroundColor: !formActividad.b_General
                        ? "#eef6fd"
                        : "#ffffff",
                      color: !formActividad.b_General ? "#1d4ed8" : "#475569",
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                    }}
                  >
                    Proyecto en curso
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setFormActividad((prev) => ({
                        ...prev,
                        b_General: true,
                        i_CveServAgendaDet: null,
                      }));
                      setSelectProyectoAbierto(false);
                    }}
                    style={{
                      flex: 1,
                      height: "36px",
                      borderRadius: "8px",
                      fontSize: "13px",
                      fontWeight: 600,
                      border: formActividad.b_General
                        ? "1.5px solid #2B8FCC"
                        : "1px solid #cbd5e1",
                      backgroundColor: formActividad.b_General
                        ? "#eef6fd"
                        : "#ffffff",
                      color: formActividad.b_General ? "#1d4ed8" : "#475569",
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                    }}
                  >
                    General
                  </button>
                </div>
              </div>

              {/* 3. Proyecto * (Select con buscador; solo visible cuando se elige Proyecto en curso) */}
              {!formActividad.b_General && (
                <div style={{ position: "relative" }}>
                  <label className="form-label" style={{ marginBottom: "6px" }}>
                    Proyecto <span style={{ color: "#2B8FCC" }}>*</span>
                  </label>
                  {(() => {
                    const proySel = proyectosEnCurso.find(
                      (p) =>
                        p.i_CveServAgendaDet ===
                        formActividad.i_CveServAgendaDet
                    );
                    const textoSeleccionado = proySel
                      ? `${proySel.v_Servicio} · ${proySel.v_Empresa.trim()}${
                          proySel.v_Planta ? ` (${proySel.v_Planta})` : ""
                        }`
                      : cargandoProyectos
                      ? "Cargando proyectos..."
                      : "Seleccionar proyecto en curso...";

                    return (
                      <>
                        <button
                          type="button"
                          onClick={() =>
                            setSelectProyectoAbierto(!selectProyectoAbierto)
                          }
                          style={{
                            width: "100%",
                            minHeight: "36px",
                            padding: "6px 12px",
                            borderRadius: "8px",
                            border: "1px solid #d0dce8",
                            backgroundColor: "#ffffff",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: "8px",
                            fontSize: "12.5px",
                            color: proySel ? "#0f172a" : "#94a3b8",
                            cursor: "pointer",
                            textAlign: "left",
                          }}
                        >
                          <span
                            style={{
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {textoSeleccionado}
                          </span>
                          <ChevronDown
                            size={15}
                            style={{ color: "#64748b", flexShrink: 0 }}
                          />
                        </button>

                        {selectProyectoAbierto && (
                          <div
                            style={{
                              position: "absolute",
                              top: "calc(100% + 4px)",
                              left: 0,
                              right: 0,
                              backgroundColor: "#ffffff",
                              border: "1px solid #cbd5e1",
                              borderRadius: "10px",
                              boxShadow:
                                "0 10px 25px -5px rgba(15, 23, 42, 0.15)",
                              zIndex: 60,
                              overflow: "hidden",
                            }}
                          >
                            <div
                              style={{
                                padding: "8px",
                                borderBottom: "1px solid #f1f5f9",
                                backgroundColor: "#f8fafc",
                              }}
                            >
                              <div style={{ position: "relative" }}>
                                <Search
                                  size={13}
                                  style={{
                                    position: "absolute",
                                    left: "10px",
                                    top: "50%",
                                    transform: "translateY(-50%)",
                                    color: "#94a3b8",
                                  }}
                                />
                                <input
                                  type="text"
                                  className="form-control"
                                  placeholder="Buscar por servicio, empresa o planta..."
                                  value={busquedaProyectoSelect}
                                  onChange={(e) =>
                                    setBusquedaProyectoSelect(e.target.value)
                                  }
                                  style={{
                                    width: "100%",
                                    height: "30px",
                                    fontSize: "12px",
                                    paddingLeft: "28px",
                                    borderRadius: "6px",
                                    border: "1px solid #cbd5e1",
                                  }}
                                />
                              </div>
                            </div>

                            <div
                              style={{
                                maxHeight: "190px",
                                overflowY: "auto",
                              }}
                            >
                              {proyectosEnCursoFiltrados.length === 0 ? (
                                <div
                                  style={{
                                    padding: "12px",
                                    fontSize: "12px",
                                    color: "#94a3b8",
                                    textAlign: "center",
                                  }}
                                >
                                  Sin proyectos coincidentes
                                </div>
                              ) : (
                                proyectosEnCursoFiltrados.map((p) => {
                                  const activo =
                                    p.i_CveServAgendaDet ===
                                    formActividad.i_CveServAgendaDet;
                                  return (
                                    <button
                                      key={p.i_CveServAgendaDet}
                                      type="button"
                                      onClick={() => {
                                        setFormActividad((prev) => ({
                                          ...prev,
                                          i_CveServAgendaDet:
                                            p.i_CveServAgendaDet,
                                        }));
                                        setSelectProyectoAbierto(false);
                                        setBusquedaProyectoSelect("");
                                      }}
                                      style={{
                                        width: "100%",
                                        padding: "8px 12px",
                                        border: "none",
                                        borderBottom: "1px solid #f8fafc",
                                        backgroundColor: activo
                                          ? "#eef6fd"
                                          : "#ffffff",
                                        color: activo ? "#1d4ed8" : "#1e293b",
                                        fontSize: "12px",
                                        fontWeight: activo ? 600 : 400,
                                        textAlign: "left",
                                        cursor: "pointer",
                                        display: "block",
                                      }}
                                    >
                                      {p.v_Servicio} · {p.v_Empresa.trim()}
                                      {p.v_Planta ? ` (${p.v_Planta})` : ""}
                                    </button>
                                  );
                                })
                              )}
                            </div>
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              )}

              {/* 4. Fecha inicio * y Fecha compromiso * */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                }}
              >
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "repeat(auto-fit, minmax(140px, 1fr))",
                    gap: "12px",
                  }}
                >
                  <div>
                    <label
                      className="form-label"
                      style={{ marginBottom: "6px" }}
                    >
                      Fecha inicio{" "}
                      <span style={{ color: "#2B8FCC" }}>*</span>
                    </label>
                    <input
                      type="date"
                      className="form-control"
                      value={formActividad.fechaInicio}
                      onChange={(e) => {
                        const nuevaIni = e.target.value;
                        setFormActividad((prev) => ({
                          ...prev,
                          fechaInicio: nuevaIni,
                          fechaFin:
                            !prev.fechaFin || prev.fechaFin < nuevaIni
                              ? nuevaIni
                              : prev.fechaFin,
                        }));
                      }}
                      style={{
                        width: "100%",
                        height: "36px",
                        fontSize: "13px",
                        borderRadius: "8px",
                        border: "1px solid #d0dce8",
                        padding: "0 10px",
                        backgroundColor: "#ffffff",
                        color: "#0f172a",
                        cursor: "pointer",
                      }}
                    />
                  </div>

                  <div>
                    <label
                      className="form-label"
                      style={{ marginBottom: "6px" }}
                    >
                      Fecha compromiso{" "}
                      <span style={{ color: "#2B8FCC" }}>*</span>
                    </label>
                    <input
                      type="date"
                      className="form-control"
                      min={formActividad.fechaInicio || undefined}
                      value={formActividad.fechaFin}
                      onChange={(e) =>
                        setFormActividad((prev) => ({
                          ...prev,
                          fechaFin: e.target.value,
                        }))
                      }
                      style={{
                        width: "100%",
                        height: "36px",
                        fontSize: "13px",
                        borderRadius: "8px",
                        border: "1px solid #d0dce8",
                        padding: "0 10px",
                        backgroundColor: "#ffffff",
                        color: "#0f172a",
                        cursor: "pointer",
                      }}
                    />
                  </div>
                </div>

                <AvisoInfo tipo="info">
                  La prioridad se asigna sola según la fecha compromiso y se
                  actualiza conforme se acerca.
                </AvisoInfo>
              </div>

              {/* 5. Notas (opcional) */}
              <div>
                <label className="form-label" style={{ marginBottom: "6px" }}>
                  Notas
                </label>
                <textarea
                  rows={3}
                  className="form-control"
                  placeholder="Notas opcionales de la actividad..."
                  value={formActividad.v_Notas}
                  onChange={(e) =>
                    setFormActividad((prev) => ({
                      ...prev,
                      v_Notas: e.target.value,
                    }))
                  }
                  style={{
                    width: "100%",
                    fontSize: "13px",
                    borderRadius: "8px",
                    border: "1px solid #d0dce8",
                    padding: "8px 12px",
                    resize: "vertical",
                    minHeight: "68px",
                    backgroundColor: "#ffffff",
                    color: "#0f172a",
                    fontFamily: "inherit",
                  }}
                />
              </div>
            </div>

            {/* Footer */}
            <div
              className="modal-footer"
              style={{
                position: "sticky",
                bottom: 0,
                backgroundColor: "#ffffff",
                borderTop: "1px solid #e2e8f0",
                padding: "12px 24px",
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-end",
                gap: "10px",
                zIndex: 10,
              }}
            >
              <button
                type="button"
                className="btn btn-secondary"
                disabled={guardandoActividad}
                onClick={handleCerrarModalActividad}
              >
                Cerrar
              </button>
              <button
                type="button"
                className="btn btn-primary"
                disabled={guardandoActividad}
                style={{
                  backgroundColor: "#2B8FCC",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                }}
                onClick={handleGuardarActividad}
              >
                {guardandoActividad && (
                  <Loader2 size={14} className="animate-spin" />
                )}
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
          MODAL: CANCELAR ACTIVIDAD
      ==================================================================== */}
      {actividadCancelando && (
        <div
          className="modal-overlay"
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(15, 23, 42, 0.6)",
            backdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1050,
            padding: "16px",
          }}
          onClick={handleCerrarCancelarActividad}
        >
          <div
            className="modal-content no-scrollbar"
            style={{
              maxWidth: "460px",
              width: "100%",
              backgroundColor: "#ffffff",
              borderRadius: "16px",
              boxShadow:
                "0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0, 0, 0, 0.05)",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="modal-header shrink-0"
              style={{
                padding: "18px 24px",
                borderBottom: "1px solid #f1f5f9",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                background: "#ffffff",
              }}
            >
              <h3
                style={{
                  fontSize: "15px",
                  fontWeight: 600,
                  color: "#0f172a",
                  margin: 0,
                }}
              >
                ¿Deseas cancelar {actividadCancelando.v_Titulo}?
              </h3>
              <button
                type="button"
                className="btn-icon"
                onClick={handleCerrarCancelarActividad}
                style={{
                  padding: "6px",
                  borderRadius: "50%",
                  border: "none",
                  background: "transparent",
                  color: "#64748b",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <X size={18} />
              </button>
            </div>

            <div
              className="modal-body"
              style={{
                padding: "20px 24px",
                display: "flex",
                flexDirection: "column",
                gap: "12px",
              }}
            >
              <div>
                <label className="form-label" style={{ marginBottom: "6px" }}>
                  Motivo
                </label>
                <textarea
                  rows={3}
                  className="form-control"
                  placeholder="Motivo de cancelación (opcional)..."
                  value={motivoCancelar}
                  onChange={(e) => setMotivoCancelar(e.target.value)}
                  style={{
                    width: "100%",
                    fontSize: "13px",
                    borderRadius: "8px",
                    border: "1px solid #d0dce8",
                    padding: "8px 12px",
                    resize: "vertical",
                    minHeight: "64px",
                  }}
                />
              </div>
            </div>

            <div
              className="modal-footer"
              style={{
                backgroundColor: "#ffffff",
                borderTop: "1px solid #e2e8f0",
                padding: "12px 24px",
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-end",
                gap: "10px",
              }}
            >
              <button
                type="button"
                className="btn btn-secondary"
                disabled={guardandoCancelar}
                onClick={handleCerrarCancelarActividad}
              >
                Cerrar
              </button>
              <button
                type="button"
                className="btn btn-danger"
                disabled={guardandoCancelar}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                }}
                onClick={handleConfirmarCancelarActividad}
              >
                {guardandoCancelar && (
                  <Loader2 size={14} className="animate-spin" />
                )}
                Cancelar actividad
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}

export default function MisActividadesPage() {
  return (
    <Suspense
      fallback={
        <div className="p-4 text-sm text-slate-500">
          Cargando mis actividades...
        </div>
      }
    >
      <MisActividadesContent />
    </Suspense>
  );
}

