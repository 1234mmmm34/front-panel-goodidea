"use client";

import React, { useEffect, useState, useMemo } from "react";
import { createPortal } from "react-dom";
import {
  X,
  Calendar,
  Clock,
  User,
  Users,
  MapPin,
  FileText,
  DollarSign,
  AlertTriangle,
  Loader2,
  CheckCircle2,
  RefreshCw,
  Check,
} from "lucide-react";
import {
  AgendaDetalleGetDto,
  InstructorGetDto,
  ProveedorGetDto,
  AreaGetDto,
  RangoFechaDto,
  ReprogramacionInsertDto,
} from "@/types/servicios";
import { ContactoXEmpresa } from "@/types/empresas";
import { AgendaService } from "@/services/agenda.service";
import { EmpresasService } from "@/services/empresas.service";
import { useToast } from "@/context/ToastContext";
import { esFechaPasada } from "@/lib/date-utils";

interface ModalReprogramarSesionProps {
  abierto: boolean;
  onCerrar: () => void;
  iCveAgenda: number | null;
  iCveServAgendaDet: number | null;
  iCveAgendaDetalle: number | null;
  onReprogramacionExitosa?: () => void;
}

const MESES_ABREV = [
  "Ene", "Feb", "Mar", "Abr", "May", "Jun",
  "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"
];

function formatearFechaTexto(fechaIso: string | null | undefined): string {
  if (!fechaIso) return "Pendiente";
  const str = fechaIso.split("T")[0];
  const parts = str.split("-");
  if (parts.length !== 3) return fechaIso;
  const year = parts[0];
  const monthIdx = parseInt(parts[1], 10) - 1;
  const day = parts[2].padStart(2, "0");
  if (monthIdx >= 0 && monthIdx < 12) {
    return `${day}/${MESES_ABREV[monthIdx].toUpperCase()}./${year}`;
  }
  return fechaIso;
}

function formatearHoraTexto(fechaIso: string | null | undefined): string {
  if (!fechaIso || !fechaIso.includes("T")) return "";
  const timePart = fechaIso.split("T")[1];
  if (!timePart) return "";
  return timePart.substring(0, 5);
}

function calcularDuracionMinutos(inicioIso?: string, finIso?: string): number {
  if (!inicioIso || !finIso) return 120; // 2 horas por defecto
  try {
    const d1 = new Date(inicioIso);
    const d2 = new Date(finIso);
    const diffMs = d2.getTime() - d1.getTime();
    const diffMins = Math.round(diffMs / (1000 * 60));
    return diffMins > 0 ? diffMins : 120;
  } catch {
    return 120;
  }
}

export const ModalReprogramarSesion: React.FC<ModalReprogramarSesionProps> = ({
  abierto,
  onCerrar,
  iCveAgenda,
  iCveServAgendaDet,
  iCveAgendaDetalle,
  onReprogramacionExitosa,
}) => {
  const { toast } = useToast();
  const [mounted, setMounted] = useState<boolean>(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Paso del wizard (1: Sesión original, 2: Nueva sesión, 3: Datos administrativos)
  const [pasoActual, setPasoActual] = useState<number>(1);

  const [cargandoInicial, setCargandoInicial] = useState<boolean>(false);
  const [guardando, setGuardando] = useState<boolean>(false);

  // Datos de la sesión original
  const [detalleAgenda, setDetalleAgenda] = useState<AgendaDetalleGetDto | null>(null);
  const [sesionOriginal, setSesionOriginal] = useState<any | null>(null);

  // Catálogos precargados
  const [instructores, setInstructores] = useState<InstructorGetDto[]>([]);
  const [proveedores, setProveedores] = useState<ProveedorGetDto[]>([]);
  const [contactos, setContactos] = useState<ContactoXEmpresa[]>([]);
  const [areas, setAreas] = useState<AreaGetDto[]>([]);

  // Paso 2: Formulario reprogramación
  const [nuevaFecha, setNuevaFecha] = useState<string>("");
  const [nuevaHoraInicio, setNuevaHoraInicio] = useState<string>("09:00");
  
  const [cambiaInstructor, setCambiaInstructor] = useState<boolean>(false);
  const [nuevoInstructorId, setNuevoInstructorId] = useState<string>("");
  
  const [cambiaProveedor, setCambiaProveedor] = useState<boolean>(false);
  const [nuevoApoyoValue, setNuevoApoyoValue] = useState<string>(""); // e.g. "INS_12" or "PROV_34"
  const [nuevoPrecioProveedor, setNuevoPrecioProveedor] = useState<string>("");

  const [areaId, setAreaId] = useState<string>("");

  // Paso 3: Motivo y Contacto
  const [motivoElegido, setMotivoElegido] = useState<string>("");
  const [observacionesText, setObservacionesText] = useState<string>("");
  const [contactoReprogramaId, setContactoReprogramaId] = useState<string>("");

  // Horas ocupadas del instructor seleccionado
  const [horasOcupadasInstructor, setHorasOcupadasInstructor] = useState<RangoFechaDto[]>([]);
  const [buscandoHorasOcupadas, setBuscandoHorasOcupadas] = useState<boolean>(false);

  // Carga inicial al abrir
  useEffect(() => {
    if (abierto && (iCveAgenda || iCveServAgendaDet || iCveAgendaDetalle)) {
      setPasoActual(1);
      setCargandoInicial(true);
      setCambiaInstructor(false);
      setNuevoInstructorId("");
      setCambiaProveedor(false);
      setNuevoApoyoValue("");
      setNuevoPrecioProveedor("");
      setAreaId("");
      setMotivoElegido("");
      setObservacionesText("");
      setContactoReprogramaId("");
      setHorasOcupadasInstructor([]);

      const agendaIdToUse = iCveAgenda || 0;
      const servDetIdToUse = iCveServAgendaDet || 0;

      // 1.1 GET agenda/GetAgendaDetalle
      AgendaService.getAgendaDetalle(agendaIdToUse, servDetIdToUse).then(async (data) => {
        setDetalleAgenda(data);
        if (data) {
          const sesiones = (data as any).Sesiones || (data as any).sesiones || (data as any).Detalles || (data as any).detalles || [];
          const encontrada = sesiones.find(
            (s: any) => Number(s.i_CveAgendaDetalle ?? s.i_cveAgendaDetalle ?? s.iCveAgendaDetalle) === Number(iCveAgendaDetalle)
          ) || sesiones[0] || data;

          setSesionOriginal(encontrada);

          // Precargar fecha y hora inicial si existen
          const fechaIni = encontrada?.d_FechaHoraInicio || encontrada?.f_FechaHoraInicio || encontrada?.FechaHoraInicio;
          if (fechaIni) {
            setNuevaFecha(fechaIni.split("T")[0]);
            const horaStr = formatearHoraTexto(fechaIni);
            if (horaStr) setNuevaHoraInicio(horaStr);
          } else {
            setNuevaFecha(new Date().toISOString().split("T")[0]);
          }

          // Extraer ID de la Empresa defensivamente
          let empId =
            encontrada?.i_CveEmpresa ??
            encontrada?.iCveEmpresa ??
            encontrada?.I_CveEmpresa ??
            encontrada?.iD_Empresa ??
            encontrada?.id_empresa ??
            (data as any)?.i_CveEmpresa ??
            (data as any)?.iCveEmpresa ??
            (data as any)?.I_CveEmpresa ??
            (data as any)?.iD_Empresa ??
            (data as any)?.id_empresa ??
            (data as any)?.Agenda?.i_CveEmpresa ??
            (data as any)?.agenda?.i_CveEmpresa ??
            (data as any)?.Cabecera?.i_CveEmpresa ??
            (data as any)?.cabecera?.i_CveEmpresa;

          const nomEmpresa =
            encontrada?.v_NombreEmpresa ||
            encontrada?.v_Empresa ||
            (data as any)?.v_NombreEmpresa ||
            (data as any)?.v_Empresa;

          if (!empId && nomEmpresa) {
            try {
              const empresasCoincidentes = await EmpresasService.getEmpresas(nomEmpresa);
              if (empresasCoincidentes && empresasCoincidentes.length > 0) {
                empId = empresasCoincidentes[0].iD_Empresa;
              }
            } catch (err) {
              console.warn("[ModalReprogramarSesion] No se pudo obtener empresa por nombre:", err);
            }
          }

          if (empId) {
            const cList = await EmpresasService.getContactos(Number(empId));
            setContactos(cList || []);
          }

          // Extraer ID de la Planta/Centro defensivamente
          let plantaId =
            encontrada?.i_CvePlanta ??
            encontrada?.iCvePlanta ??
            encontrada?.I_CvePlanta ??
            encontrada?.iD_Planta ??
            encontrada?.id_planta ??
            encontrada?.i_CveCentroTrabajo ??
            encontrada?.iCveCentroTrabajo ??
            encontrada?.i_CveCentro ??
            (data as any)?.i_CvePlanta ??
            (data as any)?.iCvePlanta ??
            (data as any)?.I_CvePlanta ??
            (data as any)?.iD_Planta ??
            (data as any)?.id_planta ??
            (data as any)?.i_CveCentroTrabajo ??
            (data as any)?.iCveCentroTrabajo ??
            (data as any)?.i_CveCentro ??
            (data as any)?.Agenda?.i_CvePlanta ??
            (data as any)?.agenda?.i_CvePlanta ??
            (data as any)?.Cabecera?.i_CvePlanta ??
            (data as any)?.cabecera?.i_CvePlanta;

          if (!plantaId && empId) {
            try {
              const plantasEmpresa = await EmpresasService.getPlantas(Number(empId));
              if (plantasEmpresa && plantasEmpresa.length > 0) {
                plantaId = plantasEmpresa[0].i_CvePlanta;
              }
            } catch (err) {
              console.warn("[ModalReprogramarSesion] No se pudo obtener plantas para empresa:", err);
            }
          }

          if (plantaId) {
            const aList = await AgendaService.getAreas(Number(plantaId));
            const unicos: AreaGetDto[] = [];
            const seen = new Set<number>();
            (aList || []).forEach((a: AreaGetDto) => {
              if (!seen.has(a.i_CveArea)) {
                seen.add(a.i_CveArea);
                unicos.push(a);
              }
            });
            setAreas(unicos);
          }
        }
      }).finally(() => {
        setCargandoInicial(false);
      });

      // 1.2 GET instructores
      AgendaService.getInstructores().then((iList) => setInstructores(iList || []));

      // 1.3 GET proveedores
      AgendaService.getProveedores().then((pList) => setProveedores(pList || []));
    }
  }, [abierto, iCveAgenda, iCveServAgendaDet, iCveAgendaDetalle]);

  // Consultar horas ocupadas cuando cambia instructor o fecha con switch activo
  useEffect(() => {
    if (cambiaInstructor && nuevoInstructorId && nuevaFecha) {
      setBuscandoHorasOcupadas(true);
      AgendaService.getHorasOcupadasInstructor(Number(nuevoInstructorId), nuevaFecha)
        .then((hList) => {
          setHorasOcupadasInstructor(hList || []);
        })
        .finally(() => {
          setBuscandoHorasOcupadas(false);
        });
    } else {
      setHorasOcupadasInstructor([]);
    }
  }, [cambiaInstructor, nuevoInstructorId, nuevaFecha]);

  // Nombre del instructor original consultado del backend o catálogo
  const nombreInstructorOriginal = useMemo(() => {
    // 1. Revisar propiedades de texto en sesionOriginal o detalleAgenda
    const nomText =
      sesionOriginal?.v_Titular ||
      sesionOriginal?.v_NomTitular ||
      sesionOriginal?.v_NombreTitular ||
      sesionOriginal?.v_Instructor ||
      sesionOriginal?.v_NomInstructor ||
      sesionOriginal?.v_NombreInstructor ||
      sesionOriginal?.v_NombreCompleto ||
      (detalleAgenda as any)?.v_Titular ||
      (detalleAgenda as any)?.v_NomTitular ||
      (detalleAgenda as any)?.v_NombreTitular;

    if (nomText && typeof nomText === "string" && nomText.trim().length > 0) {
      return nomText;
    }

    // 2. Si no viene el texto directo, buscar por i_CveTitular en el catálogo de instructores
    const cveTitular =
      sesionOriginal?.i_CveTitular ??
      sesionOriginal?.iCveTitular ??
      sesionOriginal?.iD_Titular ??
      (detalleAgenda as any)?.i_CveTitular;

    if (cveTitular && instructores.length > 0) {
      const match = instructores.find(
        (ins: any) =>
          Number(ins.i_CveInstructor ?? ins.iD_Instructor ?? ins.id_instructor ?? ins.iCveInstructor) === Number(cveTitular)
      );
      if (match) {
        return (
          match.v_NombreCompleto ||
          `${match.v_Nombre || ""} ${match.v_ApPaterno || ""}`.trim() ||
          match.v_Nombre ||
          `Instructor #${cveTitular}`
        );
      }
    }

    return "Sin asignar";
  }, [sesionOriginal, detalleAgenda, instructores]);

  // Duración original en minutos
  const duracionMinutos = useMemo(() => {
    const ini = sesionOriginal?.d_FechaHoraInicio || sesionOriginal?.f_FechaHoraInicio;
    const fin = sesionOriginal?.d_FechaHoraFin || sesionOriginal?.f_FechaHoraFin;
    return calcularDuracionMinutos(ini, fin);
  }, [sesionOriginal]);

  // Nueva hora fin calculada
  const nuevaHoraFin = useMemo(() => {
    if (!nuevaHoraInicio) return "11:00";
    const parts = nuevaHoraInicio.split(":");
    if (parts.length !== 2) return "11:00";
    const hh = parseInt(parts[0], 10);
    const mm = parseInt(parts[1], 10);
    const startMins = hh * 60 + mm;
    const endMins = startMins + duracionMinutos;
    const endHH = Math.floor(endMins / 60) % 24;
    const endMM = endMins % 60;
    return `${String(endHH).padStart(2, "0")}:${String(endMM).padStart(2, "0")}`;
  }, [nuevaHoraInicio, duracionMinutos]);

  // Identificar si el nuevo apoyo seleccionado es Proveedor
  const nuevoApoyoEsProveedor = useMemo(() => {
    return nuevoApoyoValue.startsWith("PROV_");
  }, [nuevoApoyoValue]);

  // Obtener ID del nuevo apoyo
  const nuevoApoyoIdParsed = useMemo(() => {
    if (!nuevoApoyoValue) return null;
    const parts = nuevoApoyoValue.split("_");
    return parts.length === 2 ? Number(parts[1]) : null;
  }, [nuevoApoyoValue]);

  const handleSiguientePaso2 = () => {
    if (!nuevaFecha) {
      toast.error("Selecciona la nueva fecha de la sesión");
      return;
    }
    if (esFechaPasada(nuevaFecha)) {
      toast.error("La nueva fecha no puede ser anterior al día de hoy");
      return;
    }
    if (cambiaInstructor && !nuevoInstructorId) {
      toast.error("Selecciona el nuevo instructor titular");
      return;
    }
    if (cambiaProveedor && !nuevoApoyoValue) {
      toast.error("Selecciona el nuevo apoyo o proveedor");
      return;
    }
    if (cambiaProveedor && nuevoApoyoEsProveedor && !nuevoPrecioProveedor) {
      toast.error("Ingresa el nuevo precio del proveedor");
      return;
    }
    setPasoActual(3);
  };

  const handleConfirmarReprogramacion = async () => {
    if (!contactoReprogramaId || Number(contactoReprogramaId) <= 0) {
      toast.error("Selecciona el contacto que solicita la reprogramación");
      return;
    }

    const bTipoDato = sesionOriginal?.b_TipoDato ?? (detalleAgenda as any)?.b_TipoDato ?? false;

    // Formatear ISO
    const dFechaHoraInicio = bTipoDato
      ? `${nuevaFecha}T${nuevaHoraInicio}:00`
      : `${nuevaFecha}T00:00:00`;

    const dFechaHoraFin = bTipoDato
      ? `${nuevaFecha}T${nuevaHoraFin}:00`
      : `${nuevaFecha}T23:59:59`;

    const obsFinal = motivoElegido
      ? `[${motivoElegido}] ${observacionesText.trim()}`.trim()
      : observacionesText.trim();

    // Extraer de forma defensiva todas las claves originales
    const cveAgendaDet =
      iCveAgendaDetalle ??
      sesionOriginal?.i_CveAgendaDetalle ??
      sesionOriginal?.iCveAgendaDetalle ??
      (detalleAgenda as any)?.i_CveAgendaDetalle;

    const cveAgenda =
      iCveAgenda ??
      sesionOriginal?.i_CveAgenda ??
      sesionOriginal?.iCveAgenda ??
      (detalleAgenda as any)?.i_CveAgenda;

    const cveServDet =
      iCveServAgendaDet ??
      sesionOriginal?.i_CveServAgendaDet ??
      sesionOriginal?.iCveServAgendaDet ??
      (detalleAgenda as any)?.i_CveServAgendaDet;

    const orden =
      sesionOriginal?.i_Orden ??
      sesionOriginal?.iOrden ??
      1;

    let cveTitularOriginal =
      sesionOriginal?.i_CveTitular ??
      sesionOriginal?.iCveTitular ??
      sesionOriginal?.iD_Titular ??
      sesionOriginal?.id_titular ??
      (detalleAgenda as any)?.i_CveTitular ??
      (detalleAgenda as any)?.iCveTitular;

    if (!cveTitularOriginal && instructores.length > 0) {
      const match = instructores.find((ins: any) => {
        const nom = ins.v_NombreCompleto || `${ins.v_Nombre || ""} ${ins.v_ApPaterno || ""}`.trim();
        return nom === nombreInstructorOriginal;
      });
      if (match) {
        cveTitularOriginal = (match as any).i_CveInstructor ?? (match as any).iD_Instructor ?? (match as any).id_instructor ?? (match as any).iCveInstructor;
      }
    }

    const idTitularFinal = cambiaInstructor
      ? Number(nuevoInstructorId)
      : (cveTitularOriginal ? Number(cveTitularOriginal) : (instructores[0] ? Number((instructores[0] as any).i_CveInstructor ?? (instructores[0] as any).iD_Instructor) : 1));

    const bTipoProvInsTitularOriginal =
      sesionOriginal?.b_TipoProvInsTitular ??
      sesionOriginal?.bTipoProvInsTitular ??
      (detalleAgenda as any)?.b_TipoProvInsTitular ??
      false;

    const cveApoyoOriginal =
      sesionOriginal?.i_CveApoyo ??
      sesionOriginal?.iCveApoyo ??
      sesionOriginal?.iD_Apoyo ??
      sesionOriginal?.id_apoyo ??
      (detalleAgenda as any)?.i_CveApoyo;

    const bTipoProvInsApoyoOriginal =
      sesionOriginal?.b_TipoProvInsApoyo ??
      sesionOriginal?.bTipoProvInsApoyo ??
      (detalleAgenda as any)?.b_TipoProvInsApoyo ??
      false;

    const requestDto: ReprogramacionInsertDto = {
      i_CveAgendaDetalle: Number(cveAgendaDet || 0),
      i_CveAgenda: Number(cveAgenda || 0),
      i_CveServAgendaDet: Number(cveServDet || 0),
      i_Orden: Number(orden || 1),
      d_FechaHoraInicio: dFechaHoraInicio,
      d_FechaHoraFin: dFechaHoraFin,
      i_CveTitular: idTitularFinal,
      b_TipoProvInsTitular: cambiaInstructor
        ? false
        : Boolean(bTipoProvInsTitularOriginal),
      i_CveApoyo: cambiaProveedor
        ? nuevoApoyoIdParsed
        : (cveApoyoOriginal ? Number(cveApoyoOriginal) : null),
      b_TipoProvInsApoyo: cambiaProveedor
        ? nuevoApoyoEsProveedor
        : Boolean(bTipoProvInsApoyoOriginal),
      i_CveArea: areaId ? Number(areaId) : null,
      v_Observaciones: obsFinal,
      i_CveContactoReprograma: Number(contactoReprogramaId),
      CambiaProveedor: cambiaProveedor,
      CambiaInstructor: cambiaInstructor,
      d_NuevoPrecioProveedor:
        cambiaProveedor && nuevoApoyoEsProveedor
          ? Number(nuevoPrecioProveedor) || 0
          : 0,
    };

    try {
      setGuardando(true);
      console.log("[ModalReprogramarSesion] Enviando payload reprogramación:", requestDto);
      const res = await AgendaService.postReprogramacion(requestDto);

      if (res.exito) {
        toast.success("Sesión reprogramada correctamente");
        if (onReprogramacionExitosa) onReprogramacionExitosa();
        onCerrar();
      } else {
        toast.error(res.mensaje || "Error al procesar la reprogramación. Intenta de nuevo.");
      }
    } catch (err: any) {
      console.warn("Error en handleConfirmarReprogramacion:", err);
      toast.error("Ocurrió un error al reprogramar la sesión");
    } finally {
      setGuardando(false);
    }
  };

  if (!abierto || !mounted) return null;

  const bTipoDatoManejaHorario =
    sesionOriginal?.b_TipoDato ?? (detalleAgenda as any)?.b_TipoDato ?? false;

  const totalSesiones =
    detalleAgenda?.i_TotalSesiones ||
    (detalleAgenda as any)?.Sesiones?.length ||
    (detalleAgenda as any)?.sesiones?.length ||
    1;

  return createPortal(
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(15, 23, 42, 0.6)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1050,
        padding: "16px",
      }}
    >
      <div
        style={{
          backgroundColor: "#ffffff",
          borderRadius: "16px",
          width: "100%",
          maxWidth: "820px",
          maxHeight: "92vh",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
          overflow: "hidden",
          border: "1px solid #e2e8f0",
        }}
      >
        {/* HEADER */}
        <div
          style={{
            padding: "16px 24px",
            borderBottom: "1px solid #f1f5f9",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            backgroundColor: "#ffffff",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "10px",
                backgroundColor: "#fffbebe6",
                border: "1px solid #fde68a",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#d97706",
              }}
            >
              <RefreshCw size={20} />
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
                Reprogramar sesión
              </h3>
              <span style={{ fontSize: "12px", color: "#6c757d" }}>
                Consulta la sesión original, configura la nueva fecha y registra los datos administrativos.
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onCerrar}
            disabled={guardando}
            style={{
              background: "none",
              border: "none",
              color: guardando ? "#cbd5e1" : "#7a96b0",
              cursor: guardando ? "not-allowed" : "pointer",
              padding: "4px",
              borderRadius: "6px",
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* BARRA DE PASOS (STEPS INDICATOR - AMARILLO) */}
        <div
          style={{
            padding: "12px 40px 10px 40px",
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
                backgroundColor: "#fab839",
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
                  backgroundColor: pasoActual >= 1 ? "#fab839" : "#e0e0e0",
                  color: "#ffffff",
                  fontSize: "13px",
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow:
                    pasoActual === 1
                      ? "0 0 0 4px rgba(250, 184, 57, 0.25)"
                      : "none",
                  transition: "all 0.2s ease",
                }}
              >
                {pasoActual > 1 ? <Check size={16} /> : "1"}
              </div>
              <span
                style={{
                  fontSize: "12px",
                  marginTop: "6px",
                  fontWeight: pasoActual === 1 ? 700 : 500,
                  color: pasoActual === 1 ? "#d97706" : "#6c757d",
                }}
              >
                Sesión original
              </span>
            </div>

            {/* Paso 2 */}
            <div
              style={{
                zIndex: 3,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                cursor: "pointer",
              }}
              onClick={() => handleSiguientePaso2()}
            >
              <div
                style={{
                  width: "30px",
                  height: "30px",
                  borderRadius: "50%",
                  backgroundColor: pasoActual >= 2 ? "#fab839" : "#e0e0e0",
                  color: "#ffffff",
                  fontSize: "13px",
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow:
                    pasoActual === 2
                      ? "0 0 0 4px rgba(250, 184, 57, 0.25)"
                      : "none",
                  transition: "all 0.2s ease",
                }}
              >
                {pasoActual > 2 ? <Check size={16} /> : "2"}
              </div>
              <span
                style={{
                  fontSize: "12px",
                  marginTop: "6px",
                  fontWeight: pasoActual === 2 ? 700 : 500,
                  color: pasoActual === 2 ? "#d97706" : "#6c757d",
                }}
              >
                Nueva sesión
              </span>
            </div>

            {/* Paso 3 */}
            <div
              style={{
                zIndex: 3,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                cursor: pasoActual === 3 ? "default" : "pointer",
              }}
            >
              <div
                style={{
                  width: "30px",
                  height: "30px",
                  borderRadius: "50%",
                  backgroundColor: pasoActual === 3 ? "#fab839" : "#e0e0e0",
                  color: "#ffffff",
                  fontSize: "13px",
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow:
                    pasoActual === 3
                      ? "0 0 0 4px rgba(250, 184, 57, 0.25)"
                      : "none",
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
                  color: pasoActual === 3 ? "#d97706" : "#6c757d",
                }}
              >
                Datos administrativos
              </span>
            </div>
          </div>
        </div>

        {/* BODY */}
        <div
          className="custom-scrollbar"
          style={{
            padding: "24px 28px",
            overflowY: "auto",
            flex: 1,
            display: "flex",
            flexDirection: "column",
            gap: "16px",
            backgroundColor: "#ffffff",
          }}
        >
          {cargandoInicial ? (
            <div
              style={{
                padding: "60px 20px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: "12px",
                color: "#d97706",
              }}
            >
              <Loader2 size={32} className="animate-spin" />
              <span style={{ fontSize: "14px", fontWeight: 600, color: "#475569" }}>
                Cargando información de la sesión...
              </span>
            </div>
          ) : (
            <>
              {/* PASO 1: DATOS DE LA SESIÓN ORIGINAL */}
              {pasoActual === 1 && (
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  <h3
                    style={{
                      margin: 0,
                      fontSize: "15px",
                      fontWeight: 600,
                      color: "#475569",
                    }}
                  >
                    Datos de la sesión original
                  </h3>

                  <div
                    style={{
                      backgroundColor: "#f8fafc",
                      border: "1px solid #e2e8f0",
                      borderRadius: "12px",
                      padding: "20px 24px",
                      display: "flex",
                      flexDirection: "column",
                      gap: "20px",
                    }}
                  >
                    {/* Fila 1: Servicio / No. de sesión */}
                    <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "16px" }}>
                      <div>
                        <div style={{ fontSize: "12px", color: "#64748b", fontWeight: 500, marginBottom: "4px" }}>
                          Servicio
                        </div>
                        <div style={{ fontSize: "15px", color: "#1e293b", fontWeight: 700, textTransform: "uppercase" }}>
                          {sesionOriginal?.v_NombreServicio || (detalleAgenda as any)?.v_Servicio || "—"}
                        </div>
                      </div>

                      <div>
                        <div style={{ fontSize: "12px", color: "#64748b", fontWeight: 500, marginBottom: "4px" }}>
                          No. de sesión
                        </div>
                        <div style={{ fontSize: "15px", color: "#1e293b", fontWeight: 700 }}>
                          Sesión {sesionOriginal?.i_Orden || 1} de {totalSesiones}
                        </div>
                      </div>
                    </div>

                    {/* Fila 2: Fecha original / Hora inicio / Hora fin */}
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: bTipoDatoManejaHorario ? "1fr 1fr 1fr" : "1fr",
                        gap: "16px",
                      }}
                    >
                      <div>
                        <div style={{ fontSize: "12px", color: "#64748b", fontWeight: 500, marginBottom: "4px" }}>
                          Fecha original
                        </div>
                        <div style={{ fontSize: "15px", color: "#1e293b", fontWeight: 700 }}>
                          {formatearFechaTexto(sesionOriginal?.d_FechaHoraInicio || sesionOriginal?.f_FechaHoraInicio)}
                        </div>
                      </div>

                      {bTipoDatoManejaHorario && (
                        <>
                          <div>
                            <div style={{ fontSize: "12px", color: "#64748b", fontWeight: 500, marginBottom: "4px" }}>
                              Hora inicio original
                            </div>
                            <div style={{ fontSize: "15px", color: "#1e293b", fontWeight: 700 }}>
                              {formatearHoraTexto(sesionOriginal?.d_FechaHoraInicio || sesionOriginal?.f_FechaHoraInicio)}
                            </div>
                          </div>

                          <div>
                            <div style={{ fontSize: "12px", color: "#64748b", fontWeight: 500, marginBottom: "4px" }}>
                              Hora fin original
                            </div>
                            <div style={{ fontSize: "15px", color: "#1e293b", fontWeight: 700 }}>
                              {formatearHoraTexto(sesionOriginal?.d_FechaHoraFin || sesionOriginal?.f_FechaHoraFin)}
                            </div>
                          </div>
                        </>
                      )}
                    </div>

                    {/* Fila 3: Instructor original */}
                    <div>
                      <div style={{ fontSize: "12px", color: "#64748b", fontWeight: 500, marginBottom: "4px" }}>
                        Instructor original
                      </div>
                      <div style={{ fontSize: "15px", color: "#1e293b", fontWeight: 700, textTransform: "uppercase" }}>
                        {nombreInstructorOriginal}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* PASO 2: NUEVA SESIÓN */}
              {pasoActual === 2 && (
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  <h3
                    style={{
                      margin: 0,
                      fontSize: "15px",
                      fontWeight: 600,
                      color: "#475569",
                    }}
                  >
                    Datos de la nueva sesión
                  </h3>

                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "16px",
                      border: "1px solid #e2e8f0",
                      borderRadius: "12px",
                      padding: "20px 24px",
                    }}
                  >
                    {/* Fecha y Horario */}
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: bTipoDatoManejaHorario
                          ? "repeat(auto-fit, minmax(200px, 1fr))"
                          : "1fr",
                        gap: "16px",
                      }}
                    >
                      <div>
                        <label
                          style={{
                            fontSize: "12px",
                            fontWeight: 700,
                            color: "#334155",
                            display: "block",
                            marginBottom: "4px",
                          }}
                        >
                          Nueva fecha <span style={{ color: "#dc3545" }}>*</span>
                        </label>
                        <input
                          type="date"
                          className="form-control"
                          value={nuevaFecha}
                          min={new Date().toISOString().split("T")[0]}
                          onChange={(e) => setNuevaFecha(e.target.value)}
                          style={{ height: "38px", fontSize: "13px", borderRadius: "8px" }}
                        />
                      </div>

                      {bTipoDatoManejaHorario && (
                        <>
                          <div>
                            <label
                              style={{
                                fontSize: "12px",
                                fontWeight: 700,
                                color: "#334155",
                                display: "block",
                                marginBottom: "4px",
                              }}
                            >
                              Hora inicio <span style={{ color: "#dc3545" }}>*</span>
                            </label>
                            <input
                              type="time"
                              className="form-control"
                              value={nuevaHoraInicio}
                              onChange={(e) => setNuevaHoraInicio(e.target.value)}
                              style={{ height: "38px", fontSize: "13px", borderRadius: "8px" }}
                            />
                          </div>

                          <div>
                            <label
                              style={{
                                fontSize: "12px",
                                fontWeight: 700,
                                color: "#64748b",
                                display: "block",
                                marginBottom: "4px",
                              }}
                            >
                              Hora fin (calculada)
                            </label>
                            <input
                              type="time"
                              className="form-control"
                              value={nuevaHoraFin}
                              disabled
                              style={{
                                height: "38px",
                                fontSize: "13px",
                                borderRadius: "8px",
                                backgroundColor: "#f1f5f9",
                                color: "#475569",
                              }}
                            />
                          </div>
                        </>
                      )}
                    </div>

                    {/* Advertencia de Horas Ocupadas */}
                    {horasOcupadasInstructor.length > 0 && (
                      <div
                        style={{
                          backgroundColor: "#fffbebe6",
                          border: "1px solid #fde68a",
                          borderRadius: "8px",
                          padding: "10px 14px",
                          display: "flex",
                          alignItems: "flex-start",
                          gap: "10px",
                          fontSize: "12px",
                          color: "#92400e",
                        }}
                      >
                        <AlertTriangle size={18} style={{ color: "#d97706", flexShrink: 0, marginTop: "2px" }} />
                        <div>
                          <strong>Atención: El instructor seleccionado tiene horas ocupadas este día:</strong>
                          <ul style={{ margin: "4px 0 0 0", paddingLeft: "18px" }}>
                            {horasOcupadasInstructor.map((r, idx) => (
                              <li key={idx}>
                                {formatearHoraTexto(r.d_FechaHoraInicio || r.FechaHoraInicio)} - {formatearHoraTexto(r.d_FechaHoraFin || r.FechaHoraFin)}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}

                    {/* SWITCH 1: ¿Cambia Instructor? */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      <label
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          fontSize: "13px",
                          fontWeight: 600,
                          color: "#0f172a",
                          cursor: "pointer",
                          userSelect: "none",
                        }}
                      >
                        <input
                          type="checkbox"
                          className="form-check-input"
                          checked={cambiaInstructor}
                          onChange={(e) => setCambiaInstructor(e.target.checked)}
                          style={{ width: "16px", height: "16px", cursor: "pointer" }}
                        />
                        <span>¿Cambia instructor titular?</span>
                      </label>

                      {cambiaInstructor && (
                        <div style={{ paddingLeft: "24px" }}>
                          <select
                            className="form-select"
                            value={nuevoInstructorId}
                            onChange={(e) => setNuevoInstructorId(e.target.value)}
                            style={{ height: "38px", fontSize: "13px", borderRadius: "8px" }}
                          >
                            <option value="">-- Selecciona nuevo instructor --</option>
                            {instructores.map((ins: any) => {
                              const cve = ins.i_CveInstructor ?? ins.iD_Instructor ?? ins.id_instructor ?? ins.iCveInstructor;
                              const nombre =
                                ins.v_NombreCompleto ||
                                ins.v_NombreTitular ||
                                `${ins.v_Nombre || ""} ${ins.v_ApPaterno || ""}`.trim() ||
                                `Instructor #${cve}`;
                              return (
                                <option key={cve} value={cve}>
                                  {nombre}
                                </option>
                              );
                            })}
                          </select>
                        </div>
                      )}
                    </div>

                    {/* SWITCH 2: ¿Cambia Apoyo / Proveedor? */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      <label
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          fontSize: "13px",
                          fontWeight: 600,
                          color: "#0f172a",
                          cursor: "pointer",
                          userSelect: "none",
                        }}
                      >
                        <input
                          type="checkbox"
                          className="form-check-input"
                          checked={cambiaProveedor}
                          onChange={(e) => setCambiaProveedor(e.target.checked)}
                          style={{ width: "16px", height: "16px", cursor: "pointer" }}
                        />
                        <span>¿Cambia apoyo / proveedor?</span>
                      </label>

                      {cambiaProveedor && (
                        <div style={{ paddingLeft: "24px", display: "flex", flexDirection: "column", gap: "12px" }}>
                          <select
                            className="form-select"
                            value={nuevoApoyoValue}
                            onChange={(e) => setNuevoApoyoValue(e.target.value)}
                            style={{ height: "38px", fontSize: "13px", borderRadius: "8px" }}
                          >
                            <option value="">-- Selecciona nuevo apoyo o proveedor --</option>
                            <optgroup label="Instructores (Apoyo)">
                              {instructores.map((ins: any) => {
                                const cve = ins.i_CveInstructor ?? ins.iD_Instructor ?? ins.id_instructor ?? ins.iCveInstructor;
                                const nombre =
                                  ins.v_NombreCompleto ||
                                  ins.v_NombreTitular ||
                                  `${ins.v_Nombre || ""} ${ins.v_ApPaterno || ""}`.trim() ||
                                  `Instructor #${cve}`;
                                return (
                                  <option key={`INS_${cve}`} value={`INS_${cve}`}>
                                    {nombre} (Instructor)
                                  </option>
                                );
                              })}
                            </optgroup>
                            <optgroup label="Proveedores">
                              {proveedores.map((prov: any) => {
                                const cve = prov.i_CveProveedor ?? prov.iD_Proveedor ?? prov.id_proveedor ?? prov.iCveProveedor;
                                const nombre =
                                  prov.v_RazonSocial || prov.v_Nombre || prov.s_RazonSocial || `Proveedor #${cve}`;
                                return (
                                  <option key={`PROV_${cve}`} value={`PROV_${cve}`}>
                                    {nombre} (Proveedor)
                                  </option>
                                );
                              })}
                            </optgroup>
                          </select>

                          {/* Campo Nuevo precio proveedor (c/IVA) si el apoyo es proveedor */}
                          {nuevoApoyoEsProveedor && (
                            <div>
                              <label
                                style={{
                                  fontSize: "12px",
                                  fontWeight: 700,
                                  color: "#059669",
                                  display: "block",
                                  marginBottom: "4px",
                                }}
                              >
                                Nuevo precio proveedor (c/IVA) <span style={{ color: "#dc3545" }}>*</span>
                              </label>
                              <div style={{ position: "relative" }}>
                                <input
                                  type="number"
                                  className="form-control"
                                  placeholder="0.00"
                                  value={nuevoPrecioProveedor}
                                  onChange={(e) => setNuevoPrecioProveedor(e.target.value)}
                                  style={{
                                    height: "38px",
                                    fontSize: "13px",
                                    borderRadius: "8px",
                                    paddingLeft: "28px",
                                    borderColor: "#10b981",
                                  }}
                                />
                                <DollarSign
                                  size={15}
                                  style={{
                                    position: "absolute",
                                    left: "10px",
                                    top: "50%",
                                    transform: "translateY(-50%)",
                                    color: "#059669",
                                  }}
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Select Área / Sala */}
                    <div>
                      <label
                        style={{
                          fontSize: "12px",
                          fontWeight: 700,
                          color: "#334155",
                          display: "block",
                          marginBottom: "4px",
                        }}
                      >
                        Área / Sala
                      </label>
                      <select
                        className="form-select"
                        value={areaId}
                        onChange={(e) => setAreaId(e.target.value)}
                        style={{ height: "38px", fontSize: "13px", borderRadius: "8px" }}
                      >
                        <option value="">-- Sin área asignada --</option>
                        {areas.map((a: any) => {
                          const cve = a.i_CveArea ?? a.iD_Area ?? a.id_area ?? a.iCveArea;
                          const nombre = a.v_NombreArea || a.v_Nombre || a.s_NombreArea || `Área #${cve}`;
                          return (
                            <option key={cve} value={cve}>
                              {nombre}
                            </option>
                          );
                        })}
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* PASO 3: DATOS ADMINISTRATIVOS */}
              {pasoActual === 3 && (
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  <h3
                    style={{
                      margin: 0,
                      fontSize: "15px",
                      fontWeight: 600,
                      color: "#475569",
                    }}
                  >
                    Datos administrativos
                  </h3>

                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "16px",
                      border: "1px solid #e2e8f0",
                      borderRadius: "12px",
                      padding: "20px 24px",
                    }}
                  >
                    {/* Motivo de reprogramación */}
                    <div>
                      <label
                        style={{
                          fontSize: "12px",
                          fontWeight: 700,
                          color: "#334155",
                          display: "block",
                          marginBottom: "4px",
                        }}
                      >
                        Motivo de reprogramación
                      </label>
                      <select
                        className="form-select"
                        value={motivoElegido}
                        onChange={(e) => setMotivoElegido(e.target.value)}
                        style={{ height: "38px", fontSize: "13px", borderRadius: "8px" }}
                      >
                        <option value="">-- Selecciona motivo --</option>
                        <option value="Cliente solicitó cambio de fecha">Cliente solicitó cambio de fecha</option>
                        <option value="Instructor no disponible">Instructor no disponible</option>
                        <option value="Condiciones climáticas / Fuerza mayor">Condiciones climáticas / Fuerza mayor</option>
                        <option value="Reajuste de logística">Reajuste de logística</option>
                        <option value="Otro">Otro</option>
                      </select>
                    </div>

                    {/* Observaciones adicionales */}
                    <div>
                      <label
                        style={{
                          fontSize: "12px",
                          fontWeight: 700,
                          color: "#334155",
                          display: "block",
                          marginBottom: "4px",
                        }}
                      >
                        Observaciones adicionales
                      </label>
                      <textarea
                        className="form-control"
                        rows={3}
                        placeholder="Detalles sobre la reprogramación..."
                        value={observacionesText}
                        onChange={(e) => setObservacionesText(e.target.value)}
                        style={{ fontSize: "13px", borderRadius: "8px" }}
                      />
                    </div>

                    {/* Contacto que reprograma */}
                    <div>
                      <label
                        style={{
                          fontSize: "12px",
                          fontWeight: 700,
                          color: "#334155",
                          display: "block",
                          marginBottom: "4px",
                        }}
                      >
                        Contacto que reprograma <span style={{ color: "#dc3545" }}>*</span>
                      </label>
                      <select
                        className="form-select"
                        value={contactoReprogramaId}
                        onChange={(e) => setContactoReprogramaId(e.target.value)}
                        style={{ height: "38px", fontSize: "13px", borderRadius: "8px" }}
                      >
                        <option value="">-- Selecciona el contacto de la empresa --</option>
                        {contactos.map((c: any) => {
                          const cve = c.i_CveContacto ?? c.iD_Contacto ?? c.id_contacto ?? c.iCveContacto;
                          const nombre = c.v_NombreContacto || c.v_Nombre || c.v_Contacto || c.s_NombreContacto || `Contacto #${cve}`;
                          const tipo = c.v_TipoContacto || c.s_TipoContacto || "";
                          return (
                            <option key={cve} value={cve}>
                              {nombre} {tipo ? `(${tipo})` : ""}
                            </option>
                          );
                        })}
                      </select>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* FOOTER */}
        <div
          style={{
            padding: "16px 28px",
            borderTop: "1px solid #f1f5f9",
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            gap: "12px",
            backgroundColor: "#ffffff",
          }}
        >
          {pasoActual === 1 && (
            <>
              <button
                type="button"
                onClick={onCerrar}
                disabled={guardando}
                style={{
                  height: "38px",
                  padding: "0 24px",
                  borderRadius: "8px",
                  fontSize: "13px",
                  fontWeight: 600,
                  backgroundColor: "#5965c9",
                  borderColor: "#5965c9",
                  color: "#ffffff",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                Cerrar
              </button>
              <button
                type="button"
                onClick={() => setPasoActual(2)}
                disabled={cargandoInicial}
                style={{
                  height: "38px",
                  padding: "0 26px",
                  borderRadius: "8px",
                  fontSize: "13px",
                  fontWeight: 600,
                  backgroundColor: "#fab839",
                  borderColor: "#fab839",
                  color: "#ffffff",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                Siguiente
              </button>
            </>
          )}

          {pasoActual === 2 && (
            <>
              <button
                type="button"
                onClick={() => setPasoActual(1)}
                disabled={guardando}
                style={{
                  height: "38px",
                  padding: "0 24px",
                  borderRadius: "8px",
                  fontSize: "13px",
                  fontWeight: 600,
                  backgroundColor: "#5965c9",
                  borderColor: "#5965c9",
                  color: "#ffffff",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                Anterior
              </button>
              <button
                type="button"
                onClick={handleSiguientePaso2}
                disabled={cargandoInicial || !nuevaFecha}
                style={{
                  height: "38px",
                  padding: "0 26px",
                  borderRadius: "8px",
                  fontSize: "13px",
                  fontWeight: 600,
                  backgroundColor: "#fab839",
                  borderColor: "#fab839",
                  color: "#ffffff",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                Siguiente
              </button>
            </>
          )}

          {pasoActual === 3 && (
            <>
              <button
                type="button"
                onClick={() => setPasoActual(2)}
                disabled={guardando}
                style={{
                  height: "38px",
                  padding: "0 24px",
                  borderRadius: "8px",
                  fontSize: "13px",
                  fontWeight: 600,
                  backgroundColor: "#5965c9",
                  borderColor: "#5965c9",
                  color: "#ffffff",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                Anterior
              </button>
              <button
                type="button"
                onClick={handleConfirmarReprogramacion}
                disabled={guardando || cargandoInicial || !contactoReprogramaId}
                style={{
                  height: "38px",
                  padding: "0 26px",
                  borderRadius: "8px",
                  fontSize: "13px",
                  fontWeight: 600,
                  backgroundColor: "#fab839",
                  borderColor: "#fab839",
                  color: "#ffffff",
                  border: "none",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                {guardando ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Reprogramando...</span>
                  </>
                ) : (
                  <span>Confirmar reprogramación</span>
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};
