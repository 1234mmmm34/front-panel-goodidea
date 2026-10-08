"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { RutaDto } from "@/types/rutas";
import { RutasService } from "@/services/rutas.service";
import { obtenerSesionActual } from "@/lib/api-client";
import { useToast } from "@/context/ToastContext";

interface MenuContextType {
  rutasNavBar: RutaDto[];
  cargandoMenu: boolean;
  haCargadoExitoso: boolean;
  refrescarMenu: (forzarSegundoPlano?: boolean) => Promise<void>;
  limpiarMenuCache: () => void;
}

const MenuContext = createContext<MenuContextType | undefined>(undefined);

export const MenuProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { toast } = useToast();

  const getCacheKey = (cvePerfil: number) => `menu_${cvePerfil}`;

  const leerCache = (cvePerfil: number): RutaDto[] | null => {
    if (typeof window === "undefined") return null;
    try {
      const raw = sessionStorage.getItem(getCacheKey(cvePerfil));
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
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

  // Inicialización síncrona inmediata desde sessionStorage para evitar esqueleto en F5
  const [rutasNavBar, setRutasNavBar] = useState<RutaDto[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const sesion = obtenerSesionActual();
        if (sesion?.token && sesion?.id_perfil) {
          const enCache = leerCache(sesion.id_perfil);
          if (enCache) {
            return enCache;
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
        if (sesion?.token && sesion?.id_perfil) {
          const enCache = leerCache(sesion.id_perfil);
          if (enCache) {
            return false; // Ya está disponible de inmediato
          }
          return true; // Hay sesión pero falta cargar el menú
        }
      } catch {
        // fallback
      }
    }
    return false; // Sin sesión (ej. login) no mostramos esqueleto
  });

  const [haCargadoExitoso, setHaCargadoExitoso] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      try {
        const sesion = obtenerSesionActual();
        if (sesion?.token && sesion?.id_perfil) {
          const enCache = leerCache(sesion.id_perfil);
          if (enCache) {
            return true;
          }
        }
      } catch {
        // fallback
      }
    }
    return false;
  });

  const perfilCargadoRef = useRef<number | null>(null);

  const cargarMenuPerfil = useCallback(
    async (cvePerfil: number, forzarSegundoPlano: boolean = false) => {
      const sesion = obtenerSesionActual();
      if (!sesion?.token) {
        setCargandoMenu(false);
        return;
      }

      // 1. Si no es forzado y existe en cache de sessionStorage, cargar de inmediato
      if (!forzarSegundoPlano) {
        const enCache = leerCache(cvePerfil);
        if (enCache) {
          setRutasNavBar(enCache);
          setCargandoMenu(false);
          setHaCargadoExitoso(true);
          perfilCargadoRef.current = cvePerfil;
          return;
        }
        setCargandoMenu(true);
      }

      try {
        const data = await RutasService.getRutasNavBar(cvePerfil);
        // Filtrar elementos vacíos o dummy
        const validas = (data || []).filter(
          (r) =>
            r &&
            Boolean(r.v_RutaRaiz?.trim()) &&
            Boolean(r.v_RutaHija?.trim()) &&
            Boolean(r.v_Ruta?.trim())
        );

        guardarCache(cvePerfil, validas);
        setRutasNavBar(validas);
        setHaCargadoExitoso(true);
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

  // Efecto que detecta cuando la sesión está lista o cambia de perfil
  useEffect(() => {
    const sesion = obtenerSesionActual();
    if (sesion?.token && sesion?.id_perfil) {
      if (perfilCargadoRef.current !== sesion.id_perfil) {
        cargarMenuPerfil(sesion.id_perfil, false);
      }
    } else {
      // Sesión no disponible o cerrada
      if (perfilCargadoRef.current !== null) {
        perfilCargadoRef.current = null;
        setRutasNavBar([]);
        setHaCargadoExitoso(false);
        setCargandoMenu(false);
      }
    }
  }, [cargarMenuPerfil]);

  const refrescarMenu = useCallback(
    async (forzarSegundoPlano: boolean = true) => {
      const sesion = obtenerSesionActual();
      if (sesion?.token && sesion?.id_perfil) {
        await cargarMenuPerfil(sesion.id_perfil, forzarSegundoPlano);
      }
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
    perfilCargadoRef.current = null;
    setRutasNavBar([]);
    setHaCargadoExitoso(false);
    setCargandoMenu(false);
  }, []);

  return (
    <MenuContext.Provider
      value={{
        rutasNavBar,
        cargandoMenu,
        haCargadoExitoso,
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
