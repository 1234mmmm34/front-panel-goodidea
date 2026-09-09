"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Plus, Search, Layers, RefreshCw, Edit2, Trash2 } from "lucide-react";
import { ServiciosDrpDto, ServiciosDropdownDto } from "@/types/servicios";
import { ServiciosService } from "@/services/servicios.service";
import { CatalogosService } from "@/services/catalogos.service";
import { AppLayout } from "@/components/layout/AppLayout";
import { PaginadorCustom } from "@/components/ui/PaginadorCustom";
import { ModalFormServicio } from "@/components/servicios/ModalFormServicio";
import { ModalConfirmarEliminar } from "@/components/ui/ModalConfirmarEliminar";
import { BadgeTipoServicio } from "@/components/ui/BadgeTipoServicio";

import { useToast } from "@/context/ToastContext";

export default function ServiciosPage() {
  const { toast } = useToast();
  const [datos, setDatos] = useState<ServiciosDrpDto[]>([]);
  const [cargando, setCargando] = useState<boolean>(true);

  // Filtros y Paginación
  const [cveRubro, setCveRubro] = useState<number>(0);
  const [cveTipo, setCveTipo] = useState<number>(0);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [localSearch, setLocalSearch] = useState<string>("");
  const [paginaActual, setPaginaActual] = useState<number>(1);
  const [tamanoPagina, setTamanoPagina] = useState<number>(10);
  const [totalRegistros, setTotalRegistros] = useState<number>(0);
  const [totalPaginas, setTotalPaginas] = useState<number>(1);

  // Listas desplegables para los filtros
  const [listaRubros, setListaRubros] = useState<{ i_CveRubro: number; v_Nombre: string }[]>([]);
  const [listaTipos, setListaTipos] = useState<{ i_CveTServicio: number; v_Nombre: string }[]>([]);

  // Modales
  const [modalFormAbierto, setModalFormAbierto] = useState<boolean>(false);
  const [servicioEditar, setServicioEditar] = useState<ServiciosDropdownDto | null>(null);
  const [itemEliminar, setItemEliminar] = useState<ServiciosDrpDto | null>(null);
  const [eliminando, setEliminando] = useState<boolean>(false);

  // Cargar listas para combos al montar
  useEffect(() => {
    async function cargarCatalogos() {
      const rubros = await CatalogosService.getRubros();
      const tipos = await CatalogosService.getTiposServicios();
      setListaRubros(rubros);
      setListaTipos(tipos);
    }
    cargarCatalogos();
  }, []);

  const cargarServicios = useCallback(async () => {
    setCargando(true);
    const res = await ServiciosService.getAll({
      i_CveRubro: cveRubro,
      i_CveTServicio: cveTipo,
      pagina: paginaActual,
      tamano: tamanoPagina,
      searchTerm,
    });

    setDatos(res.datos);
    setTotalRegistros(res.total);
    setTotalPaginas(res.totalPaginas);
    setCargando(false);
  }, [cveRubro, cveTipo, paginaActual, tamanoPagina, searchTerm]);

  useEffect(() => {
    cargarServicios();
  }, [cargarServicios]);

  const handleEditarClick = async (row: ServiciosDrpDto) => {
    const detalle = await ServiciosService.getById(row.i_CveServicio);
    if (detalle) {
      setServicioEditar(detalle);
      setModalFormAbierto(true);
    } else {
      toast.error("No se pudo obtener el detalle del servicio para editar.");
    }
  };

  const handleConfirmarEliminar = async () => {
    if (!itemEliminar) return;
    setEliminando(true);
    const resultado = await ServiciosService.eliminar(itemEliminar.i_CveServicio);
    setEliminando(false);
    setItemEliminar(null);

    if (resultado.exito) {
      toast.success("Servicio eliminado exitosamente");
      cargarServicios();
    } else {
      toast.error(resultado.mensaje || "Ocurrió un error al intentar eliminar el servicio.");
    }
  };

  return (
    <AppLayout>
      <div className="page-header">
        <div>
          <h1 className="page-title">
            Catálogo de servicios
          </h1>
          <p className="subtext">
            Administración de tipos de servicio, unidades, normas y entregables asociados.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            className="btn btn-outline"
            onClick={cargarServicios}
            disabled={cargando}
            title="Recargar datos"
          >
            <RefreshCw size={16} className={cargando ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* Barra de Filtros Horizontal Estricta */}
      <div className="card mb-4 p-4">
        <div style={{ display: "flex", flexDirection: "row", alignItems: "flex-end", gap: "16px", flexWrap: "nowrap", overflowX: "auto" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "4px", minWidth: "180px" }}>
            <label className="form-label" style={{ marginBottom: 0 }}>Rubro</label>
            <select
              className="form-select text-xs py-1.5"
              style={{ borderRadius: "20px", height: "32px" }}
              value={cveRubro}
              onChange={(e) => {
                setCveRubro(Number(e.target.value));
                setPaginaActual(1);
              }}
            >
              <option value={0}>Todos los rubros</option>
              {listaRubros.map((r) => (
                <option key={r.i_CveRubro} value={r.i_CveRubro}>
                  {r.v_Nombre}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "4px", minWidth: "180px" }}>
            <label className="form-label" style={{ marginBottom: 0 }}>Tipo</label>
            <select
              className="form-select text-xs py-1.5"
              style={{ borderRadius: "20px", height: "32px" }}
              value={cveTipo}
              onChange={(e) => {
                setCveTipo(Number(e.target.value));
                setPaginaActual(1);
              }}
            >
              <option value={0}>Todos los tipos</option>
              {listaTipos.map((t) => (
                <option key={t.i_CveTServicio} value={t.i_CveTServicio}>
                  {t.v_Nombre}
                </option>
              ))}
            </select>
          </div>

          {/* Buscador + Botón + Nuevo al lado */}
          <div style={{ display: "flex", flexDirection: "row", alignItems: "flex-end", gap: "8px", width: "auto", marginLeft: "auto" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "4px", width: "220px", minWidth: "220px" }}>
              <label className="form-label" style={{ marginBottom: 0 }}>Buscar</label>
              <div style={{ position: "relative", width: "100%" }}>
                <Search size={14} style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8", pointerEvents: "none" }} />
                <input
                  type="text"
                  className="form-control text-xs py-1.5"
                  style={{ width: "100%", paddingLeft: "28px", borderRadius: "20px", height: "32px" }}
                  placeholder="Buscar servicio (Enter)..."
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

            <button
              type="button"
              className="btn btn-primary text-xs py-1.5 px-4 flex items-center gap-1.5 shrink-0"
              style={{ height: "32px", borderRadius: "20px", display: "inline-flex", alignItems: "center", justifyContent: "center" }}
              onClick={() => {
                setServicioEditar(null);
                setModalFormAbierto(true);
              }}
              title="Nuevo servicio"
            >
              <Plus size={16} />
              <span>Nuevo servicio</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tabla de Servicios */}
      <div className="alegra-table-container">
        <table className="alegra-table">
          <thead>
            <tr>
              <th>Rubro</th>
              <th>Tipo de Servicio</th>
              <th>Nombre del Servicio</th>
              <th>Norma</th>
              <th>Entregables</th>
              <th className="text-center">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {cargando ? (
              Array.from({ length: 5 }).map((_, idx) => (
                <tr key={`sk-servicio-${idx}`}>
                  <td>
                    <div className="skeleton-box sm" style={{ width: "65%" }}></div>
                  </td>
                  <td>
                    <div className="skeleton-box" style={{ width: "75px", height: "20px", borderRadius: "10px" }}></div>
                  </td>
                  <td>
                    <div className="skeleton-box" style={{ width: "85%" }}></div>
                  </td>
                  <td>
                    <div className="skeleton-box sm" style={{ width: "60%" }}></div>
                  </td>
                  <td>
                    <div className="skeleton-box sm" style={{ width: "70%" }}></div>
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
                <td colSpan={6} className="text-center py-8 text-secondary">
                  No se encontraron servicios con los filtros aplicados.
                </td>
              </tr>
            ) : (
              datos.map((row) => (
                <tr key={row.i_CveServicio}>
                  <td>{row.v_Rubro || "—"}</td>
                  <td>
                    <BadgeTipoServicio tipoServicio={row.v_TipoServicio} />
                  </td>
                  <td className="font-medium text-slate-800">{row.v_Nombre}</td>
                  <td className="font-mono">{row.v_Norma || "N/A"}</td>
                  <td>
                    {row.v_Entregables ? (
                      <span className="text-xs bg-slate-100 text-slate-700 px-2 py-1 rounded">
                        {row.v_Entregables}
                      </span>
                    ) : (
                      <span className="text-muted text-xs">Sin entregables</span>
                    )}
                  </td>
                  <td className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        className="btn-icon"
                        onClick={() => handleEditarClick(row)}
                        title="Editar servicio"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        className="btn-icon danger"
                        onClick={() => setItemEliminar(row)}
                        title="Eliminar servicio"
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
      </div>

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

      {/* Modal Formulario de Servicio */}
      <ModalFormServicio
        abierto={modalFormAbierto}
        servicioEditar={servicioEditar}
        onCerrar={() => setModalFormAbierto(false)}
        onGuardadoExitoso={() => {
          setModalFormAbierto(false);
          cargarServicios();
        }}
      />

      {/* Modal Confirmar Eliminar */}
      <ModalConfirmarEliminar
        abierto={!!itemEliminar}
        nombreElemento={itemEliminar?.v_Nombre || "este servicio"}
        onCerrar={() => setItemEliminar(null)}
        onConfirmar={handleConfirmarEliminar}
        cargando={eliminando}
      />
    </AppLayout>
  );
}
