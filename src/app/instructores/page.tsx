"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { UserCheck, Plus, Search, Edit2, Trash2, RefreshCw, ChevronRight } from "lucide-react";
import { PersonalListaDto } from "@/types/instructores";
import { PersonalService } from "@/services/personal.service";
import { ArchivosService } from "@/services/archivos.service";
import { AppLayout } from "@/components/layout/AppLayout";
import { PaginadorCustom } from "@/components/ui/PaginadorCustom";
import { ModalConfirmarEliminar } from "@/components/ui/ModalConfirmarEliminar";
import { ModalCrearEditarPersonal } from "@/components/instructores/ModalCrearEditarPersonal";
import { useToast } from "@/context/ToastContext";
import { formatearFechaTexto } from "@/lib/date-utils";

function esEmailTenue(email: string | null | undefined): boolean {
  if (!email) return true;
  const e = email.trim();
  if (e === "" || e.toUpperCase() === "N/A" || e.toUpperCase() === "NA") return true;
  return false;
}

function formatearTelefono(tel: string | null | undefined): string {
  if (!tel) return "—";
  const clean = tel.replace(/\D/g, "");
  if (clean.length === 10) {
    return `${clean.substring(0, 3)}-${clean.substring(3, 6)}-${clean.substring(6, 10)}`;
  }
  return clean || "—";
}

function obtenerNombreCompleto(row: PersonalListaDto): string {
  const partes = [row.v_Nombre, row.v_ApellidoPat, row.v_ApellidoMat].filter(Boolean);
  return partes.join(" ") || "Sin nombre";
}

function obtenerIniciales(row: PersonalListaDto): string {
  const n = (row.v_Nombre || "").trim();
  const a = (row.v_ApellidoPat || "").trim();
  let inits = "";
  if (n) inits += n.charAt(0).toUpperCase();
  if (a) inits += a.charAt(0).toUpperCase();
  if (!inits && n) inits = n.substring(0, 2).toUpperCase();
  return inits || "P";
}

const AvatarPersonal: React.FC<{ keyFoto: string | null; iniciales: string; nombre: string }> = ({
  keyFoto,
  iniciales,
  nombre,
}) => {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    if (keyFoto && keyFoto.trim()) {
      ArchivosService.obtenerUrlTemporal(keyFoto.trim()).then((u) => {
        if (active && u) setUrl(u);
      });
    } else {
      setUrl(null);
    }
    return () => {
      active = false;
    };
  }, [keyFoto]);

  if (url) {
    return (
      <img
        src={url}
        alt={nombre}
        style={{
          width: "28px",
          height: "28px",
          borderRadius: "50%",
          objectFit: "cover",
          flexShrink: 0,
          border: "1px solid #cbd5e1",
        }}
      />
    );
  }

  return (
    <div
      style={{
        width: "28px",
        height: "28px",
        borderRadius: "50%",
        backgroundColor: "#e2e8f0",
        color: "#334155",
        fontSize: "11px",
        fontWeight: 700,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      {iniciales}
    </div>
  );
};

function obtenerPropDefensiva(obj: any, keys: string[]): string | null {
  if (!obj || typeof obj !== "object") return null;
  for (const key of keys) {
    if (obj[key] !== undefined && obj[key] !== null) {
      const val = String(obj[key]).trim();
      if (val.length > 0 && val.toUpperCase() !== "N/A" && val.toUpperCase() !== "NULL") {
        return val;
      }
    }
  }
  const objKeys = Object.keys(obj);
  for (const targetKey of keys) {
    const lowerTarget = targetKey.toLowerCase();
    const foundKey = objKeys.find((k) => k.toLowerCase() === lowerTarget);
    if (foundKey && obj[foundKey] !== undefined && obj[foundKey] !== null) {
      const val = String(obj[foundKey]).trim();
      if (val.length > 0 && val.toUpperCase() !== "N/A" && val.toUpperCase() !== "NULL") {
        return val;
      }
    }
  }
  return null;
}

export default function PersonalPage() {
  const { toast } = useToast();
  const [datos, setDatos] = useState<PersonalListaDto[]>([]);
  const [cargando, setCargando] = useState<boolean>(true);

  // Filtros y Paginación
  const [iVigencia, setIVigencia] = useState<number>(2); // 2 = todos, 1 = vigentes, 0 = vencidos / sin actualizar
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [localSearch, setLocalSearch] = useState<string>("");
  const [paginaActual, setPaginaActual] = useState<number>(1);
  const [tamanoPagina, setTamanoPagina] = useState<number>(10);
  const [totalRegistros, setTotalRegistros] = useState<number>(0);
  const [totalPaginas, setTotalPaginas] = useState<number>(1);

  // Modales
  const [modalFormAbierto, setModalFormAbierto] = useState<boolean>(false);
  const [instructorEditarId, setInstructorEditarId] = useState<number | null>(null);

  const [itemEliminar, setItemEliminar] = useState<PersonalListaDto | null>(null);
  const [eliminando, setEliminando] = useState<boolean>(false);

  const cargarPersonal = useCallback(async () => {
    setCargando(true);
    const res = await PersonalService.getPaginado({
      pagina: paginaActual,
      tamano: tamanoPagina,
      searchTerm,
      i_Vigencia: iVigencia,
    });

    setDatos(res.datos);
    setTotalRegistros(res.total);
    setTotalPaginas(res.totalPaginas);
    setCargando(false);
  }, [paginaActual, tamanoPagina, searchTerm, iVigencia]);

  useEffect(() => {
    cargarPersonal();
  }, [cargarPersonal]);

  const handleConfirmarEliminar = async () => {
    if (!itemEliminar) return;
    setEliminando(true);
    const res = await PersonalService.eliminar(itemEliminar.i_CveInstructor);
    setEliminando(false);
    setItemEliminar(null);

    if (res.exito) {
      toast.success("Personal eliminado exitosamente.");
      cargarPersonal();
    } else {
      toast.error(res.mensaje || "Ocurrió un error al intentar eliminar el personal.");
    }
  };

  return (
    <AppLayout>
      {/* Breadcrumb Minimalista */}
      <div style={{ fontSize: "12px", color: "#7a96b0", display: "flex", alignItems: "center", gap: "6px", marginBottom: "14px" }}>
        <Link href="/programacion" style={{ color: "#7a96b0", textDecoration: "none" }} className="hover:text-slate-900 transition-colors">
          Catálogos
        </Link>
        <ChevronRight size={13} style={{ color: "#b5cfe8" }} />
        <span style={{ color: "#1e293b", fontWeight: 500 }}>Personal</span>
      </div>

      {/* Encabezado de Sección */}
      <div className="page-header mb-5">
        <div>
          <h1 className="page-title flex items-center gap-2 text-xl font-bold text-slate-900">
            Personal
          </h1>
          <p className="subtext text-slate-500 text-xs mt-0.5">
            Administración de personal registrado en el sistema.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            className="btn btn-outline"
            onClick={cargarPersonal}
            disabled={cargando}
            title="Recargar personal"
          >
            <RefreshCw size={15} className={cargando ? "animate-spin" : ""} />
            Recargar
          </button>
        </div>
      </div>

      {/* Barra de Filtros (Select Vigencia + Buscador + Botón Nuevo) */}
      <div className="card mb-4 p-4 border border-slate-200/80 shadow-sm rounded-xl filter-card">
        <div style={{ display: "flex", flexDirection: "row", alignItems: "flex-end", gap: "16px", justifyContent: "flex-end", flexWrap: "wrap" }}>
          <div style={{ display: "flex", flexDirection: "row", alignItems: "flex-end", gap: "8px", flexWrap: "wrap" }}>
            {/* Select Vigencia */}
            <div style={{ display: "flex", flexDirection: "column", gap: "4px", width: "180px", minWidth: "140px" }}>
              <label className="form-label text-[11px] font-semibold text-slate-600" style={{ marginBottom: 0 }}>
                Vigencia
              </label>
              <select
                className="form-select text-xs py-1.5"
                style={{ height: "32px", borderRadius: "20px" }}
                value={iVigencia}
                onChange={(e) => {
                  setIVigencia(Number(e.target.value));
                  setPaginaActual(1);
                }}
              >
                <option value={2}>Todos</option>
                <option value={1}>Vigentes</option>
                <option value={0}>Vencidos / sin actualizar</option>
              </select>
            </div>

            {/* Buscador de texto */}
            <div style={{ display: "flex", flexDirection: "column", gap: "4px", width: "240px", minWidth: "160px" }}>
              <label className="form-label text-[11px] font-semibold text-slate-600" style={{ marginBottom: 0 }}>
                Buscar personal
              </label>
              <div style={{ position: "relative", width: "100%" }}>
                <Search size={14} style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8", pointerEvents: "none" }} />
                <input
                  type="text"
                  className="form-control text-xs py-1.5"
                  style={{ width: "100%", paddingLeft: "30px", borderRadius: "20px", height: "32px" }}
                  placeholder="Buscar personal (Enter)..."
                  value={localSearch}
                  onChange={(e) => setLocalSearch(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      setSearchTerm(localSearch);
                      setPaginaActual(1);
                    }
                  }}
                />
              </div>
            </div>

            {/* Botón Nuevo Personal */}
            <button
              type="button"
              className="btn btn-primary filter-action-btn"
              onClick={() => {
                setInstructorEditarId(null);
                setModalFormAbierto(true);
              }}
              title="Nuevo personal"
            >
              <Plus size={16} />
              <span className="filter-btn-text">Nuevo personal</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tabla Personal: Nombre (+Email) | Teléfono | Contacto emergencia | Datos médicos | Última act. | Acciones */}
      <div className="alegra-table-container border border-slate-200/80 shadow-sm rounded-xl overflow-hidden mb-4">
        <table className="alegra-table alegra-table-compact">
          <thead>
            <tr>
              <th style={{ width: "26%" }}>Nombre</th>
              <th style={{ width: "16%" }}>Teléfono</th>
              <th style={{ width: "18%" }}>Contacto emergencia</th>
              <th style={{ width: "18%" }}>Datos médicos</th>
              <th style={{ width: "14%" }}>Última act.</th>
              <th className="text-center" style={{ width: "80px", whiteSpace: "nowrap" }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {cargando ? (
              Array.from({ length: 4 }).map((_, idx) => (
                <tr key={`sk-inst-${idx}`}>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <div className="skeleton-circle" style={{ width: "28px", height: "28px" }}></div>
                      <div style={{ width: "70%" }}>
                        <div className="skeleton-box" style={{ width: "80%", height: "14px", marginBottom: "4px" }}></div>
                        <div className="skeleton-box sm" style={{ width: "50%" }}></div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="skeleton-box sm" style={{ width: "60%" }}></div>
                  </td>
                  <td>
                    <div className="skeleton-box sm" style={{ width: "70%" }}></div>
                  </td>
                  <td>
                    <div className="skeleton-box sm" style={{ width: "65%" }}></div>
                  </td>
                  <td>
                    <div className="skeleton-box sm" style={{ width: "55%" }}></div>
                  </td>
                  <td className="text-center" style={{ whiteSpace: "nowrap" }}>
                    <div className="flex items-center justify-center gap-1">
                      <div className="skeleton-circle"></div>
                      <div className="skeleton-circle"></div>
                    </div>
                  </td>
                </tr>
              ))
            ) : datos.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: "center", padding: "48px 16px" }}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "6px" }}>
                    <div
                      style={{
                        width: "44px",
                        height: "44px",
                        borderRadius: "50%",
                        backgroundColor: "#f1f5f9",
                        border: "1px solid #e2e8f0",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#94a3b8",
                        marginBottom: "4px",
                      }}
                    >
                      <UserCheck size={22} />
                    </div>
                    <p style={{ fontSize: "13px", fontWeight: 600, color: "#334155", margin: 0 }}>
                      No se encontró personal
                    </p>
                    <p style={{ fontSize: "12px", color: "#64748b", margin: 0 }}>
                      Registra nuevo personal usando el botón superior "Nuevo personal".
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              datos.map((row) => {
                const tenue = esEmailTenue(row.v_Email);
                const nombreCompleto = obtenerNombreCompleto(row);
                const inits = obtenerIniciales(row);

                // Extracción defensiva de propiedades para tolerar variaciones de casing/nombre del backend
                const telPersonal = obtenerPropDefensiva(row, ["v_TelPersonal", "v_TelCelular", "v_Celular", "telPersonal"]);
                const telTrabajo = obtenerPropDefensiva(row, ["v_TelTrabajo", "v_TelOficina", "v_TelefonoTrabajo", "telTrabajo"]);
                const nomCEmergencia = obtenerPropDefensiva(row, ["v_NombreCEmergencia", "v_NombreCemergencia", "v_NombreContactoEmergencia", "v_ContactoEmergencia", "v_NombreEmergencia", "nombreCEmergencia"]);
                const telCEmergencia = obtenerPropDefensiva(row, ["v_TelCEmergencia", "v_TelCemergencia", "v_TelEmergencia", "v_TelContactoEmergencia", "telCEmergencia"]);
                const sangre = obtenerPropDefensiva(row, ["v_Sangre", "v_TipoSangre", "v_GrupoSanguineo", "s_Sangre", "sangre"]);
                const alergias = obtenerPropDefensiva(row, ["v_Alergias", "v_Alergia", "s_Alergias", "v_Enfermedades", "alergias"]);

                return (
                  <tr key={row.i_CveInstructor} className="hover:bg-slate-50/60 transition-colors">
                    {/* Nombre + Email abajo */}
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <AvatarPersonal keyFoto={row.v_KeyFoto} iniciales={inits} nombre={nombreCompleto} />
                        <div>
                          <div style={{ fontWeight: 700, color: "#0f172a", fontSize: "12px", lineHeight: "1.25" }}>
                            {nombreCompleto}
                          </div>
                          <div
                            style={{
                              fontSize: "11px",
                              color: tenue ? "#a0aec0" : "#8898aa",
                              fontWeight: 400,
                              marginTop: "2px",
                              fontStyle: tenue ? "italic" : "normal",
                            }}
                          >
                            {row.v_Email && row.v_Email.trim() !== "" ? row.v_Email.trim() : "N/A"}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Teléfono (Personal y Trabajo) */}
                    <td>
                      <div className="text-slate-800 text-xs font-normal font-mono">
                        {formatearTelefono(telPersonal)}
                      </div>
                      {telTrabajo && (
                        <div className="text-[11px] text-slate-400 font-mono">
                          Trabajo: {formatearTelefono(telTrabajo)}
                        </div>
                      )}
                    </td>

                    {/* Contacto de Emergencia */}
                    <td>
                      {nomCEmergencia ? (
                        <div>
                          <div style={{ fontWeight: 700, color: "#0f172a", fontSize: "12px", lineHeight: "1.25" }}>
                            {nomCEmergencia}
                          </div>
                          {telCEmergencia && (
                            <div style={{ fontSize: "11px", color: "#8898aa", fontWeight: 400, marginTop: "2px" }}>
                              {formatearTelefono(telCEmergencia)}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span style={{ fontSize: "11px", color: "#a0aec0", fontStyle: "italic" }}>—</span>
                      )}
                    </td>

                    {/* Datos médicos (v_Sangre como badge + debajo v_Alergias truncado con title) */}
                    <td>
                      {sangre || alergias ? (
                        <div style={{ display: "flex", flexDirection: "column", gap: "2px", alignItems: "flex-start" }}>
                          {sangre && (
                            <span
                              className="badge"
                              style={{
                                backgroundColor: "#fef2f2",
                                color: "#991b1b",
                                border: "1px solid #fecaca",
                                fontSize: "11px",
                                padding: "1px 6px",
                                fontWeight: 600,
                              }}
                            >
                              {sangre}
                            </span>
                          )}
                          {alergias && (
                            <div
                              className="text-slate-700 text-xs font-normal truncate"
                              style={{ maxWidth: "160px" }}
                              title={alergias}
                            >
                              {alergias}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-400 text-xs italic font-normal">—</span>
                      )}
                    </td>

                    {/* Última act. (Fecha de última actualización) */}
                    <td>
                      <div className="text-slate-700 text-xs font-normal font-mono">
                        {formatearFechaTexto(row.d_FechaActualizacion) || "—"}
                      </div>
                    </td>

                    {/* Acciones */}
                    <td className="text-center" style={{ whiteSpace: "nowrap" }}>
                      <div className="flex items-center justify-center gap-1" style={{ flexWrap: "nowrap", whiteSpace: "nowrap" }}>
                        <button
                          type="button"
                          className="btn-icon text-slate-600 hover:text-slate-900"
                          onClick={() => {
                            setInstructorEditarId(row.i_CveInstructor);
                            setModalFormAbierto(true);
                          }}
                          title="Editar personal"
                        >
                          <Edit2 size={15} />
                        </button>

                        <button
                          type="button"
                          className="btn-icon danger"
                          onClick={() => setItemEliminar(row)}
                          title="Eliminar personal"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      <PaginadorCustom
        paginaActual={paginaActual}
        totalPaginas={totalPaginas}
        totalRegistros={totalRegistros}
        tamano={tamanoPagina}
        onCambioPagina={(pag) => setPaginaActual(pag)}
        onCambioTamano={(tam) => {
          setTamanoPagina(tam);
          setPaginaActual(1);
        }}
      />

      {/* Modal Crear / Editar Personal */}
      <ModalCrearEditarPersonal
        abierto={modalFormAbierto}
        instructorEditarId={instructorEditarId}
        onCerrar={() => {
          setModalFormAbierto(false);
          setInstructorEditarId(null);
        }}
        onGuardado={cargarPersonal}
      />

      {/* Modal Confirmar Eliminar Personal */}
      <ModalConfirmarEliminar
        abierto={!!itemEliminar}
        nombreElemento={itemEliminar ? obtenerNombreCompleto(itemEliminar) : "este personal"}
        onCerrar={() => setItemEliminar(null)}
        onConfirmar={handleConfirmarEliminar}
        cargando={eliminando}
      />
    </AppLayout>
  );
}
