"use client";

import React from "react";
import {
  PipcExpediente,
  PoblacionFijaRow,
  PoblacionFlotanteRow,
  AreaInmuebleRow,
  EquipoRow,
  ProgramaMantenimientoEquipos,
} from "../pipcCalculos";
import { VULNERABILIDAD_OPTS, APOYO_OPTS } from "../pipcCatalogos";
import { TablaEditable, ColumnaEditable } from "../comunes/TablaEditable";
import { TablaProgramaPR } from "../comunes/TablaProgramaPR";
import { ZonaFotos } from "../comunes/ZonaFotos";
import { TextoPendiente } from "../comunes/TextoPendiente";

interface Props {
  expediente: PipcExpediente;
  setPoblacionFija: (rows: PoblacionFijaRow[]) => void;
  setPoblacionFlotante: (rows: PoblacionFlotanteRow[]) => void;
  setAreasInmueble: (rows: AreaInmuebleRow[]) => void;
  setEquiposEmergencia: (rows: EquipoRow[]) => void;
  setEquiposAltoRiesgo: (rows: EquipoRow[]) => void;
  setProgramaEquiposEmergencia: (prog: ProgramaMantenimientoEquipos) => void;
  setProgramaEquiposAltoRiesgo: (prog: ProgramaMantenimientoEquipos) => void;
  agregarFoto: (seccionKey: string, archivo: File, soloUna?: boolean) => void;
  quitarFoto: (seccionKey: string, fotoId: string) => void;
  soloLectura?: boolean;
}

const columnasPoblacionFija: ColumnaEditable[] = [
  { key: "area", label: "Área", placeholder: "Ej. Producción", width: "180px" },
  { key: "hombres", label: "Hombres", type: "number", placeholder: "0", width: "90px" },
  { key: "mujeres", label: "Mujeres", type: "number", placeholder: "0", width: "90px" },
  { key: "total", label: "Total", placeholder: "0", width: "80px", readOnly: true },
  { key: "vulnerable", label: "Vulnerable", type: "select", options: ["No", "Sí"], width: "100px" },
  { key: "detalle", label: "Detalle vulnerabilidad", type: "select", options: VULNERABILIDAD_OPTS, width: "170px" },
  { key: "apoyo", label: "Tipo de apoyo", type: "select", options: APOYO_OPTS, width: "170px" },
];

const columnasPoblacionFlotante: ColumnaEditable[] = [
  { key: "categoria", label: "Categoría", placeholder: "Ej. Visitantes", width: "180px" },
  { key: "promedio", label: "Aforo promedio", type: "number", placeholder: "0", width: "120px" },
  { key: "maximo", label: "Aforo máximo", type: "number", placeholder: "0", width: "120px" },
  { key: "ubicacion", label: "Ubicación principal", placeholder: "Ej. Recepción y caseta", width: "180px" },
  { key: "horario", label: "Horario habitual", placeholder: "09:00 - 18:00", width: "150px" },
];

const columnasAreas: ColumnaEditable[] = [
  { key: "area", label: "Área", placeholder: "Ej. Nave principal", width: "180px" },
  { key: "uso", label: "Uso / Destino", placeholder: "Ej. Producción y ensamble", width: "180px" },
  { key: "materiales", label: "Materiales constructivos", placeholder: "Ej. Estructura de acero, block", width: "200px" },
  { key: "observaciones", label: "Observaciones / Colindancias", placeholder: "Colinda con patio", width: "220px" },
];

const columnasEquipos: ColumnaEditable[] = [
  { key: "equipo", label: "Equipo", placeholder: "Ej. Extintores PQS 9 kg", width: "300px" },
  { key: "cantidad", label: "Cantidad", type: "number", placeholder: "0", width: "120px" },
];

export const SeccionInventarios: React.FC<Props> = ({
  expediente,
  setPoblacionFija,
  setPoblacionFlotante,
  setAreasInmueble,
  setEquiposEmergencia,
  setEquiposAltoRiesgo,
  setProgramaEquiposEmergencia,
  setProgramaEquiposAltoRiesgo,
  agregarFoto,
  quitarFoto,
  soloLectura = false,
}) => {
  const handleChangePR = (
    tipo: "emergencia" | "alto_riesgo",
    equipo: string,
    mes: string,
    campo: "p" | "r",
    val: number
  ) => {
    if (soloLectura) return;
    if (tipo === "emergencia") {
      const prog = { ...expediente.programaEquiposEmergencia };
      if (!prog[equipo]) prog[equipo] = {};
      prog[equipo][mes] = {
        p: campo === "p" ? val : prog[equipo][mes]?.p || 0,
        r: campo === "r" ? val : prog[equipo][mes]?.r || 0,
      };
      setProgramaEquiposEmergencia(prog);
    } else {
      const prog = { ...expediente.programaEquiposAltoRiesgo };
      if (!prog[equipo]) prog[equipo] = {};
      prog[equipo][mes] = {
        p: campo === "p" ? val : prog[equipo][mes]?.p || 0,
        r: campo === "r" ? val : prog[equipo][mes]?.r || 0,
      };
      setProgramaEquiposAltoRiesgo(prog);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {/* 1. Población Fija */}
      <div className="card p-4">
        <div style={{ borderLeft: "3px solid #2B8FCC", paddingLeft: "10px", marginBottom: "14px" }}>
          <h3 style={{ fontSize: "13px", fontWeight: 700, color: "#1e293b", textTransform: "uppercase", margin: 0 }}>
            Población fija del inmueble
          </h3>
          <p style={{ fontSize: "11px", color: "#64748b", margin: 0 }}>
            Personal habitual por área con desglose de género y atención a personas en condición de vulnerabilidad.
          </p>
        </div>

        <TablaEditable
          columnas={columnasPoblacionFija}
          filas={expediente.poblacionFija}
          onChangeFila={(i, k, v) => {
            const list = [...expediente.poblacionFija];
            const updated = { ...list[i], [k]: v };
            const h = Number(updated.hombres || 0);
            const m = Number(updated.mujeres || 0);
            updated.total = h + m > 0 ? h + m : "";
            list[i] = updated;
            setPoblacionFija(list);
          }}
          onAgregarFila={() => {
            setPoblacionFija([
              ...expediente.poblacionFija,
              { area: "", hombres: "", mujeres: "", total: "", vulnerable: "No", detalle: "— Seleccionar —", apoyo: "— Seleccionar —" },
            ]);
          }}
          onQuitarFila={(i) => {
            setPoblacionFija(expediente.poblacionFija.filter((_, idx) => idx !== i));
          }}
          textoBotonAgregar="+ Agregar área de población fija"
          soloLectura={soloLectura}
        />
      </div>

      {/* 2. Población Flotante */}
      <div className="card p-4">
        <div style={{ borderLeft: "3px solid #2B8FCC", paddingLeft: "10px", marginBottom: "14px" }}>
          <h3 style={{ fontSize: "13px", fontWeight: 700, color: "#1e293b", textTransform: "uppercase", margin: 0 }}>
            Población flotante
          </h3>
          <p style={{ fontSize: "11px", color: "#64748b", margin: 0 }}>
            Aforos estimados para visitantes, proveedores, contratistas y clientes.
          </p>
        </div>

        <TablaEditable
          columnas={columnasPoblacionFlotante}
          filas={expediente.poblacionFlotante}
          onChangeFila={(i, k, v) => {
            const list = [...expediente.poblacionFlotante];
            list[i] = { ...list[i], [k]: v };
            setPoblacionFlotante(list);
          }}
          onAgregarFila={() => {
            setPoblacionFlotante([
              ...expediente.poblacionFlotante,
              { categoria: "", promedio: "", maximo: "", ubicacion: "", horario: "" },
            ]);
          }}
          onQuitarFila={(i) => {
            setPoblacionFlotante(expediente.poblacionFlotante.filter((_, idx) => idx !== i));
          }}
          textoBotonAgregar="+ Agregar población flotante"
          soloLectura={soloLectura}
        />
      </div>

      {/* 3. Áreas del Inmueble */}
      <div className="card p-4">
        <div style={{ borderLeft: "3px solid #2B8FCC", paddingLeft: "10px", marginBottom: "14px" }}>
          <h3 style={{ fontSize: "13px", fontWeight: 700, color: "#1e293b", textTransform: "uppercase", margin: 0 }}>
            Inventario de áreas del inmueble
          </h3>
          <p style={{ fontSize: "11px", color: "#64748b", margin: 0 }}>
            Uso de suelo interno, materiales de construcción y colindancias por sector.
          </p>
        </div>

        <TablaEditable
          columnas={columnasAreas}
          filas={expediente.areasInmueble}
          onChangeFila={(i, k, v) => {
            const list = [...expediente.areasInmueble];
            list[i] = { ...list[i], [k]: v };
            setAreasInmueble(list);
          }}
          onAgregarFila={() => {
            setAreasInmueble([
              ...expediente.areasInmueble,
              { area: "", uso: "", materiales: "", observaciones: "" },
            ]);
          }}
          onQuitarFila={(i) => {
            setAreasInmueble(expediente.areasInmueble.filter((_, idx) => idx !== i));
          }}
          textoBotonAgregar="+ Agregar área"
          soloLectura={soloLectura}
        />
      </div>

      {/* 4. Inventario de Recursos Humanos — Brigadas de Emergencia (solo lectura en v3_42) */}
      <div className="card p-4">
        <div style={{ borderLeft: "3px solid #2B8FCC", paddingLeft: "10px", marginBottom: "14px" }}>
          <h3 style={{ fontSize: "13px", fontWeight: 700, color: "#1e293b", textTransform: "uppercase", margin: 0 }}>
            Inventario de Recursos Humanos — Brigadas de Emergencia
          </h3>
          <p style={{ fontSize: "11px", color: "#64748b", margin: 0 }}>
            Personal voluntario y brigadistas asignados a la atención de contingencias (capturados en la Sección 3 — Organización).
          </p>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table className="table table-sm table-bordered" style={{ fontSize: "11px", minWidth: "700px", marginBottom: 0 }}>
            <thead className="table-light">
              <tr>
                <th style={{ width: "35px", textAlign: "center" }}>#</th>
                <th>Nombre</th>
                <th>Puesto</th>
                <th>Brigada</th>
                <th>Rol / Función</th>
                <th>Turno</th>
                <th>Teléfono</th>
                <th>Ubicación</th>
              </tr>
            </thead>
            <tbody>
              {expediente.brigadistas && expediente.brigadistas.length > 0 ? (
                expediente.brigadistas.map((b, i) => (
                  <tr key={i} style={{ background: b.jefeRoleId ? "#f0fdf4" : "#ffffff" }}>
                    <td style={{ textAlign: "center", color: "#64748b", fontWeight: 600 }}>{i + 1}</td>
                    <td style={{ fontWeight: 600, color: "#1e293b" }}>
                      {b.nombre ? b.nombre : <TextoPendiente title="Falta capturar el nombre en la Sección 3 — Organización" />}
                    </td>
                    <td>{b.puesto ? b.puesto : <TextoPendiente title="Falta capturar el puesto en la Sección 3 — Organización" />}</td>
                    <td style={{ color: "#2B8FCC", fontWeight: 500 }}>{b.brigada}</td>
                    <td>{b.rol}</td>
                    <td>{b.turno}</td>
                    <td>{b.telefono ? b.telefono : <TextoPendiente title="Falta capturar el teléfono en la Sección 3 — Organización" />}</td>
                    <td>{b.ubicacion ? b.ubicacion : <TextoPendiente title="Falta capturar la ubicación en la Sección 3 — Organización" />}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} style={{ textAlign: "center", color: "#64748b", padding: "14px" }}>
                    Aún no hay brigadistas capturados en la Sección 3 — Organización.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. Lay out general y Fotografías generales */}
      <div className="card p-4">
        <div style={{ borderLeft: "3px solid #2B8FCC", paddingLeft: "10px", marginBottom: "14px" }}>
          <h3 style={{ fontSize: "13px", fontWeight: 700, color: "#1e293b", textTransform: "uppercase", margin: 0 }}>
            Planos y fotografías generales de instalaciones
          </h3>
          <p style={{ fontSize: "11px", color: "#64748b", margin: 0 }}>
            Lay out arquitectónico general y evidencia fotográfica del estado del establecimiento.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px" }}>
          <div>
            <label className="form-label text-xs">Lay out general del inmueble</label>
            <ZonaFotos
              fotos={expediente.fotos["layout-general"] || []}
              onSubir={(arch) => agregarFoto("layout-general", arch, false)}
              onQuitar={(fId) => quitarFoto("layout-general", fId)}
              label="Subir plano o lay out general"
              soloLectura={soloLectura}
            />
          </div>

          <div>
            <label className="form-label text-xs">Fotografías generales de instalaciones</label>
            <ZonaFotos
              fotos={expediente.fotos["fotos-generales"] || []}
              onSubir={(arch) => agregarFoto("fotos-generales", arch, false)}
              onQuitar={(fId) => quitarFoto("fotos-generales", fId)}
              label="Subir fotos de fachadas, accesos y naves"
              soloLectura={soloLectura}
            />
          </div>
        </div>
      </div>

      {/* 6. Equipos de Emergencia */}
      <div className="card p-4">
        <div style={{ borderLeft: "3px solid #2B8FCC", paddingLeft: "10px", marginBottom: "14px" }}>
          <h3 style={{ fontSize: "13px", fontWeight: 700, color: "#1e293b", textTransform: "uppercase", margin: 0 }}>
            Equipos de emergencia
          </h3>
          <p style={{ fontSize: "11px", color: "#64748b", margin: 0 }}>
            Extintores, hidrantes, detectores de humo, lámparas de emergencia, botiquines y lavaojos.
          </p>
        </div>

        <TablaEditable
          columnas={columnasEquipos}
          filas={expediente.equiposEmergencia}
          onChangeFila={(i, k, v) => {
            const list = [...expediente.equiposEmergencia];
            list[i] = { ...list[i], [k]: v };
            setEquiposEmergencia(list);
          }}
          onAgregarFila={() => {
            setEquiposEmergencia([
              ...expediente.equiposEmergencia,
              { equipo: "", cantidad: "" },
            ]);
          }}
          onQuitarFila={(i) => {
            setEquiposEmergencia(expediente.equiposEmergencia.filter((_, idx) => idx !== i));
          }}
          textoBotonAgregar="+ Agregar equipo de emergencia"
          soloLectura={soloLectura}
        />

        {expediente.equiposEmergencia.length > 0 && (
          <div style={{ marginTop: "16px" }}>
            <h4 style={{ fontSize: "12px", fontWeight: 700, color: "#334155", marginBottom: "8px" }}>
              Programa de mantenimiento anual P/R — Equipos de emergencia
            </h4>
            <TablaProgramaPR
              equipos={expediente.equiposEmergencia}
              programa={expediente.programaEquiposEmergencia}
              onChangePR={(eq: string, mes: string, campo: "p" | "r", val: number) =>
                handleChangePR("emergencia", eq, mes, campo, val)
              }
              soloLectura={soloLectura}
            />
          </div>
        )}
      </div>

      {/* 7. Equipos de Alto Riesgo */}
      <div className="card p-4">
        <div style={{ borderLeft: "3px solid #2B8FCC", paddingLeft: "10px", marginBottom: "14px" }}>
          <h3 style={{ fontSize: "13px", fontWeight: 700, color: "#1e293b", textTransform: "uppercase", margin: 0 }}>
            Equipos de alto riesgo
          </h3>
          <p style={{ fontSize: "11px", color: "#64748b", margin: 0 }}>
            Calderas, subestaciones eléctricas, recipientes a presión y tanques de gas LP.
          </p>
        </div>

        <TablaEditable
          columnas={columnasEquipos}
          filas={expediente.equiposAltoRiesgo}
          onChangeFila={(i, k, v) => {
            const list = [...expediente.equiposAltoRiesgo];
            list[i] = { ...list[i], [k]: v };
            setEquiposAltoRiesgo(list);
          }}
          onAgregarFila={() => {
            setEquiposAltoRiesgo([
              ...expediente.equiposAltoRiesgo,
              { equipo: "", cantidad: "" },
            ]);
          }}
          onQuitarFila={(i) => {
            setEquiposAltoRiesgo(expediente.equiposAltoRiesgo.filter((_, idx) => idx !== i));
          }}
          textoBotonAgregar="+ Agregar equipo de alto riesgo"
          soloLectura={soloLectura}
        />

        {expediente.equiposAltoRiesgo.length > 0 && (
          <div style={{ marginTop: "16px" }}>
            <h4 style={{ fontSize: "12px", fontWeight: 700, color: "#334155", marginBottom: "8px" }}>
              Programa de mantenimiento anual P/R — Equipos de alto riesgo
            </h4>
            <TablaProgramaPR
              equipos={expediente.equiposAltoRiesgo}
              programa={expediente.programaEquiposAltoRiesgo}
              onChangePR={(eq: string, mes: string, campo: "p" | "r", val: number) =>
                handleChangePR("alto_riesgo", eq, mes, campo, val)
              }
              soloLectura={soloLectura}
            />
          </div>
        )}
      </div>

      {/* 8. Lay out de emergencias y Reporte fotográfico */}
      <div className="card p-4">
        <div style={{ borderLeft: "3px solid #2B8FCC", paddingLeft: "10px", marginBottom: "14px" }}>
          <h3 style={{ fontSize: "13px", fontWeight: 700, color: "#1e293b", textTransform: "uppercase", margin: 0 }}>
            Evidencia gráfica de emergencia
          </h3>
          <p style={{ fontSize: "11px", color: "#64748b", margin: 0 }}>
            Lay out con rutas de evacuación y fotografías de los equipos de auxilio instalados.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px" }}>
          <div>
            <label className="form-label text-xs">Lay out de emergencias (rutas, salidas, extintores)</label>
            <ZonaFotos
              fotos={expediente.fotos["layout-emergencias"] || []}
              onSubir={(arch) => agregarFoto("layout-emergencias", arch, false)}
              onQuitar={(fId) => quitarFoto("layout-emergencias", fId)}
              label="Subir lay out de emergencias"
              soloLectura={soloLectura}
            />
          </div>

          <div>
            <label className="form-label text-xs">Reporte fotográfico de equipos de emergencia</label>
            <ZonaFotos
              fotos={expediente.fotos["equipo-emergencia-foto"] || []}
              onSubir={(arch) => agregarFoto("equipo-emergencia-foto", arch, false)}
              onQuitar={(fId) => quitarFoto("equipo-emergencia-foto", fId)}
              label="Subir fotografías de extintores, gabinetes, alarmas"
              soloLectura={soloLectura}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
