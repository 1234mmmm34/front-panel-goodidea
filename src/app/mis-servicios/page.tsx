"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { RefreshCw, UserX } from "lucide-react";
import { AgendaGetDto } from "@/types/calendario";
import {
  AgendaServicioConsultorGetDto,
  FiltrosConsultorSesionesState,
  FiltrosConsultorServiciosState,
} from "@/types/consultor";
import { ConsultorService } from "@/services/consultor.service";
import { AppLayout } from "@/components/layout/AppLayout";
import { PaginadorCustom } from "@/components/ui/PaginadorCustom";
import { FiltrosConsultorSesiones } from "@/components/consultor/FiltrosConsultorSesiones";
import { TablaConsultorSesiones } from "@/components/consultor/TablaConsultorSesiones";
import { FiltrosConsultorServicios } from "@/components/consultor/FiltrosConsultorServicios";
import { TablaConsultorServicios } from "@/components/consultor/TablaConsultorServicios";
import { ModalDetalleServicioConsultor } from "@/components/consultor/ModalDetalleServicioConsultor";
import { useToast } from "@/context/ToastContext";

export default function MisServiciosPage() {
  const { toast } = useToast();
  const toastRef = useRef(toast);
  useEffect(() => {
    toastRef.current = toast;
  }, [toast]);

  // Selector "Visualizar" ("sesiones" | "servicios")
  const [vista, setVista] = useState<"sesiones" | "servicios">("sesiones");

  // Estado Paginación Común
  const [paginaActual, setPaginaActual] = useState<number>(1);
  const [tamanoPagina, setTamanoPagina] = useState<number>(10);
  const [totalRegistros, setTotalRegistros] = useState<number>(0);
  const [totalPaginas, setTotalPaginas] = useState<number>(1);
  const [cargando, setCargando] = useState<boolean>(true);

  // Estado 403 usuario no ligado a personal
  const [noLigadoPersonal, setNoLigadoPersonal] = useState<boolean>(false);

  // Estados de error por vista
  const [errorSesiones, setErrorSesiones] = useState<string | null>(null);
  const [errorServicios, setErrorServicios] = useState<string | null>(null);

  // --- ESTADO VISTA SESIONES ---
  const [datosSesiones, setDatosSesiones] = useState<AgendaGetDto[]>([]);
  const [filtrosSesiones, setFiltrosSesiones] = useState<FiltrosConsultorSesionesState>({
    visualizar: "sesiones",
    fechaInicio: new Date().toISOString().split("T")[0],
    fechaFin: "",
    usarRango: false,
    searchTerm: "",
  });

  // --- ESTADO VISTA SERVICIOS ---
  const [datosServicios, setDatosServicios] = useState<AgendaServicioConsultorGetDto[]>([]);
  const [filtrosServicios, setFiltrosServicios] = useState<FiltrosConsultorServiciosState>({
    visualizar: "servicios",
    fechaInicio: new Date().toISOString().split("T")[0],
    fechaFin: "",
    usarRango: false,
    searchTerm: "",
  });

  // --- MODAL DETALLE ---
  const [itemDetalle, setItemDetalle] = useState<{
    iCveAgenda: number;
    iCveServAgendaDet: number;
  } | null>(null);

  // --- Cargar datos de Sesiones ---
  const cargarSesiones = useCallback(async () => {
    setCargando(true);
    setErrorSesiones(null);
    try {
      const res = await ConsultorService.getSesiones({
        fechaInicio: filtrosSesiones.fechaInicio,
        fechaFin: filtrosSesiones.usarRango && filtrosSesiones.fechaFin ? filtrosSesiones.fechaFin : undefined,
        pagina: paginaActual,
        tamano: tamanoPagina,
        searchTerm: filtrosSesiones.searchTerm || undefined,
      });

      setDatosSesiones(res.datos);
      setTotalRegistros(res.total);
      setTotalPaginas(res.totalPaginas);
      setNoLigadoPersonal(false);
      setErrorSesiones(null);
    } catch (err: any) {
      setDatosSesiones([]);
      setTotalRegistros(0);
      setTotalPaginas(1);
      if (err?.response?.status === 403) {
        setNoLigadoPersonal(true);
        setErrorSesiones("Tu usuario no está ligado a un registro de personal. Contacta al administrador.");
      } else {
        const msg =
          err?.response?.data?.mensaje ||
          err?.response?.data?.message ||
          "Ocurrió un error al cargar las sesiones asignadas.";
        setErrorSesiones(msg);
        toastRef.current.error(msg);
      }
    } finally {
      setCargando(false);
    }
  }, [
    filtrosSesiones.fechaInicio,
    filtrosSesiones.fechaFin,
    filtrosSesiones.usarRango,
    filtrosSesiones.searchTerm,
    paginaActual,
    tamanoPagina,
  ]);

  // --- Cargar datos de Servicios ---
  const cargarServicios = useCallback(async () => {
    setCargando(true);
    setErrorServicios(null);
    try {
      const res = await ConsultorService.getServicios({
        pagina: paginaActual,
        tamano: tamanoPagina,
        fechaInicio: filtrosServicios.fechaInicio,
        fechaFin: filtrosServicios.usarRango && filtrosServicios.fechaFin ? filtrosServicios.fechaFin : undefined,
        searchTerm: filtrosServicios.searchTerm || undefined,
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
        setErrorServicios("Tu usuario no está ligado a un registro de personal. Contacta al administrador.");
      } else {
        const msg =
          err?.response?.data?.mensaje ||
          err?.response?.data?.message ||
          "Ocurrió un error al cargar los servicios asignados.";
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
    paginaActual,
    tamanoPagina,
  ]);

  // Carga al montar y cuando cambian los filtros de sesiones (en vista sesiones)
  useEffect(() => {
    if (vista === "sesiones") {
      cargarSesiones();
    }
  }, [vista, cargarSesiones]);

  // Carga al montar y cuando cambian los filtros de servicios (en vista servicios)
  useEffect(() => {
    if (vista === "servicios") {
      cargarServicios();
    }
  }, [vista, cargarServicios]);

  // Cambiar vista: resetea paginación y limpia filtros
  const handleCambiarVisualizar = (nuevaVista: "sesiones" | "servicios") => {
    if (nuevaVista === vista) return;
    setVista(nuevaVista);
    setPaginaActual(1);
    setTotalRegistros(0);
    setTotalPaginas(1);
    setErrorSesiones(null);
    setErrorServicios(null);
    setNoLigadoPersonal(false);
  };

  const handleRecargar = () => {
    if (vista === "sesiones") {
      cargarSesiones();
    } else {
      cargarServicios();
    }
  };

  return (
    <AppLayout>
      <div className="page-header">
        <div>
          <h1 className="page-title">Mis servicios</h1>
          <p className="subtext">
            Consulta de tus servicios y sesiones asignadas como personal.
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
          <div style={{ display: "flex", justifyContent: "center", marginBottom: "1.25rem" }}>
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
          <h2 style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: "0.5rem", color: "#1e293b" }}>
            Sin registro de personal
          </h2>
          <p
            className="text-secondary"
            style={{ fontSize: "0.95rem", lineHeight: 1.6, margin: "0 auto", maxWidth: "460px" }}
          >
            Tu usuario no está ligado a un registro de personal. Contacta al administrador.
          </p>
        </div>
      ) : vista === "sesiones" ? (
        <>
          <FiltrosConsultorSesiones
            filtros={filtrosSesiones}
            onCambiarFiltros={(nuevos) => {
              setFiltrosSesiones(nuevos);
              setPaginaActual(1);
            }}
            onCambiarVisualizar={handleCambiarVisualizar}
            onBuscar={() => setPaginaActual(1)}
          />

          <TablaConsultorSesiones
            datos={datosSesiones}
            cargando={cargando}
            error={errorSesiones}
            onVerDetalle={(item) =>
              setItemDetalle({
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
            onCambioPagina={(pag) => setPaginaActual(pag)}
            onCambioTamano={(tam) => {
              setTamanoPagina(tam);
              setPaginaActual(1);
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
            }}
            onCambiarVisualizar={handleCambiarVisualizar}
            onBuscar={() => setPaginaActual(1)}
          />

          <TablaConsultorServicios
            datos={datosServicios}
            cargando={cargando}
            error={errorServicios}
            onVerDetalle={(item) =>
              setItemDetalle({
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
            onCambioPagina={(pag) => setPaginaActual(pag)}
            onCambioTamano={(tam) => {
              setTamanoPagina(tam);
              setPaginaActual(1);
            }}
          />
        </>
      )}

      {/* Modal Detalle de Servicio en Modo Lectura */}
      <ModalDetalleServicioConsultor
        abierto={!!itemDetalle}
        iCveAgenda={itemDetalle?.iCveAgenda ?? null}
        iCveServAgendaDet={itemDetalle?.iCveServAgendaDet ?? null}
        onCerrar={() => setItemDetalle(null)}
        onGuardadoExitoso={() => {
          if (vista === "sesiones") {
            cargarSesiones();
          } else {
            cargarServicios();
          }
        }}
      />
    </AppLayout>
  );
}
