"use client";

import React, { useCallback, useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { AgendaServicioGetDto } from "@/types/servicios";
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

import { useToast } from "@/context/ToastContext";

export default function ProgramacionPage() {
  const { toast } = useToast();

  // Selector "Visualizar" (default: "sesiones")
  const [vista, setVista] = useState<"sesiones" | "servicios">("sesiones");

  // Estado Paginación Común
  const [paginaActual, setPaginaActual] = useState<number>(1);
  const [tamanoPagina, setTamanoPagina] = useState<number>(10);
  const [totalRegistros, setTotalRegistros] = useState<number>(0);
  const [totalPaginas, setTotalPaginas] = useState<number>(1);
  const [cargando, setCargando] = useState<boolean>(true);

  // --- ESTADO VISTA SESIONES ---
  const [datosSesiones, setDatosSesiones] = useState<AgendaGetDto[]>([]);
  const [filtrosSesiones, setFiltrosSesiones] = useState<FiltrosSesionesState>({
    visualizar: "sesiones",
    fechaInicio: new Date().toISOString().split("T")[0],
    fechaFin: "",
    usarRango: false,
    searchTerm: "",
  });
  const [itemReprogramar, setItemReprogramar] = useState<AgendaGetDto | null>(null);

  // --- ESTADO VISTA SERVICIOS ---
  const [datosServicios, setDatosServicios] = useState<AgendaServicioGetDto[]>([]);
  const [filtrosServicios, setFiltrosServicios] = useState<FiltrosServiciosState>({
    programacion: "programados",
    facturacion: "todos",
    fechaInicio: new Date().toISOString().split("T")[0],
    fechaFin: "",
    usarRango: false,
    searchTerm: "",
  });
  const [modalFormAbierto, setModalFormAbierto] = useState<boolean>(false);
  const [modalAgendaAbierto, setModalAgendaAbierto] = useState<boolean>(false);
  const [itemEliminar, setItemEliminar] = useState<AgendaServicioGetDto | null>(null);
  const [eliminando, setEliminando] = useState<boolean>(false);
  const [itemDetalle, setItemDetalle] = useState<AgendaServicioGetDto | null>(null);

  // --- Cargar datos de Sesiones ---
  const cargarSesiones = useCallback(async () => {
    setCargando(true);
    const res = await AgendaService.getAgenda({
      fechaInicio: filtrosSesiones.fechaInicio,
      fechaFin: filtrosSesiones.usarRango && filtrosSesiones.fechaFin ? filtrosSesiones.fechaFin : undefined,
      pagina: paginaActual,
      tamano: tamanoPagina,
      searchTerm: filtrosSesiones.searchTerm || undefined,
    });

    setDatosSesiones(res.datos);
    setTotalRegistros(res.total);
    setTotalPaginas(res.totalPaginas);
    setCargando(false);
  }, [filtrosSesiones, paginaActual, tamanoPagina]);

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
    });

    setDatosServicios(res.datos);
    setTotalRegistros(res.total);
    setTotalPaginas(res.totalPaginas);
    setCargando(false);
  }, [filtrosServicios, paginaActual, tamanoPagina]);

  // Trigger de carga al cambiar vista o parámetros
  useEffect(() => {
    if (vista === "sesiones") {
      cargarSesiones();
    } else {
      cargarServicios();
    }
  }, [vista, cargarSesiones, cargarServicios]);

  // Cambiar vista: resetea paginación y limpia filtros
  const handleCambiarVisualizar = (nuevaVista: "sesiones" | "servicios") => {
    setVista(nuevaVista);
    setPaginaActual(1);

    const hoy = new Date().toISOString().split("T")[0];
    if (nuevaVista === "sesiones") {
      setFiltrosSesiones({
        visualizar: "sesiones",
        fechaInicio: hoy,
        fechaFin: "",
        usarRango: false,
        searchTerm: "",
      });
    } else {
      setFiltrosServicios({
        programacion: "programados",
        facturacion: "todos",
        fechaInicio: hoy,
        fechaFin: "",
        usarRango: false,
        searchTerm: "",
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
            }}
            onCambiarVisualizar={handleCambiarVisualizar}
            onBuscar={() => setPaginaActual(1)}
            onNuevo={() => setModalAgendaAbierto(true)}
          />

          <TablaAgendaSesiones
            datos={datosSesiones}
            cargando={cargando}
            onReprogramar={(item) => setItemReprogramar(item)}
          />
        </>
      ) : (
        <>
          <FiltrosAgendaServicios
            filtros={filtrosServicios}
            onCambiarFiltros={(nuevos) => {
              setFiltrosServicios(nuevos);
              setPaginaActual(1);
            }}
            onCambiarVisualizar={handleCambiarVisualizar}
            onBuscar={() => setPaginaActual(1)}
            onNuevo={() => setModalAgendaAbierto(true)}
          />

          <TablaAgendaServicios
            datos={datosServicios}
            cargando={cargando}
            onVerDetalle={(item) => setItemDetalle(item)}
            onEliminar={(item) => setItemEliminar(item)}
          />
        </>
      )}

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

      {/* Modal Confirmar Eliminar (Vista Servicios) */}
      <ModalConfirmarEliminar
        abierto={!!itemEliminar}
        nombreElemento={itemEliminar?.v_Servicio || "este servicio agendado"}
        onCerrar={() => setItemEliminar(null)}
        onConfirmar={handleConfirmarEliminarServicio}
        cargando={eliminando}
      />

      {/* Modal Detalle de Servicio (Vista Servicios) */}
      <ModalDetalleServicio
        abierto={!!itemDetalle}
        iCveAgenda={itemDetalle?.i_CveAgenda ?? null}
        iCveServAgendaDet={itemDetalle?.i_CveServAgendaDet ?? null}
        onCerrar={() => setItemDetalle(null)}
        onGuardadoExitoso={() => {
          cargarServicios();
        }}
        onProgramar={() => {
          setItemDetalle(null);
          setModalFormAbierto(true);
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
