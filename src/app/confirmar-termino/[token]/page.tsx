"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, AlertCircle, RefreshCw, AlertTriangle } from "lucide-react";
import { FacturasService } from "@/services/facturas.service";
import { TerminoServicioDto } from "@/types/servicios";
import { formatearFechaTexto } from "@/lib/date-utils";
import { useToast } from "@/context/ToastContext";

export default function ConfirmarTerminoPage() {
  const params = useParams();
  const token = (params?.token as string) || "";
  const { toast } = useToast();

  const [cargando, setCargando] = useState<boolean>(true);
  const [servicio, setServicio] = useState<TerminoServicioDto | null>(null);
  const [errorTipo, setErrorTipo] = useState<"token_invalido" | "error_red" | null>(null);
  const [confirmando, setConfirmando] = useState<boolean>(false);
  const [confirmadoExitoso, setConfirmadoExitoso] = useState<boolean>(false);
  const [yaConfirmadoDeAntes, setYaConfirmadoDeAntes] = useState<boolean>(false);

  const cargarDatos = useCallback(async () => {
    if (!token) {
      setCargando(false);
      setErrorTipo("token_invalido");
      return;
    }

    setCargando(true);
    setErrorTipo(null);

    try {
      const data = await FacturasService.getTerminoPublico(token);
      setServicio(data);
      if (data.b_Confirmado) {
        setYaConfirmadoDeAntes(true);
      }
    } catch (err: any) {
      const status = err?.response?.status;
      if (status === 404) {
        setErrorTipo("token_invalido");
      } else {
        setErrorTipo("error_red");
      }
    } finally {
      setCargando(false);
    }
  }, [token]);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  const handleConfirmar = async () => {
    if (!token || confirmando) return;

    setConfirmando(true);
    try {
      const res = await FacturasService.confirmarTerminoPublico(token);
      if (res?.b_YaConfirmado) {
        setYaConfirmadoDeAntes(true);
      }
      setConfirmadoExitoso(true);
      toast.success("Servicio confirmado como terminado");
    } catch (err: any) {
      const status = err?.response?.status;
      if (status === 404) {
        setErrorTipo("token_invalido");
      } else {
        const msg =
          err?.response?.data?.mensaje ||
          err?.response?.data?.message ||
          "Error al confirmar el término del servicio.";
        toast.error(msg);
      }
    } finally {
      setConfirmando(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#f1f5f9",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px 16px",
        fontFamily: "'Roboto', system-ui, -apple-system, sans-serif",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "520px",
          backgroundColor: "#ffffff",
          borderRadius: "16px",
          border: "1px solid #e2e8f0",
          boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.03)",
          padding: "36px 32px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          boxSizing: "border-box",
        }}
      >
        {/* Logo de GOODiDEA */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "24px" }}>
          <img
            src="/assets/gi_logo.png"
            alt="GOODiDEA"
            style={{ height: "48px", width: "auto", objectFit: "contain" }}
            onError={(e) => {
              // Fallback en caso de que gi_logo requiera icono
              e.currentTarget.style.display = "none";
            }}
          />
        </div>

        {/* 1. ESTADO DE CARGA */}
        {cargando && (
          <div style={{ padding: "40px 0", textAlign: "center", color: "#64748b" }}>
            <div
              className="inline-block animate-spin"
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "50%",
                border: "3px solid #e2e8f0",
                borderTopColor: "#2B8FCC",
                marginBottom: "16px",
              }}
            />
            <p style={{ fontSize: "14px", fontWeight: 500, margin: 0 }}>Cargando información del servicio...</p>
          </div>
        )}

        {/* 2. TOKEN INVÁLIDO (404) */}
        {!cargando && errorTipo === "token_invalido" && (
          <div style={{ textAlign: "center", padding: "16px 0", width: "100%" }}>
            <div
              style={{
                width: "56px",
                height: "56px",
                borderRadius: "50%",
                backgroundColor: "#fee2e2",
                color: "#dc2626",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 16px auto",
              }}
            >
              <AlertCircle size={32} />
            </div>
            <h2 style={{ fontSize: "20px", fontWeight: 700, color: "#0f172a", margin: "0 0 8px 0" }}>
              Enlace no válido
            </h2>
            <p style={{ fontSize: "14px", color: "#64748b", margin: "0 0 24px 0", lineHeight: 1.5 }}>
              Este enlace no es válido o ya no existe.
            </p>
            <Link
              href="/login"
              style={{
                display: "inline-block",
                padding: "10px 20px",
                borderRadius: "8px",
                backgroundColor: "#2B8FCC",
                color: "#ffffff",
                textDecoration: "none",
                fontSize: "14px",
                fontWeight: 600,
              }}
            >
              Ir al inicio de sesión
            </Link>
          </div>
        )}

        {/* 3. ERROR DE RED U OTRO */}
        {!cargando && errorTipo === "error_red" && (
          <div style={{ textAlign: "center", padding: "16px 0", width: "100%" }}>
            <div
              style={{
                width: "56px",
                height: "56px",
                borderRadius: "50%",
                backgroundColor: "#ffedd5",
                color: "#ea580c",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 16px auto",
              }}
            >
              <AlertTriangle size={32} />
            </div>
            <h2 style={{ fontSize: "20px", fontWeight: 700, color: "#0f172a", margin: "0 0 8px 0" }}>
              Error al consultar el servicio
            </h2>
            <p style={{ fontSize: "14px", color: "#64748b", margin: "0 0 24px 0", lineHeight: 1.5 }}>
              Ocurrió un problema de conexión al cargar la información.
            </p>
            <button
              type="button"
              onClick={cargarDatos}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "10px 20px",
                borderRadius: "8px",
                backgroundColor: "#2B8FCC",
                color: "#ffffff",
                border: "none",
                fontSize: "14px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              <RefreshCw size={16} />
              <span>Reintentar</span>
            </button>
          </div>
        )}

        {/* 4. ESTADO YA CONFIRMADO O CONFIRMADO EXITOSAMENTE */}
        {!cargando && !errorTipo && (confirmadoExitoso || yaConfirmadoDeAntes) && (
          <div style={{ textAlign: "center", padding: "12px 0", width: "100%" }}>
            <div
              style={{
                width: "64px",
                height: "64px",
                borderRadius: "50%",
                backgroundColor: "#dcfce7",
                color: "#16a34a",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 16px auto",
              }}
            >
              <CheckCircle2 size={38} />
            </div>

            <h2 style={{ fontSize: "20px", fontWeight: 700, color: "#0f172a", margin: "0 0 8px 0" }}>
              ¡Listo! El servicio quedó confirmado como terminado.
            </h2>

            {yaConfirmadoDeAntes && (
              <p style={{ fontSize: "14px", color: "#475569", margin: "0 0 16px 0", lineHeight: 1.5 }}>
                {servicio?.d_FechaConfirmacionTermino
                  ? `Este servicio ya había sido confirmado ${servicio.v_ConfirmadoPor?.trim() ? `por ${servicio.v_ConfirmadoPor.trim()} ` : ""}el ${formatearFechaTexto(servicio.d_FechaConfirmacionTermino)}.`
                  : "Este servicio ya había sido confirmado."}
              </p>
            )}

            {servicio && (
              <div
                style={{
                  marginTop: "20px",
                  padding: "16px",
                  backgroundColor: "#f8fafc",
                  borderRadius: "10px",
                  border: "1px solid #e2e8f0",
                  textAlign: "left",
                  fontSize: "13px",
                  color: "#334155",
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px",
                }}
              >
                <div>
                  <span style={{ color: "#64748b", fontWeight: 500 }}>Servicio:</span>{" "}
                  <strong>{servicio.v_Servicio}</strong>
                </div>
                <div>
                  <span style={{ color: "#64748b", fontWeight: 500 }}>Cliente:</span>{" "}
                  <strong>{servicio.v_Empresa}</strong>
                </div>
              </div>
            )}

            <div style={{ marginTop: "24px" }}>
              <Link
                href="/login"
                style={{
                  color: "#2B8FCC",
                  fontSize: "13px",
                  fontWeight: 600,
                  textDecoration: "none",
                }}
              >
                Entrar al sistema
              </Link>
            </div>
          </div>
        )}

        {/* 5. ESTADO NORMAL (NO CONFIRMADO AÚN) */}
        {!cargando && !errorTipo && !confirmadoExitoso && !yaConfirmadoDeAntes && servicio && (
          <div style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "stretch" }}>
            <h2
              style={{
                fontSize: "22px",
                fontWeight: 700,
                color: "#0f172a",
                textAlign: "center",
                margin: "0 0 20px 0",
              }}
            >
              ¿Ya terminó este servicio?
            </h2>

            {/* Tarjeta con datos del servicio */}
            <div
              style={{
                backgroundColor: "#f8fafc",
                borderRadius: "12px",
                border: "1px solid #e2e8f0",
                padding: "18px 20px",
                display: "flex",
                flexDirection: "column",
                gap: "12px",
                marginBottom: "24px",
                fontSize: "13px",
              }}
            >
              <div style={{ display: "grid", gridTemplateColumns: "140px 1fr", gap: "8px" }}>
                <span style={{ color: "#64748b", fontWeight: 500 }}>Tipo:</span>
                <span style={{ color: "#0f172a", fontWeight: 600 }}>{servicio.v_TipoServicio || "—"}</span>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "140px 1fr", gap: "8px" }}>
                <span style={{ color: "#64748b", fontWeight: 500 }}>Cliente:</span>
                <span style={{ color: "#0f172a", fontWeight: 600, textTransform: "uppercase" }}>
                  {servicio.v_Empresa || "—"}
                </span>
              </div>

              {servicio.v_Planta && (
                <div style={{ display: "grid", gridTemplateColumns: "140px 1fr", gap: "8px" }}>
                  <span style={{ color: "#64748b", fontWeight: 500 }}>Planta:</span>
                  <span style={{ color: "#0f172a" }}>{servicio.v_Planta}</span>
                </div>
              )}

              <div style={{ display: "grid", gridTemplateColumns: "140px 1fr", gap: "8px" }}>
                <span style={{ color: "#64748b", fontWeight: 500 }}>Servicio:</span>
                <span style={{ color: "#0f172a", fontWeight: 600 }}>{servicio.v_Servicio || "—"}</span>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "140px 1fr", gap: "8px" }}>
                <span style={{ color: "#64748b", fontWeight: 500 }}>Inicio:</span>
                <span style={{ color: "#0f172a" }}>
                  {servicio.d_FechaInicio ? formatearFechaTexto(servicio.d_FechaInicio) : "—"}
                </span>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "140px 1fr", gap: "8px" }}>
                <span style={{ color: "#64748b", fontWeight: 500 }}>Finalización estimada:</span>
                <span style={{ color: "#0f172a", fontWeight: 600 }}>
                  {servicio.d_FechaFin ? formatearFechaTexto(servicio.d_FechaFin) : "—"}
                </span>
              </div>

              {servicio.v_Responsable && (
                <div style={{ display: "grid", gridTemplateColumns: "140px 1fr", gap: "8px" }}>
                  <span style={{ color: "#64748b", fontWeight: 500 }}>Responsable:</span>
                  <span style={{ color: "#0f172a" }}>{servicio.v_Responsable}</span>
                </div>
              )}
            </div>

            {/* Botón principal verde */}
            <button
              type="button"
              disabled={confirmando}
              onClick={handleConfirmar}
              style={{
                width: "100%",
                height: "44px",
                backgroundColor: confirmando ? "#86efac" : "#16a34a",
                color: "#ffffff",
                border: "none",
                borderRadius: "10px",
                fontSize: "15px",
                fontWeight: 600,
                cursor: confirmando ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                boxShadow: "0 4px 12px rgba(22, 163, 74, 0.25)",
                transition: "background-color 0.15s ease",
              }}
            >
              {confirmando ? (
                <>
                  <div
                    className="inline-block animate-spin"
                    style={{
                      width: "18px",
                      height: "18px",
                      borderRadius: "50%",
                      border: "2px solid #ffffff",
                      borderTopColor: "transparent",
                    }}
                  />
                  <span>Confirmando...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 size={18} />
                  <span>Sí, ya terminó</span>
                </>
              )}
            </button>

            {/* Texto inferior de ayuda */}
            <p
              style={{
                marginTop: "20px",
                textAlign: "center",
                fontSize: "12px",
                color: "#64748b",
                lineHeight: 1.5,
              }}
            >
              Si aún no termina, entra al sistema y actualiza la fecha de finalización estimada.{" "}
              <Link
                href="/login"
                style={{
                  color: "#2B8FCC",
                  fontWeight: 600,
                  textDecoration: "underline",
                }}
              >
                Iniciar sesión
              </Link>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
