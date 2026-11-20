"use client";

import React from "react";
import Link from "next/link";

export default function OfflinePage() {
  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#F4F5FB",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        textAlign: "center",
      }}
    >
      <div
        style={{
          backgroundColor: "#ffffff",
          border: "1px solid #e2e8f0",
          borderRadius: "16px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
          padding: "32px 24px",
          maxWidth: "400px",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "16px",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/assets/gi_slogo.png"
          alt="GOODiDEA"
          style={{ height: "48px", width: "auto" }}
        />

        <div
          style={{
            width: "56px",
            height: "56px",
            borderRadius: "50%",
            backgroundColor: "#fef3c7",
            color: "#b45309",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "26px",
          }}
        >
          <i className="bi bi-wifi-off" />
        </div>

        <h1
          style={{
            margin: 0,
            fontSize: "18px",
            fontWeight: 700,
            color: "#1e293b",
            justifyContent: "center",
          }}
        >
          Sin conexión
        </h1>

        <p
          style={{
            margin: 0,
            fontSize: "14px",
            color: "#475569",
            lineHeight: 1.5,
          }}
        >
          Sin conexión. Solo está disponible el módulo de Asistencia.
        </p>

        <Link
          href="/asistencia"
          className="btn btn-primary"
          style={{
            width: "100%",
            height: "44px",
            borderRadius: "10px",
            fontSize: "14px",
            fontWeight: 600,
            backgroundColor: "#2B8FCC",
            marginTop: "4px",
          }}
        >
          <i className="bi bi-clipboard-check" />
          Ir a Asistencia
        </Link>
      </div>
    </div>
  );
}
