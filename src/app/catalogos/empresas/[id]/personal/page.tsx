"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import {
  ChevronRight,
  Search,
  Plus,
  FileSpreadsheet,
  Trash2,
  Users,
  Edit2,
  RefreshCw,
} from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { ModalConfirmarEliminar } from "@/components/ui/ModalConfirmarEliminar";
import { ModalNuevoAlumno } from "@/components/personal/ModalNuevoAlumno";
import { ModalCargaMasivaPersonal } from "@/components/personal/ModalCargaMasivaPersonal";
import { PaginadorCustom } from "@/components/ui/PaginadorCustom";
import { AlumnoCatalogo } from "@/types/alumnosCatalogo";
import { AlumnosCatalogoService } from "@/services/alumnosCatalogo.service";
import { EmpresasService } from "@/services/empresas.service";
import { useToast } from "@/context/ToastContext";

export default function CatalogosPersonalPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const idEmpresa = Number(params?.id) || 1;
  const razonSocialQuery = searchParams.get("razonSocial") || "";

  const [razonSocial, setRazonSocial] = useState<string>(razonSocialQuery);
  const [alumnos, setAlumnos] = useState<AlumnoCatalogo[]>([]);
  const [busqueda, setBusqueda] = useState<string>("");
  const [paginaActual, setPaginaActual] = useState<number>(1);
  const [tamanoPagina, setTamanoPagina] = useState<number>(10);
  const [totalRegistros, setTotalRegistros] = useState<number>(0);
  const [totalPaginas, setTotalPaginas] = useState<number>(1);
  const [cargando, setCargando] = useState<boolean>(true);

  // Modales
  const [modalNuevoAbierto, setModalNuevoAbierto] = useState<boolean>(false);
  const [alumnoEditar, setAlumnoEditar] = useState<AlumnoCatalogo | null>(null);
  const [modalCargaAbierto, setModalCargaAbierto] = useState<boolean>(false);
  const [alumnoEliminar, setAlumnoEliminar] = useState<AlumnoCatalogo | null>(null);
  const [eliminando, setEliminando] = useState<boolean>(false);

  // Cargar datos de la empresa
  useEffect(() => {
    if (!razonSocialQuery) {
      EmpresasService.getById(idEmpresa).then((emp) => {
        if (emp?.s_RazonSocial) {
          setRazonSocial(emp.s_RazonSocial);
        } else {
          setRazonSocial(`Empresa #${idEmpresa}`);
        }
      });
    } else {
      setRazonSocial(razonSocialQuery);
    }
  }, [idEmpresa, razonSocialQuery]);

  // Cargar lista de alumnos desde el servidor
  const cargarAlumnos = useCallback(async () => {
    setCargando(true);
    try {
      const res = await AlumnosCatalogoService.getAlumnosCatalogo(idEmpresa, {
        searchTerm: busqueda.trim() || undefined,
        pagina: paginaActual,
        tamano: tamanoPagina,
      });

      setAlumnos(res.datos || []);
      setTotalRegistros(res.total ?? 0);
      setTotalPaginas(res.totalPaginas > 0 ? res.totalPaginas : 1);
    } catch {
      toast.error("Ocurrió un error al cargar el catálogo de alumnos.");
      setAlumnos([]);
      setTotalRegistros(0);
      setTotalPaginas(1);
    } finally {
      setCargando(false);
    }
  }, [idEmpresa, busqueda, paginaActual, tamanoPagina, toast]);

  useEffect(() => {
    cargarAlumnos();
  }, [cargarAlumnos]);

  // Acciones
  const handleAbrirNuevo = () => {
    setAlumnoEditar(null);
    setModalNuevoAbierto(true);
  };

  const handleAbrirEditar = (alumno: AlumnoCatalogo) => {
    setAlumnoEditar(alumno);
    setModalNuevoAbierto(true);
  };

  const handleConfirmarEliminar = async () => {
    if (!alumnoEliminar) return;
    setEliminando(true);

    try {
      const res = await AlumnosCatalogoService.deleteAlumnoCatalogo(alumnoEliminar.i_CveAlumno);
      if (res.exito) {
        toast.success(res.mensaje || "Alumno eliminado exitosamente");
        setAlumnoEliminar(null);

        // Si la página actual queda vacía y estamos en una página mayor a 1, retroceder
        if (alumnos.length === 1 && paginaActual > 1) {
          setPaginaActual((prev) => prev - 1);
        } else {
          cargarAlumnos();
        }
      } else {
        toast.error(res.error || "No se pudo eliminar el alumno.");
      }
    } catch {
      toast.error("Error inesperado al intentar eliminar el alumno.");
    } finally {
      setEliminando(false);
    }
  };

  return (
    <AppLayout>
      {/* Breadcrumb */}
      <div style={{ fontSize: "12px", color: "#7a96b0", display: "flex", alignItems: "center", gap: "6px", marginBottom: "14px" }}>
        <Link href="/programacion" style={{ color: "#7a96b0", textDecoration: "none" }} className="hover:text-slate-900 transition-colors">
          Catálogos
        </Link>
        <ChevronRight size={13} style={{ color: "#b5cfe8" }} />
        <Link href="/empresas" style={{ color: "#7a96b0", textDecoration: "none" }} className="hover:text-slate-900 transition-colors">
          Empresas
        </Link>
        <ChevronRight size={13} style={{ color: "#b5cfe8" }} />
        <span style={{ color: "#475569", fontWeight: 500 }}>{razonSocial || `Empresa #${idEmpresa}`}</span>
        <ChevronRight size={13} style={{ color: "#b5cfe8" }} />
        <span style={{ color: "#1e293b", fontWeight: 500 }}>Personal</span>
      </div>

      {/* Encabezado */}
      <div className="page-header mb-4">
        <div>
          <h1 className="page-title">
            Catálogo de personal
          </h1>
          <p className="subtext">
            Personal de {razonSocial || `Empresa #${idEmpresa}`} registrado para cursos y capacitaciones.
          </p>
        </div>

        <button
          className="btn btn-outline"
          onClick={cargarAlumnos}
          disabled={cargando}
          title="Recargar listado"
          style={{ height: "32px", fontSize: "13px", display: "inline-flex", alignItems: "center", gap: "6px" }}
        >
          <RefreshCw size={14} className={cargando ? "animate-spin" : ""} />
          <span>Recargar</span>
        </button>
      </div>

      {/* Barra superior (Barra de Filtros y Botones) */}
      <div className="card mb-4 p-4 filter-card">
        <div style={{ display: "flex", flexDirection: "row", alignItems: "flex-end", gap: "16px", flexWrap: "wrap" }}>
          <div style={{ display: "flex", flexDirection: "row", alignItems: "flex-end", gap: "8px", marginLeft: "auto" }}>
            {/* Buscador */}
            <div style={{ display: "flex", flexDirection: "column", gap: "4px", width: "240px", minWidth: "160px" }}>
              <label className="form-label" style={{ marginBottom: 0 }}>Buscar</label>
              <div style={{ position: "relative", width: "100%" }}>
                <Search size={14} style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8", pointerEvents: "none" }} />
                <input
                  type="text"
                  className="form-control text-xs py-1.5"
                  style={{ width: "100%", paddingLeft: "28px", borderRadius: "20px", height: "32px" }}
                  placeholder="Buscar alumno..."
                  value={busqueda}
                  onChange={(e) => {
                    setBusqueda(e.target.value);
                    setPaginaActual(1);
                  }}
                />
              </div>
            </div>

            {/* Botón Carga Masiva (Secundario) */}
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => setModalCargaAbierto(true)}
              style={{ height: "32px", fontSize: "13px", padding: "0 14px", display: "inline-flex", alignItems: "center", gap: "6px" }}
              title="Carga masiva de alumnos desde Excel"
            >
              <FileSpreadsheet size={16} />
              <span>Carga masiva</span>
            </button>

            {/* Botón Nuevo Alumno (Primario) */}
            <button
              type="button"
              className="btn btn-primary filter-action-btn"
              onClick={handleAbrirNuevo}
              title="Nuevo alumno"
              style={{ height: "32px", fontSize: "13px", display: "inline-flex", alignItems: "center", gap: "6px" }}
            >
              <Plus size={16} />
              <span className="filter-btn-text">Nuevo alumno</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tabla de Personal (Sin columna Planta) */}
      <div className="alegra-table-container border border-slate-200/80 shadow-sm rounded-xl overflow-hidden mb-4">
        <table className="alegra-table alegra-table-compact">
          <thead>
            <tr>
              <th style={{ width: "16%", padding: "8px 12px" }}>Nómina</th>
              <th style={{ width: "36%", padding: "8px 12px" }}>Nombre</th>
              <th style={{ width: "24%", padding: "8px 12px" }}>CURP</th>
              <th style={{ width: "24%", padding: "8px 12px" }}>Puesto</th>
              <th className="text-center" style={{ width: "90px", minWidth: "90px", padding: "8px 12px", whiteSpace: "nowrap" }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {cargando ? (
              <tr>
                <td colSpan={5} style={{ textAlign: "center", padding: "48px 16px" }}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "8px", color: "#64748b" }}>
                    <div className="spinner-border text-primary" style={{ width: "24px", height: "24px" }}></div>
                    <span style={{ fontSize: "13px" }}>Cargando catálogo de alumnos...</span>
                  </div>
                </td>
              </tr>
            ) : alumnos.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ textAlign: "center", padding: "48px 16px" }}>
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
                      <Users size={22} />
                    </div>
                    <p style={{ fontSize: "14px", fontWeight: 600, color: "#334155", margin: 0 }}>
                      No se encontraron alumnos
                    </p>
                    <p style={{ fontSize: "12px", color: "#64748b", margin: 0 }}>
                      Intenta ajustando el filtro de búsqueda o registra a un nuevo alumno.
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              alumnos.map((row) => (
                <tr key={row.i_CveAlumno} className="hover:bg-slate-50/60 transition-colors">
                  <td style={{ fontWeight: 500, color: "#334155", padding: "6px 12px", verticalAlign: "middle" }}>{row.v_Nomina}</td>
                  <td style={{ padding: "6px 12px", verticalAlign: "middle" }}>
                    <button
                      type="button"
                      onClick={() => handleAbrirEditar(row)}
                      style={{
                        background: "none",
                        border: "none",
                        padding: 0,
                        textAlign: "left",
                        cursor: "pointer",
                        color: "#2B8FCC",
                        fontWeight: 600,
                        display: "inline",
                        lineHeight: "1.25",
                      }}
                      className="uppercase text-sm hover:underline"
                      title="Editar datos del alumno"
                    >
                      {row.v_Nombre}
                    </button>
                  </td>
                  <td style={{ padding: "6px 12px", verticalAlign: "middle" }}>
                    <span className="font-mono text-xs text-secondary">{row.v_CURP}</span>
                  </td>
                  <td style={{ color: "#334155", padding: "6px 12px", verticalAlign: "middle" }}>{row.v_Puesto}</td>
                  <td className="text-center" style={{ width: "90px", minWidth: "90px", padding: "6px 12px", verticalAlign: "middle", whiteSpace: "nowrap" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", flexWrap: "nowrap" }}>
                      <button
                        type="button"
                        className="btn-icon"
                        onClick={() => handleAbrirEditar(row)}
                        title="Editar alumno"
                        style={{ color: "#2B8FCC", padding: "4px", width: "28px", height: "28px" }}
                      >
                        <Edit2 size={15} />
                      </button>
                      <button
                        type="button"
                        className="btn-icon danger"
                        onClick={() => setAlumnoEliminar(row)}
                        title="Eliminar alumno"
                        style={{ padding: "4px", width: "28px", height: "28px" }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Paginador custom al pie de la tabla */}
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
      </div>

      {/* Modal Nuevo / Editar Alumno */}
      <ModalNuevoAlumno
        abierto={modalNuevoAbierto}
        idEmpresa={idEmpresa}
        alumnoEditar={alumnoEditar}
        onCerrar={() => {
          setModalNuevoAbierto(false);
          setAlumnoEditar(null);
        }}
        onGuardadoExitoso={cargarAlumnos}
      />

      {/* Modal Carga Masiva */}
      <ModalCargaMasivaPersonal
        abierto={modalCargaAbierto}
        idEmpresa={idEmpresa}
        onCerrar={() => setModalCargaAbierto(false)}
        onGuardadoExitoso={cargarAlumnos}
      />

      {/* Modal Confirmar Eliminar */}
      <ModalConfirmarEliminar
        abierto={!!alumnoEliminar}
        nombreElemento={alumnoEliminar?.v_Nombre || "este alumno"}
        mensajePersonalizado={
          alumnoEliminar
            ? `¿Deseas eliminar a ${alumnoEliminar.v_Nombre}? Si lo haces, se removerá del catálogo de personal de esta empresa.`
            : undefined
        }
        onCerrar={() => setAlumnoEliminar(null)}
        onConfirmar={handleConfirmarEliminar}
        cargando={eliminando}
      />
    </AppLayout>
  );
}
