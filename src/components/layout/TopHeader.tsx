"use client";

import React, { useEffect, useState, useRef } from "react";
import { Plus, ChevronDown, LogOut, Upload, FileCheck, CreditCard } from "lucide-react";
import { obtenerSesionActual } from "@/lib/api-client";
import { SesionAlmacenada } from "@/types/auth";
import { AuthService } from "@/services/auth.service";

import { useToast } from "@/context/ToastContext";
import { ModalSubirArchivos } from "@/components/archivos/ModalSubirArchivos";
import { ModalMarcarEntregados } from "@/components/entregables/ModalMarcarEntregados";
import { ModalPagarFacturas } from "@/components/facturas/ModalPagarFacturas";

export const TopHeader: React.FC = () => {
  const [sesion, setSesion] = useState<SesionAlmacenada | null>(null);
  const [menuAbierto, setMenuAbierto] = useState<boolean>(false);
  const [plusMenuAbierto, setPlusMenuAbierto] = useState<boolean>(false);
  const [modalSubirArchivosAbierto, setModalSubirArchivosAbierto] = useState<boolean>(false);
  const [modalMarcarEntregadosAbierto, setModalMarcarEntregadosAbierto] = useState<boolean>(false);
  const [modalPagarFacturasAbierto, setModalPagarFacturasAbierto] = useState<boolean>(false);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const plusDropdownRef = useRef<HTMLDivElement>(null);
  const { toast, confirmModal } = useToast();

  useEffect(() => {
    const s = obtenerSesionActual();
    setSesion(s);
  }, []);

  // Cerrar menús al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setMenuAbierto(false);
      }
      if (plusDropdownRef.current && !plusDropdownRef.current.contains(event.target as Node)) {
        setPlusMenuAbierto(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const nombreTenant = sesion?.tenant || "GOODIDEA";
  const nombreUsuario = sesion?.username || sesion?.email || "Usuario";
  const emailUsuario = sesion?.email || "administracion@good-idea.com.mx";
  const inicial = nombreUsuario.charAt(0).toUpperCase() || "U";

  const handleLogout = () => {
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
    <>
      <header
        className="top-header"
        style={{
          height: "56px",
          minHeight: "56px",
          maxHeight: "56px",
          boxSizing: "border-box",
          margin: 0,
          padding: "0 20px",
          borderBottom: "1px solid #e2e8f0",
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-end",
          background: "#ffffff",
          position: "relative",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          {/* Menú de acción rápida "+" */}
          <div style={{ position: "relative" }} ref={plusDropdownRef}>
            <button
              type="button"
              className="btn-icon-top"
              title="Nueva acción rápida"
              onClick={() => {
                setPlusMenuAbierto(!plusMenuAbierto);
                setMenuAbierto(false);
              }}
              style={{
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
                  top: "44px",
                  right: 0,
                  width: "250px",
                  backgroundColor: "#ffffff",
                  borderRadius: "12px",
                  border: "1px solid #e2e8f0",
                  boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05)",
                  padding: "6px",
                  zIndex: 1000,
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
                  <span>Pagar facturas</span>
                </button>
              </div>
            )}
          </div>

          <div className="tenant-dropdown-pill">
            <span className="font-semibold text-slate-700">{nombreTenant}</span>
            <ChevronDown size={14} className="text-slate-400" />
          </div>

          {/* Avatar Circular con inicial */}
          <div ref={dropdownRef} style={{ position: "relative" }}>
            <div
              onClick={() => {
                setMenuAbierto(!menuAbierto);
                setPlusMenuAbierto(false);
              }}
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "50%",
                backgroundColor: "#dbeafe",
                color: "#2563eb",
                fontWeight: 600,
                fontSize: "14px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                userSelect: "none",
                transition: "transform 0.15s ease, box-shadow 0.15s ease",
                border: menuAbierto ? "2px solid #3b82f6" : "2px solid transparent",
              }}
              title={nombreUsuario}
            >
              {inicial}
            </div>

            {/* Menú Flotante Dropdown de Usuario */}
            {menuAbierto && (
              <div
                style={{
                  position: "absolute",
                  top: "52px",
                  right: 0,
                  width: "280px",
                  backgroundColor: "#ffffff",
                  borderRadius: "14px",
                  border: "1px solid #e2e8f0",
                  boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05)",
                  padding: "16px",
                  zIndex: 1000,
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                }}
              >
                {/* Info de Usuario */}
                <div>
                  <div style={{ fontSize: "14px", fontWeight: 600, color: "#1e293b", marginBottom: "2px" }}>
                    {nombreUsuario}
                  </div>
                  <div style={{ fontSize: "12px", color: "#64748b", wordBreak: "break-all" }}>
                    {emailUsuario}
                  </div>
                </div>

                {/* Divisor */}
                <div style={{ height: "1px", backgroundColor: "#f1f5f9", margin: "2px 0" }} />

                {/* Opción Única: Cerrar Sesión */}
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
        </div>
      </header>

      {/* Modal Subir Archivos */}
      <ModalSubirArchivos
        abierto={modalSubirArchivosAbierto}
        onCerrar={() => setModalSubirArchivosAbierto(false)}
      />

      {/* Modal Marcar Entregables como Entregados */}
      <ModalMarcarEntregados
        abierto={modalMarcarEntregadosAbierto}
        onCerrar={() => setModalMarcarEntregadosAbierto(false)}
      />

      {/* Modal Pagar Facturas / Marcar pagos de facturas masivo */}
      <ModalPagarFacturas
        abierto={modalPagarFacturasAbierto}
        onCerrar={() => setModalPagarFacturasAbierto(false)}
      />
    </>
  );
};

