"use client";

import React from "react";
import { PipcExpediente, TurnoRow, formatTelefono } from "../pipcCalculos";
import {
  DIAS_SEMANA,
  MUNICIPIOS_EMPRESA_OPCIONES,
  CATALOGO_DIRECTORES_PC,
} from "../pipcCatalogos";
import { ZonaFotos } from "../comunes/ZonaFotos";
import { TablaEditable, ColumnaEditable } from "../comunes/TablaEditable";
import { TextoPendiente } from "../comunes/TextoPendiente";

interface Props {
  expediente: PipcExpediente;
  setFormField: (field: any, value: any) => void;
  setPlanTipoYMunicipio: (tipo: "estatal" | "municipal" | "", muni?: string) => void;
  setTurnosAdmin: (rows: TurnoRow[]) => void;
  setTurnosOperativo: (rows: TurnoRow[]) => void;
  agregarFoto: (seccionKey: string, archivo: File, soloUna?: boolean) => void;
  quitarFoto: (seccionKey: string, fotoId: string) => void;
  soloLectura?: boolean;
}

const columnasTurno: ColumnaEditable[] = [
  { key: "turno", label: "Turno", placeholder: "Ej. 1", width: "80px" },
  { key: "diaInicio", label: "Día inicio", type: "select", options: DIAS_SEMANA, width: "130px" },
  { key: "diaFin", label: "Día fin", type: "select", options: DIAS_SEMANA, width: "130px" },
  { key: "horaInicio", label: "Hora inicio (24h)", placeholder: "08:00", width: "130px" },
  { key: "horaFin", label: "Hora fin (24h)", placeholder: "17:00", width: "130px" },
];

export const SeccionGenerales: React.FC<Props> = ({
  expediente,
  setFormField,
  setPlanTipoYMunicipio,
  setTurnosAdmin,
  setTurnosOperativo,
  agregarFoto,
  quitarFoto,
  soloLectura = false,
}) => {
  const form = expediente.form;

  // Manejo de titular PC con catálogo y aviso dinámico
  const tipo = form.plan_tipo;
  const muniReal = form.empresa_municipio === "Otro" ? form.empresa_municipio_otro : form.empresa_municipio;

  const entradaCat =
    tipo === "estatal"
      ? (CATALOGO_DIRECTORES_PC as any).estado
      : tipo === "municipal"
      ? (CATALOGO_DIRECTORES_PC as any).municipios[muniReal] || null
      : null;

  // Determinar si los datos actuales son de catálogo
  const esDeCatalogo = () => {
    const n = form.pc_titular_nombre,
      c = form.pc_titular_cargo,
      d = form.pc_dependencia;
    if (!n && !c && !d) return true;
    const todas = [
      (CATALOGO_DIRECTORES_PC as any).estado,
      ...Object.keys((CATALOGO_DIRECTORES_PC as any).municipios).map(
        (k) => (CATALOGO_DIRECTORES_PC as any).municipios[k]
      ),
    ];
    return todas.some((e) => e.titular === n && e.cargo === c && e.dependencia === d);
  };

  const handleCambiarPlanTipo = (nuevoTipo: "estatal" | "municipal") => {
    if (soloLectura) return;
    if (!esDeCatalogo()) {
      const e =
        nuevoTipo === "estatal"
          ? (CATALOGO_DIRECTORES_PC as any).estado
          : (CATALOGO_DIRECTORES_PC as any).municipios[muniReal];
      if (
        e &&
        !window.confirm(
          `Los datos del titular de Protección Civil fueron editados a mano. ¿Reemplazarlos con los del catálogo (${e.titular})?`
        )
      ) {
        setFormField("plan_tipo", nuevoTipo);
        return;
      }
    }
    setPlanTipoYMunicipio(nuevoTipo, form.empresa_municipio);
  };

  const handleCambiarMunicipio = (nuevoMuni: string) => {
    if (soloLectura) return;
    if (tipo === "municipal" && !esDeCatalogo()) {
      const e = (CATALOGO_DIRECTORES_PC as any).municipios[nuevoMuni];
      if (
        e &&
        !window.confirm(
          `Los datos del titular de Protección Civil fueron editados a mano. ¿Reemplazarlos con los del catálogo (${e.titular})?`
        )
      ) {
        setFormField("empresa_municipio", nuevoMuni);
        return;
      }
    }
    setPlanTipoYMunicipio(form.plan_tipo, nuevoMuni);
  };

  const getAvisoTitular = () => {
    if (!tipo) {
      return {
        texto: "Elige el tipo de plan para cargar al titular desde el catálogo.",
        color: "#64748b",
      };
    }
    if (tipo === "municipal" && !muniReal) {
      return {
        texto: "Elige el municipio de la empresa para cargar al titular municipal.",
        color: "#64748b",
      };
    }
    if (!entradaCat) {
      return {
        texto: `⚠️ No hay datos del titular de ${muniReal || "este municipio"} en el catálogo: captúralos a mano.`,
        color: "#c0392b",
      };
    }
    return {
      texto: "Datos tomados del catálogo de directores de Nuevo León. Puedes editarlos.",
      color: "#64748b",
    };
  };

  const aviso = getAvisoTitular();

  const handleAddTurno = (tipoTurno: "admin" | "operativo") => {
    const nuevo: TurnoRow = {
      turno: String(
        (tipoTurno === "admin" ? expediente.turnosAdmin.length : expediente.turnosOperativo.length) + 1
      ),
      diaInicio: "Lunes",
      diaFin: "Viernes",
      horaInicio: tipoTurno === "admin" ? "08:30" : "07:00",
      horaFin: tipoTurno === "admin" ? "18:00" : "15:00",
    };
    if (tipoTurno === "admin") {
      setTurnosAdmin([...expediente.turnosAdmin, nuevo]);
    } else {
      setTurnosOperativo([...expediente.turnosOperativo, nuevo]);
    }
  };

  const handleRemoveTurno = (tipoTurno: "admin" | "operativo", index: number) => {
    if (tipoTurno === "admin") {
      setTurnosAdmin(expediente.turnosAdmin.filter((_, i) => i !== index));
    } else {
      setTurnosOperativo(expediente.turnosOperativo.filter((_, i) => i !== index));
    }
  };

  const handleChangeTurno = (
    tipoTurno: "admin" | "operativo",
    index: number,
    key: string,
    val: any
  ) => {
    const list = tipoTurno === "admin" ? [...expediente.turnosAdmin] : [...expediente.turnosOperativo];
    list[index] = { ...list[index], [key]: val };
    if (tipoTurno === "admin") setTurnosAdmin(list);
    else setTurnosOperativo(list);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {/* Card 1: Tipo de Plan de Contingencias */}
      <div className="card p-4">
        <div style={{ borderLeft: "3px solid #2B8FCC", paddingLeft: "10px", marginBottom: "14px" }}>
          <h3 style={{ fontSize: "13px", fontWeight: 700, color: "#1e293b", textTransform: "uppercase", margin: 0 }}>
            Tipo de plan de contingencias <span style={{ color: "#dc2626" }}>*</span>
          </h3>
          <p style={{ fontSize: "11px", color: "#64748b", margin: 0 }}>
            Selecciona si el plan se presenta ante Protección Civil del Estado o del Municipio.
          </p>
        </div>

        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
          <button
            type="button"
            disabled={soloLectura}
            onClick={() => handleCambiarPlanTipo("estatal")}
            className={`btn btn-sm ${form.plan_tipo === "estatal" ? "btn-primary" : "btn-outline-secondary"}`}
            style={{
              padding: "8px 20px",
              fontWeight: 600,
              fontSize: "12px",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <i className="bi bi-bank" />
            Plan Estatal (PCNL)
          </button>

          <button
            type="button"
            disabled={soloLectura}
            onClick={() => handleCambiarPlanTipo("municipal")}
            className={`btn btn-sm ${form.plan_tipo === "municipal" ? "btn-primary" : "btn-outline-secondary"}`}
            style={{
              padding: "8px 20px",
              fontWeight: 600,
              fontSize: "12px",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <i className="bi bi-geo-alt" />
            Plan Municipal
          </button>
        </div>
      </div>

      {/* Card 2: Identificación de la Empresa y Municipio */}
      <div className="card p-4">
        <div style={{ borderLeft: "3px solid #2B8FCC", paddingLeft: "10px", marginBottom: "14px" }}>
          <h3 style={{ fontSize: "13px", fontWeight: 700, color: "#1e293b", textTransform: "uppercase", margin: 0 }}>
            Identificación de la empresa y ubicación
          </h3>
          <p style={{ fontSize: "11px", color: "#64748b", margin: 0 }}>
            Datos principales, municipio para la autoridad de PC y logotipo del cliente.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "14px" }}>
          <div>
            <label className="form-label text-xs">
              Nombre comercial <span style={{ color: "#dc2626" }}>*</span>
            </label>
            <input
              type="text"
              className="form-control text-xs"
              value={form.empresa_nombre}
              disabled={soloLectura}
              onChange={(e) => setFormField("empresa_nombre", e.target.value)}
              placeholder="Ej. ACEROS INDUSTRIALES DEL NORTE"
            />
          </div>

          <div>
            <label className="form-label text-xs">
              Razón social <span style={{ color: "#dc2626" }}>*</span>
            </label>
            <input
              type="text"
              className="form-control text-xs"
              value={form.empresa_razon_social}
              disabled={soloLectura}
              onChange={(e) => setFormField("empresa_razon_social", e.target.value)}
              placeholder="Ej. ACEROS INDUSTRIALES DEL NORTE, S.A. DE C.V."
            />
          </div>

          <div>
            <label className="form-label text-xs">Giro / Actividad preponderante</label>
            <input
              type="text"
              className="form-control text-xs"
              value={form.empresa_giro}
              disabled={soloLectura}
              onChange={(e) => setFormField("empresa_giro", e.target.value)}
              placeholder="Ej. Fabricación de perfiles y estructuras metálicas"
            />
          </div>

          <div>
            <label className="form-label text-xs">
              Municipio de la empresa <span style={{ color: "#dc2626" }}>*</span>
            </label>
            <select
              className="form-select form-select-sm"
              value={form.empresa_municipio}
              disabled={soloLectura}
              onChange={(e) => handleCambiarMunicipio(e.target.value)}
              style={{ fontSize: "12px" }}
            >
              <option value="">— Seleccionar municipio —</option>
              {MUNICIPIOS_EMPRESA_OPCIONES.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          {form.empresa_municipio === "Otro" && (
            <div>
              <label className="form-label text-xs">
                Nombre del municipio <span style={{ color: "#dc2626" }}>*</span>
              </label>
              <input
                type="text"
                className="form-control text-xs"
                value={form.empresa_municipio_otro}
                disabled={soloLectura}
                onChange={(e) => {
                  setFormField("empresa_municipio_otro", e.target.value);
                  setPlanTipoYMunicipio(form.plan_tipo, "Otro");
                }}
                placeholder="Escribe el nombre del municipio..."
              />
            </div>
          )}

          <div style={{ gridColumn: "1 / -1" }}>
            <label className="form-label text-xs">Logotipo del cliente (1 imagen)</label>
            <ZonaFotos
              fotos={expediente.fotos["logo-cliente"] || []}
              onSubir={(arch) => agregarFoto("logo-cliente", arch, true)}
              onQuitar={(fotoId) => quitarFoto("logo-cliente", fotoId)}
              multiple={false}
              label="Seleccionar o arrastrar logotipo del cliente (1 imagen)"
              soloLectura={soloLectura}
            />
          </div>
        </div>
      </div>

      {/* Card 3: Titular de Protección Civil */}
      <div className="card p-4">
        <div style={{ borderLeft: "3px solid #2B8FCC", paddingLeft: "10px", marginBottom: "14px" }}>
          <h3 style={{ fontSize: "13px", fontWeight: 700, color: "#1e293b", textTransform: "uppercase", margin: 0 }}>
            Titular de Protección Civil (Oficio y Acta)
          </h3>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", marginTop: "4px" }}>
            <p style={{ fontSize: "11px", color: aviso.color, margin: 0, fontWeight: 500 }}>
              {aviso.texto}
            </p>
            {(!form.pc_titular_nombre || !form.pc_titular_cargo) && !entradaCat && (
              <span style={{ fontSize: "11px", color: "#64748b" }}>
                Titular: <TextoPendiente title="No disponible en catálogo: capturar nombre y cargo a mano" />
              </span>
            )}
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "14px" }}>
          <div>
            <label className="form-label text-xs">
              Nombre del titular <span style={{ color: "#dc2626" }}>*</span>
            </label>
            <input
              type="text"
              className="form-control text-xs"
              value={form.pc_titular_nombre}
              disabled={soloLectura}
              onChange={(e) => setFormField("pc_titular_nombre", e.target.value)}
              placeholder="Ej. Dr. Erik T. Cavazos Cavazos"
            />
          </div>

          <div>
            <label className="form-label text-xs">
              Cargo del titular <span style={{ color: "#dc2626" }}>*</span>
            </label>
            <input
              type="text"
              className="form-control text-xs"
              value={form.pc_titular_cargo}
              disabled={soloLectura}
              onChange={(e) => setFormField("pc_titular_cargo", e.target.value)}
              placeholder="Ej. Director de Protección Civil del Estado"
            />
          </div>

          <div style={{ gridColumn: "1 / -1" }}>
            <label className="form-label text-xs">
              Nombre completo de la dependencia {form.plan_tipo === "municipal" && <span style={{ color: "#dc2626" }}>*</span>}
            </label>
            <input
              type="text"
              className="form-control text-xs"
              value={form.pc_dependencia}
              disabled={soloLectura}
              onChange={(e) => setFormField("pc_dependencia", e.target.value)}
              placeholder="Ej. Dirección de Protección Civil del Estado de Nuevo León"
            />
          </div>
        </div>
      </div>

      {/* Card 4: Contactos y Domicilio */}
      <div className="card p-4">
        <div style={{ borderLeft: "3px solid #2B8FCC", paddingLeft: "10px", marginBottom: "14px" }}>
          <h3 style={{ fontSize: "13px", fontWeight: 700, color: "#1e293b", textTransform: "uppercase", margin: 0 }}>
            Contactos y domicilio
          </h3>
          <p style={{ fontSize: "11px", color: "#64748b", margin: 0 }}>
            Representantes legales y ubicación física para notificaciones de Protección Civil.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "14px" }}>
          <div>
            <label className="form-label text-xs">
              Responsable de notificaciones <span style={{ color: "#dc2626" }}>*</span>
            </label>
            <input
              type="text"
              className="form-control text-xs"
              value={form.empresa_responsable}
              disabled={soloLectura}
              onChange={(e) => setFormField("empresa_responsable", e.target.value)}
              placeholder="Ej. Ing. Roberto Mendoza Garza"
            />
          </div>

          <div>
            <label className="form-label text-xs">
              Representante legal <span style={{ color: "#dc2626" }}>*</span>
            </label>
            <input
              type="text"
              className="form-control text-xs"
              value={form.empresa_rep_legal}
              disabled={soloLectura}
              onChange={(e) => setFormField("empresa_rep_legal", e.target.value)}
              placeholder="Ej. Lic. Carlos Villagrán Fuentes"
            />
          </div>

          <div style={{ gridColumn: "1 / -1" }}>
            <label className="form-label text-xs">
              Domicilio físico de la instalación <span style={{ color: "#dc2626" }}>*</span>
            </label>
            <input
              type="text"
              className="form-control text-xs"
              value={form.empresa_domicilio}
              disabled={soloLectura}
              onChange={(e) => setFormField("empresa_domicilio", e.target.value)}
              placeholder="Calle, número, colonia, código postal, municipio, estado"
            />
          </div>

          <div style={{ gridColumn: "1 / -1" }}>
            <label className="form-label text-xs">Domicilio para notificaciones</label>
            <input
              type="text"
              className="form-control text-xs"
              value={form.empresa_domicilio_notificaciones}
              disabled={soloLectura}
              onChange={(e) => setFormField("empresa_domicilio_notificaciones", e.target.value)}
              placeholder="Si es igual al físico, dejar idéntico o especificar domicilio legal"
            />
          </div>

          <div>
            <label className="form-label text-xs">Nacionalidad de la empresa</label>
            <input
              type="text"
              className="form-control text-xs"
              value={form.empresa_nacionalidad}
              disabled={soloLectura}
              onChange={(e) => setFormField("empresa_nacionalidad", e.target.value)}
              placeholder="Ej. Mexicana"
            />
          </div>

          <div>
            <label className="form-label text-xs">
              Teléfono de contacto <span style={{ color: "#dc2626" }}>*</span>
            </label>
            <input
              type="tel"
              className="form-control text-xs"
              value={form.empresa_telefono}
              disabled={soloLectura}
              onChange={(e) => setFormField("empresa_telefono", formatTelefono(e.target.value))}
              placeholder="(81) 1234-5678"
            />
          </div>
        </div>
      </div>

      {/* Card 5: Consultor Externo */}
      <div className="card p-4">
        <div style={{ borderLeft: "3px solid #2B8FCC", paddingLeft: "10px", marginBottom: "14px" }}>
          <h3 style={{ fontSize: "13px", fontWeight: 700, color: "#1e293b", textTransform: "uppercase", margin: 0 }}>
            Consultor externo (firma el Oficio responsiva)
          </h3>
          <p style={{ fontSize: "11px", color: "#64748b", margin: 0 }}>
            Datos del consultor registrado ante Protección Civil que avala el programa.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "14px" }}>
          <div>
            <label className="form-label text-xs">Nombre del consultor</label>
            <input
              type="text"
              className="form-control text-xs"
              value={form.consultor_externo_nombre}
              disabled={soloLectura}
              onChange={(e) => setFormField("consultor_externo_nombre", e.target.value)}
              placeholder="Ej. Ing. Faustino Carlos Alatorre Hernández"
            />
          </div>

          <div>
            <label className="form-label text-xs">No. de registro del consultor</label>
            <input
              type="text"
              className="form-control text-xs"
              value={form.consultor_externo_registro}
              disabled={soloLectura}
              onChange={(e) => setFormField("consultor_externo_registro", e.target.value)}
              placeholder="Ej. DPCE-APF-146-2025"
            />
          </div>
        </div>
      </div>

      {/* Card 6: Datos del Documento y Superficies */}
      <div className="card p-4">
        <div style={{ borderLeft: "3px solid #2B8FCC", paddingLeft: "10px", marginBottom: "14px" }}>
          <h3 style={{ fontSize: "13px", fontWeight: 700, color: "#1e293b", textTransform: "uppercase", margin: 0 }}>
            Datos del documento y superficies
          </h3>
          <p style={{ fontSize: "11px", color: "#64748b", margin: 0 }}>
            Fechas clave y dimensiones del inmueble en metros cuadrados.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "14px" }}>
          <div>
            <label className="form-label text-xs">
              Fecha de elaboración <span style={{ color: "#dc2626" }}>*</span>
            </label>
            <input
              type="date"
              className="form-control text-xs"
              value={form.fecha_elaboracion}
              disabled={soloLectura}
              onChange={(e) => setFormField("fecha_elaboracion", e.target.value)}
            />
          </div>

          <div>
            <label className="form-label text-xs">Fecha de inicio PIPC</label>
            <input
              type="date"
              className="form-control text-xs"
              value={form.fecha_inicio_pipc}
              disabled={soloLectura}
              onChange={(e) => setFormField("fecha_inicio_pipc", e.target.value)}
            />
          </div>

          <div>
            <label className="form-label text-xs">
              Superficie de construcción (m²) <span style={{ color: "#dc2626" }}>*</span>
            </label>
            <input
              type="number"
              step="0.01"
              className="form-control text-xs"
              value={form.superficie_m2}
              disabled={soloLectura}
              onChange={(e) => setFormField("superficie_m2", e.target.value)}
              placeholder="0.00"
            />
          </div>

          <div>
            <label className="form-label text-xs">Superficie de terreno (m²)</label>
            <input
              type="number"
              step="0.01"
              className="form-control text-xs"
              value={form.superficie_terreno_m2}
              disabled={soloLectura}
              onChange={(e) => setFormField("superficie_terreno_m2", e.target.value)}
              placeholder="0.00"
            />
          </div>
        </div>
      </div>

      {/* Card 7: Personal y Turnos */}
      <div className="card p-4">
        <div style={{ borderLeft: "3px solid #2B8FCC", paddingLeft: "10px", marginBottom: "14px" }}>
          <h3 style={{ fontSize: "13px", fontWeight: 700, color: "#1e293b", textTransform: "uppercase", margin: 0 }}>
            Personal y turnos laborales
          </h3>
          <p style={{ fontSize: "11px", color: "#64748b", margin: 0 }}>
            Conteo de colaboradores y horarios de operación por área.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "14px", marginBottom: "16px" }}>
          <div>
            <label className="form-label text-xs">Personal administrativo total</label>
            <input
              type="number"
              className="form-control text-xs"
              value={form.personal_admin}
              disabled={soloLectura}
              onChange={(e) => setFormField("personal_admin", e.target.value)}
              placeholder="0"
            />
          </div>

          <div>
            <label className="form-label text-xs">Personal operativo total</label>
            <input
              type="number"
              className="form-control text-xs"
              value={form.personal_operativo}
              disabled={soloLectura}
              onChange={(e) => setFormField("personal_operativo", e.target.value)}
              placeholder="0"
            />
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div>
            <h4 style={{ fontSize: "12px", fontWeight: 700, color: "#334155", marginBottom: "8px" }}>
              Turnos del personal administrativo
            </h4>
            <TablaEditable
              columnas={columnasTurno}
              filas={expediente.turnosAdmin}
              onAgregarFila={() => handleAddTurno("admin")}
              onQuitarFila={(i: number) => handleRemoveTurno("admin", i)}
              onChangeFila={(i: number, k: string, v: any) => handleChangeTurno("admin", i, k, v)}
              textoBotonAgregar="+ Agregar turno administrativo"
              soloLectura={soloLectura}
            />
          </div>

          <div>
            <h4 style={{ fontSize: "12px", fontWeight: 700, color: "#334155", marginBottom: "8px" }}>
              Turnos del personal operativo
            </h4>
            <TablaEditable
              columnas={columnasTurno}
              filas={expediente.turnosOperativo}
              onAgregarFila={() => handleAddTurno("operativo")}
              onQuitarFila={(i: number) => handleRemoveTurno("operativo", i)}
              onChangeFila={(i: number, k: string, v: any) => handleChangeTurno("operativo", i, k, v)}
              textoBotonAgregar="+ Agregar turno operativo"
              soloLectura={soloLectura}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
