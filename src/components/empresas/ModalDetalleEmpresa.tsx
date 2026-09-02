import React from "react";
import { X, Building2, MapPin, CreditCard, User } from "lucide-react";
import { EmpresaGetDto } from "@/types/empresas";

interface Props {
  empresa: EmpresaGetDto | null;
  onCerrar: () => void;
}

export const ModalDetalleEmpresa: React.FC<Props> = ({ empresa, onCerrar }) => {
  if (!empresa) return null;

  const domicilioFormateado = `Calle ${empresa.v_NombreCalle || "—"} ${
    empresa.v_NumeroExterior || ""
  }${empresa.v_NumeroInterior ? ` Int. ${empresa.v_NumeroInterior}` : ""}, fraccionamiento ${
    empresa.v_Fraccionamiento || "—"
  }. ${empresa.v_Municipio || "—"}, ${empresa.v_NombreEstado || "—"} CP ${
    empresa.i_CodigoPostal || "—"
  }`;

  return (
    <div className="modal-overlay" onClick={onCerrar}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="flex items-center gap-2">
            <Building2 size={22} className="text-primary" />
            <h3 className="modal-title">{empresa.s_RazonSocial || "Detalle de Cliente"}</h3>
          </div>
          <button className="btn-icon" onClick={onCerrar}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="form-label">RFC</span>
              <p className="font-semibold text-slate-800">{empresa.s_RFC || "N/A"}</p>
            </div>

            <div>
              <span className="form-label">Registro Patronal</span>
              <p className="font-semibold text-slate-800">{empresa.s_RegistroPatronal || "N/A"}</p>
            </div>

            <div>
              <span className="form-label flex items-center gap-1">
                <Building2 size={14} /> Giro / Actividad
              </span>
              <p className="text-slate-800">{empresa.s_GiroActividad || "N/A"}</p>
            </div>

            <div>
              <span className="form-label flex items-center gap-1">
                <CreditCard size={14} /> Días de Crédito
              </span>
              <p className="text-slate-800">{empresa.d_DiasCredito ?? 0} días</p>
            </div>

            <div className="col-span-2">
              <span className="form-label flex items-center gap-1">
                <User size={14} /> Representante Legal
              </span>
              <p className="text-slate-800">{empresa.s_RepresentanteLegal || "N/A"}</p>
            </div>
          </div>

          <div className="border-t pt-3 mt-2">
            <span className="form-label flex items-center gap-1 mb-1">
              <MapPin size={14} className="text-primary" /> Domicilio Fiscal / Registrado
            </span>
            <p className="text-sm text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-200">
              {domicilioFormateado}
            </p>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onCerrar}>
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
