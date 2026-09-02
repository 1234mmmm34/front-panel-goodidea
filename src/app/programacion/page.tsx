"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Clock, RefreshCw, X } from "lucide-react";
import { AgendaServicioGetDto } from "@/types/servicios";
import { AgendaService } from "@/services/agenda.service";
import { Navbar } from "@/components/ui/Navbar";
import { PaginadorCustom } from "@/components/ui/PaginadorCustom";
import { ModalConfirmarEliminar } from "@/components/ui/ModalConfirmarEliminar";
import { FiltrosAgendaServicios, FiltrosState } from "@/components/programacion/FiltrosAgendaServicios";
import { TablaAgendaServicios } from "@/components/programacion/TablaAgendaServicios";

export default function ProgramacionPage() {
  const [datos, setDatos] = useState<AgendaServicioGetDto[]>([]);
  const [cargando, setCargando] = useState<boolean>(true);
  const [paginaActual, setPaginaActual] = useState<number>(1);
  const [tamanoPagina, setTamanoPagina] = useState<number>(10);
  const [totalRegistros, setTotalRegistros] = useState<number>(0);
  const [totalPaginas, setTotalPaginas] = useState<number>(1);

  const [filtros, setFiltros] = useState<FiltrosState>({
    programacion: "programados",
    facturacion: "todos",
    fechaInicio: new Date().toISOString().split("T")[0],
    fechaFin: "",
    usarRango: false,
    searchTerm: "",
  });

  const [itemEliminar, setItemEliminar] = useState<AgendaServicioGetDto | null>(null);
  const [eliminando, setEliminando] = useState<boolean>(false);

  const [itemDetalle, setItemDetalle] = useState<AgendaServicioGetDto | null>(null);

  const cargarServicios = useCallback(async () => {
    setCargando(true);

    let facturadoVal: number | undefined;
    if (filtros.facturacion === "facturado") facturadoVal = 1;
    if (filtros.facturacion === "pendiente") facturadoVal = 0;

    const res = await AgendaService.getAgendaServicios({
      soloSinProgramar: filtros.programacion === "pendientes",
      pagina: paginaActual,
      tamano: tamanoPagina,
      fechaInicio: filtros.programacion === "programados" ? filtros.fechaInicio : undefined,
      fechaFin:
        filtros.programacion === "programados" && filtros.usarRango && filtros.fechaFin
          ? filtros.fechaFin
          : undefined,
      searchTerm: filtros.searchTerm || undefined,
      facturado: facturadoVal,
    });

    setDatos(res.datos);
    setTotalRegistros(res.total);
    setTotalPaginas(res.totalPaginas);
    setCargando(false);
  }, [filtros, paginaActual, tamanoPagina]);

  useEffect(() => {
    cargarServicios();
  }, [cargarServicios]);

  const handleConfirmarEliminar = async () => {
    if (!itemEliminar) return;
    setEliminando(true);
    const exito = await AgendaService.deleteAgenda(itemEliminar.i_CveAgenda);
    setEliminando(false);
    setItemEliminar(null);

    if (exito) {
      cargarServicios();
    } else {
      alert("Ocurrió un error al intentar eliminar la agenda.");
    }
  };

  return (
    <div className="app-container">
      <Navbar />

      <main className="main-content">
        <div className="page-header">
          <div>
            <h1 className="page-title">
              <Clock size={24} className="text-primary" />
              Programación y Agenda — Servicios
            </h1>
            <p className="subtext">
              Administración de servicios agendados, estados financieros y entregables.
            </p>
          </div>

          <button
            className="btn btn-outline"
            onClick={cargarServicios}
            disabled={cargando}
            title="Recargar datos"
          >
            <RefreshCw size={16} className={cargando ? "animate-spin" : ""} />
            Recargar
          </button>
        </div>

        <FiltrosAgendaServicios
          filtros={filtros}
          onCambiarFiltros={(nuevos) => {
            setFiltros(nuevos);
            setPaginaActual(1);
          }}
          onBuscar={() => setPaginaActual(1)}
        />

        <TablaAgendaServicios
          datos={datos}
          cargando={cargando}
          onVerDetalle={(item) => setItemDetalle(item)}
          onEliminar={(item) => setItemEliminar(item)}
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

        {/* Modal Confirmar Eliminar */}
        <ModalConfirmarEliminar
          abierto={!!itemEliminar}
          nombreElemento={itemEliminar?.v_Servicio || "este servicio agendado"}
          onCerrar={() => setItemEliminar(null)}
          onConfirmar={handleConfirmarEliminar}
          cargando={eliminando}
        />

        {/* Modal Detalle de Servicio */}
        {itemDetalle && (
          <div className="modal-overlay" onClick={() => setItemDetalle(null)}>
            <div className="modal-content wide" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3 className="modal-title">Detalle del Servicio Agendado</h3>
                <button className="btn-icon" onClick={() => setItemDetalle(null)}>
                  <X size={20} />
                </button>
              </div>

              <div className="modal-body">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">Cliente</label>
                    <p className="font-semibold">{itemDetalle.v_Empresa || "—"}</p>
                    <p className="text-xs text-secondary">{itemDetalle.v_Planta || ""}</p>
                  </div>

                  <div>
                    <label className="form-label">Servicio</label>
                    <p className="font-semibold">{itemDetalle.v_Servicio || "—"}</p>
                    <p className="text-xs text-secondary">
                      {itemDetalle.i_Cantidad ?? 0} {itemDetalle.v_Unidad || ""}
                    </p>
                  </div>

                  <div>
                    <label className="form-label">Monto Total</label>
                    <p className="text-lg font-bold text-primary">
                      ${itemDetalle.d_MontoTotal?.toLocaleString("es-MX", { minimumFractionDigits: 2 }) ?? "0.00"}
                    </p>
                  </div>

                  <div>
                    <label className="form-label">Monto Cobrado</label>
                    <p className="text-lg font-bold text-emerald-600">
                      ${itemDetalle.d_MontoCobrado?.toLocaleString("es-MX", { minimumFractionDigits: 2 }) ?? "0.00"}
                    </p>
                  </div>

                  <div>
                    <label className="form-label">Titular / Instructor</label>
                    <p>{itemDetalle.v_Titular || "—"}</p>
                  </div>

                  <div>
                    <label className="form-label">Apoyo</label>
                    <p>{itemDetalle.v_Apoyo || "—"}</p>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setItemDetalle(null)}>
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
