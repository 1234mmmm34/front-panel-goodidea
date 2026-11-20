/// <reference lib="webworker" />
import { defaultCache } from "@serwist/turbopack/worker";
import type { PrecacheEntry, RuntimeCaching, SerwistGlobalConfig } from "serwist";
import { NetworkFirst, NetworkOnly, Serwist } from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

const asistenciaRuntimeCaching: RuntimeCaching[] = [
  // Nunca cachear llamadas a la API: los datos viven en IndexedDB
  {
    matcher: ({ url }) => url.pathname.startsWith("/api-proxy"),
    handler: new NetworkOnly(),
  },
  // Navegaciones a /asistencia*: NetworkFirst con fallback a caché
  {
    matcher: ({ request, url }) =>
      request.mode === "navigate" && url.pathname.startsWith("/asistencia"),
    handler: new NetworkFirst({
      cacheName: "asistencia-pages",
      networkTimeoutSeconds: 5,
    }),
  },
  // Cualquier otra navegación: NetworkOnly (si falla, fallback a /offline)
  {
    matcher: ({ request, url }) =>
      request.mode === "navigate" &&
      !url.pathname.startsWith("/asistencia") &&
      url.pathname !== "/offline",
    handler: new NetworkOnly(),
  },
  ...defaultCache,
];

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: false,
  runtimeCaching: asistenciaRuntimeCaching,
  fallbacks: {
    entries: [
      {
        url: "/offline",
        matcher({ request }) {
          if (request.destination !== "document") return false;
          const pathname = new URL(request.url).pathname;
          return !pathname.startsWith("/asistencia");
        },
      },
    ],
  },
});

serwist.addEventListeners();
