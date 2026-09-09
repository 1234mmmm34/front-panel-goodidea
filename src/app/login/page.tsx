"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, AlertCircle } from "lucide-react";
import { AuthService } from "@/services/auth.service";
import { useToast } from "@/context/ToastContext";

export default function LoginPage() {
  const { toast } = useToast();
  const router = useRouter();

  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [mostrarPassword, setMostrarPassword] = useState<boolean>(false);
  const [cargando, setCargando] = useState<boolean>(false);
  const [errorMensaje, setErrorMensaje] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMensaje(null);

    if (!email.trim() || !password) {
      setErrorMensaje("Por favor ingresa tu correo electrónico y contraseña.");
      return;
    }

    setCargando(true);

    const resultado = await AuthService.login({
      v_email: email,
      password: password,
    });

    setCargando(false);

    if (resultado.exito) {
      router.push("/calendario");
    } else {
      setErrorMensaje(
        resultado.mensaje || "El usuario no existe o credenciales incorrectas"
      );
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#ffffff",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-start",
        paddingTop: "80px",
        paddingBottom: "40px",
        paddingLeft: "16px",
        paddingRight: "16px",
        boxSizing: "border-box",
        fontFamily: "'Roboto', system-ui, -apple-system, sans-serif",
      }}
    >

      <div
        style={{
          width: "100%",
          maxWidth: "380px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        {/* Logos combinados: gi_slogo.png a la izquierda de gi_logo.png */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0px",
            marginBottom: "6px",
          }}
        >


          <img
            src="/assets/gi_slogo.png"
            alt="GOODIDEA Icon"
            style={{ height: "42px", width: "auto", objectFit: "contain" }}
          />
          <img
            src="/assets/gi_logo.png"
            alt="GOODIDEA Logo"
            style={{ height: "36px", width: "auto", objectFit: "contain" }}
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
        </div>

        {/* Título y Slogan */}
        <h1
          style={{
            fontSize: "22px",
            fontWeight: 700,
            color: "#0f172a",
            margin: "12px 0 4px 0",
            textAlign: "center",
          }}
        >
          Ingresa a tu cuenta
        </h1>
        <p
          style={{
            fontSize: "14px",
            fontWeight: 400,
            color: "#64748b",
            margin: "0 0 28px 0",
            textAlign: "center",
          }}
        >
          La mejor idea para tu empresa
        </p>

        {/* Alerta de Error */}
        {errorMensaje && (
          <div
            style={{
              width: "100%",
              marginBottom: "20px",
              padding: "12px 14px",
              borderRadius: "10px",
              backgroundColor: "#fef2f2",
              border: "1px solid #fecaca",
              color: "#dc3545",
              fontSize: "13px",
              display: "flex",
              alignItems: "center",
              gap: "10px",
              boxSizing: "border-box",
            }}
          >
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{errorMensaje}</span>
          </div>
        )}

        {/* Formulario Estilo Alegra */}
        <form onSubmit={handleSubmit} style={{ width: "100%", display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* Campo Correo Electrónico */}
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label
              htmlFor="email-input"
              style={{
                fontSize: "13px",
                fontWeight: 500,
                color: "#334155",
              }}
            >
              Correo electrónico
            </label>
            <input
              id="email-input"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Ingresa tu correo electrónico"
              style={{
                width: "100%",
                height: "44px",
                padding: "0 14px",
                borderRadius: "10px",
                border: "1px solid #cbd5e1",
                backgroundColor: "#ffffff",
                color: "#0f172a",
                fontSize: "14px",
                outline: "none",
                transition: "border-color 0.2s, box-shadow 0.2s",
                boxSizing: "border-box",
              }}
              onFocus={(e) => {
                e.target.style.borderColor = "#2B8FCC";
                e.target.style.boxShadow = "0 0 0 3px rgba(43, 143, 204, 0.15)";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "#cbd5e1";
                e.target.style.boxShadow = "none";
              }}
            />
          </div>

          {/* Campo Contraseña */}
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <label
                htmlFor="password-input"
                style={{
                  fontSize: "13px",
                  fontWeight: 500,
                  color: "#334155",
                }}
              >
                Contraseña
              </label>
              <button
                type="button"
                onClick={() => toast.info("Por favor contacta al administrador para restablecer tu contraseña.")}
                style={{
                  background: "none",
                  border: "none",
                  padding: 0,
                  fontSize: "12px",
                  fontWeight: 500,
                  color: "#2B8FCC",
                  cursor: "pointer",
                }}
              >
                ¿Olvidaste tu contraseña?
              </button>
            </div>

            <div style={{ position: "relative", width: "100%" }}>
              <input
                id="password-input"
                type={mostrarPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Ingresa tu contraseña"
                style={{
                  width: "100%",
                  height: "44px",
                  padding: "0 40px 0 14px",
                  borderRadius: "10px",
                  border: "1px solid #cbd5e1",
                  backgroundColor: "#ffffff",
                  color: "#0f172a",
                  fontSize: "14px",
                  outline: "none",
                  transition: "border-color 0.2s, box-shadow 0.2s",
                  boxSizing: "border-box",
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = "#2B8FCC";
                  e.target.style.boxShadow = "0 0 0 3px rgba(43, 143, 204, 0.15)";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "#cbd5e1";
                  e.target.style.boxShadow = "none";
                }}
              />
              <button
                type="button"
                onClick={() => setMostrarPassword(!mostrarPassword)}
                title={mostrarPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                style={{
                  position: "absolute",
                  right: "12px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  padding: "4px",
                  color: "#64748b",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {mostrarPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Botón Iniciar (Azul Bajito Estilo Alegra) */}
          <button
            type="submit"
            disabled={cargando}
            style={{
              width: "100%",
              height: "46px",
              marginTop: "8px",
              borderRadius: "23px",
              backgroundColor: "#2B8FCC",
              color: "#ffffff",
              fontSize: "15px",
              fontWeight: 600,
              border: "none",
              cursor: cargando ? "not-allowed" : "pointer",
              opacity: cargando ? 0.7 : 1,
              transition: "background-color 0.2s, transform 0.1s",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              boxShadow: "0 4px 12px rgba(43, 143, 204, 0.2)",
            }}
            onMouseOver={(e) => {
              if (!cargando) e.currentTarget.style.backgroundColor = "#2275ab";
            }}
            onMouseOut={(e) => {
              if (!cargando) e.currentTarget.style.backgroundColor = "#2B8FCC";
            }}
          >
            {cargando ? (
              <div
                style={{
                  width: "20px",
                  height: "20px",
                  border: "2px solid rgba(255, 255, 255, 0.4)",
                  borderTopColor: "#ffffff",
                  borderRadius: "50%",
                  animation: "spin 0.8s linear infinite",
                }}
              />
            ) : (
              "Ingresar"
            )}
          </button>
        </form>
      </div>

      <style jsx global>{`
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}
