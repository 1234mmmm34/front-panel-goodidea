"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import {
  PipcExpediente,
  PipcFormData,
  calculateProgressChecks,
  calcularAvanceSeccion,
  calcularAvanceGlobal,
  getPendingItems,
  calcularDiasProyecto,
  FotoMock,
  TurnoRow,
  UipcMiembroRow,
  PoblacionFijaRow,
  PoblacionFlotanteRow,
  AreaInmuebleRow,
  EquipoRow,
  ProgramaMantenimientoEquipos,
  AgenteEvaluado,
  BrigadistaRow,
  CapacitacionRow,
  SimulacroRow,
  DependenciaDirectorioRow,
  ProveedorDirectorioRow,
  VecinoDirectorioRow,
  AnexoPersonalizado,
  ActividadCalendario,
  getPipcYearFromFechaElaboracion,
  getTurnosDisponibles,
} from "./pipcCalculos";
import {
  uiriRoles,
  JEFES_BRIGADA,
  ANEXOS_CATALOGO,
  getTextoDescripcionInmueble,
  CATALOGO_DIRECTORES_PC,
  CATALOGO_DEPENDENCIAS_EMERGENCIA,
} from "./pipcCatalogos";
import {
  crearExpedienteVacio,
  getDependenciasPorMunicipio,
} from "./pipcMock";
import {
  PipcSeccionClave,
  PipcZona,
  PipcResumen,
  PipcSeccionPut,
} from "@/types/pipc";
import { PipcService, extraerMensajeError } from "@/services/pipc.service";
import {
  serializeSection,
  applySectionJson,
  NOMBRES_SECCIONES,
} from "./pipcSerializacion";
import { useToast } from "@/context/ToastContext";

export const ZONA_A_SECCION: Record<PipcZona, PipcSeccionClave> = {
  "logo-cliente": "generales",
  "politica-seguridad": "inmueble",
  "organigrama": "organizacion",
  "carta-compromiso-comite": "directorios",
  "vecinos-img": "directorios",
  "layout-general": "inventarios",
  "fotos-generales": "inventarios",
  "layout-emergencias": "inventarios",
  "equipo-emergencia-foto": "inventarios",
  "atlas-externo": "atlas",
  "atlas-interno": "atlas",
  "sustancias-quimicas": "riesgos",
  "mant-edificio": "mantenimiento",
  "mant-general": "mantenimiento",
  "equipo-identificacion": "seguridad",
};

export const PHOTO_MAX_DIMENSION = 1600;
export const PHOTO_JPEG_QUALITY = 0.82;

function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("No se pudo leer la imagen"));
    };
    img.src = url;
  });
}

async function compressImageFile(file: File): Promise<{
  blob: Blob;
  width: number;
  height: number;
  advertencia_calidad: boolean;
}> {
  const img = await loadImageFromFile(file);
  let width = img.naturalWidth || img.width;
  let height = img.naturalHeight || img.height;
  const maxSide = Math.max(width, height);

  if (maxSide > PHOTO_MAX_DIMENSION) {
    const ratio = PHOTO_MAX_DIMENSION / maxSide;
    width = Math.round(width * ratio);
    height = Math.round(height * ratio);
  }

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("No se pudo inicializar canvas para compresión");
  ctx.drawImage(img, 0, 0, width, height);

  const blob: Blob = await new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("Error al comprimir imagen"))),
      "image/jpeg",
      PHOTO_JPEG_QUALITY
    );
  });

  const finalMaxSide = Math.max(width, height);
  const advertencia_calidad = finalMaxSide > 0 && finalMaxSide < 800;

  return { blob, width, height, advertencia_calidad };
}

export type GuardandoEstado = "idle" | "guardando" | "guardado" | "error";

/**
 * Sincroniza los 4 renglones de Jefes de Brigada con la UIRI y la UIPC.
 *
 * Reglas:
 * - Nombre: Siempre igual a la UIRI (uiri[rol].nombre). No editable.
 * - Puesto: Sigue a la UIPC en vivo mientras no se haya editado a mano (editado.puesto).
 * - Teléfono: Sigue a la UIPC en vivo mientras no se haya editado a mano (editado.telefono).
 * - Ubicación: Sigue a la UIPC en vivo mientras no se haya editado a mano (editado.ubicacion).
 * - Brigada: Fija por rol (JEFES_BRIGADA) como valor inicial, pero editable (select).
 * - Rol / Función: 'Líder' como valor inicial, pero editable (select).
 * - Turno: Primer turno disponible como valor inicial, editable (select).
 *
 * Si editado.{campo} es false/ausente:
 *   El campo toma exactamente el valor de la UIPC, incluso vacío (al borrar en UIPC, se borra aquí).
 * Si editado.{campo} es true:
 *   Se respeta lo capturado en Brigadistas.
 *
 * Para expedientes existentes que no tienen editado:
 *   Al cargar, se inicializa en false para los tres campos y se re-sincroniza con la UIPC,
 *   limpiando valores residuales si la UIPC está vacía.
 */
export function syncBrigadasDesdeJefes(
  prevBrigadistas: BrigadistaRow[] = [],
  uiriData: Record<string, { nombre?: string }> = {},
  uipcData: UipcMiembroRow[] = [],
  turnosDisp: string[] = []
): BrigadistaRow[] {
  const turnoDefault = turnosDisp[0] || "Turno 1";
  const manuales = (prevBrigadistas || []).filter((b) => !b.jefeRoleId);

  const jefes = JEFES_BRIGADA.map((j) => {
    const prevJefe = (prevBrigadistas || []).find((b) => b.jefeRoleId === j.id);
    const uiri = uiriData[j.id] || {};
    const matchRol = uiriRoles.find((ro) => ro.id === j.id);
    const uipcRow = matchRol
      ? (uipcData || []).find((r) => r.funcion === matchRol.label)
      : undefined;

    const editadoPuesto = Boolean(prevJefe?.editado?.puesto);
    const editadoTelefono = Boolean(prevJefe?.editado?.telefono);
    const editadoUbicacion = Boolean(prevJefe?.editado?.ubicacion);

    const nombre = uiri.nombre || "";
    const puesto = editadoPuesto ? (prevJefe?.puesto ?? "") : (uipcRow?.puesto ?? "");
    const telefono = editadoTelefono ? (prevJefe?.telefono ?? "") : (uipcRow?.telefono ?? "");
    const ubicacion = editadoUbicacion ? (prevJefe?.ubicacion ?? "") : (uipcRow?.ubicacion ?? "");

    return {
      num: 0,
      jefeRoleId: j.id,
      nombre,
      puesto,
      brigada: prevJefe?.brigada || j.brigada,
      rol: prevJefe?.rol || "Líder",
      turno: prevJefe?.turno || turnoDefault,
      telefono,
      ubicacion,
      editado: {
        puesto: editadoPuesto,
        telefono: editadoTelefono,
        ubicacion: editadoUbicacion,
      },
    };
  });

  return [...jefes, ...manuales].map((b, i) => ({
    ...b,
    num: i + 1,
  }));
}

export function usePipcExpediente(servicioId: number | null | undefined) {
  const { toast } = useToast();

  const [expediente, setExpediente] = useState<PipcExpediente | undefined>(undefined);
  const [resumen, setResumen] = useState<PipcResumen | null>(null);
  const [cargando, setCargando] = useState<boolean>(true);
  const [errorCarga, setErrorCarga] = useState<string | null>(null);
  const [servicioSinChecklist, setServicioSinChecklist] = useState<boolean>(false);
  const [servicioPuedeIniciar, setServicioPuedeIniciar] = useState<boolean>(false);
  const [soloLectura, setSoloLectura] = useState<boolean>(false);

  // Versiones de cada sección en el backend
  const [seccionesVersion, setSeccionesVersion] = useState<Record<PipcSeccionClave, number>>({
    generales: 0,
    inmueble: 0,
    organizacion: 0,
    directorios: 0,
    inventarios: 0,
    atlas: 0,
    riesgos: 0,
    mantenimiento: 0,
    seguridad: 0,
    anexos: 0,
    exportar: 0,
  });

  // Secciones sucias pendientes de autoguardado
  const [seccionesDirty, setSeccionesDirty] = useState<Set<PipcSeccionClave>>(new Set());

  // Indicador de autoguardado en encabezado
  const [guardandoEstado, setGuardandoEstado] = useState<GuardandoEstado>("idle");
  const [ultimaHoraGuardado, setUltimaHoraGuardado] = useState<string | null>(null);

  // Modal de conflicto 409
  const [conflictoModal, setConflictoModal] = useState<{
    seccion: PipcSeccionClave;
    nombreSeccion: string;
  } | null>(null);

  // Modal para confirmar quitar foto
  const [fotoConfirmarEliminar, setFotoConfirmarEliminar] = useState<{
    seccionKey: string;
    fotoId: string;
    nombreFoto?: string;
  } | null>(null);

  // Referencias para evitar closures desactualizados en timers y eventos
  const expedienteRef = useRef<PipcExpediente | undefined>(undefined);
  expedienteRef.current = expediente;

  const versionesRef = useRef<Record<PipcSeccionClave, number>>(seccionesVersion);
  versionesRef.current = seccionesVersion;

  const dirtyRef = useRef<Set<PipcSeccionClave>>(seccionesDirty);
  dirtyRef.current = seccionesDirty;

  const soloLecturaRef = useRef<boolean>(soloLectura);
  soloLecturaRef.current = soloLectura;

  const conflictoModalRef = useRef<any>(conflictoModal);
  conflictoModalRef.current = conflictoModal;

  const timersRef = useRef<Partial<Record<PipcSeccionClave, NodeJS.Timeout>>>({});
  const inFlightRef = useRef<Set<PipcSeccionClave>>(new Set());
  const enqueuedRef = useRef<Set<PipcSeccionClave>>(new Set());

  // Referencia a object URLs creados para revocarlos al desmontar
  const objectUrlsRef = useRef<Set<string>>(new Set());

  const registrarObjectUrl = useCallback((url: string) => {
    if (url && url.startsWith("blob:")) {
      objectUrlsRef.current.add(url);
    }
    return url;
  }, []);

  const liberarObjectUrl = useCallback((url: string) => {
    if (url && url.startsWith("blob:") && objectUrlsRef.current.has(url)) {
      try {
        URL.revokeObjectURL(url);
      } catch {}
      objectUrlsRef.current.delete(url);
    }
  }, []);

  // Revocar todos los object URLs al desmontar
  useEffect(() => {
    const urls = objectUrlsRef.current;
    return () => {
      urls.forEach((u) => {
        try {
          URL.revokeObjectURL(u);
        } catch {}
      });
      urls.clear();
    };
  }, []);

  // Manejador del autoguardado para una sección
  const ejecutarGuardadoSeccion = useCallback(
    async (clave: PipcSeccionClave) => {
      if (!servicioId) return;
      if (soloLecturaRef.current) return;
      if (conflictoModalRef.current && conflictoModalRef.current.seccion === clave) return;

      // Si ya hay una petición en vuelo para esta sección, encolar otro guardado al terminar
      if (inFlightRef.current.has(clave)) {
        enqueuedRef.current.add(clave);
        return;
      }

      const expActual = expedienteRef.current;
      if (!expActual) return;

      inFlightRef.current.add(clave);
      setGuardandoEstado("guardando");

      const checks = calculateProgressChecks(expActual);
      const avanceGlobalActual = calcularAvanceGlobal(checks);
      const pends = getPendingItems(expActual);
      const pendsAltaActual = pends.filter((p) => p.prioridad === "Alta").length;

      const payload: PipcSeccionPut = {
        v_Seccion: clave,
        v_Json: JSON.stringify(serializeSection(clave, expActual)),
        i_Version: versionesRef.current[clave] || 0,
        v_Estado: (expActual.form.expediente_estado as any) || "en_captura",
        i_Avance: avanceGlobalActual,
        i_PendientesAlta: pendsAltaActual,
        v_Consultor: expActual.form.consultor_responsable || expActual.v_Consultor || null,
      };

      try {
        const res = await PipcService.putSeccion(Number(servicioId), payload);

        // Actualizar versión de la sección
        versionesRef.current[clave] = res.i_Version;
        setSeccionesVersion((prev) => ({ ...prev, [clave]: res.i_Version }));

        // Quitar de sucias
        setSeccionesDirty((prev) => {
          const next = new Set(prev);
          next.delete(clave);
          return next;
        });

        // Actualizar indicador
        const now = new Date();
        const hh = String(now.getHours()).padStart(2, "0");
        const mm = String(now.getMinutes()).padStart(2, "0");
        setUltimaHoraGuardado(`${hh}:${mm}`);
        setGuardandoEstado("guardado");
      } catch (err: any) {
        const status = err?.response?.status;
        const mensaje = extraerMensajeError(err, `Error al guardar sección ${NOMBRES_SECCIONES[clave]}`);

        if (status === 409) {
          // Conflicto: otra persona guardó la sección
          toast.warning(mensaje);
          setConflictoModal({
            seccion: clave,
            nombreSeccion: NOMBRES_SECCIONES[clave] || clave,
          });
        } else if (status === 423) {
          // Servicio cancelado
          toast.warning(mensaje);
          setSoloLectura(true);
        } else {
          toast.error(mensaje);
          setGuardandoEstado("error");
        }
      } finally {
        inFlightRef.current.delete(clave);

        // Si se encoló otro guardado mientras este estaba en vuelo, ejecutarlo ahora
        if (enqueuedRef.current.has(clave)) {
          enqueuedRef.current.delete(clave);
          ejecutarGuardadoSeccion(clave);
        }
      }
    },
    [servicioId, toast]
  );

  // Marcar sección como sucia y disparar debounce de 2s
  const marcarSeccionSucia = useCallback(
    (clave: PipcSeccionClave, inmediato: boolean = false) => {
      if (soloLecturaRef.current) return;

      setSeccionesDirty((prev) => {
        const next = new Set(prev);
        next.add(clave);
        return next;
      });

      if (timersRef.current[clave]) {
        clearTimeout(timersRef.current[clave]);
      }

      if (inmediato) {
        ejecutarGuardadoSeccion(clave);
      } else {
        timersRef.current[clave] = setTimeout(() => {
          ejecutarGuardadoSeccion(clave);
        }, 2000);
      }
    },
    [ejecutarGuardadoSeccion]
  );

  // Reintentar guardado manual de todas las secciones con error / sucias
  const reintentarGuardado = useCallback(() => {
    const sucias = Array.from(dirtyRef.current);
    if (!sucias.length) return;
    sucias.forEach((clave) => {
      ejecutarGuardadoSeccion(clave);
    });
  }, [ejecutarGuardadoSeccion]);

  // Forzar guardado de todas las secciones pendientes y esperar
  const forzarGuardadoPendiente = useCallback(async (): Promise<boolean> => {
    // Cancelar todos los debounces pendientes y ejecutar inmediatamente
    const sucias = Array.from(dirtyRef.current);
    Object.keys(timersRef.current).forEach((k) => {
      const timer = timersRef.current[k as PipcSeccionClave];
      if (timer) clearTimeout(timer);
    });

    if (sucias.length > 0) {
      await Promise.all(sucias.map((clave) => ejecutarGuardadoSeccion(clave)));
    }

    // Esperar a que terminen peticiones en vuelo
    while (inFlightRef.current.size > 0) {
      await new Promise((r) => setTimeout(r, 100));
    }

    return dirtyRef.current.size === 0;
  }, [ejecutarGuardadoSeccion]);

  // Resolver conflicto 409
  const resolverConflicto = useCallback(
    async (opcion: "servidor" | "local") => {
      if (!conflictoModal || !servicioId) return;
      const { seccion } = conflictoModal;

      try {
        const datos = await PipcService.getExpediente(Number(servicioId));
        const seccionRemota = datos.secciones.find((s) => s.v_Seccion === seccion);
        const versionNueva = seccionRemota ? seccionRemota.i_Version : 1;

        if (opcion === "servidor") {
          // Reemplazar solo esa sección con lo del servidor
          if (expedienteRef.current && seccionRemota) {
            const expActualizado = applySectionJson(
              seccion,
              seccionRemota.v_Json,
              expedienteRef.current
            );
            setExpediente(expActualizado);
          }
          versionesRef.current[seccion] = versionNueva;
          setSeccionesVersion((prev) => ({ ...prev, [seccion]: versionNueva }));
          setSeccionesDirty((prev) => {
            const next = new Set(prev);
            next.delete(seccion);
            return next;
          });
          toast.info(`Se cargaron los cambios del servidor para ${NOMBRES_SECCIONES[seccion]}`);
          setConflictoModal(null);
        } else {
          // Conservar los míos: tomar i_Version nueva y sobrescribir
          versionesRef.current[seccion] = versionNueva;
          setSeccionesVersion((prev) => ({ ...prev, [seccion]: versionNueva }));
          setConflictoModal(null);
          toast.info("Guardando tus cambios en el servidor...");
          ejecutarGuardadoSeccion(seccion);
        }
      } catch (err) {
        toast.error("No se pudo resolver el conflicto. Intenta recargar la página.");
      }
    },
    [conflictoModal, servicioId, toast, ejecutarGuardadoSeccion]
  );

  // Aviso nativo beforeunload si hay cambios sin guardar
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (dirtyRef.current.size > 0 || inFlightRef.current.size > 0) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);

  // CARGA INICIAL DEL EXPEDIENTE
  const cargarExpediente = useCallback(async () => {
    if (!servicioId) {
      setCargando(false);
      return;
    }

    setCargando(true);
    setErrorCarga(null);
    setServicioSinChecklist(false);
    setServicioPuedeIniciar(false);

    try {
      const data = await PipcService.getExpediente(Number(servicioId));
      const res = data.resumen;
      setResumen(res);
      setSoloLectura(!!res.b_Cancelado);

      // Crear base inicial
      let exp = crearExpedienteVacio(
        Number(servicioId),
        res.v_Empresa || "",
        res.v_Empresa || "",
        "",
        "",
        0,
        0,
        res.v_Planta || "Planta Principal",
        res.v_Consultor || ""
      );

      // Determinar si es primera apertura (todas las secciones con i_Version === 0)
      const todasCero = data.secciones.every((s) => s.i_Version === 0);
      if (todasCero) {
        exp.form.empresa_nombre = res.v_Empresa || "";
        exp.form.empresa_razon_social = res.v_Empresa || "";
        if (res.d_FechaInicio) {
          exp.form.fecha_inicio_pipc = res.d_FechaInicio.substring(0, 10);
        }
        exp.form.consultor_responsable = res.v_Consultor || "";
      }

      // Aplicar el estado de cada sección
      const versionesMap: Record<PipcSeccionClave, number> = {
        generales: 0,
        inmueble: 0,
        organizacion: 0,
        directorios: 0,
        inventarios: 0,
        atlas: 0,
        riesgos: 0,
        mantenimiento: 0,
        seguridad: 0,
        anexos: 0,
        exportar: 0,
      };

      data.secciones.forEach((sec) => {
        versionesMap[sec.v_Seccion] = sec.i_Version;
        if (sec.v_Json) {
          exp = applySectionJson(sec.v_Seccion, sec.v_Json, exp);
        }
      });

      const turnosDisp = getTurnosDisponibles(exp.turnosOperativo, exp.turnosAdmin);
      exp.brigadistas = syncBrigadasDesdeJefes(
        exp.brigadistas,
        exp.uiriData,
        exp.uipcData,
        turnosDisp
      );

      setSeccionesVersion(versionesMap);
      versionesRef.current = versionesMap;

      // Armar las fotos por zona con miniaturas cargadas bajo demanda
      const fotosPorZona: Record<string, FotoMock[]> = {};
      const archivosPorCargar: { id: number; zona: string; orden: number }[] = [];

      data.archivos.sort((a, b) => a.i_Orden - b.i_Orden).forEach((arch) => {
        const zona = arch.v_Zona;
        if (!fotosPorZona[zona]) fotosPorZona[zona] = [];

        fotosPorZona[zona].push({
          id: String(arch.i_CvePipcArchivo),
          nombre: arch.v_NombreOriginal,
          url: "", // Se llenará en paralelo
          sizeBytes: arch.i_PesoBytes,
        });

        archivosPorCargar.push({
          id: arch.i_CvePipcArchivo,
          zona: arch.v_Zona,
          orden: arch.i_Orden,
        });
      });

      exp.fotos = fotosPorZona;
      setExpediente(exp);
      setCargando(false);

      // Cargar miniaturas en paralelo limitado a 4
      if (archivosPorCargar.length > 0) {
        const queue = [...archivosPorCargar];
        const workers = Array(Math.min(4, queue.length)).fill(null).map(async () => {
          while (queue.length > 0) {
            const item = queue.shift();
            if (!item) break;
            try {
              const blob = await PipcService.getArchivoBlob(item.id);
              const url = URL.createObjectURL(blob);
              registrarObjectUrl(url);

              setExpediente((prev) => {
                if (!prev) return prev;
                const list = prev.fotos[item.zona] || [];
                const updated = list.map((f) =>
                  f.id === String(item.id) ? { ...f, url } : f
                );
                return {
                  ...prev,
                  fotos: {
                    ...prev.fotos,
                    [item.zona]: updated,
                  },
                };
              });
            } catch (err) {
              // Silencioso en carga de thumbnail, pero se intentará en export
            }
          }
        });
        Promise.all(workers);
      }
    } catch (err: any) {
      setCargando(false);
      const status = err?.response?.status;

      if (status === 404) {
        // Verificar si se puede iniciar
        try {
          const res = await PipcService.getResumen(Number(servicioId));
          setResumen(res);
          if (res.b_TienePlanContingencia && !res.b_Cancelado) {
            setServicioPuedeIniciar(true);
          } else {
            setServicioSinChecklist(true);
          }
        } catch {
          setServicioSinChecklist(true);
        }
      } else {
        const msg = extraerMensajeError(err, "Error al cargar checklist PIPC");
        setErrorCarga(msg);
        toast.error(msg);
      }
    }
  }, [servicioId, registrarObjectUrl, toast]);

  useEffect(() => {
    cargarExpediente();
  }, [cargarExpediente]);

  // Actualizador universal del expediente local
  const update = useCallback(
    (
      cambios: Partial<PipcExpediente> | ((prev: PipcExpediente) => PipcExpediente),
      claveSeccion?: PipcSeccionClave
    ) => {
      setExpediente((prev) => {
        if (!prev) return prev;
        const next = typeof cambios === "function" ? cambios(prev) : { ...prev, ...cambios };
        return next;
      });

      if (claveSeccion) {
        marcarSeccionSucia(claveSeccion);
      }
    },
    [marcarSeccionSucia]
  );

  // Métricas calculadas
  const sectionChecks = useMemo(() => {
    if (!expediente) return [];
    return calculateProgressChecks(expediente);
  }, [expediente]);

  const porcentajesSecciones = useMemo(() => {
    return sectionChecks.map((checks) => calcularAvanceSeccion(checks));
  }, [sectionChecks]);

  const avanceGlobal = useMemo(() => {
    return calcularAvanceGlobal(sectionChecks);
  }, [sectionChecks]);

  const pendientes = useMemo(() => {
    if (!expediente) return [];
    return getPendingItems(expediente);
  }, [expediente]);

  const pendientesAlta = useMemo(() => {
    return pendientes.filter((p) => p.prioridad === "Alta");
  }, [pendientes]);

  const diasProyecto = useMemo(() => {
    return calcularDiasProyecto(expediente?.form.fecha_inicio_pipc);
  }, [expediente?.form.fecha_inicio_pipc]);

  // Actualizadores por campo
  const setFormField = useCallback(
    <K extends keyof PipcFormData>(field: K, value: PipcFormData[K]) => {
      let seccionAfectada: PipcSeccionClave = "generales";

      if (
        [
          "historia_empresa",
          "descripcion_inmueble",
          "politica_seguridad",
          "politica_modo",
          "superficie_m2",
          "superficie_terreno_m2",
        ].includes(field)
      ) {
        seccionAfectada = "inmueble";
      } else if (["no_pertenece_comite"].includes(field)) {
        seccionAfectada = "directorios";
      } else if (["contexto_zona"].includes(field)) {
        seccionAfectada = "riesgos";
      } else if (["mant_edificio_modo", "mant_general_modo"].includes(field)) {
        seccionAfectada = "mantenimiento";
      } else if (
        [
          "seguro_fecha",
          "seguro_poliza",
          "seguro_aseguradora",
          "prevencion_explosiones_no_aplica",
          "prevencion_explosiones_texto",
          "atencion_medica",
        ].includes(field)
      ) {
        seccionAfectada = "seguridad";
      } else if (
        [
          "expediente_estado",
          "consultor_responsable",
          "fecha_visita_tecnica",
          "notas_internas_consultor",
        ].includes(field)
      ) {
        seccionAfectada = "exportar";
      }

      const inmediato = field === "expediente_estado";

      setExpediente((prev) => {
        if (!prev) return prev;
        const nextForm = { ...prev.form, [field]: value };

        if (field === "superficie_m2" || field === "superficie_terreno_m2") {
          const supConst = field === "superficie_m2" ? value : prev.form.superficie_m2;
          nextForm.descripcion_inmueble = getTextoDescripcionInmueble(String(supConst || ""));
        }
        if (field === "fecha_elaboracion") {
          const anio = getPipcYearFromFechaElaboracion(value as string);
          nextForm.calendario_anio = anio;
        }

        return { ...prev, form: nextForm };
      });

      marcarSeccionSucia(seccionAfectada, inmediato);
    },
    [marcarSeccionSucia]
  );

  const setForm = useCallback(
    (cambios: Partial<PipcFormData>, seccion: PipcSeccionClave = "generales") => {
      setExpediente((prev) => {
        if (!prev) return prev;
        return { ...prev, form: { ...prev.form, ...cambios } };
      });
      marcarSeccionSucia(seccion);
    },
    [marcarSeccionSucia]
  );

  const setPlanTipoYMunicipio = useCallback(
    (tipo: "estatal" | "municipal" | "", muni?: string) => {
      setExpediente((prev) => {
        if (!prev) return prev;
        const nextTipo = tipo !== undefined ? tipo : prev.form.plan_tipo;
        const nextMuni = muni !== undefined ? muni : prev.form.empresa_municipio;
        const nextMuniReal = nextMuni === "Otro" ? prev.form.empresa_municipio_otro : nextMuni;

        let titularNombre = prev.form.pc_titular_nombre;
        let titularCargo = prev.form.pc_titular_cargo;
        let titularDep = prev.form.pc_dependencia;

        const entrada =
          nextTipo === "estatal"
            ? (CATALOGO_DIRECTORES_PC as any).estado
            : nextTipo === "municipal"
            ? (CATALOGO_DIRECTORES_PC as any).municipios[nextMuniReal] || null
            : null;

        if (entrada) {
          titularNombre = entrada.titular;
          titularCargo = entrada.cargo;
          titularDep = entrada.dependencia;
        }

        let nextMunicipioEmergencias = prev.municipioEmergencias;
        let nextDepsEmergencia = prev.dependenciasEmergencia;
        if (
          nextMuniReal &&
          !prev.municipioEmergencias &&
          (!prev.dependenciasEmergencia || prev.dependenciasEmergencia.length === 0)
        ) {
          const matchMuni = CATALOGO_DEPENDENCIAS_EMERGENCIA.ciudades.find(
            (c) => c.municipio.toLowerCase() === nextMuniReal.toLowerCase()
          );
          if (matchMuni) {
            nextMunicipioEmergencias = matchMuni.municipio;
            nextDepsEmergencia = getDependenciasPorMunicipio(matchMuni.municipio);
          }
        }

        return {
          ...prev,
          municipioEmergencias: nextMunicipioEmergencias,
          dependenciasEmergencia: nextDepsEmergencia,
          form: {
            ...prev.form,
            plan_tipo: nextTipo,
            empresa_municipio: nextMuni,
            pc_titular_nombre: titularNombre,
            pc_titular_cargo: titularCargo,
            pc_dependencia: titularDep,
          },
        };
      });

      marcarSeccionSucia("generales");
      marcarSeccionSucia("directorios");
    },
    [marcarSeccionSucia]
  );

  const setTurnosAdmin = useCallback(
    (turnos: TurnoRow[]) => {
      update((prev) => ({ ...prev, turnosAdmin: turnos }), "generales");
    },
    [update]
  );

  const setTurnosOperativo = useCallback(
    (turnos: TurnoRow[]) => {
      update((prev) => ({ ...prev, turnosOperativo: turnos }), "generales");
    },
    [update]
  );

  const setUiriRole = useCallback(
    (roleId: string, nombre: string) => {
      setExpediente((prev) => {
        if (!prev) return prev;
        const nextUiri = {
          ...prev.uiriData,
          [roleId]: { nombre },
        };

        const nextUipc = (prev.uipcData || []).map((row) => {
          const matchRol = uiriRoles.find((r) => r.id === roleId);
          if (matchRol && row.funcion === matchRol.label) {
            return { ...row, nombre };
          }
          return row;
        });

        const turnosDisp = getTurnosDisponibles(prev.turnosOperativo, prev.turnosAdmin);
        const nextBrigadistas = syncBrigadasDesdeJefes(
          prev.brigadistas,
          nextUiri,
          nextUipc,
          turnosDisp
        );

        return {
          ...prev,
          uiriData: nextUiri,
          uipcData: nextUipc,
          brigadistas: nextBrigadistas,
        };
      });

      marcarSeccionSucia("organizacion");
      marcarSeccionSucia("seguridad");
    },
    [marcarSeccionSucia]
  );

  const setUipcData = useCallback(
    (data: UipcMiembroRow[]) => {
      setExpediente((prev) => {
        if (!prev) return prev;
        const turnosDisp = getTurnosDisponibles(prev.turnosOperativo, prev.turnosAdmin);
        const nextBrigadistas = syncBrigadasDesdeJefes(
          prev.brigadistas,
          prev.uiriData,
          data,
          turnosDisp
        );
        return {
          ...prev,
          uipcData: data,
          brigadistas: nextBrigadistas,
        };
      });
      marcarSeccionSucia("organizacion");
      marcarSeccionSucia("seguridad");
    },
    [marcarSeccionSucia]
  );

  const setCalendarioActividades = useCallback(
    (data: ActividadCalendario[]) => {
      update((prev) => ({ ...prev, calendarioActividades: data }), "organizacion");
    },
    [update]
  );

  const setMunicipioEmergencias = useCallback(
    (muni: string) => {
      update((prev) => ({ ...prev, municipioEmergencias: muni }), "directorios");
    },
    [update]
  );

  const setDependenciasEmergencia = useCallback(
    (data: DependenciaDirectorioRow[]) => {
      update((prev) => ({ ...prev, dependenciasEmergencia: data }), "directorios");
    },
    [update]
  );

  const setProveedoresEmergencia = useCallback(
    (data: ProveedorDirectorioRow[]) => {
      update((prev) => ({ ...prev, proveedoresEmergencia: data }), "directorios");
    },
    [update]
  );

  const setVecinosEmergencia = useCallback(
    (data: VecinoDirectorioRow[]) => {
      update((prev) => ({ ...prev, vecinosEmergencia: data }), "directorios");
    },
    [update]
  );

  const setPoblacionFija = useCallback(
    (data: PoblacionFijaRow[]) => {
      update((prev) => ({ ...prev, poblacionFija: data }), "inventarios");
    },
    [update]
  );

  const setPoblacionFlotante = useCallback(
    (data: PoblacionFlotanteRow[]) => {
      update((prev) => ({ ...prev, poblacionFlotante: data }), "inventarios");
    },
    [update]
  );

  const setAreasInmueble = useCallback(
    (data: AreaInmuebleRow[]) => {
      update((prev) => ({ ...prev, areasInmueble: data }), "inventarios");
    },
    [update]
  );

  const setEquiposEmergencia = useCallback(
    (data: EquipoRow[]) => {
      update((prev) => ({ ...prev, equiposEmergencia: data }), "inventarios");
    },
    [update]
  );

  const setEquiposAltoRiesgo = useCallback(
    (data: EquipoRow[]) => {
      update((prev) => ({ ...prev, equiposAltoRiesgo: data }), "inventarios");
    },
    [update]
  );

  const setProgramaEquiposEmergencia = useCallback(
    (data: ProgramaMantenimientoEquipos) => {
      update((prev) => ({ ...prev, programaEquiposEmergencia: data }), "inventarios");
    },
    [update]
  );

  const setProgramaEquiposAltoRiesgo = useCallback(
    (data: ProgramaMantenimientoEquipos) => {
      update((prev) => ({ ...prev, programaEquiposAltoRiesgo: data }), "inventarios");
    },
    [update]
  );

  const setAgenteEvaluado = useCallback(
    (agenteId: string, cambios: Partial<AgenteEvaluado>) => {
      setExpediente((prev) => {
        if (!prev) return prev;
        const actual = prev.agentesData[agenteId] || {
          probabilidad: "",
          consecuencia: "",
          texto: "",
          noAplica: false,
        };
        return {
          ...prev,
          agentesData: {
            ...prev.agentesData,
            [agenteId]: { ...actual, ...cambios },
          },
        };
      });
      marcarSeccionSucia("riesgos");
    },
    [marcarSeccionSucia]
  );

  const setMantCalendarioEdificio = useCallback(
    (data: ActividadCalendario[]) => {
      update((prev) => ({ ...prev, mantCalendarioEdificio: data }), "mantenimiento");
    },
    [update]
  );

  const setMantCalendarioGeneral = useCallback(
    (data: ActividadCalendario[]) => {
      update((prev) => ({ ...prev, mantCalendarioGeneral: data }), "mantenimiento");
    },
    [update]
  );

  const setBrigadistas = useCallback(
    (data: BrigadistaRow[]) => {
      update((prev) => ({ ...prev, brigadistas: data }), "seguridad");
    },
    [update]
  );

  const aplicarImportBrigadistas = useCallback(
    (nuevos: BrigadistaRow[]) => {
      update((prev) => {
        const turnosDisp = getTurnosDisponibles(prev.turnosOperativo, prev.turnosAdmin);
        const turnoDefault = turnosDisp[0] || "Turno 1";

        const jefes = (prev.brigadistas || []).filter((b) => b.jefeRoleId);
        const manuales = nuevos.map((n, i) => ({
          ...n,
          turno: n.turno || turnoDefault,
          num: jefes.length + i + 1,
        }));
        return {
          ...prev,
          brigadistas: [...jefes, ...manuales].map((b, i) => ({ ...b, num: i + 1 })),
        };
      }, "seguridad");
    },
    [update]
  );

  const setCapacitacion = useCallback(
    (data: CapacitacionRow[]) => {
      update((prev) => ({ ...prev, capacitacion: data }), "seguridad");
    },
    [update]
  );

  const setSimulacros = useCallback(
    (data: SimulacroRow[]) => {
      update((prev) => ({ ...prev, simulacros: data }), "seguridad");
    },
    [update]
  );

  const setMaterialesPeligrosos = useCallback(
    (data: string[]) => {
      update((prev) => ({ ...prev, materialesPeligrosos: data }), "riesgos");
    },
    [update]
  );

  const setRecomendaciones = useCallback(
    (data: string[]) => {
      update((prev) => ({ ...prev, recomendaciones: data }), "seguridad");
    },
    [update]
  );

  const toggleAnexo = useCallback(
    (id: string) => {
      setExpediente((prev) => {
        if (!prev) return prev;
        const sel = prev.anexosSeleccionados || [];
        const next = sel.includes(id) ? sel.filter((x) => x !== id) : [...sel, id];
        return { ...prev, anexosSeleccionados: next };
      });
      marcarSeccionSucia("anexos");
    },
    [marcarSeccionSucia]
  );

  const marcarTodosAnexos = useCallback(() => {
    setExpediente((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        anexosSeleccionados: ANEXOS_CATALOGO.map((a) => a.id),
        anexosPersonalizados: (prev.anexosPersonalizados || []).map((ap) => ({
          ...ap,
          aplica: true,
        })),
      };
    });
    marcarSeccionSucia("anexos");
  }, [marcarSeccionSucia]);

  const desmarcarTodosAnexos = useCallback(() => {
    setExpediente((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        anexosSeleccionados: [],
        anexosPersonalizados: (prev.anexosPersonalizados || []).map((ap) => ({
          ...ap,
          aplica: false,
        })),
      };
    });
    marcarSeccionSucia("anexos");
  }, [marcarSeccionSucia]);

  const agregarAnexoPersonalizado = useCallback(
    (descripcion: string) => {
      setExpediente((prev) => {
        if (!prev) return prev;
        const id = `pers-${Date.now()}`;
        const nuevo: AnexoPersonalizado = { id, descripcion, aplica: true };
        return {
          ...prev,
          anexosPersonalizados: [...(prev.anexosPersonalizados || []), nuevo],
        };
      });
      marcarSeccionSucia("anexos");
    },
    [marcarSeccionSucia]
  );

  const quitarAnexoPersonalizado = useCallback(
    (id: string) => {
      setExpediente((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          anexosPersonalizados: (prev.anexosPersonalizados || []).filter((p) => p.id !== id),
        };
      });
      marcarSeccionSucia("anexos");
    },
    [marcarSeccionSucia]
  );

  const toggleAnexoPersonalizado = useCallback(
    (id: string) => {
      setExpediente((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          anexosPersonalizados: (prev.anexosPersonalizados || []).map((p) =>
            p.id === id ? { ...p, aplica: !p.aplica } : p
          ),
        };
      });
      marcarSeccionSucia("anexos");
    },
    [marcarSeccionSucia]
  );

  const setAnexosPersonalizados = useCallback(
    (pers: AnexoPersonalizado[]) => {
      update((prev) => ({ ...prev, anexosPersonalizados: pers }), "anexos");
    },
    [update]
  );

  // FOTOS: Subir con compresión a canvas y llamada al API
  const agregarFoto = useCallback(
    async (seccionKey: string, archivo: File, soloUna?: boolean) => {
      if (!servicioId) return;
      if (soloLecturaRef.current) return;

      const zona = seccionKey as PipcZona;
      let archivoParaSubir: File = archivo;

      // Compresión canvas (excepto logo-cliente)
      if (zona !== "logo-cliente") {
        try {
          const comp = await compressImageFile(archivo);
          if (comp.advertencia_calidad) {
            toast.warning(
              `⚠️ ${archivo.name} tiene resolución baja (${comp.width}×${comp.height}px)`
            );
          }
          const nuevoNombre = archivo.name.replace(/\.[^.]+$/, ".jpg");
          archivoParaSubir = new File([comp.blob], nuevoNombre, { type: "image/jpeg" });
        } catch (err) {
          toast.error("Error al procesar y comprimir la imagen");
          return;
        }
      }

      // Minatura temporal
      const tempId = `temp-${Date.now()}`;
      const previewUrl = registrarObjectUrl(URL.createObjectURL(archivoParaSubir));

      const fotoTemp: FotoMock = {
        id: tempId,
        nombre: archivoParaSubir.name,
        url: previewUrl,
        sizeBytes: archivoParaSubir.size,
      };

      // Agregar a la vista temporalmente
      setExpediente((prev) => {
        if (!prev) return prev;
        const list = soloUna ? [] : prev.fotos[zona] || [];
        return {
          ...prev,
          fotos: {
            ...prev.fotos,
            [zona]: [...list, fotoTemp],
          },
        };
      });

      try {
        const subido = await PipcService.subirArchivo(
          Number(servicioId),
          zona,
          archivoParaSubir,
          archivoParaSubir.name
        );

        // Reemplazar el temporal con el ID real
        const fotoReal: FotoMock = {
          id: String(subido.i_CvePipcArchivo),
          nombre: subido.v_NombreOriginal,
          url: previewUrl,
          sizeBytes: subido.i_PesoBytes,
        };

        setExpediente((prev) => {
          if (!prev) return prev;
          const list = prev.fotos[zona] || [];
          const updated = soloUna
            ? [fotoReal]
            : list.map((f) => (f.id === tempId ? fotoReal : f));
          return {
            ...prev,
            fotos: {
              ...prev.fotos,
              [zona]: updated,
            },
          };
        });

        toast.success(`Foto ${subido.v_NombreOriginal} subida`);

        // Disparar guardado de la sección correspondiente para recalcular avance
        const sec = ZONA_A_SECCION[zona] || "generales";
        ejecutarGuardadoSeccion(sec);
      } catch (err: any) {
        // Quitar la miniatura temporal si falló
        setExpediente((prev) => {
          if (!prev) return prev;
          const list = prev.fotos[zona] || [];
          return {
            ...prev,
            fotos: {
              ...prev.fotos,
              [zona]: list.filter((f) => f.id !== tempId),
            },
          };
        });
        liberarObjectUrl(previewUrl);
        const msg = extraerMensajeError(err, "No se pudo subir la foto");
        toast.error(msg);
      }
    },
    [servicioId, registrarObjectUrl, liberarObjectUrl, toast, ejecutarGuardadoSeccion]
  );

  // Solicitar eliminación de foto (muestra modal de confirmación)
  const solicitarQuitarFoto = useCallback(
    (seccionKey: string, fotoId: string) => {
      if (soloLecturaRef.current) return;
      const zona = seccionKey as PipcZona;
      const foto = (expediente?.fotos[zona] || []).find((f) => f.id === fotoId);
      setFotoConfirmarEliminar({
        seccionKey,
        fotoId,
        nombreFoto: foto?.nombre || "esta fotografía",
      });
    },
    [expediente]
  );

  // Confirmación efectiva de quitar foto
  const confirmarQuitarFoto = useCallback(async () => {
    if (!fotoConfirmarEliminar || !servicioId) return;
    const { seccionKey, fotoId } = fotoConfirmarEliminar;
    const zona = seccionKey as PipcZona;

    const fotoIdNum = Number(fotoId);

    try {
      if (!isNaN(fotoIdNum) && fotoIdNum > 0) {
        await PipcService.deleteArchivo(fotoIdNum);
      }
    } catch (err: any) {
      const status = err?.response?.status;
      // 404: continuar quitándola de la vista igual
      if (status !== 404) {
        toast.error(extraerMensajeError(err, "No se pudo eliminar la foto del servidor"));
        setFotoConfirmarEliminar(null);
        return;
      }
    }

    // Quitar de la vista y liberar url
    setExpediente((prev) => {
      if (!prev) return prev;
      const list = prev.fotos[zona] || [];
      const item = list.find((f) => f.id === fotoId);
      if (item?.url) liberarObjectUrl(item.url);

      return {
        ...prev,
        fotos: {
          ...prev.fotos,
          [zona]: list.filter((f) => f.id !== fotoId),
        },
      };
    });

    setFotoConfirmarEliminar(null);
    toast.success("Foto eliminada");

    // Disparar guardado de la sección correspondiente
    const sec = ZONA_A_SECCION[zona] || "generales";
    ejecutarGuardadoSeccion(sec);
  }, [fotoConfirmarEliminar, servicioId, liberarObjectUrl, toast, ejecutarGuardadoSeccion]);

  return {
    expediente,
    resumen,
    cargando,
    errorCarga,
    servicioSinChecklist,
    servicioPuedeIniciar,
    soloLectura,
    reintentarCarga: cargarExpediente,

    sectionChecks,
    porcentajesSecciones,
    avanceGlobal,
    pendientes,
    pendientesAlta,
    diasProyecto,

    guardandoEstado,
    ultimaHoraGuardado,
    reintentarGuardado,
    forzarGuardadoPendiente,

    conflictoModal,
    resolverConflicto,

    fotoConfirmarEliminar,
    setFotoConfirmarEliminar,
    confirmarQuitarFoto,

    setFormField,
    setForm,
    setPlanTipoYMunicipio,

    setUiriRole,
    setUiriNombre: setUiriRole,
    setUipcData,
    setTurnosAdmin,
    setTurnosOperativo,
    setCalendarioActividades,
    setMantCalendarioEdificio,
    setMantCalendarioGeneral,

    setMunicipioEmergencias,
    setDependenciasEmergencia,
    setProveedoresEmergencia,
    setVecinosEmergencia,

    setPoblacionFija,
    setPoblacionFlotante,
    setAreasInmueble,
    setEquiposEmergencia,
    setEquiposAltoRiesgo,
    setProgramaEquiposEmergencia,
    setProgramaEquiposAltoRiesgo,

    setAgenteEvaluado,
    setAgente: setAgenteEvaluado,

    setBrigadistas,
    syncBrigadasDesdeJefes,
    aplicarImportBrigadistas,
    setCapacitacion,
    setSimulacros,
    setMaterialesPeligrosos,
    setRecomendaciones,

    toggleAnexo,
    marcarTodosAnexos,
    desmarcarTodosAnexos,
    agregarAnexoPersonalizado,
    quitarAnexoPersonalizado,
    toggleAnexoPersonalizado,
    setAnexosPersonalizados,

    agregarFoto,
    quitarFoto: solicitarQuitarFoto,
  };
}
