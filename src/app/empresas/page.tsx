"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Building2, Plus, Search, Edit2, Trash2, RefreshCw } from "lucide-react";
import { EmpresaGetDto } from "@/types/empresas";
import { EmpresasService } from "@/services/empresas.service";
import { AppLayout } from "@/components/layout/AppLayout";
import { ModalConfirmarEliminar } from "@/components/ui/ModalConfirmarEliminar";

import { useToast } from "@/context/ToastContext";

export default function EmpresasPage() {
  const { toast } = useToast();
  const [datos, setDatos] = useState<EmpresaGetDto[]>([]);
  const [cargando, setCargando] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [localSearch, setLocalSearch] = useState<string>("");

  // Modales
  const [itemEliminar, setItemEliminar] = useState<EmpresaGetDto | null>(null);
  const [eliminando, setEliminando] = useState<boolean>(false);

  const cargarEmpresas = useCallback(async () => {
    setCargando(true);
    const lista = await EmpresasService.getEmpresas(searchTerm);
    setDatos(lista);
    setCargando(false);
  }, [searchTerm]);

  useEffect(() => {
    cargarEmpresas();
  }, [cargarEmpresas]);

  const handleConfirmarEliminar = async () => {
    if (!itemEliminar) return;
    setEliminando(true);
    const ok = await EmpresasService.eliminar(itemEliminar.iD_Empresa);
    setEliminando(false);
    setItemEliminar(null);

    if (ok) {
      toast.success("Empresa eliminada exitosamente");
      cargarEmpresas();
    } else {
      toast.error("Ocurrió un error al intentar eliminar la empresa.");
    }
  };

  return (
    <AppLayout>
      <div className="page-header">
        <div>
          <h1 className="page-title">
            Catálogo de empresas
          </h1>
          <p className="subtext">
            Registro y administración general de empresas.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            className="btn btn-outline"
            onClick={cargarEmpresas}
            disabled={cargando}
            title="Recargar datos"
          >
            <RefreshCw size={16} className={cargando ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* Buscador Horizontal Estricto con Botón Nueva Empresa al lado */}
      <div className="card mb-4 p-4">
        <div style={{ display: "flex", flexDirection: "row", alignItems: "flex-end", gap: "16px", flexWrap: "nowrap" }}>
          <div style={{ display: "flex", flexDirection: "row", alignItems: "flex-end", gap: "8px", width: "auto", marginLeft: "auto" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "4px", width: "220px", minWidth: "220px" }}>
              <label className="form-label" style={{ marginBottom: 0 }}>Buscar</label>
              <div style={{ position: "relative", width: "100%" }}>
                <Search size={14} style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8", pointerEvents: "none" }} />
                <input
                  type="text"
                  className="form-control text-xs py-1.5"
                  style={{ width: "100%", paddingLeft: "28px", borderRadius: "20px", height: "32px" }}
                  placeholder="Buscar empresa (Enter)..."
                  value={localSearch}
                  onChange={(e) => setLocalSearch(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      setSearchTerm(localSearch);
                    }
                  }}
                />
              </div>
            </div>

            <Link
              href="/empresas/nueva"
              className="btn btn-primary text-xs py-1.5 px-4 flex items-center gap-1.5 shrink-0"
              style={{ height: "32px", borderRadius: "20px", display: "inline-flex", alignItems: "center", justifyContent: "center", textDecoration: "none" }}
              title="Nueva empresa"
            >
              <Plus size={16} />
              <span>Nueva empresa</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Tabla de Clientes */}
      <div className="alegra-table-container">
        <table className="alegra-table">
          <thead>
            <tr>
              <th>Razón Social / RFC</th>
              <th>Giro / Actividad</th>
              <th>Tipo</th>
              <th>Ubicación</th>
              <th className="text-center">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {cargando ? (
              Array.from({ length: 5 }).map((_, idx) => (
                <tr key={`sk-empresa-${idx}`}>
                  <td>
                    <div className="skeleton-box" style={{ width: "85%", marginBottom: "4px" }}></div>
                    <div className="skeleton-box sm" style={{ width: "45%" }}></div>
                  </td>
                  <td>
                    <div className="skeleton-box sm" style={{ width: "70%" }}></div>
                  </td>
                  <td>
                    <div className="skeleton-box" style={{ width: "65px", height: "20px", borderRadius: "10px" }}></div>
                  </td>
                  <td>
                    <div className="skeleton-box sm" style={{ width: "60%" }}></div>
                  </td>
                  <td className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <div className="skeleton-circle"></div>
                      <div className="skeleton-circle"></div>
                      <div className="skeleton-circle"></div>
                    </div>
                  </td>
                </tr>
              ))
            ) : datos.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-8 text-secondary">
                  No se encontraron empresas con los criterios ingresados.
                </td>
              </tr>
            ) : (
              datos.map((row) => (
                <tr key={row.iD_Empresa}>
                  <td>
                    <Link
                      href={`/empresas/${row.iD_Empresa}/centros`}
                      style={{ color: "#2B8FCC", fontWeight: 600, textDecoration: "none" }}
                      className="hover:underline uppercase block text-sm"
                      title="Ver centros de trabajo de esta empresa"
                    >
                      {row.s_RazonSocial}
                    </Link>
                    <div className="text-xs font-mono text-secondary">{row.s_RFC || "Sin RFC"}</div>
                  </td>
                  <td>{row.s_GiroActividad || "—"}</td>
                  <td>
                    <div className="flex gap-1 flex-wrap">
                      {(row.i_TipoContacto === 0 || row.i_TipoContacto === 2 || row.i_TipoContacto === 3 || row.i_TipoContacto === undefined) && (
                        <span className="badge-soft-blue">Cliente</span>
                      )}
                      {(row.i_TipoContacto === 1 || row.i_TipoContacto === 2 || row.i_TipoContacto === 3) && (
                        <span className="badge-soft-gray">Proveedor</span>
                      )}
                    </div>
                  </td>
                  <td>
                    {row.v_Municipio || row.v_NombreEstado
                      ? [row.v_Municipio, row.v_NombreEstado].filter(Boolean).join(", ")
                      : row.v_Fraccionamiento
                      ? row.v_Fraccionamiento
                      : row.s_Domicilio && row.s_Domicilio !== "N/A"
                      ? row.s_Domicilio
                      : row.v_NombreCalle
                      ? `${row.v_NombreCalle} ${row.v_NumeroExterior || ""}`.trim()
                      : row.i_CodigoPostal
                      ? `C.P. ${row.i_CodigoPostal}`
                      : "—"}
                  </td>
                  <td className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Link
                        href={`/empresas/editar/${row.iD_Empresa}`}
                        className="btn-icon"
                        title="Editar empresa"
                      >
                        <Edit2 size={16} />
                      </Link>
                      <button
                        className="btn-icon danger"
                        onClick={() => setItemEliminar(row)}
                        title="Eliminar empresa"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Confirmar Eliminar */}
      <ModalConfirmarEliminar
        abierto={!!itemEliminar}
        nombreElemento={itemEliminar?.s_RazonSocial || "esta empresa"}
        onCerrar={() => setItemEliminar(null)}
        onConfirmar={handleConfirmarEliminar}
        cargando={eliminando}
      />
    </AppLayout>
  );
}
