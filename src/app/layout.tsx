import type { Metadata, Viewport } from "next";
import { Roboto, Roboto_Mono } from "next/font/google";
import "bootstrap-icons/font/bootstrap-icons.css";
import "./globals.css";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { SerwistProvider } from "@serwist/turbopack/react";

const roboto = Roboto({
  weight: ["400", "500", "700"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-roboto-sans",
});

const robotoMono = Roboto_Mono({
  weight: ["400", "500"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-roboto-mono",
});

export const metadata: Metadata = {
  title: "GOODiDEA panel",
  description: "Plataforma de gestión de calendario, servicios agendados, catálogo de servicios y clientes de GOODiDEA.",
  icons: {
    icon: "/favicon.ico",
    apple: "/icons/icon-512x512.png",
  },
  appleWebApp: {
    capable: true,
    title: "Asistencia",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  themeColor: "#2B8FCC",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${roboto.variable} ${robotoMono.variable}`}>
      <body className={`${roboto.className} ${roboto.variable}`}>
        <SerwistProvider
          swUrl="/serwist/sw.js"
          disable={process.env.NODE_ENV === "development"}
          cacheOnNavigation={false}
          reloadOnOnline={false}
        >
          <AuthGuard>{children}</AuthGuard>
        </SerwistProvider>
      </body>
    </html>
  );
}
