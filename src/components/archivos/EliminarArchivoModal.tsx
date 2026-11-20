"use client";

import React, { useState } from "react";
import { AlertTriangle, Trash2, X } from "lucide-react";
import { ArchivosService } from "@/services/archivos.service";
import { useToast } from "@/context/ToastContext";
import type { EliminarArchivoDto } from "@/types/archivos";

export interface TargetEliminarArchivo {
  dto: EliminarArchivoDto;
  nombreElemento: string;
}

interface BotonProps {
  onClick: () => void;
  title?: string;
}

export const BotonEliminarArchivo: React.FC<BotonProps> = ({
  onClick,
  title = "Eliminar archivo",
}) => {
  const [hover, setHover] = useState(false);

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      title={title}
      aria-label={title}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "4px",
        borderRadius: "6px",
        border: "none",
        backgroundColor: hover ? "#fee2e2" : "transparent",
        color: hover ? "#dc2626" : "#94a3b8",
        cursor: "pointer",
        transition: "background-color 0.15s ease, color 0.15s ease",
        flexShrink: 0,
      }}
    >
      <Trash2 size={14} />
    </button>
  );
};

interface ModalProps {
  target: TargetEliminarArchivo | null;
  modo: "admin" | "consultor";
  onCerrar: () => void;
  onEliminado: () => Promise<void> | void;
}

function obtenerEtiquetaDocumento(
  v_Tipo: EliminarArchivoDto["v_Tipo"]
): string {
  switch (v_Tipo) {
    case "entregable":
      return "entregable";
    case "carta_entrega":
      return "carta de entrega";
    case "vobo_autoridad":
      return "visto bueno";
    case "cotizacion_cliente":
      return "cotización";
    case "oc_cliente":
      return "orden de compra";
  }
}

function obtenerMensajeAdvertencia(
  v_Tipo: EliminarArchivoDto["v_Tipo"]
): string {
  switch (v_Tipo) {
    case "entregable":
    case "carta_entrega":
      return "El archivo se eliminará y el entregable volverá a quedar pendiente hasta que tenga entregable y carta de entrega. Esta acción no se puede deshacer.";
    case "vobo_autoridad":
      return "El archivo se eliminará y el visto bueno volverá a quedar pendiente. Esta acción no se puede deshacer.";
    case "cotizacion_cliente":
    case "oc_cliente":
      return "El archivo se eliminará. El número de cotización/OC capturado no cambia. Esta acción no se puede deshacer.";
  }
}

function extraerMensajeErrorApi(err: unknown): string {
  const e = err as {
    response?: {
      data?:
        | string
        | {
            mensaje?: string;
            v_Mensaje?: string;
            message?: string;
            error?: string;
            title?: string;
          };
    };
    message?: string;
  } | null;

  const data = e?.response?.data;
  if (typeof data === "string" && data.trim()) return data.trim();
  if (data && typeof data === "object") {
    if (typeof data.mensaje === "string" && data.mensaje.trim())
      return data.mensaje.trim();
    if (typeof data.v_Mensaje === "string" && data.v_Mensaje.trim())
      return data.v_Mensaje.trim();
    if (typeof data.message === "string" && data.message.trim())
      return data.message.trim();
    if (typeof data.error === "string" && data.error.trim())
      return data.error.trim();
    if (typeof data.title === "string" && data.title.trim())
      return data.title.trim();
  }
  if (typeof e?.message === "string" && e.message.trim())
    return e.message.trim();
  return "No se pudo eliminar el archivo.";
}

export const ModalConfirmarEliminarArchivo: React.FC<ModalProps> = ({
  target,
  modo,
  onCerrar,
  onEliminado,
}) => {
  const { toast } = useToast();
  const [eliminando, setEliminando] = useState(false);

  if (!target) return null;

  const etiqueta = obtenerEtiquetaDocumento(target.dto.v_Tipo);
  const mensaje = obtenerMensajeAdvertencia(target.dto.v_Tipo);

  const handleConfirmar = async () => {
    if (eliminando) return;
    setEliminando(true);
    try {
      const res =
        modo === "consultor"
          ? await ArchivosService.eliminarArchivoConsultor(target.dto)
          : await ArchivosService.eliminarArchivo(target.dto);

      if (res.v_Advertencia && res.v_Advertencia.trim()) {
        toast.warning(res.v_Advertencia.trim());
      } else {
        toast.success("Archivo eliminado correctamente.");
      }

      onCerrar();
      await onEliminado();
    } catch (err) {
      toast.error(extraerMensajeErrorApi(err));
    } finally {
      setEliminando(false);
    }
  };

  return (
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
        zIndex: 100000,
        padding: "16px",
      }}
      onClick={() => {
        if (!eliminando) onCerrar();
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: "460px",
          width: "100%",
          backgroundColor: "#ffffff",
          borderRadius: "20px",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
          padding: "24px",
          display: "flex",
          flexDirection: "column",
          gap: "18px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: "12px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <div
              style={{
                width: "44px",
                height: "44px",
                borderRadius: "50%",
                backgroundColor: "#fff6da",
                color: "#856404",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <AlertTriangle size={22} />
            </div>
            <div>
              <h4
                style={{
                  fontSize: "16px",
                  fontWeight: 700,
                  color: "#0f172a",
                  margin: 0,
                  lineHeight: 1.3,
                }}
              >
                {`¿Eliminar ${etiqueta} de «${target.nombreElemento}»?`}
              </h4>
              <p
                style={{
                  fontSize: "13px",
                  color: "#64748b",
                  margin: "6px 0 0 0",
                  lineHeight: 1.4,
                }}
              >
                {mensaje}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onCerrar}
            disabled={eliminando}
            style={{
              background: "transparent",
              border: "none",
              color: "#64748b",
              cursor: eliminando ? "not-allowed" : "pointer",
              padding: "4px",
              display: "flex",
              alignItems: "center",
            }}
            aria-label="Cerrar"
          >
            <X size={18} />
          </button>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            gap: "10px",
          }}
        >
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onCerrar}
            disabled={eliminando}
            style={{ borderRadius: "20px", height: "38px", padding: "0 20px" }}
          >
            Cancelar
          </button>
          <button
            type="button"
            className="btn btn-danger"
            onClick={handleConfirmar}
            disabled={eliminando}
            style={{ borderRadius: "20px", height: "38px", padding: "0 20px" }}
          >
            {eliminando ? "Eliminando..." : "Eliminar"}
          </button>
        </div>
      </div>
    </div>
  );
};
