import {
  riskMatrix,
  magnitudColors,
  PROBABILIDADES_VALIDAS,
  CONSECUENCIAS_VALIDAS,
  probLegacyMap,
  consLegacyMap,
  uiriRoles,
  BRIGADA_A_ROL,
  BRIGADAS_OPCIONES,
  ROL_OPCIONES,
  PROGRESS_IGNORED_DIR_VALUES,
  getAllAgentesBase,
  MANT_PROGRAMAS,
} from "./pipcCatalogos";

export interface FotoMock {
  id: string;
  nombre: string;
  url: string;
  advertencia_calidad?: boolean;
  ruta_relativa?: string;
  width?: number;
  height?: number;
  sizeBytes?: number;
}

export interface TurnoRow {
  turno: string;
  diaInicio: string;
  diaFin: string;
  horaInicio: string;
  horaFin: string;
}

export interface PoblacionFijaRow {
  area: string;
  hombres: string | number;
  mujeres: string | number;
  total: string | number;
  vulnerable: string;
  detalle: string;
  apoyo: string;
}

export interface PoblacionFlotanteRow {
  categoria: string;
  promedio: string | number;
  maximo: string | number;
  ubicacion: string;
  horario: string;
}

export interface AreaInmuebleRow {
  area: string;
  uso: string;
  materiales: string;
  observaciones: string;
}

export interface EquipoRow {
  equipo: string;
  cantidad: string | number;
}

export interface MesProgramaPR {
  p: number;
  r: number;
}

export type ProgramaMantenimientoEquipos = Record<string, Record<string, MesProgramaPR>>;

export interface AgenteEvaluado {
  probabilidad: string;
  consecuencia: string;
  texto: string;
  noAplica: boolean;
}

export interface BrigadistaRow {
  num?: number;
  jefeRoleId?: string;
  nombre: string;
  puesto?: string;
  brigada: string;
  rol: string;
  turno: string;
  telefono?: string;
  ubicacion?: string;
  editado?: {
    puesto?: boolean;
    telefono?: boolean;
    ubicacion?: boolean;
  };
}

export interface CapacitacionRow {
  tema: string;
  mes: string;
}

export interface SimulacroRow {
  tipo: string;
  mes: string;
}

export interface DependenciaDirectorioRow {
  dependencia: string;
  telefono: string;
  llegada: string;
}

export interface ProveedorDirectorioRow {
  proveedor: string;
  direccion: string;
  telefono: string;
  productos: string;
}

export interface VecinoDirectorioRow {
  empresa: string;
  direccion: string;
  telefono: string;
  apoyo: string;
}

export interface UipcMiembroRow {
  nombre: string;
  funcion: string;
  puesto: string;
  ubicacion: string;
  telefono: string;
}

export interface AnexoPersonalizado {
  id: string;
  descripcion: string;
  aplica: boolean;
}

export interface ActividadCalendario {
  actividad: string;
  meses: number[];
}

export interface PipcFormData {
  // ① Datos generales
  empresa_nombre: string;
  empresa_razon_social: string;
  empresa_giro: string;
  empresa_responsable: string;
  empresa_rep_legal: string;
  empresa_domicilio: string;
  empresa_domicilio_notificaciones: string;
  empresa_nacionalidad: string;
  empresa_telefono: string;

  plan_tipo: "estatal" | "municipal" | "";
  empresa_municipio: string;
  empresa_municipio_otro: string;
  pc_titular_nombre: string;
  pc_titular_cargo: string;
  pc_dependencia: string;

  consultor_externo_nombre: string;
  consultor_externo_registro: string;

  personal_admin: string | number;
  personal_operativo: string | number;

  fecha_elaboracion: string;
  fecha_inicio_pipc: string;
  superficie_m2: string | number;
  superficie_terreno_m2: string | number;

  // ② Inmueble
  historia_empresa: string;
  descripcion_inmueble: string;
  politica_seguridad: string;
  politica_modo: "texto" | "imagen";

  // ③ Organización
  calendario_anio: string | number;

  // ④ Directorios
  no_pertenece_comite: boolean;

  // ⑦ Riesgos
  contexto_zona: string;

  // ⑧ Mantenimiento
  mant_edificio_modo: "imagen" | "calendario";
  mant_general_modo: "imagen" | "calendario";

  // ⑨ Seguridad y medidas
  seguro_fecha: string;
  seguro_poliza: string;
  seguro_aseguradora: string;

  prevencion_explosiones_no_aplica: boolean;
  prevencion_explosiones_texto: string;
  atencion_medica: string;

  // ⑪ Exportar / Metadatos
  expediente_estado: string;
  consultor_responsable: string;
  fecha_visita_tecnica: string;
  notas_internas_consultor: string;
}

export interface PipcExpediente {
  id: number;
  i_CveEmpresa: number;
  i_CvePlanta: number;
  v_Planta: string;
  v_Consultor: string;
  i_CveServAgendaDet: number | null;

  // Form fields
  form: PipcFormData;

  // Turnos
  turnosAdmin: TurnoRow[];
  turnosOperativo: TurnoRow[];

  // Organización UIPC
  uiriData: Record<string, { nombre: string }>;
  uipcData: UipcMiembroRow[];
  calendarioActividades: ActividadCalendario[];

  // Directorios
  municipioEmergencias: string;
  dependenciasEmergencia: DependenciaDirectorioRow[];
  proveedoresEmergencia: ProveedorDirectorioRow[];
  vecinosEmergencia: VecinoDirectorioRow[];

  // Inventarios
  poblacionFija: PoblacionFijaRow[];
  poblacionFlotante: PoblacionFlotanteRow[];
  areasInmueble: AreaInmuebleRow[];
  equiposEmergencia: EquipoRow[];
  equiposAltoRiesgo: EquipoRow[];
  programaEquiposEmergencia: ProgramaMantenimientoEquipos;
  programaEquiposAltoRiesgo: ProgramaMantenimientoEquipos;

  // Riesgos
  agentesData: Record<string, AgenteEvaluado>;

  // Mantenimiento
  mantCalendarioEdificio: ActividadCalendario[];
  mantCalendarioGeneral: ActividadCalendario[];

  // Seguridad y medidas
  brigadistas: BrigadistaRow[];
  capacitacion: CapacitacionRow[];
  simulacros: SimulacroRow[];
  materialesPeligrosos: string[];
  recomendaciones: string[];

  // Anexos
  anexosSeleccionados: string[];
  anexosPersonalizados: AnexoPersonalizado[];

  // Fotos por clave
  fotos: Record<string, FotoMock[]>;
}

export interface PendienteItem {
  seccion: string;
  seccionIdx: number;
  pendiente: string;
  prioridad: "Alta" | "Media" | "Baja";
}

export function filled(v: any): boolean {
  return String(v !== null && v !== undefined ? v : "").trim().length > 0;
}

export function countNonEmptyRows(rows: any[], ignoredSingleValues: string[] = []): number {
  if (!Array.isArray(rows)) return 0;
  const ignored = new Set(
    (ignoredSingleValues || []).map((v) => String(v || "").trim().toLowerCase()).filter(Boolean)
  );
  return rows.filter((row) => {
    if (row == null) return false;
    if (typeof row === "string") return String(row).trim().length > 0;
    if (typeof row !== "object") return String(row).trim().length > 0;
    const vals = Object.values(row)
      .map((v) => String(v !== null && v !== undefined ? v : "").trim())
      .filter(Boolean);
    if (!vals.length) return false;
    if (vals.length === 1 && ignored.has(vals[0].toLowerCase())) return false;
    return true;
  }).length;
}

export function hasNonEmptyRows(rows: any[], ignoredSingleValues: string[] = []): boolean {
  return countNonEmptyRows(rows, ignoredSingleValues) > 0;
}

// ----------------- MIGRACIÓN Y EVALUACIÓN DE RIESGOS -----------------

export function migrateProbabilidad(v: any): string {
  const norm = (v == null ? "" : v).toString().trim().toUpperCase();
  if (PROBABILIDADES_VALIDAS.includes(norm)) return norm;
  if (probLegacyMap[norm]) return probLegacyMap[norm];
  return "";
}

export function migrateConsecuencia(v: any): string {
  const norm = (v == null ? "" : v).toString().trim().toUpperCase();
  if (CONSECUENCIAS_VALIDAS.includes(norm)) return norm;
  if (consLegacyMap[norm]) return consLegacyMap[norm];
  return "";
}

export type EstadoEvaluacion = "completo" | "no_aplica" | "falta_ambos" | "falta_probabilidad" | "falta_consecuencia";

export function estadoEvaluacionAgente(d?: AgenteEvaluado | null): EstadoEvaluacion {
  if (!d) return "falta_ambos";
  if (d.noAplica) return "no_aplica";
  const p = migrateProbabilidad(d.probabilidad);
  const c = migrateConsecuencia(d.consecuencia);
  if (p && c) return "completo";
  if (!p && !c) return "falta_ambos";
  return p ? "falta_consecuencia" : "falta_probabilidad";
}

export type NivelMagnitud = "BAJO" | "MEDIO" | "ALTO";

export function calcMagnitud(probabilidad: string, consecuencia: string): NivelMagnitud | "" {
  const p = migrateProbabilidad(probabilidad);
  const c = migrateConsecuencia(consecuencia);
  if (!p || !c) return "";
  return ((riskMatrix as any)[p]?.[c] as NivelMagnitud) || "";
}

export function colorMagnitud(mag: string): string {
  return (magnitudColors as any)[mag] || "#64748b";
}

// ----------------- TELÉFONO Y BRIGADISTAS -----------------

export function formatTelefono(value: string | number | null | undefined): string {
  const d = String(value == null ? "" : value).replace(/\D/g, "").slice(0, 10);
  if (!d) return "";
  if (d.length <= 2) return "(" + d;
  if (d.length <= 6) return "(" + d.slice(0, 2) + ") " + d.slice(2);
  return "(" + d.slice(0, 2) + ") " + d.slice(2, 6) + "-" + d.slice(6);
}

export function normTxt(v: any): string {
  return String(v == null ? "" : v)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

export function getTurnosDisponibles(turnosOperativo: TurnoRow[] = [], turnosAdmin: TurnoRow[] = []): string[] {
  const turnos = new Set<string>();
  (turnosOperativo || []).forEach((t) => {
    if (t.turno) {
      const val = String(t.turno).trim();
      turnos.add(val.startsWith("Turno ") ? val : `Turno ${val}`);
    }
  });
  (turnosAdmin || []).forEach((t) => {
    if (t.turno) {
      const val = String(t.turno).trim();
      turnos.add(val.startsWith("Turno ") ? val : `Turno ${val}`);
    }
  });
  if (turnos.size === 0) {
    return ["Turno 1", "Turno 2", "Turno 3"];
  }
  return Array.from(turnos);
}

export function interpretarBrigada(v: any): string {
  const n = normTxt(v);
  if (!n) return "";
  const exacta = (BRIGADAS_OPCIONES as readonly string[]).find((b) => normTxt(b) === n);
  if (exacta) return exacta;
  const contiene = (BRIGADAS_OPCIONES as readonly string[]).find((b) => n.includes(normTxt(b)));
  return contiene || String(v).trim();
}

export function interpretarRol(v: any, brigada?: string): string {
  const n = normTxt(v);
  if (!n) return (BRIGADA_A_ROL as any)[brigada || ""] || "";
  const exacto = (ROL_OPCIONES as readonly string[]).find((r) => normTxt(r) === n);
  if (exacto) return exacto;
  if (n === "lider" || n === "jefe" || n.startsWith("lider") || n.startsWith("jefe")) return "Líder";
  const porBrigada = (BRIGADAS_OPCIONES as readonly string[]).find((b) => n.includes(normTxt(b)));
  if (porBrigada) return (BRIGADA_A_ROL as any)[porBrigada];
  if (n === "brigadista" && brigada && (BRIGADA_A_ROL as any)[brigada]) return (BRIGADA_A_ROL as any)[brigada];
  return String(v).trim();
}

export function interpretarTurno(v: any, turnos: string[]): string {
  const raw = String(v == null ? "" : v).trim();
  if (!raw) return turnos[0] || "";
  const exacto = turnos.find((t) => normTxt(t) === normTxt(raw));
  if (exacto) return exacto;
  const num = raw.replace(/\D/g, "");
  if (num && turnos.includes("Turno " + parseInt(num, 10))) return "Turno " + parseInt(num, 10);
  return raw;
}

export function interpretarTelefono(v: any): string {
  let d = String(v == null ? "" : v).replace(/\D/g, "");
  if (d.length === 12 && d.startsWith("52")) d = d.slice(2);
  if (d.length === 13 && d.startsWith("521")) d = d.slice(3);
  return d.length === 10 ? formatTelefono(d) : d;
}

export function erroresBrigadista(row: BrigadistaRow, turnos?: string[]) {
  const listTurnos = turnos || ["Turno 1", "Turno 2", "Turno 3"];
  const tel = String(row.telefono || "").replace(/\D/g, "");
  return {
    brigada: !(BRIGADAS_OPCIONES as readonly string[]).includes(row.brigada),
    rol: !(ROL_OPCIONES as readonly string[]).includes(row.rol),
    turno: !listTurnos.includes(row.turno),
    telefono: tel.length > 0 && tel.length !== 10,
  };
}

export function brigadasFaltantesPorRiesgos(exp: PipcExpediente): Record<string, string[]> {
  const conIntegrantes: Record<string, boolean> = {};
  (exp.brigadistas || []).forEach((b) => {
    if (String(b.nombre || "").trim()) {
      conIntegrantes[b.brigada] = true;
    }
  });

  const faltan: Record<string, string[]> = {};
  getAllAgentesBase().forEach((ag) => {
    if (exp.agentesData[ag.id]?.noAplica) return;
    (ag.brigadas || []).forEach((br) => {
      if (!conIntegrantes[br]) {
        if (!faltan[br]) faltan[br] = [];
        faltan[br].push(ag.nombre);
      }
    });
  });
  return faltan;
}

// ----------------- MANTENIMIENTO -----------------

export function mantProgramaCompleto(k: "edificio" | "general", exp: PipcExpediente): boolean {
  const modo = k === "edificio" ? exp.form.mant_edificio_modo : exp.form.mant_general_modo;
  if (modo === "calendario") {
    const list = k === "edificio" ? exp.mantCalendarioEdificio : exp.mantCalendarioGeneral;
    const activas = (list || []).filter((r) => String(r.actividad || "").trim());
    return activas.length > 0 && activas.every((a) => (a.meses || []).length > 0);
  }
  const fotoKey = (MANT_PROGRAMAS as any)[k]?.foto || `mant-${k}`;
  return (exp.fotos[fotoKey] || []).length > 0;
}

// ----------------- CHECKS DE AVANCE v3_42 -----------------

export function calculateProgressChecks(exp: PipcExpediente): boolean[][] {
  const d = exp.form;
  const photoLen = (key: string) => (Array.isArray(exp.fotos[key]) ? exp.fotos[key].length : 0);

  // ⑦ Riesgos: cada agente es un elemento (completo o no_aplica)
  const riesgoChecks = getAllAgentesBase().map((ag) => {
    const e = estadoEvaluacionAgente(exp.agentesData[ag.id]);
    return e === "completo" || e === "no_aplica";
  });

  // ③ Organización:
  // · 8 nombres integrantes UIRI
  const uiriChecks = uiriRoles.map((rol) => filled(exp.uiriData?.[rol.id]?.nombre));
  // · Integrantes UIPC: capturado cuando tiene puesto, ubicación o teléfono
  const uipcChecks = (exp.uipcData || []).map(
    (r) => filled(r.puesto) || filled(r.ubicacion) || filled(r.telefono)
  );
  // · Brigadistas: capturado cuando tiene nombre
  const brigadaChecks = (exp.brigadistas || []).map((b) => filled(b.nombre));
  // · Organigrama: siempre true
  // · Calendario actividades: cada actividad con nombre cuenta si tiene al menos 1 mes
  const actividadesActuales = (exp.calendarioActividades || []).filter((a) =>
    String(a.actividad || "").trim()
  );
  const actividadChecks = actividadesActuales.map((a) => Array.isArray(a.meses) && a.meses.length > 0);
  const organizacionChecks = [...uiriChecks, ...uipcChecks, ...brigadaChecks, true, ...actividadChecks];

  const municipioOk = !!(d.empresa_municipio === "Otro" ? d.empresa_municipio_otro : d.empresa_municipio);

  const sectionChecks: boolean[][] = [
    // 0: ① Generales
    [
      filled(d.empresa_nombre),
      filled(d.empresa_razon_social),
      filled(d.empresa_giro),
      filled(d.empresa_responsable),
      filled(d.empresa_rep_legal),
      filled(d.empresa_domicilio),
      filled(d.empresa_domicilio_notificaciones),
      filled(d.empresa_nacionalidad),
      filled(d.empresa_telefono),
      filled(d.fecha_elaboracion),
      filled(d.fecha_inicio_pipc),
      filled(d.superficie_m2),
      filled(d.superficie_terreno_m2),
      !!d.plan_tipo,
      municipioOk,
      filled(d.pc_titular_nombre) && filled(d.pc_titular_cargo),
      photoLen("logo-cliente") > 0,
      Number(d.personal_admin || 0) > 0,
      Number(d.personal_operativo || 0) > 0,
      hasNonEmptyRows(exp.turnosAdmin || []),
      hasNonEmptyRows(exp.turnosOperativo || []),
    ],

    // 1: ② Inmueble
    [
      filled(d.historia_empresa),
      filled(d.politica_seguridad) || photoLen("politica-seguridad") > 0,
    ],

    // 2: ③ Organización
    organizacionChecks,

    // 3: ④ Directorios
    [
      hasNonEmptyRows(exp.dependenciasEmergencia || [], PROGRESS_IGNORED_DIR_VALUES),
      hasNonEmptyRows(exp.proveedoresEmergencia || [], PROGRESS_IGNORED_DIR_VALUES),
      d.no_pertenece_comite
        ? photoLen("carta-compromiso-comite") > 0
        : hasNonEmptyRows(exp.vecinosEmergencia || [], PROGRESS_IGNORED_DIR_VALUES) || photoLen("vecinos-img") > 0,
    ],

    // 4: ⑤ Inventarios
    [
      hasNonEmptyRows(exp.poblacionFija || []),
      hasNonEmptyRows(exp.poblacionFlotante || []),
      hasNonEmptyRows(exp.areasInmueble || []),
      photoLen("layout-general") > 0,
      photoLen("fotos-generales") > 0,
      hasNonEmptyRows(exp.equiposEmergencia || []),
      hasNonEmptyRows(exp.equiposAltoRiesgo || []),
      photoLen("layout-emergencias") > 0,
      photoLen("equipo-emergencia-foto") > 0,
    ],

    // 5: ⑥ Atlas de Riesgos
    [photoLen("atlas-externo") > 0, photoLen("atlas-interno") > 0],

    // 6: ⑦ Riesgos
    [...riesgoChecks, filled(d.contexto_zona), photoLen("sustancias-quimicas") > 0],

    // 7: ⑧ Mantenimiento
    [mantProgramaCompleto("edificio", exp), mantProgramaCompleto("general", exp)],

    // 8: ⑨ Seguridad y Medidas
    [
      hasNonEmptyRows(exp.capacitacion || []),
      hasNonEmptyRows(exp.simulacros || []),
      filled(d.seguro_fecha) && filled(d.seguro_poliza) && filled(d.seguro_aseguradora),
      hasNonEmptyRows(exp.materialesPeligrosos || []),
      photoLen("equipo-identificacion") > 0,
      filled(d.atencion_medica),
      hasNonEmptyRows(exp.recomendaciones || []),
    ],

    // 9: ⑩ Anexos
    [],

    // 10: ⑪ Exportar
    [],
  ];

  return sectionChecks;
}

export function calcularAvanceSeccion(checks: boolean[]): number {
  if (!checks || checks.length === 0) return 0;
  const cumplidos = checks.filter(Boolean).length;
  return Math.round((cumplidos / checks.length) * 100);
}

export function calcularAvanceGlobal(sectionChecks: boolean[][]): number {
  let total = 0;
  let cumplidos = 0;
  for (let i = 0; i <= 8; i++) {
    const list = sectionChecks[i] || [];
    total += list.length;
    cumplidos += list.filter(Boolean).length;
  }
  if (total === 0) return 0;
  return Math.round((cumplidos / total) * 100);
}

// ----------------- PENDIENTES v3_42 -----------------

export function getPendingItems(exp: PipcExpediente): PendienteItem[] {
  const d = exp.form;
  const pending: PendienteItem[] = [];
  const req = (
    cond: any,
    seccion: string,
    seccionIdx: number,
    pendiente: string,
    prioridad: "Alta" | "Media" | "Baja" = "Alta"
  ) => {
    if (!cond) {
      pending.push({ seccion, seccionIdx, pendiente, prioridad });
    }
  };

  const photoLen = (key: string) => (Array.isArray(exp.fotos[key]) ? exp.fotos[key].length : 0);

  // ① Datos generales (índice 0)
  req((d.empresa_nombre || "").trim(), "Datos generales", 0, "Falta nombre comercial de la empresa");
  req((d.empresa_razon_social || "").trim(), "Datos generales", 0, "Falta razón social");
  req((d.empresa_rep_legal || "").trim(), "Datos generales", 0, "Falta representante legal");
  req((d.empresa_domicilio || "").trim(), "Datos generales", 0, "Falta domicilio físico");
  req((d.empresa_giro || "").trim(), "Datos generales", 0, "Falta giro / rama industrial", "Media");
  req((d.superficie_m2 || "").toString().trim(), "Datos generales", 0, "Falta superficie de construcción");
  req(d.plan_tipo, "Datos generales", 0, "Falta elegir el tipo de plan (Estatal o Municipal)");
  const muni = d.empresa_municipio === "Otro" ? d.empresa_municipio_otro : d.empresa_municipio;
  req(muni, "Datos generales", 0, "Falta el municipio de la empresa");
  req(
    filled(d.pc_titular_nombre) && filled(d.pc_titular_cargo),
    "Datos generales",
    0,
    "Faltan nombre y cargo del titular de Protección Civil (Oficio responsiva y Acta constitutiva)"
  );
  if (d.plan_tipo === "municipal") {
    req(
      filled(d.pc_dependencia),
      "Datos generales",
      0,
      "Falta el nombre completo de la dependencia municipal (Oficio responsiva)"
    );
  }
  req(
    filled(d.consultor_externo_nombre) && filled(d.consultor_externo_registro),
    "Datos generales",
    0,
    "Faltan nombre y registro del consultor externo (Oficio responsiva)",
    "Media"
  );
  req(
    (d.fecha_elaboracion || "").trim(),
    "Datos generales",
    0,
    "Falta la fecha de elaboración (también fecha del Oficio y del Acta)"
  );

  // ② Inmueble (índice 1)
  req((d.historia_empresa || "").trim(), "Inmueble", 1, "Falta historia de la empresa", "Media");
  req((d.descripcion_inmueble || "").trim(), "Inmueble", 1, "Falta descripción física del inmueble");
  const politicaOk = (d.politica_seguridad || "").trim() || photoLen("politica-seguridad") > 0;
  req(politicaOk, "Inmueble", 1, "Falta política de seguridad en texto o imagen");

  // ③ Organización UIPC (índice 2)
  req(
    Object.values(exp.uiriData || {}).some((x) => (x?.nombre || "").trim()),
    "Organización UIPC",
    2,
    "Faltan integrantes de la UIPC / UIRI"
  );

  // ④ Directorios (índice 3)
  req(
    (exp.dependenciasEmergencia || []).length > 0,
    "Directorios",
    3,
    "Falta directorio de dependencias de emergencia",
    "Media"
  );
  if (d.no_pertenece_comite) {
    req(
      photoLen("carta-compromiso-comite") > 0,
      "Directorios",
      3,
      "Falta la carta de compromiso escaneada (la empresa no pertenece a un Comité de Ayuda Mutua)"
    );
  }

  // ⑤ Inventarios (índice 4)
  req((exp.poblacionFija || []).length > 0, "Inventarios", 4, "Falta inventario de población fija");
  req((exp.equiposEmergencia || []).length > 0, "Inventarios", 4, "Falta inventario de equipos de emergencia");
  req(photoLen("layout-general") > 0, "Inventarios", 4, "Falta lay out general del inmueble");
  req(photoLen("layout-emergencias") > 0, "Inventarios", 4, "Falta lay out de emergencias");
  req(photoLen("fotos-generales") > 0, "Inventarios", 4, "Faltan fotografías generales de instalaciones", "Media");
  req(photoLen("equipo-emergencia-foto") > 0, "Inventarios", 4, "Falta reporte fotográfico de equipo de emergencias", "Media");

  // ⑦ Riesgos (índice 6)
  req((d.contexto_zona || "").trim(), "Riesgos", 6, "Falta contexto de la zona / colindancias", "Media");
  getAllAgentesBase().forEach((ag) => {
    const e = estadoEvaluacionAgente(exp.agentesData[ag.id]);
    if (e === "falta_ambos") {
      pending.push({
        seccion: "Riesgos",
        seccionIdx: 6,
        pendiente: `${ag.nombre}: sin evaluar (captura Probabilidad y Consecuencia, o márcalo como "No aplica")`,
        prioridad: "Alta",
      });
    } else if (e === "falta_probabilidad") {
      pending.push({
        seccion: "Riesgos",
        seccionIdx: 6,
        pendiente: `${ag.nombre}: falta Probabilidad`,
        prioridad: "Alta",
      });
    } else if (e === "falta_consecuencia") {
      pending.push({
        seccion: "Riesgos",
        seccionIdx: 6,
        pendiente: `${ag.nombre}: falta Consecuencia`,
        prioridad: "Alta",
      });
    }
  });

  // Brigadas (índice 2)
  req((exp.brigadistas || []).length > 0, "Brigadas", 2, "Faltan integrantes de brigadas");
  const faltan = brigadasFaltantesPorRiesgos(exp);
  Object.keys(faltan).forEach((br) => {
    const lista = faltan[br];
    pending.push({
      seccion: "Brigadas",
      seccionIdx: 2,
      pendiente: `No hay integrantes en la brigada ${br}, requerida por ${lista.length} agente(s) que aplican: ${lista
        .slice(0, 5)
        .join(", ")}${lista.length > 5 ? "…" : ""}`,
      prioridad: "Media",
    });
  });

  const turnosDisp = getTurnosDisponibles(exp.turnosOperativo, exp.turnosAdmin);
  (exp.brigadistas || []).forEach((b, i) => {
    if (!String(b.nombre || "").trim()) return;
    const e = erroresBrigadista(b, turnosDisp);
    const campos: string[] = [];
    if (e.brigada) campos.push("brigada");
    if (e.rol) campos.push("rol");
    if (e.turno) campos.push("turno");
    if (e.telefono) campos.push("teléfono");
    if (campos.length) {
      pending.push({
        seccion: "Brigadas",
        seccionIdx: 2,
        pendiente: `Brigadista ${i + 1} (${b.nombre}): corregir ${campos.join(", ")}`,
        prioridad: "Media",
      });
    }
  });

  // ⑧ Mantenimiento (índice 7)
  (["edificio", "general"] as const).forEach((k) => {
    const modo = k === "edificio" ? d.mant_edificio_modo : d.mant_general_modo;
    if (modo !== "calendario") return;
    const list = k === "edificio" ? exp.mantCalendarioEdificio : exp.mantCalendarioGeneral;
    const activas = (list || []).filter((r) => String(r.actividad || "").trim());
    const titulo = (MANT_PROGRAMAS as any)[k]?.titulo || `Programa de mantenimiento a ${k}`;
    if (!activas.length) {
      pending.push({
        seccion: "Mantenimiento",
        seccionIdx: 7,
        pendiente: `${titulo}: agrega al menos una actividad al calendario`,
        prioridad: "Media",
      });
    }
    activas.forEach((a) => {
      if (!(a.meses || []).length) {
        pending.push({
          seccion: "Mantenimiento",
          seccionIdx: 7,
          pendiente: `${titulo}: la actividad "${a.actividad}" no tiene mes seleccionado`,
          prioridad: "Media",
        });
      }
    });
  });

  // ⑨ Seguridad y medidas (índice 8)
  req((d.atencion_medica || "").trim(), "Seguridad y medidas", 8, "Falta centro médico / atención médica", "Media");
  req(
    (d.seguro_fecha || "").trim() && (d.seguro_poliza || "").trim() && (d.seguro_aseguradora || "").trim(),
    "Seguridad y medidas",
    8,
    "Faltan datos de póliza de seguro",
    "Media"
  );

  // Fotos advertencia calidad
  Object.entries(exp.fotos).forEach(([, fotosList]) => {
    fotosList.forEach((f) => {
      if (f.advertencia_calidad) {
        pending.push({
          seccion: "Fotografías",
          seccionIdx: 4,
          pendiente: `Foto de baja resolución: ${f.nombre}`,
          prioridad: "Baja",
        });
      }
    });
  });

  return pending;
}

export function calcularDiasProyecto(fechaInicio: string | null | undefined): string {
  if (!fechaInicio) return "—";
  const str = String(fechaInicio).trim();
  if (!str) return "—";

  const parts = str.split("-").map(Number);
  if (parts.length < 3 || isNaN(parts[0]) || isNaN(parts[1]) || isNaN(parts[2])) {
    return "—";
  }
  const [y, m, d] = parts;
  const start = new Date(y, (m || 1) - 1, d || 1);
  const today = new Date();
  const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const startOnly = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const diffDays = Math.floor((todayOnly.getTime() - startOnly.getTime()) / 86400000);

  if (Number.isNaN(diffDays)) {
    return "—";
  } else if (diffDays < 0) {
    const abs = Math.abs(diffDays);
    return `inicia en ${abs} día${abs === 1 ? "" : "s"}`;
  } else {
    return `${diffDays} día${diffDays === 1 ? "" : "s"}`;
  }
}

export function diasRestantes(d_FechaFin: string | null | undefined): number | null {
  if (!d_FechaFin) return null;
  const str = String(d_FechaFin).trim();
  if (!str) return null;

  const match = str.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (!match) return null;

  const y = parseInt(match[1], 10);
  const m = parseInt(match[2], 10);
  const d = parseInt(match[3], 10);

  if (isNaN(y) || isNaN(m) || isNaN(d) || m < 1 || m > 12 || d < 1 || d > 31) {
    return null;
  }

  const finOnly = new Date(y, m - 1, d);
  if (isNaN(finOnly.getTime())) return null;

  const today = new Date();
  const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  const diffDays = Math.round((finOnly.getTime() - todayOnly.getTime()) / 86400000);
  if (isNaN(diffDays)) return null;

  return diffDays;
}

export function getColorSemaforo(pct: number): string {
  if (pct >= 81) return "#008040";
  if (pct >= 61) return "#239B56";
  if (pct >= 41) return "#9A7D0A";
  if (pct >= 21) return "#B9770E";
  return "#C0392B";
}

export function normalizarTexto(texto?: string | null): string {
  if (!texto) return "";
  return texto
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function tienePlanContingencia(
  entregables: Array<{ v_Nombre?: string; [key: string]: any } | string> | string | null | undefined
): boolean {
  if (!entregables) return false;
  if (typeof entregables === "string") {
    const norm = normalizarTexto(entregables);
    return norm.includes("PLAN DE CONTINGENCIA") || norm.includes("PLAN DE CONTINGENCIAS");
  }
  if (!Array.isArray(entregables)) return false;
  return entregables.some((ent) => {
    const nombre =
      typeof ent === "string"
        ? ent
        : ent?.v_Nombre || (ent as any)?.v_Entregable || (ent as any)?.nombre || "";
    const norm = normalizarTexto(nombre);
    return norm.includes("PLAN DE CONTINGENCIA") || norm.includes("PLAN DE CONTINGENCIAS");
  });
}

export interface EstadoExpedienteInfo {
  valor: string;
  texto: string;
  badgeClass: string;
  color: string;
}

export const ESTADOS_PIPC: EstadoExpedienteInfo[] = [
  { valor: "en_captura", texto: "En captura", badgeClass: "badge-soft-blue", color: "#2B8FCC" },
  { valor: "pendiente_cliente", texto: "Pendiente de información del cliente", badgeClass: "badge-warning", color: "#B9770E" },
  { valor: "visita_tecnica", texto: "En visita técnica", badgeClass: "badge-info", color: "#0284c7" },
  { valor: "revision_interna", texto: "En revisión interna", badgeClass: "badge-secondary", color: "#64748b" },
  { valor: "listo_word", texto: "Listo para generar Word", badgeClass: "badge-soft-green", color: "#16a34a" },
  { valor: "finalizado", texto: "Finalizado", badgeClass: "badge-success", color: "#008040" },
];

export function obtenerEstadoInfo(estado: string): EstadoExpedienteInfo {
  const match = ESTADOS_PIPC.find((e) => e.valor === estado);
  return (
    match || {
      valor: estado,
      texto: estado || "En captura",
      badgeClass: "badge-soft-blue",
      color: "#2B8FCC",
    }
  );
}

export function getPipcYearFromFechaElaboracion(fecha?: string | null): number {
  if (fecha && fecha.includes("-")) {
    const y = parseInt(fecha.split("-")[0], 10);
    if (!isNaN(y) && y > 1900) return y;
  }
  return new Date().getFullYear();
}
