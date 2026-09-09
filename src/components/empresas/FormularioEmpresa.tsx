"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Building2,
  ChevronRight,
  UserCheck,
  Truck,
  FileText,
  MapPin,
  Search,
  Save,
  Check,
  Calendar,
  Users,
  Plus,
  Edit2,
  Trash2,
  AlertCircle,
  CheckCircle,
  Copy,
  Mail,
  X,
} from "lucide-react";
import { EmpresaGetDto, EmpresaPostPayload, PlantaGetDto, ContactoXEmpresa } from "@/types/empresas";
import { EmpresasService } from "@/services/empresas.service";
import { obtenerSesionActual } from "@/lib/api-client";
import { useToast } from "@/context/ToastContext";

interface Props {
  empresaEditar?: EmpresaGetDto | null;
}

function formatearTelefono(tel: string | null | undefined): string {
  if (!tel) return "";
  const cleaned = tel.replace(/\D/g, "");
  if (cleaned.length === 10) {
    return `${cleaned.slice(0, 2)} ${cleaned.slice(2, 6)} ${cleaned.slice(6)}`;
  }
  if (cleaned.length === 7) {
    return `${cleaned.slice(0, 3)} ${cleaned.slice(3)}`;
  }
  return tel;
}

function obtenerIniciales(nombre: string): string {
  if (!nombre) return "CO";
  const partes = nombre.trim().split(/\s+/).filter(Boolean);
  if (partes.length >= 2) {
    return (partes[0][0] + partes[1][0]).toUpperCase();
  }
  return nombre.slice(0, 2).toUpperCase();
}

export const FormularioEmpresa: React.FC<Props> = ({ empresaEditar }) => {
  const router = useRouter();
  const { toast } = useToast();
  const esEdicion = Boolean(empresaEditar && empresaEditar.iD_Empresa > 0);

  // Tipo Contacto Píldoras
  const [esCliente, setEsCliente] = useState<boolean>(true);
  const [esProveedor, setEsProveedor] = useState<boolean>(false);

  // Campos Generales
  const [razonSocial, setRazonSocial] = useState<string>("");
  const [registroPatronal, setRegistroPatronal] = useState<string>("");
  const [representanteLegal, setRepresentanteLegal] = useState<string>("");
  const [giroActividad, setGiroActividad] = useState<string>("");
  const [rfc, setRfc] = useState<string>("");
  const [diasCredito, setDiasCredito] = useState<string>("0");
  const [estatus, setEstatus] = useState<"Activo" | "Inactivo">("Activo");

  // Domicilio
  const [codigoPostal, setCodigoPostal] = useState<string>("");
  const [estado, setEstado] = useState<string>("");
  const [municipio, setMunicipio] = useState<string>("");
  const [fraccionamiento, setFraccionamiento] = useState<string>("");
  const [nombreCalle, setNombreCalle] = useState<string>("");
  const [numeroInterior, setNumeroInterior] = useState<string>("");
  const [numeroExterior, setNumeroExterior] = useState<string>("");

  // Búsqueda de CP
  const [buscandoCP, setBuscandoCP] = useState<boolean>(false);

  // Validación y Envío
  const [showErrors, setShowErrors] = useState<boolean>(false);
  const [guardando, setGuardando] = useState<boolean>(false);

  // Card 5 — Calendario de capacitaciones (solo modo editar)
  const [plantas, setPlantas] = useState<PlantaGetDto[]>([]);
  const [plantaSeleccionada, setPlantaSeleccionada] = useState<string>("");
  const [generandoLink, setGenerandoLink] = useState<boolean>(false);
  const [linkGenerado, setLinkGenerado] = useState<string | null>(null);
  const [copiadoFeedback, setCopiadoFeedback] = useState<boolean>(false);
  const [contactoEmailSeleccionado, setContactoEmailSeleccionado] = useState<string>("");
  const [enviandoCorreo, setEnviandoCorreo] = useState<boolean>(false);
  const [mensajeCorreoStatus, setMensajeCorreoStatus] = useState<{ tipo: "exito" | "error"; texto: string } | null>(null);

  // Card 6 — Contactos (solo modo editar)
  const [contactos, setContactos] = useState<ContactoXEmpresa[]>([]);
  const [modalContactoAbierto, setModalContactoAbierto] = useState<boolean>(false);
  const [contactoEditar, setContactoEditar] = useState<ContactoXEmpresa | null>(null);
  const [contactoAEliminar, setContactoAEliminar] = useState<ContactoXEmpresa | null>(null);

  // Formulario modal contacto
  const [cIdContacto, setCIdContacto] = useState<number>(0);
  const [cNombre, setCNombre] = useState<string>("");
  const [cCelular, setCCelular] = useState<string>("");
  const [cTelefono, setCTelefono] = useState<string>("");
  const [cEmail, setCEmail] = useState<string>("");
  const [cPuesto, setCPuesto] = useState<string>("");
  const [errNombreContacto, setErrNombreContacto] = useState<boolean>(false);

  const cargarContactos = async (idEmpresa: number) => {
    const res = await EmpresasService.getContactos(idEmpresa);
    setContactos(res || []);
  };

  useEffect(() => {
    if (empresaEditar && empresaEditar.iD_Empresa > 0) {
      setRazonSocial(empresaEditar.s_RazonSocial || "");
      setRegistroPatronal(empresaEditar.s_RegistroPatronal || "");
      setRepresentanteLegal(empresaEditar.s_RepresentanteLegal || "");
      setGiroActividad(empresaEditar.s_GiroActividad || "");
      setRfc(empresaEditar.s_RFC || "");
      setDiasCredito(String(empresaEditar.d_DiasCredito ?? 0));
      setEstatus(empresaEditar.d_FechaBaja ? "Inactivo" : "Activo");

      setCodigoPostal(empresaEditar.i_CodigoPostal ? String(empresaEditar.i_CodigoPostal) : "");
      setEstado(empresaEditar.v_NombreEstado || "");
      setMunicipio(empresaEditar.v_Municipio || "");
      setFraccionamiento(empresaEditar.v_Fraccionamiento || "");
      setNombreCalle(empresaEditar.v_NombreCalle || "");
      setNumeroInterior(empresaEditar.v_NumeroInterior || "");
      setNumeroExterior(empresaEditar.v_NumeroExterior || "");

      const tc = empresaEditar.i_TipoContacto;
      if (tc === 1) {
        setEsCliente(false);
        setEsProveedor(true);
      } else {
        setEsCliente(true);
        setEsProveedor(false);
      }

      // 1.1 Cargar plantas de la empresa
      EmpresasService.getPlantas(empresaEditar.iD_Empresa).then((res) => {
        setPlantas(res || []);
      });

      // 2.1 Cargar contactos de la empresa
      cargarContactos(empresaEditar.iD_Empresa);
    }
  }, [empresaEditar]);

  // Selección única de Tipo de Contacto (Cliente o Proveedor)
  const seleccionarTipoContacto = (tipo: "cliente" | "proveedor") => {
    if (tipo === "cliente") {
      setEsCliente(true);
      setEsProveedor(false);
    } else {
      setEsCliente(false);
      setEsProveedor(true);
    }
  };

  const handleBuscarCP = async () => {
    if (!codigoPostal || codigoPostal.trim().length === 0) return;
    setBuscandoCP(true);
    const res = await EmpresasService.buscarCodigoPostal(codigoPostal.trim());
    setBuscandoCP(false);

    if (res && res.length > 0) {
      setEstado(res[0].estado || "");
      setMunicipio(res[0].v_Municipio || "");
      if (res[0].v_Asentamiento && !fraccionamiento) {
        setFraccionamiento(res[0].v_Asentamiento);
      }
    } else {
      toast.warning("No se encontró información para el Código Postal ingresado.");
    }
  };

  // Validaciones visuales (showErrors === true)
  const esRazonInvalida = showErrors && !razonSocial.trim();
  const esPatronalInvalido = showErrors && !registroPatronal.trim();
  const esRepresentanteInvalido = showErrors && !representanteLegal.trim();
  const esGiroInvalido = showErrors && !giroActividad.trim();
  const esRfcInvalido = showErrors && !rfc.trim();
  const esDiasCreditoInvalido = showErrors && (diasCredito === "" || isNaN(Number(diasCredito)));
  const esCPInvalido = showErrors && (!codigoPostal.trim() || isNaN(Number(codigoPostal)));
  const esFraccionamientoInvalido = showErrors && !fraccionamiento.trim();
  const esCalleInvalida = showErrors && !nombreCalle.trim();
  const esNumExtInvalido = showErrors && !numeroExterior.trim();
  const esTipoContactoInvalido = showErrors && !esCliente && !esProveedor;

  const calcularErrores = () => {
    let count = 0;
    if (!razonSocial.trim()) count++;
    if (!registroPatronal.trim()) count++;
    if (!representanteLegal.trim()) count++;
    if (!giroActividad.trim()) count++;
    if (!rfc.trim()) count++;
    if (diasCredito === "" || isNaN(Number(diasCredito))) count++;
    if (!codigoPostal.trim() || isNaN(Number(codigoPostal))) count++;
    if (!fraccionamiento.trim()) count++;
    if (!nombreCalle.trim()) count++;
    if (!numeroExterior.trim()) count++;
    if (!esCliente && !esProveedor) count++;
    return count;
  };

  const handleGuardar = async (e: React.FormEvent) => {
    e.preventDefault();
    setShowErrors(true);

    if (calcularErrores() > 0) return;

    setGuardando(true);

    const sesion = await obtenerSesionActual();
    const tenantId = sesion?.id_tenant ?? 1;

    const tipoContacto = esProveedor ? 1 : 0;

    const fechaBaja = estatus === "Inactivo" ? new Date().toISOString() : null;

    const payload: EmpresaPostPayload = {
      ID_Empresa: empresaEditar?.iD_Empresa,
      d_FechaAlta: empresaEditar?.d_FechaAlta || new Date().toISOString(),
      d_FechaBaja: fechaBaja,
      s_RazonSocial: razonSocial.trim(),
      s_RegistroPatronal: registroPatronal.trim(),
      s_RepresentanteLegal: representanteLegal.trim(),
      s_RFC: rfc.trim(),
      d_DiasCredito: diasCredito.trim() || "0",
      s_GiroActividad: giroActividad.trim(),
      i_TipoDomicilio: 1,
      v_NombreCalle: nombreCalle.trim(),
      v_NumeroInterior: numeroInterior.trim(),
      v_NumeroExterior: numeroExterior.trim(),
      v_Fraccionamiento: fraccionamiento.trim(),
      i_TipoContacto: tipoContacto,
      i_CodigoPostal: Number(codigoPostal),
      i_CveTenant: tenantId,
    };

    let exito = false;
    if (esEdicion) {
      exito = await EmpresasService.editar(payload);
    } else {
      exito = await EmpresasService.crear(payload);
    }

    setGuardando(false);

    if (exito) {
      toast.success(esEdicion ? "Empresa actualizada exitosamente" : "Empresa guardada exitosamente");
      router.push("/empresas");
    } else {
      toast.error("Ocurrió un error al guardar los datos de la empresa.");
    }
  };

  // Card 5 — Generación de Link de Capacitaciones
  const handleGenerarLink = async () => {
    const idPlanta = Number(plantaSeleccionada);
    if (!idPlanta || idPlanta === 0) {
      toast.warning("Selecciona una planta");
      return;
    }
    setGenerandoLink(true);
    setMensajeCorreoStatus(null);
    const link = await EmpresasService.generarLinkAgenda(empresaEditar!.iD_Empresa, idPlanta);
    setGenerandoLink(false);

    if (link) {
      setLinkGenerado(link);
      toast.success("Link del calendario generado exitosamente");
    } else {
      toast.error("Error al generar el link");
    }
  };

  const handleCopiarLink = () => {
    if (!linkGenerado) return;
    navigator.clipboard.writeText(linkGenerado);
    setCopiadoFeedback(true);
    toast.info("Link copiado al portapapeles");
    setTimeout(() => setCopiadoFeedback(false), 3000);
  };

  const handleEnviarCorreo = async () => {
    setMensajeCorreoStatus(null);
    const idContactoSel = Number(contactoEmailSeleccionado);
    if (!idContactoSel) {
      setMensajeCorreoStatus({ tipo: "error", texto: "Selecciona un contacto" });
      return;
    }
    if (!linkGenerado) {
      setMensajeCorreoStatus({ tipo: "error", texto: "Primero genera el link del calendario" });
      return;
    }
    const contactoSel = contactos.find((c) => c.i_CveContacto === idContactoSel);
    if (!contactoSel || !contactoSel.v_Email) {
      setMensajeCorreoStatus({ tipo: "error", texto: "El contacto seleccionado no tiene un correo válido" });
      return;
    }

    setEnviandoCorreo(true);
    const exito = await EmpresasService.enviarCorreoCalendario({
      CorreoDestino: contactoSel.v_Email,
      NombreDestino: contactoSel.v_NombreContacto,
      LinkCalendario: linkGenerado,
    });
    setEnviandoCorreo(false);

    if (exito) {
      setMensajeCorreoStatus({ tipo: "exito", texto: "Correo enviado correctamente" });
      toast.success("Correo con link enviado exitosamente");
    } else {
      setMensajeCorreoStatus({ tipo: "error", texto: "Error al enviar el correo" });
      toast.error("Error al enviar el correo");
    }
  };

  // Card 6 — Gestión de Contactos Modal
  const abrirModalContacto = async (c?: ContactoXEmpresa | null) => {
    setErrNombreContacto(false);
    if (c && c.i_CveContacto > 0) {
      const detalle = await EmpresasService.getContactoById(c.i_CveContacto);
      const item = detalle || c;
      setContactoEditar(item);
      setCIdContacto(item.i_CveContacto);
      setCNombre(item.v_NombreContacto || "");
      setCCelular(item.v_Celular || "");
      setCTelefono(item.v_TelefonoFijo || "");
      setCEmail(item.v_Email || "");
      setCPuesto(item.v_TipoContacto || "");
    } else {
      setContactoEditar(null);
      setCIdContacto(0);
      setCNombre("");
      setCCelular("");
      setCTelefono("");
      setCEmail("");
      setCPuesto("");
    }
    setModalContactoAbierto(true);
  };

  const guardarContacto = async () => {
    if (!cNombre.trim()) {
      setErrNombreContacto(true);
      return;
    }

    const payload: Partial<ContactoXEmpresa> = {
      i_CveContacto: cIdContacto,
      i_CveEmpresa: empresaEditar?.iD_Empresa || 0,
      v_TipoContacto: cPuesto.trim(),
      v_NombreContacto: cNombre.trim(),
      v_Celular: cCelular.trim(),
      v_Email: cEmail.trim(),
      v_TelefonoFijo: cTelefono.trim(),
      v_SiglasTipoContacto: "",
      v_Descripcion: "",
    };

    let exito = false;
    if (cIdContacto > 0) {
      exito = await EmpresasService.editarContacto(payload);
    } else {
      exito = await EmpresasService.crearContacto(payload);
    }

    if (exito) {
      setModalContactoAbierto(false);
      toast.success(cIdContacto > 0 ? "Contacto actualizado exitosamente" : "Contacto guardado exitosamente");
      if (empresaEditar?.iD_Empresa) {
        await cargarContactos(empresaEditar.iD_Empresa);
      }
    } else {
      toast.error("Error al guardar el contacto");
    }
  };

  const confirmarEliminarContacto = async () => {
    if (!contactoAEliminar) return;
    const exito = await EmpresasService.eliminarContacto(contactoAEliminar.i_CveContacto);
    setContactoAEliminar(null);
    if (exito) {
      toast.success("Contacto eliminado exitosamente");
      if (empresaEditar?.iD_Empresa) {
        await cargarContactos(empresaEditar.iD_Empresa);
      }
    } else {
      toast.error("Error al eliminar el contacto");
    }
  };

  const contactosConEmail = contactos.filter((c) => Boolean(c.v_Email && c.v_Email.trim()));

  return (
    <div style={{ maxWidth: "920px", margin: "0 auto", width: "100%", paddingBottom: "40px" }}>
      {/* 2. BREADCRUMB */}
      <div style={{ fontSize: "12px", color: "#7a96b0", display: "flex", alignItems: "center", gap: "6px", marginBottom: "14px" }}>
        <Link href="/empresas" style={{ color: "#2B8FCC", textDecoration: "none" }}>
          Empresas
        </Link>
        <ChevronRight size={14} style={{ color: "#b5cfe8" }} />
        <span>{esEdicion ? (empresaEditar?.s_RazonSocial || "Editar empresa") : "Agregar empresa"}</span>
      </div>

      {/* 3. ENCABEZADO DE SECCIÓN */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: "10px", marginBottom: "20px" }}>
        <Building2 size={20} style={{ color: "#6c757d", marginTop: "2px", flexShrink: 0 }} />
        <div>
          <h4 style={{ fontSize: "18px", fontWeight: 700, color: "#1e3a5f", margin: 0, lineHeight: 1.2 }}>
            {esEdicion ? (empresaEditar?.s_RazonSocial || "Editar empresa") : "Nueva empresa"}
          </h4>
          <p style={{ fontSize: "13px", color: "#6c757d", margin: "4px 0 0 0" }}>
            {esEdicion
              ? "Actualiza la información general y domicilio de la empresa."
              : "Captura los datos generales y domicilio de la nueva empresa."}
          </p>
        </div>
      </div>

      {/* 4. CARD PRINCIPAL DEL FORMULARIO */}
      <form onSubmit={handleGuardar}>
        <div
          style={{
            backgroundColor: "#ffffff",
            width: "100%",
            padding: "22px 24px",
            borderRadius: "12px",
            border: "1px solid #d8e6f0",
            boxShadow: "0 1px 3px rgba(0, 0, 0, 0.03)",
          }}
        >
          {/* 4.1 Tipo de contacto (bloque superior fuera de 2 columnas) */}
          <div style={{ marginBottom: "22px" }}>
            <label style={{ fontSize: "12px", fontWeight: 600, color: "#4a6580", display: "block", marginBottom: "8px" }}>
              Tipo de contacto <span style={{ color: "#2B8FCC" }}>*</span>
            </label>

            <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
              <button
                type="button"
                onClick={() => seleccionarTipoContacto("cliente")}
                style={{
                  height: "36px",
                  padding: "0 18px",
                  borderRadius: "20px",
                  border: esCliente ? "1px solid #2B8FCC" : "1px solid #b5cfe8",
                  backgroundColor: esCliente ? "#2B8FCC" : "#f4f8fc",
                  color: esCliente ? "#ffffff" : "#4a6580",
                  fontSize: "13px",
                  fontWeight: 500,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  transition: "all 0.2s ease",
                }}
              >
                <UserCheck size={16} />
                <span>Cliente</span>
              </button>

              <button
                type="button"
                onClick={() => seleccionarTipoContacto("proveedor")}
                style={{
                  height: "36px",
                  padding: "0 18px",
                  borderRadius: "20px",
                  border: esProveedor ? "1px solid #2B8FCC" : "1px solid #b5cfe8",
                  backgroundColor: esProveedor ? "#2B8FCC" : "#f4f8fc",
                  color: esProveedor ? "#ffffff" : "#4a6580",
                  fontSize: "13px",
                  fontWeight: 500,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  transition: "all 0.2s ease",
                }}
              >
                <Truck size={16} />
                <span>Proveedor</span>
              </button>
            </div>

            {esTipoContactoInvalido && (
              <div style={{ color: "#dc3545", fontSize: "12px", display: "flex", alignItems: "center", gap: "4px", marginTop: "6px" }}>
                <AlertCircle size={14} />
                <span>Debes seleccionar al menos un tipo de contacto.</span>
              </div>
            )}
          </div>

          {/* 4.2 Dos columnas 50/50 igualadas */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(380px, 1fr))", gap: "16px", alignItems: "stretch" }}>
            {/* COLUMNA IZQUIERDA — Datos generales */}
            <div
              style={{
                backgroundColor: "#ffffff",
                border: "1px solid #d8e6f0",
                borderRadius: "12px",
                padding: "20px 22px",
                display: "flex",
                flexDirection: "column",
                gap: "14px",
              }}
            >
              <h5
                style={{
                  fontSize: "13px",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                  color: "#1e3a5f",
                  borderBottom: "1px solid #ddeaf5",
                  paddingBottom: "8px",
                  margin: "0 0 4px 0",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <FileText size={16} style={{ color: "#2B8FCC" }} />
                Datos generales
              </h5>

              {/* 1. Razón Social */}
              <div>
                <label style={{ fontSize: "11px", fontWeight: 600, color: "#4a6580", display: "block", marginBottom: "4px" }}>
                  Razón social <span style={{ color: "#2B8FCC" }}>*</span>
                </label>
                <input
                  type="text"
                  maxLength={50}
                  className={`form-control ${esRazonInvalida ? "is-invalid" : ""}`}
                  style={{ width: "100%", borderRadius: "8px", height: "36px", border: esRazonInvalida ? "1px solid #dc3545" : "1px solid #d0dce8" }}
                  placeholder="Ej. Industrias STPS S.A. de C.V."
                  value={razonSocial}
                  onChange={(e) => setRazonSocial(e.target.value)}
                />
              </div>

              {/* 2. Registro Patronal */}
              <div>
                <label style={{ fontSize: "11px", fontWeight: 600, color: "#4a6580", display: "block", marginBottom: "4px" }}>
                  Registro patronal <span style={{ color: "#2B8FCC" }}>*</span>
                </label>
                <input
                  type="text"
                  maxLength={11}
                  className={`form-control ${esPatronalInvalido ? "is-invalid" : ""}`}
                  style={{ width: "100%", borderRadius: "8px", height: "36px", border: esPatronalInvalido ? "1px solid #dc3545" : "1px solid #d0dce8" }}
                  placeholder="Ej. A1234567890"
                  value={registroPatronal}
                  onChange={(e) => setRegistroPatronal(e.target.value)}
                />
              </div>

              {/* 3. Representante Legal */}
              <div>
                <label style={{ fontSize: "11px", fontWeight: 600, color: "#4a6580", display: "block", marginBottom: "4px" }}>
                  Representante legal <span style={{ color: "#2B8FCC" }}>*</span>
                </label>
                <input
                  type="text"
                  maxLength={50}
                  className={`form-control ${esRepresentanteInvalido ? "is-invalid" : ""}`}
                  style={{ width: "100%", borderRadius: "8px", height: "36px", border: esRepresentanteInvalido ? "1px solid #dc3545" : "1px solid #d0dce8" }}
                  placeholder="Ej. Lic. Juan Pérez"
                  value={representanteLegal}
                  onChange={(e) => setRepresentanteLegal(e.target.value)}
                />
              </div>

              {/* 4. Giro de la actividad */}
              <div>
                <label style={{ fontSize: "11px", fontWeight: 600, color: "#4a6580", display: "block", marginBottom: "4px" }}>
                  Giro de la actividad <span style={{ color: "#2B8FCC" }}>*</span>
                </label>
                <input
                  type="text"
                  maxLength={50}
                  className={`form-control ${esGiroInvalido ? "is-invalid" : ""}`}
                  style={{ width: "100%", borderRadius: "8px", height: "36px", border: esGiroInvalido ? "1px solid #dc3545" : "1px solid #d0dce8" }}
                  placeholder="Ej. Manufactura"
                  value={giroActividad}
                  onChange={(e) => setGiroActividad(e.target.value)}
                />
              </div>

              {/* 5. RFC | Días de crédito */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ fontSize: "11px", fontWeight: 600, color: "#4a6580", display: "block", marginBottom: "4px" }}>
                    RFC <span style={{ color: "#2B8FCC" }}>*</span>
                  </label>
                  <input
                    type="text"
                    maxLength={13}
                    className={`form-control ${esRfcInvalido ? "is-invalid" : ""}`}
                    style={{ width: "100%", borderRadius: "8px", height: "36px", border: esRfcInvalido ? "1px solid #dc3545" : "1px solid #d0dce8" }}
                    placeholder="IST980101ABC"
                    value={rfc}
                    onChange={(e) => setRfc(e.target.value)}
                  />
                </div>

                <div>
                  <label style={{ fontSize: "11px", fontWeight: 600, color: "#4a6580", display: "block", marginBottom: "4px" }}>
                    Días de crédito <span style={{ color: "#2B8FCC" }}>*</span>
                  </label>
                  <input
                    type="text"
                    maxLength={10}
                    className={`form-control ${esDiasCreditoInvalido ? "is-invalid" : ""}`}
                    style={{ width: "100%", borderRadius: "8px", height: "36px", border: esDiasCreditoInvalido ? "1px solid #dc3545" : "1px solid #d0dce8" }}
                    placeholder="30"
                    value={diasCredito}
                    onChange={(e) => setDiasCredito(e.target.value)}
                  />
                </div>
              </div>

              {/* 6. Estatus */}
              <div>
                <label style={{ fontSize: "11px", fontWeight: 600, color: "#4a6580", display: "block", marginBottom: "4px" }}>
                  Estatus <span style={{ color: "#2B8FCC" }}>*</span>
                </label>
                <select
                  className="form-select"
                  style={{ width: "100%", borderRadius: "8px", height: "36px", border: "1px solid #d0dce8" }}
                  value={estatus}
                  onChange={(e) => setEstatus(e.target.value as "Activo" | "Inactivo")}
                >
                  <option value="Activo">Activo</option>
                  <option value="Inactivo">Inactivo</option>
                </select>
              </div>
            </div>

            {/* COLUMNA DERECHA — Domicilio */}
            <div
              style={{
                backgroundColor: "#ffffff",
                border: "1px solid #d8e6f0",
                borderRadius: "12px",
                padding: "20px 22px",
                display: "flex",
                flexDirection: "column",
                gap: "14px",
              }}
            >
              <h5
                style={{
                  fontSize: "13px",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                  color: "#1e3a5f",
                  borderBottom: "1px solid #ddeaf5",
                  paddingBottom: "8px",
                  margin: "0 0 4px 0",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <MapPin size={16} style={{ color: "#2B8FCC" }} />
                Domicilio
              </h5>

              {/* 1. Código Postal */}
              <div>
                <label style={{ fontSize: "11px", fontWeight: 600, color: "#4a6580", display: "block", marginBottom: "4px" }}>
                  Código postal <span style={{ color: "#2B8FCC" }}>*</span>
                </label>
                <div style={{ display: "flex", gap: "8px" }}>
                  <input
                    type="text"
                    maxLength={5}
                    className={`form-control ${esCPInvalido ? "is-invalid" : ""}`}
                    style={{ flex: 1, width: "100%", borderRadius: "8px", height: "36px", border: esCPInvalido ? "1px solid #dc3545" : "1px solid #d0dce8" }}
                    placeholder="06600"
                    value={codigoPostal}
                    onChange={(e) => setCodigoPostal(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={handleBuscarCP}
                    disabled={buscandoCP}
                    style={{
                      height: "36px",
                      padding: "0 14px",
                      borderRadius: "8px",
                      backgroundColor: "#2B8FCC",
                      color: "#ffffff",
                      border: "none",
                      fontSize: "12px",
                      fontWeight: 500,
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      flexShrink: 0,
                    }}
                  >
                    <Search size={14} />
                    <span>{buscandoCP ? "Buscando..." : "Buscar"}</span>
                  </button>
                </div>
              </div>

              {/* 2. Estado | Municipio (Disabled) */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ fontSize: "11px", fontWeight: 600, color: "#4a6580", display: "block", marginBottom: "4px" }}>
                    Estado <span style={{ color: "#2B8FCC" }}>*</span>
                  </label>
                  <input
                    type="text"
                    disabled
                    className="form-control"
                    style={{ width: "100%", borderRadius: "8px", height: "36px", backgroundColor: "#f1f5f9", color: "#64748b", border: "1px solid #d0dce8" }}
                    value={estado || "—"}
                  />
                </div>

                <div>
                  <label style={{ fontSize: "11px", fontWeight: 600, color: "#4a6580", display: "block", marginBottom: "4px" }}>
                    Municipio <span style={{ color: "#2B8FCC" }}>*</span>
                  </label>
                  <input
                    type="text"
                    disabled
                    className="form-control"
                    style={{ width: "100%", borderRadius: "8px", height: "36px", backgroundColor: "#f1f5f9", color: "#64748b", border: "1px solid #d0dce8" }}
                    value={municipio || "—"}
                  />
                </div>
              </div>

              {/* 3. Fraccionamiento / Colonia */}
              <div>
                <label style={{ fontSize: "11px", fontWeight: 600, color: "#4a6580", display: "block", marginBottom: "4px" }}>
                  Fraccionamiento <span style={{ color: "#2B8FCC" }}>*</span>
                </label>
                <input
                  type="text"
                  maxLength={50}
                  className={`form-control ${esFraccionamientoInvalido ? "is-invalid" : ""}`}
                  style={{ width: "100%", borderRadius: "8px", height: "36px", border: esFraccionamientoInvalido ? "1px solid #dc3545" : "1px solid #d0dce8" }}
                  placeholder="Ej. Colonia Juárez"
                  value={fraccionamiento}
                  onChange={(e) => setFraccionamiento(e.target.value)}
                />
              </div>

              {/* 4. Nombre de la calle */}
              <div>
                <label style={{ fontSize: "11px", fontWeight: 600, color: "#4a6580", display: "block", marginBottom: "4px" }}>
                  Nombre de la calle <span style={{ color: "#2B8FCC" }}>*</span>
                </label>
                <input
                  type="text"
                  maxLength={50}
                  className={`form-control ${esCalleInvalida ? "is-invalid" : ""}`}
                  style={{ width: "100%", borderRadius: "8px", height: "36px", border: esCalleInvalida ? "1px solid #dc3545" : "1px solid #d0dce8" }}
                  placeholder="Ej. Av. Paseo de la Reforma"
                  value={nombreCalle}
                  onChange={(e) => setNombreCalle(e.target.value)}
                />
              </div>

              {/* 5. Núm. interior | Núm. exterior */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ fontSize: "11px", fontWeight: 600, color: "#4a6580", display: "block", marginBottom: "4px" }}>
                    Núm. interior
                  </label>
                  <input
                    type="text"
                    maxLength={10}
                    className="form-control"
                    style={{ width: "100%", borderRadius: "8px", height: "36px", border: "1px solid #d0dce8" }}
                    placeholder="Piso 4"
                    value={numeroInterior}
                    onChange={(e) => setNumeroInterior(e.target.value)}
                  />
                </div>

                <div>
                  <label style={{ fontSize: "11px", fontWeight: 600, color: "#4a6580", display: "block", marginBottom: "4px" }}>
                    Núm. exterior <span style={{ color: "#2B8FCC" }}>*</span>
                  </label>
                  <input
                    type="text"
                    maxLength={10}
                    className={`form-control ${esNumExtInvalido ? "is-invalid" : ""}`}
                    style={{ width: "100%", borderRadius: "8px", height: "36px", border: esNumExtInvalido ? "1px solid #dc3545" : "1px solid #d0dce8" }}
                    placeholder="123"
                    value={numeroExterior}
                    onChange={(e) => setNumeroExterior(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 4.4 Pie de acciones (footer) */}

          <div
            style={{
              marginTop: "20px",
              paddingTop: "16px",
              borderTop: "1px solid #ddeaf5",
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-end",
              gap: "12px",
            }}
          >
            <Link
              href="/empresas"
              style={{
                height: "36px",
                padding: "0 20px",
                borderRadius: "20px",
                backgroundColor: "#f4f8fc",
                border: "1px solid #d0dce8",
                color: "#4a6580",
                fontSize: "13px",
                fontWeight: 500,
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              Cancelar
            </Link>

            <button
              type="submit"
              disabled={guardando}
              style={{
                height: "36px",
                padding: "0 20px",
                borderRadius: "20px",
                backgroundColor: esEdicion ? "#1e3a5f" : "#2B8FCC",
                border: "none",
                color: "#ffffff",
                fontSize: "13px",
                fontWeight: 500,
                cursor: guardando ? "not-allowed" : "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                boxShadow: "0 2px 6px rgba(0, 0, 0, 0.08)",
              }}
            >
              {esEdicion ? <Check size={16} /> : <Save size={16} />}
              <span>{guardando ? "Guardando..." : esEdicion ? "Guardar cambios" : "Guardar empresa"}</span>
            </button>
          </div>
        </div>
      </form>

      {/* 5. CARD CALENDARIO DE CAPACITACIONES (solo modo editar y si es cliente) */}
      {esEdicion && esCliente && (
        <div
          style={{
            backgroundColor: "#ffffff",
            borderRadius: "12px",
            border: "1px solid #d8e6f0",
            padding: "20px 22px",
            marginTop: "20px",
            boxShadow: "0 1px 3px rgba(0, 0, 0, 0.03)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
            <Calendar size={18} style={{ color: "#2B8FCC" }} />
            <h5 style={{ fontSize: "13px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", color: "#1e3a5f", margin: 0 }}>
              Calendario de capacitaciones
            </h5>
          </div>

          <p style={{ fontSize: "13px", color: "#4a6580", margin: "0 0 16px 0" }}>
            Genera un link para que la empresa vea sus cursos agendados e inscriba a sus alumnos.
          </p>

          <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: "220px" }}>
              <select
                className="form-select"
                style={{ borderRadius: "8px", height: "36px", border: "1px solid #d0dce8", width: "100%" }}
                value={plantaSeleccionada}
                onChange={(e) => setPlantaSeleccionada(e.target.value)}
              >
                <option value="">-- Selecciona una planta --</option>
                {plantas.map((p) => (
                  <option key={p.i_CvePlanta} value={p.i_CvePlanta}>
                    {p.v_NombrePlanta}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={handleGenerarLink}
              disabled={generandoLink}
              style={{
                height: "36px",
                padding: "0 20px",
                borderRadius: "20px",
                backgroundColor: "#2B8FCC",
                color: "#ffffff",
                border: "none",
                fontSize: "13px",
                fontWeight: 500,
                cursor: generandoLink ? "not-allowed" : "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              {generandoLink ? "Generando..." : "Generar link"}
            </button>
          </div>

          {/* Resultado del link generado */}
          {linkGenerado && (
            <div style={{ marginTop: "16px", display: "flex", flexDirection: "column", gap: "14px" }}>
              <div
                style={{
                  backgroundColor: "#eaf4fb",
                  border: "1px solid #b5cfe8",
                  borderRadius: "8px",
                  padding: "12px 16px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "12px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
                  <CheckCircle size={18} style={{ color: "#2B8FCC", flexShrink: 0 }} />
                  <span
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "12px",
                      color: "#1e3a5f",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {linkGenerado}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleCopiarLink}
                  style={{
                    height: "30px",
                    padding: "0 12px",
                    borderRadius: "6px",
                    backgroundColor: "#ffffff",
                    border: "1px solid #b5cfe8",
                    color: "#2B8FCC",
                    fontSize: "12px",
                    fontWeight: 500,
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    flexShrink: 0,
                  }}
                >
                  <Copy size={14} />
                  <span>Copiar</span>
                </button>
              </div>

              {copiadoFeedback && (
                <div style={{ fontSize: "12px", color: "#2B8FCC", fontWeight: 500 }}>
                  ✓ Link copiado al portapapeles
                </div>
              )}

              {/* Envío por correo */}
              <div style={{ paddingTop: "12px", borderTop: "1px solid #ddeaf5", display: "flex", flexDirection: "column", gap: "8px" }}>
                <span style={{ fontSize: "12px", fontWeight: 600, color: "#4a6580" }}>
                  Enviar link por correo a un contacto:
                </span>

                <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
                  <select
                    className="form-select"
                    style={{ borderRadius: "8px", height: "36px", border: "1px solid #d0dce8", flex: 1, minWidth: "220px" }}
                    value={contactoEmailSeleccionado}
                    onChange={(e) => setContactoEmailSeleccionado(e.target.value)}
                  >
                    <option value="">-- Selecciona un contacto con email --</option>
                    {contactosConEmail.map((c) => (
                      <option key={c.i_CveContacto} value={c.i_CveContacto}>
                        {c.v_NombreContacto} ({c.v_Email})
                      </option>
                    ))}
                  </select>

                  <button
                    type="button"
                    onClick={handleEnviarCorreo}
                    disabled={enviandoCorreo}
                    style={{
                      height: "36px",
                      padding: "0 18px",
                      borderRadius: "20px",
                      backgroundColor: "#1e3a5f",
                      color: "#ffffff",
                      border: "none",
                      fontSize: "13px",
                      fontWeight: 500,
                      cursor: enviandoCorreo ? "not-allowed" : "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <Mail size={16} />
                    <span>{enviandoCorreo ? "Enviando..." : "Enviar por correo"}</span>
                  </button>
                </div>

                {mensajeCorreoStatus && (
                  <div
                    style={{
                      fontSize: "12px",
                      color: mensajeCorreoStatus.tipo === "exito" ? "#2B8FCC" : "#dc3545",
                      fontWeight: 500,
                      marginTop: "4px",
                    }}
                  >
                    {mensajeCorreoStatus.texto}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 6. CARD CONTACTOS (solo modo editar) */}
      {esEdicion && (
        <div
          style={{
            backgroundColor: "#ffffff",
            borderRadius: "12px",
            border: "1px solid #d8e6f0",
            padding: "20px 22px",
            marginTop: "20px",
            boxShadow: "0 1px 3px rgba(0, 0, 0, 0.03)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Users size={18} style={{ color: "#2B8FCC" }} />
              <h5 style={{ fontSize: "13px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", color: "#1e3a5f", margin: 0 }}>
                Contactos
              </h5>
            </div>

            <button
              type="button"
              onClick={() => abrirModalContacto(null)}
              style={{
                width: "30px",
                height: "30px",
                borderRadius: "50%",
                backgroundColor: "#2B8FCC",
                color: "#ffffff",
                border: "none",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
              title="Agregar contacto nuevo"
            >
              <Plus size={18} />
            </button>
          </div>

          {contactos.length === 0 ? (
            <div style={{ padding: "24px 0", textAlign: "center", color: "#7a96b0", fontSize: "13px" }}>
              No hay contactos registrados
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column" }}>
              {contactos.map((contacto, idx) => {
                const isLast = idx === contactos.length - 1;
                const subtitulo = [contacto.v_Email, formatearTelefono(contacto.v_Celular || contacto.v_TelefonoFijo)]
                  .filter(Boolean)
                  .join(" · ");

                return (
                  <div
                    key={contacto.i_CveContacto}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "12px 0",
                      borderBottom: isLast ? "none" : "1px solid #f0f4f8",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "12px", minWidth: 0 }}>
                      <div
                        style={{
                          width: "36px",
                          height: "36px",
                          borderRadius: "50%",
                          backgroundColor: "#eaf4fb",
                          color: "#2B8FCC",
                          fontSize: "13px",
                          fontWeight: 700,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        {obtenerIniciales(contacto.v_NombreContacto)}
                      </div>

                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: "13px", fontWeight: 700, color: "#1e3a5f" }}>
                          {contacto.v_NombreContacto}
                          {contacto.v_TipoContacto && (
                            <span style={{ fontWeight: 400, color: "#7a96b0", fontSize: "12px", marginLeft: "6px" }}>
                              ({contacto.v_TipoContacto})
                            </span>
                          )}
                        </div>
                        <div
                          style={{
                            fontSize: "12px",
                            color: "#7a96b0",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {subtitulo || "Sin datos de contacto"}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
                      <button
                        type="button"
                        onClick={() => abrirModalContacto(contacto)}
                        style={{
                          width: "30px",
                          height: "30px",
                          borderRadius: "8px",
                          border: "1px solid #d0dce8",
                          backgroundColor: "#ffffff",
                          color: "#4a6580",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                        title="Editar contacto"
                      >
                        <Edit2 size={14} />
                      </button>

                      <button
                        type="button"
                        onClick={() => setContactoAEliminar(contacto)}
                        style={{
                          width: "30px",
                          height: "30px",
                          borderRadius: "8px",
                          border: "1px solid #d0dce8",
                          backgroundColor: "#ffffff",
                          color: "#dc3545",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                        title="Eliminar contacto"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 6.1 MODAL DE CONTACTO (AGREGAR / EDITAR) */}
      {modalContactoAbierto && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(15, 23, 42, 0.5)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1100,
            padding: "16px",
          }}
        >
          <div
            style={{
              maxWidth: "480px",
              width: "100%",
              backgroundColor: "#ffffff",
              borderRadius: "12px",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
              overflow: "hidden",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ padding: "16px 20px", borderBottom: "1px solid #ddeaf5", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <h4 style={{ fontSize: "15px", fontWeight: 700, color: "#1e3a5f", margin: 0 }}>
                {contactoEditar ? "Editar contacto" : "Nuevo contacto"}
              </h4>
              <button type="button" onClick={() => setModalContactoAbierto(false)} style={{ background: "none", border: "none", color: "#7a96b0", cursor: "pointer" }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "14px" }}>
              <div>
                <label style={{ fontSize: "11px", fontWeight: 600, color: "#4a6580", display: "block", marginBottom: "4px" }}>
                  Nombre del contacto <span style={{ color: "#2B8FCC" }}>*</span>
                </label>
                <input
                  type="text"
                  maxLength={80}
                  className={`form-control ${errNombreContacto ? "is-invalid" : ""}`}
                  style={{ borderRadius: "8px", height: "36px", border: errNombreContacto ? "1px solid #dc3545" : "1px solid #d0dce8" }}
                  placeholder="Ej. Carlos Alatorre"
                  value={cNombre}
                  onChange={(e) => setCNombre(e.target.value)}
                />
                {errNombreContacto && (
                  <div style={{ color: "#dc3545", fontSize: "11px", marginTop: "2px" }}>Este campo es obligatorio.</div>
                )}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ fontSize: "11px", fontWeight: 600, color: "#4a6580", display: "block", marginBottom: "4px" }}>
                    Celular
                  </label>
                  <input
                    type="text"
                    maxLength={10}
                    className="form-control"
                    style={{ borderRadius: "8px", height: "36px", border: "1px solid #d0dce8" }}
                    placeholder="8112345678"
                    value={cCelular}
                    onChange={(e) => setCCelular(e.target.value)}
                  />
                </div>

                <div>
                  <label style={{ fontSize: "11px", fontWeight: 600, color: "#4a6580", display: "block", marginBottom: "4px" }}>
                    Teléfono fijo
                  </label>
                  <input
                    type="text"
                    maxLength={10}
                    className="form-control"
                    style={{ borderRadius: "8px", height: "36px", border: "1px solid #d0dce8" }}
                    placeholder="8183000000"
                    value={cTelefono}
                    onChange={(e) => setCTelefono(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: "11px", fontWeight: 600, color: "#4a6580", display: "block", marginBottom: "4px" }}>
                  Email
                </label>
                <input
                  type="email"
                  maxLength={80}
                  className="form-control"
                  style={{ borderRadius: "8px", height: "36px", border: "1px solid #d0dce8" }}
                  placeholder="contacto@empresa.com"
                  value={cEmail}
                  onChange={(e) => setCEmail(e.target.value)}
                />
              </div>

              <div>
                <label style={{ fontSize: "11px", fontWeight: 600, color: "#4a6580", display: "block", marginBottom: "4px" }}>
                  Puesto
                </label>
                <input
                  type="text"
                  maxLength={50}
                  className="form-control"
                  style={{ borderRadius: "8px", height: "36px", border: "1px solid #d0dce8" }}
                  placeholder="Ej. Gerente de RH"
                  value={cPuesto}
                  onChange={(e) => setCPuesto(e.target.value)}
                />
              </div>
            </div>

            <div style={{ padding: "14px 20px", borderTop: "1px solid #ddeaf5", display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button
                type="button"
                onClick={() => setModalContactoAbierto(false)}
                style={{ height: "34px", padding: "0 16px", borderRadius: "20px", backgroundColor: "#f4f8fc", border: "1px solid #d0dce8", color: "#4a6580", fontSize: "12px", fontWeight: 500, cursor: "pointer" }}
              >
                Cerrar
              </button>
              <button
                type="button"
                onClick={guardarContacto}
                style={{ height: "34px", padding: "0 16px", borderRadius: "20px", backgroundColor: "#2B8FCC", border: "none", color: "#ffffff", fontSize: "12px", fontWeight: 500, cursor: "pointer" }}
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6.2 MODAL ELIMINAR CONTACTO */}
      {contactoAEliminar && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(15, 23, 42, 0.5)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1100,
            padding: "16px",
          }}
        >
          <div
            style={{
              maxWidth: "440px",
              width: "100%",
              backgroundColor: "#ffffff",
              borderRadius: "12px",
              padding: "24px",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
              display: "flex",
              flexDirection: "column",
              gap: "16px",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{ width: "40px", height: "40px", borderRadius: "50%", backgroundColor: "#fee2e2", color: "#dc3545", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <AlertCircle size={22} />
              </div>
              <div>
                <h4 style={{ fontSize: "15px", fontWeight: 700, color: "#1e3a5f", margin: 0 }}>Eliminar contacto</h4>
                <p style={{ fontSize: "13px", color: "#4a6580", margin: "4px 0 0 0" }}>
                  ¿Deseas eliminar <strong>{contactoAEliminar.v_NombreContacto}</strong>? Si lo haces, se perderán todos sus datos.
                </p>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "8px" }}>
              <button
                type="button"
                onClick={() => setContactoAEliminar(null)}
                style={{ height: "34px", padding: "0 16px", borderRadius: "20px", backgroundColor: "#f4f8fc", border: "1px solid #d0dce8", color: "#4a6580", fontSize: "12px", fontWeight: 500, cursor: "pointer" }}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmarEliminarContacto}
                style={{ height: "34px", padding: "0 16px", borderRadius: "20px", backgroundColor: "#dc3545", border: "none", color: "#ffffff", fontSize: "12px", fontWeight: 500, cursor: "pointer" }}
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
