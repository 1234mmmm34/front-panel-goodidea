import React from "react";

export default function AsistenciaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#F4F5FB",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {children}
    </div>
  );
}
