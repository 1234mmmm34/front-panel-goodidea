"use client";

import React, { useEffect, useState, useRef, useMemo } from "react";
import {
  X,
  Upload,
  FileUp,
  FileText,
  Check,
  Building2,
  Factory,
  Search,
  Trash2,
  AlertCircle,
  Loader2,
  Calendar,
  Paperclip,
  CheckSquare,
  Square,
} from "lucide-react";
import { EmpresaGetDto, PlantaGetDto } from "@/types/empresas";
import {
  ServiciosPendientesArchivoDto,
  ServicioConEntregablesDto,
  SubirArchivoRequestDto,
} from "@/types/archivos";
import { ArchivosService } from "@/services/archivos.service";
import { EmpresasService } from "@/services/empresas.service";
import { useToast } from "@/context/ToastContext";

interface ModalSubirArchivosProps {
  abierto: boolean;
  onCerrar: () => void;
  onGuardadoExitoso?: () => void;
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
    return `${day}/${MESES_ABREV[monthIdx]}/${year}`;
  }
  return fechaIso;
}

function formatearTamanoArchivo(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

export const ModalSubirArchivos: React.FC<ModalSubirArchivosProps> = ({
  abierto,
  onCerrar,
  onGuardadoExitoso,
}) => {
  const { toast } = useToast();

  // 2.1 Tipo de documento
  const [vTipo, setVTipo] = useState<string>("");

  // 2.2 Empresa (Autocomplete)
  const [empresasCatalogo, setEmpresasCatalogo] = useState<EmpresaGetDto[]>([]);
  const [searchEmpresaText, setSearchEmpresaText] = useState<string>("");
  const [empresaSeleccionada, setEmpresaSeleccionada] = useState<EmpresaGetDto | null>(null);
  const [dropdownEmpresaAbierto, setDropdownEmpresaAbierto] = useState<boolean>(false);
  const containerEmpresaRef = useRef<HTMLDivElement>(null);

  // 2.3 Planta
  const [plantas, setPlantas] = useState<PlantaGetDto[]>([]);
  const [plantaSeleccionadaId, setPlantaSeleccionadaId] = useState<string>("");

  // 2.4 Buscador de servicio / entregable
  const [searchServicioText, setSearchServicioText] = useState<string>("");
  const [buscandoServicios, setBuscandoServicios] = useState<boolean>(false);
  const [dropdownServiciosAbierto, setDropdownServiciosAbierto] = useState<boolean>(false);
  const containerServicioRef = useRef<HTMLDivElement>(null);

  // Resultados de búsqueda del endpoint
  const [resultadosCotizacionOC, setResultadosCotizacionOC] = useState<
    ServiciosPendientesArchivoDto[]
  >([]);
  const [resultadosEntregables, setResultadosEntregables] = useState<
    ServicioConEntregablesDto[]
  >([]);

  // 2.5 Tabla seleccionados (Variante Cotización / OC)
  const [serviciosSeleccionados, setServiciosSeleccionados] = useState<
    ServiciosPendientesArchivoDto[]
  >([]);
  const [vReferenciaGlobal, setVReferenciaGlobal] = useState<string>("");

  // 2.6 Tabla seleccionados (Variante Entregables)
  const [serviciosConEntregablesSeleccionados, setServiciosConEntregablesSeleccionados] =
    useState<ServicioConEntregablesDto[]>([]);
  const [entregablesSeleccionadosIds, setEntregablesSeleccionadosIds] = useState<number[]>([]);
  const [fechaEntrega, setFechaEntrega] = useState<string>(
    new Date().toISOString().split("T")[0]
  );

  // 2.7 Selector de archivo
  const [archivo, setArchivo] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 2.8 Submit state
  const [subiendo, setSubiendo] = useState<boolean>(false);

  // Cargar catálogo inicial de empresas al abrir
  useEffect(() => {
    if (abierto) {
      setVTipo("");
      setSearchEmpresaText("");
      setEmpresaSeleccionada(null);
      setPlantas([]);
      setPlantaSeleccionadaId("");
      setSearchServicioText("");
      setResultadosCotizacionOC([]);
      setResultadosEntregables([]);
      setServiciosSeleccionados([]);
      setServiciosConEntregablesSeleccionados([]);
      setEntregablesSeleccionadosIds([]);
      setVReferenciaGlobal("");
      setFechaEntrega(new Date().toISOString().split("T")[0]);
      setArchivo(null);
      setSubiendo(false);

      EmpresasService.getEmpresas().then((res) => {
        setEmpresasCatalogo(res || []);
      });
    }
  }, [abierto]);

  // Click outside listener para dropdowns
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
        setDropdownServiciosAbierto(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Seleccionar Empresa
  const handleSeleccionarEmpresa = (emp: EmpresaGetDto) => {
    setEmpresaSeleccionada(emp);
    setSearchEmpresaText(emp.s_RazonSocial || "");
    setDropdownEmpresaAbierto(false);

    // Reset Planta y tablas de seleccionados
    setPlantaSeleccionadaId("");
    setPlantas([]);
    setServiciosSeleccionados([]);
    setServiciosConEntregablesSeleccionados([]);
    setEntregablesSeleccionadosIds([]);

    EmpresasService.getPlantas(emp.iD_Empresa).then((res) => {
      setPlantas(res || []);
    });
  };

  const handleLimpiarEmpresa = () => {
    setEmpresaSeleccionada(null);
    setSearchEmpresaText("");
    setPlantas([]);
    setPlantaSeleccionadaId("");
    setServiciosSeleccionados([]);
    setServiciosConEntregablesSeleccionados([]);
    setEntregablesSeleccionadosIds([]);
    setDropdownEmpresaAbierto(true);
  };

  // Cambio de Planta
  const handleCambiarPlanta = (plantaId: string) => {
    setPlantaSeleccionadaId(plantaId);
    setServiciosSeleccionados([]);
    setServiciosConEntregablesSeleccionados([]);
    setEntregablesSeleccionadosIds([]);
    if (plantaId) {
      ejecutarBusquedaServicios(searchServicioText, plantaId);
    }
  };

  // 2.4 Búsqueda con debounce de 300ms
  useEffect(() => {
    if (!vTipo || !plantaSeleccionadaId) return;

    const timer = setTimeout(() => {
      ejecutarBusquedaServicios(searchServicioText, plantaSeleccionadaId);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchServicioText, vTipo, plantaSeleccionadaId]);

  const ejecutarBusquedaServicios = async (busqueda: string, plantaId: string) => {
    if (!vTipo || !plantaId) return;

    setBuscandoServicios(true);
    const empId = empresaSeleccionada?.iD_Empresa;
    const plId = Number(plantaId) || undefined;

    try {
      if (vTipo === "entregable") {
        const res = await ArchivosService.getServiciosConEntregablesPendientes({
          v_Busqueda: busqueda.trim() || undefined,
          i_CveEmpresa: empId,
          i_CvePlanta: plId,
        });
        setResultadosEntregables(res || []);
      } else {
        const res = await ArchivosService.getServiciosPendientes({
          v_Tipo: vTipo,
          v_Busqueda: busqueda.trim() || undefined,
          i_CveEmpresa: empId,
          i_CvePlanta: plId,
        });
        setResultadosCotizacionOC(res || []);
      }
    } catch (err) {
      console.error("Error buscando servicios pendientes:", err);
    } finally {
      setBuscandoServicios(false);
    }
  };

  // Autocomplete empresas filtradas
  const empresasFiltradas = useMemo(() => {
    if (!searchEmpresaText.trim()) return empresasCatalogo;
    const term = searchEmpresaText.toLowerCase();
    return empresasCatalogo.filter(
      (e) =>
        (e.s_RazonSocial && e.s_RazonSocial.toLowerCase().includes(term)) ||
        (e.s_RFC && e.s_RFC.toLowerCase().includes(term))
    );
  }, [empresasCatalogo, searchEmpresaText]);

  // Resultados de búsqueda excluyendo ya agregados
  const resultadosCotizacionOCFiltrados = useMemo(() => {
    const idsAgregados = new Set(serviciosSeleccionados.map((s) => s.i_CveServAgendaDet));
    return resultadosCotizacionOC.filter((r) => !idsAgregados.has(r.i_CveServAgendaDet));
  }, [resultadosCotizacionOC, serviciosSeleccionados]);

  const resultadosEntregablesFiltrados = useMemo(() => {
    const idsAgregados = new Set(
      serviciosConEntregablesSeleccionados.map((s) => s.i_CveServAgendaDet)
    );
    return resultadosEntregables.filter((r) => !idsAgregados.has(r.i_CveServAgendaDet));
  }, [resultadosEntregables, serviciosConEntregablesSeleccionados]);

  // Agregar servicio Cotización / OC
  const handleAgregarServicioCotizacionOC = (item: ServiciosPendientesArchivoDto) => {
    setServiciosSeleccionados((prev) => [...prev, item]);
    setSearchServicioText("");
    setDropdownServiciosAbierto(false);
  };

  const handleQuitarServicioCotizacionOC = (iCveServAgendaDet: number) => {
    setServiciosSeleccionados((prev) =>
      prev.filter((s) => s.i_CveServAgendaDet !== iCveServAgendaDet)
    );
  };

  // Agregar servicio Entregables
  const handleAgregarServicioEntregable = (item: ServicioConEntregablesDto) => {
    setServiciosConEntregablesSeleccionados((prev) => [...prev, item]);
    // Auto-marcar entregables pendientes por defecto
    const pendientesIds = item.entregables
      .filter((e) => !e.b_Entregado)
      .map((e) => e.i_CveAgendaEntregables);

    setEntregablesSeleccionadosIds((prev) => Array.from(new Set([...prev, ...pendientesIds])));
    setSearchServicioText("");
    setDropdownServiciosAbierto(false);
  };

  const handleQuitarServicioEntregable = (iCveServAgendaDet: number) => {
    const servObj = serviciosConEntregablesSeleccionados.find(
      (s) => s.i_CveServAgendaDet === iCveServAgendaDet
    );
    const idsARemover = new Set(servObj?.entregables.map((e) => e.i_CveAgendaEntregables) || []);

    setServiciosConEntregablesSeleccionados((prev) =>
      prev.filter((s) => s.i_CveServAgendaDet !== iCveServAgendaDet)
    );
    setEntregablesSeleccionadosIds((prev) => prev.filter((id) => !idsARemover.has(id)));
  };

  // Toggle entregable individual
  const handleToggleEntregableId = (iCveAgendaEntregables: number) => {
    setEntregablesSeleccionadosIds((prev) =>
      prev.includes(iCveAgendaEntregables)
        ? prev.filter((id) => id !== iCveAgendaEntregables)
        : [...prev, iCveAgendaEntregables]
    );
  };

  // Checkbox seleccionar todos los entregables pendientes
  const todosLosEntregablesPendientesIds = useMemo(() => {
    const ids: number[] = [];
    serviciosConEntregablesSeleccionados.forEach((s) => {
      s.entregables.forEach((e) => {
        if (!e.b_Entregado) ids.push(e.i_CveAgendaEntregables);
      });
    });
    return ids;
  }, [serviciosConEntregablesSeleccionados]);

  const todosSeleccionados =
    todosLosEntregablesPendientesIds.length > 0 &&
    todosLosEntregablesPendientesIds.every((id) => entregablesSeleccionadosIds.includes(id));

  const handleToggleSeleccionarTodosEntregables = () => {
    if (todosSeleccionados) {
      setEntregablesSeleccionadosIds([]);
    } else {
      setEntregablesSeleccionadosIds(todosLosEntregablesPendientesIds);
    }
  };

  // Seleccionar archivo (límite 10MB)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    // Límite de tamaño 10MB
    const maxBytes = 10 * 1024 * 1024;
    if (selected.size > maxBytes) {
      toast.error("El archivo excede el tamaño máximo permitido de 10MB");
      if (fileInputRef.current) fileInputRef.current.value = "";
      setArchivo(null);
      return;
    }

    setArchivo(selected);
  };

  // Validaciones
  const haySeleccion =
    vTipo === "entregable"
      ? entregablesSeleccionadosIds.length > 0
      : serviciosSeleccionados.length > 0;

  const formularioValido = Boolean(
    vTipo &&
      plantaSeleccionadaId &&
      haySeleccion &&
      archivo &&
      (vTipo !== "entregable" || fechaEntrega)
  );

  // Submit guardar
  const handleGuardar = async () => {
    if (!vTipo) {
      toast.error("Selecciona el tipo de documento");
      return;
    }
    if (!plantaSeleccionadaId) {
      toast.error("Selecciona una planta");
      return;
    }
    if (!haySeleccion) {
      toast.error("Debes seleccionar al menos un servicio o entregable");
      return;
    }
    if (!archivo) {
      toast.error("Debes seleccionar un archivo");
      return;
    }
    if (vTipo === "entregable" && !fechaEntrega) {
      toast.error("Ingresa la fecha de entrega");
      return;
    }

    try {
      setSubiendo(true);

      const requestDto: SubirArchivoRequestDto = {
        v_Tipo: vTipo as any,
      };

      if (vTipo === "entregable") {
        requestDto.EntregablesSeleccionados = entregablesSeleccionadosIds;
        requestDto.d_FechaEntrega = fechaEntrega;
      } else {
        requestDto.ServiciosSeleccionados = serviciosSeleccionados.map(
          (s) => s.i_CveServAgendaDet
        );
        requestDto.v_Referencia = vReferenciaGlobal.trim() || undefined;
      }

      const exito = await ArchivosService.subirArchivo(archivo, requestDto);

      if (exito) {
        toast.success("Archivo subido correctamente");
        if (onGuardadoExitoso) onGuardadoExitoso();
        onCerrar();
      } else {
        toast.error("Error al subir el archivo. Intenta de nuevo.");
      }
    } catch (err) {
      console.error("Error al subir archivo:", err);
      toast.error("Ocurrió un error al procesar el archivo");
    } finally {
      setSubiendo(false);
    }
  };

  if (!abierto) return null;

  const plantaSeleccionadaObj = plantas.find(
    (p) => String(p.i_CvePlanta) === plantaSeleccionadaId
  );
  const nombrePlantaSeleccionada = plantaSeleccionadaObj?.v_NombrePlanta || "";

  return (
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
          maxWidth: "960px",
          maxHeight: "92vh",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
          overflow: "hidden",
          border: "1px solid #e2e8f0",
        }}
      >
        {/* HEADER MODAL */}
        <div
          style={{
            padding: "16px 24px",
            borderBottom: "1px solid #ddeaf5",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            backgroundColor: "#f8fafc",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "10px",
                backgroundColor: "#e0f2fe",
                color: "#0284c7",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Upload size={20} />
            </div>
            <div>
              <h2
                style={{
                  margin: 0,
                  fontSize: "18px",
                  fontWeight: 700,
                  color: "#0f172a",
                  lineHeight: "1.2",
                }}
              >
                Subir archivos
              </h2>
              <span style={{ fontSize: "12px", color: "#64748b" }}>
                Carga de cotizaciones, órdenes de compra y cartas de entrega
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onCerrar}
            disabled={subiendo}
            style={{
              background: "none",
              border: "none",
              color: subiendo ? "#cbd5e1" : "#64748b",
              cursor: subiendo ? "not-allowed" : "pointer",
              padding: "6px",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* CUERPO DEL MODAL */}
        <div
          className="custom-scrollbar"
          style={{
            padding: "24px",
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            gap: "20px",
            backgroundColor: "#ffffff",
          }}
        >
          {/* 2.1 TIPO DE DOCUMENTO (SIEMPRE VISIBLE) */}
          <div>
            <label
              style={{
                fontSize: "12px",
                fontWeight: 700,
                color: "#1e3a5f",
                display: "block",
                marginBottom: "6px",
              }}
            >
              Tipo de documento <span style={{ color: "#dc3545" }}>*</span>
            </label>
            <select
              className="form-select"
              value={vTipo}
              onChange={(e) => {
                const nuevoTipo = e.target.value;
                setVTipo(nuevoTipo);
                setServiciosSeleccionados([]);
                setServiciosConEntregablesSeleccionados([]);
                setEntregablesSeleccionadosIds([]);
                setSearchServicioText("");
                if (plantaSeleccionadaId && nuevoTipo) {
                  ejecutarBusquedaServicios(searchServicioText, plantaSeleccionadaId);
                }
              }}
              style={{
                height: "38px",
                borderRadius: "8px",
                border: "1px solid #cbd5e1",
                fontSize: "13px",
                fontWeight: 600,
                color: vTipo ? "#0f172a" : "#64748b",
                backgroundColor: "#ffffff",
                width: "100%",
              }}
            >
              <option value="">-- Selecciona tipo de documento --</option>
              <option value="cotizacion_cliente">Cotización cliente</option>
              <option value="oc_cliente">Orden de compra cliente</option>
              <option value="entregable">Carta de entrega</option>
            </select>
          </div>

          {/* EL RESTO DEL MODAL SE MUESTRA SOLO SI HAY TIPO SELECCIONADO */}
          {vTipo !== "" && (
            <>
              {/* 2.2 FILTRO EMPRESA Y 2.3 FILTRO PLANTA (EN 2 COLUMNAS) */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                  gap: "16px",
                }}
              >
                {/* Autocomplete Empresa */}
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
                          setServiciosSeleccionados([]);
                          setServiciosConEntregablesSeleccionados([]);
                        }
                      }}
                      style={{
                        borderRadius: "8px",
                        height: "36px",
                        paddingRight: searchEmpresaText ? "60px" : "30px",
                        fontSize: "13px",
                        borderColor: empresaSeleccionada ? "#10b981" : "#d0dce8",
                        backgroundColor: empresaSeleccionada ? "#f0fdf4" : "#ffffff",
                        fontWeight: empresaSeleccionada ? 600 : 400,
                        color: "#1e3a5f",
                      }}
                    />

                    {searchEmpresaText && (
                      <button
                        type="button"
                        onClick={handleLimpiarEmpresa}
                        style={{
                          position: "absolute",
                          right: "28px",
                          top: "50%",
                          transform: "translateY(-50%)",
                          background: "none",
                          border: "none",
                          color: "#94a3b8",
                          cursor: "pointer",
                          padding: "2px",
                        }}
                      >
                        <X size={15} />
                      </button>
                    )}

                    <Search
                      size={15}
                      style={{
                        position: "absolute",
                        right: "10px",
                        top: "50%",
                        transform: "translateY(-50%)",
                        color: empresaSeleccionada ? "#10b981" : "#7a96b0",
                        pointerEvents: "none",
                      }}
                    />
                  </div>

                  {/* Dropdown Autocomplete Empresas */}
                  {dropdownEmpresaAbierto && (
                    <div
                      style={{
                        position: "absolute",
                        top: "100%",
                        left: 0,
                        right: 0,
                        backgroundColor: "#ffffff",
                        border: "1px solid #d0dce8",
                        borderRadius: "8px",
                        boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
                        maxHeight: "200px",
                        overflowY: "auto",
                        zIndex: 100,
                        marginTop: "4px",
                      }}
                    >
                      {empresasFiltradas.length === 0 ? (
                        <div style={{ padding: "10px", fontSize: "12px", color: "#94a3b8", textAlign: "center" }}>
                          Sin resultados
                        </div>
                      ) : (
                        empresasFiltradas.map((emp) => (
                          <div
                            key={emp.iD_Empresa}
                            onClick={() => handleSeleccionarEmpresa(emp)}
                            style={{
                              padding: "8px 12px",
                              fontSize: "12px",
                              cursor: "pointer",
                              borderBottom: "1px solid #f1f5f9",
                              color: "#1e3a5f",
                              transition: "background-color 0.15s",
                            }}
                            onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "#eaf4fb")}
                            onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "#ffffff")}
                          >
                            <strong>{emp.s_RazonSocial}</strong>
                            {emp.s_RFC && (
                              <span style={{ fontSize: "11px", color: "#64748b", marginLeft: "6px" }}>
                                ({emp.s_RFC})
                              </span>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>

                {/* Select Planta */}
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
                    disabled={!empresaSeleccionada || plantas.length === 0}
                    value={plantaSeleccionadaId}
                    onChange={(e) => handleCambiarPlanta(e.target.value)}
                    style={{
                      borderRadius: "8px",
                      height: "36px",
                      fontSize: "13px",
                      borderColor: plantaSeleccionadaId ? "#10b981" : "#d0dce8",
                      backgroundColor: !empresaSeleccionada ? "#f1f5f9" : "#ffffff",
                    }}
                  >
                    <option value="">
                      {!empresaSeleccionada
                        ? "Selecciona una empresa primero"
                        : plantas.length === 0
                        ? "Sin plantas registradas"
                        : "-- Selecciona planta --"}
                    </option>
                    {plantas.map((p) => (
                      <option key={p.i_CvePlanta} value={p.i_CvePlanta}>
                        {p.v_NombrePlanta}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 2.4 BUSCADOR DE SERVICIO / ENTREGABLE */}
              <div style={{ position: "relative" }} ref={containerServicioRef}>
                <label
                  style={{
                    fontSize: "12px",
                    fontWeight: 700,
                    color: "#4a6580",
                    display: "block",
                    marginBottom: "4px",
                  }}
                >
                  {vTipo === "cotizacion_cliente"
                    ? "Buscar por servicio o número de cotización"
                    : vTipo === "oc_cliente"
                    ? "Buscar por servicio u orden de compra"
                    : "Buscar por servicio"}
                </label>

                <div style={{ position: "relative" }}>
                  <input
                    type="text"
                    className="form-control"
                    disabled={!plantaSeleccionadaId}
                    placeholder={
                      !plantaSeleccionadaId
                        ? "Selecciona una planta primero"
                        : "Escribe para buscar y presiona en un resultado..."
                    }
                    value={searchServicioText}
                    onFocus={() => {
                      if (plantaSeleccionadaId) setDropdownServiciosAbierto(true);
                    }}
                    onChange={(e) => {
                      setSearchServicioText(e.target.value);
                      if (plantaSeleccionadaId) setDropdownServiciosAbierto(true);
                    }}
                    style={{
                      borderRadius: "8px",
                      height: "36px",
                      paddingRight: "30px",
                      fontSize: "13px",
                      backgroundColor: !plantaSeleccionadaId ? "#f1f5f9" : "#ffffff",
                    }}
                  />
                  <Search
                    size={15}
                    style={{
                      position: "absolute",
                      right: "10px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      color: "#7a96b0",
                      pointerEvents: "none",
                    }}
                  />
                </div>

                {/* Dropdown flotante de resultados de búsqueda */}
                {dropdownServiciosAbierto && plantaSeleccionadaId && (
                  <div
                    style={{
                      position: "absolute",
                      top: "100%",
                      left: 0,
                      right: 0,
                      backgroundColor: "#ffffff",
                      border: "1px solid #d0dce8",
                      borderRadius: "8px",
                      boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
                      maxHeight: "230px",
                      overflowY: "auto",
                      zIndex: 100,
                      marginTop: "4px",
                    }}
                  >
                    {buscandoServicios ? (
                      <div
                        style={{
                          padding: "14px",
                          fontSize: "12px",
                          color: "#2B8FCC",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "8px",
                        }}
                      >
                        <Loader2 className="animate-spin" size={16} />
                        <span>Buscando...</span>
                      </div>
                    ) : vTipo === "entregable" ? (
                      resultadosEntregablesFiltrados.length === 0 ? (
                        <div style={{ padding: "12px", fontSize: "12px", color: "#94a3b8", textAlign: "center" }}>
                          No hay servicios con entregables pendientes
                        </div>
                      ) : (
                        resultadosEntregablesFiltrados.map((item) => (
                          <div
                            key={item.i_CveServAgendaDet}
                            onClick={() => handleAgregarServicioEntregable(item)}
                            style={{
                              padding: "10px 14px",
                              fontSize: "12px",
                              cursor: "pointer",
                              borderBottom: "1px solid #f1f5f9",
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                            }}
                            onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "#eaf4fb")}
                            onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "#ffffff")}
                          >
                            <div>
                              <strong style={{ color: "#0f172a" }}>{item.v_Servicio}</strong>
                              <span style={{ color: "#0284c7", marginLeft: "6px", fontWeight: 600 }}>
                                ({item.v_TipoServicio})
                              </span>
                              <div style={{ fontSize: "11px", color: "#64748b", marginTop: "2px" }}>
                                Fecha de inicio: {formatearFechaTexto(item.d_FechaInicio)} · Cotización:{" "}
                                {item.v_NoCotizacionGI || "Pendiente"}
                              </div>
                            </div>

                            <span
                              style={{
                                backgroundColor: "#e0f2fe",
                                color: "#0369a1",
                                padding: "2px 8px",
                                borderRadius: "12px",
                                fontSize: "11px",
                                fontWeight: 600,
                              }}
                            >
                              {item.entregables.filter((e) => !e.b_Entregado).length} pendientes
                            </span>
                          </div>
                        ))
                      )
                    ) : resultadosCotizacionOCFiltrados.length === 0 ? (
                      <div style={{ padding: "12px", fontSize: "12px", color: "#94a3b8", textAlign: "center" }}>
                        No se encontraron servicios pendientes
                      </div>
                    ) : (
                      resultadosCotizacionOCFiltrados.map((item) => (
                        <div
                          key={item.i_CveServAgendaDet}
                          onClick={() => handleAgregarServicioCotizacionOC(item)}
                          style={{
                            padding: "10px 14px",
                            fontSize: "12px",
                            cursor: "pointer",
                            borderBottom: "1px solid #f1f5f9",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}
                          onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "#eaf4fb")}
                          onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "#ffffff")}
                        >
                          <div>
                            <strong style={{ color: "#0f172a" }}>{item.v_Servicio}</strong>
                            <span style={{ color: "#0284c7", marginLeft: "6px", fontWeight: 600 }}>
                              ({item.v_TipoServicio})
                            </span>
                            <div style={{ fontSize: "11px", color: "#64748b", marginTop: "2px" }}>
                              Fecha de inicio: {formatearFechaTexto(item.d_FechaInicio)}
                            </div>
                          </div>

                          <div style={{ textAlign: "right", fontSize: "11px" }}>
                            {vTipo === "cotizacion_cliente" && (
                              <span style={{ color: item.v_NoCotizacionGI ? "#166534" : "#dc3545", fontWeight: 600 }}>
                                Cot: {item.v_NoCotizacionGI || "Pendiente"}
                              </span>
                            )}
                            {vTipo === "oc_cliente" && (
                              <span style={{ color: item.v_NoOrdenCompraCliente ? "#166534" : "#dc3545", fontWeight: 600 }}>
                                OC: {item.v_NoOrdenCompraCliente || "Pendiente"}
                              </span>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>

              {/* 2.5 TABLA DE SELECCIONADOS — VARIANTE COTIZACIÓN / OC */}
              {vTipo !== "entregable" && (
                <div>
                  <div
                    style={{
                      fontSize: "12px",
                      fontWeight: 700,
                      color: "#475569",
                      marginBottom: "8px",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <span>
                      Seleccionados ({serviciosSeleccionados.length})
                      {nombrePlantaSeleccionada && ` — Planta: ${nombrePlantaSeleccionada}`}
                    </span>
                  </div>

                  <div
                    style={{
                      border: "1px solid #d0dce8",
                      borderRadius: "10px",
                      overflow: "hidden",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                    }}
                  >
                    <div style={{ maxHeight: "240px", overflowY: "auto" }}>
                      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
                        <thead>
                          <tr
                            style={{
                              backgroundColor: "#f1f5f9",
                              borderBottom: "1px solid #cbd5e1",
                              color: "#64748b",
                              fontSize: "11px",
                              textTransform: "uppercase",
                              letterSpacing: "0.5px",
                            }}
                          >
                            <th style={{ padding: "10px 12px", textAlign: "left" }}>Servicio</th>
                            <th style={{ padding: "10px 12px", textAlign: "left" }}>Planta</th>
                            <th style={{ padding: "10px 12px", textAlign: "left" }}>Fecha inicio</th>
                            <th style={{ padding: "10px 12px", textAlign: "left" }}>No. cotización</th>
                            <th style={{ padding: "10px 12px", textAlign: "left" }}>Orden de compra</th>
                            <th style={{ padding: "10px 12px", textAlign: "center", width: "45px" }}></th>
                          </tr>
                        </thead>
                        <tbody>
                          {serviciosSeleccionados.length === 0 ? (
                            <tr>
                              <td colSpan={6} style={{ padding: "20px", textAlign: "center", color: "#94a3b8" }}>
                                Ningún servicio seleccionado
                              </td>
                            </tr>
                          ) : (
                            serviciosSeleccionados.map((item) => (
                              <tr key={item.i_CveServAgendaDet} style={{ borderBottom: "1px solid #f1f5f9" }}>
                                <td style={{ padding: "10px 12px", verticalAlign: "middle" }}>
                                  <strong style={{ color: "#0f172a" }}>{item.v_Servicio}</strong>
                                  <div style={{ fontSize: "11px", color: "#64748b" }}>{item.v_TipoServicio}</div>
                                </td>

                                <td style={{ padding: "10px 12px", verticalAlign: "middle", color: "#334155" }}>
                                  {item.v_Planta || nombrePlantaSeleccionada}
                                </td>

                                <td style={{ padding: "10px 12px", verticalAlign: "middle", color: "#334155" }}>
                                  {formatearFechaTexto(item.d_FechaInicio)}
                                </td>

                                <td
                                  style={{
                                    padding: "10px 12px",
                                    verticalAlign: "middle",
                                    fontWeight: 600,
                                    color: item.v_NoCotizacionGI ? "#0f172a" : "#dc3545",
                                  }}
                                >
                                  {item.v_NoCotizacionGI || "Pendiente"}
                                </td>

                                <td
                                  style={{
                                    padding: "10px 12px",
                                    verticalAlign: "middle",
                                    fontWeight: 600,
                                    color: item.v_NoOrdenCompraCliente ? "#0f172a" : "#dc3545",
                                  }}
                                >
                                  {item.v_NoOrdenCompraCliente || "Pendiente"}
                                </td>

                                <td style={{ padding: "10px 12px", textAlign: "center", verticalAlign: "middle" }}>
                                  <button
                                    type="button"
                                    onClick={() => handleQuitarServicioCotizacionOC(item.i_CveServAgendaDet)}
                                    style={{
                                      background: "none",
                                      border: "none",
                                      color: "#ef4444",
                                      cursor: "pointer",
                                      padding: "4px",
                                      borderRadius: "4px",
                                    }}
                                    title="Quitar de seleccionados"
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* CAMPO DE REFERENCIA GLOBAL ÚNICO */}
                  <div style={{ marginTop: "14px" }}>
                    <label
                      style={{
                        fontSize: "12px",
                        fontWeight: 700,
                        color: "#4a6580",
                        display: "block",
                        marginBottom: "4px",
                      }}
                    >
                      {vTipo === "cotizacion_cliente"
                        ? "No. cotización GI (opcional, se aplicará a todos los seleccionados)"
                        : "No. OC cliente (opcional, se aplicará a todos los seleccionados)"}
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder={
                        vTipo === "cotizacion_cliente"
                          ? "Ingresa No. cotización GI..."
                          : "Ingresa No. OC cliente..."
                      }
                      value={vReferenciaGlobal}
                      onChange={(e) => setVReferenciaGlobal(e.target.value)}
                      style={{
                        borderRadius: "8px",
                        height: "36px",
                        fontSize: "13px",
                      }}
                    />
                  </div>
                </div>
              )}

              {/* 2.6 TABLA DE SELECCIONADOS — VARIANTE ENTREGABLES */}
              {vTipo === "entregable" && (
                <div>
                  <div
                    style={{
                      fontSize: "12px",
                      fontWeight: 700,
                      color: "#475569",
                      marginBottom: "8px",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <span>
                      Servicios seleccionados ({serviciosConEntregablesSeleccionados.length})
                      {nombrePlantaSeleccionada && ` — Planta: ${nombrePlantaSeleccionada}`}
                    </span>

                    {todosLosEntregablesPendientesIds.length > 0 && (
                      <button
                        type="button"
                        onClick={handleToggleSeleccionarTodosEntregables}
                        style={{
                          background: "none",
                          border: "none",
                          color: "#2B8FCC",
                          fontSize: "12px",
                          fontWeight: 600,
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                        }}
                      >
                        {todosSeleccionados ? <CheckSquare size={16} /> : <Square size={16} />}
                        <span>Seleccionar todos los entregables</span>
                      </button>
                    )}
                  </div>

                  <div
                    style={{
                      border: "1px solid #d0dce8",
                      borderRadius: "10px",
                      overflow: "hidden",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                    }}
                  >
                    <div style={{ maxHeight: "280px", overflowY: "auto" }}>
                      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
                        <thead>
                          <tr
                            style={{
                              backgroundColor: "#f1f5f9",
                              borderBottom: "1px solid #cbd5e1",
                              color: "#64748b",
                              fontSize: "11px",
                              textTransform: "uppercase",
                              letterSpacing: "0.5px",
                            }}
                          >
                            <th style={{ padding: "10px 12px", textAlign: "left", width: "35%" }}>Servicio</th>
                            <th style={{ padding: "10px 12px", textAlign: "left", width: "55%" }}>Entregables</th>
                            <th style={{ padding: "10px 12px", textAlign: "center", width: "10%" }}></th>
                          </tr>
                        </thead>
                        <tbody>
                          {serviciosConEntregablesSeleccionados.length === 0 ? (
                            <tr>
                              <td colSpan={3} style={{ padding: "20px", textAlign: "center", color: "#94a3b8" }}>
                                Ningún servicio seleccionado
                              </td>
                            </tr>
                          ) : (
                            serviciosConEntregablesSeleccionados.map((item) => (
                              <tr key={item.i_CveServAgendaDet} style={{ borderBottom: "1px solid #f1f5f9" }}>
                                <td style={{ padding: "10px 12px", verticalAlign: "top" }}>
                                  <strong style={{ color: "#0f172a" }}>{item.v_Servicio}</strong>
                                  <div style={{ fontSize: "11px", color: "#64748b" }}>
                                    Fecha inicio: {formatearFechaTexto(item.d_FechaInicio)}
                                  </div>
                                  <div
                                    style={{
                                      fontSize: "11px",
                                      color: item.v_NoCotizacionGI ? "#166534" : "#dc3545",
                                      fontWeight: 600,
                                    }}
                                  >
                                    Cotización: {item.v_NoCotizacionGI || "Pendiente"}
                                  </div>
                                </td>

                                <td style={{ padding: "10px 12px", verticalAlign: "top" }}>
                                  <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                                    {item.entregables.map((ent) => {
                                      const marcado = entregablesSeleccionadosIds.includes(
                                        ent.i_CveAgendaEntregables
                                      );
                                      const yaEntregado = ent.b_Entregado;

                                      return (
                                        <label
                                          key={ent.i_CveAgendaEntregables}
                                          style={{
                                            display: "inline-flex",
                                            alignItems: "center",
                                            gap: "6px",
                                            padding: "4px 10px",
                                            borderRadius: "6px",
                                            border: yaEntregado
                                              ? "1px solid #cbd5e1"
                                              : marcado
                                              ? "1px solid #2B8FCC"
                                              : "1px solid #d0dce8",
                                            backgroundColor: yaEntregado
                                              ? "#f1f5f9"
                                              : marcado
                                              ? "#eaf4fb"
                                              : "#ffffff",
                                            color: yaEntregado
                                              ? "#94a3b8"
                                              : marcado
                                              ? "#0369a1"
                                              : "#334155",
                                            fontSize: "11px",
                                            fontWeight: marcado ? 600 : 400,
                                            cursor: yaEntregado ? "not-allowed" : "pointer",
                                            userSelect: "none",
                                          }}
                                        >
                                          <input
                                            type="checkbox"
                                            disabled={yaEntregado}
                                            checked={marcado || yaEntregado}
                                            onChange={() => handleToggleEntregableId(ent.i_CveAgendaEntregables)}
                                            style={{ accentColor: "#2B8FCC" }}
                                          />
                                          <span>{ent.v_Nombre}</span>
                                          {yaEntregado && (
                                            <span style={{ fontSize: "10px", color: "#166534", fontWeight: 700 }}>
                                              (Entregado)
                                            </span>
                                          )}
                                        </label>
                                      );
                                    })}
                                  </div>
                                </td>

                                <td style={{ padding: "10px 12px", textAlign: "center", verticalAlign: "top" }}>
                                  <button
                                    type="button"
                                    onClick={() => handleQuitarServicioEntregable(item.i_CveServAgendaDet)}
                                    style={{
                                      background: "none",
                                      border: "none",
                                      color: "#ef4444",
                                      cursor: "pointer",
                                      padding: "4px",
                                      borderRadius: "4px",
                                    }}
                                    title="Quitar servicio"
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* FECHA DE ENTREGA (OBLIGATORIA PARA ENTREGABLES) */}
                  <div style={{ marginTop: "14px" }}>
                    <label
                      style={{
                        fontSize: "12px",
                        fontWeight: 700,
                        color: "#4a6580",
                        display: "block",
                        marginBottom: "4px",
                      }}
                    >
                      Fecha de entrega <span style={{ color: "#dc3545" }}>*</span>
                    </label>
                    <input
                      type="date"
                      className="form-control"
                      value={fechaEntrega}
                      onChange={(e) => setFechaEntrega(e.target.value)}
                      style={{
                        borderRadius: "8px",
                        height: "36px",
                        fontSize: "13px",
                        maxWidth: "240px",
                      }}
                    />
                  </div>
                </div>
              )}

              {/* 2.7 SELECTOR DE ARCHIVO (OBLIGATORIO) */}
              <div>
                <label
                  style={{
                    fontSize: "12px",
                    fontWeight: 700,
                    color: "#4a6580",
                    display: "block",
                    marginBottom: "6px",
                  }}
                >
                  Archivo <span style={{ color: "#dc3545" }}>*</span> (Máximo 10MB)
                </label>

                <div
                  style={{
                    border: archivo ? "2px dashed #10b981" : "2px dashed #cbd5e1",
                    borderRadius: "12px",
                    padding: "18px 24px",
                    backgroundColor: archivo ? "#f0fdf4" : "#f8fafc",
                    textAlign: "center",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                  }}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    style={{ display: "none" }}
                    onChange={handleFileChange}
                  />

                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
                    <Paperclip size={24} style={{ color: archivo ? "#10b981" : "#64748b" }} />

                    {archivo ? (
                      <div>
                        <div style={{ fontSize: "13px", fontWeight: 700, color: "#0f172a" }}>
                          {archivo.name}
                        </div>
                        <div style={{ fontSize: "11px", color: "#64748b", marginTop: "2px" }}>
                          {formatearTamanoArchivo(archivo.size)} · Haz clic si deseas cambiarlo
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div style={{ fontSize: "13px", fontWeight: 600, color: "#334155" }}>
                          Haz clic para seleccionar o arrastra un archivo aquí
                        </div>
                        <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: "2px" }}>
                          Formatos aceptados: PDF, DOCX, XLSX, PNG, JPG (máx 10MB)
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* 2.8 FOOTER DEL MODAL */}
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
          <button
            type="button"
            onClick={onCerrar}
            disabled={subiendo}
            style={{
              height: "36px",
              padding: "0 20px",
              borderRadius: "20px",
              backgroundColor: subiendo ? "#e2e8f0" : "#f4f8fc",
              border: "1px solid #d0dce8",
              color: subiendo ? "#94a3b8" : "#4a6580",
              fontSize: "13px",
              fontWeight: 500,
              cursor: subiendo ? "not-allowed" : "pointer",
            }}
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={handleGuardar}
            disabled={!formularioValido || subiendo}
            style={{
              height: "36px",
              padding: "0 24px",
              borderRadius: "20px",
              backgroundColor: !formularioValido || subiendo ? "#b5cfe8" : "#2B8FCC",
              color: "#ffffff",
              border: "none",
              fontSize: "13px",
              fontWeight: 600,
              cursor: !formularioValido || subiendo ? "not-allowed" : "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              transition: "all 0.2s",
            }}
          >
            {subiendo ? (
              <>
                <Loader2 className="animate-spin" size={16} />
                <span>Subiendo...</span>
              </>
            ) : (
              <>
                <FileUp size={16} />
                <span>Guardar</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
