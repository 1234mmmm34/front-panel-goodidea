"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Save, ArrowLeft, Search, Building2, MapPin } from "lucide-react";
import { EmpresaGetDto, EmpresaPostPayload } from "@/types/empresas";
import { EmpresasService } from "@/services/empresas.service";
import { obtenerSesionActual } from "@/lib/api-client";

interface Props {
  empresaEditar?: EmpresaGetDto | null;
}

export const FormularioEmpresa: React.FC<Props> = ({ empresaEditar }) => {
  const router = useRouter();

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

  // Validación por Contador de Errores
  const [showErrors, setShowErrors] = useState<boolean>(false);
  const [guardando, setGuardando] = useState<boolean>(false);

  useEffect(() => {
    if (empresaEditar) {
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
      if (tc === 2) {
        setEsCliente(true);
        setEsProveedor(true);
      } else if (tc === 1) {
        setEsCliente(false);
        setEsProveedor(true);
      } else {
        setEsCliente(true);
        setEsProveedor(false);
      }
    }
  }, [empresaEditar]);

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
      alert("No se encontró información para el Código Postal ingresado.");
    }
  };

  // Reglas de validación
  const esRazonInvalida = showErrors && !razonSocial.trim();
  const esRfcInvalido = showErrors && !rfc.trim();
  const esCalleInvalida = showErrors && !nombreCalle.trim();
  const esNumExtInvalido = showErrors && !numeroExterior.trim();
  const esCPInvalido = showErrors && (!codigoPostal || isNaN(Number(codigoPostal)));
  const esTipoContactoInvalido = showErrors && !esCliente && !esProveedor;

  const calcularErrores = () => {
    let count = 0;
    if (!razonSocial.trim()) count++;
    if (!rfc.trim()) count++;
    if (!nombreCalle.trim()) count++;
    if (!numeroExterior.trim()) count++;
    if (!codigoPostal || isNaN(Number(codigoPostal))) count++;
    if (!esCliente && !esProveedor) count++;
    return count;
  };

  const handleGuardar = async (e: React.FormEvent) => {
    e.preventDefault();
    setShowErrors(true);

    const count = calcularErrores();
    if (count > 0) return;

    setGuardando(true);

    const sesion = await obtenerSesionActual();
    const tenantId = sesion?.IdTenant ?? 1;

    let tipoContacto = 0;
    if (esCliente && esProveedor) tipoContacto = 2;
    else if (esProveedor) tipoContacto = 1;
    else tipoContacto = 0;

    const fechaBaja = estatus === "Inactivo" ? new Date().toISOString() : null;

    const payload: EmpresaPostPayload = {
      ID_Empresa: empresaEditar?.iD_Empresa,
      d_FechaAlta: empresaEditar?.d_FechaAlta || new Date().toISOString(),
      d_FechaBaja: fechaBaja,
      s_RazonSocial: razonSocial.trim(),
      s_RegistroPatronal: registroPatronal.trim() || "N/A",
      s_RepresentanteLegal: representanteLegal.trim() || "N/A",
      s_RFC: rfc.trim() || "N/A",
      d_DiasCredito: diasCredito || "0",
      s_GiroActividad: giroActividad.trim() || "N/A",
      i_TipoDomicilio: 1,
      v_NombreCalle: nombreCalle.trim(),
      v_NumeroInterior: numeroInterior.trim() || "0",
      v_NumeroExterior: numeroExterior.trim(),
      v_Fraccionamiento: fraccionamiento.trim() || "N/A",
      i_TipoContacto: tipoContacto,
      i_CodigoPostal: Number(codigoPostal),
      i_CveTenant: tenantId,
    };

    let exito = false;
    if (empresaEditar) {
      exito = await EmpresasService.editar(payload);
    } else {
      exito = await EmpresasService.crear(payload);
    }

    setGuardando(false);

    if (exito) {
      router.push("/empresas");
    } else {
      alert("Ocurrió un error al guardar los datos del cliente.");
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-secondary">
        <Link href="/empresas" className="hover:text-primary transition-colors">
          Empresas
        </Link>
        <span>›</span>
        <span className="font-semibold text-slate-800">
          {empresaEditar ? `${empresaEditar.s_RazonSocial} (Editar)` : "Agregar empresa"}
        </span>
      </div>

      <form onSubmit={handleGuardar} className="card p-6">
        <div className="flex items-center justify-between mb-6 pb-4 border-b">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Building2 className="text-primary" size={22} />
            {empresaEditar ? "Editar Datos del Cliente" : "Registrar Nuevo Cliente / Empresa"}
          </h2>

          <Link href="/empresas" className="btn btn-outline btn-sm">
            <ArrowLeft size={16} /> Volver
          </Link>
        </div>

        {/* Tipo de Contacto */}
        <div className="form-group mb-6">
          <label className="form-label">Tipo de contacto *</label>
          <div className="flex items-center gap-4">
            <button
              type="button"
              className={`btn ${esCliente ? "btn-primary" : "btn-outline"}`}
              onClick={() => setEsCliente(!esCliente)}
            >
              Cliente
            </button>
            <button
              type="button"
              className={`btn ${esProveedor ? "btn-primary" : "btn-outline"}`}
              onClick={() => setEsProveedor(!esProveedor)}
            >
              Proveedor
            </button>
          </div>
          {esTipoContactoInvalido && (
            <span className="text-xs text-danger mt-1">
              Debes seleccionar al menos una opción (Cliente o Proveedor).
            </span>
          )}
        </div>

        {/* Datos Generales */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="form-group">
            <label className="form-label">Razón Social *</label>
            <input
              type="text"
              className={`form-control ${esRazonInvalida ? "is-invalid" : ""}`}
              placeholder="Ej. Industrias STPS S.A. de C.V."
              value={razonSocial}
              onChange={(e) => setRazonSocial(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">RFC *</label>
            <input
              type="text"
              className={`form-control ${esRfcInvalido ? "is-invalid" : ""}`}
              placeholder="Ej. IST980101ABC"
              value={rfc}
              onChange={(e) => setRfc(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Registro Patronal</label>
            <input
              type="text"
              className="form-control"
              placeholder="Ej. A1234567890"
              value={registroPatronal}
              onChange={(e) => setRegistroPatronal(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Representante Legal</label>
            <input
              type="text"
              className="form-control"
              placeholder="Ej. Lic. Juan Pérez González"
              value={representanteLegal}
              onChange={(e) => setRepresentanteLegal(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Giro de la Actividad</label>
            <input
              type="text"
              className="form-control"
              placeholder="Ej. Manufactura de Plásticos"
              value={giroActividad}
              onChange={(e) => setGiroActividad(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Días de Crédito</label>
            <input
              type="text"
              className="form-control"
              placeholder="30"
              value={diasCredito}
              onChange={(e) => setDiasCredito(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Estatus</label>
            <select
              className="form-select"
              value={estatus}
              onChange={(e) => setEstatus(e.target.value as "Activo" | "Inactivo")}
            >
              <option value="Activo">Activo</option>
              <option value="Inactivo">Inactivo</option>
            </select>
          </div>
        </div>

        {/* Sección Domicilio */}
        <div className="border-t pt-6 mb-6">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-slate-800">
            <MapPin size={18} className="text-primary" /> Domicilio Fiscal
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="form-group">
              <label className="form-label">Código Postal *</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  className={`form-control ${esCPInvalido ? "is-invalid" : ""}`}
                  placeholder="Ej. 06600"
                  value={codigoPostal}
                  onChange={(e) => setCodigoPostal(e.target.value)}
                />
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={handleBuscarCP}
                  disabled={buscandoCP}
                >
                  <Search size={16} /> {buscandoCP ? "..." : "Buscar"}
                </button>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Estado</label>
              <input
                type="text"
                className="form-control"
                disabled
                value={estado || "Se llena al buscar CP"}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Municipio / Alcaldía</label>
              <input
                type="text"
                className="form-control"
                disabled
                value={municipio || "Se llena al buscar CP"}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Fraccionamiento / Colonia</label>
              <input
                type="text"
                className="form-control"
                placeholder="Ej. Juárez"
                value={fraccionamiento}
                onChange={(e) => setFraccionamiento(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Nombre de Calle *</label>
              <input
                type="text"
                className={`form-control ${esCalleInvalida ? "is-invalid" : ""}`}
                placeholder="Ej. Av. Reforma"
                value={nombreCalle}
                onChange={(e) => setNombreCalle(e.target.value)}
              />
            </div>

            <div className="form-group grid grid-cols-2 gap-2">
              <div>
                <label className="form-label">No. Exterior *</label>
                <input
                  type="text"
                  className={`form-control ${esNumExtInvalido ? "is-invalid" : ""}`}
                  placeholder="123"
                  value={numeroExterior}
                  onChange={(e) => setNumeroExterior(e.target.value)}
                />
              </div>
              <div>
                <label className="form-label">No. Interior</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Piso 4"
                  value={numeroInterior}
                  onChange={(e) => setNumeroInterior(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Botones de acción */}
        <div className="flex items-center justify-end gap-3 border-t pt-4">
          <Link href="/empresas" className="btn btn-secondary">
            Cancelar
          </Link>
          <button type="submit" className="btn btn-primary" disabled={guardando}>
            <Save size={16} />
            {guardando ? "Guardando..." : "Guardar Cliente"}
          </button>
        </div>
      </form>
    </div>
  );
};
