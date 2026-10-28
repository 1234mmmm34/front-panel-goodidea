import {
  ActividadCalendario,
  ProgramaMantenimientoEquipos,
} from "./pipcCalculos";
import { MESES_PROG } from "./pipcCatalogos";

export const MESES_CORTO = [
  "ENE",
  "FEB",
  "MAR",
  "ABR",
  "MAY",
  "JUN",
  "JUL",
  "AGO",
  "SEP",
  "OCT",
  "NOV",
  "DIC",
];

// Helper para convertir canvas a Blob PNG
export function canvasToPngBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    if (!canvas || typeof canvas.toBlob !== "function") {
      reject(new Error("Canvas no disponible para exportación"));
      return;
    }
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("No se pudo generar PNG del canvas"));
    }, "image/png");
  });
}

// Helper para envolver texto en canvas
export function wrapTextForCanvas(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string[] {
  const words = String(text || "").split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";
  words.forEach((word) => {
    const testLine = line ? line + " " + word : word;
    if (ctx.measureText(testLine).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = testLine;
    }
  });
  if (line) lines.push(line);
  return lines.length ? lines : [""];
}

/**
 * 1. Genera el Organigrama UIPC en PNG
 */
export async function generarOrganigramaCanvasBlob(
  uiriData: Record<string, { nombre?: string }> | undefined
): Promise<{ blob: Blob; width: number; height: number } | null> {
  if (typeof document === "undefined") return null;

  const W = 900;
  const ESCALA = 2;
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  const azul = "#2E86C1";
  const bordeGris = "#D5D8DC";
  const FUENTE = "DM Sans, Arial, sans-serif";

  function nombreDe(id: string) {
    const d = uiriData?.[id];
    return (d && String(d.nombre || "").trim()) || "—";
  }

  function partirRenglones(texto: string, anchoMax: number): string[] {
    const salida: string[] = [];
    wrapTextForCanvas(ctx!, texto, anchoMax).forEach((ln) => {
      if (ctx!.measureText(ln).width <= anchoMax) {
        salida.push(ln);
        return;
      }
      let actual = "";
      ln.split("").forEach((c) => {
        if (ctx!.measureText(actual + c).width > anchoMax && actual) {
          salida.push(actual);
          actual = c;
        } else {
          actual += c;
        }
      });
      if (actual) salida.push(actual);
    });
    return salida;
  }

  function ajustarTexto(
    texto: string,
    anchoMax: number,
    maxRenglones: number,
    tamMax: number,
    tamMin: number,
    peso: string
  ) {
    for (let t = tamMax; t >= tamMin; t -= 0.5) {
      ctx!.font = `${peso} ${t}px ${FUENTE}`;
      const r = partirRenglones(texto, anchoMax);
      if (
        r.length <= maxRenglones &&
        r.every((x) => ctx!.measureText(x).width <= anchoMax)
      ) {
        return { renglones: r, tam: t, peso };
      }
    }
    ctx!.font = `${peso} ${tamMin}px ${FUENTE}`;
    return { renglones: partirRenglones(texto, anchoMax), tam: tamMin, peso };
  }

  const bw = Math.min(180, (W - 40) / 4);
  const jw = Math.min(bw, (W - 40) / 4 - 6);
  const PAD = 9;

  function contenido(titulo: string, nombre: string, ancho: number) {
    const tit = ajustarTexto(titulo.toUpperCase(), ancho - 12, 2, 10, 8, "bold");
    let nom = ajustarTexto(nombre, ancho - 12, 2, 12, 9, "600");
    if (nom.renglones.length > 2) {
      nom = ajustarTexto(nombre, ancho - 12, 3, 9, 9, "600");
    }
    const alto =
      PAD +
      tit.renglones.length * (tit.tam + 3) +
      5 +
      nom.renglones.length * (nom.tam + 4) +
      PAD -
      2;
    return { tit, nom, alto };
  }

  const cajasSup = [
    contenido("Presidente", nombreDe("presidente"), bw),
    contenido("Sec. Ejecutivo", nombreDe("secretario_ejecutivo"), bw),
    contenido("Director", nombreDe("director"), bw),
    contenido("Suplente", nombreDe("suplente"), bw),
  ];

  const jefes = [
    { id: "jefe_brigada_pa", label: "Jef. Brigada Primeros Aux." },
    { id: "jefe_brigada_ci", label: "Jef. Brigada C. Incendios" },
    { id: "jefe_brigada_br", label: "Jef. Brigada Búsq. Rescate" },
    { id: "jefe_brigada_ev", label: "Jef. Brigada Evacuación" },
  ];
  const cajasJefes = jefes.map((j) => contenido(j.label, nombreDe(j.id), jw));

  const bh = Math.max(44, Math.max(...cajasSup.map((c) => c.alto)));
  const jh = Math.max(56, Math.max(...cajasJefes.map((c) => c.alto)));

  const r1y = 20;
  const r2y = r1y + bh + 36;
  const r3y = r2y + bh + 36;
  const r4y = r3y + bh + 56;
  const tituloY = r4y + jh + 34;
  const H = tituloY + 16;

  canvas.width = Math.round(W * ESCALA);
  canvas.height = Math.round(H * ESCALA);
  ctx.setTransform(ESCALA, 0, 0, ESCALA, 0, 0);
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, W, H);
  ctx.textBaseline = "alphabetic";

  function roundRect(
    x: number,
    y: number,
    w: number,
    h: number,
    r: number
  ) {
    ctx!.beginPath();
    ctx!.moveTo(x + r, y);
    ctx!.lineTo(x + w - r, y);
    ctx!.arcTo(x + w, y, x + w, y + r, r);
    ctx!.lineTo(x + w, y + h - r);
    ctx!.arcTo(x + w, y + h, x + w - r, y + h, r);
    ctx!.lineTo(x + r, y + h);
    ctx!.arcTo(x, y + h, x, y + h - r, r);
    ctx!.lineTo(x, y + r);
    ctx!.arcTo(x, y, x + r, y, r);
    ctx!.closePath();
    ctx!.fill();
    if (ctx!.lineWidth > 0) ctx!.stroke();
  }

  function line(x1: number, y1: number, x2: number, y2: number) {
    ctx!.beginPath();
    ctx!.strokeStyle = bordeGris;
    ctx!.lineWidth = 1.5;
    ctx!.moveTo(x1, y1);
    ctx!.lineTo(x2, y2);
    ctx!.stroke();
  }

  function drawBox(
    x: number,
    y: number,
    w: number,
    h: number,
    c: any,
    relleno?: string
  ) {
    ctx!.fillStyle = relleno || "#EBF5FB";
    ctx!.strokeStyle = relleno || azul;
    ctx!.lineWidth = relleno ? 0 : 1.5;
    roundRect(x, y, w, h, 8);
    ctx!.textAlign = "center";
    let yy = y + (h - (c.alto - PAD - PAD + 2)) / 2;
    ctx!.fillStyle = relleno ? "#ffffff" : azul;
    ctx!.font = `${c.tit.peso} ${c.tit.tam}px ${FUENTE}`;
    c.tit.renglones.forEach((ln: string) => {
      yy += c.tit.tam;
      ctx!.fillText(ln, x + w / 2, yy);
      yy += 3;
    });
    yy += 5;
    ctx!.fillStyle = relleno ? "#ffffff" : "#2C3E50";
    ctx!.font = `${c.nom.peso} ${c.nom.tam}px ${FUENTE}`;
    c.nom.renglones.forEach((ln: string) => {
      yy += c.nom.tam;
      ctx!.fillText(ln, x + w / 2, yy);
      yy += 4;
    });
  }

  const cx = W / 2;
  // Nivel 1: Presidente
  drawBox(cx - bw / 2, r1y, bw, bh, cajasSup[0], azul);

  // Nivel 2: Sec. Ejecutivo y Director
  const r2gap = Math.min(bw + 20, (W - 80) / 2);
  const r2x1 = cx - r2gap - bw / 2;
  const r2x2 = cx + r2gap - bw / 2;
  line(cx, r1y + bh, cx, r2y + bh / 2);
  line(r2x1 + bw / 2, r2y + bh / 2, r2x2 + bw / 2, r2y + bh / 2);
  line(r2x1 + bw / 2, r2y, r2x1 + bw / 2, r2y + bh / 2);
  line(r2x2 + bw / 2, r2y, r2x2 + bw / 2, r2y + bh / 2);
  drawBox(r2x1, r2y, bw, bh, cajasSup[1]);
  drawBox(r2x2, r2y, bw, bh, cajasSup[2]);

  // Nivel 3: Suplente bajo el Director
  line(r2x2 + bw / 2, r2y + bh, r2x2 + bw / 2, r3y);
  drawBox(r2x2, r3y, bw, bh, cajasSup[3]);

  // Nivel 4: Jefes de brigada
  const jtotal = jw * 4 + 18;
  const jstart = (W - jtotal) / 2;
  line(cx, r2y + bh / 2, cx, r4y - 14);
  line(jstart + jw / 2, r4y - 14, jstart + jtotal - jw / 2, r4y - 14);
  cajasJefes.forEach((c, i) => {
    const jx = jstart + i * (jw + 6);
    line(jx + jw / 2, r4y - 14, jx + jw / 2, r4y);
    drawBox(jx, r4y, jw, jh, c);
  });

  // Título
  ctx.fillStyle = "#2C3E50";
  ctx.font = `bold 12px ${FUENTE}`;
  ctx.textAlign = "center";
  ctx.fillText("ORGANIGRAMA — UNIDAD INTERNA DE PROTECCIÓN CIVIL", W / 2, tituloY);
  ctx.setTransform(1, 0, 0, 1, 0, 0);

  const blob = await canvasToPngBlob(canvas);
  return { blob, width: canvas.width, height: canvas.height };
}

/**
 * 2. Genera el Calendario de Actividades en PNG (usado también por Mantenimiento)
 */
export async function generarCalendarioCanvasBlob(
  lista: ActividadCalendario[] | undefined,
  anio: number | string
): Promise<{ blob: Blob; width: number; height: number } | null> {
  if (typeof document === "undefined") return null;

  const activas = (lista || []).filter((r) => String(r.actividad || "").trim());
  if (!activas.length) return null;

  const scale = 2;
  const leftW = 560;
  const monthW = 58;
  const width = leftW + monthW * 12;
  const topH = 44;
  const headerH = 40;
  const rowH = 44;
  const height = topH + headerH + rowH * activas.length;

  const canvas = document.createElement("canvas");
  canvas.width = width * scale;
  canvas.height = height * scale;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  ctx.scale(scale, scale);

  const azul = "#2E86C1";
  const negro = "#2C3E50";
  const grisFila = "#F4F6F7";
  const borde = "#D5D8DC";
  const texto = "#2C3E50";
  const verde = "#1e8449";

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);

  // Encabezado año
  ctx.fillStyle = azul;
  ctx.fillRect(0, 0, width, topH);
  ctx.fillStyle = "#ffffff";
  ctx.font = "700 18px DM Sans, Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(String(anio || new Date().getFullYear()), width / 2, topH / 2);

  // Encabezado actividades / meses
  ctx.fillStyle = negro;
  ctx.fillRect(0, topH, width, headerH);
  ctx.fillStyle = "#ffffff";
  ctx.font = "700 13px DM Sans, Arial, sans-serif";
  ctx.textAlign = "left";
  ctx.fillText("ACTIVIDADES", 14, topH + headerH / 2);

  ctx.textAlign = "center";
  ctx.font = "700 12px DM Sans, Arial, sans-serif";
  MESES_CORTO.forEach((m: string, i: number) => {
    ctx.fillText(m, leftW + i * monthW + monthW / 2, topH + headerH / 2);
  });

  // Filas
  ctx.font = "400 13px DM Sans, Arial, sans-serif";
  activas.forEach((row, ri) => {
    const y = topH + headerH + ri * rowH;
    ctx.fillStyle = ri % 2 === 0 ? "#ffffff" : grisFila;
    ctx.fillRect(0, y, width, rowH);

    ctx.strokeStyle = borde;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, y + rowH);
    ctx.lineTo(width, y + rowH);
    ctx.stroke();

    ctx.fillStyle = texto;
    ctx.font = "400 13px DM Sans, Arial, sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";

    const lines = wrapTextForCanvas(ctx, row.actividad || "", leftW - 24).slice(0, 2);
    const lineHeight = 15;
    const startY = y + rowH / 2 - ((lines.length - 1) * lineHeight) / 2;
    lines.forEach((line, li) => ctx.fillText(line, 14, startY + li * lineHeight));

    ctx.textAlign = "center";
    ctx.font = "900 19px Arial, sans-serif";
    ctx.fillStyle = verde;
    MESES_CORTO.forEach((_: string, mi: number) => {
      if ((row.meses || []).includes(mi)) {
        ctx.fillText("✓", leftW + mi * monthW + monthW / 2, y + rowH / 2);
      }
    });
  });

  // Líneas verticales suaves para meses
  ctx.strokeStyle = "#E5E8EB";
  ctx.lineWidth = 1;
  for (let i = 0; i <= 12; i++) {
    const x = leftW + i * monthW;
    ctx.beginPath();
    ctx.moveTo(x, topH);
    ctx.lineTo(x, height);
    ctx.stroke();
  }

  const blob = await canvasToPngBlob(canvas);
  return { blob, width: canvas.width, height: canvas.height };
}

/**
 * 3. Genera el Programa Anual de Mantenimiento de Equipos en PNG
 */
export async function generarProgramaMantenimientoCanvasBlob(
  data: ProgramaMantenimientoEquipos | undefined,
  tituloEquipo: string,
  anio: number | string
): Promise<{ blob: Blob; width: number; height: number; filas: number } | null> {
  if (typeof document === "undefined" || !data) return null;

  const equipos = Object.keys(data).filter((e) => String(e || "").trim());
  if (!equipos.length) return null;

  const filas = equipos.map((equipo) => {
    const d = data[equipo] || {};
    const meses = MESES_PROG.map((m) => {
      const item = d[m] || {};
      return { mes: m, p: item.p ? 1 : 0, r: item.r ? 1 : 0 };
    });
    const totalP = meses.reduce((acc, x) => acc + x.p, 0);
    const totalR = meses.reduce((acc, x) => acc + x.r, 0);
    const pct = totalP > 0 ? Math.round((totalR / totalP) * 100) : 0;
    return { equipo, meses, totalP, totalR, pct };
  });

  const scale = 2;
  const leftW = 260;
  const pairW = 54;
  const totalW = 48;
  const pctW = 64;
  const legendH = 44;
  const topH = 42;
  const monthH = 34;
  const subH = 32;
  const rowH = 38;
  const totalH = 40;
  const width = leftW + MESES_PROG.length * pairW + totalW * 2 + pctW;
  const height = topH + monthH + subH + filas.length * rowH + totalH + legendH;

  const canvas = document.createElement("canvas");
  canvas.width = width * scale;
  canvas.height = height * scale;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  ctx.scale(scale, scale);

  const azul = "#2E86C1";
  const negro = "#2C3E50";
  const azulSub = "#2C5F8A";
  const azulTotal = "#1a3a52";
  const naranja = "#E67E22";
  const verde = "#1e8449";
  const rojo = "#C0392B";
  const borde = "#D5D8DC";
  const grisFila = "#F8F9FA";
  const grisEquipo = "#F4F6F7";
  const verdePlaneado = "#d4efdf";
  const naranjaReal = "#fdebd0";

  function rect(x: number, y: number, w: number, h: number, fill: string, stroke?: string) {
    ctx!.fillStyle = fill;
    ctx!.fillRect(x, y, w, h);
    ctx!.strokeStyle = stroke || borde;
    ctx!.lineWidth = 1;
    ctx!.strokeRect(x + 0.5, y + 0.5, w, h);
  }

  function text(txt: any, x: number, y: number, opts: any = {}) {
    ctx!.fillStyle = opts.color || "#2C3E50";
    ctx!.font = `${opts.weight || "400"} ${opts.size || 11}px DM Sans, Arial, sans-serif`;
    ctx!.textAlign = opts.align || "center";
    ctx!.textBaseline = opts.baseline || "middle";
    ctx!.fillText(String(txt ?? ""), x, y);
  }

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);

  const xStartMeses = leftW;
  const xTotal = leftW + MESES_PROG.length * pairW;
  const xPct = xTotal + totalW * 2;

  // Encabezado principal
  rect(0, 0, leftW, topH + monthH + subH, azul, "#ffffff");
  text(tituloEquipo, leftW / 2, (topH + monthH + subH) / 2, {
    color: "#ffffff",
    weight: "700",
    size: 12,
  });

  rect(xStartMeses, 0, MESES_PROG.length * pairW, topH, negro, "#ffffff");
  text(String(anio || new Date().getFullYear()), xStartMeses + (MESES_PROG.length * pairW) / 2, topH / 2, {
    color: "#ffffff",
    weight: "700",
    size: 15,
  });

  rect(xTotal, 0, totalW * 2, topH + monthH, naranja, "#ffffff");
  text("TOTAL", xTotal + totalW, (topH + monthH) / 2, {
    color: "#ffffff",
    weight: "700",
    size: 12,
  });

  rect(xPct, 0, pctW, topH + monthH + subH, verde, "#ffffff");
  text("%", xPct + pctW / 2, (topH + monthH + subH) / 2, {
    color: "#ffffff",
    weight: "700",
    size: 14,
  });

  // Meses y subcolumnas
  MESES_PROG.forEach((m, i) => {
    const x = xStartMeses + i * pairW;
    rect(x, topH, pairW, monthH, negro, "#ffffff");
    text(m, x + pairW / 2, topH + monthH / 2, { color: "#ffffff", weight: "700", size: 10 });

    rect(x, topH + monthH, pairW / 2, subH, azulSub, "#ffffff");
    rect(x + pairW / 2, topH + monthH, pairW / 2, subH, azulSub, "#ffffff");
    text("P", x + pairW / 4, topH + monthH + subH / 2, { color: "#ffffff", weight: "700", size: 10 });
    text("R", x + (pairW * 3) / 4, topH + monthH + subH / 2, {
      color: "#ffffff",
      weight: "700",
      size: 10,
    });
  });

  rect(xTotal, topH + monthH, totalW, subH, azulSub, "#ffffff");
  rect(xTotal + totalW, topH + monthH, totalW, subH, azulSub, "#ffffff");
  text("P", xTotal + totalW / 2, topH + monthH + subH / 2, { color: "#ffffff", weight: "700", size: 10 });
  text("R", xTotal + totalW * 1.5, topH + monthH + subH / 2, {
    color: "#ffffff",
    weight: "700",
    size: 10,
  });

  const y0 = topH + monthH + subH;
  const colP = Array(MESES_PROG.length).fill(0);
  const colR = Array(MESES_PROG.length).fill(0);
  let totalP = 0;
  let totalR = 0;

  filas.forEach((row, ri) => {
    const y = y0 + ri * rowH;
    const bg = ri % 2 === 0 ? "#ffffff" : grisFila;
    rect(0, y, leftW, rowH, grisEquipo, borde);

    ctx.fillStyle = "#2C3E50";
    ctx.font = "600 11px DM Sans, Arial, sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";

    const lines = wrapTextForCanvas(ctx, row.equipo, leftW - 18).slice(0, 2);
    const lh = 13;
    const sy = y + rowH / 2 - ((lines.length - 1) * lh) / 2;
    lines.forEach((line, li) => ctx.fillText(line, 9, sy + li * lh));

    row.meses.forEach((cell, mi) => {
      const x = xStartMeses + mi * pairW;
      rect(x, y, pairW / 2, rowH, cell.p ? verdePlaneado : bg, borde);
      rect(x + pairW / 2, y, pairW / 2, rowH, cell.r ? naranjaReal : bg, borde);
      if (cell.p) text("1", x + pairW / 4, y + rowH / 2, { color: verde, weight: "700", size: 12 });
      if (cell.r)
        text("1", x + (pairW * 3) / 4, y + rowH / 2, { color: naranja, weight: "700", size: 12 });
      colP[mi] += cell.p;
      colR[mi] += cell.r;
    });

    totalP += row.totalP;
    totalR += row.totalR;

    rect(xTotal, y, totalW, rowH, "#FEF9F0", borde);
    rect(xTotal + totalW, y, totalW, rowH, "#FEF9F0", borde);
    text(row.totalP, xTotal + totalW / 2, y + rowH / 2, { weight: "700", size: 11 });
    text(row.totalR, xTotal + totalW * 1.5, y + rowH / 2, { weight: "700", size: 11 });

    const pctColor = row.pct >= 80 ? verde : row.pct >= 50 ? naranja : rojo;
    rect(xPct, y, pctW, rowH, bg, borde);
    text(row.totalP > 0 ? row.pct + "%" : "—", xPct + pctW / 2, y + rowH / 2, {
      color: pctColor,
      weight: "700",
      size: 11,
    });
  });

  // Fila Total
  const yT = y0 + filas.length * rowH;
  rect(0, yT, leftW, totalH, negro, "#ffffff");
  ctx.fillStyle = "#ffffff";
  ctx.font = "700 12px DM Sans, Arial, sans-serif";
  ctx.textAlign = "right";
  ctx.textBaseline = "middle";
  ctx.fillText("Total", leftW - 12, yT + totalH / 2);

  MESES_PROG.forEach((_, mi) => {
    const x = xStartMeses + mi * pairW;
    rect(x, yT, pairW / 2, totalH, azulTotal, "#ffffff");
    rect(x + pairW / 2, yT, pairW / 2, totalH, azulTotal, "#ffffff");
    text(colP[mi] || "", x + pairW / 4, yT + totalH / 2, { color: "#ffffff", weight: "700", size: 11 });
    text(colR[mi] || "", x + (pairW * 3) / 4, yT + totalH / 2, {
      color: "#ffffff",
      weight: "700",
      size: 11,
    });
  });

  rect(xTotal, yT, totalW, totalH, naranja, "#ffffff");
  rect(xTotal + totalW, yT, totalW, totalH, naranja, "#ffffff");
  text(totalP, xTotal + totalW / 2, yT + totalH / 2, { color: "#ffffff", weight: "700", size: 11 });
  text(totalR, xTotal + totalW * 1.5, yT + totalH / 2, { color: "#ffffff", weight: "700", size: 11 });

  const pctTotal = totalP > 0 ? Math.round((totalR / totalP) * 100) : 0;
  rect(xPct, yT, pctW, totalH, verde, "#ffffff");
  text(totalP > 0 ? pctTotal + "%" : "—", xPct + pctW / 2, yT + totalH / 2, {
    color: "#ffffff",
    weight: "700",
    size: 11,
  });

  // Leyenda
  const yL = yT + totalH + 13;
  rect(0, yT + totalH, width, legendH, "#ffffff", "#ffffff");

  function leyenda(xMuestra: number, colorMuestra: string, etiqueta: string) {
    rect(xMuestra, yL - 7, 14, 14, colorMuestra, "#7f8c8d");
    ctx!.fillStyle = "#2C3E50";
    ctx!.font = "600 12px DM Sans, Arial, sans-serif";
    ctx!.textAlign = "left";
    ctx!.textBaseline = "middle";
    ctx!.fillText(etiqueta, xMuestra + 20, yL);
  }
  leyenda(12, verdePlaneado, "P = Planeado");
  leyenda(142, naranjaReal, "R = Real ejecutado");

  const blob = await canvasToPngBlob(canvas);
  return { blob, width: canvas.width, height: canvas.height, filas: filas.length };
}

/**
 * 4. Genera Tablas con columnas de Meses (Capacitación y Simulacros)
 */
export async function generarTablaMesesCanvasBlob(
  colTitulo: string,
  filas: Array<{ label: string; mesIndex: number }>
): Promise<{ blob: Blob; width: number; height: number; filas: number } | null> {
  if (typeof document === "undefined") return null;

  const activas = (filas || []).filter((r) => String(r.label || "").trim() !== "");
  if (!activas.length) return null;

  const scale = 2;
  const leftW = 320;
  const monthW = 46;
  const width = leftW + monthW * 12;
  const headerH = 40;
  const rowH = 40;
  const height = headerH + rowH * activas.length;

  const canvas = document.createElement("canvas");
  canvas.width = width * scale;
  canvas.height = height * scale;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  ctx.scale(scale, scale);

  const azul = "#2E86C1";
  const grisFila = "#F4F6F7";
  const borde = "#D5D8DC";
  const texto = "#2C3E50";
  const verde = "#1e8449";

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = azul;
  ctx.fillRect(0, 0, width, headerH);
  ctx.fillStyle = "#ffffff";
  ctx.textBaseline = "middle";
  ctx.textAlign = "left";
  ctx.font = "700 13px DM Sans, Arial, sans-serif";
  ctx.fillText(colTitulo, 14, headerH / 2);

  ctx.textAlign = "center";
  ctx.font = "700 11px DM Sans, Arial, sans-serif";
  MESES_CORTO.forEach((m: string, i: number) => {
    ctx.fillText(m, leftW + i * monthW + monthW / 2, headerH / 2);
  });

  activas.forEach((row, ri) => {
    const y = headerH + ri * rowH;
    ctx.fillStyle = ri % 2 === 0 ? "#ffffff" : grisFila;
    ctx.fillRect(0, y, width, rowH);

    ctx.strokeStyle = borde;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, y + rowH);
    ctx.lineTo(width, y + rowH);
    ctx.stroke();

    ctx.fillStyle = texto;
    ctx.font = "400 12px DM Sans, Arial, sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";

    const lines = wrapTextForCanvas(ctx, row.label || "", leftW - 24).slice(0, 2);
    const lineHeight = 14;
    const startY = y + rowH / 2 - ((lines.length - 1) * lineHeight) / 2;
    lines.forEach((line, li) => ctx.fillText(line, 14, startY + li * lineHeight));

    ctx.textAlign = "center";
    ctx.font = "900 17px Arial, sans-serif";
    ctx.fillStyle = verde;
    if (row.mesIndex >= 0 && row.mesIndex < 12) {
      ctx.fillText("✓", leftW + row.mesIndex * monthW + monthW / 2, y + rowH / 2);
    }
  });

  ctx.strokeStyle = "#E5E8EB";
  ctx.lineWidth = 1;
  for (let i = 0; i <= 12; i++) {
    const x = leftW + i * monthW;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }

  const blob = await canvasToPngBlob(canvas);
  return { blob, width: canvas.width, height: canvas.height, filas: activas.length };
}
