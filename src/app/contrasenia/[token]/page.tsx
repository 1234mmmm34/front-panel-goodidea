"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { ContraseniaService, UsuarioToken } from "@/services/contrasenia.service";
import { useToast } from "@/context/ToastContext";

export default function TerminaTuRegistroPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();

  const token = (params?.token as string) || "";

  const [cargandoToken, setCargandoToken] = useState<boolean>(true);
  const [tokenInvalido, setTokenInvalido] = useState<boolean>(false);
  const [usuario, setUsuario] = useState<UsuarioToken | null>(null);

  const [password, setPassword] = useState<string>("");
  const [confirmarPassword, setConfirmarPassword] = useState<string>("");
  const [verPassword, setVerPassword] = useState<boolean>(false);
  const [verConfirmarPassword, setVerConfirmarPassword] = useState<boolean>(false);
  const [enviando, setEnviando] = useState<boolean>(false);

  // 2.1 Validar token al montar
  useEffect(() => {
    if (!token) {
      setCargandoToken(false);
      setTokenInvalido(true);
      return;
    }

    setCargandoToken(true);
    ContraseniaService.validarToken(token)
      .then((res) => {
        setCargandoToken(false);
        if (res.exito && res.usuario) {
          setUsuario(res.usuario);
          setTokenInvalido(false);
        } else {
          setTokenInvalido(true);
        }
      })
      .catch(() => {
        setCargandoToken(false);
        setTokenInvalido(true);
      });
  }, [token]);

  // Al dar clic en "Ingresar"
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!password.trim() || !confirmarPassword.trim()) {
      toast.error("Ingresa y confirma tu contraseña");
      return;
    }

    if (password !== confirmarPassword) {
      toast.error("Las contraseñas no coinciden");
      return;
    }

    if (!usuario?.id) {
      toast.error("Error al registrarse. Por favor, contacte al administrador");
      return;
    }

    setEnviando(true);

    const res = await ContraseniaService.confirmarRegistro(usuario.id, password);

    if (res.exito) {
      toast.success("Registro exitoso! en un momento serás redirigido");
      setTimeout(() => {
        router.push("/login");
      }, 3000);
    } else {
      setEnviando(false);
      toast.error(res.mensaje || "Error al registrarse. Por favor, contacte al administrador");
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
        paddingLeft: "16px",
        paddingRight: "16px",
        boxSizing: "border-box",
        fontFamily: "'Roboto', system-ui, -apple-system, sans-serif",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "400px",
          marginTop: "100px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
        }}
      >
        {/* ESTADO 1: Cargando (Solo el logo) */}
        {cargandoToken ? (
          <div>
            <img
              src="/assets/gi_logo.png"
              alt="GOODiDEA Logo"
              style={{ height: "60px", width: "auto", objectFit: "contain" }}
            />
          </div>
        ) : tokenInvalido || !usuario ? (
          /* ESTADO 2: Token inválido (Logo + texto rojo semibold) */
          <div>
            <img
              src="/assets/gi_logo.png"
              alt="GOODiDEA Logo"
              style={{ height: "60px", width: "auto", objectFit: "contain", marginBottom: "20px" }}
            />
            <p
              style={{
                color: "#dc2626",
                fontWeight: 600,
                fontSize: "16px",
                margin: 0,
                lineHeight: 1.4,
              }}
            >
              Usuario no existente o token expirado
            </p>
          </div>
        ) : (
          /* ESTADO 3: Formulario de definición de contraseña */
          <>
            {/* 1. Logo 60px de alto */}
            <img
              src="/assets/gi_logo.png"
              alt="GOODiDEA Logo"
              style={{ height: "60px", width: "auto", objectFit: "contain", marginBottom: "16px" }}
            />

            {/* 2. h3 */}
            <h3
              style={{
                fontSize: "22px",
                fontWeight: 700,
                color: "#0f172a",
                margin: "0 0 6px 0",
                lineHeight: 1.2,
              }}
            >
              Termina tu registro
            </h3>

            {/* 3. Texto */}
            <p
              style={{
                fontSize: "14px",
                fontWeight: 400,
                color: "#64748b",
                margin: "0 0 12px 0",
                lineHeight: 1.4,
              }}
            >
              Bienvenido al sistema de administración de GOODiDEA
            </p>

            {/* 4. Label de cuenta asociada */}
            <p
              style={{
                fontSize: "13px",
                fontWeight: 500,
                color: "#334155",
                margin: "0 0 28px 0",
              }}
            >
              Cuenta asociada al correo{" "}
              <span style={{ fontWeight: 600, color: "#0f172a" }}>
                {usuario.v_email || "registrado"}
              </span>
            </p>

            {/* Formulario */}
            <form
              onSubmit={handleSubmit}
              style={{
                width: "100%",
                display: "flex",
                flexDirection: "column",
                gap: "20px",
                alignItems: "center",
              }}
            >
              {/* 5. Campo Contraseña */}
              <div
                style={{
                  width: "100%",
                  textAlign: "left",
                  display: "flex",
                  flexDirection: "column",
                  gap: "6px",
                }}
              >
                <label
                  htmlFor="pass-input"
                  style={{
                    fontSize: "13px",
                    fontWeight: 500,
                    color: "#334155",
                  }}
                >
                  Contraseña
                </label>
                <div style={{ position: "relative", width: "100%" }}>
                  <input
                    id="pass-input"
                    type={verPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Ingresa tu contraseña"
                    style={{
                      width: "100%",
                      height: "40px",
                      padding: "0 40px 0 14px",
                      borderRadius: "10px",
                      border: "1px solid #cbd5e1",
                      backgroundColor: "#ffffff",
                      color: "#0f172a",
                      fontSize: "14px",
                      outline: "none",
                      boxSizing: "border-box",
                      transition: "border-color 0.2s, box-shadow 0.2s",
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = "#B08438";
                      e.target.style.boxShadow = "0 0 0 3px rgba(176, 132, 56, 0.15)";
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = "#cbd5e1";
                      e.target.style.boxShadow = "none";
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setVerPassword(!verPassword)}
                    title={verPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
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
                    {verPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* 6. Campo Confirmar contraseña */}
              <div
                style={{
                  width: "100%",
                  textAlign: "left",
                  display: "flex",
                  flexDirection: "column",
                  gap: "6px",
                }}
              >
                <label
                  htmlFor="confirm-pass-input"
                  style={{
                    fontSize: "13px",
                    fontWeight: 500,
                    color: "#334155",
                  }}
                >
                  Confirmar contraseña
                </label>
                <div style={{ position: "relative", width: "100%" }}>
                  <input
                    id="confirm-pass-input"
                    type={verConfirmarPassword ? "text" : "password"}
                    value={confirmarPassword}
                    onChange={(e) => setConfirmarPassword(e.target.value)}
                    placeholder="Confirma tu contraseña"
                    style={{
                      width: "100%",
                      height: "40px",
                      padding: "0 40px 0 14px",
                      borderRadius: "10px",
                      border: "1px solid #cbd5e1",
                      backgroundColor: "#ffffff",
                      color: "#0f172a",
                      fontSize: "14px",
                      outline: "none",
                      boxSizing: "border-box",
                      transition: "border-color 0.2s, box-shadow 0.2s",
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = "#B08438";
                      e.target.style.boxShadow = "0 0 0 3px rgba(176, 132, 56, 0.15)";
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = "#cbd5e1";
                      e.target.style.boxShadow = "none";
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setVerConfirmarPassword(!verConfirmarPassword)}
                    title={verConfirmarPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
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
                    {verConfirmarPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* 7. Botón Ingresar (50% ancho, pill, fondo #B08438) */}
              <button
                type="submit"
                disabled={enviando}
                style={{
                  width: "50%",
                  height: "42px",
                  marginTop: "8px",
                  borderRadius: "9999px",
                  backgroundColor: "#B08438",
                  color: "#ffffff",
                  fontSize: "14px",
                  fontWeight: 600,
                  border: "none",
                  cursor: enviando ? "not-allowed" : "pointer",
                  opacity: enviando ? 0.7 : 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  transition: "background-color 0.2s, opacity 0.2s",
                  boxShadow: "0 4px 12px rgba(176, 132, 56, 0.25)",
                }}
                onMouseOver={(e) => {
                  if (!enviando) e.currentTarget.style.backgroundColor = "#986f2c";
                }}
                onMouseOut={(e) => {
                  if (!enviando) e.currentTarget.style.backgroundColor = "#B08438";
                }}
              >
                {enviando ? (
                  <div
                    style={{
                      width: "18px",
                      height: "18px",
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
          </>
        )}
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
