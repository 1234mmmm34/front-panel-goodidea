"use client";

import JSZip from "jszip";
import {
  PipcExpediente,
  calcularDiasProyecto,
  getPendingItems,
  calcularAvanceGlobal,
  calculateProgressChecks,
  obtenerEstadoInfo,
  getPipcYearFromFechaElaboracion,
  migrateProbabilidad,
  migrateConsecuencia,
  calcMagnitud,
} from "./pipcCalculos";
import {
  ANEXOS_CATALOGO,
  TEXTO_OBJETIVO_PIPC,
  TEXTO_NO_PERTENECE_COMITE,
  TEXTO_NO_APLICA,
  TEXTO_SIN_EVALUAR,
  PROBABILIDAD_TEXTO,
  CONSECUENCIA_TEXTO,
  MESES_NOMBRE_MIN,
  CATALOGO_DIRECTORES_PC,
  getAllAgentesBase,
  agentesExtNat,
  agentesExtHum,
  agentesInt,
  GrupoAgentes,
} from "./pipcCatalogos";
import { getLegacyCaptureState } from "./pipcSerializacion";
import {
  generarOrganigramaCanvasBlob,
  generarCalendarioCanvasBlob,
  generarProgramaMantenimientoCanvasBlob,
  generarTablaMesesCanvasBlob,
} from "./pipcCanvasGenerators";

export const APP_VERSION = "v3.42";
export const SCHEMA_VERSION = "4.7";

function fechaLargaTexto(iso: string) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso || ""));
  if (!m) return { texto: "", dia: "", mes: "", anio: "" };
  const mes = MESES_NOMBRE_MIN[parseInt(m[2], 10) - 1] || "";
  return { texto: `${m[3]} de ${mes} del ${m[1]}`, dia: m[3], mes: mes, anio: m[1] };
}

function datosRiesgoParaExport(d?: { probabilidad?: string; consecuencia?: string; noAplica?: boolean }) {
  d = d || {};
  if (d.noAplica) {
    return {
      probabilidad: null,
      consecuencia: null,
      probabilidad_texto: TEXTO_NO_APLICA,
      consecuencia_texto: TEXTO_NO_APLICA,
      magnitud_riesgo: TEXTO_NO_APLICA,
    };
  }
  const p = migrateProbabilidad(d.probabilidad);
  const c = migrateConsecuencia(d.consecuencia);
  return {
    probabilidad: p || null,
    consecuencia: c || null,
    probabilidad_texto: p ? (PROBABILIDAD_TEXTO as any)[p] : TEXTO_SIN_EVALUAR,
    consecuencia_texto: c ? (CONSECUENCIA_TEXTO as any)[c] : TEXTO_SIN_EVALUAR,
    magnitud_riesgo: calcMagnitud(p, c) || TEXTO_SIN_EVALUAR,
  };
}

function buildDocumentosAdicionalesExport(exp: PipcExpediente) {
  const d = exp.form;
  const tipo = d.plan_tipo;
  const muni = d.empresa_municipio === "Otro" ? d.empresa_municipio_otro : d.empresa_municipio;
  const nombre = d.pc_titular_nombre || "";
  const cargo = d.pc_titular_cargo || "";
  const dep = d.pc_dependencia || "";

  // Verificar si es de catálogo
  const e =
    tipo === "estatal"
      ? (CATALOGO_DIRECTORES_PC as any).estado
      : tipo === "municipal"
      ? (CATALOGO_DIRECTORES_PC as any).municipios[muni]
      : null;
  const esCatalogo = !!e && e.titular === nombre && e.cargo === cargo && e.dependencia === dep;
  const femenino = /^directora\b/i.test(cargo);
  const cargoActa = /del Estado$/i.test(cargo) ? cargo + " de Nuevo León" : cargo;

  const fecha = fechaLargaTexto(d.fecha_elaboracion);
  const razon = String(d.empresa_razon_social || "").trim() || String(d.empresa_nombre || "").trim();
  const domicilio = String(d.empresa_domicilio || "").trim();

  const ORDEN_ACTA = [
    "presidente",
    "secretario_ejecutivo",
    "director",
    "suplente",
    "jefe_brigada_br",
    "jefe_brigada_ev",
    "jefe_brigada_pa",
    "jefe_brigada_ci",
  ];
  const integrantes: Record<string, string> = {};
  const nombres: string[] = [];
  ORDEN_ACTA.forEach((id) => {
    const n = String(exp.uiriData?.[id]?.nombre || "").trim();
    integrantes[id] = n;
    if (n) nombres.push(n);
  });

  return {
    plan_contingencias: {
      tipo: tipo,
      tipo_texto: tipo === "estatal" ? "Estatal" : tipo === "municipal" ? "Municipal" : "",
      municipio: muni,
      autoridad: {
        titular_nombre: nombre,
        titular_cargo: cargo,
        titular_cargo_acta: cargoActa,
        dependencia: dep,
        genero: femenino ? "F" : "M",
        fuente: esCatalogo ? "catalogo" : "captura_manual",
      },
    },
    oficio_responsiva: {
      lugar: muni,
      fecha_texto: fecha.texto,
      destinatario_nombre: nombre,
      destinatario_cargo: cargo,
      presentado_ante: tipo === "estatal" ? "Dirección Estatal de Protección Civil" : dep,
      razon_social: razon,
      domicilio: domicilio,
      consultor_nombre: d.consultor_externo_nombre || "",
      consultor_cargo: "Consultor externo",
      consultor_registro: d.consultor_externo_registro || "",
      representante_legal: String(d.empresa_rep_legal || "").trim(),
    },
    acta_constitutiva_uiri: {
      razon_social: razon,
      domicilio: domicilio,
      municipio: muni,
      dia: fecha.dia,
      mes: fecha.mes,
      anio: fecha.anio,
      hora_inicio: "10:00",
      hora_fin: "12:00",
      integrantes: integrantes,
      integrantes_lista_texto: nombres.length ? nombres.join(", ") + "." : "",
      numero_participantes: nombres.length,
      titular_nombre: nombre,
      titular_cargo: cargoActa,
      titular_presentacion: nombre
        ? (femenino ? "la " : "el ") + nombre + (cargoActa ? ", C. " + cargoActa : "")
        : "",
      pie_firma_titular: cargo ? (femenino ? "La " : "El ") + cargo : "",
    },
  };
}

export function buildPhotoMetadataForExport(exp: PipcExpediente): any[] {
  const list: any[] = [];
  const zonas = Object.keys(exp.fotos || {}).sort();

  zonas.forEach((zona) => {
    const arr = exp.fotos[zona] || [];
    arr.forEach((p, idx) => {
      const slug = zona.replace(/[^a-zA-Z0-9_-]/g, "-").toLowerCase();
      let storedName: string;
      if (zona === "logo-cliente") {
        const ext = p.nombre.includes(".") ? p.nombre.split(".").pop() : "png";
        storedName = `logo_cliente.${ext}`;
      } else {
        storedName = `${slug}_${String(idx + 1).padStart(3, "0")}.jpg`;
      }

      list.push({
        id: p.id,
        seccion: zona,
        nombre_original: p.nombre || "",
        nombre_archivo: storedName,
        ruta_relativa: `fotografias/${slug}/${storedName}`,
        mime_type: zona === "logo-cliente" ? (p.nombre.endsWith(".png") ? "image/png" : "image/jpeg") : "image/jpeg",
        ancho_px: p.width || null,
        alto_px: p.height || null,
        peso_bytes: p.sizeBytes || null,
        peso_original_bytes: p.sizeBytes || null,
        hash_sha256: "",
        advertencia_calidad: !!p.advertencia_calidad,
        fecha_captura: new Date().toISOString(),
        orden: idx + 1,
      });
    });
  });

  return list;
}

function buildRiesgosByGroup(groups: GrupoAgentes[], exp: PipcExpediente) {
  return groups.map((grupo) => ({
    grupo: grupo.grupo,
    agentes: grupo.agentes.map((ag) => {
      const d = exp.agentesData[ag.id] || {};
      const r = datosRiesgoParaExport(d);
      return {
        id: ag.id,
        nombre: ag.nombre,
        clave: ag.clave,
        numero: ag.numero,
        fenomeno: ag.fenomeno,
        descripcion: ag.descripcion || "",
        brigadas: ag.brigadas_texto || "",
        recursos_minimos: ag.recursos || "",
        aplica_texto: d.noAplica ? "NO" : "SÍ",
        aplica: !d.noAplica,
        probabilidad: r.probabilidad,
        consecuencia: r.consecuencia,
        probabilidad_texto: r.probabilidad_texto,
        consecuencia_texto: r.consecuencia_texto,
        magnitud_riesgo: r.magnitud_riesgo,
        redaccion_documento: d.texto || ag.textoWord,
      };
    }),
  }));
}

function collectTablaResumenRiesgos(exp: PipcExpediente) {
  return getAllAgentesBase().map((ag) => {
    const d = exp.agentesData[ag.id] || {};
    const r = datosRiesgoParaExport(d);
    return {
      id: ag.id,
      clave: ag.clave,
      numero: ag.numero,
      tipo_fenomeno: ag.origen === "interno" ? "Interno" : `Externo ${ag.naturaleza}`,
      fenomeno_perturbador: ag.fenomeno,
      elemento: ag.nombre,
      aplica: d.noAplica ? "No" : "Sí",
      probabilidad: r.probabilidad,
      consecuencia: r.consecuencia,
      probabilidad_texto: r.probabilidad_texto,
      consecuencia_texto: r.consecuencia_texto,
      magnitud_riesgo: r.magnitud_riesgo,
    };
  });
}

function collectProcedimientosEmergencia(exp: PipcExpediente) {
  return getAllAgentesBase().map((ag) => {
    const d = exp.agentesData[ag.id] || {};
    return {
      id: ag.id,
      clave: ag.clave,
      agente: ag.nombre,
      aplica: !d.noAplica,
      aplica_texto: d.noAplica ? "NO" : "SÍ",
    };
  });
}

function collectMatrizCongruencia(exp: PipcExpediente) {
  return getAllAgentesBase()
    .filter((ag) => !(exp.agentesData[ag.id] || {}).noAplica)
    .map((ag) => ({
      id: ag.id,
      clave: ag.clave,
      agente: ag.nombre,
      origen: ag.origen === "interno" ? "Interno" : "Externo",
      brigadas: ag.brigadas_texto,
      recursos_minimos: ag.recursos,
    }));
}

function buildRiesgosPorId(exp: PipcExpediente) {
  const porId: Record<string, any> = {};
  getAllAgentesBase().forEach((ag) => {
    const d = exp.agentesData[ag.id] || {};
    const r = datosRiesgoParaExport(d);
    porId[ag.id] = {
      id: ag.id,
      nombre: ag.nombre,
      grupo: ag.grupo,
      clave: ag.clave,
      numero: ag.numero,
      fenomeno: ag.fenomeno,
      descripcion: ag.descripcion || "",
      brigadas: ag.brigadas_texto || "",
      recursos_minimos: ag.recursos || "",
      aplica_texto: d.noAplica ? "NO" : "SÍ",
      aplica: !d.noAplica,
      probabilidad: r.probabilidad,
      consecuencia: r.consecuencia,
      probabilidad_texto: r.probabilidad_texto,
      consecuencia_texto: r.consecuencia_texto,
      magnitud_riesgo: r.magnitud_riesgo,
      redaccion_documento: d.texto || ag.textoWord,
    };
  });
  return porId;
}

export function generateFieldDictionary(
  obj: any
): Array<{ tag: string; ruta_json: string; tipo: string; valor_actual: any }> {
  const entries: Array<{ tag: string; ruta_json: string; tipo: string; valor_actual: any }> = [];
  const skipKeys = new Set(["diccionario_campos", "captura_html"]);

  function walk(value: any, path: string[]) {
    if (!path.length || skipKeys.has(path[0])) return;
    if (
      value === null ||
      value === undefined ||
      typeof value === "string" ||
      typeof value === "number" ||
      typeof value === "boolean"
    ) {
      entries.push({
        tag: `{${path.join(".")}}`,
        ruta_json: path.join("."),
        tipo: Array.isArray(value) ? "array" : typeof value,
        valor_actual: value !== null && value !== undefined ? value : "",
      });
      return;
    }
    if (Array.isArray(value)) {
      entries.push({
        tag: `{${path.join(".")}}`,
        ruta_json: path.join("."),
        tipo: "array",
        valor_actual: `${value.length} registro(s)`,
      });
      return;
    }
    if (typeof value === "object") {
      Object.keys(value).forEach((k) => {
        walk(value[k], path.concat(k));
      });
    }
  }

  Object.keys(obj).forEach((k) => walk(obj[k], [k]));
  return entries.filter(
    (e) => !e.ruta_json.startsWith("captura_html") && !e.ruta_json.startsWith("diccionario_campos")
  );
}

export function refrescarDiccionarioExportacion(exportObj: any) {
  if (!exportObj) return;
  const anterior = exportObj.diccionario_campos;
  delete exportObj.diccionario_campos;
  exportObj.diccionario_campos = generateFieldDictionary(exportObj);
  if (!exportObj.diccionario_campos || !exportObj.diccionario_campos.length) {
    exportObj.diccionario_campos = anterior || [];
  }
}

export function buildSemanticExportObject(
  exp: PipcExpediente,
  exportType: "avance" | "final" = "avance"
) {
  const d = exp.form;
  const documentosAdicionales = buildDocumentosAdicionalesExport(exp);
  const fotos = buildPhotoMetadataForExport(exp);
  const getPhotos = (key: string) => fotos.filter((f) => f.seccion === key);
  const pendientes = getPendingItems(exp);
  const sectionChecks = calculateProgressChecks(exp);
  const avance = calcularAvanceGlobal(sectionChecks);
  const estadoInfo = obtenerEstadoInfo(d.expediente_estado || "en_captura");
  const now = new Date().toISOString();

  const mantEdificioCal =
    d.mant_edificio_modo === "calendario"
      ? {
          anio: getPipcYearFromFechaElaboracion(d.fecha_elaboracion),
          actividades: (exp.mantCalendarioEdificio || []).filter((r) => String(r.actividad || "").trim()),
        }
      : null;

  const mantGeneralCal =
    d.mant_general_modo === "calendario"
      ? {
          anio: getPipcYearFromFechaElaboracion(d.fecha_elaboracion),
          actividades: (exp.mantCalendarioGeneral || []).filter((r) => String(r.actividad || "").trim()),
        }
      : null;

  const clean: any = {
    schema_version: SCHEMA_VERSION,
    app_version: APP_VERSION,
    fecha_exportacion: now,
    tipo_exportacion: exportType,
    expediente: {
      estado: d.expediente_estado || "en_captura",
      estado_texto: estadoInfo.texto,
      consultor_responsable: d.consultor_responsable || exp.v_Consultor || "",
      fecha_visita_tecnica: d.fecha_visita_tecnica || "",
      fecha_elaboracion: d.fecha_elaboracion || "",
      fecha_inicio_pipc: d.fecha_inicio_pipc || "",
      dias_proyecto: calcularDiasProyecto(d.fecha_inicio_pipc),
      notas_internas_consultor: d.notas_internas_consultor || "",
      pendientes_detectados: pendientes,
      porcentaje_avance_estimado: avance,
    },
    empresa: {
      nombre_comercial: d.empresa_nombre || "",
      razon_social: d.empresa_razon_social || "",
      giro: d.empresa_giro || "",
      responsable_notificaciones: d.empresa_responsable || "",
      representante_legal: d.empresa_rep_legal || "",
      domicilio_fisico: d.empresa_domicilio || "",
      domicilio_notificaciones: d.empresa_domicilio_notificaciones || "",
      nacionalidad: d.empresa_nacionalidad || "",
      telefono: d.empresa_telefono || "",
      logotipo_cliente: getPhotos("logo-cliente")[0] || null,
    },
    plan_contingencias: documentosAdicionales.plan_contingencias,
    oficio_responsiva: documentosAdicionales.oficio_responsiva,
    acta_constitutiva_uiri: documentosAdicionales.acta_constitutiva_uiri,
    personal: {
      administrativo_total: d.personal_admin || "",
      operativo_total: d.personal_operativo || "",
      turnos_administrativos: exp.turnosAdmin || [],
      turnos_operativos: exp.turnosOperativo || [],
    },
    inmueble: {
      historia_empresa: d.historia_empresa || "",
      descripcion: d.descripcion_inmueble || "",
      superficie_construccion_m2: d.superficie_m2 || "",
      superficie_terreno_m2: d.superficie_terreno_m2 || "",
      politica_seguridad: {
        modo:
          d.politica_modo ||
          ((exp.fotos["politica-seguridad"] || []).length && !(d.politica_seguridad || "").trim()
            ? "imagen"
            : "texto"),
        texto: d.politica_seguridad || "",
        fotografias: getPhotos("politica-seguridad"),
      },
      objetivo_pipc: TEXTO_OBJETIVO_PIPC,
    },
    organizacion_uipc: {
      integrantes_uiri: exp.uiriData || {},
      integrantes_uipc: exp.uipcData || [],
      calendario_actividades: {
        anio: getPipcYearFromFechaElaboracion(d.fecha_elaboracion),
        actividades: exp.calendarioActividades || [],
      },
      organigrama_fotografias: getPhotos("organigrama"),
      organigrama_generado: null,
      organigrama_para_template: null,
      calendario_actividades_imagen: null,
      calendario_actividades_para_template: null,
    },
    directorios: {
      dependencias_emergencia: {
        municipio: exp.municipioEmergencias || "",
        dependencias: exp.dependenciasEmergencia || [],
      },
      proveedores_emergencia: exp.proveedoresEmergencia || [],
      no_pertenece_comite_ayuda_mutua: !!d.no_pertenece_comite,
      comites_ayuda_mutua_vecinos: d.no_pertenece_comite ? [] : exp.vecinosEmergencia || [],
      mapa_vecinos_fotografias: d.no_pertenece_comite ? [] : getPhotos("vecinos-img"),
      comite_ayuda_mutua_texto: d.no_pertenece_comite ? TEXTO_NO_PERTENECE_COMITE : "",
      carta_compromiso_comite_fotografias: d.no_pertenece_comite
        ? getPhotos("carta-compromiso-comite")
        : [],
    },
    inventarios: {
      poblacion_fija: exp.poblacionFija || [],
      poblacion_flotante: exp.poblacionFlotante || [],
      areas: exp.areasInmueble || [],
      equipos_emergencia: exp.equiposEmergencia || [],
      equipos_alto_riesgo: exp.equiposAltoRiesgo || [],
      programa_mantenimiento_equipos_emergencia: exp.programaEquiposEmergencia || {},
      programa_mantenimiento_equipos_alto_riesgo: exp.programaEquiposAltoRiesgo || {},
      programa_mantenimiento_equipos_emergencia_imagen: null,
      programa_mantenimiento_equipos_alto_riesgo_imagen: null,
    },
    riesgos: {
      externos: {
        naturales: buildRiesgosByGroup(agentesExtNat, exp),
        humanos: buildRiesgosByGroup(agentesExtHum, exp),
      },
      internos: buildRiesgosByGroup(agentesInt, exp),
      por_id: buildRiesgosPorId(exp),
      tabla_resumen: collectTablaResumenRiesgos(exp),
      procedimientos: collectProcedimientosEmergencia(exp),
      matriz_congruencia: collectMatrizCongruencia(exp),
      totales: (() => {
        const t = collectTablaResumenRiesgos(exp);
        return {
          evaluados: t.length,
          aplican: t.filter((x) => x.aplica === "Sí").length,
          no_aplican: t.filter((x) => x.aplica === "No").length,
        };
      })(),
      contexto_zona: d.contexto_zona || "",
      sustancias_quimicas_fotografias: getPhotos("sustancias-quimicas"),
    },
    mantenimiento: {
      programa_edificio_modo: d.mant_edificio_modo,
      programa_edificio_fotografias: d.mant_edificio_modo === "imagen" ? getPhotos("mant-edificio") : [],
      programa_edificio_calendario: mantEdificioCal,
      programa_edificio_calendario_imagen: null,
      programa_general_modo: d.mant_general_modo,
      programa_general_fotografias: d.mant_general_modo === "imagen" ? getPhotos("mant-general") : [],
      programa_general_calendario: mantGeneralCal,
      programa_general_calendario_imagen: null,
    },
    brigadas_seguridad_medidas: {
      brigadistas: (exp.brigadistas || []).map(({ editado, ...b }) => b),
      capacitacion: exp.capacitacion || [],
      capacitacion_imagen: null,
      simulacros: exp.simulacros || [],
      simulacros_imagen: null,
      seguro_responsabilidad_civil: {
        fecha_inicio_vigencia: d.seguro_fecha || "",
        numero_poliza: d.seguro_poliza || "",
        aseguradora: d.seguro_aseguradora || "",
      },
      materiales_peligrosos: exp.materialesPeligrosos || [],
      prevencion_explosiones_no_aplica: !!d.prevencion_explosiones_no_aplica,
      prevencion_explosiones_texto: d.prevencion_explosiones_texto || "",
      equipo_identificacion_fotografias: getPhotos("equipo-identificacion"),
      atencion_medica: d.atencion_medica || "",
      recomendaciones: exp.recomendaciones || [],
    },
    evidencias_fotograficas: {
      todas: fotos,
      logo_cliente: getPhotos("logo-cliente"),
      layout_general: getPhotos("layout-general"),
      fotografias_generales_instalaciones: getPhotos("fotos-generales"),
      layout_emergencias: getPhotos("layout-emergencias"),
      equipo_emergencia: getPhotos("equipo-emergencia-foto"),
      atlas_externo: getPhotos("atlas-externo"),
      atlas_interno: getPhotos("atlas-interno"),
    },
    fotografias: fotos,
    captura_html: getLegacyCaptureState(exp),
  };

  clean.diccionario_campos = generateFieldDictionary(clean);
  return clean;
}

export function dictionaryToMarkdown(
  entries: Array<{ tag: string; ruta_json: string; tipo: string; valor_actual: any }>
): string {
  const lines = [
    "# Diccionario de campos para template Word",
    "",
    "Usa los tags con el formato `{ruta.campo}` dentro del archivo Word.",
    "",
    "| Tag Word | Ruta JSON | Tipo | Valor actual |",
    "|---|---|---|---|",
  ];
  entries.forEach((e) => {
    const val = String(e.valor_actual ?? "")
      .replace(/\|/g, "\\|")
      .replace(/\n/g, " ")
      .slice(0, 180);
    lines.push(`| \`${e.tag}\` | \`${e.ruta_json}\` | ${e.tipo} | ${val} |`);
  });
  return lines.join("\n");
}

export function pendientesToMarkdown(pendientes: any[]): string {
  const lines = ["# Pendientes detectados", ""];
  if (!pendientes.length) {
    lines.push("No se detectaron pendientes críticos con las reglas actuales.");
    return lines.join("\n");
  }
  lines.push("| Sección | Pendiente | Prioridad |", "|---|---|---|");
  pendientes.forEach((p) => {
    lines.push(`| ${p.seccion} | ${p.pendiente} | ${p.prioridad} |`);
  });
  return lines.join("\n");
}

export function instruccionesIaMarkdown(): string {
  return `# Instrucciones para generar el PIPC en Word

- Usa \`datos_pipc.json\` como fuente principal.
- Sustituye tags del Word con formato \`{empresa.nombre_comercial}\`, \`{inmueble.descripcion}\`, etc.
- Consulta \`diccionario_campos.md\` para conocer las rutas disponibles.
- No inventes datos faltantes. Si un dato está vacío, deja el tag sin reemplazar o marca [PENDIENTE].
- Las fotografías están en la carpeta \`fotografias/\`. Inserta imágenes usando las rutas relativas indicadas en \`fotografias[].ruta_relativa\`.
- Respeta el formato original del template Word.
- Las notas en \`expediente.notas_internas_consultor\` son internas y no deben aparecer en el documento final, salvo que el usuario lo solicite.
`;
}

export function buildAnexosExportObject(exportObj: any, exp: PipcExpediente) {
  const emp = (exportObj && exportObj.empresa) || {};
  const expItem = (exportObj && exportObj.expediente) || {};

  const seleccionados = exp.anexosSeleccionados || [];
  const personalizados = exp.anexosPersonalizados || [];

  const catalogoConAplica = ANEXOS_CATALOGO.map((a) => ({
    id: a.id,
    descripcion: a.descripcion,
    aplica: seleccionados.includes(a.id),
    personalizado: false,
  }));

  const persConAplica = personalizados.map((p) => ({
    id: p.id,
    descripcion: p.descripcion,
    aplica: !!p.aplica,
    personalizado: true,
  }));

  const allAnexos = [...catalogoConAplica, ...persConAplica];

  return {
    schema_version: "1.0",
    app_version: APP_VERSION,
    fecha_exportacion: new Date().toISOString(),
    pipc_relacionado: {
      empresa_nombre_comercial: emp.nombre_comercial || "",
      empresa_razon_social: emp.razon_social || "",
      fecha_elaboracion: expItem.fecha_elaboracion || "",
      fecha_inicio_pipc: expItem.fecha_inicio_pipc || "",
      consultor_responsable: expItem.consultor_responsable || "",
      archivo_datos: "datos_pipc.json",
    },
    total_anexos: allAnexos.length,
    total_aplican: allAnexos.filter((a) => a.aplica).length,
    anexos: allAnexos.map((a, i) => ({
      orden: i + 1,
      id: a.id,
      descripcion: a.descripcion || "",
      aplica: !!a.aplica,
      personalizado: !!a.personalizado,
    })),
  };
}

export async function blobSha256Hex(blob: Blob): Promise<string> {
  if (typeof crypto === "undefined" || !crypto.subtle) return "";
  try {
    const buffer = await blob.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
    return Array.from(new Uint8Array(hashBuffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  } catch {
    return "";
  }
}

export function getImageDimensions(blob: Blob): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.naturalWidth || img.width, height: img.naturalHeight || img.height });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve({ width: 0, height: 0 });
    };
    img.src = url;
  });
}

export function slugify(str: string): string {
  return (
    String(str || "empresa")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "empresa"
  );
}

export function getLocalDateStamp(dateObj: Date = new Date()): string {
  const y = dateObj.getFullYear();
  const m = String(dateObj.getMonth() + 1).padStart(2, "0");
  const d = String(dateObj.getDate()).padStart(2, "0");
  return `${y}${m}${d}`;
}

export function getExportConsecutiveForToday(dateStamp: string): number {
  const storageKey = "pipc_export_consecutive_by_date";
  let counters: Record<string, number> = {};
  try {
    counters = JSON.parse(localStorage.getItem(storageKey) || "{}") || {};
  } catch {
    counters = {};
  }
  const next = Number(counters[dateStamp] || 0) + 1;
  counters[dateStamp] = next;
  try {
    localStorage.setItem(storageKey, JSON.stringify(counters));
  } catch {}
  return next;
}

export function buildZipFileName(empresaNombre: string, version: string = APP_VERSION): string {
  const dateStamp = getLocalDateStamp();
  const consecutive = getExportConsecutiveForToday(dateStamp);
  const consecutivePart = consecutive > 1 ? `_${String(consecutive).padStart(2, "0")}` : "";
  const empresa = slugify(empresaNombre || "empresa");
  return `${dateStamp}${consecutivePart}_PIPC_${empresa}_${version}.zip`;
}

/**
 * Función principal que arma el ZIP completo en el navegador
 */
export async function generarZipExport(
  exp: PipcExpediente,
  onProgreso?: (paso: string, porcentaje?: number) => void,
  descargarBlobApi?: (id: number) => Promise<Blob>
): Promise<void> {
  const zip = new JSZip();
  const exportObj = buildSemanticExportObject(exp, "avance");

  onProgreso?.("Generando imágenes y diagramas...", 15);

  // 1. Organigrama
  const organigramasSubidos = exportObj.organizacion_uipc.organigrama_fotografias || [];
  if (organigramasSubidos.length > 0) {
    exportObj.organizacion_uipc.organigrama_para_template = {
      tipo: "imagen_subida_por_usuario",
      usar_imagen_subida: true,
      usar_organigrama_generado: false,
      descripcion: "El usuario subió una imagen de organigrama. Usar esta imagen para el Template Word.",
      imagen: organigramasSubidos[0],
    };
    exportObj.organizacion_uipc.organigrama_generado = null;
  } else {
    const org = await generarOrganigramaCanvasBlob(exp.uiriData);
    if (org) {
      const ruta = "fotografias/organigrama/organigrama_generado.png";
      const hash = await blobSha256Hex(org.blob);
      const meta = {
        tipo: "canvas_generado_automaticamente",
        usar_imagen_subida: false,
        usar_organigrama_generado: true,
        descripcion:
          "No se subió imagen de organigrama; el sistema generó automáticamente este PNG desde los integrantes UIRI capturados.",
        nombre_archivo: "organigrama_generado.png",
        ruta_relativa: ruta,
        mime_type: "image/png",
        ancho_px: org.width,
        alto_px: org.height,
        peso_bytes: org.blob.size,
        hash_sha256: hash,
        fecha_generacion: new Date().toISOString(),
      };
      zip.file(ruta, org.blob);
      exportObj.organizacion_uipc.organigrama_generado = meta;
      exportObj.organizacion_uipc.organigrama_para_template = meta;
    }
  }

  // 2. Calendario de actividades
  const anio = getPipcYearFromFechaElaboracion(exp.form.fecha_elaboracion);
  const cal = await generarCalendarioCanvasBlob(exp.calendarioActividades, anio);
  if (cal) {
    const ruta = "fotografias/calendario_actividades/calendario_actividades.png";
    const hash = await blobSha256Hex(cal.blob);
    const meta = {
      tipo: "tabla_generada_automaticamente",
      descripcion:
        "Imagen PNG generada automáticamente desde la tabla HTML de Calendario de Actividades, conservando colores y apariencia general para insertar en el Template Word.",
      nombre_archivo: "calendario_actividades.png",
      ruta_relativa: ruta,
      mime_type: "image/png",
      ancho_px: cal.width,
      alto_px: cal.height,
      peso_bytes: cal.blob.size,
      hash_sha256: hash,
      fecha_generacion: new Date().toISOString(),
      fuente_datos: "organizacion_uipc.calendario_actividades",
    };
    zip.file(ruta, cal.blob);
    exportObj.organizacion_uipc.calendario_actividades_imagen = meta;
    exportObj.organizacion_uipc.calendario_actividades_para_template = meta;
  }

  // 3. Programas de mantenimiento de equipos (emergencia y alto riesgo)
  if (exp.programaEquiposEmergencia && Object.keys(exp.programaEquiposEmergencia).length > 0) {
    const progEm = await generarProgramaMantenimientoCanvasBlob(
      exp.programaEquiposEmergencia,
      "EQUIPOS DE EMERGENCIA",
      anio
    );
    if (progEm) {
      const ruta =
        "fotografias/programa_mantenimiento_equipos_emergencia/programa_mantenimiento_equipos_emergencia.png";
      const hash = await blobSha256Hex(progEm.blob);
      const meta = {
        tipo: "tabla_generada_automaticamente",
        descripcion:
          "Imagen PNG generada automáticamente desde la tabla HTML del Programa Anual de Inspección y Mantenimiento a Equipos de Atención a Emergencias, conservando colores y apariencia general para insertar en el Template Word.",
        nombre_archivo: "programa_mantenimiento_equipos_emergencia.png",
        ruta_relativa: ruta,
        mime_type: "image/png",
        ancho_px: progEm.width,
        alto_px: progEm.height,
        peso_bytes: progEm.blob.size,
        hash_sha256: hash,
        fecha_generacion: new Date().toISOString(),
        fuente_datos: "inventarios.programa_mantenimiento_equipos_emergencia",
        filas: progEm.filas,
      };
      zip.file(ruta, progEm.blob);
      exportObj.inventarios.programa_mantenimiento_equipos_emergencia_imagen = meta;
    }
  }

  if (exp.programaEquiposAltoRiesgo && Object.keys(exp.programaEquiposAltoRiesgo).length > 0) {
    const progAr = await generarProgramaMantenimientoCanvasBlob(
      exp.programaEquiposAltoRiesgo,
      "EQUIPOS DE ALTO RIESGO",
      anio
    );
    if (progAr) {
      const ruta =
        "fotografias/programa_mantenimiento_equipos_alto_riesgo/programa_mantenimiento_equipos_alto_riesgo.png";
      const hash = await blobSha256Hex(progAr.blob);
      const meta = {
        tipo: "tabla_generada_automaticamente",
        descripcion:
          "Imagen PNG generada automáticamente desde la tabla HTML del Programa Anual de Inspección y Mantenimiento a Equipos de Alto Riesgo, conservando colores y apariencia general para insertar en el Template Word.",
        nombre_archivo: "programa_mantenimiento_equipos_alto_riesgo.png",
        ruta_relativa: ruta,
        mime_type: "image/png",
        ancho_px: progAr.width,
        alto_px: progAr.height,
        peso_bytes: progAr.blob.size,
        hash_sha256: hash,
        fecha_generacion: new Date().toISOString(),
        fuente_datos: "inventarios.programa_mantenimiento_equipos_alto_riesgo",
        filas: progAr.filas,
      };
      zip.file(ruta, progAr.blob);
      exportObj.inventarios.programa_mantenimiento_equipos_alto_riesgo_imagen = meta;
    }
  }

  // 4. Calendarios de mantenimiento (edificio y general)
  if (exp.form.mant_edificio_modo === "calendario" && exp.mantCalendarioEdificio?.length) {
    const mantEdCal = await generarCalendarioCanvasBlob(exp.mantCalendarioEdificio, anio);
    if (mantEdCal) {
      const ruta = "fotografias/calendario_mantenimiento_edificio/calendario_mantenimiento_edificio.png";
      const hash = await blobSha256Hex(mantEdCal.blob);
      const meta = {
        tipo: "tabla_generada_automaticamente",
        descripcion:
          "Imagen PNG generada automáticamente desde el calendario de actividades del mantenimiento del edificio, con el mismo formato que el Calendario de actividades de Organización.",
        nombre_archivo: "calendario_mantenimiento_edificio.png",
        ruta_relativa: ruta,
        mime_type: "image/png",
        ancho_px: mantEdCal.width,
        alto_px: mantEdCal.height,
        peso_bytes: mantEdCal.blob.size,
        hash_sha256: hash,
        fecha_generacion: new Date().toISOString(),
        fuente_datos: "mantenimiento.programa_edificio_calendario",
      };
      zip.file(ruta, mantEdCal.blob);
      exportObj.mantenimiento.programa_edificio_calendario_imagen = meta;
    }
  }

  if (exp.form.mant_general_modo === "calendario" && exp.mantCalendarioGeneral?.length) {
    const mantGenCal = await generarCalendarioCanvasBlob(exp.mantCalendarioGeneral, anio);
    if (mantGenCal) {
      const ruta = "fotografias/calendario_mantenimiento_general/calendario_mantenimiento_general.png";
      const hash = await blobSha256Hex(mantGenCal.blob);
      const meta = {
        tipo: "tabla_generada_automaticamente",
        descripcion:
          "Imagen PNG generada automáticamente desde el calendario de actividades del mantenimiento general, con el mismo formato que el Calendario de actividades de Organización.",
        nombre_archivo: "calendario_mantenimiento_general.png",
        ruta_relativa: ruta,
        mime_type: "image/png",
        ancho_px: mantGenCal.width,
        alto_px: mantGenCal.height,
        peso_bytes: mantGenCal.blob.size,
        hash_sha256: hash,
        fecha_generacion: new Date().toISOString(),
        fuente_datos: "mantenimiento.programa_general_calendario",
      };
      zip.file(ruta, mantGenCal.blob);
      exportObj.mantenimiento.programa_general_calendario_imagen = meta;
    }
  }

  // 5. Capacitación y Simulacros
  const MESES_FULL_MAP: Record<string, number> = {
    ENERO: 0,
    FEBRERO: 1,
    MARZO: 2,
    ABRIL: 3,
    MAYO: 4,
    JUNIO: 5,
    JULIO: 6,
    AGOSTO: 7,
    SEPTIEMBRE: 8,
    OCTUBRE: 9,
    NOVIEMBRE: 10,
    DICIEMBRE: 11,
  };

  const capFilas = (exp.capacitacion || [])
    .filter((r) => String(r.tema || "").trim())
    .map((r) => ({
      label: r.tema,
      mesIndex: MESES_FULL_MAP[String(r.mes || "").trim().toUpperCase()] ?? -1,
    }));

  if (capFilas.length > 0) {
    const capImg = await generarTablaMesesCanvasBlob("TEMA", capFilas);
    if (capImg) {
      const ruta = "fotografias/capacitacion/capacitacion.png";
      const hash = await blobSha256Hex(capImg.blob);
      const meta = {
        tipo: "tabla_generada_automaticamente",
        descripcion:
          "Imagen PNG generada automáticamente desde la tabla HTML de Capacitación, conservando colores y apariencia general para insertar en el Template Word.",
        nombre_archivo: "capacitacion.png",
        ruta_relativa: ruta,
        mime_type: "image/png",
        ancho_px: capImg.width,
        alto_px: capImg.height,
        peso_bytes: capImg.blob.size,
        hash_sha256: hash,
        fecha_generacion: new Date().toISOString(),
        fuente_datos: "brigadas_seguridad_medidas.capacitacion",
        filas: capImg.filas,
      };
      zip.file(ruta, capImg.blob);
      exportObj.brigadas_seguridad_medidas.capacitacion_imagen = meta;
    }
  }

  const simFilas = (exp.simulacros || [])
    .filter((r) => String(r.tipo || "").trim())
    .map((r) => ({
      label: r.tipo,
      mesIndex: MESES_FULL_MAP[String(r.mes || "").trim().toUpperCase()] ?? -1,
    }));

  if (simFilas.length > 0) {
    const simImg = await generarTablaMesesCanvasBlob("TIPO DE SIMULACRO", simFilas);
    if (simImg) {
      const ruta = "fotografias/simulacros/simulacros.png";
      const hash = await blobSha256Hex(simImg.blob);
      const meta = {
        tipo: "tabla_generada_automaticamente",
        descripcion:
          "Imagen PNG generada automáticamente desde la tabla HTML de Ejercicios y Simulacros, conservando colores y apariencia general para insertar en el Template Word.",
        nombre_archivo: "simulacros.png",
        ruta_relativa: ruta,
        mime_type: "image/png",
        ancho_px: simImg.width,
        alto_px: simImg.height,
        peso_bytes: simImg.blob.size,
        hash_sha256: hash,
        fecha_generacion: new Date().toISOString(),
        fuente_datos: "brigadas_seguridad_medidas.simulacros",
        filas: simImg.filas,
      };
      zip.file(ruta, simImg.blob);
      exportObj.brigadas_seguridad_medidas.simulacros_imagen = meta;
    }
  }

  // 6. Descargar y empaquetar fotos del servidor (concurrencia máx 4)
  const totalFotos = exportObj.fotografias.length;
  let descargadas = 0;

  async function procesarFoto(fotoMeta: any) {
    let blob: Blob | null = null;
    const fotoIdNum = Number(fotoMeta.id);

    if (descargarBlobApi && !isNaN(fotoIdNum) && fotoIdNum > 0) {
      try {
        blob = await descargarBlobApi(fotoIdNum);
      } catch (err) {
        throw new Error(`No se pudo descargar la foto ${fotoMeta.nombre_original || fotoMeta.id}`);
      }
    } else {
      // Buscar en objeto local si es blob o url
      const zona = fotoMeta.seccion;
      const found = (exp.fotos[zona] || []).find((f) => f.id === fotoMeta.id);
      if (found?.url) {
        try {
          const resp = await fetch(found.url);
          blob = await resp.blob();
        } catch {}
      }
    }

    if (blob) {
      const dims = await getImageDimensions(blob);
      fotoMeta.ancho_px = dims.width || fotoMeta.ancho_px;
      fotoMeta.alto_px = dims.height || fotoMeta.alto_px;
      fotoMeta.peso_bytes = blob.size;
      fotoMeta.hash_sha256 = await blobSha256Hex(blob);
      fotoMeta.advertencia_calidad = Math.max(dims.width, dims.height) < 800;

      zip.file(fotoMeta.ruta_relativa, blob);
    }

    descargadas++;
    onProgreso?.(
      `Descargando fotos ${descargadas}/${totalFotos}`,
      20 + Math.round((descargadas / Math.max(totalFotos, 1)) * 50)
    );
  }

  // Ejecución en paralelo limitado a 4
  const CONCURRENCY = 4;
  const queue = [...exportObj.fotografias];
  const workers = Array(Math.min(CONCURRENCY, queue.length || 1))
    .fill(null)
    .map(async () => {
      while (queue.length > 0) {
        const item = queue.shift();
        if (item) {
          await procesarFoto(item);
        }
      }
    });

  await Promise.all(workers);

  // 7. Refrescar diccionario con los metadatos finales
  refrescarDiccionarioExportacion(exportObj);

  onProgreso?.("Escribiendo metadatos y documentación...", 75);

  // 8. Archivos JSON y Markdown
  zip.file("datos_pipc.json", JSON.stringify(exportObj, null, 2));
  zip.file("diccionario_campos.md", dictionaryToMarkdown(exportObj.diccionario_campos || []));
  zip.file("diccionario_campos.json", JSON.stringify(exportObj.diccionario_campos || [], null, 2));
  zip.file(
    "pendientes_detectados.md",
    pendientesToMarkdown(exportObj.expediente.pendientes_detectados || [])
  );
  zip.file(
    "pendientes_detectados.json",
    JSON.stringify(exportObj.expediente.pendientes_detectados || [], null, 2)
  );
  zip.file("instrucciones_para_ia.md", instruccionesIaMarkdown());
  zip.file("captura_html_backup.json", JSON.stringify(exportObj.captura_html || {}, null, 2));
  zip.file("Anexos.json", JSON.stringify(buildAnexosExportObject(exportObj, exp), null, 2));

  // 9. LEEME.txt
  const empresaNombre = exportObj.empresa?.nombre_comercial || "Sin nombre";
  const resumenLeeme = `Expediente PIPC
Empresa: ${empresaNombre}
Tipo exportación: avance
Estado: ${exportObj.expediente.estado_texto}
Fecha exportación: ${exportObj.fecha_exportacion}
Fotos: ${exportObj.fotografias.length}
Pendientes: ${exportObj.expediente.pendientes_detectados.length}

Contenido:
- datos_pipc.json
- diccionario_campos.md / .json
- pendientes_detectados.md / .json
- instrucciones_para_ia.md
- captura_html_backup.json
- Anexos.json
- fotografias/
`;
  zip.file("LEEME.txt", resumenLeeme);

  onProgreso?.("Comprimiendo archivo ZIP...", 90);

  // 10. Generar y descargar ZIP
  const blobZip = await zip.generateAsync({
    type: "blob",
    compression: "DEFLATE",
    compressionOptions: { level: 6 },
  });

  const url = URL.createObjectURL(blobZip);
  const a = document.createElement("a");
  a.href = url;
  a.download = buildZipFileName(empresaNombre, APP_VERSION);
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
