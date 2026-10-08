"use client";

import React, { useEffect, useState } from "react";
import {
  X,
  Calendar,
  User,
  Users,
  AlertTriangle,
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
} from "lucide-react";
import { ModalReprogramarSesion } from "./ModalReprogramarSesion";
import { ModalCancelarSesion } from "./ModalCancelarSesion";
import { ModalEditarInstructorSesion } from "./ModalEditarInstructorSesion";
import { ModalProgramarServicio } from "./ModalProgramarServicio";
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
} from "@/types/servicios";
import { AgendaService } from "@/services/agenda.service";
import { AlumnosService } from "@/services/alumnos.service";
import { CatalogosService } from "@/services/catalogos.service";
import { entregables as entregablesCat } from "@/types/catalogos";
import { VerDocumento } from "@/services/archivos.service";
import { formatearFechaCorta, esFechaPasada } from "@/lib/date-utils";
import { useToast } from "@/context/ToastContext";

interface Props {
  abierto: boolean;
  iCveAgenda: number | null;
  iCveServAgendaDet: number | null;
  onCerrar: () => void;
  onGuardadoExitoso?: () => void;
  onProgramar?: (detalle: AgendaDetalleGetDto) => void;
}

const IVA = 0.16;

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

  // Estados locales editables
  const [cotizacionGI, setCotizacionGI] = useState<string>("");
  const [ordenCompra, setOrdenCompra] = useState<string>("");
  const [editandoCotizacion, setEditandoCotizacion] = useState<boolean>(false);
  const [editandoOC, setEditandoOC] = useState<boolean>(false);

  const [facturas, setFacturas] = useState<FacturaDetalleDto[]>([]);
  const [entregables, setEntregables] = useState<EntregableDetalleDto[]>([]);
  const [alumnosInscritos, setAlumnosInscritos] = useState<AlumnoInscrito[]>([]);
  const [cargandoAlumnos, setCargandoAlumnos] = useState<boolean>(false);
  const [errorAlumnos, setErrorAlumnos] = useState<string | null>(null);
  const [descargandoNomina, setDescargandoNomina] = useState<boolean>(false);

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
        toast.success("Proveedor actualizado");
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
      const fArr = data.Facturas || (data as any).facturas || [];
      const eArr = data.Entregables || (data as any).entregables || [];
      setFacturas(Array.isArray(fArr) ? [...fArr] : []);
      setEntregables(Array.isArray(eArr) ? [...eArr] : []);
    }
    setCargando(false);

    // Cargar alumnos inscritos desde el endpoint específico
    cargarAlumnosInscritos(iCveServAgendaDet);
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
      setAlumnosInscritos([]);
      setErrorAlumnos(null);
      setCargandoAlumnos(false);
      setDescargandoNomina(false);
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

  // Obtener arreglo seguro de sesiones
  const listaSesiones: SesionDetalleDto[] = detalle
    ? detalle.Sesiones || (detalle as any).sesiones || (detalle as any).Detalles || (detalle as any).detalles || []
    : [];

  const tieneSesionConInstructorApoyo = listaSesiones.some((s) => {
    const bCanc = Boolean(s.b_Cancelada || (s as any).b_cancelada || (s as any).bCancelada);
    const iCveReprog = s.i_CveReprograma ?? (s as any).i_cveReprograma;
    const esReprog = iCveReprog != null && Number(iCveReprog) > 0;
    const esVig = !bCanc && !esReprog;
    return esVig && s.i_CveApoyo != null && Number(s.i_CveApoyo) > 0 && s.b_TipoProvInsApoyo === false;
  });

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
                        Este servicio está <strong>pendiente de programar</strong> — falta definir fecha, hora e instructor.
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
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
                    <h4 style={{ fontSize: "12px", fontWeight: 500, color: "#64748b", margin: 0 }}>
                      Alumnos inscritos
                    </h4>
                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium border ${getBadgeColorAlumnos()}`}>
                      {inscritos} / {sinLimite ? "∞" : cupos}
                    </span>
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
                            className="alegra-table-container"
                            style={{
                              maxHeight: "260px",
                              overflowY: "auto",
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
                <h4 style={{ fontSize: "12px", fontWeight: 500, color: "#64748b", margin: "0 0 12px 0" }}>
                  Información de montos
                </h4>

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

              {/* BLOQUE 1.4.2 — Información del Proveedor */}
              <div style={{ backgroundColor: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                  <h4 style={{ fontSize: "12px", fontWeight: 500, color: "#64748b", margin: 0 }}>
                    Información del proveedor
                  </h4>
                  {detalle.i_CveProveedor && Number(detalle.i_CveProveedor) > 0 ? (
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
                      title="Editar información del proveedor"
                    >
                      <Edit2 size={12} style={{ color: "#94a3b8" }} />
                      <span>Editar</span>
                    </button>
                  ) : null}
                </div>

                {!detalle.i_CveProveedor || Number(detalle.i_CveProveedor) <= 0 ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px", paddingTop: "4px" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
                      <span style={{ fontSize: "13px", color: "#94a3b8", fontStyle: "italic" }}>
                        Sin proveedor asignado
                      </span>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-primary"
                        onClick={abrirModalProveedor}
                        disabled={tieneSesionConInstructorApoyo}
                        title={
                          tieneSesionConInstructorApoyo
                            ? "Quita el instructor de apoyo de las sesiones para poder agregar un proveedor."
                            : "Agregar proveedor"
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
                        <span>Agregar proveedor</span>
                      </button>
                    </div>
                    {tieneSesionConInstructorApoyo && (
                      <p style={{ fontSize: "12px", color: "#64748b", margin: 0 }}>
                        Quita el instructor de apoyo de las sesiones para poder agregar un proveedor.
                      </p>
                    )}
                  </div>
                ) : (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "16px" }}>
                    <div>
                      <span style={{ fontSize: "11px", fontWeight: 400, color: "#64748b", display: "block", marginBottom: "2px" }}>proveedor</span>
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
                  ? "Editar información del proveedor"
                  : "Agregar proveedor"}
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
                  Proveedor <span style={{ color: "#dc3545" }}>*</span>
                </label>
                <select
                  className="form-select"
                  value={formCveProveedor}
                  onChange={(e) => setFormCveProveedor(e.target.value)}
                  disabled={guardandoProveedor}
                  style={{ fontSize: "13px", height: "38px", borderRadius: "8px" }}
                >
                  <option value="">— Sin proveedor —</option>
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
    </div>
  );
};
