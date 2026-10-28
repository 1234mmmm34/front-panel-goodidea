"use client";

import React from "react";
import { PipcExpediente } from "../pipcCalculos";
import { ZonaFotos } from "../comunes/ZonaFotos";

interface Props {
  expediente: PipcExpediente;
  agregarFoto: (seccionKey: string, archivo: File, soloUna?: boolean) => void;
  quitarFoto: (seccionKey: string, fotoId: string) => void;
  soloLectura?: boolean;
}

export const SeccionAtlas: React.FC<Props> = ({
  expediente,
  agregarFoto,
  quitarFoto,
  soloLectura = false,
}) => {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <div className="card p-4">
        <div style={{ borderLeft: "3px solid #2B8FCC", paddingLeft: "10px", marginBottom: "14px" }}>
          <h3 style={{ fontSize: "13px", fontWeight: 700, color: "#1e293b", textTransform: "uppercase", margin: 0 }}>
            Atlas de riesgos externo e interno
          </h3>
          <p style={{ fontSize: "11px", color: "#64748b", margin: 0 }}>
            Mapas de identificación de peligros y vulnerabilidades en el entorno municipal/regional y al interior del predio.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px" }}>
          <div>
            <label className="form-label text-xs">Atlas de riesgos externo (entorno)</label>
            <ZonaFotos
              fotos={expediente.fotos["atlas-externo"] || []}
              onSubir={(arch) => agregarFoto("atlas-externo", arch, false)}
              onQuitar={(fId) => quitarFoto("atlas-externo", fId)}
              label="Subir imagen del atlas externo / entorno"
              soloLectura={soloLectura}
            />
          </div>

          <div>
            <label className="form-label text-xs">Atlas de riesgos interno (instalaciones)</label>
            <ZonaFotos
              fotos={expediente.fotos["atlas-interno"] || []}
              onSubir={(arch) => agregarFoto("atlas-interno", arch, false)}
              onQuitar={(fId) => quitarFoto("atlas-interno", fId)}
              label="Subir imagen del atlas interno de la planta"
              soloLectura={soloLectura}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
