"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { ChevronRight, Search, Plus, FileSpreadsheet, Trash2, Users } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { ModalConfirmarEliminar } from "@/components/ui/ModalConfirmarEliminar";
import { ModalNuevoAlumno } from "@/components/personal/ModalNuevoAlumno";
import { ModalCargaMasivaPersonal } from "@/components/personal/ModalCargaMasivaPersonal";
import { PaginadorCustom } from "@/components/ui/PaginadorCustom";
import { AlumnoPersonal, personalMock } from "@/mocks/personalMock";
import { EmpresasService } from "@/services/empresas.service";
import { useToast } from "@/context/ToastContext";

function quitarAcentos(str: string): string {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

export default function CatalogosPersonalPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const idEmpresa = Number(params?.id) || 1;
  const razonSocialQuery = searchParams.get("razonSocial") || "";

  const [razonSocial, setRazonSocial] = useState<string>(razonSocialQuery);
  const [alumnos, setAlumnos] = useState<AlumnoPersonal[]>([]);
  const [busqueda, setBusqueda] = useState<string>("");
  const [paginaActual, setPaginaActual] = useState<number>(1);
  const [tamanoPagina, setTamanoPagina] = useState<number>(10);

  // Modales
  const [modalNuevoAbierto, setModalNuevoAbierto] = useState<boolean>(false);
  const [modalCargaAbierto, setModalCargaAbierto] = useState<boolean>(false);
  const [alumnoEliminar, setAlumnoEliminar] = useState<AlumnoPersonal | null>(null);

  // Cargar datos de la empresa y mock inicial
  useEffect(() => {
    // Si no venía la razón social por query param, obtenerla del backend/service
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

    // Cargar alumnos mock asignados a esta empresa
    const iniciales: AlumnoPersonal[] = personalMock.map((item) => ({
      ...item,
      i_CveEmpresa: idEmpresa,
    }));
    setAlumnos(iniciales);
  }, [idEmpresa, razonSocialQuery]);

  // Filtrar alumnos en vivo (del lado del cliente)
  const alumnosFiltrados = useMemo(() => {
    if (!busqueda.trim()) return alumnos;
    const term = quitarAcentos(busqueda.trim());

    return alumnos.filter((item) => {
      const nom = quitarAcentos(item.v_Nomina || "");
      const nomb = quitarAcentos(item.v_Nombre || "");
      const curp = quitarAcentos(item.v_CURP || "");
      const pues = quitarAcentos(item.v_Puesto || "");
      const plan = quitarAcentos(item.v_Planta || "");

      return (
        nom.includes(term) ||
        nomb.includes(term) ||
        curp.includes(term) ||
        pues.includes(term) ||
        plan.includes(term)
      );
    });
  }, [alumnos, busqueda]);

  // Paginación
  const totalPaginas = Math.ceil(alumnosFiltrados.length / tamanoPagina) || 1;
  const alumnosPaginados = useMemo(() => {
    const inicio = (paginaActual - 1) * tamanoPagina;
    return alumnosFiltrados.slice(inicio, inicio + tamanoPagina);
  }, [alumnosFiltrados, paginaActual, tamanoPagina]);

  // Reset de página al buscar
  useEffect(() => {
    setPaginaActual(1);
  }, [busqueda]);

  // Acciones
  const handleGuardarNuevoAlumno = (nuevo: AlumnoPersonal) => {
    setAlumnos((prev) => [nuevo, ...prev]);
  };

  const handleImportarMasivo = (nuevos: AlumnoPersonal[]) => {
    setAlumnos((prev) => [...nuevos, ...prev]);
  };

  const handleConfirmarEliminar = () => {
    if (!alumnoEliminar) return;
    setAlumnos((prev) => prev.filter((a) => a.i_CveAlumno !== alumnoEliminar.i_CveAlumno));
    toast.success("Alumno eliminado");
    setAlumnoEliminar(null);
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
      </div>

      {/* Barra superior (Barra de Filtros y Botones) */}
      <div className="card mb-4 p-4 filter-card">
        <div style={{ display: "flex", flexDirection: "row", alignItems: "flex-end", gap: "16px", flexWrap: "wrap" }}>
          <div style={{ display: "flex", flexDirection: "row", alignItems: "flex-end", gap: "8px", marginLeft: "auto" }}>
            {/* Buscador */}
            <div style={{ display: "flex", flexDirection: "column", gap: "4px", width: "220px", minWidth: "160px" }}>
              <label className="form-label" style={{ marginBottom: 0 }}>Buscar</label>
              <div style={{ position: "relative", width: "100%" }}>
                <Search size={14} style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8", pointerEvents: "none" }} />
                <input
                  type="text"
                  className="form-control text-xs py-1.5"
                  style={{ width: "100%", paddingLeft: "28px", borderRadius: "20px", height: "32px" }}
                  placeholder="Buscar alumno..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
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
              onClick={() => setModalNuevoAbierto(true)}
              title="Nuevo alumno"
              style={{ height: "32px", fontSize: "13px", display: "inline-flex", alignItems: "center", gap: "6px" }}
            >
              <Plus size={16} />
              <span className="filter-btn-text">Nuevo alumno</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tabla de Personal */}
      <div className="alegra-table-container border border-slate-200/80 shadow-sm rounded-xl overflow-hidden mb-4">
        <table className="alegra-table alegra-table-compact">
          <thead>
            <tr>
              <th style={{ width: "14%" }}>Nómina</th>
              <th style={{ width: "32%" }}>Nombre</th>
              <th style={{ width: "22%" }}>CURP</th>
              <th style={{ width: "18%" }}>Puesto</th>
              <th style={{ width: "14%" }}>Planta</th>
              <th className="text-center" style={{ width: "80px", whiteSpace: "nowrap" }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {alumnosPaginados.length === 0 ? (
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
                      <Users size={22} />
                    </div>
                    <p style={{ fontSize: "14px", fontWeight: 600, color: "#334155", margin: 0 }}>
                      No se encontraron alumnos
                    </p>
                    <p style={{ fontSize: "12px", color: "#64748b", margin: 0 }}>
                      Intenta ajustando el filtro de búsqueda o agrega a un nuevo alumno.
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              alumnosPaginados.map((row) => (
                <tr key={row.i_CveAlumno} className="hover:bg-slate-50/60 transition-colors">
                  <td style={{ fontWeight: 500, color: "#334155" }}>{row.v_Nomina}</td>
                  <td>
                    <span style={{ color: "#2B8FCC", fontWeight: 600 }} className="uppercase block text-sm">
                      {row.v_Nombre}
                    </span>
                  </td>
                  <td>
                    <span className="font-mono text-xs text-secondary">{row.v_CURP}</span>
                  </td>
                  <td style={{ color: "#334155" }}>{row.v_Puesto}</td>
                  <td style={{ color: "#334155" }}>{row.v_Planta}</td>
                  <td className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        className="btn-icon danger"
                        onClick={() => setAlumnoEliminar(row)}
                        title="Eliminar alumno"
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
          totalRegistros={alumnosFiltrados.length}
          tamano={tamanoPagina}
          onCambioPagina={(pag) => setPaginaActual(pag)}
          onCambioTamano={(tam) => {
            setTamanoPagina(tam);
            setPaginaActual(1);
          }}
        />
      </div>

      {/* Modal Nuevo Alumno */}
      <ModalNuevoAlumno
        abierto={modalNuevoAbierto}
        idEmpresa={idEmpresa}
        alumnosExistentes={alumnos}
        onCerrar={() => setModalNuevoAbierto(false)}
        onGuardar={handleGuardarNuevoAlumno}
      />

      {/* Modal Carga Masiva */}
      <ModalCargaMasivaPersonal
        abierto={modalCargaAbierto}
        idEmpresa={idEmpresa}
        alumnosExistentes={alumnos}
        onCerrar={() => setModalCargaAbierto(false)}
        onImportar={handleImportarMasivo}
      />

      {/* Modal Confirmar Eliminar */}
      <ModalConfirmarEliminar
        abierto={!!alumnoEliminar}
        nombreElemento={alumnoEliminar?.v_Nombre || "este alumno"}
        mensajePersonalizado={
          alumnoEliminar
            ? `¿Deseas eliminar a ${alumnoEliminar.v_Nombre}? Si lo haces, se perderán todos sus datos.`
            : undefined
        }
        onCerrar={() => setAlumnoEliminar(null)}
        onConfirmar={handleConfirmarEliminar}
      />
    </AppLayout>
  );
}
