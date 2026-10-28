"use client";

import React, { use, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { AppLayout } from "@/components/layout/AppLayout";
import { ExpedientePipc } from "@/components/pipc/ExpedientePipc";

interface PageProps {
  params: Promise<{ i_CveServAgendaDet: string }>;
}

function ContenidoExpediente({ servicioId }: { servicioId: number }) {
  const searchParams = useSearchParams();
  const soloLectura = searchParams.get("soloLectura") === "true";

  return (
    <ExpedientePipc
      servicioId={servicioId}
      soloLectura={soloLectura}
    />
  );
}

export default function PipcServicioPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const servicioId = Number(resolvedParams.i_CveServAgendaDet);

  return (
    <AppLayout>
      <Suspense fallback={<div className="p-4 text-sm text-slate-500">Cargando checklist PIPC...</div>}>
        <ContenidoExpediente servicioId={servicioId} />
      </Suspense>
    </AppLayout>
  );
}
