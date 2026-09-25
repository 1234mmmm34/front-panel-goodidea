"use client";

import React from "react";
import { ModalCrearEditarPersonal } from "./ModalCrearEditarPersonal";

interface Props {
  abierto: boolean;
  instructorEditar?: { i_CveInstructor: number } | null;
  instructorEditarId?: number | null;
  onCerrar: () => void;
  onGuardado: () => void;
}

export const ModalCrearEditarInstructor: React.FC<Props> = ({
  abierto,
  instructorEditar,
  instructorEditarId,
  onCerrar,
  onGuardado,
}) => {
  const idToUse = instructorEditarId ?? instructorEditar?.i_CveInstructor ?? null;

  return (
    <ModalCrearEditarPersonal
      abierto={abierto}
      instructorEditarId={idToUse}
      onCerrar={onCerrar}
      onGuardado={onGuardado}
    />
  );
};
