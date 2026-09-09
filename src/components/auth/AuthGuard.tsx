"use client";

import React, { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { obtenerSesionActual } from "@/lib/api-client";

import { ToastProvider } from "@/context/ToastContext";

interface Props {
  children: React.ReactNode;
}

export const AuthGuard: React.FC<Props> = ({ children }) => {
  const router = useRouter();
  const pathname = usePathname();
  const [verificando, setVerificando] = useState<boolean>(true);

  useEffect(() => {
    const sesion = obtenerSesionActual();
    const esRutaLogin = pathname === "/login";

    if (!sesion && !esRutaLogin) {
      router.replace("/login");
    } else if (sesion && esRutaLogin) {
      router.replace("/calendario");
    } else {
      setVerificando(false);
    }
  }, [pathname, router]);

  if (verificando) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-100">
        <div className="text-center p-8 bg-white rounded-xl shadow-md">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-sky-600 mb-3"></div>
          <p className="text-sm text-slate-600 font-medium">Verificando sesión...</p>
        </div>
      </div>
    );
  }

  return <ToastProvider>{children}</ToastProvider>;
};
