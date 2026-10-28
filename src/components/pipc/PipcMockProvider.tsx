"use client";

import React, { createContext, useContext, useState, useCallback, useMemo } from "react";
import { PipcExpediente, PipcFormData } from "./pipcCalculos";
import { crearExpedienteVacio } from "./pipcMock";

export interface DatosServicioPipc {
  i_CveServAgendaDet: number;
  cliente?: string;
  razonSocial?: string;
  domicilio?: string;
  telefono?: string;
  i_CveEmpresa?: number;
  i_CvePlanta?: number;
  planta?: string;
  consultor?: string;
  fechaInicio?: string;
  v_Empresa?: string;
  v_Planta?: string;
  v_Consultor?: string;
  v_Domicilio?: string;
  v_Telefono?: string;
  d_FechaInicio?: string;
}

interface PipcContextType {
  expedientes: Record<number, PipcExpediente>;
  obtenerPorServicio: (i_CveServAgendaDet: number) => PipcExpediente | undefined;
  obtenerOCrearPorServicio: (datosServicio: DatosServicioPipc) => PipcExpediente;
  actualizarExpediente: (
    i_CveServAgendaDet: number,
    cambios: Partial<PipcExpediente> | ((prev: PipcExpediente) => PipcExpediente)
  ) => void;
  actualizarForm: (i_CveServAgendaDet: number, cambiosForm: Partial<PipcFormData>) => void;
  guardarExpediente: (exp: PipcExpediente) => void;
}

const PipcContext = createContext<PipcContextType | undefined>(undefined);

export const PipcMockProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [expedientes, setExpedientes] = useState<Record<number, PipcExpediente>>({});

  const obtenerPorServicio = useCallback(
    (i_CveServAgendaDet: number) => {
      if (!i_CveServAgendaDet) return undefined;
      return expedientes[Number(i_CveServAgendaDet)];
    },
    [expedientes]
  );

  const actualizarExpediente = useCallback(
    (
      i_CveServAgendaDet: number,
      cambios: Partial<PipcExpediente> | ((prev: PipcExpediente) => PipcExpediente)
    ) => {
      const servId = Number(i_CveServAgendaDet);
      setExpedientes((prev) => {
        const item = prev[servId];
        if (!item) return prev;
        const updated = typeof cambios === "function" ? cambios(item) : { ...item, ...cambios };
        return { ...prev, [servId]: updated };
      });
    },
    []
  );

  const actualizarForm = useCallback(
    (i_CveServAgendaDet: number, cambiosForm: Partial<PipcFormData>) => {
      const servId = Number(i_CveServAgendaDet);
      setExpedientes((prev) => {
        const item = prev[servId];
        if (!item) return prev;
        return {
          ...prev,
          [servId]: {
            ...item,
            form: {
              ...item.form,
              ...cambiosForm,
            },
          },
        };
      });
    },
    []
  );

  const guardarExpediente = useCallback((exp: PipcExpediente) => {
    if (!exp.i_CveServAgendaDet) return;
    setExpedientes((prev) => ({
      ...prev,
      [exp.i_CveServAgendaDet!]: exp,
    }));
  }, []);

  const obtenerOCrearPorServicio = useCallback(
    (datosServicio: DatosServicioPipc): PipcExpediente => {
      const servId = Number(datosServicio.i_CveServAgendaDet);
      if (expedientes[servId]) {
        return expedientes[servId];
      }

      const nuevo = crearExpedienteVacio(
        servId,
        datosServicio.v_Empresa || datosServicio.cliente || `Servicio #${servId}`,
        datosServicio.razonSocial || datosServicio.v_Empresa || datosServicio.cliente || "",
        datosServicio.v_Domicilio || datosServicio.domicilio || "",
        datosServicio.v_Telefono || datosServicio.telefono || "",
        datosServicio.i_CveEmpresa || 0,
        datosServicio.i_CvePlanta || 0,
        datosServicio.v_Planta || datosServicio.planta || "Planta Principal",
        datosServicio.v_Consultor || datosServicio.consultor || "",
        datosServicio.d_FechaInicio || datosServicio.fechaInicio || new Date().toISOString().split("T")[0]
      );

      setExpedientes((prev) => ({
        ...prev,
        [servId]: nuevo,
      }));
      return nuevo;
    },
    [expedientes]
  );

  const value = useMemo(
    () => ({
      expedientes,
      obtenerPorServicio,
      obtenerOCrearPorServicio,
      actualizarExpediente,
      actualizarForm,
      guardarExpediente,
    }),
    [
      expedientes,
      obtenerPorServicio,
      obtenerOCrearPorServicio,
      actualizarExpediente,
      actualizarForm,
      guardarExpediente,
    ]
  );

  return <PipcContext.Provider value={value}>{children}</PipcContext.Provider>;
};

export const usePipc = () => {
  const context = useContext(PipcContext);
  if (!context) {
    throw new Error("usePipc debe ser usado dentro de un PipcMockProvider");
  }
  return context;
};
