"use client";

import React, { useState, useEffect, useCallback, useMemo, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { AppLayout } from "@/components/layout/AppLayout";
import {
  FacturaProv,
  FacturasProvResumen,
  FiltrosGastosState,
} from "@/types/gastos";
import { GastosService } from "@/services/gastos.service";
import { TarjetasResumenGastos } from "@/components/gastos/TarjetasResumenGastos";
import { FiltrosGastos } from "@/components/gastos/FiltrosGastos";
import { TablaGastos } from "@/components/gastos/TablaGastos";
import { ModalDetalleGasto } from "@/components/gastos/ModalDetalleGasto";
import { ModalCancelarGasto } from "@/components/gastos/ModalCancelarGasto";
import { PaginadoResponse } from "@/types/servicios";

function GastosContent() {
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
  const paramProv = searchParams.get("prov");
  const paramOrd = searchParams.get("ord");

  const parseProveedoresParam = (val: string | null): number[] | null => {
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

  // Filtros (Default: "Todos" y rango del mes en curso)
  const [filtros, setFiltros] = useState<FiltrosGastosState>({
    estado: paramEstado !== null ? paramEstado : "",
    fechaInicio: paramDesde || primerDiaMes,
    fechaFin: paramHasta || ultimoDiaMes,
    searchTerm: paramQ || "",
  });

  const [proveedoresFiltro, setProveedoresFiltro] = useState<number[] | null>(
    () => parseProveedoresParam(paramProv)
  );
  const [ordenProveedor, setOrdenProveedor] = useState<"ASC" | "DESC" | null>(
    () => parseOrdenParam(paramOrd)
  );

  // Paginación
  const [pagina, setPagina] = useState<number>(() => {
    const p = paramPagina ? parseInt(paramPagina, 10) : 1;
    return isNaN(p) || p < 1 ? 1 : p;
  });
  const [tamano, setTamano] = useState<number>(10);

  // Datos paginados y resumen
  const [datosPaginados, setDatosPaginados] = useState<PaginadoResponse<FacturaProv> | null>(null);
  const [resumen, setResumen] = useState<FacturasProvResumen | null>(null);
  const [cargando, setCargando] = useState<boolean>(true);
  const [cargandoResumen, setCargandoResumen] = useState<boolean>(true);

  // Modales
  const [gastoSeleccionado, setGastoSeleccionado] = useState<FacturaProv | null>(null);
  const [modalDetalleAbierto, setModalDetalleAbierto] = useState<boolean>(false);
  const [autoAbrirProgramar, setAutoAbrirProgramar] = useState<boolean>(false);
  const [modalCancelarAbierto, setModalCancelarAbierto] = useState<boolean>(false);

  const actualizarUrl = useCallback(
    (cambios: {
      nuevosFiltros?: FiltrosGastosState;
      nuevaPagina?: number;
      nuevosProveedores?: number[] | null;
      nuevoOrdenProveedor?: "ASC" | "DESC" | null;
    }) => {
      const fact = cambios.nuevosFiltros ?? filtros;
      const targetPagina = cambios.nuevaPagina ?? pagina;
      const targetProv =
        cambios.nuevosProveedores !== undefined
          ? cambios.nuevosProveedores
          : proveedoresFiltro;
      const targetOrd =
        cambios.nuevoOrdenProveedor !== undefined
          ? cambios.nuevoOrdenProveedor
          : ordenProveedor;

      const params = new URLSearchParams();
      if (fact.estado) {
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
      if (Array.isArray(targetProv)) {
        params.set("prov", targetProv.length > 0 ? targetProv.join(",") : "0");
      }
      if (targetOrd) {
        params.set("ord", targetOrd);
      }
      if (targetPagina > 1) {
        params.set("pagina", String(targetPagina));
      }

      const qs = params.toString();
      const url = qs ? `/gastos?${qs}` : `/gastos`;
      router.replace(url, { scroll: false });
    },
    [filtros, pagina, proveedoresFiltro, ordenProveedor, router]
  );

  // Carga de gastos y resumen
  const cargarGastos = useCallback(
    async (
      pageToLoad: number,
      pageSizeToLoad: number,
      currentFiltros: FiltrosGastosState,
      currentProveedores: number[] | null,
      currentOrden: "ASC" | "DESC" | null
    ) => {
      setCargando(true);
      setCargandoResumen(true);

      try {
        const [resGastos, resResumen] = await Promise.all([
          GastosService.getGastos({
            estado: currentFiltros.estado,
            fechaInicio: currentFiltros.fechaInicio,
            fechaFin: currentFiltros.fechaFin,
            searchTerm: currentFiltros.searchTerm,
            proveedores: currentProveedores,
            ordenProveedor: currentOrden,
            pagina: pageToLoad,
            tamano: pageSizeToLoad,
          }),
          GastosService.getGastosResumen({
            estado: currentFiltros.estado,
            fechaInicio: currentFiltros.fechaInicio,
            fechaFin: currentFiltros.fechaFin,
            searchTerm: currentFiltros.searchTerm,
            proveedores: currentProveedores,
          }),
        ]);

        setDatosPaginados(resGastos);
        setResumen(resResumen);
      } catch (err: any) {
        console.error("Error al cargar gastos:", err);
      } finally {
        setCargando(false);
        setCargandoResumen(false);
      }
    },
    []
  );

  useEffect(() => {
    cargarGastos(pagina, tamano, filtros, proveedoresFiltro, ordenProveedor);
  }, [pagina, tamano, filtros, proveedoresFiltro, ordenProveedor, cargarGastos]);

  const handleCambiarFiltros = (nuevosFiltros: FiltrosGastosState) => {
    setFiltros(nuevosFiltros);
    setPagina(1);
    actualizarUrl({ nuevosFiltros, nuevaPagina: 1 });
  };

  const handleBuscar = () => {
    setPagina(1);
    actualizarUrl({ nuevaPagina: 1 });
  };

  const handleCambioPagina = (nuevaPagina: number) => {
    setPagina(nuevaPagina);
    actualizarUrl({ nuevaPagina });
  };

  const cargarOpcionesProveedores = useCallback(async () => {
    const lista = await GastosService.getProveedoresFiltro({
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
    setProveedoresFiltro(seleccionados);
    setOrdenProveedor(orden);
    setPagina(1);
    actualizarUrl({
      nuevosProveedores: seleccionados,
      nuevoOrdenProveedor: orden,
      nuevaPagina: 1,
    });
  };

  const handleAbrirDetalle = (gasto: FacturaProv) => {
    setAutoAbrirProgramar(false);
    setGastoSeleccionado(gasto);
    setModalDetalleAbierto(true);
  };

  const handleProgramarPago = (gasto: FacturaProv) => {
    setAutoAbrirProgramar(true);
    setGastoSeleccionado(gasto);
    setModalDetalleAbierto(true);
  };

  const handleAbrirCancelar = (gasto: FacturaProv) => {
    setGastoSeleccionado(gasto);
    setModalCancelarAbierto(true);
  };

  return (
    <AppLayout>
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {/* Encabezado */}
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
            Gastos
          </h1>
          <p style={{ margin: 0, fontSize: "13px", color: "#64748b" }}>
            Cuentas por pagar a proveedores y sus pagos.
          </p>
        </div>

        {/* Tarjetas de Resumen */}
        <TarjetasResumenGastos resumen={resumen} cargando={cargandoResumen} />

        {/* Filtros */}
        <FiltrosGastos
          filtros={filtros}
          onCambiarFiltros={handleCambiarFiltros}
          onBuscar={handleBuscar}
        />

        {/* Tabla */}
        <TablaGastos
          datosPaginados={datosPaginados}
          cargando={cargando}
          paginaActual={pagina}
          tamano={tamano}
          onVerDetalle={handleAbrirDetalle}
          onProgramarPago={handleProgramarPago}
          onCancelarGasto={handleAbrirCancelar}
          onCambioPagina={handleCambioPagina}
          onCambioTamano={(nuevoTamano) => {
            setTamano(nuevoTamano);
            setPagina(1);
          }}
          filtroColumna={{
            cargarOpciones: cargarOpcionesProveedores,
            seleccionados: proveedoresFiltro,
            orden: ordenProveedor,
            onAplicar: handleAplicarFiltroColumna,
          }}
        />
      </div>

      {/* Modales */}
      <ModalDetalleGasto
        abierto={modalDetalleAbierto}
        gasto={gastoSeleccionado}
        autoAbrirProgramar={autoAbrirProgramar}
        onCerrar={() => {
          setModalDetalleAbierto(false);
          setGastoSeleccionado(null);
          setAutoAbrirProgramar(false);
        }}
        onCambio={() =>
          cargarGastos(pagina, tamano, filtros, proveedoresFiltro, ordenProveedor)
        }
      />

      <ModalCancelarGasto
        abierto={modalCancelarAbierto}
        gasto={gastoSeleccionado}
        onCerrar={() => {
          setModalCancelarAbierto(false);
          setGastoSeleccionado(null);
        }}
        onExito={() =>
          cargarGastos(pagina, tamano, filtros, proveedoresFiltro, ordenProveedor)
        }
      />
    </AppLayout>
  );
}

export default function GastosPage() {
  return (
    <Suspense fallback={<div className="p-4 text-center text-slate-500">Cargando gastos...</div>}>
      <GastosContent />
    </Suspense>
  );
}
