import React from "react";
import { AlertTriangle, X } from "lucide-react";

interface Props {
  abierto: boolean;
  nombreElemento: string;
  onCerrar: () => void;
  onConfirmar: () => void;
  cargando?: boolean;
  mensajePersonalizado?: string;
}

export const ModalConfirmarEliminar: React.FC<Props> = ({
  abierto,
  nombreElemento,
  onCerrar,
  onConfirmar,
  cargando = false,
  mensajePersonalizado,
}) => {
  if (!abierto) return null;

  return (
    <div className="modal-overlay" onClick={onCerrar}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="flex items-center gap-2 text-danger">
            <AlertTriangle size={22} className="text-danger" />
            <h3 className="modal-title">Confirmar eliminación</h3>
          </div>
          <button className="btn-icon" onClick={onCerrar} title="Cerrar">
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          <p style={{ fontSize: "1rem", color: "var(--text-primary)" }}>
            {mensajePersonalizado || (
              <>
                ¿Deseas eliminar <strong>{nombreElemento}</strong>? Se perderán todos sus datos y esta acción no se puede deshacer.
              </>
            )}
          </p>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onCerrar} disabled={cargando}>
            Cancelar
          </button>
          <button className="btn btn-danger" onClick={onConfirmar} disabled={cargando}>
            {cargando ? "Eliminando..." : "Eliminar"}
          </button>
        </div>
      </div>
    </div>
  );
};
