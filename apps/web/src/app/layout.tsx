import type { Metadata, Viewport } from "next";
import { ServiceWorkerRegistration } from "@/components/pwa/service-worker-registration";
import { Toaster } from "@/components/layout/toaster";
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
  // Um por esquema: a barra de status acompanha o tema em vez de emoldurar o
  // app com a cor do outro.
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0c1608" },
  ],
  width: "device-width",
  initialScale: 1,
  // The journey has to survive a user who enlarges text: zoom stays available.
  maximumScale: 5,
  userScalable: true,
  // Sem isto, o app instalado num celular com entalhe desenha por baixo do
  // notch e da barra inferior. O AppShell compensa com env(safe-area-inset-*).
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    // O script de tema abaixo põe a classe (light/dark) no <html> antes da
    // hidratação, de propósito, para não piscar a cor. Isso faz o atributo
    // divergir do HTML do servidor (que não conhece o tema): suppressHydration
    // silencia só o aviso deste elemento, não dos filhos.
    <html lang="pt-BR" suppressHydrationWarning>
      <body>
        {/* Aplica o tema guardado antes da primeira pintura. Sem isto a tela
            nasce clara e pisca para escura em quem escolheu escuro. */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "try{var t=localStorage.getItem('colheita_theme');if(t==='dark'||t==='light'){document.documentElement.classList.add(t)}}catch(e){}",
          }}
        />
        {children}
        <Toaster />
        <ServiceWorkerRegistration />
      </body>
    </html>
  );
}
