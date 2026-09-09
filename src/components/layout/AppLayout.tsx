"use client";

import React, { useState } from "react";
import { TopHeader } from "./TopHeader";
import { Sidenav } from "./Sidenav";

interface Props {
  children: React.ReactNode;
}

export const AppLayout: React.FC<Props> = ({ children }) => {
  const [collapsed, setCollapsed] = useState<boolean>(false);

  return (
    <div className="app-shell">
      {/* Sidenav fijo en el lado izquierdo */}
      <Sidenav
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed(!collapsed)}
      />

      {/* Columna derecha principal con auto-ajuste de ancho y margen dinámico */}
      <div className={`app-main-column ${collapsed ? "collapsed" : ""}`}>
        <TopHeader />
        <main className="app-main-content">{children}</main>
      </div>
    </div>
  );
};
