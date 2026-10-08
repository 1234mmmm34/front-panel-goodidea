"use client";

import React, { useEffect, useState, useRef, useMemo } from "react";
import {
  X,
  Shield,
  Check,
  ChevronDown,
  ChevronRight,
  Folder,
  Layers,
  Calendar,
  DollarSign,
  Users,
  Settings,
  Briefcase,
  FileText,
  Clock,
  Sparkles,
  Search,
} from "lucide-react";
import {
  T_Perfiles,
  RutasPerfilesGetDto,
  RutasPerfilResponse,
  PerfilPayload,
} from "@/types/perfiles";
import { PerfilesService } from "@/services/perfiles.service";
import { useToast } from "@/context/ToastContext";
import { useMenu } from "@/context/MenuContext";

interface Props {
  abierto: boolean;
  perfilEditar: T_Perfiles | null;
  onCerrar: () => void;
  onGuardado: () => void;
}

// Checkbox con soporte nativo de estado indeterminado
const CheckboxIndeterminado: React.FC<{
  checked: boolean;
  indeterminate: boolean;
  onChange: () => void;
  disabled?: boolean;
  id?: string;
}> = ({ checked, indeterminate, onChange, disabled, id }) => {
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.indeterminate = indeterminate;
    }
  }, [indeterminate]);

  return (
    <input
      id={id}
      ref={ref}
      type="checkbox"
      checked={checked}
      disabled={disabled}
      onChange={onChange}
      className="form-checkbox"
      style={{
        width: "16px",
        height: "16px",
        borderRadius: "4px",
        cursor: disabled ? "not-allowed" : "pointer",
        accentColor: "#2B8FCC",
      }}
    />
  );
};

// Mapeo amigable de íconos según nombre o ruta de la funcionalidad
const obtenerIconoRuta = (nombre: string, iconStr: string | null) => {
  const n = (nombre || iconStr || "").toLowerCase();
  if (n.includes("calendar") || n.includes("agenda") || n.includes("inicio")) return <Calendar size={16} />;
  if (n.includes("finanz") || n.includes("gasto") || n.includes("factur") || n.includes("coin")) return <DollarSign size={16} />;
  if (n.includes("usuari") || n.includes("personal") || n.includes("instructor") || n.includes("alumno")) return <Users size={16} />;
  if (n.includes("config") || n.includes("perfil") || n.includes("setting")) return <Settings size={16} />;
  if (n.includes("empresa") || n.includes("cliente") || n.includes("centro")) return <Briefcase size={16} />;
  if (n.includes("report") || n.includes("document") || n.includes("entregable")) return <FileText size={16} />;
  if (n.includes("program") || n.includes("horari")) return <Clock size={16} />;
  return <Folder size={16} />;
};

export const ModalCrearEditarPerfil: React.FC<Props> = ({
  abierto,
  perfilEditar,
  onCerrar,
  onGuardado,
}) => {
  const { toast } = useToast();
  const { refrescarMenu } = useMenu();
  const esEdicion = !!perfilEditar && perfilEditar.i_CvePerfil > 0;

  // Estado del formulario
  const [v_NombrePerfil, setV_NombrePerfil] = useState<string>("");
  const [v_Descripcion, setV_Descripcion] = useState<string>("");

  // Estado de rutas y selección
  const [rutasData, setRutasData] = useState<RutasPerfilResponse>({
    rutasRaiz: [],
    rutasHijas: [],
  });
  const [cargandoRutas, setCargandoRutas] = useState<boolean>(false);
  const [guardando, setGuardando] = useState<boolean>(false);

  // Set de IDs de rutas hijas seleccionadas (i_CveFuncionalidad)
  const [hijasSeleccionadas, setHijasSeleccionadas] = useState<Set<number>>(new Set());

  // Estado de expansión de cada raíz en el acordeón (por defecto todas abiertas)
  const [raicesExpandidas, setRaicesExpandidas] = useState<Record<number, boolean>>({});

  // Filtro de búsqueda en permisos
  const [busquedaPermisos, setBusquedaPermisos] = useState<string>("");

  // Cargar datos al abrir el modal
  useEffect(() => {
    if (!abierto) {
      setV_NombrePerfil("");
      setV_Descripcion("");
      setHijasSeleccionadas(new Set());
      setRutasData({ rutasRaiz: [], rutasHijas: [] });
      setBusquedaPermisos("");
      return;
    }

    // Inicializar campos de perfil
    if (esEdicion && perfilEditar) {
      setV_NombrePerfil(perfilEditar.v_NombrePerfil || "");
      setV_Descripcion(perfilEditar.v_Descripcion || "");
    } else {
      setV_NombrePerfil("");
      setV_Descripcion("");
    }

    // Cargar rutas
    const cvePerfilCarga = esEdicion && perfilEditar ? perfilEditar.i_CvePerfil : 0;
    setCargandoRutas(true);

    PerfilesService.getRutasPerfil(cvePerfilCarga)
      .then((res) => {
        setRutasData(res);

        // Si es edición, marcar las hijas con i_Flag == 1
        const sel = new Set<number>();
        if (esEdicion) {
          (res.rutasHijas || []).forEach((h) => {
            if (h.i_Flag === 1) {
              sel.add(h.i_CveFuncionalidad);
            }
          });
        }
        setHijasSeleccionadas(sel);

        // Expandir todas las raíces por defecto
        const expMap: Record<number, boolean> = {};
        (res.rutasRaiz || []).forEach((r) => {
          expMap[r.i_CveFuncionalidad] = true;
        });
        setRaicesExpandidas(expMap);
      })
      .catch((err) => {
        console.error("Error al cargar rutas del perfil:", err);
        toast.error("No se pudieron cargar las funcionalidades del sistema.");
      })
      .finally(() => {
        setCargandoRutas(false);
      });
  }, [abierto, perfilEditar, esEdicion]);

  // Filtrar solo las raíces que tienen al menos una hija ("Raíces sin hijas: no se muestran")
  const raicesConHijas = useMemo(() => {
    const hijas = rutasData.rutasHijas || [];
    return (rutasData.rutasRaiz || []).filter((raiz) =>
      hijas.some((hija) => hija.i_SCveFuncionalidad === raiz.i_CveFuncionalidad)
    );
  }, [rutasData]);

  // Raíces y sus hijas filtradas por búsqueda de texto
  const raicesFiltradas = useMemo(() => {
    const query = busquedaPermisos.trim().toLowerCase();
    const hijas = rutasData.rutasHijas || [];

    if (!query) {
      return raicesConHijas.map((raiz) => ({
        raiz,
        hijas: hijas.filter((h) => h.i_SCveFuncionalidad === raiz.i_CveFuncionalidad),
      }));
    }

    return raicesConHijas
      .map((raiz) => {
        const hijasDeRaiz = hijas.filter((h) => h.i_SCveFuncionalidad === raiz.i_CveFuncionalidad);
        const hijasCoincidentes = hijasDeRaiz.filter(
          (h) =>
            h.v_NombreFuncionalidad.toLowerCase().includes(query) ||
            h.v_RutaFuncionalidad.toLowerCase().includes(query)
        );

        const coincideRaiz =
          raiz.v_NombreFuncionalidad.toLowerCase().includes(query) ||
          raiz.v_RutaFuncionalidad.toLowerCase().includes(query);

        return {
          raiz,
          hijas: coincideRaiz ? hijasDeRaiz : hijasCoincidentes,
        };
      })
      .filter((item) => item.hijas.length > 0);
  }, [raicesConHijas, rutasData.rutasHijas, busquedaPermisos]);

  // Alternar expansión de una raíz
  const toggleExpasionRaiz = (cveRaiz: number) => {
    setRaicesExpandidas((prev) => ({
      ...prev,
      [cveRaiz]: !prev[cveRaiz],
    }));
  };

  // Manejar clic en el checkbox de una raíz
  const handleToggleRaiz = (cveRaiz: number, hijasDeRaiz: RutasPerfilesGetDto[]) => {
    if (hijasDeRaiz.length === 0) return;

    const idsHijas = hijasDeRaiz.map((h) => h.i_CveFuncionalidad);
    const todasMarcadas = idsHijas.every((id) => hijasSeleccionadas.has(id));

    setHijasSeleccionadas((prev) => {
      const next = new Set(prev);
      if (todasMarcadas) {
        // Desmarcar todas sus hijas
        idsHijas.forEach((id) => next.delete(id));
      } else {
        // Marcar todas sus hijas
        idsHijas.forEach((id) => next.add(id));
      }
      return next;
    });
  };

  // Manejar clic en el checkbox de una hija
  const handleToggleHija = (cveHija: number) => {
    setHijasSeleccionadas((prev) => {
      const next = new Set(prev);
      if (next.has(cveHija)) {
        next.delete(cveHija);
      } else {
        next.add(cveHija);
      }
      return next;
    });
  };

  // Seleccionar todas o ninguna de todo el sistema
  const handleMarcarTodas = () => {
    const todas = new Set<number>();
    (rutasData.rutasHijas || []).forEach((h) => todas.add(h.i_CveFuncionalidad));
    setHijasSeleccionadas(todas);
  };

  const handleDesmarcarTodas = () => {
    setHijasSeleccionadas(new Set());
  };

  // Enviar formulario
  const handleGuardar = async (e: React.FormEvent) => {
    e.preventDefault();

    const nombreLimpio = v_NombrePerfil.trim();
    if (!nombreLimpio) {
      toast.error("El nombre del perfil es obligatorio.");
      return;
    }

    if (nombreLimpio.length > 50) {
      toast.error("El nombre del perfil no puede exceder 50 caracteres.");
      return;
    }

    if (v_Descripcion && v_Descripcion.trim().length > 100) {
      toast.error("La descripción no puede exceder 100 caracteres.");
      return;
    }

    setGuardando(true);

    try {
      // Construir arreglo de Rutas solo con las hijas seleccionadas
      const rutasPayload = Array.from(hijasSeleccionadas).map((cveFunc) => ({
        i_CveRPerfiles: 0,
        i_CveFuncionalidad: cveFunc,
        i_CvePerfil: 0,
      }));

      const payload: PerfilPayload = {
        Perfil: {
          i_CvePerfil: esEdicion && perfilEditar ? perfilEditar.i_CvePerfil : 0,
          v_NombrePerfil: nombreLimpio,
          v_Descripcion: v_Descripcion ? v_Descripcion.trim() : "",
        },
        Rutas: rutasPayload,
      };

      let res;
      if (esEdicion) {
        res = await PerfilesService.editarPerfil(payload);
      } else {
        res = await PerfilesService.crearPerfil(payload);
      }

      if (res.exito) {
        if (esEdicion) {
          toast.success("Cambios guardados!");
        } else {
          toast.success("Perfil registrado exitosamente!");
        }
        refrescarMenu(true);
        onGuardado();
        onCerrar();
      } else {
        toast.error(res.mensaje || "Ocurrió un error al procesar el perfil.");
      }
    } catch (err: any) {
      console.error("Error al guardar perfil:", err);
      toast.error(err?.message || "Ocurrió un error inesperado al guardar el perfil.");
    } finally {
      setGuardando(false);
    }
  };

  if (!abierto) return null;

  const totalHijas = rutasData.rutasHijas?.length || 0;
  const totalHijasSeleccionadas = hijasSeleccionadas.size;

  return (
    <div className="modal-overlay">
      <div
        className="modal-content wide"
        style={{
          maxWidth: "840px",
          width: "95%",
          maxHeight: "92vh",
          display: "flex",
          flexDirection: "column",
          borderRadius: "16px",
          overflow: "hidden",
        }}
      >
        {/* Header del Modal */}
        <div className="modal-header" style={{ padding: "16px 24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "10px",
                backgroundColor: esEdicion ? "rgba(30, 58, 95, 0.1)" : "rgba(43, 143, 204, 0.12)",
                color: esEdicion ? "#1e3a5f" : "#2B8FCC",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Shield size={20} />
            </div>
            <div>
              <h3 className="modal-title" style={{ fontSize: "16px", fontWeight: 700, margin: 0 }}>
                {esEdicion ? "Editar perfil" : "Nuevo perfil"}
              </h3>
              <p style={{ fontSize: "12px", color: "#64748b", margin: 0 }}>
                {esEdicion
                  ? "Modifica el nombre, descripción y accesos asignados a este perfil."
                  : "Define el nombre del nuevo perfil y configura los módulos accesibles."}
              </p>
            </div>
          </div>

          <button
            type="button"
            className="btn-close"
            onClick={onCerrar}
            disabled={guardando}
            title="Cerrar"
          >
            <X size={18} />
          </button>
        </div>

        {/* Formulario */}
        <form
          onSubmit={handleGuardar}
          style={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden" }}
        >
          <div
            className="modal-body"
            style={{
              padding: "20px 24px",
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
              gap: "20px",
            }}
          >
            {/* Sección 1: Datos del Perfil */}
            <div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  marginBottom: "12px",
                  paddingBottom: "8px",
                  borderBottom: "1px solid #f1f5f9",
                }}
              >
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                    color: "#475569",
                  }}
                >
                  1. Información básica
                </span>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                  gap: "16px",
                }}
              >
                {/* Nombre del perfil */}
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" htmlFor="v_NombrePerfil">
                    Nombre del perfil <span style={{ color: "#dc3545" }}>*</span>
                  </label>
                  <input
                    id="v_NombrePerfil"
                    type="text"
                    className="form-control"
                    placeholder="Ej. Operador, Supervisor, Contador..."
                    value={v_NombrePerfil}
                    maxLength={50}
                    onChange={(e) => setV_NombrePerfil(e.target.value)}
                    required
                    disabled={guardando}
                    autoFocus
                  />
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: "11px",
                      color: "#94a3b8",
                      marginTop: "4px",
                      padding: "0 4px",
                    }}
                  >
                    <span>Obligatorio</span>
                    <span>{v_NombrePerfil.length}/50</span>
                  </div>
                </div>

                {/* Descripción */}
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" htmlFor="v_Descripcion">
                    Descripción <span style={{ color: "#94a3b8", fontWeight: 400 }}>(Opcional)</span>
                  </label>
                  <input
                    id="v_Descripcion"
                    type="text"
                    className="form-control"
                    placeholder="Breve detalle sobre las responsabilidades..."
                    value={v_Descripcion}
                    maxLength={100}
                    onChange={(e) => setV_Descripcion(e.target.value)}
                    disabled={guardando}
                  />
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "flex-end",
                      fontSize: "11px",
                      color: "#94a3b8",
                      marginTop: "4px",
                      padding: "0 4px",
                    }}
                  >
                    <span>{v_Descripcion.length}/100</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Sección 2: Permisos y Módulos */}
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: "8px",
                  paddingBottom: "8px",
                  borderBottom: "1px solid #f1f5f9",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span
                    style={{
                      fontSize: "11px",
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                      color: "#475569",
                    }}
                  >
                    2. Permisos sobre módulos ({totalHijasSeleccionadas} de {totalHijas} seleccionados)
                  </span>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <button
                    type="button"
                    onClick={handleMarcarTodas}
                    disabled={cargandoRutas || guardando || totalHijas === 0}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#2B8FCC",
                      fontSize: "11px",
                      fontWeight: 600,
                      cursor: "pointer",
                      padding: "2px 6px",
                      borderRadius: "4px",
                    }}
                    className="hover:underline"
                  >
                    Seleccionar todos
                  </button>
                  <span style={{ color: "#cbd5e1" }}>|</span>
                  <button
                    type="button"
                    onClick={handleDesmarcarTodas}
                    disabled={cargandoRutas || guardando || totalHijas === 0}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#64748b",
                      fontSize: "11px",
                      fontWeight: 600,
                      cursor: "pointer",
                      padding: "2px 6px",
                      borderRadius: "4px",
                    }}
                    className="hover:underline"
                  >
                    Limpiar selección
                  </button>
                </div>
              </div>

              {/* Mensaje informativo sobre acceso total */}
              <div
                style={{
                  backgroundColor: "#f8fafc",
                  border: "1px solid #e2e8f0",
                  borderRadius: "10px",
                  padding: "10px 14px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "12px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <Sparkles size={16} style={{ color: "#2B8FCC", flexShrink: 0 }} />
                  <span style={{ fontSize: "12px", color: "#475569", lineHeight: 1.35 }}>
                    {totalHijasSeleccionadas === 0 ? (
                      <strong>
                        Sin permisos específicos seleccionados: el perfil tendrá acceso total al menú.
                      </strong>
                    ) : (
                      <span>
                        El perfil tendrá acceso restringido únicamente a las {totalHijasSeleccionadas}{" "}
                        vistas seleccionadas.
                      </span>
                    )}
                  </span>
                </div>

                {/* Buscador de rutas */}
                <div style={{ position: "relative", width: "200px", flexShrink: 0 }}>
                  <Search
                    size={13}
                    style={{
                      position: "absolute",
                      left: "10px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      color: "#94a3b8",
                    }}
                  />
                  <input
                    type="text"
                    placeholder="Filtrar permisos..."
                    value={busquedaPermisos}
                    onChange={(e) => setBusquedaPermisos(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "5px 10px 5px 28px",
                      borderRadius: "16px",
                      fontSize: "11px",
                      height: "28px",
                      border: "1px solid #cbd5e1",
                    }}
                  />
                </div>
              </div>

              {/* Árbol / Acordeón de Permisos */}
              <div
                style={{
                  border: "1px solid #e2e8f0",
                  borderRadius: "12px",
                  backgroundColor: "#ffffff",
                  overflow: "hidden",
                }}
              >
                {cargandoRutas ? (
                  <div style={{ padding: "30px", textAlign: "center" }}>
                    <div
                      className="skeleton-box"
                      style={{ width: "180px", height: "18px", marginBottom: "16px" }}
                    ></div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                      <div className="skeleton-box" style={{ height: "40px" }}></div>
                      <div className="skeleton-box" style={{ height: "40px" }}></div>
                      <div className="skeleton-box" style={{ height: "40px" }}></div>
                    </div>
                  </div>
                ) : raicesFiltradas.length === 0 ? (
                  <div style={{ padding: "32px 16px", textAlign: "center", color: "#64748b" }}>
                    <Folder size={28} style={{ margin: "0 auto 8px auto", color: "#cbd5e1" }} />
                    <p style={{ fontSize: "13px", fontWeight: 500, margin: 0 }}>
                      No se encontraron módulos disponibles
                    </p>
                    <p style={{ fontSize: "11px", color: "#94a3b8", margin: "4px 0 0 0" }}>
                      {busquedaPermisos
                        ? "Intenta con otro término de búsqueda."
                        : "No hay rutas hijas asignables en el sistema."}
                    </p>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    {raicesFiltradas.map(({ raiz, hijas }, idx) => {
                      const idsHijas = hijas.map((h) => h.i_CveFuncionalidad);
                      const hijasMarcadasCount = idsHijas.filter((id) =>
                        hijasSeleccionadas.has(id)
                      ).length;

                      const todasMarcadas =
                        idsHijas.length > 0 && hijasMarcadasCount === idsHijas.length;
                      const algunasMarcadas =
                        hijasMarcadasCount > 0 && hijasMarcadasCount < idsHijas.length;
                      const ningunaMarcada = hijasMarcadasCount === 0;

                      const expandido = raicesExpandidas[raiz.i_CveFuncionalidad] ?? true;

                      return (
                        <div
                          key={raiz.i_CveFuncionalidad}
                          style={{
                            borderBottom:
                              idx < raicesFiltradas.length - 1 ? "1px solid #f1f5f9" : "none",
                          }}
                        >
                          {/* Fila Encabezado Raíz */}
                          <div
                            style={{
                              padding: "10px 16px",
                              backgroundColor: expandido ? "#f8fafc" : "#ffffff",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              gap: "12px",
                              transition: "background-color 0.15s ease",
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "10px",
                                flex: 1,
                              }}
                            >
                              {/* Botón expandir/colapsar */}
                              <button
                                type="button"
                                onClick={() => toggleExpasionRaiz(raiz.i_CveFuncionalidad)}
                                style={{
                                  background: "none",
                                  border: "none",
                                  color: "#64748b",
                                  cursor: "pointer",
                                  padding: 0,
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                }}
                                title={expandido ? "Colapsar" : "Expandir"}
                              >
                                {expandido ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                              </button>

                              {/* Checkbox derivado de la raíz */}
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                }}
                                onClick={(e) => e.stopPropagation()}
                              >
                                <CheckboxIndeterminado
                                  id={`chk-raiz-${raiz.i_CveFuncionalidad}`}
                                  checked={todasMarcadas}
                                  indeterminate={algunasMarcadas}
                                  onChange={() => handleToggleRaiz(raiz.i_CveFuncionalidad, hijas)}
                                  disabled={guardando}
                                />
                              </div>

                              {/* Nombre de la raíz e ícono */}
                              <div
                                onClick={() => toggleExpasionRaiz(raiz.i_CveFuncionalidad)}
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "8px",
                                  cursor: "pointer",
                                  userSelect: "none",
                                  flex: 1,
                                }}
                              >
                                <span style={{ color: "#2B8FCC", display: "flex", alignItems: "center" }}>
                                  {obtenerIconoRuta(raiz.v_NombreFuncionalidad, raiz.v_Icon)}
                                </span>
                                <span
                                  style={{
                                    fontSize: "13px",
                                    fontWeight: 600,
                                    color: "#1e293b",
                                  }}
                                >
                                  {raiz.v_NombreFuncionalidad}
                                </span>
                              </div>
                            </div>

                            {/* Badge contador */}
                            <div
                              onClick={() => toggleExpasionRaiz(raiz.i_CveFuncionalidad)}
                              style={{ cursor: "pointer", userSelect: "none" }}
                            >
                              <span
                                style={{
                                  fontSize: "11px",
                                  fontWeight: 500,
                                  padding: "2px 8px",
                                  borderRadius: "12px",
                                  backgroundColor: todasMarcadas
                                    ? "#dcf5e8"
                                    : algunasMarcadas
                                    ? "#eef6fd"
                                    : "#f1f5f9",
                                  color: todasMarcadas
                                    ? "#1a7f4e"
                                    : algunasMarcadas
                                    ? "#2B8FCC"
                                    : "#64748b",
                                  border: `1px solid ${
                                    todasMarcadas
                                      ? "#a8e6c3"
                                      : algunasMarcadas
                                      ? "#b5cfe8"
                                      : "#e2e8f0"
                                  }`,
                                }}
                              >
                                {hijasMarcadasCount} / {idsHijas.length}
                              </span>
                            </div>
                          </div>

                          {/* Lista de Hijas (Expandible) */}
                          {expandido && (
                            <div
                              style={{
                                padding: "8px 16px 12px 48px",
                                backgroundColor: "#ffffff",
                                display: "grid",
                                gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
                                gap: "8px 16px",
                                borderTop: "1px solid #f8fafc",
                              }}
                            >
                              {hijas.map((hija) => {
                                const seleccionada = hijasSeleccionadas.has(
                                  hija.i_CveFuncionalidad
                                );

                                return (
                                  <label
                                    key={hija.i_CveFuncionalidad}
                                    htmlFor={`chk-hija-${hija.i_CveFuncionalidad}`}
                                    style={{
                                      display: "flex",
                                      alignItems: "center",
                                      gap: "8px",
                                      padding: "6px 8px",
                                      borderRadius: "6px",
                                      cursor: "pointer",
                                      backgroundColor: seleccionada ? "#f0f7fc" : "transparent",
                                      border: `1px solid ${
                                        seleccionada ? "#d0e4f5" : "transparent"
                                      }`,
                                      transition: "all 0.15s ease",
                                      userSelect: "none",
                                    }}
                                    className="hover:bg-slate-50"
                                  >
                                    <input
                                      id={`chk-hija-${hija.i_CveFuncionalidad}`}
                                      type="checkbox"
                                      checked={seleccionada}
                                      onChange={() =>
                                        handleToggleHija(hija.i_CveFuncionalidad)
                                      }
                                      disabled={guardando}
                                      style={{
                                        width: "15px",
                                        height: "15px",
                                        borderRadius: "3px",
                                        cursor: "pointer",
                                        accentColor: "#2B8FCC",
                                      }}
                                    />
                                    <div
                                      style={{
                                        display: "flex",
                                        flexDirection: "column",
                                        overflow: "hidden",
                                      }}
                                    >
                                      <span
                                        style={{
                                          fontSize: "12px",
                                          fontWeight: seleccionada ? 600 : 400,
                                          color: seleccionada ? "#1e293b" : "#475569",
                                          whiteSpace: "nowrap",
                                          overflow: "hidden",
                                          textOverflow: "ellipsis",
                                        }}
                                        title={hija.v_NombreFuncionalidad}
                                      >
                                        {hija.v_NombreFuncionalidad}
                                      </span>
                                      {hija.v_RutaFuncionalidad && (
                                        <span
                                          style={{
                                            fontSize: "10px",
                                            color: "#94a3b8",
                                            whiteSpace: "nowrap",
                                            overflow: "hidden",
                                            textOverflow: "ellipsis",
                                          }}
                                          title={hija.v_RutaFuncionalidad}
                                        >
                                          {hija.v_RutaFuncionalidad}
                                        </span>
                                      )}
                                    </div>
                                  </label>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer del Modal */}
          <div className="modal-footer" style={{ padding: "14px 24px" }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onCerrar}
              disabled={guardando}
            >
              Cancelar
            </button>

            <button
              type="submit"
              className="btn"
              style={{
                backgroundColor: esEdicion ? "#1e3a5f" : "#2B8FCC",
                color: "#ffffff",
                border: "none",
                fontWeight: 600,
              }}
              disabled={guardando || cargandoRutas}
            >
              {guardando ? (
                <span>Guardando...</span>
              ) : esEdicion ? (
                <span>Guardar cambios</span>
              ) : (
                <span>Guardar perfil</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
