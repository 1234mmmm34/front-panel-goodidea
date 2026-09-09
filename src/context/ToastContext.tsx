"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from "lucide-react";

export type ToastType = "success" | "error" | "warning" | "info";

export interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
}

export interface ConfirmOptions {
  title: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "primary" | "warning";
  onConfirm: () => void;
  onCancel?: () => void;
}

interface ToastContextType {
  toast: {
    success: (msg: string) => void;
    error: (msg: string) => void;
    warning: (msg: string) => void;
    info: (msg: string) => void;
  };
  confirmModal: (options: ConfirmOptions) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [confirmState, setConfirmState] = useState<ConfirmOptions | null>(null);

  const addToast = useCallback((type: ToastType, message: string) => {
    const id = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    setToasts((prev) => [...prev, { id, type, message }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = {
    success: (msg: string) => addToast("success", msg),
    error: (msg: string) => addToast("error", msg),
    warning: (msg: string) => addToast("warning", msg),
    info: (msg: string) => addToast("info", msg),
  };

  const confirmModal = useCallback((options: ConfirmOptions) => {
    setConfirmState(options);
  }, []);

  const handleConfirmAction = () => {
    if (confirmState) {
      const action = confirmState.onConfirm;
      setConfirmState(null);
      action();
    }
  };

  const handleCancelAction = () => {
    if (confirmState) {
      const cancelAction = confirmState.onCancel;
      setConfirmState(null);
      if (cancelAction) cancelAction();
    }
  };

  return (
    <ToastContext.Provider value={{ toast, confirmModal }}>
      {children}

      {/* CONTENEDOR DE TOASTS FLOTANTES */}
      <div
        style={{
          position: "fixed",
          top: "20px",
          right: "20px",
          zIndex: 99999,
          display: "flex",
          flexDirection: "column",
          gap: "10px",
          pointerEvents: "none",
          maxWidth: "400px",
          width: "calc(100vw - 40px)",
        }}
      >
        {toasts.map((t) => {
          let bg = "#ffffff";
          let border = "#e2e8f0";
          let color = "#1e293b";
          let icon = <Info size={18} style={{ color: "#2B8FCC" }} />;

          if (t.type === "success") {
            bg = "#dcf5e8";
            border = "#a8e6c3";
            color = "#1a7f4e";
            icon = <CheckCircle2 size={18} style={{ color: "#1a7f4e" }} />;
          } else if (t.type === "error") {
            bg = "#fde8e8";
            border = "#fca5a5";
            color = "#dc3545";
            icon = <AlertCircle size={18} style={{ color: "#dc3545" }} />;
          } else if (t.type === "warning") {
            bg = "#fff6da";
            border = "#ffe89a";
            color = "#856404";
            icon = <AlertTriangle size={18} style={{ color: "#856404" }} />;
          } else if (t.type === "info") {
            bg = "#eaf4fb";
            border = "#b5cfe8";
            color = "#2B8FCC";
            icon = <Info size={18} style={{ color: "#2B8FCC" }} />;
          }

          return (
            <div
              key={t.id}
              style={{
                pointerEvents: "auto",
                backgroundColor: bg,
                border: `1px solid ${border}`,
                color: color,
                padding: "12px 16px",
                borderRadius: "10px",
                boxShadow: "0 10px 25px -5px rgba(0,0,0,0.12)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "12px",
                fontSize: "13px",
                fontWeight: 600,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                {icon}
                <span>{t.message}</span>
              </div>
              <button
                type="button"
                onClick={() => removeToast(t.id)}
                style={{
                  background: "none",
                  border: "none",
                  color: color,
                  cursor: "pointer",
                  padding: 0,
                  display: "flex",
                  alignItems: "center",
                  opacity: 0.7,
                }}
              >
                <X size={16} />
              </button>
            </div>
          );
        })}
      </div>

      {/* MODAL CONFIRM PERSONALIZADO */}
      {confirmState && (
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
        >
          <div
            style={{
              maxWidth: "440px",
              width: "100%",
              backgroundColor: "#ffffff",
              borderRadius: "24px",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
              padding: "28px",
              display: "flex",
              flexDirection: "column",
              gap: "20px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              <div
                style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "50%",
                  backgroundColor:
                    confirmState.variant === "danger"
                      ? "#fde8e8"
                      : confirmState.variant === "warning"
                      ? "#fff6da"
                      : "#e0f2fe",
                  color:
                    confirmState.variant === "danger"
                      ? "#dc3545"
                      : confirmState.variant === "warning"
                      ? "#856404"
                      : "#0284c7",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                {confirmState.variant === "danger" ? (
                  <AlertCircle size={24} />
                ) : confirmState.variant === "warning" ? (
                  <AlertTriangle size={24} />
                ) : (
                  <Info size={24} />
                )}
              </div>
              <div>
                <h4
                  style={{
                    fontSize: "17px",
                    fontWeight: 700,
                    color: "#0f172a",
                    margin: 0,
                    lineHeight: 1.2,
                  }}
                >
                  {confirmState.title}
                </h4>
                {confirmState.message && (
                  <p
                    style={{
                      fontSize: "14px",
                      color: "#64748b",
                      margin: "4px 0 0 0",
                      lineHeight: 1.3,
                    }}
                  >
                    {confirmState.message}
                  </p>
                )}
              </div>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-end",
                gap: "10px",
                marginTop: "4px",
              }}
            >
              <button
                type="button"
                onClick={handleCancelAction}
                style={{
                  height: "40px",
                  padding: "0 22px",
                  borderRadius: "20px",
                  backgroundColor: "#ffffff",
                  border: "1px solid #e0f2fe",
                  color: "#475569",
                  fontSize: "13px",
                  fontWeight: 500,
                  cursor: "pointer",
                }}
              >
                {confirmState.cancelText || "Cancelar"}
              </button>
              <button
                type="button"
                onClick={handleConfirmAction}
                style={{
                  height: "40px",
                  padding: "0 22px",
                  borderRadius: "20px",
                  backgroundColor:
                    confirmState.variant === "danger" ? "#dc3545" : "#0284c7",
                  color: "#ffffff",
                  border: "none",
                  fontSize: "14px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                {confirmState.confirmText || "Aceptar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast debe usarse dentro de un ToastProvider");
  }
  return context;
};
