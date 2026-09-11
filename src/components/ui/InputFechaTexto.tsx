"use client";

import React, { useRef } from "react";
import { Calendar } from "lucide-react";
import { formatearFechaTexto } from "@/lib/date-utils";

interface InputFechaTextoProps {
  value: string;
  onChange: (val: string) => void;
  style?: React.CSSProperties;
  className?: string;
  height?: string;
  placeholder?: string;
}

export const InputFechaTexto: React.FC<InputFechaTextoProps> = ({
  value,
  onChange,
  style,
  className,
  height = "32px",
  placeholder = "dd/mmm/aaaa",
}) => {
  const dateInputRef = useRef<HTMLInputElement>(null);
  const textoFormateado = formatearFechaTexto(value);

  const handleClick = () => {
    const el = dateInputRef.current as (HTMLInputElement & { showPicker?: () => void }) | null;
    if (el) {
      if (typeof el.showPicker === "function") {
        try {
          el.showPicker();
        } catch {
          el.focus();
        }
      } else {
        el.focus();
      }
    }
  };

  return (
    <div
      style={{
        position: "relative",
        display: "inline-flex",
        alignItems: "center",
        width: "100%",
        height,
        ...style,
      }}
    >
      <input
        type="text"
        readOnly
        onClick={handleClick}
        className={className || "form-control"}
        placeholder={placeholder}
        value={textoFormateado}
        style={{
          height: "100%",
          fontSize: "12px",
          borderRadius: style?.borderRadius || "6px",
          border: "1px solid #d0dce8",
          backgroundColor: "#ffffff",
          color: "#1e3a5f",
          cursor: "pointer",
          paddingRight: "30px",
          width: "100%",
        }}
      />
      <button
        type="button"
        onClick={handleClick}
        style={{
          position: "absolute",
          right: "6px",
          background: "none",
          border: "none",
          color: "#2B8FCC",
          cursor: "pointer",
          padding: "2px",
          display: "flex",
          alignItems: "center",
        }}
      >
        <Calendar size={15} />
      </button>
      <input
        ref={dateInputRef}
        type="date"
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          opacity: 0,
          pointerEvents: "none",
          zIndex: -1,
        }}
      />
    </div>
  );
};

export default InputFechaTexto;
