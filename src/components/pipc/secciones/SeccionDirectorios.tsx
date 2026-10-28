"use client";

import React from "react";
import {
  PipcExpediente,
  DependenciaDirectorioRow,
  ProveedorDirectorioRow,
  VecinoDirectorioRow,
  formatTelefono,
} from "../pipcCalculos";
import { CATALOGO_DEPENDENCIAS_EMERGENCIA } from "../pipcCatalogos";
import { TablaEditable, ColumnaEditable } from "../comunes/TablaEditable";
import { ZonaFotos } from "../comunes/ZonaFotos";

interface Props {
  expediente: PipcExpediente;
  setMunicipioEmergencias: (muni: string) => void;
  setDependenciasEmergencia: (rows: DependenciaDirectorioRow[]) => void;
  setProveedoresEmergencia: (rows: ProveedorDirectorioRow[]) => void;
  setVecinosEmergencia: (rows: VecinoDirectorioRow[]) => void;
  setFormField: (field: any, value: any) => void;
  agregarFoto: (seccionKey: string, archivo: File, soloUna?: boolean) => void;
  quitarFoto: (seccionKey: string, fotoId: string) => void;
  soloLectura?: boolean;
}

const columnasDependencias: ColumnaEditable[] = [
  { key: "dependencia", label: "Dependencia / Organismo", placeholder: "Ej. Protección Civil", width: "240px" },
  { key: "telefono", label: "Teléfono", placeholder: "911 / (81) 0000-0000", width: "160px" },
  { key: "llegada", label: "Tiempo estimado de llegada", placeholder: "Ej. 10 min", width: "160px" },
];

const columnasProveedores: ColumnaEditable[] = [
  { key: "proveedor", label: "Proveedor", placeholder: "Nombre del proveedor", width: "200px" },
  { key: "direccion", label: "Dirección", placeholder: "Calle, número y colonia", width: "220px" },
  { key: "telefono", label: "Teléfono", placeholder: "(81) 0000-0000", width: "150px" },
  { key: "productos", label: "Productos o servicios", placeholder: "Ej. Mantenimiento a extintores", width: "200px" },
];

const columnasVecinos: ColumnaEditable[] = [
  { key: "empresa", label: "Comité o Empresa Vecina", placeholder: "Nombre de la empresa", width: "200px" },
  { key: "direccion", label: "Dirección", placeholder: "Dirección", width: "220px" },
  { key: "telefono", label: "Teléfono", placeholder: "(81) 0000-0000", width: "150px" },
  { key: "apoyo", label: "Tipo de apoyo que brinda", placeholder: "Ej. Combate de incendios, ambulancia", width: "200px" },
];

export const SeccionDirectorios: React.FC<Props> = ({
  expediente,
  setMunicipioEmergencias,
  setDependenciasEmergencia,
  setProveedoresEmergencia,
  setVecinosEmergencia,
  setFormField,
  agregarFoto,
  quitarFoto,
  soloLectura = false,
}) => {
  const ciudades = CATALOGO_DEPENDENCIAS_EMERGENCIA.ciudades.map((c) => c.municipio);
  const noPertenece = !!expediente.form.no_pertenece_comite;

  const handleMunicipioChange = (muni: string) => {
    if (!muni) return;
    if (
      expediente.dependenciasEmergencia.length > 0 &&
      !window.confirm(
        `Se reemplazarán las dependencias actuales con las de ${muni}. ¿Deseas continuar?`
      )
    ) {
      return;
    }
    setMunicipioEmergencias(muni);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {/* 1. Dependencias de Emergencia */}
      <div className="card p-4">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "8px", marginBottom: "14px" }}>
          <div style={{ borderLeft: "3px solid #2B8FCC", paddingLeft: "10px" }}>
            <h3 style={{ fontSize: "13px", fontWeight: 700, color: "#1e293b", textTransform: "uppercase", margin: 0 }}>
              Directorio de dependencias de auxilio y emergencia
            </h3>
            <p style={{ fontSize: "11px", color: "#64748b", margin: 0 }}>
              Carga automática de teléfonos de emergencia según el municipio de la planta.
            </p>
          </div>

          {!soloLectura && (
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <label style={{ fontSize: "12px", color: "#64748b", fontWeight: 500 }}>
                Cargar por municipio:
              </label>
              <select
                className="form-select text-xs"
                style={{ width: "200px", height: "32px", fontSize: "12px" }}
                value={expediente.municipioEmergencias || ""}
                onChange={(e) => handleMunicipioChange(e.target.value)}
              >
                <option value="">— Seleccionar municipio —</option>
                {ciudades.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <TablaEditable
          columnas={columnasDependencias}
          filas={expediente.dependenciasEmergencia}
          onChangeFila={(i, k, v) => {
            const list = [...expediente.dependenciasEmergencia];
            list[i] = { ...list[i], [k]: k === "telefono" ? formatTelefono(v) : v };
            setDependenciasEmergencia(list);
          }}
          onAgregarFila={() => {
            setDependenciasEmergencia([
              ...expediente.dependenciasEmergencia,
              { dependencia: "", telefono: "", llegada: "" },
            ]);
          }}
          onQuitarFila={(i) => {
            setDependenciasEmergencia(expediente.dependenciasEmergencia.filter((_, idx) => idx !== i));
          }}
          textoBotonAgregar="+ Agregar dependencia"
          soloLectura={soloLectura}
        />
      </div>

      {/* 2. Proveedores de Equipos de Emergencia */}
      <div className="card p-4">
        <div style={{ borderLeft: "3px solid #2B8FCC", paddingLeft: "10px", marginBottom: "14px" }}>
          <h3 style={{ fontSize: "13px", fontWeight: 700, color: "#1e293b", textTransform: "uppercase", margin: 0 }}>
            Proveedores de equipos y servicios de emergencia
          </h3>
          <p style={{ fontSize: "11px", color: "#64748b", margin: 0 }}>
            Proveedores externos para abastecimiento rápido ante contingencias (pipas, extintores, ambulancias).
          </p>
        </div>

        <TablaEditable
          columnas={columnasProveedores}
          filas={expediente.proveedoresEmergencia}
          onChangeFila={(i, k, v) => {
            const list = [...expediente.proveedoresEmergencia];
            list[i] = { ...list[i], [k]: k === "telefono" ? formatTelefono(v) : v };
            setProveedoresEmergencia(list);
          }}
          onAgregarFila={() => {
            setProveedoresEmergencia([
              ...expediente.proveedoresEmergencia,
              { proveedor: "", direccion: "", telefono: "", productos: "" },
            ]);
          }}
          onQuitarFila={(i) => {
            setProveedoresEmergencia(expediente.proveedoresEmergencia.filter((_, idx) => idx !== i));
          }}
          textoBotonAgregar="+ Agregar proveedor"
          soloLectura={soloLectura}
        />
      </div>

      {/* 3. Comités de Ayuda Mutua y Vecinos */}
      <div className="card p-4">
        <div style={{ borderLeft: "3px solid #2B8FCC", paddingLeft: "10px", marginBottom: "14px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
            <div>
              <h3 style={{ fontSize: "13px", fontWeight: 700, color: "#1e293b", textTransform: "uppercase", margin: 0 }}>
                Comités de ayuda mutua y empresas vecinas
              </h3>
              <p style={{ fontSize: "11px", color: "#64748b", margin: 0 }}>
                Convenios de auxilio recíproco o carta de compromiso si no pertenece a un comité.
              </p>
            </div>

            {!soloLectura && (
              <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", fontWeight: 600, color: "#475569", cursor: "pointer", background: "#f8fafc", padding: "6px 12px", borderRadius: "6px", border: "1px solid #cbd5e1" }}>
                <input
                  type="checkbox"
                  checked={noPertenece}
                  onChange={(e) => setFormField("no_pertenece_comite", e.target.checked)}
                />
                No pertenece a un comité de ayuda mutua
              </label>
            )}
          </div>
        </div>

        {/* Sección condicional: Carta de compromiso cuando no pertenece */}
        {noPertenece ? (
          <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "8px", padding: "16px", marginBottom: "16px" }}>
            <div style={{ fontSize: "12px", color: "#1e293b", fontWeight: 600, marginBottom: "8px", display: "flex", alignItems: "center", gap: "6px" }}>
              <i className="bi bi-file-earmark-check" style={{ color: "#2B8FCC", fontSize: "16px" }} />
              Carta de compromiso escaneada
            </div>
            <p style={{ fontSize: "11px", color: "#64748b", margin: "0 0 12px 0" }}>
              La empresa no pertenece a un comité de ayuda mutua. Debe adjuntarse la carta de compromiso firmada.
            </p>
            <ZonaFotos
              fotos={expediente.fotos["carta-compromiso-comite"] || []}
              onSubir={(arch) => agregarFoto("carta-compromiso-comite", arch, true)}
              onQuitar={(fId) => quitarFoto("carta-compromiso-comite", fId)}
              multiple={false}
              label="Subir fotografía de la carta de compromiso firmada"
              soloLectura={soloLectura}
            />
          </div>
        ) : null}

        {/* Contenedor de tabla de comités y mapa de vecinos (deshabilitado con opacidad 0.4 si no pertenece) */}
        <div style={{ opacity: noPertenece ? 0.4 : 1, pointerEvents: noPertenece ? "none" : "auto" }}>
          <div style={{ marginBottom: "16px" }}>
            <TablaEditable
              columnas={columnasVecinos}
              filas={expediente.vecinosEmergencia}
              onChangeFila={(i, k, v) => {
                const list = [...expediente.vecinosEmergencia];
                list[i] = { ...list[i], [k]: k === "telefono" ? formatTelefono(v) : v };
                setVecinosEmergencia(list);
              }}
              onAgregarFila={() => {
                setVecinosEmergencia([
                  ...expediente.vecinosEmergencia,
                  { empresa: "", direccion: "", telefono: "", apoyo: "" },
                ]);
              }}
              onQuitarFila={(i) => {
                setVecinosEmergencia(expediente.vecinosEmergencia.filter((_, idx) => idx !== i));
              }}
              textoBotonAgregar="+ Agregar empresa o comité vecino"
              soloLectura={soloLectura || noPertenece}
            />
          </div>

          <div>
            <label className="form-label text-xs">Croquis o mapa de ubicación de empresas vecinas</label>
            <ZonaFotos
              fotos={expediente.fotos["vecinos-img"] || []}
              onSubir={(arch) => agregarFoto("vecinos-img", arch, false)}
              onQuitar={(fId) => quitarFoto("vecinos-img", fId)}
              label="Subir croquis o fotografías de la zona de vecinos"
              soloLectura={soloLectura || noPertenece}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
