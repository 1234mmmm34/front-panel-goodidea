import { useState, useEffect, useRef, useCallback } from "react";

/**
 * Hook para Scrollspy del checklist PIPC.
 * Escucha el scroll del contenedor de la columna derecha (desktop) o de window (< 992px)
 * y actualiza en tiempo real el índice de la sección activa.
 */
export function usePipcScrollSpy(
  contenedorRef: React.RefObject<HTMLElement | null>,
  idsSecciones: string[],
  dependenciaRecalculo?: any
) {
  const [seccionActiva, setSeccionActiva] = useState<number>(0);
  const pausadoRef = useRef<boolean>(false);
  const rafIdRef = useRef<number | null>(null);
  const timeoutPausaRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Calcular la sección activa según la posición de scroll
  const calcularSeccionActiva = useCallback(() => {
    const isDesktop = typeof window !== "undefined" && window.innerWidth >= 992;
    const container = contenedorRef.current;

    if (isDesktop && container) {
      // 1. Si el contenedor llegó al final: la activa es la última sección
      // (scrollTop + clientHeight >= scrollHeight - 2)
      const llegoAlFinal =
        container.scrollTop + container.clientHeight >= container.scrollHeight - 2;
      if (llegoAlFinal) {
        setSeccionActiva(idsSecciones.length - 1);
        return;
      }

      // 2. Sección activa = la última sección cuyo borde superior ya pasó la línea de referencia:
      // seccion.getBoundingClientRect().top - contenedor.getBoundingClientRect().top <= 120
      const contenedorRect = container.getBoundingClientRect();
      let activaIdx = 0;

      for (let i = 0; i < idsSecciones.length; i++) {
        const el = document.getElementById(idsSecciones[i]);
        if (el) {
          const diff = el.getBoundingClientRect().top - contenedorRect.top;
          if (diff <= 120) {
            activaIdx = i;
          }
        }
      }

      setSeccionActiva(activaIdx);
    } else {
      // Modo móvil (< 992px): el scroll es de la página
      const docEl = document.documentElement;
      const llegoAlFinal =
        window.innerHeight + window.pageYOffset >= docEl.scrollHeight - 2;
      if (llegoAlFinal) {
        setSeccionActiva(idsSecciones.length - 1);
        return;
      }

      let activaIdx = 0;
      for (let i = 0; i < idsSecciones.length; i++) {
        const el = document.getElementById(idsSecciones[i]);
        if (el) {
          const topViewport = el.getBoundingClientRect().top;
          if (topViewport <= 120) {
            activaIdx = i;
          }
        }
      }

      setSeccionActiva(activaIdx);
    }
  }, [contenedorRef, idsSecciones]);

  // Listener de scroll con throttling vía requestAnimationFrame y pausa durante scroll suave
  const handleScroll = useCallback(() => {
    if (pausadoRef.current) {
      // Mientras dura el scroll suave por clic, reiniciar el timer de 150ms sin cambios
      if (timeoutPausaRef.current) {
        clearTimeout(timeoutPausaRef.current);
      }
      timeoutPausaRef.current = setTimeout(() => {
        pausadoRef.current = false;
      }, 150);
      return;
    }

    if (rafIdRef.current !== null) {
      return;
    }

    rafIdRef.current = requestAnimationFrame(() => {
      rafIdRef.current = null;
      calcularSeccionActiva();
    });
  }, [calcularSeccionActiva]);

  // Clic en el índice: marcar sección de inmediato, pausar scrollspy y hacer scrollTo
  const scrollToSeccion = useCallback(
    (indice: number | string) => {
      const targetId = typeof indice === "number" ? idsSecciones[indice] : indice;
      const targetEl = document.getElementById(targetId);
      if (!targetEl) return;

      // Determinar el índice numérico de la sección correspondiente
      let numIndex = -1;
      if (typeof indice === "number") {
        numIndex = indice;
      } else {
        const directIdx = idsSecciones.indexOf(targetId);
        if (directIdx >= 0) {
          numIndex = directIdx;
        } else {
          // Si es un elemento interno (ej. pendiente), buscar la sección ancestro
          const seccionBloque = targetEl.closest(".seccion-bloque");
          if (seccionBloque?.id) {
            numIndex = idsSecciones.indexOf(seccionBloque.id);
          }
        }
      }

      // Marcar activa de inmediato
      if (numIndex >= 0) {
        setSeccionActiva(numIndex);
      }

      // Pausar el scrollspy mientras dura el scroll suave
      pausadoRef.current = true;
      if (timeoutPausaRef.current) {
        clearTimeout(timeoutPausaRef.current);
      }
      timeoutPausaRef.current = setTimeout(() => {
        pausadoRef.current = false;
      }, 150);

      const isDesktop = typeof window !== "undefined" && window.innerWidth >= 992;
      const container = contenedorRef.current;

      if (isDesktop && container) {
        const containerRect = container.getBoundingClientRect();
        const targetRect = targetEl.getBoundingClientRect();
        const esSeccionCompleta =
          targetEl.classList.contains("seccion-bloque") || targetId.startsWith("seccion-");

        // top = seccion.offsetTop - 8 para sección completa, o compensación con sticky header para elementos internos
        let top = 0;
        if (esSeccionCompleta && targetEl.offsetParent === container) {
          top = Math.max(0, targetEl.offsetTop - 8);
        } else {
          const compensacion = esSeccionCompleta ? 8 : 76;
          top = Math.max(0, container.scrollTop + (targetRect.top - containerRect.top) - compensacion);
        }

        container.scrollTo({ top, behavior: "smooth" });
      } else {
        const rect = targetEl.getBoundingClientRect();
        const topOffset = window.pageYOffset + rect.top - 120;
        window.scrollTo({ top: Math.max(0, topOffset), behavior: "smooth" });
      }
    },
    [contenedorRef, idsSecciones]
  );

  useEffect(() => {
    const container = contenedorRef.current;
    if (!container) return;

    // Calcular una vez al montar / cuando el ref esté listo
    calcularSeccionActiva();

    // Escuchar scroll del contenedor de la columna derecha
    container.addEventListener("scroll", handleScroll, { passive: true });

    // Escuchar scroll de window en móvil (< 992px)
    const handleWindowScroll = () => {
      if (typeof window !== "undefined" && window.innerWidth < 992) {
        handleScroll();
      }
    };
    window.addEventListener("scroll", handleWindowScroll, { passive: true });
    window.addEventListener("resize", handleScroll, { passive: true });

    // ResizeObserver sobre el contenedor de secciones y cada sección para recalcular al cambiar el alto
    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined") {
      resizeObserver = new ResizeObserver(() => {
        if (!pausadoRef.current) {
          calcularSeccionActiva();
        }
      });
      resizeObserver.observe(container);
      idsSecciones.forEach((id) => {
        const el = document.getElementById(id);
        if (el) resizeObserver?.observe(el);
      });
    }

    return () => {
      container.removeEventListener("scroll", handleScroll);
      window.removeEventListener("scroll", handleWindowScroll);
      window.removeEventListener("resize", handleScroll);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
      }
      if (timeoutPausaRef.current) {
        clearTimeout(timeoutPausaRef.current);
      }
    };
  }, [contenedorRef.current, idsSecciones, calcularSeccionActiva, handleScroll, dependenciaRecalculo]);

  return {
    seccionActiva,
    setSeccionActiva,
    scrollToSeccion,
    calcularSeccionActiva,
  };
}
