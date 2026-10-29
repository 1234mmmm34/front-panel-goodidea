"use client";

import React, { useRef, useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { usePipcExpediente } from "./usePipcExpediente";
import { EncabezadoExpediente } from "./EncabezadoExpediente";
import { IndiceLateral, InfoSeccionIndice } from "./IndiceLateral";
import { BadgeSemaforo } from "./comunes/BadgeSemaforo";
import { usePipcScrollSpy } from "./usePipcScrollSpy";
import { PipcService, extraerMensajeError } from "@/services/pipc.service";
import { useToast } from "@/context/ToastContext";

// Las 11 secciones
import { SeccionGenerales } from "./secciones/SeccionGenerales";
import { SeccionInmueble } from "./secciones/SeccionInmueble";
import { SeccionOrganizacion } from "./secciones/SeccionOrganizacion";
import { SeccionDirectorios } from "./secciones/SeccionDirectorios";
import { SeccionInventarios } from "./secciones/SeccionInventarios";
import { SeccionAtlas } from "./secciones/SeccionAtlas";
import { SeccionRiesgos } from "./secciones/SeccionRiesgos";
import { SeccionMantenimiento } from "./secciones/SeccionMantenimiento";
import { SeccionSeguridadMedidas } from "./secciones/SeccionSeguridadMedidas";
import { SeccionAnexos } from "./secciones/SeccionAnexos";
import { SeccionExportar } from "./secciones/SeccionExportar";

interface Props {
  servicioId?: number;
  expedienteId?: number;
  soloLectura?: boolean;
  moduloOrigen?: "programacion" | "mis-servicios";
}

const CONFIG_SECCIONES = [
  {
    id: "sec-0",
    nombre: "Datos generales",
    icono: "bi bi-building",
    subtitulo: "Información básica de la empresa y el inmueble",
  },
  {
    id: "sec-1",
    nombre: "Inmueble",
    icono: "bi bi-house-gear",
    subtitulo: "Historia, descripción y política de seguridad",
  },
  {
    id: "sec-2",
    nombre: "Organización UIPC",
    icono: "bi bi-diagram-3",
    subtitulo: "Unidad Interna de Protección Civil — integrantes y roles",
  },
  {
    id: "sec-3",
    nombre: "Directorios",
    icono: "bi bi-telephone",
    subtitulo: "Entidades de gobierno, organismos, proveedores y vecinos",
  },
  {
    id: "sec-4",
    nombre: "Inventarios",
    icono: "bi bi-box-seam",
    subtitulo: "Personas en el inmueble y equipos de emergencia disponibles",
  },
  {
    id: "sec-5",
    nombre: "Atlas de riesgos",
    icono: "bi bi-map",
    subtitulo: "Atlas de riesgo externo e interno de la instalación",
  },
  {
    id: "sec-6",
    nombre: "Riesgos",
    icono: "bi bi-exclamation-triangle",
    subtitulo: "Agentes perturbadores externos e internos con su magnitud de riesgo",
  },
  {
    id: "sec-7",
    nombre: "Mantenimiento",
    icono: "bi bi-tools",
    subtitulo: "Programas de inspección, mantenimiento a edificio y medidas de seguridad",
  },
  {
    id: "sec-8",
    nombre: "Seguridad y medidas",
    icono: "bi bi-shield-check",
    subtitulo: "Capacitación, simulacros, responsabilidades y recomendaciones",
  },
  {
    id: "sec-9",
    nombre: "Anexos",
    icono: "bi bi-paperclip",
    subtitulo: "Marca los anexos que aplican para este PIPC. Solo los anexos marcados se incluyen en el documento.",
  },
  {
    id: "sec-10",
    nombre: "Exportar",
    icono: "bi bi-file-earmark-arrow-down",
    subtitulo: "Control del expediente, pendientes y paquete para generación del Word",
  },
];

const IDS_SECCIONES = CONFIG_SECCIONES.map((_, idx) => `seccion-${idx}`);

interface BandaSeccionHeaderProps {
  numero: number;
  nombre: string;
  subtitulo: string;
  icono: string;
  activa: boolean;
  badge?: React.ReactNode;
}

const BandaSeccionHeader: React.FC<BandaSeccionHeaderProps> = ({
  numero,
  nombre,
  subtitulo,
  icono,
  activa,
  badge,
}) => {
  return (
    <div className={`seccion-banda-header ${activa ? "activa" : ""}`}>
      <div style={{ display: "flex", alignItems: "center", gap: "14px", minWidth: 0 }}>
        <div className="seccion-icono-circulo">
          <i className={icono} />
        </div>
        <div style={{ minWidth: 0 }}>
          <h2 className="seccion-banda-titulo">
            {numero}. {nombre.toUpperCase()}
          </h2>
          <p className="seccion-banda-subtitulo">{subtitulo}</p>
        </div>
      </div>
      {badge && (
        <div style={{ flexShrink: 0, marginLeft: "16px" }}>
          {badge}
        </div>
      )}
    </div>
  );
};

export const ExpedientePipc: React.FC<Props> = ({
  servicioId,
  expedienteId,
  soloLectura: propSoloLectura = false,
  moduloOrigen,
}) => {
  const { toast } = useToast();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const contentColRef = useRef<HTMLDivElement | null>(null);
  const [iniciandoExpediente, setIniciandoExpediente] = useState<boolean>(false);

  const idReal = servicioId || expedienteId || 0;
  const hook = usePipcExpediente(idReal);
  const {
    expediente,
    resumen,
    cargando,
    errorCarga,
    servicioSinChecklist,
    servicioPuedeIniciar,
    soloLectura: hookSoloLectura,
    reintentarCarga,
    porcentajesSecciones,
    avanceGlobal,
    pendientes,
    pendientesAlta,
    diasProyecto,
    guardandoEstado,
    ultimaHoraGuardado,
    reintentarGuardado,
    forzarGuardadoPendiente,
    conflictoModal,
    resolverConflicto,
    fotoConfirmarEliminar,
    setFotoConfirmarEliminar,
    confirmarQuitarFoto,
  } = hook;

  const esSoloLectura = propSoloLectura || hookSoloLectura;

  // En pantallas >= 992px se bloquea el scroll del body y se ajusta el layout para que el scroll sea exclusivamente interno
  useEffect(() => {
    const checkDesktop = () => window.innerWidth >= 992;
    const applyLayout = () => {
      if (checkDesktop()) {
        document.body.style.overflow = "hidden";
        const main = document.querySelector(".app-main-content") as HTMLElement | null;
        if (main) {
          main.style.height = "calc(100vh - 56px)";
          main.style.overflow = "hidden";
          main.style.paddingTop = "14px";
          main.style.paddingBottom = "0px";
          main.style.display = "flex";
          main.style.flexDirection = "column";
        }
      } else {
        document.body.style.overflow = "";
        const main = document.querySelector(".app-main-content") as HTMLElement | null;
        if (main) {
          main.style.height = "";
          main.style.overflow = "";
          main.style.paddingTop = "";
          main.style.paddingBottom = "";
          main.style.display = "";
          main.style.flexDirection = "";
        }
      }
    };

    applyLayout();
    window.addEventListener("resize", applyLayout);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("resize", applyLayout);
      const main = document.querySelector(".app-main-content") as HTMLElement | null;
      if (main) {
        main.style.height = "";
        main.style.overflow = "";
        main.style.paddingTop = "";
        main.style.paddingBottom = "";
        main.style.display = "";
        main.style.flexDirection = "";
      }
    };
  }, []);

  const totalAnexosMarcados = useMemo(() => {
    if (!expediente) return 0;
    const cat = expediente.anexosSeleccionados?.length || 0;
    const pers = (expediente.anexosPersonalizados || []).filter((p) => p.aplica).length;
    return cat + pers;
  }, [expediente]);

  const listaIndice: InfoSeccionIndice[] = useMemo(() => {
    return CONFIG_SECCIONES.map((cfg, idx) => ({
      id: cfg.id,
      indice: idx,
      nombre: cfg.nombre,
      icono: cfg.icono,
      porcentaje: porcentajesSecciones[idx] || 0,
      conteoAnexos: idx === 9 ? totalAnexosMarcados : undefined,
    }));
  }, [porcentajesSecciones, totalAnexosMarcados]);

  // Scrollspy: escucha scroll en contentColRef (desktop) o window (< 992px)
  const { seccionActiva, scrollToSeccion } = usePipcScrollSpy(
    contentColRef,
    IDS_SECCIONES,
    cargando
  );

  const mostrarBotonArriba = seccionActiva >= 2;

  // Manejo de scroll hacia una sección o pendiente usando scrollToSeccion del hook
  const handleScrollASeccion = useCallback(
    (indice: number | string) => {
      scrollToSeccion(indice);
    },
    [scrollToSeccion]
  );

  const handleScrollArriba = useCallback(() => {
    scrollToSeccion(0);
  }, [scrollToSeccion]);

  // Iniciar checklist en servicio que tiene entregable pero aún no fue iniciado (§5.1)
  const handleIniciarChecklist = async () => {
    if (!idReal) return;
    setIniciandoExpediente(true);
    try {
      await PipcService.iniciarChecklist(idReal);
      toast.success("Checklist PIPC iniciado exitosamente");
      reintentarCarga();
    } catch (err: any) {
      toast.error(extraerMensajeError(err, "No se pudo iniciar el checklist PIPC"));
    } finally {
      setIniciandoExpediente(false);
    }
  };

  // ESTADOS DE CARGA Y EXCEPCIONES
  if (cargando) {
    return (
      <div style={{ padding: "60px 20px", textAlign: "center" }}>
        <div
          className="spinner-border text-primary"
          role="status"
          style={{ width: "36px", height: "36px", borderWidth: "3px", color: "#2B8FCC" }}
        >
          <span className="visually-hidden">Cargando...</span>
        </div>
        <p style={{ fontSize: "13px", color: "#64748b", marginTop: "12px" }}>
          Cargando checklist PIPC...
        </p>
      </div>
    );
  }

  if (servicioSinChecklist) {
    return (
      <div style={{ padding: "60px 20px", textAlign: "center", maxWidth: "480px", margin: "0 auto" }}>
        <div style={{ color: "#94a3b8", fontSize: "36px", marginBottom: "12px" }}>
          <i className="bi bi-file-earmark-x" />
        </div>
        <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#1e293b", marginBottom: "6px" }}>
          Este servicio no tiene checklist PIPC
        </h3>
        <p style={{ fontSize: "13px", color: "#64748b", marginBottom: "20px" }}>
          El servicio #{idReal} no cuenta con el entregable de Plan de contingencias o no está registrado en el sistema.
        </p>
        <Link href="/programacion" className="btn btn-outline-primary btn-sm">
          <i className="bi bi-arrow-left me-1" />
          Volver a Programación
        </Link>
      </div>
    );
  }

  if (servicioPuedeIniciar) {
    return (
      <div style={{ padding: "60px 20px", textAlign: "center", maxWidth: "480px", margin: "0 auto" }}>
        <div style={{ color: "#2B8FCC", fontSize: "40px", marginBottom: "12px" }}>
          <i className="bi bi-clipboard2-plus" />
        </div>
        <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#1e293b", marginBottom: "6px" }}>
          Checklist PIPC sin iniciar
        </h3>
        <p style={{ fontSize: "13px", color: "#64748b", marginBottom: "20px" }}>
          El servicio cuenta con Plan de contingencias pero aún no tiene un expediente iniciado.
        </p>
        <button
          type="button"
          className="btn btn-primary"
          onClick={handleIniciarChecklist}
          disabled={iniciandoExpediente}
          style={{ backgroundColor: "#2B8FCC", borderColor: "#2B8FCC", padding: "8px 20px" }}
        >
          {iniciandoExpediente ? (
            <>
              <span className="spinner-border spinner-border-sm me-2" role="status" />
              Iniciando checklist…
            </>
          ) : (
            <>
              <i className="bi bi-play-fill me-1" />
              Iniciar checklist
            </>
          )}
        </button>
      </div>
    );
  }

  if (errorCarga || !expediente) {
    return (
      <div style={{ padding: "50px 20px", textAlign: "center", maxWidth: "480px", margin: "0 auto" }}>
        <div style={{ color: "#dc2626", fontSize: "36px", marginBottom: "12px" }}>
          <i className="bi bi-exclamation-circle" />
        </div>
        <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#1e293b", marginBottom: "6px" }}>
          Error al cargar expediente
        </h3>
        <p style={{ fontSize: "13px", color: "#64748b", marginBottom: "20px" }}>
          {errorCarga || "No se pudo recuperar la información del checklist desde el servidor."}
        </p>
        <button
          type="button"
          className="btn btn-outline-primary btn-sm"
          onClick={reintentarCarga}
        >
          <i className="bi bi-arrow-clockwise me-1" />
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="expediente-page-wrapper">
      {/* Encabezado fijo superior */}
      <div className="expediente-header-fijo">
        <EncabezadoExpediente
          nombreComercial={expediente.form.empresa_nombre}
          planta={resumen?.v_Planta || expediente.v_Planta}
          consultor={expediente.form.consultor_responsable || expediente.v_Consultor}
          servicioId={expediente.i_CveServAgendaDet}
          estado={expediente.form.expediente_estado}
          soloLectura={esSoloLectura}
          guardandoEstado={guardandoEstado}
          ultimaHoraGuardado={ultimaHoraGuardado}
          onReintentarGuardado={reintentarGuardado}
          avanceGlobal={avanceGlobal}
          d_FechaFin={resumen?.d_FechaFin ?? null}
          v_Estado={resumen?.v_Estado ?? (expediente?.form?.expediente_estado as any) ?? null}
          pendientesAltaCount={pendientesAlta.length}
          onScrollAExportar={() => handleScrollASeccion(10)}
          moduloOrigen={moduloOrigen}
        />

        {/* Aviso de solo lectura (§5.5) */}
        {esSoloLectura && (
          <div
            style={{
              backgroundColor: "#fffbeb",
              border: "1px solid #fde68a",
              borderRadius: "8px",
              padding: "10px 16px",
              marginBottom: "16px",
              display: "flex",
              alignItems: "center",
              gap: "10px",
              color: "#92400e",
              fontSize: "12px",
              fontWeight: 500,
            }}
          >
            <i className="bi bi-exclamation-triangle-fill" style={{ fontSize: "16px", color: "#d97706" }} />
            <span>Servicio cancelado: el checklist es solo de consulta.</span>
          </div>
        )}
      </div>

      {/* Contenedor Flex de Dos Columnas: Izquierda fija + Derecha con scroll propio */}
      <div className="expediente-body-columns">
        {/* Columna Izquierda: Índice Lateral */}
        <aside className="expediente-sidebar">
          <IndiceLateral
            secciones={listaIndice}
            seccionActiva={seccionActiva}
            avanceGlobal={avanceGlobal}
            diasProyecto={diasProyecto}
            pendientesAltaCount={pendientesAlta.length}
            onSelectSeccion={handleScrollASeccion}
            onScrollAExportar={() => handleScrollASeccion(10)}
            d_FechaFin={resumen?.d_FechaFin ?? null}
            v_Estado={resumen?.v_Estado ?? (expediente?.form?.expediente_estado as any) ?? null}
          />
        </aside>

        {/* Columna Derecha: Las 11 Secciones Apiladas */}
        <main ref={contentColRef} className="expediente-content">
          {/* 1. DATOS GENERALES */}
          <section id="seccion-0" className="seccion-bloque">
            <BandaSeccionHeader
              numero={1}
              nombre={CONFIG_SECCIONES[0].nombre}
              subtitulo={CONFIG_SECCIONES[0].subtitulo}
              icono={CONFIG_SECCIONES[0].icono}
              activa={seccionActiva === 0}
              badge={<BadgeSemaforo porcentaje={porcentajesSecciones[0] || 0} />}
            />
            <div className="seccion-body">
              <SeccionGenerales
                expediente={expediente}
                setFormField={hook.setFormField}
                setPlanTipoYMunicipio={hook.setPlanTipoYMunicipio}
                setTurnosAdmin={hook.setTurnosAdmin}
                setTurnosOperativo={hook.setTurnosOperativo}
                agregarFoto={hook.agregarFoto}
                quitarFoto={hook.quitarFoto}
                soloLectura={esSoloLectura}
              />
            </div>
          </section>

          {/* Separador */}
          <div className="seccion-separador" aria-hidden="true">
            <div className="seccion-linea-divisoria" />
          </div>

          {/* 2. INMUEBLE */}
          <section id="seccion-1" className="seccion-bloque">
            <BandaSeccionHeader
              numero={2}
              nombre={CONFIG_SECCIONES[1].nombre}
              subtitulo={CONFIG_SECCIONES[1].subtitulo}
              icono={CONFIG_SECCIONES[1].icono}
              activa={seccionActiva === 1}
              badge={<BadgeSemaforo porcentaje={porcentajesSecciones[1] || 0} />}
            />
            <div className="seccion-body">
              <SeccionInmueble
                expediente={expediente}
                setFormField={hook.setFormField}
                agregarFoto={hook.agregarFoto}
                quitarFoto={hook.quitarFoto}
                soloLectura={esSoloLectura}
              />
            </div>
          </section>

          {/* Separador */}
          <div className="seccion-separador" aria-hidden="true">
            <div className="seccion-linea-divisoria" />
          </div>

          {/* 3. ORGANIZACIÓN UIPC */}
          <section id="seccion-2" className="seccion-bloque">
            <BandaSeccionHeader
              numero={3}
              nombre={CONFIG_SECCIONES[2].nombre}
              subtitulo={CONFIG_SECCIONES[2].subtitulo}
              icono={CONFIG_SECCIONES[2].icono}
              activa={seccionActiva === 2}
              badge={<BadgeSemaforo porcentaje={porcentajesSecciones[2] || 0} />}
            />
            <div className="seccion-body">
              <SeccionOrganizacion
                expediente={expediente}
                setUiriNombre={hook.setUiriNombre}
                setUipcData={hook.setUipcData}
                setCalendarioActividades={hook.setCalendarioActividades}
                setBrigadistas={hook.setBrigadistas}
                aplicarImportBrigadistas={hook.aplicarImportBrigadistas}
                agregarFoto={hook.agregarFoto}
                quitarFoto={hook.quitarFoto}
                soloLectura={esSoloLectura}
              />
            </div>
          </section>

          {/* Separador */}
          <div className="seccion-separador" aria-hidden="true">
            <div className="seccion-linea-divisoria" />
          </div>

          {/* 4. DIRECTORIOS */}
          <section id="seccion-3" className="seccion-bloque">
            <BandaSeccionHeader
              numero={4}
              nombre={CONFIG_SECCIONES[3].nombre}
              subtitulo={CONFIG_SECCIONES[3].subtitulo}
              icono={CONFIG_SECCIONES[3].icono}
              activa={seccionActiva === 3}
              badge={<BadgeSemaforo porcentaje={porcentajesSecciones[3] || 0} />}
            />
            <div className="seccion-body">
              <SeccionDirectorios
                expediente={expediente}
                setMunicipioEmergencias={hook.setMunicipioEmergencias}
                setDependenciasEmergencia={hook.setDependenciasEmergencia}
                setProveedoresEmergencia={hook.setProveedoresEmergencia}
                setVecinosEmergencia={hook.setVecinosEmergencia}
                setFormField={hook.setFormField}
                agregarFoto={hook.agregarFoto}
                quitarFoto={hook.quitarFoto}
                soloLectura={esSoloLectura}
              />
            </div>
          </section>

          {/* Separador */}
          <div className="seccion-separador" aria-hidden="true">
            <div className="seccion-linea-divisoria" />
          </div>

          {/* 5. INVENTARIOS */}
          <section id="seccion-4" className="seccion-bloque">
            <BandaSeccionHeader
              numero={5}
              nombre={CONFIG_SECCIONES[4].nombre}
              subtitulo={CONFIG_SECCIONES[4].subtitulo}
              icono={CONFIG_SECCIONES[4].icono}
              activa={seccionActiva === 4}
              badge={<BadgeSemaforo porcentaje={porcentajesSecciones[4] || 0} />}
            />
            <div className="seccion-body">
              <SeccionInventarios
                expediente={expediente}
                setPoblacionFija={hook.setPoblacionFija}
                setPoblacionFlotante={hook.setPoblacionFlotante}
                setAreasInmueble={hook.setAreasInmueble}
                setEquiposEmergencia={hook.setEquiposEmergencia}
                setEquiposAltoRiesgo={hook.setEquiposAltoRiesgo}
                setProgramaEquiposEmergencia={hook.setProgramaEquiposEmergencia}
                setProgramaEquiposAltoRiesgo={hook.setProgramaEquiposAltoRiesgo}
                agregarFoto={hook.agregarFoto}
                quitarFoto={hook.quitarFoto}
                soloLectura={esSoloLectura}
              />
            </div>
          </section>

          {/* Separador */}
          <div className="seccion-separador" aria-hidden="true">
            <div className="seccion-linea-divisoria" />
          </div>

          {/* 6. ATLAS DE RIESGOS */}
          <section id="seccion-5" className="seccion-bloque">
            <BandaSeccionHeader
              numero={6}
              nombre={CONFIG_SECCIONES[5].nombre}
              subtitulo={CONFIG_SECCIONES[5].subtitulo}
              icono={CONFIG_SECCIONES[5].icono}
              activa={seccionActiva === 5}
              badge={<BadgeSemaforo porcentaje={porcentajesSecciones[5] || 0} />}
            />
            <div className="seccion-body">
              <SeccionAtlas
                expediente={expediente}
                agregarFoto={hook.agregarFoto}
                quitarFoto={hook.quitarFoto}
                soloLectura={esSoloLectura}
              />
            </div>
          </section>

          {/* Separador */}
          <div className="seccion-separador" aria-hidden="true">
            <div className="seccion-linea-divisoria" />
          </div>

          {/* 7. RIESGOS */}
          <section id="seccion-6" className="seccion-bloque">
            <BandaSeccionHeader
              numero={7}
              nombre={CONFIG_SECCIONES[6].nombre}
              subtitulo={CONFIG_SECCIONES[6].subtitulo}
              icono={CONFIG_SECCIONES[6].icono}
              activa={seccionActiva === 6}
              badge={<BadgeSemaforo porcentaje={porcentajesSecciones[6] || 0} />}
            />
            <div className="seccion-body">
              <SeccionRiesgos
                expediente={expediente}
                setAgente={hook.setAgente}
                setFormField={hook.setFormField}
                agregarFoto={hook.agregarFoto}
                quitarFoto={hook.quitarFoto}
                soloLectura={esSoloLectura}
              />
            </div>
          </section>

          {/* Separador */}
          <div className="seccion-separador" aria-hidden="true">
            <div className="seccion-linea-divisoria" />
          </div>

          {/* 8. MANTENIMIENTO */}
          <section id="seccion-7" className="seccion-bloque">
            <BandaSeccionHeader
              numero={8}
              nombre={CONFIG_SECCIONES[7].nombre}
              subtitulo={CONFIG_SECCIONES[7].subtitulo}
              icono={CONFIG_SECCIONES[7].icono}
              activa={seccionActiva === 7}
              badge={<BadgeSemaforo porcentaje={porcentajesSecciones[7] || 0} />}
            />
            <div className="seccion-body">
              <SeccionMantenimiento
                expediente={expediente}
                setFormField={hook.setFormField}
                setMantCalendarioEdificio={hook.setMantCalendarioEdificio}
                setMantCalendarioGeneral={hook.setMantCalendarioGeneral}
                agregarFoto={hook.agregarFoto}
                quitarFoto={hook.quitarFoto}
                soloLectura={esSoloLectura}
              />
            </div>
          </section>

          {/* Separador */}
          <div className="seccion-separador" aria-hidden="true">
            <div className="seccion-linea-divisoria" />
          </div>

          {/* 9. SEGURIDAD Y MEDIDAS */}
          <section id="seccion-8" className="seccion-bloque">
            <BandaSeccionHeader
              numero={9}
              nombre={CONFIG_SECCIONES[8].nombre}
              subtitulo={CONFIG_SECCIONES[8].subtitulo}
              icono={CONFIG_SECCIONES[8].icono}
              activa={seccionActiva === 8}
              badge={<BadgeSemaforo porcentaje={porcentajesSecciones[8] || 0} />}
            />
            <div className="seccion-body">
              <SeccionSeguridadMedidas
                expediente={expediente}
                setCapacitacion={hook.setCapacitacion}
                setSimulacros={hook.setSimulacros}
                setFormField={hook.setFormField}
                setMaterialesPeligrosos={hook.setMaterialesPeligrosos}
                setRecomendaciones={hook.setRecomendaciones}
                agregarFoto={hook.agregarFoto}
                quitarFoto={hook.quitarFoto}
                soloLectura={esSoloLectura}
              />
            </div>
          </section>

          {/* Separador */}
          <div className="seccion-separador" aria-hidden="true">
            <div className="seccion-linea-divisoria" />
          </div>

          {/* 10. ANEXOS */}
          <section id="seccion-9" className="seccion-bloque">
            <BandaSeccionHeader
              numero={10}
              nombre={CONFIG_SECCIONES[9].nombre}
              subtitulo={CONFIG_SECCIONES[9].subtitulo}
              icono={CONFIG_SECCIONES[9].icono}
              activa={seccionActiva === 9}
              badge={<BadgeSemaforo conteoAnexos={totalAnexosMarcados} />}
            />
            <div className="seccion-body">
              <SeccionAnexos
                expediente={expediente}
                toggleAnexo={hook.toggleAnexo}
                marcarTodosAnexos={hook.marcarTodosAnexos}
                desmarcarTodosAnexos={hook.desmarcarTodosAnexos}
                agregarAnexoPersonalizado={hook.agregarAnexoPersonalizado}
                quitarAnexoPersonalizado={hook.quitarAnexoPersonalizado}
                toggleAnexoPersonalizado={hook.toggleAnexoPersonalizado}
                soloLectura={esSoloLectura}
              />
            </div>
          </section>

          {/* Separador */}
          <div className="seccion-separador" aria-hidden="true">
            <div className="seccion-linea-divisoria" />
          </div>

          {/* 11. EXPORTAR */}
          <section id="seccion-10" className="seccion-bloque">
            <BandaSeccionHeader
              numero={11}
              nombre={CONFIG_SECCIONES[10].nombre}
              subtitulo={CONFIG_SECCIONES[10].subtitulo}
              icono={CONFIG_SECCIONES[10].icono}
              activa={seccionActiva === 10}
            />
            <div className="seccion-body">
              <SeccionExportar
                expediente={expediente}
                pendientes={pendientes}
                pendientesAlta={pendientesAlta}
                setFormField={hook.setFormField}
                onScrollASeccion={handleScrollASeccion}
                soloLectura={esSoloLectura}
                forzarGuardadoPendiente={forzarGuardadoPendiente}
              />
            </div>
          </section>
        </main>
      </div>

      {/* Botón Flotante "↑ Arriba" */}
      {mostrarBotonArriba && (
        <button
          type="button"
          onClick={handleScrollArriba}
          className="btn-flotante-arriba"
          title="Volver arriba del expediente"
        >
          <i className="bi bi-arrow-up" />
          <span>Arriba</span>
        </button>
      )}

      {/* Modal de conflicto 409 (§5.4) */}
      {conflictoModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px",
          }}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: "10px",
              maxWidth: "480px",
              width: "100%",
              padding: "24px",
              boxShadow: "0 10px 25px rgba(0,0,0,0.25)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px", color: "#d97706", marginBottom: "14px" }}>
              <i className="bi bi-exclamation-triangle-fill" style={{ fontSize: "24px" }} />
              <h4 style={{ margin: 0, fontSize: "15px", fontWeight: 700, color: "#1e293b" }}>
                Conflicto al guardar sección
              </h4>
            </div>

            <p style={{ fontSize: "13px", color: "#475569", lineHeight: 1.5, marginBottom: "20px" }}>
              Otra persona guardó la sección <strong>{conflictoModal.nombreSeccion}</strong> mientras la editabas.
            </p>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button
                type="button"
                className="btn btn-outline-secondary btn-sm"
                onClick={() => resolverConflicto("servidor")}
              >
                Cargar sus cambios
              </button>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => resolverConflicto("local")}
                style={{ backgroundColor: "#2B8FCC", borderColor: "#2B8FCC" }}
              >
                Conservar los míos
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmación para eliminar foto (§6.2) */}
      {fotoConfirmarEliminar && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            background: "rgba(0,0,0,0.45)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px",
          }}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: "10px",
              maxWidth: "420px",
              width: "100%",
              padding: "20px",
              boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px", color: "#dc2626", marginBottom: "12px" }}>
              <i className="bi bi-trash3-fill" style={{ fontSize: "20px" }} />
              <h4 style={{ margin: 0, fontSize: "15px", fontWeight: 700, color: "#1e293b" }}>
                ¿Quitar esta foto?
              </h4>
            </div>

            <p style={{ fontSize: "13px", color: "#475569", lineHeight: 1.5, marginBottom: "20px" }}>
              ¿Estás seguro de que deseas eliminar {fotoConfirmarEliminar.nombreFoto ? `"${fotoConfirmarEliminar.nombreFoto}"` : "esta foto"}? Esta acción no se puede deshacer.
            </p>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setFotoConfirmarEliminar(null)}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn btn-danger btn-sm"
                onClick={confirmarQuitarFoto}
              >
                Quitar
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @media (min-width: 992px) {
          :global(body:has(.expediente-page-wrapper)) {
            overflow: hidden !important;
          }
          :global(.app-main-content:has(.expediente-page-wrapper)) {
            height: calc(100vh - 56px) !important;
            overflow: hidden !important;
            padding-top: 14px !important;
            padding-bottom: 0px !important;
            display: flex !important;
            flex-direction: column !important;
          }
          .expediente-page-wrapper {
            height: calc(100vh - 56px - 14px);
            max-height: calc(100vh - 56px - 14px);
            display: flex;
            flex-direction: column;
            overflow: hidden;
            position: relative;
            width: 100%;
          }
          .expediente-header-fijo {
            flex-shrink: 0;
          }
          .expediente-body-columns {
            display: flex;
            flex: 1;
            min-height: 0;
            gap: 20px;
            overflow: hidden;
            width: 100%;
          }
          .expediente-sidebar {
            width: 260px;
            height: auto;
            flex-shrink: 0;
            display: flex;
            flex-direction: column;
          }
          .expediente-content {
            flex: 1;
            min-width: 0;
            height: 100%;
            overflow-y: auto;
            padding-right: 14px;
            display: flex;
            flex-direction: column;
            position: relative;
          }
          .expediente-content::-webkit-scrollbar {
            width: 6px;
          }
          .expediente-content::-webkit-scrollbar-thumb {
            background: #cbd5e1;
            border-radius: 4px;
          }
          .expediente-content::-webkit-scrollbar-thumb:hover {
            background: #94a3b8;
          }
          .seccion-banda-header {
            position: sticky;
            top: 0;
            z-index: 10;
          }
        }

        .seccion-bloque {
          display: flex;
          flex-direction: column;
          gap: 16px;
          width: 100%;
          scroll-margin-top: 0;
        }
        .seccion-body {
          display: flex;
          flex-direction: column;
          gap: 16px;
          width: 100%;
        }

        /* Banda de encabezado de sección (§2) */
        .seccion-banda-header {
          background-color: #EAF4FB;
          border: 1px solid #D6E4EF;
          border-top: 4px solid #2B8FCC;
          border-radius: 8px 8px 0 0;
          padding: 14px 20px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.04);
          transition: border-top-color 0.2s ease;
          width: 100%;
        }
        .seccion-banda-header.activa {
          border-top-color: #1F6E9E;
        }
        .seccion-icono-circulo {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background-color: #2B8FCC;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          color: #ffffff;
          font-size: 18px;
        }
        .seccion-banda-titulo {
          font-size: 18px;
          font-weight: 700;
          color: #1e293b;
          margin: 0;
          line-height: 1.25;
        }
        .seccion-banda-subtitulo {
          font-size: 13px;
          color: #64748b;
          margin: 2px 0 0 0;
          line-height: 1.3;
        }

        /* Separación de 48px con línea divisoria de 1px a la mitad (§2) */
        .seccion-separador {
          height: 48px;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          flex-shrink: 0;
        }
        .seccion-linea-divisoria {
          width: 100%;
          height: 1px;
          background-color: #D6E4EF;
          border: none;
          margin: 0;
        }

        /* Botón flotante "↑ Arriba" */
        .btn-flotante-arriba {
          position: fixed;
          bottom: 24px;
          right: 24px;
          z-index: 100;
          background-color: #2b8fcc;
          color: #ffffff;
          border: none;
          border-radius: 24px;
          padding: 8px 16px;
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          font-weight: 600;
          box-shadow: 0 4px 12px rgba(43, 143, 204, 0.35);
          cursor: pointer;
          transition: transform 0.15s ease, background-color 0.15s ease;
        }
        .btn-flotante-arriba:hover {
          background-color: #2074a8;
          transform: translateY(-2px);
        }

        @media (max-width: 991px) {
          .expediente-page-wrapper {
            height: auto;
            max-height: none;
            overflow: visible;
          }
          .expediente-header-fijo {
            margin-bottom: 12px;
          }
          .expediente-body-columns {
            display: flex;
            flex-direction: column;
            overflow: visible;
            gap: 16px;
            width: 100%;
          }
          .expediente-sidebar {
            width: 100%;
            height: auto;
          }
          .expediente-content {
            width: 100%;
            overflow-y: visible;
            height: auto;
            padding-right: 0;
          }
          .seccion-banda-header {
            position: static;
          }
        }
      `}</style>
    </div>
  );
};
