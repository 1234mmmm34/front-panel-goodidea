"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { EmpresaGetDto } from "@/types/empresas";
import { EmpresasService } from "@/services/empresas.service";
import { AppLayout } from "@/components/layout/AppLayout";
import { FormularioEmpresa } from "@/components/empresas/FormularioEmpresa";

export default function EditarEmpresaPage() {
  const params = useParams();
  const idStr = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const id = idStr ? Number(idStr) : 0;

  const [empresa, setEmpresa] = useState<EmpresaGetDto | null>(null);
  const [cargando, setCargando] = useState<boolean>(true);

  useEffect(() => {
    async function cargar() {
      if (id > 0) {
        setCargando(true);
        const datos = await EmpresasService.getById(id);
        setEmpresa(datos);
        setCargando(false);
      }
    }
    cargar();
  }, [id]);

  return (
    <AppLayout>
      {cargando ? (
        <div className="card text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-2"></div>
          <p className="text-secondary">Cargando información del cliente...</p>
        </div>
      ) : empresa ? (
        <FormularioEmpresa empresaEditar={empresa} />
      ) : (
        <div className="card text-center py-12 text-danger">
          <p>No se encontró la empresa solicitada.</p>
        </div>
      )}
    </AppLayout>
  );
}
