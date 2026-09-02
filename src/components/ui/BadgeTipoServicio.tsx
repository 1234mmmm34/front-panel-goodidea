import React from "react";
import { Video, ClipboardList, Package, Calendar } from "lucide-react";

interface Props {
  tipoServicio: string | null;
  showIcon?: boolean;
}

export const BadgeTipoServicio: React.FC<Props> = ({ tipoServicio, showIcon = true }) => {
  const tipoUpper = (tipoServicio || "").trim().toUpperCase();

  let badgeClass = "badge-default";
  let IconComponent = Calendar;

  switch (tipoUpper) {
    case "CAPACITACIÓN":
    case "CAPACITACION":
      badgeClass = "badge-capacitacion";
      IconComponent = Video;
      break;
    case "ESTUDIOS":
      badgeClass = "badge-estudios";
      IconComponent = ClipboardList;
      break;
    case "PRODUCTOS":
      badgeClass = "badge-productos";
      IconComponent = Package;
      break;
    case "SERVICIO":
      badgeClass = "badge-servicio";
      IconComponent = Calendar;
      break;
    default:
      badgeClass = "badge-default";
      IconComponent = Calendar;
      break;
  }

  return (
    <span className={`badge ${badgeClass}`}>
      {showIcon && <IconComponent size={12} />}
      {tipoUpper || "SIN TIPO"}
    </span>
  );
};
