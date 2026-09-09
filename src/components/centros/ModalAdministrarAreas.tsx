"use client";

import React, { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { X, Layers, Plus, Edit2, Trash2, RefreshCw, Building2, Tag, Check, User } from "lucide-react";
import { PlantaGetDto, ContactoXEmpresa } from "@/types/empresas";
import { CentrosTrabajoService, AreaGetDto } from "@/services/centros.service";
import { EmpresasService } from "@/services/empresas.service";
import { useToast } from "@/context/ToastContext";
import { ModalConfirmarEliminar } from "@/components/ui/ModalConfirmarEliminar";

interface Props {
  abierto: boolean;
  idEmpresa?: number;
  centro: PlantaGetDto | null;
  onCerrar: () => void;
  onActualizado: () => void;
}

export const ModalAdministrarAreas: React.FC<Props> = ({
  abierto,
  idEmpresa,
  centro,
  onCerrar,
  onActualizado,
}) => {
  const { toast } = useToast();
  const [mounted, setMounted] = useState(false);
  const [areas, setAreas] = useState<AreaGetDto[]>([]);
  const [cargando, setCargando] = useState(false);

  // Lista de contactos de la empresa
  const [contactosList, setContactosList] = useState<ContactoXEmpresa[]>([]);

  // Formulario área (crear / editar)
  const [areaEditar, setAreaEditar] = useState<AreaGetDto | null>(null);
  const [nombreArea, setNombreArea] = useState("");
  const [siglasArea, setSiglasArea] = useState("");
  const [contactoId, setContactoId] = useState<number>(0);
  const [guardando, setGuardando] = useState(false);

  // Eliminar área
  const [areaEliminar, setAreaEliminar] = useState<AreaGetDto | null>(null);
  const [eliminando, setEliminando] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const cargarAreas = useCallback(async () => {
    if (!centro?.i_CvePlanta) return;
    setCargando(true);
    const lista = await CentrosTrabajoService.GetAreas(centro.i_CvePlanta);
    setAreas(lista);
    setCargando(false);
  }, [centro]);

  const cargarContactos = useCallback(async () => {
    const empId = idEmpresa || centro?.i_CveEmpresa || (centro as any)?.iD_Empresa;
    if (!empId || isNaN(Number(empId))) {
      setContactosList([]);
      return;
    }
    const res = await EmpresasService.getContactos(empId);
    setContactosList(res || []);
  }, [idEmpresa, centro]);

  useEffect(() => {
    if (abierto && centro) {
      cargarAreas();
      cargarContactos();
      setAreaEditar(null);
      setNombreArea("");
      setSiglasArea("");
      setContactoId(0);
    }
  }, [abierto, centro, cargarAreas, cargarContactos]);

  if (!abierto || !mounted || !centro) return null;

  const handleSeleccionarEditar = (area: AreaGetDto) => {
    setAreaEditar(area);
    setNombreArea(area.v_NombreArea || "");
    setSiglasArea(area.v_SiglasArea || "");
    setContactoId(area.i_CveContacto || 0);
  };

  const handleCancelarEdicion = () => {
    setAreaEditar(null);
    setNombreArea("");
    setSiglasArea("");
    setContactoId(0);
  };

  const handleGuardarArea = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombreArea.trim()) return;

    const centroId = centro.i_CvePlanta || (centro as any).iD_Planta || (centro as any).i_CveCentro || 0;

    setGuardando(true);
    const resultado = await CentrosTrabajoService.SaveArea({
      i_CveArea: areaEditar ? areaEditar.i_CveArea : 0,
      i_CvePlanta: centroId,
      v_NombreArea: nombreArea.trim(),
      v_SiglasArea: siglasArea.trim() || undefined,
      i_CveContacto: contactoId > 0 ? contactoId : 0,
    });
    setGuardando(false);

    if (resultado.exito) {
      toast.success(areaEditar ? "Área actualizada correctamente." : "Área creada correctamente.");
      setAreaEditar(null);
      setNombreArea("");
      setSiglasArea("");
      setContactoId(0);
      cargarAreas();
      onActualizado();
    } else {
      toast.error(resultado.mensaje || "Ocurrió un error al guardar el área.");
    }
  };

  const handleEliminarArea = async () => {
    if (!areaEliminar) return;
    setEliminando(true);
    const ok = await CentrosTrabajoService.DeleteArea(areaEliminar.i_CveArea);
    setEliminando(false);
    setAreaEliminar(null);

    if (ok) {
      toast.success("Área eliminada exitosamente.");
      if (areaEditar?.i_CveArea === areaEliminar.i_CveArea) {
        handleCancelarEdicion();
      }
      cargarAreas();
      onActualizado();
    } else {
      toast.error("Ocurrió un error al eliminar el área.");
    }
  };

  const siglasCentroText = centro.v_Siglas || centro.s_Siglas;

  return createPortal(
    <div
      className="modal-overlay"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(15, 23, 42, 0.6)",
        backdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1100,
        padding: "16px",
      }}
    >
      <div
        className="modal-content no-scrollbar"
        style={{
          maxWidth: "650px",
          width: "100%",
          maxHeight: "90vh",
          backgroundColor: "#ffffff",
          borderRadius: "16px",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0, 0, 0, 0.05)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* Header del Modal */}
        <div
          className="modal-header shrink-0"
          style={{
            padding: "18px 24px",
            borderBottom: "1px solid #f1f5f9",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "#ffffff",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "10px",
                backgroundColor: "#f0f9ff",
                border: "1px solid #e0f2fe",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#0284c7",
              }}
            >
              <Layers size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: "15px", fontWeight: 600, color: "#0f172a", margin: 0, lineHeight: 1.2 }}>
                Administrar Áreas
              </h3>
              <p style={{ fontSize: "12px", color: "#64748b", margin: "2px 0 0 0", fontWeight: 400 }}>
                Registra y administra las áreas o departamentos de este centro de trabajo.
              </p>
            </div>
          </div>
          <button
            className="btn-icon"
            onClick={onCerrar}
            style={{
              padding: "6px",
              borderRadius: "50%",
              border: "none",
              background: "transparent",
              color: "#64748b",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            title="Cerrar"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body del Modal */}
        <div
          className="modal-body no-scrollbar"
          style={{
            padding: "24px",
            flex: 1,
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            gap: "20px",
          }}
        >
          {/* Info del Centro de Trabajo */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: "16px",
              paddingBottom: "16px",
              borderBottom: "1px solid #f1f5f9",
            }}
          >
            <div>
              <span style={{ fontSize: "11px", fontWeight: 400, color: "#64748b", display: "block", marginBottom: "2px" }}>
                centro de trabajo
              </span>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <Building2 size={15} style={{ color: "#0284c7" }} />
                <p style={{ fontSize: "13px", fontWeight: 600, color: "#0f172a", margin: 0, lineHeight: 1.3 }}>
                  {centro.v_NombrePlanta}
                </p>
              </div>
            </div>

            <div>
              <span style={{ fontSize: "11px", fontWeight: 400, color: "#64748b", display: "block", marginBottom: "2px" }}>
                siglas / clave
              </span>
              <p style={{ fontSize: "13px", fontWeight: 400, color: "#0f172a", margin: 0, lineHeight: 1.3 }}>
                {siglasCentroText ? <span className="font-mono text-slate-700">{siglasCentroText}</span> : "—"}
              </p>
            </div>
          </div>

          {/* Formulario Agregar / Editar Área */}
          <form
            onSubmit={handleGuardarArea}
            style={{
              padding: "16px",
              backgroundColor: "#f8fafc",
              border: "1px solid #e2e8f0",
              borderRadius: "12px",
              display: "flex",
              flexDirection: "column",
              gap: "12px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                {areaEditar ? (
                  <Edit2 size={14} style={{ color: "#0284c7" }} />
                ) : (
                  <Plus size={14} style={{ color: "#0284c7" }} />
                )}
                <span style={{ fontSize: "12px", fontWeight: 600, color: "#334155", textTransform: "uppercase", letterSpacing: "0.03em" }}>
                  {areaEditar ? `Editar área #${areaEditar.i_CveArea}` : "Agregar nueva área"}
                </span>
              </div>
              {areaEditar && (
                <button
                  type="button"
                  onClick={handleCancelarEdicion}
                  style={{ fontSize: "11px", color: "#64748b", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}
                >
                  Cancelar edición
                </button>
              )}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "10px" }}>
                <div>
                  <label style={{ fontSize: "11px", fontWeight: 500, color: "#475569", display: "block", marginBottom: "4px" }}>
                    Nombre del área <span style={{ color: "#ef4444" }}>*</span>
                  </label>
                  <input
                    type="text"
                    className="form-control text-xs"
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      borderRadius: "8px",
                      border: "1px solid #cbd5e1",
                      backgroundColor: "#ffffff",
                      fontSize: "13px",
                    }}
                    placeholder="Ej. Sala A - Capacitación, Bodega..."
                    value={nombreArea}
                    onChange={(e) => setNombreArea(e.target.value)}
                  />
                </div>

                <div>
                  <label style={{ fontSize: "11px", fontWeight: 500, color: "#475569", display: "block", marginBottom: "4px" }}>
                    Siglas del área
                  </label>
                  <input
                    type="text"
                    className="form-control text-xs uppercase font-mono"
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      borderRadius: "8px",
                      border: "1px solid #cbd5e1",
                      backgroundColor: "#ffffff",
                      fontSize: "13px",
                    }}
                    placeholder="Ej. CAP-A"
                    value={siglasArea}
                    onChange={(e) => setSiglasArea(e.target.value)}
                  />
                </div>
              </div>

              {/* Selector de Contacto de la Empresa */}
              <div>
                <label style={{ fontSize: "11px", fontWeight: 500, color: "#475569", display: "block", marginBottom: "4px" }}>
                  Contacto encargado (opcional)
                </label>
                <select
                  className="form-control text-xs"
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    backgroundColor: "#ffffff",
                    fontSize: "13px",
                  }}
                  value={contactoId}
                  onChange={(e) => setContactoId(Number(e.target.value))}
                >
                  <option value={0}>-- Sin contacto asignado --</option>
                  {contactosList.map((c) => (
                    <option key={c.i_CveContacto} value={c.i_CveContacto}>
                      {c.v_NombreContacto} {c.v_TipoContacto ? `(${c.v_TipoContacto})` : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "4px" }}>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{
                    padding: "8px 18px",
                    borderRadius: "8px",
                    fontSize: "13px",
                    fontWeight: 500,
                    whiteSpace: "nowrap",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    height: "36px",
                  }}
                  disabled={guardando || !nombreArea.trim()}
                >
                  {areaEditar ? <Check size={16} /> : <Plus size={16} />}
                  <span>{guardando ? "Guardando..." : areaEditar ? "Guardar Cambios" : "Agregar Área"}</span>
                </button>
              </div>
            </div>
          </form>

          {/* Listado de Áreas */}
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "12px", fontWeight: 600, color: "#334155" }}>
                  Áreas registradas
                </span>
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: 600,
                    backgroundColor: "#e0f2fe",
                    color: "#0369a1",
                    padding: "2px 8px",
                    borderRadius: "12px",
                  }}
                >
                  {areas.length}
                </span>
              </div>
              <button
                type="button"
                className="btn-icon"
                onClick={cargarAreas}
                disabled={cargando}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#64748b",
                  cursor: "pointer",
                  padding: "4px",
                  borderRadius: "4px",
                }}
                title="Recargar áreas"
              >
                <RefreshCw size={14} className={cargando ? "animate-spin" : ""} />
              </button>
            </div>

            {cargando ? (
              <div style={{ padding: "32px 0", textAlign: "center", color: "#64748b", fontSize: "12px" }}>
                <RefreshCw size={18} className="animate-spin mx-auto mb-2 text-primary" />
                <span>Cargando áreas...</span>
              </div>
            ) : areas.length === 0 ? (
              <div
                style={{
                  padding: "32px 16px",
                  textAlign: "center",
                  backgroundColor: "#f8fafc",
                  border: "1px dashed #cbd5e1",
                  borderRadius: "12px",
                }}
              >
                <Tag size={28} style={{ color: "#cbd5e1", margin: "0 auto 8px auto" }} />
                <p style={{ fontSize: "13px", fontWeight: 500, color: "#475569", margin: "0 0 2px 0" }}>
                  Este centro aún no tiene áreas registradas
                </p>
                <p style={{ fontSize: "12px", color: "#94a3b8", margin: 0 }}>
                  Usa el formulario de arriba para agregar la primera área.
                </p>
              </div>
            ) : (
              <div
                className="no-scrollbar"
                style={{
                  maxHeight: "260px",
                  overflowY: "auto",
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px",
                }}
              >
                {areas.map((area, idx) => {
                  const contactoAsignado = contactosList.find(
                    (c) => c.i_CveContacto === area.i_CveContacto
                  );

                  return (
                    <div
                      key={area.i_CveArea}
                      style={{
                        padding: "12px 16px",
                        backgroundColor: areaEditar?.i_CveArea === area.i_CveArea ? "#f0f9ff" : "#ffffff",
                        border: areaEditar?.i_CveArea === area.i_CveArea ? "1px solid #7dd3fc" : "1px solid #f1f5f9",
                        borderRadius: "10px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        transition: "all 0.15s ease",
                        boxShadow: "0 1px 2px rgba(0, 0, 0, 0.03)",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                        <p style={{ fontSize: "13px", fontWeight: 600, color: "#0f172a", margin: 0 }}>
                          {area.v_NombreArea}
                        </p>
                        {area.v_SiglasArea && (
                          <span style={{ fontSize: "11px", color: "#64748b", fontFamily: "monospace", backgroundColor: "#f1f5f9", padding: "1px 6px", borderRadius: "4px" }}>
                            {area.v_SiglasArea}
                          </span>
                        )}
                        {contactoAsignado && (
                          <span style={{ fontSize: "11px", color: "#0284c7", display: "inline-flex", alignItems: "center", gap: "3px", backgroundColor: "#f0f9ff", border: "1px solid #e0f2fe", padding: "1px 8px", borderRadius: "4px", fontWeight: 500 }}>
                            <User size={12} />
                            <span>{contactoAsignado.v_NombreContacto}</span>
                          </span>
                        )}
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                        <button
                          type="button"
                          className="btn-icon"
                          onClick={() => handleSeleccionarEditar(area)}
                          style={{
                            padding: "6px",
                            borderRadius: "6px",
                            border: "none",
                            backgroundColor: "transparent",
                            color: "#64748b",
                            cursor: "pointer",
                          }}
                          title="Editar área"
                        >
                          <Edit2 size={15} />
                        </button>

                        <button
                          type="button"
                          className="btn-icon danger"
                          onClick={() => setAreaEliminar(area)}
                          style={{
                            padding: "6px",
                            borderRadius: "6px",
                            border: "none",
                            backgroundColor: "#fef2f2",
                            color: "#ef4444",
                            cursor: "pointer",
                          }}
                          title="Eliminar área"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer del Modal */}
        <div
          className="modal-footer shrink-0"
          style={{
            padding: "16px 24px",
            borderTop: "1px solid #f1f5f9",
            background: "#f8fafc",
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            borderRadius: "0 0 16px 16px",
          }}
        >
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onCerrar}
            style={{
              padding: "8px 20px",
              borderRadius: "8px",
              fontSize: "13px",
              fontWeight: 500,
            }}
          >
            Cerrar
          </button>
        </div>
      </div>

      {/* Modal Confirmar Eliminar Área */}
      <ModalConfirmarEliminar
        abierto={!!areaEliminar}
        nombreElemento={areaEliminar?.v_NombreArea || "esta área"}
        onCerrar={() => setAreaEliminar(null)}
        onConfirmar={handleEliminarArea}
        cargando={eliminando}
      />
    </div>,
    document.body
  );
};
