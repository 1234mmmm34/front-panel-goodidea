"use client";

import React, { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { RefreshCw } from "lucide-react";
import { AgendaServicioGetDto, OrdenCliente } from "@/types/servicios";
import { AgendaGetDto } from "@/types/calendario";
import { AgendaService } from "@/services/agenda.service";
import { AppLayout } from "@/components/layout/AppLayout";
import { PaginadorCustom } from "@/components/ui/PaginadorCustom";
import { ModalConfirmarEliminar } from "@/components/ui/ModalConfirmarEliminar";
import { FiltrosAgendaServicios, FiltrosState as FiltrosServiciosState } from "@/components/programacion/FiltrosAgendaServicios";
import { TablaAgendaServicios } from "@/components/programacion/TablaAgendaServicios";
import { FiltrosAgendaSesiones, FiltrosSesionesState } from "@/components/programacion/FiltrosAgendaSesiones";
import { TablaAgendaSesiones } from "@/components/programacion/TablaAgendaSesiones";
import { ModalFormServicio } from "@/components/servicios/ModalFormServicio";
import { ModalDetalleServicio } from "@/components/programacion/ModalDetalleServicio";
import { ModalAgendaServicio } from "@/components/programacion/ModalAgendaServicio";
import { ModalReprogramarSesion } from "@/components/programacion/ModalReprogramarSesion";
import { ModalCancelarSesion } from "@/components/programacion/ModalCancelarSesion";
import { ModalLineaTiempoSesiones } from "@/components/programacion/ModalLineaTiempoSesiones";

import { useToast } from "@/context/ToastContext";

function ProgramacionContent() {
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Lectura de query params (§2.1)
  const paramVista = searchParams.get("vista");
  const paramProg = searchParams.get("programacion");
  const paramFact = searchParams.get("facturacion");
  const paramDesde = searchParams.get("desde");
  const paramHasta = searchParams.get("hasta");
  const paramQ = searchParams.get("q");
  const paramPagina = searchParams.get("pagina");
  const paramDetalle = searchParams.get("detalle");
  const paramEmp = searchParams.get("emp");
  const paramOrd = searchParams.get("ord");

  const parseEmpresasParam = (val: string | null): number[] | null => {
    if (val === null || val.trim() === "") return null;
    if (val.trim() === "0") return [];
    const ids = val
      .split(",")
      .map((s) => parseInt(s.trim(), 10))
      .filter((n) => !isNaN(n) && n > 0);
    return ids;
  };

  const parseOrdenParam = (val: string | null): OrdenCliente => {
    return val === "ASC" || val === "DESC" ? val : null;
  };

  const parseFiltroColumnaParam = (val: string | null): string[] | null => {
    if (val === null || val.trim() === "") return null;
    if (val.trim() === "~") return [];
    return val.split("|").filter((s) => s.length > 0);
  };

  type FiltrosColumnaSesionesState = {
    estatus: string[] | null;
    servicio: string[] | null;
    tipo: string[] | null;
    titular: string[] | null;
  };

  type FiltrosColumnaServiciosState = {
    servicio: string[] | null;
    tipo: string[] | null;
    estatus: string[] | null;
    titular: string[] | null;
    cotizacion: string[] | null;
    oc: string[] | null;
    factura: string[] | null;
  };

  const filtrosColumnaSesionesVacios: FiltrosColumnaSesionesState = {
    estatus: null,
    servicio: null,
    tipo: null,
    titular: null,
  };

  const filtrosColumnaServiciosVacios: FiltrosColumnaServiciosState = {
    servicio: null,
    tipo: null,
    estatus: null,
    titular: null,
    cotizacion: null,
    oc: null,
    factura: null,
  };

  const hoy = useMemo(() => new Date().toISOString().split("T")[0], []);

  // Selector "Visualizar" (default: "sesiones")
  const [vista, setVista] = useState<"sesiones" | "servicios">(() => {
    return paramVista === "servicios" ? "servicios" : "sesiones";
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

  // --- ESTADO VISTA SESIONES ---
  const [datosSesiones, setDatosSesiones] = useState<AgendaGetDto[]>([]);
  const [filtrosSesiones, setFiltrosSesiones] = useState<FiltrosSesionesState>(() => ({
    visualizar: "sesiones",
    fechaInicio: paramDesde !== null && paramDesde !== undefined ? paramDesde : hoy,
    fechaFin: paramHasta || "",
    usarRango: Boolean(paramHasta),
    searchTerm: paramQ || "",
  }));
  const [itemReprogramar, setItemReprogramar] = useState<AgendaGetDto | null>(null);
  const [itemCancelar, setItemCancelar] = useState<AgendaGetDto | null>(null);
  const [itemHistorial, setItemHistorial] = useState<AgendaGetDto | null>(null);
  const [empresasSesiones, setEmpresasSesiones] = useState<number[] | null>(() =>
    paramVista !== "servicios" ? parseEmpresasParam(paramEmp) : null
  );
  const [ordenClienteSesiones, setOrdenClienteSesiones] = useState<OrdenCliente>(() =>
    paramVista !== "servicios" ? parseOrdenParam(paramOrd) : null
  );
  const [filtrosColumnaSesiones, setFiltrosColumnaSesiones] =
    useState<FiltrosColumnaSesionesState>(() =>
      paramVista !== "servicios"
        ? {
            estatus: parseFiltroColumnaParam(searchParams.get("f_estatus")),
            servicio: parseFiltroColumnaParam(searchParams.get("f_servicio")),
            tipo: parseFiltroColumnaParam(searchParams.get("f_tipo")),
            titular: parseFiltroColumnaParam(searchParams.get("f_titular")),
          }
        : filtrosColumnaSesionesVacios
    );

  // --- ESTADO VISTA SERVICIOS ---
  const [datosServicios, setDatosServicios] = useState<AgendaServicioGetDto[]>([]);
  const [filtrosServicios, setFiltrosServicios] = useState<FiltrosServiciosState>(() => ({
    programacion: paramProg === "pendientes" ? "pendientes" : "programados",
    facturacion: paramFact === "facturado" || paramFact === "pendiente" ? paramFact : "todos",
    fechaInicio: paramDesde !== null && paramDesde !== undefined ? paramDesde : hoy,
    fechaFin: paramHasta || "",
    usarRango: Boolean(paramHasta),
    searchTerm: paramQ || "",
  }));
  const [empresasServicios, setEmpresasServicios] = useState<number[] | null>(() =>
    paramVista === "servicios" ? parseEmpresasParam(paramEmp) : null
  );
  const [ordenClienteServicios, setOrdenClienteServicios] = useState<OrdenCliente>(() =>
    paramVista === "servicios" ? parseOrdenParam(paramOrd) : null
  );
  const [filtrosColumnaServicios, setFiltrosColumnaServicios] =
    useState<FiltrosColumnaServiciosState>(() =>
      paramVista === "servicios"
        ? {
            servicio: parseFiltroColumnaParam(searchParams.get("f_servicio")),
            tipo: parseFiltroColumnaParam(searchParams.get("f_tipo")),
            estatus: parseFiltroColumnaParam(searchParams.get("f_estatus")),
            titular: parseFiltroColumnaParam(searchParams.get("f_titular")),
            cotizacion: parseFiltroColumnaParam(searchParams.get("f_cotizacion")),
            oc: parseFiltroColumnaParam(searchParams.get("f_oc")),
            factura: parseFiltroColumnaParam(searchParams.get("f_factura")),
          }
        : filtrosColumnaServiciosVacios
    );
  const [modalFormAbierto, setModalFormAbierto] = useState<boolean>(false);
  const [modalAgendaAbierto, setModalAgendaAbierto] = useState<boolean>(false);
  const [itemEliminar, setItemEliminar] = useState<AgendaServicioGetDto | null>(null);
  const [eliminando, setEliminando] = useState<boolean>(false);
  const [itemDetalle, setItemDetalle] = useState<AgendaServicioGetDto | null>(null);

  // Helper para mantener URL en sincronía con replace sin llenar el historial (§2.1)
  const actualizarUrl = useCallback(
    (cambios: {
      nuevaVista?: "sesiones" | "servicios";
      nuevosFiltrosSesiones?: FiltrosSesionesState;
      nuevosFiltrosServicios?: FiltrosServiciosState;
      nuevaPagina?: number;
      detalleId?: number | null;
      nuevasEmpresas?: number[] | null;
      nuevoOrdenCliente?: OrdenCliente;
      nuevosFiltrosColumnaSesiones?: FiltrosColumnaSesionesState;
      nuevosFiltrosColumnaServicios?: FiltrosColumnaServiciosState;
    }) => {
      const targetVista = cambios.nuevaVista ?? vista;
      const targetPagina = cambios.nuevaPagina ?? paginaActual;
      const targetDetalle =
        cambios.detalleId !== undefined
          ? cambios.detalleId
          : itemDetalle?.i_CveServAgendaDet ?? null;
      const targetEmp =
        cambios.nuevasEmpresas !== undefined
          ? cambios.nuevasEmpresas
          : targetVista === "servicios"
          ? empresasServicios
          : empresasSesiones;
      const targetOrd =
        cambios.nuevoOrdenCliente !== undefined
          ? cambios.nuevoOrdenCliente
          : targetVista === "servicios"
          ? ordenClienteServicios
          : ordenClienteSesiones;

      const params = new URLSearchParams();
      params.set("vista", targetVista);

      if (targetVista === "servicios") {
        const fs = cambios.nuevosFiltrosServicios ?? filtrosServicios;
        if (fs.programacion) params.set("programacion", fs.programacion);
        if (fs.facturacion) params.set("facturacion", fs.facturacion);
        if (fs.fechaInicio) params.set("desde", fs.fechaInicio);
        if (fs.usarRango && fs.fechaFin) params.set("hasta", fs.fechaFin);
        if (fs.searchTerm && fs.searchTerm.trim() !== "") params.set("q", fs.searchTerm.trim());

        const fCol = cambios.nuevosFiltrosColumnaServicios ?? filtrosColumnaServicios;
        for (const [col, val] of Object.entries(fCol)) {
          if (Array.isArray(val)) {
            params.set(`f_${col}`, val.length > 0 ? val.join("|") : "~");
          }
        }
      } else {
        const fses = cambios.nuevosFiltrosSesiones ?? filtrosSesiones;
        if (fses.fechaInicio) params.set("desde", fses.fechaInicio);
        if (fses.usarRango && fses.fechaFin) params.set("hasta", fses.fechaFin);
        if (fses.searchTerm && fses.searchTerm.trim() !== "") params.set("q", fses.searchTerm.trim());

        const fCol = cambios.nuevosFiltrosColumnaSesiones ?? filtrosColumnaSesiones;
        for (const [col, val] of Object.entries(fCol)) {
          if (Array.isArray(val)) {
            params.set(`f_${col}`, val.length > 0 ? val.join("|") : "~");
          }
        }
      }

      if (Array.isArray(targetEmp)) {
        params.set("emp", targetEmp.length > 0 ? targetEmp.join(",") : "0");
      }
      if (targetOrd) {
        params.set("ord", targetOrd);
      }

      if (targetPagina > 1) {
        params.set("pagina", String(targetPagina));
      }

      if (targetDetalle) {
        params.set("detalle", String(targetDetalle));
      }

      const qs = params.toString();
      const url = qs ? `/programacion?${qs}` : `/programacion`;
      router.replace(url, { scroll: false });
    },
    [
      vista,
      paginaActual,
      itemDetalle,
      filtrosServicios,
      filtrosSesiones,
      empresasServicios,
      ordenClienteServicios,
      filtrosColumnaServicios,
      empresasSesiones,
      ordenClienteSesiones,
      filtrosColumnaSesiones,
      router,
    ]
  );

  // Abrir y cerrar modal de detalle actualizando query param "detalle"
  const handleAbrirModalDetalle = (item: AgendaServicioGetDto) => {
    setItemDetalle(item);
    actualizarUrl({ detalleId: item.i_CveServAgendaDet });
  };

  const handleCerrarModalDetalle = () => {
    setItemDetalle(null);
    actualizarUrl({ detalleId: null });
  };

  // --- Cargar datos de Sesiones ---
  const cargarSesiones = useCallback(async () => {
    setCargando(true);
    const res = await AgendaService.getAgenda({
      fechaInicio: filtrosSesiones.fechaInicio,
      fechaFin: filtrosSesiones.usarRango && filtrosSesiones.fechaFin ? filtrosSesiones.fechaFin : undefined,
      pagina: paginaActual,
      tamano: tamanoPagina,
      searchTerm: filtrosSesiones.searchTerm || undefined,
      empresas: empresasSesiones,
      ordenCliente: ordenClienteSesiones,
      estatus: filtrosColumnaSesiones.estatus,
      servicios: filtrosColumnaSesiones.servicio,
      tiposServicio: filtrosColumnaSesiones.tipo,
      titulares: filtrosColumnaSesiones.titular,
    });

    setDatosSesiones(res.datos);
    setTotalRegistros(res.total);
    setTotalPaginas(res.totalPaginas);
    setCargando(false);
  }, [filtrosSesiones, paginaActual, tamanoPagina, empresasSesiones, ordenClienteSesiones, filtrosColumnaSesiones]);

  // --- Cargar datos de Servicios ---
  const cargarServicios = useCallback(async () => {
    setCargando(true);

    let facturadoVal: number | undefined;
    if (filtrosServicios.facturacion === "facturado") facturadoVal = 1;
    if (filtrosServicios.facturacion === "pendiente") facturadoVal = 0;

    const res = await AgendaService.getAgendaServicios({
      soloSinProgramar: filtrosServicios.programacion === "pendientes",
      pagina: paginaActual,
      tamano: tamanoPagina,
      fechaInicio: filtrosServicios.programacion === "programados" ? filtrosServicios.fechaInicio : undefined,
      fechaFin:
        filtrosServicios.programacion === "programados" && filtrosServicios.usarRango && filtrosServicios.fechaFin
          ? filtrosServicios.fechaFin
          : undefined,
      searchTerm: filtrosServicios.searchTerm || undefined,
      facturado: facturadoVal,
      empresas: empresasServicios,
      ordenCliente: ordenClienteServicios,
      servicios: filtrosColumnaServicios.servicio,
      tiposServicio: filtrosColumnaServicios.tipo,
      estatus: filtrosColumnaServicios.estatus,
      titulares: filtrosColumnaServicios.titular,
      cotizaciones: filtrosColumnaServicios.cotizacion,
      ocs: filtrosColumnaServicios.oc,
      facturas: filtrosColumnaServicios.factura,
    });

    setDatosServicios(res.datos);
    setTotalRegistros(res.total);
    setTotalPaginas(res.totalPaginas);
    setCargando(false);
  }, [filtrosServicios, paginaActual, tamanoPagina, empresasServicios, ordenClienteServicios, filtrosColumnaServicios]);

  // --- Cargar opciones de empresas para filtro de columna Cliente ---
  const cargarOpcionesEmpresasSesiones = useCallback(async () => {
    const lista = await AgendaService.getEmpresasFiltro({
      vista: "sesiones",
      fechaInicio: filtrosSesiones.fechaInicio,
      fechaFin:
        filtrosSesiones.usarRango && filtrosSesiones.fechaFin
          ? filtrosSesiones.fechaFin
          : undefined,
      searchTerm: filtrosSesiones.searchTerm || undefined,
    });
    return lista.map((e) => ({
      valor: e.i_CveEmpresa,
      etiqueta: e.v_Empresa,
    }));
  }, [filtrosSesiones]);

  const cargarOpcionesEmpresasServicios = useCallback(async () => {
    let facturadoVal: number | undefined;
    if (filtrosServicios.facturacion === "facturado") facturadoVal = 1;
    if (filtrosServicios.facturacion === "pendiente") facturadoVal = 0;

    const lista = await AgendaService.getEmpresasFiltro({
      vista: "servicios",
      soloSinProgramar: filtrosServicios.programacion === "pendientes",
      fechaInicio:
        filtrosServicios.programacion === "programados"
          ? filtrosServicios.fechaInicio
          : undefined,
      fechaFin:
        filtrosServicios.programacion === "programados" &&
        filtrosServicios.usarRango &&
        filtrosServicios.fechaFin
          ? filtrosServicios.fechaFin
          : undefined,
      searchTerm: filtrosServicios.searchTerm || undefined,
      facturado: facturadoVal,
    });
    return lista.map((e) => ({
      valor: e.i_CveEmpresa,
      etiqueta: e.v_Empresa,
    }));
  }, [filtrosServicios]);

  // --- Cargar opciones de filtros de columna (Sesiones y Servicios) ---
  const cargarOpciones = useCallback(
    async (targetVista: "sesiones" | "servicios", columna: string) => {
      if (targetVista === "sesiones") {
        const lista = await AgendaService.getValoresFiltro({
          vista: "sesiones",
          columna,
          fechaInicio: filtrosSesiones.fechaInicio,
          fechaFin:
            filtrosSesiones.usarRango && filtrosSesiones.fechaFin
              ? filtrosSesiones.fechaFin
              : undefined,
          searchTerm: filtrosSesiones.searchTerm || undefined,
        });
        return lista.map((item) => ({
          valor: item.v_Valor,
          etiqueta: item.v_Texto,
        }));
      }

      let facturadoVal: number | undefined;
      if (filtrosServicios.facturacion === "facturado") facturadoVal = 1;
      if (filtrosServicios.facturacion === "pendiente") facturadoVal = 0;

      const lista = await AgendaService.getValoresFiltro({
        vista: "servicios",
        columna,
        soloSinProgramar: filtrosServicios.programacion === "pendientes",
        fechaInicio:
          filtrosServicios.programacion === "programados"
            ? filtrosServicios.fechaInicio
            : undefined,
        fechaFin:
          filtrosServicios.programacion === "programados" &&
          filtrosServicios.usarRango &&
          filtrosServicios.fechaFin
            ? filtrosServicios.fechaFin
            : undefined,
        searchTerm: filtrosServicios.searchTerm || undefined,
        facturado: facturadoVal,
      });
      return lista.map((item) => ({
        valor: item.v_Valor,
        etiqueta: item.v_Texto,
      }));
    },
    [filtrosSesiones, filtrosServicios]
  );

  const crearConfigFiltroSesiones = (col: keyof FiltrosColumnaSesionesState) => ({
    cargarOpciones: () => cargarOpciones("sesiones", col),
    seleccionados: filtrosColumnaSesiones[col],
    onAplicar: (seleccionados: string[] | null) => {
      const nuevos = { ...filtrosColumnaSesiones, [col]: seleccionados };
      setFiltrosColumnaSesiones(nuevos);
      setPaginaActual(1);
      actualizarUrl({
        nuevaPagina: 1,
        nuevosFiltrosColumnaSesiones: nuevos,
      });
    },
  });

  const crearConfigFiltroServicios = (col: keyof FiltrosColumnaServiciosState) => ({
    cargarOpciones: () => cargarOpciones("servicios", col),
    seleccionados: filtrosColumnaServicios[col],
    onAplicar: (seleccionados: string[] | null) => {
      const nuevos = { ...filtrosColumnaServicios, [col]: seleccionados };
      setFiltrosColumnaServicios(nuevos);
      setPaginaActual(1);
      actualizarUrl({
        nuevaPagina: 1,
        nuevosFiltrosColumnaServicios: nuevos,
      });
    },
  });

  // Trigger de carga al cambiar vista o parámetros
  useEffect(() => {
    if (vista === "sesiones") {
      cargarSesiones();
    } else {
      cargarServicios();
    }
  }, [vista, cargarSesiones, cargarServicios]);

  // Auto-apertura del modal si viene "detalle" en la URL al cargar la tabla (§2.1)
  const modalYaAbiertoParaDetalleRef = useRef<string | null>(null);

  useEffect(() => {
    if (!cargando && paramDetalle) {
      if (modalYaAbiertoParaDetalleRef.current !== paramDetalle) {
        modalYaAbiertoParaDetalleRef.current = paramDetalle;
        const detalleId = Number(paramDetalle);
        if (detalleId) {
          if (vista === "servicios") {
            const encontrado = datosServicios.find((s) => s.i_CveServAgendaDet === detalleId);
            setItemDetalle(
              encontrado ||
                ({
                  i_CveAgenda: 0,
                  i_CveServAgendaDet: detalleId,
                } as AgendaServicioGetDto)
            );
          } else {
            const sesionMatch = datosSesiones.find((s) => s.i_CveServAgendaDet === detalleId);
            setItemDetalle({
              i_CveAgenda: sesionMatch?.i_CveAgenda ?? 0,
              i_CveServAgendaDet: detalleId,
            } as AgendaServicioGetDto);
          }
        }
      }
    } else if (!paramDetalle) {
      modalYaAbiertoParaDetalleRef.current = null;
      if (itemDetalle) {
        setItemDetalle(null);
      }
    }
  }, [cargando, paramDetalle, itemDetalle, vista, datosServicios, datosSesiones]);

  // Cambiar vista: resetea paginación y limpia filtros
  const handleCambiarVisualizar = (nuevaVista: "sesiones" | "servicios") => {
    setVista(nuevaVista);
    setPaginaActual(1);
    setFiltrosColumnaSesiones(filtrosColumnaSesionesVacios);
    setFiltrosColumnaServicios(filtrosColumnaServiciosVacios);

    const hoyStr = new Date().toISOString().split("T")[0];
    if (nuevaVista === "sesiones") {
      const nf: FiltrosSesionesState = {
        visualizar: "sesiones",
        fechaInicio: hoyStr,
        fechaFin: "",
        usarRango: false,
        searchTerm: "",
      };
      setFiltrosSesiones(nf);
      setEmpresasSesiones(null);
      setOrdenClienteSesiones(null);
      actualizarUrl({
        nuevaVista,
        nuevosFiltrosSesiones: nf,
        nuevaPagina: 1,
        nuevasEmpresas: null,
        nuevoOrdenCliente: null,
        nuevosFiltrosColumnaSesiones: filtrosColumnaSesionesVacios,
      });
    } else {
      const nf: FiltrosServiciosState = {
        programacion: "programados",
        facturacion: "todos",
        fechaInicio: hoyStr,
        fechaFin: "",
        usarRango: false,
        searchTerm: "",
      };
      setFiltrosServicios(nf);
      setEmpresasServicios(null);
      setOrdenClienteServicios(null);
      actualizarUrl({
        nuevaVista,
        nuevosFiltrosServicios: nf,
        nuevaPagina: 1,
        nuevasEmpresas: null,
        nuevoOrdenCliente: null,
        nuevosFiltrosColumnaServicios: filtrosColumnaServiciosVacios,
      });
    }
  };

  const handleRecargar = () => {
    if (vista === "sesiones") {
      cargarSesiones();
    } else {
      cargarServicios();
    }
  };

  const handleConfirmarEliminarServicio = async () => {
    if (!itemEliminar) return;
    setEliminando(true);
    const exito = await AgendaService.deleteAgenda(itemEliminar.i_CveAgenda);
    setEliminando(false);
    setItemEliminar(null);

    if (exito) {
      toast.success("Agenda eliminada exitosamente");
      cargarServicios();
    } else {
      toast.error("Ocurrió un error al intentar eliminar la agenda.");
    }
  };

  return (
    <AppLayout>
      <div className="page-header">
        <div>
          <h1 className="page-title">
            Programación
          </h1>

          <p className="subtext">
            Administración de servicios agendados, estados financieros y entregables.
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

      {vista === "sesiones" ? (
        <>
          <FiltrosAgendaSesiones
            filtros={filtrosSesiones}
            onCambiarFiltros={(nuevos) => {
              setFiltrosSesiones(nuevos);
              setPaginaActual(1);
              actualizarUrl({ nuevosFiltrosSesiones: nuevos, nuevaPagina: 1 });
            }}
            onCambiarVisualizar={handleCambiarVisualizar}
            onBuscar={() => {
              setPaginaActual(1);
              actualizarUrl({ nuevaPagina: 1 });
            }}
            onNuevo={() => setModalAgendaAbierto(true)}
          />

          <TablaAgendaSesiones
            datos={datosSesiones}
            cargando={cargando}
            onReprogramar={(item) => setItemReprogramar(item)}
            onCancelar={(item) => setItemCancelar(item)}
            onVerHistorial={(item) => setItemHistorial(item)}
            filtroCliente={{
              cargarOpciones: cargarOpcionesEmpresasSesiones,
              seleccionados: empresasSesiones,
              orden: ordenClienteSesiones,
              onAplicar: (seleccionados, orden) => {
                setEmpresasSesiones(seleccionados);
                setOrdenClienteSesiones(orden);
                setPaginaActual(1);
                actualizarUrl({
                  nuevaPagina: 1,
                  nuevasEmpresas: seleccionados,
                  nuevoOrdenCliente: orden,
                });
              },
            }}
            filtrosColumna={{
              estatus: crearConfigFiltroSesiones("estatus"),
              servicio: crearConfigFiltroSesiones("servicio"),
              tipo: crearConfigFiltroSesiones("tipo"),
              titular: crearConfigFiltroSesiones("titular"),
            }}
          />
        </>
      ) : (
        <>
          <FiltrosAgendaServicios
            filtros={filtrosServicios}
            onCambiarFiltros={(nuevos) => {
              setFiltrosServicios(nuevos);
              setPaginaActual(1);
              actualizarUrl({ nuevosFiltrosServicios: nuevos, nuevaPagina: 1 });
            }}
            onCambiarVisualizar={handleCambiarVisualizar}
            onBuscar={() => {
              setPaginaActual(1);
              actualizarUrl({ nuevaPagina: 1 });
            }}
            onNuevo={() => setModalAgendaAbierto(true)}
          />

          <TablaAgendaServicios
            datos={datosServicios}
            cargando={cargando}
            onVerDetalle={(item) => handleAbrirModalDetalle(item)}
            onEliminar={(item) => setItemEliminar(item)}
            filtroCliente={{
              cargarOpciones: cargarOpcionesEmpresasServicios,
              seleccionados: empresasServicios,
              orden: ordenClienteServicios,
              onAplicar: (seleccionados, orden) => {
                setEmpresasServicios(seleccionados);
                setOrdenClienteServicios(orden);
                setPaginaActual(1);
                actualizarUrl({
                  nuevaPagina: 1,
                  nuevasEmpresas: seleccionados,
                  nuevoOrdenCliente: orden,
                });
              },
            }}
            filtrosColumna={{
              servicio: crearConfigFiltroServicios("servicio"),
              tipo: crearConfigFiltroServicios("tipo"),
              estatus: crearConfigFiltroServicios("estatus"),
              titular: crearConfigFiltroServicios("titular"),
              cotizacion: crearConfigFiltroServicios("cotizacion"),
              oc: crearConfigFiltroServicios("oc"),
              factura: crearConfigFiltroServicios("factura"),
            }}
          />
        </>
      )}

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

      {/* Modal Línea Temporal de Sesiones (Vista Sesiones) */}
      <ModalLineaTiempoSesiones
        abierto={!!itemHistorial}
        iCveAgenda={itemHistorial?.i_CveAgenda ?? null}
        iCveServAgendaDet={itemHistorial?.i_CveServAgendaDet ?? null}
        iCveAgendaDetalleResaltar={itemHistorial?.i_CveAgendaDetalle ?? null}
        onCerrar={() => setItemHistorial(null)}
      />

      {/* Modal Reprogramar Sesión (Vista Sesiones) */}
      <ModalReprogramarSesion
        abierto={!!itemReprogramar}
        onCerrar={() => setItemReprogramar(null)}
        iCveAgenda={itemReprogramar?.i_CveAgenda ?? null}
        iCveServAgendaDet={itemReprogramar?.i_CveServAgendaDet ?? null}
        iCveAgendaDetalle={itemReprogramar?.i_CveAgendaDetalle ?? null}
        onReprogramacionExitosa={() => {
          setItemReprogramar(null);
          cargarSesiones();
        }}
      />

      {/* Modal Cancelar Sesión (Vista Sesiones) */}
      <ModalCancelarSesion
        abierto={!!itemCancelar}
        item={itemCancelar}
        onCerrar={() => setItemCancelar(null)}
        onConfirmarExito={() => {
          setItemCancelar(null);
          cargarSesiones();
        }}
      />

      {/* Modal Confirmar Eliminar (Vista Servicios) */}
      <ModalConfirmarEliminar
        abierto={!!itemEliminar}
        nombreElemento={itemEliminar?.v_Servicio || "este servicio agendado"}
        onCerrar={() => setItemEliminar(null)}
        onConfirmar={handleConfirmarEliminarServicio}
        cargando={eliminando}
      />

      {/* Modal Detalle de Servicio (Vista Servicios o Sesiones) */}
      <ModalDetalleServicio
        abierto={!!itemDetalle}
        iCveAgenda={itemDetalle?.i_CveAgenda ?? null}
        iCveServAgendaDet={itemDetalle?.i_CveServAgendaDet ?? null}
        onCerrar={handleCerrarModalDetalle}
        onGuardadoExitoso={() => {
          if (vista === "servicios") {
            cargarServicios();
          } else {
            cargarSesiones();
          }
        }}
      />

      {/* Modal Formulario de Servicio (Vista Servicios) */}
      <ModalFormServicio
        abierto={modalFormAbierto}
        servicioEditar={null}
        onCerrar={() => setModalFormAbierto(false)}
        onGuardadoExitoso={() => {
          setModalFormAbierto(false);
          cargarServicios();
        }}
      />

      {/* Modal Agendar Servicio (Wizard Parte 1 & 2 - Vista Servicios) */}
      <ModalAgendaServicio
        abierto={modalAgendaAbierto}
        onCerrar={() => setModalAgendaAbierto(false)}
        onGuardadoExitoso={() => {
          setModalAgendaAbierto(false);
          cargarServicios();
        }}
      />
    </AppLayout>
  );
}

export default function ProgramacionPage() {
  return (
    <Suspense fallback={<div className="p-4 text-center text-slate-500">Cargando programación...</div>}>
      <ProgramacionContent />
    </Suspense>
  );
}
