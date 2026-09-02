"use client";

import React, { useEffect, useState } from "react";
import { X, Save } from "lucide-react";
import { entregables, Norma, rubros, unidades } from "@/types/catalogos";
import { ServiciosDropdownDto, ServiciosPostDto, tiposServicios } from "@/types/servicios";
import { CatalogosService } from "@/services/catalogos.service";
import { ServiciosService } from "@/services/servicios.service";

interface Props {
  abierto: boolean;
  servicioEditar: ServiciosDropdownDto | null;
  onCerrar: () => void;
  onGuardadoExitoso: () => void;
}

export const ModalFormServicio: React.FC<Props> = ({
  abierto,
  servicioEditar,
  onCerrar,
  onGuardadoExitoso,
}) => {
  const [listaRubros, setListaRubros] = useState<rubros[]>([]);
  const [listaTipos, setListaTipos] = useState<tiposServicios[]>([]);
  const [listaUnidades, setListaUnidades] = useState<unidades[]>([]);
  const [listaNormas, setListaNormas] = useState<Norma[]>([]);
  const [listaEntregables, setListaEntregables] = useState<entregables[]>([]);

  // Form State
  const [nombre, setNombre] = useState<string>("");
  const [cveRubro, setCveRubro] = useState<number>(0);
  const [cveTipoServicio, setCveTipoServicio] = useState<number>(0);
  const [cveUnidad, setCveUnidad] = useState<number>(0);
  const [nombreUnidadText, setNombreUnidadText] = useState<string>("");
  const [cveNorma, setCveNorma] = useState<number | null>(null);
  const [cantidad, setCantidad] = useState<number>(1);
  const [entregablesSeleccionados, setEntregablesSeleccionados] = useState<number[]>([]);

  // Validation State (Error Counter Pattern)
  const [showErrors, setShowErrors] = useState<boolean>(false);
  const [guardando, setGuardando] = useState<boolean>(false);

  useEffect(() => {
    async function cargarCat() {
      const [r, t, u, n, e] = await Promise.all([
        CatalogosService.getRubros(),
        CatalogosService.getTiposServicios(),
        CatalogosService.getUnidades(),
        CatalogosService.getNormas(),
        CatalogosService.getEntregables(),
      ]);
      setListaRubros(r);
      setListaTipos(t);
      setListaUnidades(u);
      setListaNormas(n);
      setListaEntregables(e);
    }
    if (abierto) {
      cargarCat();
    }
  }, [abierto]);

  useEffect(() => {
    if (servicioEditar) {
      setNombre(servicioEditar.v_Nombre || "");
      setCveRubro(servicioEditar.i_CveRubro || 0);
      setCveTipoServicio(servicioEditar.i_CveTipoServicio || 0);
      setCveUnidad(servicioEditar.i_CveUnidad || 0);
      setNombreUnidadText(servicioEditar.v_Unidad || "");
      setCveNorma(servicioEditar.i_CveNorma || null);
      setCantidad(servicioEditar.i_Cantidad ?? 1);
      setEntregablesSeleccionados(servicioEditar.entregables || []);
    } else {
      setNombre("");
      setCveRubro(0);
      setCveTipoServicio(0);
      setCveUnidad(0);
      setNombreUnidadText("");
      setCveNorma(null);
      setCantidad(1);
      setEntregablesSeleccionados([]);
    }
    setShowErrors(false);
  }, [servicioEditar, abierto]);

  // Al cambiar el Tipo de Servicio, se autocompleta la Unidad automáticamente
  const handleCambioTipoServicio = (idTipo: number) => {
    setCveTipoServicio(idTipo);
    const tipoEncontrado = listaTipos.find((t) => t.i_CveTServicio === idTipo);
    if (tipoEncontrado) {
      setCveUnidad(tipoEncontrado.i_CveUnidad);
      const unidadObj = listaUnidades.find((u) => u.i_CveUnidad === tipoEncontrado.i_CveUnidad);
      setNombreUnidadText(unidadObj?.v_Nombre || "Unidad asignada");
    } else {
      setCveUnidad(0);
      setNombreUnidadText("");
    }
  };

  const handleToggleEntregable = (idEntregable: number) => {
    setEntregablesSeleccionados((prev) =>
      prev.includes(idEntregable)
        ? prev.filter((id) => id !== idEntregable)
        : [...prev, idEntregable]
    );
  };

  // Reglas de validación y contador de errores
  const esNombreInvalido = showErrors && !nombre.trim();
  const esRubroInvalido = showErrors && cveRubro <= 0;
  const esTipoInvalido = showErrors && cveTipoServicio <= 0;
  const esCantidadInvalida = showErrors && (!cantidad || cantidad <= 0);

  const calcularErrores = () => {
    let count = 0;
    if (!nombre.trim()) count++;
    if (cveRubro <= 0) count++;
    if (cveTipoServicio <= 0) count++;
    if (!cantidad || cantidad <= 0) count++;
    return count;
  };

  const handleGuardar = async (e: React.FormEvent) => {
    e.preventDefault();
    setShowErrors(true);

    const errorCount = calcularErrores();
    if (errorCount > 0) return;

    setGuardando(true);

    const payload: ServiciosPostDto = {
      Servicio: {
        i_CveServicio: servicioEditar?.i_CveServicio || 0,
        v_Nombre: nombre.trim(),
        i_CveRubro: cveRubro,
        i_CveTipoServicio: cveTipoServicio,
        i_CveUnidad: cveUnidad,
        i_Cantidad: cantidad,
        i_CveNorma: cveNorma,
        entregables: entregablesSeleccionados,
      },
      Entregables: entregablesSeleccionados,
    };

    let exito = false;
    if (servicioEditar) {
      exito = await ServiciosService.editar(payload);
    } else {
      exito = await ServiciosService.crear(payload);
    }

    setGuardando(false);

    if (exito) {
      onGuardadoExitoso();
      onCerrar();
    } else {
      alert("Ocurrió un error al guardar el servicio.");
    }
  };

  if (!abierto) return null;

  return (
    <div className="modal-overlay" onClick={onCerrar}>
      <div className="modal-content wide" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">
            {servicioEditar ? `Editar Servicio #${servicioEditar.i_CveServicio}` : "Nuevo Servicio"}
          </h3>
          <button className="btn-icon" onClick={onCerrar}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleGuardar}>
          <div className="modal-body">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Columna Izquierda */}
              <div>
                <div className="form-group">
                  <label className="form-label">Nombre del Servicio *</label>
                  <input
                    type="text"
                    className={`form-control ${esNombreInvalido ? "is-invalid" : ""}`}
                    placeholder="Ej. Estudio de Iluminación y Ruido"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Tipo de Servicio *</label>
                  <select
                    className={`form-select ${esTipoInvalido ? "is-invalid" : ""}`}
                    value={cveTipoServicio}
                    onChange={(e) => handleCambioTipoServicio(Number(e.target.value))}
                  >
                    <option value={0}>-- Selecciona un tipo --</option>
                    {listaTipos.map((t) => (
                      <option key={t.i_CveTServicio} value={t.i_CveTServicio}>
                        {t.v_Nombre}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Rubro *</label>
                  <select
                    className={`form-select ${esRubroInvalido ? "is-invalid" : ""}`}
                    value={cveRubro}
                    onChange={(e) => setCveRubro(Number(e.target.value))}
                  >
                    <option value={0}>-- Selecciona un rubro --</option>
                    {listaRubros.map((r) => (
                      <option key={r.i_CveRubro} value={r.i_CveRubro}>
                        {r.v_Nombre}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Columna Derecha */}
              <div>
                <div className="form-group">
                  <label className="form-label">Norma Aplicable</label>
                  <select
                    className="form-select"
                    value={cveNorma || 0}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setCveNorma(val === 0 ? null : val);
                    }}
                  >
                    <option value={0}>-- N/A --</option>
                    {listaNormas.map((n) => (
                      <option key={n.id} value={n.id}>
                        {n.nombre_noms || n.categoria_noms}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Unidad (Autocompletado)</label>
                  <input
                    type="text"
                    className="form-control"
                    disabled
                    value={nombreUnidadText || "Se asigna automáticamente por el Tipo"}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Cantidad de Unidades *</label>
                  <input
                    type="number"
                    min={1}
                    className={`form-control ${esCantidadInvalida ? "is-invalid" : ""}`}
                    value={cantidad}
                    onChange={(e) => setCantidad(Number(e.target.value))}
                  />
                </div>
              </div>
            </div>

            {/* Checkboxes de Entregables */}
            <div className="mt-6 border-t pt-4">
              <label className="form-label mb-2">Entregables asociados</label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-[160px] overflow-y-auto p-2 border rounded-md">
                {listaEntregables.map((ent) => {
                  const check = entregablesSeleccionados.includes(ent.i_CveEntregables);
                  return (
                    <label
                      key={ent.i_CveEntregables}
                      className="flex items-center gap-2 text-xs cursor-pointer p-1 rounded hover:bg-slate-50"
                    >
                      <input
                        type="checkbox"
                        checked={check}
                        onChange={() => handleToggleEntregable(ent.i_CveEntregables)}
                      />
                      <span>{ent.v_Nombre}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onCerrar}
              disabled={guardando}
            >
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" disabled={guardando}>
              <Save size={16} />
              {guardando ? "Guardando..." : "Guardar Servicio"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
