import React from "react";
import { Video, ClipboardList, Package, Calendar } from "lucide-react";

interface Props {
  tipoServicio: string | null | undefined;
  idTipoServicio?: number | null;
  showIcon?: boolean;
}

export const BadgeTipoServicio: React.FC<Props> = ({
  tipoServicio,
  idTipoServicio,
  showIcon = false,
}) => {
  const nombreRaw = (tipoServicio || "").trim();
  const tipoUpper = nombreRaw.toUpperCase();

  let badgeClass = "badge-default";
  let IconComponent = Calendar;
  let textoDisplay = nombreRaw;

  if (idTipoServicio === 2 || tipoUpper.includes("CAPACITA")) {
    badgeClass = "badge-capacitacion";
    IconComponent = Video;
    textoDisplay = "Capacitación";
  } else if (idTipoServicio === 3 || tipoUpper.includes("ESTUDIO")) {
    badgeClass = "badge-estudios";
    IconComponent = ClipboardList;
    textoDisplay = "Estudios";
  } else if (idTipoServicio === 5 || tipoUpper.includes("PRODUCTO")) {
    badgeClass = "badge-productos";
    IconComponent = Package;
    textoDisplay = "Productos";
  } else if (idTipoServicio === 6 || tipoUpper.includes("SERVICIO")) {
    badgeClass = "badge-servicio";
    IconComponent = Calendar;
    textoDisplay = "Servicios";
  } else if (nombreRaw.length > 0) {
    textoDisplay = nombreRaw.charAt(0).toUpperCase() + nombreRaw.slice(1).toLowerCase();
  } else {
    textoDisplay = "General";
  }

  return (
    <span className={badgeClass} style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
      {showIcon && <IconComponent size={12} />}
      <span>{textoDisplay}</span>
    </span>
  );
};
