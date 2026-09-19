import type { Metadata, Viewport } from "next";
import { ServiceWorkerRegistration } from "@/components/pwa/service-worker-registration";
import "@/styles/globals.css";

export const metadata: Metadata = {
  title: "Colheita",
  description:
    "Cinco minutos por dia para cuidar do seu dinheiro e do seu bem-estar.",
  applicationName: "Colheita",
  // Standalone iOS support is partial, but this is what Safari reads to open
  // from the home screen without its own chrome.
  appleWebApp: {
    capable: true,
    title: "Colheita",
    statusBarStyle: "black-translucent",
  },
  // The app is behind a login and collects sensitive self-reports. Keeping it
  // out of search indexes costs nothing here.
  robots: { index: false, follow: false },
};

// themeColor and viewport belong to this export, not to metadata.
export const viewport: Viewport = {
  // Matches --background in globals.css so the Android status bar blends with
  // the app instead of framing it.
  themeColor: "#07100f",
  width: "device-width",
  initialScale: 1,
  // The journey has to survive a user who enlarges text: zoom stays available.
  maximumScale: 5,
  userScalable: true,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>
        {children}
        <ServiceWorkerRegistration />
      </body>
    </html>
  );
}
