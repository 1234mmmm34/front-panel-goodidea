"use client";

import React, { useEffect, useRef, useState } from "react";
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
  Award,
  Upload,
  Image as ImageIcon,
  Loader2,
  Download,
  AlertTriangle,
  ChevronDown,
} from "lucide-react";
import { EmpresaGetDto, EmpresaPostPayload, PlantaGetDto, ContactoXEmpresa } from "@/types/empresas";
import { CursoLicenciaDto } from "@/types/servicios";
import { EmpresasService } from "@/services/empresas.service";
import { obtenerSesionActual } from "@/lib/api-client";
import { useToast } from "@/context/ToastContext";
import { ModalConfirmarEliminar } from "@/components/ui/ModalConfirmarEliminar";
import { formatearFechaTexto } from "@/lib/date-utils";

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
  const [b_AvisoInscritos, setB_AvisoInscritos] = useState<boolean>(false);
  const [guardandoAvisoInscritos, setGuardandoAvisoInscritos] = useState<boolean>(false);

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

  // Datos para DC-3
  const [repComisionEmpresa, setRepComisionEmpresa] = useState<string>("");
  const [repComisionTrabajadores, setRepComisionTrabajadores] = useState<string>("");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [cargandoLogo, setCargandoLogo] = useState<boolean>(false);
  const [subiendoLogo, setSubiendoLogo] = useState<boolean>(false);
  const logoInputRef = useRef<HTMLInputElement | null>(null);

  // Plantillas de licencia personalizadas
  const [cursosLicencia, setCursosLicencia] = useState<CursoLicenciaDto[]>([]);
  const [cargandoCursosLicencia, setCargandoCursosLicencia] = useState<boolean>(false);
  const [cursoLicenciaSeleccionadoId, setCursoLicenciaSeleccionadoId] = useState<number | null>(null);
  const [busquedaCursoLicencia, setBusquedaCursoLicencia] = useState<string>("");
  const [dropdownCursoAbierto, setDropdownCursoAbierto] = useState<boolean>(false);
  const [subiendoPlantillaLicencia, setSubiendoPlantillaLicencia] = useState<boolean>(false);
  const [cursoPlantillaEliminar, setCursoPlantillaEliminar] = useState<CursoLicenciaDto | null>(null);
  const [eliminandoPlantillaLicencia, setEliminandoPlantillaLicencia] = useState<boolean>(false);
  const [descargandoCursoId, setDescargandoCursoId] = useState<number | null>(null);
  const plantillaLicenciaInputRef = useRef<HTMLInputElement | null>(null);
  const dropdownCursoRef = useRef<HTMLDivElement | null>(null);

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
  const [b_RecordatorioPagos, setB_RecordatorioPagos] = useState<boolean>(false);
  const [b_RecordatorioOC, setB_RecordatorioOC] = useState<boolean>(false);
  const [errNombreContacto, setErrNombreContacto] = useState<boolean>(false);

  const cargarContactos = async (idEmpresa: number) => {
    const res = await EmpresasService.getContactos(idEmpresa);
    setContactos(res || []);
  };

  const cargarPlantillasLicencia = async (idEmpresa: number) => {
    setCargandoCursosLicencia(true);
    const lista = await EmpresasService.getPlantillasLicencia(idEmpresa);
    setCursosLicencia(lista);
    setCargandoCursosLicencia(false);
  };

  useEffect(() => {
    if (!dropdownCursoAbierto) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownCursoRef.current && !dropdownCursoRef.current.contains(e.target as Node)) {
        setDropdownCursoAbierto(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownCursoAbierto]);

  useEffect(() => {
    if (empresaEditar && empresaEditar.iD_Empresa > 0) {
      setRazonSocial(empresaEditar.s_RazonSocial || "");
      setRegistroPatronal(empresaEditar.s_RegistroPatronal || "");
      setRepresentanteLegal(empresaEditar.s_RepresentanteLegal || "");
      setGiroActividad(empresaEditar.s_GiroActividad || "");
      setRfc(empresaEditar.s_RFC || "");
      setDiasCredito(String(empresaEditar.d_DiasCredito ?? 0));
      setEstatus(empresaEditar.d_FechaBaja ? "Inactivo" : "Activo");
      setB_AvisoInscritos(Boolean(empresaEditar.b_AvisoInscritos));

      setCodigoPostal(empresaEditar.i_CodigoPostal ? String(empresaEditar.i_CodigoPostal) : "");
      setEstado(empresaEditar.v_NombreEstado || "");
      setMunicipio(empresaEditar.v_Municipio || "");
      setFraccionamiento(empresaEditar.v_Fraccionamiento || "");
      setNombreCalle(empresaEditar.v_NombreCalle || "");
      setNumeroInterior(empresaEditar.v_NumeroInterior || "");
      setNumeroExterior(empresaEditar.v_NumeroExterior || "");
      setRepComisionEmpresa((empresaEditar.v_RepComisionEmpresa || "").toUpperCase());
      setRepComisionTrabajadores((empresaEditar.v_RepComisionTrabajadores || "").toUpperCase());

      // Cargar logo temporal de la empresa
      setCargandoLogo(true);
      EmpresasService.obtenerLogo(empresaEditar.iD_Empresa)
        .then((url) => setLogoUrl(url))
        .finally(() => setCargandoLogo(false));

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

      // Cargar cursos con entregable Licencia
      cargarPlantillasLicencia(empresaEditar.iD_Empresa);
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

  const handleSeleccionarLogo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !empresaEditar?.iD_Empresa) return;

    const tiposValidos = ["image/png", "image/jpeg"];
    const nombreLower = file.name.toLowerCase();
    const extensionValida =
      nombreLower.endsWith(".png") || nombreLower.endsWith(".jpg") || nombreLower.endsWith(".jpeg");

    if (!tiposValidos.includes(file.type) && !extensionValida) {
      toast.error("Formato inválido. Solo se permiten imágenes PNG o JPG.");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error("El archivo supera el límite permitido de 2 MB.");
      return;
    }

    setSubiendoLogo(true);
    const res = await EmpresasService.subirLogo(empresaEditar.iD_Empresa, file);
    setSubiendoLogo(false);

    if (res.exito) {
      setLogoUrl(res.v_Url ?? null);
      toast.success("Logo actualizado");
    } else {
      toast.error(res.mensaje || "Ocurrió un error al subir el logo.");
    }
  };

  const handleSeleccionarPlantillaLicencia = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !empresaEditar?.iD_Empresa || !cursoLicenciaSeleccionadoId) return;

    if (!file.name.toLowerCase().endsWith(".pptx")) {
      toast.error("Formato inválido. Solo se permiten archivos .pptx.");
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      toast.error("El archivo supera el límite permitido de 20 MB.");
      return;
    }

    setSubiendoPlantillaLicencia(true);
    const res = await EmpresasService.subirPlantillaLicencia(
      empresaEditar.iD_Empresa,
      cursoLicenciaSeleccionadoId,
      file
    );
    setSubiendoPlantillaLicencia(false);

    if (res.exito) {
      toast.success("Plantilla de licencia actualizada");
      await cargarPlantillasLicencia(empresaEditar.iD_Empresa);
    } else {
      toast.error(res.mensaje || "Ocurrió un error al subir la plantilla.");
    }
  };

  const handleDescargarPlantillaCurso = async (i_CveServicio: number) => {
    if (!empresaEditar?.iD_Empresa || descargandoCursoId !== null) return;
    setDescargandoCursoId(i_CveServicio);
    const info = await EmpresasService.getPlantillaLicenciaCurso(
      empresaEditar.iD_Empresa,
      i_CveServicio
    );
    setDescargandoCursoId(null);

    if (info?.v_Url) {
      window.open(info.v_Url, "_blank", "noopener,noreferrer");
    } else {
      toast.error("No se pudo obtener la URL de descarga de la plantilla.");
    }
  };

  const handleConfirmarEliminarPlantillaCurso = async () => {
    if (!empresaEditar?.iD_Empresa || !cursoPlantillaEliminar) return;
    setEliminandoPlantillaLicencia(true);
    const res = await EmpresasService.eliminarPlantillaLicencia(
      empresaEditar.iD_Empresa,
      cursoPlantillaEliminar.i_CveServicio
    );
    setEliminandoPlantillaLicencia(false);
    setCursoPlantillaEliminar(null);

    if (res.exito) {
      toast.success("Plantilla personalizada eliminada");
      await cargarPlantillasLicencia(empresaEditar.iD_Empresa);
    } else {
      toast.error(res.mensaje || "Ocurrió un error al eliminar la plantilla.");
    }
  };

  const cursosConPersonalizada = cursosLicencia.filter(
    (c) => c.v_NombreArchivoPersonalizada != null
  );
  const cursosSinNingunaPlantilla = cursosLicencia.filter(
    (c) => !c.b_PlantillaGeneral && !c.v_NombreArchivoPersonalizada
  );
  const cursoSeleccionadoObj =
    cursosLicencia.find((c) => c.i_CveServicio === cursoLicenciaSeleccionadoId) || null;
  const cursosFiltradosDropdown = cursosLicencia.filter((c) =>
    (c.v_Servicio || "").toLowerCase().includes(busquedaCursoLicencia.trim().toLowerCase())
  );

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
      v_RepComisionEmpresa: repComisionEmpresa.trim() ? repComisionEmpresa.trim().toUpperCase() : null,
      v_RepComisionTrabajadores: repComisionTrabajadores.trim() ? repComisionTrabajadores.trim().toUpperCase() : null,
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
  const handleToggleAvisoInscritos = async (nuevoValor: boolean) => {
    if (!empresaEditar?.iD_Empresa || guardandoAvisoInscritos) return;
    const valorAnterior = b_AvisoInscritos;
    setB_AvisoInscritos(nuevoValor);
    setGuardandoAvisoInscritos(true);

    try {
      await EmpresasService.actualizarAvisoInscritos(empresaEditar.iD_Empresa, nuevoValor);
      toast.success(
        nuevoValor
          ? "Envío de lista de alumnos activado"
          : "Envío de lista de alumnos desactivado"
      );
    } catch (err: any) {
      setB_AvisoInscritos(valorAnterior);
      const errorMsg =
        err?.response?.data?.error ||
        err?.response?.data?.mensaje ||
        err?.response?.data?.message ||
        "Ocurrió un error al actualizar la configuración de envío.";
      toast.error(errorMsg);
    } finally {
      setGuardandoAvisoInscritos(false);
    }
  };

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
      setB_RecordatorioPagos(Boolean(item.b_RecordatorioPagos));
      setB_RecordatorioOC(Boolean(item.b_RecordatorioOC));
    } else {
      setContactoEditar(null);
      setCIdContacto(0);
      setCNombre("");
      setCCelular("");
      setCTelefono("");
      setCEmail("");
      setCPuesto("");
      setB_RecordatorioPagos(false);
      setB_RecordatorioOC(false);
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
      b_RecordatorioPagos: Boolean(b_RecordatorioPagos),
      b_RecordatorioOC: Boolean(b_RecordatorioOC),
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
        <Link href="/programacion" style={{ color: "#7a96b0", textDecoration: "none" }} className="hover:text-slate-900 transition-colors">
          Catálogos
        </Link>
        <ChevronRight size={13} style={{ color: "#b5cfe8" }} />
        <Link href="/empresas" style={{ color: "#7a96b0", textDecoration: "none" }} className="hover:text-slate-900 transition-colors">
          Empresas
        </Link>
        <ChevronRight size={13} style={{ color: "#b5cfe8" }} />
        <span style={{ color: "#1e293b", fontWeight: 500 }}>{esEdicion ? (empresaEditar?.s_RazonSocial || "Editar empresa") : "Agregar empresa"}</span>
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
                  maxLength={100}
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

              {/* 5. Núm. exterior | Núm. interior */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
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
              </div>
            </div>
          </div>

          {/* 4.3.5 SECCIÓN DATOS PARA DC-3 */}
          <div
            style={{
              backgroundColor: "#ffffff",
              border: "1px solid #d8e6f0",
              borderRadius: "12px",
              padding: "20px 22px",
              marginTop: "20px",
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
              <Award size={16} style={{ color: "#2B8FCC" }} />
              Datos para DC-3
            </h5>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "14px" }}>
              <div>
                <label style={{ fontSize: "11px", fontWeight: 600, color: "#4a6580", display: "block", marginBottom: "4px" }}>
                  Representante Comisión Mixta — por la empresa
                </label>
                <input
                  type="text"
                  maxLength={200}
                  className="form-control"
                  style={{ width: "100%", borderRadius: "8px", height: "36px", border: "1px solid #d0dce8", textTransform: "uppercase" }}
                  placeholder="NOMBRE COMPLETO"
                  value={repComisionEmpresa}
                  onChange={(e) => setRepComisionEmpresa(e.target.value.toUpperCase())}
                />
              </div>

              <div>
                <label style={{ fontSize: "11px", fontWeight: 600, color: "#4a6580", display: "block", marginBottom: "4px" }}>
                  Representante Comisión Mixta — por los trabajadores
                </label>
                <input
                  type="text"
                  maxLength={200}
                  className="form-control"
                  style={{ width: "100%", borderRadius: "8px", height: "36px", border: "1px solid #d0dce8", textTransform: "uppercase" }}
                  placeholder="NOMBRE COMPLETO"
                  value={repComisionTrabajadores}
                  onChange={(e) => setRepComisionTrabajadores(e.target.value.toUpperCase())}
                />
              </div>
            </div>

            <div>
              <label style={{ fontSize: "11px", fontWeight: 600, color: "#4a6580", display: "block", marginBottom: "6px" }}>
                Logo de la empresa
              </label>
              {!esEdicion ? (
                <p style={{ fontSize: "12.5px", color: "#64748b", margin: 0 }}>
                  Podrás subir el logo después de guardar la empresa.
                </p>
              ) : (
                <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
                  <div
                    style={{
                      width: "120px",
                      height: "72px",
                      borderRadius: "8px",
                      border: "1px solid #d0dce8",
                      backgroundColor: "#f8fafc",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      overflow: "hidden",
                      flexShrink: 0,
                    }}
                  >
                    {cargandoLogo ? (
                      <Loader2 size={18} className="animate-spin" style={{ color: "#2B8FCC" }} />
                    ) : logoUrl ? (
                      <img
                        src={logoUrl}
                        alt="Logo de la empresa"
                        style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }}
                      />
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px", color: "#94a3b8", fontSize: "11px" }}>
                        <ImageIcon size={16} />
                        <span>Sin logo</span>
                      </div>
                    )}
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    <input
                      ref={logoInputRef}
                      type="file"
                      accept="image/png,image/jpeg"
                      style={{ display: "none" }}
                      onChange={handleSeleccionarLogo}
                    />
                    <button
                      type="button"
                      disabled={subiendoLogo}
                      onClick={() => logoInputRef.current?.click()}
                      style={{
                        height: "34px",
                        padding: "0 14px",
                        borderRadius: "8px",
                        backgroundColor: "#ffffff",
                        border: "1px solid #2B8FCC",
                        color: "#2B8FCC",
                        fontSize: "12.5px",
                        fontWeight: 500,
                        cursor: subiendoLogo ? "not-allowed" : "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        width: "fit-content",
                      }}
                    >
                      {subiendoLogo ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                      <span>{subiendoLogo ? "Subiendo..." : logoUrl ? "Cambiar logo" : "Subir logo"}</span>
                    </button>
                    <span style={{ fontSize: "11px", color: "#7a96b0" }}>
                      Formato PNG o JPG, máximo 2 MB.
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 4.3.6 SECCIÓN PLANTILLAS DE LICENCIA PERSONALIZADAS */}
          <div
            style={{
              backgroundColor: "#ffffff",
              border: "1px solid #d8e6f0",
              borderRadius: "12px",
              padding: "20px 22px",
              marginTop: "20px",
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
              Plantillas de licencia personalizadas
            </h5>

            {!esEdicion ? (
              <p style={{ fontSize: "12.5px", color: "#64748b", margin: 0 }}>
                Podrás cargar plantillas personalizadas después de guardar la empresa.
              </p>
            ) : cargandoCursosLicencia ? (
              <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12.5px", color: "#64748b" }}>
                <Loader2 size={15} className="animate-spin" style={{ color: "#2B8FCC" }} />
                <span>Cargando cursos con entregable Licencia...</span>
              </div>
            ) : cursosLicencia.length === 0 ? (
              <p style={{ fontSize: "12.5px", color: "#64748b", margin: 0 }}>
                No hay cursos con entregable Licencia en el catálogo de servicios.
              </p>
            ) : (
              <>
                <p style={{ fontSize: "12px", color: "#64748b", margin: 0 }}>
                  Si un curso no tiene plantilla personalizada, se usa la general del catálogo de servicios.
                </p>

                {/* Fila de carga */}
                <div style={{ display: "flex", alignItems: "flex-end", gap: "12px", flexWrap: "wrap" }}>
                  <div ref={dropdownCursoRef} style={{ flex: "1 1 280px", position: "relative" }}>
                    <label style={{ fontSize: "11px", fontWeight: 600, color: "#4a6580", display: "block", marginBottom: "4px" }}>
                      Curso
                    </label>
                    <div
                      onClick={() => setDropdownCursoAbierto((prev) => !prev)}
                      style={{
                        height: "36px",
                        borderRadius: "8px",
                        border: "1px solid #d0dce8",
                        backgroundColor: "#ffffff",
                        padding: "0 10px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: "8px",
                        cursor: "pointer",
                        fontSize: "13px",
                        color: cursoSeleccionadoObj ? "#0f172a" : "#94a3b8",
                      }}
                    >
                      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {cursoSeleccionadoObj?.v_Servicio || "-- Selecciona un curso --"}
                      </span>
                      <ChevronDown size={15} style={{ color: "#64748b", flexShrink: 0 }} />
                    </div>

                    {dropdownCursoAbierto && (
                      <div
                        style={{
                          position: "absolute",
                          top: "calc(100% + 4px)",
                          left: 0,
                          right: 0,
                          backgroundColor: "#ffffff",
                          border: "1px solid #d0dce8",
                          borderRadius: "8px",
                          boxShadow: "0 10px 25px -5px rgba(15, 23, 42, 0.14)",
                          zIndex: 40,
                          padding: "8px",
                        }}
                      >
                        <div style={{ position: "relative", marginBottom: "6px" }}>
                          <Search
                            size={13}
                            style={{
                              position: "absolute",
                              left: "9px",
                              top: "50%",
                              transform: "translateY(-50%)",
                              color: "#94a3b8",
                              pointerEvents: "none",
                            }}
                          />
                          <input
                            type="text"
                            placeholder="Buscar curso..."
                            value={busquedaCursoLicencia}
                            onChange={(e) => setBusquedaCursoLicencia(e.target.value)}
                            autoFocus
                            style={{
                              width: "100%",
                              height: "30px",
                              paddingLeft: "28px",
                              paddingRight: "8px",
                              fontSize: "12.5px",
                              border: "1px solid #cbd5e1",
                              borderRadius: "6px",
                              outline: "none",
                            }}
                          />
                        </div>
                        <div style={{ maxHeight: "180px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "2px" }}>
                          {cursosFiltradosDropdown.length === 0 ? (
                            <div style={{ padding: "8px", fontSize: "12px", color: "#94a3b8", textAlign: "center" }}>
                              Sin coincidencias
                            </div>
                          ) : (
                            cursosFiltradosDropdown.map((c) => {
                              const sel = c.i_CveServicio === cursoLicenciaSeleccionadoId;
                              return (
                                <button
                                  key={c.i_CveServicio}
                                  type="button"
                                  onClick={() => {
                                    setCursoLicenciaSeleccionadoId(c.i_CveServicio);
                                    setDropdownCursoAbierto(false);
                                    setBusquedaCursoLicencia("");
                                  }}
                                  style={{
                                    width: "100%",
                                    textAlign: "left",
                                    padding: "6px 8px",
                                    borderRadius: "6px",
                                    border: "none",
                                    backgroundColor: sel ? "#eef6fd" : "transparent",
                                    color: sel ? "#1d4ed8" : "#334155",
                                    fontSize: "12.5px",
                                    fontWeight: sel ? 600 : 400,
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    gap: "8px",
                                  }}
                                >
                                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                    {c.v_Servicio || `Curso #${c.i_CveServicio}`}
                                  </span>
                                  {c.v_NombreArchivoPersonalizada && (
                                    <span style={{ fontSize: "10.5px", color: "#2B8FCC", flexShrink: 0 }}>
                                      Personalizada
                                    </span>
                                  )}
                                </button>
                              );
                            })
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <div>
                    <input
                      ref={plantillaLicenciaInputRef}
                      type="file"
                      accept=".pptx"
                      style={{ display: "none" }}
                      onChange={handleSeleccionarPlantillaLicencia}
                    />
                    <button
                      type="button"
                      disabled={!cursoSeleccionadoObj || subiendoPlantillaLicencia}
                      onClick={() => plantillaLicenciaInputRef.current?.click()}
                      style={{
                        height: "36px",
                        padding: "0 14px",
                        borderRadius: "8px",
                        backgroundColor: !cursoSeleccionadoObj ? "#f8fafc" : "#ffffff",
                        border: !cursoSeleccionadoObj ? "1px solid #d0dce8" : "1px solid #2B8FCC",
                        color: !cursoSeleccionadoObj ? "#94a3b8" : "#2B8FCC",
                        fontSize: "12.5px",
                        fontWeight: 500,
                        cursor: !cursoSeleccionadoObj || subiendoPlantillaLicencia ? "not-allowed" : "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                      }}
                    >
                      {subiendoPlantillaLicencia ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <Upload size={14} />
                      )}
                      <span>
                        {subiendoPlantillaLicencia
                          ? "Subiendo..."
                          : cursoSeleccionadoObj?.v_NombreArchivoPersonalizada
                          ? "Reemplazar plantilla"
                          : "Cargar plantilla"}
                      </span>
                    </button>
                  </div>
                </div>

                {/* Tabla de plantillas personalizadas */}
                {cursosConPersonalizada.length > 0 && (
                  <div className="alegra-table-container" style={{ border: "1px solid #e2e8f0", borderRadius: "8px" }}>
                    <table className="alegra-table alegra-table-compact" style={{ width: "100%" }}>
                      <thead>
                        <tr>
                          <th>Curso</th>
                          <th>Archivo</th>
                          <th>Fecha de carga</th>
                          <th className="text-center" style={{ width: "90px" }}>Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {cursosConPersonalizada.map((c) => (
                          <tr key={c.i_CveServicio}>
                            <td style={{ fontSize: "12.5px", fontWeight: 500, color: "#1e293b" }}>
                              {c.v_Servicio || `Curso #${c.i_CveServicio}`}
                            </td>
                            <td style={{ fontSize: "12px", color: "#475569" }}>
                              {c.v_NombreArchivoPersonalizada}
                            </td>
                            <td style={{ fontSize: "12px", color: "#64748b", whiteSpace: "nowrap" }}>
                              {c.d_FechaCargaPersonalizada ? formatearFechaTexto(c.d_FechaCargaPersonalizada) : "—"}
                            </td>
                            <td className="text-center">
                              <div style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                                <button
                                  type="button"
                                  className="btn-icon"
                                  title="Descargar plantilla"
                                  disabled={descargandoCursoId === c.i_CveServicio}
                                  onClick={() => handleDescargarPlantillaCurso(c.i_CveServicio)}
                                  style={{ padding: "4px", color: "#2B8FCC", cursor: "pointer" }}
                                >
                                  {descargandoCursoId === c.i_CveServicio ? (
                                    <Loader2 size={14} className="animate-spin" />
                                  ) : (
                                    <Download size={14} />
                                  )}
                                </button>
                                <button
                                  type="button"
                                  className="btn-icon danger"
                                  title="Eliminar plantilla personalizada"
                                  onClick={() => setCursoPlantillaEliminar(c)}
                                  style={{ padding: "4px", color: "#ef4444", cursor: "pointer" }}
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Aviso ámbar si algún curso no tiene ni personalizada ni general */}
                {cursosSinNingunaPlantilla.length > 0 && (
                  <div
                    style={{
                      padding: "10px 12px",
                      backgroundColor: "#fffbeb",
                      border: "1px solid #fde68a",
                      borderRadius: "8px",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      fontSize: "12px",
                      color: "#b45309",
                    }}
                  >
                    <AlertTriangle size={15} style={{ color: "#d97706", flexShrink: 0 }} />
                    <span>
                      Sin plantilla de licencia:{" "}
                      {cursosSinNingunaPlantilla
                        .map((c) => c.v_Servicio || `Curso #${c.i_CveServicio}`)
                        .join(", ")}
                    </span>
                  </div>
                )}
              </>
            )}
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

          {/* Casilla de envío periódico de lista de alumnos por correo */}
          <div style={{ marginTop: "16px" }}>
            <label
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                fontSize: "12px",
                fontWeight: 600,
                color: "#1e3a5f",
                cursor: guardandoAvisoInscritos ? "not-allowed" : "pointer",
                userSelect: "none",
                opacity: guardandoAvisoInscritos ? 0.65 : 1,
                margin: 0,
              }}
            >
              <input
                type="checkbox"
                checked={b_AvisoInscritos}
                disabled={guardandoAvisoInscritos}
                onChange={(e) => handleToggleAvisoInscritos(e.target.checked)}
                style={{
                  accentColor: "#2B8FCC",
                  width: "15px",
                  height: "15px",
                  cursor: guardandoAvisoInscritos ? "not-allowed" : "pointer",
                  flexShrink: 0,
                }}
              />
              <span>¿Enviar lista de alumnos por correo, periódicamente?</span>
            </label>
            <p
              style={{
                fontSize: "11px",
                color: "#6c757d",
                margin: "3px 0 0 23px",
                lineHeight: 1.35,
              }}
            >
              Se envía 14, 7 y 4 días antes de cada capacitación.
            </p>
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

              <div>
                <label style={{ fontSize: "11px", fontWeight: 600, color: "#4a6580", display: "block", marginBottom: "8px" }}>
                  Recordatorios por correo
                </label>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
                    gap: "10px",
                  }}
                >
                  <label
                    htmlFor="chk-recordatorio-pagos"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "8px",
                      fontSize: "12.5px",
                      fontWeight: 500,
                      color: "#1e3a5f",
                      cursor: "pointer",
                      userSelect: "none",
                      margin: 0,
                    }}
                  >
                    <input
                      id="chk-recordatorio-pagos"
                      type="checkbox"
                      checked={b_RecordatorioPagos}
                      onChange={(e) => setB_RecordatorioPagos(e.target.checked)}
                      style={{
                        width: "15px",
                        height: "15px",
                        accentColor: "#2B8FCC",
                        cursor: "pointer",
                        margin: 0,
                        flexShrink: 0,
                      }}
                    />
                    <span>Mandar recordatorios de pagos</span>
                  </label>

                  <label
                    htmlFor="chk-recordatorio-oc"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "8px",
                      fontSize: "12.5px",
                      fontWeight: 500,
                      color: "#1e3a5f",
                      cursor: "pointer",
                      userSelect: "none",
                      margin: 0,
                    }}
                  >
                    <input
                      id="chk-recordatorio-oc"
                      type="checkbox"
                      checked={b_RecordatorioOC}
                      onChange={(e) => setB_RecordatorioOC(e.target.checked)}
                      style={{
                        width: "15px",
                        height: "15px",
                        accentColor: "#2B8FCC",
                        cursor: "pointer",
                        margin: 0,
                        flexShrink: 0,
                      }}
                    />
                    <span>Mandar recordatorios de órdenes de compra</span>
                  </label>
                </div>
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
      <ModalConfirmarEliminar
        abierto={Boolean(cursoPlantillaEliminar)}
        nombreElemento={cursoPlantillaEliminar?.v_Servicio || "plantilla personalizada"}
        mensajePersonalizado="Este curso volverá a usar la plantilla general."
        cargando={eliminandoPlantillaLicencia}
        onCerrar={() => setCursoPlantillaEliminar(null)}
        onConfirmar={handleConfirmarEliminarPlantillaCurso}
      />
    </div>
  );
};
