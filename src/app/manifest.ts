import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Asistencia GOODiDEA",
    short_name: "Asistencia",
    description: "Control de asistencia por sesión para capacitaciones de GOODiDEA.",
    start_url: "/asistencia",
    display: "standalone",
    theme_color: "#2B8FCC",
    background_color: "#ffffff",
    icons: [
      {
        src: "/icons/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
