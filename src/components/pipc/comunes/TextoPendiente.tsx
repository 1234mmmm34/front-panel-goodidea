import React from "react";

interface Props {
  title?: string;
  className?: string;
  style?: React.CSSProperties;
}

export const TextoPendiente: React.FC<Props> = ({ title, className = "", style }) => {
  return (
    <span
      className={className}
      title={title}
      style={{
        color: "#DC3545",
        fontWeight: 600,
        ...style,
      }}
    >
      Pendiente
    </span>
  );
};
