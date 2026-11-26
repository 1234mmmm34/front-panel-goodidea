"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { X, Save, FileText, Download, RefreshCw, Trash2, Upload, AlertTriangle, Loader2 } from "lucide-react";
import { entregables, Norma, rubros, unidades } from "@/types/catalogos";
import { PlantillaLicenciaInfoDto, ServiciosDropdownDto, ServiciosPostDto, tiposServicios } from "@/types/servicios";
import { CatalogosService } from "@/services/catalogos.service";
import { ServiciosService } from "@/services/servicios.service";
import { useToast } from "@/context/ToastContext";
import { ModalConfirmarEliminar } from "@/components/ui/ModalConfirmarEliminar";
import { formatearFechaTexto } from "@/lib/date-utils";

function normalizarNombreEntregable(nombre: string): string {
  return nombre
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/[\s\-_]+/g, "");
}

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
  const { toast } = useToast();
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
  const [bAplicaVoBo, setBAplicaVoBo] = useState<boolean>(false);
  const [entregablesSeleccionados, setEntregablesSeleccionados] = useState<number[]>([]);

  // Validation State
  const [showErrors, setShowErrors] = useState<boolean>(false);
  const [guardando, setGuardando] = useState<boolean>(false);

  // Plantilla de licencia (general)
  const [plantillaLicencia, setPlantillaLicencia] = useState<PlantillaLicenciaInfoDto | null>(null);
  const [cargandoPlantilla, setCargandoPlantilla] = useState<boolean>(false);
  const [subiendoPlantilla, setSubiendoPlantilla] = useState<boolean>(false);
  const [modalEliminarPlantilla, setModalEliminarPlantilla] = useState<boolean>(false);
  const [eliminandoPlantilla, setEliminandoPlantilla] = useState<boolean>(false);
  const plantillaInputRef = useRef<HTMLInputElement | null>(null);

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
      setBAplicaVoBo(Boolean(servicioEditar.b_AplicaVoBo ?? (servicioEditar as any).b_aplicaVoBo ?? (servicioEditar as any).bAplicaVoBo));
      setEntregablesSeleccionados(servicioEditar.entregables || []);
    } else {
      setNombre("");
      setCveRubro(0);
      setCveTipoServicio(0);
      setCveUnidad(0);
      setNombreUnidadText("");
      setCveNorma(null);
      setCantidad(1);
      setBAplicaVoBo(false);
      setEntregablesSeleccionados([]);
    }
    setShowErrors(false);
  }, [servicioEditar, abierto]);

  const idEntregableLicencia = useMemo(() => {
    const encontrado = listaEntregables.find(
      (e) => normalizarNombreEntregable(e.v_Nombre || "") === "LICENCIA"
    );
    return encontrado?.i_CveEntregables ?? null;
  }, [listaEntregables]);

  const licenciaMarcada =
    idEntregableLicencia !== null && entregablesSeleccionados.includes(idEntregableLicencia);

  const licenciaGuardadaEnServicio = Boolean(
    servicioEditar &&
    idEntregableLicencia !== null &&
    (servicioEditar.entregables || []).includes(idEntregableLicencia)
  );

  useEffect(() => {
    if (!abierto || !servicioEditar?.i_CveServicio || !licenciaGuardadaEnServicio) {
      setPlantillaLicencia(null);
      setCargandoPlantilla(false);
      return;
    }

    let activo = true;
    setCargandoPlantilla(true);
    ServiciosService.getPlantillaLicencia(servicioEditar.i_CveServicio)
      .then((res) => {
        if (activo) setPlantillaLicencia(res);
      })
      .finally(() => {
        if (activo) setCargandoPlantilla(false);
      });

    return () => {
      activo = false;
    };
  }, [abierto, servicioEditar?.i_CveServicio, licenciaGuardadaEnServicio]);

  const handleSeleccionarPlantilla = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !servicioEditar?.i_CveServicio) return;

    if (!file.name.toLowerCase().endsWith(".pptx")) {
      toast.error("Formato inválido. Solo se permiten archivos .pptx.");
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      toast.error("El archivo supera el límite permitido de 20 MB.");
      return;
    }

    setSubiendoPlantilla(true);
    const res = await ServiciosService.subirPlantillaLicencia(servicioEditar.i_CveServicio, file);
    setSubiendoPlantilla(false);

    if (res.exito && res.plantilla) {
      setPlantillaLicencia(res.plantilla);
      toast.success("Plantilla de licencia actualizada");
    } else {
      toast.error(res.mensaje || "Ocurrió un error al subir la plantilla.");
    }
  };

  const handleConfirmarEliminarPlantilla = async () => {
    if (!servicioEditar?.i_CveServicio) return;
    setEliminandoPlantilla(true);
    const res = await ServiciosService.eliminarPlantillaLicencia(servicioEditar.i_CveServicio);
    setEliminandoPlantilla(false);
    setModalEliminarPlantilla(false);

    if (res.exito) {
      setPlantillaLicencia(null);
      toast.success("Plantilla de licencia eliminada");
    } else {
      toast.error(res.mensaje || "Ocurrió un error al eliminar la plantilla.");
    }
  };

  // Autocompletar Unidad por Tipo de Servicio
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

  // Reglas de validación
  const esNombreInvalido = showErrors && !nombre.trim();
  const esRubroInvalido = showErrors && cveRubro <= 0;
  const esTipoInvalido = showErrors && cveTipoServicio <= 0;

  const calcularErrores = () => {
    let count = 0;
    if (!nombre.trim()) count++;
    if (cveRubro <= 0) count++;
    if (cveTipoServicio <= 0) count++;
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
        i_Cantidad: 1,
        i_CveNorma: cveNorma,
        b_AplicaVoBo: bAplicaVoBo,
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
      toast.success(servicioEditar ? "Servicio actualizado exitosamente" : "Servicio guardado exitosamente");
      onGuardadoExitoso();
      onCerrar();
    } else {
      toast.error("Ocurrió un error al guardar el servicio.");
    }
  };

  if (!abierto) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content wide" style={{ maxWidth: "880px", width: "90vw", maxHeight: "none", overflow: "visible" }}>
        <div className="modal-header">
          <h3 className="modal-title">
            {servicioEditar ? `Editar servicio #${servicioEditar.i_CveServicio}` : "Nuevo servicio"}
          </h3>
          <button className="btn-icon" onClick={onCerrar}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleGuardar}>
          <div className="modal-body" style={{ padding: "20px" }}>
            {/* Grid Horizontal de 3 Columnas sin Scrollbar */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: "12px 16px" }}>
              {/* Fila 1: Nombre (spans 2 cols) | Tipo de Servicio (1 col) */}
              <div className="form-group margin-0" style={{ gridColumn: "span 2" }}>
                <label className="form-label">
                  Nombre del servicio <span className="required-star">*</span>
                </label>
                <input
                  type="text"
                  className={`form-control ${esNombreInvalido ? "is-invalid" : ""}`}
                  placeholder="Ej. Estudio de Iluminación y Ruido"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                />
                {esNombreInvalido && (
                  <div className="invalid-feedback">
                    <span>Este campo es obligatorio.</span>
                  </div>
                )}
              </div>

              <div className="form-group margin-0">
                <label className="form-label">
                  Tipo de servicio <span className="required-star">*</span>
                </label>
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
                {esTipoInvalido && (
                  <div className="invalid-feedback">
                    <span>Selecciona tipo.</span>
                  </div>
                )}
              </div>

              {/* Fila 2: Rubro (1 col) | Norma Aplicable (1 col) | Unidad + Cantidad (1 col) */}
              <div className="form-group margin-0">
                <label className="form-label">
                  Rubro <span className="required-star">*</span>
                </label>
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
                {esRubroInvalido && (
                  <div className="invalid-feedback">
                    <span>Selecciona rubro.</span>
                  </div>
                )}
              </div>

              <div className="form-group margin-0">
                <label className="form-label">Norma aplicable</label>
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

              <div className="form-group margin-0">
                <label className="form-label">Unidad (Autocompletado)</label>
                <input
                  type="text"
                  className="form-control"
                  disabled
                  value={nombreUnidadText || "Se asigna automáticamente"}
                />
              </div>

              {/* Fila 3: Entregables asociados en lista horizontal alineada (spans 3 cols) */}
              <div className="form-group margin-0" style={{ gridColumn: "span 3", marginTop: "4px" }}>
                <label className="form-label" style={{ marginBottom: "4px" }}>Entregables asociados</label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px 16px", background: "#f8fafc", padding: "10px 14px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                  {listaEntregables.map((ent) => {
                    const check = entregablesSeleccionados.includes(ent.i_CveEntregables);
                    return (
                      <label
                        key={ent.i_CveEntregables}
                        style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", cursor: "pointer", color: "#334155", userSelect: "none" }}
                      >
                        <input
                          type="checkbox"
                          checked={check}
                          onChange={() => handleToggleEntregable(ent.i_CveEntregables)}
                          style={{ accentColor: "#188ae2", width: "15px", height: "15px" }}
                        />
                        <span>{ent.v_Nombre}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Plantilla de licencia (general) */}
              {licenciaMarcada && (
                <div className="form-group margin-0" style={{ gridColumn: "span 3", marginTop: "4px" }}>
                  <label className="form-label" style={{ marginBottom: "4px" }}>
                    Plantilla de licencia (general)
                  </label>
                  <div
                    style={{
                      background: "#f8fafc",
                      padding: "10px 14px",
                      borderRadius: "8px",
                      border: "1px solid #e2e8f0",
                    }}
                  >
                    {!servicioEditar ? (
                      <p style={{ fontSize: "12px", color: "#64748b", margin: 0 }}>
                        Podrás cargar la plantilla después de guardar el servicio.
                      </p>
                    ) : !licenciaGuardadaEnServicio ? (
                      <p style={{ fontSize: "12px", color: "#64748b", margin: 0 }}>
                        Guarda el servicio para poder cargar la plantilla.
                      </p>
                    ) : cargandoPlantilla ? (
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", color: "#64748b" }}>
                        <Loader2 size={14} className="animate-spin" style={{ color: "#2B8FCC" }} />
                        <span>Cargando plantilla...</span>
                      </div>
                    ) : (
                      <>
                        <input
                          ref={plantillaInputRef}
                          type="file"
                          accept=".pptx"
                          style={{ display: "none" }}
                          onChange={handleSeleccionarPlantilla}
                        />
                        {plantillaLicencia ? (
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", flexWrap: "wrap" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
                              <FileText size={18} style={{ color: "#2B8FCC", flexShrink: 0 }} />
                              <div style={{ minWidth: 0 }}>
                                <div style={{ fontSize: "12.5px", fontWeight: 500, color: "#1e293b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                  {plantillaLicencia.v_NombreArchivo || "plantilla.pptx"}
                                </div>
                                <div style={{ fontSize: "11px", color: "#64748b" }}>
                                  Cargada el {formatearFechaTexto(plantillaLicencia.d_FechaCarga)}
                                </div>
                              </div>
                            </div>

                            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                              {plantillaLicencia.v_Url && (
                                <button
                                  type="button"
                                  className="btn-icon"
                                  title="Descargar plantilla"
                                  onClick={() => window.open(plantillaLicencia.v_Url!, "_blank", "noopener,noreferrer")}
                                  style={{ padding: "5px", color: "#2B8FCC", cursor: "pointer" }}
                                >
                                  <Download size={15} />
                                </button>
                              )}
                              <button
                                type="button"
                                className="btn-icon"
                                title="Reemplazar plantilla"
                                disabled={subiendoPlantilla}
                                onClick={() => plantillaInputRef.current?.click()}
                                style={{ padding: "5px", color: "#475569", cursor: subiendoPlantilla ? "wait" : "pointer" }}
                              >
                                {subiendoPlantilla ? (
                                  <Loader2 size={15} className="animate-spin" style={{ color: "#2B8FCC" }} />
                                ) : (
                                  <RefreshCw size={15} />
                                )}
                              </button>
                              <button
                                type="button"
                                className="btn-icon danger"
                                title="Eliminar plantilla"
                                disabled={subiendoPlantilla}
                                onClick={() => setModalEliminarPlantilla(true)}
                                style={{ padding: "5px", color: "#ef4444", cursor: subiendoPlantilla ? "not-allowed" : "pointer" }}
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", flexWrap: "wrap" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", color: "#b45309" }}>
                              <AlertTriangle size={15} style={{ color: "#d97706", flexShrink: 0 }} />
                              <span>Sin plantilla: no se podrán generar licencias de este curso.</span>
                            </div>
                            <button
                              type="button"
                              disabled={subiendoPlantilla}
                              onClick={() => plantillaInputRef.current?.click()}
                              style={{
                                height: "30px",
                                padding: "0 12px",
                                borderRadius: "6px",
                                border: "1px solid #2B8FCC",
                                backgroundColor: "#ffffff",
                                color: "#2B8FCC",
                                fontSize: "12px",
                                fontWeight: 500,
                                cursor: subiendoPlantilla ? "wait" : "pointer",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "6px",
                              }}
                            >
                              {subiendoPlantilla ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />}
                              <span>{subiendoPlantilla ? "Subiendo..." : "Cargar plantilla"}</span>
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Renglón a ancho completo: Aplica visto bueno de la autoridad */}
              <div className="form-group margin-0" style={{ gridColumn: "span 3", marginTop: "4px" }}>
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    fontSize: "12px",
                    cursor: "pointer",
                    color: "#334155",
                    userSelect: "none",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={bAplicaVoBo}
                    onChange={(e) => setBAplicaVoBo(e.target.checked)}
                    style={{ accentColor: "#188ae2", width: "15px", height: "15px" }}
                  />
                  <span>Aplica visto bueno de la autoridad</span>
                </label>
              </div>
            </div>
          </div>

          <div className="modal-footer" style={{ padding: "12px 20px" }}>
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
              {guardando ? "Guardando..." : "Guardar servicio"}
            </button>
          </div>
        </form>
      </div>

      <ModalConfirmarEliminar
        abierto={modalEliminarPlantilla}
        nombreElemento={plantillaLicencia?.v_NombreArchivo || "plantilla general"}
        mensajePersonalizado="Se eliminará la plantilla general. Los cursos de empresas sin plantilla personalizada ya no podrán generar licencias."
        cargando={eliminandoPlantilla}
        onCerrar={() => setModalEliminarPlantilla(false)}
        onConfirmar={handleConfirmarEliminarPlantilla}
      />
    </div>
  );
};
