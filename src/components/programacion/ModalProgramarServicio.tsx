"use client";

import React, { useEffect, useState, useMemo } from "react";
import {
  X,
  Clock,
  ChevronRight,
  ChevronLeft,
  Check,
} from "lucide-react";
import {
  AgendaDetalleGetDto,
  InstructorGetDto,
  ProveedorGetDto,
  AreaGetDto,
  ProgramarServicioDto,
} from "@/types/servicios";
import { AgendaService } from "@/services/agenda.service";
import InputFechaTexto from "@/components/ui/InputFechaTexto";
import { useToast } from "@/context/ToastContext";

interface Props {
  abierto: boolean;
  detalle: AgendaDetalleGetDto | null;
  onCerrar: () => void;
  onGuardadoExitoso?: () => void;
}

interface SesionRowState {
  fecha: string;
  horaInicio: string;
  horaFin: string;
  i_CveArea: string;
}

const GROUP_CONFIG: Record<
  number,
  { nombre: string; colorBorder: string; bg: string; colorText: string }
> = {
  2: {
    nombre: "CAPACITACIÓN",
    colorBorder: "#f59e0b",
    bg: "#fffdf0",
    colorText: "#b45309",
  },
  3: {
    nombre: "ESTUDIOS",
    colorBorder: "#188ae2",
    bg: "#f4f8fe",
    colorText: "#0369a1",
  },
  5: {
    nombre: "PRODUCTOS",
    colorBorder: "#8b5cf6",
    bg: "#faf5ff",
    colorText: "#6b21a8",
  },
  6: {
    nombre: "SERVICIOS",
    colorBorder: "#10b981",
    bg: "#f0fdf4",
    colorText: "#15803d",
  },
};

const HORAS_OPCIONES: string[] = (() => {
  const arr: string[] = [];
  for (let h = 0; h < 24; h++) {
    const hh = h.toString().padStart(2, "0");
    arr.push(`${hh}:00`);
    arr.push(`${hh}:30`);
  }
  return arr;
})();

function calcularMinutosPorSesion(cantidadHorasTotal: number, numSesiones: number): number[] {
  const nSesiones = Math.max(1, numSesiones || 1);
  const totalMinutos = Math.max(1, Math.round((cantidadHorasTotal || 1) * 60));

  const minutosBase = Math.floor(totalMinutos / nSesiones);
  const residuoMinutos = totalMinutos - minutosBase * nSesiones;

  const duraciones: number[] = [];
  for (let i = 0; i < nSesiones; i++) {
    const minsSesion = i === nSesiones - 1 ? minutosBase + residuoMinutos : minutosBase;
    duraciones.push(minsSesion);
  }
  return duraciones;
}

function sumarMinutosAHorario(horaInicioStr: string, minutosASumar: number): string {
  if (!horaInicioStr || !horaInicioStr.includes(":")) return "13:00";
  const [hhStr, mmStr] = horaInicioStr.split(":");
  let hh = parseInt(hhStr, 10) || 0;
  let mm = parseInt(mmStr, 10) || 0;

  let totalMins = hh * 60 + mm + Math.round(minutosASumar);
  if (totalMins < 0) totalMins = 0;

  const finHH = Math.floor(totalMins / 60) % 24;
  const finMM = totalMins % 60;

  const strHH = finHH.toString().padStart(2, "0");
  const strMM = finMM.toString().padStart(2, "0");
  return `${strHH}:${strMM}`;
}

function calcularDiferenciaMinutos(horaInicioStr: string, horaFinStr: string): number {
  if (!horaInicioStr || !horaFinStr || !horaInicioStr.includes(":") || !horaFinStr.includes(":")) {
    return 120;
  }
  const [h1, m1] = horaInicioStr.split(":").map(Number);
  const [h2, m2] = horaFinStr.split(":").map(Number);
  const total1 = (h1 || 0) * 60 + (m1 || 0);
  const total2 = (h2 || 0) * 60 + (m2 || 0);
  const diff = total2 - total1;
  return diff > 0 ? diff : 120;
}

function sumarUnDiaAFecha(fechaStr: string): string {
  try {
    const d = new Date(fechaStr + "T00:00:00");
    if (isNaN(d.getTime())) {
      const hoy = new Date();
      return hoy.toISOString().split("T")[0];
    }
    d.setDate(d.getDate() + 1);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  } catch {
    return fechaStr;
  }
}

function generarSesiones(
  cantidadHoras: number,
  nSes: number,
  prevSesiones: SesionRowState[],
  defaultAreaId: string,
  todayStr: string
): SesionRowState[] {
  const duraciones = calcularMinutosPorSesion(cantidadHoras, nSes);
  const resultado: SesionRowState[] = [];

  for (let i = 0; i < nSes; i++) {
    const prev = prevSesiones[i];
    if (prev) {
      const horaInicio = prev.horaInicio || "09:00";
      const horaFin = sumarMinutosAHorario(horaInicio, duraciones[i]);
      resultado.push({
        fecha: prev.fecha || todayStr,
        horaInicio,
        horaFin,
        i_CveArea: prev.i_CveArea || defaultAreaId,
      });
    } else {
      const fechaBase = resultado[i - 1]?.fecha || todayStr;
      const fechaNueva = sumarUnDiaAFecha(fechaBase);
      const horaInicio = "09:00";
      const horaFin = sumarMinutosAHorario(horaInicio, duraciones[i]);
      resultado.push({
        fecha: fechaNueva,
        horaInicio,
        horaFin,
        i_CveArea: resultado[0]?.i_CveArea || defaultAreaId,
      });
    }
  }

  return resultado;
}

function formatearMoneda(monto: number): string {
  return (monto || 0).toLocaleString("es-MX", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

const IVA = 0.16;

export const ModalProgramarServicio: React.FC<Props> = ({
  abierto,
  detalle,
  onCerrar,
  onGuardadoExitoso,
}) => {
  const { toast } = useToast();

  // Paso actual (1: Agendar sesiones, 2: Datos de venta)
  const [pasoActual, setPasoActual] = useState<number>(1);
  const [pasoMaximoAlcanzado, setPasoMaximoAlcanzado] = useState<number>(1);
  const [guardando, setGuardando] = useState<boolean>(false);

  // Catálogos
  const [instructores, setInstructores] = useState<InstructorGetDto[]>([]);
  const [proveedores, setProveedores] = useState<ProveedorGetDto[]>([]);
  const [areas, setAreas] = useState<AreaGetDto[]>([]);
  const [cargandoCatalogos, setCargandoCatalogos] = useState<boolean>(false);

  // Estado Paso 1: Agendar sesiones
  const [tipoCupo, setTipoCupo] = useState<"Abierto" | "Limitado">("Abierto");
  const [cupoAlumnos, setCupoAlumnos] = useState<number>(20);
  const [numSesiones, setNumSesiones] = useState<number>(1);
  const [titularId, setTitularId] = useState<string>("");
  const [apoyoId, setApoyoId] = useState<string>("NA");
  const [sesiones, setSesiones] = useState<SesionRowState[]>([]);

  // Estado Paso 2: Datos de venta
  const [noCotizacionGI, setNoCotizacionGI] = useState<string>("");
  const [noOrdenCompraCliente, setNoOrdenCompraCliente] = useState<string>("");
  const [precioUnitario, setPrecioUnitario] = useState<number>(0);
  const [precioProveedor, setPrecioProveedor] = useState<number>(0);
  const [noCotizacionProv, setNoCotizacionProv] = useState<string>("");
  const [noOrdenCompraProv, setNoOrdenCompraProv] = useState<string>("");

  const tipoId = useMemo(() => {
    if (!detalle) return 6;
    if (detalle.i_CveTipoServicio !== undefined && detalle.i_CveTipoServicio !== null) {
      return Number(detalle.i_CveTipoServicio);
    }
    const t = (detalle.v_TipoServicio || "").toUpperCase();
    if (t.includes("CAPACITA")) return 2;
    if (t.includes("ESTUDIO")) return 3;
    if (t.includes("PRODUCTO")) return 5;
    return 6;
  }, [detalle]);

  const config = GROUP_CONFIG[tipoId] || GROUP_CONFIG[6];
  const esCapacitacion = tipoId === 2;

  const esUnidadHoras = useMemo(() => {
    if (!detalle) return false;
    if (tipoId === 2) return true;
    const u = (detalle.v_Unidad || "").toLowerCase().trim();
    return u === "horas" || u === "hora" || u === "hrs" || u === "hr";
  }, [detalle, tipoId]);

  const bTipoDatoManejaHorario = useMemo(() => {
    if (!detalle) return true;
    if (esCapacitacion) return true;
    return Boolean(detalle.b_TipoDato);
  }, [detalle, esCapacitacion]);

  // Lista de proveedores con S_RazonSocial limpia y sin respaldos "Proveedor #id"
  const listaProveedores = useMemo(() => {
    return (proveedores || [])
      .map((prv: any) => {
        const cve =
          prv.i_CveProveedor ??
          prv.I_CveProveedor ??
          prv.iD_Proveedor ??
          prv.id_proveedor ??
          prv.iCveProveedor;
        const nombre = (
          prv.S_RazonSocial ||
          prv.s_RazonSocial ||
          prv.v_RazonSocial ||
          prv.v_NombreComercial ||
          prv.s_NombreComercial ||
          prv.v_Nombre ||
          ""
        ).trim();
        return {
          id: `prov_${cve}`,
          cve,
          nombre,
        };
      })
      .filter((p) => p.cve && p.nombre.length > 0);
  }, [proveedores]);

  // Carga inicial y precarga desde `detalle`
  useEffect(() => {
    if (!abierto || !detalle) {
      setPasoActual(1);
      setPasoMaximoAlcanzado(1);
      setSesiones([]);
      setTitularId("");
      setApoyoId("NA");
      return;
    }

    // 1. Cargar catálogos
    setCargandoCatalogos(true);
    Promise.all([
      AgendaService.getInstructores(),
      AgendaService.getProveedores(),
      detalle.i_CvePlanta ? AgendaService.getAreas(detalle.i_CvePlanta) : Promise.resolve([]),
    ])
      .then(([iList, pList, aList]) => {
        setInstructores(iList || []);
        setProveedores(pList || []);
        setAreas(aList || []);
      })
      .catch(() => toast.error("Error al cargar catálogos"))
      .finally(() => setCargandoCatalogos(false));

    // 2. Precargar Cupo
    if (detalle.i_NumAlumnos && Number(detalle.i_NumAlumnos) > 0) {
      setTipoCupo("Limitado");
      setCupoAlumnos(Number(detalle.i_NumAlumnos));
    } else {
      setTipoCupo("Abierto");
      setCupoAlumnos(20);
    }

    // 3. Precargar Titular y Apoyo
    setTitularId("");
    if (detalle.i_CveProveedor && Number(detalle.i_CveProveedor) > 0) {
      setApoyoId(`prov_${detalle.i_CveProveedor}`);
    } else {
      setApoyoId("NA");
    }

    // 4. Precargar Datos de venta
    setNoCotizacionGI(detalle.v_NoCotizacionGI || "");
    setNoOrdenCompraCliente(detalle.v_NoOrdenCompraCliente || "");
    setPrecioUnitario(Number(detalle.d_PrecioUnitario) || 0);
    setPrecioProveedor(Number(detalle.d_PrecioProveedor) || 0);
    setNoCotizacionProv(detalle.v_NoCotizacionProv || "");
    setNoOrdenCompraProv(detalle.v_NoOrdenCompraProv || "");

    // 5. Inicializar Sesiones (valor inicial 1 sesión)
    const cantHoras = detalle.i_Cantidad || 1;
    const nSes = 1;
    setNumSesiones(nSes);

    const todayStr = new Date().toISOString().split("T")[0];
    const defaultAreaId = detalle.i_CveArea ? String(detalle.i_CveArea) : "";

    const initSesiones = generarSesiones(cantHoras, nSes, [], defaultAreaId, todayStr);
    setSesiones(initSesiones);
  }, [abierto, detalle]);

  // Al cambiar el número de sesiones
  const handleCambiarNumSesiones = (nuevoNum: number) => {
    if (!detalle) return;
    const n = Math.max(1, nuevoNum);
    setNumSesiones(n);

    const cantHoras = detalle.i_Cantidad || 1;
    const todayStr = new Date().toISOString().split("T")[0];
    const defaultAreaId = detalle.i_CveArea ? String(detalle.i_CveArea) : "";

    setSesiones((prev) => {
      return generarSesiones(cantHoras, n, prev, defaultAreaId, todayStr);
    });
  };

  // Actualizar campo de una sesión
  const handleUpdateSesion = (idx: number, field: keyof SesionRowState, value: string) => {
    setSesiones((prev) => {
      return prev.map((s, i) => {
        if (i !== idx) return s;
        const updated = { ...s, [field]: value };
        if (field === "horaInicio") {
          const duracionMins = calcularDiferenciaMinutos(s.horaInicio, s.horaFin);
          updated.horaFin = sumarMinutosAHorario(value, duracionMins);
        }
        return updated;
      });
    });
  };

  // Identificar si el apoyo seleccionado es proveedor
  const esProveedorApoyo = apoyoId.startsWith("prov_");
  const provSeleccionado = useMemo(() => {
    if (!esProveedorApoyo) return null;
    return listaProveedores.find((p) => p.id === apoyoId) || null;
  }, [esProveedorApoyo, apoyoId, listaProveedores]);

  // Cálculos financieros para Paso 2
  const cantidadTotal = detalle?.i_Cantidad || 1;
  const precioSinIVA = cantidadTotal * precioUnitario;
  const costoItemSinIVA = esProveedorApoyo ? cantidadTotal * precioProveedor : 0;
  const totalSinIVA = precioSinIVA;
  const totalCostos = costoItemSinIVA;
  const totalUtilidad = totalSinIVA - totalCostos;

  const totalConIVA = totalSinIVA * (1 + IVA);
  const totalCostosConIVA = totalCostos * (1 + IVA);
  const utilidadConIVA = totalConIVA - totalCostosConIVA;
  const margenPorcentaje = totalSinIVA > 0 ? (totalUtilidad / totalSinIVA) * 100 : 0;

  if (!abierto || !detalle) return null;

  // Validación para avanzar al paso 2
  const handleSiguiente = () => {
    if (esCapacitacion && (!titularId || titularId === "NA")) {
      toast.warning("Selecciona un instructor titular.");
      return;
    }

    if (esCapacitacion && titularId && apoyoId && titularId === apoyoId) {
      toast.warning("No puedes elegir al mismo instructor como titular y apoyo.");
      return;
    }

    for (let i = 0; i < sesiones.length; i++) {
      const s = sesiones[i];
      if (!s.fecha) {
        toast.warning(`Selecciona la fecha para la Sesión ${i + 1}.`);
        return;
      }
      if (bTipoDatoManejaHorario) {
        if (!s.horaInicio || !s.horaFin) {
          toast.warning(`Ingresa el horario completo para la Sesión ${i + 1}.`);
          return;
        }
        if (s.horaFin <= s.horaInicio) {
          toast.warning(`La hora fin de la Sesión ${i + 1} debe ser posterior a la hora inicio.`);
          return;
        }
      }
    }

    setPasoActual(2);
    setPasoMaximoAlcanzado(2);
  };

  // Guardar definitivamente
  const handleGuardar = async () => {
    if (!detalle) return;

    let cveTitular: number | null = null;
    if (esCapacitacion && titularId && titularId.startsWith("ins_")) {
      cveTitular = Number(titularId.replace("ins_", "")) || null;
    }

    let cveApoyo: number | null = null;
    let esProvApoyo = false;
    if (apoyoId && apoyoId !== "NA") {
      if (apoyoId.startsWith("prov_")) {
        cveApoyo = Number(apoyoId.replace("prov_", "")) || null;
        esProvApoyo = true;
      } else if (apoyoId.startsWith("ins_")) {
        cveApoyo = Number(apoyoId.replace("ins_", "")) || null;
        esProvApoyo = false;
      }
    }

    const payload: ProgramarServicioDto = {
      i_CveServAgendaDet: detalle.i_CveServAgendaDet,
      i_CveAgenda: detalle.i_CveAgenda,
      i_CveTitular: cveTitular,
      i_CveApoyo: cveApoyo,
      b_TipoProvInsApoyo: esProvApoyo,
      i_NumAlumnos: esCapacitacion && tipoCupo === "Limitado" ? Number(cupoAlumnos) || null : null,
      v_NoCotizacionGI: noCotizacionGI.trim() || null,
      v_NoOrdenCompraCliente: noOrdenCompraCliente.trim() || null,
      d_PrecioUnitario: Number(precioUnitario) || null,
      d_PrecioProveedor: esProvApoyo ? Number(precioProveedor) || null : null,
      v_NoCotizacionProv: esProvApoyo ? noCotizacionProv.trim() || null : null,
      v_NoOrdenCompraProv: esProvApoyo ? noOrdenCompraProv.trim() || null : null,
      Sesiones: sesiones.map((ses, idx) => ({
        i_Orden: idx + 1,
        d_FechaHoraInicio: bTipoDatoManejaHorario
          ? `${ses.fecha}T${ses.horaInicio}:00`
          : `${ses.fecha}T00:00:00`,
        d_FechaHoraFin: bTipoDatoManejaHorario
          ? `${ses.fecha}T${ses.horaFin}:00`
          : `${ses.fecha}T23:59:59`,
        i_CveArea: ses.i_CveArea ? Number(ses.i_CveArea) : null,
      })),
    };

    setGuardando(true);
    try {
      const res = await AgendaService.programarServicio(payload);
      if (res.exito || res.status === 200) {
        toast.success("Servicio programado");
        if (onGuardadoExitoso) onGuardadoExitoso();
        onCerrar();
      } else if (res.status === 409) {
        toast.warning(res.mensaje || "Conflicto al programar el servicio.");
      } else {
        toast.error(res.mensaje || "Error al programar el servicio.");
      }
    } catch {
      toast.error("Ocurrió un error inesperado al programar el servicio.");
    } finally {
      setGuardando(false);
    }
  };

  const getNombreInstructor = (ins: any): string => {
    const cve = ins.i_CveInstructor ?? ins.iD_Instructor ?? ins.id_instructor ?? ins.iCveInstructor;
    return (
      ins.v_NombreCompleto ||
      ins.v_NombreTitular ||
      `${ins.v_Nombre || ""} ${ins.v_ApPaterno || ""}`.trim() ||
      `Instructor #${cve}`
    );
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        backdropFilter: "blur(4px)",
        zIndex: 1050,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
      }}
    >
      <div
        className="no-scrollbar"
        style={{
          maxWidth: "1080px",
          width: "100%",
          maxHeight: "98vh",
          backgroundColor: "#ffffff",
          borderRadius: "14px",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          scrollbarWidth: "none",
          msOverflowStyle: "none",
        }}
      >
        {/* HEADER MODAL */}
        <div
          style={{
            padding: "12px 24px",
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
                Programar servicio
              </h3>
              <span style={{ fontSize: "12px", color: "#6c757d" }}>
                <strong>{detalle.v_Empresa || "—"}</strong>
                {detalle.v_Planta ? ` · ${detalle.v_Planta}` : ""} · {detalle.v_Servicio || "—"}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onCerrar}
            style={{
              background: "none",
              border: "none",
              color: "#7a96b0",
              cursor: "pointer",
              padding: "4px",
              borderRadius: "6px",
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* BARRA DE PASOS (2 PASOS) */}
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
              gridTemplateColumns: "repeat(2, 1fr)",
              position: "relative",
              maxWidth: "400px",
              margin: "0 auto",
            }}
          >
            {/* Línea horizontal de fondo */}
            <div
              style={{
                position: "absolute",
                top: "15px",
                left: "25%",
                width: "50%",
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
                left: "25%",
                width: pasoActual === 1 ? "0%" : "50%",
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
                  boxShadow:
                    pasoActual === 1 ? "0 0 0 4px rgba(13, 110, 253, 0.2)" : "none",
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
                Agendar sesiones
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
                else handleSiguiente();
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
                  boxShadow:
                    pasoActual === 2 ? "0 0 0 4px rgba(13, 110, 253, 0.2)" : "none",
                  transition: "all 0.2s ease",
                }}
              >
                2
              </div>
              <span
                style={{
                  fontSize: "12px",
                  marginTop: "6px",
                  fontWeight: pasoActual === 2 ? 700 : 500,
                  color: pasoActual === 2 ? "#0d6efd" : "#6c757d",
                }}
              >
                Datos de venta
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
            padding: "16px 24px",
            minHeight: "420px",
            backgroundColor: "#ffffff",
          }}
        >
          {cargandoCatalogos ? (
            <div style={{ textAlign: "center", padding: "60px 0", color: "#64748b", fontSize: "13px" }}>
              Cargando información del servicio...
            </div>
          ) : (
            <>
              {/* ============================================================== */}
              {/* PASO 1: AGENDAR SESIONES */}
              {/* ============================================================== */}
              {pasoActual === 1 && (
                <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                  <div
                    style={{
                      border: `1px solid ${config.colorBorder}`,
                      borderRadius: "10px",
                      padding: "14px",
                      backgroundColor: config.bg,
                      boxShadow: "0 1px 4px rgba(0, 0, 0, 0.03)",
                    }}
                  >
                    {/* Encabezado de la card del servicio */}
                    <div
                      style={{
                        fontSize: "13px",
                        fontWeight: 700,
                        color: config.colorText,
                        paddingBottom: "8px",
                        borderBottom: `1px solid ${config.colorBorder}40`,
                        marginBottom: "12px",
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                      }}
                    >
                      {detalle.v_Servicio} ({detalle.i_Cantidad} {detalle.v_Unidad || "horas"})
                    </div>

                    {/* 1. Fila de Cupo de alumnos y Número de sesiones */}
                    {(esCapacitacion || esUnidadHoras) && (
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: "16px",
                          marginBottom: "12px",
                          flexWrap: "wrap",
                        }}
                      >
                        {/* Cupo de alumnos (solo Capacitación) */}
                        {esCapacitacion ? (
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "10px",
                              fontSize: "12px",
                            }}
                          >
                            <label
                              style={{
                                fontWeight: 700,
                                color: "#4a6580",
                                margin: 0,
                              }}
                            >
                              Cupo de alumnos:
                            </label>
                            <select
                              className="form-select"
                              style={{
                                height: "30px",
                                fontSize: "12px",
                                borderRadius: "6px",
                                border: "1px solid #d0dce8",
                                width: "110px",
                                padding: "2px 8px",
                              }}
                              value={tipoCupo}
                              onChange={(e) =>
                                setTipoCupo(e.target.value as "Abierto" | "Limitado")
                              }
                            >
                              <option value="Abierto">Abierto</option>
                              <option value="Limitado">Limitado</option>
                            </select>

                            {tipoCupo === "Limitado" && (
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "6px",
                                }}
                              >
                                <input
                                  type="number"
                                  min={1}
                                  className="form-control"
                                  style={{
                                    height: "30px",
                                    fontSize: "12px",
                                    borderRadius: "6px",
                                    border: "1px solid #d0dce8",
                                    width: "70px",
                                    padding: "2px 6px",
                                  }}
                                  value={cupoAlumnos}
                                  onChange={(e) =>
                                    setCupoAlumnos(Math.max(1, Number(e.target.value)))
                                  }
                                />
                                <span style={{ color: "#64748b" }}>alumnos</span>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div />
                        )}

                        {/* Número de sesiones (solo cuando la unidad sea horas) */}
                        {esUnidadHoras && (
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "10px",
                              fontSize: "12px",
                            }}
                          >
                            <label
                              style={{
                                fontWeight: 700,
                                color: "#4a6580",
                                margin: 0,
                              }}
                            >
                              Número de sesiones:
                            </label>
                            <input
                              type="number"
                              min={1}
                              max={50}
                              className="form-control"
                              style={{
                                height: "30px",
                                fontSize: "12px",
                                borderRadius: "6px",
                                border: "1px solid #d0dce8",
                                width: "70px",
                                padding: "2px 6px",
                                textAlign: "center",
                              }}
                              value={numSesiones}
                              onChange={(e) => {
                                const val = Math.max(1, parseInt(e.target.value, 10) || 1);
                                handleCambiarNumSesiones(val);
                              }}
                            />
                            <span style={{ color: "#64748b" }}>
                              {numSesiones === 1 ? "sesión" : "sesiones"}
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* 2. Panel de Instructores / Apoyo General */}
                    <div
                      style={{
                        backgroundColor: "#f8fafc",
                        border: "1px solid #e2e8f0",
                        borderRadius: "8px",
                        padding: "12px 14px",
                        marginBottom: "12px",
                      }}
                    >
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns:
                            tipoId === 2
                              ? "repeat(auto-fit, minmax(200px, 1fr))"
                              : "1fr",
                          gap: "12px",
                          alignItems: "start",
                        }}
                      >
                        {/* Titular (solo capacitación) */}
                        {tipoId === 2 && (
                          <div>
                            <label
                              style={{
                                fontSize: "11px",
                                fontWeight: 700,
                                color: "#475569",
                                marginBottom: "4px",
                                display: "block",
                              }}
                            >
                              Titular <span style={{ color: "#dc3545" }}>*</span>
                            </label>
                            <select
                              className="form-select"
                              style={{
                                height: "32px",
                                fontSize: "12px",
                                borderRadius: "6px",
                                border: "1px solid #cbd5e1",
                              }}
                              value={titularId}
                              onChange={(e) => setTitularId(e.target.value)}
                            >
                              <option value="">— Seleccionar titular —</option>
                              {instructores.map((ins: any) => {
                                const cve =
                                  ins.i_CveInstructor ??
                                  ins.iD_Instructor ??
                                  ins.id_instructor;
                                const nombre = getNombreInstructor(ins);
                                const disabled = apoyoId === `ins_${cve}`;
                                return (
                                  <option
                                    key={cve}
                                    value={`ins_${cve}`}
                                    disabled={disabled}
                                  >
                                    {nombre}
                                  </option>
                                );
                              })}
                            </select>
                          </div>
                        )}

                        {/* Apoyo / Proveedor */}
                        <div>
                          <label
                            style={{
                              fontSize: "11px",
                              fontWeight: 700,
                              color: "#475569",
                              marginBottom: "4px",
                              display: "block",
                            }}
                          >
                            Apoyo / Proveedor
                          </label>
                          <select
                            className="form-select"
                            style={{
                              height: "32px",
                              fontSize: "12px",
                              borderRadius: "6px",
                              border: "1px solid #cbd5e1",
                            }}
                            value={apoyoId}
                            onChange={(e) => setApoyoId(e.target.value)}
                          >
                            <option value="NA">N/A</option>
                            <optgroup label="Instructores">
                              {instructores.map((ins: any) => {
                                const cve =
                                  ins.i_CveInstructor ??
                                  ins.iD_Instructor ??
                                  ins.id_instructor;
                                const nombre = getNombreInstructor(ins);
                                const disabled =
                                  tipoId === 2 && titularId === `ins_${cve}`;
                                return (
                                  <option
                                    key={cve}
                                    value={`ins_${cve}`}
                                    disabled={disabled}
                                  >
                                    {nombre}
                                  </option>
                                );
                              })}
                            </optgroup>
                            <optgroup label="Proveedores">
                              {listaProveedores.map((prv) => (
                                <option key={prv.id} value={prv.id}>
                                  {prv.nombre}
                                </option>
                              ))}
                            </optgroup>
                          </select>
                        </div>

                        {/* Precio p/unidad s/IVA ($) si es Proveedor */}
                        {esProveedorApoyo && (
                          <div>
                            <label
                              style={{
                                fontSize: "11px",
                                fontWeight: 700,
                                color: "#475569",
                                marginBottom: "4px",
                                display: "block",
                              }}
                            >
                              Precio p/unidad s/IVA ($)
                            </label>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              className="form-control form-control-sm"
                              style={{
                                height: "30px",
                                fontSize: "12px",
                                borderRadius: "6px",
                                border: "1px solid #cbd5e1",
                                width: "100%",
                              }}
                              value={precioProveedor ?? ""}
                              onChange={(e) =>
                                setPrecioProveedor(Math.max(0, Number(e.target.value)))
                              }
                            />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* 3. Tabla de Sesiones Stacked */}
                    <div
                      className="custom-scrollbar"
                      style={{
                        border: "1px solid #d8e6f0",
                        borderRadius: "8px",
                        overflow: "hidden",
                        backgroundColor: "#ffffff",
                      }}
                    >
                      <table
                        style={{
                          width: "100%",
                          borderCollapse: "collapse",
                          fontSize: "12px",
                        }}
                      >
                        <thead>
                          <tr
                            style={{
                              backgroundColor: "#edf4fa",
                              borderBottom: "1px solid #d8e6f0",
                              color: "#1e3a5f",
                              textAlign: "left",
                            }}
                          >
                            <th
                              style={{
                                padding: "8px 12px",
                                fontWeight: 700,
                                width: "110px",
                              }}
                            >
                              Sesión
                            </th>
                            <th
                              style={{
                                padding: "8px 12px",
                                fontWeight: 700,
                              }}
                            >
                              Fecha
                            </th>
                            {bTipoDatoManejaHorario && (
                              <>
                                <th
                                  style={{
                                    padding: "8px 12px",
                                    fontWeight: 700,
                                    width: "130px",
                                  }}
                                >
                                  Hora inicio
                                </th>
                                <th
                                  style={{
                                    padding: "8px 12px",
                                    fontWeight: 700,
                                    width: "130px",
                                  }}
                                >
                                  Hora fin
                                </th>
                              </>
                            )}
                            <th
                              style={{
                                padding: "8px 12px",
                                fontWeight: 700,
                                width: "220px",
                              }}
                            >
                              Área / Sala
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {sesiones.map((ses, sIdx) => (
                            <tr
                              key={`prog-ses-${sIdx}`}
                              style={{
                                borderBottom:
                                  sIdx === sesiones.length - 1
                                    ? "none"
                                    : "1px solid #edf2f7",
                              }}
                            >
                              <td
                                style={{
                                  padding: "8px 12px",
                                  verticalAlign: "middle",
                                }}
                              >
                                <span
                                  style={{
                                    fontWeight: 600,
                                    color: "#1e3a5f",
                                  }}
                                >
                                  Sesión {sIdx + 1}
                                </span>
                              </td>
                              <td
                                style={{
                                  padding: "8px 12px",
                                  verticalAlign: "middle",
                                }}
                              >
                                <InputFechaTexto
                                  height="30px"
                                  value={ses.fecha}
                                  onChange={(val) =>
                                    handleUpdateSesion(sIdx, "fecha", val)
                                  }
                                />
                              </td>
                              {bTipoDatoManejaHorario && (
                                <>
                                  <td
                                    style={{
                                      padding: "8px 12px",
                                      verticalAlign: "middle",
                                    }}
                                  >
                                    <select
                                      className="form-select"
                                      style={{
                                        height: "30px",
                                        fontSize: "12px",
                                        borderRadius: "6px",
                                        border: "1px solid #d0dce8",
                                        padding: "2px 6px",
                                      }}
                                      value={ses.horaInicio}
                                      onChange={(e) =>
                                        handleUpdateSesion(
                                          sIdx,
                                          "horaInicio",
                                          e.target.value
                                        )
                                      }
                                    >
                                      {HORAS_OPCIONES.map((h) => (
                                        <option key={h} value={h}>
                                          {h}
                                        </option>
                                      ))}
                                    </select>
                                  </td>
                                  <td
                                    style={{
                                      padding: "8px 12px",
                                      verticalAlign: "middle",
                                    }}
                                  >
                                    <select
                                      className="form-select"
                                      style={{
                                        height: "30px",
                                        fontSize: "12px",
                                        borderRadius: "6px",
                                        border: "1px solid #d0dce8",
                                        padding: "2px 6px",
                                      }}
                                      value={ses.horaFin}
                                      onChange={(e) =>
                                        handleUpdateSesion(
                                          sIdx,
                                          "horaFin",
                                          e.target.value
                                        )
                                      }
                                    >
                                      {(() => {
                                        let options = HORAS_OPCIONES.filter(
                                          (h) => h > ses.horaInicio
                                        );
                                        if (
                                          ses.horaFin &&
                                          !options.includes(ses.horaFin)
                                        ) {
                                          options = Array.from(
                                            new Set([...options, ses.horaFin])
                                          ).sort();
                                        }
                                        return options.map((h) => (
                                          <option key={h} value={h}>
                                            {h}
                                          </option>
                                        ));
                                      })()}
                                    </select>
                                  </td>
                                </>
                              )}
                              <td
                                style={{
                                  padding: "8px 12px",
                                  verticalAlign: "middle",
                                }}
                              >
                                <select
                                  className="form-select"
                                  style={{
                                    height: "30px",
                                    fontSize: "12px",
                                    borderRadius: "6px",
                                    border: "1px solid #d0dce8",
                                    padding: "2px 6px",
                                  }}
                                  value={ses.i_CveArea}
                                  onChange={(e) =>
                                    handleUpdateSesion(
                                      sIdx,
                                      "i_CveArea",
                                      e.target.value
                                    )
                                  }
                                >
                                  <option value="">— Sin área —</option>
                                  {areas.map((a: any) => {
                                    const cve =
                                      a.i_CveArea ?? a.iD_Area ?? a.id_area;
                                    const nombre =
                                      a.v_NombreArea ||
                                      a.v_Nombre ||
                                      `Área #${cve}`;
                                    return (
                                      <option key={cve} value={cve}>
                                        {nombre}
                                      </option>
                                    );
                                  })}
                                </select>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* ============================================================== */}
              {/* PASO 2: DATOS DE VENTA */}
              {/* ============================================================== */}
              {pasoActual === 2 && (
                <div>
                  {/* TABLA DE PRECIOS Y COSTOS (EXACTA A PASO 3 DE AGENDAR SERVICIO) */}
                  <div
                    className="custom-scrollbar"
                    style={{
                      maxHeight: "360px",
                      overflowY: "auto",
                      border: "1px solid #d0dce8",
                      borderRadius: "8px",
                      backgroundColor: "#ffffff",
                    }}
                  >
                    <table
                      style={{
                        width: "100%",
                        borderCollapse: "collapse",
                        fontSize: "12px",
                      }}
                    >
                      <thead>
                        <tr
                          style={{
                            backgroundColor: "#f4f8fa",
                            borderBottom: "1px solid #d0dce8",
                            color: "#1e3a5f",
                            textAlign: "left",
                            position: "sticky",
                            top: 0,
                            zIndex: 2,
                          }}
                        >
                          <th style={{ padding: "10px 12px", fontWeight: 700 }}>
                            Servicio
                          </th>
                          <th style={{ padding: "10px 8px", fontWeight: 700, width: "65px", textAlign: "center" }}>
                            Cant.
                          </th>
                          <th style={{ padding: "10px 10px", fontWeight: 700, width: "115px" }}>
                            Precio unitario
                          </th>
                          <th style={{ padding: "10px 10px", fontWeight: 700, width: "130px" }}>
                            No. cot. GI
                          </th>
                          <th style={{ padding: "10px 10px", fontWeight: 700, width: "130px" }}>
                            No. OC cliente
                          </th>
                          <th style={{ padding: "10px 10px", fontWeight: 700, width: "140px" }}>
                            Proveedor
                          </th>
                          <th style={{ padding: "10px 10px", fontWeight: 700, width: "120px" }}>
                            No. cot. prov.
                          </th>
                          <th style={{ padding: "10px 10px", fontWeight: 700, width: "120px" }}>
                            No. OC prov.
                          </th>
                          <th style={{ padding: "10px 10px", fontWeight: 700, width: "110px", textAlign: "right" }}>
                            Precio s/IVA
                          </th>
                          <th style={{ padding: "10px 10px", fontWeight: 700, width: "115px", textAlign: "right" }}>
                            Costo total s/IVA
                          </th>
                          <th style={{ padding: "10px 10px", fontWeight: 700, width: "100px", textAlign: "right" }}>
                            Utilidad
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr style={{ borderBottom: "1px solid #edf2f7" }}>
                          {/* Servicio */}
                          <td style={{ padding: "8px 12px", verticalAlign: "middle" }}>
                            <span style={{ fontWeight: 600, color: "#1e3a5f" }}>
                              {detalle.v_Servicio}
                            </span>
                          </td>

                          {/* Cantidad */}
                          <td style={{ padding: "8px 8px", textAlign: "center", verticalAlign: "middle" }}>
                            <span style={{ fontWeight: 600 }}>{cantidadTotal}</span>
                          </td>

                          {/* Precio unitario */}
                          <td style={{ padding: "8px 10px", verticalAlign: "middle" }}>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              className="form-control"
                              style={{
                                height: "30px",
                                padding: "2px 6px",
                                fontSize: "12px",
                                borderRadius: "6px",
                                border: "1px solid #d0dce8",
                                width: "100%",
                              }}
                              value={precioUnitario || ""}
                              placeholder="0.00"
                              onChange={(e) =>
                                setPrecioUnitario(Math.max(0, Number(e.target.value)))
                              }
                            />
                          </td>

                          {/* No. cot. GI */}
                          <td style={{ padding: "8px 10px", verticalAlign: "middle" }}>
                            <input
                              type="text"
                              className="form-control"
                              style={{
                                height: "30px",
                                padding: "2px 6px",
                                fontSize: "12px",
                                borderRadius: "6px",
                                border: "1px solid #d0dce8",
                                width: "100%",
                              }}
                              value={noCotizacionGI}
                              placeholder="Cot. GI..."
                              onChange={(e) => setNoCotizacionGI(e.target.value)}
                            />
                          </td>

                          {/* No. OC cliente */}
                          <td style={{ padding: "8px 10px", verticalAlign: "middle" }}>
                            <input
                              type="text"
                              className="form-control"
                              style={{
                                height: "30px",
                                padding: "2px 6px",
                                fontSize: "12px",
                                borderRadius: "6px",
                                border: "1px solid #d0dce8",
                                width: "100%",
                              }}
                              value={noOrdenCompraCliente}
                              placeholder="OC cliente..."
                              onChange={(e) => setNoOrdenCompraCliente(e.target.value)}
                            />
                          </td>

                          {/* Proveedor */}
                          <td style={{ padding: "8px 10px", fontSize: "12px", color: "#334155", verticalAlign: "middle" }}>
                            {esProveedorApoyo ? (
                              <span style={{ fontWeight: 600, color: "#1e3a5f" }}>
                                {provSeleccionado?.nombre || "Proveedor"}
                              </span>
                            ) : (
                              ""
                            )}
                          </td>

                          {/* No. cot. prov. */}
                          <td style={{ padding: "8px 10px", verticalAlign: "middle" }}>
                            {esProveedorApoyo ? (
                              <input
                                type="text"
                                className="form-control"
                                style={{
                                  height: "30px",
                                  padding: "2px 6px",
                                  fontSize: "12px",
                                  borderRadius: "6px",
                                  border: "1px solid #d0dce8",
                                  width: "100%",
                                }}
                                placeholder="No. cot. prov."
                                value={noCotizacionProv}
                                onChange={(e) => setNoCotizacionProv(e.target.value)}
                              />
                            ) : (
                              ""
                            )}
                          </td>

                          {/* No. OC prov. */}
                          <td style={{ padding: "8px 10px", verticalAlign: "middle" }}>
                            {esProveedorApoyo ? (
                              <input
                                type="text"
                                className="form-control"
                                style={{
                                  height: "30px",
                                  padding: "2px 6px",
                                  fontSize: "12px",
                                  borderRadius: "6px",
                                  border: "1px solid #d0dce8",
                                  width: "100%",
                                }}
                                placeholder="No. OC prov."
                                value={noOrdenCompraProv}
                                onChange={(e) => setNoOrdenCompraProv(e.target.value)}
                              />
                            ) : (
                              ""
                            )}
                          </td>

                          {/* Precio s/IVA */}
                          <td style={{ padding: "8px 10px", textAlign: "right", fontWeight: 600, color: "#1e3a5f", verticalAlign: "middle" }}>
                            ${formatearMoneda(precioSinIVA)}
                          </td>

                          {/* Costo total s/IVA */}
                          <td style={{ padding: "8px 10px", textAlign: "right", verticalAlign: "middle" }}>
                            <span style={{ fontWeight: 600, color: "#dc3545" }}>
                              ${formatearMoneda(costoItemSinIVA)}
                            </span>
                          </td>

                          {/* Utilidad */}
                          <td
                            style={{
                              padding: "8px 10px",
                              textAlign: "right",
                              fontWeight: 700,
                              color: totalUtilidad >= 0 ? "#198754" : "#dc3545",
                              verticalAlign: "middle",
                            }}
                          >
                            ${formatearMoneda(totalUtilidad)}
                          </td>
                        </tr>
                      </tbody>
                      <tfoot
                        style={{
                          position: "sticky",
                          bottom: 0,
                          zIndex: 5,
                          backgroundColor: "#f8fafc",
                        }}
                      >
                        <tr style={{ backgroundColor: "#f8fafc", borderTop: "2px solid #cbd5e1" }}>
                          <td colSpan={8} style={{ padding: "10px 12px", fontWeight: 700, color: "#1e3a5f", backgroundColor: "#f8fafc" }}>
                            Total sin IVA
                          </td>
                          <td style={{ padding: "10px 10px", textAlign: "right", fontWeight: 700, color: "#1e3a5f", backgroundColor: "#f8fafc" }}>
                            ${formatearMoneda(totalSinIVA)}
                          </td>
                          <td style={{ padding: "10px 10px", textAlign: "right", fontWeight: 700, color: "#dc3545", backgroundColor: "#f8fafc" }}>
                            ${formatearMoneda(totalCostos)}
                          </td>
                          <td style={{ padding: "10px 10px", textAlign: "right", fontWeight: 700, color: totalUtilidad >= 0 ? "#198754" : "#dc3545", backgroundColor: "#f8fafc" }}>
                            ${formatearMoneda(totalUtilidad)}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>

                  {/* 3.3 Resumen Final (Todos con IVA) */}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(3, 1fr)",
                      gap: "14px",
                      marginTop: "16px",
                    }}
                  >
                    <div>
                      <label style={{ fontSize: "11px", fontWeight: 700, color: "#4a6580", display: "block", marginBottom: "4px" }}>
                        Total c/IVA
                      </label>
                      <input
                        type="text"
                        readOnly
                        className="form-control"
                        style={{
                          height: "36px",
                          borderRadius: "8px",
                          backgroundColor: "#e9ecef",
                          color: "#1e3a5f",
                          fontWeight: 700,
                          fontSize: "13px",
                        }}
                        value={`$ ${formatearMoneda(totalConIVA)} MXN`}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: "11px", fontWeight: 700, color: "#4a6580", display: "block", marginBottom: "4px" }}>
                        Total Costos c/IVA
                      </label>
                      <input
                        type="text"
                        readOnly
                        className="form-control"
                        style={{
                          height: "36px",
                          borderRadius: "8px",
                          backgroundColor: "#e9ecef",
                          color: "#dc3545",
                          fontWeight: 700,
                          fontSize: "13px",
                        }}
                        value={`$ ${formatearMoneda(totalCostosConIVA)} MXN`}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: "11px", fontWeight: 700, color: "#4a6580", display: "block", marginBottom: "4px" }}>
                        Total Utilidad
                      </label>
                      <input
                        type="text"
                        readOnly
                        className="form-control"
                        style={{
                          height: "36px",
                          borderRadius: "8px",
                          backgroundColor: "#e9ecef",
                          color: totalUtilidad >= 0 ? "#198754" : "#dc3545",
                          fontWeight: 700,
                          fontSize: "13px",
                        }}
                        value={`$ ${formatearMoneda(totalUtilidad)} MXN`}
                      />
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* FOOTER MODAL */}
        <div
          style={{
            padding: "12px 24px",
            borderTop: "1px solid #ddeaf5",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            backgroundColor: "#f8fafc",
          }}
        >
          <button
            type="button"
            onClick={onCerrar}
            disabled={guardando}
            style={{
              height: "36px",
              padding: "0 18px",
              borderRadius: "20px",
              border: "1px solid #d0dce8",
              backgroundColor: "#ffffff",
              color: "#64748b",
              fontSize: "13px",
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            Cerrar
          </button>

          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            {pasoActual > 1 && (
              <button
                type="button"
                onClick={() => setPasoActual(1)}
                disabled={guardando}
                style={{
                  height: "36px",
                  padding: "0 18px",
                  borderRadius: "20px",
                  border: "1px solid #d0dce8",
                  backgroundColor: "#ffffff",
                  color: "#1e3a5f",
                  fontSize: "13px",
                  fontWeight: 500,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <ChevronLeft size={16} />
                <span>Anterior</span>
              </button>
            )}

            {pasoActual === 1 ? (
              <button
                type="button"
                onClick={handleSiguiente}
                style={{
                  height: "36px",
                  padding: "0 22px",
                  borderRadius: "20px",
                  backgroundColor: "#2B8FCC",
                  color: "#ffffff",
                  border: "none",
                  fontSize: "13px",
                  fontWeight: 500,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <span>Siguiente</span>
                <ChevronRight size={16} />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleGuardar}
                disabled={guardando || cargandoCatalogos}
                style={{
                  height: "36px",
                  padding: "0 22px",
                  borderRadius: "20px",
                  backgroundColor: "#198754",
                  color: "#ffffff",
                  border: "none",
                  fontSize: "13px",
                  fontWeight: 500,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <Check size={16} />
                <span>{guardando ? "Guardando..." : "Programar servicio"}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModalProgramarServicio;
