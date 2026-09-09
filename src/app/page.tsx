"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { obtenerSesionActual } from "@/lib/api-client";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const sesion = obtenerSesionActual();
    if (sesion?.token) {
      router.replace("/calendario");
    } else {
      router.replace("/login");
    }
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-900 text-white">
      <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-sky-500"></div>
    </div>
  );
}
