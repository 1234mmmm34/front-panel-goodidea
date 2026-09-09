"use client";

import React, { useEffect, useState, useCallback, use } from "react";
import Link from "next/link";
import { Building2, Plus, Search, Edit2, Trash2, RefreshCw, Layers, ChevronRight } from "lucide-react";
import { PlantaGetDto, EmpresaGetDto } from "@/types/empresas";
import { CentrosTrabajoService } from "@/services/centros.service";
import { EmpresasService } from "@/services/empresas.service";
import { AppLayout } from "@/components/layout/AppLayout";
import { ModalConfirmarEliminar } from "@/components/ui/ModalConfirmarEliminar";
import { ModalCrearEditarCentro } from "@/components/centros/ModalCrearEditarCentro";
import { ModalAdministrarAreas } from "@/components/centros/ModalAdministrarAreas";
import { useToast } from "@/context/ToastContext";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function CentrosTrabajoPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const idEmpresa = Number(resolvedParams.id);

  const { toast } = useToast();
  const [empresa, setEmpresa] = useState<EmpresaGetDto | null>(null);
  const [datos, setDatos] = useState<PlantaGetDto[]>([]);
  const [cargando, setCargando] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [localSearch, setLocalSearch] = useState<string>("");

  // Modales
  const [modalCentroAbierto, setModalCentroAbierto] = useState<boolean>(false);
  const [centroEditar, setCentroEditar] = useState<PlantaGetDto | null>(null);

  const [modalAreasAbierto, setModalAreasAbierto] = useState<boolean>(false);
  const [centroSeleccionadoAreas, setCentroSeleccionadoAreas] = useState<PlantaGetDto | null>(null);

  const [centroEliminar, setCentroEliminar] = useState<PlantaGetDto | null>(null);
  const [eliminando, setEliminando] = useState<boolean>(false);

  // Cargar datos de la empresa
  useEffect(() => {
    if (idEmpresa > 0) {
      EmpresasService.getById(idEmpresa).then((res) => {
        if (res) setEmpresa(res);
      });
    }
  }, [idEmpresa]);

  // Cargar centros de trabajo de la empresa
  const cargarCentros = useCallback(async () => {
    if (!idEmpresa || isNaN(idEmpresa)) return;
    setCargando(true);
    const lista = await CentrosTrabajoService.GetCentros(idEmpresa, searchTerm);
    setDatos(lista);
    setCargando(false);
  }, [idEmpresa, searchTerm]);

  useEffect(() => {
    cargarCentros();
  }, [cargarCentros]);

  const handleConfirmarEliminar = async () => {
    if (!centroEliminar) return;
    setEliminando(true);
    const ok = await CentrosTrabajoService.DeleteCentro(centroEliminar.i_CvePlanta);
    setEliminando(false);
    setCentroEliminar(null);

    if (ok) {
      toast.success("Centro de trabajo eliminado exitosamente.");
      cargarCentros();
    } else {
      toast.error("Ocurrió un error al intentar eliminar el centro de trabajo.");
    }
  };

  const nombreEmpresa = empresa?.s_RazonSocial || `Empresa #${idEmpresa}`;

  return (
    <AppLayout>
      {/* Breadcrumb Minimalista */}
      <div style={{ fontSize: "12px", color: "#7a96b0", display: "flex", alignItems: "center", gap: "6px", marginBottom: "14px" }}>
        <Link href="/empresas" style={{ color: "#7a96b0", textDecoration: "none" }} className="hover:text-slate-900 transition-colors">
          Empresas
        </Link>
        <ChevronRight size={13} style={{ color: "#b5cfe8" }} />
        <span style={{ color: "#7a96b0" }}>{nombreEmpresa}</span>
        <ChevronRight size={13} style={{ color: "#b5cfe8" }} />
        <span style={{ color: "#1e293b", fontWeight: 500 }}>Centros de trabajo</span>
      </div>

      {/* Encabezado de Sección */}
      <div className="page-header mb-5">
        <div>
          <h1 className="page-title flex items-center gap-2 text-xl font-bold text-slate-900">
            Centros de trabajo
          </h1>
          <p className="subtext text-slate-500 text-xs mt-0.5">
            Administra los centros de trabajo registrados para la empresa{" "}
            <strong className="text-primary font-semibold">{nombreEmpresa}</strong>.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            className="btn btn-outline"
            onClick={cargarCentros}
            disabled={cargando}
            title="Recargar centros de trabajo"
          >
            <RefreshCw size={15} className={cargando ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* Barra de filtros (Alineada a la derecha) */}
      <div className="card mb-4 p-4 border border-slate-200/80 shadow-sm rounded-xl">
        <div style={{ display: "flex", flexDirection: "row", alignItems: "flex-end", gap: "16px", justifyContent: "flex-end" }}>
          <div style={{ display: "flex", flexDirection: "row", alignItems: "flex-end", gap: "8px", width: "auto" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "4px", width: "240px", minWidth: "200px" }}>
              <label className="form-label text-[11px] font-semibold text-slate-600" style={{ marginBottom: 0 }}>Buscar centro</label>
              <div style={{ position: "relative", width: "100%" }}>
                <Search size={14} style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8", pointerEvents: "none" }} />
                <input
                  type="text"
                  className="form-control text-xs py-1.5"
                  style={{ width: "100%", paddingLeft: "30px", borderRadius: "20px", height: "32px" }}
                  placeholder="Buscar centro / áreas (Enter)..."
                  value={localSearch}
                  onChange={(e) => setLocalSearch(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      setSearchTerm(localSearch);
                    }
                  }}
                />
              </div>
            </div>

            <button
              type="button"
              className="btn btn-primary text-xs py-1.5 px-3.5 flex items-center gap-1.5 shrink-0"
              style={{ height: "32px", display: "inline-flex", alignItems: "center", justifyContent: "center", borderRadius: "20px" }}
              onClick={() => {
                setCentroEditar(null);
                setModalCentroAbierto(true);
              }}
              title="Nuevo centro"
            >
              <Plus size={16} />
              <span>Nuevo centro</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tabla Combinada: Nombre | Dirección | Áreas | Acciones */}
      <div className="alegra-table-container border border-slate-200/80 shadow-sm rounded-xl overflow-hidden">
        <table className="alegra-table">
          <thead>
            <tr>
              <th style={{ width: "22%" }}>Nombre</th>
              <th style={{ width: "35%" }}>Dirección</th>
              <th style={{ width: "28%" }}>Áreas</th>
              <th className="text-center" style={{ width: "15%" }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {cargando ? (
              Array.from({ length: 4 }).map((_, idx) => (
                <tr key={`sk-centro-${idx}`}>
                  <td>
                    <div className="skeleton-box" style={{ width: "75%", marginBottom: "4px" }}></div>
                    <div className="skeleton-box sm" style={{ width: "35%" }}></div>
                  </td>
                  <td>
                    <div className="skeleton-box sm" style={{ width: "90%", marginBottom: "3px" }}></div>
                    <div className="skeleton-box sm" style={{ width: "45%" }}></div>
                  </td>
                  <td>
                    <div className="skeleton-box sm" style={{ width: "80%" }}></div>
                  </td>
                  <td className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <div className="skeleton-circle"></div>
                      <div className="skeleton-circle"></div>
                      <div className="skeleton-circle"></div>
                    </div>
                  </td>
                </tr>
              ))
            ) : datos.length === 0 ? (
              <tr>
                <td colSpan={4} className="text-center py-10 text-slate-500">
                  <Building2 size={32} className="mx-auto text-slate-300 mb-2" />
                  <p className="font-medium text-slate-700 text-xs">No se encontraron centros de trabajo</p>
                  <p className="text-[11px] text-slate-400">Registra un nuevo centro usando el botón superior.</p>
                </td>
              </tr>
            ) : (
              datos.map((row) => {
                const siglasText = row.v_Siglas || row.s_Siglas;
                
                // Formatear dirección
                const calle = row.v_NombreCalle || row.s_Domicilio || "";
                const numExt = row.v_NumeroExterior ? ` #${row.v_NumeroExterior}` : "";
                const direccionBase = [calle + numExt, row.v_Fraccionamiento, row.v_Municipio].filter(Boolean).join(", ") || "—";
                const cpText = row.i_CodigoPostal ? `C.P. ${row.i_CodigoPostal}` : null;
                const fullAddress = `${direccionBase} ${cpText ? `(${cpText})` : ""}`;

                // Formatear áreas
                const rawAreas = row.v_Areas && row.v_Areas.trim() ? row.v_Areas.trim() : null;

                return (
                  <tr key={row.i_CvePlanta} className="hover:bg-slate-50/60 transition-colors">
                    {/* Nombre del centro (Estilo tipográfico limpio) */}
                    <td>
                      <div className="font-semibold text-slate-900 text-xs leading-tight">
                        {row.v_NombrePlanta}
                      </div>
                      {siglasText && (
                        <div className="text-[11px] text-slate-400 font-mono mt-0.5">{siglasText}</div>
                      )}
                    </td>

                    {/* Dirección (con tooltip nativo) */}
                    <td title={fullAddress}>
                      <div className="text-slate-800 text-xs font-normal leading-snug">
                        {direccionBase}
                      </div>
                      {cpText && (
                        <div className="text-xs text-slate-400 mt-0.5">{cpText}</div>
                      )}
                    </td>

                    {/* Áreas resueltas (Texto separado por coma simple y limpio) */}
                    <td>
                      {rawAreas ? (
                        <span className="text-slate-700 text-xs font-normal">
                          {rawAreas}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-xs italic">Sin áreas</span>
                      )}
                    </td>

                    {/* Acciones */}
                    <td className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          className="btn-icon text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
                          onClick={() => {
                            setCentroSeleccionadoAreas(row);
                            setModalAreasAbierto(true);
                          }}
                          title="Agregar / Administrar áreas"
                        >
                          <Layers size={15} />
                        </button>

                        <button
                          type="button"
                          className="btn-icon text-slate-600 hover:text-slate-900"
                          onClick={() => {
                            setCentroEditar(row);
                            setModalCentroAbierto(true);
                          }}
                          title="Editar centro de trabajo"
                        >
                          <Edit2 size={15} />
                        </button>

                        <button
                          type="button"
                          className="btn-icon danger"
                          onClick={() => setCentroEliminar(row)}
                          title="Eliminar centro de trabajo"
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

      {/* Modal Crear / Editar Centro */}
      <ModalCrearEditarCentro
        abierto={modalCentroAbierto}
        idEmpresa={idEmpresa}
        centroEditar={centroEditar}
        onCerrar={() => {
          setModalCentroAbierto(false);
          setCentroEditar(null);
        }}
        onGuardado={cargarCentros}
      />

      {/* Modal Administrar Áreas */}
      <ModalAdministrarAreas
        abierto={modalAreasAbierto}
        idEmpresa={idEmpresa}
        centro={centroSeleccionadoAreas}
        onCerrar={() => {
          setModalAreasAbierto(false);
          setCentroSeleccionadoAreas(null);
        }}
        onActualizado={cargarCentros}
      />

      {/* Modal Confirmar Eliminar Centro */}
      <ModalConfirmarEliminar
        abierto={!!centroEliminar}
        nombreElemento={centroEliminar?.v_NombrePlanta || "este centro de trabajo"}
        onCerrar={() => setCentroEliminar(null)}
        onConfirmar={handleConfirmarEliminar}
        cargando={eliminando}
      />
    </AppLayout>
  );
}
