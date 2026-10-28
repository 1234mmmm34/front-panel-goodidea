"use client";

import React from "react";
import { MESES_PROG } from "../pipcCatalogos";

interface Props {
  mesesSeleccionados: number[]; // 1 = ENE ... 12 = DIC
  onToggleMes: (mesNumero: number) => void;
  soloLectura?: boolean;
}

export const SelectorMeses: React.FC<Props> = ({
  mesesSeleccionados = [],
  onToggleMes,
  soloLectura = false,
}) => {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", alignItems: "center" }}>
      {MESES_PROG.map((nombreMes, idx) => {
        const mesNumero = idx + 1;
        const seleccionado = mesesSeleccionados.includes(mesNumero);

        return (
          <button
            key={nombreMes}
            type="button"
            disabled={soloLectura}
            onClick={() => onToggleMes(mesNumero)}
            style={{
              padding: "3px 7px",
              fontSize: "11px",
              fontWeight: seleccionado ? 700 : 500,
              borderRadius: "4px",
              border: `1px solid ${seleccionado ? "#2B8FCC" : "#cbd5e1"}`,
              backgroundColor: seleccionado ? "#2B8FCC" : "#ffffff",
              color: seleccionado ? "#ffffff" : "#475569",
              cursor: soloLectura ? "default" : "pointer",
              transition: "all 0.12s ease",
              minWidth: "34px",
              textAlign: "center",
            }}
            title={nombreMes}
          >
            {nombreMes}
          </button>
        );
      })}
    </div>
  );
};
