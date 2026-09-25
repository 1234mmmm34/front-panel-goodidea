"use client";

import React, { useEffect, useState, useRef } from "react";
import {
  X,
  User,
  Loader2,
  AlertTriangle,
  IdCard,
  Phone,
  HeartPulse,
  MapPin,
  Camera,
  Search,
} from "lucide-react";
import {
  PersonalDetalleDto,
  PersonalGuardarDto,
  PersonalDomicilioDto,
} from "@/types/instructores";
import { PersonalService } from "@/services/personal.service";
import { EmpresasService } from "@/services/empresas.service";
import { ArchivosService } from "@/services/archivos.service";
import { useToast } from "@/context/ToastContext";
import { formatearFechaTexto } from "@/lib/date-utils";

interface Props {
  abierto: boolean;
  instructorEditarId: number | null;
  onCerrar: () => void;
  onGuardado: () => void;
}

const OPCIONES_SANGRE = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

function obtenerIniciales(nombre: string, apellidoPat?: string | null): string {
  const n = (nombre || "").trim();
  const a = (apellidoPat || "").trim();
  let inits = "";
  if (n) inits += n.charAt(0).toUpperCase();
  if (a) inits += a.charAt(0).toUpperCase();
  if (!inits && n) inits = n.substring(0, 2).toUpperCase();
  return inits || "P";
}

export const ModalCrearEditarPersonal: React.FC<Props> = ({
  abierto,
  instructorEditarId,
  onCerrar,
  onGuardado,
}) => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [cargandoDetalle, setCargandoDetalle] = useState<boolean>(false);
  const [guardando, setGuardando] = useState<boolean>(false);
  const [seIntentoGuardar, setSeIntentoGuardar] = useState<boolean>(false);

  // Header state
  const [bVencido, setBVencido] = useState<boolean>(false);
  const [fechaActualizacion, setFechaActualizacion] = useState<string | null>(null);

  // Foto state
  const [keyFoto, setKeyFoto] = useState<string | null>(null);
  const [archivoFoto, setArchivoFoto] = useState<File | null>(null);
  const [previewFotoUrl, setPreviewFotoUrl] = useState<string | null>(null);

  // Datos Generales
  const [nombre, setNombre] = useState<string>("");
  const [apellidoPat, setApellidoPat] = useState<string>("");
  const [apellidoMat, setApellidoMat] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [telPersonal, setTelPersonal] = useState<string>("");
  const [telTrabajo, setTelTrabajo] = useState<string>("");

  // Contacto de Emergencia
  const [nombreCEmergencia, setNombreCEmergencia] = useState<string>("");
  const [telCEmergencia, setTelCEmergencia] = useState<string>("");

  // Datos Médicos
  const [sangre, setSangre] = useState<string>("");
  const [alergias, setAlergias] = useState<string>("");

  // Domicilio
  const [cveDomicilio, setCveDomicilio] = useState<number>(0);
  const [codigoPostal, setCodigoPostal] = useState<string>("");
  const [buscandoCP, setBuscandoCP] = useState<boolean>(false);
  const [nombreEstado, setNombreEstado] = useState<string>("");
  const [vMunicipio, setVMunicipio] = useState<string>("");
  const [fraccionamiento, setFraccionamiento] = useState<string>("");
  const [nombreCalle, setNombreCalle] = useState<string>("");
  const [numeroExterior, setNumeroExterior] = useState<string>("");
  const [numeroInterior, setNumeroInterior] = useState<string>("");

  const esEdicion = Boolean(instructorEditarId && instructorEditarId > 0);

  // Cargar datos al abrir el modal
  useEffect(() => {
    if (!abierto) return;

    // Reset general
    setGuardando(false);
    setSeIntentoGuardar(false);
    setBVencido(false);
    setFechaActualizacion(null);
    setKeyFoto(null);
    setArchivoFoto(null);
    setPreviewFotoUrl(null);
    setNombre("");
    setApellidoPat("");
    setApellidoMat("");
    setEmail("");
    setTelPersonal("");
    setTelTrabajo("");
    setNombreCEmergencia("");
    setTelCEmergencia("");
    setSangre("");
    setAlergias("");
    setCveDomicilio(0);
    setCodigoPostal("");
    setNombreEstado("");
    setVMunicipio("");
    setFraccionamiento("");
    setNombreCalle("");
    setNumeroExterior("");
    setNumeroInterior("");

    if (instructorEditarId && instructorEditarId > 0) {
      setCargandoDetalle(true);
      PersonalService.getById(instructorEditarId)
        .then(async (detalle) => {
          if (!detalle) {
            toast.error("No se pudo cargar la información del personal.");
            onCerrar();
            return;
          }

          setBVencido(detalle.b_Vencido ?? false);
          setFechaActualizacion(detalle.d_FechaActualizacion || null);
          setKeyFoto(detalle.v_KeyFoto || null);
          setNombre(detalle.v_Nombre || "");
          setApellidoPat(detalle.v_ApellidoPat || "");
          setApellidoMat(detalle.v_ApellidoMat || "");
          setEmail(detalle.v_Email || "");
          setTelPersonal(detalle.v_TelPersonal || "");
          setTelTrabajo(detalle.v_TelTrabajo || "");
          setNombreCEmergencia(detalle.v_NombreCEmergencia || "");
          setTelCEmergencia(detalle.v_TelCEmergencia || "");
          setSangre(detalle.v_Sangre || "");
          setAlergias(detalle.v_Alergias || "");

          // Foto guardada previa
          if (detalle.v_KeyFoto && detalle.v_KeyFoto.trim()) {
            const tempUrl = await ArchivosService.obtenerUrlTemporal(detalle.v_KeyFoto.trim());
            if (tempUrl) setPreviewFotoUrl(tempUrl);
          }

          // Domicilio (la API responde en camelCase: domicilio o Domicilio)
          const d = detalle.domicilio || detalle.Domicilio;
          if (d) {
            setCveDomicilio(d.i_CveDomicilio || 0);
            setNombreCalle(d.v_NombreCalle || "");
            setNumeroInterior(d.v_NumeroInterior || "");
            setNumeroExterior(d.v_NumeroExterior || "");
            setFraccionamiento(d.v_Fraccionamiento || "");
            const cpStr = d.i_CodigoPostal ? String(d.i_CodigoPostal) : "";
            setCodigoPostal(cpStr);

            if (cpStr.length === 5) {
              // Búsqueda de CP para obtener Estado y Municipio
              EmpresasService.buscarCodigoPostal(cpStr).then((res) => {
                if (res && res.length > 0) {
                  const item = res[0];
                  setNombreEstado(item.estado || item.v_Ciudad || "");
                  setVMunicipio(item.v_Municipio || item.estado || "");
                }
              });
            }
          }
        })
        .finally(() => {
          setCargandoDetalle(false);
        });
    }
  }, [abierto, instructorEditarId]);

  if (!abierto) return null;

  // Búsqueda de CP
  const handleBuscarCP = async () => {
    const cpClean = codigoPostal.trim();
    if (!cpClean || cpClean.length !== 5) {
      toast.warning("Ingresa un Código Postal válido de 5 dígitos.");
      return;
    }
    setBuscandoCP(true);
    const res = await EmpresasService.buscarCodigoPostal(cpClean);
    setBuscandoCP(false);

    if (res && res.length > 0) {
      const item = res[0];
      setNombreEstado(item.estado || item.v_Ciudad || "");
      setVMunicipio(item.v_Municipio || item.estado || "");
      if (item.v_Asentamiento && !fraccionamiento) {
        setFraccionamiento(item.v_Asentamiento);
      }
      toast.success("Código postal localizado.");
    } else {
      toast.error("No se encontró información para el Código Postal ingresado.");
    }
  };

  // Manejo de la selección de foto
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar extensión
    const extPermitidas = ["jpg", "jpeg", "png", "webp"];
    const ext = file.name.split(".").pop()?.toLowerCase() || "";
    if (!extPermitidas.includes(ext)) {
      toast.error("Formato de imagen no permitido. Usa JPG, PNG o WEBP.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    // Validar tamaño (máximo 2 MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error("La imagen supera el tamaño máximo permitido de 2 MB.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setArchivoFoto(file);
    setPreviewFotoUrl(URL.createObjectURL(file));
  };

  // Validación de Domicilio
  const tieneCualquierCampoDomicilio = Boolean(
    (codigoPostal && codigoPostal.trim()) ||
    (nombreCalle && nombreCalle.trim()) ||
    (numeroExterior && numeroExterior.trim()) ||
    (numeroInterior && numeroInterior.trim()) ||
    (fraccionamiento && fraccionamiento.trim())
  );

  const cpInvalido = tieneCualquierCampoDomicilio && (!codigoPostal || codigoPostal.trim().length !== 5);
  const calleInvalida = tieneCualquierCampoDomicilio && (!nombreCalle || !nombreCalle.trim());

  // Validación del Formulario
  const esNombreInvalido = !nombre || !nombre.trim();
  const esTelPersonalInvalido = !telPersonal || telPersonal.trim().length !== 10;
  const esNombreCEmergenciaInvalido = !nombreCEmergencia || !nombreCEmergencia.trim();
  const esTelCEmergenciaInvalido = !telCEmergencia || telCEmergencia.trim().length !== 10;
  const esSangreInvalida = !sangre || sangre.trim() === "";

  const formularioValido =
    !esNombreInvalido &&
    !esTelPersonalInvalido &&
    !esNombreCEmergenciaInvalido &&
    !esTelCEmergenciaInvalido &&
    !esSangreInvalida &&
    !cpInvalido &&
    !calleInvalida;

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSeIntentoGuardar(true);

    if (!formularioValido) {
      toast.error("Completa los campos obligatorios antes de continuar.");
      return;
    }

    setGuardando(true);

    // Construir DTO de Domicilio si corresponde
    let domicilioDto: PersonalDomicilioDto | null = null;
    if (tieneCualquierCampoDomicilio) {
      domicilioDto = {
        i_CveDomicilio: cveDomicilio || 0,
        v_NombreCalle: nombreCalle.trim() || null,
        v_NumeroInterior: numeroInterior.trim() || null,
        v_NumeroExterior: numeroExterior.trim() || null,
        v_Fraccionamiento: fraccionamiento.trim() || null,
        i_CodigoPostal: parseInt(codigoPostal.trim(), 10) || 0,
      };
    }

    const payload: PersonalGuardarDto = {
      i_CveInstructor: esEdicion && instructorEditarId ? instructorEditarId : 0,
      v_Nombre: nombre.trim(),
      v_ApellidoPat: apellidoPat.trim() || null,
      v_ApellidoMat: apellidoMat.trim() || null,
      v_Email: email.trim() || null,
      v_TelTrabajo: telTrabajo.trim() || null,
      v_TelPersonal: telPersonal.trim() || null,
      v_NombreCEmergencia: nombreCEmergencia.trim() || null,
      v_TelCEmergencia: telCEmergencia.trim() || null,
      v_Sangre: sangre || null,
      v_Alergias: alergias.trim() || null,
      Domicilio: domicilioDto,
    };

    // 1. Guardar Datos
    const res = esEdicion
      ? await PersonalService.actualizar(payload)
      : await PersonalService.crear(payload);

    if (!res.exito) {
      setGuardando(false);
      toast.error(res.mensaje || "Ocurrió un error al guardar los datos del personal.");
      return;
    }

    const newId = res.data?.i_CveInstructor || instructorEditarId || 0;

    // 2. Subir Foto si fue elegida
    if (archivoFoto && newId > 0) {
      const resFoto = await PersonalService.subirFoto(newId, archivoFoto);
      if (!resFoto.exito) {
        toast.warning("Datos guardados, pero no se pudo subir la foto.");
      }
    }

    setGuardando(false);
    toast.success(esEdicion ? "Personal actualizado exitosamente." : "Personal registrado exitosamente.");
    onGuardado();
    onCerrar();
  };

  const iniciales = obtenerIniciales(nombre, apellidoPat);

  return (
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
        zIndex: 1050,
        padding: "16px",
      }}
    >
      <div
        className="modal-content no-scrollbar"
        style={{
          maxWidth: "860px",
          width: "100%",
          maxHeight: "92vh",
          backgroundColor: "#ffffff",
          borderRadius: "16px",
          boxShadow: "0 25px 50px -12px rgba(15, 23, 42, 0.25)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          border: "1px solid #e2e8f0",
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
          <div>
            <h3 style={{ fontSize: "17px", fontWeight: 700, color: "#0f172a", margin: 0, lineHeight: 1.2 }}>
              {esEdicion ? "Editar personal" : "Nuevo personal"}
            </h3>

            {esEdicion && bVencido && (
              <div
                style={{
                  marginTop: "6px",
                  padding: "6px 12px",
                  backgroundColor: "#fffbeb",
                  border: "1px solid #fde68a",
                  borderRadius: "8px",
                  color: "#92400e",
                  fontSize: "12px",
                  fontWeight: 500,
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <AlertTriangle size={15} style={{ color: "#d97706", flexShrink: 0 }} />
                <span>
                  La información de este instructor está vencida. Revísala y guarda para renovarla por un año.
                </span>
              </div>
            )}

            {esEdicion && !bVencido && fechaActualizacion && (
              <p style={{ fontSize: "12px", color: "#64748b", margin: "4px 0 0 0" }}>
                Última actualización: {formatearFechaTexto(fechaActualizacion)}
              </p>
            )}
          </div>

          <button
            type="button"
            className="btn-icon"
            onClick={onCerrar}
            disabled={guardando}
            style={{
              padding: "6px",
              borderRadius: "50%",
              border: "none",
              background: "#f8fafc",
              color: "#64748b",
              cursor: "pointer",
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Body del Modal */}
        {cargandoDetalle ? (
          <div style={{ padding: "60px", textAlign: "center", color: "#64748b" }}>
            <Loader2 size={32} className="animate-spin" style={{ margin: "0 auto 12px" }} />
            <p style={{ fontSize: "13px", margin: 0 }}>Cargando información del personal...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden" }}>
            <div
              className="modal-body no-scrollbar"
              style={{
                padding: "24px",
                overflowY: "auto",
                flex: 1,
              }}
            >
              <div style={{ display: "flex", flexDirection: "row", gap: "28px", flexWrap: "wrap" }}>
                {/* Columna Izquierda: Foto */}
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px", width: "160px", margin: "0 auto" }}>
                  <div
                    style={{
                      width: "120px",
                      height: "120px",
                      borderRadius: "50%",
                      backgroundColor: "#f1f5f9",
                      border: "2px dashed #cbd5e1",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      overflow: "hidden",
                      position: "relative",
                      boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)",
                    }}
                  >
                    {previewFotoUrl ? (
                      <img
                        src={previewFotoUrl}
                        alt="Foto de perfil"
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                    ) : (
                      <div
                        style={{
                          width: "100%",
                          height: "100%",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          backgroundColor: "#e2e8f0",
                          color: "#475569",
                          fontSize: "36px",
                          fontWeight: 700,
                        }}
                      >
                        {iniciales}
                      </div>
                    )}
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".jpg,.jpeg,.png,.webp"
                    style={{ display: "none" }}
                    onChange={handleFileChange}
                  />

                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={guardando}
                    style={{
                      fontSize: "12px",
                      borderRadius: "20px",
                      padding: "4px 12px",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    <Camera size={14} />
                    {previewFotoUrl ? "Cambiar foto" : "Subir foto"}
                  </button>
                  <span style={{ fontSize: "11px", color: "#94a3b8", textAlign: "center" }}>
                    JPG, PNG o WEBP (máx. 2 MB)
                  </span>
                </div>

                {/* Columna Derecha: Formulario Seccionado */}
                <div style={{ flex: 1, minWidth: "280px", display: "flex", flexDirection: "column", gap: "24px" }}>
                  {/* SECCIÓN 1: Datos Generales */}
                  <div style={{ borderBottom: "1px solid #f1f5f9", paddingBottom: "18px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px", color: "#1e293b" }}>
                      <IdCard size={17} style={{ color: "#2B8FCC" }} />
                      <h4 style={{ fontSize: "14px", fontWeight: 700, margin: 0 }}>Datos generales</h4>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "12px" }}>
                      {/* Nombre(s) * */}
                      <div className="form-group mb-0" style={{ gridColumn: "1 / -1" }}>
                        <label className="form-label text-xs font-semibold text-slate-700">
                          Nombre(s) <span style={{ color: "#ef4444" }}>*</span>
                        </label>
                        <input
                          type="text"
                          maxLength={100}
                          className={`form-control text-xs ${seIntentoGuardar && esNombreInvalido ? "is-invalid" : ""}`}
                          style={{ height: "36px", borderRadius: "8px" }}
                          placeholder="Ej. Juan Carlos"
                          value={nombre}
                          onChange={(e) => setNombre(e.target.value)}
                          disabled={guardando}
                        />
                      </div>

                      {/* Apellido Paterno */}
                      <div className="form-group mb-0">
                        <label className="form-label text-xs font-semibold text-slate-700">Apellido paterno</label>
                        <input
                          type="text"
                          maxLength={100}
                          className="form-control text-xs"
                          style={{ height: "36px", borderRadius: "8px" }}
                          placeholder="Ej. Pérez"
                          value={apellidoPat}
                          onChange={(e) => setApellidoPat(e.target.value)}
                          disabled={guardando}
                        />
                      </div>

                      {/* Apellido Materno */}
                      <div className="form-group mb-0">
                        <label className="form-label text-xs font-semibold text-slate-700">Apellido materno</label>
                        <input
                          type="text"
                          maxLength={100}
                          className="form-control text-xs"
                          style={{ height: "36px", borderRadius: "8px" }}
                          placeholder="Ej. González"
                          value={apellidoMat}
                          onChange={(e) => setApellidoMat(e.target.value)}
                          disabled={guardando}
                        />
                      </div>

                      {/* Email */}
                      <div className="form-group mb-0" style={{ gridColumn: "1 / -1" }}>
                        <label className="form-label text-xs font-semibold text-slate-700">Email</label>
                        <input
                          type="email"
                          maxLength={150}
                          className="form-control text-xs"
                          style={{ height: "36px", borderRadius: "8px" }}
                          placeholder="Ej. personal@ejemplo.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          disabled={guardando}
                        />
                      </div>

                      {/* Teléfono Personal * */}
                      <div className="form-group mb-0">
                        <label className="form-label text-xs font-semibold text-slate-700">
                          Teléfono personal <span style={{ color: "#ef4444" }}>*</span>
                        </label>
                        <input
                          type="text"
                          maxLength={10}
                          className={`form-control text-xs ${seIntentoGuardar && esTelPersonalInvalido ? "is-invalid" : ""}`}
                          style={{ height: "36px", borderRadius: "8px" }}
                          placeholder="10 dígitos (Ej. 5512345678)"
                          value={telPersonal}
                          onChange={(e) => setTelPersonal(e.target.value.replace(/\D/g, ""))}
                          disabled={guardando}
                        />
                      </div>

                      {/* Teléfono de Trabajo */}
                      <div className="form-group mb-0">
                        <label className="form-label text-xs font-semibold text-slate-700">Teléfono de trabajo</label>
                        <input
                          type="text"
                          maxLength={10}
                          className="form-control text-xs"
                          style={{ height: "36px", borderRadius: "8px" }}
                          placeholder="10 dígitos (Opcional)"
                          value={telTrabajo}
                          onChange={(e) => setTelTrabajo(e.target.value.replace(/\D/g, ""))}
                          disabled={guardando}
                        />
                      </div>
                    </div>
                  </div>

                  {/* SECCIÓN 2: Contacto de Emergencia */}
                  <div style={{ borderBottom: "1px solid #f1f5f9", paddingBottom: "18px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px", color: "#1e293b" }}>
                      <Phone size={17} style={{ color: "#2B8FCC" }} />
                      <h4 style={{ fontSize: "14px", fontWeight: 700, margin: 0 }}>Contacto de emergencia</h4>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "12px" }}>
                      {/* Nombre Contacto * */}
                      <div className="form-group mb-0">
                        <label className="form-label text-xs font-semibold text-slate-700">
                          Nombre del contacto <span style={{ color: "#ef4444" }}>*</span>
                        </label>
                        <input
                          type="text"
                          maxLength={150}
                          className={`form-control text-xs ${seIntentoGuardar && esNombreCEmergenciaInvalido ? "is-invalid" : ""}`}
                          style={{ height: "36px", borderRadius: "8px" }}
                          placeholder="Ej. María González (Esposa)"
                          value={nombreCEmergencia}
                          onChange={(e) => setNombreCEmergencia(e.target.value)}
                          disabled={guardando}
                        />
                      </div>

                      {/* Teléfono Contacto * */}
                      <div className="form-group mb-0">
                        <label className="form-label text-xs font-semibold text-slate-700">
                          Teléfono del contacto <span style={{ color: "#ef4444" }}>*</span>
                        </label>
                        <input
                          type="text"
                          maxLength={10}
                          className={`form-control text-xs ${seIntentoGuardar && esTelCEmergenciaInvalido ? "is-invalid" : ""}`}
                          style={{ height: "36px", borderRadius: "8px" }}
                          placeholder="10 dígitos"
                          value={telCEmergencia}
                          onChange={(e) => setTelCEmergencia(e.target.value.replace(/\D/g, ""))}
                          disabled={guardando}
                        />
                      </div>
                    </div>
                  </div>

                  {/* SECCIÓN 3: Datos Médicos */}
                  <div style={{ borderBottom: "1px solid #f1f5f9", paddingBottom: "18px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px", color: "#1e293b" }}>
                      <HeartPulse size={17} style={{ color: "#2B8FCC" }} />
                      <h4 style={{ fontSize: "14px", fontWeight: 700, margin: 0 }}>Datos médicos</h4>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "12px" }}>
                      {/* Tipo de Sangre * */}
                      <div className="form-group mb-0">
                        <label className="form-label text-xs font-semibold text-slate-700">
                          Tipo de sangre <span style={{ color: "#ef4444" }}>*</span>
                        </label>
                        <select
                          className={`form-select text-xs ${seIntentoGuardar && esSangreInvalida ? "is-invalid" : ""}`}
                          style={{ height: "36px", borderRadius: "8px" }}
                          value={sangre}
                          onChange={(e) => setSangre(e.target.value)}
                          disabled={guardando}
                        >
                          <option value="">-- Seleccione --</option>
                          {OPCIONES_SANGRE.map((op) => (
                            <option key={op} value={op}>
                              {op}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Enfermedades conocidas */}
                      <div className="form-group mb-0" style={{ gridColumn: "1 / -1" }}>
                        <label className="form-label text-xs font-semibold text-slate-700">Enfermedades conocidas</label>
                        <textarea
                          maxLength={500}
                          className="form-control text-xs"
                          style={{ minHeight: "60px", borderRadius: "8px", padding: "8px 12px" }}
                          placeholder="Ninguna conocida"
                          value={alergias}
                          onChange={(e) => setAlergias(e.target.value)}
                          disabled={guardando}
                        />
                      </div>
                    </div>
                  </div>

                  {/* SECCIÓN 4: Domicilio (Opcional) */}
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px", color: "#1e293b" }}>
                      <MapPin size={17} style={{ color: "#2B8FCC" }} />
                      <h4 style={{ fontSize: "14px", fontWeight: 700, margin: 0 }}>
                        Domicilio <span style={{ fontSize: "11px", fontWeight: 400, color: "#64748b" }}>(Opcional)</span>
                      </h4>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "12px" }}>
                      {/* Código Postal */}
                      <div className="form-group mb-0" style={{ gridColumn: "1 / -1" }}>
                        <label className="form-label text-xs font-semibold text-slate-700">
                          Código postal {tieneCualquierCampoDomicilio && <span style={{ color: "#ef4444" }}>*</span>}
                        </label>
                        <div style={{ display: "flex", gap: "8px" }}>
                          <input
                            type="text"
                            maxLength={5}
                            className={`form-control text-xs ${seIntentoGuardar && cpInvalido ? "is-invalid" : ""}`}
                            style={{ height: "36px", borderRadius: "8px", maxWidth: "180px" }}
                            placeholder="5 dígitos"
                            value={codigoPostal}
                            onChange={(e) => setCodigoPostal(e.target.value.replace(/\D/g, ""))}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                handleBuscarCP();
                              }
                            }}
                            disabled={guardando || buscandoCP}
                          />
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            onClick={handleBuscarCP}
                            disabled={guardando || buscandoCP}
                            style={{ borderRadius: "8px", height: "36px", padding: "0 14px" }}
                          >
                            {buscandoCP ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
                            Buscar
                          </button>
                        </div>
                      </div>

                      {/* Estado (Deshabilitado) */}
                      <div className="form-group mb-0">
                        <label className="form-label text-xs font-semibold text-slate-700">Estado</label>
                        <input
                          type="text"
                          className="form-control text-xs"
                          style={{ height: "36px", borderRadius: "8px", backgroundColor: "#f8fafc" }}
                          value={nombreEstado}
                          disabled
                          placeholder="Autocompletado al buscar CP"
                        />
                      </div>

                      {/* Municipio (Deshabilitado) */}
                      <div className="form-group mb-0">
                        <label className="form-label text-xs font-semibold text-slate-700">Municipio</label>
                        <input
                          type="text"
                          className="form-control text-xs"
                          style={{ height: "36px", borderRadius: "8px", backgroundColor: "#f8fafc" }}
                          value={vMunicipio}
                          disabled
                          placeholder="Autocompletado al buscar CP"
                        />
                      </div>

                      {/* Fraccionamiento / Colonia */}
                      <div className="form-group mb-0" style={{ gridColumn: "1 / -1" }}>
                        <label className="form-label text-xs font-semibold text-slate-700">Fraccionamiento / Colonia</label>
                        <input
                          type="text"
                          maxLength={150}
                          className="form-control text-xs"
                          style={{ height: "36px", borderRadius: "8px" }}
                          placeholder="Ej. Fracc. Las Américas"
                          value={fraccionamiento}
                          onChange={(e) => setFraccionamiento(e.target.value)}
                          disabled={guardando}
                        />
                      </div>

                      {/* Calle */}
                      <div className="form-group mb-0" style={{ gridColumn: "1 / -1" }}>
                        <label className="form-label text-xs font-semibold text-slate-700">
                          Calle {tieneCualquierCampoDomicilio && <span style={{ color: "#ef4444" }}>*</span>}
                        </label>
                        <input
                          type="text"
                          maxLength={150}
                          className={`form-control text-xs ${seIntentoGuardar && calleInvalida ? "is-invalid" : ""}`}
                          style={{ height: "36px", borderRadius: "8px" }}
                          placeholder="Ej. Av. Universidad"
                          value={nombreCalle}
                          onChange={(e) => setNombreCalle(e.target.value)}
                          disabled={guardando}
                        />
                      </div>

                      {/* Núm. Exterior */}
                      <div className="form-group mb-0">
                        <label className="form-label text-xs font-semibold text-slate-700">Núm. exterior</label>
                        <input
                          type="text"
                          maxLength={30}
                          className="form-control text-xs"
                          style={{ height: "36px", borderRadius: "8px" }}
                          placeholder="Ej. 123"
                          value={numeroExterior}
                          onChange={(e) => setNumeroExterior(e.target.value)}
                          disabled={guardando}
                        />
                      </div>

                      {/* Núm. Interior */}
                      <div className="form-group mb-0">
                        <label className="form-label text-xs font-semibold text-slate-700">Núm. interior</label>
                        <input
                          type="text"
                          maxLength={30}
                          className="form-control text-xs"
                          style={{ height: "36px", borderRadius: "8px" }}
                          placeholder="Ej. Depto 4B"
                          value={numeroInterior}
                          onChange={(e) => setNumeroInterior(e.target.value)}
                          disabled={guardando}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer del Modal */}
            <div
              className="modal-footer shrink-0"
              style={{
                padding: "14px 24px",
                borderTop: "1px solid #f1f5f9",
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-end",
                gap: "10px",
                background: "#ffffff",
              }}
            >
              <button
                type="button"
                className="btn btn-outline"
                onClick={onCerrar}
                disabled={guardando}
                style={{
                  height: "36px",
                  padding: "0 18px",
                  fontSize: "13px",
                  fontWeight: 600,
                  borderRadius: "8px",
                  backgroundColor: "#ffffff",
                  borderColor: "#cbd5e1",
                  color: "#334155",
                }}
              >
                Cancelar
              </button>

              <button
                type="submit"
                className="btn"
                disabled={guardando}
                style={{
                  height: "36px",
                  padding: "0 22px",
                  fontSize: "13px",
                  fontWeight: 600,
                  borderRadius: "8px",
                  backgroundColor: esEdicion ? "#1e3a5f" : "#2B8FCC",
                  borderColor: esEdicion ? "#1e3a5f" : "#2B8FCC",
                  color: "#ffffff",
                }}
              >
                {guardando ? (
                  <>
                    <Loader2 size={15} className="animate-spin" />
                    Guardando...
                  </>
                ) : esEdicion ? (
                  "Guardar cambios"
                ) : (
                  "Guardar"
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
