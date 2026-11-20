import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import type { AsistenciaRegistro, AsistenciaSesion } from "@/types/asistencia";

interface AsistenciaDBSchema extends DBSchema {
  sesiones: {
    key: number;
    value: AsistenciaSesion;
  };
  cola: {
    key: string;
    value: AsistenciaRegistro;
  };
  meta: {
    key: string;
    value: string;
  };
}

const DB_NAME = "asistencia-gi";
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<AsistenciaDBSchema>> | null = null;

function getDB(): Promise<IDBPDatabase<AsistenciaDBSchema>> {
  if (!dbPromise) {
    dbPromise = openDB<AsistenciaDBSchema>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains("sesiones")) {
          db.createObjectStore("sesiones", { keyPath: "i_CveAgendaDetalle" });
        }
        if (!db.objectStoreNames.contains("cola")) {
          db.createObjectStore("cola");
        }
        if (!db.objectStoreNames.contains("meta")) {
          db.createObjectStore("meta");
        }
      },
    });
  }
  return dbPromise;
}

export function claveCola(
  i_CveAlumnoAgenda: number,
  i_CveAgendaDetalle: number
): string {
  return `${i_CveAlumnoAgenda}-${i_CveAgendaDetalle}`;
}

export async function obtenerTodasSesiones(): Promise<AsistenciaSesion[]> {
  const db = await getDB();
  return db.getAll("sesiones");
}

/**
 * Reemplaza únicamente las sesiones cuyas fechas (YYYY-MM-DD) caen dentro de [fechaInicio, fechaFin].
 * La cola nunca se borra por una descarga.
 */
export async function reemplazarSesionesRango(
  fechaInicio: string,
  fechaFin: string,
  nuevas: AsistenciaSesion[]
): Promise<void> {
  const db = await getDB();
  const tx = db.transaction("sesiones", "readwrite");
  const store = tx.objectStore("sesiones");
  const existentes = await store.getAll();

  for (const s of existentes) {
    const fechaDia = (s.d_FechaHoraInicio || "").slice(0, 10);
    if (fechaDia >= fechaInicio && fechaDia <= fechaFin) {
      await store.delete(s.i_CveAgendaDetalle);
    }
  }

  for (const s of nuevas) {
    await store.put(s);
  }

  await tx.done;
}

export async function obtenerCola(): Promise<AsistenciaRegistro[]> {
  const db = await getDB();
  return db.getAll("cola");
}

export async function guardarEnCola(registro: AsistenciaRegistro): Promise<void> {
  const db = await getDB();
  const key = claveCola(registro.i_CveAlumnoAgenda, registro.i_CveAgendaDetalle);
  await db.put("cola", registro, key);
}

export async function guardarVariosEnCola(
  registros: AsistenciaRegistro[]
): Promise<void> {
  if (registros.length === 0) return;
  const db = await getDB();
  const tx = db.transaction("cola", "readwrite");
  const store = tx.objectStore("cola");
  for (const registro of registros) {
    const key = claveCola(registro.i_CveAlumnoAgenda, registro.i_CveAgendaDetalle);
    await store.put(registro, key);
  }
  await tx.done;
}

/**
 * Elimina de la cola los registros ya procesados (OK o RECHAZADO).
 * Respeta cambios más recientes si el usuario volvió a tocar mientras se enviaba.
 */
export async function eliminarDeColaSincronizados(
  registrosEnviados: AsistenciaRegistro[]
): Promise<void> {
  if (registrosEnviados.length === 0) return;
  const db = await getDB();
  const tx = db.transaction("cola", "readwrite");
  const store = tx.objectStore("cola");

  for (const reg of registrosEnviados) {
    const key = claveCola(reg.i_CveAlumnoAgenda, reg.i_CveAgendaDetalle);
    const actual = await store.get(key);
    if (actual && actual.d_FechaCaptura <= reg.d_FechaCaptura) {
      await store.delete(key);
    }
  }

  await tx.done;
}

export async function obtenerUltimaDescarga(): Promise<string | null> {
  const db = await getDB();
  const val = await db.get("meta", "ultimaDescarga");
  return val ?? null;
}

export async function guardarUltimaDescarga(fechaLocal: string): Promise<void> {
  const db = await getDB();
  await db.put("meta", fechaLocal, "ultimaDescarga");
}
