import { createSerwistRoute } from "@serwist/turbopack";
import crypto from "node:crypto";

const buildRevision = crypto.randomUUID();

export const { dynamic, dynamicParams, revalidate, generateStaticParams, GET } =
  createSerwistRoute({
    additionalPrecacheEntries: [
      { url: "/asistencia", revision: buildRevision },
      { url: "/offline", revision: buildRevision },
    ],
    swSrc: "src/app/sw.ts",
    useNativeEsbuild: true,
  });
