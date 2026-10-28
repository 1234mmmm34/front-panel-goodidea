import {
  PipcExpediente,
  PipcFormData,
} from "./pipcCalculos";
import { PipcSeccionClave } from "@/types/pipc";

export const NOMBRES_SECCIONES: Record<PipcSeccionClave, string> = {
  generales: "Datos Generales",
  inmueble: "Inmueble",
  organizacion: "Organización UIPC",
  directorios: "Directorios",
  inventarios: "Inventarios",
  atlas: "Atlas de Riesgos",
  riesgos: "Análisis de Riesgos",
  mantenimiento: "Mantenimiento",
  seguridad: "Brigadas, Seguridad y Medidas",
  anexos: "Anexos",
  exportar: "Exportar",
};

/**
 * Serializa una sección individual a su objeto JSON para PUT /api/pipc/{id}/seccion
 */
export function serializeSection(clave: PipcSeccionClave, exp: PipcExpediente): any {
  const f = exp.form;
  switch (clave) {
    case "generales":
      return {
        empresa_nombre: f.empresa_nombre || "",
        empresa_razon_social: f.empresa_razon_social || "",
        empresa_giro: f.empresa_giro || "",
        plan_tipo: f.plan_tipo || "",
        empresa_municipio: f.empresa_municipio || "",
        empresa_municipio_otro: f.empresa_municipio_otro || "",
        pc_titular_nombre: f.pc_titular_nombre || "",
        pc_titular_cargo: f.pc_titular_cargo || "",
        pc_dependencia: f.pc_dependencia || "",
        consultor_externo_nombre: f.consultor_externo_nombre || "",
        consultor_externo_registro: f.consultor_externo_registro || "",
        empresa_responsable: f.empresa_responsable || "",
        empresa_rep_legal: f.empresa_rep_legal || "",
        empresa_domicilio: f.empresa_domicilio || "",
        empresa_domicilio_notificaciones: f.empresa_domicilio_notificaciones || "",
        empresa_nacionalidad: f.empresa_nacionalidad || "",
        empresa_telefono: f.empresa_telefono || "",
        personal_admin: f.personal_admin || "",
        personal_operativo: f.personal_operativo || "",
        fecha_elaboracion: f.fecha_elaboracion || "",
        fecha_inicio_pipc: f.fecha_inicio_pipc || "",
        superficie_m2: f.superficie_m2 || "",
        superficie_terreno_m2: f.superficie_terreno_m2 || "",
        turnos: {
          admin: exp.turnosAdmin || [],
          operativo: exp.turnosOperativo || [],
        },
      };

    case "inmueble":
      return {
        historia_empresa: f.historia_empresa || "",
        descripcion_inmueble: f.descripcion_inmueble || "",
        politica_seguridad: f.politica_seguridad || "",
        politica_modo: f.politica_modo || "texto",
      };

    case "organizacion":
      return {
        uiri: exp.uiriData || {},
        uipc: exp.uipcData || [],
        calendario: exp.calendarioActividades || [],
        calendario_anio: f.calendario_anio || "",
      };

    case "directorios":
      return {
        municipio_emergencias: exp.municipioEmergencias || "",
        dependencias_emergencia: exp.dependenciasEmergencia || [],
        proveedores: exp.proveedoresEmergencia || [],
        vecinos: exp.vecinosEmergencia || [],
        no_pertenece_comite_ayuda_mutua: !!f.no_pertenece_comite,
      };

    case "inventarios":
      return {
        poblacion: exp.poblacionFija || [],
        flotante: exp.poblacionFlotante || [],
        areas: exp.areasInmueble || [],
        equipos_emergencia: exp.equiposEmergencia || [],
        equipos_alto_riesgo: exp.equiposAltoRiesgo || [],
        programa_mantenimiento: exp.programaEquiposEmergencia || {},
        programa_alto_riesgo: exp.programaEquiposAltoRiesgo || {},
      };

    case "atlas":
      return {};

    case "riesgos":
      return {
        agentesData: exp.agentesData || {},
        contexto_zona: f.contexto_zona || "",
        materiales_peligrosos: exp.materialesPeligrosos || [],
      };

    case "mantenimiento":
      return {
        modo: {
          edificio: f.mant_edificio_modo || "imagen",
          general: f.mant_general_modo || "imagen",
        },
        calendarios: {
          edificio: exp.mantCalendarioEdificio || [],
          general: exp.mantCalendarioGeneral || [],
        },
      };

    case "seguridad":
      return {
        brigadas: exp.brigadistas || [],
        capacitacion: exp.capacitacion || [],
        simulacros: exp.simulacros || [],
        seguro_fecha: f.seguro_fecha || "",
        seguro_poliza: f.seguro_poliza || "",
        seguro_aseguradora: f.seguro_aseguradora || "",
        prevencion_explosiones_no_aplica: !!f.prevencion_explosiones_no_aplica,
        prevencion_explosiones_texto: f.prevencion_explosiones_texto || "",
        atencion_medica: f.atencion_medica || "",
        recomendaciones: exp.recomendaciones || [],
      };

    case "anexos":
      return {
        anexosSeleccionados: exp.anexosSeleccionados || [],
        anexosPersonalizados: exp.anexosPersonalizados || [],
      };

    case "exportar":
      return {
        expediente_estado: f.expediente_estado || "en_captura",
        consultor_responsable: f.consultor_responsable || "",
        fecha_visita_tecnica: f.fecha_visita_tecnica || "",
        notas_internas_consultor: f.notas_internas_consultor || "",
      };

    default:
      return {};
  }
}

/**
 * Deserializa el JSON guardado en BD y actualiza el estado local de una sección
 */
export function applySectionJson(
  clave: PipcSeccionClave,
  rawJson: string | null,
  expActual: PipcExpediente
): PipcExpediente {
  if (!rawJson) return expActual;

  let parsed: any;
  try {
    parsed = typeof rawJson === "string" ? JSON.parse(rawJson) : rawJson;
  } catch (e) {
    console.error(`Error al parsear JSON de sección ${clave}:`, e);
    return expActual;
  }

  if (!parsed || typeof parsed !== "object") return expActual;

  const nextExp: PipcExpediente = {
    ...expActual,
    form: { ...expActual.form },
  };

  switch (clave) {
    case "generales": {
      const keys: (keyof PipcFormData)[] = [
        "empresa_nombre",
        "empresa_razon_social",
        "empresa_giro",
        "plan_tipo",
        "empresa_municipio",
        "empresa_municipio_otro",
        "pc_titular_nombre",
        "pc_titular_cargo",
        "pc_dependencia",
        "consultor_externo_nombre",
        "consultor_externo_registro",
        "empresa_responsable",
        "empresa_rep_legal",
        "empresa_domicilio",
        "empresa_domicilio_notificaciones",
        "empresa_nacionalidad",
        "empresa_telefono",
        "personal_admin",
        "personal_operativo",
        "fecha_elaboracion",
        "fecha_inicio_pipc",
        "superficie_m2",
        "superficie_terreno_m2",
      ];
      keys.forEach((k) => {
        if (parsed[k] !== undefined) {
          (nextExp.form as any)[k] = parsed[k];
        }
      });
      if (parsed.turnos) {
        if (Array.isArray(parsed.turnos.admin)) nextExp.turnosAdmin = parsed.turnos.admin;
        if (Array.isArray(parsed.turnos.operativo)) nextExp.turnosOperativo = parsed.turnos.operativo;
      }
      break;
    }

    case "inmueble": {
      if (parsed.historia_empresa !== undefined) nextExp.form.historia_empresa = parsed.historia_empresa;
      if (parsed.descripcion_inmueble !== undefined) nextExp.form.descripcion_inmueble = parsed.descripcion_inmueble;
      if (parsed.politica_seguridad !== undefined) nextExp.form.politica_seguridad = parsed.politica_seguridad;
      if (parsed.politica_modo !== undefined) nextExp.form.politica_modo = parsed.politica_modo;
      break;
    }

    case "organizacion": {
      if (parsed.uiri && typeof parsed.uiri === "object") nextExp.uiriData = parsed.uiri;
      if (Array.isArray(parsed.uipc)) nextExp.uipcData = parsed.uipc;
      if (Array.isArray(parsed.calendario)) nextExp.calendarioActividades = parsed.calendario;
      if (parsed.calendario_anio !== undefined) nextExp.form.calendario_anio = parsed.calendario_anio;
      break;
    }

    case "directorios": {
      if (parsed.municipio_emergencias !== undefined) nextExp.municipioEmergencias = parsed.municipio_emergencias;
      if (Array.isArray(parsed.dependencias_emergencia)) nextExp.dependenciasEmergencia = parsed.dependencias_emergencia;
      if (Array.isArray(parsed.proveedores)) nextExp.proveedoresEmergencia = parsed.proveedores;
      if (Array.isArray(parsed.vecinos)) nextExp.vecinosEmergencia = parsed.vecinos;
      if (parsed.no_pertenece_comite_ayuda_mutua !== undefined) {
        nextExp.form.no_pertenece_comite = Boolean(parsed.no_pertenece_comite_ayuda_mutua);
      }
      break;
    }

    case "inventarios": {
      if (Array.isArray(parsed.poblacion)) nextExp.poblacionFija = parsed.poblacion;
      if (Array.isArray(parsed.flotante)) nextExp.poblacionFlotante = parsed.flotante;
      if (Array.isArray(parsed.areas)) nextExp.areasInmueble = parsed.areas;
      if (Array.isArray(parsed.equipos_emergencia)) nextExp.equiposEmergencia = parsed.equipos_emergencia;
      if (Array.isArray(parsed.equipos_alto_riesgo)) nextExp.equiposAltoRiesgo = parsed.equipos_alto_riesgo;
      if (parsed.programa_mantenimiento && typeof parsed.programa_mantenimiento === "object") {
        nextExp.programaEquiposEmergencia = parsed.programa_mantenimiento;
      }
      if (parsed.programa_alto_riesgo && typeof parsed.programa_alto_riesgo === "object") {
        nextExp.programaEquiposAltoRiesgo = parsed.programa_alto_riesgo;
      }
      break;
    }

    case "atlas": {
      break;
    }

    case "riesgos": {
      if (parsed.agentesData && typeof parsed.agentesData === "object") nextExp.agentesData = parsed.agentesData;
      if (parsed.contexto_zona !== undefined) nextExp.form.contexto_zona = parsed.contexto_zona;
      if (Array.isArray(parsed.materiales_peligrosos)) nextExp.materialesPeligrosos = parsed.materiales_peligrosos;
      break;
    }

    case "mantenimiento": {
      if (parsed.modo && typeof parsed.modo === "object") {
        if (parsed.modo.edificio) nextExp.form.mant_edificio_modo = parsed.modo.edificio;
        if (parsed.modo.general) nextExp.form.mant_general_modo = parsed.modo.general;
      }
      if (parsed.calendarios && typeof parsed.calendarios === "object") {
        if (Array.isArray(parsed.calendarios.edificio)) nextExp.mantCalendarioEdificio = parsed.calendarios.edificio;
        if (Array.isArray(parsed.calendarios.general)) nextExp.mantCalendarioGeneral = parsed.calendarios.general;
      }
      break;
    }

    case "seguridad": {
      if (Array.isArray(parsed.brigadas)) nextExp.brigadistas = parsed.brigadas;
      if (Array.isArray(parsed.capacitacion)) nextExp.capacitacion = parsed.capacitacion;
      if (Array.isArray(parsed.simulacros)) nextExp.simulacros = parsed.simulacros;
      if (parsed.seguro_fecha !== undefined) nextExp.form.seguro_fecha = parsed.seguro_fecha;
      if (parsed.seguro_poliza !== undefined) nextExp.form.seguro_poliza = parsed.seguro_poliza;
      if (parsed.seguro_aseguradora !== undefined) nextExp.form.seguro_aseguradora = parsed.seguro_aseguradora;
      if (parsed.prevencion_explosiones_no_aplica !== undefined) {
        nextExp.form.prevencion_explosiones_no_aplica = Boolean(parsed.prevencion_explosiones_no_aplica);
      }
      if (parsed.prevencion_explosiones_texto !== undefined) {
        nextExp.form.prevencion_explosiones_texto = parsed.prevencion_explosiones_texto;
      }
      if (parsed.atencion_medica !== undefined) nextExp.form.atencion_medica = parsed.atencion_medica;
      if (Array.isArray(parsed.recomendaciones)) nextExp.recomendaciones = parsed.recomendaciones;
      break;
    }

    case "anexos": {
      if (Array.isArray(parsed.anexosSeleccionados)) nextExp.anexosSeleccionados = parsed.anexosSeleccionados;
      if (Array.isArray(parsed.anexosPersonalizados)) nextExp.anexosPersonalizados = parsed.anexosPersonalizados;
      break;
    }

    case "exportar": {
      if (parsed.expediente_estado) nextExp.form.expediente_estado = parsed.expediente_estado;
      if (parsed.consultor_responsable) nextExp.form.consultor_responsable = parsed.consultor_responsable;
      if (parsed.fecha_visita_tecnica) nextExp.form.fecha_visita_tecnica = parsed.fecha_visita_tecnica;
      if (parsed.notas_internas_consultor !== undefined) nextExp.form.notas_internas_consultor = parsed.notas_internas_consultor;
      break;
    }
  }

  return nextExp;
}

/**
 * Reconstruye el objeto de captura completo para captura_html_backup.json y para reabrir en HTML v3_42
 */
export function getLegacyCaptureState(exp: PipcExpediente): any {
  return {
    ...exp.form,
    uiri: exp.uiriData || {},
    uipc: exp.uipcData || [],
    calendario: exp.calendarioActividades || [],
    mantenimiento_programas: {
      modo: {
        edificio: exp.form.mant_edificio_modo || "imagen",
        general: exp.form.mant_general_modo || "imagen",
      },
      calendarios: {
        edificio: exp.mantCalendarioEdificio || [],
        general: exp.mantCalendarioGeneral || [],
      },
    },
    capacitacion: exp.capacitacion || [],
    simulacros: exp.simulacros || [],
    brigadas: (exp.brigadistas || []).map(({ editado, ...b }) => b),
    inventarios: {
      poblacion: exp.poblacionFija || [],
      flotante: exp.poblacionFlotante || [],
      areas: exp.areasInmueble || [],
      equipos_emergencia: exp.equiposEmergencia || [],
      equipos_alto_riesgo: exp.equiposAltoRiesgo || [],
      programa_mantenimiento: exp.programaEquiposEmergencia || {},
      programa_alto_riesgo: exp.programaEquiposAltoRiesgo || {},
    },
    directorios: {
      dependencias_emergencia: {
        municipio: exp.municipioEmergencias || "",
        dependencias: exp.dependenciasEmergencia || [],
      },
      proveedores: exp.proveedoresEmergencia || [],
      vecinos: exp.vecinosEmergencia || [],
      no_pertenece_comite_ayuda_mutua: !!exp.form.no_pertenece_comite,
    },
    turnos: {
      admin: exp.turnosAdmin || [],
      operativo: exp.turnosOperativo || [],
    },
    agentesData: exp.agentesData || {},
    materiales_peligrosos: exp.materialesPeligrosos || [],
    recomendaciones: exp.recomendaciones || [],
  };
}
