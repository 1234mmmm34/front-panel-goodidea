"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Layers, Plus, Search, Edit2, Trash2, RefreshCw } from "lucide-react";
import { rubros } from "@/types/catalogos";
import { ServiciosDrpDto, ServiciosDropdownDto, tiposServicios } from "@/types/servicios";
import { CatalogosService } from "@/services/catalogos.service";
import { ServiciosService } from "@/services/servicios.service";
import { Navbar } from "@/components/ui/Navbar";
import { PaginadorCustom } from "@/components/ui/PaginadorCustom";
import { BadgeTipoServicio } from "@/components/ui/BadgeTipoServicio";
import { ModalFormServicio } from "@/components/servicios/ModalFormServicio";
import { ModalConfirmarEliminar } from "@/components/ui/ModalConfirmarEliminar";

export default function ServiciosPage() {
  const [datos, setDatos] = useState<ServiciosDrpDto[]>([]);
  const [cargando, setCargando] = useState<boolean>(true);
  const [paginaActual, setPaginaActual] = useState<number>(1);
  const [tamanoPagina, setTamanoPagina] = useState<number>(10);
  const [totalRegistros, setTotalRegistros] = useState<number>(0);
  const [totalPaginas, setTotalPaginas] = useState<number>(1);

  // Filtros
  const [cveRubro, setCveRubro] = useState<number>(0);
  const [cveTipo, setCveTipo] = useState<number>(0);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [localSearch, setLocalSearch] = useState<string>("");

  // Catálogos auxiliares para la barra
  const [listaRubros, setListaRubros] = useState<rubros[]>([]);
  const [listaTipos, setListaTipos] = useState<tiposServicios[]>([]);

  // Modales
  const [modalFormAbierto, setModalFormAbierto] = useState<boolean>(false);
  const [servicioEditar, setServicioEditar] = useState<ServiciosDropdownDto | null>(null);

  const [itemEliminar, setItemEliminar] = useState<ServiciosDrpDto | null>(null);
  const [eliminando, setEliminando] = useState<boolean>(false);

  useEffect(() => {
    async function cargarFiltros() {
      const [r, t] = await Promise.all([
        CatalogosService.getRubros(),
        CatalogosService.getTiposServicios(),
      ]);
      setListaRubros(r);
      setListaTipos(t);
    }
    cargarFiltros();
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
      alert("No se pudo obtener el detalle del servicio para editar.");
    }
  };

  const handleConfirmarEliminar = async () => {
    if (!itemEliminar) return;
    setEliminando(true);
    const resultado = await ServiciosService.eliminar(itemEliminar.i_CveServicio);
    setEliminando(false);
    setItemEliminar(null);

    if (resultado.exito) {
      cargarServicios();
    } else {
      alert(resultado.mensaje || "Ocurrió un error al intentar eliminar el servicio.");
    }
  };

  return (
    <div className="app-container">
      <Navbar />

      <main className="main-content">
        <div className="page-header">
          <div>
            <h1 className="page-title">
              <Layers size={24} className="text-primary" />
              Catálogo de Servicios
            </h1>
            <p className="subtext">
              Administración de tipos de servicio, unidades, normas y entregables asociados.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              className="btn btn-outline"
              onClick={cargarServicios}
              disabled={cargando}
              title="Recargar datos"
            >
              <RefreshCw size={16} className={cargando ? "animate-spin" : ""} />
            </button>

            <button
              className="btn btn-primary"
              onClick={() => {
                setServicioEditar(null);
                setModalFormAbierto(true);
              }}
            >
              <Plus size={18} />
              Nuevo Servicio
            </button>
          </div>
        </div>

        {/* Barra de Filtros */}
        <div className="card mb-4 p-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="form-label mb-0">Rubro:</span>
                <select
                  className="form-select text-sm py-1.5"
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

              <div className="flex items-center gap-2">
                <span className="form-label mb-0">Tipo:</span>
                <select
                  className="form-select text-sm py-1.5"
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
            </div>

            <div className="flex items-center gap-2 min-w-[260px]">
              <div className="relative flex-1">
                <input
                  type="text"
                  className="form-control text-sm pl-8 pr-3 py-1.5 w-full"
                  placeholder="Buscar (presiona Enter)..."
                  value={localSearch}
                  onChange={(e) => setLocalSearch(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      setSearchTerm(localSearch);
                      setPaginaActual(1);
                    }
                  }}
                />
                <Search size={16} className="absolute left-2.5 top-2.5 text-slate-400" />
              </div>

              <button
                className="btn btn-primary btn-sm py-1.5"
                onClick={() => {
                  setSearchTerm(localSearch);
                  setPaginaActual(1);
                }}
              >
                Buscar
              </button>
            </div>
          </div>
        </div>

        {/* Tabla del Catálogo */}
        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Servicio</th>
                <th>Rubro</th>
                <th>Tipo</th>
                <th>Norma</th>
                <th>Unidad</th>
                <th>Entregables</th>
                <th className="text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {cargando ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-secondary">
                    <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-primary mb-2"></div>
                    <p>Cargando servicios...</p>
                  </td>
                </tr>
              ) : datos.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-secondary">
                    No se encontraron servicios en el catálogo.
                  </td>
                </tr>
              ) : (
                datos.map((row) => (
                  <tr key={row.i_CveServicio}>
                    <td>#{row.i_CveServicio}</td>
                    <td className="text-bold">{row.v_Nombre}</td>
                    <td>{row.v_Rubro}</td>
                    <td>
                      <BadgeTipoServicio tipoServicio={row.v_TipoServicio} />
                    </td>
                    <td>{row.v_Norma || "N/A"}</td>
                    <td>
                      {row.i_Cantidad ?? 0} {row.v_Unidad}
                    </td>
                    <td className="text-xs text-secondary">{row.v_Entregables || "Sin entregables"}</td>
                    <td>
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

        {/* Modal Alta / Edición */}
        <ModalFormServicio
          abierto={modalFormAbierto}
          servicioEditar={servicioEditar}
          onCerrar={() => setModalFormAbierto(false)}
          onGuardadoExitoso={() => cargarServicios()}
        />

        {/* Modal Confirmar Eliminar */}
        <ModalConfirmarEliminar
          abierto={!!itemEliminar}
          nombreElemento={itemEliminar?.v_Nombre || "este servicio"}
          onCerrar={() => setItemEliminar(null)}
          onConfirmar={handleConfirmarEliminar}
          cargando={eliminando}
        />
      </main>
    </div>
  );
}
