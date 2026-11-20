"use client";

import React, { useEffect, useRef, useState } from "react";
import { Plus, LogOut, Upload, FileCheck, CreditCard } from "lucide-react";
import { AuthService } from "@/services/auth.service";
import { useToast } from "@/context/ToastContext";
import { ModalSubirArchivos } from "@/components/archivos/ModalSubirArchivos";
import { ModalMarcarEntregados } from "@/components/entregables/ModalMarcarEntregados";
import { ModalPagarFacturas } from "@/components/facturas/ModalPagarFacturas";

interface QuickActionsProps {
  buttonSize?: number;
}

export const QuickActionsMenu: React.FC<QuickActionsProps> = ({
  buttonSize = 32,
}) => {
  const [plusMenuAbierto, setPlusMenuAbierto] = useState<boolean>(false);
  const [modalSubirArchivosAbierto, setModalSubirArchivosAbierto] =
    useState<boolean>(false);
  const [modalMarcarEntregadosAbierto, setModalMarcarEntregadosAbierto] =
    useState<boolean>(false);
  const [modalPagarFacturasAbierto, setModalPagarFacturasAbierto] =
    useState<boolean>(false);

  const plusDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        plusDropdownRef.current &&
        !plusDropdownRef.current.contains(event.target as Node)
      ) {
        setPlusMenuAbierto(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <>
      <div style={{ position: "relative" }} ref={plusDropdownRef}>
        <button
          type="button"
          className="btn-icon-top"
          title="Nueva acción rápida"
          aria-label="Nueva acción rápida"
          aria-expanded={plusMenuAbierto}
          onClick={() => setPlusMenuAbierto((v) => !v)}
          style={{
            width: `${buttonSize}px`,
            height: `${buttonSize}px`,
            backgroundColor: plusMenuAbierto ? "#eaf4fb" : undefined,
            color: plusMenuAbierto ? "#2B8FCC" : undefined,
          }}
        >
          <Plus size={18} />
        </button>

        {plusMenuAbierto && (
          <div
            style={{
              position: "absolute",
              top: `${buttonSize + 10}px`,
              right: 0,
              width: "250px",
              backgroundColor: "#ffffff",
              borderRadius: "12px",
              border: "1px solid #e2e8f0",
              boxShadow:
                "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05)",
              padding: "6px",
              zIndex: 1200,
              display: "flex",
              flexDirection: "column",
              gap: "4px",
            }}
          >
            <button
              type="button"
              onClick={() => {
                setPlusMenuAbierto(false);
                setModalSubirArchivosAbierto(true);
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                width: "100%",
                padding: "8px 12px",
                borderRadius: "8px",
                border: "none",
                backgroundColor: "transparent",
                color: "#2B8FCC",
                fontSize: "13px",
                fontWeight: 600,
                cursor: "pointer",
                textAlign: "left",
                transition: "all 0.15s ease",
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = "#eaf4fb";
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
              }}
            >
              <Upload size={16} style={{ color: "#2B8FCC" }} />
              <span>Subir archivos</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setPlusMenuAbierto(false);
                setModalMarcarEntregadosAbierto(true);
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                width: "100%",
                padding: "8px 12px",
                borderRadius: "8px",
                border: "none",
                backgroundColor: "transparent",
                color: "#2B8FCC",
                fontSize: "13px",
                fontWeight: 600,
                cursor: "pointer",
                textAlign: "left",
                transition: "all 0.15s ease",
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = "#eaf4fb";
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
              }}
            >
              <FileCheck size={16} style={{ color: "#2B8FCC" }} />
              <span>Marcar entregables</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setPlusMenuAbierto(false);
                setModalPagarFacturasAbierto(true);
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                width: "100%",
                padding: "8px 12px",
                borderRadius: "8px",
                border: "none",
                backgroundColor: "transparent",
                color: "#2B8FCC",
                fontSize: "13px",
                fontWeight: 600,
                cursor: "pointer",
                textAlign: "left",
                transition: "all 0.15s ease",
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = "#eaf4fb";
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
              }}
            >
              <CreditCard size={16} style={{ color: "#2B8FCC" }} />
              <span>Registrar pagos</span>
            </button>
          </div>
        )}
      </div>

      <ModalSubirArchivos
        abierto={modalSubirArchivosAbierto}
        onCerrar={() => setModalSubirArchivosAbierto(false)}
      />
      <ModalMarcarEntregados
        abierto={modalMarcarEntregadosAbierto}
        onCerrar={() => setModalMarcarEntregadosAbierto(false)}
      />
      <ModalPagarFacturas
        abierto={modalPagarFacturasAbierto}
        onCerrar={() => setModalPagarFacturasAbierto(false)}
      />
    </>
  );
};

interface UserAvatarMenuProps {
  nombreUsuario: string;
  emailUsuario: string;
  nombreTenant: string;
  avatarSize?: number;
  showTenantInDropdown?: boolean;
}

export const UserAvatarMenu: React.FC<UserAvatarMenuProps> = ({
  nombreUsuario,
  emailUsuario,
  nombreTenant,
  avatarSize = 36,
  showTenantInDropdown = false,
}) => {
  const [menuAbierto, setMenuAbierto] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { toast, confirmModal } = useToast();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setMenuAbierto(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const inicial = nombreUsuario.charAt(0).toUpperCase() || "U";

  const handleLogout = () => {
    setMenuAbierto(false);
    confirmModal({
      title: "Cerrar sesión",
      message: "¿Deseas cerrar sesión?",
      confirmText: "Cerrar sesión",
      cancelText: "Cancelar",
      onConfirm: () => {
        toast.info("Sesión cerrada exitosamente");
        AuthService.logout();
      },
    });
  };

  return (
    <div ref={dropdownRef} style={{ position: "relative" }}>
      <button
        type="button"
        onClick={() => setMenuAbierto((v) => !v)}
        aria-label="Menú de usuario"
        aria-expanded={menuAbierto}
        style={{
          width: `${avatarSize}px`,
          height: `${avatarSize}px`,
          borderRadius: "50%",
          backgroundColor: "#dbeafe",
          color: "#2563eb",
          fontWeight: 600,
          fontSize: avatarSize <= 32 ? "13px" : "14px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          userSelect: "none",
          transition: "transform 0.15s ease, box-shadow 0.15s ease",
          border: menuAbierto ? "2px solid #3b82f6" : "2px solid transparent",
          padding: 0,
        }}
        title={nombreUsuario}
      >
        {inicial}
      </button>

      {menuAbierto && (
        <div
          style={{
            position: "absolute",
            top: `${avatarSize + 12}px`,
            right: 0,
            width: "280px",
            maxWidth: "calc(100vw - 24px)",
            backgroundColor: "#ffffff",
            borderRadius: "14px",
            border: "1px solid #e2e8f0",
            boxShadow:
              "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05)",
            padding: "16px",
            zIndex: 1200,
            display: "flex",
            flexDirection: "column",
            gap: "12px",
          }}
        >
          <div>
            <div
              style={{
                fontSize: "14px",
                fontWeight: 600,
                color: "#1e293b",
                marginBottom: "2px",
              }}
            >
              {nombreUsuario}
            </div>
            <div
              style={{
                fontSize: "12px",
                color: "#64748b",
                wordBreak: "break-all",
              }}
            >
              {emailUsuario}
            </div>

            {showTenantInDropdown && (
              <div
                className="tenant-dropdown-pill"
                style={{
                  marginTop: "8px",
                  display: "inline-flex",
                  cursor: "default",
                }}
              >
                <span className="font-semibold text-slate-700">
                  {nombreTenant}
                </span>
              </div>
            )}
          </div>

          <div
            style={{
              height: "1px",
              backgroundColor: "#f1f5f9",
              margin: "2px 0",
            }}
          />

          <button
            type="button"
            onClick={handleLogout}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              width: "100%",
              padding: "8px 10px",
              borderRadius: "8px",
              border: "none",
              backgroundColor: "transparent",
              color: "#475569",
              fontSize: "13px",
              fontWeight: 400,
              cursor: "pointer",
              textAlign: "left",
              transition: "all 0.2s ease",
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = "#f8fafc";
              e.currentTarget.style.color = "#0f172a";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
              e.currentTarget.style.color = "#475569";
            }}
          >
            <LogOut size={16} strokeWidth={1.5} style={{ color: "currentColor" }} />
            <span>Cerrar sesión</span>
          </button>
        </div>
      )}
    </div>
  );
};
