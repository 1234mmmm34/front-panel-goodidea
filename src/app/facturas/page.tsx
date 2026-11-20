"use client";

import React, { useState, useEffect, useCallback, useMemo, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { format, startOfMonth, endOfMonth } from "date-fns";
import axios from "axios";
import { AppLayout } from "@/components/layout/AppLayout";
import { FacturaGetDto, FiltrosFacturasState, FacturasResumenDto } from "@/types/facturas";
import { FacturasService } from "@/services/facturas.service";
import { FiltrosFacturas } from "@/components/facturas/FiltrosFacturas";
import { TablaFacturas } from "@/components/facturas/TablaFacturas";
import { TarjetasResumenFacturas } from "@/components/facturas/TarjetasResumenFacturas";
import {
  ModalNuevaFactura,
  ModalFacturaDetalle,
  ModalTimbrado,
  ModalCancelarFacturas,
} from "@/components/facturas/ModalesFacturas";
import { useToast } from "@/context/ToastContext";

function FacturasContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const ahora = useMemo(() => new Date(), []);
  const primerDiaMes = useMemo(() => format(startOfMonth(ahora), "yyyy-MM-dd"), [ahora]);
  const ultimoDiaMes = useMemo(() => format(endOfMonth(ahora), "yyyy-MM-dd"), [ahora]);

  // Lectura de query params
  const paramEstado = searchParams.get("estado");
  const paramDesde = searchParams.get("desde");
  const paramHasta = searchParams.get("hasta");
  const paramQ = searchParams.get("q");
  const paramPagina = searchParams.get("pagina");
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

  const parseOrdenParam = (val: string | null): "ASC" | "DESC" | null => {
    return val === "ASC" || val === "DESC" ? val : null;
  };

  // 1. Estado de filtros (Default: "Pendientes" y Rango del mes completo)
  const [filtros, setFiltros] = useState<FiltrosFacturasState>({
    estado: paramEstado !== null ? paramEstado : "Pendientes",
    fechaInicio: paramDesde || primerDiaMes,
    fechaFin: paramHasta || ultimoDiaMes,
    fechaPago: paramDesde || primerDiaMes,
    searchTerm: paramQ || "",
  });

  const [empresasFiltro, setEmpresasFiltro] = useState<number[] | null>(() =>
    parseEmpresasParam(paramEmp)
  );
  const [ordenCliente, setOrdenCliente] = useState<"ASC" | "DESC" | null>(() =>
    parseOrdenParam(paramOrd)
  );

  // 2. Estado de paginación
  const [pagina, setPagina] = useState<number>(() => {
    const p = paramPagina ? parseInt(paramPagina, 10) : 1;
    return isNaN(p) || p < 1 ? 1 : p;
  });
  const [tamano, setTamano] = useState<number>(10);
  const [totalPaginas, setTotalPaginas] = useState<number>(1);
  const [totalRegistros, setTotalRegistros] = useState<number>(0);

  // 3. Clave para recargar tras acciones de modales
  const [refreshKey, setRefreshKey] = useState<number>(0);
  const recargar = () => setRefreshKey((k) => k + 1);

  // 4. Datos, Resumen y estado de carga
  const [datos, setDatos] = useState<FacturaGetDto[]>([]);
  const [resumen, setResumen] = useState<FacturasResumenDto | null>(null);
  const [cargando, setCargando] = useState<boolean>(true);
  const [cargandoResumen, setCargandoResumen] = useState<boolean>(true);

  // 5. Estados para Modales
  const [modalNuevaAbierto, setModalNuevaAbierto] = useState<boolean>(false);
  const [facturaSeleccionada, setFacturaSeleccionada] = useState<FacturaGetDto | null>(null);
  const [modalDetalleAbierto, setModalDetalleAbierto] = useState<boolean>(false);
  const [modalTimbradoAbierto, setModalTimbradoAbierto] = useState<boolean>(false);
  const [modalCancelarAbierto, setModalCancelarAbierto] = useState<boolean>(false);

  const { toast } = useToast();

  const actualizarUrl = useCallback(
    (cambios: {
      nuevosFiltros?: FiltrosFacturasState;
      nuevaPagina?: number;
      nuevasEmpresas?: number[] | null;
      nuevoOrdenCliente?: "ASC" | "DESC" | null;
    }) => {
      const fact = cambios.nuevosFiltros ?? filtros;
      const targetPagina = cambios.nuevaPagina ?? pagina;
      const targetEmp =
        cambios.nuevasEmpresas !== undefined
          ? cambios.nuevasEmpresas
          : empresasFiltro;
      const targetOrd =
        cambios.nuevoOrdenCliente !== undefined
          ? cambios.nuevoOrdenCliente
          : ordenCliente;

      const params = new URLSearchParams();
      if (fact.estado && fact.estado !== "Pendientes") {
        params.set("estado", fact.estado);
      }
      if (fact.fechaInicio) {
        params.set("desde", fact.fechaInicio);
      }
      if (fact.fechaFin) {
        params.set("hasta", fact.fechaFin);
      }
      if (fact.searchTerm && fact.searchTerm.trim() !== "") {
        params.set("q", fact.searchTerm.trim());
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

      const qs = params.toString();
      const url = qs ? `/facturas?${qs}` : `/facturas`;
      router.replace(url, { scroll: false });
    },
    [filtros, pagina, empresasFiltro, ordenCliente, router]
  );

  // 6. Carga sincronizada de datos y resumen con cancelación (AbortController)
  useEffect(() => {
    // No consultar con el rango incompleto
    if (!filtros.fechaInicio || !filtros.fechaFin) return;

    const controller = new AbortController();

    const cargar = async () => {
      setCargando(true);
      setCargandoResumen(true);

      try {
        const [resFacturas, resResumen] = await Promise.all([
          FacturasService.getFacturas({
            estado: filtros.estado,
            fechaInicio: filtros.fechaInicio,
            fechaFin: filtros.fechaFin,
            fechaPago: filtros.fechaInicio,
            fechaPagoFin: filtros.fechaFin,
            searchTerm: filtros.searchTerm,
            empresa: filtros.empresa,
            empresas: empresasFiltro,
            ordenCliente: ordenCliente,
            pagina,
            tamano,
            signal: controller.signal,
          }),
          FacturasService.getFacturasResumen({
            estado: filtros.estado,
            fechaInicio: filtros.fechaInicio,
            fechaFin: filtros.fechaFin,
            fechaPago: filtros.fechaInicio,
            fechaPagoFin: filtros.fechaFin,
            searchTerm: filtros.searchTerm,
            empresa: filtros.empresa,
            empresas: empresasFiltro,
            signal: controller.signal,
          }),
        ]);

        setDatos(resFacturas.datos);
        setTotalRegistros(resFacturas.total);
        setTotalPaginas(resFacturas.totalPaginas);
        setResumen(resResumen);
      } catch (err: any) {
        if (axios.isCancel(err) || err?.name === "CanceledError" || controller.signal.aborted) {
          // Petición cancelada: ignorar, no tocar estado ni mostrar toast
          return;
        }
        console.error("Error cargando facturas y resúmenes:", err);
        toast.error("Ocurrió un error al cargar la información de facturas.");
      } finally {
        if (!controller.signal.aborted) {
          setCargando(false);
          setCargandoResumen(false);
        }
      }
    };

    cargar();

    return () => {
      controller.abort();
    };
  }, [
    filtros.estado,
    filtros.fechaInicio,
    filtros.fechaFin,
    filtros.searchTerm,
    filtros.empresa,
    empresasFiltro,
    ordenCliente,
    pagina,
    tamano,
    refreshKey,
    // eslint-disable-next-line react-hooks/exhaustive-deps
  ]);

  // Manejadores de cambios en filtros (solo actualizan estado, el useEffect dispara la carga)
  const handleCambiarFiltros = (cambios: Partial<FiltrosFacturasState>) => {
    const nuevos = { ...filtros, ...cambios };
    setFiltros(nuevos);
    setPagina(1);
    actualizarUrl({ nuevosFiltros: nuevos, nuevaPagina: 1 });
  };

  const handleCambioPagina = (nuevaPagina: number) => {
    setPagina(nuevaPagina);
    actualizarUrl({ nuevaPagina });
  };

  const handleCambioTamano = (nuevoTamano: number) => {
    setTamano(nuevoTamano);
    setPagina(1);
    actualizarUrl({ nuevaPagina: 1 });
  };

  // Cargar opciones para el filtro de columna Cliente
  const cargarOpcionesEmpresas = useCallback(async () => {
    const lista = await FacturasService.getEmpresasFiltro({
      searchTerm: filtros.searchTerm || undefined,
      fechaInicio: filtros.fechaInicio || undefined,
      fechaFin: filtros.fechaFin || undefined,
      estado: filtros.estado || undefined,
    });
    return lista.map((e) => ({
      valor: e.i_CveEmpresa,
      etiqueta: e.v_Empresa,
    }));
  }, [filtros.searchTerm, filtros.fechaInicio, filtros.fechaFin, filtros.estado]);

  const handleAplicarFiltroColumna = (
    seleccionados: number[] | null,
    orden: "ASC" | "DESC" | null
  ) => {
    setEmpresasFiltro(seleccionados);
    setOrdenCliente(orden);
    setPagina(1);
    actualizarUrl({
      nuevasEmpresas: seleccionados,
      nuevoOrdenCliente: orden,
      nuevaPagina: 1,
    });
  };

  // Manejadores de modales
  const handleAbrirDetalle = (item: FacturaGetDto) => {
    setFacturaSeleccionada(item);
    setModalDetalleAbierto(true);
  };

  const handleAbrirTimbrado = (item: FacturaGetDto) => {
    setFacturaSeleccionada(item);
    setModalTimbradoAbierto(true);
  };

  const handleAbrirCancelar = (item: FacturaGetDto) => {
    setFacturaSeleccionada(item);
    setModalCancelarAbierto(true);
  };

  return (
    <AppLayout>
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {/* Título de la página */}
        <div>
          <h1
            style={{
              fontSize: "20px",
              fontWeight: 700,
              color: "#0f172a",
              margin: 0,
              padding: 0,
            }}
          >
            Facturas
          </h1>
        </div>

        {/* Tarjetas de Resumen de Facturas */}
        <TarjetasResumenFacturas
          resumen={resumen}
          cargando={cargandoResumen}
        />

        {/* 1. Encabezado y barra de filtros */}
        <FiltrosFacturas
          filtros={filtros}
          onCambiarFiltros={handleCambiarFiltros}
          onNuevaFactura={() => setModalNuevaAbierto(true)}
        />

        {/* 2. Tabla de Facturas */}
        <TablaFacturas
          datos={datos}
          cargando={cargando}
          paginaActual={pagina}
          totalPaginas={totalPaginas}
          totalRegistros={totalRegistros}
          tamano={tamano}
          onCambioPagina={handleCambioPagina}
          onCambioTamano={handleCambioTamano}
          onVerDetalle={handleAbrirDetalle}
          onTimbrar={handleAbrirTimbrado}
          onCancelar={handleAbrirCancelar}
          filtroColumna={{
            cargarOpciones: cargarOpcionesEmpresas,
            seleccionados: empresasFiltro,
            orden: ordenCliente,
            onAplicar: handleAplicarFiltroColumna,
          }}
        />
      </div>

      {/* Modales */}
      <ModalNuevaFactura
        abierto={modalNuevaAbierto}
        onCerrar={() => setModalNuevaAbierto(false)}
        onGuardar={recargar}
      />

      <ModalFacturaDetalle
        abierto={modalDetalleAbierto}
        factura={facturaSeleccionada}
        onCerrar={() => {
          setModalDetalleAbierto(false);
          setFacturaSeleccionada(null);
        }}
        onCambio={recargar}
      />

      <ModalTimbrado
        abierto={modalTimbradoAbierto}
        factura={facturaSeleccionada}
        onCerrar={() => {
          setModalTimbradoAbierto(false);
          setFacturaSeleccionada(null);
        }}
        onGuardar={recargar}
      />

      <ModalCancelarFacturas
        abierto={modalCancelarAbierto}
        factura={facturaSeleccionada}
        onCerrar={() => {
          setModalCancelarAbierto(false);
          setFacturaSeleccionada(null);
        }}
        onGuardadoExitoso={recargar}
      />
    </AppLayout>
  );
}

export default function FacturasPage() {
  return (
    <Suspense fallback={<div className="p-4 text-center text-slate-500">Cargando facturas...</div>}>
      <FacturasContent />
    </Suspense>
  );
}
