import React from "react";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";

interface Props {
  paginaActual: number;
  totalPaginas: number;
  totalRegistros: number;
  tamano: number;
  onCambioPagina: (pagina: number) => void;
  onCambioTamano?: (tamano: number) => void;
}

export const PaginadorCustom: React.FC<Props> = ({
  paginaActual,
  totalPaginas,
  totalRegistros,
  tamano,
  onCambioPagina,
  onCambioTamano,
}) => {
  const paginasValidas = Math.max(1, totalPaginas);
  const pagina = Math.min(Math.max(1, paginaActual), paginasValidas);

  const inicio = totalRegistros === 0 ? 0 : (pagina - 1) * tamano + 1;
  const fin = Math.min(pagina * tamano, totalRegistros);

  return (
    <div className="paginador-container">
      <div className="paginador-info" style={{ whiteSpace: "nowrap" }}>
        Mostrando <strong>{inicio}</strong> - <strong>{fin}</strong> de <strong>{totalRegistros}</strong> registros
      </div>

      <div className="paginador-controls" style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: "8px", flexWrap: "nowrap" }}>
        {onCambioTamano && (
          <div style={{ display: "inline-flex", flexDirection: "row", alignItems: "center", gap: "8px", whiteSpace: "nowrap", marginRight: "8px" }}>
            <span className="text-xs text-slate-600 font-medium" style={{ whiteSpace: "nowrap" }}>Mostrar:</span>
            <select
              className="form-select text-xs py-1 px-3"
              style={{ width: "auto", borderRadius: "20px", height: "32px", display: "inline-block", cursor: "pointer" }}
              value={tamano}
              onChange={(e) => onCambioTamano(Number(e.target.value))}
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        )}

        <button
          className="btn btn-outline btn-sm"
          style={{ height: "32px", minWidth: "32px", borderRadius: "8px", display: "inline-flex", alignItems: "center", justifyContent: "center" }}
          disabled={pagina <= 1}
          onClick={() => onCambioPagina(1)}
          title="Primera página"
        >
          <ChevronsLeft size={16} />
        </button>

        <button
          className="btn btn-outline btn-sm"
          style={{ height: "32px", minWidth: "32px", borderRadius: "8px", display: "inline-flex", alignItems: "center", justifyContent: "center" }}
          disabled={pagina <= 1}
          onClick={() => onCambioPagina(pagina - 1)}
          title="Página anterior"
        >
          <ChevronLeft size={16} />
        </button>

        <span className="px-2 font-medium text-xs text-slate-700" style={{ whiteSpace: "nowrap" }}>
          Página {pagina} de {paginasValidas}
        </span>

        <button
          className="btn btn-outline btn-sm"
          style={{ height: "32px", minWidth: "32px", borderRadius: "8px", display: "inline-flex", alignItems: "center", justifyContent: "center" }}
          disabled={pagina >= paginasValidas}
          onClick={() => onCambioPagina(pagina + 1)}
          title="Página siguiente"
        >
          <ChevronRight size={16} />
        </button>

        <button
          className="btn btn-outline btn-sm"
          style={{ height: "32px", minWidth: "32px", borderRadius: "8px", display: "inline-flex", alignItems: "center", justifyContent: "center" }}
          disabled={pagina >= paginasValidas}
          onClick={() => onCambioPagina(paginasValidas)}
          title="Última página"
        >
          <ChevronsRight size={16} />
        </button>
      </div>
    </div>
  );
};
