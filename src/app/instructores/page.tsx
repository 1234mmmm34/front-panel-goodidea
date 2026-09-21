"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { UserCheck, Plus, Search, Edit2, Trash2, RefreshCw, ChevronRight } from "lucide-react";
import { InstructorDto } from "@/types/instructores";
import { InstructoresService } from "@/services/instructores.service";
import { AppLayout } from "@/components/layout/AppLayout";
import { PaginadorCustom } from "@/components/ui/PaginadorCustom";
import { ModalConfirmarEliminar } from "@/components/ui/ModalConfirmarEliminar";
import { ModalCrearEditarInstructor } from "@/components/instructores/ModalCrearEditarInstructor";
import { useToast } from "@/context/ToastContext";

function esEmailTenue(email: string | null | undefined): boolean {
  if (!email) return true;
  const e = email.trim();
  if (e === "" || e.toUpperCase() === "N/A" || e.toUpperCase() === "NA") return true;
  return false;
}

export default function InstructoresPage() {
  const { toast } = useToast();
  const [datos, setDatos] = useState<InstructorDto[]>([]);
  const [cargando, setCargando] = useState<boolean>(true);

  // Filtros y Paginación
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [localSearch, setLocalSearch] = useState<string>("");
  const [paginaActual, setPaginaActual] = useState<number>(1);
  const [tamanoPagina, setTamanoPagina] = useState<number>(10);
  const [totalRegistros, setTotalRegistros] = useState<number>(0);
  const [totalPaginas, setTotalPaginas] = useState<number>(1);

  // Modales
  const [modalFormAbierto, setModalFormAbierto] = useState<boolean>(false);
  const [instructorEditar, setInstructorEditar] = useState<InstructorDto | null>(null);

  const [itemEliminar, setItemEliminar] = useState<InstructorDto | null>(null);
  const [eliminando, setEliminando] = useState<boolean>(false);

  const cargarInstructores = useCallback(async () => {
    setCargando(true);
    const res = await InstructoresService.getPaginado({
      pagina: paginaActual,
      tamano: tamanoPagina,
      searchTerm,
    });

    setDatos(res.datos);
    setTotalRegistros(res.total);
    setTotalPaginas(res.totalPaginas);
    setCargando(false);
  }, [paginaActual, tamanoPagina, searchTerm]);

  useEffect(() => {
    cargarInstructores();
  }, [cargarInstructores]);

  const handleConfirmarEliminar = async () => {
    if (!itemEliminar) return;
    setEliminando(true);
    const res = await InstructoresService.eliminar(itemEliminar.i_CveInstructor);
    setEliminando(false);
    setItemEliminar(null);

    if (res.exito) {
      toast.success("Instructor eliminado exitosamente.");
      cargarInstructores();
    } else {
      toast.error(res.mensaje || "Ocurrió un error al intentar eliminar el instructor.");
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
        <span style={{ color: "#1e293b", fontWeight: 500 }}>Instructores</span>
      </div>

      {/* Encabezado de Sección */}
      <div className="page-header mb-5">
        <div>
          <h1 className="page-title flex items-center gap-2 text-xl font-bold text-slate-900">
            Instructores
          </h1>
          <p className="subtext text-slate-500 text-xs mt-0.5">
            Administración de instructores registrados en el sistema.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            className="btn btn-outline"
            onClick={cargarInstructores}
            disabled={cargando}
            title="Recargar instructores"
          >
            <RefreshCw size={15} className={cargando ? "animate-spin" : ""} />
            Recargar
          </button>
        </div>
      </div>

      {/* Barra de Filtros (Alineada a la derecha, sin fechas) */}
      <div className="card mb-4 p-4 border border-slate-200/80 shadow-sm rounded-xl filter-card">
        <div style={{ display: "flex", flexDirection: "row", alignItems: "flex-end", gap: "16px", justifyContent: "flex-end", flexWrap: "wrap" }}>
          <div style={{ display: "flex", flexDirection: "row", alignItems: "flex-end", gap: "8px" }}>
            {/* Buscador de texto */}
            <div style={{ display: "flex", flexDirection: "column", gap: "4px", width: "260px", minWidth: "160px" }}>
              <label className="form-label text-[11px] font-semibold text-slate-600" style={{ marginBottom: 0 }}>
                Buscar instructor
              </label>
              <div style={{ position: "relative", width: "100%" }}>
                <Search size={14} style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8", pointerEvents: "none" }} />
                <input
                  type="text"
                  className="form-control text-xs py-1.5"
                  style={{ width: "100%", paddingLeft: "30px", borderRadius: "20px", height: "32px" }}
                  placeholder="Buscar instructor (Enter)..."
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

            {/* Botón Nuevo Instructor */}
            <button
              type="button"
              className="btn btn-primary filter-action-btn"
              onClick={() => {
                setInstructorEditar(null);
                setModalFormAbierto(true);
              }}
              title="Nuevo instructor"
            >
              <Plus size={16} />
              <span className="filter-btn-text">Nuevo instructor</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tabla Instructores: Nombre | Email | Acciones */}
      <div className="alegra-table-container border border-slate-200/80 shadow-sm rounded-xl overflow-hidden mb-4">
        <table className="alegra-table">
          <thead>
            <tr>
              <th style={{ width: "45%" }}>Nombre</th>
              <th style={{ width: "40%" }}>Email</th>
              <th className="text-center" style={{ width: "15%" }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {cargando ? (
              Array.from({ length: 4 }).map((_, idx) => (
                <tr key={`sk-inst-${idx}`}>
                  <td>
                    <div className="skeleton-box" style={{ width: "70%", height: "16px" }}></div>
                  </td>
                  <td>
                    <div className="skeleton-box sm" style={{ width: "60%" }}></div>
                  </td>
                  <td className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <div className="skeleton-circle"></div>
                      <div className="skeleton-circle"></div>
                    </div>
                  </td>
                </tr>
              ))
            ) : datos.length === 0 ? (
              <tr>
                <td colSpan={3} style={{ textAlign: "center", padding: "48px 16px" }}>
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
                      No se encontraron instructores
                    </p>
                    <p style={{ fontSize: "12px", color: "#64748b", margin: 0 }}>
                      Registra un nuevo instructor usando el botón superior "Nuevo instructor".
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              datos.map((row) => {
                const tenue = esEmailTenue(row.v_Email);

                return (
                  <tr key={row.i_CveInstructor} className="hover:bg-slate-50/60 transition-colors">
                    {/* Nombre */}
                    <td>
                      <div className="font-semibold text-slate-900 text-xs leading-tight">
                        {row.v_Nombre}
                      </div>
                    </td>

                    {/* Email (Si es null, "", "N/A", se muestra tenue) */}
                    <td>
                      {tenue ? (
                        <span className="text-slate-400 text-xs italic font-normal">
                          {row.v_Email && row.v_Email.trim() !== "" ? row.v_Email.trim() : "N/A"}
                        </span>
                      ) : (
                        <span className="text-slate-800 text-xs font-normal">
                          {row.v_Email}
                        </span>
                      )}
                    </td>

                    {/* Acciones */}
                    <td className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          className="btn-icon text-slate-600 hover:text-slate-900"
                          onClick={() => {
                            setInstructorEditar(row);
                            setModalFormAbierto(true);
                          }}
                          title="Editar instructor"
                        >
                          <Edit2 size={15} />
                        </button>

                        <button
                          type="button"
                          className="btn-icon danger"
                          onClick={() => setItemEliminar(row)}
                          title="Eliminar instructor"
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

      {/* Modal Crear / Editar Instructor */}
      <ModalCrearEditarInstructor
        abierto={modalFormAbierto}
        instructorEditar={instructorEditar}
        onCerrar={() => {
          setModalFormAbierto(false);
          setInstructorEditar(null);
        }}
        onGuardado={cargarInstructores}
      />

      {/* Modal Confirmar Eliminar Instructor */}
      <ModalConfirmarEliminar
        abierto={!!itemEliminar}
        nombreElemento={itemEliminar?.v_Nombre || "este instructor"}
        onCerrar={() => setItemEliminar(null)}
        onConfirmar={handleConfirmarEliminar}
        cargando={eliminando}
      />
    </AppLayout>
  );
}
