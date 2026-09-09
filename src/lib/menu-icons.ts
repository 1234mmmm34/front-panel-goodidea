import {
  Settings,
  Users,
  Folder,
  Package,
  Building2,
  UserCheck,
  Truck,
  User,
  TrendingUp,
  FileText,
  CreditCard,
  Landmark,
  Calculator,
  LucideIcon,
} from "lucide-react";

export const ICONOS_FALLBACK: Record<string, LucideIcon> = {
  "configuración": Settings,
  "configuracion": Settings,
  "personas y miembros": Users,
  "catálogos": Folder,
  "catalogos": Folder,
  "servicios": Package,
  "empresas": Building2,
  "clientes": UserCheck,
  "proveedores": Truck,
  "instructores": User,
  "reportes": TrendingUp,
  "usuarios": User,
  "facturas": FileText,
  "pagos": CreditCard,
  "inventario": Package,
  "bancos": Landmark,
  "contabilidad": Calculator,
};

export function obtenerIconoGrupo(nombreGrupo: string): LucideIcon {
  const key = (nombreGrupo || "").toLowerCase().trim();
  return ICONOS_FALLBACK[key] || Folder;
}
