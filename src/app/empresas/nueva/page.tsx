"use client";

import React from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { FormularioEmpresa } from "@/components/empresas/FormularioEmpresa";

export default function NuevaEmpresaPage() {
  return (
    <AppLayout>
      <FormularioEmpresa />
    </AppLayout>
  );
}
