"use client";

import React from "react";

const DIAS_SEMANA = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

export const CalendarioSkeleton: React.FC = () => {
  return (
    <div className="grid-calendario-container">
      <div className="grid-header">
        {DIAS_SEMANA.map((dia) => (
          <div key={dia} className="dia-semana-title">
            {dia}
          </div>
        ))}
      </div>

      <div className="grid-body">
        {Array.from({ length: 35 }).map((_, idx) => {
          const esFueraMes = idx < 2 || idx >= 33;
          const tieneEvento1 = idx % 2 === 0;
          const tieneEvento2 = idx % 5 === 0;

          return (
            <div
              key={`sk-celda-${idx}`}
              className={`celda-dia ${esFueraMes ? "fuera-mes" : ""}`}
            >
              <div className="dia-header">
                <div className="skeleton-box sm" style={{ width: "16px", height: "16px", borderRadius: "50%" }}></div>
              </div>

              <div className="eventos-lista">
                {tieneEvento1 && (
                  <div
                    className="skeleton-box"
                    style={{
                      height: "22px",
                      borderRadius: "4px",
                      width: "90%",
                      marginBottom: "3px",
                    }}
                  ></div>
                )}
                {tieneEvento2 && (
                  <div
                    className="skeleton-box sm"
                    style={{
                      height: "18px",
                      borderRadius: "4px",
                      width: "65%",
                    }}
                  ></div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <style jsx>{`
        .grid-calendario-container {
          background: #ffffff;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
          width: 100%;
        }
        .grid-header {
          display: grid;
          grid-template-columns: repeat(7, minmax(0, 1fr));
          background-color: #f8fafc;
          border-bottom: 1px solid #e2e8f0;
          border-top-left-radius: 12px;
          border-top-right-radius: 12px;
        }
        .dia-semana-title {
          padding: 10px 4px;
          text-align: center;
          font-weight: 600;
          font-size: 11px;
          color: #94a3b8;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .grid-body {
          display: grid;
          grid-template-columns: repeat(7, minmax(0, 1fr));
          background-color: #e2e8f0;
          gap: 1px;
          width: 100%;
          border-bottom-left-radius: 12px;
          border-bottom-right-radius: 12px;
        }
        .celda-dia {
          height: 105px;
          background: #ffffff;
          padding: 6px 8px;
          display: flex;
          flex-direction: column;
          box-sizing: border-box;
        }
        .celda-dia.fuera-mes {
          background-color: #fafafa;
        }
        .dia-header {
          display: flex;
          justify-content: flex-end;
          margin-bottom: 4px;
        }
        .eventos-lista {
          display: flex;
          flex-direction: column;
          gap: 3px;
          flex: 1;
        }
      `}</style>
    </div>
  );
};
