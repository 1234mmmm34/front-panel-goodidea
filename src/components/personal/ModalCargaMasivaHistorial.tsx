"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  X,
  FileSpreadsheet,
  Download,
  Upload,
  CheckCircle2,
  XCircle,
  ChevronDown,
  ChevronUp,
  Search,
  Loader2,
  AlertCircle,
} from "lucide-react";
import * as XLSX from "xlsx";
import {
  CursoHistorial,
  CargaHistorialPayload,
  CargaHistorialCurso,
  CargaHistorialAlumno,
  CargaHistorialResultado,
  CargaHistorialCursoResultado,
} from "@/types/alumnosCatalogo";
import { AlumnosCatalogoService } from "@/services/alumnosCatalogo.service";
import { DateRangePickerPopover } from "@/components/ui/DateRangePickerPopover";
import { formatearFechaTexto } from "@/lib/date-utils";
import { useToast } from "@/context/ToastContext";

interface ModalCargaMasivaHistorialProps {
  abierto: boolean;
  idEmpresa: number;
  onCerrar: () => void;
  onImportacionExitosa: () => void;
}

/**
 * Normaliza un encabezado de columna: mayúsculas, sin acentos, sin espacios, saltos de línea ni signos.
 * Ej: "NO DE \nNOMINA" -> "NODENOMINA"
 */
function normalizarEncabezado(str: string): string {
  return String(str || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
}

const MESES_ES_MAP: Record<string, number> = {
  ene: 1,
  enero: 1,
  feb: 2,
  febrero: 2,
  mar: 3,
  marzo: 3,
  abr: 4,
  abril: 4,
  may: 5,
  mayo: 5,
  jun: 6,
  junio: 6,
  jul: 7,
  julio: 7,
  ago: 8,
  agosto: 8,
  sep: 9,
  sept: 9,
  set: 9,
  septiembre: 9,
  setiembre: 9,
  oct: 10,
  octubre: 10,
  nov: 11,
  noviembre: 11,
  dic: 12,
  diciembre: 12,
};

function construirFechaIsoValidada(anio: number, mes: number, dia: number): string | null {
  if (anio < 1900 || anio > 2100 || mes < 1 || mes > 12 || dia < 1 || dia > 31) {
    return null;
  }
  const fechaObj = new Date(anio, mes - 1, dia);
  if (
    fechaObj.getFullYear() !== anio ||
    fechaObj.getMonth() !== mes - 1 ||
    fechaObj.getDate() !== dia
  ) {
    return null;
  }
  const yyyy = String(anio).padStart(4, "0");
  const mm = String(mes).padStart(2, "0");
  const dd = String(dia).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * Lee una celda de fecha de Excel (Date real por cellDates, serial o texto dd/mm/yyyy o dd/mmm/yyyy en español)
 * y devuelve "yyyy-MM-dd" o null si no se puede leer.
 */
function parsearFechaExcel(val: unknown): string | null {
  if (val === null || val === undefined || val === "") return null;

  if (val instanceof Date) {
    if (isNaN(val.getTime())) return null;
    // Redondear al minuto más cercano para evitar desfases de segundos en fechas de SheetJS
    const ajustada = new Date(Math.round(val.getTime() / 60000) * 60000);
    return construirFechaIsoValidada(
      ajustada.getFullYear(),
      ajustada.getMonth() + 1,
      ajustada.getDate()
    );
  }

  if (typeof val === "number") {
    const parsed = XLSX.SSF.parse_date_code(val);
    if (parsed && parsed.y && parsed.m && parsed.d) {
      return construirFechaIsoValidada(parsed.y, parsed.m, parsed.d);
    }
    return null;
  }

  if (typeof val === "string") {
    const limpio = val.trim();
    if (!limpio) return null;

    // 1. Formato dd/mm/yyyy o d/m/yyyy (con / o -)
    const matchNum = limpio.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
    if (matchNum) {
      const dia = parseInt(matchNum[1], 10);
      const mes = parseInt(matchNum[2], 10);
      const anio = parseInt(matchNum[3], 10);
      return construirFechaIsoValidada(anio, mes, dia);
    }

    // 2. Formato dd/mmm/yyyy en español (con / o -, ej. 06/oct/2026)
    const matchMesTexto = limpio.match(
      /^(\d{1,2})[\/\-]([a-zA-ZáéíóúÁÉÍÓÚ\.]+)[\/\-](\d{4})$/
    );
    if (matchMesTexto) {
      const dia = parseInt(matchMesTexto[1], 10);
      const mesClave = matchMesTexto[2]
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/\./g, "");
      const anio = parseInt(matchMesTexto[3], 10);
      const mes = MESES_ES_MAP[mesClave];
      if (mes) {
        return construirFechaIsoValidada(anio, mes, dia);
      }
      return null;
    }

    // 3. Formato yyyy-MM-dd
    const matchIso = limpio.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (matchIso) {
      const anio = parseInt(matchIso[1], 10);
      const mes = parseInt(matchIso[2], 10);
      const dia = parseInt(matchIso[3], 10);
      return construirFechaIsoValidada(anio, mes, dia);
    }
  }

  return null;
}

/**
 * Convierte cualquier valor de celda a string (sin trim de reglas) o null si está vacía.
 */
function celdaAStringONull(val: unknown): string | null {
  if (val === null || val === undefined) return null;
  if (typeof val === "number") {
    return isNaN(val) ? null : String(val);
  }
  if (typeof val === "boolean") {
    return String(val);
  }
  if (val instanceof Date) {
    return parsearFechaExcel(val);
  }
  const str = String(val);
  if (str.trim() === "") return null;
  return str;
}

const HEADERS_IGNORADOS = new Set([
  "FECHAFINAL",
  "HORAS",
  "PUESTO",
  "APELLIDOPATERNO",
  "APELLIDOMATERNO",
  "NOMBRES",
  "NOMBRE",
  "SOLICITADOPOR",
  "ORDENDECOMPRA",
]);

interface BloqueBusquedaManualCursoProps {
  idEmpresa: number;
  fechaExcel: string | null;
  cursoActualId: number | null;
  cursoActualNombre: string | null;
  cursoActualFecha: string | null;
  deshabilitado: boolean;
  onElegirCurso: (i_CveServAgendaDet: number) => void;
  onCancelarCambio?: () => void;
}

const BloqueBusquedaManualCurso: React.FC<BloqueBusquedaManualCursoProps> = ({
  idEmpresa,
  fechaExcel,
  cursoActualId,
  cursoActualNombre,
  cursoActualFecha,
  deshabilitado,
  onElegirCurso,
  onCancelarCambio,
}) => {
  const { toast } = useToast();
  const [fechaInicio, setFechaInicio] = useState<string>(fechaExcel || "");
  const [fechaFin, setFechaFin] = useState<string>(fechaExcel || "");
  const [cursos, setCursos] = useState<CursoHistorial[]>([]);
  const [cargando, setCargando] = useState<boolean>(false);
  const [searchText, setSearchText] = useState<string>("");
  const [dropdownAbierto, setDropdownAbierto] = useState<boolean>(false);

  const selectContainerRef = useRef<HTMLDivElement>(null);

  const cargarCursos = useCallback(
    async (fIni: string, fFin: string) => {
      setCargando(true);
      try {
        const lista = await AlumnosCatalogoService.getHistorialCursosEmpresa(idEmpresa, {
          fechaInicio: fIni || undefined,
          fechaFin: fFin || undefined,
        });
        setCursos(lista || []);
      } catch (err: any) {
        setCursos([]);
        const errorMsg =
          err?.response?.data?.error ||
          err?.response?.data?.mensaje ||
          err?.response?.data?.message ||
          "Error al cargar los cursos de la empresa.";
        toast.error(errorMsg);
      } finally {
        setCargando(false);
      }
    },
    [idEmpresa, toast]
  );

  useEffect(() => {
    cargarCursos(fechaInicio, fechaFin);
  }, [fechaInicio, fechaFin, cargarCursos]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        selectContainerRef.current &&
        !selectContainerRef.current.contains(e.target as Node)
      ) {
        setDropdownAbierto(false);
      }
    };
    if (dropdownAbierto) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownAbierto]);

  const formatearOpcionCurso = (c: CursoHistorial) => {
    const f = c.d_FechaInicio ? formatearFechaTexto(c.d_FechaInicio) : "Sin fecha";
    return `${f} · ${c.v_Curso} · ${c.i_Inscritos} inscritos`;
  };

  const cursosFiltrados = cursos.filter((c) => {
    if (!searchText.trim()) return true;
    const termino = searchText.trim().toLowerCase();
    const etiqueta = formatearOpcionCurso(c).toLowerCase();
    return etiqueta.includes(termino);
  });

  const handleChangeRange = (ini: string, fin: string) => {
    if (fin < ini) {
      toast.error("La fecha final no puede ser menor que la fecha inicial.");
      return;
    }
    setFechaInicio(ini);
    setFechaFin(fin);
  };

  const handleLimpiarFechas = () => {
    setFechaInicio("");
    setFechaFin("");
  };

  return (
    <div
      style={{
        padding: "12px 14px",
        backgroundColor: "#ffffff",
        borderRadius: "10px",
        border: "1px solid #e2e8f0",
        display: "flex",
        flexDirection: "column",
        gap: "10px",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "8px",
        }}
      >
        <span style={{ fontSize: "12px", fontWeight: 700, color: "#1e293b" }}>
          Búsqueda manual de curso
        </span>
        {onCancelarCambio && (
          <button
            type="button"
            onClick={onCancelarCambio}
            style={{
              background: "none",
              border: "none",
              padding: 0,
              fontSize: "11px",
              color: "#64748b",
              textDecoration: "underline",
              cursor: "pointer",
            }}
          >
            Cancelar cambio
          </button>
        )}
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "flex-end",
          gap: "12px",
          flexWrap: "wrap",
        }}
      >
        {/* Rango de fechas */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "4px",
            minWidth: "210px",
            position: "relative",
          }}
        >
          <label className="form-label" style={{ marginBottom: 0, fontSize: "11px" }}>
            Rango de fechas
          </label>
          <DateRangePickerPopover
            fechaInicio={fechaInicio}
            fechaFin={fechaFin}
            placeholder="Todas las fechas"
            onLimpiar={handleLimpiarFechas}
            onChangeRange={handleChangeRange}
          />
        </div>

        {/* Select con buscador */}
        <div
          ref={selectContainerRef}
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "4px",
            flex: 1,
            minWidth: "280px",
            position: "relative",
          }}
        >
          <label className="form-label" style={{ marginBottom: 0, fontSize: "11px" }}>
            Curso con alumnos inscritos
          </label>
          <div style={{ position: "relative" }}>
            <Search
              size={14}
              style={{
                position: "absolute",
                left: "10px",
                top: "50%",
                transform: "translateY(-50%)",
                color: "#94a3b8",
                pointerEvents: "none",
              }}
            />
            <input
              type="text"
              className="form-control text-xs"
              disabled={deshabilitado}
              style={{
                width: "100%",
                height: "32px",
                borderRadius: "20px",
                paddingLeft: "30px",
                paddingRight: searchText ? "28px" : "28px",
                fontSize: "12px",
                border: "1px solid #d0dce8",
                backgroundColor: deshabilitado ? "#f8fafc" : "#ffffff",
              }}
              placeholder={
                cargando
                  ? "Buscando cursos..."
                  : cursoActualId && cursoActualNombre
                  ? `${
                      cursoActualFecha ? `${formatearFechaTexto(cursoActualFecha)} · ` : ""
                    }${cursoActualNombre}`
                  : "Buscar y elegir curso..."
              }
              value={searchText}
              onFocus={() => setDropdownAbierto(true)}
              onChange={(e) => {
                setSearchText(e.target.value);
                setDropdownAbierto(true);
              }}
            />
            {searchText ? (
              <button
                type="button"
                onClick={() => {
                  setSearchText("");
                  setDropdownAbierto(true);
                }}
                style={{
                  position: "absolute",
                  right: "8px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  color: "#94a3b8",
                  cursor: "pointer",
                  fontSize: "12px",
                  lineHeight: 1,
                }}
              >
                ✕
              </button>
            ) : (
              <ChevronDown
                size={14}
                onClick={() => !deshabilitado && setDropdownAbierto((prev) => !prev)}
                style={{
                  position: "absolute",
                  right: "10px",
                  top: "50%",
                  transform: `translateY(-50%) ${dropdownAbierto ? "rotate(180deg)" : ""}`,
                  color: "#64748b",
                  cursor: deshabilitado ? "not-allowed" : "pointer",
                  transition: "transform 0.2s ease",
                }}
              />
            )}
          </div>

          {dropdownAbierto && !deshabilitado && (
            <div
              className="no-scrollbar"
              style={{
                position: "absolute",
                top: "calc(100% + 4px)",
                left: 0,
                right: 0,
                backgroundColor: "#ffffff",
                borderRadius: "10px",
                border: "1px solid #cbd5e1",
                boxShadow:
                  "0 20px 25px -5px rgba(0, 0, 0, 0.15), 0 10px 10px -5px rgba(0, 0, 0, 0.08)",
                maxHeight: "220px",
                overflowY: "auto",
                zIndex: 10000,
              }}
            >
              {cargando ? (
                <div
                  style={{
                    padding: "12px 14px",
                    fontSize: "12px",
                    color: "#64748b",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                  }}
                >
                  <Loader2 size={14} className="animate-spin" />
                  <span>Cargando cursos...</span>
                </div>
              ) : cursosFiltrados.length === 0 ? (
                <div
                  style={{
                    padding: "12px 14px",
                    fontSize: "12px",
                    color: "#64748b",
                    textAlign: "center",
                  }}
                >
                  No hay cursos con alumnos en esas fechas
                </div>
              ) : (
                cursosFiltrados.map((c) => {
                  const seleccionado = cursoActualId === c.i_CveServAgendaDet;
                  return (
                    <div
                      key={c.i_CveServAgendaDet}
                      onClick={() => {
                        setDropdownAbierto(false);
                        setSearchText("");
                        onElegirCurso(c.i_CveServAgendaDet);
                      }}
                      style={{
                        padding: "8px 12px",
                        fontSize: "12px",
                        cursor: "pointer",
                        borderBottom: "1px solid #f1f5f9",
                        backgroundColor: seleccionado ? "#eaf4fb" : "transparent",
                        color: "#1e293b",
                        fontWeight: seleccionado ? 600 : 500,
                        transition: "background-color 0.15s ease",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = "#f4f8fc";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = seleccionado
                          ? "#eaf4fb"
                          : "transparent";
                      }}
                    >
                      {formatearOpcionCurso(c)}
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export const ModalCargaMasivaHistorial: React.FC<ModalCargaMasivaHistorialProps> = ({
  abierto,
  idEmpresa,
  onCerrar,
  onImportacionExitosa,
}) => {
  const { toast } = useToast();
  const [mounted, setMounted] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [archivoNombre, setArchivoNombre] = useState<string | null>(null);
  const [cursosPayload, setCursosPayload] = useState<CargaHistorialCurso[]>([]);
  const [resultado, setResultado] = useState<CargaHistorialResultado | null>(null);
  const [validando, setValidando] = useState<boolean>(false);
  const [importando, setImportando] = useState<boolean>(false);

  // Control de renglones expandidos y búsqueda manual activa por i_Grupo
  const [gruposExpandidos, setGruposExpandidos] = useState<Set<number>>(new Set());
  const [gruposCambiandoCurso, setGruposCambiandoCurso] = useState<Set<number>>(new Set());

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (abierto) {
      setArchivoNombre(null);
      setCursosPayload([]);
      setResultado(null);
      setValidando(false);
      setImportando(false);
      setGruposExpandidos(new Set());
      setGruposCambiandoCurso(new Set());
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }, [abierto]);

  if (!abierto || !mounted) return null;

  // Paso 1: Descargar plantilla PlantillaHistorialAlumnos.xlsx
  const descargarPlantilla = () => {
    const historialHeaders = [
      [
        "FECHA INICIO",
        "NOMBRE DEL CURSO",
        "NOMINA",
        "EV TEORICA",
        "EV PRACTICA",
        "EV FINAL",
        "DIPLOMA",
        "DC-3",
        "LICENCIA",
      ],
    ];

    const valoresData = [
      ["COLUMNA", "VALORES PERMITIDOS"],
      ["FECHA INICIO", "Fecha de inicio del curso (ej. 06/10/2026 o 06/oct/2026)"],
      ["NOMBRE DEL CURSO", "Nombre del curso o capacitación"],
      ["NOMINA", "Clave o número de nómina del alumno inscrito"],
      ["EV TEORICA", "Número o vacío"],
      ["EV PRACTICA", "Número o vacío"],
      ["EV FINAL", "APROBADO, NO APROBADO o vacío"],
      ["DIPLOMA / DC-3 / LICENCIA (Entregables)", "ENTREGADO, NO ENTREGADO, N/A o vacío"],
    ];

    const wsHistorial = XLSX.utils.aoa_to_sheet(historialHeaders);
    wsHistorial["!cols"] = [
      { wch: 16 },
      { wch: 30 },
      { wch: 14 },
      { wch: 14 },
      { wch: 14 },
      { wch: 16 },
      { wch: 16 },
      { wch: 16 },
      { wch: 16 },
    ];

    const wsValores = XLSX.utils.aoa_to_sheet(valoresData);
    wsValores["!cols"] = [{ wch: 36 }, { wch: 52 }];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, wsHistorial, "Historial");
    XLSX.utils.book_append_sheet(wb, wsValores, "Valores");

    XLSX.writeFile(wb, "PlantillaHistorialAlumnos.xlsx");
  };

  // Llamar a POST alumnos/historial/carga-masiva/validar
  const ejecutarValidacion = async (cursosAValidar: CargaHistorialCurso[]) => {
    setValidando(true);
    try {
      const payload: CargaHistorialPayload = {
        i_CveEmpresa: idEmpresa,
        Cursos: cursosAValidar,
      };
      const res = await AlumnosCatalogoService.validarCargaMasivaHistorial(payload);
      setResultado(res);

      // Abrir automáticamente el detalle en los No válidos
      setGruposExpandidos((prev) => {
        const next = new Set(prev);
        (res.Cursos || []).forEach((c) => {
          if (!c.b_Valido) {
            next.add(c.i_Grupo);
          }
        });
        return next;
      });
    } catch (err: any) {
      const errorMsg =
        err?.response?.data?.error ||
        err?.response?.data?.mensaje ||
        err?.response?.data?.message ||
        "Ocurrió un error al validar el archivo de historial.";
      toast.error(errorMsg);
    } finally {
      setValidando(false);
    }
  };

  // Paso 2: Procesar archivo Excel
  const procesarArchivo = async (file: File) => {
    setArchivoNombre(file.name);
    setResultado(null);
    setCursosPayload([]);
    setGruposExpandidos(new Set());
    setGruposCambiandoCurso(new Set());

    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array", cellDates: true });
      const firstSheetName = workbook.SheetNames[0];
      if (!firstSheetName) {
        toast.error("El archivo Excel no contiene hojas.");
        return;
      }

      const sheet = workbook.Sheets[firstSheetName];
      const rows = XLSX.utils.sheet_to_json<any[]>(sheet, {
        header: 1,
        defval: null,
        raw: true,
        blankrows: true,
        range: 0,
      });

      if (!rows || rows.length === 0 || !rows[0]) {
        toast.error("El archivo está vacío o no contiene encabezados en la fila 1.");
        return;
      }

      const headerRow = rows[0];
      let idxFechaInicio = -1;
      let idxCurso = -1;
      let idxNomina = -1;
      let idxEvTeorica = -1;
      let idxEvPractica = -1;
      let idxEvFinal = -1;

      const columnasEntregables: { index: number; headerOriginal: string }[] = [];

      headerRow.forEach((rawHeader: any, colIdx: number) => {
        const originalStr = rawHeader !== null && rawHeader !== undefined ? String(rawHeader).trim() : "";
        if (!originalStr) return;

        const norm = normalizarEncabezado(originalStr);
        if (!norm) return;

        if (norm === "FECHAINICIO" && idxFechaInicio === -1) {
          idxFechaInicio = colIdx;
        } else if (
          (norm === "NOMBREDELCURSOCAPACITACION" ||
            norm === "NOMBREDELCURSO" ||
            norm === "CURSO") &&
          idxCurso === -1
        ) {
          idxCurso = colIdx;
        } else if (
          (norm === "NODENOMINA" || norm === "NONOMINA" || norm === "NOMINA") &&
          idxNomina === -1
        ) {
          idxNomina = colIdx;
        } else if (norm === "EVTEORICA" && idxEvTeorica === -1) {
          idxEvTeorica = colIdx;
        } else if (norm === "EVPRACTICA" && idxEvPractica === -1) {
          idxEvPractica = colIdx;
        } else if (norm === "EVFINAL" && idxEvFinal === -1) {
          idxEvFinal = colIdx;
        } else if (HEADERS_IGNORADOS.has(norm)) {
          // Columna ignorada
        } else {
          // Cualquier otra columna se trata como entregable con su encabezado original
          columnasEntregables.push({
            index: colIdx,
            headerOriginal: originalStr,
          });
        }
      });

      // Verificar columnas obligatorias
      const faltantes: string[] = [];
      if (idxFechaInicio === -1) faltantes.push("FECHA INICIO");
      if (idxCurso === -1) faltantes.push("NOMBRE DEL CURSO");
      if (idxNomina === -1) faltantes.push("NOMINA");
      if (idxEvTeorica === -1) faltantes.push("EV TEORICA");
      if (idxEvPractica === -1) faltantes.push("EV PRACTICA");
      if (idxEvFinal === -1) faltantes.push("EV FINAL");

      if (faltantes.length > 0) {
        toast.error(
          `Faltan columnas obligatorias en el archivo: ${faltantes.join(", ")}`
        );
        return;
      }

      // Agrupar filas por fecha (yyyy-MM-dd) + nombre del curso normalizado
      const mapaGrupos = new Map<string, CargaHistorialCurso>();

      for (let r = 1; r < rows.length; r++) {
        const fila = rows[r];
        if (!Array.isArray(fila)) continue;

        // Omitir filas totalmente vacías
        const tieneAlgunValor = fila.some(
          (celda) =>
            celda !== null &&
            celda !== undefined &&
            String(celda).trim() !== ""
        );
        if (!tieneAlgunValor) continue;

        const numeroRenglonReal = r + 1; // fila 1 es el encabezado
        const fechaIso = parsearFechaExcel(fila[idxFechaInicio]);
        const cursoCelda = celdaAStringONull(fila[idxCurso]);
        const cursoTrim = cursoCelda !== null ? cursoCelda.trim() : null;
        const cursoClaveNorm = cursoTrim
          ? cursoTrim.toUpperCase().replace(/\s+/g, " ")
          : "";

        const claveGrupo = `${fechaIso ?? "__NULL__"}||${cursoClaveNorm}`;

        let grupo = mapaGrupos.get(claveGrupo);
        if (!grupo) {
          grupo = {
            i_Grupo: mapaGrupos.size,
            d_FechaInicio: fechaIso,
            v_Curso: cursoTrim && cursoTrim.length > 0 ? cursoTrim : null,
            i_CveServAgendaDet: null,
            Alumnos: [],
          };
          mapaGrupos.set(claveGrupo, grupo);
        }

        const entregablesFila: Record<string, string | null> = {};
        columnasEntregables.forEach((colEnt) => {
          entregablesFila[colEnt.headerOriginal] = celdaAStringONull(
            fila[colEnt.index]
          );
        });

        const alumno: CargaHistorialAlumno = {
          i_Renglon: numeroRenglonReal,
          v_Nomina: celdaAStringONull(fila[idxNomina]),
          v_EvTeorica: celdaAStringONull(fila[idxEvTeorica]),
          v_EvPractica: celdaAStringONull(fila[idxEvPractica]),
          v_EvFinal: celdaAStringONull(fila[idxEvFinal]),
          Entregables: entregablesFila,
        };

        grupo.Alumnos.push(alumno);
      }

      const listaGrupos = Array.from(mapaGrupos.values());
      if (listaGrupos.length === 0) {
        toast.error("El archivo no contiene filas con datos para procesar.");
        return;
      }

      setCursosPayload(listaGrupos);
      await ejecutarValidacion(listaGrupos);
    } catch {
      toast.error("Ocurrió un error al leer el archivo Excel.");
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await procesarArchivo(file);
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (validando || importando) return;
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    await procesarArchivo(file);
  };

  // Selección manual de curso para un grupo
  const handleSeleccionarCursoManual = async (
    i_Grupo: number,
    i_CveServAgendaDet: number
  ) => {
    const nuevosCursos = cursosPayload.map((c) =>
      c.i_Grupo === i_Grupo ? { ...c, i_CveServAgendaDet } : c
    );
    setCursosPayload(nuevosCursos);

    // Ocultar el formulario de cambio manual una vez elegido
    setGruposCambiandoCurso((prev) => {
      const next = new Set(prev);
      next.delete(i_Grupo);
      return next;
    });

    await ejecutarValidacion(nuevosCursos);
  };

  const toggleExpandirGrupo = (i_Grupo: number) => {
    setGruposExpandidos((prev) => {
      const next = new Set(prev);
      if (next.has(i_Grupo)) {
        next.delete(i_Grupo);
      } else {
        next.add(i_Grupo);
      }
      return next;
    });
  };

  const abrirCambioManualCurso = (i_Grupo: number) => {
    setGruposExpandidos((prev) => {
      const next = new Set(prev);
      next.add(i_Grupo);
      return next;
    });
    setGruposCambiandoCurso((prev) => {
      const next = new Set(prev);
      next.add(i_Grupo);
      return next;
    });
  };

  const cerrarCambioManualCurso = (i_Grupo: number) => {
    setGruposCambiandoCurso((prev) => {
      const next = new Set(prev);
      next.delete(i_Grupo);
      return next;
    });
  };

  // Confirmar importación final
  const handleConfirmarImportar = async () => {
    if (!resultado || resultado.i_CursosValidos === 0 || validando || importando) {
      return;
    }

    setImportando(true);
    try {
      const payload: CargaHistorialPayload = {
        i_CveEmpresa: idEmpresa,
        Cursos: cursosPayload,
      };
      const res = await AlumnosCatalogoService.postCargaMasivaHistorial(payload);
      toast.success(
        `Se actualizaron ${res.i_AlumnosActualizados} alumnos de ${res.i_CursosValidos} cursos`
      );
      onImportacionExitosa();
      onCerrar();
    } catch (err: any) {
      if (err?.response?.data?.resultado) {
        setResultado(err.response.data.resultado);
      }
      const errorMsg =
        err?.response?.data?.error ||
        err?.response?.data?.mensaje ||
        err?.response?.data?.message ||
        "Ocurrió un error al importar el historial de alumnos.";
      toast.error(errorMsg);
    } finally {
      setImportando(false);
    }
  };

  const cursosValidos = resultado?.i_CursosValidos ?? 0;
  const cursosNoValidos = resultado?.i_CursosNoValidos ?? 0;
  const participantesDetectados = resultado?.i_AlumnosDetectados ?? 0;
  const peticionEnCurso = validando || importando;

  return createPortal(
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
        zIndex: 1100,
        padding: "16px",
      }}
    >
      <div
        className="modal-content no-scrollbar"
        style={{
          maxWidth: "980px",
          width: "100%",
          maxHeight: "90vh",
          backgroundColor: "#ffffff",
          borderRadius: "16px",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* Header */}
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
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "10px",
                backgroundColor: "#f0fdf4",
                color: "#16a34a",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <FileSpreadsheet size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#0f172a", margin: 0 }}>
                Carga masiva de historial
              </h3>
              <p style={{ fontSize: "12px", color: "#64748b", margin: 0 }}>
                Actualiza asistencia, evaluaciones y entregables de los alumnos inscritos.
              </p>
            </div>
          </div>
          <button
            className="btn-icon"
            onClick={onCerrar}
            disabled={peticionEnCurso}
            title="Cerrar"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div
          style={{
            padding: "24px",
            paddingBottom: gruposExpandidos.size > 0 ? "180px" : "24px",
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            gap: "20px",
            flex: 1,
          }}
        >
          {/* Paso 1: Plantilla */}
          <div
            style={{
              padding: "16px",
              backgroundColor: "#f8fafc",
              borderRadius: "12px",
              border: "1px solid #e2e8f0",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: "12px",
              }}
            >
              <h4
                style={{
                  fontSize: "13px",
                  fontWeight: 700,
                  color: "#1e293b",
                  margin: 0,
                }}
              >
                Paso 1. Plantilla
              </h4>
              <button
                type="button"
                className="btn btn-outline"
                onClick={descargarPlantilla}
                style={{
                  fontSize: "12px",
                  padding: "6px 14px",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  flexShrink: 0,
                }}
              >
                <Download size={15} />
                <span>Descargar plantilla</span>
              </button>
            </div>
          </div>

          {/* Paso 2: Subir archivo */}
          <div>
            <h4
              style={{
                fontSize: "13px",
                fontWeight: 700,
                color: "#1e293b",
                margin: "0 0 8px 0",
              }}
            >
              Paso 2. Subir archivo
            </h4>

            <div
              style={{
                border: "2px dashed #cbd5e1",
                borderRadius: "12px",
                padding: "24px",
                textAlign: "center",
                backgroundColor: "#f8fafc",
                cursor: peticionEnCurso ? "not-allowed" : "pointer",
                opacity: peticionEnCurso ? 0.7 : 1,
                transition: "all 0.2s ease",
              }}
              onClick={() => !peticionEnCurso && fileInputRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              onDrop={handleDrop}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx, .xls"
                style={{ display: "none" }}
                onChange={handleFileChange}
              />
              <Upload size={28} style={{ margin: "0 auto 8px auto", color: "#64748b" }} />
              <p
                style={{
                  fontSize: "13px",
                  fontWeight: 600,
                  color: "#334155",
                  margin: "0 0 4px 0",
                }}
              >
                {archivoNombre
                  ? archivoNombre
                  : "Haz clic para seleccionar o arrastra tu archivo Excel aquí"}
              </p>
              <p style={{ fontSize: "11px", color: "#94a3b8", margin: 0 }}>
                Formatos permitidos: .xlsx, .xls
              </p>
            </div>
          </div>

          {/* Paso 3: Vista previa */}
          {(validando || resultado) && (
            <div>
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  justifyContent: "space-between",
                  marginBottom: "10px",
                  gap: "12px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <h4 style={{ fontSize: "13px", fontWeight: 700, color: "#1e293b", margin: 0 }}>
                    Paso 3. Vista previa
                  </h4>
                  {validando && resultado && (
                    <span
                      style={{
                        fontSize: "11px",
                        color: "#2B8FCC",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                    >
                      <Loader2 size={13} className="animate-spin" />
                      Validando...
                    </span>
                  )}
                </div>

                {resultado && (
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: "12px", fontWeight: 600, color: "#475569" }}>
                      <span style={{ color: "#16a34a" }}>{cursosValidos} válidos</span>
                      {cursosNoValidos > 0 && (
                        <>
                          <span style={{ margin: "0 6px" }}>·</span>
                          <span style={{ color: "#dc2626" }}>{cursosNoValidos} no válidos</span>
                        </>
                      )}
                    </div>
                    <div style={{ fontSize: "11px", color: "#64748b", marginTop: "2px" }}>
                      {participantesDetectados} participantes detectados
                    </div>
                  </div>
                )}
              </div>

              {validando && !resultado ? (
                <div
                  style={{
                    padding: "40px 16px",
                    borderRadius: "12px",
                    border: "1px solid #e2e8f0",
                    backgroundColor: "#f8fafc",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    color: "#64748b",
                  }}
                >
                  <Loader2 size={24} className="animate-spin" style={{ color: "#2B8FCC" }} />
                  <span style={{ fontSize: "13px" }}>Validando cursos y participantes...</span>
                </div>
              ) : resultado ? (
                <div
                  className="alegra-table-container border border-slate-200/80 rounded-xl"
                  style={{ overflow: "visible" }}
                >
                  <table className="alegra-table alegra-table-compact" style={{ fontSize: "12px" }}>
                    <thead>
                      <tr>
                        <th style={{ width: "13%" }}>Fecha</th>
                        <th style={{ width: "25%" }}>Curso (Excel)</th>
                        <th style={{ width: "26%" }}>Curso en el sistema</th>
                        <th style={{ width: "16%" }}>Participantes</th>
                        <th className="text-center" style={{ width: "15%" }}>
                          Estado
                        </th>
                        <th style={{ width: "42px", textAlign: "center" }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {(resultado.Cursos || []).map((cursoRes: CargaHistorialCursoResultado) => {
                        const expandido = gruposExpandidos.has(cursoRes.i_Grupo);
                        const cambiandoManual = gruposCambiandoCurso.has(cursoRes.i_Grupo);
                        const numErrores = cursoRes.Errores ? cursoRes.Errores.length : 0;
                        const columnasIgnoradas = cursoRes.v_ColumnasIgnoradas || [];
                        const mostrarBusquedaManual =
                          cursoRes.i_CveServAgendaDet === null || cambiandoManual;

                        return (
                          <React.Fragment key={cursoRes.i_Grupo}>
                            <tr
                              style={{
                                cursor: "pointer",
                                backgroundColor: expandido ? "#f8fafc" : undefined,
                              }}
                              onClick={() => toggleExpandirGrupo(cursoRes.i_Grupo)}
                            >
                              {/* Fecha */}
                              <td style={{ whiteSpace: "nowrap", verticalAlign: "middle" }}>
                                {cursoRes.d_FechaExcel
                                  ? formatearFechaTexto(cursoRes.d_FechaExcel)
                                  : "—"}
                              </td>

                              {/* Curso (Excel) */}
                              <td style={{ verticalAlign: "middle" }}>
                                <div style={{ fontWeight: 700, color: "#1e293b" }}>
                                  {cursoRes.v_CursoExcel || "—"}
                                </div>
                              </td>

                              {/* Curso en el sistema */}
                              <td style={{ verticalAlign: "middle" }}>
                                {cursoRes.i_CveServAgendaDet && cursoRes.v_Curso ? (
                                  <div>
                                    <div style={{ fontWeight: 600, color: "#1e293b" }}>
                                      {cursoRes.v_Curso}
                                    </div>
                                    <div style={{ fontSize: "11px", color: "#64748b" }}>
                                      {cursoRes.d_FechaInicio
                                        ? formatearFechaTexto(cursoRes.d_FechaInicio)
                                        : "—"}
                                    </div>
                                  </div>
                                ) : (
                                  <span style={{ color: "#94a3b8" }}>—</span>
                                )}
                              </td>

                              {/* Participantes */}
                              <td style={{ verticalAlign: "middle" }}>
                                <div style={{ fontWeight: 700, color: "#1e293b" }}>
                                  {cursoRes.i_Detectados} / {cursoRes.i_Inscritos}
                                </div>
                                <div style={{ fontSize: "11px", color: "#64748b" }}>
                                  de {cursoRes.i_Renglones}{" "}
                                  {cursoRes.i_Renglones === 1 ? "renglón" : "renglones"}
                                </div>
                                {numErrores > 0 && (
                                  <div
                                    style={{
                                      fontSize: "11px",
                                      color: "#dc2626",
                                      fontWeight: 500,
                                      marginTop: "1px",
                                    }}
                                  >
                                    {numErrores}{" "}
                                    {numErrores === 1 ? "renglón con error" : "renglones con error"}
                                  </div>
                                )}
                              </td>

                              {/* Estado */}
                              <td className="text-center" style={{ verticalAlign: "middle" }}>
                                <div
                                  style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    alignItems: "center",
                                    gap: "2px",
                                  }}
                                >
                                  {cursoRes.b_Valido ? (
                                    <span
                                      style={{
                                        backgroundColor: "#dcfce7",
                                        color: "#166534",
                                        border: "1px solid #bbf7d0",
                                        padding: "2px 8px",
                                        borderRadius: "12px",
                                        fontSize: "11px",
                                        fontWeight: 600,
                                        display: "inline-flex",
                                        alignItems: "center",
                                        gap: "4px",
                                      }}
                                    >
                                      <CheckCircle2 size={12} />
                                      Válido
                                    </span>
                                  ) : (
                                    <span
                                      style={{
                                        backgroundColor: "#fee2e2",
                                        color: "#991b1b",
                                        border: "1px solid #fecaca",
                                        padding: "2px 8px",
                                        borderRadius: "12px",
                                        fontSize: "11px",
                                        fontWeight: 600,
                                        display: "inline-flex",
                                        alignItems: "center",
                                        gap: "4px",
                                      }}
                                    >
                                      <XCircle size={12} />
                                      No válido
                                    </span>
                                  )}

                                  {cursoRes.b_Manual && (
                                    <span style={{ fontSize: "10px", color: "#64748b" }}>
                                      Seleccionado manualmente
                                    </span>
                                  )}
                                </div>
                              </td>

                              {/* Chevron */}
                              <td
                                style={{
                                  textAlign: "center",
                                  verticalAlign: "middle",
                                  color: "#64748b",
                                }}
                              >
                                {expandido ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                              </td>
                            </tr>

                            {/* Detalle expandible */}
                            {expandido && (
                              <tr style={{ backgroundColor: "#f8fafc" }}>
                                <td
                                  colSpan={6}
                                  style={{
                                    padding: "12px 16px 16px 16px",
                                    borderTop: "1px solid #e2e8f0",
                                  }}
                                >
                                  <div
                                    style={{
                                      display: "flex",
                                      flexDirection: "column",
                                      gap: "12px",
                                    }}
                                  >
                                    {/* Motivo de invalidez si existe */}
                                    {cursoRes.v_Motivo && (
                                      <div
                                        style={{
                                          padding: "8px 12px",
                                          backgroundColor: "#fef2f2",
                                          border: "1px solid #fecaca",
                                          borderRadius: "8px",
                                          color: "#b91c1c",
                                          fontSize: "12px",
                                          display: "flex",
                                          alignItems: "center",
                                          gap: "6px",
                                        }}
                                      >
                                        <AlertCircle size={15} style={{ flexShrink: 0 }} />
                                        <span>{cursoRes.v_Motivo}</span>
                                      </div>
                                    )}

                                    {/* 1 y 2: Búsqueda manual o enlace "Cambiar curso" */}
                                    {mostrarBusquedaManual ? (
                                      <BloqueBusquedaManualCurso
                                        idEmpresa={idEmpresa}
                                        fechaExcel={cursoRes.d_FechaExcel}
                                        cursoActualId={cursoRes.i_CveServAgendaDet}
                                        cursoActualNombre={cursoRes.v_Curso}
                                        cursoActualFecha={cursoRes.d_FechaInicio}
                                        deshabilitado={peticionEnCurso}
                                        onElegirCurso={(idCurso) =>
                                          handleSeleccionarCursoManual(cursoRes.i_Grupo, idCurso)
                                        }
                                        onCancelarCambio={
                                          cursoRes.i_CveServAgendaDet !== null
                                            ? () => cerrarCambioManualCurso(cursoRes.i_Grupo)
                                            : undefined
                                        }
                                      />
                                    ) : (
                                      <div
                                        style={{
                                          display: "flex",
                                          alignItems: "center",
                                          justifyContent: "space-between",
                                          flexWrap: "wrap",
                                          gap: "8px",
                                        }}
                                      >
                                        <span style={{ fontSize: "12px", color: "#475569" }}>
                                          Curso vinculado:{" "}
                                          <strong style={{ color: "#1e293b" }}>
                                            {cursoRes.v_Curso}
                                          </strong>{" "}
                                          {cursoRes.d_FechaInicio
                                            ? `(${formatearFechaTexto(cursoRes.d_FechaInicio)})`
                                            : ""}
                                        </span>
                                        <button
                                          type="button"
                                          disabled={peticionEnCurso}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            abrirCambioManualCurso(cursoRes.i_Grupo);
                                          }}
                                          style={{
                                            background: "none",
                                            border: "none",
                                            padding: 0,
                                            fontSize: "12px",
                                            fontWeight: 600,
                                            color: "#2B8FCC",
                                            textDecoration: "underline",
                                            cursor: peticionEnCurso ? "not-allowed" : "pointer",
                                          }}
                                        >
                                          Cambiar curso
                                        </button>
                                      </div>
                                    )}

                                    {/* 3: Errores de renglón */}
                                    {numErrores > 0 && (
                                      <div>
                                        <div
                                          style={{
                                            fontSize: "11px",
                                            fontWeight: 700,
                                            color: "#991b1b",
                                            marginBottom: "6px",
                                          }}
                                        >
                                          Errores por renglón ({numErrores})
                                        </div>
                                        <div
                                          className="alegra-table-container border border-slate-200 rounded-lg"
                                          style={{ maxHeight: "180px", overflowY: "auto" }}
                                        >
                                          <table
                                            className="alegra-table alegra-table-compact"
                                            style={{ fontSize: "11px", margin: 0 }}
                                          >
                                            <thead>
                                              <tr>
                                                <th style={{ width: "90px" }}>Renglón</th>
                                                <th style={{ width: "140px" }}>Nómina</th>
                                                <th>Motivo</th>
                                              </tr>
                                            </thead>
                                            <tbody>
                                              {cursoRes.Errores.map((err, idx) => (
                                                <tr key={`err-${cursoRes.i_Grupo}-${idx}`}>
                                                  <td style={{ fontWeight: 600, color: "#334155" }}>
                                                    {err.i_Renglon}
                                                  </td>
                                                  <td style={{ fontWeight: 600, color: "#1e293b" }}>
                                                    {err.v_Nomina || "—"}
                                                  </td>
                                                  <td style={{ color: "#dc2626" }}>
                                                    {err.v_Motivo}
                                                  </td>
                                                </tr>
                                              ))}
                                            </tbody>
                                          </table>
                                        </div>
                                      </div>
                                    )}

                                    {/* 4: v_ColumnasIgnoradas */}
                                    {columnasIgnoradas.length > 0 && (
                                      <div style={{ fontSize: "11px", color: "#64748b" }}>
                                        Columnas ignoradas (el curso no tiene ese entregable):{" "}
                                        {columnasIgnoradas.join(", ")}
                                      </div>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : null}
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: "16px 24px",
            borderTop: "1px solid #f1f5f9",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "12px",
            background: "#ffffff",
          }}
        >
          <span style={{ fontSize: "12px", color: "#64748b" }}>
            Solo se importan los cursos válidos; los renglones con error se omiten.
          </span>

          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onCerrar}
              disabled={peticionEnCurso}
            >
              Cancelar
            </button>
            <button
              type="button"
              className="btn btn-primary"
              disabled={cursosValidos === 0 || peticionEnCurso}
              onClick={handleConfirmarImportar}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              {importando && <Loader2 size={14} className="animate-spin" />}
              <span>
                {importando ? "Importando..." : `Importar ${cursosValidos} cursos`}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

