"use client";

import React from "react";

interface Props {
  colSpan: number;
  alt?: string;
}

export const EstadoVacioTabla: React.FC<Props> = ({
  colSpan,
  alt = "Sin resultados",
}) => {
  return (
    <tr style={{ backgroundColor: "#ffffff" }}>
      <td
        colSpan={colSpan}
        style={{
          padding: 0,
          textAlign: "center",
          background: "#fff",
          borderBottom: "none",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/assets/not-found.png"
          alt={alt}
          draggable={false}
          style={{
            display: "block",
            margin: "0 auto",
            maxWidth: "300px",
            width: "100%",
            height: "auto",
            userSelect: "none",
            pointerEvents: "none",
          }}
        />
      </td>
    </tr>
  );
};

