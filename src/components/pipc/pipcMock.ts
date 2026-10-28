import {
  CATALOGO_DEPENDENCIAS_EMERGENCIA,
  uiriRoles,
  JEFES_BRIGADA,
  calendarioData,
  getTextoDescripcionInmueble,
  TEXTO_PREVENCION_EXPLOSIONES_APLICA,
  TEXTO_ATENCION_MEDICA_BASE,
  getAllAgentesBase,
} from "./pipcCatalogos";
import {
  PipcExpediente,
  PipcFormData,
  AgenteEvaluado,
  ProgramaMantenimientoEquipos,
  BrigadistaRow,
} from "./pipcCalculos";

export const MESES_PROG = [
  "Ene",
  "Feb",
  "Mar",
  "Abr",
  "May",
  "Jun",
  "Jul",
  "Ago",
  "Sep",
  "Oct",
  "Nov",
  "Dic",
];

export interface PipcResumen {
  i_CveServAgendaDet: number;
  v_Planta: string;
  v_Consultor: string;
}

export function crearAgentesDefault(): Record<string, AgenteEvaluado> {
  const map: Record<string, AgenteEvaluado> = {};
  getAllAgentesBase().forEach((ag) => {
    map[ag.id] = {
      probabilidad: "",
      consecuencia: "",
      texto: ag.textoWord || "",
      noAplica: false,
    };
  });
  return map;
}

export function crearProgramaEquiposDefault(equipos: { equipo: string }[]): ProgramaMantenimientoEquipos {
  const prog: ProgramaMantenimientoEquipos = {};
  equipos.forEach((e) => {
    if (e.equipo && e.equipo.trim()) {
      prog[e.equipo] = {};
      MESES_PROG.forEach((m) => {
        prog[e.equipo][m] = { p: 0, r: 0 };
      });
    }
  });
  return prog;
}

export function getDependenciasPorMunicipio(municipio: string) {
  const match = CATALOGO_DEPENDENCIAS_EMERGENCIA.ciudades.find(
    (c) => c.municipio.toLowerCase() === (municipio || "").toLowerCase()
  );
  if (!match) return [];
  return match.dependencias.map((d) => ({
    dependencia: d.dependencia,
    telefono: d.telefono,
    llegada: d.llegada || "",
  }));
}

export function crearExpedienteVacio(
  iCveServAgendaDet: number,
  empresaNombreComercial: string = "",
  razonSocial: string = "",
  domicilio: string = "",
  telefono: string = "",
  iCveEmpresa: number = 0,
  iCvePlanta: number = 0,
  vPlanta: string = "Planta Principal",
  consultor: string = "",
  fechaInicioPipc?: string
): PipcExpediente {
  const anio = new Date().getFullYear();
  const uiriDataInit: Record<string, { nombre: string }> = {};
  uiriRoles.forEach((r) => {
    uiriDataInit[r.id] = { nombre: "" };
  });

  const formInit: PipcFormData = {
    empresa_nombre: empresaNombreComercial,
    empresa_razon_social: razonSocial,
    empresa_giro: "",
    empresa_responsable: "",
    empresa_rep_legal: "",
    empresa_domicilio: domicilio,
    empresa_domicilio_notificaciones: domicilio,
    empresa_nacionalidad: "Mexicana",
    empresa_telefono: telefono,

    plan_tipo: "",
    empresa_municipio: "",
    empresa_municipio_otro: "",
    pc_titular_nombre: "",
    pc_titular_cargo: "",
    pc_dependencia: "",

    consultor_externo_nombre: "Ing. Faustino Carlos Alatorre Hernández",
    consultor_externo_registro: "DPCE-APF-146-2025",

    personal_admin: "",
    personal_operativo: "",
    fecha_elaboracion: new Date().toISOString().split("T")[0],
    fecha_inicio_pipc: fechaInicioPipc || new Date().toISOString().split("T")[0],
    superficie_m2: "",
    superficie_terreno_m2: "",
    historia_empresa: "",
    descripcion_inmueble: getTextoDescripcionInmueble(""),
    politica_seguridad: "",
    politica_modo: "texto",

    calendario_anio: anio,

    no_pertenece_comite: false,

    contexto_zona: "",

    mant_edificio_modo: "imagen",
    mant_general_modo: "imagen",

    seguro_fecha: "",
    seguro_poliza: "",
    seguro_aseguradora: "",
    prevencion_explosiones_no_aplica: false,
    prevencion_explosiones_texto: TEXTO_PREVENCION_EXPLOSIONES_APLICA,
    atencion_medica: TEXTO_ATENCION_MEDICA_BASE,

    expediente_estado: "en_captura",
    consultor_responsable: consultor,
    fecha_visita_tecnica: "",
    notas_internas_consultor: "",
  };

  const brigadistasInit: BrigadistaRow[] = JEFES_BRIGADA.map((j, i) => ({
    num: i + 1,
    jefeRoleId: j.id,
    nombre: "",
    puesto: "",
    brigada: j.brigada,
    rol: "Líder",
    turno: "Turno 1",
    telefono: "",
    ubicacion: "",
  }));

  return {
    id: iCveServAgendaDet,
    i_CveEmpresa: iCveEmpresa,
    i_CvePlanta: iCvePlanta,
    v_Planta: vPlanta,
    v_Consultor: consultor,
    i_CveServAgendaDet: iCveServAgendaDet,
    form: formInit,
    turnosAdmin: [],
    turnosOperativo: [],
    uiriData: uiriDataInit,
    uipcData: [],
    calendarioActividades: calendarioData.map((c) => ({
      actividad: c.actividad,
      meses: [...c.meses],
    })),
    municipioEmergencias: "",
    dependenciasEmergencia: [],
    proveedoresEmergencia: [
      { proveedor: "Pipas de agua", direccion: "", telefono: "", productos: "" },
      { proveedor: "Extintores", direccion: "", telefono: "", productos: "" },
      { proveedor: "Ambulancias", direccion: "", telefono: "", productos: "" },
    ],
    vecinosEmergencia: [],
    poblacionFija: [],
    poblacionFlotante: [],
    areasInmueble: [],
    equiposEmergencia: [],
    equiposAltoRiesgo: [],
    programaEquiposEmergencia: {},
    programaEquiposAltoRiesgo: {},
    agentesData: crearAgentesDefault(),
    mantCalendarioEdificio: [{ actividad: "", meses: [] }],
    mantCalendarioGeneral: [{ actividad: "", meses: [] }],
    brigadistas: brigadistasInit,
    capacitacion: [],
    simulacros: [],
    materialesPeligrosos: [],
    recomendaciones: [],
    anexosSeleccionados: [],
    anexosPersonalizados: [],
    fotos: {
      "logo-cliente": [],
      "politica-seguridad": [],
      organigrama: [],
      "vecinos-img": [],
      "carta-compromiso-comite": [],
      "layout-general": [],
      "fotos-generales": [],
      "layout-emergencias": [],
      "equipo-emergencia-foto": [],
      "atlas-externo": [],
      "atlas-interno": [],
      "sustancias-quimicas": [],
      "mant-edificio": [],
      "mant-general": [],
      "equipo-identificacion": [],
    },
  };
}
