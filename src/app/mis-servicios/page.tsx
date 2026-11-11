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
  History,
  Check,
  Loader2,
} from "lucide-react";
import {
  ActividadConsultor,
  AgendaServicioConsultorGetDto,
  FiltrosConsultorSesionesState,
  FiltrosConsultorServiciosState,
  HistorialActividad,
  ProyectoEnCursoConsultorDto,
  VistaConsultor,
} from "@/types/consultor";
import {
  ConsultorService,
  extraerMensajeErrorConsultor,
} from "@/services/consultor.service";
import { AppLayout } from "@/components/layout/AppLayout";
import { PaginadorCustom } from "@/components/ui/PaginadorCustom";
import { FiltrosConsultorSesiones } from "@/components/consultor/FiltrosConsultorSesiones";
import {
  TablaConsultorSesiones,
  formatearFechaActividadReal,
  formatearHorarioActividadReal,
  extraerHoraIso,
} from "@/components/consultor/TablaConsultorSesiones";
import { FiltrosConsultorServicios } from "@/components/consultor/FiltrosConsultorServicios";
import { TablaConsultorServicios } from "@/components/consultor/TablaConsultorServicios";
import { ModalDetalleServicioConsultor } from "@/components/consultor/ModalDetalleServicioConsultor";
import { useToast } from "@/context/ToastContext";

const MESES_CORTOS_ES = [
  "ene",
  "feb",
  "mar",
  "abr",
  "may",
  "jun",
  "jul",
  "ago",
  "sep",
  "oct",
  "nov",
  "dic",
];

function formatearFechaLargaEs(fechaIso: string | null | undefined): string {
  if (!fechaIso) return "";
  const clean = fechaIso.split("T")[0];
  const parts = clean.split("-");
  if (parts.length !== 3) return clean;
  const [y, m, d] = parts;
  const mesTxt = MESES_CORTOS_ES[parseInt(m, 10) - 1] || m;
  return `${d.padStart(2, "0")} de ${mesTxt}, ${y}`;
}

function obtenerTextoEstatusHistorial(cveEstatus: number): string {
  switch (cveEstatus) {
    case 0:
      return "Cancelada";
    case 1:
      return "Programado";
    case 2:
    case 6:
      return "En curso";
    case 3:
      return "Terminado";
    case 4:
      return "Reprogramada";
    case 5:
      return "Por confirmar";
    default:
      return "Programado";
  }
}

function MisServiciosContent() {
  const { toast, confirmModal } = useToast();
  const toastRef = useRef(toast);
  useEffect(() => {
    toastRef.current = toast;
  }, [toast]);

  const router = useRouter();
  const searchParams = useSearchParams();

  // Lectura de query params (§1.3 y §3.1)
  const paramVista = searchParams.get("vista");
  const paramDesde = searchParams.get("desde");
  const paramHasta = searchParams.get("hasta");
  const paramQ = searchParams.get("q");
  const paramPagina = searchParams.get("pagina");
  const paramDetalle = searchParams.get("detalle");
  const paramExcedidos = searchParams.get("excedidos");

  const hoy = useMemo(() => new Date().toISOString().split("T")[0], []);

  // §3.1 Selector "Visualizar": "actividades" (default) | "servicios" (si llega vista=sesiones, se trata como actividades)
  const [vista, setVista] = useState<VistaConsultor>(() => {
    return paramVista === "servicios" ? "servicios" : "actividades";
  });

  // Estado Paginación Común
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

  // Estados de error por vista
  const [errorActividades, setErrorActividades] = useState<string | null>(null);
  const [errorServicios, setErrorServicios] = useState<string | null>(null);

  // --- ESTADO VISTA ACTIVIDADES (§3) ---
  const [datosActividades, setDatosActividades] = useState<
    ActividadConsultor[]
  >([]);
  const [filtrosActividades, setFiltrosActividades] =
    useState<FiltrosConsultorSesionesState>(() => ({
      visualizar: "actividades",
      fechaInicio:
        paramDesde !== null && paramDesde !== undefined ? paramDesde : hoy,
      fechaFin: paramHasta || "",
      usarRango: Boolean(paramHasta),
      searchTerm: paramQ || "",
    }));

  // --- ESTADO VISTA SERVICIOS (§1) ---
  const [datosServicios, setDatosServicios] = useState<
    AgendaServicioConsultorGetDto[]
  >([]);
  const [filtrosServicios, setFiltrosServicios] =
    useState<FiltrosConsultorServiciosState>(() => ({
      visualizar: "servicios",
      fechaInicio:
        paramDesde !== null && paramDesde !== undefined ? paramDesde : hoy,
      fechaFin: paramHasta || "",
      usarRango: Boolean(paramHasta),
      searchTerm: paramQ || "",
      soloExcedidos: paramExcedidos === "1" || paramExcedidos === "true",
    }));

  // --- MODAL DETALLE DE SERVICIO (§2) ---
  const [itemDetalle, setItemDetalle] = useState<{
    iCveAgenda: number;
    iCveServAgendaDet: number;
  } | null>(null);

  const modalYaAbiertoParaDetalleRef = useRef<string | null>(null);

  // --- ESTADOS DE MODALES DE ACTIVIDADES (§3.5 y §3.6) ---
  const [proyectosEnCurso, setProyectosEnCurso] = useState<
    ProyectoEnCursoConsultorDto[]
  >([]);
  const [cargandoProyectos, setCargandoProyectos] = useState<boolean>(false);

  // Modal Agregar / Editar Actividad
  const [modalActividadAbierto, setModalActividadAbierto] =
    useState<boolean>(false);
  const [actividadEditando, setActividadEditando] =
    useState<ActividadConsultor | null>(null);
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
    b_TieneHorario: boolean;
    horaInicio: string;
    horaFin: string;
    v_Notas: string;
  }>({
    v_Titulo: "",
    b_General: false,
    i_CveServAgendaDet: null,
    fechaInicio: hoy,
    fechaFin: hoy,
    b_TieneHorario: true,
    horaInicio: "09:00",
    horaFin: "10:00",
    v_Notas: "",
  });

  // Modal Reprogramar Actividad
  const [actividadReprogramando, setActividadReprogramando] =
    useState<ActividadConsultor | null>(null);
  const [guardandoReprogramar, setGuardandoReprogramar] =
    useState<boolean>(false);
  const [formReprogramar, setFormReprogramar] = useState<{
    fechaInicio: string;
    fechaFin: string;
    b_TieneHorario: boolean;
    horaInicio: string;
    horaFin: string;
    v_Motivo: string;
  }>({
    fechaInicio: hoy,
    fechaFin: hoy,
    b_TieneHorario: true,
    horaInicio: "09:00",
    horaFin: "10:00",
    v_Motivo: "",
  });

  // Modal Cancelar Actividad
  const [actividadCancelando, setActividadCancelando] =
    useState<ActividadConsultor | null>(null);
  const [motivoCancelar, setMotivoCancelar] = useState<string>("");
  const [guardandoCancelar, setGuardandoCancelar] = useState<boolean>(false);

  // Modal Historial de Actividades (Ojo — §3.6)
  const [filaEnHistorial, setFilaEnHistorial] =
    useState<ActividadConsultor | null>(null);
  const [historialItems, setHistorialItems] = useState<HistorialActividad[]>(
    []
  );
  const [cargandoHistorial, setCargandoHistorial] = useState<boolean>(false);
  const nodoActualHistorialRef = useRef<HTMLDivElement | null>(null);

  // Helper para mantener URL en sincronía con replace (§1.3 y §3.1)
  const actualizarUrl = useCallback(
    (cambios: {
      nuevaVista?: VistaConsultor;
      nuevosFiltrosActividades?: FiltrosConsultorSesionesState;
      nuevosFiltrosServicios?: FiltrosConsultorServiciosState;
      nuevaPagina?: number;
      detalleId?: number | null;
    }) => {
      const targetVista = cambios.nuevaVista ?? vista;
      const targetPagina = cambios.nuevaPagina ?? paginaActual;
      const targetDetalle =
        cambios.detalleId !== undefined
          ? cambios.detalleId
          : itemDetalle?.iCveServAgendaDet ?? null;

      const params = new URLSearchParams();
      params.set("vista", targetVista);

      if (targetVista === "servicios") {
        const fs = cambios.nuevosFiltrosServicios ?? filtrosServicios;
        if (fs.fechaInicio) params.set("desde", fs.fechaInicio);
        if (fs.usarRango && fs.fechaFin) params.set("hasta", fs.fechaFin);
        if (fs.searchTerm && fs.searchTerm.trim() !== "") {
          params.set("q", fs.searchTerm.trim());
        }
        if (fs.soloExcedidos) {
          params.set("excedidos", "1");
        }
      } else {
        const fact = cambios.nuevosFiltrosActividades ?? filtrosActividades;
        if (fact.fechaInicio) params.set("desde", fact.fechaInicio);
        if (fact.usarRango && fact.fechaFin) params.set("hasta", fact.fechaFin);
        if (fact.searchTerm && fact.searchTerm.trim() !== "") {
          params.set("q", fact.searchTerm.trim());
        }
      }

      if (targetPagina > 1) {
        params.set("pagina", String(targetPagina));
      }

      if (targetDetalle) {
        params.set("detalle", String(targetDetalle));
      }

      const qs = params.toString();
      const url = qs ? `/mis-servicios?${qs}` : `/mis-servicios`;
      router.replace(url, { scroll: false });
    },
    [
      vista,
      paginaActual,
      itemDetalle,
      filtrosServicios,
      filtrosActividades,
      router,
    ]
  );

  const handleAbrirModalDetalle = (item: {
    iCveAgenda: number;
    iCveServAgendaDet: number;
  }) => {
    setItemDetalle(item);
    actualizarUrl({ detalleId: item.iCveServAgendaDet });
  };

  const handleCerrarModalDetalle = () => {
    setItemDetalle(null);
    actualizarUrl({ detalleId: null });
  };

  // Si al cargar viene detalle, abrir el modal de ese servicio al terminar de cargar la tabla
  useEffect(() => {
    if (!cargando && paramDetalle) {
      if (modalYaAbiertoParaDetalleRef.current !== paramDetalle) {
        modalYaAbiertoParaDetalleRef.current = paramDetalle;
        const detalleId = Number(paramDetalle);
        if (detalleId) {
          if (vista === "servicios") {
            const encontrado = datosServicios.find(
              (s) => s.i_CveServAgendaDet === detalleId
            );
            setItemDetalle({
              iCveAgenda: encontrado?.i_CveAgenda ?? 0,
              iCveServAgendaDet: detalleId,
            });
          } else {
            const actMatch = datosActividades.find(
              (s) => s.i_CveServAgendaDet === detalleId
            );
            setItemDetalle({
              iCveAgenda: actMatch?.i_CveAgenda ?? 0,
              iCveServAgendaDet: detalleId,
            });
          }
        }
      }
    } else if (!paramDetalle) {
      modalYaAbiertoParaDetalleRef.current = null;
      if (itemDetalle) {
        setItemDetalle(null);
      }
    }
  }, [
    cargando,
    paramDetalle,
    itemDetalle,
    vista,
    datosServicios,
    datosActividades,
  ]);

  // --- Cargar datos de Actividades (§3.2) ---
  const cargarActividades = useCallback(async () => {
    setCargando(true);
    setErrorActividades(null);
    try {
      const res = await ConsultorService.getActividades({
        fechaInicio: filtrosActividades.fechaInicio,
        fechaFin:
          filtrosActividades.usarRango && filtrosActividades.fechaFin
            ? filtrosActividades.fechaFin
            : undefined,
        pagina: paginaActual,
        tamano: tamanoPagina,
        searchTerm: filtrosActividades.searchTerm || undefined,
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
    paginaActual,
    tamanoPagina,
  ]);

  // --- Cargar datos de Servicios (§1.1) ---
  const cargarServicios = useCallback(async () => {
    setCargando(true);
    setErrorServicios(null);
    try {
      const res = await ConsultorService.getServicios({
        pagina: paginaActual,
        tamano: tamanoPagina,
        fechaInicio: filtrosServicios.fechaInicio,
        fechaFin:
          filtrosServicios.usarRango && filtrosServicios.fechaFin
            ? filtrosServicios.fechaFin
            : undefined,
        searchTerm: filtrosServicios.searchTerm || undefined,
        soloExcedidos: filtrosServicios.soloExcedidos,
      });

      setDatosServicios(res.datos);
      setTotalRegistros(res.total);
      setTotalPaginas(res.totalPaginas);
      setNoLigadoPersonal(false);
      setErrorServicios(null);
    } catch (err: any) {
      setDatosServicios([]);
      setTotalRegistros(0);
      setTotalPaginas(1);
      if (err?.response?.status === 403) {
        setNoLigadoPersonal(true);
        setErrorServicios(
          "Tu usuario no está ligado a un registro de personal. Contacta al administrador."
        );
      } else {
        const msg = extraerMensajeErrorConsultor(
          err,
          "Ocurrió un error al cargar los servicios asignados."
        );
        setErrorServicios(msg);
        toastRef.current.error(msg);
      }
    } finally {
      setCargando(false);
    }
  }, [
    filtrosServicios.fechaInicio,
    filtrosServicios.fechaFin,
    filtrosServicios.usarRango,
    filtrosServicios.searchTerm,
    filtrosServicios.soloExcedidos,
    paginaActual,
    tamanoPagina,
  ]);

  useEffect(() => {
    if (vista === "actividades") {
      cargarActividades();
    }
  }, [vista, cargarActividades]);

  useEffect(() => {
    if (vista === "servicios") {
      cargarServicios();
    }
  }, [vista, cargarServicios]);

  // Cambiar vista: resetea paginación y limpia filtros
  const handleCambiarVisualizar = (nuevaVista: VistaConsultor) => {
    if (nuevaVista === vista) return;
    setVista(nuevaVista);
    setPaginaActual(1);
    setTotalRegistros(0);
    setTotalPaginas(1);
    setErrorActividades(null);
    setErrorServicios(null);
    setNoLigadoPersonal(false);

    const hoyStr = new Date().toISOString().split("T")[0];
    if (nuevaVista === "actividades") {
      const nf: FiltrosConsultorSesionesState = {
        visualizar: "actividades",
        fechaInicio: hoyStr,
        fechaFin: "",
        usarRango: false,
        searchTerm: "",
      };
      setFiltrosActividades(nf);
      actualizarUrl({
        nuevaVista,
        nuevosFiltrosActividades: nf,
        nuevaPagina: 1,
      });
    } else {
      const nf: FiltrosConsultorServiciosState = {
        visualizar: "servicios",
        fechaInicio: hoyStr,
        fechaFin: "",
        usarRango: false,
        searchTerm: "",
        soloExcedidos: false,
      };
      setFiltrosServicios(nf);
      actualizarUrl({ nuevaVista, nuevosFiltrosServicios: nf, nuevaPagina: 1 });
    }
  };

  const handleRecargar = () => {
    if (vista === "actividades") {
      cargarActividades();
    } else {
      cargarServicios();
    }
  };

  // --- Cargar proyectos en curso para el select del modal de actividad (§3.5) ---
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

  // --- Handlers Modal Agregar / Editar actividad (§3.5) ---
  const handleAbrirCrearActividad = () => {
    setActividadEditando(null);
    setFormActividad({
      v_Titulo: "",
      b_General: false,
      i_CveServAgendaDet: null,
      fechaInicio: hoy,
      fechaFin: hoy,
      b_TieneHorario: true,
      horaInicio: "09:00",
      horaFin: "10:00",
      v_Notas: "",
    });
    setSelectProyectoAbierto(false);
    setBusquedaProyectoSelect("");
    setModalActividadAbierto(true);
    asegurarProyectosEnCurso();
  };

  const handleAbrirEditarActividad = (item: ActividadConsultor) => {
    const fechaIniStr = item.d_FechaInicio.split("T")[0] || hoy;
    const fechaFinStr = item.d_FechaFin.split("T")[0] || fechaIniStr;
    const hIni = item.b_TieneHorario
      ? extraerHoraIso(item.d_FechaInicio) || "09:00"
      : "";
    const hFin = item.b_TieneHorario
      ? extraerHoraIso(item.d_FechaFin) || "10:00"
      : "";
    const tituloBase =
      item.v_Titulo ??
      item.v_Actividad.replace(/^(Inicio|Fin)\s*·\s*/i, "").trim();
    const notasBase = item.v_Notas ?? item.v_Descripcion ?? "";

    setActividadEditando(item);
    setFormActividad({
      v_Titulo: tituloBase.slice(0, 20),
      b_General: item.i_CveServAgendaDet == null,
      i_CveServAgendaDet: item.i_CveServAgendaDet,
      fechaInicio: fechaIniStr,
      fechaFin: fechaFinStr,
      b_TieneHorario: item.b_TieneHorario,
      horaInicio: hIni,
      horaFin: hFin,
      v_Notas: notasBase,
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
    if (tituloTrim.length > 20) {
      toast.error("El título no puede exceder 20 caracteres.");
      return;
    }
    if (!formActividad.b_General && !formActividad.i_CveServAgendaDet) {
      toast.error("Selecciona un proyecto en curso.");
      return;
    }

    if (!actividadEditando) {
      if (!formActividad.fechaInicio || !formActividad.fechaFin) {
        toast.error("Selecciona la fecha de inicio y la fecha de fin.");
        return;
      }
      if (formActividad.fechaFin < formActividad.fechaInicio) {
        toast.error("La fecha fin no puede ser menor que la fecha inicio.");
        return;
      }
      if (formActividad.b_TieneHorario) {
        if (!formActividad.horaInicio || !formActividad.horaFin) {
          toast.error("Ingresa la hora de inicio y la hora de fin.");
          return;
        }
        if (
          formActividad.fechaInicio === formActividad.fechaFin &&
          formActividad.horaFin <= formActividad.horaInicio
        ) {
          toast.error("La hora de fin debe ser mayor que la hora de inicio.");
          return;
        }
      }
    }

    const dInicioIso = formActividad.b_TieneHorario
      ? `${formActividad.fechaInicio}T${
          formActividad.horaInicio || "09:00"
        }:00`
      : `${formActividad.fechaInicio}T00:00:00`;
    const dFinIso = formActividad.b_TieneHorario
      ? `${formActividad.fechaFin}T${formActividad.horaFin || "10:00"}:00`
      : `${formActividad.fechaFin}T00:00:00`;

    const payload = {
      v_Titulo: tituloTrim,
      i_CveServAgendaDet: formActividad.b_General
        ? null
        : formActividad.i_CveServAgendaDet,
      v_Notas: formActividad.v_Notas.trim()
        ? formActividad.v_Notas.trim()
        : null,
      d_FechaInicio: actividadEditando
        ? actividadEditando.d_FechaInicio
        : dInicioIso,
      d_FechaFin: actividadEditando ? actividadEditando.d_FechaFin : dFinIso,
      b_TieneHorario: actividadEditando
        ? actividadEditando.b_TieneHorario
        : formActividad.b_TieneHorario,
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
      await cargarActividades();
    } catch (err: any) {
      toast.error(
        extraerMensajeErrorConsultor(err, "No se pudo guardar la actividad.")
      );
    } finally {
      setGuardandoActividad(false);
    }
  };

  // --- Handlers Modal Reprogramar actividad (§3.5) ---
  const handleAbrirReprogramarActividad = (item: ActividadConsultor) => {
    const fechaIniStr = item.d_FechaInicio.split("T")[0] || hoy;
    const fechaFinStr = item.d_FechaFin.split("T")[0] || fechaIniStr;
    const hIni = item.b_TieneHorario
      ? extraerHoraIso(item.d_FechaInicio) || "09:00"
      : "";
    const hFin = item.b_TieneHorario
      ? extraerHoraIso(item.d_FechaFin) || "10:00"
      : "";

    setActividadReprogramando(item);
    setFormReprogramar({
      fechaInicio: fechaIniStr,
      fechaFin: fechaFinStr,
      b_TieneHorario: item.b_TieneHorario,
      horaInicio: hIni,
      horaFin: hFin,
      v_Motivo: "",
    });
  };

  const handleCerrarReprogramarActividad = () => {
    if (guardandoReprogramar) return;
    setActividadReprogramando(null);
  };

  const handleGuardarReprogramarActividad = async () => {
    if (
      !actividadReprogramando ||
      actividadReprogramando.i_CveActividad == null
    )
      return;

    if (!formReprogramar.fechaInicio || !formReprogramar.fechaFin) {
      toast.error("Selecciona la fecha de inicio y la fecha de fin.");
      return;
    }
    if (formReprogramar.fechaFin < formReprogramar.fechaInicio) {
      toast.error("La fecha fin no puede ser menor que la fecha inicio.");
      return;
    }
    if (formReprogramar.b_TieneHorario) {
      if (!formReprogramar.horaInicio || !formReprogramar.horaFin) {
        toast.error("Ingresa la hora de inicio y la hora de fin.");
        return;
      }
      if (
        formReprogramar.fechaInicio === formReprogramar.fechaFin &&
        formReprogramar.horaFin <= formReprogramar.horaInicio
      ) {
        toast.error("La hora de fin debe ser mayor que la hora de inicio.");
        return;
      }
    }

    const dInicioIso = formReprogramar.b_TieneHorario
      ? `${formReprogramar.fechaInicio}T${formReprogramar.horaInicio}:00`
      : `${formReprogramar.fechaInicio}T00:00:00`;
    const dFinIso = formReprogramar.b_TieneHorario
      ? `${formReprogramar.fechaFin}T${formReprogramar.horaFin}:00`
      : `${formReprogramar.fechaFin}T00:00:00`;

    setGuardandoReprogramar(true);
    try {
      await ConsultorService.reprogramarActividad(
        actividadReprogramando.i_CveActividad,
        {
          d_FechaInicio: dInicioIso,
          d_FechaFin: dFinIso,
          b_TieneHorario: formReprogramar.b_TieneHorario,
          v_Motivo: formReprogramar.v_Motivo.trim()
            ? formReprogramar.v_Motivo.trim()
            : null,
        }
      );
      toast.success("Actividad reprogramada correctamente");
      setActividadReprogramando(null);
      await cargarActividades();
    } catch (err: any) {
      toast.error(
        extraerMensajeErrorConsultor(
          err,
          "No se pudo reprogramar la actividad."
        )
      );
    } finally {
      setGuardandoReprogramar(false);
    }
  };

  // --- Handlers Modal Cancelar actividad (§3.5) ---
  const handleAbrirCancelarActividad = (item: ActividadConsultor) => {
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
      await cargarActividades();
    } catch (err: any) {
      toast.error(
        extraerMensajeErrorConsultor(err, "No se pudo cancelar la actividad.")
      );
    } finally {
      setGuardandoCancelar(false);
    }
  };

  // --- Handlers Modal Historial de actividades (Ojo — §3.6) ---
  const handleAbrirHistorialActividad = async (item: ActividadConsultor) => {
    setFilaEnHistorial(item);
    setHistorialItems([]);
    setCargandoHistorial(true);
    try {
      if (item.i_CveServAgendaDet != null) {
        const res = await ConsultorService.getHistorialActividades({
          iCveServAgendaDet: item.i_CveServAgendaDet,
          incluirSesiones: true,
        });
        setHistorialItems(res);
      } else if (item.i_CveActividad != null) {
        const res = await ConsultorService.getHistorialActividades({
          iCveActividad: item.i_CveActividad,
          incluirSesiones: true,
        });
        setHistorialItems(res);
      }
    } catch (err: any) {
      toast.error(
        extraerMensajeErrorConsultor(
          err,
          "Ocurrió un error al cargar el historial de actividades."
        )
      );
    } finally {
      setCargandoHistorial(false);
    }
  };

  const handleCerrarHistorialActividad = () => {
    setFilaEnHistorial(null);
    setHistorialItems([]);
  };

  // --- Acción Confirmar terminado desde la tabla de Actividades ---
  const handleConfirmarTerminoActividad = (item: ActividadConsultor) => {
    const desc = item.v_Descripcion?.trim() || "";
    const etiqueta = desc ? `${item.v_Actividad}: ${desc}` : item.v_Actividad;

    confirmModal({
      title: `¿Confirmas que ${etiqueta} ya terminó?`,
      confirmText: "Confirmar",
      cancelText: "Cancelar",
      variant: "primary",
      onConfirm: async () => {
        try {
          if (item.v_Origen === "ACTIVIDAD") {
            if (!item.i_CveActividad) return;
            await ConsultorService.confirmarActividad(item.i_CveActividad);
            toast.success("Actividad confirmada como terminada");
            await cargarActividades();
          } else {
            if (!item.i_CveServAgendaDet) return;
            const res = await ConsultorService.confirmarTermino(
              item.i_CveServAgendaDet
            );
            if (res.exito) {
              toast.success("Servicio confirmado como terminado");
              await cargarActividades();
            } else {
              toast.error(res.mensaje || "Error al confirmar terminado");
            }
          }
        } catch (err: any) {
          toast.error(
            extraerMensajeErrorConsultor(err, "Error al confirmar terminado")
          );
        }
      },
    });
  };

  // Scroll automático al elemento actual cuando termina de cargar el historial (§3.6)
  useEffect(() => {
    if (!filaEnHistorial || cargandoHistorial || historialItems.length === 0)
      return;
    const timer = setTimeout(() => {
      nodoActualHistorialRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }, 80);
    return () => clearTimeout(timer);
  }, [filaEnHistorial, cargandoHistorial, historialItems]);

  return (
    <AppLayout>
      <div className="page-header">
        <div>
          <h1 className="page-title">Mis servicios</h1>
          <p className="subtext">
            Consulta de tus servicios y actividades asignadas como personal.
          </p>
        </div>

        <button
          className="btn btn-outline"
          onClick={handleRecargar}
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
      ) : vista === "actividades" ? (
        <>
          <FiltrosConsultorSesiones
            filtros={filtrosActividades}
            onCambiarFiltros={(nuevos) => {
              setFiltrosActividades(nuevos);
              setPaginaActual(1);
              actualizarUrl({
                nuevosFiltrosActividades: nuevos,
                nuevaPagina: 1,
              });
            }}
            onCambiarVisualizar={handleCambiarVisualizar}
            onBuscar={() => {
              setPaginaActual(1);
              actualizarUrl({ nuevaPagina: 1 });
            }}
            onAgregarActividad={handleAbrirCrearActividad}
          />

          <TablaConsultorSesiones
            datos={datosActividades}
            cargando={cargando}
            error={errorActividades}
            onVerHistorial={handleAbrirHistorialActividad}
            onConfirmarTermino={handleConfirmarTerminoActividad}
            onEditarActividad={handleAbrirEditarActividad}
            onReprogramarActividad={handleAbrirReprogramarActividad}
            onCancelarActividad={handleAbrirCancelarActividad}
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
      ) : (
        <>
          <FiltrosConsultorServicios
            filtros={filtrosServicios}
            onCambiarFiltros={(nuevos) => {
              setFiltrosServicios(nuevos);
              setPaginaActual(1);
              actualizarUrl({
                nuevosFiltrosServicios: nuevos,
                nuevaPagina: 1,
              });
            }}
            onCambiarVisualizar={handleCambiarVisualizar}
            onBuscar={() => {
              setPaginaActual(1);
              actualizarUrl({ nuevaPagina: 1 });
            }}
          />

          <TablaConsultorServicios
            datos={datosServicios}
            cargando={cargando}
            error={errorServicios}
            onVerDetalle={(item) =>
              handleAbrirModalDetalle({
                iCveAgenda: item.i_CveAgenda,
                iCveServAgendaDet: item.i_CveServAgendaDet,
              })
            }
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

      {/* Modal Detalle de Servicio (§2) */}
      <ModalDetalleServicioConsultor
        abierto={!!itemDetalle}
        iCveAgenda={itemDetalle?.iCveAgenda ?? null}
        iCveServAgendaDet={itemDetalle?.iCveServAgendaDet ?? null}
        onCerrar={handleCerrarModalDetalle}
        onGuardadoExitoso={() => {
          if (vista === "actividades") {
            cargarActividades();
          } else {
            cargarServicios();
          }
        }}
      />

      {/* ====================================================================
          MODAL "AGREGAR ACTIVIDAD" / "EDITAR ACTIVIDAD" (§3.5)
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
              {/* 1. Título * (máximo 20 caracteres, con contador n/20) */}
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
                        formActividad.v_Titulo.length >= 20
                          ? "#dc3545"
                          : "#64748b",
                    }}
                  >
                    {formActividad.v_Titulo.length}/20
                  </span>
                </div>
                <input
                  type="text"
                  maxLength={20}
                  className="form-control"
                  placeholder="Ej. Junta de avance, Salida a planta, Visita previa..."
                  value={formActividad.v_Titulo}
                  onChange={(e) =>
                    setFormActividad((prev) => ({
                      ...prev,
                      v_Titulo: e.target.value.slice(0, 20),
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

              {/* 4, 5 y 6. Fecha inicio *, Fecha fin *, ¿Tiene horario? y Hora inicio * / Hora fin *
                  (§3.5: En editar, los campos de fecha y hora se muestran deshabilitados, porque se cambian reprogramando) */}
              {(() => {
                const esEdicion = actividadEditando !== null;
                return (
                  <>
                    {/* Renglón 1: Fecha inicio y Fecha fin */}
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
                          disabled={esEdicion}
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
                            backgroundColor: esEdicion ? "#f1f5f9" : "#ffffff",
                            color: esEdicion ? "#64748b" : "#0f172a",
                            cursor: esEdicion ? "not-allowed" : "pointer",
                          }}
                        />
                      </div>

                      <div>
                        <label
                          className="form-label"
                          style={{ marginBottom: "6px" }}
                        >
                          Fecha fin <span style={{ color: "#2B8FCC" }}>*</span>
                        </label>
                        <input
                          type="date"
                          className="form-control"
                          disabled={esEdicion}
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
                            backgroundColor: esEdicion ? "#f1f5f9" : "#ffffff",
                            color: esEdicion ? "#64748b" : "#0f172a",
                            cursor: esEdicion ? "not-allowed" : "pointer",
                          }}
                        />
                      </div>
                    </div>

                    {/* Renglón 2: Checkbox ¿Tiene horario? */}
                    <div>
                      <label
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "8px",
                          cursor: esEdicion ? "not-allowed" : "pointer",
                          fontSize: "13px",
                          fontWeight: 500,
                          color: esEdicion ? "#94a3b8" : "#334155",
                          userSelect: "none",
                        }}
                      >
                        <input
                          type="checkbox"
                          disabled={esEdicion}
                          checked={formActividad.b_TieneHorario}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            setFormActividad((prev) => ({
                              ...prev,
                              b_TieneHorario: checked,
                              horaInicio: checked
                                ? prev.horaInicio || "09:00"
                                : "",
                              horaFin: checked ? prev.horaFin || "10:00" : "",
                            }));
                          }}
                          style={{
                            width: "16px",
                            height: "16px",
                            accentColor: "#2B8FCC",
                            cursor: esEdicion ? "not-allowed" : "pointer",
                          }}
                        />
                        <span>¿Tiene horario?</span>
                      </label>
                    </div>

                    {/* Renglón 3: Hora inicio y Hora fin (solo visible si tiene horario) */}
                    {formActividad.b_TieneHorario && (
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
                            Hora inicio{" "}
                            <span style={{ color: "#2B8FCC" }}>*</span>
                          </label>
                          <input
                            type="time"
                            className="form-control"
                            disabled={esEdicion}
                            value={formActividad.horaInicio}
                            onChange={(e) =>
                              setFormActividad((prev) => ({
                                ...prev,
                                horaInicio: e.target.value,
                              }))
                            }
                            style={{
                              width: "100%",
                              height: "36px",
                              fontSize: "13px",
                              borderRadius: "8px",
                              border: "1px solid #d0dce8",
                              padding: "0 10px",
                              backgroundColor: esEdicion
                                ? "#f1f5f9"
                                : "#ffffff",
                              color: esEdicion ? "#64748b" : "#0f172a",
                              cursor: esEdicion ? "not-allowed" : "pointer",
                            }}
                          />
                        </div>

                        <div>
                          <label
                            className="form-label"
                            style={{ marginBottom: "6px" }}
                          >
                            Hora fin <span style={{ color: "#2B8FCC" }}>*</span>
                          </label>
                          <input
                            type="time"
                            className="form-control"
                            disabled={esEdicion}
                            value={formActividad.horaFin}
                            onChange={(e) =>
                              setFormActividad((prev) => ({
                                ...prev,
                                horaFin: e.target.value,
                              }))
                            }
                            style={{
                              width: "100%",
                              height: "36px",
                              fontSize: "13px",
                              borderRadius: "8px",
                              border: "1px solid #d0dce8",
                              padding: "0 10px",
                              backgroundColor: esEdicion
                                ? "#f1f5f9"
                                : "#ffffff",
                              color: esEdicion ? "#64748b" : "#0f172a",
                              cursor: esEdicion ? "not-allowed" : "pointer",
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </>
                );
              })()}

              {/* 7. Notas (opcional) */}
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
          MODAL: REPROGRAMAR ACTIVIDAD (§3.5)
      ==================================================================== */}
      {actividadReprogramando && (
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
          onClick={handleCerrarReprogramarActividad}
        >
          <div
            className="modal-content no-scrollbar"
            style={{
              maxWidth: "480px",
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
                Reprogramar actividad
              </h3>
              <button
                type="button"
                className="btn-icon"
                onClick={handleCerrarReprogramarActividad}
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
                gap: "16px",
              }}
            >
              <div
                style={{
                  padding: "10px 12px",
                  borderRadius: "8px",
                  backgroundColor: "#f8fafc",
                  border: "1px solid #e2e8f0",
                  fontSize: "12.5px",
                  color: "#334155",
                }}
              >
                <strong>
                  {actividadReprogramando.v_Titulo ||
                    actividadReprogramando.v_Actividad}
                </strong>
                <span style={{ color: "#64748b", marginLeft: "8px" }}>
                  (
                  {
                    formatearFechaActividadReal(
                      actividadReprogramando.d_FechaInicio
                    ).texto
                  }{" "}
                  ·{" "}
                  {formatearHorarioActividadReal(actividadReprogramando).texto})
                </span>
              </div>

              {/* Renglón 1: Fecha inicio y Fecha fin */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
                  gap: "12px",
                }}
              >
                <div>
                  <label className="form-label" style={{ marginBottom: "6px" }}>
                    Fecha inicio <span style={{ color: "#2B8FCC" }}>*</span>
                  </label>
                  <input
                    type="date"
                    className="form-control"
                    value={formReprogramar.fechaInicio}
                    onChange={(e) => {
                      const nuevaIni = e.target.value;
                      setFormReprogramar((prev) => ({
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
                    }}
                  />
                </div>

                <div>
                  <label className="form-label" style={{ marginBottom: "6px" }}>
                    Fecha fin <span style={{ color: "#2B8FCC" }}>*</span>
                  </label>
                  <input
                    type="date"
                    className="form-control"
                    min={formReprogramar.fechaInicio || undefined}
                    value={formReprogramar.fechaFin}
                    onChange={(e) =>
                      setFormReprogramar((prev) => ({
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
                    }}
                  />
                </div>
              </div>

              {/* Renglón 2: Checkbox ¿Tiene horario? */}
              <div>
                <label
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                    cursor: "pointer",
                    fontSize: "13px",
                    fontWeight: 500,
                    color: "#334155",
                    userSelect: "none",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={formReprogramar.b_TieneHorario}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setFormReprogramar((prev) => ({
                        ...prev,
                        b_TieneHorario: checked,
                        horaInicio: checked
                          ? prev.horaInicio || "09:00"
                          : "",
                        horaFin: checked ? prev.horaFin || "10:00" : "",
                      }));
                    }}
                    style={{
                      width: "16px",
                      height: "16px",
                      accentColor: "#2B8FCC",
                      cursor: "pointer",
                    }}
                  />
                  <span>¿Tiene horario?</span>
                </label>
              </div>

              {/* Renglón 3: Hora inicio y Hora fin (solo visible si tiene horario) */}
              {formReprogramar.b_TieneHorario && (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
                    gap: "12px",
                  }}
                >
                  <div>
                    <label
                      className="form-label"
                      style={{ marginBottom: "6px" }}
                    >
                      Hora inicio <span style={{ color: "#2B8FCC" }}>*</span>
                    </label>
                    <input
                      type="time"
                      className="form-control"
                      value={formReprogramar.horaInicio}
                      onChange={(e) =>
                        setFormReprogramar((prev) => ({
                          ...prev,
                          horaInicio: e.target.value,
                        }))
                      }
                      style={{
                        width: "100%",
                        height: "36px",
                        fontSize: "13px",
                        borderRadius: "8px",
                        border: "1px solid #d0dce8",
                        padding: "0 10px",
                      }}
                    />
                  </div>

                  <div>
                    <label
                      className="form-label"
                      style={{ marginBottom: "6px" }}
                    >
                      Hora fin <span style={{ color: "#2B8FCC" }}>*</span>
                    </label>
                    <input
                      type="time"
                      className="form-control"
                      value={formReprogramar.horaFin}
                      onChange={(e) =>
                        setFormReprogramar((prev) => ({
                          ...prev,
                          horaFin: e.target.value,
                        }))
                      }
                      style={{
                        width: "100%",
                        height: "36px",
                        fontSize: "13px",
                        borderRadius: "8px",
                        border: "1px solid #d0dce8",
                        padding: "0 10px",
                      }}
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="form-label" style={{ marginBottom: "6px" }}>
                  Motivo
                </label>
                <textarea
                  rows={3}
                  className="form-control"
                  placeholder="Motivo de la reprogramación (opcional)..."
                  value={formReprogramar.v_Motivo}
                  onChange={(e) =>
                    setFormReprogramar((prev) => ({
                      ...prev,
                      v_Motivo: e.target.value,
                    }))
                  }
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
                disabled={guardandoReprogramar}
                onClick={handleCerrarReprogramarActividad}
              >
                Cerrar
              </button>
              <button
                type="button"
                className="btn btn-primary"
                disabled={guardandoReprogramar}
                style={{
                  backgroundColor: "#2B8FCC",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                }}
                onClick={handleGuardarReprogramarActividad}
              >
                {guardandoReprogramar && (
                  <Loader2 size={14} className="animate-spin" />
                )}
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
          MODAL: CANCELAR ACTIVIDAD (§3.5)
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
                ¿Deseas cancelar{" "}
                {actividadCancelando.v_Titulo ||
                  actividadCancelando.v_Actividad}
                ?
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

      {/* ====================================================================
          MODAL: HISTORIAL DE ACTIVIDADES (OJO — §3.6)
      ==================================================================== */}
      {filaEnHistorial &&
        (() => {
          // Subtítulo: SERVICIO — EMPRESA, o GENERAL si es una actividad General
          let subtituloModal = "GENERAL";
          if (filaEnHistorial.i_CveServAgendaDet != null) {
            const refConServicio =
              historialItems.find(
                (h) =>
                  (h.v_Origen === "SERVICIO" || h.v_Origen === "SESION") &&
                  h.v_Descripcion
              ) ||
              (filaEnHistorial.v_Origen === "SERVICIO" ||
              filaEnHistorial.v_Origen === "SESION"
                ? filaEnHistorial
                : null);

            const nombreSrv = refConServicio?.v_Descripcion || "";
            const nombreEmp =
              refConServicio?.v_Empresa || filaEnHistorial.v_Empresa || "";

            if (nombreSrv && nombreEmp) {
              subtituloModal = `${nombreSrv.toUpperCase()} — ${nombreEmp
                .trim()
                .toUpperCase()}`;
            } else if (nombreEmp) {
              subtituloModal = nombreEmp.trim().toUpperCase();
            } else if (nombreSrv) {
              subtituloModal = nombreSrv.toUpperCase();
            }
          }

          // Identificar índice de la actividad actual (§3.6):
          // - ACTIVIDAD: i_CveActividad + v_Momento
          // - SESION: i_CveAgendaDetalle
          // - SERVICIO: v_Momento
          const idxActual = historialItems.findIndex((el) => {
            if (
              filaEnHistorial.v_Origen === "ACTIVIDAD" &&
              el.v_Origen === "ACTIVIDAD"
            ) {
              return (
                el.i_CveActividad === filaEnHistorial.i_CveActividad &&
                el.v_Momento === filaEnHistorial.v_Momento
              );
            }
            if (
              filaEnHistorial.v_Origen === "SESION" &&
              el.v_Origen === "SESION"
            ) {
              return (
                el.i_CveAgendaDetalle === filaEnHistorial.i_CveAgendaDetalle
              );
            }
            if (
              filaEnHistorial.v_Origen === "SERVICIO" &&
              el.v_Origen === "SERVICIO"
            ) {
              return el.v_Momento === filaEnHistorial.v_Momento;
            }
            return false;
          });

          const ahoraMs = Date.now();

          return (
            <div
              className="modal-overlay"
              style={{
                position: "fixed",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: "rgba(15, 23, 42, 0.5)",
                backdropFilter: "blur(6px)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 1050,
                padding: "16px",
              }}
              onClick={handleCerrarHistorialActividad}
            >
              <div
                className="modal-content no-scrollbar"
                style={{
                  maxWidth: "580px",
                  width: "100%",
                  maxHeight: "85vh",
                  backgroundColor: "#ffffff",
                  borderRadius: "16px",
                  boxShadow: "0 20px 40px -15px rgba(15, 23, 42, 0.25)",
                  display: "flex",
                  flexDirection: "column",
                  overflow: "hidden",
                }}
                onClick={(e) => e.stopPropagation()}
              >
                {/* Encabezado (§3.6) */}
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
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                    }}
                  >
                    <div
                      style={{
                        width: "36px",
                        height: "36px",
                        borderRadius: "10px",
                        backgroundColor: "#eef6fd",
                        border: "1px solid #bae6fd",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#2B8FCC",
                      }}
                    >
                      <History size={18} />
                    </div>

                    <div>
                      <h3
                        style={{
                          fontSize: "15px",
                          fontWeight: 700,
                          color: "#0f172a",
                          margin: 0,
                        }}
                      >
                        Historial de actividades
                      </h3>
                      <p
                        style={{
                          fontSize: "12px",
                          color: "#64748b",
                          margin: "1px 0 0 0",
                          fontWeight: 500,
                        }}
                      >
                        {subtituloModal}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="btn-icon"
                    onClick={handleCerrarHistorialActividad}
                    style={{
                      padding: "6px",
                      borderRadius: "50%",
                      border: "none",
                      background: "#f8fafc",
                      color: "#64748b",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <X size={16} />
                  </button>
                </div>

                {/* Body con línea del tiempo vertical */}
                <div
                  className="modal-body no-scrollbar"
                  style={{
                    padding: "20px 24px 24px 24px",
                    flex: 1,
                    overflowY: "auto",
                    display: "flex",
                    flexDirection: "column",
                    backgroundColor: "#ffffff",
                  }}
                >
                  {cargandoHistorial ? (
                    <div
                      style={{
                        padding: "36px 0",
                        textAlign: "center",
                        color: "#64748b",
                      }}
                    >
                      <div
                        className="spinner-border text-primary mb-2"
                        style={{ width: "22px", height: "22px" }}
                      ></div>
                      <p style={{ fontSize: "12px", margin: 0 }}>
                        Cargando historial de actividades...
                      </p>
                    </div>
                  ) : historialItems.length === 0 ? (
                    <p
                      style={{
                        fontSize: "13px",
                        color: "#64748b",
                        textAlign: "center",
                        padding: "24px 0",
                        margin: 0,
                      }}
                    >
                      Sin actividades registradas.
                    </p>
                  ) : (
                    historialItems.map((el, idx) => {
                      const esActual = idx === idxActual;
                      const esUltimo = idx === historialItems.length - 1;

                      const { texto: fechaTxt } = formatearFechaActividadReal(
                        el.d_FechaInicio
                      );
                      const { texto: horarioTxt } =
                        formatearHorarioActividadReal(el);
                      const fechaHoraStr = `${fechaTxt} · ${horarioTxt}`;

                      const estatusLabel = obtenerTextoEstatusHistorial(
                        el.i_CveEstatus
                      );
                      const esCancelada = el.i_CveEstatus === 0;
                      const esReprogramada = el.i_CveEstatus === 4;

                      const finMs = el.d_FechaFin
                        ? new Date(el.d_FechaFin).getTime()
                        : 0;
                      const esPasada =
                        !esActual &&
                        !esCancelada &&
                        ((finMs > 0 && finMs < ahoraMs) ||
                          el.i_CveEstatus === 3 ||
                          esReprogramada ||
                          (idxActual >= 0 && idx < idxActual));
                      const esFutura = !esActual && !esCancelada && !esPasada;

                      let badgeStyle: React.CSSProperties = {
                        backgroundColor: "#eef6fd",
                        color: "#1d4ed8",
                        border: "1px solid #bfdbfe",
                      };
                      if (el.i_CveEstatus === 3) {
                        badgeStyle = {
                          backgroundColor: "#ecfdf5",
                          color: "#065f46",
                          border: "1px solid #a7f3d0",
                        };
                      } else if (el.i_CveEstatus === 5) {
                        badgeStyle = {
                          backgroundColor: "#ffe5d0",
                          color: "#984c0c",
                          border: "1px solid #fed7aa",
                        };
                      } else if (
                        el.i_CveEstatus === 2 ||
                        el.i_CveEstatus === 6
                      ) {
                        badgeStyle = {
                          backgroundColor: "#fef3c7",
                          color: "#92400e",
                          border: "1px solid #fde68a",
                        };
                      } else if (esReprogramada) {
                        badgeStyle = {
                          backgroundColor: "#f8fafc",
                          color: "#64748b",
                          border: "1px solid #e2e8f0",
                        };
                      } else if (esCancelada) {
                        badgeStyle = {
                          backgroundColor: "#fef2f2",
                          color: "#991b1b",
                          border: "1px solid #fecaca",
                        };
                      }

                      const lineaHaciaSiguienteEsSolida =
                        idxActual >= 0 ? idx < idxActual : esPasada;
                      const dotSize = esActual ? 24 : 20;

                      return (
                        <div
                          key={`hist-el-${el.v_Origen}-${el.v_Momento}-${
                            el.i_CveActividad ??
                            el.i_CveAgendaDetalle ??
                            el.i_CveServAgendaDet ??
                            idx
                          }-${idx}`}
                          ref={esActual ? nodoActualHistorialRef : undefined}
                          style={{
                            display: "flex",
                            position: "relative",
                            paddingBottom: esUltimo ? "0px" : "20px",
                          }}
                        >
                          {/* Línea vertical conectora (sólida hasta la actual, punteada después) */}
                          {!esUltimo && (
                            <div
                              style={{
                                position: "absolute",
                                top: `${dotSize + 2}px`,
                                left: esActual ? "11px" : "9px",
                                bottom: "0px",
                                width: 0,
                                borderLeft: lineaHaciaSiguienteEsSolida
                                  ? "2px solid #94a3b8"
                                  : "2px dashed #cbd5e1",
                                zIndex: 0,
                              }}
                            />
                          )}

                          {/* Círculo indicador según momento (§3.6) */}
                          <div
                            style={{
                              position: "relative",
                              zIndex: 1,
                              width: `${dotSize}px`,
                              height: `${dotSize}px`,
                              borderRadius: "50%",
                              backgroundColor: esCancelada
                                ? "#94a3b8"
                                : esActual
                                ? "#2B8FCC"
                                : esPasada
                                ? "#10b981"
                                : "#ffffff",
                              border: esCancelada
                                ? "1.5px solid #94a3b8"
                                : esActual
                                ? "1.5px solid #2B8FCC"
                                : esPasada
                                ? "1.5px solid #10b981"
                                : "1.5px solid #cbd5e1",
                              color: "#ffffff",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              flexShrink: 0,
                              boxShadow: esActual
                                ? "0 0 0 4px rgba(43, 143, 204, 0.22)"
                                : "none",
                              marginTop: esActual ? "8px" : "2px",
                            }}
                          >
                            {esCancelada ? (
                              <X size={11} strokeWidth={2.5} />
                            ) : esActual || esPasada ? (
                              <Check
                                size={esActual ? 12 : 11}
                                strokeWidth={2.5}
                              />
                            ) : null}
                          </div>

                          {/* Bloque de contenido del elemento */}
                          <div
                            style={{
                              marginLeft: "14px",
                              flex: 1,
                              display: "flex",
                              flexDirection: "column",
                              gap: "2px",
                              padding: esActual ? "8px 12px" : "0px",
                              borderRadius: esActual ? "10px" : undefined,
                              backgroundColor: esActual
                                ? "#f0f7ff"
                                : "transparent",
                              border: esActual
                                ? "1px solid #bae6fd"
                                : "1px solid transparent",
                            }}
                          >
                            {/* 1. Fecha y horario */}
                            <span
                              style={{
                                fontSize: "11px",
                                color: "#94a3b8",
                                fontWeight: 500,
                              }}
                            >
                              {fechaHoraStr}
                            </span>

                            {/* 2. v_Actividad en negritas + Badge de estatus */}
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                                flexWrap: "wrap",
                              }}
                            >
                              <span
                                style={{
                                  fontSize: "14px",
                                  fontWeight: 700,
                                  color: esCancelada
                                    ? "#94a3b8"
                                    : esActual
                                    ? "#2B8FCC"
                                    : esFutura
                                    ? "#94a3b8"
                                    : "#1e293b",
                                  textDecoration: esCancelada
                                    ? "line-through"
                                    : "none",
                                }}
                              >
                                {el.v_Actividad}
                              </span>

                              <span
                                style={{
                                  fontSize: "10px",
                                  fontWeight: 600,
                                  padding: "1px 7px",
                                  borderRadius: "8px",
                                  ...badgeStyle,
                                }}
                              >
                                {estatusLabel}
                              </span>
                            </div>

                            {/* 3. v_Descripcion debajo */}
                            {el.v_Descripcion && el.v_Descripcion.trim() && (
                              <span
                                style={{
                                  fontSize: "12.5px",
                                  color: esCancelada || esFutura
                                    ? "#94a3b8"
                                    : "#475569",
                                  lineHeight: 1.35,
                                }}
                              >
                                {el.v_Descripcion}
                              </span>
                            )}

                            {/* 4. Si es reprogramada: Reprogramada al dd de mmm, aaaa + v_Motivo */}
                            {esReprogramada && (
                              <div
                                style={{
                                  fontSize: "11.5px",
                                  color: "#64748b",
                                  marginTop: "2px",
                                  display: "flex",
                                  flexDirection: "column",
                                  gap: "1px",
                                }}
                              >
                                <span>
                                  {el.d_FechaReprogramada
                                    ? `Reprogramada al ${formatearFechaLargaEs(
                                        el.d_FechaReprogramada
                                      )}`
                                    : "Reprogramada"}
                                </span>
                                {el.v_Motivo && (
                                  <span>Motivo: {el.v_Motivo}</span>
                                )}
                              </div>
                            )}

                            {/* 5. Si es cancelada: v_Motivo */}
                            {esCancelada && el.v_Motivo && (
                              <div
                                style={{
                                  fontSize: "11.5px",
                                  color: "#64748b",
                                  marginTop: "2px",
                                }}
                              >
                                <span>Motivo: {el.v_Motivo}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Footer con Cerrar */}
                <div
                  className="modal-footer shrink-0"
                  style={{
                    padding: "14px 24px",
                    borderTop: "1px solid #f1f5f9",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "flex-end",
                    background: "#ffffff",
                  }}
                >
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={handleCerrarHistorialActividad}
                    style={{
                      height: "34px",
                      padding: "0 20px",
                      fontSize: "12px",
                      fontWeight: 600,
                      borderRadius: "8px",
                      backgroundColor: "#ffffff",
                      borderColor: "#cbd5e1",
                      color: "#334155",
                    }}
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            </div>
          );
        })()}
    </AppLayout>
  );
}

export default function MisServiciosPage() {
  return (
    <Suspense
      fallback={
        <div className="p-4 text-sm text-slate-500">
          Cargando mis servicios...
        </div>
      }
    >
      <MisServiciosContent />
    </Suspense>
  );
}
