"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  X,
  Calendar,
  Users,
  AlertTriangle,
  CheckCircle2,
  Circle,
  Paperclip,
  ChevronDown,
  ChevronUp,
  Loader2,
  PlayCircle,
  XCircle,
  RefreshCw,
  Clock,
  Upload,
  FileText,
  ExternalLink,
} from "lucide-react";
import { useRouter } from "next/navigation";
import {
  AgendaDetalleConsultorCabeceraDto,
  SesionConsultorDto,
  EntregableConsultorDto,
  AlumnoConsultorDto,
  AvanceConsultorDto,
  HistorialActividad,
} from "@/types/consultor";
import {
  ConsultorService,
  extraerMensajeErrorConsultor,
} from "@/services/consultor.service";
import { ArchivosService, VerDocumento } from "@/services/archivos.service";
import { formatearFechaTexto } from "@/lib/date-utils";
import { useToast } from "@/context/ToastContext";
import { PipcService, extraerMensajeError } from "@/services/pipc.service";
import { PipcResumen } from "@/types/pipc";
import {
  normalizarTexto,
  obtenerEstadoInfo,
  getColorSemaforo,
  diasRestantes,
} from "@/components/pipc/pipcCalculos";
import {
  formatearFechaActividadReal,
  formatearHorarioActividadReal,
  renderEstatusActividadBadge,
} from "@/components/consultor/TablaConsultorSesiones";

const COLOR_VERDE_AVANCE = "#16a34a";
const COLOR_ROJO_ALERTA = "#DC3545";

function obtenerFechasExtremosSesiones(
  sesiones?: Array<{
    d_FechaHoraInicio?: string | null;
    d_FechaHoraFin?: string | null;
    b_Cancelada?: boolean | null;
  }> | null
): { fechaInicio: string | null; fechaFin: string | null } {
  if (!sesiones || sesiones.length === 0) {
    return { fechaInicio: null, fechaFin: null };
  }
  const validas = sesiones.filter(
    (s) => !s.b_Cancelada && !(s as any).b_cancelada
  );
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

interface Props {
  abierto: boolean;
  iCveAgenda: number | null;
  iCveServAgendaDet: number | null;
  onCerrar: () => void;
  onGuardadoExitoso?: () => void;
}

export const ModalDetalleServicioConsultor: React.FC<Props> = ({
  abierto,
  iCveAgenda,
  iCveServAgendaDet,
  onCerrar,
  onGuardadoExitoso,
}) => {
  const router = useRouter();
  const { toast, confirmModal } = useToast();
  const [iniciandoPipc, setIniciandoPipc] = useState<boolean>(false);
  const [cargando, setCargando] = useState<boolean>(true);
  const [errorCarga, setErrorCarga] = useState<string | null>(null);

  const [cabecera, setCabecera] =
    useState<AgendaDetalleConsultorCabeceraDto | null>(null);
  const [sesiones, setSesiones] = useState<SesionConsultorDto[]>([]);
  const [entregables, setEntregables] = useState<EntregableConsultorDto[]>([]);
  const [alumnos, setAlumnos] = useState<AlumnoConsultorDto[]>([]);
  const [avances, setAvances] = useState<AvanceConsultorDto[]>([]);
  const [actividadesProyecto, setActividadesProyecto] = useState<
    HistorialActividad[]
  >([]);
  const [cargandoActividadesProy, setCargandoActividadesProy] =
    useState<boolean>(false);
  const [pipcResumen, setPipcResumen] = useState<PipcResumen | null>(null);

  // §2.2 Estados de Avance del proyecto
  const [sliderPorcentaje, setSliderPorcentaje] = useState<number>(0);
  const [notaAvance, setNotaAvance] = useState<string>("");
  const [guardandoAvance, setGuardandoAvance] = useState<boolean>(false);
  const [acordeonHistorialAvance, setAcordeonHistorialAvance] =
    useState<boolean>(false);

  // §2.3 Estados de entregables (marcar y subir archivo/carta)
  const [entregablesGuardando, setEntregablesGuardando] = useState<Set<number>>(
    new Set()
  );
  const [subiendoTarget, setSubiendoTarget] = useState<{
    i_CveAgendaEntregables: number;
    v_Tipo: "entregable" | "carta_entrega";
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Acordeones
  const [acordeonSesiones, setAcordeonSesiones] = useState<boolean>(true);
  const [acordeonAlumnos, setAcordeonAlumnos] = useState<boolean>(true);
  const [sesionAbiertaIdx, setSesionAbiertaIdx] = useState<number | null>(0);

  const cargarResumenPipc = async (servicioId: number) => {
    try {
      const data = await PipcService.getResumen(servicioId);
      setPipcResumen(data);
    } catch (err: any) {
      if (err?.response?.status !== 404) {
        toast.error(extraerMensajeError(err, "Error al cargar resumen PIPC"));
      }
      setPipcResumen(null);
    }
  };

  const cargarActividadesProyecto = async (servicioId: number) => {
    setCargandoActividadesProy(true);
    try {
      const lista = await ConsultorService.getHistorialActividades({
        iCveServAgendaDet: servicioId,
        incluirSesiones: false,
      });
      setActividadesProyecto(lista);
    } catch (err: any) {
      toast.error(
        extraerMensajeErrorConsultor(
          err,
          "Ocurrió un error al cargar las actividades del proyecto."
        )
      );
      setActividadesProyecto([]);
    } finally {
      setCargandoActividadesProy(false);
    }
  };

  useEffect(() => {
    if (abierto && iCveServAgendaDet) {
      setNotaAvance("");
      setAcordeonHistorialAvance(false);
      cargarDetalle();
      cargarResumenPipc(iCveServAgendaDet);
      cargarActividadesProyecto(iCveServAgendaDet);
    } else {
      setCabecera(null);
      setSesiones([]);
      setEntregables([]);
      setAlumnos([]);
      setAvances([]);
      setActividadesProyecto([]);
      setErrorCarga(null);
      setPipcResumen(null);
      setSliderPorcentaje(0);
      setNotaAvance("");
    }
  }, [abierto, iCveAgenda, iCveServAgendaDet]);

  const cargarDetalle = async () => {
    if (!iCveServAgendaDet) return;
    setCargando(true);
    setErrorCarga(null);
    try {
      const data = await ConsultorService.getDetalle(
        iCveAgenda || 0,
        iCveServAgendaDet
      );
      setCabecera(data.cabecera);
      setSesiones(data.sesiones || []);
      setEntregables(data.entregables || []);
      setAlumnos(data.alumnos || []);
      setAvances(data.avances || []);
      setSliderPorcentaje(data.cabecera.i_PorcentajeAvance ?? 0);
    } catch (err: any) {
      if (err?.response?.status === 403) {
        toast.error("No tienes acceso a este servicio.");
        setErrorCarga("No tienes acceso a este servicio.");
      } else {
        const msg = extraerMensajeErrorConsultor(
          err,
          "Ocurrió un error al cargar el detalle del servicio."
        );
        toast.error(msg);
        setErrorCarga(msg);
      }
    } finally {
      setCargando(false);
    }
  };

  // §2.2 Guardar avance del proyecto
  const handleGuardarAvance = async () => {
    if (!cabecera || guardandoAvance) return;
    const pctBase = cabecera.i_PorcentajeAvance ?? 0;
    const notaTrim = notaAvance.trim();
    if (sliderPorcentaje === pctBase && !notaTrim) return;

    if (notaTrim.length > 500) {
      toast.error("La nota del avance no puede exceder 500 caracteres.");
      return;
    }

    setGuardandoAvance(true);
    try {
      await ConsultorService.guardarAvance({
        i_CveServAgendaDet: cabecera.i_CveServAgendaDet,
        i_Porcentaje: sliderPorcentaje,
        v_Nota: notaTrim ? notaTrim : null,
      });
      toast.success("Avance del proyecto guardado correctamente");
      setNotaAvance("");
      await cargarDetalle();
      onGuardadoExitoso?.();
    } catch (err: any) {
      toast.error(
        extraerMensajeErrorConsultor(err, "No se pudo guardar el avance.")
      );
    } finally {
      setGuardandoAvance(false);
    }
  };

  // §2.3 Subir archivo o carta de entrega
  const handleClickSubir = (
    i_CveAgendaEntregables: number,
    v_Tipo: "entregable" | "carta_entrega"
  ) => {
    setSubiendoTarget({ i_CveAgendaEntregables, v_Tipo });
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !subiendoTarget) return;

    const target = subiendoTarget;
    setEntregablesGuardando((prev) =>
      new Set(prev).add(target.i_CveAgendaEntregables)
    );

    try {
      const res = await ArchivosService.subirArchivo(file, {
        v_Tipo: target.v_Tipo,
        EntregablesSeleccionados: [target.i_CveAgendaEntregables],
      });

      if (res.exito) {
        toast.success(
          target.v_Tipo === "carta_entrega"
            ? "Carta de entrega subida correctamente"
            : "Archivo del entregable subido correctamente"
        );
        await cargarDetalle();
        onGuardadoExitoso?.();
      } else {
        toast.error(res.mensaje || "No se pudo subir el archivo.");
      }
    } catch (err: any) {
      toast.error(
        extraerMensajeErrorConsultor(err, "No se pudo subir el archivo.")
      );
    } finally {
      setEntregablesGuardando((prev) => {
        const next = new Set(prev);
        next.delete(target.i_CveAgendaEntregables);
        return next;
      });
      setSubiendoTarget(null);
      e.target.value = "";
    }
  };

  const handleConfirmarTerminoClick = () => {
    if (!cabecera) return;
    confirmModal({
      title: "¿Confirmas que este servicio ya terminó?",
      message: "Se avisará a administración para facturar.",
      confirmText: "Confirmar",
      cancelText: "Cancelar",
      variant: "primary",
      onConfirm: async () => {
        try {
          const res = await ConsultorService.confirmarTermino(
            cabecera.i_CveServAgendaDet
          );
          if (res.exito) {
            toast.success("Servicio confirmado como terminado");
            await cargarDetalle();
            onGuardadoExitoso?.();
          } else {
            toast.error(res.mensaje || "Error al confirmar terminado");
          }
        } catch (error: any) {
          toast.error(
            extraerMensajeErrorConsultor(error, "Error al confirmar terminado")
          );
        }
      },
    });
  };

  const renderBannerEstatus = () => {
    if (!cabecera) return null;
    if (cabecera.b_SinProgramar && cabecera.i_CveEstatus !== 0) return null;

    const estatus = cabecera.i_CveEstatus ?? 1;
    const { fechaInicio, fechaFin } = obtenerFechasExtremosSesiones(sesiones);
    const fInicioStr = fechaInicio
      ? formatearFechaTexto(fechaInicio)
      : cabecera.d_FechaInicio
      ? formatearFechaTexto(cabecera.d_FechaInicio)
      : "";
    const fFinStr = fechaFin
      ? formatearFechaTexto(fechaFin)
      : cabecera.d_FechaFin
      ? formatearFechaTexto(cabecera.d_FechaFin)
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
      case 6:
        config = {
          bg: "#fff8e1",
          border: "#ffe08a",
          text: "#8a6100",
          icon: PlayCircle,
          texto: `En curso${fFinStr ? ` · Finaliza el ${fFinStr}` : ""}`,
        };
        break;
      case 3: {
        const porQuien = cabecera.v_ConfirmadoPor?.trim();
        config = {
          bg: "#ecfdf3",
          border: "#abefc6",
          text: "#067647",
          icon: CheckCircle2,
          texto: cabecera.d_FechaConfirmacionTermino
            ? `Terminado · Confirmado ${
                porQuien ? `por ${porQuien} ` : ""
              }el ${formatearFechaTexto(cabecera.d_FechaConfirmacionTermino)}`
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
          texto:
            "Por confirmar · Llegó la fecha de finalización estimada. ¿Ya terminó?",
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
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            flex: "1 1 auto",
            minWidth: 0,
          }}
        >
          <IconComp size={16} style={{ color: config.text, flexShrink: 0 }} />
          <span style={{ fontWeight: 500, lineHeight: 1.4 }}>
            {config.texto}
          </span>
        </div>

        {estatus === 3 && (cabecera.i_DiasExcedidos ?? 0) > 0 && (
          <span
            style={{
              color: "#dc2626",
              fontWeight: 600,
              whiteSpace: "nowrap",
              flexShrink: 0,
            }}
          >
            {cabecera.i_DiasExcedidos === 1
              ? "1 día de retraso"
              : `${cabecera.i_DiasExcedidos} días de retraso`}
          </span>
        )}

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

  const handleToggleEntregable = async (ent: EntregableConsultorDto) => {
    const nuevoValor = !ent.b_Entregado;
    const valorAnterior = Boolean(ent.b_Entregado);

    setEntregablesGuardando((prev) =>
      new Set(prev).add(ent.i_CveAgendaEntregables)
    );

    // Optimistic update
    setEntregables((prev) =>
      prev.map((e) =>
        e.i_CveAgendaEntregables === ent.i_CveAgendaEntregables
          ? {
              ...e,
              b_Entregado: nuevoValor,
              f_FechaEntregable: nuevoValor ? new Date().toISOString() : null,
            }
          : e
      )
    );

    try {
      await ConsultorService.marcarEntregable(
        ent.i_CveAgendaEntregables,
        nuevoValor
      );
      toast.success(
        nuevoValor
          ? "Entregable marcado como entregado"
          : "Entregable marcado como pendiente"
      );
      await cargarDetalle();
      onGuardadoExitoso?.();
    } catch (err: any) {
      // Revertir
      setEntregables((prev) =>
        prev.map((e) =>
          e.i_CveAgendaEntregables === ent.i_CveAgendaEntregables
            ? { ...e, b_Entregado: valorAnterior }
            : e
        )
      );

      if (err?.response?.status === 403) {
        toast.error("No tienes acceso a este servicio.");
      } else {
        const msg = extraerMensajeErrorConsultor(
          err,
          "No se pudo actualizar el estado del entregable."
        );
        toast.error(msg);
      }
    } finally {
      setEntregablesGuardando((prev) => {
        const next = new Set(prev);
        next.delete(ent.i_CveAgendaEntregables);
        return next;
      });
    }
  };

  if (!abierto) return null;

  // Lógica de Cupos y Alumnos (2 = Capacitación)
  const esCapacitacion =
    cabecera?.i_CveTipoServicio !== undefined &&
    cabecera?.i_CveTipoServicio !== null
      ? Number(cabecera.i_CveTipoServicio) === 2
      : cabecera?.v_TipoServicio
      ? cabecera.v_TipoServicio.toUpperCase().includes("CAPACITACI")
      : false;

  const cupos = cabecera?.i_NumAlumnos ?? 0;
  const inscritos = alumnos.length;
  const sinLimite = cupos === 0;

  const getBadgeColorAlumnos = () => {
    if (!sinLimite && inscritos >= cupos)
      return "bg-rose-50 text-rose-700 border-rose-200";
    if (inscritos === 0) return "bg-slate-100 text-slate-600 border-slate-200";
    return "bg-emerald-50 text-emerald-700 border-emerald-200";
  };

  const obtenerTextoPersonalSesion = (sesion: SesionConsultorDto): string => {
    const titular = sesion.v_Titular?.trim();
    const esProveedorApoyo = Boolean(sesion.b_TipoProvInsApoyo);
    const apoyo = !esProveedorApoyo ? sesion.v_Apoyo?.trim() : null;

    const personas = [titular, apoyo].filter((p): p is string =>
      Boolean(p && p.trim())
    );
    if (personas.length > 0) {
      return personas.join(", ");
    }
    return esCapacitacion
      ? "Sin personal"
      : esProveedorApoyo
      ? ""
      : "Sin apoyo";
  };

  const renderBadgeSesion = (sesion: SesionConsultorDto) => {
    const bCancelada = Boolean(sesion.b_Cancelada);
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
          Cancelada
        </span>
      );
    }

    const iCveReprograma = sesion.i_CveReprograma;
    if (iCveReprograma != null && Number(iCveReprograma) > 0) {
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

  // Resumen de Pendientes client-side (solo lo aplicable al personal)
  const calcularPendientes = (): string[] => {
    if (!cabecera) return [];
    const p: string[] = [];
    if (cabecera.b_SinProgramar) p.push("Programación");
    if (entregables.some((e) => !e.b_Entregado)) p.push("Entregables");
    if (cabecera.b_AplicaVoBo && !cabecera.v_KeyVoBo) p.push("Visto bueno");
    return p;
  };

  const pendientesList = calcularPendientes();

  // §2.2 Mostrar sección "Avance del proyecto" solo si b_AplicaAvance && !b_TienePlanContingencia
  const mostrarSeccionAvance = Boolean(
    cabecera?.b_AplicaAvance && !cabecera?.b_TienePlanContingencia
  );
  const servicioConfirmado = Boolean(
    cabecera?.d_FechaConfirmacionTermino &&
      cabecera.d_FechaConfirmacionTermino.trim() !== ""
  );
  const deshabilitarGuardarAvance =
    guardandoAvance ||
    (sliderPorcentaje === (cabecera?.i_PorcentajeAvance ?? 0) &&
      notaAvance.trim() === "");

  // §2.3 Entregables habilitados: si b_AplicaAvance && (i_PorcentajeAvance ?? 0) < 100, deshabilitado
  const entregablesDeshabilitadosPorAvance = Boolean(
    cabecera?.b_AplicaAvance && (cabecera?.i_PorcentajeAvance ?? 0) < 100
  );

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
      {/* Input oculto para subir archivo o carta de entrega (§2.3) */}
      <input
        ref={fileInputRef}
        type="file"
        style={{ display: "none" }}
        onChange={handleFileChange}
      />

      <div
        className="modal-content no-scrollbar"
        style={{
          maxWidth: "850px",
          width: "100%",
          maxHeight: "98vh",
          backgroundColor: "#ffffff",
          borderRadius: "16px",
          boxShadow:
            "0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0, 0, 0, 0.05)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          scrollbarWidth: "none",
          msOverflowStyle: "none",
        }}
      >
        {/* Header del Modal */}
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
          <h3
            style={{
              fontSize: "15px",
              fontWeight: 500,
              color: "#0f172a",
              margin: 0,
            }}
          >
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

        {/* Body del Modal con Scroll Interno */}
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
          {cargando || !cabecera ? (
            <div
              style={{
                padding: "48px 0",
                textAlign: "center",
                color: "#64748b",
              }}
            >
              <div
                className="spinner-border text-primary mb-3"
                style={{ width: "24px", height: "24px" }}
              ></div>
              <p style={{ fontSize: "12px", margin: 0 }}>
                Cargando detalle del servicio...
              </p>
            </div>
          ) : errorCarga ? (
            <div
              style={{
                padding: "20px 16px",
                textAlign: "center",
                color: "#b91c1c",
                backgroundColor: "#fef2f2",
                borderRadius: "10px",
                border: "1px solid #fecaca",
              }}
            >
              <p style={{ fontSize: "13px", fontWeight: 500, margin: 0 }}>
                {errorCarga}
              </p>
            </div>
          ) : (
            <>
              {/* BLOQUE 1.1 — Info General + Banner + Notas */}
              <div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "repeat(auto-fit, minmax(160px, 1fr))",
                    gap: "16px",
                  }}
                >
                  <div>
                    <span
                      style={{
                        fontSize: "11px",
                        fontWeight: 400,
                        color: "#64748b",
                        display: "block",
                        marginBottom: "2px",
                      }}
                    >
                      servicio
                    </span>
                    <p
                      style={{
                        fontSize: "13px",
                        fontWeight: 400,
                        color: "#0f172a",
                        margin: 0,
                        lineHeight: 1.3,
                      }}
                    >
                      {cabecera.v_Servicio || "—"}
                    </p>
                    <p
                      style={{
                        fontSize: "12px",
                        fontWeight: 400,
                        color: "#64748b",
                        margin: "2px 0 0 0",
                      }}
                    >
                      {cabecera.i_Cantidad ?? 0} {cabecera.v_Unidad || ""}
                    </p>
                  </div>

                  <div>
                    <span
                      style={{
                        fontSize: "11px",
                        fontWeight: 400,
                        color: "#64748b",
                        display: "block",
                        marginBottom: "2px",
                      }}
                    >
                      tipo
                    </span>
                    <p
                      style={{
                        fontSize: "13px",
                        fontWeight: 400,
                        color: "#0f172a",
                        margin: 0,
                        lineHeight: 1.3,
                      }}
                    >
                      {cabecera.v_TipoServicio || "—"}
                    </p>
                  </div>

                  <div>
                    <span
                      style={{
                        fontSize: "11px",
                        fontWeight: 400,
                        color: "#64748b",
                        display: "block",
                        marginBottom: "2px",
                      }}
                    >
                      empresa
                    </span>
                    <p
                      style={{
                        fontSize: "13px",
                        fontWeight: 400,
                        color: "#0f172a",
                        margin: 0,
                        textTransform: "uppercase",
                        lineHeight: 1.3,
                      }}
                    >
                      {cabecera.v_Empresa || "—"}
                    </p>
                  </div>

                  <div>
                    <span
                      style={{
                        fontSize: "11px",
                        fontWeight: 400,
                        color: "#64748b",
                        display: "block",
                        marginBottom: "2px",
                      }}
                    >
                      planta
                    </span>
                    <p
                      style={{
                        fontSize: "13px",
                        fontWeight: 400,
                        color: "#0f172a",
                        margin: 0,
                        lineHeight: 1.3,
                      }}
                    >
                      {cabecera.v_Planta || "—"}
                    </p>
                  </div>
                </div>

                {renderBannerEstatus()}

                {cabecera.b_SinProgramar && (
                  <div
                    style={{
                      marginTop: "14px",
                      padding: "12px 14px",
                      backgroundColor: "#fffbeb",
                      border: "1px solid #fde68a",
                      borderRadius: "8px",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      fontSize: "12px",
                      color: "#92400e",
                    }}
                  >
                    <AlertTriangle
                      size={16}
                      style={{ color: "#d97706", flexShrink: 0 }}
                    />
                    <span>
                      Este servicio está <strong>pendiente de programar</strong>{" "}
                      — falta definir fecha, hora y personal.
                    </span>
                  </div>
                )}

                {/* Sección Notas del servicio (en solo lectura, solo si hay contenido) */}
                {cabecera.v_Notas && cabecera.v_Notas.trim() !== "" && (
                  <div style={{ marginTop: "16px" }}>
                    <span
                      style={{
                        fontSize: "11px",
                        fontWeight: 400,
                        color: "#64748b",
                        display: "block",
                        marginBottom: "6px",
                      }}
                    >
                      notas
                    </span>
                    <div
                      style={{
                        width: "100%",
                        fontSize: "13px",
                        borderRadius: "8px",
                        border: "1px solid #d0dce8",
                        padding: "8px 12px",
                        backgroundColor: "#f8fafc",
                        color: "#0f172a",
                        whiteSpace: "pre-wrap",
                        lineHeight: 1.5,
                      }}
                    >
                      {cabecera.v_Notas}
                    </div>
                  </div>
                )}
              </div>

              {/* §2.2 SECCIÓN "Avance del proyecto" (entre Notas y Sesiones; solo si b_AplicaAvance && !b_TienePlanContingencia) */}
              {mostrarSeccionAvance && (
                <div
                  style={{
                    backgroundColor: "#f8fafc",
                    border: "1px solid #e2e8f0",
                    borderRadius: "10px",
                    padding: "16px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "12px",
                  }}
                >
                  {/* Título gris + Porcentaje a la derecha */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <h4
                      style={{
                        fontSize: "12px",
                        fontWeight: 500,
                        color: "#64748b",
                        margin: 0,
                      }}
                    >
                      Avance del proyecto
                    </h4>
                    <span
                      style={{
                        fontSize: "14px",
                        fontWeight: 600,
                        color:
                          sliderPorcentaje === 0
                            ? COLOR_ROJO_ALERTA
                            : COLOR_VERDE_AVANCE,
                      }}
                    >
                      {sliderPorcentaje} %
                    </span>
                  </div>

                  {/* Slider de 0 a 100 en pasos de 5 con escala debajo */}
                  <div>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      step={5}
                      disabled={servicioConfirmado || guardandoAvance}
                      value={sliderPorcentaje}
                      onChange={(e) =>
                        setSliderPorcentaje(Number(e.target.value))
                      }
                      style={{
                        width: "100%",
                        accentColor: "#2B8FCC",
                        cursor: servicioConfirmado ? "not-allowed" : "pointer",
                      }}
                    />
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        fontSize: "11px",
                        color: "#64748b",
                        marginTop: "2px",
                      }}
                    >
                      <span>0 %</span>
                      <span>25 %</span>
                      <span>50 %</span>
                      <span>75 %</span>
                      <span>100 %</span>
                    </div>
                  </div>

                  {/* Nota del avance + botón Guardar avance (se oculta botón si d_FechaConfirmacionTermino tiene valor) */}
                  {!servicioConfirmado && (
                    <div>
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
                          nota del avance
                        </span>
                        <button
                          type="button"
                          className="btn btn-sm btn-primary"
                          onClick={handleGuardarAvance}
                          disabled={deshabilitarGuardarAvance}
                          style={{
                            fontSize: "12px",
                            height: "28px",
                            padding: "0 12px",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "6px",
                            backgroundColor: deshabilitarGuardarAvance
                              ? "#e2e8f0"
                              : "#2B8FCC",
                            color: deshabilitarGuardarAvance
                              ? "#94a3b8"
                              : "#ffffff",
                            borderColor: "transparent",
                            cursor: deshabilitarGuardarAvance
                              ? "not-allowed"
                              : "pointer",
                            borderRadius: "6px",
                            fontWeight: 500,
                          }}
                        >
                          {guardandoAvance && (
                            <Loader2 size={13} className="animate-spin" />
                          )}
                          Guardar avance
                        </button>
                      </div>
                      <textarea
                        rows={2}
                        maxLength={500}
                        className="form-control"
                        placeholder="Sin nota del avance"
                        value={notaAvance}
                        onChange={(e) =>
                          setNotaAvance(e.target.value.slice(0, 500))
                        }
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
                  )}

                  {/* Desplegable "Ver historial de avance" */}
                  <div
                    style={{
                      border: "1px solid #e2e8f0",
                      borderRadius: "8px",
                      overflow: "hidden",
                      backgroundColor: "#ffffff",
                    }}
                  >
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
                      onClick={() =>
                        setAcordeonHistorialAvance(!acordeonHistorialAvance)
                      }
                    >
                      <span
                        style={{
                          fontSize: "13px",
                          fontWeight: 500,
                          color: "#334155",
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                        }}
                      >
                        <Clock size={15} style={{ color: "#94a3b8" }} />
                        Ver historial de avance
                      </span>
                      {acordeonHistorialAvance ? (
                        <ChevronUp size={16} style={{ color: "#94a3b8" }} />
                      ) : (
                        <ChevronDown size={16} style={{ color: "#94a3b8" }} />
                      )}
                    </button>

                    {acordeonHistorialAvance && (
                      <div
                        style={{
                          padding: "12px",
                          backgroundColor: "#ffffff",
                          borderTop: "1px solid #e2e8f0",
                          display: "flex",
                          flexDirection: "column",
                          gap: "8px",
                        }}
                      >
                        {avances.length === 0 ? (
                          <p
                            style={{
                              fontSize: "12px",
                              color: "#64748b",
                              margin: 0,
                            }}
                          >
                            Sin registros de avance
                          </p>
                        ) : (
                          avances.map((av, idx) => (
                            <div
                              key={`hist-avance-${av.i_CveAvance || idx}`}
                              style={{
                                minHeight: "38px",
                                padding: "6px 12px",
                                backgroundColor: "#ffffff",
                                border: "1px solid #e2e8f0",
                                borderRadius: "6px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                gap: "12px",
                                flexWrap: "wrap",
                                fontSize: "13px",
                              }}
                            >
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "10px",
                                  flexShrink: 0,
                                  whiteSpace: "nowrap",
                                }}
                              >
                                <span style={{ color: "#475569" }}>
                                  {formatearFechaTexto(av.d_FechaRegistro)}
                                </span>
                                {av.v_Usuario && (
                                  <span
                                    style={{
                                      fontWeight: 500,
                                      color: "#1e293b",
                                    }}
                                  >
                                    {av.v_Usuario}
                                  </span>
                                )}
                                <span
                                  style={{
                                    fontWeight: 700,
                                    color:
                                      av.i_Porcentaje === 0
                                        ? COLOR_ROJO_ALERTA
                                        : COLOR_VERDE_AVANCE,
                                  }}
                                >
                                  {av.i_Porcentaje} %
                                </span>
                              </div>
                              <span
                                style={{
                                  fontSize: "12px",
                                  color: "#64748b",
                                  flex: "1 1 180px",
                                  textAlign: "right",
                                }}
                              >
                                {av.v_Nota || "—"}
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* BLOQUE 1.2 — Sesiones */}
              <div>
                <h4
                  style={{
                    fontSize: "12px",
                    fontWeight: 500,
                    color: "#64748b",
                    margin: "0 0 8px 0",
                  }}
                >
                  Sesiones de la agenda ({sesiones.length})
                </h4>

                <div
                  style={{
                    border: "1px solid #e2e8f0",
                    borderRadius: "8px",
                    overflow: "hidden",
                  }}
                >
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
                    <span
                      style={{
                        fontSize: "13px",
                        fontWeight: 500,
                        color: "#334155",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      <Calendar size={15} style={{ color: "#94a3b8" }} />
                      Ver historial de sesiones
                    </span>
                    {acordeonSesiones ? (
                      <ChevronUp size={16} style={{ color: "#94a3b8" }} />
                    ) : (
                      <ChevronDown size={16} style={{ color: "#94a3b8" }} />
                    )}
                  </button>

                  {acordeonSesiones && (
                    <div
                      style={{
                        padding: "12px",
                        backgroundColor: "#ffffff",
                        borderTop: "1px solid #e2e8f0",
                        display: "flex",
                        flexDirection: "column",
                        gap: "8px",
                      }}
                    >
                      {sesiones.length === 0 ? (
                        <p
                          style={{
                            fontSize: "12px",
                            color: "#64748b",
                            margin: 0,
                          }}
                        >
                          No hay sesiones registradas.
                        </p>
                      ) : (
                        sesiones.map((sesion, sIdx) => {
                          const bCancelada = Boolean(sesion.b_Cancelada);
                          const iCveReprograma = sesion.i_CveReprograma;
                          const esReprogramada =
                            iCveReprograma != null &&
                            Number(iCveReprograma) > 0;

                          const esExpandible =
                            esReprogramada ||
                            (bCancelada && Boolean(sesion.v_MotivoCancelacion));
                          const estaAbierto = sesionAbiertaIdx === sIdx;
                          const sesionNueva = esReprogramada
                            ? sesiones.find(
                                (s) => s.i_CveAgendaDetalle === iCveReprograma
                              )
                            : null;

                          return (
                            <div
                              key={`det-sesion-${
                                sesion.i_CveAgendaDetalle || "det"
                              }-${sIdx}`}
                              style={{
                                border: "1px solid #e2e8f0",
                                borderRadius: "6px",
                                overflow: "hidden",
                              }}
                            >
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
                                    setSesionAbiertaIdx(
                                      estaAbierto ? null : sIdx
                                    );
                                  }
                                }}
                              >
                                <div
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "8px",
                                    flexShrink: 0,
                                    fontSize: "13px",
                                    whiteSpace: "nowrap",
                                  }}
                                >
                                  <span
                                    style={{
                                      fontWeight: 500,
                                      color: "#1e293b",
                                    }}
                                  >
                                    Sesión {sesion.i_Orden || sIdx + 1}
                                  </span>
                                  {cabecera.i_CveTipoServicio === 3 ||
                                  cabecera.i_CveTipoServicio === 6 ? (
                                    <span style={{ color: "#475569" }}>
                                      —{" "}
                                      {formatearFechaTexto(
                                        sesion.d_FechaHoraInicio
                                      )}{" "}
                                      –{" "}
                                      {formatearFechaTexto(
                                        sesion.d_FechaHoraFin
                                      )}
                                    </span>
                                  ) : (
                                    <>
                                      <span style={{ color: "#475569" }}>
                                        —{" "}
                                        {formatearFechaTexto(
                                          sesion.d_FechaHoraInicio
                                        )}
                                      </span>

                                      {cabecera.b_TipoDato &&
                                        sesion.d_FechaHoraInicio && (
                                          <span
                                            style={{
                                              color: "#64748b",
                                              fontFamily: "var(--font-mono)",
                                              fontSize: "12px",
                                            }}
                                          >
                                            (
                                            {new Date(
                                              sesion.d_FechaHoraInicio
                                            ).toLocaleTimeString("en-US", {
                                              hour: "2-digit",
                                              minute: "2-digit",
                                            })}
                                            {sesion.d_FechaHoraFin && (
                                              <>
                                                {" a "}
                                                {new Date(
                                                  sesion.d_FechaHoraFin
                                                ).toLocaleTimeString("en-US", {
                                                  hour: "2-digit",
                                                  minute: "2-digit",
                                                })}
                                              </>
                                            )}
                                            )
                                          </span>
                                        )}
                                    </>
                                  )}
                                </div>

                                <div
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "8px",
                                    flex: 1,
                                    minWidth: 0,
                                    justifyContent: "flex-end",
                                    flexWrap: "nowrap",
                                  }}
                                >
                                  {sesion.v_NombreArea ? (
                                    <span
                                      style={{
                                        fontSize: "11px",
                                        color: "#64748b",
                                        backgroundColor: "#f1f5f9",
                                        padding: "2px 8px",
                                        borderRadius: "10px",
                                        whiteSpace: "nowrap",
                                      }}
                                      title={sesion.v_NombreArea}
                                    >
                                      {sesion.v_NombreArea}
                                    </span>
                                  ) : null}

                                  {obtenerTextoPersonalSesion(sesion) ? (
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
                                      title={obtenerTextoPersonalSesion(sesion)}
                                    >
                                      {obtenerTextoPersonalSesion(sesion)}
                                    </span>
                                  ) : null}

                                  <div
                                    style={{
                                      display: "flex",
                                      alignItems: "center",
                                      gap: "6px",
                                      flexShrink: 0,
                                      whiteSpace: "nowrap",
                                    }}
                                  >
                                    {renderBadgeSesion(sesion)}
                                    {esExpandible &&
                                      (estaAbierto ? (
                                        <ChevronUp
                                          size={14}
                                          style={{ color: "#94a3b8" }}
                                        />
                                      ) : (
                                        <ChevronDown
                                          size={14}
                                          style={{ color: "#94a3b8" }}
                                        />
                                      ))}
                                  </div>
                                </div>
                              </div>

                              {esExpandible && estaAbierto && (
                                <div
                                  style={{
                                    padding: "12px",
                                    backgroundColor: "#f8fafc",
                                    fontSize: "12px",
                                    borderTop: "1px solid #e2e8f0",
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: "6px",
                                  }}
                                >
                                  {esReprogramada && (
                                    <div
                                      style={{
                                        padding: "10px",
                                        backgroundColor: "#fffbeb",
                                        border: "1px solid #fde68a",
                                        borderRadius: "6px",
                                        color: "#92400e",
                                        display: "flex",
                                        flexDirection: "column",
                                        gap: "4px",
                                        fontSize: "11px",
                                      }}
                                    >
                                      <span
                                        style={{
                                          fontWeight: 500,
                                          color: "#b45309",
                                        }}
                                      >
                                        Detalles de Reprogramación:
                                      </span>
                                      {sesion.v_Observaciones && (
                                        <span>
                                          • Motivo: {sesion.v_Observaciones}
                                        </span>
                                      )}
                                      {sesion.v_Contacto && (
                                        <span>
                                          • Solicitado por: {sesion.v_Contacto}
                                        </span>
                                      )}
                                      {sesionNueva && (
                                        <span>
                                          • Nueva Fecha:{" "}
                                          <strong>
                                            {formatearFechaTexto(
                                              sesionNueva.d_FechaHoraInicio
                                            )}
                                          </strong>
                                        </span>
                                      )}
                                    </div>
                                  )}
                                  {bCancelada && sesion.v_MotivoCancelacion && (
                                    <div
                                      style={{
                                        padding: "10px",
                                        backgroundColor: "#fef2f2",
                                        border: "1px solid #fecaca",
                                        borderRadius: "6px",
                                        color: "#991b1b",
                                        display: "flex",
                                        flexDirection: "column",
                                        gap: "4px",
                                        fontSize: "11px",
                                      }}
                                    >
                                      <span
                                        style={{
                                          fontWeight: 500,
                                          color: "#991b1b",
                                        }}
                                      >
                                        Detalles de Cancelación:
                                      </span>
                                      <span>
                                        • Motivo: {sesion.v_MotivoCancelacion}
                                      </span>
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

              {/* §2.4 SECCIÓN NUEVA: "Actividades del proyecto" (después de Sesiones) */}
              <div>
                <h4
                  style={{
                    fontSize: "12px",
                    fontWeight: 500,
                    color: "#64748b",
                    margin: "0 0 8px 0",
                  }}
                >
                  Actividades del proyecto ({actividadesProyecto.length})
                </h4>

                {cargandoActividadesProy ? (
                  <p
                    style={{
                      fontSize: "12px",
                      color: "#64748b",
                      margin: 0,
                    }}
                  >
                    Cargando actividades del proyecto...
                  </p>
                ) : actividadesProyecto.length === 0 ? (
                  <p
                    style={{
                      fontSize: "12px",
                      color: "#64748b",
                      margin: 0,
                    }}
                  >
                    Sin actividades registradas
                  </p>
                ) : (
                  <div
                    className="alegra-table-container"
                    style={{
                      borderRadius: "8px",
                      border: "1px solid #e2e8f0",
                      overflow: "hidden",
                    }}
                  >
                    <table
                      className="alegra-table alegra-table-compact"
                      style={{ width: "100%", margin: 0 }}
                    >
                      <thead>
                        <tr>
                          <th style={{ padding: "8px 12px", fontSize: "12px" }}>
                            Fecha
                          </th>
                          <th style={{ padding: "8px 12px", fontSize: "12px" }}>
                            Horario
                          </th>
                          <th style={{ padding: "8px 12px", fontSize: "12px" }}>
                            Actividad
                          </th>
                          <th style={{ padding: "8px 12px", fontSize: "12px" }}>
                            Estatus
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {actividadesProyecto.map((act, idx) => {
                          const { texto: fechaTxt, esHoy } =
                            formatearFechaActividadReal(act.d_FechaInicio);
                          const { texto: horarioTxt, esTodoElDia } =
                            formatearHorarioActividadReal(act);

                          const esCanceladaOReprogramada =
                            act.i_CveEstatus === 0 || act.i_CveEstatus === 4;

                          // Las filas Inicio y Fin del servicio no repiten el nombre del servicio; solo Inicio / Fin / Inicio y fin
                          const esFilaServicio =
                            act.v_Origen === "SERVICIO" ||
                            act.v_Actividad === "Inicio" ||
                            act.v_Actividad === "Fin" ||
                            act.v_Actividad === "Inicio y fin";

                          const descLimpia =
                            !esFilaServicio && act.v_Descripcion
                              ? act.v_Descripcion.trim()
                              : "";

                          return (
                            <tr
                              key={`act-proy-${act.v_Origen}-${act.v_Momento}-${
                                act.i_CveActividad ?? idx
                              }-${idx}`}
                              style={
                                esHoy && !esCanceladaOReprogramada
                                  ? { backgroundColor: "#eef6fd" }
                                  : undefined
                              }
                            >
                              <td
                                style={{
                                  padding: "7px 12px",
                                  fontSize: "12px",
                                  whiteSpace: "nowrap",
                                  color: esCanceladaOReprogramada
                                    ? "#94a3b8"
                                    : esHoy
                                    ? "#188ae2"
                                    : "#1e3a5f",
                                  fontWeight:
                                    esHoy && !esCanceladaOReprogramada
                                      ? 700
                                      : 400,
                                }}
                              >
                                {fechaTxt}
                              </td>
                              <td
                                style={{
                                  padding: "7px 12px",
                                  fontSize: "12px",
                                  whiteSpace: "nowrap",
                                  color:
                                    esCanceladaOReprogramada || esTodoElDia
                                      ? "#94a3b8"
                                      : "#334155",
                                }}
                              >
                                {horarioTxt}
                              </td>
                              <td
                                style={{
                                  padding: "7px 12px",
                                  fontSize: "12.5px",
                                  whiteSpace: "normal",
                                  wordBreak: "break-word",
                                }}
                              >
                                <div
                                  style={{
                                    color: esCanceladaOReprogramada
                                      ? "#94a3b8"
                                      : "#1e293b",
                                    textDecoration: esCanceladaOReprogramada
                                      ? "line-through"
                                      : "none",
                                    lineHeight: 1.35,
                                  }}
                                >
                                  {descLimpia ? (
                                    <>
                                      <span style={{ fontWeight: 700 }}>
                                        {act.v_Actividad}:
                                      </span>{" "}
                                      <span style={{ fontWeight: 400 }}>
                                        {descLimpia}
                                      </span>
                                    </>
                                  ) : (
                                    <span style={{ fontWeight: 700 }}>
                                      {act.v_Actividad}
                                    </span>
                                  )}
                                </div>
                                {esCanceladaOReprogramada && act.v_Motivo && (
                                  <div
                                    style={{
                                      fontSize: "11px",
                                      color: "#64748b",
                                      marginTop: "2px",
                                    }}
                                  >
                                    Motivo: {act.v_Motivo}
                                  </div>
                                )}
                              </td>
                              <td
                                style={{
                                  padding: "7px 12px",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                {renderEstatusActividadBadge(act.i_CveEstatus)}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* BLOQUE 1.3 — Alumnos Inscritos */}
              {esCapacitacion && (
                <div>
                  <div style={{ marginBottom: "8px" }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        flexWrap: "wrap",
                        gap: "8px",
                      }}
                    >
                      <h4
                        style={{
                          fontSize: "12px",
                          fontWeight: 500,
                          color: "#64748b",
                          margin: 0,
                        }}
                      >
                        Alumnos inscritos
                      </h4>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[11px] font-medium border ${getBadgeColorAlumnos()}`}
                      >
                        {inscritos} / {sinLimite ? "∞" : cupos}
                      </span>
                    </div>
                  </div>

                  <div
                    style={{
                      border: "1px solid #e2e8f0",
                      borderRadius: "8px",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        height: "40px",
                        padding: "0 14px",
                        backgroundColor: "#f8fafc",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}
                    >
                      <button
                        type="button"
                        style={{
                          background: "none",
                          border: "none",
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          fontSize: "13px",
                          fontWeight: 500,
                          color: "#334155",
                          cursor: "pointer",
                          padding: 0,
                        }}
                        onClick={() => setAcordeonAlumnos(!acordeonAlumnos)}
                      >
                        <Users size={15} style={{ color: "#94a3b8" }} />
                        Ver lista de alumnos ({inscritos})
                      </button>

                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                        }}
                      >
                        <button
                          type="button"
                          className="btn-icon"
                          style={{
                            padding: "4px",
                            color: "#94a3b8",
                            cursor: "pointer",
                          }}
                          onClick={() => setAcordeonAlumnos(!acordeonAlumnos)}
                        >
                          {acordeonAlumnos ? (
                            <ChevronUp size={16} />
                          ) : (
                            <ChevronDown size={16} />
                          )}
                        </button>
                      </div>
                    </div>

                    {acordeonAlumnos && (
                      <div
                        style={{
                          padding: "10px 12px",
                          backgroundColor: "#ffffff",
                          borderTop: "1px solid #e2e8f0",
                        }}
                      >
                        {alumnos.length === 0 ? (
                          <p
                            style={{
                              fontSize: "12px",
                              color: "#64748b",
                              margin: 0,
                              padding: "8px 0",
                            }}
                          >
                            No hay alumnos inscritos en este servicio.
                          </p>
                        ) : (
                          <div
                            className={`alegra-table-container ${
                              alumnos.length >= 7 ? "custom-scrollbar" : ""
                            }`}
                            style={{
                              borderRadius: "6px",
                              border: "1px solid #e2e8f0",
                              maxHeight:
                                alumnos.length >= 7 ? "260px" : undefined,
                              overflowY:
                                alumnos.length >= 7 ? "auto" : undefined,
                              scrollbarWidth: "thin",
                              scrollbarColor: "#cbd5e1 transparent",
                            }}
                          >
                            <table
                              className="alegra-table alegra-table-compact"
                              style={{ width: "100%", tableLayout: "fixed" }}
                            >
                              <thead
                                style={{
                                  position:
                                    alumnos.length >= 7 ? "sticky" : undefined,
                                  top: 0,
                                  zIndex: 2,
                                  backgroundColor: "#f8fafc",
                                }}
                              >
                                <tr>
                                  <th
                                    style={{
                                      width: "20%",
                                      padding: "6px 10px",
                                      fontSize: "12px",
                                      backgroundColor: "#f8fafc",
                                    }}
                                  >
                                    Nómina
                                  </th>
                                  <th
                                    style={{
                                      width: "40%",
                                      padding: "6px 10px",
                                      fontSize: "12px",
                                      backgroundColor: "#f8fafc",
                                    }}
                                  >
                                    Nombre
                                  </th>
                                  <th
                                    style={{
                                      width: "20%",
                                      padding: "6px 10px",
                                      fontSize: "12px",
                                      backgroundColor: "#f8fafc",
                                    }}
                                  >
                                    CURP
                                  </th>
                                  <th
                                    style={{
                                      width: "20%",
                                      padding: "6px 10px",
                                      fontSize: "12px",
                                      backgroundColor: "#f8fafc",
                                    }}
                                  >
                                    Puesto
                                  </th>
                                </tr>
                              </thead>
                              <tbody>
                                {alumnos.map((alumno) => (
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
                                      title={
                                        alumno.v_Nombre ||
                                        "Sin registro en el catálogo"
                                      }
                                    >
                                      {alumno.v_Nombre ? (
                                        <span
                                          style={{
                                            fontWeight: 500,
                                            color: "#1e293b",
                                            textTransform: "uppercase",
                                          }}
                                        >
                                          {alumno.v_Nombre}
                                        </span>
                                      ) : (
                                        <span
                                          style={{
                                            color: "#94a3b8",
                                            fontStyle: "italic",
                                            fontSize: "11px",
                                          }}
                                        >
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
                                      title={alumno.v_CURP || ""}
                                    >
                                      {alumno.v_CURP ? (
                                        <span className="text-secondary text-xs">
                                          {alumno.v_CURP}
                                        </span>
                                      ) : (
                                        <span style={{ color: "#cbd5e1" }}>
                                          —
                                        </span>
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
                                      title={alumno.v_Puesto || ""}
                                    >
                                      {alumno.v_Puesto ? (
                                        alumno.v_Puesto
                                      ) : (
                                        <span style={{ color: "#cbd5e1" }}>
                                          —
                                        </span>
                                      )}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* §2.3 BLOQUE 1.6 — Checklist de entregables: entregable + carta */}
              <div>
                <div style={{ marginBottom: "8px" }}>
                  <h4
                    style={{
                      fontSize: "12px",
                      fontWeight: 500,
                      color: "#64748b",
                      margin: 0,
                    }}
                  >
                    Checklist de entregables
                  </h4>
                  {entregablesDeshabilitadosPorAvance && (
                    <p
                      style={{
                        fontSize: "11px",
                        color: "#94a3b8",
                        margin: "2px 0 0 0",
                        fontWeight: 400,
                      }}
                    >
                      Disponible al llegar al 100 % de avance
                    </p>
                  )}
                </div>

                {entregables.length === 0 ? (
                  <p
                    style={{
                      fontSize: "12px",
                      color: "#64748b",
                      margin: 0,
                    }}
                  >
                    No hay entregables configurados para este servicio.
                  </p>
                ) : (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "10px",
                    }}
                  >
                    {entregables.map((ent) => {
                      const keyArchivo =
                        ent.v_Key ||
                        (ent.i_CveArchivo ? String(ent.i_CveArchivo) : null);
                      const keyCarta =
                        ent.v_KeyCarta ||
                        (ent.i_CveArchivoCarta
                          ? String(ent.i_CveArchivoCarta)
                          : null);
                      const estaGuardando = entregablesGuardando.has(
                        ent.i_CveAgendaEntregables
                      );
                      const deshabilitado =
                        entregablesDeshabilitadosPorAvance || estaGuardando;
                      const tooltipDeshabilitado =
                        entregablesDeshabilitadosPorAvance
                          ? "Disponible al llegar al 100 % de avance"
                          : undefined;
                      const esPlanContingenciaPipc =
                        normalizarTexto(ent.v_Nombre).startsWith(
                          "PLAN DE CONTINGENCIA"
                        ) && pipcResumen?.b_TienePlanContingencia === true;

                      const btnOutlineStyle: React.CSSProperties = {
                        height: "36px",
                        padding: "0 12px",
                        fontSize: "12.5px",
                        fontWeight: 500,
                        borderRadius: "8px",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        border: deshabilitado
                          ? "1px solid #e2e8f0"
                          : "1px solid #cbd5e1",
                        backgroundColor: deshabilitado ? "#f8fafc" : "#ffffff",
                        color: deshabilitado ? "#94a3b8" : "#334155",
                        cursor: deshabilitado ? "not-allowed" : "pointer",
                        whiteSpace: "nowrap",
                        transition: "all 0.15s ease",
                      };

                      return (
                        <div
                          key={`ent-${ent.i_CveAgendaEntregables}`}
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "12px",
                            padding: "14px 16px",
                            backgroundColor: "#ffffff",
                            border: "1px solid #e2e8f0",
                            borderRadius: "10px",
                            fontSize: "13px",
                            transition: "all 0.2s ease",
                          }}
                        >
                          {/* 1. Encabezado */}
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              gap: "12px",
                              flexWrap: "wrap",
                            }}
                          >
                            {/* Izquierda: Círculo + Nombre + Badge de estado */}
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "10px",
                                flexWrap: "wrap",
                                minWidth: 0,
                              }}
                            >
                              <div
                                style={{
                                  width: "16px",
                                  height: "16px",
                                  display: "inline-flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  flexShrink: 0,
                                }}
                              >
                                {estaGuardando ? (
                                  <Loader2
                                    size={16}
                                    className="animate-spin text-sky-600"
                                  />
                                ) : ent.b_Entregado ? (
                                  <CheckCircle2
                                    size={16}
                                    style={{
                                      color: entregablesDeshabilitadosPorAvance
                                        ? "#94a3b8"
                                        : "#10b981",
                                    }}
                                  />
                                ) : (
                                  <Circle
                                    size={16}
                                    style={{ color: "#cbd5e1" }}
                                  />
                                )}
                              </div>

                              <span
                                style={{
                                  fontSize: "15px",
                                  fontWeight: 600,
                                  color: "#1e293b",
                                  lineHeight: 1.25,
                                }}
                              >
                                {ent.v_Nombre}
                              </span>

                              {ent.b_Entregado ? (
                                <span
                                  title={
                                    ent.f_FechaEntregable
                                      ? `Entregado el ${formatearFechaTexto(
                                          ent.f_FechaEntregable
                                        )}`
                                      : undefined
                                  }
                                  style={{
                                    fontSize: "12px",
                                    fontWeight: 600,
                                    padding: "2px 10px",
                                    borderRadius: "10px",
                                    backgroundColor: "#dcfce7",
                                    color: "#15803d",
                                    lineHeight: 1.25,
                                    whiteSpace: "nowrap",
                                  }}
                                >
                                  Entregado
                                </span>
                              ) : (
                                <span
                                  style={{
                                    fontSize: "12px",
                                    fontWeight: 600,
                                    padding: "2px 10px",
                                    borderRadius: "10px",
                                    backgroundColor: "#fde8e6",
                                    color: "#b91c1c",
                                    lineHeight: 1.25,
                                    whiteSpace: "nowrap",
                                  }}
                                >
                                  Pendiente
                                </span>
                              )}
                            </div>

                            {/* Derecha: 3 botones en fila (gap: 8px, alto: 36px, estilo outline) */}
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                                flexWrap: "wrap",
                              }}
                            >
                              {/* 1. Entregable */}
                              <span
                                title={tooltipDeshabilitado}
                                style={{ display: "inline-flex" }}
                              >
                                <button
                                  type="button"
                                  disabled={deshabilitado}
                                  title={tooltipDeshabilitado}
                                  onClick={() =>
                                    handleClickSubir(
                                      ent.i_CveAgendaEntregables,
                                      "entregable"
                                    )
                                  }
                                  style={btnOutlineStyle}
                                >
                                  <Upload size={14} />
                                  <span>Entregable</span>
                                </button>
                              </span>

                              {/* 2. Carta */}
                              <span
                                title={tooltipDeshabilitado}
                                style={{ display: "inline-flex" }}
                              >
                                <button
                                  type="button"
                                  disabled={deshabilitado}
                                  title={tooltipDeshabilitado}
                                  onClick={() =>
                                    handleClickSubir(
                                      ent.i_CveAgendaEntregables,
                                      "carta_entrega"
                                    )
                                  }
                                  style={btnOutlineStyle}
                                >
                                  <Upload size={14} />
                                  <span>Carta</span>
                                </button>
                              </span>

                              {/* 3. Marcar entregado */}
                              <span
                                title={tooltipDeshabilitado}
                                style={{ display: "inline-flex" }}
                              >
                                <button
                                  type="button"
                                  disabled={deshabilitado}
                                  title={tooltipDeshabilitado}
                                  onClick={() => handleToggleEntregable(ent)}
                                  style={{
                                    ...btnOutlineStyle,
                                    ...(ent.b_Entregado && !deshabilitado
                                      ? {
                                          backgroundColor: "#f0fdf4",
                                          border: "1px solid #86efac",
                                          color: "#15803d",
                                        }
                                      : {}),
                                  }}
                                >
                                  <CheckCircle2 size={14} />
                                  <span>
                                    {ent.b_Entregado
                                      ? "Entregado"
                                      : "Marcar entregado"}
                                  </span>
                                </button>
                              </span>
                            </div>
                          </div>

                          {/* 2. Archivos (alineada con el texto del nombre: paddingLeft = 16px + 10px = 26px) */}
                          <div
                            style={{
                              paddingLeft: "26px",
                              display: "flex",
                              alignItems: "center",
                              gap: "16px",
                              flexWrap: "wrap",
                              fontSize: "12px",
                              color: "#64748b",
                              lineHeight: 1.35,
                            }}
                          >
                            <span
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "5px",
                              }}
                            >
                              <FileText
                                size={14}
                                style={{ color: "#94a3b8", flexShrink: 0 }}
                              />
                              <span>
                                Entregable:{" "}
                                {keyArchivo ? (
                                  <button
                                    type="button"
                                    onClick={() => VerDocumento(keyArchivo)}
                                    style={{
                                      background: "none",
                                      border: "none",
                                      padding: 0,
                                      color: "#2B8FCC",
                                      textDecoration: "underline",
                                      cursor: "pointer",
                                      fontSize: "12px",
                                      fontWeight: 500,
                                    }}
                                  >
                                    ver
                                  </button>
                                ) : (
                                  "sin archivo"
                                )}
                              </span>
                            </span>

                            <span
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "5px",
                              }}
                            >
                              <FileText
                                size={14}
                                style={{ color: "#94a3b8", flexShrink: 0 }}
                              />
                              <span>
                                Carta de entrega:{" "}
                                {keyCarta ? (
                                  <button
                                    type="button"
                                    onClick={() => VerDocumento(keyCarta)}
                                    style={{
                                      background: "none",
                                      border: "none",
                                      padding: 0,
                                      color: "#2B8FCC",
                                      textDecoration: "underline",
                                      cursor: "pointer",
                                      fontSize: "12px",
                                      fontWeight: 500,
                                    }}
                                  >
                                    ver
                                  </button>
                                ) : (
                                  "sin archivo"
                                )}
                              </span>
                            </span>
                          </div>

                          {/* 3. Bloque PIPC (solo si el entregable es Plan de contingencia) */}
                          {esPlanContingenciaPipc &&
                            pipcResumen &&
                            iCveServAgendaDet &&
                            (() => {
                              const estadoInfo = obtenerEstadoInfo(
                                pipcResumen.v_Estado || "en_captura"
                              );
                              const estaIniciado =
                                pipcResumen.i_CvePipcExpediente !== null;
                              const esCancelado = Boolean(
                                pipcResumen.b_Cancelado
                              );
                              const avancePipc = pipcResumen.i_Avance ?? 0;
                              const colorBarraPipc = estaIniciado
                                ? getColorSemaforo(avancePipc)
                                : "#cbd5e1";
                              const pendientesCriticosCount =
                                pipcResumen.i_PendientesAlta ?? 0;

                              const fechaFinPipc =
                                obtenerFechasExtremosSesiones(sesiones)
                                  .fechaFin || pipcResumen.d_FechaFin;
                              const dias = diasRestantes(fechaFinPipc);
                              let textoDias = "";
                              let colorDias = "#64748b";
                              let pesoDias: number = 400;

                              if (dias !== null) {
                                if (dias > 1) {
                                  textoDias = `${dias} días restantes`;
                                } else if (dias === 1) {
                                  textoDias = "1 día restante";
                                } else if (dias === 0) {
                                  textoDias = "Vence hoy";
                                  colorDias = "#B9770E";
                                  pesoDias = 600;
                                } else {
                                  const n = Math.abs(dias);
                                  textoDias =
                                    n === 1
                                      ? "Vencido hace 1 día"
                                      : `Vencido hace ${n} días`;
                                  colorDias = "#DC3545";
                                  pesoDias = 600;
                                }
                              }

                              const handleNavegarPipc = (
                                e: React.MouseEvent
                              ) => {
                                e.stopPropagation();
                                if (typeof window !== "undefined") {
                                  sessionStorage.setItem(
                                    "pipc_origen_mis_servicios",
                                    "1"
                                  );
                                }
                                router.push(
                                  `/mis-servicios/pipc/${iCveServAgendaDet}`
                                );
                              };

                              const handleIniciarPipc = async (
                                e: React.MouseEvent
                              ) => {
                                e.stopPropagation();
                                setIniciandoPipc(true);
                                try {
                                  await PipcService.iniciarChecklist(
                                    iCveServAgendaDet
                                  );
                                  if (typeof window !== "undefined") {
                                    sessionStorage.setItem(
                                      "pipc_origen_mis_servicios",
                                      "1"
                                    );
                                  }
                                  router.push(
                                    `/mis-servicios/pipc/${iCveServAgendaDet}`
                                  );
                                } catch (err: any) {
                                  toast.error(
                                    extraerMensajeError(
                                      err,
                                      "No se pudo iniciar el checklist PIPC"
                                    )
                                  );
                                  setIniciandoPipc(false);
                                }
                              };

                              return (
                                <div
                                  style={{
                                    borderTop: "1px solid #f1f5f9",
                                    paddingTop: "12px",
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: "8px",
                                  }}
                                >
                                  {/* Fila título */}
                                  <div
                                    style={{
                                      display: "flex",
                                      justifyContent: "space-between",
                                      alignItems: "center",
                                      gap: "8px",
                                    }}
                                  >
                                    <span
                                      style={{
                                        fontSize: "11px",
                                        fontWeight: 600,
                                        textTransform: "uppercase",
                                        letterSpacing: "0.5px",
                                        color: "#64748b",
                                      }}
                                    >
                                      CHECKLIST PIPC
                                    </span>

                                    {esCancelado ? (
                                      estaIniciado ? (
                                        <button
                                          type="button"
                                          onClick={handleNavegarPipc}
                                          style={{
                                            height: "32px",
                                            padding: "0 12px",
                                            fontSize: "12px",
                                            fontWeight: 500,
                                            borderRadius: "8px",
                                            border: "1px solid #cbd5e1",
                                            backgroundColor: "#ffffff",
                                            color: "#334155",
                                            display: "inline-flex",
                                            alignItems: "center",
                                            gap: "6px",
                                            cursor: "pointer",
                                            whiteSpace: "nowrap",
                                          }}
                                        >
                                          <ExternalLink size={13} />
                                          <span>Ver checklist</span>
                                        </button>
                                      ) : null
                                    ) : !estaIniciado ? (
                                      <button
                                        type="button"
                                        onClick={handleIniciarPipc}
                                        disabled={iniciandoPipc}
                                        style={{
                                          height: "32px",
                                          padding: "0 12px",
                                          fontSize: "12px",
                                          fontWeight: 500,
                                          borderRadius: "8px",
                                          border: "1px solid #cbd5e1",
                                          backgroundColor: "#ffffff",
                                          color: "#334155",
                                          display: "inline-flex",
                                          alignItems: "center",
                                          gap: "6px",
                                          cursor: iniciandoPipc
                                            ? "not-allowed"
                                            : "pointer",
                                          whiteSpace: "nowrap",
                                        }}
                                      >
                                        <ExternalLink size={13} />
                                        <span>
                                          {iniciandoPipc
                                            ? "Iniciando…"
                                            : "Iniciar checklist"}
                                        </span>
                                      </button>
                                    ) : (
                                      <button
                                        type="button"
                                        onClick={handleNavegarPipc}
                                        style={{
                                          height: "32px",
                                          padding: "0 12px",
                                          fontSize: "12px",
                                          fontWeight: 500,
                                          borderRadius: "8px",
                                          border: "1px solid #cbd5e1",
                                          backgroundColor: "#ffffff",
                                          color: "#334155",
                                          display: "inline-flex",
                                          alignItems: "center",
                                          gap: "6px",
                                          cursor: "pointer",
                                          whiteSpace: "nowrap",
                                        }}
                                      >
                                        <ExternalLink size={13} />
                                        <span>Ir al checklist</span>
                                      </button>
                                    )}
                                  </div>

                                  {/* Barra de ancho completo + porcentaje en texto */}
                                  <div
                                    style={{
                                      display: "flex",
                                      alignItems: "center",
                                      gap: "10px",
                                      width: "100%",
                                    }}
                                  >
                                    <div
                                      style={{
                                        flex: 1,
                                        height: "8px",
                                        backgroundColor: "#f1f5f9",
                                        borderRadius: "4px",
                                        overflow: "hidden",
                                      }}
                                    >
                                      <div
                                        style={{
                                          width: estaIniciado
                                            ? `${avancePipc}%`
                                            : "0%",
                                          height: "100%",
                                          backgroundColor: colorBarraPipc,
                                          borderRadius: "4px",
                                          transition: "width 0.3s ease",
                                        }}
                                      />
                                    </div>
                                    <span
                                      style={{
                                        fontSize: "13px",
                                        fontWeight: 700,
                                        color: estaIniciado
                                          ? colorBarraPipc
                                          : "#64748b",
                                        whiteSpace: "nowrap",
                                      }}
                                    >
                                      {estaIniciado
                                        ? `${avancePipc} %`
                                        : "Sin iniciar"}
                                    </span>
                                  </div>

                                  {/* Fila de estado */}
                                  <div
                                    style={{
                                      display: "flex",
                                      alignItems: "center",
                                      gap: "8px",
                                      flexWrap: "wrap",
                                      fontSize: "12px",
                                      lineHeight: 1.3,
                                    }}
                                  >
                                    {estaIniciado && (
                                      <span
                                        className={`badge ${estadoInfo.badgeClass}`}
                                        style={{
                                          fontSize: "11px",
                                          fontWeight: 600,
                                          padding: "3px 8px",
                                          borderRadius: "12px",
                                          lineHeight: 1.2,
                                          whiteSpace: "nowrap",
                                        }}
                                      >
                                        {estadoInfo.texto}
                                      </span>
                                    )}

                                    {esCancelado && !estaIniciado ? (
                                      <span style={{ color: "#64748b" }}>
                                        El servicio está cancelado
                                      </span>
                                    ) : !estaIniciado ? (
                                      <span style={{ color: "#64748b" }}>
                                        El checklist aún no se ha iniciado
                                      </span>
                                    ) : (
                                      <>
                                        {pendientesCriticosCount > 0 ? (
                                          <span
                                            style={{
                                              color: "#dc2626",
                                              fontWeight: 600,
                                            }}
                                          >
                                            {pendientesCriticosCount}{" "}
                                            {pendientesCriticosCount === 1
                                              ? "pendiente crítico"
                                              : "pendientes críticos"}
                                          </span>
                                        ) : (
                                          <span
                                            style={{
                                              color: "#16a34a",
                                              fontWeight: 600,
                                            }}
                                          >
                                            Sin pendientes críticos
                                          </span>
                                        )}
                                        {textoDias && (
                                          <>
                                            <span style={{ color: "#cbd5e1" }}>
                                              ·
                                            </span>
                                            <span
                                              style={{
                                                color: colorDias,
                                                fontWeight: pesoDias,
                                              }}
                                            >
                                              {textoDias}
                                            </span>
                                          </>
                                        )}
                                      </>
                                    )}
                                  </div>
                                </div>
                              );
                            })()}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Card: Visto bueno de la autoridad (solo si b_AplicaVoBo === true) */}
              {cabecera.b_AplicaVoBo && (
                <div>
                  <h4
                    style={{
                      fontSize: "12px",
                      fontWeight: 500,
                      color: "#64748b",
                      margin: "0 0 8px 0",
                    }}
                  >
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
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      {cabecera.v_KeyVoBo ? (
                        <CheckCircle2
                          size={14}
                          style={{ color: "#10b981", flexShrink: 0 }}
                        />
                      ) : (
                        <Circle
                          size={14}
                          style={{ color: "#cbd5e1", flexShrink: 0 }}
                        />
                      )}
                      <div
                        style={{ display: "flex", flexDirection: "column" }}
                      >
                        <span style={{ fontWeight: 400, color: "#1e293b" }}>
                          Visto bueno de la autoridad
                        </span>
                        {cabecera.v_KeyVoBo ? (
                          <span
                            style={{
                              fontSize: "11px",
                              color: "#10b981",
                              fontWeight: 500,
                            }}
                          >
                            Entregado el{" "}
                            {formatearFechaTexto(cabecera.d_FechaVoBo)}
                          </span>
                        ) : (
                          <span
                            style={{
                              fontSize: "11px",
                              color: "#dc3545",
                              fontWeight: 500,
                            }}
                          >
                            Pendiente
                          </span>
                        )}
                      </div>
                    </div>

                    {cabecera.v_KeyVoBo && (
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
                        onClick={() => VerDocumento(cabecera.v_KeyVoBo!)}
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
                  <AlertTriangle
                    size={16}
                    style={{ color: "#d97706", flexShrink: 0 }}
                  />
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
                  <CheckCircle2
                    size={16}
                    style={{ color: "#10b981", flexShrink: 0 }}
                  />
                  <span>
                    <strong>Todo completado:</strong> El servicio no tiene
                    pendientes registrados.
                  </span>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer del Modal Sticky */}
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
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onCerrar}
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
