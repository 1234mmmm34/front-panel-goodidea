"use client";

import React, { useEffect, useState } from "react";
import { X, UserPlus, Edit3, IdCard, Key, AlertCircle, RefreshCw } from "lucide-react";
import { Perfil, Tenant, Usuario } from "@/types/usuarios";
import { UsuariosService } from "@/services/usuarios.service";
import { obtenerSesionActual } from "@/lib/api-client";
import { useToast } from "@/context/ToastContext";

interface Props {
  abierto: boolean;
  usuarioEditar: Usuario | null;
  iCveTenantFiltro: number;
  onCerrar: () => void;
  onGuardado: () => void;
}

export const ModalCrearEditarUsuario: React.FC<Props> = ({
  abierto,
  usuarioEditar,
  iCveTenantFiltro,
  onCerrar,
  onGuardado,
}) => {
  const { toast } = useToast();
  const esEdicion = !!usuarioEditar && usuarioEditar.id > 0;

  // Listas de catálogo
  const [perfiles, setPerfiles] = useState<Perfil[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [cargandoCatalogos, setCargandoCatalogos] = useState<boolean>(false);
  const [guardando, setGuardando] = useState<boolean>(false);

  // Campos del formulario
  const [username, setUsername] = useState<string>("");
  const [vNombres, setVNombres] = useState<string>("");
  const [vApellidoPaterno, setVApellidoPaterno] = useState<string>("");
  const [vApellidoMaterno, setVApellidoMaterno] = useState<string>("");
  const [vEmail, setVEmail] = useState<string>("");
  const [vTelefono, setVTelefono] = useState<string>("");
  const [bActive, setBActive] = useState<boolean>(true);
  const [iCvePerfil, setICvePerfil] = useState<number>(0);
  const [iCveTenant, setICveTenant] = useState<number>(0);
  const [nombreTenantDeshabilitado, setNombreTenantDeshabilitado] = useState<string>("");

  // Errores de validación
  const [errores, setErrores] = useState<Record<string, boolean>>({});
  const [mensajeErrorGlobal, setMensajeErrorGlobal] = useState<string | null>(null);

  useEffect(() => {
    if (!abierto) return;

    const sesion = obtenerSesionActual();
    const idUsuarioSesion = sesion?.id_usuario ?? 0;
    const idTenantSesion = sesion?.id_tenant ?? 1;

    // Resetear formulario y errores
    setErrores({});
    setMensajeErrorGlobal(null);
    setGuardando(false);
    setCargandoCatalogos(true);

    const cargarDatosYCatalogos = async () => {
      // 1. Cargar Tenants para el selector (Agregar) o para buscar nombre (Editar)
      const listTenants = await UsuariosService.getTenants(idUsuarioSesion);
      setTenants(listTenants);

      let tenantParaPerfiles = idTenantSesion;
      if (esEdicion) {
        tenantParaPerfiles = iCveTenantFiltro > 0 ? iCveTenantFiltro : usuarioEditar?.i_CveTenant || idTenantSesion;
      }
      // 2. Cargar Perfiles
      // Regla Tenant: Editar usa tenant del filtro o del usuario. Agregar usa tenant de sesión.
      const listPerfiles = await UsuariosService.getPerfiles(tenantParaPerfiles);
      setPerfiles(listPerfiles);

      if (esEdicion && usuarioEditar) {
        // Cargar datos detallados del usuario si es necesario
        const tObj = listTenants.find((t) => t.i_CveTenant === tenantParaPerfiles);
        setNombreTenantDeshabilitado(tObj?.v_Nombre || usuarioEditar.i_CveTenant?.toString() || "Empresa");

        // Intentar obtener usuario completo desde endpoint
        const uDet = await UsuariosService.getUsuarioById(usuarioEditar.id, tenantParaPerfiles);
        const source = uDet || usuarioEditar;

        setUsername(source.username || "");
        setVNombres(source.v_Nombres || "");
        setVApellidoPaterno(source.v_ApellidoPaterno || "");
        setVApellidoMaterno(source.v_ApellidoMaterno || "");
        setVEmail(source.v_email || "");
        setVTelefono(source.v_telefono || "");
        setBActive(source.b_Active ?? true);
        setICvePerfil(source.i_CvePerfil ?? 0);
        setICveTenant(tenantParaPerfiles);
      } else {
        // Modo Agregar
        setUsername("");
        setVNombres("");
        setVApellidoPaterno("");
        setVApellidoMaterno("");
        setVEmail("");
        setVTelefono("");
        setBActive(true);
        setICvePerfil(0);
        setICveTenant(idTenantSesion > 0 ? idTenantSesion : (listTenants[0]?.i_CveTenant ?? 0));
        setNombreTenantDeshabilitado("");
      }

      setCargandoCatalogos(false);
    };

    cargarDatosYCatalogos();
  }, [abierto, usuarioEditar, esEdicion, iCveTenantFiltro]);

  if (!abierto) return null;

  const handleGuardar = async (e: React.FormEvent) => {
    e.preventDefault();
    setMensajeErrorGlobal(null);

    // Validación de campos obligatorios
    const errs: Record<string, boolean> = {};

    if (!username.trim()) errs.username = true;
    if (!vNombres.trim()) errs.vNombres = true;
    if (!vApellidoPaterno.trim()) errs.vApellidoPaterno = true;
    if (!vEmail.trim()) errs.vEmail = true;
    if (!vTelefono.trim()) errs.vTelefono = true;
    if (!iCvePerfil || iCvePerfil === 0) errs.iCvePerfil = true;
    if (!esEdicion && (!iCveTenant || iCveTenant === 0)) errs.iCveTenant = true;

    setErrores(errs);

    if (Object.keys(errs).length > 0) {
      setMensajeErrorGlobal("Completa los campos obligatorios antes de continuar.");
      return;
    }

    setGuardando(true);

    if (esEdicion && usuarioEditar) {
      const res = await UsuariosService.editarUsuario({
        id: usuarioEditar.id,
        username,
        v_email: vEmail,
        v_Nombres: vNombres,
        v_ApellidoPaterno: vApellidoPaterno,
        v_ApellidoMaterno: vApellidoMaterno || null,
        b_Active: bActive,
        v_telefono: vTelefono || null,
        i_CvePerfil: iCvePerfil,
        i_CveTenant: iCveTenant,
      });

      setGuardando(false);
      if (res.exito) {
        toast.success("¡Cambios guardados!");
        onGuardado();
        onCerrar();
      } else {
        toast.error(res.mensaje || "Error: correo ya asociado a una cuenta existente");
        setMensajeErrorGlobal(res.mensaje || "Error: correo ya asociado a una cuenta existente");
      }
    } else {
      const res = await UsuariosService.crearUsuario({
        username,
        v_email: vEmail,
        v_Nombres: vNombres,
        v_ApellidoPaterno: vApellidoPaterno,
        v_ApellidoMaterno: vApellidoMaterno || null,
        b_Active: bActive,
        v_telefono: vTelefono || null,
        i_CvePerfil: iCvePerfil,
        i_CveTenant: iCveTenant,
      });

      setGuardando(false);
      if (res.exito) {
        toast.success("¡Usuario agregado exitosamente!");
        onGuardado();
        onCerrar();
      } else {
        toast.error(res.mensaje || "Error: correo ya asociado a una cuenta existente");
        setMensajeErrorGlobal(res.mensaje || "Error: correo ya asociado a una cuenta existente");
      }
    }
  };

  return (
    <div className="modal-overlay">
      <div
        className="modal-content wide"
        style={{
          maxWidth: "800px",
          width: "95%",
          borderRadius: "16px",
          overflow: "hidden",
          boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
        }}
      >
        {/* Encabezado del Modal */}
        <div
          className="modal-header"
          style={{
            backgroundColor: "#f8fafc",
            borderBottom: "1px solid #e2e8f0",
            padding: "16px 24px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "10px",
                backgroundColor: esEdicion ? "#e0f2fe" : "#e0f2fe",
                color: esEdicion ? "#0369a1" : "#2B8FCC",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {esEdicion ? <Edit3 size={20} /> : <UserPlus size={20} />}
            </div>
            <div>
              <h3 className="modal-title" style={{ fontSize: "16px", fontWeight: 700, color: "#0f172a" }}>
                {esEdicion ? "Editar usuario" : "Agregar usuario"}
              </h3>
              <p style={{ fontSize: "12px", color: "#64748b", margin: 0 }}>
                {esEdicion
                  ? "Actualiza los datos del usuario."
                  : "Captura los datos para dar de alta un nuevo usuario."}
              </p>
            </div>
          </div>

          <button className="btn-icon" onClick={onCerrar} title="Cerrar modal">
            <X size={20} />
          </button>
        </div>

        {/* Cuerpo del Modal */}
        <form onSubmit={handleGuardar}>
          <div className="modal-body" style={{ padding: "24px" }}>
            {cargandoCatalogos ? (
              <div style={{ textAlign: "center", padding: "40px 0" }}>
                <RefreshCw size={24} className="animate-spin text-sky-600 mb-2 inline-block" />
                <p style={{ fontSize: "13px", color: "#64748b" }}>Cargando catálogo e información del usuario...</p>
              </div>
            ) : (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
                  gap: "20px",
                }}
              >
                {/* TARJETA 1: Datos generales */}
                <div
                  style={{
                    backgroundColor: "#ffffff",
                    border: "1px solid #e2e8f0",
                    borderRadius: "12px",
                    padding: "18px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "14px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", borderBottom: "1px solid #f1f5f9", paddingBottom: "10px", marginBottom: "4px" }}>
                    <IdCard size={18} style={{ color: "#2B8FCC" }} />
                    <span style={{ fontSize: "14px", fontWeight: 700, color: "#1e293b" }}>Datos generales</span>
                  </div>

                  {/* Usuario */}
                  <div>
                    <label className="form-label" style={{ fontSize: "12px", fontWeight: 600 }}>
                      Usuario <span style={{ color: "#dc3545" }}>*</span>
                    </label>
                    <input
                      type="text"
                      className={`form-control text-xs ${errores.username ? "border-red-500 bg-red-50" : ""}`}
                      style={{ borderRadius: "8px", height: "36px" }}
                      maxLength={50}
                      autoComplete="new-username"
                      placeholder="Nombre de usuario"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                    />
                  </div>

                  {/* Nombre(s) */}
                  <div>
                    <label className="form-label" style={{ fontSize: "12px", fontWeight: 600 }}>
                      Nombre(s) <span style={{ color: "#dc3545" }}>*</span>
                    </label>
                    <input
                      type="text"
                      className={`form-control text-xs ${errores.vNombres ? "border-red-500 bg-red-50" : ""}`}
                      style={{ borderRadius: "8px", height: "36px" }}
                      placeholder="Nombre(s)"
                      value={vNombres}
                      onChange={(e) => setVNombres(e.target.value)}
                    />
                  </div>

                  {/* Apellido paterno y materno */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                    <div>
                      <label className="form-label" style={{ fontSize: "12px", fontWeight: 600 }}>
                        Apellido paterno <span style={{ color: "#dc3545" }}>*</span>
                      </label>
                      <input
                        type="text"
                        className={`form-control text-xs ${errores.vApellidoPaterno ? "border-red-500 bg-red-50" : ""}`}
                        style={{ borderRadius: "8px", height: "36px" }}
                        placeholder="Paterno"
                        value={vApellidoPaterno}
                        onChange={(e) => setVApellidoPaterno(e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="form-label" style={{ fontSize: "12px", fontWeight: 600 }}>
                        Apellido materno
                      </label>
                      <input
                        type="text"
                        className="form-control text-xs"
                        style={{ borderRadius: "8px", height: "36px" }}
                        placeholder="Materno"
                        value={vApellidoMaterno}
                        onChange={(e) => setVApellidoMaterno(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div>
                    <label className="form-label" style={{ fontSize: "12px", fontWeight: 600 }}>
                      Email <span style={{ color: "#dc3545" }}>*</span>
                    </label>
                    <input
                      type="email"
                      className={`form-control text-xs ${errores.vEmail ? "border-red-500 bg-red-50" : ""}`}
                      style={{ borderRadius: "8px", height: "36px" }}
                      placeholder="correo@ejemplo.com"
                      value={vEmail}
                      onChange={(e) => setVEmail(e.target.value)}
                    />
                  </div>

                  {/* Teléfono */}
                  <div>
                    <label className="form-label" style={{ fontSize: "12px", fontWeight: 600 }}>
                      Teléfono <span style={{ color: "#dc3545" }}>*</span>
                    </label>
                    <input
                      type="text"
                      className={`form-control text-xs ${errores.vTelefono ? "border-red-500 bg-red-50" : ""}`}
                      style={{ borderRadius: "8px", height: "36px" }}
                      placeholder="Ej. 8112345678"
                      value={vTelefono}
                      onChange={(e) => setVTelefono(e.target.value)}
                    />
                  </div>

                  {/* Usuario activo */}
                  <div>
                    <label className="form-label" style={{ fontSize: "12px", fontWeight: 600 }}>
                      Estado del usuario
                    </label>
                    <select
                      className="form-select text-xs"
                      style={{ borderRadius: "8px", height: "36px" }}
                      value={bActive ? "1" : "0"}
                      onChange={(e) => setBActive(e.target.value === "1")}
                    >
                      <option value="1">Activo</option>
                      <option value="0">Inactivo</option>
                    </select>
                  </div>
                </div>

                {/* TARJETA 2: Acceso */}
                <div
                  style={{
                    backgroundColor: "#ffffff",
                    border: "1px solid #e2e8f0",
                    borderRadius: "12px",
                    padding: "18px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "14px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", borderBottom: "1px solid #f1f5f9", paddingBottom: "10px", marginBottom: "4px" }}>
                    <Key size={18} style={{ color: "#2B8FCC" }} />
                    <span style={{ fontSize: "14px", fontWeight: 700, color: "#1e293b" }}>Acceso</span>
                  </div>

                  {/* Tipo de usuario (Perfil) */}
                  <div>
                    <label className="form-label" style={{ fontSize: "12px", fontWeight: 600 }}>
                      Tipo de usuario <span style={{ color: "#dc3545" }}>*</span>
                    </label>
                    <select
                      className={`form-select text-xs ${errores.iCvePerfil ? "border-red-500 bg-red-50" : ""}`}
                      style={{ borderRadius: "8px", height: "36px" }}
                      value={iCvePerfil}
                      onChange={(e) => setICvePerfil(Number(e.target.value))}
                    >
                      <option value={0}>-- Seleccione un perfil --</option>
                      {perfiles.map((p) => (
                        <option key={p.i_CvePerfil} value={p.i_CvePerfil}>
                          {p.v_NombrePerfil || p.v_Descripcion}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Tenant */}
                  <div>
                    <label className="form-label" style={{ fontSize: "12px", fontWeight: 600 }}>
                      Empresa (Tenant) {!esEdicion && <span style={{ color: "#dc3545" }}>*</span>}
                    </label>
                    {esEdicion ? (
                      <input
                        type="text"
                        className="form-control text-xs bg-slate-100 text-slate-600"
                        style={{ borderRadius: "8px", height: "36px" }}
                        disabled
                        value={nombreTenantDeshabilitado}
                      />
                    ) : (
                      <select
                        className={`form-select text-xs ${errores.iCveTenant ? "border-red-500 bg-red-50" : ""}`}
                        style={{ borderRadius: "8px", height: "36px" }}
                        value={iCveTenant}
                        onChange={(e) => setICveTenant(Number(e.target.value))}
                      >
                        <option value={0}>-- Seleccione el tenant --</option>
                        {tenants.map((t) => (
                          <option key={t.i_CveTenant} value={t.i_CveTenant}>
                            {t.v_Nombre}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Mensaje de error general de validación o backend */}
            {mensajeErrorGlobal && (
              <div
                style={{
                  marginTop: "16px",
                  padding: "10px 14px",
                  borderRadius: "8px",
                  backgroundColor: "#fef2f2",
                  border: "1px solid #fecaca",
                  color: "#991b1b",
                  fontSize: "12px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <AlertCircle size={16} style={{ color: "#dc3545", flexShrink: 0 }} />
                <span>{mensajeErrorGlobal}</span>
              </div>
            )}
          </div>

          {/* Footer del Modal */}
          <div
            className="modal-footer"
            style={{
              backgroundColor: "#f8fafc",
              borderTop: "1px solid #e2e8f0",
              padding: "14px 24px",
              display: "flex",
              justifyContent: "flex-end",
              gap: "10px",
            }}
          >
            <button type="button" className="btn btn-secondary" onClick={onCerrar} disabled={guardando}>
              Cerrar
            </button>
            <button
              type="submit"
              className="btn"
              disabled={guardando || cargandoCatalogos}
              style={{
                backgroundColor: esEdicion ? "#1e3a5f" : "#2B8FCC",
                color: "#ffffff",
                fontWeight: 600,
                border: "none",
                padding: "8px 20px",
                borderRadius: "8px",
              }}
            >
              {guardando ? (
                <span className="flex items-center gap-2">
                  <RefreshCw size={14} className="animate-spin" /> Guardando...
                </span>
              ) : esEdicion ? (
                "Guardar cambios"
              ) : (
                "Guardar"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
