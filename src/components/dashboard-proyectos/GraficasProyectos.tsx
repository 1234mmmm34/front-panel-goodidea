"use client";

import React, { useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  LabelList,
} from "recharts";
import {
  DashboardProyecto,
  DashboardProyectoAsesor,
  obtenerIniciales,
} from "@/types/dashboardProyectos";
import {
  ModalDetalleProyectos,
  DetalleBarraSeleccionada,
} from "./ModalDetalleProyectos";

interface GraficasProyectosProps {
  proyectos: DashboardProyecto[];
  asignaciones: DashboardProyectoAsesor[];
  iCveRubro: number;
  iCveInstructor: number;
  inicialesMap: Map<string, string>;
  cargando: boolean;
}

interface TooltipSimpleProps {
  active?: boolean;
  payload?: any[];
}

function capitalizarFrase(texto: string): string {
  if (!texto) return "";
  return texto.charAt(0).toUpperCase() + texto.slice(1).toLowerCase();
}

function textoProyectos(n: number): string {
  return `${n} ${n === 1 ? "proyecto" : "proyectos"}`;
}

const CustomBarTooltip: React.FC<TooltipSimpleProps> = ({
  active,
  payload,
}) => {
  if (!active || !payload || payload.length === 0) return null;
  const row = payload[0].payload;
  const titulo = row.tooltipTitle || row.label || "";
  const tieneValorMayorCero = payload.some(
    (entry) => Number(entry.value) > 0
  );

  return (
    <div
      style={{
        backgroundColor: "#ffffff",
        border: "1px solid #e2e8f0",
        borderRadius: "8px",
        boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
        fontSize: "12px",
        padding: "8px 10px",
        color: "#1e293b",
      }}
    >
      <div
        style={{
          fontWeight: 700,
          color: "#0f172a",
          marginBottom: "2px",
        }}
      >
        {titulo}
      </div>
      {payload.length === 1 && payload[0].dataKey === "i_Cantidad" ? (
        <div>Proyectos: {payload[0].value}</div>
      ) : (
        payload.map((entry, idx) => (
          <div
            key={`tip-item-${idx}`}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              marginTop: idx > 0 ? "2px" : 0,
            }}
          >
            <span
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "2px",
                backgroundColor: entry.color || entry.fill,
                display: "inline-block",
              }}
            />
            <span>
              {entry.name}: {entry.value}
            </span>
          </div>
        ))
      )}
      {tieneValorMayorCero && (
        <div
          style={{
            fontSize: "11px",
            color: "#94a3b8",
            marginTop: "4px",
          }}
        >
          Clic para ver el detalle
        </div>
      )}
    </div>
  );
};

const EmptyChartState: React.FC = () => (
  <div
    style={{
      height: "240px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      color: "#94a3b8",
      fontSize: "13px",
      backgroundColor: "#f8fafc",
      borderRadius: "8px",
      border: "1px dashed #cbd5e1",
      textAlign: "center",
      padding: "16px",
    }}
  >
    Sin proyectos para los filtros seleccionados
  </div>
);

function calcularTopYAxis(maxVal: number): number {
  const m = Math.max(maxVal, 1);
  return m <= 5 ? m + 1 : Math.ceil((m + 1) / 2) * 2;
}

function generarTicksEnteros(top: number): number[] {
  const step = top <= 6 ? 1 : 2;
  const ticks: number[] = [];
  for (let v = 0; v <= top; v += step) {
    ticks.push(v);
  }
  return ticks;
}

const cardStyle: React.CSSProperties = {
  backgroundColor: "#ffffff",
  borderRadius: "10px",
  padding: "20px",
  border: "1px solid #e2e8f0",
  boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
  display: "flex",
  flexDirection: "column",
};

const h3Style: React.CSSProperties = {
  fontSize: "15px",
  fontWeight: 700,
  color: "#0f172a",
  margin: 0,
};

const descStyle: React.CSSProperties = {
  fontSize: "12px",
  color: "#64748b",
  margin: "2px 0 14px 0",
};

const labelListStyle: React.CSSProperties = {
  fontSize: "12px",
  fontWeight: 600,
  fill: "#1e293b",
};

export const GraficasProyectos: React.FC<GraficasProyectosProps> = ({
  proyectos,
  asignaciones,
  iCveRubro,
  iCveInstructor,
  inicialesMap,
  cargando,
}) => {
  void iCveRubro;
  const [detalleModal, setDetalleModal] =
    useState<DetalleBarraSeleccionada | null>(null);

  const getEtiquetaAsesor = (nombre: string) =>
    inicialesMap.get(nombre) ?? obtenerIniciales(nombre);

  if (cargando) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <div
            className="skeleton-box"
            style={{ width: "160px", height: "16px" }}
          />
          <div
            className="skeleton-box sm"
            style={{ width: "300px", height: "12px" }}
          />
          <div className="proy-grid-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={`sk-g3-${i}`}
                style={{
                  ...cardStyle,
                  height: "330px",
                  gap: "14px",
                }}
              >
                <div
                  className="skeleton-box"
                  style={{ width: "180px", height: "18px" }}
                />
                <div
                  className="skeleton-box sm"
                  style={{ width: "240px", height: "12px" }}
                />
                <div
                  className="skeleton-box"
                  style={{
                    width: "100%",
                    height: "240px",
                    borderRadius: "8px",
                  }}
                />
              </div>
            ))}
          </div>
        </div>

        <div className="proy-grid-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <div
              key={`sk-g2-${i}`}
              style={{
                ...cardStyle,
                gridColumn: "1 / -1",
                height: "330px",
                gap: "14px",
              }}
            >
              <div
                className="skeleton-box"
                style={{ width: "220px", height: "18px" }}
              />
              <div
                className="skeleton-box sm"
                style={{ width: "260px", height: "12px" }}
              />
              <div
                className="skeleton-box"
                style={{ width: "100%", height: "240px", borderRadius: "8px" }}
              />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const sinDatos = proyectos.length === 0;

  const proyectoPorId = new Map<number, DashboardProyecto>(
    proyectos.map((p) => [p.i_CveServAgendaDet, p])
  );

  const asignacionesActivas =
    iCveInstructor !== 0
      ? asignaciones.filter((a) => a.i_CveInstructor === iCveInstructor)
      : asignaciones;

  const rubrosActivos: string[] = Array.from(
    new Set(proyectos.map((p) => p.v_Rubro).filter(Boolean))
  ).sort((a, b) => a.localeCompare(b, "es"));

  const asesoresActivos: string[] = Array.from(
    new Set(asignacionesActivas.map((a) => a.v_Asesor).filter(Boolean))
  ).sort((a, b) => a.localeCompare(b, "es"));

  const obtenerProyectosUnicos = (
    asigs: DashboardProyectoAsesor[]
  ): DashboardProyecto[] => {
    const ids = new Set<number>();
    const lista: DashboardProyecto[] = [];
    for (const a of asigs) {
      if (ids.has(a.i_CveServAgendaDet)) continue;
      const p = proyectoPorId.get(a.i_CveServAgendaDet);
      if (p) {
        ids.add(a.i_CveServAgendaDet);
        lista.push(p);
      }
    }
    return lista;
  };

  // 1. Proyectos por rubro
  const dataPorRubro = rubrosActivos.map((rubro) => ({
    label: rubro,
    tooltipTitle: rubro,
    i_Cantidad: proyectos.filter((p) => p.v_Rubro === rubro).length,
  }));
  const topRubro = calcularTopYAxis(
    Math.max(...dataPorRubro.map((d) => d.i_Cantidad), 0)
  );
  const ticksRubro = generarTicksEnteros(topRubro);

  // 2. Proyectos por asesor (sobre asignaciones)
  const dataPorAsesor = asesoresActivos.map((asesor) => ({
    label: asesor,
    tooltipTitle: asesor,
    i_Cantidad: asignacionesActivas.filter((a) => a.v_Asesor === asesor).length,
  }));
  const topAsesor = calcularTopYAxis(
    Math.max(...dataPorAsesor.map((d) => d.i_Cantidad), 0)
  );
  const ticksAsesor = generarTicksEnteros(topAsesor);

  // 3. Estatus por asesor (sobre asignaciones + proyectoPorId)
  const dataEstatusPorAsesor = asesoresActivos.map((asesor) => {
    const asigsAsesor = asignacionesActivas.filter(
      (a) => a.v_Asesor === asesor
    );
    let i_EnProceso = 0;
    let i_Terminado = 0;
    for (const a of asigsAsesor) {
      const p = proyectoPorId.get(a.i_CveServAgendaDet);
      if (!p) continue;
      if (p.b_Terminado) i_Terminado++;
      else i_EnProceso++;
    }
    return {
      label: asesor,
      tooltipTitle: asesor,
      i_EnProceso,
      i_Terminado,
    };
  });
  const topEstatus = calcularTopYAxis(
    Math.max(
      ...dataEstatusPorAsesor.flatMap((d) => [d.i_EnProceso, d.i_Terminado]),
      0
    )
  );
  const ticksEstatus = generarTicksEnteros(topEstatus);

  // 4. Proyectos por rubro y asesor (solo combinaciones que tienen asignaciones)
  const dataRubroAsesor: {
    key: string;
    label: string;
    v_Rubro: string;
    tooltipTitle: string;
    i_Cantidad: number;
  }[] = [];
  const gruposSuperRubro: { label: string; n: number }[] = [];

  rubrosActivos.forEach((rubro) => {
    const asesoresConProy = asesoresActivos.filter((asesor) =>
      asignacionesActivas.some((a) => {
        if (a.v_Asesor !== asesor) return false;
        const p = proyectoPorId.get(a.i_CveServAgendaDet);
        return p?.v_Rubro === rubro;
      })
    );
    if (asesoresConProy.length === 0) return;

    asesoresConProy.forEach((asesor) => {
      const cant = asignacionesActivas.filter((a) => {
        if (a.v_Asesor !== asesor) return false;
        const p = proyectoPorId.get(a.i_CveServAgendaDet);
        return p?.v_Rubro === rubro;
      }).length;
      dataRubroAsesor.push({
        key: `${rubro}__${asesor}`,
        label: asesor,
        v_Rubro: rubro,
        tooltipTitle: `${asesor} · ${rubro}`,
        i_Cantidad: cant,
      });
    });

    gruposSuperRubro.push({
      label: rubro,
      n: asesoresConProy.length,
    });
  });

  const topRubroAsesor = calcularTopYAxis(
    Math.max(...dataRubroAsesor.map((d) => d.i_Cantidad), 0)
  );
  const ticksRubroAsesor = generarTicksEnteros(topRubroAsesor);

  // 5. Proyectos con más de 30 días por asesor
  const proyectosMas30 = proyectos.filter((p) => p.b_MasDe30Dias);
  const dataMas30PorAsesor = asesoresActivos.map((asesor) => ({
    label: asesor,
    tooltipTitle: asesor,
    i_Cantidad: asignacionesActivas.filter((a) => {
      if (a.v_Asesor !== asesor) return false;
      const p = proyectoPorId.get(a.i_CveServAgendaDet);
      return Boolean(p?.b_MasDe30Dias);
    }).length,
  }));
  const topMas30 = calcularTopYAxis(
    Math.max(...dataMas30PorAsesor.map((d) => d.i_Cantidad), 0)
  );
  const ticksMas30 = generarTicksEnteros(topMas30);

  const inclinarRubro = dataPorRubro.length >= 3;

  // Handlers de clic en barras
  const handleClicRubro = (data: any) => {
    const payload = data?.payload ?? data;
    const rubro = payload?.label as string | undefined;
    if (!rubro) return;
    const lista = proyectos.filter((p) => p.v_Rubro === rubro);
    if (lista.length === 0) return;
    setDetalleModal({
      subtitulo: `${capitalizarFrase(rubro)} · ${textoProyectos(lista.length)}`,
      proyectos: lista,
      ocultarAsesor: false,
      ocultarRubro: true,
    });
  };

  const handleClicAsesor = (data: any) => {
    const payload = data?.payload ?? data;
    const asesor = payload?.label as string | undefined;
    if (!asesor) return;
    const lista = obtenerProyectosUnicos(
      asignacionesActivas.filter((a) => a.v_Asesor === asesor)
    );
    if (lista.length === 0) return;
    setDetalleModal({
      subtitulo: `${getEtiquetaAsesor(asesor)} · ${textoProyectos(
        lista.length
      )}`,
      proyectos: lista,
      ocultarAsesor: true,
      ocultarRubro: false,
    });
  };

  const handleClicEstatusAsesor = (
    data: any,
    estatus: "En proceso" | "Terminado"
  ) => {
    const payload = data?.payload ?? data;
    const asesor = payload?.label as string | undefined;
    if (!asesor) return;
    const quiereTerminado = estatus === "Terminado";
    const lista = obtenerProyectosUnicos(
      asignacionesActivas.filter((a) => {
        if (a.v_Asesor !== asesor) return false;
        const p = proyectoPorId.get(a.i_CveServAgendaDet);
        return Boolean(p) && p!.b_Terminado === quiereTerminado;
      })
    );
    if (lista.length === 0) return;
    setDetalleModal({
      subtitulo: `${getEtiquetaAsesor(asesor)} · ${estatus} · ${textoProyectos(
        lista.length
      )}`,
      proyectos: lista,
      ocultarAsesor: true,
      ocultarRubro: false,
    });
  };

  const handleClicRubroAsesor = (data: any) => {
    const payload = data?.payload ?? data;
    const asesor = payload?.label as string | undefined;
    const rubro = payload?.v_Rubro as string | undefined;
    if (!asesor || !rubro) return;
    const lista = obtenerProyectosUnicos(
      asignacionesActivas.filter((a) => {
        if (a.v_Asesor !== asesor) return false;
        const p = proyectoPorId.get(a.i_CveServAgendaDet);
        return p?.v_Rubro === rubro;
      })
    );
    if (lista.length === 0) return;
    setDetalleModal({
      subtitulo: `${getEtiquetaAsesor(asesor)} · ${capitalizarFrase(
        rubro
      )} · ${textoProyectos(lista.length)}`,
      proyectos: lista,
      ocultarAsesor: true,
      ocultarRubro: true,
    });
  };

  const handleClicMas30Asesor = (data: any) => {
    const payload = data?.payload ?? data;
    const asesor = payload?.label as string | undefined;
    if (!asesor) return;
    const lista = obtenerProyectosUnicos(
      asignacionesActivas.filter((a) => {
        if (a.v_Asesor !== asesor) return false;
        const p = proyectoPorId.get(a.i_CveServAgendaDet);
        return Boolean(p?.b_MasDe30Dias);
      })
    );
    if (lista.length === 0) return;
    setDetalleModal({
      subtitulo: `${getEtiquetaAsesor(
        asesor
      )} · En proceso con más de 30 días · ${textoProyectos(lista.length)}`,
      proyectos: lista,
      ocultarAsesor: true,
      ocultarRubro: false,
    });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <style>{`
        .proy-grid-3 {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 16px;
        }
        .proy-grid-2 {
          display: grid;
          grid-template-columns: 1.5fr 1fr;
          gap: 16px;
        }
        .proy-chart-wrap .recharts-bar-rectangle path {
          cursor: pointer;
          transition: opacity 0.15s ease;
        }
        .proy-chart-wrap .recharts-bar-rectangle path:hover {
          opacity: 0.85;
        }
        @media (max-width: 1100px) {
          .proy-grid-3 {
            grid-template-columns: 1fr;
          }
          .proy-grid-2 {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      {/* Sección DISTRIBUCIÓN */}
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
          <h2
            style={{
              fontSize: "13px",
              fontWeight: 700,
              color: "#0f172a",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              margin: 0,
            }}
          >
            DISTRIBUCIÓN
          </h2>
          <span style={{ fontSize: "12px", color: "#64748b" }}>
            Cómo se reparten los proyectos por rubro y por asesor.
          </span>
        </div>

        {/* Fila 1: 3 gráficas */}
        <div className="proy-grid-3">
          {/* Card 1: Proyectos por rubro */}
          <div style={cardStyle}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                gap: "12px",
                marginBottom: "4px",
              }}
            >
              <h3 style={h3Style}>Proyectos por rubro</h3>
            </div>
            <p style={descStyle}>Cantidad total de proyectos de cada rubro.</p>

            {sinDatos ? (
              <EmptyChartState />
            ) : (
              <div
                className="proy-chart-wrap"
                style={{ width: "100%", height: 240 }}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={dataPorRubro}
                    margin={{ top: 20, right: 8, left: -16, bottom: 10 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="#f1f5f9"
                    />
                    <XAxis
                      dataKey="label"
                      interval={0}
                      tickFormatter={(v) => String(v).toUpperCase()}
                      tick={{ fontSize: 11, fill: "#64748b" }}
                      axisLine={{ stroke: "#cbd5e1" }}
                      tickLine={false}
                      angle={inclinarRubro ? -35 : 0}
                      textAnchor={inclinarRubro ? "end" : "middle"}
                      height={inclinarRubro ? 70 : 30}
                    />
                    <YAxis
                      domain={[0, topRubro]}
                      ticks={ticksRubro}
                      allowDecimals={false}
                      tick={{ fontSize: 11, fill: "#64748b" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      content={<CustomBarTooltip />}
                      cursor={{ fill: "rgba(241, 245, 249, 0.6)" }}
                    />
                    <Bar
                      dataKey="i_Cantidad"
                      name="Proyectos"
                      fill="#2B8FCC"
                      radius={[4, 4, 0, 0]}
                      maxBarSize={38}
                      onClick={(data) => handleClicRubro(data)}
                    >
                      <LabelList
                        dataKey="i_Cantidad"
                        position="top"
                        offset={6}
                        style={labelListStyle}
                      />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Card 2: Proyectos por asesor */}
          <div style={cardStyle}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                gap: "12px",
                marginBottom: "4px",
              }}
            >
              <h3 style={h3Style}>Proyectos por asesor</h3>
            </div>
            <p style={descStyle}>
              Cantidad total de proyectos asignados a cada asesor.
            </p>

            {sinDatos ? (
              <EmptyChartState />
            ) : (
              <div
                className="proy-chart-wrap"
                style={{ width: "100%", height: 240 }}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={dataPorAsesor}
                    margin={{ top: 20, right: 8, left: -16, bottom: 10 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="#f1f5f9"
                    />
                    <XAxis
                      dataKey="label"
                      interval={0}
                      tickFormatter={(v) => getEtiquetaAsesor(String(v))}
                      tick={{ fontSize: 11, fill: "#64748b" }}
                      axisLine={{ stroke: "#cbd5e1" }}
                      tickLine={false}
                      angle={0}
                      textAnchor="middle"
                      height={30}
                    />
                    <YAxis
                      domain={[0, topAsesor]}
                      ticks={ticksAsesor}
                      allowDecimals={false}
                      tick={{ fontSize: 11, fill: "#64748b" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      content={<CustomBarTooltip />}
                      cursor={{ fill: "rgba(241, 245, 249, 0.6)" }}
                    />
                    <Bar
                      dataKey="i_Cantidad"
                      name="Proyectos"
                      fill="#1e3a5f"
                      radius={[4, 4, 0, 0]}
                      maxBarSize={38}
                      onClick={(data) => handleClicAsesor(data)}
                    >
                      <LabelList
                        dataKey="i_Cantidad"
                        position="top"
                        offset={6}
                        style={labelListStyle}
                      />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Card 3: Proyectos con más de 30 días por asesor */}
          <div style={cardStyle}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                gap: "12px",
                marginBottom: "4px",
              }}
            >
              <h3 style={h3Style}>Proyectos con más de 30 días por asesor</h3>
              <span
                style={{
                  fontSize: "22px",
                  fontWeight: 700,
                  letterSpacing: "-0.5px",
                  color: "#dc2626",
                  lineHeight: 1,
                }}
              >
                {proyectosMas30.length}
              </span>
            </div>
            <p style={descStyle}>
              Proyectos en proceso que llevan más de 30 días desde su inicio.
            </p>

            {sinDatos ? (
              <EmptyChartState />
            ) : (
              <div
                className="proy-chart-wrap"
                style={{ width: "100%", height: 240 }}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={dataMas30PorAsesor}
                    margin={{ top: 20, right: 8, left: -16, bottom: 10 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="#f1f5f9"
                    />
                    <XAxis
                      dataKey="label"
                      interval={0}
                      tickFormatter={(v) => getEtiquetaAsesor(String(v))}
                      tick={{ fontSize: 11, fill: "#64748b" }}
                      axisLine={{ stroke: "#cbd5e1" }}
                      tickLine={false}
                      angle={0}
                      textAnchor="middle"
                      height={30}
                    />
                    <YAxis
                      domain={[0, topMas30]}
                      ticks={ticksMas30}
                      allowDecimals={false}
                      tick={{ fontSize: 11, fill: "#64748b" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      content={<CustomBarTooltip />}
                      cursor={{ fill: "rgba(241, 245, 249, 0.6)" }}
                    />
                    <Bar
                      dataKey="i_Cantidad"
                      name="Proyectos"
                      fill="#e35d3a"
                      radius={[4, 4, 0, 0]}
                      maxBarSize={38}
                      onClick={(data) => handleClicMas30Asesor(data)}
                    >
                      <LabelList
                        dataKey="i_Cantidad"
                        position="top"
                        offset={6}
                        style={labelListStyle}
                      />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Segunda fila: 1.5fr 1fr */}
      <div className="proy-grid-2">
        {/* Card 4: Proyectos por rubro y asesor */}
        <div style={{ ...cardStyle, gridColumn: "1 / -1" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              gap: "12px",
              marginBottom: "4px",
            }}
          >
            <h3 style={h3Style}>Proyectos por rubro y asesor</h3>
          </div>
          <p style={descStyle}>
            Proyectos de cada asesor agrupados por rubro.
          </p>

          {sinDatos || dataRubroAsesor.length === 0 ? (
            <EmptyChartState />
          ) : (
            <div>
              <div
                className="proy-chart-wrap"
                style={{ width: "100%", height: 240 }}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={dataRubroAsesor}
                    margin={{ top: 20, right: 8, left: 0, bottom: 10 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="#f1f5f9"
                    />
                    <XAxis
                      dataKey="key"
                      interval={0}
                      tickFormatter={(val) => {
                        const parts = String(val).split("__");
                        return getEtiquetaAsesor(parts[1] || String(val));
                      }}
                      tick={{ fontSize: 11, fill: "#64748b" }}
                      axisLine={{ stroke: "#cbd5e1" }}
                      tickLine={false}
                      angle={0}
                      textAnchor="middle"
                      height={30}
                    />
                    <YAxis
                      width={28}
                      domain={[0, topRubroAsesor]}
                      ticks={ticksRubroAsesor}
                      allowDecimals={false}
                      tick={{ fontSize: 11, fill: "#64748b" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      content={<CustomBarTooltip />}
                      cursor={{ fill: "rgba(241, 245, 249, 0.6)" }}
                    />
                    <Bar
                      dataKey="i_Cantidad"
                      name="Proyectos"
                      fill="#2B8FCC"
                      radius={[4, 4, 0, 0]}
                      maxBarSize={38}
                      onClick={(data) => handleClicRubroAsesor(data)}
                    >
                      <LabelList
                        dataKey="i_Cantidad"
                        position="top"
                        offset={6}
                        style={labelListStyle}
                      />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Segundo renglón de etiquetas: Rubros agrupadores */}
              <div
                style={{
                  display: "flex",
                  marginLeft: "28px",
                  marginRight: "8px",
                  borderTop: "1px solid #e2e8f0",
                  marginTop: "4px",
                }}
              >
                {gruposSuperRubro.map((grupo, idx) => (
                  <span
                    key={`sup-rubro-${grupo.label}`}
                    style={{
                      flex: grupo.n,
                      textAlign: "center",
                      fontSize: "11px",
                      fontWeight: 600,
                      color: "#1e293b",
                      paddingTop: "6px",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                      borderLeft: idx === 0 ? "none" : "1px solid #e2e8f0",
                    }}
                  >
                    {grupo.label}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Card 5: Estatus por asesor (a todo el ancho) */}
        <div style={{ ...cardStyle, gridColumn: "1 / -1" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              gap: "12px",
              marginBottom: "4px",
            }}
          >
            <h3 style={h3Style}>Estatus por asesor</h3>
          </div>
          <p style={descStyle}>
            Proyectos en proceso y terminados de cada asesor.
          </p>

          {sinDatos ? (
            <EmptyChartState />
          ) : (
            <>
              <div
                className="proy-chart-wrap"
                style={{ width: "100%", height: 240 }}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={dataEstatusPorAsesor}
                    margin={{ top: 20, right: 8, left: -16, bottom: 10 }}
                    barGap={6}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="#f1f5f9"
                    />
                    <XAxis
                      dataKey="label"
                      interval={0}
                      tickFormatter={(v) => getEtiquetaAsesor(String(v))}
                      tick={{ fontSize: 11, fill: "#64748b" }}
                      axisLine={{ stroke: "#cbd5e1" }}
                      tickLine={false}
                      angle={0}
                      textAnchor="middle"
                      height={30}
                    />
                    <YAxis
                      domain={[0, topEstatus]}
                      ticks={ticksEstatus}
                      allowDecimals={false}
                      tick={{ fontSize: 11, fill: "#64748b" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      content={<CustomBarTooltip />}
                      cursor={{ fill: "rgba(241, 245, 249, 0.6)" }}
                    />
                    <Bar
                      dataKey="i_EnProceso"
                      name="En proceso"
                      fill="#f08c3a"
                      radius={[4, 4, 0, 0]}
                      maxBarSize={38}
                      onClick={(data) =>
                        handleClicEstatusAsesor(data, "En proceso")
                      }
                    >
                      <LabelList
                        dataKey="i_EnProceso"
                        position="top"
                        offset={6}
                        style={labelListStyle}
                      />
                    </Bar>
                    <Bar
                      dataKey="i_Terminado"
                      name="Terminado"
                      fill="#2B8FCC"
                      radius={[4, 4, 0, 0]}
                      maxBarSize={38}
                      onClick={(data) =>
                        handleClicEstatusAsesor(data, "Terminado")
                      }
                    >
                      <LabelList
                        dataKey="i_Terminado"
                        position="top"
                        offset={6}
                        style={labelListStyle}
                      />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Leyenda abajo */}
              <div
                style={{
                  display: "flex",
                  gap: "16px",
                  justifyContent: "center",
                  fontSize: "12px",
                  color: "#64748b",
                  marginTop: "12px",
                }}
              >
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <i
                    style={{
                      width: "10px",
                      height: "10px",
                      borderRadius: "2px",
                      backgroundColor: "#f08c3a",
                      display: "inline-block",
                    }}
                  />
                  En proceso
                </span>
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <i
                    style={{
                      width: "10px",
                      height: "10px",
                      borderRadius: "2px",
                      backgroundColor: "#2B8FCC",
                      display: "inline-block",
                    }}
                  />
                  Terminado
                </span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Modal de Detalle de Proyectos al hacer clic en una barra */}
      <ModalDetalleProyectos
        detalle={detalleModal}
        inicialesMap={inicialesMap}
        onCerrar={() => setDetalleModal(null)}
      />
    </div>
  );
};
