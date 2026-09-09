"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  isSameMonth,
  isSameDay,
  isWithinInterval,
  parseISO,
  isValid,
  startOfDay,
  endOfDay,
  subDays,
  startOfQuarter,
  endOfQuarter,
  subQuarters,
  startOfYear,
  endOfYear,
  subYears,
  subWeeks,
} from "date-fns";
import { es } from "date-fns/locale";
import { Calendar, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { formatearFechaTexto } from "@/lib/date-utils";

interface DateRangePickerPopoverProps {
  fechaInicio: string; // YYYY-MM-DD
  fechaFin: string; // YYYY-MM-DD
  onChangeRange: (inicio: string, fin: string) => void;
  className?: string;
  style?: React.CSSProperties;
}

export const DateRangePickerPopover: React.FC<DateRangePickerPopoverProps> = ({
  fechaInicio,
  fechaFin,
  onChangeRange,
  className,
  style,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Parse initial dates or fallback to today
  const initStart = fechaInicio ? parseISO(fechaInicio) : new Date();
  const initEnd = fechaFin ? parseISO(fechaFin) : new Date();

  const [tempStart, setTempStart] = useState<Date>(isValid(initStart) ? initStart : new Date());
  const [tempEnd, setTempEnd] = useState<Date>(isValid(initEnd) ? initEnd : new Date());

  // Base month for dual display (left month)
  const [currentMonthLeft, setCurrentMonthLeft] = useState<Date>(
    isValid(initStart) ? startOfMonth(initStart) : startOfMonth(new Date())
  );

  const currentMonthRight = addMonths(currentMonthLeft, 1);

  // Sync state when props change or popover opens
  useEffect(() => {
    if (isOpen) {
      const s = fechaInicio ? parseISO(fechaInicio) : new Date();
      const e = fechaFin ? parseISO(fechaFin) : new Date();
      setTempStart(isValid(s) ? s : new Date());
      setTempEnd(isValid(e) ? e : new Date());
      if (isValid(s)) {
        setCurrentMonthLeft(startOfMonth(s));
      }
    }
  }, [isOpen, fechaInicio, fechaFin]);

  // Click outside listener to close
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Handle day click for range selection
  const handleDayClick = (day: Date) => {
    if (!tempStart || (tempStart && tempEnd)) {
      // First click: set start, clear end
      setTempStart(day);
      setTempEnd(null as unknown as Date);
    } else {
      // Second click: set end
      if (day < tempStart) {
        setTempEnd(tempStart);
        setTempStart(day);
      } else {
        setTempEnd(day);
      }
    }
  };

  // Handle preset clicks
  const applyPreset = (presetKey: string) => {
    const today = new Date();
    let start: Date;
    let end: Date;

    switch (presetKey) {
      case "hoy":
        start = startOfDay(today);
        end = endOfDay(today);
        break;
      case "ayer":
        const ayer = subDays(today, 1);
        start = startOfDay(ayer);
        end = endOfDay(ayer);
        break;
      case "estaSemana":
        start = startOfWeek(today, { weekStartsOn: 1 });
        end = endOfWeek(today, { weekStartsOn: 1 });
        break;
      case "semanaAnterior":
        const prevWeekDate = subWeeks(today, 1);
        start = startOfWeek(prevWeekDate, { weekStartsOn: 1 });
        end = endOfWeek(prevWeekDate, { weekStartsOn: 1 });
        break;
      case "esteMes":
        start = startOfMonth(today);
        end = endOfMonth(today);
        break;
      case "mesAnterior":
        const prevMonthDate = subMonths(today, 1);
        start = startOfMonth(prevMonthDate);
        end = endOfMonth(prevMonthDate);
        break;
      case "esteTrimestre":
        start = startOfQuarter(today);
        end = endOfQuarter(today);
        break;
      case "trimestreAnterior":
        const prevQuarterDate = subQuarters(today, 1);
        start = startOfQuarter(prevQuarterDate);
        end = endOfQuarter(prevQuarterDate);
        break;
      case "esteAno":
        start = startOfYear(today);
        end = endOfYear(today);
        break;
      case "anoAnterior":
        const prevYearDate = subYears(today, 1);
        start = startOfYear(prevYearDate);
        end = endOfYear(prevYearDate);
        break;
      default:
        return;
    }

    setTempStart(start);
    setTempEnd(end);
    setCurrentMonthLeft(startOfMonth(start));
  };

  const handleApply = () => {
    if (tempStart && tempEnd) {
      onChangeRange(format(tempStart, "yyyy-MM-dd"), format(tempEnd, "yyyy-MM-dd"));
    } else if (tempStart) {
      onChangeRange(format(tempStart, "yyyy-MM-dd"), format(tempStart, "yyyy-MM-dd"));
    }
    setIsOpen(false);
  };

  // Helper to render month grid
  const renderMonthGrid = (monthDate: Date) => {
    const monthStart = startOfMonth(monthDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

    const days: Date[] = [];
    let dayIter = startDate;
    while (dayIter <= endDate) {
      days.push(dayIter);
      dayIter = addDays(dayIter, 1);
    }

    const weekHeaders = ["LU", "MA", "MI", "JU", "VI", "SÁ", "DO"];

    return (
      <div style={{ width: "235px" }}>
        {/* Days of week header */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(7, 1fr)",
            gap: "2px",
            marginBottom: "6px",
            textAlign: "center",
          }}
        >
          {weekHeaders.map((w, i) => (
            <span
              key={i}
              style={{
                fontSize: "11px",
                fontWeight: 600,
                color: "#64748b",
                textTransform: "uppercase",
              }}
            >
              {w}
            </span>
          ))}
        </div>

        {/* Days grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "2px" }}>
          {days.map((day, idx) => {
            const isCurrentMonth = isSameMonth(day, monthDate);
            const isStart = tempStart && isSameDay(day, tempStart);
            const isEnd = tempEnd && isSameDay(day, tempEnd);
            const inRange =
              tempStart &&
              tempEnd &&
              isWithinInterval(day, { start: tempStart, end: tempEnd });

            let bg = "transparent";
            let textColor = isCurrentMonth ? "#1e293b" : "#cbd5e1";
            let borderRadius = "4px";
            let fontWeight = 400;

            if (isStart || isEnd) {
              bg = "#2B8FCC";
              textColor = "#ffffff";
              borderRadius = "6px";
              fontWeight = 600;
            } else if (inRange) {
              bg = "#fef9c3";
              textColor = "#854d0e";
              borderRadius = "0px";
              fontWeight = 600;
            }

            return (
              <button
                key={idx}
                type="button"
                onClick={() => handleDayClick(day)}
                style={{
                  height: "30px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: isSameDay(day, new Date()) && !isStart && !isEnd ? "1px solid #2B8FCC" : "none",
                  backgroundColor: bg,
                  color: textColor,
                  fontSize: "12px",
                  fontWeight,
                  borderRadius,
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  padding: 0,
                }}
                className="hover:opacity-80"
              >
                {format(day, "d")}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  // Label text for button trigger
  const labelTexto = tempStart && tempEnd
    ? `${formatearFechaTexto(format(tempStart, "yyyy-MM-dd"))} - ${formatearFechaTexto(format(tempEnd, "yyyy-MM-dd"))}`
    : tempStart
      ? formatearFechaTexto(format(tempStart, "yyyy-MM-dd"))
      : "Seleccionar rango";

  return (
    <div
      ref={containerRef}
      style={{ position: "relative", display: "inline-block", zIndex: isOpen ? 9999 : "auto", ...style }}
      className={className}
    >
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          padding: "6px 14px",
          borderRadius: "20px",
          border: "1px solid #d0dce8",
          backgroundColor: "#ffffff",
          color: "#334155",
          fontSize: "12px",
          fontWeight: 600,
          cursor: "pointer",
          boxShadow: isOpen ? "0 0 0 3px rgba(100, 116, 139, 0.15)" : "none",
          transition: "all 0.2s ease",
        }}
      >
        <Calendar size={15} style={{ color: "#64748b" }} />
        <span>{labelTexto}</span>
        <ChevronDown size={14} style={{ color: "#64748b", transform: isOpen ? "rotate(180deg)" : "none", transition: "transform 0.2s ease" }} />
      </button>

      {/* Popover Dropdown Card */}
      {isOpen && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 8px)",
            left: 0,
            zIndex: 99999,
            backgroundColor: "#ffffff",
            borderRadius: "16px",
            border: "1px solid #e2e8f0",
            boxShadow: "0 20px 45px -10px rgba(0, 0, 0, 0.15)",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            minWidth: "700px",
          }}
        >
          {/* Main Body: Presets + Calendars */}
          <div style={{ display: "flex", flexDirection: "row" }}>
            {/* Presets Sidebar */}
            <div
              style={{
                width: "160px",
                borderRight: "1px solid #f1f5f9",
                padding: "16px 12px",
                display: "flex",
                flexDirection: "column",
                gap: "4px",
                backgroundColor: "#fafafa",
              }}
            >
              {[
                { label: "Hoy", key: "hoy" },
                { label: "Ayer", key: "ayer" },
                { label: "Esta semana", key: "estaSemana" },
                { label: "Semana anterior", key: "semanaAnterior" },
                { label: "Este mes", key: "esteMes" },
                { label: "Mes anterior", key: "mesAnterior" },
                { label: "Este trimestre", key: "esteTrimestre" },
                { label: "Trimestre anterior", key: "trimestreAnterior" },
                { label: "Este año", key: "esteAno" },
                { label: "Año anterior", key: "anoAnterior" },
              ].map((p) => (
                <button
                  key={p.key}
                  type="button"
                  onClick={() => applyPreset(p.key)}
                  style={{
                    textAlign: "left",
                    background: "none",
                    border: "none",
                    padding: "6px 10px",
                    borderRadius: "6px",
                    fontSize: "12px",
                    color: "#334155",
                    cursor: "pointer",
                    fontWeight: 500,
                    transition: "background-color 0.15s ease",
                  }}
                  className="hover:bg-slate-200/60"
                >
                  {p.label}
                </button>
              ))}
            </div>

            {/* Calendars Main Area */}
            <div style={{ flex: 1, padding: "20px 24px", display: "flex", flexDirection: "column", gap: "16px" }}>
              {/* Date Input Boxes */}
              <div style={{ display: "flex", gap: "16px" }}>
                <div style={{ flex: 1 }}>
                  <input
                    type="text"
                    readOnly
                    value={tempStart ? formatearFechaTexto(format(tempStart, "yyyy-MM-dd")) : ""}
                    className="form-control text-xs"
                    style={{
                      height: "36px",
                      borderRadius: "8px",
                      border: "1px solid #e2e8f0",
                      padding: "0 12px",
                      fontSize: "13px",
                      fontWeight: 500,
                      color: "#1e293b",
                      backgroundColor: "#ffffff",
                    }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <input
                    type="text"
                    readOnly
                    value={tempEnd ? formatearFechaTexto(format(tempEnd, "yyyy-MM-dd")) : ""}
                    className="form-control text-xs"
                    style={{
                      height: "36px",
                      borderRadius: "8px",
                      border: "1px solid #e2e8f0",
                      padding: "0 12px",
                      fontSize: "13px",
                      fontWeight: 500,
                      color: "#1e293b",
                      backgroundColor: "#ffffff",
                    }}
                  />
                </div>
              </div>

              {/* Month Navigation & Dual Calendar Grids */}
              <div style={{ display: "flex", gap: "24px" }}>
                {/* Left Month Block */}
                <div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: "12px",
                    }}
                  >
                    <span style={{ fontSize: "13px", fontWeight: 600, color: "#1e293b", textTransform: "capitalize" }}>
                      {format(currentMonthLeft, "MMMM yyyy", { locale: es })}
                    </span>
                    <div style={{ display: "flex", gap: "4px" }}>
                      <button
                        type="button"
                        onClick={() => setCurrentMonthLeft(subMonths(currentMonthLeft, 1))}
                        style={{
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          color: "#64748b",
                          padding: "2px 4px",
                          display: "flex",
                          alignItems: "center",
                        }}
                      >
                        <ChevronLeft size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setCurrentMonthLeft(addMonths(currentMonthLeft, 1))}
                        style={{
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          color: "#64748b",
                          padding: "2px 4px",
                          display: "flex",
                          alignItems: "center",
                        }}
                      >
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  </div>
                  {renderMonthGrid(currentMonthLeft)}
                </div>

                {/* Right Month Block */}
                <div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: "12px",
                    }}
                  >
                    <span style={{ fontSize: "13px", fontWeight: 600, color: "#1e293b", textTransform: "capitalize" }}>
                      {format(currentMonthRight, "MMMM yyyy", { locale: es })}
                    </span>
                    <div style={{ display: "flex", gap: "4px" }}>
                      <button
                        type="button"
                        onClick={() => setCurrentMonthLeft(subMonths(currentMonthLeft, 1))}
                        style={{
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          color: "#64748b",
                          padding: "2px 4px",
                          display: "flex",
                          alignItems: "center",
                        }}
                      >
                        <ChevronLeft size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setCurrentMonthLeft(addMonths(currentMonthLeft, 1))}
                        style={{
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          color: "#64748b",
                          padding: "2px 4px",
                          display: "flex",
                          alignItems: "center",
                        }}
                      >
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  </div>
                  {renderMonthGrid(currentMonthRight)}
                </div>
              </div>
            </div>
          </div>

          {/* Action Footer */}
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              alignItems: "center",
              gap: "12px",
              padding: "12px 24px",
              borderTop: "1px solid #f1f5f9",
              backgroundColor: "#ffffff",
            }}
          >
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              style={{
                background: "none",
                border: "none",
                fontSize: "13px",
                fontWeight: 600,
                color: "#64748b",
                cursor: "pointer",
                padding: "6px 16px",
              }}
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleApply}
              style={{
                backgroundColor: "#2B8FCC",
                color: "#ffffff",
                border: "none",
                borderRadius: "20px",
                padding: "8px 24px",
                fontSize: "13px",
                fontWeight: 600,
                cursor: "pointer",
                boxShadow: "0 2px 8px rgba(43, 143, 204, 0.3)",
                transition: "background-color 0.2s ease",
              }}
              className="hover:opacity-90"
            >
              Aplicar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DateRangePickerPopover;
