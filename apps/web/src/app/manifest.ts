import type { MetadataRoute } from "next";

// Served by Next at /manifest.webmanifest. No PWA library involved: the App
// Router generates the manifest from this typed module.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Colheita",
    short_name: "Colheita",
    description:
      "Cinco minutos por dia para cuidar do seu dinheiro e do seu bem-estar.",
    lang: "pt-BR",
    dir: "ltr",
    start_url: "/",
    scope: "/",
    // The acceptance criteria for issue #12: opens without the browser bar.
    display: "standalone",
    // Portrait only: the journey targets a 390px factory-floor phone held in
    // one hand.
    orientation: "portrait",
    // Mirrors --background and --primary from src/styles/globals.css so the
    // splash screen and the Android status bar match the app.
    background_color: "#ffffff",
    theme_color: "#ffffff",
    categories: ["health", "finance", "education"],
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      // Android crops icons into a circle or squircle. Without a maskable
      // variant the icon gets a white frame or is cropped through the artwork.
      {
        src: "/icons/maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
