"use client";

import React, { useEffect, useState, useMemo } from "react";
import {
  X,
  Calendar,
  User,
  Users,
  AlertTriangle,
  Lock,
  CheckCircle2,
  Circle,
  Edit2,
  Check,
  FileSpreadsheet,
  Paperclip,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Ban,
  Plus,
  Trash2,
  Loader2,
  Copy,
  PlayCircle,
  XCircle,
} from "lucide-react";
import { ModalReprogramarSesion } from "./ModalReprogramarSesion";
import { ModalCancelarSesion } from "./ModalCancelarSesion";
import { ModalEditarInstructorSesion } from "./ModalEditarInstructorSesion";
import { ModalProgramarServicio } from "./ModalProgramarServicio";
import { ModalConfirmarEliminar } from "@/components/ui/ModalConfirmarEliminar";
import {
  AgendaDetalleGetDto,
  AgendaDetalleUpdateDto,
  AlumnoAgendaDto,
  AlumnoInscrito,
  EntregableDetalleDto,
  FacturaDetalleDto,
  SesionDetalleDto,
  ProveedorGetDto,
  CambiarProveedorDto,
  GastoServicio,
  GuardarGastoPayload,
  ProveedorRapidoPayload,
  SesionHorario,
  EditarMontosPayload,
  EditarMontosConflicto,
  FacturaAsociada,
  AbonoAsociado,
  FacturasAsociadas,
} from "@/types/servicios";
import { AgendaService } from "@/services/agenda.service";
import { FacturasService } from "@/services/facturas.service";
import { AlumnosService } from "@/services/alumnos.service";
import { CatalogosService } from "@/services/catalogos.service";
import { entregables as entregablesCat } from "@/types/catalogos";
import { VerDocumento } from "@/services/archivos.service";
import { formatearFechaCorta, formatearFechaTexto, esFechaPasada } from "@/lib/date-utils";
import { useToast } from "@/context/ToastContext";
import { obtenerSesionActual } from "@/lib/api-client";

interface Props {
  abierto: boolean;
  iCveAgenda: number | null;
  iCveServAgendaDet: number | null;
  onCerrar: () => void;
  onGuardadoExitoso?: () => void;
  onProgramar?: (detalle: AgendaDetalleGetDto) => void;
}

const IVA = 0.16;

function obtenerFechasExtremosSesiones(sesiones?: Array<{
  d_FechaHoraInicio?: string | null;
  d_FechaHoraFin?: string | null;
  b_Cancelada?: boolean | null;
}> | null): { fechaInicio: string | null; fechaFin: string | null } {
  if (!sesiones || sesiones.length === 0) {
    return { fechaInicio: null, fechaFin: null };
  }
  const validas = sesiones.filter((s) => !s.b_Cancelada && !(s as any).b_cancelada);
  const pool = validas.length > 0 ? validas : sesiones;

  let minInicio: string | null = null;
  let maxFin: string | null = null;

  for (const s of pool) {
    if (s.d_FechaHoraInicio) {
      if (!minInicio || s.d_FechaHoraInicio < minInicio) {
        minInicio = s.d_FechaHoraInicio;
      }
    }
    if (s.d_FechaHoraFin) {
      if (!maxFin || s.d_FechaHoraFin > maxFin) {
        maxFin = s.d_FechaHoraFin;
      }
    }
  }

  return { fechaInicio: minInicio, fechaFin: maxFin };
}

export const ModalDetalleServicio: React.FC<Props> = ({
  abierto,
  iCveAgenda,
  iCveServAgendaDet,
  onCerrar,
  onGuardadoExitoso,
  onProgramar,
}) => {
  const { toast, confirmModal } = useToast();
  const [detalle, setDetalle] = useState<AgendaDetalleGetDto | null>(null);
  const [cargando, setCargando] = useState<boolean>(false);
  const [guardando, setGuardando] = useState<boolean>(false);

  // Reprogramar sesión modal state
  const [modalReprogramarAbierto, setModalReprogramarAbierto] = useState<boolean>(false);
  const [sesionAReprogramarId, setSesionAReprogramarId] = useState<number | null>(null);

  // Cancelar sesión modal state
  const [modalCancelarAbierto, setModalCancelarAbierto] = useState<boolean>(false);
  const [sesionACancelar, setSesionACancelar] = useState<SesionDetalleDto | null>(null);

  // Editar instructor modal state
  const [modalEditarInstructorAbierto, setModalEditarInstructorAbierto] = useState<boolean>(false);
  const [sesionAEditarInstructor, setSesionAEditarInstructor] = useState<SesionDetalleDto | null>(null);

  // Programar servicio modal state
  const [modalProgramarAbierto, setModalProgramarAbierto] = useState<boolean>(false);

  // Modal / Formulario Proveedor state
  const [modalProveedorAbierto, setModalProveedorAbierto] = useState<boolean>(false);
  const [proveedoresList, setProveedoresList] = useState<ProveedorGetDto[]>([]);
  const [formCveProveedor, setFormCveProveedor] = useState<string>("");
  const [formPrecioProveedor, setFormPrecioProveedor] = useState<string>("");
  const [formNoCotizacionProv, setFormNoCotizacionProv] = useState<string>("");
  const [formNoOrdenCompraProv, setFormNoOrdenCompraProv] = useState<string>("");
  const [guardandoProveedor, setGuardandoProveedor] = useState<boolean>(false);

  // Estados para Gastos Extras
  const [modalGastoAbierto, setModalGastoAbierto] = useState<boolean>(false);
  const [gastoEditando, setGastoEditando] = useState<GastoServicio | null>(null);
  const [formGastoProveedorId, setFormGastoProveedorId] = useState<string>("");
  const [formGastoConcepto, setFormGastoConcepto] = useState<string>("");
  const [formGastoUnidad, setFormGastoUnidad] = useState<string>("Pieza");
  const [formGastoCantidad, setFormGastoCantidad] = useState<string>("1");
  const [formGastoCostoUnitario, setFormGastoCostoUnitario] = useState<string>("");
  const [formGastoNoCotizacion, setFormGastoNoCotizacion] = useState<string>("");
  const [formGastoNoOrdenCompra, setFormGastoNoOrdenCompra] = useState<string>("");
  const [guardandoGasto, setGuardandoGasto] = useState<boolean>(false);

  // Alta rápida de proveedor dentro del sub-modal de gasto
  const [mostrarAltaRapidaProveedor, setMostrarAltaRapidaProveedor] = useState<boolean>(false);
  const [altaRazonSocial, setAltaRazonSocial] = useState<string>("");
  const [altaRFC, setAltaRFC] = useState<string>("");
  const [altaGiro, setAltaGiro] = useState<string>("");
  const [guardandoAltaRapida, setGuardandoAltaRapida] = useState<boolean>(false);

  // Eliminar gasto
  const [gastoAEliminar, setGastoAEliminar] = useState<GastoServicio | null>(null);
  const [eliminandoGasto, setEliminandoGasto] = useState<boolean>(false);

  // Estados locales editables
  const [cotizacionGI, setCotizacionGI] = useState<string>("");
  const [ordenCompra, setOrdenCompra] = useState<string>("");
  const [editandoCotizacion, setEditandoCotizacion] = useState<boolean>(false);
  const [editandoOC, setEditandoOC] = useState<boolean>(false);

  // Estados para "Editar montos"
  const [modalEditarMontosAbierto, setModalEditarMontosAbierto] = useState<boolean>(false);
  const [formMontoCantidad, setFormMontoCantidad] = useState<string>("");
  const [formMontoPrecioUnitario, setFormMontoPrecioUnitario] = useState<string>("");
  const [guardandoMontos, setGuardandoMontos] = useState<boolean>(false);

  // Advertencia cambio de horas
  const [modalAdvertenciaHorasAbierto, setModalAdvertenciaHorasAbierto] = useState<boolean>(false);

  // Modo secuencial de ajuste de sesiones
  const [modalSecuencialAbierto, setModalSecuencialAbierto] = useState<boolean>(false);
  const [secuencialIndex, setSecuencialIndex] = useState<number>(0);
  const [secuencialSesionesAjustadas, setSecuencialSesionesAjustadas] = useState<SesionHorario[]>([]);

  // Conflicto de facturas asociadas
  const [modalFacturasAsociadasAbierto, setModalFacturasAsociadasAbierto] = useState<boolean>(false);
  const [cargandoFacturasAsociadas, setCargandoFacturasAsociadas] = useState<boolean>(false);
  const [datosFacturasAsociadas, setDatosFacturasAsociadas] = useState<FacturasAsociadas | null>(null);

  // Conflicto de utilidad
  const [modalUtilidadAbierto, setModalUtilidadAbierto] = useState<boolean>(false);
  const [conflictoUtilidad, setConflictoUtilidad] = useState<EditarMontosConflicto | null>(null);

  // Estado acumulado para confirmaciones sucesivas y reintentos
  const [sesionesParaReenvio, setSesionesParaReenvio] = useState<SesionHorario[]>([]);
  const [estadoConfirmaFacturas, setEstadoConfirmaFacturas] = useState<boolean>(false);
  const [estadoConfirmaUtilidad, setEstadoConfirmaUtilidad] = useState<boolean>(false);

  const [facturas, setFacturas] = useState<FacturaDetalleDto[]>([]);
  const [entregables, setEntregables] = useState<EntregableDetalleDto[]>([]);

  // Estados de notas del servicio
  const [notas, setNotas] = useState<string>("");
  const [notasBase, setNotasBase] = useState<string>("");
  const [guardandoNotas, setGuardandoNotas] = useState<boolean>(false);

  // Estados de edición de cupo de alumnos
  const [editandoCupo, setEditandoCupo] = useState<boolean>(false);
  const [tipoCupoEdicion, setTipoCupoEdicion] = useState<"Abierto" | "Limitado">("Abierto");
  const [cupoEdicion, setCupoEdicion] = useState<number | string>("");
  const [guardandoCupo, setGuardandoCupo] = useState<boolean>(false);
  const [alumnosInscritos, setAlumnosInscritos] = useState<AlumnoInscrito[]>([]);
  const [cargandoAlumnos, setCargandoAlumnos] = useState<boolean>(false);
  const [errorAlumnos, setErrorAlumnos] = useState<string | null>(null);
  const [descargandoNomina, setDescargandoNomina] = useState<boolean>(false);
  const [copiadoAlumnos, setCopiadoAlumnos] = useState<boolean>(false);

  // Estados para panel de Agregar Entregables
  const [panelAgregarAbierto, setPanelAgregarAbierto] = useState<boolean>(false);
  const [catalogoEntregables, setCatalogoEntregables] = useState<entregablesCat[]>([]);
  const [cargandoCatalogo, setCargandoCatalogo] = useState<boolean>(false);
  const [catalogoCargado, setCatalogoCargado] = useState<boolean>(false);
  const [busquedaEntregable, setBusquedaEntregable] = useState<string>("");
  const [seleccionadosIds, setSeleccionadosIds] = useState<Set<number>>(new Set());
  const [guardarEnCatalogo, setGuardarEnCatalogo] = useState<boolean>(true);
  const [agregandoEntregables, setAgregandoEntregables] = useState<boolean>(false);

  // Acordeones
  const [acordeonSesiones, setAcordeonSesiones] = useState<boolean>(true);
  const [acordeonAlumnos, setAcordeonAlumnos] = useState<boolean>(true);
  const [sesionAbiertaIdx, setSesionAbiertaIdx] = useState<number | null>(0);

  const abrirModalProveedor = async () => {
    if (proveedoresList.length === 0) {
      const list = await AgendaService.getProveedores();
      setProveedoresList(list || []);
    }

    if (detalle?.i_CveProveedor && Number(detalle.i_CveProveedor) > 0) {
      setFormCveProveedor(String(detalle.i_CveProveedor));
      setFormPrecioProveedor(detalle.d_PrecioProveedor ? String(detalle.d_PrecioProveedor) : "");
      setFormNoCotizacionProv(detalle.v_NoCotizacionProv || "");
      setFormNoOrdenCompraProv(detalle.v_NoOrdenCompraProv || "");
    } else {
      setFormCveProveedor("");
      setFormPrecioProveedor("");
      setFormNoCotizacionProv("");
      setFormNoOrdenCompraProv("");
    }
    setModalProveedorAbierto(true);
  };

  const handleGuardarProveedor = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!detalle) return;

    const isSinProveedor = !formCveProveedor || formCveProveedor === "";

    if (!isSinProveedor) {
      if (!formPrecioProveedor || isNaN(Number(formPrecioProveedor)) || Number(formPrecioProveedor) <= 0) {
        toast.error("El costo unitario (sin IVA) debe ser mayor a 0");
        return;
      }
    }

    const payload: CambiarProveedorDto = {
      i_CveServAgendaDet: detalle.i_CveServAgendaDet,
      i_CveProveedor: isSinProveedor ? null : Number(formCveProveedor),
      d_PrecioProveedor: isSinProveedor ? 0 : Number(formPrecioProveedor),
      v_NoOrdenCompraProv: isSinProveedor ? null : (formNoOrdenCompraProv.trim() || null),
      v_NoCotizacionProv: isSinProveedor ? null : (formNoCotizacionProv.trim() || null),
    };

    setGuardandoProveedor(true);
    try {
      const res = await AgendaService.cambiarProveedor(payload);
      if (res.exito || res.status === 200) {
        toast.success("Servicio externo actualizado");
        setModalProveedorAbierto(false);
        await cargarDetalle();
        if (onGuardadoExitoso) onGuardadoExitoso();
      } else if (res.status === 409) {
        toast.warning(res.mensaje || "Conflicto al actualizar el proveedor.");
      } else if (res.status === 400) {
        toast.error(res.mensaje || "Datos de proveedor no válidos.");
      } else {
        toast.error(res.mensaje || "Error al actualizar el proveedor.");
      }
    } catch (err: any) {
      toast.error("Ocurrió un error al actualizar el proveedor.");
    } finally {
      setGuardandoProveedor(false);
    }
  };

  const listaGastos: GastoServicio[] = useMemo(() => {
    return (detalle?.Gastos || (detalle as any)?.gastos || []) as GastoServicio[];
  }, [detalle]);

  const totalGastosSubtotal = useMemo(() => {
    return listaGastos.reduce((acc, g) => acc + (Number(g.d_Subtotal) || 0), 0);
  }, [listaGastos]);

  const proveedoresFiltradosGasto = useMemo<{ cve: number; nombre: string }[]>(() => {
    return proveedoresList
      .map((p: any) => {
        const cve = Number(p.i_CveProveedor ?? p.iD_Proveedor ?? p.id_proveedor);
        const nombre = p.v_RazonSocial || p.v_Nombre || p.s_RazonSocial || `Proveedor #${cve}`;
        return { cve, nombre };
      })
      .filter((p: { cve: number; nombre: string }) => Boolean(p.cve));
  }, [proveedoresList]);

  const subtotalGastoCalculado = useMemo(() => {
    const cant = Number(formGastoCantidad) || 0;
    const precio = Number(formGastoCostoUnitario) || 0;
    return cant * precio;
  }, [formGastoCantidad, formGastoCostoUnitario]);

  // --- useMemo para Sesiones y Editar montos ---
  const listaSesiones: SesionDetalleDto[] = useMemo(() => {
    if (!detalle) return [];
    return (
      detalle.Sesiones ||
      (detalle as any).sesiones ||
      (detalle as any).Detalles ||
      (detalle as any).detalles ||
      []
    );
  }, [detalle]);

  const tieneSesionConInstructorApoyo = useMemo(() => {
    return (listaSesiones || []).some((s) => {
      const bCanc = Boolean(s.b_Cancelada || (s as any).b_cancelada || (s as any).bCancelada);
      const iCveReprog = s.i_CveReprograma ?? (s as any).i_cveReprograma;
      const esReprog = iCveReprog != null && Number(iCveReprog) > 0;
      const esVig = !bCanc && !esReprog;
      return esVig && s.i_CveApoyo != null && Number(s.i_CveApoyo) > 0 && s.b_TipoProvInsApoyo === false;
    });
  }, [listaSesiones]);

  const esServicioPorHoras = useMemo(() => {
    if (!detalle) return false;
    if (Number(detalle.i_CveTipoServicio) === 2) return true;
    if (!detalle.v_Unidad) return false;
    const u = detalle.v_Unidad.toLowerCase();
    return u.includes("hora") || u.includes("hr");
  }, [detalle?.i_CveTipoServicio, detalle?.v_Unidad]);

  const sesionesVigentes = useMemo(() => {
    if (!detalle) return [];
    return (listaSesiones || [])
      .filter((s) => {
        const bCancelada = Boolean(
          s.b_Cancelada ||
          (s as any).b_cancelada ||
          (s as any).bCancelada
        );
        const iCveReprog =
          s.i_CveReprograma ??
          (s as any).i_cveReprograma ??
          (s as any).iCveReprograma;
        return !bCancelada && !(iCveReprog != null && Number(iCveReprog) > 0);
      })
      .sort((a, b) => (a.i_Orden ?? 0) - (b.i_Orden ?? 0));
  }, [detalle, listaSesiones]);

  const montoSubtotalCalculado = useMemo(() => {
    const cant = parseFloat(formMontoCantidad) || 0;
    const pu = parseFloat(formMontoPrecioUnitario) || 0;
    return cant * pu;
  }, [formMontoCantidad, formMontoPrecioUnitario]);

  const montoFinalConIvaCalculado = useMemo(() => {
    return montoSubtotalCalculado * (1 + IVA);
  }, [montoSubtotalCalculado]);

  const ocultarEditarMontos = useMemo(() => {
    return detalle?.v_TipoVenta === "proyecto";
  }, [detalle]);

  const abrirModalAgregarGasto = async () => {
    if (proveedoresList.length === 0) {
      const list = await AgendaService.getProveedores();
      setProveedoresList(list || []);
    }
    setGastoEditando(null);
    setFormGastoProveedorId("");
    setFormGastoConcepto("");
    setFormGastoUnidad("Pieza");
    setFormGastoCantidad("1");
    setFormGastoCostoUnitario("");
    setFormGastoNoCotizacion("");
    setFormGastoNoOrdenCompra("");
    setMostrarAltaRapidaProveedor(false);
    setAltaRazonSocial("");
    setAltaRFC("");
    setAltaGiro("");
    setModalGastoAbierto(true);
  };

  const abrirModalEditarGasto = async (gasto: GastoServicio) => {
    if (proveedoresList.length === 0) {
      const list = await AgendaService.getProveedores();
      setProveedoresList(list || []);
    }
    setGastoEditando(gasto);
    setFormGastoProveedorId(gasto.i_CveProveedor ? String(gasto.i_CveProveedor) : "");
    setFormGastoConcepto(gasto.v_Concepto || "");
    setFormGastoUnidad(gasto.v_Unidad || "Pieza");
    setFormGastoCantidad(gasto.i_Cantidad != null ? String(gasto.i_Cantidad) : "1");
    setFormGastoCostoUnitario(gasto.d_CostoUnitario != null ? String(gasto.d_CostoUnitario) : "");
    setFormGastoNoCotizacion(gasto.v_NoCotizacion || "");
    setFormGastoNoOrdenCompra(gasto.v_NoOrdenCompra || "");
    setMostrarAltaRapidaProveedor(false);
    setAltaRazonSocial("");
    setAltaRFC("");
    setAltaGiro("");
    setModalGastoAbierto(true);
  };

  const handleGuardarGasto = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!detalle) return;

    if (mostrarAltaRapidaProveedor) {
      toast.warning("Completa o cancela el alta rápida del nuevo proveedor antes de guardar el gasto.");
      return;
    }

    if (!formGastoProveedorId || formGastoProveedorId === "NUEVO") {
      toast.error("Selecciona un proveedor para el gasto.");
      return;
    }

    if (!formGastoConcepto.trim()) {
      toast.error("Ingresa el concepto del gasto.");
      return;
    }

    const cantNum = Number(formGastoCantidad);
    if (isNaN(cantNum) || cantNum <= 0) {
      toast.error("La cantidad debe ser mayor a 0.");
      return;
    }

    const costoNum = Number(formGastoCostoUnitario);
    if (isNaN(costoNum) || costoNum <= 0) {
      toast.error("El costo unitario (sin IVA) debe ser mayor a 0.");
      return;
    }

    const payload: GuardarGastoPayload = {
      i_CveGasto: gastoEditando ? gastoEditando.i_CveGasto : 0,
      i_CveServAgendaDet: detalle.i_CveServAgendaDet,
      i_CveProveedor: Number(formGastoProveedorId),
      v_Concepto: formGastoConcepto.trim(),
      v_Unidad: formGastoUnidad || "Pieza",
      i_Cantidad: cantNum,
      d_CostoUnitario: costoNum,
      v_NoCotizacion: formGastoNoCotizacion.trim() || null,
      v_NoOrdenCompra: formGastoNoOrdenCompra.trim() || null,
    };

    setGuardandoGasto(true);
    try {
      const res = await AgendaService.guardarGasto(payload);
      if (res.exito || res.status === 200) {
        toast.success("Gasto guardado");
        setModalGastoAbierto(false);
        await cargarDetalle();
        if (onGuardadoExitoso) onGuardadoExitoso();
      } else if (res.status === 409) {
        toast.warning(res.mensaje || "Conflicto al guardar el gasto.");
      } else if (res.status === 400) {
        toast.error(res.mensaje || "Datos de gasto no válidos.");
      } else {
        toast.error(res.mensaje || "Error al guardar el gasto.");
      }
    } catch {
      toast.error("Ocurrió un error al guardar el gasto.");
    } finally {
      setGuardandoGasto(false);
    }
  };

  const handleCrearProveedorRapido = async () => {
    if (!altaRazonSocial.trim()) {
      toast.error("Ingresa la razón social del proveedor.");
      return;
    }
    const rfcLimpio = altaRFC.trim().toUpperCase().replace(/\s+/g, "");
    if (!rfcLimpio) {
      toast.error("Ingresa el RFC del proveedor.");
      return;
    }
    if (!altaGiro.trim()) {
      toast.error("Ingresa el giro o actividad del proveedor.");
      return;
    }

    const sesion = obtenerSesionActual();
    const tenantId = sesion?.id_tenant ?? 1;

    const payload: ProveedorRapidoPayload = {
      S_RazonSocial: altaRazonSocial.trim(),
      S_RFC: rfcLimpio,
      S_GiroActividad: altaGiro.trim(),
      i_CveTenant: tenantId,
    };

    setGuardandoAltaRapida(true);
    try {
      const res = await AgendaService.crearProveedorRapido(payload);
      if (res.exito && res.data) {
        const nuevoProv: ProveedorGetDto = {
          i_CveProveedor: res.data.i_CveProveedor,
          v_RazonSocial: res.data.v_Nombre,
          v_Nombre: res.data.v_Nombre,
        } as any;
        setProveedoresList((prev) => [...prev, nuevoProv]);
        setFormGastoProveedorId(String(res.data.i_CveProveedor));
        setMostrarAltaRapidaProveedor(false);
        setAltaRazonSocial("");
        setAltaRFC("");
        setAltaGiro("");
        toast.success("Proveedor dado de alta");
      } else if (res.status === 409) {
        toast.warning(res.mensaje || "El RFC ya existe.");
      } else if (res.status === 400) {
        toast.error(res.mensaje || "Datos de proveedor no válidos.");
      } else {
        toast.error(res.mensaje || "Error al registrar el proveedor.");
      }
    } catch {
      toast.error("Ocurrió un error al dar de alta el proveedor.");
    } finally {
      setGuardandoAltaRapida(false);
    }
  };

  const handleConfirmarEliminarGasto = async () => {
    if (!gastoAEliminar) return;
    setEliminandoGasto(true);
    try {
      const res = await AgendaService.eliminarGasto(gastoAEliminar.i_CveGasto);
      if (res.exito || res.status === 200) {
        toast.success("Gasto eliminado");
        setGastoAEliminar(null);
        await cargarDetalle();
        if (onGuardadoExitoso) onGuardadoExitoso();
      } else if (res.status === 409) {
        toast.warning(res.mensaje || "Conflicto al eliminar el gasto.");
      } else if (res.status === 400) {
        toast.error(res.mensaje || "No se pudo eliminar el gasto.");
      } else {
        toast.error(res.mensaje || "Error al eliminar el gasto.");
      }
    } catch {
      toast.error("Ocurrió un error al eliminar el gasto.");
    } finally {
      setEliminandoGasto(false);
    }
  };

  const renderEstadoPagoBadge = (estado: string | null) => {
    if (!estado) return <span style={{ color: "#94a3b8" }}>—</span>;
    const est = estado.trim().toLowerCase();
    if (est === "pagada" || est === "pagado") {
      return (
        <span
          style={{
            display: "inline-block",
            padding: "2px 8px",
            borderRadius: "12px",
            fontSize: "11px",
            fontWeight: 600,
            backgroundColor: "#dcfce7",
            color: "#166534",
            border: "1px solid #bbf7d0",
          }}
        >
          Pagada
        </span>
      );
    }
    if (est === "abonada" || est === "abonado") {
      return (
        <span
          style={{
            display: "inline-block",
            padding: "2px 8px",
            borderRadius: "12px",
            fontSize: "11px",
            fontWeight: 600,
            backgroundColor: "#fef3c7",
            color: "#92400e",
            border: "1px solid #fde68a",
          }}
        >
          Abonada
        </span>
      );
    }
    if (est === "sin pagar") {
      return (
        <span
          style={{
            display: "inline-block",
            padding: "2px 8px",
            borderRadius: "12px",
            fontSize: "11px",
            fontWeight: 600,
            backgroundColor: "#f1f5f9",
            color: "#475569",
            border: "1px solid #e2e8f0",
          }}
        >
          Sin pagar
        </span>
      );
    }
    return (
      <span
        style={{
          display: "inline-block",
          padding: "2px 8px",
          borderRadius: "12px",
          fontSize: "11px",
          fontWeight: 600,
          backgroundColor: "#f1f5f9",
          color: "#475569",
          border: "1px solid #e2e8f0",
        }}
      >
        {estado}
      </span>
    );
  };

  const cargarAlumnosInscritos = async (idServAgendaDet: number) => {
    setCargandoAlumnos(true);
    setErrorAlumnos(null);
    try {
      const data = await AlumnosService.getAlumnosInscritos(idServAgendaDet);
      setAlumnosInscritos(data);
    } catch (err: any) {
      const msg =
        err?.response?.data?.mensaje ||
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        "Error al cargar los alumnos inscritos";
      setErrorAlumnos(msg);
      toast.error(msg);
    } finally {
      setCargandoAlumnos(false);
    }
  };

  const cargarDetalle = async () => {
    if (!iCveAgenda || !iCveServAgendaDet) return;
    setCargando(true);
    const data = await AgendaService.getAgendaDetalle(iCveAgenda, iCveServAgendaDet);
    setDetalle(data);

    if (data) {
      setCotizacionGI(data.v_NoCotizacionGI || (data as any).v_noCotizacionGI || "");
      setOrdenCompra(data.v_NoOrdenCompraCliente || (data as any).v_noOrdenCompraCliente || "");
      const valNotas = data.v_Notas || (data as any).v_notas || "";
      setNotas(valNotas);
      setNotasBase(valNotas);
      const fArr = data.Facturas || (data as any).facturas || [];
      const eArr = data.Entregables || (data as any).entregables || [];
      setFacturas(Array.isArray(fArr) ? [...fArr] : []);
      setEntregables(Array.isArray(eArr) ? [...eArr] : []);
    }
    setCargando(false);

    // Cargar alumnos inscritos desde el endpoint específico
    cargarAlumnosInscritos(iCveServAgendaDet);
  };

  const handleConfirmarTerminoClick = () => {
    if (!detalle) return;
    confirmModal({
      title: "¿Confirmas que este servicio ya terminó?",
      message: "Se avisará a administración para facturar.",
      confirmText: "Confirmar",
      cancelText: "Cancelar",
      variant: "primary",
      onConfirm: async () => {
        try {
          const res = await FacturasService.confirmarTermino(detalle.i_CveServAgendaDet);
          if (res.exito) {
            toast.success("Servicio confirmado como terminado");
            await cargarDetalle();
            onGuardadoExitoso?.();
          } else {
            toast.error(res.mensaje || "Error al confirmar terminado");
          }
        } catch (error: any) {
          const msg =
            error?.response?.data?.mensaje ||
            error?.response?.data?.message ||
            error?.response?.data?.error ||
            "Error al confirmar terminado";
          toast.error(msg);
        }
      },
    });
  };

  const renderBannerEstatus = () => {
    if (!detalle) return null;
    if (detalle.b_SinProgramar && detalle.i_CveEstatus !== 0) return null;

    const estatus = detalle.i_CveEstatus ?? 1;
    const { fechaInicio, fechaFin } = obtenerFechasExtremosSesiones(detalle.Sesiones);
    const fInicioStr = fechaInicio
      ? formatearFechaTexto(fechaInicio)
      : (detalle as any).d_FechaInicio
      ? formatearFechaTexto((detalle as any).d_FechaInicio)
      : "";
    const fFinStr = fechaFin
      ? formatearFechaTexto(fechaFin)
      : (detalle as any).d_FechaFin
      ? formatearFechaTexto((detalle as any).d_FechaFin)
      : "";

    let config = {
      bg: "#e7f1fb",
      border: "#b6d4f2",
      text: "#1f5f9e",
      icon: Calendar,
      texto: `Programado${fInicioStr ? ` · Inicia el ${fInicioStr}` : ""}`,
    };

    switch (estatus) {
      case 0:
        config = {
          bg: "#fef3f2",
          border: "#fecdca",
          text: "#b42318",
          icon: XCircle,
          texto: "Cancelado",
        };
        break;
      case 1:
        config = {
          bg: "#e7f1fb",
          border: "#b6d4f2",
          text: "#1f5f9e",
          icon: Calendar,
          texto: `Programado${fInicioStr ? ` · Inicia el ${fInicioStr}` : ""}`,
        };
        break;
      case 2:
        config = {
          bg: "#fff8e1",
          border: "#ffe08a",
          text: "#8a6100",
          icon: PlayCircle,
          texto: `En curso${fFinStr ? ` · Finaliza el ${fFinStr}` : ""}`,
        };
        break;
      case 3: {
        const porQuien = detalle.v_ConfirmadoPor?.trim();
        config = {
          bg: "#ecfdf3",
          border: "#abefc6",
          text: "#067647",
          icon: CheckCircle2,
          texto: detalle.d_FechaConfirmacionTermino
            ? `Terminado · Confirmado ${porQuien ? `por ${porQuien} ` : ""}el ${formatearFechaTexto(detalle.d_FechaConfirmacionTermino)}`
            : "Terminado",
        };
        break;
      }
      case 4:
        config = {
          bg: "#f2f4f7",
          border: "#d0d5dd",
          text: "#475467",
          icon: RefreshCw,
          texto: "Reprogramado",
        };
        break;
      case 5:
        config = {
          bg: "#fff4ec",
          border: "#ffd3b0",
          text: "#b54708",
          icon: AlertTriangle,
          texto: "Por confirmar · Llegó la fecha de finalización estimada. ¿Ya terminó?",
        };
        break;
      default:
        break;
    }

    const IconComp = config.icon;

    return (
      <div
        style={{
          marginTop: "14px",
          padding: "12px 14px",
          backgroundColor: config.bg,
          border: `1px solid ${config.border}`,
          borderRadius: "8px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "12px",
          flexWrap: "wrap",
          fontSize: "12px",
          color: config.text,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px", flex: "1 1 auto", minWidth: 0 }}>
          <IconComp size={16} style={{ color: config.text, flexShrink: 0 }} />
          <span style={{ fontWeight: 500, lineHeight: 1.4 }}>{config.texto}</span>
        </div>

        {estatus === 5 && (
          <button
            type="button"
            className="btn"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              backgroundColor: "#16a34a",
              color: "#ffffff",
              fontSize: "12px",
              fontWeight: 600,
              padding: "6px 14px",
              borderRadius: "6px",
              border: "none",
              cursor: "pointer",
              whiteSpace: "nowrap",
              flexShrink: 0,
            }}
            onClick={handleConfirmarTerminoClick}
          >
            <CheckCircle2 size={16} />
            Confirmar terminado
          </button>
        )}
      </div>
    );
  };

  useEffect(() => {
    if (abierto && iCveAgenda && iCveServAgendaDet) {
      cargarDetalle();
      setEditandoCotizacion(false);
      setEditandoOC(false);
      setPanelAgregarAbierto(false);
      setBusquedaEntregable("");
      setSeleccionadosIds(new Set());
      setGuardarEnCatalogo(true);
      setAgregandoEntregables(false);
      setCatalogoCargado(false);
    } else {
      setDetalle(null);
      setNotas("");
      setNotasBase("");
      setGuardandoNotas(false);
      setEditandoCupo(false);
      setGuardandoCupo(false);
      setAlumnosInscritos([]);
      setErrorAlumnos(null);
      setCargandoAlumnos(false);
      setDescargandoNomina(false);
      setCopiadoAlumnos(false);
      setPanelAgregarAbierto(false);
      setBusquedaEntregable("");
      setSeleccionadosIds(new Set());
      setGuardarEnCatalogo(true);
      setAgregandoEntregables(false);
      setCatalogoCargado(false);
    }
  }, [abierto, iCveAgenda, iCveServAgendaDet]);

  const handleAbrirPanelAgregar = async () => {
    setPanelAgregarAbierto(true);
    if (!catalogoCargado) {
      setCargandoCatalogo(true);
      const data = await CatalogosService.getEntregables();
      setCatalogoEntregables(Array.isArray(data) ? data : []);
      setCatalogoCargado(true);
      setCargandoCatalogo(false);
    }
  };

  const handleCancelarPanelAgregar = () => {
    setPanelAgregarAbierto(false);
    setSeleccionadosIds(new Set());
    setBusquedaEntregable("");
  };

  const handleToggleSeleccionId = (id: number) => {
    setSeleccionadosIds((prev) => {
      const copy = new Set(prev);
      if (copy.has(id)) {
        copy.delete(id);
      } else {
        copy.add(id);
      }
      return copy;
    });
  };

  const handleAgregarEntregablesConfirmar = async () => {
    if (!iCveAgenda || !iCveServAgendaDet || seleccionadosIds.size === 0) return;
    setAgregandoEntregables(true);

    const res = await AgendaService.agregarEntregables({
      i_CveAgenda: iCveAgenda,
      i_CveServAgendaDet: iCveServAgendaDet,
      Entregables: Array.from(seleccionadosIds),
      b_GuardarEnCatalogo: guardarEnCatalogo,
    });

    if (!res.exito) {
      toast.error(res.mensaje || "Ocurrió un error al agregar los entregables.");
      setAgregandoEntregables(false);
      return;
    }

    toast.success("Entregables agregados exitosamente");

    // Re-pedir el detalle del servicio para traer los nuevos entregables con sus i_CveAgendaEntregables creados
    const nuevoDetalle = await AgendaService.getAgendaDetalle(iCveAgenda, iCveServAgendaDet);

    if (nuevoDetalle) {
      const nuevosEntregables = nuevoDetalle.Entregables || [];

      // Mapear b_Entregado y f_FechaEntregable de la lista previa por i_CveAgendaEntregables
      const mapaEstadosPrevios = new Map<number, { b_Entregado: boolean; f_FechaEntregable: string | null }>();
      entregables.forEach((e) => {
        if (e.i_CveAgendaEntregables) {
          mapaEstadosPrevios.set(e.i_CveAgendaEntregables, {
            b_Entregado: e.b_Entregado,
            f_FechaEntregable: e.f_FechaEntregable,
          });
        }
      });

      const entregablesFusionados = nuevosEntregables.map((nuevo) => {
        const prev = mapaEstadosPrevios.get(nuevo.i_CveAgendaEntregables);
        if (prev) {
          return {
            ...nuevo,
            b_Entregado: prev.b_Entregado,
            f_FechaEntregable: prev.f_FechaEntregable,
          };
        }
        return nuevo;
      });

      setEntregables(entregablesFusionados);
      setDetalle((prev) => (prev ? { ...prev, Entregables: entregablesFusionados } : nuevoDetalle));
    }

    onGuardadoExitoso?.();

    setAgregandoEntregables(false);
    setPanelAgregarAbierto(false);
    setSeleccionadosIds(new Set());
    setBusquedaEntregable("");
  };

  // Entregables del catálogo filtrados y ordenados (excluyendo los que el servicio ya tiene)
  const cvesExistentesServicio = new Set(
    entregables
      .map((e) => e.i_CveEntregables)
      .filter((id): id is number => id !== undefined && id !== null)
  );
  const nombresExistentesServicio = new Set(
    entregables.map((e) => e.v_Nombre.trim().toLowerCase())
  );

  const entregablesDisponiblesCatalogo = catalogoEntregables.filter((cat) => {
    if (cvesExistentesServicio.has(cat.i_CveEntregables)) return false;
    if (nombresExistentesServicio.has(cat.v_Nombre.trim().toLowerCase())) return false;
    return true;
  });

  const entregablesDisponiblesFiltrados = entregablesDisponiblesCatalogo
    .filter((cat) =>
      cat.v_Nombre.toLowerCase().includes(busquedaEntregable.trim().toLowerCase())
    )
    .sort((a, b) => a.v_Nombre.localeCompare(b.v_Nombre, "es", { sensitivity: "base" }));

  // --- Handlers para Editar montos ---
  const abrirModalEditarMontos = () => {
    setFormMontoCantidad(
      detalle?.i_Cantidad !== undefined && detalle?.i_Cantidad !== null
        ? String(detalle.i_Cantidad)
        : ""
    );
    setFormMontoPrecioUnitario(
      detalle?.d_PrecioUnitario !== undefined && detalle?.d_PrecioUnitario !== null
        ? String(detalle.d_PrecioUnitario)
        : ""
    );
    setSecuencialSesionesAjustadas([]);
    setSesionesParaReenvio([]);
    setEstadoConfirmaFacturas(false);
    setEstadoConfirmaUtilidad(false);
    setModalEditarMontosAbierto(true);
  };

  const ejecutarGuardarMontos = async (
    sesiones: SesionHorario[],
    confirmaFacturas: boolean,
    confirmaUtilidad: boolean
  ) => {
    if (!detalle?.i_CveServAgendaDet) return;
    setGuardandoMontos(true);

    try {
      const payload: EditarMontosPayload = {
        i_Cantidad: parseFloat(formMontoCantidad),
        d_PrecioUnitario: parseFloat(formMontoPrecioUnitario),
        Sesiones: sesiones,
        b_ConfirmaFacturas: confirmaFacturas,
        b_ConfirmaUtilidad: confirmaUtilidad,
      };

      const res = await AgendaService.editarMontosServicio(detalle.i_CveServAgendaDet, payload);
      if (res.exito || res.status === 200) {
        toast.success("Montos actualizados");
        setModalEditarMontosAbierto(false);
        setModalFacturasAsociadasAbierto(false);
        setModalUtilidadAbierto(false);
        await cargarDetalle();
        if (onGuardadoExitoso) onGuardadoExitoso();
      } else {
        const conflicto = res.conflicto;
        if (conflicto?.codigo === "CONFIRMAR_FACTURAS") {
          setEstadoConfirmaFacturas(confirmaFacturas);
          setEstadoConfirmaUtilidad(confirmaUtilidad);
          setSesionesParaReenvio(sesiones);

          setCargandoFacturasAsociadas(true);
          try {
            const facturasData = await AgendaService.getFacturasAsociadas(detalle.i_CveServAgendaDet);
            setDatosFacturasAsociadas(facturasData);
            setModalFacturasAsociadasAbierto(true);
          } catch (fErr: any) {
            toast.error(fErr.message || "Error al consultar las facturas asociadas.");
            setModalEditarMontosAbierto(true);
          } finally {
            setCargandoFacturasAsociadas(false);
          }
        } else if (conflicto?.codigo === "CONFIRMAR_UTILIDAD") {
          setEstadoConfirmaFacturas(confirmaFacturas);
          setEstadoConfirmaUtilidad(confirmaUtilidad);
          setSesionesParaReenvio(sesiones);
          setConflictoUtilidad(conflicto);
          setModalUtilidadAbierto(true);
        } else {
          toast.error(conflicto?.error || "Error al actualizar los montos.");
          setModalEditarMontosAbierto(true);
        }
      }
    } catch (err: any) {
      toast.error(err.message || "Error al actualizar los montos.");
      setModalEditarMontosAbierto(true);
    } finally {
      setGuardandoMontos(false);
    }
  };

  const handleGuardarMontos = (e: React.FormEvent) => {
    e.preventDefault();

    const cant = parseFloat(formMontoCantidad);
    if (isNaN(cant) || cant <= 0) {
      toast.warning("La cantidad debe ser mayor a 0.");
      return;
    }

    const precio = parseFloat(formMontoPrecioUnitario);
    if (isNaN(precio) || precio < 0) {
      toast.warning("El precio unitario no puede ser negativo.");
      return;
    }

    const cantOriginal = Number(detalle?.i_Cantidad ?? 0);
    const cantidadCambio = Math.abs(cant - cantOriginal) > 0.0001;

    if (esServicioPorHoras && cantidadCambio && sesionesVigentes.length > 0) {
      setModalAdvertenciaHorasAbierto(true);
    } else {
      setSesionesParaReenvio([]);
      ejecutarGuardarMontos([], false, false);
    }
  };

  const handleContinuarAdvertenciaHoras = () => {
    setModalAdvertenciaHorasAbierto(false);
    setModalEditarMontosAbierto(false);
    setSecuencialSesionesAjustadas([]);
    setSecuencialIndex(0);
    setModalSecuencialAbierto(true);
  };

  const handleSiguienteSecuencial = (sesionAjustada: SesionHorario) => {
    const nuevasAjustadas = [
      ...secuencialSesionesAjustadas.filter(
        (s) => s.i_CveAgendaDetalle !== sesionAjustada.i_CveAgendaDetalle
      ),
      sesionAjustada,
    ];
    setSecuencialSesionesAjustadas(nuevasAjustadas);
    setSecuencialIndex((prev) => prev + 1);
  };

  const handleTerminarSecuencial = (sesionFinal: SesionHorario) => {
    const todasAjustadas = [
      ...secuencialSesionesAjustadas.filter(
        (s) => s.i_CveAgendaDetalle !== sesionFinal.i_CveAgendaDetalle
      ),
      sesionFinal,
    ];
    setSecuencialSesionesAjustadas(todasAjustadas);
    setSesionesParaReenvio(todasAjustadas);
    setModalSecuencialAbierto(false);
    ejecutarGuardarMontos(todasAjustadas, false, false);
  };

  const handleConfirmarCancelarFacturas = () => {
    setModalFacturasAsociadasAbierto(false);
    setEstadoConfirmaFacturas(true);
    ejecutarGuardarMontos(sesionesParaReenvio, true, estadoConfirmaUtilidad);
  };

  const handleCancelarFacturasModal = () => {
    setModalFacturasAsociadasAbierto(false);
    setModalEditarMontosAbierto(true);
  };

  const handleConfirmarUtilidad = () => {
    setModalUtilidadAbierto(false);
    setEstadoConfirmaUtilidad(true);
    ejecutarGuardarMontos(sesionesParaReenvio, estadoConfirmaFacturas, true);
  };

  const handleCancelarUtilidadModal = () => {
    setModalUtilidadAbierto(false);
    setModalEditarMontosAbierto(true);
  };

  if (!abierto) return null;

  // Lógica de Cupos y Alumnos (2 = Capacitación)
  const esCapacitacion = detalle?.i_CveTipoServicio !== undefined && detalle?.i_CveTipoServicio !== null
    ? Number(detalle.i_CveTipoServicio) === 2
    : (detalle?.v_TipoServicio ? detalle.v_TipoServicio.toUpperCase().includes("CAPACITACI") : false);

  const obtenerTextoInstructoresSesion = (sesion: SesionDetalleDto): string => {
    const titular = sesion.v_Titular?.trim();
    // Si b_TipoProvInsApoyo es true, es proveedor, por lo que no se muestra como instructor de apoyo
    const esProveedorApoyo = Boolean(sesion.b_TipoProvInsApoyo);
    const apoyo = !esProveedorApoyo ? sesion.v_Apoyo?.trim() : null;

    const personas = [titular, apoyo].filter((p): p is string => Boolean(p && p.trim()));
    if (personas.length > 0) {
      return personas.join(", ");
    }
    return esCapacitacion ? "Sin instructor" : (esProveedorApoyo ? "" : "Sin apoyo");
  };

  const cupos = detalle?.i_NumAlumnos ?? 0;
  const inscritos = alumnosInscritos.length;
  const sinLimite = cupos === 0;

  const getBadgeColorAlumnos = () => {
    if (!sinLimite && inscritos >= cupos) return "bg-rose-50 text-rose-700 border-rose-200";
    if (inscritos === 0) return "bg-slate-100 text-slate-600 border-slate-200";
    return "bg-emerald-50 text-emerald-700 border-emerald-200";
  };

  const handleEliminarAlumno = async (idAlumnoAgenda: number, identificador?: string) => {
    confirmModal({
      title: "Quitar alumno",
      message: identificador
        ? `¿Deseas quitar a "${identificador}" de este servicio?`
        : "¿Deseas quitar este alumno de este servicio?",
      confirmText: "Quitar",
      cancelText: "Cancelar",
      onConfirm: async () => {
        const ok = await AgendaService.deleteAlumno(idAlumnoAgenda);
        if (ok) {
          toast.success("Alumno quitado del servicio exitosamente");
          if (iCveServAgendaDet) {
            await cargarAlumnosInscritos(iCveServAgendaDet);
          }
          if (onGuardadoExitoso) onGuardadoExitoso();
        } else {
          toast.error("No se pudo quitar al alumno del servicio.");
        }
      },
    });
  };

  const handleDescargarNomina = async () => {
    if (!detalle || descargandoNomina) return;
    setDescargandoNomina(true);
    try {
      const ok = await AlumnosService.descargarNomina(detalle.i_CveServAgendaDet);
      if (!ok) {
        toast.error("Ocurrió un problema al generar o descargar el archivo de nómina.");
      }
    } catch {
      toast.error("Ocurrió un problema al descargar el archivo de nómina.");
    } finally {
      setDescargandoNomina(false);
    }
  };

  const handleCopiarTablaAlumnos = async () => {
    if (alumnosInscritos.length === 0) {
      toast.warning("No hay alumnos inscritos para copiar.");
      return;
    }

    try {
      const headers = ["Nómina", "Nombre", "CURP", "Puesto"];
      const rows = alumnosInscritos.map((alumno) => {
        const tieneRegistro = alumno.i_CveAlumno !== null && alumno.i_CveAlumno !== undefined;
        const nomina = alumno.v_Nomina || "";
        const nombre = tieneRegistro && alumno.v_Nombre ? alumno.v_Nombre.toUpperCase() : (alumno.v_Nombre || "");
        const curp = tieneRegistro && alumno.v_CURP ? alumno.v_CURP : "";
        const puesto = tieneRegistro && alumno.v_Puesto ? alumno.v_Puesto : "";
        return [nomina, nombre, curp, puesto].join("\t");
      });

      const textToCopy = [headers.join("\t"), ...rows].join("\n");

      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(textToCopy);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = textToCopy;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }

      setCopiadoAlumnos(true);
      toast.success("Tabla de alumnos copiada al portapapeles");
      setTimeout(() => setCopiadoAlumnos(false), 2000);
    } catch (err) {
      console.error("Error al copiar tabla de alumnos:", err);
      toast.error("No se pudo copiar la tabla al portapapeles.");
    }
  };

  // Toggle entregable en memoria
  const handleToggleEntregable = (index: number) => {
    setEntregables((prev) => {
      const copy = [...prev];
      const actual = copy[index];
      const nuevoEstado = !actual.b_Entregado;
      copy[index] = {
        ...actual,
        b_Entregado: nuevoEstado,
        f_FechaEntregable: nuevoEstado ? new Date().toISOString() : null,
      };
      return copy;
    });
  };

const MESES_ABREV_ES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

function formatearFechaVoBo(fechaIso: string | null | undefined): string {
  if (!fechaIso) return "";
  const parts = fechaIso.split("T")[0].split("-");
  if (parts.length === 3) {
    const year = parts[0];
    const monthIdx = parseInt(parts[1], 10) - 1;
    const day = parts[2].padStart(2, "0");
    if (monthIdx >= 0 && monthIdx < 12) {
      return `${day}/${MESES_ABREV_ES[monthIdx]}/${year}`;
    }
  }
  return fechaIso;
}

  // Resumen de Pendientes client-side
  const calcularPendientes = (): string[] => {
    if (!detalle) return [];
    const p: string[] = [];
    if (detalle.b_SinProgramar) p.push("Programación");
    if (!cotizacionGI.trim()) p.push("No. cotización GI");
    if (!ordenCompra.trim()) p.push("No. OC cliente");
    if (entregables.some((e) => !e.b_Entregado)) p.push("Entregables");
    if (facturas.length === 0) p.push("Factura");
    if (detalle.b_AplicaVoBo && !detalle.v_KeyVoBo) p.push("Visto bueno");
    return p;
  };

  const pendientesList = calcularPendientes();

  // Guardar notas del servicio
  const handleGuardarNotas = async () => {
    if (!detalle?.i_CveServAgendaDet) return;
    setGuardandoNotas(true);
    try {
      const valorAEnviar = notas.trim() === "" ? null : notas.trim();
      await AgendaService.actualizarNotasServicio(detalle.i_CveServAgendaDet, valorAEnviar);
      toast.success("Notas guardadas exitosamente");
      const nuevoBase = valorAEnviar ?? "";
      setNotas(nuevoBase);
      setNotasBase(nuevoBase);
      setDetalle((prev) => (prev ? { ...prev, v_Notas: valorAEnviar } : null));
      if (onGuardadoExitoso) onGuardadoExitoso();
    } catch (err: any) {
      console.error("Error al actualizar notas:", err);
      const msg =
        err?.response?.data?.mensaje ||
        err?.response?.data?.message ||
        "Error al guardar las notas";
      toast.error(msg);
    } finally {
      setGuardandoNotas(false);
    }
  };

  const notasHanCambiado = (notas.trim() || "") !== (notasBase.trim() || "");
  const deshabilitarGuardarNotas = !notasHanCambiado || guardandoNotas;

  // Lógica y validación de Cupo
  const esAbiertoOriginal = !detalle?.i_NumAlumnos || Number(detalle.i_NumAlumnos) === 0;
  const cupoOriginal = esAbiertoOriginal ? 0 : Number(detalle?.i_NumAlumnos);

  const iniciarEdicionCupo = () => {
    if (esAbiertoOriginal) {
      setTipoCupoEdicion("Abierto");
      setCupoEdicion(Math.max(1, inscritos));
    } else {
      setTipoCupoEdicion("Limitado");
      setCupoEdicion(cupoOriginal);
    }
    setEditandoCupo(true);
  };

  const cancelarEdicionCupo = () => {
    setEditandoCupo(false);
  };

  const valorCupoNum =
    typeof cupoEdicion === "string"
      ? (cupoEdicion.trim() === "" ? NaN : Number(cupoEdicion))
      : cupoEdicion;

  let errorCupoTexto: string | null = null;
  let cupoEsInvalido = false;

  if (tipoCupoEdicion === "Limitado") {
    if (isNaN(valorCupoNum) || valorCupoNum < 1) {
      errorCupoTexto = "El cupo debe ser al menos 1";
      cupoEsInvalido = true;
    } else if (valorCupoNum < inscritos) {
      const diff = inscritos - valorCupoNum;
      errorCupoTexto = `Hay ${inscritos} alumnos inscritos. Para reducir el cupo a ${valorCupoNum}, primero elimina ${diff} alumno(s) de la lista.`;
      cupoEsInvalido = true;
    }
  }

  const sinCambiosCupo =
    (tipoCupoEdicion === "Abierto" && esAbiertoOriginal) ||
    (tipoCupoEdicion === "Limitado" && !esAbiertoOriginal && valorCupoNum === cupoOriginal);

  const deshabilitarGuardarCupo = cupoEsInvalido || sinCambiosCupo || guardandoCupo;

  const handleGuardarCupo = async () => {
    if (!detalle?.i_CveServAgendaDet) return;
    if (cupoEsInvalido || deshabilitarGuardarCupo) return;

    setGuardandoCupo(true);
    try {
      const valorAEnviar = tipoCupoEdicion === "Abierto" ? null : Number(cupoEdicion);
      await AgendaService.actualizarCupoServicio(detalle.i_CveServAgendaDet, valorAEnviar);
      toast.success("Cupo actualizado exitosamente");
      setDetalle((prev) => (prev ? { ...prev, i_NumAlumnos: valorAEnviar } : null));
      setEditandoCupo(false);
      if (onGuardadoExitoso) onGuardadoExitoso();
    } catch (err: any) {
      console.error("Error al actualizar cupo:", err);
      const msg =
        err?.response?.data?.mensaje ||
        err?.response?.data?.message ||
        "Ocurrió un error al actualizar el cupo.";
      toast.error(msg);
    } finally {
      setGuardandoCupo(false);
    }
  };

  // Guardar cambios
  const handleGuardar = async () => {
    if (!detalle) return;
    setGuardando(true);

    const payload: AgendaDetalleUpdateDto = {
      i_CveServAgendaDet: detalle.i_CveServAgendaDet,
      v_NoCotizacionGI: cotizacionGI.trim() || null,
      v_NoOrdenCompraCliente: ordenCompra.trim() || null,
      Facturas: facturas.map((f) => ({
        i_CveFacturas: f.i_CveFacturas,
        v_NoFactura: f.v_NoFactura,
        b_Timbrada: f.b_Timbrada,
        v_EstadoCobro: f.v_EstadoCobro,
        d_FechaHora: f.d_FechaHora,
      })),
      Entregables: entregables.map((e) => ({
        i_CveAgendaEntregables: e.i_CveAgendaEntregables,
        b_Entregado: e.b_Entregado,
        f_FechaEntregable: e.f_FechaEntregable,
      })),
    };

    const exito = await AgendaService.updateAgendaDetalle(payload);
    setGuardando(false);

    if (exito) {
      toast.success("Detalle del servicio guardado exitosamente");
      onGuardadoExitoso?.();
      onCerrar();
    } else {
      toast.error("Ocurrió un error al guardar los cambios del detalle.");
    }
  };

  // Badges de Estado
  const renderBadgeSesion = (sesion: SesionDetalleDto) => {
    const bCancelada = Boolean(
      sesion.b_Cancelada ||
      (sesion as any).b_cancelada ||
      (sesion as any).bCancelada
    );

    if (bCancelada) {
      return (
        <span
          style={{
            padding: "3px 14px",
            borderRadius: "20px",
            fontSize: "12px",
            fontWeight: 700,
            backgroundColor: "#ef4444",
            color: "#ffffff",
            display: "inline-block",
          }}
        >
          Cancelado
        </span>
      );
    }

    if ((sesion as any).i_CveEstatus === 5) {
      return (
        <span
          title="Llegó la fecha de finalización estimada. Falta confirmar que terminó."
          style={{
            padding: "3px 14px",
            borderRadius: "20px",
            fontSize: "12px",
            fontWeight: 700,
            backgroundColor: "#ffe5d0",
            color: "#984c0c",
            display: "inline-block",
          }}
        >
          Por confirmar
        </span>
      );
    }

    const iCveReprograma =
      sesion.i_CveReprograma ??
      (sesion as any).i_cveReprograma ??
      (sesion as any).iCveReprograma;

    const esCompletada = Boolean(
      sesion.Completada ||
      (sesion as any).completada ||
      (sesion as any).b_Completada ||
      (sesion as any).b_Completado ||
      (sesion as any).bCompletada ||
      (sesion as any).i_CveEstatus === 3
    );

    // 1. Si i_CveReprograma tiene valor -> Reprogramada (Amarillo)
    if (iCveReprograma != null && iCveReprograma > 0) {
      return (
        <span
          style={{
            padding: "3px 14px",
            borderRadius: "20px",
            fontSize: "12px",
            fontWeight: 700,
            backgroundColor: "#f59e0b",
            color: "#ffffff",
            display: "inline-block",
          }}
        >
          Reprogramada
        </span>
      );
    }

    // 2. Si no, y Completada es true -> Completada (Verde)
    if (esCompletada) {
      return (
        <span
          style={{
            padding: "3px 14px",
            borderRadius: "20px",
            fontSize: "12px",
            fontWeight: 700,
            backgroundColor: "#10b981",
            color: "#ffffff",
            display: "inline-block",
          }}
        >
          Completada
        </span>
      );
    }

    // 3. Si no cumple las anteriores -> Programado (Azul pill)
    return (
      <span
        style={{
          padding: "3px 14px",
          borderRadius: "20px",
          fontSize: "12px",
          fontWeight: 700,
          backgroundColor: "#208bfe",
          color: "#ffffff",
          display: "inline-block",
        }}
      >
        Programado
      </span>
    );
  };

  const renderEstatusBadge = (estatus: number | null, sinProgramar?: boolean) => {
    if (sinProgramar) {
      return <span className="badge badge-warning">Pendiente</span>;
    }
    switch (estatus) {
      case 0:
        return <span className="badge badge-danger">Cancelado</span>;
      case 1:
        return <span className="badge badge-primary">Programado</span>;
      case 2:
        return <span className="badge badge-warning">En curso</span>;
      case 3:
        return <span className="badge badge-success">Terminado</span>;
      case 4:
        return <span className="badge badge-secondary">Reprogramado</span>;
      case 5:
        return (
          <span
            className="badge"
            title="Llegó la fecha de finalización estimada. Falta confirmar que terminó."
            style={{ backgroundColor: "#ffe5d0", color: "#984c0c" }}
          >
            Por confirmar
          </span>
        );
      default:
        return <span className="badge badge-primary">Programado</span>;
    }
  };

  const renderBadgeCobroFactura = (f: FacturaDetalleDto) => {
    if (f.b_Cancelada) {
      return (
        <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-rose-50 text-rose-800 border border-rose-200">
          Cancelada
        </span>
      );
    }
    if (f.v_EstadoCobro === "Cobrada" || f.v_EstadoCobro === "Liquidada") {
      return (
        <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-800 border border-emerald-200">
          Liquidada
        </span>
      );
    }
    if (f.v_EstadoCobro === "Abonada") {
      return (
        <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-amber-50 text-amber-800 border border-amber-200">
          Abonada — falta ${f.d_SaldoPendiente?.toLocaleString("es-MX", { minimumFractionDigits: 2 }) ?? "0.00"}
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-rose-50 text-rose-800 border border-rose-200">
        {f.d_Monto != null
          ? `Pendiente — $${f.d_Monto.toLocaleString("es-MX", { minimumFractionDigits: 2 })}`
          : "Pendiente"}
      </span>
    );
  };

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
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: "16px",
      }}
    >
      <div
        className="modal-content no-scrollbar"
        style={{
          maxWidth: "850px",
          width: "100%",
          maxHeight: "98vh",
          backgroundColor: "#ffffff",
          borderRadius: "16px",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0, 0, 0, 0.05)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          scrollbarWidth: "none",
          msOverflowStyle: "none",
        }}
      >
        {/* Header del Modal (15px / 500) */}
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
          <h3 style={{ fontSize: "15px", fontWeight: 500, color: "#0f172a", margin: 0 }}>
            Detalle del servicio
          </h3>
          <button
            className="btn-icon"
            onClick={onCerrar}
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

        {/* Body del Modal con Scroll Interno (24px gap entre secciones) */}
        <div
          className="modal-body no-scrollbar"
          style={{
            padding: "24px",
            flex: 1,
            overflowY: "auto",
            scrollbarWidth: "none",
            msOverflowStyle: "none",
            display: "flex",
            flexDirection: "column",
            gap: "24px",
          }}
        >
          {cargando || !detalle ? (
            <div style={{ padding: "48px 0", textAlign: "center", color: "#64748b" }}>
              <div className="spinner-border text-primary mb-3" style={{ width: "24px", height: "24px" }}></div>
              <p style={{ fontSize: "12px", margin: 0 }}>Cargando detalle del servicio...</p>
            </div>
          ) : (
            <>
              {/* BLOQUE 1.1 — Info General (Sin caja contenedora exterior, Grid 2-4 columnas) */}
              <div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "16px" }}>
                  <div>
                    <span style={{ fontSize: "11px", fontWeight: 400, color: "#64748b", display: "block", marginBottom: "2px" }}>servicio</span>
                    <p style={{ fontSize: "13px", fontWeight: 400, color: "#0f172a", margin: 0, lineHeight: 1.3 }}>{detalle.v_Servicio || "—"}</p>
                    <p style={{ fontSize: "12px", fontWeight: 400, color: "#64748b", margin: "2px 0 0 0" }}>
                      {detalle.i_Cantidad ?? 0} {detalle.v_Unidad || ""}
                    </p>
                  </div>

                  <div>
                    <span style={{ fontSize: "11px", fontWeight: 400, color: "#64748b", display: "block", marginBottom: "2px" }}>tipo</span>
                    <p style={{ fontSize: "13px", fontWeight: 400, color: "#0f172a", margin: 0, lineHeight: 1.3 }}>{detalle.v_TipoServicio || "—"}</p>
                  </div>

                  <div>
                    <span style={{ fontSize: "11px", fontWeight: 400, color: "#64748b", display: "block", marginBottom: "2px" }}>empresa</span>
                    <p style={{ fontSize: "13px", fontWeight: 400, color: "#0f172a", margin: 0, textTransform: "uppercase", lineHeight: 1.3 }}>{detalle.v_Empresa || "—"}</p>
                  </div>

                  <div>
                    <span style={{ fontSize: "11px", fontWeight: 400, color: "#64748b", display: "block", marginBottom: "2px" }}>planta</span>
                    <p style={{ fontSize: "13px", fontWeight: 400, color: "#0f172a", margin: 0, lineHeight: 1.3 }}>{detalle.v_Planta || "—"}</p>
                  </div>
                </div>

                {renderBannerEstatus()}

                {detalle.b_SinProgramar && (
                  <div
                    style={{
                      marginTop: "14px",
                      padding: "12px 14px",
                      backgroundColor: "#fffbeb",
                      border: "1px solid #fde68a",
                      borderRadius: "8px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "12px",
                      fontSize: "12px",
                      color: "#92400e",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <AlertTriangle size={16} style={{ color: "#d97706", flexShrink: 0 }} />
                      <span>
                        Este servicio está <strong>pendiente de programar</strong> — falta definir fecha, hora y personal.
                      </span>
                    </div>
                    <button
                      type="button"
                      className="btn btn-primary"
                      style={{ height: "30px", padding: "0 12px", fontSize: "12px", backgroundColor: "#2B8FCC", flexShrink: 0 }}
                      onClick={() => setModalProgramarAbierto(true)}
                    >
                      Programar
                    </button>
                  </div>
                )}

                {/* Sección Notas del servicio */}
                <div style={{ marginTop: "16px" }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: "6px",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "11px",
                        fontWeight: 400,
                        color: "#64748b",
                        display: "block",
                      }}
                    >
                      notas
                    </span>
                    <button
                      type="button"
                      className="btn btn-sm btn-primary"
                      onClick={handleGuardarNotas}
                      disabled={deshabilitarGuardarNotas}
                      style={{
                        fontSize: "12px",
                        height: "28px",
                        padding: "0 12px",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        backgroundColor: deshabilitarGuardarNotas ? "#e2e8f0" : "#2B8FCC",
                        color: deshabilitarGuardarNotas ? "#94a3b8" : "#ffffff",
                        borderColor: "transparent",
                        cursor: deshabilitarGuardarNotas ? "not-allowed" : "pointer",
                        borderRadius: "6px",
                        fontWeight: 500,
                      }}
                    >
                      {guardandoNotas && <Loader2 size={13} className="animate-spin" />}
                      Guardar notas
                    </button>
                  </div>
                  <textarea
                    rows={2}
                    className="form-control"
                    placeholder="Sin notas"
                    value={notas}
                    onChange={(e) => setNotas(e.target.value)}
                    style={{
                      width: "100%",
                      fontSize: "13px",
                      borderRadius: "8px",
                      border: "1px solid #d0dce8",
                      padding: "8px 12px",
                      resize: "vertical",
                      minHeight: "56px",
                      backgroundColor: "#ffffff",
                      color: "#0f172a",
                      fontFamily: "inherit",
                    }}
                  />
                </div>
              </div>

              {/* BLOQUE 1.2 — Sesiones (Sin caja contenedora exterior) */}
              <div>
                <h4 style={{ fontSize: "12px", fontWeight: 500, color: "#64748b", margin: "0 0 8px 0" }}>
                  Sesiones de la agenda ({listaSesiones.length})
                </h4>

                <div style={{ border: "1px solid #e2e8f0", borderRadius: "8px", overflow: "hidden" }}>
                  <button
                    type="button"
                    style={{
                      width: "100%",
                      height: "40px",
                      padding: "0 14px",
                      backgroundColor: "#f8fafc",
                      border: "none",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      cursor: "pointer",
                      textAlign: "left",
                    }}
                    onClick={() => setAcordeonSesiones(!acordeonSesiones)}
                  >
                    <span style={{ fontSize: "13px", fontWeight: 500, color: "#334155", display: "flex", alignItems: "center", gap: "8px" }}>
                      <Calendar size={15} style={{ color: "#94a3b8" }} />
                      Ver historial de sesiones
                    </span>
                    {acordeonSesiones ? <ChevronUp size={16} style={{ color: "#94a3b8" }} /> : <ChevronDown size={16} style={{ color: "#94a3b8" }} />}
                  </button>

                  {acordeonSesiones && (
                    <div style={{ padding: "12px", backgroundColor: "#ffffff", borderTop: "1px solid #e2e8f0", display: "flex", flexDirection: "column", gap: "8px" }}>
                      {listaSesiones.length === 0 ? (
                        <p style={{ fontSize: "12px", color: "#64748b", margin: 0 }}>No hay sesiones registradas.</p>
                      ) : (
                        listaSesiones.map((sesion, sIdx) => {
                          const bCancelada = Boolean(
                            sesion.b_Cancelada ||
                            (sesion as any).b_cancelada ||
                            (sesion as any).bCancelada
                          );

                          const iCveReprograma =
                            sesion.i_CveReprograma ??
                            (sesion as any).i_cveReprograma ??
                            (sesion as any).iCveReprograma;
                          const esReprogramada = iCveReprograma != null && Number(iCveReprograma) > 0;

                          const esExpandible = esReprogramada || (bCancelada && Boolean(sesion.v_MotivoCancelacion));
                          const estaAbierto = sesionAbiertaIdx === sIdx;
                          const esVigente = !esReprogramada && !bCancelada;
                          const sesionNueva = esReprogramada
                            ? listaSesiones.find((s) => s.i_CveAgendaDetalle === iCveReprograma)
                            : null;

                          return (
                            <div key={`det-sesion-${sesion.i_CveAgendaDetalle || 'det'}-${sIdx}`} style={{ border: "1px solid #e2e8f0", borderRadius: "6px", overflow: "hidden" }}>
                              <div
                                style={{
                                  minHeight: "38px",
                                  padding: "6px 12px",
                                  backgroundColor: "#ffffff",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "space-between",
                                  cursor: esExpandible ? "pointer" : "default",
                                  gap: "12px",
                                  flexWrap: "nowrap",
                                }}
                                onClick={() => {
                                  if (esExpandible) {
                                    setSesionAbiertaIdx(estaAbierto ? null : sIdx);
                                  }
                                }}
                              >
                                <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0, fontSize: "13px", whiteSpace: "nowrap" }}>
                                  <span style={{ fontWeight: 500, color: "#1e293b" }}>
                                    Sesión {sesion.i_Orden || sIdx + 1}
                                  </span>
                                  {detalle.i_CveTipoServicio === 3 || detalle.i_CveTipoServicio === 6 ? (
                                    <span style={{ color: "#475569" }}>
                                      — {formatearFechaTexto(sesion.d_FechaHoraInicio)} – {formatearFechaTexto(sesion.d_FechaHoraFin)}
                                    </span>
                                  ) : (
                                    <>
                                      <span style={{ color: "#475569" }}>
                                        — {formatearFechaCorta(sesion.d_FechaHoraInicio)}
                                      </span>

                                      {detalle.b_TipoDato && (
                                        <span style={{ color: "#64748b", fontFamily: "var(--font-mono)", fontSize: "12px" }}>
                                          (
                                          {new Date(sesion.d_FechaHoraInicio).toLocaleTimeString("en-US", {
                                            hour: "2-digit",
                                            minute: "2-digit",
                                          })}{" "}
                                          a{" "}
                                          {new Date(sesion.d_FechaHoraFin).toLocaleTimeString("en-US", {
                                            hour: "2-digit",
                                            minute: "2-digit",
                                          })}
                                          )
                                        </span>
                                      )}
                                    </>
                                  )}
                                </div>

                                <div style={{ display: "flex", alignItems: "center", gap: "8px", flex: 1, minWidth: 0, justifyContent: "flex-end", flexWrap: "nowrap" }}>
                                  {obtenerTextoInstructoresSesion(sesion) ? (
                                    <span
                                      style={{
                                        fontSize: "12px",
                                        color: "#64748b",
                                        fontWeight: 400,
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                        whiteSpace: "nowrap",
                                        flex: "0 1 auto",
                                        minWidth: 0,
                                        textAlign: "right",
                                      }}
                                      title={obtenerTextoInstructoresSesion(sesion)}
                                    >
                                      {obtenerTextoInstructoresSesion(sesion)}
                                    </span>
                                  ) : null}

                                  <div style={{ display: "flex", alignItems: "center", gap: "6px", flexShrink: 0, whiteSpace: "nowrap" }}>
                                    {renderBadgeSesion(sesion)}
                                    {!esReprogramada && (
                                      <>
                                        {esVigente && (
                                          <button
                                            type="button"
                                            className="btn-icon"
                                            title="Editar sesión"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setSesionAEditarInstructor(sesion);
                                              setModalEditarInstructorAbierto(true);
                                            }}
                                            style={{
                                              padding: "4px",
                                              border: "none",
                                              background: "transparent",
                                              color: "#2B8FCC",
                                              cursor: "pointer",
                                              display: "inline-flex",
                                              alignItems: "center",
                                              justifyContent: "center",
                                            }}
                                          >
                                            <Edit2 size={15} />
                                          </button>
                                        )}

                                        <button
                                          type="button"
                                          className="btn-icon"
                                          title="Reprogramar esta sesión"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setSesionAReprogramarId(sesion.i_CveAgendaDetalle);
                                            setModalReprogramarAbierto(true);
                                          }}
                                          style={{
                                            padding: "4px",
                                            border: "none",
                                            background: "transparent",
                                            color: "#d97706",
                                            cursor: "pointer",
                                            display: "inline-flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                          }}
                                        >
                                          <RefreshCw size={15} />
                                        </button>

                                      {bCancelada ? (
                                        <button
                                          type="button"
                                          className="btn-icon"
                                          title="Esta sesión ya se encuentra cancelada"
                                          disabled
                                          onClick={(e) => e.stopPropagation()}
                                          style={{
                                            padding: "4px",
                                            border: "none",
                                            background: "transparent",
                                            color: "#cbd5e1",
                                            cursor: "not-allowed",
                                            display: "inline-flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            opacity: 0.6,
                                          }}
                                        >
                                          <Ban size={15} />
                                        </button>
                                      ) : (
                                        <button
                                          type="button"
                                          className="btn-icon"
                                          title="Cancelar esta sesión"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setSesionACancelar(sesion);
                                            setModalCancelarAbierto(true);
                                          }}
                                          style={{
                                            padding: "4px",
                                            border: "none",
                                            background: "transparent",
                                            color: "#ef4444",
                                            cursor: "pointer",
                                            display: "inline-flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                          }}
                                        >
                                          <Ban size={15} />
                                        </button>
                                      )}
                                    </>
                                  )}
                                  {esExpandible && (
                                    estaAbierto ? <ChevronUp size={14} style={{ color: "#94a3b8" }} /> : <ChevronDown size={14} style={{ color: "#94a3b8" }} />
                                  )}
                                  </div>
                                </div>
                              </div>

                              {esExpandible && estaAbierto && (
                                <div style={{ padding: "12px", backgroundColor: "#f8fafc", fontSize: "12px", borderTop: "1px solid #e2e8f0", display: "flex", flexDirection: "column", gap: "6px" }}>
                                  {esReprogramada && (
                                    <div style={{ padding: "10px", backgroundColor: "#fffbeb", border: "1px solid #fde68a", borderRadius: "6px", color: "#92400e", display: "flex", flexDirection: "column", gap: "4px", fontSize: "11px" }}>
                                      <span style={{ fontWeight: 500, color: "#b45309" }}>Detalles de Reprogramación:</span>
                                      {sesion.v_Observaciones && <span>• Motivo: {sesion.v_Observaciones}</span>}
                                      {sesion.v_Contacto && <span>• Solicitado por: {sesion.v_Contacto}</span>}
                                      {sesionNueva && (
                                        <span>
                                          • Nueva Fecha: <strong>{formatearFechaCorta(sesionNueva.d_FechaHoraInicio)}</strong>
                                        </span>
                                      )}
                                    </div>
                                  )}
                                  {bCancelada && sesion.v_MotivoCancelacion && (
                                    <div style={{ padding: "10px", backgroundColor: "#fef2f2", border: "1px solid #fecaca", borderRadius: "6px", color: "#991b1b", display: "flex", flexDirection: "column", gap: "4px", fontSize: "11px" }}>
                                      <span style={{ fontWeight: 500, color: "#991b1b" }}>Detalles de Cancelación:</span>
                                      <span>• Motivo: {sesion.v_MotivoCancelacion}</span>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })

                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* BLOQUE 1.3 — Alumnos Inscritos (Sin caja contenedora exterior) */}
              {esCapacitacion && (
                <div>
                  <div style={{ marginBottom: "8px" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "8px" }}>
                      <h4 style={{ fontSize: "12px", fontWeight: 500, color: "#64748b", margin: 0 }}>
                        Alumnos inscritos
                      </h4>
                      {!editandoCupo ? (
                        <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium border ${getBadgeColorAlumnos()}`}>
                          {inscritos} / {sinLimite ? "∞" : cupos}
                        </span>
                      ) : (
                        <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                          <select
                            className="form-select"
                            value={tipoCupoEdicion}
                            onChange={(e) => {
                              const nuevoTipo = e.target.value as "Abierto" | "Limitado";
                              setTipoCupoEdicion(nuevoTipo);
                              if (nuevoTipo === "Limitado") {
                                const actual = Number(detalle?.i_NumAlumnos) || 0;
                                setCupoEdicion(actual > 0 ? actual : Math.max(1, inscritos));
                              }
                            }}
                            style={{
                              height: "28px",
                              fontSize: "12px",
                              borderRadius: "6px",
                              border: "1px solid #d0dce8",
                              padding: "2px 8px",
                              color: "#1e3a5f",
                              backgroundColor: "#ffffff",
                              width: "95px",
                            }}
                          >
                            <option value="Abierto">Abierto</option>
                            <option value="Limitado">Limitado</option>
                          </select>

                          {tipoCupoEdicion === "Limitado" && (
                            <input
                              type="number"
                              min={Math.max(1, inscritos)}
                              className="form-control"
                              placeholder="Cupo"
                              value={cupoEdicion}
                              onChange={(e) => {
                                const val = e.target.value;
                                setCupoEdicion(val === "" ? "" : Number(val));
                              }}
                              style={{
                                height: "28px",
                                width: "72px",
                                fontSize: "12px",
                                borderRadius: "6px",
                                border: cupoEsInvalido ? "1px solid #dc2626" : "1px solid #d0dce8",
                                padding: "2px 8px",
                                color: "#1e3a5f",
                              }}
                            />
                          )}

                          <button
                            type="button"
                            className="btn btn-sm btn-primary"
                            onClick={handleGuardarCupo}
                            disabled={deshabilitarGuardarCupo}
                            style={{
                              height: "28px",
                              fontSize: "12px",
                              padding: "0 10px",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                              backgroundColor: deshabilitarGuardarCupo ? "#e2e8f0" : "#2B8FCC",
                              color: deshabilitarGuardarCupo ? "#94a3b8" : "#ffffff",
                              borderColor: "transparent",
                              cursor: deshabilitarGuardarCupo ? "not-allowed" : "pointer",
                              borderRadius: "6px",
                              fontWeight: 500,
                            }}
                          >
                            {guardandoCupo && <Loader2 size={12} className="animate-spin" />}
                            Guardar
                          </button>

                          <button
                            type="button"
                            className="btn btn-sm"
                            onClick={cancelarEdicionCupo}
                            disabled={guardandoCupo}
                            style={{
                              height: "28px",
                              fontSize: "12px",
                              padding: "0 10px",
                              border: "1px solid #d0dce8",
                              backgroundColor: "#ffffff",
                              color: "#64748b",
                              borderRadius: "6px",
                              cursor: guardandoCupo ? "not-allowed" : "pointer",
                            }}
                          >
                            Cancelar
                          </button>
                        </div>
                      )}
                    </div>
                    {editandoCupo && errorCupoTexto && (
                      <div style={{ fontSize: "11px", color: "#dc2626", marginTop: "4px", textAlign: "right" }}>
                        {errorCupoTexto}
                      </div>
                    )}
                  </div>

                  <div style={{ border: "1px solid #e2e8f0", borderRadius: "8px", overflow: "hidden" }}>
                    <div style={{ height: "40px", padding: "0 14px", backgroundColor: "#f8fafc", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <button
                        type="button"
                        style={{ background: "none", border: "none", display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", fontWeight: 500, color: "#334155", cursor: "pointer", padding: 0 }}
                        onClick={() => setAcordeonAlumnos(!acordeonAlumnos)}
                      >
                        <Users size={15} style={{ color: "#94a3b8" }} />
                        Ver lista de alumnos ({inscritos})
                      </button>

                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        {esCapacitacion && !editandoCupo && (
                          <button
                            type="button"
                            className="btn-icon"
                            title="Editar cupo"
                            onClick={(e) => {
                              e.stopPropagation();
                              iniciarEdicionCupo();
                            }}
                            style={{
                              padding: "4px",
                              border: "none",
                              background: "transparent",
                              color: "#2B8FCC",
                              cursor: "pointer",
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <Edit2 size={15} />
                          </button>
                        )}
                        <button
                          type="button"
                          className="btn-icon"
                          style={{
                            padding: "4px",
                            color: copiadoAlumnos ? "#10b981" : "#64748b",
                            cursor: inscritos === 0 ? "not-allowed" : "pointer",
                            transition: "color 0.15s ease",
                          }}
                          onClick={handleCopiarTablaAlumnos}
                          disabled={inscritos === 0}
                          title={copiadoAlumnos ? "¡Copiado!" : "Copiar tabla al portapapeles"}
                        >
                          {copiadoAlumnos ? (
                            <Check size={16} style={{ color: "#10b981" }} />
                          ) : (
                            <Copy size={16} />
                          )}
                        </button>

                        <button
                          type="button"
                          className="btn-icon"
                          style={{
                            padding: "4px",
                            color: descargandoNomina ? "#2B8FCC" : "#64748b",
                            cursor: descargandoNomina || inscritos === 0 ? "not-allowed" : "pointer",
                          }}
                          onClick={handleDescargarNomina}
                          disabled={inscritos === 0 || descargandoNomina}
                          title={descargandoNomina ? "Descargando nómina..." : "Descargar Nómina en Excel"}
                        >
                          {descargandoNomina ? (
                            <Loader2 size={16} className="animate-spin" />
                          ) : (
                            <FileSpreadsheet size={16} />
                          )}
                        </button>

                        <button
                          type="button"
                          className="btn-icon"
                          style={{ padding: "4px", color: "#94a3b8", cursor: "pointer" }}
                          onClick={() => setAcordeonAlumnos(!acordeonAlumnos)}
                        >
                          {acordeonAlumnos ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </button>
                      </div>
                    </div>

                    {acordeonAlumnos && (
                      <div style={{ padding: "10px 12px", backgroundColor: "#ffffff", borderTop: "1px solid #e2e8f0" }}>
                        {cargandoAlumnos ? (
                          <div style={{ padding: "20px 0", textAlign: "center", color: "#64748b" }}>
                            <div className="spinner-border text-primary mb-2" style={{ width: "20px", height: "20px" }}></div>
                            <p style={{ fontSize: "12px", margin: 0 }}>Cargando alumnos inscritos...</p>
                          </div>
                        ) : errorAlumnos ? (
                          <div style={{ padding: "12px 14px", backgroundColor: "#fef2f2", border: "1px solid #fecaca", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", color: "#991b1b" }}>
                              <AlertTriangle size={16} style={{ flexShrink: 0 }} />
                              <span>{errorAlumnos}</span>
                            </div>
                            <button
                              type="button"
                              className="btn btn-sm btn-outline"
                              onClick={() => iCveServAgendaDet && cargarAlumnosInscritos(iCveServAgendaDet)}
                              style={{ fontSize: "11px", height: "26px", padding: "0 10px", flexShrink: 0 }}
                            >
                              Reintentar
                            </button>
                          </div>
                        ) : alumnosInscritos.length === 0 ? (
                          <p style={{ fontSize: "12px", color: "#64748b", margin: 0, padding: "8px 0" }}>No hay alumnos inscritos en este servicio.</p>
                        ) : (
                          <div
                            className={`alegra-table-container ${alumnosInscritos.length >= 7 ? "custom-scrollbar" : ""}`}
                            style={{
                              maxHeight: alumnosInscritos.length >= 7 ? "260px" : undefined,
                              overflowY: alumnosInscritos.length >= 7 ? "auto" : undefined,
                              borderRadius: "6px",
                              border: "1px solid #e2e8f0",
                              scrollbarWidth: "thin",
                              scrollbarColor: "#cbd5e1 transparent",
                            }}
                          >
                            <table className="alegra-table alegra-table-compact" style={{ width: "100%", tableLayout: "fixed" }}>
                              <thead style={{ position: "sticky", top: 0, zIndex: 2, backgroundColor: "#f8fafc" }}>
                                <tr>
                                  <th style={{ width: "18%", padding: "6px 10px", fontSize: "12px", backgroundColor: "#f8fafc", position: "sticky", top: 0, boxShadow: "0 1px 0 #e2e8f0" }}>
                                    Nómina
                                  </th>
                                  <th style={{ width: "36%", padding: "6px 10px", fontSize: "12px", backgroundColor: "#f8fafc", position: "sticky", top: 0, boxShadow: "0 1px 0 #e2e8f0" }}>
                                    Nombre
                                  </th>
                                  <th style={{ width: "23%", padding: "6px 10px", fontSize: "12px", backgroundColor: "#f8fafc", position: "sticky", top: 0, boxShadow: "0 1px 0 #e2e8f0" }}>
                                    CURP
                                  </th>
                                  <th style={{ width: "23%", padding: "6px 10px", fontSize: "12px", backgroundColor: "#f8fafc", position: "sticky", top: 0, boxShadow: "0 1px 0 #e2e8f0" }}>
                                    Puesto
                                  </th>
                                  <th
                                    className="text-center"
                                    style={{ width: "46px", minWidth: "46px", padding: "6px 6px", fontSize: "12px", backgroundColor: "#f8fafc", position: "sticky", top: 0, boxShadow: "0 1px 0 #e2e8f0", whiteSpace: "nowrap" }}
                                  >
                                    Acciones
                                  </th>
                                </tr>
                              </thead>
                              <tbody>
                                {alumnosInscritos.map((alumno) => {
                                  const tieneRegistro = alumno.i_CveAlumno !== null && alumno.i_CveAlumno !== undefined;
                                  return (
                                    <tr
                                      key={`inscrito-${alumno.i_CveAlumnoAgenda}`}
                                      className="hover:bg-slate-50/60 transition-colors"
                                      style={{ height: "30px" }}
                                    >
                                      <td
                                        style={{
                                          padding: "4px 10px",
                                          fontSize: "12px",
                                          fontWeight: 500,
                                          color: "#1e293b",
                                          whiteSpace: "nowrap",
                                          overflow: "hidden",
                                          textOverflow: "ellipsis",
                                          verticalAlign: "middle",
                                        }}
                                        title={alumno.v_Nomina || ""}
                                      >
                                        {alumno.v_Nomina || "—"}
                                      </td>
                                      <td
                                        style={{
                                          padding: "4px 10px",
                                          fontSize: "12px",
                                          whiteSpace: "nowrap",
                                          overflow: "hidden",
                                          textOverflow: "ellipsis",
                                          verticalAlign: "middle",
                                        }}
                                        title={tieneRegistro ? (alumno.v_Nombre || "") : "Sin registro en el catálogo"}
                                      >
                                        {tieneRegistro && alumno.v_Nombre ? (
                                          <span style={{ fontWeight: 500, color: "#1e293b", textTransform: "uppercase" }}>
                                            {alumno.v_Nombre}
                                          </span>
                                        ) : (
                                          <span style={{ color: "#94a3b8", fontStyle: "italic", fontSize: "11px" }}>
                                            Sin registro en el catálogo
                                          </span>
                                        )}
                                      </td>
                                      <td
                                        style={{
                                          padding: "4px 10px",
                                          fontSize: "12px",
                                          fontFamily: "var(--font-mono)",
                                          whiteSpace: "nowrap",
                                          overflow: "hidden",
                                          textOverflow: "ellipsis",
                                          verticalAlign: "middle",
                                        }}
                                        title={tieneRegistro && alumno.v_CURP ? alumno.v_CURP : ""}
                                      >
                                        {tieneRegistro && alumno.v_CURP ? (
                                          <span className="text-secondary text-xs">{alumno.v_CURP}</span>
                                        ) : (
                                          <span style={{ color: "#cbd5e1" }}>—</span>
                                        )}
                                      </td>
                                      <td
                                        style={{
                                          padding: "4px 10px",
                                          fontSize: "12px",
                                          color: "#475569",
                                          whiteSpace: "nowrap",
                                          overflow: "hidden",
                                          textOverflow: "ellipsis",
                                          verticalAlign: "middle",
                                        }}
                                        title={tieneRegistro && alumno.v_Puesto ? alumno.v_Puesto : ""}
                                      >
                                        {tieneRegistro && alumno.v_Puesto ? (
                                          alumno.v_Puesto
                                        ) : (
                                          <span style={{ color: "#cbd5e1" }}>—</span>
                                        )}
                                      </td>
                                      <td
                                        className="text-center"
                                        style={{
                                          width: "46px",
                                          minWidth: "46px",
                                          padding: "4px 6px",
                                          verticalAlign: "middle",
                                          whiteSpace: "nowrap",
                                        }}
                                      >
                                        <button
                                          type="button"
                                          className="btn-icon danger"
                                          onClick={() => handleEliminarAlumno(alumno.i_CveAlumnoAgenda, alumno.v_Nombre || alumno.v_Nomina)}
                                          title="Quitar alumno del servicio"
                                          style={{
                                            width: "24px",
                                            height: "24px",
                                            padding: "2px",
                                            display: "inline-flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                          }}
                                        >
                                          <Trash2 size={13} />
                                        </button>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* BLOQUE 1.4 — Montos (Con Card/Contenedor diferenciado surface-2) */}
              <div style={{ backgroundColor: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                  <h4 style={{ fontSize: "12px", fontWeight: 500, color: "#64748b", margin: 0 }}>
                    Información de montos
                  </h4>
                  {!ocultarEditarMontos && (
                    <button
                      type="button"
                      className="btn-icon"
                      title="Editar montos"
                      onClick={abrirModalEditarMontos}
                      style={{
                        padding: "4px",
                        border: "none",
                        background: "transparent",
                        color: "#2B8FCC",
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Edit2 size={15} />
                    </button>
                  )}
                </div>

                {detalle.v_TipoVenta === "proyecto" ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "16px" }}>
                      <div>
                        <span style={{ fontSize: "11px", fontWeight: 400, color: "#64748b", display: "block", marginBottom: "2px" }}>cantidad / unidad</span>
                        <p style={{ fontSize: "13px", fontWeight: 400, color: "#1e293b", margin: 0 }}>
                          {detalle.i_Cantidad} {detalle.v_Unidad}
                        </p>
                      </div>
                      <div>
                        <span style={{ fontSize: "11px", fontWeight: 400, color: "#64748b", display: "block", marginBottom: "2px" }}>monto global s/IVA</span>
                        <p style={{ fontSize: "13px", fontFamily: "var(--font-mono)", fontWeight: 400, color: "#1e293b", margin: 0 }}>
                          ${(detalle.d_MontoProyecto ?? 0).toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                      <div>
                        <span style={{ fontSize: "11px", fontWeight: 400, color: "#64748b", display: "block", marginBottom: "2px" }}>monto global c/IVA</span>
                        <p style={{ fontSize: "14px", fontFamily: "var(--font-mono)", fontWeight: 500, color: "#2B8FCC", margin: 0 }}>
                          ${((detalle.d_MontoProyecto ?? 0) * (1 + IVA)).toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                    </div>
                    <p style={{ fontSize: "11px", color: "#64748b", fontStyle: "italic", margin: "4px 0 0 0" }}>
                      Nota: Este servicio forma parte de un proyecto con monto global — el monto se factura por grupo, no de forma individual.
                    </p>
                    <p
                      style={{
                        fontSize: "11px",
                        color: "#b45309",
                        fontStyle: "italic",
                        margin: "2px 0 0 0",
                        display: "flex",
                        alignItems: "center",
                        gap: "5px",
                      }}
                    >
                      <Lock size={12} style={{ flexShrink: 0, color: "#d97706" }} />
                      <span>PARA CAMBIAR EL MONTO GLOBAL DEBE CANCELAR LA FACTURA</span>
                    </p>
                  </div>
                ) : (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "16px" }}>
                    <div>
                      <span style={{ fontSize: "11px", fontWeight: 400, color: "#64748b", display: "block", marginBottom: "2px" }}>cantidad / unidad</span>
                      <p style={{ fontSize: "13px", fontWeight: 400, color: "#1e293b", margin: 0 }}>
                        {detalle.i_Cantidad} {detalle.v_Unidad}
                      </p>
                    </div>
                    <div>
                      <span style={{ fontSize: "11px", fontWeight: 400, color: "#64748b", display: "block", marginBottom: "2px" }}>precio unitario s/IVA</span>
                      <p style={{ fontSize: "13px", fontFamily: "var(--font-mono)", fontWeight: 400, color: "#1e293b", margin: 0 }}>
                        ${(detalle.d_PrecioUnitario ?? 0).toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                    <div>
                      <span style={{ fontSize: "11px", fontWeight: 400, color: "#64748b", display: "block", marginBottom: "2px" }}>precio total s/IVA</span>
                      <p style={{ fontSize: "13px", fontFamily: "var(--font-mono)", fontWeight: 400, color: "#1e293b", margin: 0 }}>
                        ${((detalle.d_PrecioUnitario ?? 0) * detalle.i_Cantidad).toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                    <div>
                      <span style={{ fontSize: "11px", fontWeight: 400, color: "#64748b", display: "block", marginBottom: "2px" }}>precio final c/IVA</span>
                      <p style={{ fontSize: "14px", fontFamily: "var(--font-mono)", fontWeight: 500, color: "#2B8FCC", margin: 0 }}>
                        ${((detalle.d_PrecioUnitario ?? 0) * detalle.i_Cantidad * (1 + IVA)).toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* BLOQUE 1.4.2 — Servicio externo contratado */}
              <div style={{ backgroundColor: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                  <h4 style={{ fontSize: "12px", fontWeight: 500, color: "#64748b", margin: 0 }}>
                    Servicio externo contratado
                  </h4>
                  {!detalle.b_SinProgramar && detalle.i_CveProveedor && Number(detalle.i_CveProveedor) > 0 ? (
                    <button
                      type="button"
                      style={{
                        color: "#64748b",
                        padding: "2px 4px",
                        cursor: "pointer",
                        background: "none",
                        border: "none",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px",
                        fontSize: "12px",
                        fontWeight: 400,
                      }}
                      onClick={abrirModalProveedor}
                      title="Editar servicio externo"
                    >
                      <Edit2 size={12} style={{ color: "#94a3b8" }} />
                      <span>Editar</span>
                    </button>
                  ) : null}
                </div>

                {detalle.b_SinProgramar ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px", paddingTop: "4px" }}>
                    <span style={{ fontSize: "13px", color: "#94a3b8", fontStyle: "italic" }}>
                      Primero programa el servicio para poder agregar un servicio externo.
                    </span>
                  </div>
                ) : !detalle.i_CveProveedor || Number(detalle.i_CveProveedor) <= 0 ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px", paddingTop: "4px" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
                      <span style={{ fontSize: "13px", color: "#94a3b8", fontStyle: "italic" }}>
                        Sin servicio externo contratado
                      </span>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-primary"
                        onClick={abrirModalProveedor}
                        disabled={tieneSesionConInstructorApoyo}
                        title={
                          tieneSesionConInstructorApoyo
                            ? "Quita el instructor de apoyo de las sesiones para poder agregar un servicio externo."
                            : "Agregar servicio externo"
                        }
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px",
                          fontSize: "12px",
                          padding: "4px 12px",
                          borderRadius: "6px",
                          opacity: tieneSesionConInstructorApoyo ? 0.5 : 1,
                          cursor: tieneSesionConInstructorApoyo ? "not-allowed" : "pointer",
                        }}
                      >
                        <Plus size={14} />
                        <span>Agregar servicio externo</span>
                      </button>
                    </div>
                    {tieneSesionConInstructorApoyo && (
                      <p style={{ fontSize: "12px", color: "#64748b", margin: 0 }}>
                        Quita el instructor de apoyo de las sesiones para poder agregar un servicio externo.
                      </p>
                    )}
                  </div>
                ) : (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "16px" }}>
                    <div>
                      <span style={{ fontSize: "11px", fontWeight: 400, color: "#64748b", display: "block", marginBottom: "2px" }}>servicio externo</span>
                      <p style={{ fontSize: "13px", fontWeight: 500, color: "#1e293b", margin: 0 }}>
                        {detalle.v_Proveedor || "—"}
                      </p>
                    </div>
                    <div>
                      <span style={{ fontSize: "11px", fontWeight: 400, color: "#64748b", display: "block", marginBottom: "2px" }}>costo unitario s/IVA</span>
                      <p style={{ fontSize: "13px", fontFamily: "var(--font-mono)", fontWeight: 400, color: "#1e293b", margin: 0 }}>
                        ${(detalle.d_PrecioProveedor ?? 0).toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                    <div>
                      <span style={{ fontSize: "11px", fontWeight: 400, color: "#64748b", display: "block", marginBottom: "2px" }}>costo total s/IVA</span>
                      <p style={{ fontSize: "13px", fontFamily: "var(--font-mono)", fontWeight: 400, color: "#1e293b", margin: 0 }}>
                        ${((detalle.d_PrecioProveedor ?? 0) * (detalle.i_Cantidad ?? 1)).toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                    <div>
                      <span style={{ fontSize: "11px", fontWeight: 400, color: "#64748b", display: "block", marginBottom: "2px" }}>costo final c/IVA</span>
                      <p style={{ fontSize: "14px", fontFamily: "var(--font-mono)", fontWeight: 500, color: "#2B8FCC", margin: 0 }}>
                        ${(((detalle.d_PrecioProveedor ?? 0) * (detalle.i_Cantidad ?? 1)) * (1 + IVA)).toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                    <div>
                      <span style={{ fontSize: "11px", fontWeight: 400, color: "#64748b", display: "block", marginBottom: "2px" }}>no. cotización</span>
                      <p style={{ fontSize: "13px", fontWeight: 400, color: "#1e293b", margin: 0 }}>
                        {detalle.v_NoCotizacionProv || "—"}
                      </p>
                    </div>
                    <div>
                      <span style={{ fontSize: "11px", fontWeight: 400, color: "#64748b", display: "block", marginBottom: "2px" }}>orden de compra</span>
                      <p style={{ fontSize: "13px", fontWeight: 400, color: "#1e293b", margin: 0 }}>
                        {detalle.v_NoOrdenCompraProv || "—"}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* BLOQUE 1.4.3 — Gastos extras */}
              <div style={{ backgroundColor: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                  <h4 style={{ fontSize: "12px", fontWeight: 500, color: "#64748b", margin: 0 }}>
                    Gastos extras
                  </h4>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-primary"
                    onClick={abrirModalAgregarGasto}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      fontSize: "12px",
                      padding: "4px 12px",
                      borderRadius: "6px",
                      cursor: "pointer",
                    }}
                  >
                    <Plus size={14} />
                    <span>Agregar gasto</span>
                  </button>
                </div>

                {listaGastos.length === 0 ? (
                  <div style={{ paddingTop: "4px" }}>
                    <span style={{ fontSize: "13px", color: "#94a3b8", fontStyle: "italic" }}>
                      Sin gastos registrados
                    </span>
                  </div>
                ) : (
                  <div style={{ overflowX: "auto", border: "1px solid #e2e8f0", borderRadius: "6px", backgroundColor: "#ffffff" }}>
                    <table style={{ width: "100%", fontSize: "12px", borderCollapse: "collapse", textAlign: "left" }}>
                      <thead>
                        <tr style={{ backgroundColor: "#f8fafc", borderBottom: "1px solid #e2e8f0", color: "#64748b" }}>
                          <th style={{ padding: "8px 12px", fontWeight: 500 }}>Proveedor</th>
                          <th style={{ padding: "8px 12px", fontWeight: 500 }}>Concepto</th>
                          <th style={{ padding: "8px 12px", fontWeight: 500, textAlign: "right" }}>Cantidad</th>
                          <th style={{ padding: "8px 12px", fontWeight: 500, textAlign: "right" }}>Costo unit. s/IVA</th>
                          <th style={{ padding: "8px 12px", fontWeight: 500, textAlign: "right" }}>Subtotal s/IVA</th>
                          <th style={{ padding: "8px 12px", fontWeight: 500 }}>Cotización</th>
                          <th style={{ padding: "8px 12px", fontWeight: 500 }}>OC</th>
                          <th style={{ padding: "8px 12px", fontWeight: 500, textAlign: "center" }}>Estado de pago</th>
                          <th style={{ padding: "8px 12px", fontWeight: 500, textAlign: "center" }}>Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {listaGastos.map((gasto, gIdx) => (
                          <tr key={`gasto-${gasto.i_CveGasto || gIdx}`} style={{ borderBottom: "1px solid #f1f5f9" }}>
                            <td style={{ padding: "8px 12px", color: "#1e293b", fontWeight: 500 }}>
                              {gasto.v_Proveedor || "—"}
                            </td>
                            <td style={{ padding: "8px 12px", color: "#334155" }}>
                              {gasto.v_Concepto}
                            </td>
                            <td style={{ padding: "8px 12px", fontFamily: "var(--font-mono)", textAlign: "right", color: "#334155" }}>
                              {`${Number(gasto.i_Cantidad).toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${gasto.v_Unidad || "Pieza"}`}
                            </td>
                            <td style={{ padding: "8px 12px", fontFamily: "var(--font-mono)", textAlign: "right", color: "#334155" }}>
                              ${(gasto.d_CostoUnitario ?? 0).toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                            <td style={{ padding: "8px 12px", fontFamily: "var(--font-mono)", textAlign: "right", fontWeight: 600, color: "#0f172a" }}>
                              ${(gasto.d_Subtotal ?? 0).toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                            <td style={{ padding: "8px 12px", color: "#64748b" }}>
                              {gasto.v_NoCotizacion || "—"}
                            </td>
                            <td style={{ padding: "8px 12px", color: "#64748b" }}>
                              {gasto.v_NoOrdenCompra || "—"}
                            </td>
                            <td style={{ padding: "8px 12px", textAlign: "center" }}>
                              {renderEstadoPagoBadge(gasto.v_EstadoPago)}
                            </td>
                            <td style={{ padding: "8px 12px", textAlign: "center" }}>
                              <div style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                                <button
                                  type="button"
                                  className="btn-icon"
                                  onClick={() => abrirModalEditarGasto(gasto)}
                                  title="Editar gasto"
                                  style={{
                                    background: "none",
                                    border: "none",
                                    color: "#64748b",
                                    cursor: "pointer",
                                    padding: "4px",
                                    display: "inline-flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                  }}
                                >
                                  <Edit2 size={14} />
                                </button>
                                <button
                                  type="button"
                                  className="btn-icon"
                                  disabled={gasto.b_TienePagos}
                                  title={
                                    gasto.b_TienePagos
                                      ? "Este gasto ya tiene pagos realizados"
                                      : "Eliminar gasto"
                                  }
                                  onClick={() => {
                                    if (!gasto.b_TienePagos) {
                                      setGastoAEliminar(gasto);
                                    }
                                  }}
                                  style={{
                                    background: "none",
                                    border: "none",
                                    color: gasto.b_TienePagos ? "#94a3b8" : "#dc3545",
                                    cursor: gasto.b_TienePagos ? "not-allowed" : "pointer",
                                    opacity: gasto.b_TienePagos ? 0.4 : 1,
                                    padding: "4px",
                                    display: "inline-flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                  }}
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot style={{ backgroundColor: "#f8fafc", borderTop: "2px solid #e2e8f0" }}>
                        <tr>
                          <td colSpan={4} style={{ padding: "10px 12px", textAlign: "right", fontWeight: 700, color: "#334155", fontSize: "12px" }}>
                            Total gastos s/IVA
                          </td>
                          <td style={{ padding: "10px 12px", textAlign: "right", fontWeight: 700, fontFamily: "var(--font-mono)", color: "#2B8FCC", fontSize: "13px" }}>
                            ${totalGastosSubtotal.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td colSpan={4}></td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}
              </div>

              {/* BLOQUE 1.5 — Datos de Venta (Con Card/Contenedor diferenciado) */}
              <div style={{ border: "1px solid #e2e8f0", borderRadius: "10px", padding: "16px", display: "flex", flexDirection: "column", gap: "16px" }}>
                <h4 style={{ fontSize: "12px", fontWeight: 500, color: "#64748b", margin: 0 }}>
                  Datos de venta y cotización
                </h4>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}>
                  {/* Cotización GI Inline */}
                  <div style={{ padding: "12px", backgroundColor: "#f8fafc", borderRadius: "6px", border: "1px solid #e2e8f0", display: "flex", flexDirection: "column", gap: "4px" }}>
                    <span style={{ fontSize: "11px", fontWeight: 400, color: "#64748b" }}>cotización GI</span>
                    {editandoCotizacion ? (
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "2px" }}>
                        <input
                          type="text"
                          className="form-control"
                          style={{ fontSize: "12px", padding: "4px 8px", height: "28px" }}
                          value={cotizacionGI}
                          onChange={(e) => setCotizacionGI(e.target.value)}
                          placeholder="No. Cotización GI"
                        />
                        <button
                          type="button"
                          className="btn-icon"
                          style={{ color: "#10b981", padding: "4px" }}
                          onClick={() => setEditandoCotizacion(false)}
                          title="Confirmar edición"
                        >
                          <Check size={16} />
                        </button>
                      </div>
                    ) : (
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "2px" }}>
                        {cotizacionGI.trim() ? (
                          <span style={{ fontSize: "13px", fontFamily: "var(--font-mono)", fontWeight: 400, color: "#1e293b" }}>{cotizacionGI}</span>
                        ) : (
                          <span style={{ fontSize: "12px", color: "#dc3545", fontWeight: 500 }}>Pendiente</span>
                        )}
                        <button
                          type="button"
                          className="btn-icon"
                          style={{ color: "#94a3b8", padding: "2px", cursor: "pointer" }}
                          onClick={() => setEditandoCotizacion(true)}
                          title="Editar Cotización GI"
                        >
                          <Edit2 size={12} />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* OC Cliente Inline */}
                  <div style={{ padding: "12px", backgroundColor: "#f8fafc", borderRadius: "6px", border: "1px solid #e2e8f0", display: "flex", flexDirection: "column", gap: "4px" }}>
                    <span style={{ fontSize: "11px", fontWeight: 400, color: "#64748b" }}>OC cliente</span>
                    {editandoOC ? (
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "2px" }}>
                        <input
                          type="text"
                          className="form-control"
                          style={{ fontSize: "12px", padding: "4px 8px", height: "28px" }}
                          value={ordenCompra}
                          onChange={(e) => setOrdenCompra(e.target.value)}
                          placeholder="No. Orden de Compra"
                        />
                        <button
                          type="button"
                          className="btn-icon"
                          style={{ color: "#10b981", padding: "4px" }}
                          onClick={() => setEditandoOC(false)}
                          title="Confirmar edición"
                        >
                          <Check size={16} />
                        </button>
                      </div>
                    ) : (
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "2px" }}>
                        {ordenCompra.trim() ? (
                          <span style={{ fontSize: "13px", fontFamily: "var(--font-mono)", fontWeight: 400, color: "#1e293b" }}>{ordenCompra}</span>
                        ) : (
                          <span style={{ fontSize: "12px", color: "#dc3545", fontWeight: 500 }}>Pendiente</span>
                        )}
                        <button
                          type="button"
                          className="btn-icon"
                          style={{ color: "#94a3b8", padding: "2px", cursor: "pointer" }}
                          onClick={() => setEditandoOC(true)}
                          title="Editar OC Cliente"
                        >
                          <Edit2 size={12} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Tabla de Facturas Reales */}
                <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "4px" }}>
                  <span style={{ fontSize: "11px", fontWeight: 400, color: "#64748b" }}>facturas asociadas</span>
                  {facturas.length === 0 ? (
                    <div style={{ padding: "12px", backgroundColor: "#fffbeb", border: "1px solid #fde68a", borderRadius: "6px", fontSize: "12px", color: "#92400e" }}>
                      Este servicio no tiene facturas asociadas.
                    </div>
                  ) : (
                    <div style={{ overflowX: "auto", border: "1px solid #e2e8f0", borderRadius: "6px" }}>
                      <table style={{ width: "100%", fontSize: "12px", borderCollapse: "collapse", textAlign: "left" }}>
                        <thead>
                          <tr style={{ backgroundColor: "#f8fafc", borderBottom: "1px solid #e2e8f0", color: "#64748b" }}>
                            <th style={{ padding: "8px 12px", fontWeight: 400 }}>No. Factura</th>
                            <th style={{ padding: "8px 12px", fontWeight: 400 }}>Fecha</th>
                            <th style={{ padding: "8px 12px", fontWeight: 400 }}>Monto</th>
                            <th style={{ padding: "8px 12px", fontWeight: 400 }}>Timbrado</th>
                            <th style={{ padding: "8px 12px", fontWeight: 400 }}>Estado Cobro</th>
                          </tr>
                        </thead>
                        <tbody style={{ fontFamily: "var(--font-mono)" }}>
                          {facturas.map((f, idx) => (
                            <tr key={`fact-${f.i_CveFacturas || 'x'}-${idx}`} style={{ borderBottom: "1px solid #f1f5f9" }}>
                              <td style={{ padding: "8px 12px", fontWeight: 400 }}>{f.v_NoFactura || "Sin número"}</td>
                              <td style={{ padding: "8px 12px", fontWeight: 400 }}>
                                {f.d_FechaHora ? (
                                  formatearFechaCorta(f.d_FechaHora)
                                ) : (
                                  <span style={{ color: "#dc3545", fontWeight: 500 }}>Pendiente</span>
                                )}
                              </td>
                              <td style={{ padding: "8px 12px" }}>
                                ${f.d_Monto?.toLocaleString("es-MX", { minimumFractionDigits: 2 }) ?? "0.00"}
                              </td>
                              <td style={{ padding: "8px 12px" }}>
                                {f.b_Timbrada ? (
                                  <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-[#cfe2ff] text-[#084298]">
                                    Timbrada
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-[#f8f9fa] text-[#6c757d]">
                                    No timbrada
                                  </span>
                                )}
                              </td>
                              <td style={{ padding: "8px 12px" }}>{renderBadgeCobroFactura(f)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>

              {/* BLOQUE 1.6 — Entregables (Checklist simple sin caja exterior) */}
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                  <h4 style={{ fontSize: "12px", fontWeight: 500, color: "#64748b", margin: 0 }}>
                    Checklist de entregables
                  </h4>
                  {!panelAgregarAbierto && (
                    <button
                      type="button"
                      className="btn-icon"
                      style={{ color: "#94a3b8", padding: "2px", cursor: "pointer" }}
                      onClick={handleAbrirPanelAgregar}
                      title="Agregar entregables"
                    >
                      <Edit2 size={12} />
                    </button>
                  )}
                </div>

                {/* Panel de selección inline */}
                {panelAgregarAbierto && (
                  <div
                    style={{
                      padding: "12px",
                      backgroundColor: "#f8fafc",
                      border: "1px solid #e2e8f0",
                      borderRadius: "8px",
                      marginBottom: "12px",
                      display: "flex",
                      flexDirection: "column",
                      gap: "12px",
                    }}
                  >
                    {cargandoCatalogo ? (
                      <div style={{ padding: "12px 0", fontSize: "12px", color: "#64748b" }}>
                        Cargando catálogo…
                      </div>
                    ) : (
                      <>
                        {/* Buscador */}
                        <input
                          type="text"
                          className="form-control"
                          style={{ fontSize: "12px", padding: "6px 10px", height: "32px", width: "100%" }}
                          placeholder="Buscar entregable..."
                          value={busquedaEntregable}
                          onChange={(e) => setBusquedaEntregable(e.target.value)}
                        />

                        {/* Lista de checkboxes */}
                        <div
                          className="no-scrollbar"
                          style={{
                            maxHeight: "220px",
                            overflowY: "auto",
                            display: "flex",
                            flexDirection: "column",
                            gap: "4px",
                            paddingRight: "4px",
                          }}
                        >
                          {entregablesDisponiblesCatalogo.length === 0 ? (
                            <p style={{ fontSize: "12px", color: "#64748b", margin: "4px 0" }}>
                              No hay más entregables disponibles para agregar.
                            </p>
                          ) : entregablesDisponiblesFiltrados.length === 0 ? (
                            <p style={{ fontSize: "12px", color: "#64748b", margin: "4px 0" }}>
                              No se encontraron entregables que coincidan con la búsqueda.
                            </p>
                          ) : (
                            entregablesDisponiblesFiltrados.map((item) => {
                              const checked = seleccionadosIds.has(item.i_CveEntregables);
                              return (
                                <label
                                  key={`cat-ent-${item.i_CveEntregables}`}
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "8px",
                                    padding: "6px 8px",
                                    borderRadius: "6px",
                                    backgroundColor: checked ? "#eff6ff" : "#ffffff",
                                    border: "1px solid",
                                    borderColor: checked ? "#bfdbfe" : "#f1f5f9",
                                    cursor: "pointer",
                                    fontSize: "12px",
                                    color: "#1e293b",
                                    transition: "all 0.15s ease",
                                  }}
                                >
                                  <input
                                    type="checkbox"
                                    checked={checked}
                                    onChange={() => handleToggleSeleccionId(item.i_CveEntregables)}
                                    style={{ cursor: "pointer", width: "14px", height: "14px", accentColor: "#2B8FCC" }}
                                  />
                                  <span>{item.v_Nombre}</span>
                                </label>
                              );
                            })
                          )}
                        </div>

                        {/* Checkbox guardar en catálogo */}
                        <label
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            fontSize: "12px",
                            color: "#334155",
                            cursor: "pointer",
                            marginTop: "4px",
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={guardarEnCatalogo}
                            onChange={(e) => setGuardarEnCatalogo(e.target.checked)}
                            style={{ cursor: "pointer", width: "14px", height: "14px", accentColor: "#2B8FCC" }}
                          />
                          <span>
                            Guardar también en el catálogo de este servicio{" "}
                            <span style={{ color: "#64748b", fontSize: "11px" }}>
                              (las próximas agendas los traerán por default)
                            </span>
                          </span>
                        </label>

                        {/* Botones */}
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "8px", marginTop: "4px" }}>
                          <button
                            type="button"
                            className="btn btn-secondary"
                            style={{ height: "30px", padding: "0 12px", fontSize: "12px" }}
                            onClick={handleCancelarPanelAgregar}
                            disabled={agregandoEntregables}
                          >
                            Cancelar
                          </button>
                          <button
                            type="button"
                            className="btn btn-primary"
                            style={{ backgroundColor: "#2B8FCC", height: "30px", padding: "0 12px", fontSize: "12px" }}
                            onClick={handleAgregarEntregablesConfirmar}
                            disabled={seleccionadosIds.size === 0 || agregandoEntregables}
                          >
                            {agregandoEntregables ? "Agregando…" : `Agregar (${seleccionadosIds.size})`}
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                )}

                {entregables.length === 0 ? (
                  <p style={{ fontSize: "12px", color: "#64748b", margin: 0 }}>No hay entregables configurados para este servicio.</p>
                ) : (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "8px" }}>
                    {entregables.map((ent, idx) => {
                      const keyArchivo = ent.v_Key || (ent.i_CveArchivo ? String(ent.i_CveArchivo) : null);
                      return (
                        <div
                          key={`ent-${ent.i_CveAgendaEntregables || 'x'}-${idx}`}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            padding: "10px 12px",
                            backgroundColor: "#ffffff",
                            border: "1px solid #e2e8f0",
                            borderRadius: "6px",
                            fontSize: "13px",
                            cursor: "pointer",
                            transition: "background-color 0.2s ease",
                          }}
                          onClick={() => handleToggleEntregable(idx)}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            {ent.b_Entregado ? (
                              <CheckCircle2 size={14} style={{ color: "#10b981", flexShrink: 0 }} />
                            ) : (
                              <Circle size={14} style={{ color: "#cbd5e1", flexShrink: 0 }} />
                            )}
                            <div style={{ display: "flex", flexDirection: "column" }}>
                              <span style={{ fontWeight: 400, color: "#1e293b" }}>{ent.v_Nombre}</span>
                              {ent.b_Entregado ? (
                                <span style={{ fontSize: "11px", color: "#10b981", fontWeight: 500 }}>
                                  Entregado el {formatearFechaVoBo(ent.f_FechaEntregable)}
                                </span>
                              ) : (
                                <span style={{ fontSize: "11px", color: "#dc3545", fontWeight: 500 }}>Pendiente</span>
                              )}
                            </div>
                          </div>

                          {keyArchivo && (
                            <button
                              type="button"
                              className="btn-icon"
                              style={{
                                padding: "4px 8px",
                                color: "#2B8FCC",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "4px",
                                fontSize: "12px",
                                fontWeight: 500,
                                background: "none",
                                border: "none",
                                cursor: "pointer",
                                textDecoration: "underline",
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                VerDocumento(keyArchivo);
                              }}
                              title={`Ver archivo de ${ent.v_Nombre}`}
                            >
                              <Paperclip size={14} />
                              <span>Ver archivo</span>
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Card nueva: Visto bueno de la autoridad (solo si b_AplicaVoBo === true) */}
              {detalle.b_AplicaVoBo && (
                <div>
                  <h4 style={{ fontSize: "12px", fontWeight: 500, color: "#64748b", margin: "0 0 8px 0" }}>
                    Visto bueno de la autoridad
                  </h4>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "10px 12px",
                      backgroundColor: "#ffffff",
                      border: "1px solid #e2e8f0",
                      borderRadius: "6px",
                      fontSize: "13px",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      {detalle.v_KeyVoBo ? (
                        <CheckCircle2 size={14} style={{ color: "#10b981", flexShrink: 0 }} />
                      ) : (
                        <Circle size={14} style={{ color: "#cbd5e1", flexShrink: 0 }} />
                      )}
                      <div style={{ display: "flex", flexDirection: "column" }}>
                        <span style={{ fontWeight: 400, color: "#1e293b" }}>Visto bueno de la autoridad</span>
                        {detalle.v_KeyVoBo ? (
                          <span style={{ fontSize: "11px", color: "#10b981", fontWeight: 500 }}>
                            Entregado el {formatearFechaVoBo(detalle.d_FechaVoBo)}
                          </span>
                        ) : (
                          <span style={{ fontSize: "11px", color: "#dc3545", fontWeight: 500 }}>Pendiente</span>
                        )}
                      </div>
                    </div>

                    {detalle.v_KeyVoBo && (
                      <button
                        type="button"
                        className="btn-icon"
                        style={{
                          padding: "4px 8px",
                          color: "#2B8FCC",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                          fontSize: "12px",
                          fontWeight: 500,
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          textDecoration: "underline",
                        }}
                        onClick={() => VerDocumento(detalle.v_KeyVoBo)}
                        title="Ver visto bueno de la autoridad"
                      >
                        <Paperclip size={14} />
                        <span>Ver archivo</span>
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* BLOQUE 1.7 — Resumen de Pendientes (Banner Final) */}
              {pendientesList.length > 0 ? (
                <div
                  style={{
                    padding: "12px",
                    backgroundColor: "#fffbeb",
                    border: "1px solid #fde68a",
                    color: "#92400e",
                    borderRadius: "6px",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    fontSize: "13px",
                  }}
                >
                  <AlertTriangle size={16} style={{ color: "#d97706", flexShrink: 0 }} />
                  <span>
                    <strong>Pendientes:</strong> {pendientesList.join(", ")}
                  </span>
                </div>
              ) : (
                <div
                  style={{
                    padding: "12px",
                    backgroundColor: "#ecfdf5",
                    border: "1px solid #a7f3d0",
                    color: "#065f46",
                    borderRadius: "6px",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    fontSize: "13px",
                  }}
                >
                  <CheckCircle2 size={16} style={{ color: "#10b981", flexShrink: 0 }} />
                  <span>
                    <strong>Todo completado:</strong> El servicio no tiene pendientes registrados.
                  </span>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer del Modal Sticky (#2B8FCC para Guardar, nunca verde) */}
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
          <button type="button" className="btn btn-secondary" onClick={onCerrar} disabled={guardando}>
            Cerrar
          </button>
          <button
            type="button"
            className="btn btn-primary"
            style={{ backgroundColor: "#2B8FCC" }}
            onClick={handleGuardar}
            disabled={guardando || !detalle}
          >
            {guardando ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </div>
      {/* Modal Reprogramar Sesión */}
      <ModalReprogramarSesion
        abierto={modalReprogramarAbierto}
        onCerrar={() => {
          setModalReprogramarAbierto(false);
          setSesionAReprogramarId(null);
        }}
        iCveAgenda={iCveAgenda}
        iCveServAgendaDet={iCveServAgendaDet}
        iCveAgendaDetalle={sesionAReprogramarId}
        onReprogramacionExitosa={() => {
          cargarDetalle();
          if (onGuardadoExitoso) onGuardadoExitoso();
        }}
      />
      {/* Modal Cancelar Sesión */}
      <ModalCancelarSesion
        abierto={modalCancelarAbierto}
        iCveAgendaDetalle={sesionACancelar?.i_CveAgendaDetalle ?? null}
        empresaNombre={detalle?.v_Empresa}
        servicioNombre={detalle?.v_Servicio}
        fechaInicio={sesionACancelar?.d_FechaHoraInicio}
        onCerrar={() => {
          setModalCancelarAbierto(false);
          setSesionACancelar(null);
        }}
        onConfirmarExito={() => {
          setModalCancelarAbierto(false);
          setSesionACancelar(null);
          cargarDetalle();
          if (onGuardadoExitoso) onGuardadoExitoso();
        }}
      />
      {/* Modal Editar Instructor Sesión */}
      <ModalEditarInstructorSesion
        abierto={modalEditarInstructorAbierto}
        sesion={sesionAEditarInstructor}
        iCveTipoServicio={detalle?.i_CveTipoServicio}
        bTipoDato={detalle?.b_TipoDato}
        cantidadTotal={detalle?.i_Cantidad}
        unidad={detalle?.v_Unidad}
        todasLasSesiones={listaSesiones}
        onCerrar={() => {
          setModalEditarInstructorAbierto(false);
          setSesionAEditarInstructor(null);
        }}
        onGuardadoExitoso={() => {
          cargarDetalle();
          if (onGuardadoExitoso) onGuardadoExitoso();
        }}
      />
      {/* Modal Programar Servicio (Pendiente de programar) */}
      <ModalProgramarServicio
        abierto={modalProgramarAbierto}
        detalle={detalle}
        onCerrar={() => setModalProgramarAbierto(false)}
        onGuardadoExitoso={() => {
          setModalProgramarAbierto(false);
          cargarDetalle();
          if (onGuardadoExitoso) onGuardadoExitoso();
        }}
      />
      {/* Modal Agregar / Editar Proveedor */}
      {modalProveedorAbierto && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(15, 23, 42, 0.5)",
            backdropFilter: "blur(3px)",
            zIndex: 1100,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
        >
          <div
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "12px",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
              width: "100%",
              maxWidth: "480px",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* Header */}
            <div
              style={{
                padding: "16px 20px",
                borderBottom: "1px solid #e2e8f0",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                backgroundColor: "#f8fafc",
              }}
            >
              <h3 style={{ fontSize: "15px", fontWeight: 600, color: "#0f172a", margin: 0 }}>
                {detalle?.i_CveProveedor && Number(detalle.i_CveProveedor) > 0
                  ? "Editar servicio externo"
                  : "Agregar servicio externo"}
              </h3>
              <button
                type="button"
                onClick={() => setModalProveedorAbierto(false)}
                disabled={guardandoProveedor}
                style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b" }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Body Form */}
            <form onSubmit={handleGuardarProveedor} style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <label style={{ fontSize: "12px", fontWeight: 600, color: "#334155", display: "block", marginBottom: "6px" }}>
                  Servicio externo <span style={{ color: "#dc3545" }}>*</span>
                </label>
                <select
                  className="form-select"
                  value={formCveProveedor}
                  onChange={(e) => setFormCveProveedor(e.target.value)}
                  disabled={guardandoProveedor}
                  style={{ fontSize: "13px", height: "38px", borderRadius: "8px" }}
                >
                  <option value="">— Sin servicio externo —</option>
                  {proveedoresList.map((p: any) => {
                    const cve = p.i_CveProveedor ?? p.iD_Proveedor ?? p.id_proveedor;
                    const nombre = p.v_RazonSocial || p.v_Nombre || p.s_RazonSocial || `Proveedor #${cve}`;
                    return (
                      <option key={cve} value={cve}>
                        {nombre}
                      </option>
                    );
                  })}
                </select>
              </div>

              {formCveProveedor !== "" && (
                <>
                  <div>
                    <label style={{ fontSize: "12px", fontWeight: 600, color: "#334155", display: "block", marginBottom: "6px" }}>
                      Costo unitario (sin IVA) <span style={{ color: "#dc3545" }}>*</span>
                    </label>
                    <div style={{ position: "relative" }}>
                      <span style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "#64748b", fontSize: "13px" }}>$</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0.01"
                        className="form-control"
                        placeholder="0.00"
                        value={formPrecioProveedor}
                        onChange={(e) => setFormPrecioProveedor(e.target.value)}
                        disabled={guardandoProveedor}
                        style={{ fontSize: "13px", height: "38px", borderRadius: "8px", paddingLeft: "24px" }}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: "12px", fontWeight: 600, color: "#334155", display: "block", marginBottom: "6px" }}>
                      No. cotización
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Ej. COT-PROV-001"
                      value={formNoCotizacionProv}
                      onChange={(e) => setFormNoCotizacionProv(e.target.value)}
                      disabled={guardandoProveedor}
                      style={{ fontSize: "13px", height: "38px", borderRadius: "8px" }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: "12px", fontWeight: 600, color: "#334155", display: "block", marginBottom: "6px" }}>
                      Orden de compra
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Ej. OC-PROV-99"
                      value={formNoOrdenCompraProv}
                      onChange={(e) => setFormNoOrdenCompraProv(e.target.value)}
                      disabled={guardandoProveedor}
                      style={{ fontSize: "13px", height: "38px", borderRadius: "8px" }}
                    />
                  </div>
                </>
              )}

              {/* Footer acciones */}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "8px" }}>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setModalProveedorAbierto(false)}
                  disabled={guardandoProveedor}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn btn-primary btn-sm"
                  style={{ backgroundColor: "#2B8FCC" }}
                  disabled={guardandoProveedor}
                >
                  {guardandoProveedor ? "Guardando..." : "Guardar cambios"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Sub-modal Agregar / Editar Gasto Extra */}
      {modalGastoAbierto && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(15, 23, 42, 0.5)",
            backdropFilter: "blur(3px)",
            zIndex: 1100,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
        >
          <div
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "12px",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
              width: "100%",
              maxWidth: "520px",
              maxHeight: "90vh",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* Header */}
            <div
              style={{
                padding: "16px 20px",
                borderBottom: "1px solid #e2e8f0",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                backgroundColor: "#f8fafc",
              }}
            >
              <h3 style={{ fontSize: "15px", fontWeight: 600, color: "#0f172a", margin: 0 }}>
                {gastoEditando ? "Editar gasto" : "Agregar gasto"}
              </h3>
              <button
                type="button"
                onClick={() => setModalGastoAbierto(false)}
                disabled={guardandoGasto || guardandoAltaRapida}
                style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b" }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Body Form */}
            <form
              onSubmit={handleGuardarGasto}
              style={{
                padding: "20px",
                display: "flex",
                flexDirection: "column",
                gap: "14px",
                overflowY: "auto",
              }}
            >
              {/* Nota si el gasto ya tiene pagos */}
              {gastoEditando?.b_TienePagos && (
                <div
                  style={{
                    padding: "10px 12px",
                    backgroundColor: "#fff6da",
                    border: "1px solid #ffe89a",
                    borderRadius: "8px",
                    fontSize: "12px",
                    color: "#856404",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <AlertTriangle size={16} style={{ flexShrink: 0, color: "#856404" }} />
                  <span>
                    Este gasto ya tiene pagos realizados; solo puedes cambiar concepto, unidad, cotización y orden de compra.
                  </span>
                </div>
              )}

              {/* Proveedor: select normal con lista de proveedores y opción + Nuevo proveedor */}
              <div>
                <label style={{ fontSize: "12px", fontWeight: 600, color: "#334155", display: "block", marginBottom: "6px" }}>
                  Proveedor <span style={{ color: "#dc3545" }}>*</span>
                </label>
                <select
                  className="form-select"
                  value={formGastoProveedorId}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === "NUEVO") {
                      setMostrarAltaRapidaProveedor(true);
                      setFormGastoProveedorId("NUEVO");
                    } else {
                      setFormGastoProveedorId(val);
                      setMostrarAltaRapidaProveedor(false);
                    }
                  }}
                  disabled={guardandoGasto || Boolean(gastoEditando?.b_TienePagos)}
                  style={{ fontSize: "13px", height: "38px", borderRadius: "8px" }}
                >
                  <option value="">— Selecciona un proveedor —</option>
                  {proveedoresFiltradosGasto.map((p: { cve: number; nombre: string }) => (
                    <option key={p.cve} value={p.cve}>
                      {p.nombre}
                    </option>
                  ))}
                  {!gastoEditando?.b_TienePagos && (
                    <option value="NUEVO" style={{ fontWeight: 600, color: "#2B8FCC" }}>
                      + Nuevo proveedor
                    </option>
                  )}
                </select>

                {/* Recuadro Alta Rápida de Proveedor */}
                {mostrarAltaRapidaProveedor && (
                  <div
                    style={{
                      marginTop: "10px",
                      padding: "14px",
                      borderRadius: "8px",
                      border: "1.5px dashed #93c5fd",
                      backgroundColor: "#f0f7ff",
                      display: "flex",
                      flexDirection: "column",
                      gap: "10px",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span style={{ fontSize: "12px", fontWeight: 700, color: "#1e40af" }}>
                        Alta rápida de proveedor
                      </span>
                    </div>

                    <div>
                      <label style={{ fontSize: "11px", fontWeight: 600, color: "#334155", display: "block", marginBottom: "4px" }}>
                        Razón social <span style={{ color: "#dc3545" }}>*</span>
                      </label>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        placeholder="Ej. Suministros Industriales S.A. de C.V."
                        value={altaRazonSocial}
                        onChange={(e) => setAltaRazonSocial(e.target.value)}
                        disabled={guardandoAltaRapida}
                        style={{ fontSize: "12px", height: "32px", borderRadius: "6px" }}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: "11px", fontWeight: 600, color: "#334155", display: "block", marginBottom: "4px" }}>
                        RFC <span style={{ color: "#dc3545" }}>*</span>
                      </label>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        placeholder="Ej. SIN120315AB1"
                        maxLength={13}
                        value={altaRFC}
                        onChange={(e) => setAltaRFC(e.target.value.toUpperCase().replace(/\s+/g, ""))}
                        disabled={guardandoAltaRapida}
                        style={{ fontSize: "12px", height: "32px", borderRadius: "6px" }}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: "11px", fontWeight: 600, color: "#334155", display: "block", marginBottom: "4px" }}>
                        Giro <span style={{ color: "#dc3545" }}>*</span>
                      </label>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        placeholder="Ej. Mantenimiento y consumibles"
                        value={altaGiro}
                        onChange={(e) => setAltaGiro(e.target.value)}
                        disabled={guardandoAltaRapida}
                        style={{ fontSize: "12px", height: "32px", borderRadius: "6px" }}
                      />
                    </div>

                    <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "4px" }}>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => {
                          setMostrarAltaRapidaProveedor(false);
                          setFormGastoProveedorId("");
                          setAltaRazonSocial("");
                          setAltaRFC("");
                          setAltaGiro("");
                        }}
                        disabled={guardandoAltaRapida}
                        style={{ fontSize: "12px", padding: "4px 12px" }}
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        style={{ backgroundColor: "#2B8FCC", fontSize: "12px", padding: "4px 14px" }}
                        onClick={handleCrearProveedorRapido}
                        disabled={guardandoAltaRapida}
                      >
                        {guardandoAltaRapida ? "Registrando..." : "Dar de alta"}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Concepto */}
              <div>
                <label style={{ fontSize: "12px", fontWeight: 600, color: "#334155", display: "block", marginBottom: "6px" }}>
                  Concepto <span style={{ color: "#dc3545" }}>*</span>
                </label>
                <input
                  type="text"
                  maxLength={250}
                  className="form-control"
                  placeholder="Ej. Válvulas de presión"
                  value={formGastoConcepto}
                  onChange={(e) => setFormGastoConcepto(e.target.value)}
                  disabled={guardandoGasto}
                  style={{ fontSize: "13px", height: "38px", borderRadius: "8px" }}
                />
              </div>

              {/* Cantidad y Unidad */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ fontSize: "12px", fontWeight: 600, color: "#334155", display: "block", marginBottom: "6px" }}>
                    Cantidad <span style={{ color: "#dc3545" }}>*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    className="form-control"
                    placeholder="1"
                    value={formGastoCantidad}
                    onChange={(e) => setFormGastoCantidad(e.target.value)}
                    disabled={guardandoGasto || Boolean(gastoEditando?.b_TienePagos)}
                    style={{ fontSize: "13px", height: "38px", borderRadius: "8px" }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: "12px", fontWeight: 600, color: "#334155", display: "block", marginBottom: "6px" }}>
                    Unidad <span style={{ color: "#dc3545" }}>*</span>
                  </label>
                  <select
                    className="form-select"
                    value={formGastoUnidad}
                    onChange={(e) => setFormGastoUnidad(e.target.value)}
                    disabled={guardandoGasto}
                    style={{ fontSize: "13px", height: "38px", borderRadius: "8px" }}
                  >
                    <option value="Pieza">Pieza</option>
                    <option value="Hora">Hora</option>
                    <option value="Servicio">Servicio</option>
                  </select>
                </div>
              </div>

              {/* Costo Unitario y Subtotal */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ fontSize: "12px", fontWeight: 600, color: "#334155", display: "block", marginBottom: "6px" }}>
                    Costo unitario (sin IVA) <span style={{ color: "#dc3545" }}>*</span>
                  </label>
                  <div style={{ position: "relative" }}>
                    <span style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "#64748b", fontSize: "13px" }}>$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      className="form-control"
                      placeholder="0.00"
                      value={formGastoCostoUnitario}
                      onChange={(e) => setFormGastoCostoUnitario(e.target.value)}
                      disabled={guardandoGasto || Boolean(gastoEditando?.b_TienePagos)}
                      style={{ fontSize: "13px", height: "38px", borderRadius: "8px", paddingLeft: "24px" }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: "12px", fontWeight: 600, color: "#334155", display: "block", marginBottom: "6px" }}>
                    Subtotal (sin IVA)
                  </label>
                  <div style={{ position: "relative" }}>
                    <span style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "#64748b", fontSize: "13px" }}>$</span>
                    <input
                      type="text"
                      readOnly
                      className="form-control"
                      value={`$${subtotalGastoCalculado.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                      style={{
                        fontSize: "13px",
                        height: "38px",
                        borderRadius: "8px",
                        paddingLeft: "24px",
                        backgroundColor: "#f8fafc",
                        color: "#334155",
                        fontWeight: 600,
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* No. Cotización y Orden de Compra */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ fontSize: "12px", fontWeight: 600, color: "#334155", display: "block", marginBottom: "6px" }}>
                    No. cotización
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Ej. COT-PROV-001"
                    value={formGastoNoCotizacion}
                    onChange={(e) => setFormGastoNoCotizacion(e.target.value)}
                    disabled={guardandoGasto}
                    style={{ fontSize: "13px", height: "38px", borderRadius: "8px" }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: "12px", fontWeight: 600, color: "#334155", display: "block", marginBottom: "6px" }}>
                    Orden de compra
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Ej. OC-PROV-99"
                    value={formGastoNoOrdenCompra}
                    onChange={(e) => setFormGastoNoOrdenCompra(e.target.value)}
                    disabled={guardandoGasto}
                    style={{ fontSize: "13px", height: "38px", borderRadius: "8px" }}
                  />
                </div>
              </div>

              {/* Footer acciones */}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "10px" }}>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setModalGastoAbierto(false)}
                  disabled={guardandoGasto || guardandoAltaRapida}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn btn-primary btn-sm"
                  style={{ backgroundColor: "#2B8FCC" }}
                  disabled={guardandoGasto || guardandoAltaRapida || mostrarAltaRapidaProveedor}
                >
                  {guardandoGasto ? "Guardando..." : "Guardar cambios"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Confirmar Eliminar Gasto Extra */}
      <ModalConfirmarEliminar
        abierto={!!gastoAEliminar}
        nombreElemento={gastoAEliminar?.v_Concepto || ""}
        mensajePersonalizado={gastoAEliminar ? `¿Deseas eliminar el gasto "${gastoAEliminar.v_Concepto}"?` : undefined}
        onCerrar={() => setGastoAEliminar(null)}
        onConfirmar={handleConfirmarEliminarGasto}
        cargando={eliminandoGasto}
      />

      {/* Sub-modal Editar montos */}
      {modalEditarMontosAbierto && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(15, 23, 42, 0.5)",
            backdropFilter: "blur(3px)",
            zIndex: 1100,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
        >
          <div
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "12px",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
              width: "100%",
              maxWidth: "460px",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* Header */}
            <div
              style={{
                padding: "16px 20px",
                borderBottom: "1px solid #e2e8f0",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                backgroundColor: "#f8fafc",
              }}
            >
              <h3 style={{ fontSize: "15px", fontWeight: 600, color: "#0f172a", margin: 0 }}>
                Editar montos
              </h3>
              <button
                type="button"
                onClick={() => setModalEditarMontosAbierto(false)}
                disabled={guardandoMontos}
                style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b" }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Body Form */}
            <form onSubmit={handleGuardarMontos} style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "16px" }}>
              {/* Cantidad con unidad a la derecha */}
              <div>
                <label style={{ fontSize: "12px", fontWeight: 600, color: "#334155", display: "block", marginBottom: "6px" }}>
                  Cantidad <span style={{ color: "#dc3545" }}>*</span>
                </label>
                <div style={{ display: "flex" }}>
                  <input
                    type="number"
                    step="any"
                    min="0.0001"
                    className="form-control"
                    placeholder="0"
                    value={formMontoCantidad}
                    onChange={(e) => setFormMontoCantidad(e.target.value)}
                    disabled={guardandoMontos}
                    required
                    style={{
                      fontSize: "13px",
                      height: "38px",
                      borderTopRightRadius: 0,
                      borderBottomRightRadius: 0,
                    }}
                  />
                  <span
                    style={{
                      backgroundColor: "#f1f5f9",
                      border: "1px solid #cbd5e1",
                      borderLeft: "none",
                      padding: "0 12px",
                      fontSize: "12px",
                      color: "#475569",
                      display: "flex",
                      alignItems: "center",
                      borderTopRightRadius: "6px",
                      borderBottomRightRadius: "6px",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {detalle?.v_Unidad || "unidad"}
                  </span>
                </div>
              </div>

              {/* Precio unitario s/IVA con prefijo $ */}
              <div>
                <label style={{ fontSize: "12px", fontWeight: 600, color: "#334155", display: "block", marginBottom: "6px" }}>
                  Precio unitario s/IVA <span style={{ color: "#dc3545" }}>*</span>
                </label>
                <div style={{ display: "flex" }}>
                  <span
                    style={{
                      backgroundColor: "#f1f5f9",
                      border: "1px solid #cbd5e1",
                      borderRight: "none",
                      padding: "0 12px",
                      fontSize: "13px",
                      color: "#64748b",
                      display: "flex",
                      alignItems: "center",
                      borderTopLeftRadius: "6px",
                      borderBottomLeftRadius: "6px",
                    }}
                  >
                    $
                  </span>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    className="form-control"
                    placeholder="0.00"
                    value={formMontoPrecioUnitario}
                    onChange={(e) => setFormMontoPrecioUnitario(e.target.value)}
                    disabled={guardandoMontos}
                    required
                    style={{
                      fontSize: "13px",
                      height: "38px",
                      borderTopLeftRadius: 0,
                      borderBottomLeftRadius: 0,
                    }}
                  />
                </div>
              </div>

              {/* Precio total s/IVA (Solo lectura) */}
              <div>
                <label style={{ fontSize: "12px", fontWeight: 600, color: "#64748b", display: "block", marginBottom: "6px" }}>
                  Precio total s/IVA
                </label>
                <input
                  type="text"
                  readOnly
                  className="form-control"
                  value={`$${montoSubtotalCalculado.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                  style={{
                    fontSize: "13px",
                    height: "38px",
                    backgroundColor: "#f8fafc",
                    fontFamily: "var(--font-mono)",
                    color: "#1e293b",
                    cursor: "not-allowed",
                  }}
                />
              </div>

              {/* Precio final c/IVA (Solo lectura) */}
              <div>
                <label style={{ fontSize: "12px", fontWeight: 600, color: "#64748b", display: "block", marginBottom: "6px" }}>
                  Precio final c/IVA
                </label>
                <input
                  type="text"
                  readOnly
                  className="form-control"
                  value={`$${montoFinalConIvaCalculado.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                  style={{
                    fontSize: "14px",
                    height: "38px",
                    backgroundColor: "#f8fafc",
                    fontFamily: "var(--font-mono)",
                    fontWeight: 600,
                    color: "#2B8FCC",
                    cursor: "not-allowed",
                  }}
                />
              </div>

              {/* Footer acciones */}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "8px" }}>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setModalEditarMontosAbierto(false)}
                  disabled={guardandoMontos}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn btn-primary btn-sm"
                  style={{ backgroundColor: "#2B8FCC" }}
                  disabled={guardandoMontos}
                >
                  {guardandoMontos ? "Guardando..." : "Guardar cambios"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Advertencia Ajuste de Horas */}
      {modalAdvertenciaHorasAbierto && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(15, 23, 42, 0.5)",
            backdropFilter: "blur(3px)",
            zIndex: 1110,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
        >
          <div
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "12px",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
              width: "100%",
              maxWidth: "440px",
              overflow: "hidden",
              padding: "24px",
              display: "flex",
              flexDirection: "column",
              gap: "16px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "10px",
                  backgroundColor: "#fef3c7",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <AlertTriangle size={22} style={{ color: "#d97706" }} />
              </div>
              <h3 style={{ fontSize: "16px", fontWeight: 600, color: "#0f172a", margin: 0 }}>
                Cambiaste las horas del servicio
              </h3>
            </div>

            <p style={{ fontSize: "13px", color: "#475569", margin: 0, lineHeight: 1.5 }}>
              El servicio pasa de <strong>{detalle?.i_Cantidad ?? 0} h</strong> a{" "}
              <strong>{formMontoCantidad} h</strong>. Ajusta la fecha y hora de cada sesión para que sumen máximo{" "}
              <strong>{formMontoCantidad} h</strong>.
            </p>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "8px" }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setModalAdvertenciaHorasAbierto(false)}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                style={{ backgroundColor: "#2B8FCC" }}
                onClick={handleContinuarAdvertenciaHoras}
              >
                Continuar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Editar Sesión - Modo Secuencial (Ajuste de Horas) */}
      <ModalEditarInstructorSesion
        abierto={modalSecuencialAbierto}
        sesion={sesionesVigentes[secuencialIndex] || null}
        iCveTipoServicio={detalle?.i_CveTipoServicio}
        bTipoDato={detalle?.b_TipoDato}
        cantidadTotal={parseFloat(formMontoCantidad) || detalle?.i_Cantidad}
        unidad={detalle?.v_Unidad}
        todasLasSesiones={listaSesiones}
        modoSecuencial={true}
        secuencialIndex={secuencialIndex}
        secuencialTotal={sesionesVigentes.length}
        cantidadNuevaHoras={parseFloat(formMontoCantidad) || 0}
        sesionesAjustadasEnMemoria={secuencialSesionesAjustadas}
        onCerrar={() => {
          setModalSecuencialAbierto(false);
        }}
        onSiguienteSecuencial={handleSiguienteSecuencial}
        onTerminarSecuencial={handleTerminarSecuencial}
        onGuardadoExitoso={() => {}}
      />

      {/* Modal Facturas Asociadas (Conflicto 409 CONFIRMAR_FACTURAS) */}
      {modalFacturasAsociadasAbierto && datosFacturasAsociadas && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(15, 23, 42, 0.5)",
            backdropFilter: "blur(3px)",
            zIndex: 1120,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
        >
          <div
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "12px",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
              width: "100%",
              maxWidth: "680px",
              maxHeight: "90vh",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* Header */}
            <div
              style={{
                padding: "16px 20px",
                borderBottom: "1px solid #e2e8f0",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                backgroundColor: "#fef2f2",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <AlertTriangle size={18} style={{ color: "#dc2626" }} />
                <h3 style={{ fontSize: "15px", fontWeight: 600, color: "#991b1b", margin: 0 }}>
                  El servicio tiene {datosFacturasAsociadas.Facturas?.length ?? 0} factura(s) asociada(s)
                </h3>
              </div>
              <button
                type="button"
                onClick={handleCancelarFacturasModal}
                disabled={guardandoMontos}
                style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b" }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Content / Scrollable */}
            <div style={{ padding: "20px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "16px" }}>
              <p style={{ fontSize: "13px", color: "#334155", margin: 0, lineHeight: 1.5 }}>
                Para cambiar los montos se cancelarán <strong>estas facturas y todos sus abonos (pagados y programados)</strong>, con el motivo &quot;Cambio de montos del servicio&quot;. Después habrá que facturar de nuevo con el monto actualizado.
              </p>

              {/* Lista de facturas */}
              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                {datosFacturasAsociadas.Facturas?.map((fac) => {
                  const serviciosFactura = (datosFacturasAsociadas.Servicios || []).filter(
                    (s) => s.i_CveFactura === fac.i_CveFacturas
                  );
                  const abonosFactura = (datosFacturasAsociadas.Abonos || []).filter(
                    (a) => a.i_CveFactura === fac.i_CveFacturas
                  );

                  return (
                    <div
                      key={`fac-${fac.i_CveFacturas}`}
                      style={{
                        backgroundColor: "#f8fafc",
                        border: "1px solid #e2e8f0",
                        borderRadius: "8px",
                        padding: "14px",
                        display: "flex",
                        flexDirection: "column",
                        gap: "12px",
                      }}
                    >
                      {/* 1. Línea principal */}
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          flexWrap: "wrap",
                          gap: "8px",
                          fontSize: "13px",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                          <span style={{ fontWeight: 600, color: "#0f172a" }}>
                            {fac.v_NoFactura || "Sin folio"}
                          </span>
                          <span style={{ color: "#94a3b8" }}>·</span>
                          <span style={{ fontFamily: "var(--font-mono)", fontWeight: 500, color: "#1e293b" }}>
                            ${(fac.d_Monto ?? 0).toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                          {fac.d_FechaHora && (
                            <>
                              <span style={{ color: "#94a3b8" }}>·</span>
                              <span style={{ color: "#64748b" }}>
                                {formatearFechaTexto(fac.d_FechaHora)}
                              </span>
                            </>
                          )}
                          {fac.v_EstadoCobro && (
                            <>
                              <span style={{ color: "#94a3b8" }}>·</span>
                              <span style={{ color: "#475569", fontWeight: 500 }}>
                                {fac.v_EstadoCobro}
                              </span>
                            </>
                          )}
                        </div>

                        {fac.b_Timbrada && (
                          <span
                            style={{
                              fontSize: "11px",
                              fontWeight: 600,
                              padding: "2px 8px",
                              borderRadius: "12px",
                              backgroundColor: "#e0f2fe",
                              color: "#0369a1",
                              border: "1px solid #bae6fd",
                            }}
                          >
                            Timbrada
                          </span>
                        )}
                      </div>

                      {/* 2. Tabla Servicios que cubre esta factura */}
                      <div style={{ borderTop: "1px solid #e2e8f0", paddingTop: "8px" }}>
                        <span style={{ fontSize: "11px", fontWeight: 600, color: "#64748b", display: "block", marginBottom: "6px" }}>
                          Servicios que cubre esta factura:
                        </span>
                        {serviciosFactura.length === 0 ? (
                          <p style={{ fontSize: "12px", color: "#94a3b8", fontStyle: "italic", margin: 0 }}>
                            Sin servicios detallados
                          </p>
                        ) : (
                          <>
                            <div style={{ overflowX: "auto", border: "1px solid #e2e8f0", borderRadius: "6px", backgroundColor: "#ffffff" }}>
                              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px", textAlign: "left" }}>
                                <thead>
                                  <tr style={{ backgroundColor: "#f8fafc", borderBottom: "1px solid #e2e8f0", color: "#64748b" }}>
                                    <th style={{ padding: "6px 10px", fontWeight: 600 }}>Servicio</th>
                                    <th style={{ padding: "6px 10px", fontWeight: 600 }}>Tipo</th>
                                    <th style={{ padding: "6px 10px", fontWeight: 600 }}>Cot. GI</th>
                                    <th style={{ padding: "6px 10px", fontWeight: 600 }}>Cantidad</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {serviciosFactura.map((srv, sIdx) => (
                                    <tr
                                      key={`srv-${srv.i_CveServAgendaDet || sIdx}`}
                                      style={{
                                        borderBottom: sIdx < serviciosFactura.length - 1 ? "1px solid #f1f5f9" : "none",
                                        backgroundColor: srv.b_OtroServicio ? "#fffdf5" : "transparent",
                                      }}
                                    >
                                      <td style={{ padding: "6px 10px", color: "#1e293b", fontWeight: 500 }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                                          <span>{srv.v_Servicio || "—"}</span>
                                          {srv.b_OtroServicio && (
                                            <span
                                              style={{
                                                fontSize: "10px",
                                                fontWeight: 600,
                                                padding: "1px 6px",
                                                borderRadius: "10px",
                                                backgroundColor: "#fef3c7",
                                                color: "#b45309",
                                                border: "1px solid #fde68a",
                                                whiteSpace: "nowrap",
                                              }}
                                            >
                                              Otro servicio
                                            </span>
                                          )}
                                        </div>
                                      </td>
                                      <td style={{ padding: "6px 10px", color: "#475569" }}>
                                        {srv.v_TipoServicio || "—"}
                                      </td>
                                      <td style={{ padding: "6px 10px", color: "#475569", fontFamily: "var(--font-mono)" }}>
                                        {srv.v_NoCotizacionGI || "—"}
                                      </td>
                                      <td style={{ padding: "6px 10px", color: "#1e293b", whiteSpace: "nowrap" }}>
                                        {srv.i_Cantidad} {srv.v_Unidad || ""}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                            {serviciosFactura.some((s) => s.b_OtroServicio) && (
                              <div
                                style={{
                                  marginTop: "6px",
                                  padding: "6px 10px",
                                  backgroundColor: "#fffbeb",
                                  border: "1px solid #fde68a",
                                  borderRadius: "6px",
                                  fontSize: "11px",
                                  color: "#92400e",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "6px",
                                }}
                              >
                                <AlertTriangle size={13} style={{ color: "#d97706", flexShrink: 0 }} />
                                <span>Esta factura también cubre otros servicios; se cancelará también para ellos.</span>
                              </div>
                            )}
                          </>
                        )}
                      </div>

                      {/* 3. Tabla Abonos que se cancelarán */}
                      <div style={{ borderTop: "1px solid #e2e8f0", paddingTop: "8px" }}>
                        <span style={{ fontSize: "11px", fontWeight: 600, color: "#64748b", display: "block", marginBottom: "6px" }}>
                          Abonos que se cancelarán:
                        </span>
                        {abonosFactura.length === 0 ? (
                          <p style={{ fontSize: "12px", color: "#94a3b8", fontStyle: "italic", margin: 0 }}>
                            Sin abonos
                          </p>
                        ) : (
                          <div style={{ overflowX: "auto", border: "1px solid #e2e8f0", borderRadius: "6px", backgroundColor: "#ffffff" }}>
                            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px", textAlign: "left" }}>
                              <thead>
                                <tr style={{ backgroundColor: "#f8fafc", borderBottom: "1px solid #e2e8f0", color: "#64748b" }}>
                                  <th style={{ padding: "6px 10px", fontWeight: 600 }}>Monto</th>
                                  <th style={{ padding: "6px 10px", fontWeight: 600 }}>Fecha programada</th>
                                  <th style={{ padding: "6px 10px", fontWeight: 600 }}>Estado</th>
                                  <th style={{ padding: "6px 10px", fontWeight: 600 }}>Fecha de pago</th>
                                </tr>
                              </thead>
                              <tbody>
                                {abonosFactura.map((abono, aIdx) => (
                                  <tr
                                    key={`abono-${abono.i_CveAbono || aIdx}`}
                                    style={{
                                      borderBottom: aIdx < abonosFactura.length - 1 ? "1px solid #f1f5f9" : "none",
                                    }}
                                  >
                                    <td style={{ padding: "6px 10px", fontFamily: "var(--font-mono)", fontWeight: 500, color: "#0f172a", whiteSpace: "nowrap" }}>
                                      ${(abono.d_Monto ?? 0).toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </td>
                                    <td style={{ padding: "6px 10px", color: "#475569", whiteSpace: "nowrap" }}>
                                      {abono.d_FechaProgramada ? formatearFechaTexto(abono.d_FechaProgramada) : "—"}
                                    </td>
                                    <td style={{ padding: "6px 10px", whiteSpace: "nowrap" }}>
                                      {abono.i_Estado === 1 ? (
                                        <span
                                          style={{
                                            fontSize: "10px",
                                            fontWeight: 600,
                                            padding: "2px 6px",
                                            borderRadius: "10px",
                                            backgroundColor: "#dcfce7",
                                            color: "#15803d",
                                            border: "1px solid #bbf7d0",
                                          }}
                                        >
                                          Pagado
                                        </span>
                                      ) : (
                                        <span
                                          style={{
                                            fontSize: "10px",
                                            fontWeight: 600,
                                            padding: "2px 6px",
                                            borderRadius: "10px",
                                            backgroundColor: "#f1f5f9",
                                            color: "#475569",
                                            border: "1px solid #e2e8f0",
                                          }}
                                        >
                                          Programado
                                        </span>
                                      )}
                                    </td>
                                    <td style={{ padding: "6px 10px", whiteSpace: "nowrap" }}>
                                      {abono.i_Estado === 1 ? (
                                        <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                                          <span style={{ color: "#1e293b" }}>
                                            {abono.d_FechaAbono ? formatearFechaTexto(abono.d_FechaAbono) : "—"}
                                          </span>
                                          <span style={{ fontSize: "10px", color: "#15803d", fontWeight: 500 }}>
                                            Pago ya recibido
                                          </span>
                                        </div>
                                      ) : (
                                        <span style={{ color: "#94a3b8" }}>—</span>
                                      )}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Pregunta final */}
              <div
                style={{
                  padding: "12px 14px",
                  backgroundColor: "#fef2f2",
                  border: "1px solid #fecaca",
                  borderRadius: "8px",
                  marginTop: "4px",
                }}
              >
                <p style={{ fontSize: "13px", fontWeight: 600, color: "#991b1b", margin: 0, textAlign: "center" }}>
                  ¿Desea cancelar todas las facturas asociadas?
                </p>
              </div>
            </div>

            {/* Footer */}
            <div
              style={{
                padding: "14px 20px",
                borderTop: "1px solid #e2e8f0",
                display: "flex",
                justifyContent: "flex-end",
                gap: "10px",
                backgroundColor: "#f8fafc",
              }}
            >
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={handleCancelarFacturasModal}
                disabled={guardandoMontos}
              >
                No
              </button>
              <button
                type="button"
                className="btn btn-sm"
                style={{ backgroundColor: "#dc2626", color: "#ffffff", borderColor: "#dc2626" }}
                onClick={handleConfirmarCancelarFacturas}
                disabled={guardandoMontos}
              >
                {guardandoMontos ? "Cancelando y guardando..." : "Sí, cancelar facturas"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Advertencia de Utilidad (Conflicto 409 CONFIRMAR_UTILIDAD) */}
      {modalUtilidadAbierto && conflictoUtilidad && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(15, 23, 42, 0.5)",
            backdropFilter: "blur(3px)",
            zIndex: 1130,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
        >
          <div
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "12px",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
              width: "100%",
              maxWidth: "460px",
              overflow: "hidden",
              padding: "24px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              textAlign: "center",
            }}
          >
            <div
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "12px",
                backgroundColor: "#fef3c7",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: "14px",
              }}
            >
              <AlertTriangle size={26} style={{ color: "#d97706" }} />
            </div>

            <h3 style={{ fontSize: "16px", fontWeight: 600, color: "#0f172a", margin: "0 0 8px 0" }}>
              Utilidad del servicio
            </h3>

            <p style={{ fontSize: "13px", color: "#475569", margin: "0 0 16px 0", lineHeight: 1.5 }}>
              {conflictoUtilidad.error}
            </p>

            {conflictoUtilidad.d_Utilidad !== null && conflictoUtilidad.d_Utilidad !== undefined && (
              <div
                style={{
                  backgroundColor: "#f8fafc",
                  border: "1px solid #e2e8f0",
                  borderRadius: "8px",
                  padding: "16px",
                  width: "100%",
                  marginBottom: "20px",
                }}
              >
                <span style={{ fontSize: "11px", fontWeight: 500, color: "#64748b", textTransform: "uppercase", display: "block", marginBottom: "4px" }}>
                  Utilidad proyectada (sin IVA)
                </span>
                <p
                  style={{
                    fontSize: "26px",
                    fontWeight: 700,
                    fontFamily: "var(--font-mono)",
                    color: conflictoUtilidad.d_Utilidad < 0 ? "#dc2626" : "#16a34a",
                    margin: 0,
                  }}
                >
                  {conflictoUtilidad.d_Utilidad < 0 ? "-" : ""}$
                  {Math.abs(conflictoUtilidad.d_Utilidad).toLocaleString("es-MX", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </p>
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", width: "100%" }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={handleCancelarUtilidadModal}
                disabled={guardandoMontos}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                style={{ backgroundColor: "#2B8FCC" }}
                onClick={handleConfirmarUtilidad}
                disabled={guardandoMontos}
              >
                {guardandoMontos ? "Guardando..." : "Aceptar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
