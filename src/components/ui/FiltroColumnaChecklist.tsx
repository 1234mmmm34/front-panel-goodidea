"use client";

import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ListFilter, ArrowDownAZ, ArrowUpZA, Search } from "lucide-react";

export interface OpcionFiltro {
  valor: number;
  etiqueta: string;
}

export interface FiltroColumnaChecklistProps {
  titulo: string;
  cargarOpciones: () => Promise<OpcionFiltro[]>;
  seleccionados: number[] | null; // null = todos
  orden: "ASC" | "DESC" | null;
  onAplicar: (
    seleccionados: number[] | null,
    orden: "ASC" | "DESC" | null
  ) => void;
}

export const FiltroColumnaChecklist: React.FC<FiltroColumnaChecklistProps> = ({
  titulo,
  cargarOpciones,
  seleccionados,
  orden,
  onAplicar,
}) => {
  const [abierto, setAbierto] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [opciones, setOpciones] = useState<OpcionFiltro[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [draftSet, setDraftSet] = useState<Set<number>>(new Set());
  const [draftOrden, setDraftOrden] = useState<"ASC" | "DESC" | null>(orden);
  const [pos, setPos] = useState<{ top: number; left: number }>({
    top: 0,
    left: 0,
  });

  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const popoverRef = useRef<HTMLDivElement | null>(null);
  const selectAllRef = useRef<HTMLInputElement | null>(null);

  const activo = seleccionados !== null || orden !== null;

  const opcionesVisibles = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return opciones;
    return opciones.filter((o) => o.etiqueta.toLowerCase().includes(q));
  }, [opciones, busqueda]);

  const marcadasVisibles = useMemo(
    () => opcionesVisibles.filter((o) => draftSet.has(o.valor)).length,
    [opcionesVisibles, draftSet]
  );

  const todasVisiblesMarcadas =
    opcionesVisibles.length > 0 && marcadasVisibles === opcionesVisibles.length;
  const algunasVisiblesMarcadas =
    marcadasVisibles > 0 && marcadasVisibles < opcionesVisibles.length;

  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = algunasVisiblesMarcadas;
    }
  }, [algunasVisiblesMarcadas, abierto]);

  const recalcularPosicion = useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;

    const rect = trigger.getBoundingClientRect();
    if (
      rect.bottom < 0 ||
      rect.top > window.innerHeight ||
      rect.right < 0 ||
      rect.left > window.innerWidth
    ) {
      setAbierto(false);
      return;
    }

    const left = Math.max(8, Math.min(rect.left, window.innerWidth - 260 - 8));
    const popHeight = popoverRef.current?.offsetHeight || 360;
    const espacioAbajo = window.innerHeight - rect.bottom;

    const top =
      espacioAbajo < popHeight + 6 && rect.top > espacioAbajo
        ? Math.max(12, rect.top - popHeight - 6)
        : rect.bottom + 6;

    setPos({ top, left });
  }, []);

  useLayoutEffect(() => {
    if (!abierto) return;
    recalcularPosicion();
  }, [abierto, cargando, opciones.length, busqueda, recalcularPosicion]);

  useEffect(() => {
    if (!abierto) return;

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        popoverRef.current?.contains(target) ||
        triggerRef.current?.contains(target)
      ) {
        return;
      }
      setAbierto(false);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setAbierto(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("scroll", recalcularPosicion, true);
    window.addEventListener("resize", recalcularPosicion);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("scroll", recalcularPosicion, true);
      window.removeEventListener("resize", recalcularPosicion);
    };
  }, [abierto, recalcularPosicion]);

  const handleToggleAbrir = async () => {
    if (abierto) {
      setAbierto(false);
      return;
    }

    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const left = Math.max(8, Math.min(rect.left, window.innerWidth - 272));
      setPos({ top: rect.bottom + 6, left });
    }

    setBusqueda("");
    setDraftOrden(orden);
    setAbierto(true);
    setCargando(true);

    try {
      const lista = await cargarOpciones();
      setOpciones(lista);
      if (seleccionados === null) {
        setDraftSet(new Set(lista.map((o) => o.valor)));
      } else {
        const permitidos = new Set(lista.map((o) => o.valor));
        setDraftSet(
          new Set(seleccionados.filter((v) => permitidos.has(v)))
        );
      }
    } finally {
      setCargando(false);
    }
  };

  const handleToggleTodosVisibles = () => {
    setDraftSet((prev) => {
      const next = new Set(prev);
      if (todasVisiblesMarcadas) {
        for (const o of opcionesVisibles) next.delete(o.valor);
      } else {
        for (const o of opcionesVisibles) next.add(o.valor);
      }
      return next;
    });
  };

  const handleToggleItem = (valor: number) => {
    setDraftSet((prev) => {
      const next = new Set(prev);
      if (next.has(valor)) next.delete(valor);
      else next.add(valor);
      return next;
    });
  };

  const handleLimpiar = () => {
    setDraftOrden(null);
    setDraftSet(new Set(opciones.map((o) => o.valor)));
    onAplicar(null, null);
    setAbierto(false);
  };

  const handleAplicar = () => {
    let nuevaSeleccion: number[] | null;
    if (
      opciones.length > 0 &&
      opciones.every((o) => draftSet.has(o.valor))
    ) {
      nuevaSeleccion = null;
    } else if (draftSet.size === 0) {
      nuevaSeleccion = [];
    } else {
      nuevaSeleccion = Array.from(draftSet);
    }
    onAplicar(nuevaSeleccion, draftOrden);
    setAbierto(false);
  };

  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        position: "relative",
      }}
    >
      <span>{titulo}</span>
      <button
        ref={triggerRef}
        type="button"
        onClick={handleToggleAbrir}
        title={`Filtrar y ordenar ${titulo}`}
        aria-label={`Filtrar y ordenar ${titulo}`}
        style={{
          position: "relative",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: "22px",
          height: "22px",
          padding: 0,
          border: "none",
          borderRadius: "4px",
          background: abierto ? "#e0f2fe" : "transparent",
          color: activo ? "#2B8FCC" : "#64748b",
          cursor: "pointer",
        }}
      >
        <ListFilter size={14} />
        {activo && (
          <span
            style={{
              position: "absolute",
              top: "2px",
              right: "2px",
              width: "6px",
              height: "6px",
              borderRadius: "50%",
              backgroundColor: "#2B8FCC",
            }}
          />
        )}
      </button>

      {abierto &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={popoverRef}
            onClick={(e) => e.stopPropagation()}
            style={{
              position: "fixed",
              top: `${pos.top}px`,
              left: `${pos.left}px`,
              width: "260px",
              maxHeight: "min(480px, calc(100vh - 24px))",
              display: "flex",
              flexDirection: "column",
              backgroundColor: "#ffffff",
              borderRadius: "12px",
              border: "1px solid #e2e8f0",
              boxShadow:
                "0 10px 25px -5px rgba(15, 23, 42, 0.16), 0 4px 10px -2px rgba(15, 23, 42, 0.08)",
              zIndex: 1050,
              padding: "10px",
              fontFamily: "Roboto, sans-serif",
              textTransform: "none",
              letterSpacing: "normal",
              fontWeight: 400,
              color: "#1e293b",
            }}
          >
            {/* Parte superior fija: Ordenar, Buscar, Seleccionar todo */}
            <div style={{ flexShrink: 0 }}>
              {/* 1. Ordenar A -> Z / Z -> A */}
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <button
                  type="button"
                  onClick={() =>
                    setDraftOrden((prev) => (prev === "ASC" ? null : "ASC"))
                  }
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "7px 10px",
                    borderRadius: "7px",
                    border:
                      draftOrden === "ASC"
                        ? "1px solid #2B8FCC"
                        : "1px solid transparent",
                    backgroundColor:
                      draftOrden === "ASC" ? "#eef6fd" : "transparent",
                    color: draftOrden === "ASC" ? "#1d4ed8" : "#334155",
                    fontSize: "12.5px",
                    fontWeight: draftOrden === "ASC" ? 600 : 500,
                    cursor: "pointer",
                    textAlign: "left",
                  }}
                >
                  <ArrowDownAZ size={15} />
                  <span>Ordenar A → Z</span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setDraftOrden((prev) => (prev === "DESC" ? null : "DESC"))
                  }
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "7px 10px",
                    borderRadius: "7px",
                    border:
                      draftOrden === "DESC"
                        ? "1px solid #2B8FCC"
                        : "1px solid transparent",
                    backgroundColor:
                      draftOrden === "DESC" ? "#eef6fd" : "transparent",
                    color: draftOrden === "DESC" ? "#1d4ed8" : "#334155",
                    fontSize: "12.5px",
                    fontWeight: draftOrden === "DESC" ? 600 : 500,
                    cursor: "pointer",
                    textAlign: "left",
                  }}
                >
                  <ArrowUpZA size={15} />
                  <span>Ordenar Z → A</span>
                </button>
              </div>

              <div
                style={{
                  height: "1px",
                  backgroundColor: "#f1f5f9",
                  margin: "8px 0",
                }}
              />

              {/* 2. Buscar */}
              <div style={{ position: "relative", marginBottom: "8px" }}>
                <Search
                  size={13}
                  style={{
                    position: "absolute",
                    left: "9px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "#94a3b8",
                    pointerEvents: "none",
                  }}
                />
                <input
                  type="text"
                  placeholder="Buscar…"
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  style={{
                    width: "100%",
                    height: "30px",
                    paddingLeft: "28px",
                    paddingRight: "8px",
                    fontSize: "12.5px",
                    border: "1px solid #cbd5e1",
                    borderRadius: "6px",
                    outline: "none",
                    color: "#1e293b",
                    backgroundColor: "#ffffff",
                  }}
                />
              </div>

              {/* 3. Seleccionar todo */}
              {!cargando && opciones.length > 0 && (
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "5px 6px",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontSize: "12.5px",
                    fontWeight: 600,
                    color: "#0f172a",
                    borderBottom: "1px solid #f1f5f9",
                    marginBottom: "4px",
                  }}
                >
                  <input
                    ref={selectAllRef}
                    type="checkbox"
                    checked={todasVisiblesMarcadas}
                    onChange={handleToggleTodosVisibles}
                    style={{ accentColor: "#2B8FCC", cursor: "pointer" }}
                  />
                  <span>Seleccionar todo</span>
                </label>
              )}
            </div>

            {/* 4. Lista de casillas (única parte con scroll) */}
            <div
              style={{
                flex: 1,
                minHeight: 0,
                overflowY: "auto",
                display: "flex",
                flexDirection: "column",
                gap: "2px",
              }}
            >
              {cargando ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={`sk-chk-${i}`}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      padding: "6px",
                    }}
                  >
                    <div
                      className="skeleton-box"
                      style={{
                        width: "14px",
                        height: "14px",
                        borderRadius: "3px",
                      }}
                    />
                    <div
                      className="skeleton-box sm"
                      style={{
                        width: `${65 + (i % 3) * 10}%`,
                        height: "12px",
                      }}
                    />
                  </div>
                ))
              ) : opciones.length === 0 ? (
                <div
                  style={{
                    padding: "14px 8px",
                    textAlign: "center",
                    fontSize: "12px",
                    color: "#94a3b8",
                  }}
                >
                  Sin empresas
                </div>
              ) : opcionesVisibles.length === 0 ? (
                <div
                  style={{
                    padding: "14px 8px",
                    textAlign: "center",
                    fontSize: "12px",
                    color: "#94a3b8",
                  }}
                >
                  Sin coincidencias
                </div>
              ) : (
                opcionesVisibles.map((op) => (
                  <label
                    key={op.valor}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      padding: "5px 6px",
                      borderRadius: "6px",
                      cursor: "pointer",
                      fontSize: "12.5px",
                      color: "#334155",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={draftSet.has(op.valor)}
                      onChange={() => handleToggleItem(op.valor)}
                      style={{
                        accentColor: "#2B8FCC",
                        cursor: "pointer",
                        flexShrink: 0,
                      }}
                    />
                    <span
                      style={{
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                      title={op.etiqueta}
                    >
                      {op.etiqueta}
                    </span>
                  </label>
                ))
              )}
            </div>

            {/* 5. Pie fijo abajo */}
            <div
              style={{
                flexShrink: 0,
                backgroundColor: "#ffffff",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                borderTop: "1px solid #f1f5f9",
                marginTop: "8px",
                paddingTop: "8px",
              }}
            >
              <button
                type="button"
                onClick={handleLimpiar}
                style={{
                  border: "none",
                  background: "transparent",
                  color: "#64748b",
                  fontSize: "12.5px",
                  fontWeight: 500,
                  cursor: "pointer",
                  padding: "4px 6px",
                }}
              >
                Limpiar
              </button>
              <button
                type="button"
                onClick={handleAplicar}
                disabled={cargando}
                style={{
                  border: "none",
                  backgroundColor: "#2B8FCC",
                  color: "#ffffff",
                  fontSize: "12.5px",
                  fontWeight: 600,
                  borderRadius: "6px",
                  padding: "6px 14px",
                  cursor: cargando ? "wait" : "pointer",
                }}
              >
                Aplicar
              </button>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};

