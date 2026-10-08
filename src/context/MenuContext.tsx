"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { RutaDto } from "@/types/rutas";
import { RutasService } from "@/services/rutas.service";
import { obtenerSesionActual } from "@/lib/api-client";
import { useToast } from "@/context/ToastContext";

interface MenuContextType {
  rutasNavBar: RutaDto[];
  cargandoMenu: boolean;
  refrescarMenu: (forzarSegundoPlano?: boolean) => Promise<void>;
  limpiarMenuCache: () => void;
}

const MenuContext = createContext<MenuContextType | undefined>(undefined);

export const MenuProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { toast } = useToast();
  const [rutasNavBar, setRutasNavBar] = useState<RutaDto[]>(() => {
    // Inicialización síncrona inmediata desde sessionStorage para evitar esqueleto en F5
    if (typeof window !== "undefined") {
      try {
        const sesion = obtenerSesionActual();
        const cvePerfil = sesion?.id_perfil ?? 1;
        const raw = sessionStorage.getItem(`menu_${cvePerfil}`);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed;
          }
        }
      } catch (e) {
        console.warn("Error al leer cache inicial del menú:", e);
      }
    }
    return [];
  });

  const [cargandoMenu, setCargandoMenu] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      try {
        const sesion = obtenerSesionActual();
        const cvePerfil = sesion?.id_perfil ?? 1;
        const raw = sessionStorage.getItem(`menu_${cvePerfil}`);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return false;
          }
        }
      } catch {
        // fallback
      }
    }
    return true;
  });

  const perfilCargadoRef = useRef<number | null>(null);

  const getCacheKey = (cvePerfil: number) => `menu_${cvePerfil}`;

  const leerCache = (cvePerfil: number): RutaDto[] | null => {
    if (typeof window === "undefined") return null;
    try {
      const raw = sessionStorage.getItem(getCacheKey(cvePerfil));
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn("Error leyendo menú de sessionStorage:", e);
    }
    return null;
  };

  const guardarCache = (cvePerfil: number, rutas: RutaDto[]) => {
    if (typeof window === "undefined") return;
    try {
      sessionStorage.setItem(getCacheKey(cvePerfil), JSON.stringify(rutas));
    } catch (e) {
      console.warn("Error guardando menú en sessionStorage:", e);
    }
  };

  const cargarMenuPerfil = useCallback(
    async (cvePerfil: number, forzarSegundoPlano: boolean = false) => {
      // 1. Si no es forzado y existe en cache de sessionStorage, cargar de inmediato sin esqueleto ni petición
      if (!forzarSegundoPlano) {
        const enCache = leerCache(cvePerfil);
        if (enCache) {
          setRutasNavBar(enCache);
          setCargandoMenu(false);
          perfilCargadoRef.current = cvePerfil;
          return;
        }
      }

      // 2. Si no hay cache y no es en segundo plano, mostrar esqueleto
      if (!forzarSegundoPlano) {
        setCargandoMenu(true);
      }

      try {
        const data = await RutasService.getRutasNavBar(cvePerfil);
        const validas = (data || []).filter(
          (r) =>
            r &&
            Boolean(r.v_RutaRaiz?.trim()) &&
            Boolean(r.v_RutaHija?.trim()) &&
            Boolean(r.v_Ruta?.trim())
        );

        guardarCache(cvePerfil, validas);
        setRutasNavBar(validas);
        perfilCargadoRef.current = cvePerfil;
      } catch (err) {
        console.error("Error cargando menú del usuario:", err);
        toast.error("No se pudo cargar el menú del sistema.");
      } finally {
        setCargandoMenu(false);
      }
    },
    [toast]
  );

  useEffect(() => {
    const sesion = obtenerSesionActual();
    const cvePerfil = sesion?.id_perfil ?? 1;

    // Cargar solo si no se ha cargado para este perfil
    if (perfilCargadoRef.current !== cvePerfil) {
      cargarMenuPerfil(cvePerfil, false);
    }
  }, [cargarMenuPerfil]);

  const refrescarMenu = useCallback(
    async (forzarSegundoPlano: boolean = true) => {
      const sesion = obtenerSesionActual();
      const cvePerfil = sesion?.id_perfil ?? 1;
      await cargarMenuPerfil(cvePerfil, forzarSegundoPlano);
    },
    [cargarMenuPerfil]
  );

  const limpiarMenuCache = useCallback(() => {
    if (typeof window === "undefined") return;
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < sessionStorage.length; i++) {
        const k = sessionStorage.key(i);
        if (k && k.startsWith("menu_")) {
          keysToRemove.push(k);
        }
      }
      keysToRemove.forEach((k) => sessionStorage.removeItem(k));
    } catch (e) {
      console.warn("Error limpiando cache de menú:", e);
    }
  }, []);

  return (
    <MenuContext.Provider
      value={{
        rutasNavBar,
        cargandoMenu,
        refrescarMenu,
        limpiarMenuCache,
      }}
    >
      {children}
    </MenuContext.Provider>
  );
};

export const useMenu = () => {
  const context = useContext(MenuContext);
  if (!context) {
    throw new Error("useMenu debe usarse dentro de un MenuProvider");
  }
  return context;
};
