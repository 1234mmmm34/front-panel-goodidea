import React from "react";

type Tipo = "info" | "advertencia" | "peligro";

interface Props {
  tipo?: Tipo;
  titulo?: string;
  children: React.ReactNode;
}

const ESTILOS_AVISO: Record<
  Tipo,
  { bg: string; borderLeft: string; color: string; icon: string }
> = {
  info: {
    bg: "#eff6ff",
    borderLeft: "#2B8FCC",
    color: "#1e3a5f",
    icon: "bi-info-circle",
  },
  advertencia: {
    bg: "#fffbeb",
    borderLeft: "#f59e0b",
    color: "#78350f",
    icon: "bi-exclamation-triangle",
  },
  peligro: {
    bg: "#fef2f2",
    borderLeft: "#dc3545",
    color: "#7f1d1d",
    icon: "bi-exclamation-octagon",
  },
};

export const AvisoInfo: React.FC<Props> = ({
  tipo = "info",
  titulo,
  children,
}) => {
  const cfg = ESTILOS_AVISO[tipo];

  return (
    <div
      style={{
        backgroundColor: cfg.bg,
        borderLeft: `4px solid ${cfg.borderLeft}`,
        color: cfg.color,
        borderRadius: "8px",
        padding: "10px 12px",
        fontSize: "12.5px",
        lineHeight: 1.45,
        display: "flex",
        alignItems: "flex-start",
        gap: "8px",
        textAlign: "left",
      }}
    >
      <i
        className={`bi ${cfg.icon}`}
        style={{
          color: cfg.borderLeft,
          fontSize: "14px",
          flexShrink: 0,
          marginTop: "1px",
        }}
      />
      <div style={{ flex: 1 }}>
        {titulo && (
          <div style={{ fontWeight: 700, marginBottom: "2px" }}>{titulo}</div>
        )}
        <div>{children}</div>
      </div>
    </div>
  );
};

export default AvisoInfo;

