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
  const paramPDesde = searchParams.get("pdesde");
  const paramPHasta = searchParams.get("phasta");
  const paramQ = searchParams.get("q");
  const paramPagina = searchParams.get("pagina");
  const paramProv = searchParams.get("prov");
  const paramOrd = searchParams.get("ord");
  const paramOc = searchParams.get("oc");
  const paramCot = searchParams.get("cot");
  const paramCon = searchParams.get("con");
  const paramPend = searchParams.get("pend");

  const parseProveedoresParam = (val: string | null): number[] | null => {
    if (val === null || val.trim() === "") return null;
    if (val.trim() === "0") return [];
    const ids = val
      .split(",")
      .map((s) => parseInt(s.trim(), 10))
      .filter((n) => !isNaN(n) && n > 0);
    return ids;
  };

  const parsePipeParam = (val: string | null): string[] | null => {
    if (val === null || val.trim() === "") return null;
    if (val.trim() === "~") return [];
    return val.split("|").filter((s) => s.length > 0);
  };

  const parseListaNumerosParam = (val: string | null): number[] | null => {
    if (val === null || val.trim() === "") return null;
    if (val.trim() === "-1") return [];
    return val
      .split(",")
      .map((s) => parseInt(s.trim(), 10))
      .filter((n) => !isNaN(n) && n >= 0);
  };

  const parseOrdenParam = (val: string | null): "ASC" | "DESC" | null => {
    return val === "ASC" || val === "DESC" ? val : null;
  };

  const estadoInicial = paramEstado !== null ? paramEstado : "";
  const sinProximoPagoInicial =
    estadoInicial === "Pagada" ||
    estadoInicial === "Cancelada" ||
    estadoInicial === "Canceladas" ||
    estadoInicial === "SinProgramar";

  // Filtros (Default: "Todos", Fecha del servicio = mes actual, Próximo pago vacío)
  const [filtros, setFiltros] = useState<FiltrosGastosState>({
    estado: estadoInicial,
    fechaInicio: paramDesde !== null ? paramDesde : primerDiaMes,
    fechaFin: paramHasta !== null ? paramHasta : ultimoDiaMes,
    fechaPagoInicio: sinProximoPagoInicial ? "" : paramPDesde || "",
    fechaPagoFin: sinProximoPagoInicial ? "" : paramPHasta || "",
    searchTerm: paramQ || "",
  });

  const [proveedoresFiltro, setProveedoresFiltro] = useState<number[] | null>(
    () => parseProveedoresParam(paramProv)
  );
  const [ordenProveedor, setOrdenProveedor] = useState<"ASC" | "DESC" | null>(
    () => parseOrdenParam(paramOrd)
  );
  const [ocsFiltro, setOcsFiltro] = useState<string[] | null>(() =>
    parsePipeParam(paramOc)
  );
  const [cotizacionesFiltro, setCotizacionesFiltro] = useState<string[] | null>(() =>
    parsePipeParam(paramCot)
  );
  const [conceptosFiltro, setConceptosFiltro] = useState<string[] | null>(() =>
    parsePipeParam(paramCon)
  );
  const [pagosPendientesFiltro, setPagosPendientesFiltro] = useState<number[] | null>(() =>
    parseListaNumerosParam(paramPend)
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
      nuevasOcs?: string[] | null;
      nuevasCotizaciones?: string[] | null;
      nuevosConceptos?: string[] | null;
      nuevosPagosPendientes?: number[] | null;
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
      const targetOc =
        cambios.nuevasOcs !== undefined ? cambios.nuevasOcs : ocsFiltro;
      const targetCot =
        cambios.nuevasCotizaciones !== undefined
          ? cambios.nuevasCotizaciones
          : cotizacionesFiltro;
      const targetCon =
        cambios.nuevosConceptos !== undefined
          ? cambios.nuevosConceptos
          : conceptosFiltro;
      const targetPend =
        cambios.nuevosPagosPendientes !== undefined
          ? cambios.nuevosPagosPendientes
          : pagosPendientesFiltro;

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
      if (fact.fechaPagoInicio) {
        params.set("pdesde", fact.fechaPagoInicio);
      }
      if (fact.fechaPagoFin) {
        params.set("phasta", fact.fechaPagoFin);
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
      if (Array.isArray(targetOc)) {
        params.set("oc", targetOc.length > 0 ? targetOc.join("|") : "~");
      }
      if (Array.isArray(targetCot)) {
        params.set("cot", targetCot.length > 0 ? targetCot.join("|") : "~");
      }
      if (Array.isArray(targetCon)) {
        params.set("con", targetCon.length > 0 ? targetCon.join("|") : "~");
      }
      if (Array.isArray(targetPend)) {
        params.set("pend", targetPend.length > 0 ? targetPend.join(",") : "-1");
      }
      if (targetPagina > 1) {
        params.set("pagina", String(targetPagina));
      }

      const qs = params.toString();
      const url = qs ? `/gastos?${qs}` : `/gastos`;
      router.replace(url, { scroll: false });
    },
    [
      filtros,
      pagina,
      proveedoresFiltro,
      ordenProveedor,
      ocsFiltro,
      cotizacionesFiltro,
      conceptosFiltro,
      pagosPendientesFiltro,
      router,
    ]
  );

  // Carga de gastos y resumen
  const cargarGastos = useCallback(
    async (
      pageToLoad: number,
      pageSizeToLoad: number,
      currentFiltros: FiltrosGastosState,
      currentProveedores: number[] | null,
      currentOrden: "ASC" | "DESC" | null,
      currentOcs: string[] | null,
      currentCotizaciones: string[] | null,
      currentConceptos: string[] | null,
      currentPagosPendientes: number[] | null
    ) => {
      setCargando(true);
      setCargandoResumen(true);

      try {
        const [resGastos, resResumen] = await Promise.all([
          GastosService.getGastos({
            estado: currentFiltros.estado,
            fechaInicio: currentFiltros.fechaInicio,
            fechaFin: currentFiltros.fechaFin,
            fechaPagoInicio: currentFiltros.fechaPagoInicio,
            fechaPagoFin: currentFiltros.fechaPagoFin,
            searchTerm: currentFiltros.searchTerm,
            proveedores: currentProveedores,
            ocs: currentOcs,
            cotizaciones: currentCotizaciones,
            conceptos: currentConceptos,
            pagosPendientes: currentPagosPendientes,
            ordenProveedor: currentOrden,
            pagina: pageToLoad,
            tamano: pageSizeToLoad,
          }),
          GastosService.getGastosResumen({
            estado: currentFiltros.estado,
            fechaInicio: currentFiltros.fechaInicio,
            fechaFin: currentFiltros.fechaFin,
            fechaPagoInicio: currentFiltros.fechaPagoInicio,
            fechaPagoFin: currentFiltros.fechaPagoFin,
            searchTerm: currentFiltros.searchTerm,
            proveedores: currentProveedores,
            ocs: currentOcs,
            cotizaciones: currentCotizaciones,
            conceptos: currentConceptos,
            pagosPendientes: currentPagosPendientes,
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
    cargarGastos(
      pagina,
      tamano,
      filtros,
      proveedoresFiltro,
      ordenProveedor,
      ocsFiltro,
      cotizacionesFiltro,
      conceptosFiltro,
      pagosPendientesFiltro
    );
  }, [
    pagina,
    tamano,
    filtros,
    proveedoresFiltro,
    ordenProveedor,
    ocsFiltro,
    cotizacionesFiltro,
    conceptosFiltro,
    pagosPendientesFiltro,
    cargarGastos,
  ]);

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
      fechaPagoInicio: filtros.fechaPagoInicio || undefined,
      fechaPagoFin: filtros.fechaPagoFin || undefined,
      estado: filtros.estado || undefined,
      ocs: ocsFiltro,
      cotizaciones: cotizacionesFiltro,
      conceptos: conceptosFiltro,
      pagosPendientes: pagosPendientesFiltro,
    });
    return lista.map((e) => ({
      valor: e.i_CveEmpresa,
      etiqueta: e.v_Empresa,
    }));
  }, [
    filtros.searchTerm,
    filtros.fechaInicio,
    filtros.fechaFin,
    filtros.fechaPagoInicio,
    filtros.fechaPagoFin,
    filtros.estado,
    ocsFiltro,
    cotizacionesFiltro,
    conceptosFiltro,
    pagosPendientesFiltro,
  ]);

  const cargarOpcionesTexto = useCallback(
    async (campo: "OC" | "COT" | "CONCEPTO") => {
      const lista = await GastosService.getOpcionesFiltro(campo, {
        searchTerm: filtros.searchTerm || undefined,
        fechaInicio: filtros.fechaInicio || undefined,
        fechaFin: filtros.fechaFin || undefined,
        fechaPagoInicio: filtros.fechaPagoInicio || undefined,
        fechaPagoFin: filtros.fechaPagoFin || undefined,
        estado: filtros.estado || undefined,
        proveedores: proveedoresFiltro,
        ocs: ocsFiltro,
        cotizaciones: cotizacionesFiltro,
        conceptos: conceptosFiltro,
        pagosPendientes: pagosPendientesFiltro,
      });
      return lista.map((item) => {
        const val = item.v_Valor ?? "__SIN__";
        let etiqueta = val;
        if (val === "__SIN__") {
          etiqueta = campo === "OC" ? "Sin OC" : campo === "COT" ? "Sin cotización" : "Sin concepto";
        }
        return { valor: val, etiqueta };
      });
    },
    [
      filtros.searchTerm,
      filtros.fechaInicio,
      filtros.fechaFin,
      filtros.fechaPagoInicio,
      filtros.fechaPagoFin,
      filtros.estado,
      proveedoresFiltro,
      ocsFiltro,
      cotizacionesFiltro,
      conceptosFiltro,
      pagosPendientesFiltro,
    ]
  );

  const cargarOpcionesPagosPendientes = useCallback(async () => {
    const lista = await GastosService.getPagosPendientesFiltro({
      searchTerm: filtros.searchTerm || undefined,
      fechaInicio: filtros.fechaInicio || undefined,
      fechaFin: filtros.fechaFin || undefined,
      fechaPagoInicio: filtros.fechaPagoInicio || undefined,
      fechaPagoFin: filtros.fechaPagoFin || undefined,
      estado: filtros.estado || undefined,
      proveedores: proveedoresFiltro,
      ocs: ocsFiltro,
      cotizaciones: cotizacionesFiltro,
      conceptos: conceptosFiltro,
    });
    return lista.map((item) => {
      const n = item.i_PagosPendientes;
      return {
        valor: n,
        etiqueta: n === 0 ? "Sin pendientes" : n === 1 ? "1 pendiente" : `${n} pendientes`,
      };
    });
  }, [
    filtros.searchTerm,
    filtros.fechaInicio,
    filtros.fechaFin,
    filtros.fechaPagoInicio,
    filtros.fechaPagoFin,
    filtros.estado,
    proveedoresFiltro,
    ocsFiltro,
    cotizacionesFiltro,
    conceptosFiltro,
  ]);

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
          filtroOcs={{
            cargarOpciones: () => cargarOpcionesTexto("OC"),
            seleccionados: ocsFiltro,
            onAplicar: (sel) => {
              setOcsFiltro(sel);
              setPagina(1);
              actualizarUrl({ nuevasOcs: sel, nuevaPagina: 1 });
            },
          }}
          filtroCotizaciones={{
            cargarOpciones: () => cargarOpcionesTexto("COT"),
            seleccionados: cotizacionesFiltro,
            onAplicar: (sel) => {
              setCotizacionesFiltro(sel);
              setPagina(1);
              actualizarUrl({ nuevasCotizaciones: sel, nuevaPagina: 1 });
            },
          }}
          filtroConceptos={{
            cargarOpciones: () => cargarOpcionesTexto("CONCEPTO"),
            seleccionados: conceptosFiltro,
            onAplicar: (sel) => {
              setConceptosFiltro(sel);
              setPagina(1);
              actualizarUrl({ nuevosConceptos: sel, nuevaPagina: 1 });
            },
          }}
          filtroPagosPendientes={{
            cargarOpciones: cargarOpcionesPagosPendientes,
            seleccionados: pagosPendientesFiltro,
            onAplicar: (sel) => {
              setPagosPendientesFiltro(sel);
              setPagina(1);
              actualizarUrl({ nuevosPagosPendientes: sel, nuevaPagina: 1 });
            },
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
          cargarGastos(
            pagina,
            tamano,
            filtros,
            proveedoresFiltro,
            ordenProveedor,
            ocsFiltro,
            cotizacionesFiltro,
            conceptosFiltro,
            pagosPendientesFiltro
          )
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
          cargarGastos(
            pagina,
            tamano,
            filtros,
            proveedoresFiltro,
            ordenProveedor,
            ocsFiltro,
            cotizacionesFiltro,
            conceptosFiltro,
            pagosPendientesFiltro
          )
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
