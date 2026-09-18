"use client";

import React, { useState } from "react";
import { Ban, X } from "lucide-react";
import { AgendaGetDto } from "@/types/calendario";
import { AgendaService } from "@/services/agenda.service";
import { useToast } from "@/context/ToastContext";

interface Props {
  abierto: boolean;
  item?: AgendaGetDto | null;
  iCveAgendaDetalle?: number | null;
  empresaNombre?: string;
  servicioNombre?: string;
  fechaInicio?: string | null;
  onCerrar: () => void;
  onConfirmarExito: () => void;
}

export const ModalCancelarSesion: React.FC<Props> = ({
  abierto,
  item,
  iCveAgendaDetalle,
  empresaNombre,
  servicioNombre,
  fechaInicio,
  onCerrar,
  onConfirmarExito,
}) => {
  const { toast } = useToast();
  const [motivo, setMotivo] = useState<string>("");
  const [cargando, setCargando] = useState<boolean>(false);
  const [errorValidacion, setErrorValidacion] = useState<string>("");

  const idDetalle = iCveAgendaDetalle || item?.i_CveAgendaDetalle || item?.i_CveServAgendaDet || 0;
  const empresa = empresaNombre || item?.v_Empresa || "—";
  const servicio = servicioNombre || item?.v_Servicio || "—";
  const fecha = fechaInicio || item?.d_FechaInicio || null;

  if (!abierto || !idDetalle) return null;

  const handleCancelar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!motivo.trim()) {
      setErrorValidacion("Por favor ingrese el motivo de cancelación.");
      return;
    }

    if (!idDetalle) {
      toast.error("No se encontró el identificador de la sesión.");
      return;
    }

    setCargando(true);
    setErrorValidacion("");

    try {
      const exito = await AgendaService.cancelarSesion(idDetalle, motivo.trim());
      if (exito) {
        toast.success("Sesión cancelada exitosamente.");
        setMotivo("");
        onConfirmarExito();
      } else {
        toast.error("Ocurrió un error al intentar cancelar la sesión.");
      }
    } catch {
      toast.error("Ocurrió un error al intentar cancelar la sesión.");
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: "500px" }}>
        <div className="modal-header">
          <div className="flex items-center gap-2 text-danger">
            <Ban size={22} className="text-danger" />
            <h3 className="modal-title">Cancelar Sesión</h3>
          </div>
          <button
            type="button"
            className="btn-icon"
            onClick={onCerrar}
            disabled={cargando}
            title="Cerrar"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleCancelar}>
          <div className="modal-body space-y-4">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-sm space-y-1">
              <div>
                <span className="font-semibold text-slate-700">Cliente:</span>{" "}
                <span className="text-slate-900">{empresa}</span>
              </div>
              <div>
                <span className="font-semibold text-slate-700">Servicio:</span>{" "}
                <span className="text-slate-900">{servicio}</span>
              </div>
              {fecha && (
                <div>
                  <span className="font-semibold text-slate-700">Fecha:</span>{" "}
                  <span className="text-slate-900">
                    {new Date(fecha).toLocaleDateString("es-MX", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </span>
                </div>
              )}
            </div>

            <div>
              <label className="form-label font-medium text-slate-700 mb-1 block">
                Motivo de cancelación <span className="text-danger">*</span>
              </label>
              <textarea
                className="form-control"
                rows={3}
                placeholder="Escriba el motivo por el cual se cancela la sesión..."
                value={motivo}
                onChange={(e) => {
                  setMotivo(e.target.value);
                  if (errorValidacion) setErrorValidacion("");
                }}
                disabled={cargando}
                autoFocus
              />
              {errorValidacion && (
                <p className="text-xs text-danger mt-1">{errorValidacion}</p>
              )}
            </div>
          </div>

          <div className="modal-footer mt-4">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onCerrar}
              disabled={cargando}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn btn-danger flex items-center gap-2"
              disabled={cargando}
            >
              {cargando ? (
                <>
                  <span className="animate-spin">⏳</span> Cancelando...
                </>
              ) : (
                <>
                  <Ban size={16} /> Confirmar cancelación
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
