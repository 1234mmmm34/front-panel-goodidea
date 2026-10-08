"use client";

import React, { useEffect, useState } from "react";
import { X, ExternalLink, Route, FolderTree, ArrowUpDown } from "lucide-react";
import { T_Rutas } from "@/types/rutas";
import { RutasService } from "@/services/rutas.service";
import { useToast } from "@/context/ToastContext";
import { useMenu } from "@/context/MenuContext";

interface Props {
  abierto: boolean;
  modo: "padre" | "hija";
  idPadre?: number; // Requerido cuando modo === "hija"
  siguienteOrden?: number;
  rutaEditar: T_Rutas | null;
  onCerrar: () => void;
  onGuardado: () => void;
}

export const ModalCrearEditarRuta: React.FC<Props> = ({
  abierto,
  modo,
  idPadre = 0,
  siguienteOrden = 1,
  rutaEditar,
  onCerrar,
  onGuardado,
}) => {
  const { toast } = useToast();
  const { refrescarMenu } = useMenu();
  const esEdicion = !!rutaEditar && rutaEditar.i_CveFuncionalidad > 0;

  // Form State
  const [v_NombreFuncionalidad, setV_NombreFuncionalidad] = useState<string>("");
  const [v_Icon, setV_Icon] = useState<string>("bi bi-folder");
  const [v_RutaFuncionalidad, setV_RutaFuncionalidad] = useState<string>("");
  const [i_Orden, setI_Orden] = useState<number | string>(siguienteOrden);

  // Validation state
  const [intentadoGuardar, setIntentadoGuardar] = useState<boolean>(false);
  const [guardando, setGuardando] = useState<boolean>(false);

  // Inicializar campos según modo y edición
  useEffect(() => {
    if (!abierto) {
      setV_NombreFuncionalidad("");
      setV_Icon("bi bi-folder");
      setV_RutaFuncionalidad("");
      setI_Orden(1);
      setIntentadoGuardar(false);
      return;
    }

    if (esEdicion && rutaEditar) {
      setV_NombreFuncionalidad(rutaEditar.v_NombreFuncionalidad || "");
      setV_Icon(rutaEditar.v_Icon || "bi bi-folder");
      setV_RutaFuncionalidad(rutaEditar.v_RutaFuncionalidad || "");
      setI_Orden(rutaEditar.i_Orden ?? 1);
    } else {
      setV_NombreFuncionalidad("");
      setV_Icon("bi bi-folder");
      setV_RutaFuncionalidad("");
      setI_Orden(siguienteOrden >= 1 ? siguienteOrden : 1);
    }
    setIntentadoGuardar(false);
  }, [abierto, esEdicion, rutaEditar, modo, siguienteOrden]);

  // Validaciones
  const ordenNum = Number(i_Orden);
  const errorNombre = intentadoGuardar && !v_NombreFuncionalidad.trim();
  const errorIcono = intentadoGuardar && modo === "padre" && !v_Icon.trim();
  const errorRuta = intentadoGuardar && modo === "hija" && !v_RutaFuncionalidad.trim();
  const errorOrden = intentadoGuardar && (!i_Orden || isNaN(ordenNum) || ordenNum < 1 || !Number.isInteger(ordenNum));

  // Título del modal
  const obtenerTitulo = () => {
    if (modo === "padre") {
      return esEdicion ? "Editar ruta padre" : "Agregar ruta padre";
    }
    return esEdicion ? "Editar ruta hija" : "Agregar ruta hija";
  };

  // Guardar
  const handleGuardar = async (e: React.FormEvent) => {
    e.preventDefault();
    setIntentadoGuardar(true);

    const nombreLimpio = v_NombreFuncionalidad.trim();
    if (!nombreLimpio) {
      toast.error("El nombre es obligatorio.");
      return;
    }
    if (nombreLimpio.length > 50) {
      toast.error("El nombre no puede exceder los 50 caracteres.");
      return;
    }

    if (modo === "padre") {
      const iconoLimpio = v_Icon.trim();
      if (!iconoLimpio) {
        toast.error("El ícono es obligatorio.");
        return;
      }
      if (iconoLimpio.length > 50) {
        toast.error("El ícono no puede exceder los 50 caracteres.");
        return;
      }
    }

    if (modo === "hija") {
      const rutaLimpia = v_RutaFuncionalidad.trim();
      if (!rutaLimpia) {
        toast.error("La ruta URL es obligatoria.");
        return;
      }
      if (rutaLimpia.length > 100) {
        toast.error("La ruta URL no puede exceder los 100 caracteres.");
        return;
      }
    }

    const valorOrden = Math.floor(Number(i_Orden));
    if (isNaN(valorOrden) || valorOrden < 1) {
      toast.error("El orden debe ser un número entero mayor o igual a 1.");
      return;
    }

    setGuardando(true);

    try {
      let payload: T_Rutas;

      if (modo === "padre") {
        payload = {
          i_CveFuncionalidad: esEdicion && rutaEditar ? rutaEditar.i_CveFuncionalidad : 0,
          v_NombreFuncionalidad: nombreLimpio,
          v_RutaFuncionalidad: "",
          i_SCveFuncionalidad: 0,
          v_Icon: v_Icon.trim(),
          i_Orden: valorOrden,
        };
      } else {
        payload = {
          i_CveFuncionalidad: esEdicion && rutaEditar ? rutaEditar.i_CveFuncionalidad : 0,
          v_NombreFuncionalidad: nombreLimpio,
          v_RutaFuncionalidad: v_RutaFuncionalidad.trim(),
          i_SCveFuncionalidad: esEdicion && rutaEditar ? rutaEditar.i_SCveFuncionalidad : idPadre,
          v_Icon: "",
          i_Orden: valorOrden,
        };
      }

      let res;
      if (esEdicion) {
        res = await RutasService.editarRuta(payload);
      } else {
        res = await RutasService.crearRuta(payload);
      }

      if (res.exito) {
        if (esEdicion) {
          toast.success("Ruta actualizada con éxito!");
        } else {
          toast.success("Ruta guardada con éxito!");
        }
        refrescarMenu(true);
        onGuardado();
        onCerrar();
      } else {
        toast.error(res.mensaje || "Ocurrió un error al procesar la ruta.");
      }
    } catch (err: any) {
      console.error("Error al guardar ruta:", err);
      toast.error(err?.message || "Ocurrió un error inesperado al guardar la ruta.");
    } finally {
      setGuardando(false);
    }
  };

  if (!abierto) return null;

  return (
    <div className="modal-overlay">
      <div
        className="modal-content"
        style={{
          maxWidth: "540px",
          width: "95%",
          borderRadius: "16px",
          overflow: "hidden",
        }}
      >
        {/* Header del Modal */}
        <div className="modal-header" style={{ padding: "16px 24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "10px",
                backgroundColor: esEdicion ? "rgba(30, 58, 95, 0.1)" : "rgba(43, 143, 204, 0.12)",
                color: esEdicion ? "#1e3a5f" : "#2B8FCC",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {modo === "padre" ? <FolderTree size={20} /> : <Route size={20} />}
            </div>
            <div>
              <h3 className="modal-title" style={{ fontSize: "16px", fontWeight: 700, margin: 0 }}>
                {obtenerTitulo()}
              </h3>
              <p style={{ fontSize: "12px", color: "#64748b", margin: 0 }}>
                {modo === "padre"
                  ? "Configura un grupo raíz del menú lateral, su ícono y su posición de orden."
                  : "Define la opción interna del menú, su ruta URL y su orden de aparición."}
              </p>
            </div>
          </div>

          <button
            type="button"
            className="btn-close"
            onClick={onCerrar}
            disabled={guardando}
            title="Cerrar"
          >
            <X size={18} />
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleGuardar} style={{ display: "flex", flexDirection: "column" }}>
          <div
            className="modal-body"
            style={{
              padding: "20px 24px",
              display: "flex",
              flexDirection: "column",
              gap: "16px",
            }}
          >
            {/* Campo: Nombre */}
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label" htmlFor="v_NombreFuncionalidad">
                {modo === "padre" ? "Nombre del módulo" : "Nombre de la funcionalidad"}{" "}
                <span style={{ color: "#dc3545" }}>*</span>
              </label>
              <input
                id="v_NombreFuncionalidad"
                type="text"
                className={`form-control ${errorNombre ? "is-invalid" : ""}`}
                placeholder={
                  modo === "padre"
                    ? "Ej. Catálogos, Configuración..."
                    : "Ej. Usuarios, Facturas, Agenda..."
                }
                value={v_NombreFuncionalidad}
                maxLength={50}
                onChange={(e) => setV_NombreFuncionalidad(e.target.value)}
                disabled={guardando}
                autoFocus
              />
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "11px",
                  color: errorNombre ? "#dc3545" : "#94a3b8",
                  marginTop: "4px",
                  padding: "0 4px",
                }}
              >
                <span>{errorNombre ? "Este campo es obligatorio" : "Obligatorio"}</span>
                <span>{v_NombreFuncionalidad.length}/50</span>
              </div>
            </div>

            {/* Modo Padre: Campo Ícono del menú */}
            {modo === "padre" && (
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" htmlFor="v_Icon">
                  Ícono del menú <span style={{ color: "#dc3545" }}>*</span>
                </label>

                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  {/* Vista previa del icono */}
                  <div
                    style={{
                      width: "36px",
                      height: "36px",
                      borderRadius: "8px",
                      backgroundColor: "#f1f5f9",
                      border: "1px solid #cbd5e1",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#2B8FCC",
                      fontSize: "18px",
                      flexShrink: 0,
                    }}
                    title="Vista previa del ícono"
                  >
                    <i className={v_Icon.trim() || "bi bi-folder"}></i>
                  </div>

                  {/* Input de clase del icono */}
                  <div style={{ flex: 1 }}>
                    <input
                      id="v_Icon"
                      type="text"
                      className={`form-control ${errorIcono ? "is-invalid" : ""}`}
                      placeholder="Ej. bi bi-gear, bi bi-folder, bi bi-people"
                      value={v_Icon}
                      maxLength={50}
                      onChange={(e) => setV_Icon(e.target.value)}
                      disabled={guardando}
                    />
                  </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    fontSize: "11px",
                    color: "#94a3b8",
                    marginTop: "6px",
                    padding: "0 4px",
                    flexWrap: "wrap",
                    gap: "4px",
                  }}
                >
                  <span style={{ color: "#64748b" }}>
                    Busca el icono ideal en el sitio oficial:{" "}
                    <a
                      href="https://icons.getbootstrap.com/"
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        color: "#2B8FCC",
                        fontWeight: 600,
                        textDecoration: "underline",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "3px",
                      }}
                    >
                      Bootstrap Icons <ExternalLink size={11} />
                    </a>
                  </span>
                  <span>{v_Icon.length}/50</span>
                </div>
              </div>
            )}

            {/* Modo Hija: Campo Ruta URL */}
            {modo === "hija" && (
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" htmlFor="v_RutaFuncionalidad">
                  Ruta URL del componente <span style={{ color: "#dc3545" }}>*</span>
                </label>
                <input
                  id="v_RutaFuncionalidad"
                  type="text"
                  className={`form-control ${errorRuta ? "is-invalid" : ""}`}
                  placeholder="Ej. /usuarios, /configuracion/perfil"
                  value={v_RutaFuncionalidad}
                  maxLength={100}
                  onChange={(e) => setV_RutaFuncionalidad(e.target.value)}
                  disabled={guardando}
                />
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: "11px",
                    color: errorRuta ? "#dc3545" : "#94a3b8",
                    marginTop: "4px",
                    padding: "0 4px",
                  }}
                >
                  <span>{errorRuta ? "Este campo es obligatorio" : "Obligatorio"}</span>
                  <span>{v_RutaFuncionalidad.length}/100</span>
                </div>
              </div>
            )}

            {/* Campo Orden (i_Orden) para ambos modos */}
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label" htmlFor="i_Orden">
                Orden <span style={{ color: "#dc3545" }}>*</span>
              </label>
              <input
                id="i_Orden"
                type="number"
                min={1}
                step={1}
                className={`form-control ${errorOrden ? "is-invalid" : ""}`}
                placeholder="Ej. 1, 2, 3..."
                value={i_Orden}
                onChange={(e) => setI_Orden(e.target.value === "" ? "" : Number(e.target.value))}
                disabled={guardando}
              />
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "11px",
                  color: errorOrden ? "#dc3545" : "#94a3b8",
                  marginTop: "4px",
                  padding: "0 4px",
                }}
              >
                <span>
                  {errorOrden
                    ? "Debe ser un número entero mayor o igual a 1"
                    : modo === "padre"
                    ? "Posición del grupo en el menú"
                    : "Posición de la opción dentro de su grupo"}
                </span>
              </div>
            </div>
          </div>

          {/* Footer del Modal */}
          <div className="modal-footer" style={{ padding: "14px 24px" }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onCerrar}
              disabled={guardando}
            >
              Cancelar
            </button>

            <button
              type="submit"
              className="btn"
              style={{
                backgroundColor: esEdicion ? "#1e3a5f" : "#2B8FCC",
                color: "#ffffff",
                border: "none",
                fontWeight: 600,
              }}
              disabled={guardando}
            >
              {guardando ? (
                <span>Guardando...</span>
              ) : esEdicion ? (
                <span>Guardar cambios</span>
              ) : (
                <span>Guardar</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
