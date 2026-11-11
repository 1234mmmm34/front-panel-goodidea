/** Máximo de decimales permitidos en precios unitarios. */
export const DECIMALES_PRECIO = 4;

/** Redondeo a 2 decimales para importes (igual que el CFDI). */
export const redondear2 = (n: number): number =>
  Math.round((n + Number.EPSILON) * 100) / 100;

/** Valida texto capturado en un input de precio: vacío o número con máx. 4 decimales. */
export const esPrecioValido = (raw: string): boolean =>
  raw === "" || /^\d*\.?\d{0,4}$/.test(raw);

/**
 * Importes de una partida, calculados igual que el CFDI 4.0:
 * subtotal = round(cant × precio, 2); IVA = round(subtotal × 0.16, 2); total = subtotal + IVA
 */
export const calcularImportes = (cantidad: number, precioUnitario: number) => {
  const subtotal = redondear2((cantidad || 0) * (precioUnitario || 0));
  const iva = redondear2(subtotal * 0.16);
  return { subtotal, iva, total: redondear2(subtotal + iva) };
};

/** Precio unitario para mostrar: mínimo 2 decimales, hasta 4. */
export const formatearPrecioUnitario = (n: number | null | undefined): string =>
  (n ?? 0).toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 4 });

