"use client";

import React from "react";
import { Eye, Trash2, FileText, ExternalLink } from "lucide-react";
import { AgendaServicioGetDto } from "@/types/servicios";
import { BadgeTipoServicio } from "@/components/ui/BadgeTipoServicio";
import { formatearFechaCorta } from "@/lib/date-utils";
import { ArchivosService } from "@/services/archivos.service";

interface Props {
  datos: AgendaServicioGetDto[];
  cargando: boolean;
  onVerDetalle: (item: AgendaServicioGetDto) => void;
  onEliminar: (item: AgendaServicioGetDto) => void;
}

export const TablaAgendaServicios: React.FC<Props> = ({
  datos,
  cargando,
  onVerDetalle,
  onEliminar,
}) => {
  const handleAbrirDocumento = async (key: string | null) => {
    if (!key) return;
    const exito = await ArchivosService.abrirDocumento(key);
    if (!exito) {
      alert("No se pudo abrir el documento o la URL expiró.");
    }
  };

  const renderEstatusBadge = (estatus: number | null, sinProgramar: boolean) => {
    if (sinProgramar) {
      return <span className="badge badge-warning">Pendiente</span>;
    }
    switch (estatus) {
      case 0:
        return <span className="badge badge-danger">Cancelado</span>;
      case 1:
        return <span className="badge badge-info">Programado</span>;
      case 2:
        return <span className="badge badge-warning">En curso</span>;
      case 3:
        return <span className="badge badge-success">Terminado</span>;
      case 4:
        return <span className="badge badge-secondary">Reprogramado</span>;
      default:
        return <span className="badge badge-default">Programado</span>;
    }
  };

  return (
    <div className="table-responsive">
      <table className="table">
        <thead>
          <tr>
            <th>Cliente</th>
            <th>Servicio</th>
            <th>Tipo</th>
            <th>Fecha Inicio</th>
            <th>Estatus</th>
            <th>Titular / Apoyo</th>
            <th>Entregables</th>
            <th>Cot. GI</th>
            <th>OC Cliente</th>
            <th>Facturas</th>
            <th className="text-center">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {cargando ? (
            <tr>
              <td colSpan={11} className="text-center py-8 text-secondary">
                <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-primary mb-2"></div>
                <p>Cargando servicios agendados...</p>
              </td>
            </tr>
          ) : datos.length === 0 ? (
            <tr>
              <td colSpan={11} className="text-center py-8 text-secondary">
                No se encontraron registros de servicios agendados.
              </td>
            </tr>
          ) : (
            datos.map((row, idx) => {
              const entregables = row.entregablesParseados || [];

              // Agrupar entregables entregados por v_Key
              const entregadosConKey = entregables.filter((e) => e.b_Entregado && e.v_Key);
              const pendientes = entregables.filter((e) => !e.b_Entregado);

              return (
                <tr key={`${row.i_CveAgenda}-${row.i_CveServAgendaDet}-${idx}`}>
                  {/* 1. Cliente */}
                  <td>
                    <div className="text-bold">{row.v_Empresa || "—"}</div>
                    {row.v_Planta && <span className="subtext">{row.v_Planta}</span>}
                  </td>

                  {/* 2. Servicio */}
                  <td>
                    <div className="text-bold">{row.v_Servicio || "—"}</div>
                    <span className="subtext">
                      {row.i_Cantidad ?? 0} {row.v_Unidad || ""}
                    </span>
                  </td>

                  {/* 3. Tipo */}
                  <td>
                    <BadgeTipoServicio tipoServicio={row.v_TipoServicio} />
                  </td>

                  {/* 4. Fecha Inicio */}
                  <td>
                    {row.b_SinProgramar ? (
                      <span className="badge badge-warning">Pendiente de programar</span>
                    ) : (
                      <span>
                        {formatearFechaCorta(row.d_FechaInicio)}
                        {row.d_FechaFin && row.d_FechaFin !== row.d_FechaInicio && (
                          <span className="subtext">hasta {formatearFechaCorta(row.d_FechaFin)}</span>
                        )}
                      </span>
                    )}
                  </td>

                  {/* 5. Estatus */}
                  <td>{renderEstatusBadge(row.i_CveEstatus, row.b_SinProgramar)}</td>

                  {/* 6. Titular / Apoyo */}
                  <td>
                    {row.b_SinProgramar ? (
                      <span className="badge badge-secondary">Pendiente</span>
                    ) : (
                      <div>
                        <div>{row.v_Titular || "—"}</div>
                        {row.v_Apoyo && <span className="subtext">Apoyo: {row.v_Apoyo}</span>}
                      </div>
                    )}
                  </td>

                  {/* 7. Entregables */}
                  <td>
                    {entregables.length === 0 ? (
                      <span className="text-muted">—</span>
                    ) : (
                      <div className="flex flex-col gap-1">
                        {entregadosConKey.map((ent, eIdx) => (
                          <button
                            key={eIdx}
                            className="text-link text-xs inline-flex items-center gap-1 text-left"
                            onClick={() => handleAbrirDocumento(ent.v_Key)}
                          >
                            <FileText size={12} /> {ent.v_Nombre} <ExternalLink size={10} />
                          </button>
                        ))}
                        {pendientes.map((ent, pIdx) => (
                          <span key={pIdx} className="text-danger text-bold text-xs">
                            {ent.v_Nombre} (Pendiente)
                          </span>
                        ))}
                      </div>
                    )}
                  </td>

                  {/* 8. Cot. GI */}
                  <td>
                    {row.b_TieneCotizacion && row.v_NoCotizacionGI ? (
                      row.v_KeyCotizacion ? (
                        <button
                          className="text-link text-xs inline-flex items-center gap-1"
                          onClick={() => handleAbrirDocumento(row.v_KeyCotizacion)}
                        >
                          {row.v_NoCotizacionGI} <ExternalLink size={10} />
                        </button>
                      ) : (
                        <span>{row.v_NoCotizacionGI}</span>
                      )
                    ) : (
                      <span className="text-danger text-bold">Pendiente</span>
                    )}
                  </td>

                  {/* 9. OC Cliente */}
                  <td>
                    {row.b_TieneOC && row.v_NoOrdenCompraCliente ? (
                      row.v_KeyOC ? (
                        <button
                          className="text-link text-xs inline-flex items-center gap-1"
                          onClick={() => handleAbrirDocumento(row.v_KeyOC)}
                        >
                          {row.v_NoOrdenCompraCliente} <ExternalLink size={10} />
                        </button>
                      ) : (
                        <span>{row.v_NoOrdenCompraCliente}</span>
                      )
                    ) : (
                      <span className="text-danger text-bold">Pendiente</span>
                    )}
                  </td>

                  {/* 10. Facturas */}
                  <td>
                    {row.v_Facturas ? (
                      <span>{row.v_Facturas}</span>
                    ) : (
                      <span className="text-danger text-bold">Pendiente</span>
                    )}
                  </td>

                  {/* 11. Acciones */}
                  <td>
                    <div className="flex items-center justify-center gap-1">
                      <button
                        className="btn-icon"
                        onClick={() => onVerDetalle(row)}
                        title="Ver detalle"
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        className="btn-icon danger"
                        onClick={() => onEliminar(row)}
                        title="Eliminar agenda"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
};
