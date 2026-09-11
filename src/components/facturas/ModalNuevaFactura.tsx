"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  X,
  Building2,
  Search,
  Plus,
  Trash2,
  Folder,
  ChevronDown,
  ChevronRight,
  AlertCircle,
  Check,
  Settings,
  Zap,
  Calendar,
  FileText,
} from "lucide-react";
import { EmpresaGetDto } from "@/types/empresas";
import { ServicioSinFacturaDto } from "@/types/facturas";
import { EmpresasService } from "@/services/empresas.service";
import { FacturasService } from "@/services/facturas.service";
import InputFechaTexto from "@/components/ui/InputFechaTexto";
import { useToast } from "@/context/ToastContext";
import { formatearFechaTexto, addDays, addMonths } from "@/lib/date-utils";

interface ModalNuevaFacturaProps {
  abierto: boolean;
  onCerrar: () => void;
  onGuardar?: () => void;
}

// Interfaces internas
export interface ServicioSeleccionadoItem extends ServicioSinFacturaDto {
  idTemp: string;
  subtotal: number;
  total: number;
}

export interface GrupoFacturaState {
  idGrupo: string;
  v_NombreProyecto: string;
  d_MontoProyecto: number | ""; // Subtotal sin IVA capturado manualmente
  total: number; // d_MontoProyecto * 1.16
  servicios: ServicioSeleccionadoItem[];
  expandido: boolean;
}

export interface PagoProgramadoItem {
  idPago: string;
  d_FechaProgramada: string;
  d_Monto: number | "";
}

export interface FacturaVentaState {
  idFactura: string;
  v_NoFactura: string;
  d_FechaExpedicion: string;
  d_Monto: number | "";
  v_Descripcion: string;
  b_Timbrada: boolean;
  abonos: PagoProgramadoItem[];
}

export const ModalNuevaFactura: React.FC<ModalNuevaFacturaProps> = ({
  abierto,
  onCerrar,
  onGuardar,
}) => {
  const { toast } = useToast();
  const hoyStr = new Date().toISOString().split("T")[0];

  // Estepa / Wizard state (1: Cliente y servicios, 2: Configuración de venta, 3: Confirmación)
  const [pasoActual, setPasoActual] = useState<number>(1);
  const [pasoMaximoAlcanzado, setPasoMaximoAlcanzado] = useState<number>(1);

  // --- PARTE 1: EMPRESA Y SERVICIOS ---
  const [empresas, setEmpresas] = useState<EmpresaGetDto[]>([]);
  const [cargandoEmpresas, setCargandoEmpresas] = useState<boolean>(false);
  const [empresaSeleccionadaId, setEmpresaSeleccionadaId] = useState<string>("");

  const [searchServicioText, setSearchServicioText] = useState<string>("");
  const [serviciosBusqueda, setServiciosBusqueda] = useState<ServicioSinFacturaDto[]>([]);
  const [buscandoServicios, setBuscandoServicios] = useState<boolean>(false);
  const [dropdownServicioAbierto, setDropdownServicioAbierto] = useState<boolean>(false);

  const [serviciosIndividuales, setServiciosIndividuales] = useState<ServicioSeleccionadoItem[]>([]);
  const [grupos, setGrupos] = useState<GrupoFacturaState[]>([]);
  const [serviciosParaAgruparIds, setServiciosParaAgruparIds] = useState<Set<string>>(new Set());

  // Dropdown "+ Agrupar"
  const [dropdownAgruparAbierto, setDropdownAgruparAbierto] = useState<boolean>(false);
  const [nombreNuevoGrupo, setNombreNuevoGrupo] = useState<string>("");

  const containerServicioRef = useRef<HTMLDivElement>(null);
  const dropdownAgruparRef = useRef<HTMLDivElement>(null);

  // --- PARTE 2: CONFIGURACIÓN DE VENTA Y FACTURAS ---
  const [cantidadFacturas, setCantidadFacturas] = useState<number | "">(1);
  const [descripcionVenta, setDescripcionVenta] = useState<string>("");
  const [facturas, setFacturas] = useState<FacturaVentaState[]>([]);

  // Sub-modal Configurar Pagos
  const [modalPagosAbierto, setModalPagosAbierto] = useState<boolean>(false);
  const [facturaIndexPagos, setFacturaIndexPagos] = useState<number | null>(null);
  const [pagosDraft, setPagosDraft] = useState<PagoProgramadoItem[]>([]);
  const [errorModalPagos, setErrorModalPagos] = useState<string | null>(null);

  // Generación rápida de pagos
  const [genFechaInicio, setGenFechaInicio] = useState<string>(hoyStr);
  const [genNumPagos, setGenNumPagos] = useState<number | "">(1);
  const [genFrecuencia, setGenFrecuencia] = useState<string>("mensual");

  // --- PARTE 3: CONFIRMACIÓN Y ENVÍO ---
  const [guardandoVenta, setGuardandoVenta] = useState<boolean>(false);
  const [errorBackend, setErrorBackend] = useState<string | null>(null);

  // Errores de validación por paso
  const [errorPaso1, setErrorPaso1] = useState<string | null>(null);
  const [errorPaso2, setErrorPaso2] = useState<string | null>(null);
  const [camposInvalidadosPaso2, setCamposInvalidadosPaso2] = useState<Record<string, boolean>>({});

  // Reset del modal al abrir
  useEffect(() => {
    if (abierto) {
      setPasoActual(1);
      setPasoMaximoAlcanzado(1);
      setEmpresaSeleccionadaId("");
      setSearchServicioText("");
      setServiciosBusqueda([]);
      setServiciosIndividuales([]);
      setGrupos([]);
      setServiciosParaAgruparIds(new Set());
      setCantidadFacturas(1);
      setDescripcionVenta("");
      setFacturas([]);
      setErrorPaso1(null);
      setErrorPaso2(null);
      setErrorBackend(null);
      cargarEmpresas();
    }
  }, [abierto]);

  // Cargar lista de empresas
  const cargarEmpresas = async () => {
    setCargandoEmpresas(true);
    const data = await EmpresasService.getEmpresas();
    setEmpresas(data);
    setCargandoEmpresas(false);
  };

  // Empresa seleccionada objeto
  const empresaSeleccionada = useMemo(() => {
    return empresas.find((e) => e.iD_Empresa.toString() === empresaSeleccionadaId) || null;
  }, [empresas, empresaSeleccionadaId]);

  // Búsqueda de servicios con Debounce
  useEffect(() => {
    if (!empresaSeleccionadaId) {
      setServiciosBusqueda([]);
      return;
    }

    const timer = setTimeout(async () => {
      setBuscandoServicios(true);
      const res = await FacturasService.getServiciosSinFactura(
        Number(empresaSeleccionadaId),
        searchServicioText
      );
      setServiciosBusqueda(res);
      setBuscandoServicios(false);
    }, 350);

    return () => clearTimeout(timer);
  }, [empresaSeleccionadaId, searchServicioText]);

  // Cerrar dropdowns al hacer clic afuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerServicioRef.current &&
        !containerServicioRef.current.contains(event.target as Node)
      ) {
        setDropdownServicioAbierto(false);
      }
      if (
        dropdownAgruparRef.current &&
        !dropdownAgruparRef.current.contains(event.target as Node)
      ) {
        setDropdownAgruparAbierto(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getServicioUniqueKey = (s: any): string => {
    if (!s) return "";
    if (s.i_CveServAgendaDet) return `ad-${s.i_CveServAgendaDet}`;
    return `srv-${s.i_CveServicio || Date.now()}`;
  };

  // Excluir de la búsqueda los servicios que ya están seleccionados o agrupados
  const keysSeleccionadas = useMemo(() => {
    const setKeys = new Set<string>();
    serviciosIndividuales.forEach((s) => setKeys.add(getServicioUniqueKey(s)));
    grupos.forEach((g) => g.servicios.forEach((s) => setKeys.add(getServicioUniqueKey(s))));
    return setKeys;
  }, [serviciosIndividuales, grupos]);

  const resultadosFiltradosBusqueda = useMemo(() => {
    return serviciosBusqueda.filter((s) => !keysSeleccionadas.has(getServicioUniqueKey(s)));
  }, [serviciosBusqueda, keysSeleccionadas]);

  // Agregar servicio individual desde la búsqueda
  const handleAgregarServicioIndividual = (srv: ServicioSinFacturaDto) => {
    const subtotal = srv.d_Subtotal ?? 0;
    const total = srv.d_Total ?? 0;

    const itemNuevo: ServicioSeleccionadoItem = {
      ...srv,
      idTemp: `srv-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      subtotal,
      total,
    };

    setServiciosIndividuales((prev) => [...prev, itemNuevo]);
    setSearchServicioText("");
    setDropdownServicioAbierto(false);
    setErrorPaso1(null);
  };

  // Quitar servicio individual
  const handleQuitarServicioIndividual = (idTemp: string) => {
    setServiciosIndividuales((prev) => prev.filter((s) => s.idTemp !== idTemp));
    setServiciosParaAgruparIds((prev) => {
      const next = new Set(prev);
      next.delete(idTemp);
      return next;
    });
  };

  // Choicechips selection handlers
  const toggleSeleccionParaAgrupar = (idTemp: string) => {
    setServiciosParaAgruparIds((prev) => {
      const next = new Set(prev);
      if (next.has(idTemp)) next.delete(idTemp);
      else next.add(idTemp);
      return next;
    });
  };

  const toggleSeleccionarTodosParaAgrupar = () => {
    if (serviciosParaAgruparIds.size === serviciosIndividuales.length) {
      setServiciosParaAgruparIds(new Set());
    } else {
      setServiciosParaAgruparIds(new Set(serviciosIndividuales.map((s) => s.idTemp)));
    }
  };

  // Crear nuevo grupo con los servicios seleccionados vía choicechips
  const handleCrearGrupo = () => {
    if (!nombreNuevoGrupo.trim()) {
      toast.warning("Ingresa un nombre para el concepto agrupado.");
      return;
    }
    if (serviciosIndividuales.length === 0) {
      toast.warning("No hay servicios disponibles para agrupar.");
      return;
    }

    const itemsAAgrupar = serviciosParaAgruparIds.size > 0
      ? serviciosIndividuales.filter((s) => serviciosParaAgruparIds.has(s.idTemp))
      : serviciosIndividuales;

    if (itemsAAgrupar.length === 0) {
      toast.warning("Selecciona al menos un servicio con la casilla para agrupar.");
      return;
    }

    const sumaSubtotales = itemsAAgrupar.reduce((acc, s) => acc + s.subtotal, 0);
    const sumaTotales = itemsAAgrupar.reduce((acc, s) => acc + s.total, 0);

    const nuevoGrupo: GrupoFacturaState = {
      idGrupo: `grp-${Date.now()}`,
      v_NombreProyecto: nombreNuevoGrupo.trim(),
      d_MontoProyecto: Math.round(sumaSubtotales * 100) / 100,
      total: Math.round(sumaTotales * 100) / 100,
      servicios: [...itemsAAgrupar],
      expandido: true,
    };

    setGrupos((prev) => [...prev, nuevoGrupo]);

    const idsAgrupados = new Set(itemsAAgrupar.map((s) => s.idTemp));
    setServiciosIndividuales((prev) => prev.filter((s) => !idsAgrupados.has(s.idTemp)));
    setServiciosParaAgruparIds(new Set());
    setNombreNuevoGrupo("");
    setDropdownAgruparAbierto(false);
  };

  // Agregar servicios elegidos a un grupo existente
  const handleAgregarAGrupoExistente = (idGrupo: string) => {
    if (serviciosIndividuales.length === 0) return;

    const itemsAAgrupar = serviciosParaAgruparIds.size > 0
      ? serviciosIndividuales.filter((s) => serviciosParaAgruparIds.has(s.idTemp))
      : serviciosIndividuales;

    if (itemsAAgrupar.length === 0) {
      toast.warning("Selecciona al menos un servicio con la casilla para agrupar.");
      return;
    }

    setGrupos((prev) =>
      prev.map((g) => {
        if (g.idGrupo === idGrupo) {
          const svcsActualizados = [...g.servicios, ...itemsAAgrupar];
          const nuevaSumaSub = svcsActualizados.reduce((acc, s) => acc + s.subtotal, 0);
          const nuevaSumaTot = svcsActualizados.reduce((acc, s) => acc + s.total, 0);
          return {
            ...g,
            servicios: svcsActualizados,
            d_MontoProyecto: Math.round(nuevaSumaSub * 100) / 100,
            total: Math.round(nuevaSumaTot * 100) / 100,
          };
        }
        return g;
      })
    );

    const idsAgrupados = new Set(itemsAAgrupar.map((s) => s.idTemp));
    setServiciosIndividuales((prev) => prev.filter((s) => !idsAgrupados.has(s.idTemp)));
    setServiciosParaAgruparIds(new Set());
    setDropdownAgruparAbierto(false);
  };

  // Sacar servicio de un grupo y devolverlo a seleccionados individuales
  const handleSacarServicioDeGrupo = (idGrupo: string, idTempServicio: string) => {
    let servicioSacado: ServicioSeleccionadoItem | null = null;
    setGrupos((prev) =>
      prev
        .map((g) => {
          if (g.idGrupo === idGrupo) {
            servicioSacado = g.servicios.find((s) => s.idTemp === idTempServicio) || null;
            const svcsRestantes = g.servicios.filter((s) => s.idTemp !== idTempServicio);
            if (svcsRestantes.length === 0) {
              return null; // El grupo se elimina automáticamente si queda vacío
            }
            return {
              ...g,
              servicios: svcsRestantes,
            };
          }
          return g;
        })
        .filter(Boolean) as GrupoFacturaState[]
    );
    if (servicioSacado) {
      setServiciosIndividuales((prev) => [...prev, servicioSacado!]);
    }
  };

  // Editar subtotal de grupo manualmente
  const handleCambiarSubtotalGrupo = (idGrupo: string, nuevoSubtotal: number | "") => {
    setGrupos((prev) =>
      prev.map((g) => {
        if (g.idGrupo === idGrupo) {
          const valNum = typeof nuevoSubtotal === "number" ? Math.max(0, nuevoSubtotal) : "";
          const tot = typeof valNum === "number" ? Math.round(valNum * 1.16 * 100) / 100 : 0;
          return {
            ...g,
            d_MontoProyecto: valNum,
            total: tot,
          };
        }
        return g;
      })
    );
  };

  // Eliminar grupo completo y devolver sus servicios a individuales
  const handleEliminarGrupo = (idGrupo: string) => {
    const grupoAEliminar = grupos.find((g) => g.idGrupo === idGrupo);
    if (grupoAEliminar) {
      setServiciosIndividuales((prev) => [...prev, ...grupoAEliminar.servicios]);
    }
    setGrupos((prev) => prev.filter((g) => g.idGrupo !== idGrupo));
  };

  // Toggle expandir grupo
  const handleToggleExpandirGrupo = (idGrupo: string) => {
    setGrupos((prev) =>
      prev.map((g) => (g.idGrupo === idGrupo ? { ...g, expandido: !g.expandido } : g))
    );
  };

  // Cálculos de totales de Parte 1
  const subtotalServicios = useMemo(() => {
    const sumIndiv = serviciosIndividuales.reduce((acc, s) => acc + s.subtotal, 0);
    const sumGrp = grupos.reduce(
      (acc, g) => acc + (typeof g.d_MontoProyecto === "number" ? g.d_MontoProyecto : 0),
      0
    );
    return Math.round((sumIndiv + sumGrp) * 100) / 100;
  }, [serviciosIndividuales, grupos]);

  const totalServiciosCve = useMemo(() => {
    const sumIndivTotal = serviciosIndividuales.reduce((acc, s) => acc + s.total, 0);
    const sumGrpTotal = grupos.reduce((acc, g) => acc + g.total, 0);
    return Math.round((sumIndivTotal + sumGrpTotal) * 100) / 100;
  }, [serviciosIndividuales, grupos]);

  // Sincronizar / Repartir montos automáticamente entre las facturas de la Parte 2
  const sincronizarFacturasConCantidad = (cant: number, totalCve: number) => {
    const num = Math.max(1, cant);
    setCantidadFacturas(num);

    let facturasExistentes = [...facturas];

    // Ajustar tamaño del array de facturas
    if (facturasExistentes.length < num) {
      for (let i = facturasExistentes.length; i < num; i++) {
        facturasExistentes.push({
          idFactura: `fac-${Date.now()}-${i}`,
          v_NoFactura: "",
          d_FechaExpedicion: hoyStr,
          d_Monto: 0,
          v_Descripcion: "",
          b_Timbrada: false,
          abonos: [],
        });
      }
    } else if (facturasExistentes.length > num) {
      facturasExistentes = facturasExistentes.slice(0, num);
    }

    // Repartir el monto total equitativamente entre las N facturas
    const montoBase = Math.floor((totalCve / num) * 100) / 100;
    const residuo = Math.round((totalCve - montoBase * num) * 100) / 100;

    const facturasActualizadas = facturasExistentes.map((f, idx) => {
      const montoFactura = idx === num - 1 ? Math.round((montoBase + residuo) * 100) / 100 : montoBase;
      // Si la factura no tenía abonos o eran automáticos, generar 1 abono por defecto
      let abonosFactura = f.abonos;
      if (abonosFactura.length <= 1) {
        abonosFactura = [
          {
            idPago: `pag-${Date.now()}-${idx}`,
            d_FechaProgramada: f.d_FechaExpedicion || hoyStr,
            d_Monto: montoFactura,
          },
        ];
      }
      return {
        ...f,
        d_Monto: montoFactura,
        abonos: abonosFactura,
      };
    });

    setFacturas(facturasActualizadas);
  };

  // --- NAVEGACIÓN Y VALIDACIONES DEL WIZARD ---

  const handleAvanzarPaso1 = () => {
    if (!empresaSeleccionadaId) {
      setErrorPaso1("Selecciona una empresa para continuar.");
      toast.warning("Selecciona una empresa para continuar.");
      return;
    }
    if (serviciosIndividuales.length === 0 && grupos.length === 0) {
      setErrorPaso1("Agrega al menos un servicio o concepto agrupado a la lista.");
      toast.warning("Agrega al menos un servicio o concepto agrupado.");
      return;
    }

    setErrorPaso1(null);
    sincronizarFacturasConCantidad(typeof cantidadFacturas === "number" ? cantidadFacturas : 1, totalServiciosCve);
    setPasoActual(2);
    setPasoMaximoAlcanzado((prev) => Math.max(prev, 2));
  };

  const totalFacturadoCve = useMemo(() => {
    return (
      Math.round(
        facturas.reduce((acc, f) => acc + (typeof f.d_Monto === "number" ? f.d_Monto : 0), 0) * 100
      ) / 100
    );
  }, [facturas]);

  const descuadreFacturas = useMemo(() => {
    return Math.abs(totalFacturadoCve - totalServiciosCve) > 0.01;
  }, [totalFacturadoCve, totalServiciosCve]);

  const handleAvanzarPaso2 = () => {
    const invalidos: Record<string, boolean> = {};
    let errorMsg: string | null = null;

    facturas.forEach((f, idx) => {
      if (!f.v_NoFactura.trim()) {
        invalidos[`noFactura-${idx}`] = true;
        errorMsg = "Completa los números de factura requeridos (*).";
      }
      if (!f.d_FechaExpedicion) {
        invalidos[`fecha-${idx}`] = true;
        errorMsg = "Completa las fechas de expedición requeridas (*).";
      }
      if (typeof f.d_Monto !== "number" || f.d_Monto <= 0) {
        invalidos[`monto-${idx}`] = true;
        errorMsg = "Los montos de factura deben ser mayores a $0.";
      }
      if (f.abonos.length === 0) {
        invalidos[`abonos-${idx}`] = true;
        errorMsg = "Configura al menos un pago programado en cada factura.";
      }
      const sumaAbonos = f.abonos.reduce(
        (acc, a) => acc + (typeof a.d_Monto === "number" ? a.d_Monto : 0),
        0
      );
      if (Math.abs(sumaAbonos - (Number(f.d_Monto) || 0)) > 0.01) {
        invalidos[`abonos-${idx}`] = true;
        errorMsg = `Los pagos de la Factura ${idx + 1} no coinciden con su monto.`;
      }
    });

    if (descuadreFacturas) {
      errorMsg = `El total facturado ($${totalFacturadoCve.toLocaleString(
        "es-MX"
      )}) no coincide con el total de servicios ($${totalServiciosCve.toLocaleString("es-MX")}).`;
    }

    if (Object.keys(invalidos).length > 0 || errorMsg) {
      setCamposInvalidadosPaso2(invalidos);
      setErrorPaso2(errorMsg || "Revisa los campos marcados en rojo.");
      toast.error(errorMsg || "Por favor completa la información de las facturas.");
      return;
    }

    setCamposInvalidadosPaso2({});
    setErrorPaso2(null);
    setPasoActual(3);
    setPasoMaximoAlcanzado((prev) => Math.max(prev, 3));
  };

  // --- SUB-MODAL DE CONFIGURACIÓN DE PAGOS POR FACTURA ---

  const handleAbrirConfigurarPagos = (indexFactura: number) => {
    const f = facturas[indexFactura];
    setFacturaIndexPagos(indexFactura);
    setPagosDraft(JSON.parse(JSON.stringify(f.abonos)));
    setGenFechaInicio(f.d_FechaExpedicion || hoyStr);
    setGenNumPagos(f.abonos.length > 0 ? f.abonos.length : 1);
    setGenFrecuencia("mensual");
    setErrorModalPagos(null);
    setModalPagosAbierto(true);
  };

  const handleGenerarPagosRapidos = () => {
    if (facturaIndexPagos === null) return;
    const f = facturas[facturaIndexPagos];
    const montoFactura = Number(f.d_Monto) || 0;
    if (montoFactura <= 0) {
      toast.warning("Captura primero un monto válido en la factura antes de generar pagos.");
      return;
    }

    const numPagosVal = typeof genNumPagos === "number" ? genNumPagos : 1;
    const n = Math.max(1, numPagosVal);
    const montoBase = Math.floor((montoFactura / n) * 100) / 100;
    const residuo = Math.round((montoFactura - montoBase * n) * 100) / 100;

    let fechaActual = new Date(genFechaInicio || hoyStr);
    const nuevosPagos: PagoProgramadoItem[] = [];

    for (let i = 0; i < n; i++) {
      const montoItem = i === n - 1 ? Math.round((montoBase + residuo) * 100) / 100 : montoBase;
      const fechaStr = fechaActual.toISOString().split("T")[0];

      nuevosPagos.push({
        idPago: `pag-gen-${Date.now()}-${i}`,
        d_FechaProgramada: fechaStr,
        d_Monto: montoItem,
      });

      // Incrementar según la frecuencia elegida
      if (genFrecuencia === "semanal") fechaActual = addDays(fechaActual, 7);
      else if (genFrecuencia === "quincenal") fechaActual = addDays(fechaActual, 15);
      else if (genFrecuencia === "tres_semanas") fechaActual = addDays(fechaActual, 21);
      else if (genFrecuencia === "mensual") fechaActual = addMonths(fechaActual, 1);
      else if (genFrecuencia === "bimestral") fechaActual = addMonths(fechaActual, 2);
      else if (genFrecuencia === "trimestral") fechaActual = addMonths(fechaActual, 3);
      else if (genFrecuencia === "semestral") fechaActual = addMonths(fechaActual, 6);
    }

    setPagosDraft(nuevosPagos);
    setErrorModalPagos(null);
  };

  const handleAgregarFilaPagoManual = () => {
    setPagosDraft((prev) => [
      ...prev,
      {
        idPago: `pag-man-${Date.now()}-${Math.random()}`,
        d_FechaProgramada: hoyStr,
        d_Monto: "",
      },
    ]);
  };

  const handleEliminarFilaPagoManual = (idPago: string) => {
    setPagosDraft((prev) => prev.filter((p) => p.idPago !== idPago));
  };

  const sumaPagosDraft = useMemo(() => {
    return Math.round(
      pagosDraft.reduce((acc, p) => acc + (typeof p.d_Monto === "number" ? p.d_Monto : 0), 0) * 100
    ) / 100;
  }, [pagosDraft]);

  const handleAplicarPagosModal = () => {
    if (facturaIndexPagos === null) return;
    const f = facturas[facturaIndexPagos];
    const montoFactura = Number(f.d_Monto) || 0;

    if (pagosDraft.length === 0) {
      setErrorModalPagos("Agrega al menos un pago programado.");
      return;
    }

    for (let p of pagosDraft) {
      if (!p.d_FechaProgramada) {
        setErrorModalPagos("Todos los pagos deben tener una fecha programada.");
        return;
      }
      if (typeof p.d_Monto !== "number" || p.d_Monto <= 0) {
        setErrorModalPagos("Todos los pagos deben tener un monto mayor a $0.");
        return;
      }
    }

    if (Math.abs(sumaPagosDraft - montoFactura) > 0.01) {
      setErrorModalPagos(
        `La suma de los pagos ($${sumaPagosDraft.toLocaleString(
          "es-MX"
        )}) no coincide con el monto de la factura ($${montoFactura.toLocaleString("es-MX")}).`
      );
      return;
    }

    setFacturas((prev) =>
      prev.map((fac, idx) => (idx === facturaIndexPagos ? { ...fac, abonos: [...pagosDraft] } : fac))
    );

    setModalPagosAbierto(false);
    toast.success("Pagos configurados correctamente.");
  };

  // --- ENVÍO FINAL DEL PAYLOAD A CREARVENTAFACTURAS ---

  const handleConfirmarVentaFinal = async () => {
    if (!empresaSeleccionada) return;

    setGuardandoVenta(true);
    setErrorBackend(null);

    const payload = {
      i_CveEmpresa: empresaSeleccionada.iD_Empresa,
      v_DescripcionVenta: descripcionVenta.trim() || null,
      ServiciosIds: serviciosIndividuales.map((s) => s.i_CveServAgendaDet),
      Grupos: grupos.map((g) => ({
        v_NombreProyecto: g.v_NombreProyecto,
        d_MontoProyecto: typeof g.d_MontoProyecto === "number" ? g.d_MontoProyecto : 0,
        ServiciosIds: g.servicios.map((s) => s.i_CveServAgendaDet),
      })),
      Facturas: facturas.map((f) => ({
        v_NoFactura: f.v_NoFactura.trim(),
        d_FechaExpedicion: f.d_FechaExpedicion,
        d_Monto: Number(f.d_Monto) || 0,
        v_Descripcion: f.v_Descripcion.trim() || null,
        b_Timbrada: Boolean(f.b_Timbrada),
        Abonos: f.abonos.map((a) => ({
          d_FechaProgramada: a.d_FechaProgramada,
          d_Monto: Number(a.d_Monto) || 0,
        })),
      })),
    };

    const res = await FacturasService.crearVentaFacturas(payload);
    setGuardandoVenta(false);

    if (res.exito) {
      toast.success("Factura(s) creada(s) correctamente.");
      if (onGuardar) onGuardar();
      onCerrar();
    } else {
      setErrorBackend(res.mensaje || "Ocurrió un error al guardar la venta de facturas.");
    }
  };

  // Helper render badge tipo de servicio
  const renderBadgeTipo = (tipoStr?: string | null) => {
    const tipoUpper = (tipoStr || "").trim().toUpperCase();
    let bg = "#f8f9fa";
    let text = "#495057";
    let label = tipoUpper || "GENERAL";

    switch (tipoUpper) {
      case "CAPACITACIÓN":
      case "CAPACITACION":
        bg = "#fff3cd";
        text = "#856404";
        label = "CAPACITACIÓN";
        break;
      case "ESTUDIOS":
        bg = "#cfe2ff";
        text = "#084298";
        label = "ESTUDIOS";
        break;
      case "PRODUCTOS":
        bg = "#e8d5f5";
        text = "#6f42c1";
        label = "PRODUCTOS";
        break;
      case "SERVICIO":
        bg = "#d4f0f7";
        text = "#0e6b8a";
        label = "SERVICIO";
        break;
      default:
        bg = "#f8f9fa";
        text = "#495057";
        label = tipoUpper || "GENERAL";
        break;
    }

    return (
      <span
        style={{
          display: "inline-block",
          padding: "3px 10px",
          fontSize: "11px",
          fontWeight: 700,
          borderRadius: "12px",
          backgroundColor: bg,
          color: text,
          textTransform: "uppercase",
          letterSpacing: "0.3px",
        }}
      >
        {label}
      </span>
    );
  };

  if (!abierto) return null;

  return (
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
        WebkitBackdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: "16px",
      }}
    >
      <div
        className="modal-content custom-scrollbar"
        style={{
          maxWidth: pasoActual === 3 ? "980px" : "900px",
          width: "95%",
          maxHeight: "94vh",
          display: "flex",
          flexDirection: "column",
          borderRadius: "14px",
          overflow: "hidden",
          backgroundColor: "#ffffff",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
        }}
      >
        {/* HEADER MODAL */}
        <div
          style={{
            padding: "14px 24px",
            borderBottom: "1px solid #ddeaf5",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            backgroundColor: "#ffffff",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "10px",
                backgroundColor: "#eaf4fb",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "4px",
              }}
            >
              <img
                src="/assets/gi_slogo.png"
                alt="GOODIDEA Logo"
                style={{ width: "24px", height: "24px", objectFit: "contain" }}
              />
            </div>
            <div>
              <h3
                style={{
                  fontSize: "17px",
                  fontWeight: 700,
                  color: "#1e3a5f",
                  margin: 0,
                  lineHeight: 1.2,
                }}
              >
                Nueva factura
              </h3>
              <span style={{ fontSize: "12px", color: "#6c757d" }}>
                Selecciona la empresa, agrupa conceptos y configura el plan de facturación.
              </span>
            </div>
          </div>

          <button type="button" className="btn-close" onClick={onCerrar}>
            <X size={18} />
          </button>
        </div>

        {/* BARRA DE PASOS (STEPPER) */}
        <div
          style={{
            padding: "10px 40px 8px 40px",
            backgroundColor: "#f8fafc",
            borderBottom: "1px solid #e2e8f0",
            position: "relative",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              position: "relative",
              maxWidth: "600px",
              margin: "0 auto",
            }}
          >
            {/* Línea horizontal de fondo */}
            <div
              style={{
                position: "absolute",
                top: "15px",
                left: "calc(100% / 6)",
                width: "calc(100% * 2 / 3)",
                height: "3px",
                backgroundColor: "#e0e0e0",
                zIndex: 1,
              }}
            />
            {/* Línea de progreso amarilla */}
            <div
              style={{
                position: "absolute",
                top: "15px",
                left: "calc(100% / 6)",
                width:
                  pasoActual === 1
                    ? "0%"
                    : pasoActual === 2
                    ? "calc(100% / 3)"
                    : "calc(100% * 2 / 3)",
                height: "3px",
                backgroundColor: "#facc15",
                zIndex: 2,
                transition: "width 0.3s ease",
              }}
            />

            {/* Paso 1 */}
            <div
              style={{
                zIndex: 3,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                cursor: "pointer",
              }}
              onClick={() => setPasoActual(1)}
            >
              <div
                style={{
                  width: "30px",
                  height: "30px",
                  borderRadius: "50%",
                  backgroundColor: pasoActual >= 1 ? "#0d6efd" : "#e0e0e0",
                  color: "#ffffff",
                  fontSize: "13px",
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: pasoActual === 1 ? "0 0 0 4px rgba(13, 110, 253, 0.2)" : "none",
                  transition: "all 0.2s ease",
                }}
              >
                {pasoMaximoAlcanzado > 1 ? <Check size={16} /> : "1"}
              </div>
              <span
                style={{
                  fontSize: "12px",
                  marginTop: "6px",
                  fontWeight: pasoActual === 1 ? 700 : 500,
                  color: pasoActual === 1 ? "#0d6efd" : "#6c757d",
                }}
              >
                Cliente y servicios
              </span>
            </div>

            {/* Paso 2 */}
            <div
              style={{
                zIndex: 3,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                cursor: pasoMaximoAlcanzado >= 2 ? "pointer" : "default",
              }}
              onClick={() => {
                if (pasoMaximoAlcanzado >= 2) setPasoActual(2);
              }}
            >
              <div
                style={{
                  width: "30px",
                  height: "30px",
                  borderRadius: "50%",
                  backgroundColor: pasoActual >= 2 ? "#0d6efd" : "#e0e0e0",
                  color: pasoActual >= 2 ? "#ffffff" : "#999999",
                  fontSize: "13px",
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: pasoActual === 2 ? "0 0 0 4px rgba(13, 110, 253, 0.2)" : "none",
                  transition: "all 0.2s ease",
                }}
              >
                {pasoMaximoAlcanzado > 2 ? <Check size={16} /> : "2"}
              </div>
              <span
                style={{
                  fontSize: "12px",
                  marginTop: "6px",
                  fontWeight: pasoActual === 2 ? 700 : 500,
                  color: pasoActual === 2 ? "#0d6efd" : "#6c757d",
                }}
              >
                Configuración de venta
              </span>
            </div>

            {/* Paso 3 */}
            <div
              style={{
                zIndex: 3,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                cursor: pasoMaximoAlcanzado >= 3 ? "pointer" : "default",
              }}
              onClick={() => {
                if (pasoMaximoAlcanzado >= 3) setPasoActual(3);
              }}
            >
              <div
                style={{
                  width: "30px",
                  height: "30px",
                  borderRadius: "50%",
                  backgroundColor: pasoActual === 3 ? "#0d6efd" : "#e0e0e0",
                  color: pasoActual === 3 ? "#ffffff" : "#999999",
                  fontSize: "13px",
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: pasoActual === 3 ? "0 0 0 4px rgba(13, 110, 253, 0.2)" : "none",
                  transition: "all 0.2s ease",
                }}
              >
                3
              </div>
              <span
                style={{
                  fontSize: "12px",
                  marginTop: "6px",
                  fontWeight: pasoActual === 3 ? 700 : 500,
                  color: pasoActual === 3 ? "#0d6efd" : "#6c757d",
                }}
              >
                Confirmación
              </span>
            </div>
          </div>
        </div>

        {/* BODY MODAL */}
        <div
          className="custom-scrollbar"
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "20px 24px",
            minHeight: "420px",
            backgroundColor: "#ffffff",
          }}
        >
          {/* ==================================================== */}
          {/* PARTE 1 — EMPRESA Y SERVICIOS */}
          {/* ==================================================== */}
          {pasoActual === 1 && (
            <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
              {errorPaso1 && (
                <div
                  style={{
                    backgroundColor: "#fef2f2",
                    border: "1px solid #fecaca",
                    color: "#dc2626",
                    padding: "10px 14px",
                    borderRadius: "8px",
                    fontSize: "13px",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <AlertCircle size={18} />
                  <span>{errorPaso1}</span>
                </div>
              )}

              {/* 1.1 Bloque Empresa */}
              <div
                style={{
                  border: "1px solid #d8e6f0",
                  borderRadius: "12px",
                  padding: "18px 20px",
                  backgroundColor: "#ffffff",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    marginBottom: "14px",
                    borderBottom: "1px solid #f1f5f9",
                    paddingBottom: "10px",
                  }}
                >
                  <Building2 size={18} style={{ color: "#2B8FCC" }} />
                  <h4
                    style={{
                      fontSize: "13px",
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                      color: "#1e3a5f",
                      margin: 0,
                    }}
                  >
                    Empresa
                  </h4>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  {/* Select Empresa */}
                  <div>
                    <label
                      style={{
                        fontSize: "12px",
                        fontWeight: 700,
                        color: "#4a6580",
                        display: "block",
                        marginBottom: "4px",
                      }}
                    >
                      Empresa<span style={{ color: "#dc2626" }}>*</span>
                    </label>
                    <select
                      className="form-select"
                      style={{
                        borderRadius: "8px",
                        height: "36px",
                        fontSize: "13px",
                        border: !empresaSeleccionadaId && errorPaso1 ? "1px solid #dc3545" : "1px solid #d0dce8",
                      }}
                      value={empresaSeleccionadaId}
                      onChange={(e) => {
                        setEmpresaSeleccionadaId(e.target.value);
                        setServiciosIndividuales([]);
                        setGrupos([]);
                        setErrorPaso1(null);
                      }}
                      disabled={cargandoEmpresas}
                    >
                      <option value="">-- Selecciona una empresa --</option>
                      {empresas.map((emp) => (
                        <option key={emp.iD_Empresa} value={emp.iD_Empresa}>
                          {emp.s_RazonSocial} {emp.s_RFC ? `(${emp.s_RFC})` : ""}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Autocomplete Buscador por Servicio / Cotización */}
                  <div style={{ position: "relative" }} ref={containerServicioRef}>
                    <label
                      style={{
                        fontSize: "12px",
                        fontWeight: 700,
                        color: "#4a6580",
                        display: "block",
                        marginBottom: "4px",
                      }}
                    >
                      Buscar por servicio o cotización
                    </label>
                    <div style={{ position: "relative" }}>
                      <Search
                        size={16}
                        style={{
                          position: "absolute",
                          left: "12px",
                          top: "50%",
                          transform: "translateY(-50%)",
                          color: "#94a3b8",
                        }}
                      />
                      <input
                        type="text"
                        className="form-control"
                        disabled={!empresaSeleccionadaId}
                        style={{
                          borderRadius: "8px",
                          height: "36px",
                          fontSize: "13px",
                          paddingLeft: "36px",
                          paddingRight: searchServicioText ? "30px" : "12px",
                          border: "1px solid #d0dce8",
                          backgroundColor: !empresaSeleccionadaId ? "#f8fafc" : "#ffffff",
                        }}
                        placeholder={
                          empresaSeleccionadaId
                            ? "Escribe el nombre o folio de cotización..."
                            : "Selecciona primero una empresa"
                        }
                        value={searchServicioText}
                        onFocus={() => {
                          if (empresaSeleccionadaId) setDropdownServicioAbierto(true);
                        }}
                        onChange={(e) => {
                          setSearchServicioText(e.target.value);
                          setDropdownServicioAbierto(true);
                        }}
                      />
                      {searchServicioText && (
                        <button
                          type="button"
                          onClick={() => setSearchServicioText("")}
                          style={{
                            position: "absolute",
                            right: "8px",
                            top: "50%",
                            transform: "translateY(-50%)",
                            background: "none",
                            border: "none",
                            color: "#94a3b8",
                            cursor: "pointer",
                          }}
                        >
                          ✕
                        </button>
                      )}
                    </div>

                    {/* Panel flotante de resultados de búsqueda */}
                    {dropdownServicioAbierto && (
                      <div
                        className="custom-scrollbar"
                        style={{
                          position: "absolute",
                          top: "100%",
                          left: 0,
                          right: 0,
                          backgroundColor: "#ffffff",
                          borderRadius: "10px",
                          border: "1px solid #cbd5e1",
                          boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.15)",
                          maxHeight: "260px",
                          overflowY: "auto",
                          zIndex: 1000,
                          marginTop: "4px",
                        }}
                      >
                        {buscandoServicios ? (
                          <div style={{ padding: "12px", fontSize: "13px", color: "#64748b", textAlign: "center" }}>
                            Buscando servicios sin facturar...
                          </div>
                        ) : resultadosFiltradosBusqueda.length === 0 ? (
                          <div style={{ padding: "12px", fontSize: "13px", color: "#64748b", textAlign: "center" }}>
                            No se encontraron servicios disponibles para esta empresa.
                          </div>
                        ) : (
                          resultadosFiltradosBusqueda.map((srv, srvIdx) => {
                            const noCot = srv.v_NoCotizacionGI;
                            const uniqueKey = getServicioUniqueKey(srv) || `srv-item-${srvIdx}`;
                            return (
                              <div
                                key={uniqueKey}
                                onClick={() => handleAgregarServicioIndividual(srv)}
                                style={{
                                  padding: "10px 14px",
                                  borderBottom: "1px solid #f1f5f9",
                                  cursor: "pointer",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "space-between",
                                  transition: "background-color 0.15s ease",
                                }}
                                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f4f8fc")}
                                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                              >
                                <div>
                                  <div style={{ fontWeight: 600, color: "#1e3a5f", fontSize: "13px" }}>
                                    {srv.v_Servicio}
                                  </div>
                                  <div style={{ fontSize: "11px", color: "#64748b", marginTop: "2px" }}>
                                    {srv.i_Cantidad != null ? `${Number(srv.i_Cantidad).toFixed(2)} ${srv.v_Unidad || ""} — ` : ""}
                                    Subtotal: ${(srv.d_Subtotal ?? 0).toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                                  </div>
                                </div>
                                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                  {renderBadgeTipo(srv.v_TipoServicio)}
                                  {noCot ? (
                                    <span style={{ fontSize: "11px", color: "#64748b", fontWeight: 600 }}>
                                      Cot. {noCot}
                                    </span>
                                  ) : (
                                    <span style={{ fontSize: "11px", color: "#ef4444", fontWeight: 700 }}>
                                      Pendiente
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* 1.2 Bloque Seleccionados */}
              {empresaSeleccionadaId && (
                <div
                  style={{
                    border: "1px solid #d8e6f0",
                    borderRadius: "12px",
                    padding: "18px 20px",
                    backgroundColor: "#ffffff",
                  }}
                >
                  {/* Header de Seleccionados + Botón "+ Agrupar" */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: "14px",
                    }}
                  >
                    <h4
                      style={{
                        fontSize: "13px",
                        fontWeight: 700,
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                        color: "#1e3a5f",
                        margin: 0,
                      }}
                    >
                      Seleccionados ({serviciosIndividuales.length + grupos.length})
                    </h4>

                    {/* Botón y Panel Flotante "+ Agrupar" */}
                    <div style={{ position: "relative" }} ref={dropdownAgruparRef}>
                      <button
                        type="button"
                        onClick={() => setDropdownAgruparAbierto(!dropdownAgruparAbierto)}
                        disabled={serviciosIndividuales.length === 0}
                        style={{
                          backgroundColor: serviciosParaAgruparIds.size > 0 ? "#2B8FCC" : "#eaf4fb",
                          color: serviciosParaAgruparIds.size > 0 ? "#ffffff" : "#2B8FCC",
                          border: "1px solid #2B8FCC",
                          borderRadius: "20px",
                          padding: "5px 14px",
                          fontSize: "12px",
                          fontWeight: 600,
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px",
                          cursor: serviciosIndividuales.length === 0 ? "not-allowed" : "pointer",
                          opacity: serviciosIndividuales.length === 0 ? 0.5 : 1,
                          transition: "all 0.15s ease",
                        }}
                      >
                        <Plus size={14} /> + Agrupar {serviciosParaAgruparIds.size > 0 ? `(${serviciosParaAgruparIds.size})` : ""}
                      </button>

                      {/* Dropdown flotante "+ Agrupar" */}
                      {dropdownAgruparAbierto && (
                        <div
                          style={{
                            position: "absolute",
                            top: "100%",
                            right: 0,
                            width: "320px",
                            backgroundColor: "#ffffff",
                            borderRadius: "12px",
                            border: "1px solid #cbd5e1",
                            boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.15)",
                            zIndex: 1000,
                            marginTop: "6px",
                            padding: "14px",
                          }}
                        >
                          {/* Choicechips para seleccionar qué servicios agrupar */}
                          {serviciosIndividuales.length > 0 && (
                            <div style={{ marginBottom: "12px" }}>
                              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
                                <span style={{ fontSize: "11px", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>
                                  Servicios a agrupar ({serviciosParaAgruparIds.size}/{serviciosIndividuales.length})
                                </span>
                                <button
                                  type="button"
                                  onClick={toggleSeleccionarTodosParaAgrupar}
                                  style={{ background: "none", border: "none", fontSize: "11px", color: "#2B8FCC", fontWeight: 600, cursor: "pointer", padding: 0 }}
                                >
                                  {serviciosParaAgruparIds.size === serviciosIndividuales.length ? "Desmarcar" : "Marcar todos"}
                                </button>
                              </div>
                              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", maxHeight: "110px", overflowY: "auto", padding: "2px" }}>
                                {serviciosIndividuales.map((item) => {
                                  const checked = serviciosParaAgruparIds.has(item.idTemp);
                                  return (
                                    <button
                                      key={item.idTemp}
                                      type="button"
                                      onClick={() => toggleSeleccionParaAgrupar(item.idTemp)}
                                      style={{
                                        display: "inline-flex",
                                        alignItems: "center",
                                        gap: "6px",
                                        padding: "4px 8px",
                                        borderRadius: "6px",
                                        border: checked ? "1.5px solid #2B8FCC" : "1px solid #cbd5e1",
                                        backgroundColor: checked ? "#eaf4fb" : "#f8fafc",
                                        color: checked ? "#1e3a5f" : "#64748b",
                                        fontSize: "11px",
                                        fontWeight: 600,
                                        cursor: "pointer",
                                        transition: "all 0.15s ease",
                                      }}
                                    >
                                      <div
                                        style={{
                                          width: "14px",
                                          height: "14px",
                                          borderRadius: "3px",
                                          border: checked ? "1.5px solid #2B8FCC" : "1.5px solid #94a3b8",
                                          backgroundColor: checked ? "#2B8FCC" : "#ffffff",
                                          display: "flex",
                                          alignItems: "center",
                                          justifyContent: "center",
                                          color: "#fff",
                                        }}
                                      >
                                        {checked && <Check size={10} strokeWidth={3} />}
                                      </div>
                                      <span style={{ maxWidth: "160px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                        {item.v_Servicio}
                                      </span>
                                    </button>
                                  );
                                })}
                              </div>
                              <hr style={{ border: "none", borderTop: "1px solid #e2e8f0", margin: "10px 0" }} />
                            </div>
                          )}

                          {/* Agregar a grupo existente */}
                          {grupos.length > 0 && (
                            <div style={{ marginBottom: "12px" }}>
                              <span style={{ fontSize: "11px", fontWeight: 700, color: "#64748b", textTransform: "uppercase", display: "block", marginBottom: "6px" }}>
                                Agregar a grupo existente
                              </span>
                              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                                {grupos.map((g) => (
                                  <button
                                    key={g.idGrupo}
                                    type="button"
                                    onClick={() => handleAgregarAGrupoExistente(g.idGrupo)}
                                    style={{
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "space-between",
                                      padding: "8px 10px",
                                      backgroundColor: "#f4f8fc",
                                      border: "1px solid #d0dce8",
                                      borderRadius: "6px",
                                      cursor: "pointer",
                                      textAlign: "left",
                                    }}
                                  >
                                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                      <Folder size={14} style={{ color: "#7a96b0" }} />
                                      <span style={{ fontSize: "12px", fontWeight: 600, color: "#1e3a5f" }}>
                                        {g.v_NombreProyecto}
                                      </span>
                                    </div>
                                    <span style={{ fontSize: "11px", color: "#64748b" }}>
                                      {g.servicios.length} svc
                                    </span>
                                  </button>
                                ))}
                              </div>
                              <hr style={{ border: "none", borderTop: "1px solid #e2e8f0", margin: "10px 0" }} />
                            </div>
                          )}

                          {/* Crear Nuevo grupo */}
                          <div>
                            <span style={{ fontSize: "11px", fontWeight: 700, color: "#64748b", textTransform: "uppercase", display: "block", marginBottom: "6px" }}>
                              Nuevo grupo
                            </span>
                            <div style={{ display: "flex", gap: "6px" }}>
                              <input
                                type="text"
                                className="form-control"
                                style={{ height: "32px", fontSize: "12px", borderRadius: "6px" }}
                                placeholder="Nombre del concepto..."
                                value={nombreNuevoGrupo}
                                onChange={(e) => setNombreNuevoGrupo(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") handleCrearGrupo();
                                  if (e.key === "Escape") setDropdownAgruparAbierto(false);
                                }}
                              />
                              <button
                                type="button"
                                className="btn btn-primary"
                                style={{ height: "32px", padding: "0 12px", fontSize: "12px" }}
                                onClick={handleCrearGrupo}
                              >
                                +
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 1.2.2 Tabla de Seleccionados */}
                  {serviciosIndividuales.length === 0 && grupos.length === 0 ? (
                    <div
                      style={{
                        border: "2px dashed #cbd5e1",
                        borderRadius: "10px",
                        padding: "30px",
                        textAlign: "center",
                        backgroundColor: "#fafafa",
                        color: "#64748b",
                      }}
                    >
                      <Search size={28} style={{ color: "#94a3b8", marginBottom: "8px" }} />
                      <div style={{ fontSize: "13px", fontWeight: 500 }}>
                        Usa el buscador de arriba para encontrar y agregar servicios.
                      </div>
                    </div>
                  ) : (
                    <div className="alegra-table-container">
                      <style>{`
                        .alegra-table-nueva-factura th {
                          padding: 6px 12px !important;
                          font-size: 11px !important;
                          line-height: 1.2 !important;
                        }
                        .alegra-table-nueva-factura td {
                          padding: 6px 12px !important;
                          font-size: 12px !important;
                          line-height: 1.2 !important;
                        }
                        .alegra-table-nueva-factura tbody tr:hover td {
                          background-color: #ffffff !important;
                        }
                      `}</style>
                      <table className="alegra-table alegra-table-nueva-factura">
                        <thead>
                          <tr>
                            <th style={{ width: "60px", textAlign: "center" }}>
                              {serviciosIndividuales.length > 0 && (
                                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                                  <span style={{ fontSize: "14px", opacity: 0, userSelect: "none" }}>✕</span>
                                  <button
                                    type="button"
                                    onClick={toggleSeleccionarTodosParaAgrupar}
                                    style={{
                                      width: "18px",
                                      height: "18px",
                                      borderRadius: "4px",
                                      border: serviciosParaAgruparIds.size === serviciosIndividuales.length && serviciosIndividuales.length > 0 ? "2px solid #2B8FCC" : "2px solid #94a3b8",
                                      backgroundColor: serviciosParaAgruparIds.size === serviciosIndividuales.length && serviciosIndividuales.length > 0 ? "#2B8FCC" : "#ffffff",
                                      color: "#ffffff",
                                      display: "inline-flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      cursor: "pointer",
                                      padding: 0,
                                    }}
                                    title={serviciosParaAgruparIds.size === serviciosIndividuales.length && serviciosIndividuales.length > 0 ? "Desmarcar todos" : "Marcar todos para agrupar"}
                                  >
                                    {serviciosParaAgruparIds.size === serviciosIndividuales.length && serviciosIndividuales.length > 0 && <Check size={12} strokeWidth={3} />}
                                  </button>
                                </div>
                              )}
                            </th>
                            <th>No. cotización</th>
                            <th>Servicio</th>
                            <th>Tipo</th>
                            <th>Fecha inicio</th>
                            <th style={{ textAlign: "right", width: "130px" }}>Subtotal s/IVA</th>
                            <th style={{ textAlign: "right", width: "130px" }}>Total c/IVA</th>
                          </tr>
                        </thead>
                        <tbody>
                          {/* 1. FILAS DE GRUPO */}
                          {grupos.map((grp) => (
                            <React.Fragment key={grp.idGrupo}>
                              {/* Fila Encabezado de Grupo */}
                              <tr style={{ backgroundColor: "#f8fafc", borderLeft: "4px solid #7a96b0" }}>
                                <td style={{ textAlign: "center", width: "60px" }}>
                                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                                    <button
                                      type="button"
                                      onClick={() => handleEliminarGrupo(grp.idGrupo)}
                                      style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", padding: 0, fontSize: "14px", fontWeight: 700 }}
                                      title="Eliminar grupo y desagrupar servicios"
                                    >
                                      ✕
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleToggleExpandirGrupo(grp.idGrupo)}
                                      style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b", padding: 0, display: "inline-flex" }}
                                      title={grp.expandido ? "Colapsar grupo" : "Expandir grupo"}
                                    >
                                      {grp.expandido ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
                                    </button>
                                  </div>
                                </td>
                                <td>
                                  <span className="badge" style={{ backgroundColor: "#e2e8f0", color: "#475569" }}>
                                    <Folder size={12} style={{ marginRight: "4px" }} /> GRUPO
                                  </span>
                                </td>
                                <td>
                                  <div style={{ fontWeight: 700, color: "#1e3a5f" }}>{grp.v_NombreProyecto}</div>
                                  <div style={{ fontSize: "11px", color: "#64748b" }}>
                                    {grp.servicios.length} servicio(s) agrupado(s)
                                  </div>
                                </td>
                                <td>
                                  <span className="badge" style={{ backgroundColor: "#f0f0f0", color: "#555" }}>
                                    GENERAL
                                  </span>
                                </td>
                                <td style={{ color: "#64748b" }}>N/A</td>
                                <td style={{ textAlign: "right" }}>
                                  <input
                                    type="number"
                                    min={0}
                                    className="form-control"
                                    style={{
                                      height: "28px",
                                      padding: "2px 8px",
                                      fontSize: "12px",
                                      borderRadius: "6px",
                                      textAlign: "right",
                                      fontWeight: 700,
                                      color: "#1e3a5f",
                                    }}
                                    value={grp.d_MontoProyecto}
                                    onChange={(e) =>
                                      handleCambiarSubtotalGrupo(
                                        grp.idGrupo,
                                        e.target.value === "" ? "" : Number(e.target.value)
                                      )
                                    }
                                  />
                                </td>
                                <td style={{ textAlign: "right", fontWeight: 700, color: "#2B8FCC" }}>
                                  ${grp.total.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                                </td>
                              </tr>

                              {/* Filas Hijas del Grupo (si está expandido) */}
                              {grp.expandido &&
                                grp.servicios.map((child) => {
                                  const noCot = child.v_NoCotizacionGI;
                                  return (
                                    <tr key={child.idTemp} style={{ backgroundColor: "#ffffff", borderLeft: "4px solid #cbd5e1" }}>
                                      <td style={{ textAlign: "center" }}>
                                        <button
                                          type="button"
                                          onClick={() => handleSacarServicioDeGrupo(grp.idGrupo, child.idTemp)}
                                          style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer" }}
                                          title="Sacar del grupo"
                                        >
                                          ✕
                                        </button>
                                      </td>
                                      <td style={{ paddingLeft: "20px" }}>
                                        {noCot ? (
                                          <span style={{ fontSize: "12px", fontWeight: 600, color: "#475569" }}>
                                            Cot. {noCot}
                                          </span>
                                        ) : (
                                          <span style={{ fontSize: "12px", fontWeight: 600, color: "#ef4444" }}>
                                            Pendiente
                                          </span>
                                        )}
                                      </td>
                                      <td>
                                        <div style={{ fontWeight: 600, color: "#1e293b" }}>{child.v_Servicio}</div>
                                        {(child.i_Cantidad != null || child.v_Unidad) && (
                                          <div style={{ fontSize: "11px", color: "#64748b", marginTop: "1px" }}>
                                            {Number(child.i_Cantidad ?? 0).toFixed(2)} {child.v_Unidad || ""}
                                          </div>
                                        )}
                                      </td>
                                      <td>{renderBadgeTipo(child.v_TipoServicio)}</td>
                                      <td style={{ color: "#64748b" }}>
                                        {child.d_FechaInicio
                                          ? formatearFechaTexto(child.d_FechaInicio)
                                          : "Sin programar"}
                                      </td>
                                      <td style={{ textAlign: "right", color: "#64748b" }}>
                                        ${child.subtotal.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                                      </td>
                                      <td style={{ textAlign: "right", color: "#64748b" }}>
                                        ${child.total.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                                      </td>
                                    </tr>
                                  );
                                })}
                            </React.Fragment>
                          ))}

                          {/* 2. FILAS DE SERVICIOS INDIVIDUALES */}
                          {serviciosIndividuales.map((item) => {
                            const noCot = item.v_NoCotizacionGI;
                            const estaSeleccionado = serviciosParaAgruparIds.has(item.idTemp);
                            return (
                              <tr key={item.idTemp} style={{ backgroundColor: "#ffffff", borderLeft: estaSeleccionado ? "4px solid #2B8FCC" : "4px solid #e2e8f0" }}>
                                <td style={{ textAlign: "center", width: "60px" }}>
                                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                                    <button
                                      type="button"
                                      onClick={() => handleQuitarServicioIndividual(item.idTemp)}
                                      style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", padding: 0, fontSize: "14px", fontWeight: 700 }}
                                      title="Quitar selección"
                                    >
                                      ✕
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => toggleSeleccionParaAgrupar(item.idTemp)}
                                      style={{
                                        width: "18px",
                                        height: "18px",
                                        borderRadius: "4px",
                                        border: estaSeleccionado ? "2px solid #2B8FCC" : "2px solid #94a3b8",
                                        backgroundColor: estaSeleccionado ? "#2B8FCC" : "#ffffff",
                                        color: "#ffffff",
                                        display: "inline-flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        cursor: "pointer",
                                        padding: 0,
                                        transition: "all 0.15s ease",
                                      }}
                                      title={estaSeleccionado ? "Desmarcar para agrupar" : "Marcar para agrupar"}
                                    >
                                      {estaSeleccionado && <Check size={12} strokeWidth={3} />}
                                    </button>
                                  </div>
                                </td>
                                <td>
                                  {noCot ? (
                                    <span style={{ fontSize: "12px", fontWeight: 600, color: "#1e293b" }}>
                                      Cot. {noCot}
                                    </span>
                                  ) : (
                                    <span style={{ fontSize: "12px", fontWeight: 600, color: "#ef4444" }}>
                                      Pendiente
                                    </span>
                                  )}
                                </td>
                                <td>
                                  <div style={{ fontWeight: 600, color: "#0f172a" }}>
                                    {item.v_Servicio}
                                  </div>
                                  {(item.i_Cantidad != null || item.v_Unidad) && (
                                    <div style={{ fontSize: "11px", color: "#64748b", marginTop: "1px" }}>
                                      {Number(item.i_Cantidad ?? 0).toFixed(2)} {item.v_Unidad || ""}
                                    </div>
                                  )}
                                </td>
                                <td>{renderBadgeTipo(item.v_TipoServicio)}</td>
                                <td style={{ color: "#334155" }}>
                                  {item.d_FechaInicio
                                    ? formatearFechaTexto(item.d_FechaInicio)
                                    : "Sin programar"}
                                </td>
                                <td style={{ textAlign: "right", fontWeight: 600, color: "#0f172a" }}>
                                  ${item.subtotal.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                                </td>
                                <td style={{ textAlign: "right", fontWeight: 700, color: "#2B8FCC" }}>
                                  ${item.total.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>

                      {/* Footer Totales */}
                      <div
                        style={{
                          padding: "12px 18px",
                          backgroundColor: "#f8fafc",
                          borderTop: "1px solid #e2e8f0",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "flex-end",
                          gap: "24px",
                          fontSize: "13px",
                          fontWeight: 700,
                          color: "#2B8FCC",
                        }}
                      >
                        <span>Subtotal seleccionados:</span>
                        <span>${subtotalServicios.toLocaleString("es-MX", { minimumFractionDigits: 2 })} MXN</span>
                        <span>Total c/IVA: ${totalServiciosCve.toLocaleString("es-MX", { minimumFractionDigits: 2 })} MXN</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ==================================================== */}
          {/* PARTE 2 — CONFIGURACIÓN DE LA VENTA Y FACTURAS */}
          {/* ==================================================== */}
          {pasoActual === 2 && (
            <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
              {errorPaso2 && (
                <div
                  style={{
                    backgroundColor: "#fef2f2",
                    border: "1px solid #fecaca",
                    color: "#dc2626",
                    padding: "10px 14px",
                    borderRadius: "8px",
                    fontSize: "13px",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <AlertCircle size={18} />
                  <span>{errorPaso2}</span>
                </div>
              )}

              {/* 2.1 Bloque Configuración de la venta */}
              <div
                style={{
                  border: "1px solid #d8e6f0",
                  borderRadius: "12px",
                  padding: "18px 20px",
                  backgroundColor: "#ffffff",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    marginBottom: "14px",
                    borderBottom: "1px solid #f1f5f9",
                    paddingBottom: "10px",
                  }}
                >
                  <Settings size={18} style={{ color: "#2B8FCC" }} />
                  <h4
                    style={{
                      fontSize: "13px",
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                      color: "#1e3a5f",
                      margin: 0,
                    }}
                  >
                    Configuración de la venta
                  </h4>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "180px 1fr", gap: "16px" }}>
                  {/* Cantidad de facturas */}
                  <div>
                    <label
                      style={{
                        fontSize: "12px",
                        fontWeight: 700,
                        color: "#4a6580",
                        display: "block",
                        marginBottom: "4px",
                      }}
                    >
                      Cantidad de facturas<span style={{ color: "#dc2626" }}>*</span>
                    </label>
                    <input
                      type="number"
                      min={1}
                      className="form-control"
                      style={{ height: "36px", borderRadius: "8px", fontSize: "13px" }}
                      value={cantidadFacturas}
                      onChange={(e) => {
                        const raw = e.target.value;
                        if (raw === "") {
                          setCantidadFacturas("");
                          return;
                        }
                        const val = parseInt(raw, 10);
                        if (!isNaN(val)) {
                          setCantidadFacturas(val);
                          if (val >= 1) {
                            sincronizarFacturasConCantidad(val, totalServiciosCve);
                          }
                        }
                      }}
                      onBlur={() => {
                        if (!cantidadFacturas || cantidadFacturas < 1) {
                          sincronizarFacturasConCantidad(1, totalServiciosCve);
                        }
                      }}
                    />
                  </div>

                  {/* Descripción de la venta */}
                  <div>
                    <label
                      style={{
                        fontSize: "12px",
                        fontWeight: 700,
                        color: "#4a6580",
                        display: "block",
                        marginBottom: "4px",
                      }}
                    >
                      Descripción de la venta <span style={{ fontWeight: 400, color: "#64748b" }}>(opcional, máx. 100 caracteres)</span>
                    </label>
                    <input
                      type="text"
                      maxLength={100}
                      className="form-control"
                      style={{ height: "36px", borderRadius: "8px", fontSize: "13px" }}
                      placeholder="Ej. Proyecto de capacitación anual 2026"
                      value={descripcionVenta}
                      onChange={(e) => setDescripcionVenta(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* 2.2 Bloque Facturas */}
              <div
                style={{
                  border: "1px solid #d8e6f0",
                  borderRadius: "12px",
                  padding: "18px 20px",
                  backgroundColor: "#ffffff",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: "14px",
                  }}
                >
                  <h4
                    style={{
                      fontSize: "13px",
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                      color: "#1e3a5f",
                      margin: 0,
                    }}
                  >
                    Facturas ({facturas.length})
                  </h4>
                </div>

                {/* Tabla de Facturas */}
                <div className="alegra-table-container" style={{ overflowX: "auto" }}>
                  <table className="alegra-table" style={{ minWidth: "1050px" }}>
                    <thead>
                      <tr>
                        <th style={{ width: "160px" }}>No. factura GI*</th>
                        <th style={{ width: "150px" }}>Fecha expedición*</th>
                        <th style={{ width: "160px" }}>Monto (c/IVA)*</th>
                        <th>Descripción</th>
                        <th style={{ textAlign: "center", width: "90px" }}>Timbrada</th>
                        <th style={{ width: "200px" }}>Pagos</th>
                        <th style={{ textAlign: "center", width: "70px" }}>Config</th>
                      </tr>
                    </thead>
                    <tbody>
                      {facturas.map((f, idx) => {
                        const sumaAbonosFac = f.abonos.reduce(
                          (acc, a) => acc + (typeof a.d_Monto === "number" ? a.d_Monto : 0),
                          0
                        );
                        const cuadraAbonos = Math.abs(sumaAbonosFac - (Number(f.d_Monto) || 0)) <= 0.01;
                        const tieneErrorPagos = camposInvalidadosPaso2[`abonos-${idx}`];

                        return (
                          <tr key={f.idFactura}>
                            <td>
                              <input
                                type="text"
                                className="form-input"
                                style={{
                                  height: "32px",
                                  borderRadius: "6px",
                                  fontSize: "12px",
                                  border: camposInvalidadosPaso2[`noFactura-${idx}`]
                                    ? "1px solid #dc3545"
                                    : "1px solid #d0dce8",
                                }}
                                placeholder="FAC-GI-001"
                                value={f.v_NoFactura}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setFacturas((prev) =>
                                    prev.map((item, i) => (i === idx ? { ...item, v_NoFactura: val } : item))
                                  );
                                }}
                              />
                            </td>
                            <td>
                              <InputFechaTexto
                                value={f.d_FechaExpedicion}
                                onChange={(val) => {
                                  setFacturas((prev) =>
                                    prev.map((item, i) =>
                                      i === idx ? { ...item, d_FechaExpedicion: val } : item
                                    )
                                  );
                                }}
                                height="32px"
                                style={{ borderRadius: "6px" }}
                              />
                            </td>
                            <td>
                              <div style={{ position: "relative" }}>
                                <span
                                  style={{
                                    position: "absolute",
                                    left: "8px",
                                    top: "50%",
                                    transform: "translateY(-50%)",
                                    fontSize: "12px",
                                    fontWeight: 700,
                                    color: "#64748b",
                                  }}
                                >
                                  $
                                </span>
                                <input
                                  type="number"
                                  min={0}
                                  className="form-input"
                                  style={{
                                    height: "32px",
                                    borderRadius: "6px",
                                    fontSize: "12px",
                                    paddingLeft: "20px",
                                    paddingRight: "35px",
                                    fontWeight: 700,
                                    color: "#0f172a",
                                    border: camposInvalidadosPaso2[`monto-${idx}`]
                                      ? "1px solid #dc3545"
                                      : "1px solid #d0dce8",
                                  }}
                                  value={f.d_Monto}
                                  onChange={(e) => {
                                    const val = e.target.value === "" ? "" : Number(e.target.value);
                                    setFacturas((prev) =>
                                      prev.map((item, i) => (i === idx ? { ...item, d_Monto: val } : item))
                                    );
                                  }}
                                />
                                <span
                                  style={{
                                    position: "absolute",
                                    right: "8px",
                                    top: "50%",
                                    transform: "translateY(-50%)",
                                    fontSize: "10px",
                                    fontWeight: 700,
                                    color: "#64748b",
                                  }}
                                >
                                  MXN
                                </span>
                              </div>
                            </td>
                            <td>
                              <input
                                type="text"
                                maxLength={100}
                                className="form-input"
                                style={{ height: "32px", borderRadius: "6px", fontSize: "12px" }}
                                placeholder="Descripción corta..."
                                value={f.v_Descripcion}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setFacturas((prev) =>
                                    prev.map((item, i) => (i === idx ? { ...item, v_Descripcion: val } : item))
                                  );
                                }}
                              />
                            </td>
                            <td style={{ textAlign: "center" }}>
                              <input
                                type="checkbox"
                                checked={f.b_Timbrada}
                                onChange={(e) => {
                                  const val = e.target.checked;
                                  setFacturas((prev) =>
                                    prev.map((item, i) => (i === idx ? { ...item, b_Timbrada: val } : item))
                                  );
                                }}
                                style={{ accentColor: "#2B8FCC", cursor: "pointer", width: "16px", height: "16px" }}
                              />
                            </td>
                            <td>
                              {f.abonos.length === 0 ? (
                                <span style={{ fontSize: "12px", color: tieneErrorPagos ? "#dc3545" : "#64748b", fontStyle: "italic" }}>
                                  Sin configurar
                                </span>
                              ) : (
                                <span
                                  style={{
                                    fontSize: "12px",
                                    fontWeight: 600,
                                    color: cuadraAbonos ? "#16a34a" : "#dc3545",
                                  }}
                                >
                                  {f.abonos.length} pago(s) (${sumaAbonosFac.toLocaleString("es-MX", { minimumFractionDigits: 2 })})
                                </span>
                              )}
                            </td>
                            <td style={{ textAlign: "center" }}>
                              <button
                                type="button"
                                onClick={() => handleAbrirConfigurarPagos(idx)}
                                style={{
                                  backgroundColor: "#eaf4fb",
                                  border: "1px solid #b5cfe8",
                                  borderRadius: "6px",
                                  color: "#2B8FCC",
                                  padding: "4px 8px",
                                  cursor: "pointer",
                                }}
                                title="Configurar pagos"
                              >
                                <Settings size={14} />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>

                  {/* Footer resumen de descuadre */}
                  <div
                    style={{
                      padding: "12px 18px",
                      backgroundColor: "#f8fafc",
                      borderTop: "1px solid #e2e8f0",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      fontSize: "13px",
                      fontWeight: 700,
                    }}
                  >
                    <span>Total facturado:</span>
                    <span style={{ color: descuadreFacturas ? "#dc3545" : "#16a34a" }}>
                      Facturado: ${totalFacturadoCve.toLocaleString("es-MX", { minimumFractionDigits: 2 })} / $
                      {totalServiciosCve.toLocaleString("es-MX", { minimumFractionDigits: 2 })} MXN
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ==================================================== */}
          {/* PARTE 3 — CONFIRMACIÓN */}
          {/* ==================================================== */}
          {pasoActual === 3 && (
            <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
              {errorBackend && (
                <div
                  style={{
                    backgroundColor: "#f8d7da",
                    border: "1px solid #f5c2c7",
                    color: "#842029",
                    padding: "12px 16px",
                    borderRadius: "8px",
                    fontSize: "13px",
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                  }}
                >
                  <AlertCircle size={20} />
                  <span>{errorBackend}</span>
                </div>
              )}

              {/* 3.1 Empresa */}
              <div style={{ border: "1px solid #d8e6f0", borderRadius: "12px", padding: "14px 18px", backgroundColor: "#ffffff" }}>
                <span style={{ fontSize: "11px", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Cliente</span>
                <h4 style={{ fontSize: "16px", fontWeight: 700, color: "#1e3a5f", margin: "4px 0 0 0" }}>
                  {empresaSeleccionada?.s_RazonSocial}
                </h4>
              </div>

              {/* 3.2 Servicios a facturar */}
              <div style={{ border: "1px solid #d8e6f0", borderRadius: "12px", padding: "16px", backgroundColor: "#ffffff" }}>
                <h5 style={{ fontSize: "13px", fontWeight: 700, textTransform: "uppercase", color: "#1e3a5f", margin: "0 0 12px 0" }}>
                  Servicios a facturar
                </h5>
                <div className="alegra-table-container">
                  <table className="alegra-table alegra-table-compact">
                    <thead>
                      <tr>
                        <th style={{ padding: "5px 8px", fontSize: "11px" }}>Cotización</th>
                        <th style={{ padding: "5px 8px", fontSize: "11px" }}>Servicio</th>
                        <th style={{ padding: "5px 8px", fontSize: "11px" }}>Tipo</th>
                        <th style={{ padding: "5px 8px", fontSize: "11px" }}>Fecha inicio</th>
                        <th style={{ padding: "5px 8px", fontSize: "11px", textAlign: "right" }}>Subtotal s/IVA</th>
                        <th style={{ padding: "5px 8px", fontSize: "11px", textAlign: "right" }}>Total c/IVA</th>
                      </tr>
                    </thead>
                    <tbody>
                      {grupos.map((grp) => (
                        <React.Fragment key={grp.idGrupo}>
                          <tr style={{ backgroundColor: "#f4f8fc", borderLeft: "4px solid #7a96b0" }}>
                            <td style={{ padding: "4px 8px" }}>
                              <span className="badge" style={{ backgroundColor: "#e2e8f0", color: "#475569", fontSize: "10px", padding: "1px 5px" }}>
                                <Folder size={11} style={{ marginRight: "3px" }} /> GRUPO
                              </span>
                            </td>
                            <td style={{ padding: "4px 8px", fontWeight: 700, color: "#1e3a5f", fontSize: "12px" }}>{grp.v_NombreProyecto}</td>
                            <td style={{ padding: "4px 8px" }}>
                              <span className="badge" style={{ backgroundColor: "#f0f0f0", color: "#555", fontSize: "10px", padding: "1px 5px" }}>
                                GENERAL
                              </span>
                            </td>
                            <td style={{ padding: "4px 8px", color: "#64748b", fontSize: "12px" }}>N/A</td>
                            <td style={{ padding: "4px 8px", textAlign: "right", fontWeight: 700, fontSize: "12px" }}>
                              ${Number(grp.d_MontoProyecto || 0).toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                            </td>
                            <td style={{ padding: "4px 8px", textAlign: "right", fontWeight: 700, color: "#2B8FCC", fontSize: "12px" }}>
                              ${grp.total.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                            </td>
                          </tr>
                          {grp.servicios.map((child) => (
                            <tr key={child.idTemp} style={{ backgroundColor: "#fafcff", borderLeft: "4px solid #b5cfe8" }}>
                              <td style={{ padding: "3px 8px 3px 18px", color: "#64748b", fontSize: "11px" }}>
                                {child.v_NoCotizacionGI ? `Cot. ${child.v_NoCotizacionGI}` : `ID ${child.i_CveServAgendaDet}`}
                              </td>
                              <td style={{ padding: "3px 8px" }}>
                                <div style={{ fontWeight: 500, color: "#334155", fontSize: "12px" }}>{child.v_Servicio}</div>
                                {(child.i_Cantidad != null || child.v_Unidad) && (
                                  <div style={{ fontSize: "10px", color: "#64748b" }}>
                                    {Number(child.i_Cantidad ?? 0).toFixed(2)} {child.v_Unidad || ""}
                                  </div>
                                )}
                              </td>
                              <td style={{ padding: "3px 8px" }}>{renderBadgeTipo(child.v_TipoServicio)}</td>
                              <td style={{ padding: "3px 8px", color: "#64748b", fontSize: "11px" }}>
                                {child.d_FechaInicio
                                  ? formatearFechaTexto(child.d_FechaInicio)
                                  : "Sin programar"}
                              </td>
                              <td style={{ padding: "3px 8px", textAlign: "right", color: "#64748b", fontSize: "12px" }}>
                                ${child.subtotal.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                              </td>
                              <td style={{ padding: "3px 8px", textAlign: "right", color: "#64748b", fontSize: "12px" }}>
                                ${child.total.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                              </td>
                            </tr>
                          ))}
                        </React.Fragment>
                      ))}

                      {serviciosIndividuales.map((item) => (
                        <tr key={item.idTemp} style={{ backgroundColor: "#ffffff", borderLeft: "4px solid #2B8FCC" }}>
                          <td style={{ padding: "4px 8px", fontWeight: 600, color: "#1e293b", fontSize: "11px" }}>
                            {item.v_NoCotizacionGI ? `Cot. ${item.v_NoCotizacionGI}` : `ID ${item.i_CveServAgendaDet}`}
                          </td>
                          <td style={{ padding: "4px 8px" }}>
                            <div style={{ fontWeight: 600, color: "#0f172a", fontSize: "12px" }}>
                              {item.v_Servicio}
                            </div>
                            {(item.i_Cantidad != null || item.v_Unidad) && (
                              <div style={{ fontSize: "10px", color: "#64748b" }}>
                                {Number(item.i_Cantidad ?? 0).toFixed(2)} {item.v_Unidad || ""}
                              </div>
                            )}
                          </td>
                          <td style={{ padding: "4px 8px" }}>{renderBadgeTipo(item.v_TipoServicio)}</td>
                          <td style={{ padding: "4px 8px", color: "#334155", fontSize: "11px" }}>
                            {item.d_FechaInicio
                              ? formatearFechaTexto(item.d_FechaInicio)
                              : "Sin programar"}
                          </td>
                          <td style={{ padding: "4px 8px", textAlign: "right", fontWeight: 600, fontSize: "12px" }}>
                            ${item.subtotal.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                          </td>
                          <td style={{ padding: "4px 8px", textAlign: "right", fontWeight: 700, color: "#2B8FCC", fontSize: "12px" }}>
                            ${item.total.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 3.3 Card de Totales */}
              <div style={{ border: "1px solid #d8e6f0", borderRadius: "12px", padding: "16px", backgroundColor: "#ffffff" }}>
                <h5 style={{ fontSize: "13px", fontWeight: 700, textTransform: "uppercase", color: "#1e3a5f", margin: "0 0 12px 0" }}>
                  Resumen de Totales
                </h5>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px" }}>
                  {/* Total sin IVA */}
                  <div style={{ backgroundColor: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "12px 16px" }}>
                    <span style={{ fontSize: "11px", fontWeight: 600, color: "#64748b", textTransform: "uppercase", display: "block", marginBottom: "4px" }}>
                      Total sin IVA
                    </span>
                    <span style={{ fontSize: "17px", fontWeight: 700, color: "#1e293b" }}>
                      ${subtotalServicios.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MXN
                    </span>
                  </div>

                  {/* Total de IVA */}
                  <div style={{ backgroundColor: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "12px 16px" }}>
                    <span style={{ fontSize: "11px", fontWeight: 600, color: "#64748b", textTransform: "uppercase", display: "block", marginBottom: "4px" }}>
                      Total de IVA
                    </span>
                    <span style={{ fontSize: "17px", fontWeight: 700, color: "#475569" }}>
                      ${Math.max(0, Math.round((totalServiciosCve - subtotalServicios) * 100) / 100).toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MXN
                    </span>
                  </div>

                  {/* Total con IVA */}
                  <div style={{ backgroundColor: "#eaf4fb", border: "1px solid #b5cfe8", borderRadius: "10px", padding: "12px 16px" }}>
                    <span style={{ fontSize: "11px", fontWeight: 700, color: "#1e3a5f", textTransform: "uppercase", display: "block", marginBottom: "4px" }}>
                      Total con IVA
                    </span>
                    <span style={{ fontSize: "17px", fontWeight: 800, color: "#2B8FCC" }}>
                      ${totalServiciosCve.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MXN
                    </span>
                  </div>
                </div>
              </div>

              {/* 3.4 Facturas */}
              <div style={{ border: "1px solid #d8e6f0", borderRadius: "12px", padding: "16px", backgroundColor: "#ffffff" }}>
                <h5 style={{ fontSize: "13px", fontWeight: 700, textTransform: "uppercase", color: "#1e3a5f", margin: "0 0 12px 0" }}>
                  Facturas configuradas
                </h5>
                <div className="alegra-table-container">
                  <table className="alegra-table">
                    <thead>
                      <tr>
                        <th>No. factura GI</th>
                        <th>Fecha expedición</th>
                        <th style={{ textAlign: "right" }}>Monto c/IVA</th>
                        <th>Descripción</th>
                        <th style={{ textAlign: "center" }}>Timbrada</th>
                        <th>Pagos programados</th>
                      </tr>
                    </thead>
                    <tbody>
                      {facturas.map((f, idx) => (
                        <tr key={f.idFactura} style={{ backgroundColor: "#eaf4fb", borderLeft: "4px solid #2B8FCC" }}>
                          <td style={{ fontWeight: 700, color: "#1e293b" }}>{f.v_NoFactura || "—"}</td>
                          <td>{formatearFechaTexto(f.d_FechaExpedicion)}</td>
                          <td style={{ textAlign: "right", fontWeight: 700, color: "#2B8FCC" }}>
                            ${Number(f.d_Monto || 0).toLocaleString("es-MX", { minimumFractionDigits: 2 })} MXN
                          </td>
                          <td>{f.v_Descripcion || "—"}</td>
                          <td style={{ textAlign: "center" }}>
                            {f.b_Timbrada ? (
                              <span className="badge badge-primary">Sí</span>
                            ) : (
                              <span style={{ fontSize: "12px", color: "#64748b" }}>No</span>
                            )}
                          </td>
                          <td>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                              {f.abonos.map((a, pIdx) => (
                                <span
                                  key={a.idPago}
                                  style={{
                                    backgroundColor: "#ffffff",
                                    border: "1px solid #b5cfe8",
                                    borderRadius: "12px",
                                    padding: "2px 8px",
                                    fontSize: "11px",
                                    fontWeight: 600,
                                    color: "#1e3a5f",
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: "4px",
                                  }}
                                >
                                  <Calendar size={12} style={{ color: "#2B8FCC" }} />
                                  {formatearFechaTexto(a.d_FechaProgramada)}: ${Number(a.d_Monto || 0).toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                                </span>
                              ))}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* FOOTER WIZARD */}
        <div
          style={{
            padding: "16px 24px",
            borderTop: "1px solid #e2e8f0",
            backgroundColor: "#ffffff",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          {/* Botón Izquierda: Cancelar / Anterior */}
          {pasoActual === 1 ? (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onCerrar}
              disabled={guardandoVenta}
            >
              Cancelar
            </button>
          ) : (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setPasoActual(pasoActual - 1)}
              disabled={guardandoVenta}
            >
              Anterior
            </button>
          )}

          {/* Botón Derecha: Siguiente / Confirmar */}
          {pasoActual === 1 && (
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleAvanzarPaso1}
            >
              Siguiente
            </button>
          )}

          {pasoActual === 2 && (
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleAvanzarPaso2}
            >
              Siguiente
            </button>
          )}

          {pasoActual === 3 && (
            <button
              type="button"
              className="btn btn-success"
              onClick={handleConfirmarVentaFinal}
              disabled={guardandoVenta}
              style={{
                backgroundColor: "#16a34a",
                color: "#ffffff",
                border: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <Check size={16} />
              {guardandoVenta ? "Guardando..." : "Confirmar factura"}
            </button>
          )}
        </div>
      </div>

      {/* ==================================================== */}
      {/* SUB-MODAL CONFIGURAR PAGOS POR FACTURA */}
      {/* ==================================================== */}
      {modalPagosAbierto && facturaIndexPagos !== null && (
        <div
          className="modal-overlay"
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(15, 23, 42, 0.7)",
            backdropFilter: "blur(6px)",
            WebkitBackdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1100,
            padding: "16px",
          }}
        >
          <div
            className="modal-content custom-scrollbar"
            style={{
              maxWidth: "680px",
              width: "90%",
              maxHeight: "90vh",
              borderRadius: "14px",
              overflow: "hidden",
              backgroundColor: "#ffffff",
            }}
          >
            {/* Header Submodal */}
            <div
              style={{
                padding: "14px 20px",
                borderBottom: "1px solid #e2e8f0",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Settings size={18} style={{ color: "#2B8FCC" }} />
                <h4 style={{ fontSize: "16px", fontWeight: 700, margin: 0, color: "#1e3a5f" }}>
                  Configurar pagos — Factura {facturaIndexPagos + 1}
                </h4>
              </div>
              <button
                type="button"
                className="btn-close"
                onClick={() => setModalPagosAbierto(false)}
              >
                <X size={18} />
              </button>
            </div>

            {/* Body Submodal */}
            <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "16px" }}>
              {errorModalPagos && (
                <div
                  style={{
                    backgroundColor: "#fef2f2",
                    border: "1px solid #fecaca",
                    color: "#dc2626",
                    padding: "10px 14px",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                >
                  {errorModalPagos}
                </div>
              )}

              {/* 2.3.1 Generación Rápida */}
              <div
                style={{
                  backgroundColor: "#f8fafc",
                  border: "1px solid #e2e8f0",
                  borderRadius: "10px",
                  padding: "14px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "10px" }}>
                  <Zap size={16} style={{ color: "#f59e0b" }} />
                  <span style={{ fontSize: "12px", fontWeight: 700, color: "#1e3a5f", textTransform: "uppercase" }}>
                    Generación rápida de pagos
                  </span>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 100px 140px 100px", gap: "10px", alignItems: "flex-end" }}>
                  <div>
                    <label style={{ fontSize: "11px", fontWeight: 600, color: "#475569", marginBottom: "3px", display: "block" }}>
                      Fecha inicio
                    </label>
                    <InputFechaTexto
                      value={genFechaInicio}
                      onChange={(val) => setGenFechaInicio(val)}
                      height="32px"
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: "11px", fontWeight: 600, color: "#475569", marginBottom: "3px", display: "block" }}>
                      No. pagos
                    </label>
                    <input
                      type="number"
                      min={1}
                      className="form-control"
                      style={{ height: "32px", fontSize: "12px", borderRadius: "6px" }}
                      value={genNumPagos}
                      onChange={(e) => {
                        const raw = e.target.value;
                        if (raw === "") {
                          setGenNumPagos("");
                          return;
                        }
                        const val = parseInt(raw, 10);
                        if (!isNaN(val)) {
                          setGenNumPagos(val);
                        }
                      }}
                      onBlur={() => {
                        if (!genNumPagos || genNumPagos < 1) {
                          setGenNumPagos(1);
                        }
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: "11px", fontWeight: 600, color: "#475569", marginBottom: "3px", display: "block" }}>
                      Frecuencia
                    </label>
                    <select
                      className="form-select"
                      disabled={genNumPagos === 1}
                      style={{ height: "32px", fontSize: "12px", borderRadius: "6px" }}
                      value={genNumPagos === 1 ? "unico" : genFrecuencia}
                      onChange={(e) => setGenFrecuencia(e.target.value)}
                    >
                      {genNumPagos === 1 ? (
                        <option value="unico">Pago único</option>
                      ) : (
                        <>
                          <option value="semanal">Cada semana</option>
                          <option value="quincenal">Quincenal</option>
                          <option value="tres_semanas">Cada 3 semanas</option>
                          <option value="mensual">Mensual</option>
                          <option value="bimestral">Bimestral</option>
                          <option value="trimestral">Trimestral</option>
                          <option value="semestral">Semestral</option>
                        </>
                      )}
                    </select>
                  </div>

                  <button
                    type="button"
                    className="btn btn-primary"
                    style={{ height: "32px", fontSize: "12px", padding: "0 12px" }}
                    onClick={handleGenerarPagosRapidos}
                  >
                    Generar
                  </button>
                </div>
              </div>

              {/* 2.3.2 Tabla de Pagos Programados */}
              <div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
                  <span style={{ fontSize: "12px", fontWeight: 700, color: "#1e3a5f" }}>
                    Pagos a programar ({pagosDraft.length})
                  </span>
                  <button
                    type="button"
                    onClick={handleAgregarFilaPagoManual}
                    style={{
                      border: "1px solid #2B8FCC",
                      borderRadius: "50%",
                      width: "26px",
                      height: "26px",
                      backgroundColor: "#eaf4fb",
                      color: "#2B8FCC",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                    }}
                    title="Agregar fecha de pago"
                  >
                    <Plus size={14} />
                  </button>
                </div>

                {pagosDraft.length === 0 ? (
                  <div style={{ padding: "20px", textAlign: "center", fontSize: "12px", color: "#64748b", backgroundColor: "#f8fafc", borderRadius: "8px" }}>
                    Sin pagos programados todavía.
                  </div>
                ) : (
                  <div className="alegra-table-container">
                    <table className="alegra-table">
                      <thead>
                        <tr>
                          <th>Fecha programada*</th>
                          <th style={{ width: "180px" }}>Monto*</th>
                          <th style={{ width: "50px", textAlign: "center" }}></th>
                        </tr>
                      </thead>
                      <tbody>
                        {pagosDraft.map((p) => (
                          <tr key={p.idPago}>
                            <td>
                              <InputFechaTexto
                                value={p.d_FechaProgramada}
                                onChange={(val) => {
                                  setPagosDraft((prev) =>
                                    prev.map((item) => (item.idPago === p.idPago ? { ...item, d_FechaProgramada: val } : item))
                                  );
                                }}
                                height="32px"
                                style={{ borderRadius: "6px" }}
                              />
                            </td>
                            <td>
                              <div style={{ position: "relative" }}>
                                <span style={{ position: "absolute", left: "8px", top: "50%", transform: "translateY(-50%)", fontSize: "12px", fontWeight: 700, color: "#64748b" }}>
                                  $
                                </span>
                                <input
                                  type="number"
                                  min={0}
                                  className="form-input"
                                  style={{ height: "32px", borderRadius: "6px", fontSize: "12px", paddingLeft: "20px", fontWeight: 700 }}
                                  value={p.d_Monto}
                                  onChange={(e) => {
                                    const val = e.target.value === "" ? "" : Number(e.target.value);
                                    setPagosDraft((prev) =>
                                      prev.map((item) => (item.idPago === p.idPago ? { ...item, d_Monto: val } : item))
                                    );
                                  }}
                                />
                              </div>
                            </td>
                            <td style={{ textAlign: "center" }}>
                              <button
                                type="button"
                                onClick={() => handleEliminarFilaPagoManual(p.idPago)}
                                style={{ background: "none", border: "none", color: "#dc3545", cursor: "pointer" }}
                                title="Eliminar pago"
                              >
                                <Trash2 size={14} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    {/* Footer Monto Cuadre */}
                    <div
                      style={{
                        padding: "10px 14px",
                        backgroundColor: "#f8fafc",
                        borderTop: "1px solid #e2e8f0",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        fontSize: "12px",
                        fontWeight: 700,
                      }}
                    >
                      <span>Suma pagos:</span>
                      <span
                        style={{
                          color:
                            Math.abs(sumaPagosDraft - (Number(facturas[facturaIndexPagos]?.d_Monto) || 0)) <= 0.01
                              ? "#16a34a"
                              : "#dc3545",
                        }}
                      >
                        ${sumaPagosDraft.toLocaleString("es-MX", { minimumFractionDigits: 2 })} / $
                        {(Number(facturas[facturaIndexPagos]?.d_Monto) || 0).toLocaleString("es-MX", { minimumFractionDigits: 2 })} MXN
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Footer Submodal */}
            <div
              style={{
                padding: "14px 20px",
                borderTop: "1px solid #e2e8f0",
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-end",
                gap: "10px",
              }}
            >
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setModalPagosAbierto(false)}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn btn-success"
                onClick={handleAplicarPagosModal}
                style={{ backgroundColor: "#16a34a", color: "#ffffff", border: "none", display: "inline-flex", alignItems: "center", gap: "6px" }}
              >
                <Check size={16} /> Aplicar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ModalNuevaFactura;
