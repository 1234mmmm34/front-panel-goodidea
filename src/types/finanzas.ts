export interface DashboardKpis {
  d_FechaInicio: string;        // rango que realmente usó el backend
  d_FechaFin: string;
  d_FechaCorte?: string;        // fecha a la que se calcula la cartera: la fecha final del filtro, pero nunca después de hoy
  d_Facturado: number;          // con IVA
  i_Facturas: number;
  d_Cobrado: number;            // con IVA
  d_PorCobrar: number;          // con IVA, saldo a la fecha final
  d_Vencido: number;            // con IVA, parte de d_PorCobrar
  d_SinFacturar: number;        // con IVA, estado actual (no depende del rango)
  d_VentaPeriodo: number;       // sin IVA
  d_CostoProveedores: number;   // sin IVA
  d_Utilidad: number;           // sin IVA
  d_MargenPct: number;          // porcentaje, ej. 34.5
}

export interface DashboardMes {
  d_Mes: string;                // primer día del mes
  d_Facturado: number;
  d_Cobrado: number;
}

export interface DashboardAntiguedad {
  i_Orden: number;              // 1..6, ya viene ordenado
  v_Rango: string;              // "Por vencer", "1 a 30 días", ..., "Sin programar"
  d_Monto: number;
}

export interface DashboardClienteSaldo {
  i_CveEmpresa: number | null;
  v_Empresa: string;
  d_Saldo: number;
  i_Facturas: number;
}

export interface DashboardFinanzas {
  kpis: DashboardKpis;
  serieMensual: DashboardMes[];
  antiguedad: DashboardAntiguedad[];
  topClientes: DashboardClienteSaldo[];
}
