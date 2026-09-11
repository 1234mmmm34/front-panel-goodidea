"use client";

import React, { useEffect, useState, useRef, useMemo } from "react";
import {
  X,
  Check,
  Building2,
  Factory,
  Search,
  Trash2,
  AlertCircle,
  ChevronRight,
  ChevronLeft,
  Send,
  Clock,
  HelpCircle,
  Calendar,
} from "lucide-react";
import { EmpresaGetDto, PlantaGetDto, ContactoXEmpresa } from "@/types/empresas";
import {
  ServiciosDropdownDto,
  InstructorGetDto,
  ProveedorGetDto,
  AreaGetDto,
  RangoFechaDto,
  AgendaInsertDto,
  AgendaCabeceraInsertDto,
  ServicioAgendaDetalleInsertDto,
  SesionInsertDto,
  DatosVentaProveedorDto,
  AgendaEntregableInsertDto,
} from "@/types/servicios";
import { EmpresasService } from "@/services/empresas.service";
import { ServiciosService } from "@/services/servicios.service";
import { AgendaService } from "@/services/agenda.service";
import InputFechaTexto from "@/components/ui/InputFechaTexto";
import { formatearFechaTexto } from "@/lib/date-utils";
import { useToast } from "@/context/ToastContext";
import { ModalConfirmarAgenda } from "./ModalConfirmarAgenda";

interface ServicioAgregadoItem {
  idTemp: string;
  i_CveServicio: number;
  v_Nombre: string;
  i_CveTipoServicio: number;
  v_TipoServicio: string;
  v_Rubro: string;
  v_Unidad: string;
  cantidad: number;
  precioUnitario: number;
  sesiones: number; // 1-4, solo habilitado para Capacitación (2)
  noCotizacionGI: string;
  noOCCliente: string;
  costo: number;
}

export interface SesionProgramacionState {
  fecha: string;
  horaInicio: string;
  horaFin: string;
  areaSalaId: string;
}

export interface ProgramacionItemState {
  b_ProgramarDespues: boolean;
  v_TipoCupo: "Abierto" | "Limitado";
  i_CupoAlumnos: number;
  v_Titular: string;
  v_Apoyo: string;
  v_TipoApoyo: "Ninguno" | "Instructor" | "Proveedor";
  v_NoCotProveedor: string;
  v_NoOCProveedor: string;
  d_PrecioProveedor: number;
  d_FechaInicioEntrega: string;
  sesiones: SesionProgramacionState[];
}



const HORAS_OPCIONES: string[] = (() => {
  const arr: string[] = [];
  for (let h = 0; h < 24; h++) {
    const hh = h.toString().padStart(2, "0");
    arr.push(`${hh}:00`);
    arr.push(`${hh}:30`);
  }
  return arr;
})();

/**
 * Divide automáticamente la cantidad total de horas entre el número de sesiones.
 * Si al dividir queda residuo de horas, se le asigna a la última sesión.
 */
function calcularMinutosPorSesion(cantidadHorasTotal: number, numSesiones: number): number[] {
  const nSesiones = Math.max(1, numSesiones || 1);
  const totalMinutos = Math.max(1, Math.round((cantidadHorasTotal || 1) * 60));

  const minutosBase = Math.floor(totalMinutos / nSesiones);
  const residuoMinutos = totalMinutos - (minutosBase * nSesiones);

  const duraciones: number[] = [];
  for (let i = 0; i < nSesiones; i++) {
    const minsSesion = (i === nSesiones - 1) ? (minutosBase + residuoMinutos) : minutosBase;
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

function getTipoServicioId(item: ServicioAgregadoItem): number {
  if ([2, 3, 5, 6].includes(item.i_CveTipoServicio)) {
    return item.i_CveTipoServicio;
  }
  const tipoUpper = (item.v_TipoServicio || "").toUpperCase();
  if (tipoUpper.includes("CAPACITA")) return 2;
  if (tipoUpper.includes("ESTUDIO")) return 3;
  if (tipoUpper.includes("PRODUCTO")) return 5;
  return 6;
}

interface Props {
  abierto: boolean;
  onCerrar: () => void;
  onGuardadoExitoso?: () => void;
}

function formatearMoneda(monto: number): string {
  return monto.toLocaleString("es-MX", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export const ModalAgendaServicio: React.FC<Props> = ({
  abierto,
  onCerrar,
  onGuardadoExitoso,
}) => {
  const { toast } = useToast();
  // Wizard step state (3 steps)
  const [pasoActual, setPasoActual] = useState<number>(1);
  const [pasoMaximoAlcanzado, setPasoMaximoAlcanzado] = useState<number>(1);
  const [mostrarModalConfirmar, setMostrarModalConfirmar] = useState<boolean>(false);

  // State for Step 2 scheduling
  const [programacionMap, setProgramacionMap] = useState<
    Record<string, ProgramacionItemState>
  >({});

  // 1. SECCIÓN CLIENTE
  const [empresasCatalogo, setEmpresasCatalogo] = useState<EmpresaGetDto[]>([]);
  const [searchEmpresaText, setSearchEmpresaText] = useState<string>("");
  const [empresaSeleccionada, setEmpresaSeleccionada] = useState<EmpresaGetDto | null>(null);
  const [dropdownEmpresaAbierto, setDropdownEmpresaAbierto] = useState<boolean>(false);

  const [plantas, setPlantas] = useState<PlantaGetDto[]>([]);
  const [plantaSeleccionadaId, setPlantaSeleccionadaId] = useState<string>("");

  const [contactos, setContactos] = useState<ContactoXEmpresa[]>([]);
  const [contactoSeleccionadoId, setContactoSeleccionadoId] = useState<string>("");

  // 2. SECCIÓN SERVICIOS
  const [serviciosCatalogo, setServiciosCatalogo] = useState<ServiciosDropdownDto[]>([]);
  const [searchServicioText, setSearchServicioText] = useState<string>("");
  const [dropdownServicioAbierto, setDropdownServicioAbierto] = useState<boolean>(false);
  const [serviciosAgregados, setServiciosAgregados] = useState<ServicioAgregadoItem[]>([]);
  const [errorSinServicios, setErrorSinServicios] = useState<boolean>(false);

  // 3. SECCIÓN DATOS DE VENTA
  // Toggles independientes para Cotización GI y OC Cliente
  const [compartirCotizacion, setCompartirCotizacion] = useState<boolean>(false);
  const [compartirOC, setCompartirOC] = useState<boolean>(false);
  const [noCotizacionGlobal, setNoCotizacionGlobal] = useState<string>("");
  const [noOCGlobal, setNoOCGlobal] = useState<string>("");

  // 4. SECCIÓN AGENDAR SESIONES (Catálogos API Parte 1)
  const [instructoresCatalogo, setInstructoresCatalogo] = useState<InstructorGetDto[]>([]);
  const [proveedoresCatalogo, setProveedoresCatalogo] = useState<ProveedorGetDto[]>([]);
  const [areasCatalogo, setAreasCatalogo] = useState<AreaGetDto[]>([]);
  const [horasOcupadasMap, setHorasOcupadasMap] = useState<Record<string, string>>({});

  // Refs for click outside handling
  const containerEmpresaRef = useRef<HTMLDivElement>(null);
  const containerServicioRef = useRef<HTMLDivElement>(null);

  // Cargar catálogo inicial de empresas y servicios al abrir
  useEffect(() => {
    if (abierto) {
      setPasoActual(1);
      setPasoMaximoAlcanzado(1);
      setMostrarModalConfirmar(false);
      setEmpresaSeleccionada(null);
      setSearchEmpresaText("");
      setPlantas([]);
      setPlantaSeleccionadaId("");
      setContactos([]);
      setContactoSeleccionadoId("");
      setServiciosAgregados([]);
      setSearchServicioText("");
      setErrorSinServicios(false);
      setCompartirCotizacion(false);
      setCompartirOC(false);
      setNoCotizacionGlobal("");
      setNoOCGlobal("");
      setProgramacionMap({});
      setHorasOcupadasMap({});

      // Cargar empresas
      EmpresasService.getEmpresas().then((res) => {
        setEmpresasCatalogo(res || []);
      });

      // Cargar dropdown de servicios
      ServiciosService.getDropdown().then((res) => {
        setServiciosCatalogo(res || []);
      });

      // Cargar instructores y proveedores (2.1 y 2.2)
      AgendaService.getInstructores().then((res) => {
        if (res && res.length > 0) setInstructoresCatalogo(res);
      });
      AgendaService.getProveedores().then((res) => {
        if (res && res.length > 0) setProveedoresCatalogo(res);
      });
    }
  }, [abierto]);

  // Cargar áreas/salas (2.3) cuando cambia la planta elegida
  useEffect(() => {
    if (plantaSeleccionadaId && Number(plantaSeleccionadaId) > 0) {
      AgendaService.getAreas(Number(plantaSeleccionadaId)).then((res) => {
        if (res && res.length > 0) setAreasCatalogo(res);
        else setAreasCatalogo([]);
      });
    } else {
      setAreasCatalogo([]);
    }
  }, [plantaSeleccionadaId]);

  const listaInstructores = useMemo(() => {
    return instructoresCatalogo.map((ins) => ({
      id: `ins_${ins.i_CveInstructor}`,
      nombre: ins.v_NombreCompleto || ins.v_Nombre || `Instructor ${ins.i_CveInstructor}`,
      ocupado: Boolean(horasOcupadasMap[`ins_${ins.i_CveInstructor}`]),
      horarioOcupado: horasOcupadasMap[`ins_${ins.i_CveInstructor}`] || "",
    }));
  }, [instructoresCatalogo, horasOcupadasMap]);

  const listaProveedores = useMemo(() => {
    return proveedoresCatalogo.map((prv) => ({
      id: `prov_${prv.i_CveProveedor}`,
      nombre: prv.v_RazonSocial || prv.v_Nombre || `Proveedor ${prv.i_CveProveedor}`,
      ocupado: Boolean(horasOcupadasMap[`prov_${prv.i_CveProveedor}`]),
      horarioOcupado: horasOcupadasMap[`prov_${prv.i_CveProveedor}`] || "",
    }));
  }, [proveedoresCatalogo, horasOcupadasMap]);

  const listaSalas = useMemo(() => {
    if (areasCatalogo.length > 0) {
      return areasCatalogo.map((a) => ({
        id: `${a.i_CveArea}`,
        nombre: a.v_NombreArea || a.v_Nombre || `Área ${a.i_CveArea}`,
      }));
    }
    return [];
  }, [areasCatalogo]);

  const checkHorasOcupadas = async (personaId: string, fecha: string) => {
    if (!personaId || personaId === "NA" || !fecha) return;
    if (personaId.startsWith("ins_")) {
      const idRaw = Number(personaId.replace("ins_", ""));
      if (idRaw > 0) {
        const rangos = await AgendaService.getHorasOcupadasInstructor(idRaw, fecha);
        if (rangos && rangos.length > 0) {
          const texto = rangos
            .map((r) => {
              const ini = (r.d_FechaHoraInicio || r.FechaHoraInicio || "").split("T")[1]?.slice(0, 5) || "09:00";
              const fin = (r.d_FechaHoraFin || r.FechaHoraFin || "").split("T")[1]?.slice(0, 5) || "11:00";
              return `${ini} - ${fin}`;
            })
            .join(", ");
          setHorasOcupadasMap((prev) => ({ ...prev, [personaId]: texto }));
        } else {
          setHorasOcupadasMap((prev) => {
            const next = { ...prev };
            delete next[personaId];
            return next;
          });
        }
      }
    } else if (personaId.startsWith("prov_")) {
      const idRaw = Number(personaId.replace("prov_", ""));
      if (idRaw > 0) {
        const rangos = await AgendaService.getHorasOcupadasProveedor(idRaw, fecha);
        if (rangos && rangos.length > 0) {
          const texto = rangos
            .map((r) => {
              const ini = (r.d_FechaHoraInicio || r.FechaHoraInicio || "").split("T")[1]?.slice(0, 5) || "09:00";
              const fin = (r.d_FechaHoraFin || r.FechaHoraFin || "").split("T")[1]?.slice(0, 5) || "11:00";
              return `${ini} - ${fin}`;
            })
            .join(", ");
          setHorasOcupadasMap((prev) => ({ ...prev, [personaId]: texto }));
        } else {
          setHorasOcupadasMap((prev) => {
            const next = { ...prev };
            delete next[personaId];
            return next;
          });
        }
      }
    }
  };

  const handleFechaNonCapacitacionChange = async (itemTempId: string, val: string) => {
    updateProgState(itemTempId, { d_FechaInicioEntrega: val });

    if (val) {
      const rango: RangoFechaDto = {
        d_FechaHoraInicio: `${val}T00:00:00`,
        d_FechaHoraFin: `${val}T23:59:59`,
        FechaHoraInicio: `${val}T00:00:00`,
        FechaHoraFin: `${val}T23:59:59`,
      };
      const [insDisp, prvDisp] = await Promise.all([
        AgendaService.getInstructoresDisponibles([rango]),
        AgendaService.getProveedoresDisponibles([rango]),
      ]);
      if (insDisp && insDisp.length > 0) setInstructoresCatalogo(insDisp);
      if (prvDisp && prvDisp.length > 0) setProveedoresCatalogo(prvDisp);
    } else {
      AgendaService.getInstructores().then((res) => {
        if (res && res.length > 0) setInstructoresCatalogo(res);
      });
      AgendaService.getProveedores().then((res) => {
        if (res && res.length > 0) setProveedoresCatalogo(res);
      });
    }
  };

  // Click outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerEmpresaRef.current &&
        !containerEmpresaRef.current.contains(e.target as Node)
      ) {
        setDropdownEmpresaAbierto(false);
      }
      if (
        containerServicioRef.current &&
        !containerServicioRef.current.contains(e.target as Node)
      ) {
        setDropdownServicioAbierto(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Seleccionar empresa
  const handleSeleccionarEmpresa = (emp: EmpresaGetDto) => {
    setEmpresaSeleccionada(emp);
    setSearchEmpresaText(emp.s_RazonSocial || "");
    setDropdownEmpresaAbierto(false);

    // Reset Planta y Contacto al cambiar de empresa
    setPlantaSeleccionadaId("");
    setContactoSeleccionadoId("");

    // Cargar plantas y contactos para esta empresa
    EmpresasService.getPlantas(emp.iD_Empresa).then((res) => {
      setPlantas(res || []);
    });
    EmpresasService.getContactos(emp.iD_Empresa).then((res) => {
      setContactos(res || []);
    });
  };

  const handleLimpiarEmpresa = () => {
    setEmpresaSeleccionada(null);
    setSearchEmpresaText("");
    setPlantas([]);
    setPlantaSeleccionadaId("");
    setContactos([]);
    setContactoSeleccionadoId("");
    setDropdownEmpresaAbierto(true);
  };

  // Agregar servicio a la tabla
  const handleSeleccionarServicio = (srv: ServiciosDropdownDto) => {
    setErrorSinServicios(false);
    const nuevo: ServicioAgregadoItem = {
      idTemp: `${srv.i_CveServicio}_${Date.now()}`,
      i_CveServicio: srv.i_CveServicio,
      v_Nombre: srv.v_Nombre || "",
      i_CveTipoServicio: srv.i_CveTipoServicio,
      v_TipoServicio: srv.v_TipoServicio || "Servicio",
      v_Rubro: srv.v_Rubro || "—",
      v_Unidad: srv.v_Unidad || "Servicio",
      cantidad: srv.i_Cantidad || 1,
      precioUnitario: 0,
      sesiones: 1,
      noCotizacionGI: compartirCotizacion ? noCotizacionGlobal : "",
      noOCCliente: compartirOC ? noOCGlobal : "",
      costo: 0,
    };
    setServiciosAgregados((prev) => [...prev, nuevo]);
    setSearchServicioText("");
    setDropdownServicioAbierto(false);
  };

  const handleEliminarServicio = (idTemp: string) => {
    setServiciosAgregados((prev) => prev.filter((s) => s.idTemp !== idTemp));
  };

  const handleActualizarServicio = (
    idTemp: string,
    campo: keyof ServicioAgregadoItem,
    valor: any
  ) => {
    setServiciosAgregados((prev) =>
      prev.map((s) => {
        if (s.idTemp !== idTemp) return s;
        const nuevoItem = { ...s, [campo]: valor };

        if (campo === "cantidad" || campo === "sesiones") {
          const numSes = Math.max(1, nuevoItem.sesiones || 1);
          const duraciones = calcularMinutosPorSesion(nuevoItem.cantidad || 1, numSes);

          setProgramacionMap((prevProg) => {
            const currentProg = prevProg[idTemp];
            if (!currentProg) return prevProg;

            const todayStr = new Date().toISOString().split("T")[0];
            const prevSes = currentProg.sesiones || [];

            const nuevasSesiones: SesionProgramacionState[] = Array.from({ length: numSes }).map((_, idx) => {
              const existing = prevSes[idx];
              const fecha = existing?.fecha || todayStr;
              const horaInicio = existing?.horaInicio || "09:00";
              const horaFin = sumarMinutosAHorario(horaInicio, duraciones[idx]);
              return {
                fecha,
                horaInicio,
                horaFin,
                areaSalaId: existing?.areaSalaId || "1",
              };
            });

            return {
              ...prevProg,
              [idTemp]: {
                ...currentProg,
                sesiones: nuevasSesiones,
              },
            };
          });
        }

        return nuevoItem;
      })
    );
  };

  // Toggle compartir Cotización GI
  const handleToggleCompartirCotizacion = (activo: boolean) => {
    setCompartirCotizacion(activo);
    if (activo) {
      setServiciosAgregados((prev) =>
        prev.map((s) => ({
          ...s,
          noCotizacionGI: noCotizacionGlobal,
        }))
      );
    }
  };

  // Toggle compartir OC cliente
  const handleToggleCompartirOC = (activo: boolean) => {
    setCompartirOC(activo);
    if (activo) {
      setServiciosAgregados((prev) =>
        prev.map((s) => ({
          ...s,
          noOCCliente: noOCGlobal,
        }))
      );
    }
  };

  const handleCambiarCotizacionGlobal = (val: string) => {
    setNoCotizacionGlobal(val);
    if (compartirCotizacion) {
      setServiciosAgregados((prev) =>
        prev.map((s) => ({ ...s, noCotizacionGI: val }))
      );
    }
  };

  const handleCambiarOCGlobal = (val: string) => {
    setNoOCGlobal(val);
    if (compartirOC) {
      setServiciosAgregados((prev) =>
        prev.map((s) => ({ ...s, noOCCliente: val }))
      );
    }
  };

  // Helper functions for Step 2 programming state
  const getProgState = (item: ServicioAgregadoItem): ProgramacionItemState => {
    if (programacionMap[item.idTemp]) {
      return programacionMap[item.idTemp];
    }
    const todayStr = new Date().toISOString().split("T")[0];
    const numSesiones = Math.max(1, item.sesiones || 1);
    const duraciones = calcularMinutosPorSesion(item.cantidad || 1, numSesiones);

    const sesionesInit: SesionProgramacionState[] = Array.from({
      length: numSesiones,
    }).map((_, sIdx) => {
      const horaInicio = "09:00";
      const horaFin = sumarMinutosAHorario(horaInicio, duraciones[sIdx]);
      return {
        fecha: todayStr,
        horaInicio,
        horaFin,
        areaSalaId: "1",
      };
    });

    return {
      b_ProgramarDespues: false,
      v_TipoCupo: "Abierto",
      i_CupoAlumnos: 20,
      v_Titular: "ins_1",
      v_Apoyo: "NA",
      v_TipoApoyo: "Ninguno",
      v_NoCotProveedor: "",
      v_NoOCProveedor: "",
      d_PrecioProveedor: 0,
      d_FechaInicioEntrega: todayStr,
      sesiones: sesionesInit,
    };
  };

  const updateProgState = (
    idTemp: string,
    updates: Partial<ProgramacionItemState>
  ) => {
    setProgramacionMap((prev) => {
      const current = prev[idTemp] || {
        b_ProgramarDespues: false,
        v_TipoCupo: "Abierto",
        i_CupoAlumnos: 20,
        v_Titular: "ins_1",
        v_Apoyo: "NA",
        v_TipoApoyo: "Ninguno",
        v_NoCotProveedor: "",
        v_NoOCProveedor: "",
        d_PrecioProveedor: 0,
        d_FechaInicioEntrega: new Date().toISOString().split("T")[0],
        sesiones: [
          {
            fecha: new Date().toISOString().split("T")[0],
            horaInicio: "09:00",
            horaFin: "13:00",
            areaSalaId: "1",
          },
        ],
      };
      return {
        ...prev,
        [idTemp]: { ...current, ...updates },
      };
    });
  };

  const updateSesionState = (
    idTemp: string,
    sesionIdx: number,
    field: keyof SesionProgramacionState,
    value: string
  ) => {
    const itemServ = serviciosAgregados.find((s) => s.idTemp === idTemp);
    const cantidadHoras = itemServ?.cantidad || 1;
    const numSes = Math.max(1, itemServ?.sesiones || 1);
    const duraciones = calcularMinutosPorSesion(cantidadHoras, numSes);

    setProgramacionMap((prev) => {
      const itemState = prev[idTemp] || {
        b_ProgramarDespues: false,
        v_TipoCupo: "Abierto",
        i_CupoAlumnos: 20,
        v_Titular: "ins_1",
        v_Apoyo: "NA",
        v_TipoApoyo: "Ninguno",
        v_NoCotProveedor: "",
        v_NoOCProveedor: "",
        d_PrecioProveedor: 0,
        d_FechaInicioEntrega: new Date().toISOString().split("T")[0],
        sesiones: [],
      };
      const newSesiones = [...itemState.sesiones];
      if (!newSesiones[sesionIdx]) {
        newSesiones[sesionIdx] = {
          fecha: new Date().toISOString().split("T")[0],
          horaInicio: "09:00",
          horaFin: "13:00",
          areaSalaId: "1",
        };
      }

      const prevSesion = newSesiones[sesionIdx];
      const updatedSesion = {
        ...prevSesion,
        [field]: value,
      };

      if (field === "horaInicio") {
        const duracion = duraciones[sesionIdx] || 120;
        updatedSesion.horaFin = sumarMinutosAHorario(value, duracion);
      }

      newSesiones[sesionIdx] = updatedSesion;
      return {
        ...prev,
        [idTemp]: { ...itemState, sesiones: newSesiones },
      };
    });
  };

  // Cálculos financieros
  const totalSinIVA = serviciosAgregados.reduce(
    (acc, s) => acc + s.cantidad * s.precioUnitario,
    0
  );
  const totalCostos = serviciosAgregados.reduce((acc, s) => {
    const pState = getProgState(s);
    const costSinIVA =
      pState.v_TipoApoyo === "Proveedor" && pState.d_PrecioProveedor
        ? pState.d_PrecioProveedor * s.cantidad
        : s.costo;
    return acc + costSinIVA;
  }, 0);
  const totalUtilidad = totalSinIVA - totalCostos;

  const totalConIVA = totalSinIVA * 1.16;
  const totalCostosConIVA = totalCostos * 1.16;
  const totalUtilidadConIVA = totalConIVA - totalCostosConIVA;

  // Filtros autocomplete empresa
  const empresasFiltradas = empresasCatalogo.filter((e) => {
    if (!searchEmpresaText.trim()) return true;
    const term = searchEmpresaText.toLowerCase();
    return (
      (e.s_RazonSocial && e.s_RazonSocial.toLowerCase().includes(term)) ||
      (e.s_RFC && e.s_RFC.toLowerCase().includes(term))
    );
  });

  // Filtros autocomplete servicio
  const serviciosFiltrados = serviciosCatalogo.filter((s) => {
    if (!searchServicioText.trim()) return true;
    const term = searchServicioText.toLowerCase();
    return (
      (s.v_Nombre && s.v_Nombre.toLowerCase().includes(term)) ||
      (s.v_TipoServicio && s.v_TipoServicio.toLowerCase().includes(term))
    );
  });

  // Render badge tipo servicio según Sección 2.3 (4 colores únicos)
  const renderBadgeTipo = (idTipo: number, nombreTipo: string) => {
    let bgColor = "#f8fafc";
    let borderLeftColor = "#94a3b8";

    if (idTipo === 2 || nombreTipo.toUpperCase().includes("CAPACITA")) {
      bgColor = "#fffbeb";
      borderLeftColor = "#f59e0b";
    } else if (idTipo === 3 || nombreTipo.toUpperCase().includes("ESTUDIO")) {
      bgColor = "#eff6ff";
      borderLeftColor = "#188ae2";
    } else if (idTipo === 5 || nombreTipo.toUpperCase().includes("PRODUCTO")) {
      bgColor = "#f5f3ff";
      borderLeftColor = "#8b5cf6";
    } else if (idTipo === 6 || nombreTipo.toUpperCase().includes("SERVICIO")) {
      bgColor = "#f0fdf4";
      borderLeftColor = "#10b981";
    }

    return (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          fontSize: "12px",
          fontWeight: 500,
          padding: "3px 10px",
          borderRadius: "4px",
          backgroundColor: bgColor,
          borderLeft: `3px solid ${borderLeftColor}`,
          color: "#475569",
        }}
      >
        {nombreTipo}
      </span>
    );
  };

  // Validar avance
  const sePuedeAvanzar = Boolean(
    empresaSeleccionada &&
    plantaSeleccionadaId &&
    contactoSeleccionadoId &&
    serviciosAgregados.length > 0
  );

  const handleSiguiente = () => {
    if (pasoActual === 1) {
      if (serviciosAgregados.length === 0) {
        setErrorSinServicios(true);
      }
      if (sePuedeAvanzar) {
        setPasoActual(2);
        setPasoMaximoAlcanzado((prev) => Math.max(prev, 2));
      }
    } else if (pasoActual === 2) {
      setPasoActual(3);
      setPasoMaximoAlcanzado((prev) => Math.max(prev, 3));
    }
  };

  const handleAnterior = () => {
    if (pasoActual > 1) {
      setPasoActual(pasoActual - 1);
    }
  };

  const totalesCalculados = useMemo(() => {
    let sinIVA = 0;
    let costosSinIVA = 0;

    serviciosAgregados.forEach((item) => {
      const progState = programacionMap[item.idTemp];
      const esProveedor = progState?.v_TipoApoyo === "Proveedor";
      const costoItemSinIVA =
        esProveedor && progState?.d_PrecioProveedor
          ? progState.d_PrecioProveedor * item.cantidad
          : item.costo || 0;

      sinIVA += (item.cantidad || 0) * (item.precioUnitario || 0);
      costosSinIVA += costoItemSinIVA;
    });

    const utilidadSinIVA = sinIVA - costosSinIVA;
    const totalConIVA = sinIVA * 1.16;
    const totalCostosConIVA = costosSinIVA * 1.16;
    const totalUtilidadConIVA = totalConIVA - totalCostosConIVA;

    return {
      totalSinIVA: sinIVA,
      totalCostosSinIVA: costosSinIVA,
      totalUtilidadSinIVA: utilidadSinIVA,
      totalConIVA,
      totalCostosConIVA,
      totalUtilidadConIVA,
    };
  }, [serviciosAgregados, programacionMap]);

  if (!abierto) return null;

  const plantaNombreSel =
    plantas.find((p) => String(p.i_CvePlanta) === plantaSeleccionadaId)
      ?.v_NombrePlanta || "";

  const plantaSeleccionadaObj = plantas.find(
    (p) => String(p.i_CvePlanta) === plantaSeleccionadaId
  );
  const contactoSeleccionadoObj = contactos.find(
    (c) => String(c.i_CveContacto) === contactoSeleccionadoId
  );

  const empresaDataConfirmacion = {
    razonSocial: empresaSeleccionada?.s_RazonSocial || "—",
    planta: plantaSeleccionadaObj?.v_NombrePlanta || "—",
    contacto: contactoSeleccionadoObj?.v_NombreContacto || "—",
    correoContacto: contactoSeleccionadoObj?.v_Email || "N/A",
  };

  const ventaDataConfirmacion = {
    totalConIVA: totalesCalculados.totalConIVA,
    totalCostosConIVA: totalesCalculados.totalCostosConIVA,
    totalUtilidad: totalUtilidad,
    compartirCotizacion,
    compartirOC,
    noCotizacionGlobal,
    noOCGlobal,
  };

  const construirPayloadAgenda = (): AgendaInsertDto[] => {
    const empId = empresaSeleccionada?.iD_Empresa || 0;
    const plId = Number(plantaSeleccionadaId) || 0;
    const cntId = Number(contactoSeleccionadoId) || 0;

    return serviciosAgregados.map((item) => {
      const agendaCabecera: AgendaCabeceraInsertDto = {
        i_CveEmpresa: empId,
        i_CvePlanta: plId,
        i_CveContacto: cntId,
        i_CveEstatus: 1, // Programado
        v_TipoVenta: "normal",
        i_CveAgenda: 0,
        v_NomReprograma: null,
        i_NumParticipantes: null,
        v_FrecuenciaPoliza: null,
        i_DiaFacturacion: null,
        v_NombreProyecto: null,
        d_MontoProyecto: 0,
      };

      const progState = getProgState(item);
      const tipoId = getTipoServicioId(item);

      const noCotGI = compartirCotizacion ? noCotizacionGlobal : item.noCotizacionGI || "";
      const noOCCliente = compartirOC ? noOCGlobal : item.noOCCliente || "";

      const i_NumAlumnos =
        tipoId === 2 && progState.v_TipoCupo === "Limitado"
          ? progState.i_CupoAlumnos || 0
          : null;

      const servicioDetalle: ServicioAgendaDetalleInsertDto = {
        i_CveServicio: item.i_CveServicio,
        i_Cantidad: item.cantidad,
        d_PrecioUnitario: item.precioUnitario || 0,
        d_PrecioProveedor: progState.d_PrecioProveedor || 0,
        v_NoCotizacionGI: noCotGI,
        v_NoOrdenCompraCliente: noOCCliente,
        i_NumAlumnos: i_NumAlumnos,
        b_SinProgramar: Boolean(progState.b_ProgramarDespues),
        i_CanTotal: null,
        b_Cancelado: false,
      };

      const sesiones: SesionInsertDto[] = [];
      if (!progState.b_ProgramarDespues) {
        const iCveTitular =
          tipoId === 2 && progState.v_Titular && progState.v_Titular.startsWith("ins_")
            ? Number(progState.v_Titular.replace("ins_", ""))
            : null;

        let iCveApoyo: number | null = null;
        let isProveedorApoyo = false;

        if (progState.v_Apoyo && progState.v_Apoyo !== "NA" && progState.v_Apoyo !== "0") {
          if (progState.v_Apoyo.startsWith("prov_")) {
            iCveApoyo = Number(progState.v_Apoyo.replace("prov_", ""));
            isProveedorApoyo = true;
          } else if (progState.v_Apoyo.startsWith("ins_")) {
            iCveApoyo = Number(progState.v_Apoyo.replace("ins_", ""));
            isProveedorApoyo = false;
          } else {
            iCveApoyo = Number(progState.v_Apoyo) || null;
            isProveedorApoyo = progState.v_TipoApoyo === "Proveedor";
          }
        }

        if (tipoId === 2) {
          (progState.sesiones || []).forEach((ses, idx) => {
            if (ses.fecha) {
              const areaId = ses.areaSalaId ? Number(ses.areaSalaId) || null : null;
              sesiones.push({
                d_FechaHoraInicio: `${ses.fecha}T${ses.horaInicio || "09:00"}:00`,
                d_FechaHoraFin: `${ses.fecha}T${ses.horaFin || "13:00"}:00`,
                i_Orden: idx + 1,
                i_CveServAgendaDet: 0,
                i_CveTitular: iCveTitular,
                i_CveApoyo: iCveApoyo,
                b_TipoProvInsTitular: false,
                b_TipoProvInsApoyo: isProveedorApoyo,
                i_CveArea: areaId,
              });
            }
          });
        } else {
          const fechaEntrega = progState.d_FechaInicioEntrega || new Date().toISOString().split("T")[0];
          sesiones.push({
            d_FechaHoraInicio: `${fechaEntrega}T00:00:00`,
            d_FechaHoraFin: `${fechaEntrega}T00:00:00`,
            i_Orden: 1,
            i_CveServAgendaDet: 0,
            i_CveTitular: null,
            i_CveApoyo: iCveApoyo,
            b_TipoProvInsTitular: false,
            b_TipoProvInsApoyo: isProveedorApoyo,
            i_CveArea: null,
          });
        }
      }

      const proveedores: DatosVentaProveedorDto[] = [];
      let iCveApoyoProv: number | null = null;
      if (progState.v_Apoyo && progState.v_Apoyo !== "NA" && progState.v_Apoyo !== "0") {
        if (progState.v_Apoyo.startsWith("prov_")) {
          iCveApoyoProv = Number(progState.v_Apoyo.replace("prov_", ""));
        } else if (progState.v_Apoyo.startsWith("ins_")) {
          iCveApoyoProv = Number(progState.v_Apoyo.replace("ins_", ""));
        } else {
          iCveApoyoProv = Number(progState.v_Apoyo) || null;
        }
      }

      if (iCveApoyoProv && iCveApoyoProv > 0) {
        proveedores.push({
          i_CveProveedor: iCveApoyoProv,
          v_NoCotizacionProv: progState.v_NoCotProveedor || "",
          v_NoOrdenCompraProv: progState.v_NoOCProveedor || "",
          i_CveAgenda: 0,
          i_CveServAgendaDet: 0,
        });
      }

      const srvCat = serviciosCatalogo.find((sc) => sc.i_CveServicio === item.i_CveServicio);
      const entregablesIds = srvCat?.entregables || [];
      const entregables: AgendaEntregableInsertDto[] = entregablesIds.map((cveEnt) => ({
        i_CveEntregables: cveEnt,
        i_CveAgendaEntregables: 0,
        i_CveAgenda: 0,
        i_CveServAgendaDet: 0,
        b_Entregado: false,
      }));

      return {
        Agenda: agendaCabecera,
        Servicios: [servicioDetalle],
        Sesiones: sesiones,
        Proveedores: proveedores,
        Entregables: entregables,
      };
    });
  };

  const handleConfirmarDefinitivo = async () => {
    try {
      const payload = construirPayloadAgenda();
      const exito = await AgendaService.postAgenda(payload);
      if (exito) {
        toast.success("Agenda registrada y guardada exitosamente");
        setMostrarModalConfirmar(false);
        if (onGuardadoExitoso) onGuardadoExitoso();
        onCerrar();
      } else {
        toast.error("Ocurrió un error al guardar la agenda");
      }
    } catch (err) {
      console.error("Error al guardar agenda:", err);
      toast.error("Error al comunicarse con el servidor");
    }
  };

  return (
    <>
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(15, 23, 42, 0.5)",
          backdropFilter: "blur(4px)",
          display: mostrarModalConfirmar ? "none" : "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1050,
          padding: "8px",
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
                  Agendar servicio
                </h3>
                <span style={{ fontSize: "12px", color: "#6c757d" }}>
                  Selecciona la empresa, agrega servicios y captura la cotización.
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

          {/* BARRA DE PASOS (STEPS INDICATOR) */}
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
                    boxShadow:
                      pasoActual === 1
                        ? "0 0 0 4px rgba(13, 110, 253, 0.2)"
                        : "none",
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
                    boxShadow:
                      pasoActual === 2
                        ? "0 0 0 4px rgba(13, 110, 253, 0.2)"
                        : "none",
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
                  Agendar sesiones
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
                    boxShadow:
                      pasoActual === 3
                        ? "0 0 0 4px rgba(13, 110, 253, 0.2)"
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
                    color: pasoActual === 3 ? "#0d6efd" : "#6c757d",
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
              paddingBottom: dropdownServicioAbierto || dropdownEmpresaAbierto ? "140px" : "16px",
              minHeight: "420px",
              backgroundColor: "#ffffff",
              transition: "padding-bottom 0.2s ease",
            }}
          >
            {pasoActual === 1 && (
              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                {/* 1. SECCIÓN CLIENTE */}
                <div>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(3, 1fr)",
                      gap: "14px",
                    }}
                  >
                    {/* Empresa */}
                    <div style={{ position: "relative" }} ref={containerEmpresaRef}>
                      <label
                        style={{
                          fontSize: "12px",
                          fontWeight: 700,
                          color: "#4a6580",
                          display: "block",
                          marginBottom: "4px",
                        }}
                      >
                        Empresa <span style={{ color: "#2B8FCC" }}>*</span>
                      </label>

                      <div style={{ position: "relative" }}>
                        <input
                          type="text"
                          className="form-control"
                          style={{
                            borderRadius: "8px",
                            height: "36px",
                            fontSize: "13px",
                            paddingRight: searchEmpresaText ? "30px" : "12px",
                            border:
                              !empresaSeleccionada && errorSinServicios
                                ? "1px solid #dc3545"
                                : "1px solid #d0dce8",
                          }}
                          placeholder="Buscar empresa..."
                          value={searchEmpresaText}
                          onFocus={() => setDropdownEmpresaAbierto(true)}
                          onChange={(e) => {
                            setSearchEmpresaText(e.target.value);
                            setDropdownEmpresaAbierto(true);
                            if (empresaSeleccionada) {
                              setEmpresaSeleccionada(null);
                              setPlantas([]);
                              setPlantaSeleccionadaId("");
                              setContactos([]);
                              setContactoSeleccionadoId("");
                            }
                          }}
                        />
                        {searchEmpresaText && (
                          <button
                            type="button"
                            onClick={handleLimpiarEmpresa}
                            style={{
                              position: "absolute",
                              right: "8px",
                              top: "50%",
                              transform: "translateY(-50%)",
                              background: "none",
                              border: "none",
                              color: "#94a3b8",
                              cursor: "pointer",
                              fontSize: "13px",
                              lineHeight: 1,
                            }}
                          >
                            ✕
                          </button>
                        )}
                      </div>

                      {dropdownEmpresaAbierto && (
                        <div
                          className="no-scrollbar"
                          style={{
                            position: "absolute",
                            top: "100%",
                            left: 0,
                            right: 0,
                            backgroundColor: "#ffffff",
                            borderRadius: "10px",
                            border: "1px solid #94a3b8",
                            boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.1)",
                            maxHeight: "260px",
                            overflowY: "auto",
                            scrollbarWidth: "none",
                            msOverflowStyle: "none",
                            zIndex: 10000,
                            marginTop: "4px",
                          }}
                        >
                          {empresasFiltradas.length === 0 ? (
                            <div
                              style={{
                                padding: "10px 14px",
                                fontSize: "12px",
                                color: "#7a96b0",
                                textAlign: "center",
                              }}
                            >
                              Sin resultados
                            </div>
                          ) : (
                            empresasFiltradas.map((emp) => (
                              <div
                                key={emp.iD_Empresa}
                                onClick={() => handleSeleccionarEmpresa(emp)}
                                style={{
                                  padding: "8px 12px",
                                  fontSize: "13px",
                                  cursor: "pointer",
                                  borderBottom: "1px solid #f1f5f9",
                                  backgroundColor:
                                    empresaSeleccionada?.iD_Empresa === emp.iD_Empresa
                                      ? "#eaf4fb"
                                      : "transparent",
                                  transition: "background-color 0.15s ease",
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.backgroundColor = "#f4f8fc";
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.backgroundColor =
                                    empresaSeleccionada?.iD_Empresa === emp.iD_Empresa
                                      ? "#eaf4fb"
                                      : "transparent";
                                }}
                              >
                                <div style={{ fontWeight: 600, color: "#1e3a5f" }}>
                                  {emp.s_RazonSocial}
                                </div>
                                <div style={{ fontSize: "11px", color: "#7a96b0" }}>
                                  {emp.s_RFC ? `RFC: ${emp.s_RFC}` : "Sin RFC"}
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      )}
                    </div>

                    {/* Planta */}
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
                        Planta <span style={{ color: "#2B8FCC" }}>*</span>
                      </label>
                      <select
                        className="form-select"
                        disabled={!empresaSeleccionada}
                        style={{
                          borderRadius: "8px",
                          height: "36px",
                          fontSize: "13px",
                          border: "1px solid #d0dce8",
                          backgroundColor: !empresaSeleccionada ? "#f0f5fa" : "#ffffff",
                          color: !empresaSeleccionada ? "#7a96b0" : "#1e3a5f",
                        }}
                        value={plantaSeleccionadaId}
                        onChange={(e) => setPlantaSeleccionadaId(e.target.value)}
                      >
                        <option value="">-- Selecciona una planta --</option>
                        {plantas.map((p: any, idx: number) => {
                          const idPlanta =
                            p.i_CvePlanta ??
                            p.i_CveCentroTrabajo ??
                            p.i_CveCentro ??
                            p.iD_Centro ??
                            p.id ??
                            idx + 1;
                          const nomPlanta =
                            p.v_NombrePlanta ||
                            p.v_NombreCentroTrabajo ||
                            p.v_NombreCentro ||
                            p.v_Nombre ||
                            p.s_Nombre ||
                            `Planta ${idPlanta}`;
                          return (
                            <option key={idPlanta} value={idPlanta}>
                              {nomPlanta}
                            </option>
                          );
                        })}
                      </select>
                    </div>

                    {/* Contacto */}
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
                        Contacto <span style={{ color: "#2B8FCC" }}>*</span>
                      </label>
                      <select
                        className="form-select"
                        disabled={!empresaSeleccionada}
                        style={{
                          borderRadius: "8px",
                          height: "36px",
                          fontSize: "13px",
                          border: "1px solid #d0dce8",
                          backgroundColor: !empresaSeleccionada ? "#f0f5fa" : "#ffffff",
                          color: !empresaSeleccionada ? "#7a96b0" : "#1e3a5f",
                        }}
                        value={contactoSeleccionadoId}
                        onChange={(e) => setContactoSeleccionadoId(e.target.value)}
                      >
                        <option value="">-- Selecciona un contacto --</option>
                        {contactos.map((c) => (
                          <option key={c.i_CveContacto} value={c.i_CveContacto}>
                            {c.v_NombreContacto}{" "}
                            {c.v_TipoContacto ? `(${c.v_TipoContacto})` : ""}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <hr style={{ border: "none", borderTop: "1px solid #e2e8f0", margin: "4px 0" }} />

                {/* 2. SECCIÓN SERVICIOS */}
                <div>
                  <h5
                    style={{
                      fontSize: "13px",
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                      color: "#1e3a5f",
                      marginBottom: "12px",
                    }}
                  >
                    Servicios a agendar
                  </h5>

                  {/* 2.1 Buscador de Servicio */}
                  <div
                    style={{ position: "relative", marginBottom: "14px" }}
                    ref={containerServicioRef}
                  >
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
                        style={{
                          borderRadius: "8px",
                          height: "38px",
                          fontSize: "13px",
                          paddingLeft: "36px",
                          paddingRight: searchServicioText ? "30px" : "12px",
                          border: errorSinServicios
                            ? "1px solid #dc3545"
                            : "1px solid #d0dce8",
                        }}
                        placeholder="Buscar servicio para agregar a la lista..."
                        value={searchServicioText}
                        onFocus={() => setDropdownServicioAbierto(true)}
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
                            fontSize: "13px",
                          }}
                        >
                          ✕
                        </button>
                      )}
                    </div>

                    {dropdownServicioAbierto && (
                      <div
                        className="no-scrollbar"
                        style={{
                          position: "absolute",
                          top: "100%",
                          left: 0,
                          right: 0,
                          backgroundColor: "#ffffff",
                          borderRadius: "10px",
                          border: "1px solid #94a3b8",
                          boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.1)",
                          maxHeight: "260px",
                          overflowY: "auto",
                          scrollbarWidth: "none",
                          msOverflowStyle: "none",
                          zIndex: 10000,
                          marginTop: "4px",
                        }}
                      >
                        {serviciosFiltrados.length === 0 ? (
                          <div
                            style={{
                              padding: "10px 14px",
                              fontSize: "12px",
                              color: "#7a96b0",
                              textAlign: "center",
                            }}
                          >
                            Sin resultados
                          </div>
                        ) : (
                          serviciosFiltrados.map((srv) => (
                            <div
                              key={srv.i_CveServicio}
                              onClick={() => handleSeleccionarServicio(srv)}
                              style={{
                                padding: "8px 14px",
                                fontSize: "13px",
                                cursor: "pointer",
                                borderBottom: "1px solid #f1f5f9",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = "#f4f8fc";
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = "transparent";
                              }}
                            >
                              <div style={{ fontWeight: 600, color: "#1e3a5f" }}>
                                {srv.v_Nombre}
                              </div>
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "8px",
                                }}
                              >
                                {renderBadgeTipo(
                                  srv.i_CveTipoServicio,
                                  srv.v_TipoServicio || "Servicio"
                                )}
                                <span style={{ fontSize: "11px", color: "#7a96b0" }}>
                                  {srv.v_Unidad}
                                </span>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>

                  {/* 2.2 Tabla de servicios agregados */}
                  {serviciosAgregados.length === 0 ? (
                    <div
                      style={{
                        border: "2px dashed #cbd5e1",
                        borderRadius: "10px",
                        padding: "24px",
                        textAlign: "center",
                        color: errorSinServicios ? "#dc3545" : "#7a96b0",
                        fontSize: "13px",
                        backgroundColor: errorSinServicios ? "#fff5f5" : "#fafafa",
                      }}
                    >
                      <AlertCircle
                        size={24}
                        style={{
                          marginBottom: "6px",
                          color: errorSinServicios ? "#dc3545" : "#94a3b8",
                        }}
                      />
                      <div>
                        Sin servicios agregados — busca y agrega al menos uno para continuar
                      </div>
                    </div>
                  ) : (
                    <div
                      className="custom-scrollbar"
                      style={{
                        border: "1px solid #d8e6f0",
                        borderRadius: "10px",
                        overflowY: serviciosAgregados.length > 4 ? "auto" : "hidden",
                        maxHeight: serviciosAgregados.length > 4 ? "380px" : "none",
                        position: "relative",
                      }}
                    >
                      <table
                        style={{
                          width: "100%",
                          borderCollapse: "separate",
                          borderSpacing: 0,
                          fontSize: "12px",
                        }}
                      >
                        <thead
                          style={{
                            position: "sticky",
                            top: 0,
                            zIndex: 5,
                            backgroundColor: "#f4f8fc",
                          }}
                        >
                          <tr
                            style={{
                              backgroundColor: "#f4f8fc",
                              borderBottom: "1px solid #d8e6f0",
                              color: "#4a6580",
                              textAlign: "left",
                            }}
                          >
                            <th style={{ padding: "10px 12px", fontWeight: 700 }}>Servicio</th>
                            <th style={{ padding: "10px 10px", fontWeight: 700 }}>Tipo</th>
                            <th style={{ padding: "10px 10px", fontWeight: 700 }}>Rubro</th>
                            <th style={{ padding: "10px 10px", fontWeight: 700 }}>Unidad</th>
                            <th style={{ padding: "10px 10px", fontWeight: 700, width: "70px" }}>Cant.</th>
                            <th style={{ padding: "10px 10px", fontWeight: 700, width: "120px" }}>Precio unit. s/IVA</th>
                            <th style={{ padding: "10px 10px", fontWeight: 700, width: "100px" }}>Subtotal</th>
                            <th style={{ padding: "10px 10px", fontWeight: 700, width: "85px" }}>Sesiones</th>
                            <th style={{ padding: "10px 10px", textAlign: "center", width: "45px" }}></th>
                          </tr>
                        </thead>
                        <tbody>
                          {serviciosAgregados.map((item) => {
                            const esCapacitacion = item.i_CveTipoServicio === 2;
                            const cantNum = Number(item.cantidad) || 0;
                            const precioNum = Number(item.precioUnitario) || 0;
                            const subtotal = cantNum * precioNum;

                            return (
                              <tr
                                key={item.idTemp}
                                style={{ borderBottom: "1px solid #f0f4f8" }}
                              >
                                <td style={{ padding: "8px 12px", fontWeight: 700, color: "#1e3a5f" }}>
                                  {item.v_Nombre}
                                </td>
                                <td style={{ padding: "8px 10px" }}>
                                  {renderBadgeTipo(item.i_CveTipoServicio, item.v_TipoServicio)}
                                </td>
                                <td style={{ padding: "8px 10px", color: "#64748b" }}>
                                  {item.v_Rubro}
                                </td>
                                <td style={{ padding: "8px 10px", color: "#64748b" }}>
                                  {item.v_Unidad}
                                </td>
                                <td style={{ padding: "8px 10px" }}>
                                  <input
                                    type="number"
                                    min={0}
                                    className="form-control"
                                    style={{
                                      height: "30px",
                                      padding: "2px 6px",
                                      fontSize: "12px",
                                      borderRadius: "6px",
                                      border: "1px solid #d0dce8",
                                      width: "65px",
                                    }}
                                    value={item.cantidad}
                                    onChange={(e) => {
                                      const raw = e.target.value;
                                      handleActualizarServicio(
                                        item.idTemp,
                                        "cantidad",
                                        raw === "" ? "" : Math.max(0, Number(raw))
                                      );
                                    }}
                                  />
                                </td>
                                <td style={{ padding: "8px 10px" }}>
                                  <input
                                    type="number"
                                    min={0}
                                    className="form-control"
                                    style={{
                                      height: "30px",
                                      padding: "2px 6px",
                                      fontSize: "12px",
                                      borderRadius: "6px",
                                      border: "1px solid #d0dce8",
                                      width: "90px",
                                    }}
                                    value={item.precioUnitario}
                                    onChange={(e) => {
                                      const raw = e.target.value;
                                      handleActualizarServicio(
                                        item.idTemp,
                                        "precioUnitario",
                                        raw === "" ? "" : Math.max(0, Number(raw))
                                      );
                                    }}
                                  />
                                </td>
                                <td style={{ padding: "8px 10px" }}>
                                  <input
                                    type="text"
                                    readOnly
                                    disabled
                                    className="form-control"
                                    style={{
                                      height: "30px",
                                      padding: "2px 6px",
                                      fontSize: "12px",
                                      borderRadius: "6px",
                                      border: "1px solid #d0dce8",
                                      backgroundColor: "#e9ecef",
                                      color: "#1e3a5f",
                                      fontWeight: 600,
                                      width: "95px",
                                    }}
                                    value={`$${formatearMoneda(subtotal)}`}
                                  />
                                </td>
                                <td style={{ padding: "8px 10px" }}>
                                  <select
                                    className="form-select"
                                    disabled={!esCapacitacion}
                                    style={{
                                      height: "30px",
                                      padding: "2px 6px",
                                      fontSize: "12px",
                                      borderRadius: "6px",
                                      border: "1px solid #d0dce8",
                                      backgroundColor: !esCapacitacion ? "#f0f5fa" : "#ffffff",
                                      color: !esCapacitacion ? "#94a3b8" : "#1e3a5f",
                                      width: "75px",
                                    }}
                                    value={item.sesiones}
                                    onChange={(e) =>
                                      handleActualizarServicio(
                                        item.idTemp,
                                        "sesiones",
                                        Number(e.target.value)
                                      )
                                    }
                                  >
                                    <option value={1}>1</option>
                                    <option value={2}>2</option>
                                    <option value={3}>3</option>
                                    <option value={4}>4</option>
                                  </select>
                                </td>
                                <td style={{ padding: "8px 10px", textAlign: "center" }}>
                                  <button
                                    type="button"
                                    onClick={() => handleEliminarServicio(item.idTemp)}
                                    style={{
                                      background: "none",
                                      border: "1px solid #fca5a5",
                                      borderRadius: "6px",
                                      color: "#dc3545",
                                      padding: "4px",
                                      cursor: "pointer",
                                      display: "inline-flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                    }}
                                    title="Quitar servicio"
                                  >
                                    <Trash2 size={14} />
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
              </div>
            )}

            {pasoActual === 2 && (
              <div style={{ display: "flex", flexDirection: "column" }}>
                {serviciosAgregados.length === 0 ? (
                  <div
                    style={{
                      padding: "36px 20px",
                      textAlign: "center",
                      backgroundColor: "#fafafa",
                      borderRadius: "10px",
                      border: "1px dashed #cbd5e1",
                      color: "#64748b",
                    }}
                  >
                    <AlertCircle
                      size={28}
                      style={{ color: "#94a3b8", marginBottom: "8px" }}
                    />
                    <div
                      style={{
                        fontWeight: 600,
                        fontSize: "14px",
                        color: "#1e3a5f",
                      }}
                    >
                      Sin servicios agregados
                    </div>
                    <div style={{ fontSize: "12px", marginTop: "4px" }}>
                      Regresa al Paso 1 para agregar servicios a la lista.
                    </div>
                  </div>
                ) : (
                  (() => {
                    const TIPOS_ORDENADOS = [2, 3, 5, 6];
                    let renderCountGroup = 0;

                    return TIPOS_ORDENADOS.map((tipoId) => {
                      const itemsGrupo = serviciosAgregados.filter(
                        (item) => getTipoServicioId(item) === tipoId
                      );
                      if (itemsGrupo.length === 0) return null;

                      const config = GROUP_CONFIG[tipoId] || GROUP_CONFIG[6];
                      const esPrimerGrupo = renderCountGroup === 0;
                      renderCountGroup++;

                      return (
                        <React.Fragment key={tipoId}>
                          {/* CARDS DE SERVICIO DEL GRUPO */}
                          {itemsGrupo.map((item) => {
                            const progState = getProgState(item);

                            return (
                              <div
                                key={item.idTemp}
                                style={{
                                  border: "1px solid #e2e8f0",
                                  borderLeft: `5px solid ${config.colorBorder}`,
                                  borderRadius: "10px",
                                  padding: "14px",
                                  backgroundColor: config.bg,
                                  marginBottom: "16px",
                                  boxShadow: "0 1px 4px rgba(0, 0, 0, 0.03)",
                                }}
                              >
                                {/* 2.1 Encabezado de la card */}
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
                                  {item.v_Nombre} ({item.cantidad}{" "}
                                  {item.v_Unidad || "servicio"})
                                </div>

                                {/* 2.2 Toggle "Programar después" */}
                                <div
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "8px",
                                    marginBottom: "12px",
                                  }}
                                >
                                  <label
                                    style={{
                                      display: "inline-flex",
                                      alignItems: "center",
                                      gap: "6px",
                                      fontSize: "12px",
                                      fontWeight: 600,
                                      color: "#856404",
                                      cursor: "pointer",
                                    }}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={progState.b_ProgramarDespues}
                                      onChange={(e) =>
                                        updateProgState(item.idTemp, {
                                          b_ProgramarDespues: e.target.checked,
                                        })
                                      }
                                      style={{
                                        cursor: "pointer",
                                        accentColor: "#f59e0b",
                                      }}
                                    />
                                    <Clock
                                      size={15}
                                      style={{ color: "#856404" }}
                                    />
                                    {tipoId === 2
                                      ? "Programar fecha y hora después"
                                      : "Programar fecha después"}
                                  </label>
                                </div>

                                {/* BANNER "SIN PROGRAMAR" O TABLA DE PROGRAMACIÓN */}
                                {progState.b_ProgramarDespues ? (
                                  <div
                                    style={{
                                      backgroundColor: "#fff3cd",
                                      border: "1px solid #ffe69c",
                                      borderRadius: "8px",
                                      padding: "12px 16px",
                                      display: "flex",
                                      alignItems: "center",
                                      gap: "10px",
                                      color: "#856404",
                                      fontSize: "13px",
                                    }}
                                  >
                                    <Clock size={18} style={{ flexShrink: 0 }} />
                                    <span>
                                      {tipoId === 2
                                        ? "La fecha, hora e instructor se programarán después."
                                        : "La fecha de entrega se programará después."}
                                    </span>
                                  </div>
                                ) : (
                                  <>
                                    {/* 3. CAPACITACIÓN (TIPO 2) */}
                                    {tipoId === 2 && (
                                      <div>
                                        {/* 3.1 Cupo de alumnos */}
                                        <div
                                          style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "10px",
                                            marginBottom: "12px",
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
                                            value={progState.v_TipoCupo}
                                            onChange={(e) =>
                                              updateProgState(item.idTemp, {
                                                v_TipoCupo: e.target.value as
                                                  | "Abierto"
                                                  | "Limitado",
                                              })
                                            }
                                          >
                                            <option value="Abierto">
                                              Abierto
                                            </option>
                                            <option value="Limitado">
                                              Limitado
                                            </option>
                                          </select>

                                          {progState.v_TipoCupo ===
                                            "Limitado" && (
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
                                                  value={progState.i_CupoAlumnos}
                                                  onChange={(e) =>
                                                    updateProgState(item.idTemp, {
                                                      i_CupoAlumnos: Math.max(
                                                        1,
                                                        Number(e.target.value)
                                                      ),
                                                    })
                                                  }
                                                />
                                                <span
                                                  style={{ color: "#64748b" }}
                                                >
                                                  alumnos
                                                </span>
                                              </div>
                                            )}
                                        </div>

                                        {/* 3.2 Programación Capacitación (Personal asignado + Tabla de sesiones stacked) */}
                                        <div
                                          style={{
                                            display: "flex",
                                            flexDirection: "column",
                                            gap: "12px",
                                          }}
                                        >
                                          {/* Panel de Instructores / Apoyo General */}
                                          <div
                                            style={{
                                              backgroundColor: "#f8fafc",
                                              border: "1px solid #e2e8f0",
                                              borderRadius: "8px",
                                              padding: "12px 14px",
                                            }}
                                          >
                                            <div
                                              style={{
                                                display: "grid",
                                                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                                                gap: "12px",
                                                alignItems: "start",
                                              }}
                                            >
                                              {/* Titular */}
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
                                                  Titular
                                                </label>
                                                <select
                                                  className="form-select"
                                                  style={{
                                                    height: "32px",
                                                    fontSize: "12px",
                                                    borderRadius: "6px",
                                                    border: "1px solid #cbd5e1",
                                                  }}
                                                  value={progState.v_Titular}
                                                  onChange={(e) =>
                                                    updateProgState(item.idTemp, {
                                                      v_Titular: e.target.value,
                                                    })
                                                  }
                                                >
                                                  {listaInstructores.map((ins) => (
                                                    <option
                                                      key={ins.id}
                                                      value={ins.id}
                                                    >
                                                      {ins.nombre}
                                                    </option>
                                                  ))}
                                                </select>
                                                {(() => {
                                                  const insSel = listaInstructores.find(
                                                    (i) => i.id === progState.v_Titular
                                                  );
                                                  if (insSel && insSel.ocupado) {
                                                    return (
                                                      <div
                                                        style={{
                                                          fontSize: "11px",
                                                          color: "#d97706",
                                                          marginTop: "4px",
                                                          display: "flex",
                                                          alignItems: "center",
                                                          gap: "4px",
                                                        }}
                                                      >
                                                        <AlertCircle
                                                          size={12}
                                                          style={{ color: "#d97706" }}
                                                        />
                                                        <span>
                                                          Ocupado: {insSel.horarioOcupado}
                                                        </span>
                                                      </div>
                                                    );
                                                  }
                                                  return null;
                                                })()}
                                              </div>

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
                                                  value={progState.v_Apoyo}
                                                  onChange={(e) => {
                                                    const val = e.target.value;
                                                    let tipo:
                                                      | "Ninguno"
                                                      | "Instructor"
                                                      | "Proveedor" = "Ninguno";
                                                    if (val.startsWith("ins_"))
                                                      tipo = "Instructor";
                                                    else if (val.startsWith("prov_"))
                                                      tipo = "Proveedor";

                                                    updateProgState(item.idTemp, {
                                                      v_Apoyo: val,
                                                      v_TipoApoyo: tipo,
                                                      ...(tipo !== "Proveedor"
                                                        ? {
                                                          v_NoCotProveedor: "",
                                                          v_NoOCProveedor: "",
                                                          d_PrecioProveedor: 0,
                                                        }
                                                        : {}),
                                                    });
                                                  }}
                                                >
                                                  <option value="NA">N/A</option>
                                                  <optgroup label="Instructores">
                                                    {listaInstructores.map((ins) => (
                                                      <option
                                                        key={ins.id}
                                                        value={ins.id}
                                                      >
                                                        {ins.nombre}
                                                      </option>
                                                    ))}
                                                  </optgroup>
                                                  <optgroup label="Proveedores">
                                                    {listaProveedores.map((prv) => (
                                                      <option
                                                        key={prv.id}
                                                        value={prv.id}
                                                      >
                                                        {prv.nombre}
                                                      </option>
                                                    ))}
                                                  </optgroup>
                                                </select>
                                                {(() => {
                                                  const persona =
                                                    listaInstructores.find(
                                                      (i) => i.id === progState.v_Apoyo
                                                    ) ||
                                                    listaProveedores.find(
                                                      (p) => p.id === progState.v_Apoyo
                                                    );
                                                  if (persona && persona.ocupado) {
                                                    return (
                                                      <div
                                                        style={{
                                                          fontSize: "11px",
                                                          color: "#d97706",
                                                          marginTop: "4px",
                                                          display: "flex",
                                                          alignItems: "center",
                                                          gap: "4px",
                                                        }}
                                                      >
                                                        <AlertCircle
                                                          size={12}
                                                          style={{ color: "#d97706" }}
                                                        />
                                                        <span>
                                                          Ocupado: {persona.horarioOcupado}
                                                        </span>
                                                      </div>
                                                    );
                                                  }
                                                  return null;
                                                })()}
                                              </div>

                                              {/* Precio p/unidad s/IVA ($) si es Proveedor */}
                                              {progState.v_TipoApoyo === "Proveedor" && (
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
                                                    value={progState.d_PrecioProveedor ?? ""}
                                                    onChange={(e) => {
                                                      const val = Math.max(0, Number(e.target.value));
                                                      updateProgState(item.idTemp, {
                                                        d_PrecioProveedor: val,
                                                      });
                                                    }}
                                                  />
                                                </div>
                                              )}
                                            </div>
                                          </div>

                                          {/* Tabla de Sesiones Stacked (Una arriba de otra) */}
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
                                                    borderBottom:
                                                      "1px solid #d8e6f0",
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
                                                  <th
                                                    style={{
                                                      padding: "8px 12px",
                                                      fontWeight: 700,
                                                    }}
                                                  >
                                                    Área / Sala
                                                  </th>
                                                </tr>
                                              </thead>
                                              <tbody>
                                                {Array.from({
                                                  length: item.sesiones || 1,
                                                }).map((_, sIdx) => {
                                                  const sesion =
                                                    progState.sesiones[sIdx] || {
                                                      fecha: new Date()
                                                        .toISOString()
                                                        .split("T")[0],
                                                      horaInicio: "09:00",
                                                      horaFin: "13:00",
                                                      areaSalaId: "1",
                                                    };

                                                  return (
                                                    <tr
                                                      key={sIdx}
                                                      style={{
                                                        borderBottom:
                                                          sIdx <
                                                            (item.sesiones || 1) - 1
                                                            ? "1px solid #f1f5f9"
                                                            : "none",
                                                        backgroundColor:
                                                          sIdx % 2 === 0
                                                            ? "#ffffff"
                                                            : "#f8fafc",
                                                      }}
                                                    >
                                                      <td
                                                        style={{
                                                          padding: "8px 12px",
                                                          fontWeight: 600,
                                                          color: "#334155",
                                                          verticalAlign: "middle",
                                                        }}
                                                      >
                                                        <span
                                                          style={{
                                                            display: "inline-block",
                                                            backgroundColor: "#e0f2fe",
                                                            color: "#0369a1",
                                                            padding: "3px 8px",
                                                            borderRadius: "4px",
                                                            fontWeight: 700,
                                                            fontSize: "11px",
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
                                                          value={sesion.fecha}
                                                          onChange={(val) =>
                                                            updateSesionState(
                                                              item.idTemp,
                                                              sIdx,
                                                              "fecha",
                                                              val
                                                            )
                                                          }
                                                        />
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
                                                            border:
                                                              "1px solid #d0dce8",
                                                            padding: "2px 6px",
                                                          }}
                                                          value={sesion.horaInicio}
                                                          onChange={(e) =>
                                                            updateSesionState(
                                                              item.idTemp,
                                                              sIdx,
                                                              "horaInicio",
                                                              e.target.value
                                                            )
                                                          }
                                                        >
                                                          {HORAS_OPCIONES.map(
                                                            (h) => (
                                                              <option
                                                                key={h}
                                                                value={h}
                                                              >
                                                                {h}
                                                              </option>
                                                            )
                                                          )}
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
                                                            border:
                                                              "1px solid #d0dce8",
                                                            padding: "2px 6px",
                                                          }}
                                                          value={sesion.horaFin}
                                                          onChange={(e) =>
                                                            updateSesionState(
                                                              item.idTemp,
                                                              sIdx,
                                                              "horaFin",
                                                              e.target.value
                                                            )
                                                          }
                                                        >
                                                          {(() => {
                                                            let options = HORAS_OPCIONES.filter(
                                                              (h) => h > sesion.horaInicio
                                                            );
                                                            if (sesion.horaFin && !options.includes(sesion.horaFin)) {
                                                              options = Array.from(new Set([...options, sesion.horaFin])).sort();
                                                            }
                                                            return options.map((h) => (
                                                              <option key={h} value={h}>
                                                                {h}
                                                              </option>
                                                            ));
                                                          })()}
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
                                                            border:
                                                              "1px solid #d0dce8",
                                                            padding: "2px 6px",
                                                          }}
                                                          value={sesion.areaSalaId}
                                                          onChange={(e) =>
                                                            updateSesionState(
                                                              item.idTemp,
                                                              sIdx,
                                                              "areaSalaId",
                                                              e.target.value
                                                            )
                                                          }
                                                        >
                                                          <option value="">-- Selecciona Área / Sala --</option>
                                                          {listaSalas.map(
                                                            (sala) => (
                                                              <option
                                                                key={sala.id}
                                                                value={sala.id}
                                                              >
                                                                {sala.nombre}
                                                              </option>
                                                            )
                                                          )}
                                                        </select>
                                                      </td>
                                                    </tr>
                                                  );
                                                })}
                                              </tbody>
                                            </table>
                                          </div>
                                        </div>
                                      </div>
                                    )}

                                    {/* 4 & 5. ESTUDIOS (3) / PRODUCTOS (5) / SERVICIOS (6) */}
                                    {tipoId !== 2 && (
                                      <div
                                        className="custom-scrollbar"
                                        style={{
                                          border: "1px solid #d8e6f0",
                                          borderRadius: "8px",
                                          overflowX: "auto",
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
                                                backgroundColor: "#f4f8fc",
                                                borderBottom:
                                                  "1px solid #d8e6f0",
                                                color: "#4a6580",
                                                textAlign: "left",
                                              }}
                                            >
                                              <th
                                                style={{
                                                  padding: "8px 12px",
                                                  fontWeight: 700,
                                                  width: "160px",
                                                }}
                                              >
                                                {tipoId === 3
                                                  ? "Fecha de inicio"
                                                  : "Fecha de entrega"}
                                              </th>
                                              <th
                                                style={{
                                                  padding: "8px 12px",
                                                  fontWeight: 700,
                                                  width: "220px",
                                                }}
                                              >
                                                Apoyo / Proveedor
                                              </th>
                                              {progState.v_TipoApoyo === "Proveedor" && (
                                                <th
                                                  style={{
                                                    padding: "8px 12px",
                                                    fontWeight: 700,
                                                    width: "180px",
                                                  }}
                                                >
                                                  Precio p/unidad s/IVA ($)
                                                </th>
                                              )}
                                            </tr>
                                          </thead>
                                          <tbody>
                                            <tr>
                                              {/* Fecha */}
                                              <td style={{ padding: "8px 12px" }}>
                                                <InputFechaTexto
                                                  height="32px"
                                                  value={
                                                    progState.d_FechaInicioEntrega
                                                  }
                                                  onChange={(val) =>
                                                    handleFechaNonCapacitacionChange(
                                                      item.idTemp,
                                                      val
                                                    )
                                                  }
                                                />
                                              </td>

                                              {/* Apoyo / Proveedor */}
                                              <td style={{ padding: "8px 12px" }}>
                                                <select
                                                  className="form-select"
                                                  style={{
                                                    height: "32px",
                                                    fontSize: "12px",
                                                    borderRadius: "6px",
                                                    border: "1px solid #d0dce8",
                                                    width: "100%",
                                                  }}
                                                  value={progState.v_Apoyo}
                                                  onChange={(e) => {
                                                    const val = e.target.value;
                                                    let tipo:
                                                      | "Ninguno"
                                                      | "Instructor"
                                                      | "Proveedor" = "Ninguno";
                                                    if (val.startsWith("ins_"))
                                                      tipo = "Instructor";
                                                    else if (
                                                      val.startsWith("prov_")
                                                    )
                                                      tipo = "Proveedor";

                                                    updateProgState(
                                                      item.idTemp,
                                                      {
                                                        v_Apoyo: val,
                                                        v_TipoApoyo: tipo,
                                                        ...(tipo !== "Proveedor"
                                                          ? {
                                                            v_NoCotProveedor:
                                                              "",
                                                            v_NoOCProveedor:
                                                              "",
                                                            d_PrecioProveedor: 0,
                                                          }
                                                          : {}),
                                                      }
                                                    );
                                                  }}
                                                >
                                                  <option value="NA">N/A</option>
                                                  <optgroup label="Instructores">
                                                    {listaInstructores.map(
                                                      (ins) => (
                                                        <option
                                                          key={ins.id}
                                                          value={ins.id}
                                                        >
                                                          {ins.nombre}
                                                        </option>
                                                      )
                                                    )}
                                                  </optgroup>
                                                  <optgroup label="Proveedores">
                                                    {listaProveedores.map(
                                                      (prv) => (
                                                        <option
                                                          key={prv.id}
                                                          value={prv.id}
                                                        >
                                                          {prv.nombre}
                                                        </option>
                                                      )
                                                    )}
                                                  </optgroup>
                                                </select>
                                              </td>

                                              {/* Precio p/unidad (IVA incl.) */}
                                              {progState.v_TipoApoyo === "Proveedor" && (
                                                <td style={{ padding: "8px 12px" }}>
                                                  <input
                                                    type="number"
                                                    min={0}
                                                    className="form-control"
                                                    style={{
                                                      height: "32px",
                                                      fontSize: "12px",
                                                      borderRadius: "6px",
                                                      border: "1px solid #d0dce8",
                                                      width: "100%",
                                                    }}
                                                    placeholder="$0.00"
                                                    value={progState.d_PrecioProveedor || ""}
                                                    onChange={(e) => {
                                                      const val = Math.max(0, Number(e.target.value));
                                                      updateProgState(item.idTemp, {
                                                        d_PrecioProveedor: val,
                                                      });
                                                    }}
                                                  />
                                                </td>
                                              )}
                                            </tr>
                                          </tbody>
                                        </table>
                                      </div>
                                    )}
                                  </>
                                )}
                              </div>
                            );
                          })}
                        </React.Fragment>
                      );
                    });
                  })()
                )}
              </div>
            )}

            {pasoActual === 3 && (
              <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                {/* 3. SECCIÓN DATOS DE VENTA */}
                <div>
                  {/* Context bar + 2 Toggles independientes */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: "14px",
                      flexWrap: "wrap",
                      gap: "10px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "14px",
                        fontSize: "13px",
                        color: "#4a6580",
                      }}
                    >
                      <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                        <Building2 size={15} style={{ color: "#2B8FCC" }} />
                        <strong>Empresa:</strong>{" "}
                        {empresaSeleccionada?.s_RazonSocial || "—"}
                      </span>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                        <Factory size={15} style={{ color: "#2B8FCC" }} />
                        <strong>Planta:</strong> {plantaNombreSel || "—"}
                      </span>
                    </div>

                    {/* 2 Toggles a la derecha */}
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                      {/* Toggle 1: Cotización GI compartida */}
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          backgroundColor: "#f4f8fc",
                          padding: "4px 12px",
                          borderRadius: "20px",
                          border: "1px solid #b5cfe8",
                        }}
                      >
                        <span style={{ fontSize: "12px", fontWeight: 600, color: "#1e3a5f" }}>
                          Cotización GI compartida
                        </span>
                        <button
                          type="button"
                          onClick={() => handleToggleCompartirCotizacion(!compartirCotizacion)}
                          style={{
                            width: "38px",
                            height: "20px",
                            borderRadius: "10px",
                            backgroundColor: compartirCotizacion ? "#2B8FCC" : "#cbd5e1",
                            border: "none",
                            position: "relative",
                            cursor: "pointer",
                            transition: "background-color 0.2s ease",
                            padding: 0,
                          }}
                        >
                          <div
                            style={{
                              width: "16px",
                              height: "16px",
                              borderRadius: "50%",
                              backgroundColor: "#ffffff",
                              position: "absolute",
                              top: "2px",
                              left: compartirCotizacion ? "20px" : "2px",
                              transition: "left 0.2s ease",
                              boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                            }}
                          />
                        </button>
                      </div>

                      {/* Toggle 2: OC cliente compartida */}
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          backgroundColor: "#f4f8fc",
                          padding: "4px 12px",
                          borderRadius: "20px",
                          border: "1px solid #b5cfe8",
                        }}
                      >
                        <span style={{ fontSize: "12px", fontWeight: 600, color: "#1e3a5f" }}>
                          OC cliente compartida
                        </span>
                        <button
                          type="button"
                          onClick={() => handleToggleCompartirOC(!compartirOC)}
                          style={{
                            width: "38px",
                            height: "20px",
                            borderRadius: "10px",
                            backgroundColor: compartirOC ? "#2B8FCC" : "#cbd5e1",
                            border: "none",
                            position: "relative",
                            cursor: "pointer",
                            transition: "background-color 0.2s ease",
                            padding: 0,
                          }}
                        >
                          <div
                            style={{
                              width: "16px",
                              height: "16px",
                              borderRadius: "50%",
                              backgroundColor: "#ffffff",
                              position: "absolute",
                              top: "2px",
                              left: compartirOC ? "20px" : "2px",
                              transition: "left 0.2s ease",
                              boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                            }}
                          />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* 3.2 Tabla de datos de venta */}
                  <div
                    className="custom-scrollbar"
                    style={{
                      border: "1px solid #d8e6f0",
                      borderRadius: "10px",
                      overflowY: serviciosAgregados.length > 4 ? "auto" : "hidden",
                      maxHeight: serviciosAgregados.length > 4 ? "380px" : "none",
                      position: "relative",
                    }}
                  >
                    <table
                      style={{
                        width: "100%",
                        borderCollapse: "separate",
                        borderSpacing: 0,
                        fontSize: "12px",
                      }}
                    >
                      <thead
                        style={{
                          position: "sticky",
                          top: 0,
                          zIndex: 5,
                          backgroundColor: "#f4f8fc",
                        }}
                      >
                        <tr
                          style={{
                            backgroundColor: "#f4f8fc",
                            borderBottom: "1px solid #d8e6f0",
                            color: "#4a6580",
                            textAlign: "left",
                          }}
                        >
                          <th style={{ padding: "10px 12px", fontWeight: 700, backgroundColor: "#f4f8fc", borderBottom: "1px solid #d8e6f0" }}>Servicio</th>
                          <th style={{ padding: "10px 10px", fontWeight: 700, backgroundColor: "#f4f8fc", borderBottom: "1px solid #d8e6f0" }}>No. cotización GI</th>
                          <th style={{ padding: "10px 10px", fontWeight: 700, backgroundColor: "#f4f8fc", borderBottom: "1px solid #d8e6f0" }}>No. OC cliente</th>
                          <th style={{ padding: "10px 10px", fontWeight: 700, backgroundColor: "#f4f8fc", borderBottom: "1px solid #d8e6f0" }}>Proveedor</th>
                          <th style={{ padding: "10px 10px", fontWeight: 700, backgroundColor: "#f4f8fc", borderBottom: "1px solid #d8e6f0" }}>No. cot. prov.</th>
                          <th style={{ padding: "10px 10px", fontWeight: 700, backgroundColor: "#f4f8fc", borderBottom: "1px solid #d8e6f0" }}>No. OC prov.</th>
                          <th style={{ padding: "10px 10px", fontWeight: 700, textAlign: "right", backgroundColor: "#f4f8fc", borderBottom: "1px solid #d8e6f0" }}>Total s/IVA</th>
                          <th style={{ padding: "10px 10px", fontWeight: 700, textAlign: "right", backgroundColor: "#f4f8fc", borderBottom: "1px solid #d8e6f0" }}>Costo total s/IVA</th>
                          <th style={{ padding: "10px 10px", fontWeight: 700, textAlign: "right", backgroundColor: "#f4f8fc", borderBottom: "1px solid #d8e6f0" }}>Utilidad</th>
                        </tr>
                      </thead>
                      <tbody>
                        {serviciosAgregados.length === 0 ? (
                          <tr>
                            <td colSpan={9} style={{ padding: "16px", textAlign: "center", color: "#94a3b8" }}>
                              Sin servicios agregados
                            </td>
                          </tr>
                        ) : (
                          serviciosAgregados.map((item, index) => {
                            const progState = getProgState(item);
                            const esProveedor = progState.v_TipoApoyo === "Proveedor";
                            const provObj = esProveedor
                              ? listaProveedores.find((p) => p.id === progState.v_Apoyo)
                              : null;

                            const nombreProveedor = provObj ? provObj.nombre : "";
                            const noCotProveedor = esProveedor ? progState.v_NoCotProveedor || "" : "";
                            const noOCProveedor = esProveedor ? progState.v_NoOCProveedor || "" : "";

                            const costoItemSinIVA =
                              esProveedor && progState.d_PrecioProveedor
                                ? progState.d_PrecioProveedor * item.cantidad
                                : item.costo;

                            const costoItemConIVA = costoItemSinIVA * 1.16;

                            const precioSinIVA = item.cantidad * item.precioUnitario;
                            const utilidad = precioSinIVA - costoItemSinIVA;
                            const esPrimerRenglon = index === 0;

                            const deshabilitarCotizacion = compartirCotizacion && !esPrimerRenglon;
                            const deshabilitarOC = compartirOC && !esPrimerRenglon;

                            return (
                              <tr key={item.idTemp} style={{ borderBottom: "1px solid #f0f4f8" }}>
                                <td style={{ padding: "8px 12px" }}>
                                  <div style={{ fontWeight: 700, color: "#1e3a5f" }}>
                                    {item.v_Nombre}
                                  </div>
                                  <div style={{ fontSize: "11px", color: "#7a96b0" }}>
                                    {item.v_TipoServicio} — {item.cantidad} {item.v_Unidad}
                                  </div>
                                </td>

                                {/* No. cotización GI */}
                                <td style={{ padding: "8px 10px" }}>
                                  <input
                                    type="text"
                                    readOnly={deshabilitarCotizacion}
                                    disabled={deshabilitarCotizacion}
                                    className="form-control"
                                    style={{
                                      height: "30px",
                                      padding: "2px 6px",
                                      fontSize: "12px",
                                      borderRadius: "6px",
                                      border: "1px solid #d0dce8",
                                      backgroundColor: deshabilitarCotizacion ? "#e9ecef" : "#ffffff",
                                      color: deshabilitarCotizacion ? "#64748b" : "#1e3a5f",
                                      width: "100%",
                                    }}
                                    value={item.noCotizacionGI}
                                    placeholder={
                                      compartirCotizacion
                                        ? esPrimerRenglon
                                          ? "Cotización (Global)..."
                                          : "(Global)"
                                        : "Cotización..."
                                    }
                                    onChange={(e) => {
                                      if (compartirCotizacion) {
                                        handleCambiarCotizacionGlobal(e.target.value);
                                      } else {
                                        handleActualizarServicio(
                                          item.idTemp,
                                          "noCotizacionGI",
                                          e.target.value
                                        );
                                      }
                                    }}
                                  />
                                </td>

                                {/* No. OC cliente */}
                                <td style={{ padding: "8px 10px" }}>
                                  <input
                                    type="text"
                                    readOnly={deshabilitarOC}
                                    disabled={deshabilitarOC}
                                    className="form-control"
                                    style={{
                                      height: "30px",
                                      padding: "2px 6px",
                                      fontSize: "12px",
                                      borderRadius: "6px",
                                      border: "1px solid #d0dce8",
                                      backgroundColor: deshabilitarOC ? "#e9ecef" : "#ffffff",
                                      color: deshabilitarOC ? "#64748b" : "#1e3a5f",
                                      width: "100%",
                                    }}
                                    value={item.noOCCliente}
                                    placeholder={
                                      compartirOC
                                        ? esPrimerRenglon
                                          ? "OC cliente (Global)..."
                                          : "(Global)"
                                        : "OC cliente..."
                                    }
                                    onChange={(e) => {
                                      if (compartirOC) {
                                        handleCambiarOCGlobal(e.target.value);
                                      } else {
                                        handleActualizarServicio(
                                          item.idTemp,
                                          "noOCCliente",
                                          e.target.value
                                        );
                                      }
                                    }}
                                  />
                                </td>

                                {/* Proveedor */}
                                <td style={{ padding: "8px 10px", fontSize: "12px", color: "#334155", verticalAlign: "middle" }}>
                                  {esProveedor ? (
                                    <span style={{ fontWeight: 600, color: "#1e3a5f" }}>{nombreProveedor}</span>
                                  ) : (
                                    ""
                                  )}
                                </td>

                                {/* No. cot. prov. */}
                                <td style={{ padding: "8px 10px", verticalAlign: "middle" }}>
                                  {esProveedor ? (
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
                                      value={progState.v_NoCotProveedor}
                                      onChange={(e) =>
                                        updateProgState(item.idTemp, {
                                          v_NoCotProveedor: e.target.value,
                                        })
                                      }
                                    />
                                  ) : (
                                    ""
                                  )}
                                </td>

                                {/* No. OC prov. */}
                                <td style={{ padding: "8px 10px", verticalAlign: "middle" }}>
                                  {esProveedor ? (
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
                                      value={progState.v_NoOCProveedor}
                                      onChange={(e) =>
                                        updateProgState(item.idTemp, {
                                          v_NoOCProveedor: e.target.value,
                                        })
                                      }
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
                                    color: utilidad >= 0 ? "#198754" : "#dc3545",
                                  }}
                                >
                                  ${formatearMoneda(utilidad)}
                                </td>
                              </tr>
                            );
                          })
                        )}
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
                          <td colSpan={6} style={{ padding: "10px 12px", fontWeight: 700, color: "#1e3a5f", backgroundColor: "#f8fafc" }}>
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
              </div>
            )}
          </div>

          {/* FOOTER MODAL */}
          <div
            style={{
              padding: "14px 24px",
              borderTop: "1px solid #ddeaf5",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              backgroundColor: "#ffffff",
            }}
          >
            <div>
              <button
                type="button"
                onClick={onCerrar}
                style={{
                  height: "36px",
                  padding: "0 18px",
                  borderRadius: "20px",
                  backgroundColor: "#f4f8fc",
                  border: "1px solid #d0dce8",
                  color: "#4a6580",
                  fontSize: "13px",
                  fontWeight: 500,
                  cursor: "pointer",
                }}
              >
                Cerrar
              </button>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              {pasoActual > 1 && (
                <button
                  type="button"
                  onClick={handleAnterior}
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
                  <ChevronLeft size={16} />
                  <span>Anterior</span>
                </button>
              )}

              {pasoActual < 3 ? (
                <button
                  type="button"
                  disabled={pasoActual === 1 && !sePuedeAvanzar}
                  onClick={handleSiguiente}
                  style={{
                    height: "36px",
                    padding: "0 22px",
                    borderRadius: "20px",
                    backgroundColor:
                      pasoActual === 1 && !sePuedeAvanzar ? "#b5cfe8" : "#2B8FCC",
                    color: "#ffffff",
                    border: "none",
                    fontSize: "13px",
                    fontWeight: 500,
                    cursor:
                      pasoActual === 1 && !sePuedeAvanzar
                        ? "not-allowed"
                        : "pointer",
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
                  onClick={() => setMostrarModalConfirmar(true)}
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
                  <span>Enviar</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <ModalConfirmarAgenda
        abierto={mostrarModalConfirmar}
        onRegresar={() => setMostrarModalConfirmar(false)}
        onConfirmar={handleConfirmarDefinitivo}
        empresaData={empresaDataConfirmacion}
        ventaData={ventaDataConfirmacion}
        serviciosAgregados={serviciosAgregados}
        programacionMap={programacionMap}
        serviciosCatalogo={serviciosCatalogo}
        instructoresCatalogo={instructoresCatalogo}
        proveedoresCatalogo={proveedoresCatalogo}
      />
    </>
  );
};
